import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Heart, Share2, MapPin, Bed, Bath, Square, Calendar, Check, Mail, ChevronLeft, ChevronRight, PlayCircle, Video, User, Building } from "lucide-react";
import { getCurrencySymbol, formatPrice } from "../utils/format";
import style from "../styles/ListingModal.module.css"; 
import keyviaLogo from "../assets/mainLogo.png"; 

const ListingModal = ({ listing, onClose, currentUser, onActionAttempt }) => {
  const navigate = useNavigate();
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  if (!listing) return null;

  // --- 1. MEDIA PREP ---
  const photos = listing.photos?.map(p => ({ type: 'image', url: p.url })) || [];
  const allMedia = [...photos];
  if (listing.video_url) allMedia.push({ type: 'video', url: listing.video_url });
  if (listing.virtual_tour_url) allMedia.push({ type: 'tour', url: listing.virtual_tour_url });

  const gridPhotos = [...photos];
  while (gridPhotos.length < 5) gridPhotos.push({ type: 'placeholder', url: "/placeholder.png" });
  const remainingPhotos = allMedia.length > 5 ? allMedia.length - 5 : 0;

  // --- 2. DYNAMIC PROFILE LOGIC ---
  // Determine if the poster is an Agent or Landlord based on role or data
  const isAgent = listing.agent_role === 'agent' || !!listing.license_number;
  const profileLabel = isAgent ? "Agent" : "Landlord";

  // --- HANDLERS ---
  const handleProfileClick = () => {
    const id = listing.agent_username || listing.agent_unique_id;
    if (id) navigate(`/user/${id}`);
  };

  // ✅ GATED ACTIONS
  const handleRequestTour = () => {
    if (onActionAttempt) {
        onActionAttempt(() => {
            console.log("Opening Tour Request for logged in user...");
            // Add your tour scheduling logic here
        });
    }
  };

  const handleMessage = () => {
    if (onActionAttempt) {
        onActionAttempt(() => {
            console.log("Opening Message Chat...");
            // Add your messaging logic here (e.g. navigate to chat)
        });
    }
  };

  const openGallery = (index = 0) => { setGalleryIndex(index); setShowGallery(true); };
  
  const nextSlide = (e) => { e.stopPropagation(); setGalleryIndex((prev) => (prev === allMedia.length - 1 ? 0 : prev + 1)); };
  const prevSlide = (e) => { e.stopPropagation(); setGalleryIndex((prev) => (prev === 0 ? allMedia.length - 1 : prev - 1)); };

  // --- GALLERY OVERLAY ---
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
                <div className={style.galleryCounter}>{galleryIndex + 1} / {allMedia.length}</div>
            </div>
            <button className={style.navBtnRight} onClick={nextSlide}><ChevronRight size={32} /></button>
        </div>
    );
  }

  // --- MAIN RENDER ---
  return (
    <div className={style.overlay} onClick={onClose}>
      <div className={style.modalContainer} onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className={style.topControls}>
            <div className={style.leftNav}>
                <button className={style.backBtn} onClick={onClose}>‹ Back to search</button>
            </div>
            <div className={style.centerLogo}>
                <img src={keyviaLogo} alt="KEYVIA" />
            </div>
            <div className={style.actionBtns}>
                <button><Heart size={18} /> Save</button>
                <button><Share2 size={18} /> Share</button>
                <button onClick={onClose}><X size={20} /> Close</button>
            </div>
        </div>

        {/* IMAGE GRID */}
        <div className={style.imageGrid}>
          <div className={style.mainImage} onClick={() => openGallery(0)}>
            <img src={gridPhotos[0].url} alt="Main" />
            <div className={style.logoOverlay}><img src={keyviaLogo} alt="KEYVIA" /></div>
          </div>
          <div className={style.subImages}>
            {gridPhotos.slice(1, 5).map((photo, index) => (
                <div key={index} className={style.imageWrapper} onClick={() => openGallery(index + 1)}>
                    <img src={photo.url} alt={`Sub ${index}`} />
                    {index === 3 && remainingPhotos > 0 && <div className={style.moreOverlay}>+{remainingPhotos}</div>}
                </div>
            ))}
          </div>
          <button className={style.seeAllBtn} onClick={() => openGallery(0)}>
            <Square size={16} /> See all {allMedia.length} photos
          </button>
        </div>

        <div className={style.contentLayout}>
          {/* LEFT COLUMN */}
          <div className={style.leftColumn}>
            <div className={style.header}>
              <div className={style.headerTop}>
                <h1>{listing.title}</h1>
                <div className={style.priceTag}>{getCurrencySymbol(listing.price_currency)}{formatPrice(listing.price)}</div>
              </div>
              <p className={style.addressText}><MapPin size={16} /> {listing.address}, {listing.city}, {listing.state}</p>
              
              <div className={style.keyStats}>
                <div className={style.statBox}><span className={style.statVal}>{listing.bedrooms}</span><span className={style.statLabel}>Beds</span></div>
                <div className={style.statBox}><span className={style.statVal}>{listing.bathrooms}</span><span className={style.statLabel}>Baths</span></div>
                <div className={style.statBox}><span className={style.statVal}>{formatPrice(listing.square_footage)}</span><span className={style.statLabel}>Sqft</span></div>
              </div>
            </div>

            {(listing.video_url || listing.virtual_tour_url) && (
                <div className={style.mediaLinks}>
                    {listing.video_url && <button onClick={() => { const idx = allMedia.findIndex(m => m.type === 'video'); openGallery(idx); }}><PlayCircle size={16}/> Watch Video</button>}
                    {listing.virtual_tour_url && <button onClick={() => { const idx = allMedia.findIndex(m => m.type === 'tour'); openGallery(idx); }}><Video size={16}/> Virtual Tour</button>}
                </div>
            )}

            <div className={style.section}>
              <h3>Description</h3>
              <p className={style.descText}>{listing.description || "No description provided."}</p>
            </div>

            <div className={style.section}>
              <h3>Features</h3>
              <div className={style.featureGrid}>
                {listing.features?.map((f, i) => <span key={i} className={style.featureItem}><Check size={14}/> {f}</span>)}
              </div>
            </div>

            {/* ✅ GOOGLE MAPS EMBED (Shows Schools/Stores) */}
            <div className={style.section}>
              <h3>Neighborhood & Schools</h3>
              <div className={style.mapWrapper} style={{ borderRadius: '12px', overflow: 'hidden', height: '400px' }}>
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${listing.latitude},${listing.longitude}&hl=en&z=15&output=embed`}
                ></iframe>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className={style.rightColumn}>
            <div className={style.stickyCard}>
              <div className={style.agentHeader}>
                <img src={listing.agent_avatar || "/person.png"} alt="User" className={style.agentAvatar} />
                <div className={style.agentInfo}>
                  <h4>{listing.agent_name || "Property Manager"}</h4>
                  
                  {/* ✅ DYNAMIC ROLE LABEL */}
                  <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isAgent ? <Building size={14} /> : <User size={14} />}
                    {isAgent ? (listing.agency_name || "Real Estate Agent") : "Property Landlord"}
                  </p>

                  <button className={style.viewProfileLink} onClick={handleProfileClick}>
                    View {profileLabel}'s Profile
                  </button>
                </div>
              </div>
              
              <div className={style.contactForm}>
                <h5>Schedule a Tour</h5>
                <div className={style.inputWrap}>
                  <Calendar size={16} />
                  <select>
                    <option>Select a Date</option>
                    <option>Tomorrow</option>
                    <option>This Weekend</option>
                  </select>
                </div>
                {/* ✅ GATED BUTTONS */}
                <button className={style.tourBtn} onClick={handleRequestTour}>Request Tour</button>
                <button className={style.messageBtn} onClick={handleMessage}><Mail size={16}/> Message {profileLabel}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingModal;