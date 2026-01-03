import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import Swal from "sweetalert2";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { 
  Plus, Edit, Trash2, MapPin, Home, RefreshCcw, X, CreditCard,
  AlertTriangle, ChevronLeft, ChevronRight, Bed, Bath, Square, Loader2, Lock
} from "lucide-react";

import client from "../api/axios"; 
import { useAuth } from "../context/AuthProvider";
import PropertyForm from "../common/PropertyForm"; // ✅ We import the form here
import style from "../styles/Listings.module.css"; 

export default function OwnerProperties() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth(); 

  // ✅ LOCAL STATUS: Ensures UI unlocks instantly after profile update
  const [localStatus, setLocalStatus] = useState(user?.verification_status || 'pending');

  // State
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null); 
  
  // 📝 Form State (For Inline Editing/Creating)
  const [showForm, setShowForm] = useState(false);
  const [editingListing, setEditingListing] = useState(null);

  // Preview Modal State
  const [previewListing, setPreviewListing] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const lottieUrl = "https://lottie.host/37a0df00-47f6-43d0-873c-01acfb5d1e7d/wvtiKE3P1d.lottie";

  // -------------------- Fetch Listings & Status --------------------
  const fetchListings = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [listingsRes, profileRes] = await Promise.all([
          client.get("/api/listings/agent"), 
          client.get("/api/profile") 
      ]);

      setListings(Array.isArray(listingsRes.data) ? listingsRes.data : []);
      
      const serverData = profileRes.data;
      setLocalStatus(serverData.verification_status);

      // ✅ SAFE UPDATE: Only update specific fields. NEVER overwrite the role.
      if (updateUser && serverData) {
          updateUser({ 
              verification_status: serverData.verification_status,
              name: serverData.full_name || user.name,
              avatar_url: serverData.avatar_url || user.avatar_url
          }); 
      }

      if(isRefresh) setTimeout(() => setRefreshing(false), 800); 
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      if (!isRefresh) setLoading(false);
    }
  };

  useEffect(() => { fetchListings(); }, []);

  // -------------------- Actions --------------------
  
  const handleActivate = async (listing, e) => {
    e.stopPropagation();
    const confirm = await Swal.fire({
      title: "Activate Listing?",
      text: "Pay $10.00 to make this listing visible on the Buy/Rent pages.",
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Pay & Activate",
      confirmButtonColor: "#10b981"
    });

    if (!confirm.isConfirmed) return;

    setBusyId(listing.product_id);
    try {
        const res = await client.post('/api/payments/create-session', {
            productId: listing.product_id,
            amount: 10, 
            currency: 'USD',
            email: user.email
        });
        if (res.data && res.data.url) window.location.href = res.data.url;
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Payment initialization failed.", "error");
      setBusyId(null);
    }
  };

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
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Deleted', showConfirmButton: false, timer: 1500 });
    } catch (err) {
      Swal.fire("Error", "Delete failed.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleViewLive = (id, e) => {
    e.stopPropagation();
    navigate(`/listing/${id}`);
  };

  const showRejectionReason = (listing, e) => {
    e.stopPropagation();
    Swal.fire({
      icon: 'error',
      title: 'Action Required',
      text: listing.admin_notes || "General quality standards not met.",
      confirmButtonText: 'Edit & Fix',
      confirmButtonColor: '#09707d'
    }).then((result) => {
        if(result.isConfirmed) openEditForm(listing, e);
    });
  };

  // -------------------- Form Handlers (INLINE LOGIC) --------------------

  const isVerified = localStatus === 'approved';

  // 1. Open Create Mode
  const openCreateForm = (e) => {
    if(e) e.preventDefault();

    if (!isVerified) {
        Swal.fire({
            icon: 'warning',
            title: localStatus === 'pending' ? "Under Review" : "Verification Required",
            text: "You must be an approved landlord to create listings.",
            confirmButtonText: 'Go to Profile',
            confirmButtonColor: '#09707d',
            showCancelButton: true
        }).then((result) => {
            if (result.isConfirmed) navigate('/owner/profile'); 
        });
        return;
    }

    setEditingListing(null);
    setShowForm(true); // ✅ Shows Form Inline
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 2. Open Edit Mode
  const openEditForm = (listing, e) => {
    if(e) e.stopPropagation();
    setEditingListing(listing);
    setShowForm(true); // ✅ Shows Form Inline
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 3. Submit Handler
  const submitListing = async (payload, product_id) => {
    try {
      const formData = new FormData();
      for (const key in payload) {
        const value = payload[key];
        if (value == null) continue;
        if (key === "photos" && Array.isArray(value)) value.forEach((f) => { if (f instanceof File) formData.append("photos", f); });
        else if (key === "video" && value instanceof File) formData.append("video_file", value); 
        else if (key === "virtualTour" && value instanceof File) formData.append("virtual_file", value);
        else if (key === "features") formData.append(key, JSON.stringify(value));
        else formData.append(key, value.toString());
      }
      if (editingListing?.photos?.length) formData.append("existingPhotos", JSON.stringify(editingListing.photos));
      if (editingListing?.status === 'rejected') formData.append('status', 'pending');

      const url = product_id ? `/api/listings/${product_id}` : `/api/listings`;
      const method = product_id ? "put" : "post";
      
      const res = await client[method](url, formData, { headers: { "Content-Type": "multipart/form-data" } });
      const data = res.data.listing || res.data;

      // Update State Optimistically
      setListings((prev) => {
          if (product_id) return prev.map(l => l.product_id === product_id ? { ...data, status: 'pending' } : l);
          return [data, ...prev];
      });
      
      setShowForm(false); // ✅ Close Form (Back to List)
      Swal.fire({ icon: "success", title: "Success!", text: product_id ? "Listing updated." : "Listing created.", confirmButtonColor: "#09707d" });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to save listing.", "error");
    }
  };

  // -------------------- Preview Logic --------------------
  const handlePreview = (l, e) => { if(e) e.stopPropagation(); setPreviewListing(l); setCurrentPhotoIndex(0); };
  const nextImage = (e) => { e.stopPropagation(); if(previewListing?.photos) setCurrentPhotoIndex((p) => (p + 1) % previewListing.photos.length); };
  const prevImage = (e) => { e.stopPropagation(); if(previewListing?.photos) setCurrentPhotoIndex((p) => (p - 1 + previewListing.photos.length) % previewListing.photos.length); };
  const getPhotoUrl = (l, i=0) => { if(!l?.photos?.length) return "/placeholder.png"; const p = l.photos[i]; return typeof p === 'string' ? p : (p.url || "/placeholder.png"); };
  const getFeaturesList = (f) => { if(!f) return []; let p={}; if(typeof f==='string'){try{p=JSON.parse(f)}catch{}}else{p=f} return Object.keys(p).filter(k=>p[k]); };

  return (
    <div className={style.container}>
      
      {/* HEADER */}
      <div className={style.header}>
        <div>
          <h1>Add Properties</h1>
          <p>Manage your rental portfolio and sales</p>
        </div>
        <div className={style.headerActions}>
            <button onClick={() => fetchListings(true)} className={style.iconBtn} title="Refresh Listings">
                <RefreshCcw size={18} className={refreshing ? style.spin : ''} /> Refresh
            </button>
            
            {/* ADD BUTTON (Triggers Inline Form) */}
            <button 
                onClick={openCreateForm}
                className={style.addButton}
                style={!isVerified ? { background: '#94a3b8', cursor: 'not-allowed' } : {}}
            >
                {isVerified ? <Plus size={20} /> : <Lock size={16} />} 
                {isVerified ? "Add New Property" : " Verification Required"}
            </button>
        </div>
      </div>

      {/* --- CONTENT SWITCH: FORM vs LIST --- */}
      {showForm ? (
        // ✅ INLINE FORM
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
              <p>List your first property to start finding tenants.</p>
              
              {/* ✅ BLUE TEXT LINK (Styled Button) */}
              <button 
                onClick={openCreateForm}
                style={{ 
                    background: 'none',
                    border: 'none',
                    color: isVerified ? '#2563eb' : '#94a3b8', 
                    textDecoration: isVerified ? 'underline' : 'none', 
                    fontSize: '18px',
                    fontWeight: '500',
                    cursor: isVerified ? 'pointer' : 'not-allowed',
                    marginTop: '15px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                }}
              >
                {!isVerified && <Lock size={14}/>} Create Listing
              </button>
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
                    if (listing.is_active) {
                        badgeClass = style.active; 
                        statusText = "Active (Live)";
                    } else {
                        badgeClass = style.pending; 
                        statusText = "Approved (Unpaid)";
                    }
                }

                return (
                  <div key={listing.product_id} className={style.card} onClick={(e) => handlePreview(listing, e)}>
                    <div className={style.imageWrapper}>
                      <img src={getPhotoUrl(listing, 0)} alt={listing.title} className={style.cardImage} />
                      <span className={`${style.badge} ${badgeClass}`}>
                        {statusText}
                      </span>
                    </div>

                    {listing.status === 'rejected' && (
                        <div className={style.rejectionBanner}>
                            <div className={style.rejectionText}><AlertTriangle size={14} /> Admin Rejected</div>
                            <button className={style.viewReasonBtn} onClick={(e) => showRejectionReason(listing, e)}>Why?</button>
                        </div>
                    )}

                    <div className={style.cardBody}>
                      <h3 className={style.cardTitle}>{listing.title || "Untitled Property"}</h3>
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
                        {listing.status === 'approved' && !listing.is_active && (
                          <button 
                            className={`${style.actionBtn} ${style.payBtn}`} 
                            onClick={(e) => handleActivate(listing, e)}
                            disabled={busyId === listing.product_id}
                          >
                            {busyId === listing.product_id ? <Loader2 size={16} className="animate-spin"/> : <CreditCard size={16} />} Pay
                          </button>
                        )}

                        {listing.is_active && (
                            <button 
                                className={style.actionBtn} 
                                style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}
                                onClick={(e) => handleViewLive(listing.product_id, e)}
                            >
                                <ExternalLink size={16}/> Live
                            </button>
                        )}

                        <button 
                          className={style.actionBtn}
                          onClick={(e) => openEditForm(listing, e)}
                          disabled={listing.is_active} 
                        >
                          <Edit size={16} /> Edit
                        </button>

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

      {/* --- PREVIEW MODAL --- */}
      {previewListing && (
        <div className={style.modalOverlay} onClick={() => setPreviewListing(null)}>
          <div className={style.modalContent} onClick={e => e.stopPropagation()}>
            <div className={style.modalGallery}>
                <img src={getPhotoUrl(previewListing, currentPhotoIndex)} className={style.modalImage} alt="Main" />
                <button className={style.closeModal} onClick={() => setPreviewListing(null)}><X size={20}/></button>
                {previewListing.photos?.length > 1 && (
                    <>
                        <button className={`${style.navBtn} ${style.prevBtn}`} onClick={prevImage}><ChevronLeft size={20}/></button>
                        <button className={`${style.navBtn} ${style.nextBtn}`} onClick={nextImage}><ChevronRight size={20}/></button>
                    </>
                )}
                <div style={{position:'absolute', bottom:15, right:15, background:'rgba(0,0,0,0.6)', color:'white', padding:'4px 10px', borderRadius:10, fontSize:'0.8rem'}}>{currentPhotoIndex + 1} / {previewListing.photos.length}</div>
            </div>
            <div className={style.modalBody}>
                <div className={style.modalMain}>
                    <h2 style={{fontSize:'1.8rem', margin:'0 0 10px 0', color:'#111827'}}>{previewListing.title}</h2>
                    <div className={style.modalAddress}><MapPin size={18} style={{color:'#09707d'}}/> {previewListing.address}, {previewListing.city}</div>
                    <div className={style.modalPrice}>{Number(previewListing.price).toLocaleString()} <span style={{fontSize:'1rem', color:'#6b7280'}}>{previewListing.price_currency}</span></div>
                    <div className={style.featGrid}>
                        <div className={style.featItem}><Bed size={18}/> {previewListing.bedrooms} Beds</div>
                        <div className={style.featItem}><Bath size={18}/> {previewListing.bathrooms} Baths</div>
                        <div className={style.featItem}><Square size={18}/> {previewListing.square_footage} sqft</div>
                        <div className={style.featItem}><Home size={18}/> {previewListing.property_type}</div>
                    </div>
                    <h3>Description</h3>
                    <p style={{lineHeight: 1.6, color: '#4b5563', whiteSpace:'pre-line'}}>{previewListing.description}</p>
                    <div style={{marginTop: 30}}>
                          <h4 style={{marginBottom:10}}>Amenities</h4>
                          <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
                             {getFeaturesList(previewListing.features).map((f, i) => <span key={i} style={{background:'#e0f2f1', color:'#00695c', padding:'6px 14px', borderRadius:20, fontSize:'0.85rem', textTransform:'capitalize'}}>{f}</span>)}
                          </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}