import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Import useNavigate
import axios from "axios";
import { 
  MapPin, Mail, Phone, Briefcase, CheckCircle, 
  Instagram, Linkedin, Twitter, Globe,
  Bed, Bath, Square, X, Video, ChevronLeft, ChevronRight, MessageCircle
} from "lucide-react";
import style from "../styles/AgentProfile.module.css";

// Use public API fetch (no auth needed for public profile)
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AgentProfile = () => {
  const { unique_id } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Drawer & Lightbox State
  const [selected, setSelected] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/listings/public/agent/${unique_id}`);
        setData(res.data);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Agent not found or server error.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [unique_id]);

  // --- Handlers ---
  const handleStartChat = () => {
    // Navigate to messages and pass the agent's ID to open their chat immediately
    if (data?.agent) {
      navigate('/dashboard/messages', { 
        state: { startChatWith: data.agent.unique_id } 
      });
    }
  };

  const openListing = (listing) => {
    setSelected(listing);
    setPhotoIndex(0);
  };

  const openLightbox = (index) => {
    setPhotoIndex(index);
    setLightboxOpen(true);
  };

  const nextPhoto = (e) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev + 1) % selected.photos.length);
  };

  const prevPhoto = (e) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev - 1 + selected.photos.length) % selected.photos.length);
  };

  if (loading) return <div className={style.loading}>Loading Profile...</div>;
  if (error || !data) return <div className={style.error}>{error || "Profile not found"}</div>;

  const { agent, listings } = data;
  const backgroundUrl = listings[0]?.photos?.[0]?.url || agent.avatar_url || "/placeholder-property.jpg";

  return (
    <div className={style.container}>
      
      {/* 1. Hero Banner */}
      <div className={style.heroBanner}>
        <img src={backgroundUrl} alt="Background" className={style.heroBlur} />
        <div className={style.heroOverlay}></div>
      </div>

      <div className={style.contentWrapper}>
        
        {/* 2. Sidebar (Agent Info) */}
        <aside className={style.sidebar}>
          <img src={agent.avatar_url || "/person-placeholder.png"} alt={agent.full_name} className={style.avatar} />
          
          <h1 className={style.agentName}>{agent.full_name}</h1>
          <span className={style.agencyName}>{agent.agency_name || "Real Estate Agent"}</span>

          <div className={style.verifiedBadge}>
            <CheckCircle size={14} /> Verified Agent
          </div>

          <div className={style.actionStack}>
            {/* CHAT BUTTON */}
            <button onClick={handleStartChat} className={`${style.btn} ${style.msgBtn}`}>
              <MessageCircle size={18}/> Message Agent
            </button>

            {agent.phone && (
              <a href={`tel:${agent.phone}`} className={`${style.btn} ${style.callBtn}`}>
                <Phone size={18}/> Call Now
              </a>
            )}
            
            {agent.email && (
              <a href={`mailto:${agent.email}`} className={`${style.btn} ${style.emailBtn}`}>
                <Mail size={18}/> Email
              </a>
            )}
          </div>

          <div className={style.contactMeta}>
            {agent.city && <div className={style.metaItem}><MapPin size={16}/> {agent.city}, {agent.country}</div>}
            {agent.experience && <div className={style.metaItem}><Briefcase size={16}/> {agent.experience} Experience</div>}
            <div className={style.metaItem}><Globe size={16}/> Speaks English</div>
          </div>

          <div className={style.socials}>
            {agent.social_instagram && <a href={agent.social_instagram} target="_blank" rel="noreferrer" className={style.socialIcon}><Instagram size={22}/></a>}
            {agent.social_linkedin && <a href={agent.social_linkedin} target="_blank" rel="noreferrer" className={style.socialIcon}><Linkedin size={22}/></a>}
            {agent.social_twitter && <a href={agent.social_twitter} target="_blank" rel="noreferrer" className={style.socialIcon}><Twitter size={22}/></a>}
          </div>
        </aside>

        {/* 3. Main Content */}
        <main className={style.mainContent}>
          
          {/* Stats */}
          <div className={style.statsGrid}>
            <div className={style.statCard}>
              <span className={style.statValue}>{listings.length}</span>
              <span className={style.statLabel}>Active Listings</span>
            </div>
            <div className={style.statCard}>
              <span className={style.statValue}>100%</span>
              <span className={style.statLabel}>Response Rate</span>
            </div>
            <div className={style.statCard}>
              <span className={style.statValue}>4.9</span>
              <span className={style.statLabel}>Avg Rating</span>
            </div>
          </div>

          {/* Bio */}
          <section>
            <h2 className={style.sectionTitle}>About {agent.full_name.split(' ')[0]}</h2>
            <div className={style.bioText}>
              {agent.bio || `Contact ${agent.full_name} for the best property deals in town. Dedicated to providing excellent service.`}
            </div>
          </section>

          {/* Listings Grid */}
          <section>
            <div className={style.listingsHeader}>
              <h2 className={style.sectionTitle}>
                Current Portfolio <span className={style.countBadge}>{listings.length}</span>
              </h2>
            </div>

            <div className={style.grid}>
              {listings.length === 0 ? (
                <p style={{color: '#6b7280', fontStyle: 'italic'}}>No active properties at the moment.</p>
              ) : (
                listings.map(l => (
                  <div key={l.product_id} className={style.card} onClick={() => openListing(l)}>
                    <div className={style.imageWrapper}>
                      <img src={l.photos?.[0]?.url || "/placeholder.png"} alt={l.title} className={style.cardImage} />
                      <span className={style.typeBadge}>{l.listing_type}</span>
                    </div>
                    <div className={style.cardBody}>
                      <h3 className={style.cardTitle}>{l.title}</h3>
                      <p className={style.price}>
                        {Number(l.price).toLocaleString()} {l.price_currency}
                        {l.listing_type === 'rent' && <span style={{fontSize:'0.8rem', color:'#6b7280'}}> / {l.price_period}</span>}
                      </p>
                      <p className={style.address}><MapPin size={14}/> {l.city}, {l.country}</p>
                      <div className={style.features}>
                        <div className={style.featureItem}><Bed size={16}/> {l.bedrooms}</div>
                        <div className={style.featureItem}><Bath size={16}/> {l.bathrooms}</div>
                        <div className={style.featureItem}><Square size={16}/> {l.square_footage}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </div>

      {/* --- DRAWER (Slide-Over) --- */}
      {selected && (
        <>
          <div className={style.overlay} onClick={() => setSelected(null)} />
          <div className={style.drawer}>
            <div className={style.drawerHeader}>
              <h3 style={{margin:0, fontSize:'1.1rem'}}>{selected.title}</h3>
              <button onClick={() => setSelected(null)} style={{background:'none', border:'none', cursor:'pointer'}}>
                <X size={24} color="#6b7280"/>
              </button>
            </div>

            <div className={style.drawerContent}>
              {/* Gallery */}
              <div className={style.galleryGrid}>
                {selected.photos?.length > 0 ? (
                  <>
                    <img 
                      src={selected.photos[0].url} 
                      className={style.galleryMain} 
                      alt="Main"
                      onClick={() => openLightbox(0)}
                    />
                    {selected.photos.slice(1, 5).map((p, i) => (
                      <img 
                        key={i} src={p.url} 
                        className={style.galleryThumb} 
                        alt="Thumb"
                        onClick={() => openLightbox(i + 1)}
                      />
                    ))}
                  </>
                ) : <p>No photos available</p>}
              </div>

              {/* Media Buttons */}
              {(selected.video_url || selected.virtual_tour_url) && (
                <div style={{marginBottom: 25}}>
                   {selected.video_url && (
                     <a href={selected.video_url} target="_blank" rel="noreferrer" className={style.mediaBtn}>
                       <Video size={18} /> Watch Video Tour
                     </a>
                   )}
                   {selected.virtual_tour_url && (
                     <a href={selected.virtual_tour_url} target="_blank" rel="noreferrer" className={style.mediaBtn}>
                       <Globe size={18} /> View 360° Virtual Tour
                     </a>
                   )}
                </div>
              )}

              {/* Details */}
              <div className={style.sectionTitleSmall}>Property Details</div>
              <p style={{fontSize: '1.5rem', fontWeight: '800', color: '#09707d', margin: '0 0 15px'}}>
                 {Number(selected.price).toLocaleString()} {selected.price_currency} 
                 {selected.listing_type === 'rent' && <span style={{fontSize:'1rem', color:'#6b7280'}}> / {selected.price_period}</span>}
              </p>
              
              <div className={style.infoGrid}>
                 <div className={style.infoItem}><label>Type</label><p>{selected.property_type}</p></div>
                 <div className={style.infoItem}><label>Location</label><p>{selected.address}</p></div>
                 <div className={style.infoItem}><label>Beds / Baths</label><p>{selected.bedrooms} / {selected.bathrooms}</p></div>
                 <div className={style.infoItem}><label>Size</label><p>{selected.square_footage} sq ft</p></div>
              </div>

              <div className={style.sectionTitleSmall}>Description</div>
              <p style={{lineHeight: 1.6, color: '#4b5563', whiteSpace: 'pre-line'}}>{selected.description}</p>
              
              <div style={{marginTop: 40}}>
                <button onClick={handleStartChat} className={`${style.btn} ${style.msgBtn}`}>
                  <MessageCircle size={18}/> Inquiry about this property
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- LIGHTBOX --- */}
      {lightboxOpen && selected && (
        <div className={style.lightbox} onClick={() => setLightboxOpen(false)}>
          <button className={style.lightboxClose}><X size={32} /></button>
          
          <img 
            src={selected.photos[photoIndex].url} 
            className={style.lightboxImg} 
            onClick={(e) => e.stopPropagation()} 
            alt="Fullscreen"
          />

          <button className={style.lightboxPrev} onClick={prevPhoto}><ChevronLeft size={32}/></button>
          <button className={style.lightboxNext} onClick={nextPhoto}><ChevronRight size={32}/></button>
        </div>
      )}

    </div>
  );
};

export default AgentProfile;