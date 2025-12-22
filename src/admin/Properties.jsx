import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { 
  CheckCircle, XCircle, Trash2, Search, MapPin, 
  Bed, Bath, X, ExternalLink, ChevronLeft, ChevronRight, 
  Video, Globe, Sparkles, ScanEye, Bot, AlertTriangle, Loader2 
} from "lucide-react";
import style from "../styles/adminProperty.module.css";
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

  // --- Reset AI Report when selection changes ---
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

  // 1. Batch Analyze (The "Magic Button")
  const handleBatchAnalyze = async () => {
    // Count pending items to warn user
    const pendingCount = listings.filter(l => l.status === 'pending').length;
    if (pendingCount === 0) return toast.info("No pending listings to analyze.");

    if (!window.confirm(`Are you sure? This will run AI analysis on ${pendingCount} pending listings and automatically Approve or Reject them.`)) return;
    
    setIsBatchProcessing(true);
    try {
        const res = await client.post("/api/listings/admin/analyze-all");
        toast.success(`Analysis Complete: ${res.data.stats.approved} Approved, ${res.data.stats.rejected} Rejected.`);
        fetchListings(); // Refresh grid to show new statuses
    } catch (err) {
        console.error(err);
        toast.error("Batch analysis failed.");
    } finally {
        setIsBatchProcessing(false);
    }
  };

  // 2. Single Listing Analyze (Inside Drawer)
  const handleAnalyzeSingle = async () => {
    if (!selected) return;
    setAiLoading(true);
    try {
        const res = await client.post(`/api/listings/${selected.product_id}/analyze`);
        setAiReport(res.data);
        toast.success("AI Analysis Complete");
    } catch (err) {
        console.error(err);
        toast.error("Analysis failed. Check logs.");
    } finally {
        setAiLoading(false);
    }
  };

  // =========================================================
  // MANUAL ACTIONS
  // =========================================================

  const handleUpdateStatus = async (status) => {
    if (!selected) return;
    setBusyId(selected.product_id);
    try {
      await client.put(`/api/listings/${selected.product_id}/status`, { status });
      toast.success(`Listing marked as ${status}`);
      setListings(prev => prev.map(l => l.product_id === selected.product_id ? { ...l, status } : l));
      setSelected(null);
    } catch (err) { toast.error("Update failed"); } 
    finally { setBusyId(null); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Permanently delete?")) return;
    setBusyId(selected.product_id);
    try {
      await client.delete(`/api/listings/${selected.product_id}`);
      toast.success("Deleted");
      setListings(prev => prev.filter(l => l.product_id !== selected.product_id));
      setSelected(null);
    } catch (err) { toast.error("Delete failed"); } 
    finally { setBusyId(null); }
  };

  // Lightbox helpers
  const openLightbox = (index) => { setPhotoIndex(index); setLightboxOpen(true); };
  const nextPhoto = (e) => { e.stopPropagation(); setPhotoIndex((prev) => (prev + 1) % selected.photos.length); };
  const prevPhoto = (e) => { e.stopPropagation(); setPhotoIndex((prev) => (prev - 1 + selected.photos.length) % selected.photos.length); };

  // Helper Styles
  const getBadgeClass = (l) => {
    if (l.status === 'rejected') return style.rejected;
    if (l.status === 'approved' && l.is_active) return style.active;
    return style.pending;
  };

  return (
    <div className={style.dashboardContainer}>
      
      {/* --- HEADER --- */}
      <div className={style.headerRow}>
        <div>
            <h2>Property Management</h2>
            <p className={style.subtitle}>Manage inventory & verify listings.</p>
        </div>

        {/* 🤖 THE MAGIC BATCH BUTTON */}
        <button 
            className={style.aiMagicBtn} 
            onClick={handleBatchAnalyze} 
            disabled={isBatchProcessing}
        >
            {isBatchProcessing ? (
                <><Loader2 className="animate-spin" size={18} /> AI Working...</>
            ) : (
                <><Bot size={18} /> Auto-Verify Pending</>
            )}
        </button>
      </div>

      {/* --- FILTER BAR --- */}
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
            type="text" placeholder="Search ID, Title..." className={style.searchInput}
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* --- GRID --- */}
      <div className={style.grid}>
        {loading ? <div className={style.loader}><Loader2 size={32} className="animate-spin"/></div> : 
         filteredListings.length === 0 ? <div className={style.emptyState}>No listings found.</div> : (
          filteredListings.map(l => (
            <div key={l.product_id} className={style.card} onClick={() => setSelected(l)}>
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
            </div>
          ))
        )}
      </div>

      {/* --- DRAWER --- */}
      {selected && (
        <>
          <div className={style.overlay} onClick={() => setSelected(null)} />
          <div className={style.drawer}>
            
            <div className={style.drawerHeader}>
              <div>
                 <h3 style={{margin:0}}>{selected.product_id}</h3>
                 <span style={{fontSize: '0.85rem', color: '#6b7280'}}>Submitted: {new Date(selected.created_at).toLocaleString()}</span>
              </div>
              <button className={style.closeBtn} onClick={() => setSelected(null)}><X size={24}/></button>
            </div>

            <div className={style.drawerContent}>
              
              {/* 🤖 AI ANALYSIS SECTION (Single Item) */}
              <div className={style.aiSection}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 10}}>
                    <h3 className={style.aiTitle}><Sparkles size={18}/> AI Verification</h3>
                    {!aiReport && !aiLoading && (
                        <button className={style.analyzeBtn} onClick={handleAnalyzeSingle}>
                            <ScanEye size={16}/> Scan This Listing
                        </button>
                    )}
                </div>

                {aiLoading && (
                    <div className={style.aiLoading}>
                        <div className={style.spinner}></div>
                        <p>Analyzing photos & coordinates...</p>
                    </div>
                )}

                {aiReport && (
                    <div className={`${style.aiReport} ${aiReport.score >= 80 ? style.reportSafe : style.reportRisk}`}>
                        <div className={style.scoreCircle}>
                            <span>{aiReport.score}%</span>
                            <small>Score</small>
                        </div>
                        <div className={style.reportDetails}>
                            <div className={style.reportItem}>
                                {aiReport.imageCheck === 'passed' ? <CheckCircle size={16} color="#22c55e"/> : <AlertTriangle size={16} color="#f97316"/>}
                                <span>Images: <strong>{aiReport.imageCheck === 'passed' ? "Real Estate" : "Suspicious"}</strong></span>
                            </div>
                            <div className={style.reportItem}>
                                {aiReport.locationCheck === 'passed' ? <CheckCircle size={16} color="#22c55e"/> : <XCircle size={16} color="#ef4444"/>}
                                <span>Location: <strong>{aiReport.locationCheck === 'passed' ? "Verified" : "Invalid"}</strong></span>
                            </div>
                            <div className={style.reportItem}>
                                {aiReport.agentConsistency === 'passed' ? <CheckCircle size={16} color="#22c55e"/> : <AlertTriangle size={16} color="#f97316"/>}
                                <span>Agent Match: <strong>{aiReport.agentConsistency === 'passed' ? "Consistent" : "Mismatch"}</strong></span>
                            </div>
                        </div>
                    </div>
                )}
              </div>

              {/* Visuals */}
              <div className={style.sectionTitle}>Visuals</div>
              <div className={style.galleryGrid}>
                {selected.photos?.length > 0 ? (
                  <>
                    <img src={selected.photos[0].url} className={style.galleryMain} alt="Main" onClick={() => openLightbox(0)}/>
                    {selected.photos.slice(1, 5).map((p, i) => (
                      <img key={i} src={p.url} className={style.galleryThumb} alt="Thumb" onClick={() => openLightbox(i + 1)}/>
                    ))}
                  </>
                ) : <p>No photos available</p>}
              </div>

              {/* Agent & Details (Keep existing) */}
              <div className={style.sectionTitle}>Agent</div>
              <div className={style.agentCard}>
                <img src={selected.agent?.avatar_url || "/person-placeholder.png"} className={style.agentAvatarLarge} alt="Agent" />
                <div className={style.agentInfo}>
                  <h4>{selected.agent?.full_name}</h4>
                  <p>@{selected.agent?.username}</p>
                </div>
                <a href={`/profile/${selected.agent?.unique_id}`} target="_blank" rel="noreferrer" style={{marginLeft: 'auto'}}><ExternalLink size={18} color="#6b7280"/></a>
              </div>

              <div className={style.sectionTitle}>Details</div>
              <h2 style={{marginTop:0}}>{selected.title}</h2>
              <p style={{fontSize:'1.3rem', fontWeight:'bold', color:'#09707d'}}>{Number(selected.price).toLocaleString()} {selected.price_currency}</p>
              <div className={style.infoGrid} style={{marginTop:15}}>
                 <div className={style.infoItem}><label>Type</label><p>{selected.property_type}</p></div>
                 <div className={style.infoItem}><label>Location</label><p>{selected.city}, {selected.country}</p></div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className={style.drawerFooter}>
               <button className={`${style.btn} ${style.btnDelete}`} onClick={handleDelete} disabled={busyId}>Delete</button>
               {selected.status !== 'rejected' && <button className={`${style.btn} ${style.btnReject}`} onClick={() => handleUpdateStatus('rejected')} disabled={busyId}>Reject</button>}
               {selected.status !== 'approved' && <button className={`${style.btn} ${style.btnApprove}`} onClick={() => handleUpdateStatus('approved')} disabled={busyId}>Approve</button>}
            </div>
          </div>
        </>
      )}

      {/* Lightbox (Standard) */}
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