import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Heart, Share2, MapPin, Bed, Bath, Square, Calendar, Check, Mail, ChevronLeft, ChevronRight, PlayCircle, Video } from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getCurrencySymbol, formatPrice } from "../utils/format";
import style from "../styles/ListingModal.module.css"; 
import keyviaLogo from "../assets/mainLogo.png"; 

// Fix Leaflet Icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const ListingModal = ({ listing, onClose }) => {
  const navigate = useNavigate();
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  if (!listing) return null;

  // --- 1. PREPARE MEDIA LIST (Photos + Video + Tour) ---
  const photos = listing.photos?.map(p => ({ type: 'image', url: p.url })) || [];
  
  const allMedia = [...photos];
  if (listing.video_url) allMedia.push({ type: 'video', url: listing.video_url });
  if (listing.virtual_tour_url) allMedia.push({ type: 'tour', url: listing.virtual_tour_url });

  // Fill placeholders if < 5 images for the grid
  const gridPhotos = [...photos];
  while (gridPhotos.length < 5) gridPhotos.push({ type: 'placeholder', url: "/placeholder.png" });

  // Calculate remaining photos for the "+X" overlay
  const remainingPhotos = allMedia.length > 5 ? allMedia.length - 5 : 0;

  // --- HANDLERS ---
  const handleAgentClick = () => {
    // Uses the new fields from the Backend JOIN
    const id = listing.agent_username || listing.agent_unique_id;
    if (id) navigate(`/user/${id}`);
  };

  const openGallery = (index = 0) => {
    setGalleryIndex(index);
    setShowGallery(true);
  };

  const nextSlide = (e) => {
    e.stopPropagation();
    setGalleryIndex((prev) => (prev === allMedia.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    setGalleryIndex((prev) => (prev === 0 ? allMedia.length - 1 : prev - 1));
  };

  // --- RENDER GALLERY OVERLAY ---
  if (showGallery) {
    const current = allMedia[galleryIndex];
    return (
        <div className={style.galleryOverlay} onClick={() => setShowGallery(false)}>
            <button className={style.closeGalleryBtn} onClick={() => setShowGallery(false)}><X size={24} /></button>
            
            <button className={style.navBtnLeft} onClick={prevSlide}><ChevronLeft size={32} /></button>
            
            <div className={style.galleryContent} onClick={(e) => e.stopPropagation()}>
                {current.type === 'image' && <img src={current.url} alt="Gallery" />}
                {current.type === 'video' && (
                    <video controls autoPlay className={style.mediaPlayer}>
                        <source src={current.url} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                )}
                {current.type === 'tour' && (
                    <div className={style.iframeWrapper}>
                        <iframe src={current.url} title="Virtual Tour" frameBorder="0" allowFullScreen></iframe>
                    </div>
                )}
                <div className={style.galleryCounter}>{galleryIndex + 1} / {allMedia.length}</div>
            </div>

            <button className={style.navBtnRight} onClick={nextSlide}><ChevronRight size={32} /></button>
        </div>
    );
  }

  // --- MAIN MODAL RENDER ---
  return (
    <div className={style.overlay} onClick={onClose}>
      <div className={style.modalContainer} onClick={(e) => e.stopPropagation()}>
        
        {/* --- HEADER --- */}
        <div className={style.topControls}>
            <div className={style.leftNav}>
                <button className={style.backBtn} onClick={onClose}>‹ Back to search</button>
            </div>
            {/* ✅ LOGO CENTERED IN TOP NAV */}
            <div className={style.centerLogo}>
                <img src={keyviaLogo} alt="KEYVIA" />
            </div>
            <div className={style.actionBtns}>
                <button><Heart size={18} /> Save</button>
                <button><Share2 size={18} /> Share</button>
                <button onClick={onClose}><X size={20} /> Close</button>
            </div>
        </div>

        {/* --- IMAGE GRID --- */}
        <div className={style.imageGrid}>
          {/* Main Large Image */}
          <div className={style.mainImage} onClick={() => openGallery(0)}>
            <img src={gridPhotos[0].url} alt="Main" />
            <div className={style.logoOverlay}>
                <img src={keyviaLogo} alt="KEYVIA" />
            </div>
          </div>

          {/* Sub Images (2x2) */}
          <div className={style.subImages}>
            {gridPhotos.slice(1, 5).map((photo, index) => (
                <div key={index} className={style.imageWrapper} onClick={() => openGallery(index + 1)}>
                    <img src={photo.url} alt={`Sub ${index}`} />
                    
                    {/* Overlay for +X photos on the LAST image block */}
                    {index === 3 && remainingPhotos > 0 && (
                        <div className={style.moreOverlay}>
                            +{remainingPhotos}
                        </div>
                    )}
                </div>
            ))}
          </div>

          {/* ✅ "See All Photos" Button */}
          <button className={style.seeAllBtn} onClick={() => openGallery(0)}>
            <Square size={16} /> See all {allMedia.length} photos
          </button>
        </div>

        <div className={style.contentLayout}>
          {/* --- LEFT: INFO --- */}
          <div className={style.leftColumn}>
            <div className={style.header}>
              <div className={style.headerTop}>
                <h1>{listing.title}</h1>
                <div className={style.priceTag}>
                  {getCurrencySymbol(listing.price_currency)}{formatPrice(listing.price)}
                </div>
              </div>
              <p className={style.addressText}>
                <MapPin size={16} /> {listing.address}, {listing.city}, {listing.state}
              </p>
              
              <div className={style.keyStats}>
                <div className={style.statBox}>
                  <span className={style.statVal}>{listing.bedrooms}</span>
                  <span className={style.statLabel}>Beds</span>
                </div>
                <div className={style.statBox}>
                  <span className={style.statVal}>{listing.bathrooms}</span>
                  <span className={style.statLabel}>Baths</span>
                </div>
                <div className={style.statBox}>
                  <span className={style.statVal}>{formatPrice(listing.square_footage)}</span>
                  <span className={style.statLabel}>Sqft</span>
                </div>
              </div>
            </div>

            {/* Media Indicators */}
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
                {listing.features?.map((f, i) => (
                  <span key={i} className={style.featureItem}><Check size={14}/> {f}</span>
                ))}
              </div>
            </div>

            <div className={style.section}>
              <h3>Location</h3>
              <div className={style.mapWrapper}>
                {listing.latitude && (
                  <MapContainer center={[listing.latitude, listing.longitude]} zoom={15} scrollWheelZoom={false} style={{height: "100%"}} zoomControl={false}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[listing.latitude, listing.longitude]} />
                  </MapContainer>
                )}
              </div>
            </div>
          </div>

          {/* --- RIGHT: AGENT & CONTACT --- */}
          <div className={style.rightColumn}>
            <div className={style.stickyCard}>
              <div className={style.agentHeader}>
                <img 
                    src={listing.agent_avatar || "/person.png"} 
                    alt="Agent" 
                    className={style.agentAvatar} 
                />
                <div className={style.agentInfo}>
                  <h4>{listing.agent_name || "Listing Agent"}</h4>
                  <p>{listing.agency_name || "Real Estate Professional"}</p>
                  <button className={style.viewProfileLink} onClick={handleAgentClick}>
                    View Agent's Profile
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
                <button className={style.tourBtn}>Request Tour</button>
                <button className={style.messageBtn}><Mail size={16}/> Message Agent</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingModal;