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
import Navbar from "../layout/Navbar"; 
import style from "../styles/Buy.module.css"; // ✅ Reusing the same layout styles

// --- Fix Leaflet Icons ---
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const Rent = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Default Center (Atlanta, GA)
  const defaultCenter = [33.7490, -84.3880]; 

  useEffect(() => {
    const fetchRentalListings = async () => {
      try {
        setLoading(true);
        // ✅ API Call: Filter for 'Rent' category
        const res = await client.get("/api/listings/public?category=Rent"); 
        setProperties(res.data || []);
      } catch (err) {
        console.error("Error fetching rentals:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRentalListings();
  }, []);

  return (
    <div className={style.pageWrapper}>
      
      {/* 1. Navbar */}
      <Navbar />

      {/* 2. Filter Bar (Customized for Rentals) */}
      <div className={style.filterBar}>
        <div className={style.searchContainer}>
          <input type="text" placeholder="City, Neighborhood, ZIP" className={style.searchInput} />
          <button className={style.searchBtn}><Search size={18} /></button>
        </div>

        <div className={style.filters}>
          <button className={style.filterBtn}>For Rent <ChevronDown size={14}/></button>
          <button className={style.filterBtn}>Price / Month <ChevronDown size={14}/></button>
          <button className={style.filterBtn}>Beds & Baths <ChevronDown size={14}/></button>
          <button className={style.filterBtn}>Home Type <ChevronDown size={14}/></button>
          <button className={style.filterBtn}>Pets <ChevronDown size={14}/></button>
          <button className={style.saveSearchBtn}>Save search</button>
        </div>
      </div>

      <div className={style.contentContainer}>
        
        {/* 3. Left Side: Map */}
        <div className={style.mapSection}>
          <MapContainer 
            center={defaultCenter} 
            zoom={12} 
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
                        {/* Monthly Price Formatting */}
                        <strong>{prop.price_currency} {Number(prop.price).toLocaleString()}/mo</strong>
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

        {/* 4. Right Side: Listings List */}
        <div className={style.listSection}>
          <div className={style.listHeader}>
            <h1>Apartments & Houses For Rent</h1>
            <div className={style.resultsMeta}>
              <span>{properties.length} results</span>
              <button className={style.sortBtn}>Sort: Newest <ChevronDown size={14}/></button>
            </div>
          </div>

          {loading ? (
            <div className={style.loader}>
              <Loader2 className="animate-spin" size={40} color="#007983" />
            </div>
          ) : properties.length === 0 ? (
            <div className={style.empty}>
              <h3>No rentals found</h3>
              <p>Try adjusting your filters or search area.</p>
            </div>
          ) : (
            <div className={style.cardGrid}>
              {properties.map((prop) => (
                <div key={prop.product_id} className={style.card}>
                  
                  {/* Image */}
                  <Link to={`/listing/${prop.product_id}`} className={style.cardImageWrapper}>
                    <img 
                      src={prop.photos?.[0]?.url || prop.photos?.[0] || "/placeholder.png"} 
                      alt={prop.title} 
                    />
                    <div className={style.cardOverlay}>
                      <span className={style.tag}>For Rent</span>
                      <button className={style.favBtn}>
                        <Heart size={18} />
                      </button>
                    </div>
                  </Link>
                  
                  {/* Info */}
                  <div className={style.cardDetails}>
                    <div className={style.price}>
                      {prop.price_currency} {Number(prop.price).toLocaleString()}
                      <span style={{fontSize: "14px", fontWeight: "normal", color: "#666"}}>/mo</span>
                    </div>
                    
                    <div className={style.subTitle}>
                      {prop.address || "Address Hidden"}, {prop.city}
                    </div>

                    <div className={style.statsRow}>
                      <span className={style.statItem}><Bed size={16}/> <strong>{prop.bedrooms}</strong> bd</span>
                      <span className={style.divider}>|</span>
                      <span className={style.statItem}><Bath size={16}/> <strong>{prop.bathrooms}</strong> ba</span>
                      <span className={style.divider}>|</span>
                      <span className={style.statItem}><Square size={16}/> <strong>{Number(prop.square_footage).toLocaleString()}</strong> sqft</span>
                    </div>

                    {/* Rent-Specific Actions */}
                    <div className={style.cardActions}>
                      <button className={style.requestBtn}>
                        Check Availability
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

export default Rent;