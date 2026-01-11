import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import Swal from "sweetalert2";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { 
  Plus, Edit, Trash2, MapPin, Home, RefreshCcw, X, CreditCard,
  Eye, AlertTriangle, ChevronLeft, ChevronRight, Bed, Bath, Square, Loader2, CheckCircle, Lock,
  Calendar, Hash, Clock, XCircle 
} from "lucide-react"; // Added Icons

import client from "../api/axios"; 
import { useAuth } from "../context/AuthProvider";
import PropertyForm from "../common/PropertyForm";
import style from "../styles/Listings.module.css"; 
import dayjs from "dayjs"; // Assuming dayjs is installed

export default function Listings() {
  const { user, updateUser } = useAuth(); 
  const navigate = useNavigate(); 

  // ✅ LOCAL STATUS: Ensures the UI unlocks INSTANTLY after refresh
  const [localStatus, setLocalStatus] = useState(user?.verification_status || 'pending');

  // State
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true); // Start loading immediately
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null); 
  
  // Form State
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
      
      const serverStatus = profileRes.data.verification_status;
      setLocalStatus(serverStatus);

      if (profileRes.data && updateUser) {
          updateUser(profileRes.data); 
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
  
  const handleGoToPayment = async (listing, e) => {
    e.stopPropagation();
    navigate('/dashboard/payments', { state: { listingToActivate: listing } });
  };

  const handleDelete = async (listing, e) => {
    e.stopPropagation(); 
    
    // Custom warning for ACTIVE (paid) listings
    if (listing.is_active) {
        const confirmActive = await Swal.fire({
            title: "⚠️ Delete Active Listing?",
            html: `This listing is currently <b>ACTIVE</b> and paid for.<br/><br/>
                   Deleting it is <b>permanent</b> and <b>NON-REFUNDABLE</b>.<br/>
                   Are you absolutely sure?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            confirmButtonText: "Yes, Delete Permanently",
            cancelButtonText: "Cancel"
        });
        if (!confirmActive.isConfirmed) return;
    } else {
        const confirm = await Swal.fire({
            title: "Delete Listing?",
            text: "This cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            confirmButtonText: "Delete",
        });
        if (!confirm.isConfirmed) return;
    }

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

  const showRejectionReason = (listing, e) => {
    e.stopPropagation();
    Swal.fire({
      icon: 'error',
      title: 'Action Required',
      text: listing.admin_notes || "General quality standards not met.",
      confirmButtonText: 'Edit & Fix Now',
      confirmButtonColor: '#09707d'
    }).then((result) => {
        if(result.isConfirmed) openEditForm(listing, e);
    });
  };

  // -------------------- Form Handlers --------------------
  
  const openCreateForm = () => {
    if (localStatus !== 'approved') {
        let title = "Verification Required";
        let text = "You must verify your profile before posting listings.";
        
        if (localStatus === 'pending') {
            title = "Under Review";
            text = "Your profile is currently under review by our admin team.";
        } else if (localStatus === 'rejected') {
            title = "Profile Rejected";
            text = "Your verification was rejected. Please check your profile.";
        }

        Swal.fire({
            icon: 'warning',
            title,
            text,
            confirmButtonText: 'Go to Profile',
            confirmButtonColor: '#09707d',
            showCancelButton: true,
            cancelButtonText: 'Close'
        }).then((result) => {
            if (result.isConfirmed) navigate('/dashboard/profile'); 
        });
        return; 
    }

    setEditingListing(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEditForm = async (listing, e) => {
    if(e) e.stopPropagation();

    // Prevent editing if ACTIVE (paid) and Approved
    if (listing.is_active && listing.status === 'approved') {
        Swal.fire({
            icon: 'info',
            title: 'Listing is Live',
            text: 'This listing is active. Contact support for major changes.',
            confirmButtonColor: '#09707d'
        });
        return;
    }

    // Warn about status reset
    if (listing.status === 'approved') {
        const result = await Swal.fire({
            title: 'Edit Approved Listing?',
            text: "Editing will pause this listing and send it back to 'Pending' for re-review.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Edit & Re-submit',
            confirmButtonColor: '#f59e0b', 
            cancelButtonText: 'Cancel'
        });
        if (!result.isConfirmed) return;
    }

    setEditingListing(listing);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
      
      // ✅ Force status to 'pending' on update
      if (product_id) {
          formData.append('status', 'pending');
      }

      const url = product_id ? `/api/listings/${product_id}` : `/api/listings`;
      const method = product_id ? "put" : "post";
      const res = await client[method](url, formData, { headers: { "Content-Type": "multipart/form-data" } });
      const data = res.data.listing || res.data;

      setListings((prev) => {
          if (product_id) return prev.map(l => l.product_id === product_id ? { ...data, status: 'pending' } : l);
          return [data, ...prev];
      });
      setShowForm(false);
      Swal.fire({ icon: "success", title: "Success!", text: product_id ? "Listing updated and submitted for review." : "Listing created.", confirmButtonColor: "#09707d" });
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

  // Status Badge Helper for Modal
  const getStatusBadge = (l) => {
    if (l.status === 'rejected') return <span style={{display:'flex', alignItems:'center', gap:5, background:'#fee2e2', color:'#991b1b', padding:'5px 12px', borderRadius:20, fontSize:'0.8rem', fontWeight:600}}><XCircle size={14}/> Rejected</span>;
    if (l.status === 'approved' && l.is_active) return <span style={{display:'flex', alignItems:'center', gap:5, background:'#d1fae5', color:'#065f46', padding:'5px 12px', borderRadius:20, fontSize:'0.8rem', fontWeight:600}}><CheckCircle size={14}/> Active</span>;
    if (l.status === 'approved') return <span style={{display:'flex', alignItems:'center', gap:5, background:'#ffedd5', color:'#9a3412', padding:'5px 12px', borderRadius:20, fontSize:'0.8rem', fontWeight:600}}><CheckCircle size={14}/> Approved (Unpaid)</span>;
    return <span style={{display:'flex', alignItems:'center', gap:5, background:'#f1f5f9', color:'#475569', padding:'5px 12px', borderRadius:20, fontSize:'0.8rem', fontWeight:600}}><Clock size={14}/> Pending Review</span>;
  };

  const isVerified = localStatus === 'approved';

  return (
    <div className={style.container}>
      <div className={style.header}>
        <div>
          <h1>My Listings</h1>
          <p>Manage your inventory and check verification status.</p>
        </div>
        <div className={style.headerActions}>
           <button onClick={() => fetchListings(true)} className={style.iconBtn} title="Refresh Listings">
             <RefreshCcw size={18} className={refreshing ? style.spin : ''} /> Refresh
           </button>
           <button onClick={openCreateForm} className={style.addButton} style={!isVerified ? { background: '#94a3b8', cursor: 'not-allowed' } : {}}>
             {isVerified ? <Plus size={20} /> : <Lock size={18} />} Add Property
           </button>
        </div>
      </div>

      {showForm ? (
        <PropertyForm closeBtn={() => setShowForm(false)} initialData={editingListing} submitListing={submitListing} />
      ) : (
        <>
          {loading ? (
             <div className={style.grid}>
                {/* SKELETON LOADING UI */}
                {Array(6).fill(0).map((_, i) => (
                    <div key={i} className={`${style.card} ${style.skeleton}`}>
                        <div className={style.skeletonImage}></div>
                        <div className={style.cardBody}>
                            <div className={`${style.skeletonTitle} ${style.skeleton}`}></div>
                            <div className={`${style.skeletonText} ${style.skeleton}`} style={{width: '60%'}}></div>
                            <div className={`${style.skeletonText} ${style.skeleton}`} style={{width: '40%'}}></div>
                            <div style={{display:'flex', gap:10, marginTop:15}}>
                                <div className={`${style.skeletonTag} ${style.skeleton}`}></div>
                                <div className={`${style.skeletonTag} ${style.skeleton}`}></div>
                            </div>
                        </div>
                    </div>
                ))}
             </div>
          ) : listings.length === 0 ? (
            <div className={style.emptyState}>
              <DotLottieReact src={lottieUrl} loop autoplay style={{ width: 200, height: 200, margin:'0 auto' }} />
              <h3>No Properties Yet</h3>
              <p>Create your first listing to start selling.</p>
              <button onClick={openCreateForm} className={style.addButton} style={{margin:'20px auto', ...( !isVerified ? { background: '#94a3b8' } : {} )}}>
                 {isVerified ? "Create Listing" : "Verify to Create"}
              </button>
            </div>
          ) : (
            <div className={style.grid}>
              {listings.map((listing) => {
                let badgeClass = style.pending;
                let statusText = "Pending Review";
                if (listing.status === 'rejected') { badgeClass = style.rejected; statusText = "Verification Failed"; }
                else if (listing.status === 'approved') { badgeClass = style.active; statusText = listing.is_active ? "Active" : "Approved (Unpaid)"; }

                // ✅ Payment Logic: Approved + Not Active + Not Paid
                const needsPayment = listing.status === 'approved' && !listing.is_active && listing.payment_status !== 'paid';

                return (
                  <div key={listing.product_id} className={style.card} onClick={(e) => handlePreview(listing, e)}>
                    <div className={style.imageWrapper}>
                      <img src={getPhotoUrl(listing, 0)} alt={listing.title} className={style.cardImage} />
                      <span className={`${style.badge} ${badgeClass}`}>{statusText}</span>
                    </div>
                    {listing.status === 'rejected' && (
                        <div className={style.rejectionBanner}>
                            <div className={style.rejectionText}><AlertTriangle size={14} /> AI Rejected</div>
                            <button className={style.viewReasonBtn} onClick={(e) => showRejectionReason(listing, e)}>Why?</button>
                        </div>
                    )}
                    <div className={style.cardBody}>
                      <h3 className={style.cardTitle}>{listing.title}</h3>
                      <p className={style.cardAddress}><MapPin size={14} /> {listing.city}, {listing.country}</p>
                      <div className={style.cardMeta}>
                        <span><Home size={14} style={{marginBottom:-2}}/> {listing.property_type}</span>
                        <span className={style.price}>{Number(listing.price).toLocaleString()} {listing.price_currency}</span>
                      </div>
                      <div className={style.actions}>
                        {needsPayment ? (
                          <button className={`${style.actionBtn} ${style.payBtn}`} onClick={(e) => handleGoToPayment(listing, e)} disabled={busyId === listing.product_id}>
                            {busyId === listing.product_id ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />} Pay to Activate
                          </button>
                        ) : (
                           <button 
                               className={style.actionBtn} 
                               onClick={(e) => openEditForm(listing, e)} 
                               disabled={listing.is_active && listing.status === 'approved'} 
                               style={(listing.is_active && listing.status === 'approved') ? {opacity: 0.5, cursor: 'not-allowed'} : {}}
                           >
                               <Edit size={16} /> Edit
                           </button>
                        )}
                        <button className={`${style.actionBtn} ${style.deleteBtn}`} onClick={(e) => handleDelete(listing, e)} disabled={busyId === listing.product_id}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* --- ENHANCED PREVIEW MODAL --- */}
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
            </div>
            
            <div className={style.modalBody}>
                {/* 1. Header Info */}
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20}}>
                    <div>
                        <h2 style={{fontSize:'1.8rem', margin:'0 0 5px 0', color:'#111827'}}>{previewListing.title}</h2>
                        <div style={{display:'flex', gap:15, color:'#6b7280', fontSize:'0.9rem', alignItems:'center'}}>
                            <span style={{display:'flex', alignItems:'center', gap:4}}><MapPin size={16}/> {previewListing.address}, {previewListing.city}</span>
                            <span style={{display:'flex', alignItems:'center', gap:4}}><Calendar size={16}/> Listed {dayjs(previewListing.created_at).format("MMM D, YYYY")}</span>
                        </div>
                    </div>
                    <div>{getStatusBadge(previewListing)}</div>
                </div>

                {/* 2. Key Metrics */}
                <div style={{background:'#f8fafc', padding:20, borderRadius:12, display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:30}}>
                    <div>
                        <p style={{margin:0, color:'#64748b', fontSize:'0.85rem', fontWeight:600, textTransform:'uppercase'}}>Price</p>
                        <p style={{margin:0, fontSize:'1.8rem', fontWeight:800, color:'#09707d'}}>
                            {Number(previewListing.price).toLocaleString()} <span style={{fontSize:'1rem', color:'#64748b'}}>{previewListing.price_currency}</span>
                        </p>
                    </div>
                    <div style={{display:'flex', gap:20, alignItems:'center'}}>
                        <div>
                            <p style={{margin:0, color:'#64748b', fontSize:'0.85rem', fontWeight:600}}>BEDS</p>
                            <p style={{margin:0, fontSize:'1.2rem', fontWeight:700, display:'flex', alignItems:'center', gap:5}}><Bed size={18}/> {previewListing.bedrooms}</p>
                        </div>
                        <div style={{width:1, height:30, background:'#cbd5e1'}}></div>
                        <div>
                            <p style={{margin:0, color:'#64748b', fontSize:'0.85rem', fontWeight:600}}>BATHS</p>
                            <p style={{margin:0, fontSize:'1.2rem', fontWeight:700, display:'flex', alignItems:'center', gap:5}}><Bath size={18}/> {previewListing.bathrooms}</p>
                        </div>
                        <div style={{width:1, height:30, background:'#cbd5e1'}}></div>
                        <div>
                            <p style={{margin:0, color:'#64748b', fontSize:'0.85rem', fontWeight:600}}>SQFT</p>
                            <p style={{margin:0, fontSize:'1.2rem', fontWeight:700, display:'flex', alignItems:'center', gap:5}}><Square size={18}/> {previewListing.square_footage}</p>
                        </div>
                    </div>
                </div>

                {/* 3. Details & Description */}
                <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:30}}>
                    <div>
                        <h3 style={{fontSize:'1.2rem', marginBottom:10, color:'#1e293b'}}>Description</h3>
                        <p style={{lineHeight: 1.7, color: '#475569', whiteSpace:'pre-line', marginBottom:30}}>{previewListing.description}</p>
                        
                        <h3 style={{fontSize:'1.2rem', marginBottom:10, color:'#1e293b'}}>Amenities</h3>
                        <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
                             {getFeaturesList(previewListing.features).map((f, i) => (
                                <span key={i} style={{background:'#f1f5f9', color:'#334155', padding:'8px 16px', borderRadius:8, fontSize:'0.9rem', fontWeight:500, border:'1px solid #e2e8f0'}}>
                                    {f}
                                </span>
                             ))}
                        </div>
                    </div>

                    {/* Sidebar Info */}
                    <div style={{background:'#f8fafc', padding:20, borderRadius:12, height:'fit-content', border:'1px solid #e2e8f0'}}>
                        <h4 style={{marginTop:0, color:'#334155'}}>Property Details</h4>
                        <div style={{display:'flex', flexDirection:'column', gap:12}}>
                            <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.9rem'}}>
                                <span style={{color:'#64748b'}}>Type</span>
                                <span style={{fontWeight:600, color:'#1e293b'}}>{previewListing.property_type}</span>
                            </div>
                            <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.9rem'}}>
                                <span style={{color:'#64748b'}}>ID</span>
                                <span style={{fontWeight:600, color:'#1e293b', display:'flex', alignItems:'center', gap:4}}><Hash size={12}/> {previewListing.product_id.substring(0,8)}</span>
                            </div>
                            <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.9rem'}}>
                                <span style={{color:'#64748b'}}>Status</span>
                                <span style={{fontWeight:600, color:'#1e293b'}}>{previewListing.status}</span>
                            </div>
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