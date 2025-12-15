import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { 
  CheckCircle, XCircle, Trash2, Search, MapPin, 
  Bed, Bath, Square, X, ExternalLink, ChevronLeft, ChevronRight, Video, Globe
} from "lucide-react";
import style from "../styles/adminProperty.module.css";
import client from "../api/axios"; 

const Properties = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  
  // Drawer & Selection
  const [selected, setSelected] = useState(null);
  const [busyId, setBusyId] = useState(null);

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  // --- Fetch Data ---
  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await client.get("/api/listings/admin/all");
      setListings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Could not load listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchListings(); }, []);

  // --- Filters ---
  const filteredListings = listings.filter(l => {
    const matchesSearch = l.title?.toLowerCase().includes(search.toLowerCase()) || 
                          l.product_id?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "all") return true;
    if (filter === "pending") return l.status === "pending";
    if (filter === "rejected") return l.status === "rejected";
    if (filter === "active") return l.status === "approved"; 
    return true;
  });

  // --- Actions ---
  const handleUpdateStatus = async (status) => {
    if (!selected) return;
    setBusyId(selected.product_id);
    try {
      await client.put(`/api/listings/${selected.product_id}/status`, { status });
      toast.success(`Listing marked as ${status}`);
      setListings(prev => prev.map(l => l.product_id === selected.product_id ? { ...l, status } : l));
      setSelected(null);
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Permanently delete this listing?")) return;
    setBusyId(selected.product_id);
    try {
      await client.delete(`/api/listings/${selected.product_id}`);
      toast.success("Listing deleted");
      setListings(prev => prev.filter(l => l.product_id !== selected.product_id));
      setSelected(null);
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  // --- Lightbox Logic ---
  const openLightbox = (index) => {
    setPhotoIndex(index);
    setLightboxOpen(true);
  };
  
  const nextPhoto = (e) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev + 1) % selected.photos.length);
  };

  const prevPhoto = (e) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev - 1 + selected.photos.length) % selected.photos.length);
  };

  // --- Helpers ---
  const getBadgeClass = (l) => {
    if (l.status === 'rejected') return style.rejected;
    if (l.status === 'approved' && l.is_active) return style.active;
    return style.pending;
  };

  const getStatusText = (l) => {
    if (l.status === 'approved' && !l.is_active) return 'Approved (Unpaid)';
    if (l.status === 'approved' && l.is_active) return 'Active';
    return l.status.charAt(0).toUpperCase() + l.status.slice(1);
  };

  return (
    <div className={style.dashboardContainer}>
      
      {/* Header */}
      <div className={style.header}>
        <h2>Property Management</h2>
        <p className={style.subtitle}>Review, approve, and manage platform inventory.</p>
      </div>

      {/* Filter Bar */}
      <div className={style.filterBar}>
        <div className={style.tabs}>
          {['pending', 'active', 'rejected', 'all'].map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)} 
              className={`${style.tab} ${filter === f ? style.tabActive : ""}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className={style.searchContainer}>
          <Search size={18} className={style.searchIcon} />
          <input 
            type="text" 
            placeholder="Search ID, Title..." 
            className={style.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      <div className={style.grid}>
        {loading ? <p>Loading...</p> : filteredListings.length === 0 ? (
          <div className={style.emptyState}>No listings found.</div>
        ) : (
          filteredListings.map(l => (
            <div key={l.product_id} className={style.card} onClick={() => setSelected(l)}>
              <img src={l.photos?.[0]?.url || "/placeholder.png"} className={style.cardImage} alt={l.title} />
              <div className={style.cardBody}>
                <div className={style.cardHeader}>
                  <span className={`${style.badge} ${getBadgeClass(l)}`}>{getStatusText(l)}</span>
                  <small style={{ color: '#9ca3af' }}>{new Date(l.created_at).toLocaleDateString()}</small>
                </div>
                <h3 className={style.title}>{l.title}</h3>
                <p className={style.price}>{Number(l.price).toLocaleString()} {l.price_currency}</p>
                <div className={style.metaRow}>
                   <div className={style.metaItem}><MapPin size={14}/> {l.city}</div>
                   <div className={style.metaItem}><Bed size={14}/> {l.bedrooms}</div>
                   <div className={style.metaItem}><Bath size={14}/> {l.bathrooms}</div>
                </div>
                <div className={style.agentRow}>
                  <img src={l.agent?.avatar_url || "/person-placeholder.png"} className={style.miniAvatar} alt="" />
                  <span>{l.agent?.full_name || "Unknown"}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- DRAWER (Sheet) --- */}
      {selected && (
        <>
          <div className={style.overlay} onClick={() => setSelected(null)} />
          <div className={style.drawer}>
            
            <div className={style.drawerHeader}>
              <div>
                 <h3 style={{margin:0, fontSize: '1.2rem'}}>{selected.product_id}</h3>
                 <span style={{fontSize: '0.85rem', color: '#6b7280'}}>Submitted: {new Date(selected.created_at).toLocaleString()}</span>
              </div>
              <button className={style.closeBtn} onClick={() => setSelected(null)} style={{background:'none', border:'none', cursor:'pointer'}}>
                <X size={24} color="#6b7280"/>
              </button>
            </div>

            <div className={style.drawerContent}>
              
              {/* Gallery Preview */}
              <div className={style.sectionTitle}>Visuals</div>
              <div className={style.galleryGrid}>
                {selected.photos?.length > 0 ? (
                  <>
                    <img 
                      src={selected.photos[0].url} 
                      className={style.galleryMain} 
                      alt="Main"
                      onClick={() => openLightbox(0)}
                    />
                    {selected.photos.slice(1, 5).map((p, i) => (
                      <img 
                        key={i} src={p.url} 
                        className={style.galleryThumb} 
                        alt={`Thumb ${i}`}
                        onClick={() => openLightbox(i + 1)}
                      />
                    ))}
                  </>
                ) : <p>No photos available</p>}
              </div>

              {/* Media Links */}
              {(selected.video_url || selected.virtual_tour_url) && (
                <div style={{marginBottom: 30}}>
                   {selected.video_url && (
                     <a href={selected.video_url} target="_blank" rel="noreferrer" className={style.mediaBtn}>
                       <Video size={18} /> Watch Video Tour
                     </a>
                   )}
                   {selected.virtual_tour_url && (
                     <a href={selected.virtual_tour_url} target="_blank" rel="noreferrer" className={style.mediaBtn}>
                       <Globe size={18} /> View 360° Virtual Tour
                     </a>
                   )}
                </div>
              )}

              {/* Agent Info */}
              <div className={style.sectionTitle}>Agent</div>
              <div className={style.agentCard}>
                <img src={selected.agent?.avatar_url || "/person-placeholder.png"} className={style.agentAvatarLarge} alt="Agent" />
                <div className={style.agentInfo}>
                  <h4>{selected.agent?.full_name}</h4>
                  <p>@{selected.agent?.username} • {selected.agent?.agency_name}</p>
                  <p style={{marginTop: 5, color: '#09707d', fontWeight: 500}}>{selected.agent?.email} • {selected.agent?.phone}</p>
                </div>
                <a href={`/profile/${selected.agent?.unique_id}`} target="_blank" rel="noreferrer" style={{marginLeft: 'auto'}}>
                   <ExternalLink size={18} color="#6b7280"/>
                </a>
              </div>

              {/* Property Details */}
              <div className={style.sectionTitle}>Details</div>
              <h2 style={{marginTop: 0, marginBottom: 5}}>{selected.title}</h2>
              <p style={{fontSize: '1.4rem', fontWeight: '800', color: '#09707d', margin: 0}}>
                 {Number(selected.price).toLocaleString()} {selected.price_currency} 
              </p>
              
              <div className={style.infoGrid} style={{marginTop: 20}}>
                 <div className={style.infoItem}><label>Type</label><p>{selected.property_type} ({selected.listing_type})</p></div>
                 <div className={style.infoItem}><label>Location</label><p>{selected.address}, {selected.city}</p></div>
                 <div className={style.infoItem}><label>Configuration</label><p>{selected.bedrooms} Beds / {selected.bathrooms} Baths</p></div>
                 <div className={style.infoItem}><label>Size</label><p>{selected.square_footage} sq ft</p></div>
              </div>

              <div className={style.sectionTitle}>Description</div>
              <p style={{lineHeight: 1.6, color: '#4b5563', whiteSpace: 'pre-line'}}>{selected.description}</p>
            </div>

            {/* ✅ FIXED FOOTER BUTTONS: Now using both .btn AND specific classes */}
            <div className={style.drawerFooter}>
               <button 
                 className={`${style.btn} ${style.btnDelete}`} 
                 onClick={handleDelete} 
                 disabled={busyId === selected.product_id}
               >
                 <Trash2 size={18}/> Delete
               </button>

               {selected.status !== 'rejected' && (
                 <button 
                   className={`${style.btn} ${style.btnReject}`} 
                   onClick={() => handleUpdateStatus('rejected')} 
                   disabled={busyId === selected.product_id}
                 >
                   <XCircle size={18}/> Reject
                 </button>
               )}

               {selected.status !== 'approved' && (
                 <button 
                   className={`${style.btn} ${style.btnApprove}`} 
                   onClick={() => handleUpdateStatus('approved')} 
                   disabled={busyId === selected.product_id}
                 >
                   <CheckCircle size={18}/> Approve
                 </button>
               )}
            </div>
          </div>
        </>
      )}

      {/* --- LIGHTBOX MODAL --- */}
      {lightboxOpen && selected && (
        <div className={style.lightbox} onClick={() => setLightboxOpen(false)}>
          <button className={style.lightboxClose}><X size={32} /></button>
          
          <img 
            src={selected.photos[photoIndex].url} 
            className={style.lightboxImg} 
            onClick={(e) => e.stopPropagation()} 
            alt="Fullscreen"
          />

          <button className={style.lightboxPrev} onClick={prevPhoto}><ChevronLeft size={32}/></button>
          <button className={style.lightboxNext} onClick={nextPhoto}><ChevronRight size={32}/></button>
          
          <div className={style.lightboxCounter}>
            {photoIndex + 1} / {selected.photos.length}
          </div>
        </div>
      )}

    </div>
  );
};

export default Properties;