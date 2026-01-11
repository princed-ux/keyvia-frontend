import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom"; 
import Swal from "sweetalert2";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { 
  Plus, Edit, Trash2, MapPin, Home, RefreshCcw, X, CreditCard,
  AlertTriangle, ChevronLeft, ChevronRight, Bed, Bath, Square, Loader2, Lock, Search, Eye,
  ExternalLink // 👈 Correctly imported
} from "lucide-react";

import client from "../api/axios"; 
import { useAuth } from "../context/AuthProvider";
import PropertyForm from "../common/PropertyForm"; // ✅ Make sure this path is correct
import style from "../styles/OwnerProperties.module.css"; 

export default function AddProperties() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth(); 

  const [localStatus, setLocalStatus] = useState(user?.verification_status || 'pending');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null); 
  
  // 📝 Form State
  const [showForm, setShowForm] = useState(false);
  const [editingListing, setEditingListing] = useState(null);

  // Search & Filter State
  const [filter, setFilter] = useState("all"); 
  const [searchTerm, setSearchTerm] = useState("");

  // Preview Modal
  const [previewListing, setPreviewListing] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const lottieUrl = "https://lottie.host/37a0df00-47f6-43d0-873c-01acfb5d1e7d/wvtiKE3P1d.lottie";

  // --- Fetch ---
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

  // --- Filter Logic ---
  const filteredListings = useMemo(() => {
    return listings.filter(l => {
      const matchesSearch = l.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            l.city.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filter === 'all' 
        ? true 
        : filter === 'active' 
          ? (l.status === 'approved' && l.is_active) 
          : (l.status !== 'approved' || !l.is_active);

      return matchesSearch && matchesFilter;
    });
  }, [listings, searchTerm, filter]);

  // --- Actions ---
  const isVerified = localStatus === 'approved';

  // 1. Open Create Mode
  const handleNavigateToAdd = (e) => {
    if(e) e.preventDefault();
    if (!isVerified) {
        Swal.fire({
            icon: 'warning',
            title: "Verification Required",
            text: "You must be an approved landlord to create listings.",
            confirmButtonText: 'Check Profile',
            confirmButtonColor: '#0f766e'
        }).then((res) => { if(res.isConfirmed) navigate('/owner/profile'); });
        return;
    }
    setEditingListing(null);
    setShowForm(true); // Show inline form
  };

  // 2. Open Edit Mode
  const handleEdit = (listing, e) => {
    e.stopPropagation();
    setEditingListing(listing);
    setShowForm(true); // Show inline form
  };

  // 3. Submit Logic
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
      // If rejected, reset to pending on update
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
      
      setShowForm(false); // Close Form
      Swal.fire({ icon: "success", title: "Success!", text: product_id ? "Listing updated." : "Listing created.", confirmButtonColor: "#09707d" });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to save listing.", "error");
    }
  };

  const handleActivate = async (listing, e) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: "Activate Listing",
      text: "Pay $10.00 to publish this listing.",
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Pay Now",
      confirmButtonColor: "#0f766e"
    });

    if (!result.isConfirmed) return;
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
      Swal.fire("Error", "Payment failed.", "error");
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

  const showRejectionReason = (listing, e) => {
    e.stopPropagation();
    Swal.fire({
      icon: 'error',
      title: 'Action Required',
      text: listing.admin_notes || "General quality standards not met.",
      confirmButtonText: 'Edit & Fix',
      confirmButtonColor: '#0f766e'
    }).then((result) => {
        if(result.isConfirmed) handleEdit(listing, e);
    });
  };

  // --- Preview Helpers ---
  const handlePreview = (l, e) => { if(e) e.stopPropagation(); setPreviewListing(l); setCurrentPhotoIndex(0); };
  const nextImage = (e) => { e.stopPropagation(); if(previewListing?.photos) setCurrentPhotoIndex((p) => (p + 1) % previewListing.photos.length); };
  const prevImage = (e) => { e.stopPropagation(); if(previewListing?.photos) setCurrentPhotoIndex((p) => (p - 1 + previewListing.photos.length) % previewListing.photos.length); };
  const getPhotoUrl = (l, i=0) => { if(!l?.photos?.length) return "/placeholder.png"; const p = l.photos[i]; return typeof p === 'string' ? p : (p.url || "/placeholder.png"); };
  const getFeaturesList = (f) => { if(!f) return []; let p={}; if(typeof f==='string'){try{p=JSON.parse(f)}catch{}}else{p=f} return Object.keys(p).filter(k=>p[k]); };

  return (
    <div className={style.container}>
      
      {/* HEADER */}
      <div className={style.header}>
        <div className={style.titleSection}>
          <h1>My Properties</h1>
          <p>Manage your real estate portfolio.</p>
        </div>
        <div className={style.headerActions}>
            {!showForm && (
                <button onClick={() => fetchListings(true)} className={style.iconBtn} title="Sync">
                    <RefreshCcw size={18} className={refreshing ? style.spin : ''} /> Refresh
                </button> 
            )}
            <button 
                onClick={showForm ? () => setShowForm(false) : handleNavigateToAdd}
                className={style.addButton}
                style={!isVerified && !showForm ? { background: '#94a3b8', cursor: 'not-allowed' } : {}}
            >
                {showForm ? <X size={20} /> : (isVerified ? <Plus size={20} /> : <Lock size={16} />)} 
                {showForm ? "Cancel" : (isVerified ? "Add Property" : "Verify to Add")}
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
          {/* CONTROLS */}
          <div className={style.controls}>
            <div className={style.searchWrapper}>
                <Search size={18} className={style.searchIcon} />
                <input 
                    type="text" 
                    placeholder="Search by title or city..." 
                    className={style.searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className={style.tabs}>
                {['all', 'active', 'pending'].map(t => (
                    <button 
                        key={t}
                        className={`${style.tab} ${filter === t ? style.activeTab : ''}`}
                        onClick={() => setFilter(t)}
                    >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </div>
          </div>

          {/* GRID */}
          {loading ? (
            <div className={style.loader}>
              <Loader2 size={40} className={style.spin} />
              <p>Loading properties...</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className={style.emptyState}>
              <DotLottieReact src={lottieUrl} loop autoplay style={{ width: 250, height: 250 }} />
              <h3 className={style.emptyTitle}>
                 {searchTerm ? "No results found" : "No Properties Yet"}
              </h3>
              <p className={style.emptyDesc}>
                 {searchTerm ? "Try adjusting your search terms." : "List your first property today and reach thousands of potential tenants."}
              </p>
              {!searchTerm && (
                  <button onClick={handleNavigateToAdd} className={style.createLink} disabled={!isVerified}>
                      Create Listing
                  </button>
              )}
            </div>
          ) : (
            <div className={style.grid}>
              {filteredListings.map((listing) => {
                let badgeClass = style.pendingBadge;
                let statusText = "Pending";
                
                if (listing.status === 'rejected') { badgeClass = style.rejectedBadge; statusText = "Rejected"; }
                else if (listing.status === 'approved') {
                    if (listing.is_active) { badgeClass = style.activeBadge; statusText = "Active"; }
                    else { badgeClass = style.pendingBadge; statusText = "Unpaid"; }
                }

                return (
                  <div key={listing.product_id} className={style.card} onClick={(e) => handlePreview(listing, e)}>
                    
                    {/* Image Section */}
                    <div className={style.imageWrapper}>
                      <img src={getPhotoUrl(listing, 0)} alt={listing.title} className={style.cardImage} />
                      <div className={`${style.badge} ${badgeClass}`}>{statusText}</div>
                    </div>

                    {listing.status === 'rejected' && (
                        <div className={style.rejectionBanner}>
                            <div className={style.rejectionText}><AlertTriangle size={14} /> Rejected</div>
                            <button className={style.viewReasonBtn} onClick={(e) => showRejectionReason(listing, e)}>Why?</button>
                        </div>
                    )}

                    {/* Content Section */}
                    <div className={style.cardBody}>
                      <span className={style.price}>
                        {Number(listing.price).toLocaleString()} {listing.price_currency}
                      </span>
                      <h3 className={style.title}>{listing.title}</h3>
                      <div className={style.address}>
                        <MapPin size={16} /> {listing.city}, {listing.country}
                      </div>

                      <div className={style.metaRow}>
                        <span className={style.metaItem}><Bed size={16}/> {listing.bedrooms} Beds</span>
                        <span className={style.metaItem}><Bath size={16}/> {listing.bathrooms} Baths</span>
                        <span className={style.metaItem}><Square size={16}/> {listing.square_footage} sqft</span>
                      </div>

                      <div className={style.actions}>
                        {/* PAY Button */}
                        {listing.status === 'approved' && !listing.is_active && (
                          <button 
                            className={`${style.btn} ${style.btnPrimary}`} 
                            onClick={(e) => handleActivate(listing, e)}
                            disabled={busyId === listing.product_id}
                          >
                            {busyId === listing.product_id ? <Loader2 size={16} className="animate-spin"/> : <CreditCard size={16} />} Pay
                          </button>
                        )}

                        {/* VIEW Button */}
                        {listing.is_active && (
                            <button className={`${style.btn} ${style.btnPrimary}`} onClick={(e) => { e.stopPropagation(); navigate(`/listing/${listing.product_id}`); }}>
                                <Eye size={16}/> View
                            </button>
                        )}

                        {/* EDIT Button */}
                        <button 
                            className={`${style.btn} ${style.btnSecondary}`} 
                            onClick={(e) => handleEdit(listing, e)}
                            disabled={listing.is_active}
                        >
                            <Edit size={16}/> Edit
                        </button>

                        {/* DELETE Button */}
                        <button 
                            className={`${style.btn} ${style.btnDanger}`} 
                            onClick={(e) => handleDelete(listing, e)}
                            disabled={busyId === listing.product_id}
                        >
                            <Trash2 size={16}/>
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