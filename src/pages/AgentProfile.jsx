import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { 
  MapPin, 
  Mail, 
  Phone, 
  Briefcase, 
  CheckCircle,
  Building,
  Instagram, 
  Linkedin, 
  Twitter,
  Bed,
  Bath,
  Square,
  Globe
} from "lucide-react";
import style from "../styles/AgentProfile.module.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AgentProfile = () => {
  const { unique_id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <div className={style.loading}>Loading Profile...</div>;
  if (error || !data) return <div className={style.error}>{error || "Profile not found"}</div>;

  const { agent, listings } = data;

  // Use agent's own avatar for blur background, or a property image
  const backgroundUrl = listings[0]?.photos?.[0]?.url || agent.avatar_url || "/placeholder-property.jpg";

  return (
    <div className={style.container}>
      
      {/* 1. Immersive Hero Banner */}
      <div className={style.heroBanner}>
        <img src={backgroundUrl} alt="Background" className={style.heroBlur} />
        <div className={style.heroOverlay}></div>
      </div>

      <div className={style.contentWrapper}>
        
        {/* 2. Sticky Sidebar (Agent Info) */}
        <aside className={style.sidebar}>
          <img 
            src={agent.avatar_url || "/person-placeholder.png"} 
            alt={agent.full_name} 
            className={style.avatar} 
          />
          
          <h1 className={style.agentName}>{agent.full_name}</h1>
          <span className={style.agencyName}>
            {agent.agency_name ? `${agent.agency_name}` : "Independent Agent"}
          </span>

          <div className={style.verifiedBadge}>
            <CheckCircle size={14} /> Verified Agent
          </div>

          <div className={style.actionStack}>
            {agent.phone && (
              <a href={`tel:${agent.phone}`} className={style.primaryBtn}>
                <Phone size={18}/> Call Agent
              </a>
            )}
            {agent.email && (
              <a href={`mailto:${agent.email}`} className={style.secondaryBtn}>
                <Mail size={18}/> Send Email
              </a>
            )}
          </div>

          <div className={style.contactMeta}>
            {agent.city && (
              <div className={style.metaItem}>
                <MapPin size={16}/> {agent.city}, {agent.country}
              </div>
            )}
            {agent.experience && (
              <div className={style.metaItem}>
                <Briefcase size={16}/> {agent.experience} Experience
              </div>
            )}
            <div className={style.metaItem}>
              <Globe size={16}/> Speaks English
            </div>
          </div>

          <div className={style.socials}>
            {agent.social_instagram && <a href={agent.social_instagram} target="_blank" rel="noreferrer" className={style.socialIcon}><Instagram size={22}/></a>}
            {agent.social_linkedin && <a href={agent.social_linkedin} target="_blank" rel="noreferrer" className={style.socialIcon}><Linkedin size={22}/></a>}
            {agent.social_twitter && <a href={agent.social_twitter} target="_blank" rel="noreferrer" className={style.socialIcon}><Twitter size={22}/></a>}
          </div>
        </aside>

        {/* 3. Main Content (Stats + Bio + Listings) */}
        <main className={style.mainContent}>
          
          {/* Quick Stats */}
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
              {agent.bio || "This agent is dedicated to finding you the perfect property. Contact them today for inquiries."}
            </div>
          </section>

          {/* Listings */}
          <section>
            <div className={style.listingsHeader}>
              <h2 className={style.sectionTitle}>
                Current Portfolio 
                <span className={style.countBadge}>{listings.length}</span>
              </h2>
            </div>

            <div className={style.grid}>
              {listings.length === 0 ? (
                <p style={{color: '#6b7280', fontStyle: 'italic'}}>No active properties at the moment.</p>
              ) : (
                listings.map(l => (
                  <div key={l.product_id} className={style.card}>
                    <div className={style.imageWrapper}>
                      <img 
                        src={l.photos?.[0]?.url || "/placeholder.png"} 
                        alt={l.title} 
                        className={style.cardImage} 
                      />
                      <span className={style.typeBadge}>{l.listing_type}</span>
                      <div className={style.priceOverlay}>
                        <p className={style.price}>
                          {Number(l.price).toLocaleString()} {l.price_currency}
                          {l.listing_type === 'rent' && <span className={style.period}> / {l.price_period}</span>}
                        </p>
                      </div>
                    </div>
                    
                    <div className={style.cardBody}>
                      <h3 className={style.cardTitle}>{l.title}</h3>
                      <p className={style.address}>
                        <MapPin size={14} /> {l.city}, {l.country}
                      </p>
                      
                      <div className={style.features}>
                        <div className={style.featureItem}><Bed size={16}/> {l.bedrooms}</div>
                        <div className={style.featureItem}><Bath size={16}/> {l.bathrooms}</div>
                        <div className={style.featureItem}><Square size={16}/> {l.square_footage} ft²</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

        </main>
      </div>
    </div>
  );
};

export default AgentProfile;