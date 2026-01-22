import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; 
import { useAuth } from "../context/AuthProvider"; 
import axios from "axios";
import { 
  MapPin, CheckCircle, Globe, ShieldCheck, Star, 
  Bed, Bath, Square, X, ChevronLeft, ChevronRight, 
  MessageCircle, ArrowLeft, Building2, Calendar, LayoutGrid, Lock, AlertTriangle, Loader2, User
} from "lucide-react";
import style from "../styles/AgentProfile.module.css";
import AuthModal from "../components/AuthModal"; 
import dayjs from "dayjs";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getFlagEmoji = (countryCode) => {
  if (!countryCode) return "🌍";
  return countryCode.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
};

const AgentProfile = () => {
  const { profileId } = useParams(); 
  const navigate = useNavigate();
  const { user } = useAuth(); 
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Drawer & Lightbox State
  const [selected, setSelected] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [lightboxType, setLightboxType] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        let identifier = profileId;
        if (identifier.startsWith('@')) {
            identifier = identifier.substring(1);
        }
        const res = await axios.get(`${API_BASE}/api/listings/public/agent/${encodeURIComponent(identifier)}`);
        setData(res.data);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Profile not found.");
      } finally {
        setLoading(false);
      }
    };
    if (profileId) fetchProfile();
  }, [profileId]);

  // --- HANDLERS ---
  const handleContact = (e) => {
    e.stopPropagation();
    if (!user) {
      setShowAuthModal(true);
      return;
    } 
    
    if (data?.agent) {
        let messagePath = "/dashboard/messages"; 
        if (user.role === "buyer") messagePath = "/buyer/messages";
        else if (user.role === "owner" || user.role === "landlord") messagePath = "/owner/messages";
        else if (user.role === "admin") messagePath = "/admin/messages";
        else if (user.role === "superadmin") messagePath = "/super-admin/messages";
        
        navigate(messagePath, { 
            state: { startChatWith: data.agent.unique_id } 
        });
    }
  };

  const openListing = (listing) => { setSelected(listing); setPhotoIndex(0); };
  const openListingLightbox = (index) => { setLightboxType('listing'); setPhotoIndex(index); setLightboxOpen(true); };
  const openAvatarLightbox = (e) => { e.stopPropagation(); setLightboxType('avatar'); setLightboxOpen(true); };
  const nextPhoto = (e) => { e.stopPropagation(); if (lightboxType === 'listing' && selected) setPhotoIndex((prev) => (prev + 1) % selected.photos.length); };
  const prevPhoto = (e) => { e.stopPropagation(); if (lightboxType === 'listing' && selected) setPhotoIndex((prev) => (prev - 1 + selected.photos.length) % selected.photos.length); };

  const getFeaturesList = (features) => {
    if (!features) return [];
    let parsed = features;
    if (typeof features === 'string') { try { parsed = JSON.parse(features); } catch(e) { return []; } }
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === 'object' && parsed !== null) return Object.keys(parsed).filter(key => parsed[key] === true || parsed[key] === "true");
    return [];
  };

  if (loading) return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: '#f8fafc', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 size={40} className={style.spinner} />
        <p style={{color: '#64748b', fontWeight: 500, marginTop: 10}}>Loading Profile...</p>
    </div>
  );

  if (error || !data) return (
    <div className={style.errorState}>
        <AlertTriangle size={48} className={style.errorIcon} />
        <h2>Profile Not Found</h2>
        <button onClick={() => navigate('/')} className={style.primaryBtn}>Return Home</button>
    </div>
  );

  const { agent, listings } = data;

  // ✅ FIX: Dynamic Role Label
  let roleLabel = "Property Landlord";
  if (agent.role === 'agent') roleLabel = "Real Estate Agent";
  else if (agent.role === 'buyer') roleLabel = "Verified Buyer"; // Or just "Home Buyer"

  // ✅ FIX: Determine Cover Image
  // If buyer has no listings, use a generic pleasant background or their avatar blur
  const coverImage = listings.length > 0 
    ? listings[0]?.photos?.[0]?.url 
    : "/default-cover.jpg"; // Make sure you have a default generic cover image
  
  // ✅ STATUS LOGIC
  const isPending = agent.status === 'pending' || agent.status === 'rejected' || agent.status === 'new';
  const isOwner = user?.unique_id === agent.unique_id;
  const showLockOverlay = isPending && !isOwner;
  const isBuyerProfile = agent.role === 'buyer';

  return (
    <div className={style.pageContainer}>
      
      {/* 1. BANNER */}
      <div className={style.banner} style={{backgroundImage: `url(${coverImage})`, backgroundColor: '#cbd5e1'}}>
        <div className={style.bannerOverlay}></div>
        <button onClick={() => navigate(-1)} className={style.backBtn}>
            <ArrowLeft size={18}/> Go Back
        </button>
      </div>

      <div className={style.contentContainer}>
        
        {/* 2. PROFILE CARD */}
        <div className={style.profileHeader}>
            
            {/* Top Right Status Badge */}
            {isOwner && isPending && (
                <div className={style.statusBadge} title="Your profile is visible only to you until approved.">
                    <AlertTriangle size={16} />
                    <span>Pending Approval</span>
                </div>
            )}

            <div className={style.avatarWrapper}>
                <img 
                    src={agent.avatar_url || "/person-placeholder.png"} 
                    alt={agent.full_name} 
                    className={`${style.avatar} ${style.clickableAvatar}`} 
                    onClick={openAvatarLightbox}
                />
                {!isPending && <div className={style.verifiedTick}><CheckCircle size={20} fill="#09707d" color="white"/></div>}
            </div>

            <div className={style.headerInfo}>
                <div className={style.headerTop}>
                    <div>
                        <h1 className={style.name}>{agent.full_name}</h1>
                        <div className={style.subInfo}>
                            {/* Role Badge */}
                            <span className={`${style.roleBadge} ${isBuyerProfile ? style.buyerBadge : ''}`}>
                                {roleLabel}
                            </span>
                            
                            {/* Location */}
                            <span className={style.location}>
                                <MapPin size={14}/> {agent.city}, {agent.country} {getFlagEmoji(agent.country_code)}
                            </span>
                        </div>
                    </div>
                    {!isOwner && (
                        <div className={style.headerActions}>
                            <button onClick={handleContact} className={style.primaryBtn} disabled={isPending}>
                                <MessageCircle size={18}/> Send Message
                            </button>
                        </div>
                    )}
                </div>

                {/* ✅ FIX: HIDE LISTING STATS FOR BUYERS */}
                <div className={style.statsBar}>
                    {!isBuyerProfile && (
                        <>
                            <div className={style.statItem}><Building2 size={16}/><span><strong>{listings.length}</strong> Listings</span></div>
                            <div className={style.statItem}><Star size={16}/><span><strong>4.9</strong> Rating</span></div>
                            <div className={style.statItem}><ShieldCheck size={16}/><span><strong>{agent.experience || "1+"} Years</strong> Exp.</span></div>
                        </>
                    )}
                    <div className={style.statItem}><Calendar size={16}/><span>Joined {dayjs(agent.created_at).format("MMM YYYY")}</span></div>
                </div>
            </div>
        </div>

        {/* 3. MAIN CONTENT */}
        <div className={`${style.mainGrid} ${showLockOverlay ? style.blurred : ''}`}>
            
            <aside className={style.leftSidebar} style={isBuyerProfile ? {width: '100%', flex: '1'} : {}}>
                <div className={style.sectionCard}>
                    <h3>About</h3>
                    <p className={style.bio}>{agent.bio || (isBuyerProfile ? "I am looking for my dream property." : `I am a professional ${roleLabel} on Keyvia.`)}</p>
                    <div className={style.divider}></div>
                    <div className={style.infoList}>
                        <div className={style.infoRow}><Globe size={16}/> Speaks English</div>
                        {!isBuyerProfile && agent.agency_name && <div className={style.infoRow}><Building2 size={16}/> {agent.agency_name}</div>}
                        <div className={style.infoRow}><CheckCircle size={16}/> Identity Verified</div>
                    </div>
                </div>
            </aside>

            {/* ✅ FIX: HIDE LISTINGS SECTION FOR BUYERS */}
            {!isBuyerProfile && (
                <main className={style.listingSection}>
                    <div className={style.listingHeader}>
                        <h3>Active Properties</h3>
                        <span className={style.countPill}>{listings.length}</span>
                    </div>
                    <div className={style.listingsGrid}>
                        {listings.length === 0 ? (
                            <div className={style.emptyState}><LayoutGrid size={48} color="#cbd5e1"/><p>No active properties listed.</p></div>
                        ) : (
                            listings.map(l => (
                                <div key={l.product_id} className={style.listingCard} onClick={() => (!showLockOverlay && openListing(l))}>
                                    <div className={style.cardImage} style={{backgroundImage: `url(${l.photos?.[0]?.url || '/placeholder.png'})`}}>
                                        <div className={style.cardOverlay}><span className={style.typeTag}>{l.listing_type}</span></div>
                                    </div>
                                    <div className={style.cardContent}>
                                        <div className={style.priceRow}>
                                            <span className={style.price}>{Number(l.price).toLocaleString()} <small>{l.price_currency}</small></span>
                                        </div>
                                        <h4 className={style.cardTitle}>{l.title}</h4>
                                        <p className={style.cardAddress}>{l.city}, {l.country}</p>
                                        <div className={style.cardSpecs}>
                                            <span><Bed size={14}/> {l.bedrooms}</span>
                                            <span><Bath size={14}/> {l.bathrooms}</span>
                                            <span><Square size={14}/> {l.square_footage}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </main>
            )}
        </div>

        {/* PENDING OVERLAY */}
        {showLockOverlay && (
            <div className={style.pendingOverlay}>
                <div className={style.pendingCard}>
                    <Lock size={40} className={style.pendingIcon} />
                    <h2>Profile Under Review</h2>
                    <p>This profile is currently being verified by Keyvia admins to ensure safety.</p>
                    <button onClick={() => navigate(-1)} className={style.secondaryBtn}>Go Back</button>
                </div>
            </div>
        )}
      </div>

      {/* --- DRAWER --- */}
      {selected && (
        <>
          <div className={style.overlay} onClick={() => setSelected(null)} />
          <div className={style.drawer}>
            <div className={style.drawerHeader}><button onClick={() => setSelected(null)}><X size={24}/></button></div>
            <div className={style.drawerScroll}>
                <div className={style.gallery}>
                    <img src={selected.photos[0]?.url || "/placeholder.png"} className={style.mainPhoto} onClick={() => openListingLightbox(0)} alt="Main" />
                    <div className={style.thumbs}>
                        {selected.photos.slice(1,4).map((p,i) => <img key={i} src={p.url} onClick={() => openListingLightbox(i+1)} alt="Thumb"/>)}
                    </div>
                </div>
                <div className={style.drawerInfo}>
                    <div className={style.drawerTop}><span className={style.drawerType}>{selected.listing_type}</span><span className={style.drawerCat}>{selected.category || "Property"}</span></div>
                    <h2>{selected.title}</h2>
                    <p className={style.drawerPrice}>{Number(selected.price).toLocaleString()} {selected.price_currency}</p>
                    <div className={style.specsRow}>
                        <div className={style.specItem}><span>Type</span><strong>{selected.property_type}</strong></div>
                        <div className={style.specItem}><span>Lot</span><strong>{selected.lot_size ? `${selected.lot_size}` : 'N/A'}</strong></div>
                        <div className={style.specItem}><span>Built</span><strong>{selected.year_built || 'N/A'}</strong></div>
                    </div>
                    <h3>Description</h3><p className={style.drawerDesc}>{selected.description}</p>
                    <h3>Amenities</h3>
                    <div className={style.amenitiesList}>
                        {getFeaturesList(selected.features).map((f, i) => <span key={i} className={style.amenityTag}>{f}</span>)}
                    </div>
                    
                    {!isOwner && (
                        <div className={style.stickyContact}>
                            <button onClick={handleContact} className={style.contactFloatBtn}><MessageCircle size={18} /> Inquiry</button>
                        </div>
                    )}
                </div>
            </div>
          </div>
        </>
      )}

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      {lightboxOpen && (
        <div className={style.lightbox} onClick={() => setLightboxOpen(false)}>
            <button className={style.closeLb}><X size={32}/></button>
            <img 
                src={lightboxType === 'avatar' ? (agent.avatar_url || "/person-placeholder.png") : selected.photos[photoIndex].url} 
                onClick={e=>e.stopPropagation()} 
                alt="Fullscreen"
                className={style.lightboxImg}
            />
            {lightboxType === 'listing' && (
                <>
                    <button className={style.prevLb} onClick={prevPhoto}><ChevronLeft size={32}/></button>
                    <button className={style.nextLb} onClick={nextPhoto}><ChevronRight size={32}/></button>
                </>
            )}
        </div>
      )}
    </div>
  );
};

export default AgentProfile;