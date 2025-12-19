import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin, Bed, Bath, Square, Trash2 } from "lucide-react";
import style from "../styles/BuyerDashboard.module.css"; // Reuse dashboard styles

const BuyerFavorites = () => {
  // Mock Data
  const [favorites, setFavorites] = useState([
    {
      id: "PRD-001",
      title: "Luxury Condo in Midtown",
      price: "$450,000",
      image: "/placeholder.png",
      address: "123 Peachtree St, Atlanta, GA",
      beds: 3, baths: 2, sqft: 1500
    },
    {
      id: "PRD-002",
      title: "Cozy Family Home",
      price: "$320,000",
      image: "/placeholder.png",
      address: "45 Westside Blvd, Atlanta, GA",
      beds: 2, baths: 2, sqft: 1200
    }
  ]);

  const removeFavorite = (id) => {
    setFavorites(favorites.filter(f => f.id !== id));
  };

  return (
    <div className={style.pageWrapper}>
      <header className={style.header}>
        <div>
          <h1>My Favorites</h1>
          <p>Homes you have saved for later.</p>
        </div>
      </header>

      <div className={style.homesGrid}>
        {favorites.length > 0 ? (
          favorites.map((home) => (
            <div key={home.id} className={style.homeCard}>
              <Link to={`/listing/${home.id}`} className={style.imageWrapper}>
                <img src={home.image} alt={home.title} />
                <button 
                  className={style.removeBtn}
                  onClick={(e) => {
                    e.preventDefault();
                    removeFavorite(home.id);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </Link>
              
              <div className={style.cardDetails}>
                <div className={style.price}>{home.price}</div>
                <div className={style.address}>{home.address}</div>
                
                <div className={style.metaRow}>
                  <span><Bed size={14}/> {home.beds}</span>
                  <span><Bath size={14}/> {home.baths}</span>
                  <span><Square size={14}/> {home.sqft} sqft</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={style.emptyState}>
            <Heart size={48} className={style.emptyIcon} />
            <h3>No saved homes yet</h3>
            <p>Start browsing to save your dream home!</p>
            <Link to="/buy" className={style.browseBtn}>Browse Homes</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerFavorites;