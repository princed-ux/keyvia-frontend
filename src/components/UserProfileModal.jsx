import React, { useEffect, useState } from "react";
import { X, MapPin, ShieldCheck, Star, Calendar, MessageCircle, Building2, User, Globe, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import style from "../styles/UserProfileModal.module.css";
import dayjs from "dayjs";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Helper for Flag
const getFlagEmoji = (code) => code ? code.toUpperCase().replace(/./g, c => String.fromCodePoint(c.charCodeAt(0) + 127397)) : "🌍";

const UserProfileModal = ({ user: initialUser, onClose }) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState(initialUser || null);
  const [loading, setLoading] = useState(!initialUser?.full_details_loaded);
  const [listingCount, setListingCount] = useState(0);

  // Fetch full details if only basic info provided
  useEffect(() => {
    if (!initialUser?.unique_id) return;
    
    const fetchFullProfile = async () => {
      setLoading(true);
      try {
        // Re-using the public profile endpoint to get stats & full verification info
        const res = await axios.get(`${API_BASE}/api/listings/public/agent/${initialUser.unique_id}`);
        setProfile(res.data.agent);
        setListingCount(res.data.listings.length);
      } catch (err) {
        console.error("Failed to load profile details");
      } finally {
        setLoading(false);
      }
    };

    fetchFullProfile();
  }, [initialUser]);

  const handleMessage = () => {
    if (!currentUser) {
        // Trigger auth flow (parent component should handle this, or simple redirect)
        navigate('/login'); 
    } else {
        navigate('/dashboard/messages', { state: { startChatWith: profile.unique_id } });
        onClose();
    }
  };

  if (!profile) return null;

  const roleLabel = profile.role === 'agent' ? "Real Estate Agent" : (profile.role === 'landlord' ? "Property Landlord" : "User");
  const isVerified = profile.verification_status === 'approved';
  
  // Dynamic Background based on role color or default
  const headerColor = profile.role === 'agent' ? '#0f172a' : '#09707d'; 

  return (
    <div className={style.overlay} onClick={onClose}>
      <div className={style.modal} onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER BACKGROUND */}
        <div className={style.headerBg} style={{ backgroundColor: headerColor }}>
            <button className={style.closeBtn} onClick={onClose}><X size={20} color="white"/></button>
        </div>

        {/* PROFILE CONTENT */}
        <div className={style.content}>
            
            {/* Avatar & Verification */}
            <div className={style.avatarWrapper}>
                <img src={profile.avatar_url || "/person-placeholder.png"} alt={profile.full_name} className={style.avatar} />
                {isVerified && <div className={style.verifiedBadge} title="Verified"><ShieldCheck size={16} color="white" fill="#10b981"/></div>}
            </div>

            {/* Name & Role */}
            <div className={style.infoCenter}>
                <h2>{profile.full_name}</h2>
                <span className={style.roleBadge}>{roleLabel}</span>
                
                <div className={style.location}>
                    <MapPin size={14}/> {profile.city || "Unknown City"}, {profile.country || "Unknown Country"} 
                    <span className={style.flag}>{getFlagEmoji(profile.country_code)}</span>
                </div>
            </div>

            {/* Stats Row (Only if Agent/Landlord) */}
            {(profile.role === 'agent' || profile.role === 'landlord') && (
                <div className={style.statsRow}>
                    <div className={style.stat}>
                        <strong>{listingCount}</strong>
                        <span>Listings</span>
                    </div>
                    <div className={style.divider}></div>
                    <div className={style.stat}>
                        <strong>{profile.experience || "1+"}</strong>
                        <span>Years Exp.</span>
                    </div>
                    <div className={style.divider}></div>
                    <div className={style.stat}>
                        <strong>4.9 <Star size={10} fill="orange" stroke="none"/></strong>
                        <span>Rating</span>
                    </div>
                </div>
            )}

            {/* Bio */}
            {profile.bio && (
                <p className={style.bio}>{profile.bio}</p>
            )}

            {/* Meta Details */}
            <div className={style.metaList}>
                <div className={style.metaItem}>
                    <Calendar size={16} className={style.icon}/>
                    <span>Joined {dayjs(profile.created_at).format("MMMM YYYY")}</span>
                </div>
                {profile.agency_name && (
                    <div className={style.metaItem}>
                        <Building2 size={16} className={style.icon}/>
                        <span>{profile.agency_name}</span>
                    </div>
                )}
                <div className={style.metaItem}>
                    <Globe size={16} className={style.icon}/>
                    <span>Speaks English</span>
                </div>
            </div>

            {/* Actions */}
            <button className={style.messageBtn} onClick={handleMessage}>
                <MessageCircle size={18}/> Send Message
            </button>

            {!isVerified && (
               <div className={style.reviewNote}>
                   This profile is currently under review or unverified.
               </div>
            )}
        </div>

        {loading && (
            <div className={style.loadingOverlay}>
                <Loader2 size={32} className="animate-spin" color={headerColor}/>
            </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;