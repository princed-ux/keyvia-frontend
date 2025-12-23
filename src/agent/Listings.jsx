import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { 
  Plus, Edit, Trash2, MapPin, Home, RefreshCcw, X, CreditCard,
  Eye, AlertTriangle, ChevronLeft, ChevronRight, Bed, Bath, Square, Loader2, CheckCircle
} from "lucide-react";

import client from "../api/axios"; 
import { useAuth } from "../context/AuthProvider";
import PropertyForm from "../common/PropertyForm";
import style from "../styles/Listings.module.css"; 

export default function Listings() {
  const { user } = useAuth(); 

  // State
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null); 
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingListing, setEditingListing] = useState(null);

  // Preview Modal State
  const [previewListing, setPreviewListing] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const lottieUrl = "https://lottie.host/37a0df00-47f6-43d0-873c-01acfb5d1e7d/wvtiKE3P1d.lottie";

  // -------------------- Fetch Listings --------------------
  const fetchListings = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await client.get("/api/listings/agent"); 
      setListings(Array.isArray(res.data) ? res.data : []);
      if(isRefresh) setTimeout(() => setRefreshing(false), 800); 
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      if (!isRefresh) setLoading(false);
    }
  };

  useEffect(() => { fetchListings(); }, []);

  // -------------------- Actions --------------------
  
  // 1. Payment Redirection Logic (REAL REDIRECT)
  const handleGoToPayment = async (listing, e) => {
    e.stopPropagation();
    
    // Ask for confirmation before redirecting
    const result = await Swal.fire({
      title: "Proceed to Payment?",
      text: `You will be redirected to a secure payment page to activate "${listing.title}".`,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Pay Now",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#09707d",
      background: "#fff"
    });

    if (!result.isConfirmed) return;

    setBusyId(listing.product_id); // Show spinner on button

    try {
        // ✅ Call Backend to create checkout session (Stripe/Paystack)
        // Ensure you have a route: POST /api/payments/create-session
        const res = await client.post('/api/payments/create-session', {
            productId: listing.product_id,
            amount: 50, // Example amount
            currency: 'USD',
            email: user.email
        });

        if (res.data && res.data.url) {
            // 🚀 ACTUAL REDIRECT to Payment Gateway
            window.location.href = res.data.url;
        } else {
            throw new Error("No payment URL returned from server.");
        }

    } catch (err) {
        console.error("Payment Init Error:", err);
        Swal.fire("Payment Error", "Could not initialize payment gateway. Please try again.", "error");
        setBusyId(null);
    }
  };

  // 2. Delete Logic
  const handleDelete = async (listing, e) => {
    e.stopPropagation(); 
    const confirm = await Swal.fire({
      title: "Delete Listing?",
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
    });

    if (!confirm.isConfirmed) return;
    setBusyId(listing.product_id);

    try {
      await client.delete(`/api/listings/${listing.product_id}`);
      setListings((prev) => prev.filter((l) => l.product_id !== listing.product_id));
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Deleted', showConfirmButton: false, timer: 1500 });
    } catch (err) {
      Swal.fire("Error", "Delete failed.", "error");
    } finally {
      setBusyId(null);
    }
  };

  // 3. View Rejection Reason
  const showRejectionReason = (listing, e) => {
    e.stopPropagation();
    const reason = listing.admin_notes || "General quality standards not met. Please verify photos and details.";
    
    Swal.fire({
      icon: 'error',
      title: 'Action Required',
      html: `
        <div style="text-align:left; background:#fef2f2; padding:15px; border-radius:8px; border:1px solid #fecaca; color:#991b1b;">
          <p style="margin-bottom:5px;"><b>Reason for Rejection:</b></p>
          <p>${reason}</p>
        </div>
        <p style="margin-top:15px; font-size:0.9rem; color:#666;">
           Please edit the listing to fix these issues. <br/>
           <b>Once saved, it will automatically return to Pending for re-verification.</b>
        </p>
      `,
      confirmButtonText: 'Edit & Fix Now',
      confirmButtonColor: '#09707d'
    }).then((result) => {
        if(result.isConfirmed) openEditForm(listing, e);
    });
  };

  // -------------------- Form Handlers --------------------
  const openCreateForm = () => {
    setEditingListing(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEditForm = (listing, e) => {
    if(e) e.stopPropagation();
    setEditingListing(listing);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitListing = async (payload, product_id) => {
    try {
      const formData = new FormData();
      
      for (const key in payload) {
        const value = payload[key];
        
        // Skip empty values
        if (value == null) continue;

        // 1. Handle Photos (Array of Files)
        if (key === "photos" && Array.isArray(value)) {
          value.forEach((f) => { 
            if (f instanceof File) formData.append("photos", f); 
          });
        
        // 2. ✅ FIXED: Explicitly handle Video File
        } else if (key === "video" && value instanceof File) {
          formData.append("video_file", value); // Backend expects 'video_file'

        // 3. ✅ FIXED: Explicitly handle Virtual Tour File
        } else if (key === "virtualTour" && value instanceof File) {
          formData.append("virtual_file", value); // Backend expects 'virtual_file'

        // 4. Handle Features (JSON stringify)
        } else if (key === "features") {
          formData.append(key, JSON.stringify(value));

        // 5. Handle everything else (Strings/Numbers)
        } else {
          formData.append(key, value.toString());
        }
      }

      // Handle Existing Photos (for edits)
      if (editingListing?.photos?.length) {
        formData.append("existingPhotos", JSON.stringify(editingListing.photos));
      }

      // Automatic status reset if editing a rejected listing
      if (editingListing?.status === 'rejected') {
          formData.append('status', 'pending');
      }

      const url = product_id ? `/api/listings/${product_id}` : `/api/listings`;
      const method = product_id ? "put" : "post";
      
      const res = await client[method](url, formData, { 
        headers: { "Content-Type": "multipart/form-data" } 
      });
      
      const data = res.data.listing || res.data;

      // Optimistic UI Update
      setListings((prev) => {
          if (product_id) {
              return prev.map(l => l.product_id === product_id ? { ...data, status: 'pending' } : l);
          }
          return [data, ...prev];
      });

      setShowForm(false);
      
      Swal.fire({ 
          icon: "success", 
          title: product_id ? "Listing Updated!" : "Listing Published!", 
          text: product_id && editingListing?.status === 'rejected' 
                ? "Your listing has been resubmitted for verification." 
                : "Your listing is pending verification.",
          confirmButtonColor: "#09707d"
      });

    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to save listing.", "error");
    }
  };

  // -------------------- Preview Logic --------------------
  const handlePreview = (listing, e) => {
    if(e) e.stopPropagation();
    setPreviewListing(listing);
    setCurrentPhotoIndex(0);
  };

  const nextImage = (e) => {
    e.stopPropagation();
    if(!previewListing?.photos) return;
    setCurrentPhotoIndex((prev) => (prev + 1) % previewListing.photos.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if(!previewListing?.photos) return;
    setCurrentPhotoIndex((prev) => (prev - 1 + previewListing.photos.length) % previewListing.photos.length);
  };

  const getPhotoUrl = (listing, index = 0) => {
    if (!listing?.photos || listing.photos.length === 0) return "/placeholder.png";
    const photo = listing.photos[index];
    return typeof photo === 'string' ? photo : (photo.url || "/placeholder.png");
  };

  const getFeaturesList = (features) => {
    if (!features) return [];
    let parsed = {};
    if (typeof features === 'string') { try { parsed = JSON.parse(features); } catch(e) {} } else { parsed = features; }
    return Object.keys(parsed).filter(key => parsed[key]);
  };

  return (
    <div className={style.container}>
      
      {/* --- HEADER --- */}
      <div className={style.header}>
        <div>
          <h1>My Listings</h1>
          <p>Manage your inventory and check verification status.</p>
        </div>
        <div className={style.headerActions}>
           <button onClick={() => fetchListings(true)} className={style.iconBtn} title="Refresh Listings">
             <RefreshCcw size={18} className={refreshing ? style.spin : ''} />
             Refresh
           </button>
           <button onClick={openCreateForm} className={style.addButton}>
             <Plus size={20} /> Add Property
           </button>
        </div>
      </div>

      {/* --- CONTENT --- */}
      {showForm ? (
        <PropertyForm
          closeBtn={() => setShowForm(false)}
          initialData={editingListing}
          submitListing={submitListing}
        />
      ) : (
        <>
          {loading ? (
             <div className={style.loadingContainer} style={{textAlign:'center', padding:50}}>
               <DotLottieReact src={lottieUrl} loop autoplay style={{ width: 150, height: 150, margin:'0 auto' }} />
               <p style={{color:'#6b7280'}}>Loading your portfolio...</p>
             </div>
          ) : listings.length === 0 ? (
            <div className={style.emptyState}>
              <DotLottieReact src={lottieUrl} loop autoplay style={{ width: 200, height: 200, margin:'0 auto' }} />
              <h3>No Properties Yet</h3>
              <p>Create your first listing to start selling.</p>
              <button onClick={openCreateForm} className={style.addButton} style={{margin:'20px auto'}}>Create Listing</button>
            </div>
          ) : (
            <div className={style.grid}>
              {listings.map((listing) => {
                let badgeClass = style.pending;
                let statusText = "Pending Review";
                
                if (listing.status === 'rejected') {
                  badgeClass = style.rejected;
                  statusText = "Verification Failed";
                } else if (listing.status === 'approved') {
                  badgeClass = style.active;
                  statusText = listing.is_active ? "Active" : "Approved (Unpaid)";
                }

                return (
                  <div key={listing.product_id} className={style.card} onClick={(e) => handlePreview(listing, e)}>
                    <div className={style.imageWrapper}>
                      <img src={getPhotoUrl(listing, 0)} alt={listing.title} className={style.cardImage} />
                      <span className={`${style.badge} ${badgeClass}`}>{statusText}</span>
                    </div>

                    {/* Rejection Feedback Banner */}
                    {listing.status === 'rejected' && (
                        <div className={style.rejectionBanner}>
                            <div className={style.rejectionText}>
                                <AlertTriangle size={14} /> AI Rejected
                            </div>
                            <button className={style.viewReasonBtn} onClick={(e) => showRejectionReason(listing, e)}>
                                Why?
                            </button>
                        </div>
                    )}

                    <div className={style.cardBody}>
                      <h3 className={style.cardTitle}>{listing.title}</h3>
                      <p className={style.cardAddress}>
                        <MapPin size={14} /> {listing.city}, {listing.country}
                      </p>
                      <div className={style.cardMeta}>
                        <span><Home size={14} style={{marginBottom:-2}}/> {listing.property_type}</span>
                        <span className={style.price}>
                          {Number(listing.price).toLocaleString()} {listing.price_currency}
                        </span>
                      </div>

                      <div className={style.actions}>
                        {/* Only show PAY if Approved AND Inactive */}
                        {listing.status === 'approved' && !listing.is_active ? (
                          <button 
                            className={`${style.actionBtn} ${style.payBtn}`}
                            onClick={(e) => handleGoToPayment(listing, e)}
                            disabled={busyId === listing.product_id}
                          >
                            {busyId === listing.product_id ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <CreditCard size={16} />
                            )}
                            Go to Payment
                          </button>
                        ) : (
                           // Edit Button (Disabled if Active)
                           <button className={style.actionBtn} onClick={(e) => openEditForm(listing, e)} disabled={listing.is_active}>
                             <Edit size={16} /> Edit
                           </button>
                        )}

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

      {/* --- PREVIEW MODAL (FULL DETAILS) --- */}
      {previewListing && (
        <div className={style.modalOverlay} onClick={() => setPreviewListing(null)}>
          <div className={style.modalContent} onClick={e => e.stopPropagation()}>
            
            {/* Gallery */}
            <div className={style.modalGallery}>
                <img src={getPhotoUrl(previewListing, currentPhotoIndex)} className={style.modalImage} alt="Main" />
                <button className={style.closeModal} onClick={() => setPreviewListing(null)}><X size={20}/></button>
                
                {/* Carousel Nav */}
                {previewListing.photos?.length > 1 && (
                    <>
                        <button className={`${style.navBtn} ${style.prevBtn}`} onClick={prevImage}><ChevronLeft size={20}/></button>
                        <button className={`${style.navBtn} ${style.nextBtn}`} onClick={nextImage}><ChevronRight size={20}/></button>
                    </>
                )}
                <div style={{position:'absolute', bottom:15, right:15, background:'rgba(0,0,0,0.6)', color:'white', padding:'4px 10px', borderRadius:10, fontSize:'0.8rem'}}>
                    {currentPhotoIndex + 1} / {previewListing.photos.length}
                </div>
            </div>

            <div className={style.modalBody}>
                <div className={style.modalMain}>
                    <h2 style={{fontSize:'1.8rem', margin:'0 0 10px 0', color:'#111827'}}>{previewListing.title}</h2>
                    <div className={style.modalAddress}>
                        <MapPin size={18} style={{color:'#09707d'}}/> {previewListing.address}, {previewListing.city}, {previewListing.state}
                    </div>
                    
                    <div style={{display:'flex', gap:10, margin:'15px 0'}}>
                        {previewListing.status === 'approved' && previewListing.is_active && (
                            <span style={{background:'#d1fae5', color:'#065f46', padding:'5px 10px', borderRadius:5, fontSize:'0.8rem', fontWeight:'bold', display:'flex', alignItems:'center', gap:5}}>
                                <CheckCircle size={14}/> Active Listing
                            </span>
                        )}
                        <span style={{background:'#f3f4f6', color:'#374151', padding:'5px 10px', borderRadius:5, fontSize:'0.8rem', fontWeight:'600'}}>
                            ID: {previewListing.product_id}
                        </span>
                    </div>

                    <div className={style.modalPrice}>
                        {Number(previewListing.price).toLocaleString()} <span style={{fontSize:'1rem', color:'#6b7280'}}>{previewListing.price_currency}</span>
                    </div>

                    <div className={style.featGrid}>
                        <div className={style.featItem}><Bed size={18}/> {previewListing.bedrooms} Beds</div>
                        <div className={style.featItem}><Bath size={18}/> {previewListing.bathrooms} Baths</div>
                        <div className={style.featItem}><Square size={18}/> {previewListing.square_footage} sqft</div>
                        <div className={style.featItem}><Home size={18}/> {previewListing.property_type}</div>
                    </div>

                    <h3>Description</h3>
                    <p style={{lineHeight: 1.6, color: '#4b5563', whiteSpace:'pre-line'}}>{previewListing.description}</p>
                    
                    {/* Features List */}
                    <div style={{marginTop: 30}}>
                         <h4 style={{marginBottom:10}}>Amenities & Features</h4>
                         <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
                            {getFeaturesList(previewListing.features).map((f, i) => (
                                <span key={i} style={{background:'#e0f2f1', color:'#00695c', padding:'6px 14px', borderRadius:20, fontSize:'0.85rem', textTransform:'capitalize'}}>
                                    {f}
                                </span>
                            ))}
                            {getFeaturesList(previewListing.features).length === 0 && <span style={{color:'#9ca3af', fontStyle:'italic'}}>No amenities listed.</span>}
                         </div>
                    </div>
                </div>

                {/* Sidebar: Agent Profile */}
                <div className={style.modalSidebar}>
                    <div className={style.agentCard} style={{background:'#fff', padding:20, borderRadius:12, border:'1px solid #e5e7eb', textAlign:'center'}}>
                        <img src={user.avatar_url || "/person-placeholder.png"} className={style.agentAvatar} style={{width:80, height:80, borderRadius:'50%', objectFit:'cover', marginBottom:10}} alt="Agent" />
                        <h4 style={{margin:0, color:'#111827'}}>{user.full_name}</h4>
                        <p style={{margin:0, color:'#6b7280', fontSize:'0.9rem'}}>Listing Agent</p>
                        <div style={{margin:'15px 0', height:1, background:'#f3f4f6'}}></div>
                        <button className={style.contactBtn} style={{width:'100%', background:'#9ca3af', cursor:'not-allowed'}} disabled>Contact Agent (Preview)</button>
                    </div>
                </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}