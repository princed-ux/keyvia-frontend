import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { 
  Plus, Edit, Trash2, MapPin, Home, CreditCard, X, 
  AlertTriangle, ChevronLeft, ChevronRight, Bed, Bath, Square, Loader2, RefreshCcw, ExternalLink
} from "lucide-react";

import client from "../api/axios"; 
import { useAuth } from "../context/AuthProvider";
import style from "../styles/Listings.module.css"; 

export default function OwnerProperties() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth(); 

  const [localStatus, setLocalStatus] = useState(user?.verification_status || 'pending');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null); 
  
  // Preview Modal Only (No inline form state)
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

  // --- Verification Check ---
  const isVerified = localStatus === 'approved';

  const handleCreateClick = (e) => {
    if (!isVerified) {
        e.preventDefault();
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
            if (result.isConfirmed) navigate('/owner/profile'); 
        });
    }
    // If verified, <Link> handles the navigation automatically
  };

  // --- Actions ---
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

  const handleEdit = (listing, e) => {
    e.stopPropagation();
    navigate("/owner/add-property", { state: { editingListing: listing } });
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
      <div className={style.header}>
        <div>
          <h1>My Properties</h1>
          <p>Manage your rental portfolio and sales</p>
        </div>
        <div className={style.headerActions}>
            <button onClick={() => fetchListings(true)} className={style.iconBtn} title="Refresh Listings">
                <RefreshCcw size={18} className={refreshing ? style.spin : ''} /> Refresh
            </button>
            <Link 
                to={isVerified ? "/owner/add-property" : "#"} 
                onClick={handleCreateClick}
                className={style.addButton}
                style={!isVerified ? { background: '#94a3b8', cursor: 'not-allowed' } : {}}
            >
                <Plus size={20} /> Add New Property
            </Link>
        </div>
      </div>

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
          <Link 
            to={isVerified ? "/owner/add-property" : "#"} 
            onClick={handleCreateClick}
            style={{ 
                color: '#2563eb', textDecoration: 'underline', fontSize: '18px', fontWeight: '500',
                cursor: isVerified ? 'pointer' : 'not-allowed', opacity: isVerified ? 1 : 0.5, marginTop: '15px', display: 'inline-block'
            }}
          >
            Create Listing
          </Link>
        </div>
      ) : (
        <div className={style.grid}>
          {listings.map((listing) => {
            let badgeClass = style.pending;
            let statusText = "Pending Review";
            if (listing.status === 'rejected') { badgeClass = style.rejected; statusText = "Verification Failed"; }
            else if (listing.status === 'approved') {
                if (listing.is_active) { badgeClass = style.active; statusText = "Active (Live)"; }
                else { badgeClass = style.pending; statusText = "Approved (Unpaid)"; }
            }

            return (
              <div key={listing.product_id} className={style.card} onClick={(e) => handlePreview(listing, e)}>
                <div className={style.imageWrapper}>
                  <img src={getPhotoUrl(listing, 0)} alt={listing.title} className={style.cardImage} />
                  <span className={`${style.badge} ${badgeClass}`}>{statusText}</span>
                </div>
                {listing.status === 'rejected' && (
                    <div className={style.rejectionBanner}>
                        <div className={style.rejectionText}><AlertTriangle size={14} /> Admin Rejected</div>
                        <button className={style.viewReasonBtn} onClick={(e) => showRejectionReason(listing, e)}>Why?</button>
                    </div>
                )}
                <div className={style.cardBody}>
                  <h3 className={style.cardTitle}>{listing.title || "Untitled Property"}</h3>
                  <p className={style.cardAddress}><MapPin size={14} /> {listing.city}, {listing.country}</p>
                  <div className={style.cardMeta}>
                    <span><Home size={14} style={{marginBottom:-2}}/> {listing.property_type}</span>
                    <span className={style.price}>{Number(listing.price).toLocaleString()} {listing.price_currency}</span>
                  </div>
                  <div className={style.actions}>
                    {listing.status === 'approved' && !listing.is_active && (
                      <button className={`${style.actionBtn} ${style.payBtn}`} onClick={(e) => handleActivate(listing, e)} disabled={busyId === listing.product_id}>
                        {busyId === listing.product_id ? <Loader2 size={16} className="animate-spin"/> : <CreditCard size={16} />} Pay
                      </button>
                    )}
                    {listing.is_active && (
                        <button className={style.actionBtn} style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }} onClick={(e) => handleViewLive(listing.product_id, e)}>
                            <ExternalLink size={16}/> Live
                        </button>
                    )}
                    <button className={style.actionBtn} onClick={(e) => handleEdit(listing, e)} disabled={listing.is_active}>
                      <Edit size={16} /> Edit
                    </button>
                    <button className={`${style.actionBtn} ${style.deleteBtn}`} onClick={(e) => handleDelete(listing, e)} disabled={busyId === listing.product_id}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
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