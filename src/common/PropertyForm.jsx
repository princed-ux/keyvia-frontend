import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import style from "../styles/propertyForm.module.css";
import { 
  X, UploadCloud, Video, Globe, CheckCircle, 
  MapPin, DollarSign, Home, User, Mail, Phone, Calendar, Loader2
} from "lucide-react";
import { useAuth } from "../context/AuthProvider.jsx";

// --- HELPERS & INITIAL STATE ---
const initialState = {
  title: "",
  price: "",
  pricePeriod: "month",
  priceCurrency: "USD",
  country: "",
  state: "",
  city: "",
  zipCode: "",
  address: "",
  propertyType: "",
  listingType: "",
  bedrooms: "",
  yearBuilt: "",
  bathrooms: "",
  parking: "",
  squareFootage: "",
  furnishing: "",
  lotSize: "",
  features: {
    ac: false, laundry: false, balcony: false, pets: false, pool: false,
    fireplace: false, smart: false, closet: false, security: false,
    gym: false, wifi: false,
  },
  description: "",
  photos: [],
  video: null,
  virtualTour: null,
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  contactMethod: "email",
};

const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());

function mapInitialToForm(initial = {}) {
  const f = { ...initialState };
  if (!initial) return f;

  // Basic Fields
  f.title = initial.title || "";
  f.price = initial.price ?? "";
  f.pricePeriod = initial.price_period || initial.pricePeriod || "month";
  f.priceCurrency = initial.price_currency || initial.priceCurrency || "USD";
  
  // Location
  f.country = initial.country || "";
  f.state = initial.state || "";
  f.city = initial.city || "";
  f.zipCode = initial.zip_code || initial.zipCode || "";
  f.address = initial.address || "";

  // Details
  f.propertyType = initial.property_type || initial.propertyType || "";
  f.listingType = initial.listing_type || initial.listingType || "";
  f.bedrooms = initial.bedrooms || "";
  f.bathrooms = initial.bathrooms || "";
  f.yearBuilt = initial.year_built || initial.yearBuilt || "";
  f.parking = initial.parking || "";
  f.squareFootage = initial.square_footage || initial.squareFootage || "";
  f.furnishing = initial.furnishing || "";
  f.lotSize = initial.lot_size || initial.lotSize || "";
  
  // Features (Smart Parsing)
  let parsedFeatures = initial.features;
  if (typeof parsedFeatures === 'string') {
    try { parsedFeatures = JSON.parse(parsedFeatures); } catch (e) {}
  }
  if (Array.isArray(parsedFeatures)) {
    const featureObj = {};
    Object.keys(initialState.features).forEach(k => featureObj[k] = false);
    parsedFeatures.forEach(key => { if (typeof key === 'string') featureObj[key.toLowerCase()] = true; });
    f.features = featureObj;
  } else if (typeof parsedFeatures === 'object' && parsedFeatures !== null) {
    f.features = { ...initialState.features, ...parsedFeatures };
  }

  // Media & Contact
  f.description = initial.description || "";
  f.photos = Array.isArray(initial.photos) ? initial.photos : [];
  f.contactName = initial.contact_name || initial.contactName || "";
  f.contactEmail = initial.contact_email || initial.contactEmail || "";
  f.contactPhone = initial.contact_phone || initial.contactPhone || "";
  f.contactMethod = initial.contact_method || initial.contactMethod || "email";

  return f;
}

// --- INPUT GROUP COMPONENT ---
const InputGroup = ({ 
  id, label, type = "text", placeholder, options, value, onChange, 
  error, disabled, icon: Icon, optional = false, ...props 
}) => (
  <div className={style.formGroup}>
    {label && (
      <label htmlFor={id} className={style.label}>
        {label} 
        {optional && <span className={style.optionalText}>(Optional)</span>}
      </label>
    )}
    <div className={style.inputWrapper}>
      {Icon && <Icon size={18} className={style.inputIcon} />}
      {options ? (
        <select
          id={id}
          className={`${style.select} ${Icon ? style.hasIcon : ''} ${error ? style.inputError : ""}`}
          value={value}
          onChange={onChange}
          disabled={disabled}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          className={`${style.input} ${error ? style.inputError : ""} ${Icon ? style.hasIcon : ''} ${disabled ? style.inputDisabled : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          {...props}
        />
      )}
    </div>
    {error && <span className={style.errorText}>{error}</span>}
  </div>
);

// --- MAIN COMPONENT ---
const PropertyForm = ({ closeBtn, initialData, submitListing }) => {
  const { user } = useAuth();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Media Previews
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [videoPreview, setVideoPreview] = useState(null);
  const [virtualPreview, setVirtualPreview] = useState(null);

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const virtualInputRef = useRef(null);

  // 1. Prevent accidental navigation
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (loading) {
        e.preventDefault();
        e.returnValue = "Upload in progress. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [loading]);

  // 2. Initialize Form
  useEffect(() => {
    if (initialData) {
      setForm(mapInitialToForm(initialData));
      if (initialData.photos) {
        setPhotoPreviews(initialData.photos.map(p => typeof p === "string" ? p : p.url));
      }
    } else if (user) {
      setForm(prev => ({
        ...prev,
        country: user.country || "", // Auto-fill Country
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

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleFeature = (key) => {
    if (loading) return; 
    setForm((prev) => ({
      ...prev,
      features: { ...prev.features, [key]: !prev.features[key] },
    }));
  };

  // --- Handlers ---
  const handlePhotoPick = (e) => {
    if (loading) return;
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setForm(prev => ({ ...prev, photos: [...prev.photos, ...files].slice(0, 15) }));
    setPhotoPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))].slice(0, 15));
    setErrors(prev => ({ ...prev, photos: undefined }));
    e.target.value = "";
  };

  const removePhotoAt = (i) => {
    if (loading) return;
    setForm(prev => { const c = [...prev.photos]; c.splice(i, 1); return { ...prev, photos: c }; });
    setPhotoPreviews(prev => { const c = [...prev]; c.splice(i, 1); return c; });
  };

  const handleVideoPick = (e) => {
    if (loading) return;
    const file = e.target.files?.[0];
    if (file) { update("video", file); setVideoPreview(URL.createObjectURL(file)); }
    e.target.value = "";
  };

  const handleVirtualPick = (e) => {
    if (loading) return;
    const file = e.target.files?.[0];
    if (file) { update("virtualTour", file); setVirtualPreview(URL.createObjectURL(file)); }
    e.target.value = "";
  };

  // --- Validation ---
  const validateAll = () => {
    const next = {};
    if (!form.title || form.title.trim().length < 3) next.title = "Title is required (min 3 chars).";
    if (!form.price || Number(form.price) <= 0) next.price = "Price is required.";
    if (!form.listingType) next.listingType = "Required.";
    if (!form.propertyType) next.propertyType = "Required.";
    if (!form.country) next.country = "Required.";
    if (!form.city) next.city = "Required.";
    
    if (!form.address || form.address.trim().length < 5) next.address = "Full Address is required.";

    // ✅ NEW MANDATORY FIELDS
    if (!form.bedrooms) next.bedrooms = "Required.";
    if (!form.bathrooms) next.bathrooms = "Required.";
    if (!form.squareFootage) next.squareFootage = "Required.";
    if (!form.yearBuilt) next.yearBuilt = "Required.";
    if (!form.parking) next.parking = "Required.";
    if (!form.furnishing) next.furnishing = "Required.";

    if (!form.photos.length) next.photos = "Upload at least 1 photo.";
    if (!form.contactEmail || !validateEmail(form.contactEmail)) next.contactEmail = "Valid email required.";
    
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) {
      toast.error("Please fill in required fields (marked in red).");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);
    try {
      await submitListing(form, initialData?.product_id || initialData?.id);
    } catch (err) {
      console.error(err);
      toast.error("Submission failed. Try again.");
      setLoading(false); 
    }
  };

  return (
    <div className={style.formContainer}>
      <form onSubmit={handleSubmit}>
        
        {loading && (
          <div className={style.processingOverlay}>
            <div className={style.processingContent}>
              <div className={style.spinnerLarge}></div>
              <h3 className={style.processingTitle}>Processing Listing...</h3>
              <p className={style.processingSubtitle}>Please do not close this tab.</p>
            </div>
          </div>
        )}

        <div className={style.formHeader}>
          <h2>{initialData ? "Edit Property" : "Add New Listing"}</h2>
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
                  id="title" label="Property Title"
                  placeholder="e.g. Luxury Apartment in Downtown"
                  value={form.title} onChange={(e) => update("title", e.target.value)}
                  error={errors.title}
                  disabled={loading}
                />
            </div>

            <InputGroup
              id="listingType" label="Listing Type"
              options={[
                { value: "", label: "Select Type", disabled: true },
                { value: "sale", label: "For Sale" },
                { value: "rent", label: "For Rent" },
              ]}
              value={form.listingType}
              onChange={(e) => {
                update("listingType", e.target.value);
                if(e.target.value === "sale") update("pricePeriod", "");
              }}
              error={errors.listingType}
              disabled={loading}
            />

            <InputGroup
              id="propertyType" label="Property Type"
              options={[
                { value: "", label: "Select Type", disabled: true },
                { value: "Apartment", label: "Apartment" },
                { value: "House", label: "House" },
                { value: "Commercial", label: "Commercial" },
                { value: "Land", label: "Land" },
              ]}
              value={form.propertyType} onChange={(e) => update("propertyType", e.target.value)}
              error={errors.propertyType}
              disabled={loading}
            />

            <div className={style.priceGroup}>
              <InputGroup
                id="price" label="Price" type="number" placeholder="0.00" icon={DollarSign}
                value={form.price} onChange={(e) => update("price", e.target.value)}
                error={errors.price} disabled={loading}
              />
              <InputGroup
                id="currency" label="Currency"
                options={[{ value: "USD", label: "USD" }, { value: "EUR", label: "EUR" }, { value: "NGN", label: "NGN" }]}
                value={form.priceCurrency} onChange={(e) => update("priceCurrency", e.target.value)}
                disabled={loading}
              />
              {form.listingType === "rent" && (
                <InputGroup
                  id="period" label="Period"
                  options={[{ value: "month", label: "/ Month" }, { value: "year", label: "/ Year" }]}
                  value={form.pricePeriod} onChange={(e) => update("pricePeriod", e.target.value)}
                  disabled={loading}
                />
              )}
            </div>

            <div className={style.locationRow}>
                <InputGroup 
                  id="country" 
                  label="Country" 
                  value={form.country} 
                  onChange={(e) => update("country", e.target.value)} 
                  error={errors.country} 
                  disabled={true} 
                />
                <InputGroup id="state" label="State" value={form.state} onChange={(e) => update("state", e.target.value)} disabled={loading} />
                <InputGroup id="city" label="City" value={form.city} onChange={(e) => update("city", e.target.value)} error={errors.city} disabled={loading} />
                <InputGroup id="zipCode" label="Zip Code" optional value={form.zipCode} onChange={(e) => update("zipCode", e.target.value)} disabled={loading} />
            </div>

            <div className={style.fullWidth}>
                <InputGroup 
                  id="address" 
                  label="Full Address" 
                  placeholder="Street address, unit, etc." 
                  icon={MapPin} 
                  value={form.address} 
                  onChange={(e) => update("address", e.target.value)} 
                  error={errors.address} 
                  disabled={loading} 
                />
            </div>
          </div>
        </div>

        {/* 2. DETAILS - MANDATORY */}
        <div className={style.section}>
          <h3><CheckCircle size={18}/> Property Details</h3>
          <div className={style.formGrid}>
            {/* ✅ ALL OPTIONAL PROPS REMOVED & ERRORS ADDED */}
            <InputGroup 
                id="bed" 
                label="Bedrooms" 
                type="number" 
                value={form.bedrooms} 
                onChange={e => update("bedrooms", e.target.value)} 
                error={errors.bedrooms}
                disabled={loading} 
            />
            <InputGroup 
                id="bath" 
                label="Bathrooms" 
                type="number" 
                value={form.bathrooms} 
                onChange={e => update("bathrooms", e.target.value)} 
                error={errors.bathrooms}
                disabled={loading} 
            />
            <InputGroup 
                id="sqft" 
                label="Sq Ft" 
                type="number" 
                value={form.squareFootage} 
                onChange={e => update("squareFootage", e.target.value)} 
                error={errors.squareFootage}
                disabled={loading} 
            />
            <InputGroup 
                id="year" 
                label="Year Built" 
                type="number" 
                icon={Calendar} 
                value={form.yearBuilt} 
                onChange={e => update("yearBuilt", e.target.value)} 
                error={errors.yearBuilt}
                disabled={loading} 
            />
            
            <InputGroup
              id="parking" 
              label="Parking" 
              options={[{ value: "", label: "Select" }, { value: "Garage", label: "Garage" }, { value: "Street", label: "Street" }, { value: "None", label: "None" }]}
              value={form.parking} 
              onChange={e => update("parking", e.target.value)}
              error={errors.parking}
              disabled={loading}
            />
            
            <InputGroup
              id="furnishing" 
              label="Furnishing" 
              options={[{ value: "", label: "Select" }, { value: "Furnished", label: "Furnished" }, { value: "Unfurnished", label: "Unfurnished" }]}
              value={form.furnishing} 
              onChange={e => update("furnishing", e.target.value)}
              error={errors.furnishing}
              disabled={loading}
            />
          </div>
        </div>

        {/* 3. AMENITIES */}
        <div className={style.section}>
          <h3><CheckCircle size={18}/> Amenities <span style={{fontSize:'0.8rem', fontWeight:'400', color:'#94a3b8'}}>(Select all that apply)</span></h3>
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
            rows="5"
            placeholder="Describe the property..."
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            disabled={loading}
          />
        </div>

        {/* 5. MEDIA */}
        <div className={style.section}>
          <h3><UploadCloud size={18}/> Photos & Media</h3>
          <div className={`${style.uploadArea} ${loading ? style.disabled : ''}`} onClick={() => !loading && fileInputRef.current.click()}>
            <UploadCloud size={40} />
            <p style={{marginTop:10}}><strong>Click to upload photos</strong> (Max 15)</p>
            <input ref={fileInputRef} type="file" multiple accept="image/*" hidden onChange={handlePhotoPick} disabled={loading} />
          </div>
          {errors.photos && <span className={style.errorText}>{errors.photos}</span>}

          <div className={style.previewGrid}>
            {photoPreviews.map((src, i) => (
              <div key={i} className={style.previewItem}>
                <img src={src} alt="Preview" />
                <button type="button" onClick={() => removePhotoAt(i)} disabled={loading}><X size={14} /></button>
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
                  <button type="button" onClick={() => !loading && update("video", null)} disabled={loading}><X size={14}/></button>
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
                  <button type="button" onClick={() => !loading && update("virtualTour", null)} disabled={loading}><X size={14}/></button>
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
            <InputGroup 
              id="cName" label="Contact Name" icon={User} 
              value={form.contactName} 
              onChange={e => update("contactName", e.target.value)} 
              disabled={true} 
            />
            <InputGroup 
              id="cEmail" label="Email" type="email" icon={Mail} 
              value={form.contactEmail} 
              onChange={e => update("contactEmail", e.target.value)} 
              error={errors.contactEmail} 
              disabled={true} 
            />
            <InputGroup 
              id="cPhone" label="Phone" type="tel" icon={Phone} 
              value={form.contactPhone} 
              onChange={e => update("contactPhone", e.target.value)} 
              error={errors.contactPhone} 
              disabled={true} 
            />
            <InputGroup 
              id="cMethod" label="Preferred Method" 
              options={[{ value: "email", label: "Email" }, { value: "phone", label: "Phone" }]}
              value={form.contactMethod} onChange={e => update("contactMethod", e.target.value)} disabled={loading} 
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className={style.footerActions}>
          <button type="button" onClick={closeBtn} className={style.cancelBtn} disabled={loading}>Cancel</button>
          <button type="submit" className={style.submitBtn} disabled={loading}>
            {loading ? <><Loader2 className="animate-spin" size={18}/> Processing...</> : <><CheckCircle size={18} /> {initialData ? "Save Changes" : "Publish Listing"}</>}
          </button>
        </div>

      </form>
    </div>
  );
};

export default PropertyForm;