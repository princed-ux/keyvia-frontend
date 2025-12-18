import React from "react";
import { useNavigate } from "react-router-dom";
import { X, Heart, Share2, MapPin, Bed, Bath, Square, Calendar, Check, Mail } from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getCurrencySymbol, formatPrice } from "../utils/format";
import style from "../styles/ListingModal.module.css"; 

// Fix Leaflet Icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const ListingModal = ({ listing, onClose }) => {
  const navigate = useNavigate();
  if (!listing) return null;

  const photos = listing.photos?.map(p => p.url) || [];
  while (photos.length < 5) photos.push("/placeholder.png");

  const handleAgentClick = () => {
    const id = listing.agent?.username || listing.agent?.unique_id || listing.agent_unique_id;
    if (id) navigate(`/user/${id}`);
  };

  return (
    <div className={style.overlay} onClick={onClose}>
      <div className={style.modalContainer} onClick={(e) => e.stopPropagation()}>
        <button className={style.closeBtn} onClick={onClose}><X size={20} /></button>

        {/* --- TOP: ZILLOW STYLE IMAGE GRID --- */}
        <div className={style.imageGrid}>
          <div className={style.mainImage}>
            <img src={photos[0]} alt="Main" />
          </div>
          <div className={style.subImages}>
            <img src={photos[1]} alt="Sub 1" />
            <img src={photos[2]} alt="Sub 2" />
            <img src={photos[3]} alt="Sub 3" />
            <img src={photos[4]} alt="Sub 4" />
          </div>
        </div>

        <div className={style.contentLayout}>
          {/* --- LEFT COLUMN: DETAILS --- */}
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

          {/* --- RIGHT COLUMN: STICKY AGENT CARD --- */}
          <div className={style.rightColumn}>
            <div className={style.stickyCard}>
              <div className={style.agentHeader} onClick={handleAgentClick}>
                <img src={listing.agent?.avatar_url || "/person.png"} alt="Agent" className={style.agentAvatar} />
                <div>
                  <h4>{listing.agent?.full_name || "Listing Agent"}</h4>
                  <p>{listing.agent?.agency_name || "Real Estate Pro"}</p>
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