import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import style from "../styles/Listings.module.css";
import { 
  X, 
  UploadCloud, 
  Video, 
  Globe, 
  CheckCircle 
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
    ac: false,
    laundry: false,
    balcony: false,
    pets: false,
    pool: false,
    fireplace: false,
    smart: false,
    closet: false,
    security: false,
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
const validatePhone = (v) => v && String(v).replace(/\D/g, "").length >= 7;

function mapInitialToForm(initial = {}) {
  const f = { ...initialState };
  if (!initial) return f;

  f.title = initial.title || "";
  f.price = initial.price ?? "";
  f.pricePeriod = initial.price_period || initial.pricePeriod || "month";
  f.priceCurrency = initial.price_currency || initial.priceCurrency || "USD";
  
  f.country = initial.country || "";
  f.state = initial.state || "";
  f.city = initial.city || "";
  f.address = initial.address || "";

  f.propertyType = initial.property_type || initial.propertyType || "";
  f.listingType = initial.listing_type || initial.listingType || "";
  f.bedrooms = initial.bedrooms || "";
  f.bathrooms = initial.bathrooms || "";
  f.yearBuilt = initial.year_built || initial.yearBuilt || "";
  f.parking = initial.parking || "";
  f.squareFootage = initial.square_footage || initial.squareFootage || "";
  f.furnishing = initial.furnishing || "";
  f.lotSize = initial.lot_size || initial.lotSize || "";
  
  f.features = {
    ...f.features,
    ...(typeof initial.features === "string" ? JSON.parse(initial.features) : initial.features || {}),
  };

  f.description = initial.description || "";
  f.photos = Array.isArray(initial.photos) ? initial.photos : [];
  
  f.contactName = initial.contact_name || initial.contactName || "";
  f.contactEmail = initial.contact_email || initial.contactEmail || "";
  f.contactPhone = initial.contact_phone || initial.contactPhone || "";
  f.contactMethod = initial.contact_method || initial.contactMethod || "email";

  return f;
}

// ✅ MOVED OUTSIDE: Defines component once, preventing re-render focus loss
const InputGroup = ({ id, label, type = "text", placeholder, options, value, onChange, error, disabled, ...props }) => (
  <div className={style.formGroup}>
    <label htmlFor={id} className={style.label}>{label}</label>
    {options ? (
      <select
        id={id}
        className={style.select}
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
        className={`${style.input} ${error ? style.inputError : ""}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...props}
      />
    )}
    {error && <span className={style.errorText}>{error}</span>}
  </div>
);

// --- MAIN COMPONENT ---
const PropertyForm = ({ closeBtn, initialData, submitListing }) => {
  const { user } = useAuth();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Previews
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [videoPreview, setVideoPreview] = useState(null);
  const [virtualPreview, setVirtualPreview] = useState(null);

  // Refs
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const virtualInputRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      const mapped = mapInitialToForm(initialData);
      setForm(mapped);

      if (initialData.photos) {
        const previews = initialData.photos.map((p) =>
          typeof p === "string" ? p : p.url
        );
        setPhotoPreviews(previews);
      }
    } else if (user) {
      setForm(prev => ({
        ...prev,
        contactName: user.name || "",
        contactEmail: user.email || "",
        contactPhone: user.phone || ""
      }));
    }
  }, [initialData, user]);

  useEffect(() => {
    return () => {
      photoPreviews.forEach(url => { if (typeof url === "string" && url.startsWith("blob:")) URL.revokeObjectURL(url) });
      if (videoPreview && videoPreview.startsWith("blob:")) URL.revokeObjectURL(videoPreview);
      if (virtualPreview && virtualPreview.startsWith("blob:")) URL.revokeObjectURL(virtualPreview);
    };
  }, [photoPreviews, videoPreview, virtualPreview]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleFeature = (key) =>
    setForm((prev) => ({
      ...prev,
      features: { ...prev.features, [key]: !prev.features[key] },
    }));

  // --- Photo Logic ---
  const handlePhotoPick = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setForm((prev) => ({
      ...prev,
      photos: [...prev.photos, ...files].slice(0, 15),
    }));

    setPhotoPreviews((prev) =>
      [...prev, ...files.map((f) => URL.createObjectURL(f))].slice(0, 15)
    );
    setErrors((prev) => ({ ...prev, photos: undefined }));
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhotoAt = (i) => {
    setForm((prev) => {
      const copy = [...prev.photos];
      copy.splice(i, 1);
      return { ...prev, photos: copy };
    });
    setPhotoPreviews((prev) => {
      const copy = [...prev];
      copy.splice(i, 1);
      return copy;
    });
  };

  // --- Video/Virtual Logic ---
  const handleVideoPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    update("video", file);
    setVideoPreview(URL.createObjectURL(file));
    if(videoInputRef.current) videoInputRef.current.value = "";
  };
  const removeVideo = () => { update("video", null); setVideoPreview(null); };

  const handleVirtualPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    update("virtualTour", file);
    setVirtualPreview(URL.createObjectURL(file));
    if(virtualInputRef.current) virtualInputRef.current.value = "";
  };
  const removeVirtual = () => { update("virtualTour", null); setVirtualPreview(null); };

  // --- Validation ---
  const validateAll = () => {
    const next = {};
    if (!form.title || form.title.trim().length < 3) next.title = "Title too short.";
    if (!form.price || Number(form.price) <= 0) next.price = "Invalid price.";
    if (!form.listingType) next.listingType = "Required.";
    if (form.listingType === "rent" && !form.pricePeriod) next.pricePeriod = "Required.";
    if (!form.propertyType) next.propertyType = "Required.";
    
    if (!form.country) next.country = "Required.";
    if (!form.city) next.city = "Required.";

    if (!form.contactEmail || !validateEmail(form.contactEmail)) next.contactEmail = "Invalid email.";
    if (!form.contactPhone || !validatePhone(form.contactPhone)) next.contactPhone = "Invalid phone.";
    if (!form.photos.length) next.photos = "Min 1 photo required.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) {
      toast.error("Please fix errors.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);
    try {
      await submitListing(form, initialData?.product_id || initialData?.id);
    } catch (err) {
      console.error(err);
      toast.error("Submission failed.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className={style.formContainer}>
      <form onSubmit={handleSubmit}>
        
        <div className={style.formHeader}>
          <h2>{initialData ? "Edit Property" : "Add New Listing"}</h2>
          <button type="button" onClick={closeBtn} className={style.closeBtn}>
            <X size={24} />
          </button>
        </div>

        {/* --- 1. Basic Info --- */}
        <div className={style.section}>
          <h3>Basic Information</h3>
          
          <div className={style.formGrid}>
            {/* 1. Property Title (Full Width) */}
            <div className={style.fullWidth}>
                <InputGroup
                  id="title"
                  label="Property Title"
                  placeholder="e.g. Modern Apartment in City Center"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  error={errors.title}
                />
            </div>

            {/* 2. Listing Type */}
            <InputGroup
              id="listingType"
              label="Listing Type"
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
            />

            {/* 3. Property Type */}
            <InputGroup
              id="propertyType"
              label="Property Type"
              options={[
                { value: "", label: "Select Type", disabled: true },
                { value: "Apartment", label: "Apartment" },
                { value: "House", label: "House" },
                { value: "Villa", label: "Villa" },
                { value: "Condo", label: "Condo" },
                { value: "Land", label: "Land" },
                { value: "Commercial", label: "Commercial" },
              ]}
              value={form.propertyType}
              onChange={(e) => update("propertyType", e.target.value)}
              error={errors.propertyType}
            />

            {/* 4. Price Group (Full Width Row) */}
            <div className={style.priceGroup}>
              <InputGroup
                id="price"
                label="Price"
                type="number"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                error={errors.price}
              />
              <InputGroup
                id="currency"
                label="Currency"
                options={[
                  { value: "USD", label: "USD ($)" },
                  { value: "EUR", label: "EUR (€)" },
                  { value: "GBP", label: "GBP (£)" },
                  { value: "NGN", label: "NGN (₦)" },
                  { value: "CNY", label: "CNY (¥)" },
                  { value: "RUB", label: "RUB (₽)" },
                  { value: "JPY", label: "JPY (¥)" },
                  { value: "AUD", label: "AUD (A$)" },
                  { value: "CAD", label: "CAD (C$)" },
                  { value: "CHF", label: "CHF (Fr)" },
                  { value: "INR", label: "INR (₹)" },
                  { value: "ZAR", label: "ZAR (R)" },
                ]}
                value={form.priceCurrency}
                onChange={(e) => update("priceCurrency", e.target.value)}
              />
              {form.listingType === "rent" && (
                <InputGroup
                  id="period"
                  label="Period"
                  options={[
                    { value: "month", label: "/ Month" },
                    { value: "year", label: "/ Year" },
                    { value: "week", label: "/ Week" },
                    { value: "day", label: "/ Day" },
                  ]}
                  value={form.pricePeriod}
                  onChange={(e) => update("pricePeriod", e.target.value)}
                />
              )}
            </div>

            {/* 5. Location Row (3 Columns: Country | State | City) */}
            <div className={style.locationRow}>
                <InputGroup
                  id="country"
                  label="Country"
                  placeholder="e.g. USA"
                  value={form.country}
                  onChange={(e) => update("country", e.target.value)}
                  error={errors.country}
                />
                <InputGroup
                  id="state"
                  label="State/Province"
                  placeholder="e.g. California"
                  value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                />
                <InputGroup
                  id="city"
                  label="City"
                  placeholder="e.g. Los Angeles"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  error={errors.city}
                />
            </div>

            {/* 6. Address (Full Width) */}
            <div className={style.fullWidth}>
                <InputGroup
                  id="address"
                  label="Full Address (Street, Unit)"
                  placeholder="e.g. 123 Sunset Blvd, Apt 4B"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                />
            </div>

          </div>
        </div>

        {/* --- 2. Details --- */}
        <div className={style.section}>
          <h3>Property Details</h3>
          <div className={style.formGrid}>
            <InputGroup id="bed" label="Bedrooms" type="number" value={form.bedrooms} onChange={e => update("bedrooms", e.target.value)} />
            <InputGroup id="bath" label="Bathrooms" type="number" value={form.bathrooms} onChange={e => update("bathrooms", e.target.value)} />
            <InputGroup id="sqft" label="Sq Ft" type="number" value={form.squareFootage} onChange={e => update("squareFootage", e.target.value)} />
            <InputGroup id="year" label="Year Built" type="number" value={form.yearBuilt} onChange={e => update("yearBuilt", e.target.value)} />
            
            <InputGroup
              id="parking"
              label="Parking"
              options={[
                { value: "", label: "Select", disabled: true },
                { value: "Garage", label: "Garage" },
                { value: "Street", label: "Street" },
                { value: "None", label: "None" },
              ]}
              value={form.parking}
              onChange={e => update("parking", e.target.value)}
            />
            
            <InputGroup
              id="furnishing"
              label="Furnishing"
              options={[
                { value: "", label: "Select", disabled: true },
                { value: "Furnished", label: "Furnished" },
                { value: "Unfurnished", label: "Unfurnished" },
              ]}
              value={form.furnishing}
              onChange={e => update("furnishing", e.target.value)}
            />
          </div>
        </div>

        {/* --- 3. Features --- */}
        <div className={style.section}>
          <h3>Features & Amenities</h3>
          <div className={style.featuresGrid}>
            {Object.keys(form.features).map((key) => (
              <label key={key} className={style.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={form.features[key]}
                  onChange={() => toggleFeature(key)}
                />
                <span className={style.checkText}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* --- 4. Description --- */}
        <div className={style.section}>
          <h3>Description</h3>
          <textarea
            className={style.textarea}
            rows="5"
            placeholder="Describe the property in detail..."
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </div>

        {/* --- 5. Media --- */}
        <div className={style.section}>
          <h3>Photos & Media</h3>
          <div className={style.uploadArea} onClick={() => fileInputRef.current.click()}>
            <UploadCloud size={32} />
            <p><strong>Click to upload photos</strong> (Max 15)</p>
            <input 
              ref={fileInputRef} type="file" multiple accept="image/*" hidden 
              onChange={handlePhotoPick}
            />
          </div>
          {errors.photos && <span className={style.errorText}>{errors.photos}</span>}

          <div className={style.previewGrid}>
            {photoPreviews.map((src, i) => (
              <div key={i} className={style.previewItem}>
                <img src={src} alt="Preview" />
                <button type="button" onClick={() => removePhotoAt(i)}><X size={14} /></button>
              </div>
            ))}
          </div>

          <div className={style.mediaRow}>
            <div className={style.mediaCol}>
              <label>Property Video</label>
              {!form.video ? (
                <button type="button" className={style.mediaBtn} onClick={() => videoInputRef.current.click()}>
                  <Video size={18} /> Upload Video
                </button>
              ) : (
                <div className={style.mediaPreview}>
                  <span>Video Added</span>
                  <button type="button" onClick={removeVideo}><X size={14}/></button>
                </div>
              )}
              <input ref={videoInputRef} type="file" accept="video/*" hidden onChange={handleVideoPick} />
            </div>

            <div className={style.mediaCol}>
              <label>Virtual Tour</label>
              {!form.virtualTour ? (
                <button type="button" className={style.mediaBtn} onClick={() => virtualInputRef.current.click()}>
                  <Globe size={18} /> Upload 360° Tour
                </button>
              ) : (
                <div className={style.mediaPreview}>
                  <span>Tour Added</span>
                  <button type="button" onClick={removeVirtual}><X size={14}/></button>
                </div>
              )}
              <input ref={virtualInputRef} type="file" accept="video/*" hidden onChange={handleVirtualPick} />
            </div>
          </div>
        </div>

        {/* --- 6. Contact --- */}
        <div className={style.section}>
          <h3>Contact Information</h3>
          <div className={style.formGrid}>
            <InputGroup id="cName" label="Name" value={form.contactName} onChange={e => update("contactName", e.target.value)} />
            <InputGroup id="cEmail" label="Email" type="email" value={form.contactEmail} onChange={e => update("contactEmail", e.target.value)} error={errors.contactEmail} />
            <InputGroup id="cPhone" label="Phone" type="tel" value={form.contactPhone} onChange={e => update("contactPhone", e.target.value)} error={errors.contactPhone} />
            <InputGroup 
              id="cMethod" 
              label="Preferred Method" 
              options={[
                { value: "email", label: "Email" },
                { value: "phone", label: "Phone" },
                { value: "text", label: "Text" },
              ]}
              value={form.contactMethod} 
              onChange={e => update("contactMethod", e.target.value)} 
            />
          </div>
        </div>

        <div className={style.footerActions}>
          <button type="button" onClick={closeBtn} className={style.cancelBtn}>Cancel</button>
          <button type="submit" className={style.submitBtn} disabled={loading}>
            {loading ? "Processing..." : (initialData ? "Save Changes" : "Publish Listing")} <CheckCircle size={18} />
          </button>
        </div>

      </form>
    </div>
  );
};

export default PropertyForm;