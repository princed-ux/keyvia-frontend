import React, { useState, useMemo } from "react";
import Swal from "sweetalert2";
import client from "../api/axios"; 
import { 
  CheckCircle2, XCircle, Shield, AlertTriangle, 
  Search, ScanFace, Globe, Loader2, Sparkles,
  MapPin, Briefcase, UserCheck, Calendar, RefreshCw, Filter, User, Hash, Star, FileText
} from "lucide-react";
import style from "../styles/adminProfileReviews.module.css"; 

// ✅ 1. Import Hook
import useAutoFetch from '../hooks/useAutoFetch';

const ProfileReviews = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filterRole, setFilterRole] = useState("all"); 
  
  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [bulkScanning, setBulkScanning] = useState(false);
  const [aiReport, setAiReport] = useState(null);

  // --- FETCH DATA (Updated) ---
  const fetchProfiles = async () => {
    // Only show full page loader on initial load
    if (profiles.length === 0) setLoading(true);
    
    try {
      const res = await client.get("/api/admin/profiles/pending");
      setProfiles(res.data);
    } catch (err) {
      console.error(err);
      // Only show alert if it's a manual interaction failure
      if(loading) Swal.fire("Error", "Failed to load profiles", "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 2. Use Hook (Replaces manual useEffect)
  useAutoFetch(fetchProfiles);

  // Reset AI report when selection changes
  useMemo(() => { setAiReport(null); }, [selected]);

  // ✅ LOGIC: ROLE DETECTION
  const detectRole = (p) => {
      // 1. Trust Special ID Prefix first
      if (p.special_id) {
          if (p.special_id.startsWith("AGT")) return "agent";
          if (p.special_id.startsWith("OWN")) return "owner";
      }

      // 2. Fallback: Check License Number
      if (p.license_number && p.license_number.trim().length > 3) {
          return 'agent';
      }
      
      return 'owner';
  };

  // ✅ LOGIC: FORMAT LOCATION
  const formatLocation = (city, country) => {
      const capitalize = (str) => {
          if (!str || str === "null" || str === "undefined") return "";
          return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      };
      
      const c = capitalize(city);
      const co = capitalize(country);
      
      if (c && co) return `${c}, ${co}`;
      if (co) return co;
      return "Location N/A";
  };

  // --- FILTER LOGIC ---
  const filteredProfiles = useMemo(() => {
      if (filterRole === 'all') return profiles;
      return profiles.filter(p => detectRole(p) === filterRole);
  }, [profiles, filterRole]);

  // --- ACTIONS ---
  const handleAnalyze = async () => {
    if (!selected) return;
    setAiLoading(true);
    try {
        const res = await client.post(`/api/admin/profiles/${selected.unique_id}/analyze`);
        setAiReport(res.data);
    } catch (err) {
        Swal.fire("Analysis Failed", "Could not connect to AI service.", "error");
    } finally {
        setAiLoading(false);
    }
  };

  const handleBulkScan = async () => {
    if (profiles.length === 0) return;
    const confirm = await Swal.fire({
        title: 'Run Auto-Pilot?',
        text: `Scan ${profiles.length} profiles? AI will auto-approve safe ones.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#09707d',
        confirmButtonText: 'Yes, Scan All 🤖'
    });
    if (!confirm.isConfirmed) return;

    setBulkScanning(true);
    try {
        const res = await client.post("/api/admin/profiles/analyze-all");
        const { approved, rejected, remaining } = res.data;
        await Swal.fire({
            title: 'Scan Complete!',
            html: `<div style="text-align:left;"><p>✅ <b>Auto-Approved:</b> ${approved}</p><p>❌ <b>Auto-Rejected:</b> ${rejected}</p><p>⚠️ <b>Manual Review:</b> ${remaining}</p></div>`,
            icon: 'success'
        });
        fetchProfiles(); 
    } catch (err) {
        Swal.fire("Error", "Bulk scan failed.", "error");
    } finally {
        setBulkScanning(false);
    }
  };

  const handleVerdict = async (status) => {
    if (!selected) return;
    let reason = null;
    if (status === 'rejected') {
        const { value: text } = await Swal.fire({
            title: 'Reason for Rejection',
            input: 'textarea',
            inputPlaceholder: 'Reason...',
            showCancelButton: true,
            confirmButtonColor: '#dc2626'
        });
        if (!text) return; 
        reason = text;
    }

    try {
        await client.put(`/api/admin/profiles/${selected.unique_id}/status`, { status, reason });
        
        // Optimistic UI update
        setProfiles(prev => prev.filter(p => p.unique_id !== selected.unique_id));
        setSelected(null);
        
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Status Updated', showConfirmButton: false, timer: 2000 });
    } catch (err) {
        Swal.fire("Error", "Action failed", "error");
    }
  };

  const getScoreColor = (score) => {
      if (score >= 80) return '#10b981'; 
      if (score >= 50) return '#f59e0b'; 
      return '#ef4444'; 
  };

  return (
    <div className={style.dashboardContainer}>
      
      {/* HEADER */}
      <div className={style.headerRow}>
        <div>
            <h2 style={{display:'flex', alignItems:'center', gap:10}}>
                <UserCheck size={28} color="#09707d"/> Verification Queue
            </h2>
            <p className={style.subtitle}>Review pending Agents & Landlords.</p>
        </div>
        
        <div style={{display:'flex', gap:12, alignItems:'center'}}>
            
            {/* COUNT BADGE */}
            <div className={style.countBadge}>
                <Hash size={16}/> 
                <b>{profiles.length}</b> Pending
            </div>

            <div className={style.filterGroup}>
                <button className={`${style.filterBtn} ${filterRole === 'all' ? style.activeFilter : ''}`} onClick={() => setFilterRole('all')}>All</button>
                <button className={`${style.filterBtn} ${filterRole === 'agent' ? style.activeFilter : ''}`} onClick={() => setFilterRole('agent')}>Agents</button>
                <button className={`${style.filterBtn} ${filterRole === 'owner' ? style.activeFilter : ''}`} onClick={() => setFilterRole('owner')}>Landlords</button>
            </div>

            <button className={style.refreshBtn} onClick={fetchProfiles} disabled={loading || bulkScanning} title="Refresh">
                <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>

            <button className={style.bulkBtn} onClick={handleBulkScan} disabled={bulkScanning || profiles.length === 0}>
                {bulkScanning ? <><Loader2 className="animate-spin" size={18}/> Scanning...</> : <><Sparkles size={18}/> Auto-Pilot</>}
            </button>
        </div>
      </div>

      {/* GRID */}
      <div className={style.grid}>
        {loading && profiles.length === 0 ? (
            <div className={style.loaderContainer}><Loader2 size={40} className="animate-spin text-teal-600"/></div>
        ) : filteredProfiles.length === 0 ? (
            <div className={style.emptyState}>
                <CheckCircle2 size={48} color="#10b981" />
                <h3>All Caught Up!</h3>
                <p>No pending profiles found.</p>
                <button className={style.refreshLink} onClick={fetchProfiles}>Refresh</button>
            </div>
        ) : filteredProfiles.map(p => {
            const role = detectRole(p);
            const isAgent = role === 'agent';
            const locationStr = formatLocation(p.city, p.country);

            return (
            <div key={p.unique_id} className={style.card} onClick={() => setSelected(p)}>
                <div className={style.cardImageHeader}>
                    <img src={p.avatar_url || "/person-placeholder.png"} alt="Avatar" className={style.cardAvatar} />
                    
                    {/* ✅ BADGE */}
                    <div className={style.roleBadge} style={{ backgroundColor: isAgent ? '#0f766e' : '#7c3aed' }}>
                        {isAgent ? 'AGENT' : 'OWNER'}
                    </div>

                    {/* ✅ ID PREFIX */}
                    <div className={style.cardBadge}>
                        {p.special_id ? p.special_id.split('-')[0] : (p.country?.slice(0, 2).toUpperCase() || "INT")}
                    </div>
                </div>
                
                <div className={style.cardBody}>
                    <h3 className={style.title}>{p.full_name || "Unknown Name"}</h3>
                    
                    <div className={style.metaRow}>
                        <Briefcase size={14} className={style.icon}/>
                        <span>{p.agency_name || (isAgent ? "Independent Agent" : "Private Owner")}</span>
                    </div>
                    
                    <div className={style.metaRow}>
                        <Star size={14} className={style.icon} fill="#fbbf24" color="#fbbf24"/>
                        <span>{p.review_count || 0} Reviews</span>
                    </div>

                    <div className={style.metaRow}>
                        <MapPin size={14} className={style.icon}/>
                        <span>{locationStr}</span>
                    </div>

                    <div className={style.cardFooter}>
                        <span className={style.statusPending}>Needs Review</span>
                        <button className={style.reviewBtn}>Review</button>
                    </div>
                </div>
            </div>
        )})}
      </div>

      {/* --- DRAWER --- */}
      {selected && (
        <>
          <div className={style.overlay} onClick={() => setSelected(null)} />
          <div className={style.drawer}>
            <div className={style.drawerHeader}>
                <div>
                    <h3 className={style.drawerTitle}>{selected.full_name}</h3>
                    <div style={{display:'flex', gap:10, marginTop:5}}>
                        <span className={style.idTag}>ID: {selected.special_id || selected.unique_id}</span>
                        
                        <span style={{ fontSize:'0.75rem', fontWeight:'bold', padding:'2px 8px', borderRadius:'4px', background: detectRole(selected) === 'agent' ? '#ccfbf1' : '#ede9fe', color: detectRole(selected) === 'agent' ? '#0f766e' : '#5b21b6', textTransform: 'uppercase' }}>
                            {detectRole(selected) === 'agent' ? 'Real Estate Agent' : 'Property Owner'}
                        </span>
                    </div>
                </div>
                <button className={style.closeBtn} onClick={() => setSelected(null)}><XCircle size={24}/></button>
            </div>
            
            <div className={style.drawerContent}>
                {/* AI Card */}
                <div className={style.aiCard}>
                    <div className={style.aiHeader}>
                        <h4><ScanFace size={18}/> AI Audit</h4>
                        {!aiReport && !aiLoading && <button className={style.runAiBtn} onClick={handleAnalyze}>Run Scan</button>}
                    </div>
                    {aiLoading && <div className={style.aiLoader}><Loader2 className="animate-spin"/> Analyzing Biometrics...</div>}
                    {aiReport && (
                        <div className={style.reportContainer}>
                            <div className={style.scoreHeader}>
                                <div className={style.bigScore} style={{color: getScoreColor(aiReport.score)}}>
                                    {aiReport.score}<span style={{fontSize:14, color:'#64748b'}}>/100</span>
                                </div>
                                <div className={style.verdictBadge} style={{ background: aiReport.score >= 80 ? '#ecfdf5' : '#fef2f2', color: aiReport.score >= 80 ? '#059669' : '#dc2626' }}>
                                    {aiReport.verdict.toUpperCase()}
                                </div>
                            </div>
                            <div className={style.flagsList}>
                                {aiReport.flags.length > 0 ? aiReport.flags.map((flag, i) => (
                                    <div key={i} className={style.flagItem}><AlertTriangle size={14} /> {flag}</div>
                                )) : <div className={style.flagItem} style={{color:'green', background:'#f0fdf4', borderColor:'#bbf7d0'}}><CheckCircle2 size={14}/> No issues detected.</div>}
                            </div>
                        </div>
                    )}
                </div>

                {/* ✅ FULL DETAILS */}
                <div className={style.section}>
                    <h4>Profile Details</h4>
                    <div className={style.infoGrid}>
                        <div className={style.infoBox}><label>Full Name</label><p>{selected.full_name}</p></div>
                        <div className={style.infoBox}><label>Username</label><p>@{selected.username}</p></div>
                        <div className={style.infoBox}><label>Email</label><p>{selected.email}</p></div>
                        <div className={style.infoBox}><label>Phone</label><p>{selected.phone || "N/A"}</p></div>
                    </div>
                </div>

                <div className={style.section}>
                    <h4>Professional Info</h4>
                    <div className={style.infoGrid}>
                        <div className={style.infoBox}>
                            <label>Role</label>
                            <p style={{textTransform:'capitalize'}}>
                                {detectRole(selected) === 'agent' ? "Real Estate Agent" : "Property Owner"}
                            </p>
                        </div>
                        <div className={style.infoBox}>
                            <label>{detectRole(selected) === 'agent' ? 'Agency' : 'Company'}</label>
                            <p>{selected.agency_name || "N/A"}</p>
                        </div>
                        <div className={style.infoBox}>
                            <label>Location</label>
                            <p>{formatLocation(selected.city, selected.country)}</p>
                        </div>
                        <div className={style.infoBox}>
                            <label>License No.</label>
                            <p>{selected.license_number || "N/A"}</p>
                        </div>
                        <div className={style.infoBox}>
                            <label>Joined</label>
                            <p>{new Date(selected.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className={style.infoBox}>
                            <label>Experience</label>
                            <p>{selected.experience || "0"} Years</p>
                        </div>
                        <div className={style.infoBox}>
                            <label>Total Reviews</label>
                            <p>{selected.review_count || 0}</p>
                        </div>
                    </div>
                </div>
                
                <div className={style.section}>
                    <h4>Bio</h4>
                    <div className={style.bioBox}>{selected.bio || "No bio provided."}</div>
                </div>
            </div>

            <div className={style.drawerFooter}>
                <button className={style.rejectAction} onClick={() => handleVerdict('rejected')}><XCircle size={18}/> Reject</button>
                <button className={style.approveAction} onClick={() => handleVerdict('approved')}>
                    <CheckCircle2 size={18}/> {detectRole(selected) === 'agent' ? 'Approve Agent' : 'Approve Landlord'}
                </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfileReviews;