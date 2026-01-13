import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, XCircle, Trash2, Search, MapPin, 
  Bed, Bath, Square, X, ExternalLink, ChevronLeft, ChevronRight, 
  Video, Globe, Sparkles, ScanEye, Bot, AlertTriangle, Loader2, Home, Calendar, Info,
  User, Building, Clock, RefreshCcw, Mail, Phone, Car, Armchair, Trees, DollarSign
} from "lucide-react";
import style from "../styles/adminProperty.module.css"; 
import client from "../api/axios"; 
import dayjs from "dayjs";

const Properties = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);

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

  const filteredListings = listings.filter(l => {
    const matchesSearch = l.title?.toLowerCase().includes(search.toLowerCase()) || 
                          l.product_id?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "all") return true;
    if (filter === "pending") return l.status === "pending";
    if (filter === "rejected") return l.status === "rejected";
    if (filter === "active") return l.status === "approved" && l.is_active;
    if (filter === "approved") return l.status === "approved" && !l.is_active;
    return true;
  });

  const handleBatchAnalyze = async () => {
    const pendingCount = listings.filter(l => l.status === 'pending').length;
    if (pendingCount === 0) return Swal.fire({ icon: 'info', title: 'All Clear!', text: 'No pending listings.', confirmButtonColor: '#09707d' });

    const result = await Swal.fire({
      title: 'Auto-Verify Mode',
      text: `Scan ${pendingCount} pending listings?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#7c3aed',
      confirmButtonText: 'Yes, Start AI 🤖'
    });

    if (!result.isConfirmed) return;
    setIsBatchProcessing(true);
    Swal.fire({ title: 'AI Agent Working...', timerProgressBar: true, didOpen: () => { Swal.showLoading(); } });

    try {
        const res = await client.post("/api/listings/admin/analyze-all");
        Swal.close(); 
        Swal.fire({ icon: 'success', title: 'Done!', html: `<p>✅ Approved: ${res.data.stats.approved}</p><p>❌ Rejected: ${res.data.stats.rejected}</p>`, confirmButtonColor: '#10b981' });
        fetchListings(); 
    } catch (err) { Swal.fire({ icon: 'error', title: 'Failed' }); } 
    finally { setIsBatchProcessing(false); }
  };

  const handleAnalyzeSingle = async () => {
    if (!selected) return;
    setAiLoading(true);
    try {
        const [res] = await Promise.all([
            client.post(`/api/listings/${selected.product_id}/analyze`),
            new Promise(resolve => setTimeout(resolve, 1000))
        ]);
        setAiReport(res.data);
        toast.success("Scan Complete");
    } catch (err) { toast.error("Scan failed"); } 
    finally { setAiLoading(false); }
  };

  const handleUpdateStatus = async (status) => {
    if (!selected) return;
    setBusyId(selected.product_id);
    try {
      await client.put(`/api/listings/${selected.product_id}/status`, { status });
      toast.success(`Marked as ${status}`);
      setListings(prev => prev.map(l => {
          if (l.product_id === selected.product_id) {
              return { ...l, status, is_active: status === 'approved' && l.payment_status === 'paid' };
          }
          return l;
      }));
      setSelected(null);
    } catch (err) { toast.error("Update failed"); } 
    finally { setBusyId(null); }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({ title: 'Delete?', text: "Permanent action.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete' });
    if (!result.isConfirmed) return;
    setBusyId(selected.product_id);
    try {
      await client.delete(`/api/listings/${selected.product_id}`);
      toast.success("Deleted");
      setListings(prev => prev.filter(l => l.product_id !== selected.product_id));
      setSelected(null);
    } catch (err) { toast.error("Delete failed"); } 
    finally { setBusyId(null); }
  };

  const openLightbox = (index) => { setPhotoIndex(index); setLightboxOpen(true); };
  const nextPhoto = (e) => { e.stopPropagation(); setPhotoIndex((prev) => (prev + 1) % selected.photos.length); };
  const prevPhoto = (e) => { e.stopPropagation(); setPhotoIndex((prev) => (prev - 1 + selected.photos.length) % selected.photos.length); };

  const getBadgeClass = (l) => {
    if (l.status === 'rejected') return style.rejected;
    if (l.status === 'approved' && l.is_active) return style.active;
    if (l.status === 'approved') return style.approvedUnpaid; 
    return style.pending;
  };

  const getFeaturesList = (features) => {
    if (!features) return [];
    let parsed = features;
    if (typeof features === 'string') { try { parsed = JSON.parse(features); } catch(e) { return []; } }
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === 'object' && parsed !== null) return Object.keys(parsed).filter(key => parsed[key]);
    return [];
  };

  // ✅ FIXED: Explicitly handle 'owner' as 'Landlord'
  const getRoleLabel = (role) => {
      if (!role) return "Property Landlord"; // Default fallback
      const r = role.toLowerCase();
      if (r === 'agent') return "Real Estate Agent";
      if (r === 'owner') return "Property Landlord"; // Explicit Owner check
      return "Property Landlord"; 
  };

  // ✅ Helper to format category title
  const getCategoryLabel = (l) => {
      const cat = l.category || l.listing_type || "Property";
      return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  return (
    <div className={style.dashboardContainer}>
      
      {/* HEADER */}
      <div className={style.headerRow}>
        <div>
            <h2>Property Management</h2>
            <p className={style.subtitle}>Manage inventory & verify listings.</p>
        </div>
        <div style={{display:'flex', gap:10}}>
            <button className={style.refreshBtn} onClick={fetchListings} disabled={loading}>
                <RefreshCcw size={18} className={loading ? "animate-spin" : ""}/> Refresh
            </button>
            <motion.button 
                whileHover={{ scale: 1.05 }}
                className={style.aiMagicBtn} 
                onClick={handleBatchAnalyze} 
                disabled={isBatchProcessing}
            >
                {isBatchProcessing ? <><Loader2 className="animate-spin" size={18} /> Processing...</> : <><Bot size={18} /> Auto-Verify</>}
            </motion.button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className={style.filterBar}>
        <div className={style.tabs}>
          {['pending', 'approved', 'active', 'rejected', 'all'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`${style.tab} ${filter === f ? style.tabActive : ""}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className={style.searchContainer}>
          <Search size={18} className={style.searchIcon} />
          <input type="text" placeholder="Search ID, Title..." className={style.searchInput} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* GRID */}
      <motion.div className={style.grid} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {loading ? (
            Array(8).fill(0).map((_, i) => (
                <div key={i} className={`${style.card} ${style.skeleton}`}>
                    <div className={style.skeletonImage}></div>
                    <div className={style.cardBody}>
                        <div className={`${style.skeletonTitle} ${style.skeleton}`}></div>
                        <div className={`${style.skeletonText} ${style.skeleton}`} style={{width: '60%'}}></div>
                        <div className={`${style.skeletonTag} ${style.skeleton}`} style={{width: '40%', marginTop: 10}}></div>
                    </div>
                </div>
            ))
        ) : filteredListings.length === 0 ? (
            <div className={style.emptyState}>No listings found.</div>
        ) : (
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
                  <small style={{ color: '#9ca3af' }}>{dayjs(l.created_at).format("MMM D")}</small>
                </div>
                <h3 className={style.title}>{l.title}</h3>
                <p className={style.price}>{Number(l.price).toLocaleString()} {l.price_currency}</p>
                
                <div style={{marginTop: 5, fontSize: '0.75rem', fontWeight: 600, color: l.payment_status === 'paid' ? '#059669' : '#d97706', display: 'flex', alignItems: 'center', gap: 4}}>
                    {l.payment_status === 'paid' ? <CheckCircle size={12}/> : <Clock size={12}/>}
                    {l.payment_status === 'paid' ? 'PAID' : 'UNPAID'}
                </div>

                <div className={style.agentRow}>
                  <img src={l.agent?.avatar_url || "/person-placeholder.png"} className={style.miniAvatar} alt="" />
                  <div>
                      <span style={{display: 'block', fontWeight: 500, fontSize: '0.9rem'}}>{l.agent?.full_name || "Unknown"}</span>
                      <span style={{fontSize: '0.75rem', color: '#6b7280', textTransform: 'capitalize'}}>
                          {getRoleLabel(l.agent?.role)}
                      </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* DRAWER */}
      <AnimatePresence>
      {selected && (
        <>
          <motion.div className={style.overlay} onClick={() => setSelected(null)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div className={style.drawer} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            
            <div className={style.drawerHeader}>
              <div>
                  <h3 style={{margin:0, fontSize:'1.1rem'}}>{selected.product_id}</h3>
                  <div style={{display:'flex', alignItems:'center', gap:10, marginTop:4}}>
                      <span style={{fontSize: '0.8rem', color: '#6b7280'}}>Submitted: {dayjs(selected.created_at).format("MMM D, YYYY h:mm A")}</span>
                      {selected.payment_status === 'paid' && <span className={style.paidBadge}>PAID</span>}
                  </div>
              </div>
              <div style={{display:'flex', gap:10}}>
                  <button className={style.btn} style={{padding:'8px 12px'}} onClick={() => setPreviewOpen(true)}><ExternalLink size={18} /> Preview</button>
                  <button className={style.closeBtn} onClick={() => setSelected(null)}><X size={24}/></button>
              </div>
            </div>

            <div className={style.drawerContent}>
              <div className={style.aiSection}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 15}}>
                    <h3 className={style.aiTitle}><Sparkles size={18} className={style.sparkleIcon}/> AI Verification</h3>
                    {!aiReport && !aiLoading && <button className={style.analyzeBtn} onClick={handleAnalyzeSingle}><ScanEye size={16}/> Scan</button>}
                </div>
                {aiLoading && <div className={style.scannerContainer}><div className={style.scannerBar}></div><p>Scanning...</p></div>}
                {aiReport && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`${style.aiReport} ${aiReport.score >= 80 ? style.reportSafe : style.reportRisk}`}>
                        <div className={style.scoreCircle}><span>{aiReport.score}%</span><small>Score</small></div>
                        <div className={style.reportDetails}>
                            <div className={style.reportItem}>{aiReport.imageCheck === 'passed' ? <CheckCircle size={16} color="#22c55e"/> : <AlertTriangle size={16} color="#f97316"/>}<span>Images: <strong>{aiReport.imageCheck}</strong></span></div>
                            <div className={style.reportItem}>{aiReport.locationCheck === 'passed' ? <CheckCircle size={16} color="#22c55e"/> : <XCircle size={16} color="#ef4444"/>}<span>Location: <strong>{aiReport.locationCheck}</strong></span></div>
                            <div className={style.reportItem} style={{marginTop:5, paddingTop:5, borderTop:'1px dashed #e5e7eb'}}><Info size={16} color="#64748b"/><span style={{fontSize:'0.85rem'}}>Verdict: <strong>{aiReport.verdict}</strong></span></div>
                        </div>
                    </motion.div>
                )}
              </div>

              {/* ✅ PROPERTY SPECS */}
              <div className={style.sectionTitle}>Property Specs</div>
              <div className={style.infoGrid}>
                 <div className={style.infoItem}>
                    <label>Type</label>
                    <p>{selected.property_type}</p>
                 </div>
                 
                 <div className={style.infoItem}>
                    <label>Category</label>
                    <p>{getCategoryLabel(selected)}</p>
                 </div>
                 
                 <div className={style.infoItem}>
                    <label>Structure</label>
                    <p>{selected.bedrooms} Bed / {selected.bathrooms} Bath</p>
                 </div>
                 
                 <div className={style.infoItem}>
                    <label>Size</label>
                    <p>{selected.square_footage} sq ft</p>
                 </div>
                 
                 <div className={style.infoItem}>
                    <label>Year Built</label>
                    <p>{selected.year_built || "N/A"}</p>
                 </div>
                 
                 <div className={style.infoItem}>
                    <label>Lot Size</label>
                    <p>{selected.lot_size ? `${selected.lot_size} sqft` : "N/A"}</p>
                 </div>
                 
                 <div className={style.infoItem}>
                    <label>Parking</label>
                    <p style={{display:'flex', alignItems:'center', gap:5}}>
                        <Car size={14}/> {selected.parking || "None"}
                    </p>
                 </div>
                 
                 <div className={style.infoItem}>
                    <label>Furnishing</label>
                    <p style={{display:'flex', alignItems:'center', gap:5}}>
                        <Armchair size={14}/> {selected.furnishing || "Unfurnished"}
                    </p>
                 </div>
              </div>

              {/* ✅ DESCRIPTION (Restored) */}
              <div className={style.sectionTitle}>Description</div>
              <p style={{fontSize:'0.9rem', color:'#4b5563', lineHeight:1.6, whiteSpace:'pre-line', background:'#f9fafb', padding:10, borderRadius:8}}>
                  {selected.description}
              </p>

              <div className={style.sectionTitle}>Listing Contact</div>
              <div style={{background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: '0.9rem', marginBottom: 20, border:'1px solid #e2e8f0'}}>
                  <p style={{margin:'5px 0', display:'flex', gap:8}}><User size={16} color="#64748b"/> <strong>{selected.contact_name || selected.agent?.full_name}</strong></p>
                  <p style={{margin:'5px 0', display:'flex', gap:8}}><Mail size={16} color="#64748b"/> {selected.contact_email || selected.agent?.email}</p>
                  <p style={{margin:'5px 0', display:'flex', gap:8}}><Phone size={16} color="#64748b"/> {selected.contact_phone || "N/A"}</p>
              </div>

              <div className={style.sectionTitle}>Amenities</div>
              <div style={{display:'flex', flexWrap:'wrap', gap:6, marginBottom:20}}>
                  {getFeaturesList(selected.features).map((f, i) => (
                      <span key={i} className={style.chip}>{f}</span>
                  ))}
                  {getFeaturesList(selected.features).length === 0 && <span style={{fontSize:'0.85rem', color:'#9ca3af'}}>None listed</span>}
              </div>

              <div className={style.sectionTitle}>Media Links</div>
              <div style={{display:'flex', gap:10, marginBottom:20}}>
                  {selected.video_url ? <a href={selected.video_url} target="_blank" className={style.mediaChip}><Video size={14}/> Video</a> : <span className={style.mediaChipDisabled}>No Video</span>}
                  {selected.virtual_tour_url ? <a href={selected.virtual_tour_url} target="_blank" className={style.mediaChip}><Globe size={14}/> 3D Tour</a> : <span className={style.mediaChipDisabled}>No 3D Tour</span>}
              </div>

              <div className={style.agentCard}>
                <img src={selected.agent?.avatar_url || "/person-placeholder.png"} className={style.agentAvatarLarge} alt="Profile" />
                <div className={style.agentInfo}>
                  <h4>{selected.agent?.full_name}</h4>
                  <p style={{margin:'0', fontSize:'0.8rem', color:'#64748b'}}>{getRoleLabel(selected.agent?.role)}</p>
                </div>
                <a href={`/profile/${selected.agent?.unique_id}`} target="_blank" rel="noreferrer" style={{marginLeft: 'auto'}}><ExternalLink size={18} color="#6b7280"/></a>
              </div>
            </div>

            <div className={style.drawerFooter}>
               <button className={`${style.btn} ${style.btnDelete}`} onClick={handleDelete} disabled={busyId}>Delete</button>
               {selected.status !== 'rejected' && <button className={`${style.btn} ${style.btnReject}`} onClick={() => handleUpdateStatus('rejected')} disabled={busyId}>Reject</button>}
               {selected.status !== 'approved' && <button className={`${style.btn} ${style.btnApprove}`} onClick={() => handleUpdateStatus('approved')} disabled={busyId}>Approve</button>}
            </div>
          </motion.div>
        </>
      )}
      </AnimatePresence>

      {/* --- PREVIEW MODAL --- */}
      {previewOpen && selected && (
        <div className={style.overlay} style={{zIndex:70, display:'flex', alignItems:'center', justifyContent:'center'}}>
            <motion.div 
                className={style.modalContent} 
                initial={{opacity: 0, y: 50}}
                animate={{opacity: 1, y: 0}}
                style={{width: '90%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', background: 'white', borderRadius: '16px', padding: '0'}}
            >
                <div style={{position: 'relative', height: '300px', background: '#f3f4f6'}}>
                    <img src={selected.photos?.[0]?.url || "/placeholder.png"} style={{width: '100%', height: '100%', objectFit: 'cover'}} alt="Header" />
                    <button onClick={() => setPreviewOpen(false)} style={{position: 'absolute', top: 15, right: 15, background: 'white', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}><X size={24}/></button>
                    <div style={{position: 'absolute', bottom: 20, left: 20, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '5px 15px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold'}}>{selected.photos?.length} Photos</div>
                </div>

                <div style={{padding: '30px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px'}}>
                    {/* Left Column */}
                    <div>
                        <div style={{marginBottom: '20px'}}>
                            <h2 style={{margin: '0 0 10px 0', fontSize: '1.8rem', color: '#111827'}}>{selected.title}</h2>
                            <p style={{display: 'flex', alignItems: 'center', gap: '5px', color: '#6b7280', fontSize: '1rem'}}>
                                <MapPin size={18}/> {selected.address}, {selected.city}, {selected.state} {selected.zip_code}
                            </p>
                        </div>

                        <div style={{display: 'flex', gap: '20px', padding: '20px 0', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', marginBottom: '20px'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#374151'}}><Bed size={20} color="#09707d"/> {selected.bedrooms} Beds</div>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#374151'}}><Bath size={20} color="#09707d"/> {selected.bathrooms} Baths</div>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#374151'}}><Square size={20} color="#09707d"/> {selected.square_footage} sqft</div>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#374151'}}><Home size={20} color="#09707d"/> {selected.property_type}</div>
                        </div>

                        {/* ✅ DESCRIPTION (Modal) */}
                        <div style={{marginBottom: '30px'}}>
                            <h3 style={{fontSize: '1.2rem', marginBottom: '10px'}}>Description</h3>
                            <p style={{lineHeight: '1.6', color: '#4b5563', whiteSpace: 'pre-line'}}>{selected.description}</p>
                        </div>

                        <div>
                            <h3 style={{fontSize: '1.2rem', marginBottom: '15px'}}>Amenities</h3>
                            <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
                                {getFeaturesList(selected.features).map((feature, idx) => (
                                    <span key={idx} style={{background: '#f3f4f6', padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem', color: '#374151', textTransform: 'capitalize'}}>{feature}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
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
                                    <p style={{margin: '0', color: '#6b7280', fontSize: '0.9rem'}}>{getRoleLabel(selected.agent?.role)}</p>
                                </div>
                            </div>
                            <button style={{width: '100%', padding: '12px', background: '#09707d', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'not-allowed', opacity: '0.8'}}>Contact {getRoleLabel(selected.agent?.role).split(' ')[1]}</button>
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