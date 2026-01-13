import React, { useEffect, useRef, useState, useMemo } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import style from "../styles/propertyForm.module.css";
import { 
  X, UploadCloud, Video, Globe, CheckCircle, 
  MapPin, DollarSign, Euro, PoundSterling, JapaneseYen,
  Home, User, Mail, Phone, Calendar, Loader2, ChevronDown, AlertCircle
} from "lucide-react";
import { useAuth } from "../context/AuthProvider.jsx";

// 1. DATA
import { COUNTRIES } from "../data/countries"; 
import { State, City } from "country-state-city"; 

// =========================================================
// 2. CONFIG
// =========================================================

const COUNTRY_TO_CURRENCY = {
  "Nigeria": "NGN", "United States": "USD", "United Kingdom": "GBP",
  "China": "CNY", "Russia": "RUB", "Japan": "JPY", "India": "INR",
  "Canada": "CAD", "South Africa": "ZAR", "United Arab Emirates": "AED",
  "Germany": "EUR", "France": "EUR", "Spain": "EUR", "Italy": "EUR"
};

const AVAILABLE_CURRENCIES = [
  { code: "USD", flag: "🇺🇸", symbol: "$" }, 
  { code: "EUR", flag: "🇪🇺", symbol: "€" }, 
  { code: "GBP", flag: "🇬🇧", symbol: "£" },
  { code: "NGN", flag: "🇳🇬", symbol: "₦" }, 
  { code: "CNY", flag: "🇨🇳", symbol: "¥" }, 
  { code: "RUB", flag: "🇷🇺", symbol: "₽" },
  { code: "JPY", flag: "🇯🇵", symbol: "¥" }, 
  { code: "CAD", flag: "🇨🇦", symbol: "$" }, 
  { code: "ZAR", flag: "🇿🇦", symbol: "R" },
  { code: "AED", flag: "🇦🇪", symbol: "dh" }
];

const getCurrencyIcon = (code) => {
  switch (code) {
    case "USD": case "CAD": case "AUD": return DollarSign;
    case "EUR": return Euro;
    case "GBP": return PoundSterling;
    case "JPY": case "CNY": return JapaneseYen;
    default: return null;
  }
};

const getCurrencyTextSymbol = (code) => {
  const c = AVAILABLE_CURRENCIES.find(x => x.code === code);
  return c ? c.symbol : "$";
};

// =========================================================
// 3. CUSTOM COMPONENTS
// =========================================================

// --- Smart Select (Allows Typing Custom Values) ---
const SearchableSelect = ({ label, options, value, onChange, placeholder, disabled, error, id, icon: Icon, allowCustom = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (value) {
      const selected = options.find(o => String(o.value) === String(value));
      setSearch(selected ? selected.label : value);
    } else {
      setSearch("");
    }
  }, [value]); 

  const filteredOptions = options.filter(o => 
    String(o.label).toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        // ✅ CRITICAL: If custom value typed, save it on blur
        if (allowCustom && search && !filteredOptions.find(o => o.label === search)) {
             onChange(search); 
        } else if (value) {
             const selected = options.find(o => String(o.value) === String(value));
             setSearch(selected ? selected.label : value);
        } else {
             setSearch("");
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef, value, search, allowCustom]);

  const handleSelect = (optionValue, optionLabel) => {
    onChange(optionValue);
    setSearch(optionLabel);
    setIsOpen(false);
  };

  return (
    <div className={style.formGroup} ref={wrapperRef}>
      {label && <label htmlFor={id} className={style.label}>{label}</label>}
      <div className={`${style.searchableWrapper} ${error ? style.errorWrapper : ''} ${disabled ? style.disabledWrapper : ''}`}>
        
        {Icon && <Icon size={18} className={style.inputIcon} />}
        
        <input
          id={id}
          type="text"
          className={`${style.searchableInput} ${Icon ? style.hasIcon : ''}`}
          placeholder={placeholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
            if (allowCustom) onChange(e.target.value); 
          }}
          onFocus={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          autoComplete="off"
        />
        <ChevronDown size={16} className={`${style.selectArrow} ${isOpen ? style.rotate : ''}`} />
        
        {isOpen && !disabled && filteredOptions.length > 0 && (
          <ul className={style.optionsList}>
            {filteredOptions.map((opt, idx) => (
              <li 
                key={`${opt.value}-${idx}`} 
                className={style.optionItem}
                onClick={() => handleSelect(opt.value, opt.label)}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <span className={style.errorText}>{error}</span>}
    </div>
  );
};

// --- OSM Address Autocomplete (Fixed: Returns Coords) ---
const OSMAddressAutocomplete = ({ value, onChange, onSelectAddress, disabled, error, context }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (value && value.length > 3 && showDropdown) {
        setIsLoading(true);
        try {
          let query = value;
          // Context biasing
          if (context?.city && !value.toLowerCase().includes(context.city.toLowerCase())) {
             query += `, ${context.city}`;
          }
          if (context?.country) query += `, ${context.country}`;
          
          const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`;
          
          const res = await fetch(url);
          const data = await res.json();
          setSuggestions(data);
        } catch (err) {
          console.error("OSM Error:", err);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [value, showDropdown]); 

  const handleSelect = (item) => {
    const display = item.display_name; 
    const zip = item.address?.postcode || "";
    const lat = item.lat;
    const lon = item.lon;
    
    onSelectAddress(display, zip, lat, lon);
    setShowDropdown(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={style.formGroup} ref={wrapperRef}>
      <label className={style.label}>
        Full Address <span style={{color:'#ef4444'}}>*</span> 
        {disabled && <span style={{fontWeight:'normal', color:'#94a3b8', fontSize:'0.75rem', marginLeft:5}}>(Select City First)</span>}
      </label>
      
      <div className={`${style.searchableWrapper} ${error ? style.errorWrapper : ''} ${disabled ? style.disabledWrapper : ''}`}>
        <MapPin size={18} className={style.inputIcon} />
        
        <input
          type="text"
          className={`${style.searchableInput} ${style.hasIcon}`}
          placeholder={disabled ? "🚫 Select City/State above first..." : "Type street address..."}
          value={typeof value === 'string' ? value : ""} 
          onChange={(e) => {
            onChange(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => !disabled && setShowDropdown(true)}
          disabled={disabled}
          autoComplete="off"
        />
        
        {isLoading && (
          <div style={{position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)'}}>
             <Loader2 size={18} className="animate-spin" color="#09707d" />
          </div>
        )}
        
        {showDropdown && !disabled && (
          <div className={style.optionsList}>
             {!isLoading && suggestions.length === 0 && value.length > 3 && (
                <div className={style.optionItem} style={{cursor:'default', color:'#ef4444'}}>
                   No match. Type fully or check spelling.
                </div>
             )}

             {!isLoading && suggestions.map((item, idx) => (
              <div key={idx} className={style.optionItem} onClick={() => handleSelect(item)}>
                {item.display_name}
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <span className={style.errorText}>{error}</span>}
    </div>
  );
};

// --- Standard Input ---
const InputGroup = ({ 
  id, label, type = "text", placeholder, value, onChange, 
  error, disabled, icon: Icon, symbol, optional = false, style: customStyle, ...props 
}) => (
  <div className={style.formGroup} style={customStyle}>
    {label && (
      <label htmlFor={id} className={style.label}>
        {label} {optional && <span className={style.optionalText}>(Optional)</span>}
      </label>
    )}
    <div className={`${style.inputWrapper} ${disabled ? style.disabledWrapper : ''} ${error ? style.errorWrapper : ''}`}>
      {Icon && <Icon size={18} className={style.inputIcon} />}
      {!Icon && symbol && <span className={style.inputSymbol}>{symbol}</span>}
      
      <input
        id={id}
        type={type}
        className={`${style.input} ${(Icon || symbol) ? style.hasIcon : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...props}
      />
    </div>
    {error && <span className={style.errorText}>{error}</span>}
  </div>
);

// =========================================================
// 4. MAIN FORM LOGIC
// =========================================================

const initialState = {
  title: "", price: "", pricePeriod: "month", priceCurrency: "USD",
  country: "", state: "", city: "", zipCode: "", address: "",
  latitude: "", longitude: "", 
  propertyType: "", listingType: "", bedrooms: "", bathrooms: "",
  yearBuilt: "", parking: "", squareFootage: "", furnishing: "",
  description: "", photos: [], video: null, virtualTour: null,
  contactName: "", contactEmail: "", contactPhone: "", contactMethod: "email",
  features: {
    ac: false, laundry: false, balcony: false, pets: false, pool: false,
    fireplace: false, smart: false, closet: false, security: false,
    gym: false, wifi: false,
  }
};

function mapInitialToForm(initial = {}) {
  const f = { ...initialState };
  if (!initial) return f;
  Object.keys(initial).forEach(key => { if(f.hasOwnProperty(key)) f[key] = initial[key]; });
  
  f.pricePeriod = initial.price_period || "month";
  f.priceCurrency = initial.price_currency || "USD";
  f.zipCode = initial.zip_code || "";
  f.latitude = initial.latitude || ""; 
  f.longitude = initial.longitude || "";
  f.propertyType = initial.property_type || "";
  f.listingType = initial.listing_type || "";
  f.yearBuilt = initial.year_built || "";
  f.squareFootage = initial.square_footage || "";
  f.contactName = initial.contact_name || "";
  f.contactEmail = initial.contact_email || "";
  f.contactPhone = initial.contact_phone || "";
  
  let parsedFeatures = initial.features;
  if (typeof parsedFeatures === 'string') { try { parsedFeatures = JSON.parse(parsedFeatures); } catch (e) {} }
  if (Array.isArray(parsedFeatures)) {
    const featureObj = {};
    Object.keys(initialState.features).forEach(k => featureObj[k] = false);
    parsedFeatures.forEach(key => { if (typeof key === 'string') featureObj[key.toLowerCase()] = true; });
    f.features = featureObj;
  } else if (typeof parsedFeatures === 'object' && parsedFeatures !== null) {
    f.features = { ...initialState.features, ...parsedFeatures };
  }

  f.photos = Array.isArray(initial.photos) ? initial.photos : [];
  return f;
}

const PropertyForm = ({ closeBtn, initialData, submitListing }) => {
  const { user } = useAuth();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [videoPreview, setVideoPreview] = useState(null);
  const [virtualPreview, setVirtualPreview] = useState(null);

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const virtualInputRef = useRef(null);

  // --- MEMOS ---

  const currentCountryIso = useMemo(() => {
    const c = COUNTRIES.find(x => x.name === form.country);
    return c ? c.iso.toUpperCase() : "US"; 
  }, [form.country]);

  const countryFlagUrl = useMemo(() => {
    const c = COUNTRIES.find(x => x.name === form.country);
    return c ? c.flag : null;
  }, [form.country]);

  const currencyOptions = useMemo(() => {
    const userCurrency = COUNTRY_TO_CURRENCY[form.country] || "USD";
    const sorted = [...AVAILABLE_CURRENCIES].sort((a, b) => {
      if (a.code === userCurrency) return -1;
      if (b.code === userCurrency) return 1;
      if (a.code === "USD") return -1;
      if (b.code === "USD") return 1;
      return 0;
    });
    return sorted.map(c => ({ value: c.code, label: `${c.flag} ${c.code}` }));
  }, [form.country]);

  const PriceIcon = getCurrencyIcon(form.priceCurrency);
  const priceSymbol = getCurrencyTextSymbol(form.priceCurrency);

  const stateOptions = useMemo(() => {
    if (!currentCountryIso) return [];
    const states = State.getStatesOfCountry(currentCountryIso);
    return states.map(s => ({ value: s.name, label: s.name, isoCode: s.isoCode }));
  }, [currentCountryIso]);

  const hasStates = stateOptions.length > 0;

  const cityOptions = useMemo(() => {
    if (!currentCountryIso) return [];
    if (hasStates) {
        if (!form.state) return [];
        const stateObj = stateOptions.find(s => s.value === form.state);
        if (!stateObj) return [];
        const cities = City.getCitiesOfState(currentCountryIso, stateObj.isoCode);
        return cities.map(c => ({ value: c.name, label: c.name }));
    } else {
        const cities = City.getCitiesOfCountry(currentCountryIso);
        return cities.map(c => ({ value: c.name, label: c.name }));
    }
  }, [form.state, currentCountryIso, hasStates, stateOptions]);


  // --- INIT ---
  useEffect(() => {
    if (initialData) {
      setForm(mapInitialToForm(initialData));
      if (initialData.photos) setPhotoPreviews(initialData.photos.map(p => typeof p === "string" ? p : p.url));
    } else if (user) {
      setForm(prev => ({
        ...prev,
        country: user.country || "",
        contactName: user.full_name || user.name || "",
        contactEmail: user.email || "",
        contactPhone: user.phone || ""
      }));
    }
  }, [initialData, user]);

  useEffect(() => {
    return () => {
      photoPreviews.forEach(url => { if (typeof url === "string" && url.startsWith("blob:")) URL.revokeObjectURL(url) });
      if (videoPreview?.startsWith("blob:")) URL.revokeObjectURL(videoPreview);
      if (virtualPreview?.startsWith("blob:")) URL.revokeObjectURL(virtualPreview);
    };
  }, [photoPreviews, videoPreview, virtualPreview]);

  // --- HANDLERS ---
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  // ✅ CAPTURE COORDS FROM OSM
  const handleOSMSelect = (fullAddress, postCode, lat, lon) => {
      setForm(prev => ({ 
          ...prev, 
          address: fullAddress, 
          zipCode: postCode || prev.zipCode,
          latitude: lat, 
          longitude: lon
      }));
      setErrors(prev => ({ ...prev, address: null }));
  };

  const handlePhotoPick = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setForm(prev => ({ ...prev, photos: [...prev.photos, ...files].slice(0, 15) }));
    setPhotoPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))].slice(0, 15));
    setErrors(prev => ({ ...prev, photos: undefined }));
    e.target.value = "";
  };

  const removePhotoAt = (i) => {
    setForm(prev => { const c = [...prev.photos]; c.splice(i, 1); return { ...prev, photos: c }; });
    setPhotoPreviews(prev => { const c = [...prev]; c.splice(i, 1); return c; });
  };

  const handleVideoPick = (e) => {
    const file = e.target.files?.[0];
    if (file) { update("video", file); setVideoPreview(URL.createObjectURL(file)); }
    e.target.value = "";
  };

  const handleVirtualPick = (e) => {
    const file = e.target.files?.[0];
    if (file) { update("virtualTour", file); setVirtualPreview(URL.createObjectURL(file)); }
    e.target.value = "";
  };

  const toggleFeature = (key) => {
    if (loading) return; 
    setForm((prev) => ({ ...prev, features: { ...prev.features, [key]: !prev.features[key] } }));
  };

  const validateAll = () => {
    const next = {};
    if (!form.title || form.title.length < 3) next.title = "Required";
    if (!form.price || Number(form.price) <= 0) next.price = "Required";
    if (!form.listingType) next.listingType = "Required";
    if (!form.propertyType) next.propertyType = "Required";
    
    if (!form.country) next.country = "Required";
    if (hasStates && !form.state) next.state = "Required"; 
    if (!form.city) next.city = "Required"; 
    if (!form.address || form.address.length < 5) next.address = "Required";

    if (!form.bedrooms) next.bedrooms = "Required";
    if (!form.bathrooms) next.bathrooms = "Required";
    if (!form.squareFootage) next.squareFootage = "Required";
    if (!form.photos.length) next.photos = "Upload at least 1 photo";
    
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ✅ HELPER: Fetch coordinates manually if missing (e.g. user typed manual address)
  const ensureCoordinates = async (formData) => {
    if (formData.latitude && formData.longitude) return formData;

    try {
        const query = `${formData.address}, ${formData.city}, ${formData.country}`;
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
        const res = await fetch(url);
        const data = await res.json();

        if (data && data.length > 0) {
            return {
                ...formData,
                latitude: data[0].lat,
                longitude: data[0].lon
            };
        }
    } catch (e) {
        console.error("Manual Geo fetch failed:", e);
    }
    // Return original if fetch failed (Backend will handle as fallback)
    return formData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) {
      toast.error("Please fill all required fields.");
      const firstError = document.querySelector(`.${style.errorText}`);
      if(firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    
    setLoading(true);
    
    try {
      // ✅ STEP 1: Ensure we have coordinates before submitting
      const finalForm = await ensureCoordinates(form);
      
      // ✅ STEP 2: Submit
      await submitListing(finalForm, initialData?.product_id || initialData?.id);
    } catch (err) {
      console.error(err);
      toast.error("Submission failed.");
      setLoading(false); 
    }
  };

  return (
    <div className={style.formContainer}>
      <form onSubmit={handleSubmit}>
        
        {loading && (
          <div className={style.processingOverlay}>
            <div className={style.processingContent}>
              <Loader2 className="animate-spin" size={48} color="#09707d" />
              <h3>Publishing Listing...</h3>
              <p>Please wait, uploading media.</p>
            </div>
          </div>
        )}

        <div className={style.formHeader}>
          <h2>{initialData ? "Edit Property" : "Create New Listing"}</h2>
          <button type="button" onClick={closeBtn} className={style.closeBtn} disabled={loading}>
            <X size={24} />
          </button>
        </div>

        {/* 1. BASIC INFO */}
        <div className={style.section}>
          <h3><Home size={18} /> Basic Information</h3>
          <div className={style.formGrid}>
            <div className={style.fullWidth}>
                <InputGroup
                  id="title" label="Listing Title"
                  placeholder="e.g. Modern 2-Bed Apartment in City Center"
                  value={form.title} onChange={(e) => update("title", e.target.value)}
                  error={errors.title} disabled={loading}
                />
            </div>

            <SearchableSelect
              id="listingType" label="Listing Type"
              options={[{ value: "sale", label: "For Sale" }, { value: "rent", label: "For Rent" }]}
              value={form.listingType}
              onChange={(val) => {
                update("listingType", val);
                if(val === "sale") update("pricePeriod", "");
              }}
              error={errors.listingType} disabled={loading} placeholder="Select Type"
            />

            <SearchableSelect
              id="propertyType" label="Property Type"
              options={[
                // { value: "", label: "Select Property Type", disabled: true },

    // --- Residential ---
    { value: "Apartment", label: "Apartment / Flat" },
    { value: "House", label: "Detached House" },
    { value: "Semi-Detached", label: "Semi-Detached House" },
    { value: "Duplex", label: "Duplex" },
    { value: "Triplex", label: "Triplex" },
    { value: "Bungalow", label: "Bungalow" },
    { value: "Terrace", label: "Terrace / Townhouse" },
    { value: "Condo", label: "Condominium" },
    { value: "Studio", label: "Studio Apartment" },
    { value: "Penthouse", label: "Penthouse" },
    { value: "Villa", label: "Villa" },
    { value: "Mansion", label: "Mansion" },

    // --- Commercial ---
    { value: "Office", label: "Office Space" },
    { value: "Retail", label: "Retail Shop" },
    { value: "Shop", label: "Shop" },
    { value: "Plaza", label: "Plaza / Mall Unit" },
    { value: "Warehouse", label: "Warehouse" },
    { value: "Industrial", label: "Industrial Property" },
    { value: "Factory", label: "Factory" },
    { value: "Showroom", label: "Showroom" },
    { value: "Hotel", label: "Hotel / Guest House" },

    // --- Land ---
    { value: "Land", label: "Land / Plot" },
    { value: "Residential Land", label: "Residential Land" },
    { value: "Commercial Land", label: "Commercial Land" },
    { value: "Industrial Land", label: "Industrial Land" },
    { value: "Agricultural Land", label: "Agricultural / Farmland" },

    // --- Special Purpose ---
    { value: "Mixed-Use", label: "Mixed-Use Property" },
    { value: "Serviced Apartment", label: "Serviced Apartment" },
    { value: "Short-Let", label: "Short-Let / Airbnb" },
    { value: "Student Housing", label: "Student Housing" },
    { value: "Co-Living", label: "Co-Living Space" },
    { value: "Event Hall", label: "Event Hall" },
    { value: "Church", label: "Religious Building" },
    { value: "School", label: "School / Educational Facility" },
    { value: "Hospital", label: "Hospital / Clinic" },


    { value: "Self Contain", label: "Self Contain / Micro-Apartment" },
{ value: "Maisonette", label: "Maisonette" },

// Add these to Commercial
{ value: "Filling Station", label: "Filling Station / Gas Station" },
{ value: "Coworking", label: "Co-working Space" },
{ value: "Restaurant", label: "Restaurant / Bar Space" },
              ]}
              value={form.propertyType}
              onChange={(val) => update("propertyType", val)}
              error={errors.propertyType} disabled={loading} placeholder="Select Property Type"
            />

            <div className={style.priceGroup}>
              <InputGroup
                id="price" label="Price" type="number" placeholder="0.00" 
                icon={PriceIcon} symbol={!PriceIcon ? priceSymbol : null} 
                value={form.price} onChange={(e) => update("price", e.target.value)}
                error={errors.price} disabled={loading}
              />
              <SearchableSelect
                id="currency" label="Currency"
                options={currencyOptions}
                value={form.priceCurrency} onChange={(val) => update("priceCurrency", val)}
                disabled={loading}
              />
              {form.listingType === "rent" && (
                <SearchableSelect
                  id="period" label="Period"
                  options={[{ value: "month", label: "/ Month" }, { value: "year", label: "/ Year" }]}
                  value={form.pricePeriod} onChange={(val) => update("pricePeriod", val)}
                  disabled={loading}
                />
              )}
            </div>

            {/* LOCATION ROW */}
            <div className={style.locationRow}>
                {/* Country */}
                <div style={{position:'relative'}}>
                   <label className={style.label}>Country</label>
                   <div className={`${style.inputWrapper} ${style.disabledWrapper}`}>
                      {countryFlagUrl && (
                         <img src={countryFlagUrl} alt="flag" 
                           style={{position:'absolute', left:'12px', width:'24px', borderRadius:'2px', opacity:0.9, top:'50%', transform:'translateY(-50%)', zIndex:2}} 
                         />
                      )}
                      <input 
                        type="text" className={`${style.input}`} 
                        value={form.country} disabled 
                        style={{paddingLeft: countryFlagUrl ? '48px' : '12px'}} 
                      />
                   </div>
                </div>

                {/* State */}
                <SearchableSelect
                  id="state" label="State" 
                  placeholder={hasStates ? "Select State" : "N/A"}
                  options={stateOptions} value={form.state}
                  onChange={(val) => { update("state", val); update("city", ""); }}
                  error={errors.state} 
                  disabled={loading || !hasStates}
                  allowCustom={true} 
                />
                
                {/* City */}
                <SearchableSelect
                  id="city" label="City"
                  placeholder={(!form.state && hasStates) ? "Select State First" : "Type City Name"}
                  options={cityOptions} value={form.city}
                  onChange={(val) => update("city", val)}
                  error={errors.city}
                  disabled={ (hasStates && !form.state) || loading }
                  allowCustom={true} 
                />
                
                <InputGroup id="zipCode" label="Zip Code" optional value={form.zipCode} onChange={(e) => update("zipCode", e.target.value)} disabled={loading} />
            </div>

            <div className={style.fullWidth}>
               <OSMAddressAutocomplete 
                  value={form.address} 
                  onChange={(val) => update("address", val)} 
                  onSelectAddress={handleOSMSelect} 
                  disabled={!form.city || loading} 
                  error={errors.address}
                  context={{ city: form.city, country: form.country }}
               />
            </div>
          </div>
        </div>

        {/* 2. DETAILS */}
        <div className={style.section}>
          <h3><CheckCircle size={18}/> Property Details</h3>
          <div className={style.formGrid}>
            <InputGroup id="bed" label="Bedrooms" type="number" value={form.bedrooms} onChange={e => update("bedrooms", e.target.value)} error={errors.bedrooms} disabled={loading} />
            <InputGroup id="bath" label="Bathrooms" type="number" value={form.bathrooms} onChange={e => update("bathrooms", e.target.value)} error={errors.bathrooms} disabled={loading} />
            <InputGroup id="sqft" label="Square Footage" type="number" value={form.squareFootage} onChange={e => update("squareFootage", e.target.value)} error={errors.squareFootage} disabled={loading} />
            <InputGroup id="year" label="Year Built" type="number" icon={Calendar} value={form.yearBuilt} onChange={e => update("yearBuilt", e.target.value)} error={errors.yearBuilt} disabled={loading} />
            
            <SearchableSelect
  id="parking"
  label="Parking"
  options={[
    { value: "None", label: "No Parking" },

    // --- Private / Residential ---
    { value: "Garage", label: "Private Garage" },
    { value: "Secure Compound", label: "Secure Compound / Inside Gate" }, // 👈 HUGE for Lagos
    { value: "Attached Garage", label: "Attached Garage" },
    { value: "Detached Garage", label: "Detached Garage" },
    { value: "Carport", label: "Carport" },
    { value: "Driveway", label: "Private Driveway" },

    // --- Modern / Luxury ---
    { value: "EV Charging", label: "EV Charging Station" }, // 👈 2026 Standard

    // --- Shared / Communal ---
    { value: "Shared Garage", label: "Shared Garage" },
    { value: "Shared Parking", label: "Shared Parking Space" },
    { value: "Estate Parking", label: "Estate / Gated Parking" },

    // --- Commercial / Industrial ---
    { value: "Loading Bay", label: "Truck Loading Bay" }, // 👈 Critical for Warehouses
    { value: "Multi-Storey", label: "Multi-Storey Car Park" },
    { value: "Basement Parking", label: "Basement Parking" },
    { value: "Underground Parking", label: "Underground Parking" },
    { value: "Valet Parking", label: "Valet Parking" },

    // --- Public / Other ---
    { value: "Street", label: "Street Parking" },
    { value: "Off-Street", label: "Off-Street Parking" },
    { value: "Open Lot", label: "Open Parking Lot" },
    { value: "Paid Parking", label: "Paid Parking" },
    { value: "Visitor Parking", label: "Visitor Parking" },
]}
  value={form.parking}
  onChange={(val) => update("parking", val)}
  error={errors.parking}
  disabled={loading}
  placeholder="Select parking type"
/>

            <SearchableSelect
  id="furnishing"
  label="Furnishing"
  options={[
    { value: "Unfurnished", label: "Unfurnished" },
    { value: "Partly Furnished", label: "Partly Furnished" },
    { value: "Semi-Furnished", label: "Semi-Furnished" },
    { value: "Fully Furnished", label: "Fully Furnished" },
    { value: "Serviced", label: "Serviced & Furnished" },
  ]}
  value={form.furnishing}
  onChange={(val) => update("furnishing", val)}
  error={errors.furnishing}
  disabled={loading}
  placeholder="Select furnishing level"
/>

          </div>
        </div>

        {/* 3. AMENITIES */}
        <div className={style.section}>
          <h3><CheckCircle size={18}/> Amenities</h3>
          <div className={style.featuresGrid}>
            {Object.keys(form.features).map((key) => (
              <label key={key} className={style.toggleLabel}>
                <span className={style.checkText}>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <input
                  type="checkbox"
                  className={style.toggleInput}
                  checked={form.features[key]}
                  onChange={() => toggleFeature(key)}
                  disabled={loading} 
                />
                <span className={style.toggleSwitch}></span>
              </label>
            ))}
          </div>
        </div>

        {/* 4. DESCRIPTION */}
        <div className={style.section}>
          <h3>Description</h3>
          <textarea 
            className={style.textarea} 
            rows={8} 
            value={form.description} 
            onChange={(e) => update("description", e.target.value)} 
            disabled={loading} 
          />
        </div>

        {/* 5. MEDIA */}
        <div className={style.section}>
          <h3><UploadCloud size={18}/> Photos & Media</h3>
          <div className={`${style.uploadArea} ${loading ? style.disabled : ''}`} onClick={() => !loading && fileInputRef.current.click()}>
            <UploadCloud size={32} />
            <p>Click to upload (Max 15)</p>
            <input ref={fileInputRef} type="file" multiple accept="image/*" hidden onChange={handlePhotoPick} disabled={loading} />
          </div>
          {errors.photos && <span className={style.errorText}>{errors.photos}</span>}
          <div className={style.previewGrid}>
            {photoPreviews.map((src, i) => (
              <div key={i} className={style.previewItem}>
                <img src={src} alt="Preview" />
                <button type="button" onClick={() => removePhotoAt(i)}><X size={14}/></button>
              </div>
            ))}
          </div>
          
          <div className={style.mediaRow}>
            <div className={style.mediaCol}>
              <label className={style.label} style={{marginBottom:5, display:'block'}}>Property Video <span className={style.optionalText}>(Optional)</span></label>
              {!form.video ? (
                <button type="button" className={style.mediaBtn} onClick={() => videoInputRef.current.click()} disabled={loading}>
                  <Video size={18} /> Upload Video
                </button>
              ) : (
                <div className={style.mediaPreview}>
                  <span>Video Added</span>
                  <button type="button" onClick={() => { update("video", null); setVideoPreview(null); }} disabled={loading}><X size={14}/></button>
                </div>
              )}
              <input ref={videoInputRef} type="file" accept="video/*" hidden onChange={handleVideoPick} disabled={loading} />
            </div>

            <div className={style.mediaCol}>
              <label className={style.label} style={{marginBottom:5, display:'block'}}>Virtual Tour <span className={style.optionalText}>(Optional)</span></label>
              {!form.virtualTour ? (
                <button type="button" className={style.mediaBtn} onClick={() => virtualInputRef.current.click()} disabled={loading}>
                  <Globe size={18} /> Upload 360° Tour
                </button>
              ) : (
                <div className={style.mediaPreview}>
                  <span>Tour Added</span>
                  <button type="button" onClick={() => { update("virtualTour", null); setVirtualPreview(null); }} disabled={loading}><X size={14}/></button>
                </div>
              )}
              <input ref={virtualInputRef} type="file" accept="video/*" hidden onChange={handleVirtualPick} disabled={loading} />
            </div>
          </div>
        </div>

        {/* 6. CONTACT */}
        <div className={style.section}>
          <h3><User size={18}/> Contact Information</h3>
          <div className={style.formGrid}>
            <InputGroup id="cName" label="Contact Name" icon={User} value={form.contactName} onChange={e => update("contactName", e.target.value)} disabled={true} />
            <InputGroup id="cEmail" label="Email" type="email" icon={Mail} value={form.contactEmail} onChange={e => update("contactEmail", e.target.value)} disabled={true} />
            <InputGroup id="cPhone" label="Phone" type="tel" icon={Phone} value={form.contactPhone} onChange={e => update("contactPhone", e.target.value)} disabled={true} />
            <SearchableSelect id="cMethod" label="Preferred Method" options={[{ value: "email", label: "Email" }, { value: "phone", label: "Phone" }]} value={form.contactMethod} onChange={(val) => update("contactMethod", val)} disabled={loading} />
          </div>
        </div>

        <div className={style.footerActions}>
          <button type="button" onClick={closeBtn} className={style.cancelBtn} disabled={loading}>Cancel</button>
          <button type="submit" className={style.submitBtn} disabled={loading}>
            {loading ? "Publishing..." : "Publish Listing"}
          </button>
        </div>

      </form>
    </div>
  );
};

export default PropertyForm;