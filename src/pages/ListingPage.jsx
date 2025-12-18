import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import client from "../api/axios"; 
import { Search, Loader2, Heart, ChevronDown, Bed, Bath, Square, Mail, Globe } from "lucide-react";
import Navbar from "../layout/Navbar"; 
import LeafletMapViewer from "../components/LeafletMapViewer"; 
import ListingModal from "../components/ListingModal";
import { getCurrencySymbol, formatPrice } from "../utils/format";
import style from "../styles/Buy.module.css"; 

const ListingPage = ({ pageType }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 📍 Hover State for Map Interaction
  const [hoveredId, setHoveredId] = useState(null);

  // 🔍 Filter States
  const [locationQuery, setLocationQuery] = useState("");
  const [countryQuery, setCountryQuery] = useState("");

  // 🔗 URL-Based Modal Logic
  const selectedProductId = searchParams.get("listing");
  
  const selectedListing = useMemo(() => 
    properties.find(p => p.product_id === selectedProductId), 
  [properties, selectedProductId]);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        const category = pageType === 'buy' ? 'Sale' : 'Rent';
        const res = await client.get("/api/listings/public", { params: { category } }); 
        setProperties(res.data || []);
      } catch (err) {
        console.error("Error fetching listings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [pageType]);

  const filteredProperties = properties.filter(p => {
    const matchLoc = !locationQuery || 
      (p.city + " " + p.address + " " + p.zip).toLowerCase().includes(locationQuery.toLowerCase());
    
    const pCountry = p.country || "";
    const matchCountry = !countryQuery || 
      pCountry.toLowerCase().includes(countryQuery.toLowerCase());
      
    return matchLoc && matchCountry;
  });

  const openModal = (id) => setSearchParams({ listing: id });
  const closeModal = () => setSearchParams({});

  return (
    <div className={style.pageWrapper}>
      <Navbar />
      
      {/* --- PROFESSIONAL FILTER BAR --- */}
      <div className={style.filterBar}>
        <div className={style.searchGroup}>
          <div className={style.searchContainer}>
            <Search size={16} className={style.searchIcon} />
            <input 
              type="text" 
              placeholder="Address, City, ZIP" 
              className={style.searchInput}
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
            />
          </div>
          
          <div className={style.searchContainer} style={{width: '160px'}}>
            <Globe size={16} className={style.searchIcon} />
            <input 
              type="text" 
              placeholder="Country" 
              className={style.searchInput}
              value={countryQuery}
              onChange={(e) => setCountryQuery(e.target.value)}
            />
          </div>
        </div>

        <div className={style.filters}>
          <button className={style.filterBtnActive}>
            For {pageType === 'buy' ? 'Sale' : 'Rent'} <ChevronDown size={14}/>
          </button>
          <button className={style.filterBtn}>Price <ChevronDown size={14}/></button>
          <button className={style.filterBtn}>Beds & Baths <ChevronDown size={14}/></button>
          <button className={style.filterBtn}>Home Type <ChevronDown size={14}/></button>
          <button className={style.saveSearchBtn}>Save Search</button>
        </div>
      </div>

      <div className={style.contentContainer}>
        
        {/* --- LEFT: MAP --- */}
        <div className={style.mapSection}>
          <LeafletMapViewer 
            properties={filteredProperties} 
            hoveredId={hoveredId} 
            onMarkerClick={openModal}
          />
        </div>

        {/* --- RIGHT: LIST --- */}
        <div className={style.listSection}>
          <div className={style.listHeader}>
            <div>
              <h1>{pageType === 'buy' ? 'Real Estate & Homes For Sale' : 'Apartments For Rent'}</h1>
              <p className={style.metaText}>{filteredProperties.length} listings found</p>
            </div>
            <button className={style.sortBtn}>Sort: Newest <ChevronDown size={14}/></button>
          </div>

          {loading ? (
            <div className={style.loader}><Loader2 className="animate-spin" size={32} color="#007983" /></div>
          ) : filteredProperties.length === 0 ? (
            <div className={style.empty}>
              <h3>No properties found</h3>
              <p>Try adjusting your search filters.</p>
            </div>
          ) : (
            <div className={style.cardGrid}>
              {filteredProperties.map((prop) => (
                <div 
                  key={prop.product_id} 
                  className={`${style.card} ${hoveredId === prop.product_id ? style.cardHovered : ""}`}
                  onMouseEnter={() => setHoveredId(prop.product_id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => openModal(prop.product_id)}
                >
                  {/* Image */}
                  <div className={style.cardImageWrapper}>
                    <img src={prop.photos?.[0]?.url || "/placeholder.png"} alt={prop.title} />
                    <div className={style.cardOverlay}>
                      <span className={style.badge}>{pageType === 'buy' ? 'For Sale' : 'For Rent'}</span>
                      <button className={style.favBtn} onClick={(e) => e.stopPropagation()}>
                        <Heart size={18} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className={style.cardDetails}>
                    <div className={style.priceRow}>
                      <span className={style.price}>
                        {getCurrencySymbol(prop.price_currency)}{formatPrice(prop.price)}
                        {pageType === 'rent' && <span className={style.period}>/mo</span>}
                      </span>
                    </div>
                    
                    <div className={style.subTitle}>{prop.address || "Address Hidden"}, {prop.city}</div>

                    <div className={style.statsRow}>
                      <span className={style.statItem}><strong>{prop.bedrooms}</strong> bds</span>
                      <span className={style.statItem}><strong>{prop.bathrooms}</strong> ba</span>
                      <span className={style.statItem}><strong>{formatPrice(prop.square_footage)}</strong> sqft</span>
                    </div>

                    <div className={style.cardActions}>
                      <button className={style.requestBtn}>
                        {pageType === 'buy' ? 'Request to tour' : 'Check Availability'}
                      </button>
                      <button className={style.emailBtn} onClick={(e) => e.stopPropagation()}>
                        <Mail size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL --- */}
      {selectedListing && (
        <ListingModal listing={selectedListing} onClose={closeModal} />
      )}
    </div>
  );
};

export default ListingPage;