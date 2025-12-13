// src/common/PropertyForm.jsx
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import style from "../styles/Listings.module.css";
import uploadIcon from "../assets/uploadIcon.png";
import { useAuth } from "../context/AuthProvider.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const initialState = {
  title: "",
  price: "",
  pricePeriod: "month",
  priceCurrency: "USD",
  address: "",
  city: "",
  state: "",
  country: "",
  propertyType: "",
  listingType: "",
  category: "",
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

  // Updated: NOT URLs anymore — file uploads
  video: null,
  virtualTour: null,

  contactName: "",
  contactEmail: "",
  contactPhone: "",
  contactMethod: "",
};

const keyMap = {
  // Basic Info
  title: "title",
  price: "price",
  priceCurrency: "price_currency",
  pricePeriod: "price_period",
  address: "address",
  city: "city",
  state: "state",
  country: "country",
  propertyType: "property_type",
  listingType: "listing_type",
  category: "category",

  // Property Details
  bedrooms: "bedrooms",
  yearBuilt: "year_built",
  bathrooms: "bathrooms",
  parking: "parking",
  squareFootage: "square_footage",
  furnishing: "furnishing",
  lotSize: "lot_size",

  // Features & Description
  features: "features",
  description: "description",

  // Media (updated)
  photos: "photos",
  video: "video_file",
  virtualTour: "virtual_file",

  // Contact Info
  contactName: "contact_name",
  contactEmail: "contact_email",
  contactPhone: "contact_phone",
  contactMethod: "contact_method",
};

const validateEmail = (v) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());

const validatePhone = (v) => {
  if (!v) return true;
  const digits = String(v).replace(/\D/g, "");
  return digits.length >= 7;
};

function getAuthHeader() {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function mapInitialToForm(initial = {}, profile = {}) {
  const f = { ...initialState };

  f.title = initial?.title || "";
  f.price = initial?.price ?? "";
  f.pricePeriod = initial?.pricePeriod || initial?.price_period || "month";
  f.priceCurrency = initial?.priceCurrency || initial?.price_currency || "USD";
  f.address = initial?.address || "";
  f.city = initial?.city || profile?.city || "";
  f.country = initial?.country || profile?.country || "";
  f.propertyType = initial?.propertyType || initial?.property_type || "";
  f.listingType = initial?.listingType || initial?.listing_type || "";
  f.bedrooms = initial?.bedrooms || "";
  f.bathrooms = initial?.bathrooms || "";
  f.yearBuilt = initial?.yearBuilt || initial?.year_built || "";
  f.parking = initial?.parking || "";
  f.squareFootage = initial?.squareFootage || initial?.square_footage || "";
  f.furnishing = initial?.furnishing || "";
  f.lotSize = initial?.lotSize || initial?.lot_size || "";
  f.features = {
    ...f.features,
    ...(typeof initial?.features === "string"
      ? JSON.parse(initial.features)
      : initial?.features || {}),
  };

  f.description = initial?.description || "";
  f.photos = Array.isArray(initial?.photos) ? initial.photos : [];

  // Updated fields: not URLs anymore
  f.video = null;
  f.virtualTour = null;

  f.contactName =
    initial?.contactName || initial?.contact_name || profile?.full_name || "";
  f.contactEmail =
    initial?.contactEmail || initial?.contact_email || profile?.email || "";
  f.contactPhone =
    initial?.contactPhone || initial?.contact_phone || profile?.phone || "";
  f.contactMethod = initial?.contactMethod || initial?.contact_method || "";
  f.agent_unique_id =
    initial?.agent_unique_id || profile?.unique_id || "";

  return f;
}

const PropertyForm = ({
  closeBtn,
  onCreated,
  onUpdated,
  initialData,
  submitListing,
}) => {
  const { user } = useAuth();
  const [form, setForm] = useState(initialState);

  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [photoPreviews, setPhotoPreviews] = useState([]);

  // VIDEO & VIRTUAL PREVIEWS
  const [videoPreview, setVideoPreview] = useState(null);
  const [virtualPreview, setVirtualPreview] = useState(null);

  // Refs
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const virtualInputRef = useRef(null);

  useEffect(() => {
    if (initialData || Object.keys(profile).length) {
      const mapped = mapInitialToForm(initialData || {}, profile);
      setForm(mapped);

      if (initialData?.photos) {
        const previews = initialData.photos.map((p) =>
          typeof p === "string" ? p : p.url
        );
        setPhotoPreviews(previews);
      }

      setErrors({});
    }
  }, [initialData, profile]);

  useEffect(
    () =>
      () =>
        photoPreviews.forEach(
          (url) => typeof url === "string" && URL.revokeObjectURL(url)
        ),
    [photoPreviews]
  );

  const update = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleFeature = (key) =>
    setForm((prev) => ({
      ...prev,
      features: { ...prev.features, [key]: !prev.features[key] },
    }));

  const photoPic = () => fileInputRef.current?.click();

  const handleListingTypeChange = (value) => {
    update("listingType", value);
    if (value !== "rent") update("pricePeriod", "");
  };

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
    fileInputRef.current.value = "";
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

  // VIDEO UPLOAD HANDLER
  const handleVideoPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    update("video", file);
    setVideoPreview(URL.createObjectURL(file));

    videoInputRef.current.value = "";
  };

  const removeVideo = () => {
    update("video", null);
    setVideoPreview(null);
  };

  // VIRTUAL TOUR HANDLER
  const handleVirtualPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    update("virtualTour", file);
    setVirtualPreview(URL.createObjectURL(file));

    virtualInputRef.current.value = "";
  };

  const removeVirtual = () => {
    update("virtualTour", null);
    setVirtualPreview(null);
  };

  const validateAll = () => {
    const next = {};

    if (!form.title || form.title.trim().length < 3)
      next.title = "Title must be at least 3 characters.";

    if (!form.price || Number(form.price) <= 0)
      next.price = "Enter a price greater than 0.";

    if (!form.listingType) next.listingType = "Select listing type.";

    if (form.listingType === "rent" && !form.pricePeriod)
      next.pricePeriod = "Select price period for rent.";

    if (!form.propertyType) next.propertyType = "Select property type.";

    if (!form.contactEmail || !validateEmail(form.contactEmail))
      next.contactEmail = "Enter a valid email.";

    if (!form.contactPhone || !validatePhone(form.contactPhone))
      next.contactPhone = "Enter a valid phone.";

    if (!form.photos.length) next.photos = "Upload at least one photo.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildPayload = () => ({ ...form });

  const internalSubmit = async (payload) => {
  const formData = new FormData();

  for (const [key, value] of Object.entries(payload)) {
    if (value == null) continue;

    const fieldKey = keyMap[key] || key;

    if (key === "features") {
      formData.append(fieldKey, JSON.stringify(value));
    } else if (key === "photos" && Array.isArray(value)) {
      value.forEach((p) => {
        if (p instanceof File) formData.append("photos", p);
      });
    } else if (key === "video" && value instanceof File) {
      formData.append("video_file", value);
    } else if (key === "virtualTour" && value instanceof File) {
      formData.append("virtual_file", value);
    } else if (
      (key === "video" || key === "virtualTour") &&
      !(value instanceof File)
    ) {
      // skip invalid video/virtualTour values
      continue;
    } else {
      formData.append(fieldKey, value);
    }
  }

  // Append existing photos URLs separately
  const existing = photoPreviews.filter((p) => typeof p === "string");
  if (existing.length)
    formData.append("existingPhotos", JSON.stringify(existing));

  const headers = getAuthHeader();
  const url = initialData?.product_id
    ? `${API_BASE}/api/listings/product/${initialData.product_id}`
    : `${API_BASE}/api/listings`;

  const method = initialData?.product_id ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers, // only auth header
    body: formData, // browser sets Content-Type automatically
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body.error || body.message || `Request failed (${res.status})`
    );
  }

  return res.json();
};


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAll()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast.error("Please fix errors before submitting.");
      return;
    }

    setLoading(true);

    try {
      const payload = buildPayload();
      const submitFn =
        typeof submitListing === "function" ? submitListing : internalSubmit;

      const result = await submitFn(payload);

      if (initialData?.id) {
        onUpdated?.(result);
        toast.success("Listing updated ✨");
      } else {
        onCreated?.(result);
        toast.success("Listing created 🎉");
      }

      setForm(initialState);
      setPhotoPreviews([]);
      setVideoPreview(null);
      setVirtualPreview(null);

      closeBtn?.();
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(`Submission failed: ${err.message}`);
      setErrors((prev) => ({
        ...prev,
        submit: err.message || "Failed to submit",
      }));
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <>
      <div id="formSection" className={style.formSection}>
        <form onSubmit={handleSubmit} noValidate>
          {/* Form Header */}
          <div className={style.formHeader}>
            <h2>{initialData ? "Edit Property" : "List Your Property"}</h2>
            <span
              onClick={closeBtn}
              style={{ cursor: "pointer", fontSize: 22 }}
              aria-hidden="true"
            >
              &times;
            </span>
          </div>

          {/* Submission Error */}
          {errors.submit && (
            <div style={{ color: "#b91c1c", marginBottom: 10 }}>
              {errors.submit}
            </div>
          )}

          {/* Basic Information Section */}
          <h5>Basic Information</h5>
          <div className={style.formGrid}>
            {/* Title */}
            <div className={style.formGroup}>
              <label className={style.label} htmlFor="title">
                Property Title
              </label>
              <input
                id="title"
                type="text"
                placeholder="e.g., 'Modern 3BR Townhouse in Midtown Atlanta'"
                className="form-control mt-1 p-3"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                onBlur={() => {
                  if (!form.title || form.title.trim().length < 3)
                    setErrors((s) => ({
                      ...s,
                      title: "Please enter a title (min 3 characters).",
                    }));
                }}
              />
              {errors.title && (
                <small style={{ color: "#b91c1c" }}>{errors.title}</small>
              )}
            </div>

            {/* Price + Currency + Period */}
            <div className={style.formGroup}>
              <label className={style.label} htmlFor="price">
                Price
              </label>
              <div style={{ display: "flex", width: "100%" }}>
                <input
                  id="price"
                  type="number"
                  placeholder="e.g., 2500000"
                  className="form-control mt-1 p-3"
                  value={form.price}
                  onChange={(e) => update("price", e.target.value)}
                  onBlur={() => {
                    if (form.price === "" || Number(form.price) <= 0)
                      setErrors((s) => ({
                        ...s,
                        price: "Enter a price greater than 0.",
                      }));
                  }}
                  style={{
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                  }}
                />
                {/* Currency */}
                <select
                  id="priceCurrency"
                  className="form-select mt-1 p-3"
                  value={form.priceCurrency}
                  onChange={(e) => update("priceCurrency", e.target.value)}
                  style={{
                    maxWidth: "120px",
                    borderRadius: 0,
                    borderLeft: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="USD">USD $</option>
                  <option value="EUR">EUR €</option>
                  <option value="GBP">GBP £</option>
                  <option value="CHF">CHF ₣</option>
                  <option value="JPY">JPY ¥</option>
                  <option value="AUD">AUD A$</option>
                  <option value="CAD">CAD C$</option>
                  <option value="RUB">RUB ₽</option>
                </select>

                {/* Price Period */}
                <select
                  id="pricePeriod"
                  className="form-select mt-1 p-3"
                  value={form.pricePeriod}
                  onChange={(e) => update("pricePeriod", e.target.value)}
                  disabled={form.listingType !== "rent"}
                  style={{
                    maxWidth: "140px",
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                    cursor:
                      form.listingType === "rent" ? "pointer" : "not-allowed",
                    backgroundColor:
                      form.listingType === "rent" ? "" : "#f3f4f6",
                  }}
                >
                  <option value="month">/Month</option>
                  <option value="week">/Week</option>
                  <option value="year">/Year</option>
                  <option value="day">/Day</option>
                </select>
              </div>
              {errors.price && (
                <small style={{ color: "#b91c1c" }}>{errors.price}</small>
              )}
              {errors.pricePeriod && (
                <small style={{ color: "#b91c1c" }}>{errors.pricePeriod}</small>
              )}
            </div>

            {/* Address */}
            <div className={style.formGroup}>
              <label className={style.label} htmlFor="address">
                Property Address
              </label>
              <input
                id="address"
                type="text"
                placeholder="street, city, state, zip"
                className="form-control mt-1 p-3"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                onBlur={() => {
                  const addr = form.address.toLowerCase();

                  // Set currency based on region keywords
                  if (addr.includes("russia")) update("priceCurrency", "RUB");
                  else if (
                    addr.includes("europe") ||
                    addr.includes("france") ||
                    addr.includes("germany")
                  )
                    update("priceCurrency", "EUR");
                  else if (addr.includes("uk") || addr.includes("england"))
                    update("priceCurrency", "GBP");
                  else if (addr.includes("switzerland"))
                    update("priceCurrency", "CHF");
                  else if (addr.includes("japan"))
                    update("priceCurrency", "JPY");
                  else if (addr.includes("australia"))
                    update("priceCurrency", "AUD");
                  else if (addr.includes("canada"))
                    update("priceCurrency", "CAD");
                  else update("priceCurrency", "USD"); // default
                }}
              />
            </div>

            {/* Property Type */}
            <div className={style.formGroup}>
              <label className={style.label} htmlFor="propertyType">
                Property Type
              </label>
              <select
                id="propertyType"
                className={`form-select mt-1 p-3 ${style.select}`}
                value={form.propertyType}
                onChange={(e) => update("propertyType", e.target.value)}
              >
                <option value="" disabled>
                  Select a property type
                </option>
                <option value="Single-Family">Single-Family</option>
                <option value="Townhouse">Townhouse</option>
                <option value="Apartment">Apartment</option>
                <option value="Condo">Condo</option>
                <option value="Duplex">Duplex</option>
                <option value="Studio">Studio</option>
                <option value="Villa">Villa</option>
                <option value="Penthouse">Penthouse</option>
                <option value="Bungalow">Bungalow</option>
                <option value="Land">Land</option>
                <option value="Commercial">Commercial</option>
              </select>
              {errors.propertyType && (
                <small style={{ color: "#b91c1c" }}>
                  {errors.propertyType}
                </small>
              )}
            </div>

            {/* Listing Type */}
            <div className={style.formGroup}>
              <label className={style.label} htmlFor="listingType">
                Listing Type
              </label>
              <select
                id="listingType"
                className={`form-select mt-1 p-3 ${style.select}`}
                value={form.listingType}
                onChange={(e) => handleListingTypeChange(e.target.value)}
              >
                <option value="" disabled>
                  For Sale | For Rent
                </option>
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
              {errors.listingType && (
                <small style={{ color: "#b91c1c" }}>{errors.listingType}</small>
              )}
            </div>
          </div>

          {/* Property Details Section */}
          <div style={{ marginTop: 30 }}>
            <h5>Property Details</h5>
            <div className={style.formGrid}>
              {/* Bedrooms */}
              <div className={style.formGroup}>
                <label className={style.label} htmlFor="bedrooms">
                  Number of Bedrooms
                </label>
                <input
                  id="bedrooms"
                  type="number"
                  placeholder="e.g., 3"
                  className="form-control mt-1 p-3"
                  value={form.bedrooms}
                  onChange={(e) => update("bedrooms", e.target.value)}
                />
              </div>

              {/* Year Built */}
              <div className={style.formGroup}>
                <label className={style.label} htmlFor="yearBuilt">
                  Year Built
                </label>
                <input
                  id="yearBuilt"
                  type="number"
                  placeholder="e.g., 2015"
                  className="form-control mt-1 p-3"
                  value={form.yearBuilt}
                  onChange={(e) => update("yearBuilt", e.target.value)}
                />
              </div>

              {/* Bathrooms */}
              <div className={style.formGroup}>
                <label className={style.label} htmlFor="bathrooms">
                  Number of Bathrooms
                </label>
                <input
                  id="bathrooms"
                  type="number"
                  placeholder="e.g., 2.5"
                  className="form-control mt-1 p-3"
                  value={form.bathrooms}
                  onChange={(e) => update("bathrooms", e.target.value)}
                />
              </div>

              {/* Parking */}
              <div className={style.formGroup}>
                <label className={style.label} htmlFor="parking">
                  Parking Type / Spaces
                </label>
                <select
                  id="parking"
                  className={`form-select mt-1 p-3 ${style.select}`}
                  value={form.parking}
                  onChange={(e) => update("parking", e.target.value)}
                >
                  <option value="" disabled>
                    Select Parking
                  </option>
                  <option value="Street">Street Parking</option>
                  <option value="Driveway">Driveway</option>
                  <option value="Garage-1">1-Car Garage</option>
                  <option value="Garage-2">2-Car Garage</option>
                  <option value="Garage-3">3-Car Garage</option>
                  <option value="Garage-Attached">Attached Garage</option>
                  <option value="Garage-Detached">Detached Garage</option>
                  <option value="Carport">Carport</option>
                  <option value="Underground">Underground Parking</option>
                  <option value="Covered">Covered Parking</option>
                  <option value="Shared">Shared Parking</option>
                  <option value="None">No Parking</option>
                </select>
              </div>

              {/* Square Footage */}
              <div className={style.formGroup}>
                <label className={style.label} htmlFor="squareFootage">
                  Square Footage
                </label>
                <input
                  id="squareFootage"
                  type="number"
                  placeholder="e.g., 1,750 sq ft"
                  className="form-control mt-1 p-3"
                  value={form.squareFootage}
                  onChange={(e) => update("squareFootage", e.target.value)}
                />
              </div>

              {/* Furnishing */}
              <div className={style.formGroup}>
                <label className={style.label} htmlFor="furnishing">
                  Furnishing (optional)
                </label>
                <select
                  id="furnishing"
                  className={`form-select mt-1 p-3 ${style.select}`}
                  value={form.furnishing}
                  onChange={(e) => update("furnishing", e.target.value)}
                >
                  <option value="" disabled>
                    Select furnishing
                  </option>
                  <option value="Fully Furnished">Fully Furnished</option>
                  <option value="Semi-Furnished">Semi-Furnished</option>
                  <option value="Unfurnished">Unfurnished</option>
                  <option value="Partially Furnished">
                    Partially Furnished
                  </option>
                  <option value="Furnished with Appliances">
                    Furnished with Appliances
                  </option>
                  <option value="Customizable">Customizable</option>
                </select>
              </div>

              {/* Lot Size */}
              <div className={style.formGroup}>
                <label className={style.label} htmlFor="lotSize">
                  Lot Size (optional)
                </label>
                <input
                  id="lotSize"
                  type="text"
                  placeholder="e.g., 0.25 acres or 10,890 sq ft"
                  className="form-control mt-1 p-3"
                  value={form.lotSize}
                  onChange={(e) => update("lotSize", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Key Features */}
          <div className={style.key} style={{ marginTop: 40 }}>
            <h5>Key Features</h5>
            <div className={style.features}>
              {[
                ["ac", "Air Conditioning"],
                ["laundry", "In-unit Laundry"],
                ["balcony", "Balcony / Patio"],
                ["pets", "Pet Friendly"],
                ["pool", "Pool"],
                ["fireplace", "Fireplace"],
                ["smart", "Smart Home Features"],
                ["closet", "Walk-in Closet"],
                ["security", "Security System"],
              ].map(([key, label]) => (
                <div className={style.box} key={key}>
                  <input
                    type="checkbox"
                    id={key}
                    className={style.checkbox}
                    checked={!!form.features[key]}
                    onChange={() => toggleFeature(key)}
                  />
                  <label htmlFor={key}>{label}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Property Description */}
          <div style={{ marginTop: 40 }}>
            <h5>Property Description</h5>
            <div style={{ marginTop: 20 }}>
              <textarea
                id="description"
                name="description"
                rows="5"
                placeholder="Describe layout, neighborhood, amenities, unique features, recent upgrades, etc."
                className="form-control mt-4 p-3"
                style={{ resize: "vertical" }}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </div>
          </div>

          {/* Photo & Media Upload */}
          <div style={{ marginTop: 40 }}>
            <h5>Photo & Media Upload</h5>
            <div className={style.uploadSection}>
              <div
                onClick={photoPic}
                className={style.uploadBox}
                role="button"
                tabIndex={0}
              >
                <img src={uploadIcon} alt="upload" />
              </div>
              <div>
                <p className={style.bid}>
                  <span style={{ fontWeight: "bold", fontSize: "23px" }}>
                    Upload Photos
                  </span>{" "}
                  (Max 15 photos, min 1 required)
                </p>
                <p style={{ fontSize: "18px" }}>
                  Drag & drop or click to upload
                </p>

                <input
                  ref={fileInputRef}
                  id="handlePhoto"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoPick}
                  style={{ marginTop: 8, display: "none" }}
                />
                {errors.photos && (
                  <div style={{ color: "#b91c1c", marginTop: 6 }}>
                    {errors.photos}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 10,
                    flexWrap: "wrap",
                  }}
                >
                  {form.photos.map((p, i) => {
                    const src = typeof p === "string" ? p : photoPreviews[i];
                    return (
                      <div key={i} style={{ position: "relative" }}>
                        <img
                          src={src}
                          alt={`photo-${i}`}
                          style={{
                            width: 96,
                            height: 64,
                            objectFit: "cover",
                            borderRadius: 6,
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removePhotoAt(i)}
                          style={{
                            position: "absolute",
                            top: -8,
                            right: -8,
                            background: "#ef4444",
                            color: "#fff",
                            border: "none",
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            cursor: "pointer",
                          }}
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Video Upload (max 1) */}
<div style={{ marginTop: 38 }}>
  <h6 style={{ fontSize: "16px" }}>Upload Video (optional)</h6>

  <div className={style.uploadSection}>
    <div
      onClick={() => videoInputRef.current.click()}
      className={style.uploadBox}
      role="button"
      tabIndex={0}
    >
      <img src={uploadIcon} width={40} alt="upload" />
    </div>

    <div style={{ marginLeft: 15 }}>
      <p className={style.bid}>
        <span style={{ fontWeight: "bold", fontSize: "20px" }}>
          Upload Video
        </span>{" "}
        (Max 1)
      </p>

      <input
        ref={videoInputRef}
        id="videoUpload"
        type="file"
        accept="video/*"
        onChange={handleVideoPick}
        style={{ display: "none" }}
      />

      {form.video && (
        <div style={{ marginTop: 10, position: "relative" }}>
          <video
            width={180}
            height={120}
            controls
            style={{ borderRadius: 8 }}
            src={typeof form.video === "string" ? form.video : videoPreview}
          ></video>

          <button
            type="button"
            onClick={removeVideo}
            style={{
              position: "absolute",
              top: -8,
              right: -8,
              background: "#ef4444",
              color: "#fff",
              border: "none",
              width: 22,
              height: 22,
              borderRadius: "50%",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  </div>
</div>


{/* Virtual Tour Upload (max 1) */}
<div style={{ marginTop: 38 }}>
  <h6 style={{ fontSize: "16px" }}>Virtual Tour (optional)</h6>

  <div className={style.uploadSection}>
    <div
      onClick={() => virtualInputRef.current.click()}
      className={style.uploadBox}
      role="button"
      tabIndex={0}
    >
      <img src={uploadIcon} width={40} alt="upload" />
    </div>

    <div style={{ marginLeft: 15 }}>
      <p className={style.bid}>
        <span style={{ fontWeight: "bold", fontSize: "20px" }}>
          Upload Virtual Tour
        </span>{" "}
        (Max 1)
      </p>

      <input
        ref={virtualInputRef}
        id="virtualUpload"
        type="file"
        accept="video/*,.mp4,.mov,.webm"
        onChange={handleVirtualPick}
        style={{ display: "none" }}
      />

      {form.virtualTour && (
        <div style={{ marginTop: 10, position: "relative" }}>
          <video
            width={180}
            height={120}
            controls
            style={{ borderRadius: 8 }}
            src={
              typeof form.virtualTour === "string"
                ? form.virtualTour
                : virtualPreview
            }
          ></video>

          <button
            type="button"
            onClick={removeVirtual}
            style={{
              position: "absolute",
              top: -8,
              right: -8,
              background: "#ef4444",
              color: "#fff",
              border: "none",
              width: 22,
              height: 22,
              borderRadius: "50%",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  </div>
</div>

          {/* Contact Info */}
          <div className={style.key} style={{ marginTop: 40 }}>
            <h5>Contact Info</h5>
            <div className={style.formGrid}>
              <div className={style.formGroup}>
                <label className={style.label} htmlFor="contactName">
                  Full Name
                </label>
                <input
                  id="contactName"
                  type="text"
                  className="form-control p-3"
                  placeholder="e.g., Samantha Lee"
                  value={form.contactName}
                  onChange={(e) => update("contactName", e.target.value)}
                />
              </div>

              <div className={style.formGroup}>
                <label className={style.label} htmlFor="contactEmail">
                  Email Address
                </label>
                <input
                  id="contactEmail"
                  type="email"
                  className="form-control p-3"
                  placeholder="e.g., samantha@example.com"
                  value={form.contactEmail}
                  onChange={(e) => update("contactEmail", e.target.value)}
                  onBlur={() => {
                    if (form.contactEmail && !validateEmail(form.contactEmail))
                      setErrors((s) => ({
                        ...s,
                        contactEmail: "Enter a valid email.",
                      }));
                  }}
                />
                {errors.contactEmail && (
                  <small style={{ color: "#b91c1c" }}>
                    {errors.contactEmail}
                  </small>
                )}
              </div>

              <div className={style.formGroup}>
                <label className={style.label} htmlFor="contactPhone">
                  Phone Number
                </label>
                <input
                  id="contactPhone"
                  type="tel"
                  className="form-control p-3"
                  placeholder="e.g., (404) 555-1234"
                  value={form.contactPhone}
                  onChange={(e) => update("contactPhone", e.target.value)}
                  onBlur={() => {
                    if (form.contactPhone && !validatePhone(form.contactPhone))
                      setErrors((s) => ({
                        ...s,
                        contactPhone:
                          "Enter a valid phone number (min 7 digits).",
                      }));
                  }}
                />
                {errors.contactPhone && (
                  <small style={{ color: "#b91c1c" }}>
                    {errors.contactPhone}
                  </small>
                )}
              </div>

              <div className={style.formGroup}>
                <label className={style.label} htmlFor="contactMethod">
                  Preferred Contact Method
                </label>
                <select
                  id="contactMethod"
                  className="form-select p-3"
                  style={{ cursor: "pointer" }}
                  value={form.contactMethod}
                  onChange={(e) => update("contactMethod", e.target.value)}
                >
                  <option value="" disabled>
                    Call / Text / Email
                  </option>
                  <option value="call">Call</option>
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                </select>
              </div>
            </div>
          </div>

          {/* Buttons */}
<div className={style.buttonGroup}>
  <div className={style.buttonForm}>
    <button
      type="button"
      onClick={closeBtn}
      className={style.cancel}
      style={{ cursor: "pointer" }}
      disabled={loading}
    >
      Cancel
    </button>

    <button
      type="submit"
      className={style.submitBtn}
      disabled={loading}
    >
      {loading
        ? initialData
          ? "Saving..."
          : "Publishing..."
        : initialData
        ? "Save Changes"
        : "Publish Listing"}
    </button>
  </div>
</div>

        </form>
      </div>
    </>
  );
};

export default PropertyForm;
