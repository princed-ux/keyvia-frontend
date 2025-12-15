import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Home, 
  DollarSign, 
  X,
  CreditCard,
  Eye
} from "lucide-react";

import client from "../api/axios"; // Your configured axios instance
import { useAuth } from "../context/AuthProvider";
import PropertyForm from "../common/PropertyForm";
import style from "../styles/Listings.module.css"; // The CSS we perfected earlier

export default function Listings() {
  const navigate = useNavigate();
  const { user } = useAuth(); 

  // State
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null); 
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingListing, setEditingListing] = useState(null);

  // Preview Modal State
  const [previewListing, setPreviewListing] = useState(null);

  const lottieUrl = "https://lottie.host/37a0df00-47f6-43d0-873c-01acfb5d1e7d/wvtiKE3P1d.lottie";

  // -------------------- Fetch Listings --------------------
  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    try {
      // ✅ Correct Endpoint for Agents
      const res = await client.get("/api/listings/agent"); 
      setListings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch listings error:", err);
      // toast.error("Could not load your listings");
    } finally {
      setLoading(false);
    }
  };

  // -------------------- Actions --------------------
  
  // 1. Activate / Pay Logic
  const handleActivate = async (listing, e) => {
    e.stopPropagation();
    
    // In a real app, this would open Stripe/Paystack
    const confirm = await Swal.fire({
      title: "Activate Listing?",
      text: "This simulates a successful payment of $50.",
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Pay & Activate",
      confirmButtonColor: "#10b981"
    });

    if (!confirm.isConfirmed) return;

    setBusyId(listing.product_id);
    try {
      const res = await client.put(`/api/listings/${listing.product_id}/activate`);
      
      // Update UI immediately
      setListings(prev => prev.map(l => 
        l.product_id === listing.product_id 
          ? { ...l, is_active: true, payment_status: 'paid', status: 'approved' } 
          : l
      ));

      Swal.fire("Success", "Your listing is now LIVE on the map!", "success");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Payment failed", "error");
    } finally {
      setBusyId(null);
    }
  };

  // 2. Delete Logic
  const handleDelete = async (listing, e) => {
    e.stopPropagation(); 
    
    const confirm = await Swal.fire({
      title: "Delete Listing?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete it",
    });

    if (!confirm.isConfirmed) return;

    setBusyId(listing.product_id);

    try {
      await client.delete(`/api/listings/${listing.product_id}`);
      
      setListings((prev) => prev.filter((l) => l.product_id !== listing.product_id));
      
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Deleted',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (err) {
      Swal.fire("Error", "Could not delete listing.", "error");
    } finally {
      setBusyId(null);
    }
  };

  // 3. Form Handlers
  const openCreateForm = () => {
    setEditingListing(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEditForm = (listing, e) => {
    e.stopPropagation();
    setEditingListing(listing);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitListing = async (payload, product_id) => {
    try {
      const formData = new FormData();

      // Append standard fields
      for (const key in payload) {
        const value = payload[key];
        if (value == null) continue;

        if (key === "photos" && Array.isArray(value)) {
          value.forEach((f) => {
            if (f instanceof File) formData.append("photos", f);
          });
        } else if (key === "video" && value instanceof File) {
          formData.append("video_file", value);
        } else if (key === "virtualTour" && value instanceof File) {
          formData.append("virtual_file", value);
        } else if (key === "features") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }

      // Handle existing photos (if editing)
      if (editingListing?.photos?.length) {
        const existing = editingListing.photos; // Already normalized arrays
        formData.append("existingPhotos", JSON.stringify(existing));
      }

      // Determine Endpoint
      const url = product_id ? `/api/listings/${product_id}` : `/api/listings`;
      const method = product_id ? "put" : "post";

      // ✅ Send Request
      const res = await client[method](url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = res.data.listing || res.data;

      // Update State Optimistically
      setListings((prev) => {
        if (product_id) {
           return prev.map(l => l.product_id === product_id ? data : l);
        }
        return [data, ...prev];
      });

      setShowForm(false);

      Swal.fire({
        icon: "success",
        title: "Success",
        text: product_id ? "Listing updated successfully!" : "Listing published! Waiting for Admin Approval.",
        timer: 2000,
        showConfirmButton: false,
      });

    } catch (err) {
      console.error("Submit listing error:", err);
      Swal.fire("Error", err?.response?.data?.message || "Failed to save listing.", "error");
    }
  };

  return (
    <div className={style.container}>
      
      {/* --- HEADER --- */}
      <div className={style.header}>
        <div>
          <h1>My Listings</h1>
          <p>Manage your properties and check their status</p>
        </div>
        <button onClick={openCreateForm} className={style.addButton}>
          <Plus size={20} /> Add New Listing
        </button>
      </div>

      {/* --- FORM SECTION --- */}
      {showForm ? (
        <div className={style.formWrapper}>
           <PropertyForm
             closeBtn={() => setShowForm(false)}
             initialData={editingListing}
             submitListing={submitListing}
           />
        </div>
      ) : (
        <>
          {/* --- LISTINGS GRID --- */}
          {loading ? (
            <div className={style.loadingContainer}>
              <DotLottieReact src={lottieUrl} loop autoplay style={{ width: 150, height: 150 }} />
              <p>Loading your portfolio...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className={style.emptyState}>
              <DotLottieReact src={lottieUrl} loop autoplay style={{ width: 200, height: 200 }} />
              <h3>No Properties Yet</h3>
              <p>Create your first listing to start selling.</p>
              <button onClick={openCreateForm} className={style.addButtonSecondary}>
                Create Listing
              </button>
            </div>
          ) : (
            <div className={style.grid}>
              {listings.map((listing) => {
                // Determine Status Badge Class
                let badgeClass = style.pending;
                let statusText = "Pending";

                if (listing.status === 'rejected') {
                  badgeClass = style.rejected; // You need to add .rejected in CSS (red)
                  statusText = "Rejected";
                } else if (listing.status === 'approved') {
                  if (listing.is_active) {
                     badgeClass = style.active; // Green
                     statusText = "Active";
                  } else {
                     badgeClass = style.pending; // Orange (Needs Payment)
                     statusText = "Approved (Unpaid)";
                  }
                }

                // First photo
                const photoUrl = listing.photos?.[0]?.url || listing.photos?.[0] || "/placeholder.png";

                return (
                  <div 
                    key={listing.product_id} 
                    className={style.card}
                    onClick={() => setPreviewListing(listing)}
                  >
                    <div className={style.imageWrapper}>
                      <img src={photoUrl} alt={listing.title} className={style.cardImage} />
                      <span className={`${style.badge} ${badgeClass}`}>
                        {statusText}
                      </span>
                    </div>

                    <div className={style.cardBody}>
                      <h3 className={style.cardTitle}>{listing.title || "Untitled Property"}</h3>
                      <p className={style.cardAddress}>
                        <MapPin size={14} /> {listing.city}, {listing.country}
                      </p>
                      
                      <div className={style.cardMeta}>
                        <span><Home size={14}/> {listing.property_type}</span>
                        <span className={style.price}>
                          {Number(listing.price).toLocaleString()} {listing.price_currency}
                        </span>
                      </div>

                      {/* ACTIONS ROW */}
                      <div className={style.actions}>
                        {/* 1. PAY BUTTON (Only if Approved + Inactive) */}
                        {listing.status === 'approved' && !listing.is_active && (
                          <button 
                            className={style.actionBtn} 
                            style={{ backgroundColor: '#dcfce7', color: '#166534', borderColor: '#86efac' }}
                            onClick={(e) => handleActivate(listing, e)}
                            disabled={busyId === listing.product_id}
                          >
                            <CreditCard size={16} /> Pay
                          </button>
                        )}

                        {/* 2. EDIT BUTTON */}
                        <button 
                          className={style.actionBtn}
                          onClick={(e) => openEditForm(listing, e)}
                        >
                          <Edit size={16} /> Edit
                        </button>

                        {/* 3. DELETE BUTTON */}
                        <button 
                          className={`${style.actionBtn} ${style.deleteBtn}`}
                          onClick={(e) => handleDelete(listing, e)}
                          disabled={busyId === listing.product_id}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* --- PREVIEW MODAL (Reuse from previous steps) --- */}
      {previewListing && (
        <div className={style.modalOverlay} onClick={() => setPreviewListing(null)}>
          <div className={style.modalContent} onClick={e => e.stopPropagation()}>
            <button className={style.closeModal} onClick={() => setPreviewListing(null)}>
              <X size={24} />
            </button>
            
            <img 
              src={previewListing.photos?.[0]?.url || previewListing.photos?.[0] || "/placeholder.png"} 
              alt="Preview" 
              className={style.modalImage} 
            />
            
            <div className={style.modalDetails}>
              <h2>{previewListing.title}</h2>
              <p className={style.modalPrice}>
                {Number(previewListing.price).toLocaleString()} {previewListing.price_currency}
              </p>
              <p className={style.modalAddress}>
                {previewListing.address}, {previewListing.city}, {previewListing.country}
              </p>
              <div className={style.modalTags}>
                <span>{previewListing.bedrooms} Beds</span>
                <span>{previewListing.bathrooms} Baths</span>
                <span>{previewListing.square_footage} sqft</span>
              </div>
              <p className={style.modalDesc}>{previewListing.description || "No description."}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}