import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/axios"; 
import { Heart, MapPin, Bed, Bath, Square, Trash2, Loader2, ArrowRight } from "lucide-react";
import { getCurrencySymbol, formatPrice } from "../utils/format"; 
import style from "../styles/BuyerFavorites.module.css"; // ✅ UPDATED CSS FILE NAME

const BuyerFavorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await client.get("/api/favorites/my-favorites");
        setFavorites(res.data || []);
      } catch (err) {
        console.error("Error fetching favorites:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  const removeFavorite = async (e, productId) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    // Optimistic UI Update
    setFavorites((prev) => prev.filter((f) => f.product_id !== productId));

    try {
      await client.post("/api/favorites/toggle", { product_id: productId });
    } catch (err) {
      console.error("Error removing favorite:", err);
    }
  };

  if (loading) {
    return (
      <div className={style.loaderContainer}>
        <Loader2 className="animate-spin" size={40} color="#09707D" />
      </div>
    );
  }

  return (
    <div className={style.pageWrapper}>
      <header className={style.header}>
        <div className={style.headerContent}>
          <h1>Saved Homes</h1>
          <span className={style.countBadge}>{favorites.length} Listings</span>
        </div>
        <p className={style.subHeader}>Your curated collection of dream properties.</p>
      </header>

      <div className={style.gridContainer}>
        {favorites.length > 0 ? (
          favorites.map((home) => (
            <Link to={`/listing/${home.product_id}`} key={home.product_id} className={style.card}>
              
              {/* --- IMAGE SECTION --- */}
              <div className={style.imageWrapper}>
                <img 
                  src={home.photos?.[0]?.url || "/placeholder.png"} 
                  alt={home.title} 
                  className={style.cardImage}
                />
                <div className={style.overlayGradient} />
                
                <div className={style.topBadges}>
                   <span className={style.statusBadge}>
                      {home.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                   </span>
                </div>

                <button 
                  className={style.removeBtn}
                  onClick={(e) => removeFavorite(e, home.product_id)}
                  title="Remove from favorites"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* --- DETAILS SECTION --- */}
              <div className={style.cardContent}>
                <div className={style.priceRow}>
                  <h3 className={style.price}>
                    {getCurrencySymbol(home.price_currency)}{formatPrice(home.price)}
                    {home.listing_type === 'rent' && <span className={style.period}>/mo</span>}
                  </h3>
                </div>

                <div className={style.addressRow}>
                  <MapPin size={16} className={style.icon} />
                  <p>{home.address}, {home.city}</p>
                </div>

                <div className={style.divider} />

                <div className={style.statsRow}>
                  <div className={style.statItem}>
                    <Bed size={18} />
                    <span><strong>{home.bedrooms}</strong> bds</span>
                  </div>
                  <div className={style.statItem}>
                    <Bath size={18} />
                    <span><strong>{home.bathrooms}</strong> ba</span>
                  </div>
                  <div className={style.statItem}>
                    <Square size={18} />
                    <span><strong>{formatPrice(home.square_footage)}</strong> sqft</span>
                  </div>
                </div>

                <div className={style.actionRow}>
                    <span className={style.viewDetails}>View Details <ArrowRight size={14}/></span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className={style.emptyState}>
            <div className={style.emptyIconCircle}>
                <Heart size={48} strokeWidth={1.5} />
            </div>
            <h3>No favorites yet</h3>
            <p>Start exploring and save the homes you love.</p>
            <Link to="/buy" className={style.browseBtn}>Browse Homes</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerFavorites;