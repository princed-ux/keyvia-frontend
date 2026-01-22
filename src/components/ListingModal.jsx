import React, { useState, useMemo } from "react";
import { 
  X, Heart, Share2, MapPin, Bed, Bath, Square, Calendar, 
  Check, Mail, ChevronLeft, ChevronRight, PlayCircle, Video, 
  User, Building, Flag, Calculator, Clock, ShieldCheck, Edit, 
  ExternalLink, FileText, Lock, Settings
} from "lucide-react";
import { useNavigate } from "react-router-dom"; // Needed for navigation
import { getCurrencySymbol, formatPrice } from "../utils/format";
import style from "../styles/ListingModal.module.css"; 
import keyviaLogo from "../assets/mainLogo.png"; 
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Swal from 'sweetalert2'; 

import TourRequestModal from "../modals/TourRequestModal";
import ApplicationModal from "../modals/ApplicationModal";
import MessageModal from "../modals/MessageModal";
import AuthModal from "../components/AuthModal"; // ✅ Imported AuthModal

dayjs.extend(relativeTime);

// --- INTERNAL COMPONENT: ROLE WARNING MODAL ---
const RoleWarningModal = ({ onClose }) => {
  const navigate = useNavigate();
  return (
    <div className={style.overlay} onClick={onClose} style={{zIndex: 1100}}>
      <div className={style.modalContainer} style={{maxWidth: '400px', height: 'auto', padding: '30px', textAlign: 'center'}} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className={style.closeIconBtn}><X size={20}/></button>
        <div style={{background: '#FFF4E5', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'}}>
            <User size={30} color="#FF9800"/>
        </div>
        <h2 style={{fontSize: '1.25rem', marginBottom: '10px'}}>Switch to Buyer Profile</h2>
        <p style={{color: '#666', marginBottom: '25px', lineHeight: '1.5'}}>
            To schedule tours, send applications, or message agents, you must be using a <strong>Buyer</strong> profile.
        </p>
        <button 
            onClick={() => window.location.href = '/settings'} // Or navigate('/settings')
            style={{background: '#09707d', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}
        >
            <Settings size={18}/> Go to Settings
        </button>
      </div>
    </div>
  );
};

const ListingModal = ({ listing, onClose, currentUser }) => {
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showMortgage, setShowMortgage] = useState(false);
  
  // Modals State
  const [activeAction, setActiveAction] = useState(null); 
  const [showAuthModal, setShowAuthModal] = useState(false); // ✅ For Guests
  const [showRoleWarning, setShowRoleWarning] = useState(false); // ✅ For Non-Buyers

  // Mortgage State
  const [downPayment, setDownPayment] = useState(20); 
  const [interestRate, setInterestRate] = useState(6.5); 
  const [loanTerm, setLoanTerm] = useState(30); 

  if (!listing) return null;

  // --- OWNERSHIP CHECK ---
  const isOwner = useMemo(() => {
    if (!currentUser) return false;
    const ownerId = listing.agent_unique_id || listing.agent?.unique_id;
    return currentUser.unique_id === ownerId;
  }, [currentUser, listing]);

  // --- 🛡️ CENTRAL ACTION HANDLER (Auth + Role Guard) ---
  const handleActionClick = (actionType) => {
    // 1. Guest Check -> Open AuthModal
    if (!currentUser) {
        setShowAuthModal(true);
        return;
    }

    // 2. Role Check -> Open RoleWarningModal
    // If user is Agent, Landlord, or Admin, they cannot perform buyer actions
    if (currentUser.role !== 'buyer') {
        setShowRoleWarning(true);
        return;
    }

    // 3. Premium Check (Only for Messaging)
    if (actionType === 'message' && !currentUser.is_premium) {
        Swal.fire({
            icon: 'info',
            title: 'Premium Feature',
            text: 'Chatting directly with agents/owners is a Premium feature.',
            confirmButtonText: 'Upgrade Now',
            confirmButtonColor: '#09707d',
            showCancelButton: true,
            cancelButtonText: 'Close'
        }).then((result) => {
            if (result.isConfirmed) window.location.href = '/subscription';
        });
        return;
    }

    // 4. Success -> Open specific modal
    setActiveAction(actionType);
  };

  const agent = listing.agent || {};
  const displayName = agent.name || listing.contact_name || "Property Contact";
  const avatarUrl = agent.avatar || "/person-placeholder.png";
  const displayRole = agent.role === 'agent' ? (agent.agency || "Real Estate Agent") : "Property Owner";
  const isVerified = agent.verification_status === 'verified';
  const isAgentRole = agent.role === 'agent';

  // --- MEDIA PREP ---
  const photos = listing.photos?.map(p => ({ type: 'image', url: typeof p === 'string' ? p : p.url })) || [];
  const allMedia = [...photos];
  if (listing.video_url) allMedia.push({ type: 'video', url: listing.video_url });
  if (listing.virtual_tour_url) allMedia.push({ type: 'tour', url: listing.virtual_tour_url });
  
  const gridPhotos = [...photos];
  while (gridPhotos.length < 5) gridPhotos.push({ type: 'placeholder', url: "/placeholder.png" });
  const remainingPhotos = allMedia.length > 5 ? allMedia.length - 5 : 0;

  // --- PRICE PERIOD FORMATTER ---
  const formatPeriod = (period) => {
      if (!period) return "";
      const p = period.toLowerCase();
      if (p === 'monthly' || p === 'month') return "/month";
      if (p === 'yearly' || p === 'year') return "/year";
      return `/${p}`;
  };

  // --- CALCULATOR ---
  const calculateMortgage = () => {
    const principal = listing.price * (1 - downPayment / 100);
    const monthlyRate = (interestRate / 100) / 12;
    const numberOfPayments = loanTerm * 12;
    if (interestRate === 0) return principal / numberOfPayments;
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    return Math.round(monthlyPayment).toLocaleString();
  };

  const handleProfileClick = () => {
    if (agent.username) window.open(`/profile/@${agent.username}`, '_blank');
  };

  const openGallery = (index = 0) => { setGalleryIndex(index); setShowGallery(true); };
  const nextSlide = (e) => { e.stopPropagation(); setGalleryIndex((prev) => (prev === allMedia.length - 1 ? 0 : prev + 1)); };
  const prevSlide = (e) => { e.stopPropagation(); setGalleryIndex((prev) => (prev === 0 ? allMedia.length - 1 : prev - 1)); };

  if (showGallery) {
    const current = allMedia[galleryIndex];
    return (
        <div className={style.galleryOverlay} onClick={() => setShowGallery(false)}>
            <button className={style.closeGalleryBtn} onClick={() => setShowGallery(false)}><X size={24} /></button>
            <button className={style.navBtnLeft} onClick={prevSlide}><ChevronLeft size={32} /></button>
            <div className={style.galleryContent} onClick={(e) => e.stopPropagation()}>
                {current.type === 'image' && <img src={current.url} alt="Gallery" />}
                {current.type === 'video' && <video controls autoPlay className={style.mediaPlayer}><source src={current.url} type="video/mp4" /></video>}
                {current.type === 'tour' && <div className={style.iframeWrapper}><iframe src={current.url} title="Virtual Tour" frameBorder="0" allowFullScreen></iframe></div>}
                <div className={style.galleryCounter}>{galleryIndex + 1} / {allMedia.length} • {current.type.toUpperCase()}</div>
            </div>
            <button className={style.navBtnRight} onClick={nextSlide}><ChevronRight size={32} /></button>
        </div>
    );
  }

  return (
    <div className={style.overlay} onClick={onClose}>
      <div className={style.modalContainer} onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className={style.topControls}>
            <div className={style.leftNav}><button className={style.backBtn} onClick={onClose}>‹ Back to search</button></div>
            <div className={style.centerLogo}><img src={keyviaLogo} alt="KEYVIA" /></div>
            <div className={style.actionBtns}>
                <button onClick={() => handleActionClick('save')}><Heart size={18} /> <span className={style.btnText}>Save</span></button>
                <button><Share2 size={18} /> <span className={style.btnText}>Share</span></button>
                <button className={style.reportBtn}><Flag size={18} /></button>
                <button onClick={onClose} className={style.closeIconBtn}><X size={20} /></button>
            </div>
        </div>

        <div className={style.scrollableContent}>
            {/* IMAGES */}
            <div className={style.imageGrid}>
              <div className={style.mainImage} onClick={() => openGallery(0)}>
                <img src={gridPhotos[0].url} alt="Main" onError={(e) => e.target.src = "/placeholder.png"} />
                <div className={style.statusBadge}>{listing.listing_type === 'sale' ? 'For Sale' : 'For Rent'}</div>
              </div>
              <div className={style.subImages}>
                {gridPhotos.slice(1, 5).map((photo, index) => (
                    <div key={index} className={style.imageWrapper} onClick={() => openGallery(index + 1)}>
                        <img src={photo.url} alt={`Sub ${index}`} onError={(e) => e.target.src = "/placeholder.png"} />
                        {index === 3 && remainingPhotos > 0 && <div className={style.moreOverlay}>+{remainingPhotos} Photos</div>}
                    </div>
                ))}
              </div>
              <button className={style.seeAllBtn} onClick={() => openGallery(0)}><Square size={16} /> See all {allMedia.length} photos</button>
            </div>

            <div className={style.contentLayout}>
              {/* LEFT COLUMN */}
              <div className={style.leftColumn}>
                <div className={style.header}>
                  <div className={style.headerTop}>
                    <div className={style.titleBlock}>
                        <h1>{listing.title}</h1>
                        <p className={style.addressText}><MapPin size={16} className={style.pinIcon} /> {listing.address}, {listing.city}</p>
                    </div>
                    <div className={style.priceBlock}>
                        {/* ✅ UPDATED PRICE DISPLAY */}
                        <div className={style.priceTag}>
                            {getCurrencySymbol(listing.price_currency)}{formatPrice(listing.price)}
                            {listing.listing_type === 'rent' && <span style={{fontSize:'0.6em', fontWeight:'normal', color:'#555'}}>{formatPeriod(listing.price_period)}</span>}
                        </div>
                        <div className={style.listedDate}><Clock size={12}/> Listed {dayjs(listing.created_at).fromNow()}</div>
                    </div>
                  </div>
                  <div className={style.keyStats}>
                    <div className={style.statBox}><Bed size={20}/><span className={style.statVal}>{listing.bedrooms}</span> Beds</div>
                    <div className={style.statBox}><Bath size={20}/><span className={style.statVal}>{listing.bathrooms}</span> Baths</div>
                    <div className={style.statBox}><Square size={20}/><span className={style.statVal}>{formatPrice(listing.square_footage)}</span> Sqft</div>
                  </div>
                </div>

                <div className={style.sectionDivider}></div>
                <div className={style.section}><h3>About this home</h3><p className={style.descText}>{listing.description || "No description provided."}</p></div>
                <div className={style.sectionDivider}></div>
                <div className={style.section}>
                  <h3>Features & Amenities</h3>
                  <div className={style.featureGrid}>
                    {listing.features && listing.features.length > 0 ? (
                        listing.features.map((f, i) => <span key={i} className={style.featureItem}><Check size={14} color="#09707d"/> {f}</span>)
                    ) : <p className={style.emptyText}>No specific features listed.</p>}
                  </div>
                </div>

                <div className={style.sectionDivider}></div>
                {listing.listing_type === 'sale' && (
                    <div className={style.section}>
                        <div className={style.accordionHeader} onClick={() => setShowMortgage(!showMortgage)}>
                            <h3><Calculator size={18}/> Estimated Monthly Payment</h3>
                            <span className={style.estimateValue}>${calculateMortgage()}/mo</span>
                        </div>
                        {showMortgage && (
                            <div className={style.mortgageCalc}>
                                <div className={style.calcRow}><label>Down Payment (%)</label><input type="number" value={downPayment} onChange={e => setDownPayment(Number(e.target.value))} /></div>
                                <div className={style.calcRow}><label>Interest Rate (%)</label><input type="number" value={interestRate} onChange={e => setInterestRate(Number(e.target.value))} /></div>
                                <div className={style.calcRow}><label>Loan Term (Years)</label><input type="number" value={loanTerm} onChange={e => setLoanTerm(Number(e.target.value))} /></div>
                            </div>
                        )}
                    </div>
                )}
                
                <div className={style.section}>
                  <h3>Location</h3>
                  <div className={style.mapWrapper}>
                    <iframe title="Listing Location" width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen
                      src={`https://maps.google.com/maps?q=${listing.latitude},${listing.longitude}&hl=en&z=14&output=embed`}></iframe>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className={style.rightColumn}>
                <div className={style.stickyCard}>
                  <div className={style.agentHeader} onClick={handleProfileClick} style={{cursor: 'pointer'}}>
                    <div className={style.avatarContainer}>
                        <img src={avatarUrl} alt="Agent" className={style.agentAvatar} />
                        {isVerified && <div className={style.verifiedBadge}><Check size={10} strokeWidth={4} /></div>}
                    </div>
                    <div className={style.agentInfo}>
                      <h4>{displayName}</h4>
                      <p className={style.roleLabel}>{isAgentRole ? <Building size={12} /> : <User size={12} />} {displayRole}</p>
                      <span className={style.viewProfileLink}>View Profile</span>
                    </div>
                  </div>
                  
                  <div className={style.actionArea}>
                    {isOwner ? (
                        <div className={style.ownerPanel}>
                            <div className={style.ownerGreeting}><div className={style.wave}>👋</div><div><h5>This is your listing</h5><p>Manage it from your dashboard</p></div></div>
                            <button className={style.dashboardBtn} onClick={() => window.location.href='/dashboard/listings'}><Edit size={16} /> Manage Listing</button>
                            <button className={style.viewPublicBtn} onClick={() => window.open(`/listing/${listing.product_id}`, '_blank')}><ExternalLink size={16} /> View Public Page</button>
                        </div>
                    ) : (
                        <div className={style.contactForm}>
                            <h5>Interested in this property?</h5>
                            <div className={style.quickActionsVertical}>
                                {/* SCHEDULE TOUR */}
                                <button className={style.tourBtn} onClick={() => handleActionClick('tour')}>
                                    <Calendar size={16} /> Schedule Tour
                                </button>
                                
                                {/* MESSAGE */}
                                <button className={style.messageBtn} onClick={() => handleActionClick('message')}>
                                    <Mail size={16}/> 
                                    {isAgentRole ? "Message Agent" : "Message Owner"}
                                    {(!currentUser || !currentUser.is_premium) && <Lock size={14} style={{marginLeft:'auto', opacity:0.6}}/>}
                                </button>

                                {/* APPLICATION */}
                                <button className={style.applicationBtn} onClick={() => handleActionClick('application')}>
                                    <FileText size={16} /> Start Application
                                </button>
                            </div>
                            <div className={style.phoneRevealBtn}>Show Phone Number</div>
                            <div className={style.safetyBox}><ShieldCheck size={16} className={style.safetyIcon} /><small>Never transfer funds before a physical inspection.</small></div>
                        </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>
      
      {/* --- RENDER ACTIVE MODALS --- */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showRoleWarning && <RoleWarningModal onClose={() => setShowRoleWarning(false)} />}
      
      {activeAction === 'tour' && <TourRequestModal listing={listing} onClose={() => setActiveAction(null)} currentUser={currentUser} />}
      {activeAction === 'application' && <ApplicationModal listing={listing} onClose={() => setActiveAction(null)} currentUser={currentUser} />}
      {activeAction === 'message' && <MessageModal listing={listing} onClose={() => setActiveAction(null)} currentUser={currentUser} />}
    </div>
  );
};

export default ListingModal;