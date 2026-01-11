import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import client from "../api/axios";
import { 
  Heart, MapPin, Bed, Bath, Square, Search, 
  ArrowRight, Home, TrendingUp, MessageSquare, Loader2, X
} from "lucide-react";
import { motion } from "framer-motion";
import style from "../styles/BuyerDashboard.module.css";
import Swal from "sweetalert2";

export default function BuyerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ saved: 0, viewed: 0, contacted: 0 });

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        // Assuming endpoints exist to get user's favorites and stats
        const [favRes, statRes] = await Promise.all([
            client.get(`/api/favorites/user/${user.unique_id}`),
            client.get(`/api/buyer/stats/${user.unique_id}`) 
        ]);

        setFavorites(Array.isArray(favRes.data) ? favRes.data : []);
        setStats(statRes.data || { saved: 0, viewed: 0, contacted: 0 });
      } catch (err) {
        console.error("Dashboard Error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchDashboard();
  }, [user]);

  // --- ACTIONS ---
  const removeFavorite = async (e, listingId) => {
    e.stopPropagation();
    try {
        // Optimistic UI Update
        setFavorites(prev => prev.filter(f => f.product_id !== listingId));
        setStats(prev => ({ ...prev, saved: prev.saved - 1 }));
        
        await client.delete(`/api/favorites/${listingId}`);
        const Toast = Swal.mixin({
            toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, timerProgressBar: true
        });
        Toast.fire({ icon: 'success', title: 'Removed from wishlist' });
    } catch (err) {
        // Revert on failure
        fetchDashboard(); 
    }
  };

  const handleNavigate = (path) => navigate(path);

  // --- RENDER HELPERS ---
  const formatPrice = (price, currency) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format(price);
  };

  if (loading) {
    return (
        <div className={style.loaderContainer}>
            <Loader2 className={style.spinner} size={40} />
            <p>Personalizing your experience...</p>
        </div>
    );
  }

  return (
    <div className={style.dashboardContainer}>
      
      {/* 1. WELCOME HEADER */}
      <header className={style.header}>
        <div className={style.welcomeText}>
            <h1>Welcome back, {user?.name?.split(' ')[0] || 'Buyer'}! 👋</h1>
            <p>Here's what's happening with your property search.</p>
        </div>
        <button className={style.browseBtn} onClick={() => handleNavigate('/buy')}>
            <Search size={18} /> Browse Homes
        </button>
      </header>

      {/* 2. STATS ROW */}
      <div className={style.statsGrid}>
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.1}} className={style.statCard}>
            <div className={`${style.iconBox} ${style.iconRed}`}><Heart size={24} /></div>
            <div>
                <h3>{favorites.length}</h3>
                <span>Saved Homes</span>
            </div>
        </motion.div>

        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.2}} className={style.statCard}>
            <div className={`${style.iconBox} ${style.iconBlue}`}><TrendingUp size={24} /></div>
            <div>
                <h3>{stats.viewed || 0}</h3>
                <span>Recently Viewed</span>
            </div>
        </motion.div>

        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.3}} className={style.statCard}>
            <div className={`${style.iconBox} ${style.iconGreen}`}><MessageSquare size={24} /></div>
            <div>
                <h3>{stats.contacted || 0}</h3>
                <span>Agents Contacted</span>
            </div>
        </motion.div>
      </div>

      {/* 3. MAIN CONTENT: WISHLIST */}
      <section className={style.section}>
        <div className={style.sectionHeader}>
            <h2>Your Wishlist</h2>
            {favorites.length > 0 && <span className={style.countBadge}>{favorites.length} Homes</span>}
        </div>

        {favorites.length === 0 ? (
            <div className={style.emptyState}>
                <div className={style.emptyIcon}><Home size={48} strokeWidth={1} /></div>
                <h3>No favorites yet</h3>
                <p>Start exploring and click the heart icon to save homes you love.</p>
                <button onClick={() => handleNavigate('/buy')}>Start Exploring</button>
            </div>
        ) : (
            <div className={style.grid}>
                {favorites.map((listing) => (
                    <motion.div 
                        key={listing.product_id}
                        layout
                        className={style.card}
                        onClick={() => navigate(`/listing/${listing.product_id}`)}
                        whileHover={{ y: -5 }}
                    >
                        <div className={style.imageWrapper}>
                            <img src={listing.photos?.[0]?.url || "/placeholder.png"} alt={listing.title} />
                            <button className={style.removeBtn} onClick={(e) => removeFavorite(e, listing.product_id)}>
                                <X size={16} />
                            </button>
                            <div className={style.statusBadge}>{listing.status === 'approved' ? 'Active' : 'Off Market'}</div>
                        </div>
                        
                        <div className={style.cardContent}>
                            <div className={style.priceRow}>
                                <span className={style.price}>{formatPrice(listing.price, listing.price_currency)}</span>
                                {listing.listing_type === 'Rent' && <span className={style.period}>/mo</span>}
                            </div>
                            
                            <h4 className={style.title}>{listing.title}</h4>
                            <div className={style.address}>
                                <MapPin size={14} /> {listing.address}, {listing.city}
                            </div>

                            <div className={style.metaRow}>
                                <span><Bed size={16} /> {listing.bedrooms}</span>
                                <span><Bath size={16} /> {listing.bathrooms}</span>
                                <span><Square size={16} /> {listing.square_footage} sqft</span>
                            </div>

                            <button className={style.contactBtn} onClick={(e) => { e.stopPropagation(); navigate('/messages', { state: { startChatWith: listing.agent_unique_id } }); }}>
                                Contact Agent
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        )}
      </section>

      {/* 4. AI RECOMMENDATIONS (Placeholder for future logic) */}
      <section className={style.section}>
        <div className={style.aiBanner}>
            <div className={style.aiContent}>
                <h3>Looking for something specific?</h3>
                <p>Our AI can analyze your favorites and find hidden gems you might have missed.</p>
            </div>
            <button className={style.aiBtn}>
                Run AI Matcher <ArrowRight size={16} />
            </button>
        </div>
      </section>

    </div>
  );
}