import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import client from "../api/axios";
import { 
  CheckCircle, XCircle, User, Shield, AlertTriangle, 
  Search, ScanFace, FileText, Globe, Loader2 
} from "lucide-react";
import style from "../styles/adminProperty.module.css"; // Reusing admin styles

const ProfileReviews = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  
  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState(null);

  // Fetch Data
  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await client.get("/api/admin/profiles/pending");
      setProfiles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfiles(); }, []);

  // Reset AI report when switching users
  useEffect(() => { setAiReport(null); }, [selected]);

  // --- ACTIONS ---

  const handleAnalyze = async () => {
    if (!selected) return;
    setAiLoading(true);
    try {
        const res = await client.post(`/api/admin/profiles/${selected.unique_id}/analyze`);
        setAiReport(res.data);
    } catch (err) {
        Swal.fire("Error", "AI Analysis failed", "error");
    } finally {
        setAiLoading(false);
    }
  };

  const handleVerdict = async (status) => {
    if (!selected) return;

    let reason = null;
    if (status === 'rejected') {
        const { value: text } = await Swal.fire({
            title: 'Reason for Rejection',
            input: 'textarea',
            inputPlaceholder: 'e.g. Invalid ID, Blurry Photo...',
            showCancelButton: true
        });
        if (!text) return; // User cancelled
        reason = text;
    }

    try {
        await client.put(`/api/admin/profiles/${selected.unique_id}/status`, { status, reason });
        Swal.fire("Success", `Profile ${status}`, "success");
        setProfiles(prev => prev.filter(p => p.unique_id !== selected.unique_id));
        setSelected(null);
    } catch (err) {
        Swal.fire("Error", "Action failed", "error");
    }
  };

  return (
    <div className={style.dashboardContainer}>
      <div className={style.headerRow}>
        <h2>Agent Verifications</h2>
        <p className={style.subtitle}>{profiles.length} profiles pending review</p>
      </div>

      <div className={style.grid}>
        {loading ? <p>Loading...</p> : profiles.map(p => (
            <div key={p.unique_id} className={style.card} onClick={() => setSelected(p)}>
                <div style={{height: 150, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <img 
                        src={p.avatar_url || "/person-placeholder.png"} 
                        style={{width: '100%', height:'100%', objectFit:'cover'}} 
                        alt="Avatar"
                    />
                </div>
                <div className={style.cardBody}>
                    <h3 className={style.title}>{p.full_name}</h3>
                    <div className={style.agentRow}>
                        <Globe size={14}/> {p.country}
                    </div>
                    <div className={style.agentRow}>
                        <Shield size={14}/> {p.agency_name || "Freelance"}
                    </div>
                </div>
            </div>
        ))}
        {profiles.length === 0 && !loading && <div className={style.emptyState}>No pending verifications.</div>}
      </div>

      {/* --- DRAWER --- */}
      {selected && (
        <>
          <div className={style.overlay} onClick={() => setSelected(null)} />
          <div className={style.drawer}>
            <div className={style.drawerHeader}>
                <h3>Review Profile</h3>
                <button className={style.closeBtn} onClick={() => setSelected(null)}><XCircle size={24}/></button>
            </div>
            
            <div className={style.drawerContent}>
                {/* 🤖 AI SECTION */}
                <div className={style.aiSection}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <h4 className={style.aiTitle}><ScanFace size={18}/> Identity Check</h4>
                        {!aiReport && !aiLoading && (
                            <button className={style.analyzeBtn} onClick={handleAnalyze}>Run AI Scan</button>
                        )}
                    </div>

                    {aiLoading && <div style={{padding:20, textAlign:'center'}}><Loader2 className="animate-spin"/> Scanning Face & Data...</div>}

                    {aiReport && (
                        <div className={`${style.aiReport} ${aiReport.score >= 80 ? style.reportSafe : style.reportRisk}`}>
                            <div className={style.scoreCircle}>
                                <span>{aiReport.score}</span>
                                <small>Score</small>
                            </div>
                            <div className={style.reportDetails}>
                                <div className={style.reportItem}>
                                    {aiReport.faceCheck === 'passed' ? <CheckCircle size={16} color="green"/> : <AlertTriangle size={16} color="red"/>}
                                    <span>Face Detection: <strong>{aiReport.faceCheck}</strong></span>
                                </div>
                                <div className={style.reportItem}>
                                    {aiReport.dataCheck === 'passed' ? <CheckCircle size={16} color="green"/> : <AlertTriangle size={16} color="red"/>}
                                    <span>Data Integrity: <strong>{aiReport.dataCheck}</strong></span>
                                </div>
                                <div className={style.reportItem}>
                                    {aiReport.licenseCheck === 'passed' ? <CheckCircle size={16} color="green"/> : <AlertTriangle size={16} color="orange"/>}
                                    <span>License Check: <strong>{aiReport.licenseCheck}</strong></span>
                                </div>
                                <p style={{fontSize:'0.8rem', color:'#64748b', marginTop:5}}>
                                    Verdict: <strong>{aiReport.verdict}</strong>
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* DETAILS */}
                <div style={{marginTop:20}}>
                    <div style={{display:'flex', gap:20, alignItems:'center', marginBottom:20}}>
                        <img src={selected.avatar_url} style={{width:80, height:80, borderRadius:'50%', objectFit:'cover', border:'2px solid #e2e8f0'}} />
                        <div>
                            <h2 style={{margin:0}}>{selected.full_name}</h2>
                            <p style={{margin:0, color:'#64748b'}}>{selected.email}</p>
                            <p style={{margin:0, color:'#64748b'}}>{selected.phone}</p>
                        </div>
                    </div>

                    <div className={style.infoGrid}>
                        <div className={style.infoItem}><label>Agency</label><p>{selected.agency_name || "N/A"}</p></div>
                        <div className={style.infoItem}><label>License</label><p>{selected.license_number || "N/A"}</p></div>
                        <div className={style.infoItem}><label>Country</label><p>{selected.country}</p></div>
                    </div>

                    <div style={{marginTop:20}}>
                        <label className={style.infoItem} style={{fontSize:'0.8rem', color:'#64748b'}}>Bio</label>
                        <p style={{background:'#f8fafc', padding:15, borderRadius:8, fontSize:'0.9rem'}}>{selected.bio || "No bio provided."}</p>
                    </div>
                </div>
            </div>

            <div className={style.drawerFooter}>
                <button className={`${style.btn} ${style.btnReject}`} onClick={() => handleVerdict('rejected')}>Reject</button>
                <button className={`${style.btn} ${style.btnApprove}`} onClick={() => handleVerdict('approved')}>Approve Agent</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfileReviews;