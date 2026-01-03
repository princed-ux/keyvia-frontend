import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom"; // ✅ Added useNavigate
import client from "../api/axios"; 
import { Search, Loader2, Heart, ChevronDown, Mail, Globe, X, Maximize, AlertCircle, CheckCircle, WifiOff, Lock } from "lucide-react"; 
import Navbar from "../layout/Navbar"; 
import MapLibreMapViewer from "../components/MapLibreMapViewer";
import ListingModal from "../components/ListingModal";
import { getCurrencySymbol, formatPrice } from "../utils/format";
import style from "../styles/Buy.module.css"; 
import Swal from "sweetalert2"; // ✅ Ensure Swal is imported
import { useAuth } from "../context/AuthProvider"; // ✅ Import Auth Context

// --- 1. CUSTOM TOAST COMPONENT ---
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)",
      zIndex: 9999, display: "flex", alignItems: "center", gap: "10px",
      backgroundColor: type === "error" ? "#FEF2F2" : "#ECFDF5",
      border: `1px solid ${type === "error" ? "#FCA5A5" : "#6EE7B7"}`,
      padding: "12px 20px", borderRadius: "50px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
      animation: "slideDown 0.4s ease-out forwards",
      minWidth: "300px", maxWidth: "90%"
    }}>
      {type === "error" ? <AlertCircle size={20} color="#DC2626" /> : <CheckCircle size={20} color="#059669" />}
      <span style={{ fontSize: "14px", fontWeight: "600", color: type === "error" ? "#B91C1C" : "#065F46", flex: 1 }}>
        {message}
      </span>
      <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#666" }}>
        <X size={16} />
      </button>
      <style>{`@keyframes slideDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>
    </div>
  );
};

// --- HELPER: Dropdown Container ---
const FilterDropdown = ({ title, onClose, children, onApply, width = "300px" }) => (
  <div style={{
    position: "absolute", top: "100%", left: 0, marginTop: "8px",
    background: "white", border: "1px solid #ddd", borderRadius: "8px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)", zIndex: 1000, padding: "20px", width: width
  }}>
    <h4 style={{margin: "0 0 15px", fontSize:"14px", fontWeight:"700"}}>{title}</h4>
    {children}
    <div style={{display:"flex", justifyContent:"flex-end", marginTop:"20px", gap:"10px"}}>
      <button onClick={onClose} style={{background:"transparent", border:"none", cursor:"pointer", fontSize:"13px"}}>Cancel</button>
      <button onClick={onApply} style={{background:"#007983", color:"white", border:"none", padding:"8px 16px", borderRadius:"4px", cursor:"pointer", fontWeight:"bold"}}>Apply</button>
    </div>
  </div>
);

const ListingPage = ({ pageType }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth(); // ✅ Get User from Context
  const navigate = useNavigate();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);
  
  // ✅ NETWORK STATE
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // --- FILTERS ---
  const [locationQuery, setLocationQuery] = useState("");
  const [countryQuery, setCountryQuery] = useState(""); 
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [toast, setToast] = useState(null); 

  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [beds, setBeds] = useState("any");
  const [baths, setBaths] = useState("any");
  const [homeTypes, setHomeTypes] = useState([]);
  const [sqftRange, setSqftRange] = useState({ min: "", max: "" });
  const [sortOption, setSortOption] = useState("newest");
  const [flyToCoords, setFlyToCoords] = useState(null);

  const selectedProductId = searchParams.get("listing");
  const selectedListing = useMemo(() => properties.find(p => p.product_id === selectedProductId), [properties, selectedProductId]);

  // --- 0. NETWORK LISTENER ---
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- 1. INITIALIZE LOCATION ---
  useEffect(() => {
    const savedLoc = localStorage.getItem("lastMapLocation");
    if (savedLoc) {
        setFlyToCoords(JSON.parse(savedLoc));
    } else if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            setFlyToCoords({ lat: latitude, lng: longitude });
        }, () => console.log("Geo-location denied."));
    }
  }, []);

  // --- 2. FETCH LISTINGS ---
  const fetchListings = useCallback(async (params = {}) => {
    if (isOffline) return; // Don't fetch if offline
    try {
      setLoading(true);
      const category = pageType === 'buy' ? 'Sale' : 'Rent';
      const queryParams = { category, ...params };
      const res = await client.get("/api/listings/public", { params: queryParams }); 
      setProperties(res.data || []);
    } catch (err) {
      console.error("Error fetching listings:", err);
      // Optional: If API fails specifically due to network, trigger offline mode
      if (err.message === "Network Error") setIsOffline(true);
    } finally {
      setLoading(false);
    }
  }, [pageType, isOffline]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  // --- 3. FILTER LOGIC ---
  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      const matchLoc = !locationQuery || 
        (p.city + " " + p.address + " " + p.zip + " " + (p.country || "")).toLowerCase().includes(locationQuery.toLowerCase());
      const pCountry = p.country || "";
      const matchCountry = !countryQuery || pCountry.toLowerCase().includes(countryQuery.toLowerCase());
      const price = parseFloat(p.price);
      const minP = priceRange.min ? parseFloat(priceRange.min) : 0;
      const maxP = priceRange.max ? parseFloat(priceRange.max) : Infinity;
      const matchPrice = price >= minP && price <= maxP;
      const pBeds = parseInt(p.bedrooms) || 0;
      const matchBeds = beds === "any" ? true : pBeds >= parseInt(beds);
      const pBaths = parseInt(p.bathrooms) || 0;
      const matchBaths = baths === "any" ? true : pBaths >= parseInt(baths);
      const matchType = homeTypes.length === 0 || homeTypes.includes(p.listing_type || "House");
      const sqft = parseFloat(p.square_footage) || 0;
      const minSq = sqftRange.min ? parseFloat(sqftRange.min) : 0;
      const maxSq = sqftRange.max ? parseFloat(sqftRange.max) : Infinity;
      const matchSqft = sqft >= minSq && sqft <= maxSq;

      return matchLoc && matchCountry && matchPrice && matchBeds && matchBaths && matchType && matchSqft;
    }).sort((a, b) => {
      if (sortOption === "price_asc") return parseFloat(a.price) - parseFloat(b.price);
      if (sortOption === "price_desc") return parseFloat(b.price) - parseFloat(a.price);
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [properties, locationQuery, countryQuery, priceRange, beds, baths, homeTypes, sqftRange, sortOption]);

  useEffect(() => {
    if (hoveredId && !filteredProperties.find(p => p.product_id === hoveredId)) {
      setHoveredId(null);
    }
  }, [filteredProperties, hoveredId]);

  // --- 4. SMART SEARCH ---
  const handleAddressSearch = async () => {
    setToast(null);
    let query = locationQuery;
    if (countryQuery) query = query ? `${query}, ${countryQuery}` : countryQuery;
    if (!query) return;

    fetchListings({ search: query });

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1`);
      const data = await res.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const resultName = result.display_name.toLowerCase();
        
        const missingAddress = locationQuery && !resultName.includes(locationQuery.toLowerCase());
        const missingCountry = countryQuery && !resultName.includes(countryQuery.toLowerCase());

        if (missingAddress || missingCountry) {
            setToast({
                type: "error",
                message: `Could not find "${locationQuery}" in ${countryQuery || "the specified area"}.`
            });
            return;
        }

        const newCoords = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
        localStorage.setItem("lastMapLocation", JSON.stringify(newCoords));
        setFlyToCoords(newCoords);
        
      } else {
        setToast({ type: "error", message: "Location not found. Please check spelling." });
      }
    } catch (error) { 
        console.error("Geocoding failed:", error);
        setToast({ type: "error", message: "Unable to search map location." });
    }
  };

  const handleMapSearch = (bounds) => {
    fetchListings({ minLat: bounds.south, maxLat: bounds.north, minLng: bounds.west, maxLng: bounds.east });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAddressSearch();
  };

  // ✅ AUTH GATING HELPER
  // This function checks if user is logged in. If not, prompts signup.
  const handleAuthAction = (actionCallback) => {
    if (!user) {
        Swal.fire({
            title: "Join Keyvia!",
            text: "Sign up to favorite homes, contact agents, and get the full experience.",
            icon: "info",
            showCancelButton: true,
            confirmButtonColor: "#09707D",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sign Up Now",
            cancelButtonText: "Not now"
        }).then((result) => {
            if (result.isConfirmed) {
                navigate("/signup"); // Redirect to signup
            }
        });
        return;
    }
    // If logged in, proceed with action
    actionCallback();
  };

  const toggleFavorite = async (e, listingId) => {
    e.stopPropagation();
    
    // ✅ WRAP IN AUTH CHECK
    handleAuthAction(async () => {
        setProperties(prev => prev.map(p => p.product_id === listingId ? { ...p, is_favorited: !p.is_favorited } : p));
        try { await client.post(`/api/favorites/toggle`, { product_id: listingId }); } 
        catch (err) { console.error(err); }
    });
  };

  const openModal = (id) => setSearchParams({ listing: id });
  const closeModal = () => setSearchParams({});
  const toggleDropdown = (name) => setActiveDropdown(activeDropdown === name ? null : name);

  // --- RENDER ---

  // 🔴 NETWORK ERROR FULL PAGE OVERLAY
  if (isOffline) {
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: '#ffffff', zIndex: 99999,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', padding: '20px'
        }}>
            <div style={{
                backgroundColor: '#fee2e2', padding: '30px', borderRadius: '50%', marginBottom: '20px',
                boxShadow: '0 0 0 20px #fef2f2'
            }}>
                <WifiOff size={64} color="#dc2626" />
            </div>
            <h1 style={{ color: '#1f2937', fontSize: '24px', marginBottom: '10px' }}>No Internet Connection</h1>
            <p style={{ color: '#6b7280', maxWidth: '400px', lineHeight: '1.6' }}>
                It looks like you've lost your connection. Please check your internet settings. We'll try to reconnect automatically.
            </p>
            <button 
                onClick={() => window.location.reload()} 
                style={{
                    marginTop: '30px', padding: '12px 24px', backgroundColor: '#09707D', color: 'white',
                    border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '16px'
                }}
            >
                Try Again
            </button>
        </div>
    );
  }

  return (
    <div className={style.pageWrapper}>
      <Navbar />
      
      {/* ✅ RENDER TOAST HERE */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className={style.filterBar} style={{zIndex: 20}}>
        <div className={style.searchGroup}>
          <div className={style.searchContainer}>
            <Search size={16} className={style.searchIcon} />
            <input 
              type="text" placeholder="Address, City, ZIP" className={style.searchInput}
              value={locationQuery} 
              onChange={(e) => setLocationQuery(e.target.value)}
              onKeyDown={handleKeyDown} 
            />
            {locationQuery && <button onClick={()=>setLocationQuery("")} style={{border:"none",background:"transparent",cursor:"pointer"}}><X size={14}/></button>}
          </div>

          <div className={style.searchContainer} style={{width: '160px'}}>
             <Globe size={16} className={style.searchIcon} />
             <input 
               type="text" placeholder="Country" className={style.searchInput}
               value={countryQuery} onChange={(e) => setCountryQuery(e.target.value)}
               onKeyDown={handleKeyDown}
             />
             {countryQuery && <button onClick={()=>setCountryQuery("")} style={{border:"none",background:"transparent",cursor:"pointer"}}><X size={14}/></button>}
          </div>
        </div>

        <div className={style.filters}>
          <div style={{position: "relative"}}>
            <button className={`${style.filterBtn} ${priceRange.min || priceRange.max ? style.active : ""}`} onClick={() => toggleDropdown("price")}>Price <ChevronDown size={14}/></button>
            {activeDropdown === "price" && (
              <FilterDropdown title="Price Range" onClose={() => setActiveDropdown(null)} onApply={() => setActiveDropdown(null)}>
                <div style={{display: "flex", gap: "10px", alignItems: "center"}}>
                  <input type="number" placeholder="Min" className={style.inputSmall} value={priceRange.min} onChange={(e)=>setPriceRange({...priceRange, min: e.target.value})} />
                  <span>-</span>
                  <input type="number" placeholder="Max" className={style.inputSmall} value={priceRange.max} onChange={(e)=>setPriceRange({...priceRange, max: e.target.value})} />
                </div>
              </FilterDropdown>
            )}
          </div>

          <div style={{position: "relative"}}>
            <button className={`${style.filterBtn} ${beds !== "any" || baths !== "any" ? style.active : ""}`} onClick={() => toggleDropdown("beds")}>Beds & Baths <ChevronDown size={14}/></button>
            {activeDropdown === "beds" && (
              <FilterDropdown title="Bedrooms & Bathrooms" onClose={() => setActiveDropdown(null)} onApply={() => setActiveDropdown(null)}>
                <div style={{marginBottom: "15px"}}>
                  <label style={{display:"block", fontSize:"12px", marginBottom:"5px", color:"#666"}}>Bedrooms</label>
                  <div className={style.pillGroup}>
                    {["any", "1", "2", "3", "4", "5"].map(num => (
                      <button key={num} className={beds === num ? style.pillActive : style.pill} onClick={() => setBeds(num)}>{num === "any" ? "Any" : `${num}+`}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{display:"block", fontSize:"12px", marginBottom:"5px", color:"#666"}}>Bathrooms</label>
                  <div className={style.pillGroup}>
                    {["any", "1", "2", "3", "4", "5"].map(num => (
                      <button key={num} className={baths === num ? style.pillActive : style.pill} onClick={() => setBaths(num)}>{num === "any" ? "Any" : `${num}+`}</button>
                    ))}
                  </div>
                </div>
              </FilterDropdown>
            )}
          </div>

          <div style={{position: "relative"}}>
            <button className={`${style.filterBtn} ${homeTypes.length > 0 ? style.active : ""}`} onClick={() => toggleDropdown("type")}>Home Type <ChevronDown size={14}/></button>
            {activeDropdown === "type" && (
              <FilterDropdown title="Property Type" onClose={() => setActiveDropdown(null)} onApply={() => setActiveDropdown(null)}>
                <div style={{display:"flex", flexDirection:"column", gap:"8px"}}>
                  {["House", "Apartment", "Condo", "Townhouse", "Land"].map(type => (
                    <label key={type} style={{display:"flex", alignItems:"center", gap:"8px", cursor:"pointer", fontSize:"14px"}}>
                      <input type="checkbox" checked={homeTypes.includes(type)} onChange={(e) => {
                          if (e.target.checked) setHomeTypes([...homeTypes, type]);
                          else setHomeTypes(homeTypes.filter(t => t !== type));
                        }} />
                      {type}
                    </label>
                  ))}
                </div>
              </FilterDropdown>
            )}
          </div>

          <div style={{position: "relative"}}>
             <button className={`${style.filterBtn} ${sqftRange.min || sqftRange.max ? style.active : ""}`} onClick={() => toggleDropdown("more")}>More <ChevronDown size={14}/></button>
             {activeDropdown === "more" && (
                <FilterDropdown title="More Filters" onClose={() => setActiveDropdown(null)} onApply={() => setActiveDropdown(null)}>
                   <div>
                      <label style={{display:"flex", alignItems:"center", gap: "6px", fontSize:"13px", fontWeight:"600", marginBottom: "8px"}}><Maximize size={14}/> Square Footage</label>
                      <div style={{display: "flex", gap: "10px", alignItems: "center"}}>
                         <input type="number" placeholder="Min SqFt" className={style.inputSmall} value={sqftRange.min} onChange={(e)=>setSqftRange({...sqftRange, min: e.target.value})} />
                         <span>-</span>
                         <input type="number" placeholder="Max SqFt" className={style.inputSmall} value={sqftRange.max} onChange={(e)=>setSqftRange({...sqftRange, max: e.target.value})} />
                      </div>
                   </div>
                </FilterDropdown>
             )}
          </div>

          <button className={style.saveSearchBtn}>Save Search</button>
        </div>
      </div>

      <div className={style.contentContainer}>
        <div className={style.mapSection}>
          <MapLibreMapViewer
            properties={filteredProperties} 
            hoveredId={hoveredId}
            onMarkerClick={openModal}
            onSearchArea={handleMapSearch} 
            flyToCoords={flyToCoords} 
          />
        </div>

        <div className={style.listSection}>
          <div className={style.listHeader}>
            <div>
              <h1>{pageType === 'buy' ? 'Real Estate & Homes For Sale' : 'Apartments For Rent'}</h1>
              <p className={style.metaText}>{loading ? "Loading..." : `${filteredProperties.length} listings found`}</p>
            </div>
            
            <div style={{position:"relative"}}>
               <button className={style.sortBtn} onClick={() => toggleDropdown("sort")}>
                 Sort: {sortOption === "newest" ? "Newest" : sortOption === "price_asc" ? "Price (Low)" : "Price (High)"} <ChevronDown size={14}/>
               </button>
               {activeDropdown === "sort" && (
                 <div style={{ position:"absolute", top:"100%", right:0, marginTop:"5px", background:"white", border:"1px solid #ddd", borderRadius:"8px", boxShadow:"0 5px 15px rgba(0,0,0,0.1)", zIndex:100, width:"150px" }}>
                    {[{l: "Newest", v: "newest"}, {l: "Price (High to Low)", v: "price_desc"}, {l: "Price (Low to High)", v: "price_asc"}].map(opt => (
                      <div key={opt.v} onClick={()=>{ setSortOption(opt.v); setActiveDropdown(null); }} style={{padding:"10px", cursor:"pointer", fontSize:"13px", borderBottom:"1px solid #eee"}}>{opt.l}</div>
                    ))}
                 </div>
               )}
            </div>
          </div>

          {loading ? (
            <div className={style.loader}><Loader2 className="animate-spin" size={32} color="#007983" /></div>
          ) : filteredProperties.length === 0 ? (
            <div className={style.empty}>
              <h3>No properties match your filters</h3>
              <button onClick={() => { setPriceRange({min:"", max:""}); setBeds("any"); setBaths("any"); setHomeTypes([]); setLocationQuery(""); setCountryQuery(""); setSqftRange({min:"", max:""}); }} style={{color: "#007983", textDecoration: "underline", background: "none", border: "none", cursor: "pointer"}}>Clear all filters</button>
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
                  <div className={style.cardImageWrapper}>
                    <img src={prop.photos?.[0]?.url || "/placeholder.png"} alt={prop.title} />
                    <div className={style.cardOverlay}>
                        <span className={style.badge} title={prop.title}>
                            {prop.title.length > 25 ? prop.title.substring(0, 25) + "..." : prop.title}
                        </span>

                        <button className={style.favBtn} onClick={(e) => toggleFavorite(e, prop.product_id)}>
                            <Heart size={18} fill={prop.is_favorited ? "#09707d" : "none"} color={prop.is_favorited ? "#09707d" : "#666"} />
                        </button>
                    </div>
                  </div>
                  <div className={style.cardDetails}>
                    <div className={style.priceRow}>
                      <span className={style.price}>{getCurrencySymbol(prop.price_currency)}{formatPrice(prop.price)}{pageType === 'rent' && <span className={style.period}>/mo</span>}</span>
                    </div>
                    <div className={style.subTitle}>{prop.address || "Address Hidden"}, {prop.city}</div>
                    <div className={style.statsRow}>
                      <span className={style.statItem}><strong>{prop.bedrooms}</strong> bds</span>
                      <span className={style.statItem}><strong>{prop.bathrooms}</strong> ba</span>
                      <span className={style.statItem}><strong>{formatPrice(prop.square_footage)}</strong> sqft</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* ✅ PASS AUTH AND ACTION HANDLER TO MODAL */}
      {selectedListing && (
        <ListingModal 
            listing={selectedListing} 
            onClose={closeModal} 
            currentUser={user} // Pass user
            onActionAttempt={handleAuthAction} // Pass the gating function
        />
      )}
      
      <style>{`.active { background-color: #e6f7f8 !important; color: #007983 !important; border-color: #007983 !important; }`}</style>
    </div>
  );
};

export default ListingPage;