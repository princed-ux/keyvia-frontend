import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, XCircle, Trash2, Search, MapPin, 
  Bed, Bath, Square, X, ExternalLink, ChevronLeft, ChevronRight, 
  Video, Globe, Sparkles, ScanEye, Bot, AlertTriangle, Loader2, Home, Calendar, Info
} from "lucide-react";
import style from "../styles/adminProperty.module.css"; // Ensure this CSS is up to date
import client from "../api/axios"; 

const Properties = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  
  // Batch AI State
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Drawer & Selection
  const [selected, setSelected] = useState(null);
  const [busyId, setBusyId] = useState(null);

  // Single AI Analysis State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState(null);

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  // Preview Modal State
  const [previewOpen, setPreviewOpen] = useState(false);

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

  useEffect(() => {
    setAiReport(null);
    setAiLoading(false);
  }, [selected]);

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

  // =========================================================
  // 🤖 AI ACTIONS
  // =========================================================

  const handleBatchAnalyze = async () => {
    const pendingCount = listings.filter(l => l.status === 'pending').length;
    
    if (pendingCount === 0) {
      return Swal.fire({
        icon: 'info',
        title: 'All Clear!',
        text: 'No pending listings to verify.',
        confirmButtonColor: '#09707d'
      });
    }

    const result = await Swal.fire({
      title: 'Auto-Verify Mode',
      text: `AI will scan ${pendingCount} pending listings. This usually takes about ${Math.ceil(pendingCount * 0.5)} seconds.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#7c3aed',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Start AI Agent 🤖',
      background: '#fff',
      backdrop: `rgba(0,0,123,0.1)`
    });

    if (!result.isConfirmed) return;
    
    setIsBatchProcessing(true);
    
    Swal.fire({
      title: 'AI Agent Working...',
      html: 'Analyzing photos, checking maps, and validating profiles.',
      timerProgressBar: true,
      didOpen: () => { Swal.showLoading(); },
      allowOutsideClick: false
    });

    try {
        const res = await client.post("/api/listings/admin/analyze-all");
        Swal.close(); 

        Swal.fire({
          icon: 'success',
          title: 'Verification Complete!',
          html: `
            <div style="text-align: left; padding: 10px;">
              <p>✅ <b>Approved:</b> ${res.data.stats.approved}</p>
              <p>❌ <b>Rejected:</b> ${res.data.stats.rejected}</p>
              <p>⚠️ <b>Failed:</b> ${res.data.stats.failed}</p>
            </div>
          `,
          confirmButtonColor: '#10b981'
        });

        fetchListings(); 
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'Oops...', text: 'Batch analysis failed.' });
    } finally {
        setIsBatchProcessing(false);
    }
  };

  const handleAnalyzeSingle = async () => {
    if (!selected) return;
    setAiLoading(true);
    
    // Minimal delay for UX
    setTimeout(async () => {
        try {
            const res = await client.post(`/api/listings/${selected.product_id}/analyze`);
            setAiReport(res.data);
            toast.success("Scan Complete!");
        } catch (err) {
            toast.error("Analysis failed.");
        } finally {
            setAiLoading(false);
        }
    }, 1000); 
  };

  // =========================================================
  // MANUAL ACTIONS
  // =========================================================

  const handleUpdateStatus = async (status) => {
    if (!selected) return;
    setBusyId(selected.product_id);
    try {
      await client.put(`/api/listings/${selected.product_id}/status`, { status });
      toast.success(`Marked as ${status}`);
      setListings(prev => prev.map(l => l.product_id === selected.product_id ? { ...l, status } : l));
      setSelected(null);
    } catch (err) { toast.error("Update failed"); } 
    finally { setBusyId(null); }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
        title: 'Delete Listing?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete it!'
    });

    if (!result.isConfirmed) return;

    setBusyId(selected.product_id);
    try {
      await client.delete(`/api/listings/${selected.product_id}`);
      Swal.fire('Deleted!', 'Listing has been deleted.', 'success');
      setListings(prev => prev.filter(l => l.product_id !== selected.product_id));
      setSelected(null);
    } catch (err) { toast.error("Delete failed"); } 
    finally { setBusyId(null); }
  };

  // Lightbox helpers
  const openLightbox = (index) => { setPhotoIndex(index); setLightboxOpen(true); };
  const nextPhoto = (e) => { e.stopPropagation(); setPhotoIndex((prev) => (prev + 1) % selected.photos.length); };
  const prevPhoto = (e) => { e.stopPropagation(); setPhotoIndex((prev) => (prev - 1 + selected.photos.length) % selected.photos.length); };

  const getBadgeClass = (l) => {
    if (l.status === 'rejected') return style.rejected;
    if (l.status === 'approved' && l.is_active) return style.active;
    return style.pending;
  };

  // --- Parse Features Helper ---
  const getFeaturesList = (features) => {
    if (!features) return [];
    let parsed = {};
    if (typeof features === 'string') {
        try { parsed = JSON.parse(features); } catch(e) {}
    } else {
        parsed = features;
    }
    // Return array of keys where value is true
    return Object.keys(parsed).filter(key => parsed[key]);
  };

  return (
    <div className={style.dashboardContainer}>
      
      {/* --- HEADER --- */}
      <div className={style.headerRow}>
        <div>
            <h2>Property Management</h2>
            <p className={style.subtitle}>Manage inventory & verify listings.</p>
        </div>

        {/* 🤖 ANIMATED MAGIC BUTTON */}
        <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={style.aiMagicBtn} 
            onClick={handleBatchAnalyze} 
            disabled={isBatchProcessing}
        >
            {isBatchProcessing ? (
                <><Loader2 className="animate-spin" size={18} /> Processing...</>
            ) : (
                <><Bot size={18} /> Auto-Verify Pending</>
            )}
        </motion.button>
      </div>

      {/* --- FILTER BAR --- */}
      <div className={style.filterBar}>
        <div className={style.tabs}>
          {['pending', 'active', 'rejected', 'all'].map(f => (
            <button 
              key={f} onClick={() => setFilter(f)} 
              className={`${style.tab} ${filter === f ? style.tabActive : ""}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className={style.searchContainer}>
          <Search size={18} className={style.searchIcon} />
          <input 
            type="text" placeholder="Search ID, Title..." className={style.searchInput}
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* --- GRID --- */}
      <motion.div 
        className={style.grid}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {loading ? <div className={style.loader}><Loader2 size={32} className="animate-spin"/></div> : 
         filteredListings.length === 0 ? <div className={style.emptyState}>No listings found.</div> : (
          filteredListings.map(l => (
            <motion.div 
                layoutId={l.product_id}
                key={l.product_id} 
                className={style.card} 
                onClick={() => setSelected(l)}
                whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
            >
              <img src={l.photos?.[0]?.url || "/placeholder.png"} className={style.cardImage} alt={l.title} />
              <div className={style.cardBody}>
                <div className={style.cardHeader}>
                  <span className={`${style.badge} ${getBadgeClass(l)}`}>{l.status}</span>
                  <small style={{ color: '#9ca3af' }}>{new Date(l.created_at).toLocaleDateString()}</small>
                </div>
                <h3 className={style.title}>{l.title}</h3>
                <p className={style.price}>{Number(l.price).toLocaleString()} {l.price_currency}</p>
                <div className={style.agentRow}>
                  <img src={l.agent?.avatar_url || "/person-placeholder.png"} className={style.miniAvatar} alt="" />
                  <span>{l.agent?.full_name || "Unknown"}</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* --- DRAWER --- */}
      <AnimatePresence>
      {selected && (
        <>
          <motion.div 
            className={style.overlay} 
            onClick={() => setSelected(null)} 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div 
            className={style.drawer}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            
            <div className={style.drawerHeader}>
              <div>
                 <h3 style={{margin:0}}>{selected.product_id}</h3>
                 <span style={{fontSize: '0.85rem', color: '#6b7280'}}>Submitted: {new Date(selected.created_at).toLocaleString()}</span>
              </div>
              <div style={{display:'flex', gap:10}}>
                  <button className={style.btn} style={{padding:'8px 12px'}} onClick={() => setPreviewOpen(true)}>
                      <ExternalLink size={18} /> Preview
                  </button>
                  <button className={style.closeBtn} onClick={() => setSelected(null)}><X size={24}/></button>
              </div>
            </div>

            <div className={style.drawerContent}>
              
              {/* 🤖 AI ANALYSIS SECTION */}
              <div className={style.aiSection}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 15}}>
                    <h3 className={style.aiTitle}><Sparkles size={18} className={style.sparkleIcon}/> AI Verification</h3>
                    {!aiReport && !aiLoading && (
                        <button className={style.analyzeBtn} onClick={handleAnalyzeSingle}>
                            <ScanEye size={16}/> Scan Listing
                        </button>
                    )}
                </div>

                {/* 🌀 ANIMATED SCANNER */}
                {aiLoading && (
                    <div className={style.scannerContainer}>
                        <div className={style.scannerBar}></div>
                        <p>Scanning Images & Metadata...</p>
                    </div>
                )}

                {/* 📋 REPORT CARD */}
                {aiReport && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`${style.aiReport} ${aiReport.score >= 80 ? style.reportSafe : style.reportRisk}`}
                    >
                        <div className={style.scoreCircle}>
                            <span>{aiReport.score}%</span>
                            <small>Trust Score</small>
                        </div>
                        <div className={style.reportDetails}>
                            <div className={style.reportItem}>
                                {aiReport.imageCheck === 'passed' ? <CheckCircle size={16} color="#22c55e"/> : <AlertTriangle size={16} color="#f97316"/>}
                                <span>Images: <strong>{aiReport.imageCheck === 'passed' ? "Authentic" : "Suspicious/Blurry"}</strong></span>
                            </div>
                            <div className={style.reportItem}>
                                {aiReport.locationCheck === 'passed' ? <CheckCircle size={16} color="#22c55e"/> : <XCircle size={16} color="#ef4444"/>}
                                <span>Location: <strong>{aiReport.locationCheck === 'passed' ? "Verified Coordinates" : "Invalid/Ocean"}</strong></span>
                            </div>
                            <div className={style.reportItem}>
                                {aiReport.agentConsistency === 'passed' ? <CheckCircle size={16} color="#22c55e"/> : <AlertTriangle size={16} color="#f97316"/>}
                                <span>Agent Data: <strong>{aiReport.agentConsistency === 'passed' ? "Consistent" : "Mismatch"}</strong></span>
                            </div>
                            <div className={style.reportItem} style={{marginTop:5, paddingTop:5, borderTop:'1px dashed #e5e7eb'}}>
                                <Info size={16} color="#64748b"/>
                                <span style={{fontSize:'0.85rem', color:'#64748b'}}>Verdict: <strong>{aiReport.verdict}</strong></span>
                            </div>
                        </div>
                    </motion.div>
                )}
              </div>

              {/* Visuals */}
              <div className={style.sectionTitle}>Listing Images</div>
              <div className={style.galleryGrid}>
                {selected.photos?.length > 0 ? (
                  <>
                    <motion.img whileHover={{ scale: 1.02 }} src={selected.photos[0].url} className={style.galleryMain} alt="Main" onClick={() => openLightbox(0)}/>
                    {selected.photos.slice(1, 5).map((p, i) => (
                      <motion.img whileHover={{ scale: 1.05 }} key={i} src={p.url} className={style.galleryThumb} alt="Thumb" onClick={() => openLightbox(i + 1)}/>
                    ))}
                  </>
                ) : <p>No photos available</p>}
              </div>

              {/* Details */}
              <div className={style.sectionTitle}>Details</div>
              <h2 style={{marginTop:0}}>{selected.title}</h2>
              <p style={{fontSize:'1.3rem', fontWeight:'bold', color:'#09707d'}}>{Number(selected.price).toLocaleString()} {selected.price_currency}</p>
              
              <div className={style.infoGrid}>
                 <div className={style.infoItem}><label>Location</label><p>{selected.address}, {selected.city}</p></div>
                 <div className={style.infoItem}><label>Type</label><p>{selected.property_type} ({selected.listing_type})</p></div>
                 <div className={style.infoItem}><label>Bed/Bath</label><p>{selected.bedrooms} Beds / {selected.bathrooms} Baths</p></div>
                 <div className={style.infoItem}><label>Size</label><p>{selected.square_footage} sq ft</p></div>
              </div>

              <div className={style.agentCard}>
                <img src={selected.agent?.avatar_url || "/person-placeholder.png"} className={style.agentAvatarLarge} alt="Agent" />
                <div className={style.agentInfo}>
                  <h4>{selected.agent?.full_name}</h4>
                  <p>@{selected.agent?.username} • {selected.agent?.agency_name}</p>
                  <p style={{fontSize:'0.8rem', color:'#64748b'}}>{selected.agent?.email}</p>
                </div>
                <a href={`/profile/${selected.agent?.unique_id}`} target="_blank" rel="noreferrer" style={{marginLeft: 'auto'}}><ExternalLink size={18} color="#6b7280"/></a>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className={style.drawerFooter}>
               <button className={`${style.btn} ${style.btnDelete}`} onClick={handleDelete} disabled={busyId}>Delete</button>
               {selected.status !== 'rejected' && <button className={`${style.btn} ${style.btnReject}`} onClick={() => handleUpdateStatus('rejected')} disabled={busyId}>Reject</button>}
               {selected.status !== 'approved' && <button className={`${style.btn} ${style.btnApprove}`} onClick={() => handleUpdateStatus('approved')} disabled={busyId}>Approve</button>}
            </div>
          </motion.div>
        </>
      )}
      </AnimatePresence>

      {/* --- PREVIEW MODAL (Full Details) --- */}
      {previewOpen && selected && (
        <div className={style.overlay} style={{zIndex:70, display:'flex', alignItems:'center', justifyContent:'center'}}>
            <motion.div 
                className={style.modalContent} // Ensure this style exists in CSS (max-width: 900px, bg white, rounded)
                initial={{opacity: 0, y: 50}}
                animate={{opacity: 1, y: 0}}
                style={{width: '90%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', background: 'white', borderRadius: '16px', padding: '0'}}
            >
                {/* Modal Header/Image */}
                <div style={{position: 'relative', height: '300px', background: '#f3f4f6'}}>
                    <img src={selected.photos?.[0]?.url || "/placeholder.png"} style={{width: '100%', height: '100%', objectFit: 'cover'}} alt="Header" />
                    <button 
                        onClick={() => setPreviewOpen(false)}
                        style={{position: 'absolute', top: 15, right: 15, background: 'white', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}
                    >
                        <X size={24}/>
                    </button>
                    <div style={{position: 'absolute', bottom: 20, left: 20, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '5px 15px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold'}}>
                        {selected.photos?.length} Photos
                    </div>
                </div>

                {/* Modal Body */}
                <div style={{padding: '30px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px'}}>
                    {/* Left Column: Details */}
                    <div>
                        <div style={{marginBottom: '20px'}}>
                            <h2 style={{margin: '0 0 10px 0', fontSize: '1.8rem', color: '#111827'}}>{selected.title}</h2>
                            <p style={{display: 'flex', alignItems: 'center', gap: '5px', color: '#6b7280', fontSize: '1rem'}}>
                                <MapPin size={18}/> {selected.address}, {selected.city}, {selected.state} {selected.zip_code}
                            </p>
                        </div>

                        <div style={{display: 'flex', gap: '20px', padding: '20px 0', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', marginBottom: '20px'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#374151'}}>
                                <Bed size={20} color="#09707d"/> {selected.bedrooms} Beds
                            </div>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#374151'}}>
                                <Bath size={20} color="#09707d"/> {selected.bathrooms} Baths
                            </div>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#374151'}}>
                                <Square size={20} color="#09707d"/> {selected.square_footage} sqft
                            </div>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#374151'}}>
                                <Home size={20} color="#09707d"/> {selected.property_type}
                            </div>
                        </div>

                        <div style={{marginBottom: '30px'}}>
                            <h3 style={{fontSize: '1.2rem', marginBottom: '10px'}}>Description</h3>
                            <p style={{lineHeight: '1.6', color: '#4b5563', whiteSpace: 'pre-line'}}>{selected.description}</p>
                        </div>

                        {/* Features List */}
                        <div>
                            <h3 style={{fontSize: '1.2rem', marginBottom: '15px'}}>Amenities & Features</h3>
                            <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
                                {getFeaturesList(selected.features).map((feature, idx) => (
                                    <span key={idx} style={{background: '#f3f4f6', padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem', color: '#374151', textTransform: 'capitalize'}}>
                                        {feature}
                                    </span>
                                ))}
                                {getFeaturesList(selected.features).length === 0 && <p style={{color: '#9ca3af', fontStyle: 'italic'}}>No amenities listed.</p>}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Price & Agent */}
                    <div>
                        <div style={{background: '#f9fafb', padding: '25px', borderRadius: '16px', border: '1px solid #e5e7eb', position: 'sticky', top: '20px'}}>
                            <p style={{fontSize: '0.9rem', color: '#6b7280', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600'}}>Price</p>
                            <h2 style={{margin: '0 0 20px 0', fontSize: '2.2rem', color: '#09707d'}}>
                                {Number(selected.price).toLocaleString()} <span style={{fontSize: '1rem', color: '#6b7280'}}>{selected.price_currency}</span>
                            </h2>
                            
                            <div style={{height: '1px', background: '#e5e7eb', margin: '20px 0'}}></div>

                            <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px'}}>
                                <img src={selected.agent?.avatar_url || "/person-placeholder.png"} style={{width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover'}} alt="Agent" />
                                <div>
                                    <h4 style={{margin: '0', fontSize: '1.1rem'}}>{selected.agent?.full_name}</h4>
                                    <p style={{margin: '0', color: '#6b7280', fontSize: '0.9rem'}}>Listing Agent</p>
                                </div>
                            </div>

                            <button style={{width: '100%', padding: '12px', background: '#09707d', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'not-allowed', opacity: '0.8'}}>
                                Contact Agent
                            </button>
                            <p style={{textAlign: 'center', fontSize: '0.8rem', color: '#9ca3af', marginTop: '10px'}}>Preview Mode Only</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && selected && (
        <div className={style.lightbox} onClick={() => setLightboxOpen(false)}>
          <button className={style.lightboxClose}><X size={32} /></button>
          <img src={selected.photos[photoIndex].url} className={style.lightboxImg} onClick={e=>e.stopPropagation()} />
          <button className={style.lightboxPrev} onClick={prevPhoto}><ChevronLeft size={32}/></button>
          <button className={style.lightboxNext} onClick={nextPhoto}><ChevronRight size={32}/></button>
        </div>
      )}
    </div>
  );
};

export default Properties;