import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import client from "../api/axios"; // Adjust path as needed
import { 
  CheckCircle2, XCircle, Shield, AlertTriangle, 
  Search, ScanFace, Globe, Loader2, Sparkles,
  MapPin, Briefcase, UserCheck, Calendar, RefreshCw
} from "lucide-react";
import style from "../styles/adminProfileReviews.module.css"; 

const ProfileReviews = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  
  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [bulkScanning, setBulkScanning] = useState(false);
  const [aiReport, setAiReport] = useState(null);

  // --- FETCH DATA ---
  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await client.get("/api/admin/profiles/pending");
      setProfiles(res.data);
    } catch (err) {
      console.error(err);
      // Optional: toast error here
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfiles(); }, []);

  // Reset report when drawer closes/changes
  useEffect(() => { setAiReport(null); }, [selected]);

  // --- ACTIONS ---

  // 1. Single Profile Scan
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

  // 2. 🚀 BULK SCAN
  const handleBulkScan = async () => {
    if (profiles.length === 0) return;

    const confirm = await Swal.fire({
        title: 'Run Auto-Pilot?',
        text: `This will scan all ${profiles.length} pending profiles. The AI will automatically APPROVE safe profiles and REJECT risky ones.`,
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
            html: `
                <div style="text-align:left; font-size:1.1em;">
                    <p>✅ <b>Auto-Approved:</b> ${approved}</p>
                    <p>❌ <b>Auto-Rejected:</b> ${rejected}</p>
                    <p>⚠️ <b>Manual Review Needed:</b> ${remaining}</p>
                </div>
            `,
            icon: 'success'
        });

        fetchProfiles(); 

    } catch (err) {
        console.error(err);
        Swal.fire("Error", "Bulk scan failed.", "error");
    } finally {
        setBulkScanning(false);
    }
  };

  // 3. Manual Verdict
  const handleVerdict = async (status) => {
    if (!selected) return;

    let reason = null;
    if (status === 'rejected') {
        const { value: text } = await Swal.fire({
            title: 'Reason for Rejection',
            input: 'textarea',
            inputPlaceholder: 'e.g. Identity document unclear...',
            showCancelButton: true,
            confirmButtonColor: '#dc2626'
        });
        if (!text) return; 
        reason = text;
    }

    try {
        await client.put(`/api/admin/profiles/${selected.unique_id}/status`, { status, reason });
        
        setProfiles(prev => prev.filter(p => p.unique_id !== selected.unique_id));
        setSelected(null);
        
        const toastMixin = Swal.mixin({
            toast: true, position: 'top-end', showConfirmButton: false, timer: 3000
        });
        toastMixin.fire({
            icon: status === 'approved' ? 'success' : 'error',
            title: `Profile ${status === 'approved' ? 'Approved' : 'Rejected'}`
        });

    } catch (err) {
        Swal.fire("Error", "Action failed", "error");
    }
  };

  // --- RENDER HELPERS ---
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
                <UserCheck size={28} color="#09707d"/> Agent Verification
            </h2>
            <p className={style.subtitle}>Manage pending identity reviews.</p>
        </div>
        
        <div style={{display:'flex', gap:12, alignItems:'center'}}>
            
            {/* 🔄 REFRESH BUTTON */}
            <button 
                className={style.refreshBtn} 
                onClick={fetchProfiles} 
                disabled={loading || bulkScanning}
                title="Refresh List"
            >
                <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>

            <div className={style.statBadge}>
                <span>{profiles.length}</span> <small>Pending</small>
            </div>
            
            {/* 🚀 BULK SCAN BUTTON */}
            <button 
                className={style.bulkBtn} 
                onClick={handleBulkScan} 
                disabled={bulkScanning || profiles.length === 0}
            >
                {bulkScanning ? (
                    <><Loader2 className="animate-spin" size={18}/> Scanning...</>
                ) : (
                    <><Sparkles size={18}/> AI Auto-Pilot</>
                )}
            </button>
        </div>
      </div>

      {/* GRID */}
      <div className={style.grid}>
        {loading && profiles.length === 0 ? (
            <div className={style.loaderContainer}><Loader2 size={40} className="animate-spin text-teal-600"/></div>
        ) : profiles.map(p => (
            <div key={p.unique_id} className={style.card} onClick={() => setSelected(p)}>
                {/* Image Header */}
                <div className={style.cardImageHeader}>
                    <img 
                        src={p.avatar_url || "/person-placeholder.png"} 
                        alt="Avatar"
                        className={style.cardAvatar}
                    />
                    <div className={style.cardBadge}>{p.country?.slice(0, 2).toUpperCase() || "INT"}</div>
                </div>
                
                {/* Body */}
                <div className={style.cardBody}>
                    <h3 className={style.title}>{p.full_name}</h3>
                    <div className={style.metaRow}>
                        <Briefcase size={14} className={style.icon}/>
                        <span>{p.agency_name || "Independent"}</span>
                    </div>
                    <div className={style.metaRow}>
                        <Calendar size={14} className={style.icon}/>
                        <span>Exp: {p.experience || "0"} Years</span>
                    </div>
                    
                    <div className={style.cardFooter}>
                        <span className={style.statusPending}>Needs Review</span>
                        <button className={style.reviewBtn}>Review</button>
                    </div>
                </div>
            </div>
        ))}
        
        {profiles.length === 0 && !loading && (
            <div className={style.emptyState}>
                <CheckCircle2 size={48} color="#10b981" />
                <h3>All Caught Up!</h3>
                <p>There are no pending profiles to review.</p>
                <button className={style.refreshLink} onClick={fetchProfiles}>Check Again</button>
            </div>
        )}
      </div>

      {/* --- DRAWER (SIDE PANEL) --- */}
      {selected && (
        <>
          <div className={style.overlay} onClick={() => setSelected(null)} />
          <div className={style.drawer}>
            
            <div className={style.drawerHeader}>
                <div>
                    <h3 className={style.drawerTitle}>{selected.full_name}</h3>
                    <span className={style.idTag}>ID: {selected.special_id || selected.unique_id || "N/A"}</span>
                </div>
                <button className={style.closeBtn} onClick={() => setSelected(null)}><XCircle size={24}/></button>
            </div>
            
            <div className={style.drawerContent}>
                
                {/* 🤖 AI ANALYSIS CARD */}
                <div className={style.aiCard}>
                    <div className={style.aiHeader}>
                        <h4><ScanFace size={18}/> AI Audit</h4>
                        {!aiReport && !aiLoading && (
                            <button className={style.runAiBtn} onClick={handleAnalyze}>Run Scan</button>
                        )}
                    </div>

                    {aiLoading && <div className={style.aiLoader}><Loader2 className="animate-spin"/> Analyzing Biometrics...</div>}

                    {aiReport && (
                        <div className={style.reportContainer}>
                            {/* Score Gauge */}
                            <div className={style.scoreHeader}>
                                <div className={style.bigScore} style={{color: getScoreColor(aiReport.score)}}>
                                    {aiReport.score}<span style={{fontSize:14, color:'#64748b'}}>/100</span>
                                </div>
                                <div className={style.verdictBadge} style={{
                                    background: aiReport.score >= 80 ? '#ecfdf5' : '#fef2f2',
                                    color: aiReport.score >= 80 ? '#059669' : '#dc2626'
                                }}>
                                    {aiReport.verdict.toUpperCase()}
                                </div>
                            </div>

                            {/* Flags List */}
                            <div className={style.flagsList}>
                                {aiReport.flags.length > 0 ? (
                                    aiReport.flags.map((flag, i) => (
                                        <div key={i} className={style.flagItem}>
                                            <AlertTriangle size={14} /> {flag}
                                        </div>
                                    ))
                                ) : (
                                    <div className={style.flagItem} style={{color:'green', background:'#f0fdf4', borderColor:'#bbf7d0'}}>
                                        <CheckCircle2 size={14}/> No issues detected.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* PROFILE DETAILS */}
                <div className={style.section}>
                    <h4>Profile Details</h4>
                    <div className={style.infoGrid}>
                        <div className={style.infoBox}>
                            <label>Full Name</label>
                            <p>{selected.full_name}</p>
                        </div>
                        <div className={style.infoBox}>
                            <label>Username</label>
                            <p>@{selected.username}</p>
                        </div>
                        <div className={style.infoBox}>
                            <label>Email</label>
                            <p>{selected.email}</p>
                        </div>
                        <div className={style.infoBox}>
                            <label>Phone</label>
                            <p>{selected.phone}</p>
                        </div>
                    </div>
                </div>

                <div className={style.section}>
                    <h4>Professional Info</h4>
                    <div className={style.infoGrid}>
                        <div className={style.infoBox}>
                            <label>Agency</label>
                            <p>{selected.agency_name || "N/A"}</p>
                        </div>
                        <div className={style.infoBox}>
                            <label>License No.</label>
                            <p>{selected.license_number || "N/A"}</p>
                        </div>
                        <div className={style.infoBox}>
                            <label>Experience</label>
                            <p>{selected.experience} Years</p>
                        </div>
                        <div className={style.infoBox}>
                            <label>Location</label>
                            <p>{selected.city}, {selected.country}</p>
                        </div>
                    </div>
                </div>

                <div className={style.section}>
                    <h4>Bio</h4>
                    <div className={style.bioBox}>
                        {selected.bio || "No bio provided."}
                    </div>
                </div>

            </div>

            {/* FOOTER ACTIONS */}
            <div className={style.drawerFooter}>
                <button className={style.rejectAction} onClick={() => handleVerdict('rejected')}>
                    <XCircle size={18}/> Reject
                </button>
                <button className={style.approveAction} onClick={() => handleVerdict('approved')}>
                    <CheckCircle2 size={18}/> Approve Agent
                </button>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default ProfileReviews;