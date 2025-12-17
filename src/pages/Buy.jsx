import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import client from "../api/axios"; 
import { Link } from "react-router-dom";
import { 
  Search, 
  Loader2, 
  Heart, 
  ChevronDown, 
  MapPin, 
  Bed, 
  Bath, 
  Square,
  Mail
} from "lucide-react";
import Navbar from "../layout/Navbar"; // ✅ IMPORT NAVBAR
import style from "../styles/Buy.module.css"; 

// --- Fix Leaflet Default Icons ---
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const Buy = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Default Map Center (Atlanta, GA)
  const defaultCenter = [33.7490, -84.3880]; 

  useEffect(() => {
    const fetchBuyListings = async () => {
      try {
        setLoading(true);
        const res = await client.get("/api/listings/public?category=Sale"); 
        setProperties(res.data || []);
      } catch (err) {
        console.error("Error fetching properties:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBuyListings();
  }, []);

  return (
    <div className={style.pageWrapper}>
      
      {/* ✅ 1. NAVBAR ADDED HERE */}
      <Navbar />

      {/* --- 2. FILTER BAR --- */}
      <div className={style.filterBar}>
        <div className={style.searchContainer}>
          <input type="text" placeholder="Atlanta, GA" className={style.searchInput} />
          <button className={style.searchBtn}><Search size={18} /></button>
        </div>

        <div className={style.filters}>
          <button className={style.filterBtn}>For Sale <ChevronDown size={14}/></button>
          <button className={style.filterBtn}>Price <ChevronDown size={14}/></button>
          <button className={style.filterBtn}>Beds & Baths <ChevronDown size={14}/></button>
          <button className={style.filterBtn}>Home Type <ChevronDown size={14}/></button>
          <button className={style.filterBtn}>More <ChevronDown size={14}/></button>
          <button className={style.saveSearchBtn}>Save search</button>
        </div>
      </div>

      <div className={style.contentContainer}>
        
        {/* --- 3. LEFT SIDE: MAP --- */}
        <div className={style.mapSection}>
          <MapContainer 
            center={defaultCenter} 
            zoom={13} 
            scrollWheelZoom={true} 
            className={style.leafletMap}
            zoomControl={false} 
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {properties.map((prop) => {
              if (!prop.latitude || !prop.longitude) return null;
              return (
                <Marker key={prop.product_id} position={[prop.latitude, prop.longitude]}>
                  <Popup>
                    <div className={style.popup}>
                      <img src={prop.photos?.[0]?.url || "/placeholder.png"} alt="Home" />
                      <div className={style.popupInfo}>
                        <strong>{prop.price_currency} {Number(prop.price).toLocaleString()}</strong>
                        <p>{prop.bedrooms} bd | {prop.bathrooms} ba</p>
                        <Link to={`/listing/${prop.product_id}`}>View</Link>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* --- 4. RIGHT SIDE: LISTINGS GRID --- */}
        <div className={style.listSection}>
          <div className={style.listHeader}>
            <h1>Atlanta GA Real Estate & Homes For Sale</h1>
            <div className={style.resultsMeta}>
              <span>{properties.length} results</span>
              <button className={style.sortBtn}>Sort: Homes for You <ChevronDown size={14}/></button>
            </div>
          </div>

          {loading ? (
            <div className={style.loader}>
              <Loader2 className="animate-spin" size={40} color="#007983" />
            </div>
          ) : properties.length === 0 ? (
            <div className={style.empty}>
              <h3>No homes found</h3>
              <p>Try expanding your search area.</p>
            </div>
          ) : (
            <div className={style.cardGrid}>
              {properties.map((prop) => (
                <div key={prop.product_id} className={style.card}>
                  
                  {/* Image Area */}
                  <Link to={`/listing/${prop.product_id}`} className={style.cardImageWrapper}>
                    <img 
                      src={prop.photos?.[0]?.url || prop.photos?.[0] || "/placeholder.png"} 
                      alt={prop.title} 
                    />
                    <div className={style.cardOverlay}>
                      <span className={style.tag}>3D Tour</span>
                      <button className={style.favBtn}>
                        <Heart size={18} />
                      </button>
                    </div>
                  </Link>
                  
                  {/* Info Area */}
                  <div className={style.cardDetails}>
                    <div className={style.price}>
                      {prop.price_currency} {Number(prop.price).toLocaleString()}
                    </div>
                    
                    <div className={style.subTitle}>
                      {prop.address || "Address Hidden"}, {prop.city}
                    </div>

                    <div className={style.statsRow}>
                      <span className={style.statItem}><strong>{prop.bedrooms}</strong> bds</span>
                      <span className={style.divider}>|</span>
                      <span className={style.statItem}><strong>{prop.bathrooms}</strong> ba</span>
                      <span className={style.divider}>|</span>
                      <span className={style.statItem}><strong>{Number(prop.square_footage).toLocaleString()}</strong> sqft</span>
                      <span className={style.divider}>-</span>
                      <span className={style.type}>{prop.property_type || "House"} for sale</span>
                    </div>

                    {/* Action Buttons */}
                    <div className={style.cardActions}>
                      <button className={style.requestBtn}>
                        Request to tour
                      </button>
                      <button className={style.emailBtn}>
                        <Mail size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Buy;