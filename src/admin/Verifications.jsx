import React, { useState } from "react";
import client from "../api/axios";
import style from "../styles/AdminVerifications.module.css"; 
import { 
  CheckCircle2, XCircle, ShieldCheck, 
  Search, FileText, Loader2, ExternalLink, 
  User, Building2, RefreshCw
} from "lucide-react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

// ✅ 1. Import Hook
import useAutoFetch from '../hooks/useAutoFetch';

const AdminVerifications = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // Open Drawer for details

  // ✅ 2. Define Fetch Function
  const fetchPending = async () => {
    // Only show full loader on initial load
    if (requests.length === 0) setLoading(true);
    
    try {
      const res = await client.get("/api/admin/profiles/pending");
      setRequests(res.data);
    } catch (err) {
      console.error(err);
      if(loading) toast.error("Failed to load queue");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 3. Use Hook
  useAutoFetch(fetchPending);

  // DETECT ROLE
  const getRole = (user) => {
      if (user.role === 'agent' || user.license_number) return 'agent';
      return 'owner';
  };

  // VERDICT HANDLER
  const handleVerdict = async (status) => {
    if (!selected) return;
    
    let reason = null;
    if (status === 'rejected') {
        const { value: text } = await Swal.fire({
            title: 'Reject License/ID?',
            input: 'textarea',
            inputLabel: 'Reason for Rejection',
            inputPlaceholder: 'e.g. License ID invalid, Name mismatch...',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Reject'
        });
        if (!text) return;
        reason = text;
    } else {
        const confirm = await Swal.fire({
            title: 'Confirm Verification',
            text: `You are confirming that ${selected.full_name}'s documents are valid.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            confirmButtonText: 'Yes, Verify User'
        });
        if (!confirm.isConfirmed) return;
    }

    try {
        await client.put(`/api/admin/profiles/${selected.unique_id}/status`, { status, reason });
        
        // Optimistic UI Update
        setRequests(prev => prev.filter(r => r.unique_id !== selected.unique_id));
        setSelected(null);
        
        toast.success(status === 'approved' ? "User Verified!" : "User Rejected");
    } catch (err) {
        toast.error("Action Failed");
    }
  };

  return (
    <div className={style.container}>
      
      {/* HEADER */}
      <div className={style.header}>
        <div>
            <h2><ShieldCheck size={24} style={{marginBottom:-3}}/> Legal Verification</h2>
            <p>Validate Identity Documents & Professional Licenses.</p>
        </div>
        <button className={style.refreshBtn} onClick={fetchPending}>
            <RefreshCw size={18} className={loading ? "animate-spin" : ""}/> Refresh
        </button>
      </div>

      {/* LIST */}
      <div className={style.grid}>
        {loading ? (
            <div className={style.loader}><Loader2 size={40} className="animate-spin"/></div>
        ) : requests.length === 0 ? (
            <div className={style.empty}>
                <CheckCircle2 size={48} color="#10b981"/>
                <h3>Queue Empty</h3>
                <p>No pending legal verifications.</p>
            </div>
        ) : (
            requests.map(req => (
                <div key={req.unique_id} className={style.card} onClick={() => setSelected(req)}>
                    <div className={style.cardTop}>
                        <span className={`${style.badge} ${getRole(req) === 'agent' ? style.agentBadge : style.ownerBadge}`}>
                            {getRole(req).toUpperCase()}
                        </span>
                        <span className={style.date}>{new Date(req.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    <div className={style.cardMain}>
                        <div className={style.avatar}>{req.full_name[0]}</div>
                        <div>
                            <h4>{req.full_name}</h4>
                            <span className={style.subId}>ID: {req.unique_id.slice(0,8)}...</span>
                        </div>
                    </div>

                    <div className={style.cardMeta}>
                        {getRole(req) === 'agent' ? (
                            <div className={style.metaItem}>
                                <strong>License:</strong> {req.license_number || "MISSING"}
                            </div>
                        ) : (
                            <div className={style.metaItem}>
                                <strong>ID Type:</strong> Government Issued
                            </div>
                        )}
                        <div className={style.metaItem}>
                            <strong>Region:</strong> {req.country || "Global"}
                        </div>
                    </div>

                    <button className={style.actionBtn}>Verify Details</button>
                </div>
            ))
        )}
      </div>

      {/* DRAWER */}
      {selected && (
        <>
            <div className={style.overlay} onClick={() => setSelected(null)}/>
            <div className={style.drawer}>
                <div className={style.drawerHead}>
                    <h3>Verification Details</h3>
                    <button onClick={() => setSelected(null)}><XCircle size={24}/></button>
                </div>

                <div className={style.drawerBody}>
                    {/* 1. USER IDENTITY */}
                    <div className={style.section}>
                        <h4><User size={16}/> Identity Info</h4>
                        <div className={style.row}><span>Name:</span> <strong>{selected.full_name}</strong></div>
                        <div className={style.row}><span>Email:</span> <strong>{selected.email}</strong></div>
                        <div className={style.row}><span>Phone:</span> <strong>{selected.phone}</strong></div>
                    </div>

                    {/* 2. PROFESSIONAL LICENSE (AGENTS ONLY) */}
                    {getRole(selected) === 'agent' && (
                        <div className={style.section}>
                            <h4><Building2 size={16}/> Professional License</h4>
                            <div className={style.licenseBox}>
                                <span className={style.licLabel}>LICENSE NUMBER</span>
                                <span className={style.licValue}>{selected.license_number || "NOT PROVIDED"}</span>
                            </div>
                            
                            <a 
                                href={`https://www.google.com/search?q=${selected.country}+real+estate+license+registry+check+${selected.license_number}`}
                                target="_blank" 
                                rel="noreferrer"
                                className={style.googleLink}
                            >
                                <Search size={14}/> Search Registry on Google
                            </a>
                            <p className={style.hint}>* Verify this number on the {selected.country} official regulator site.</p>
                        </div>
                    )}

                    {/* 3. DOCUMENT PROOF */}
                    <div className={style.section}>
                        <h4><FileText size={16}/> Uploaded Documents</h4>
                        <div className={style.docPreview}>
                            <div className={style.docIcon}><FileText size={32}/></div>
                            <div>
                                <span>{getRole(selected) === 'agent' ? "Agent_License.jpg" : "Passport_ID.pdf"}</span>
                                <button className={style.viewDocBtn} onClick={()=> toast.info("Document Viewer coming in Phase 2")}>
                                    View Document
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={style.drawerFoot}>
                    <button className={style.reject} onClick={() => handleVerdict('rejected')}>Reject</button>
                    <button className={style.approve} onClick={() => handleVerdict('approved')}>
                        <CheckCircle2 size={18}/> Verify & Approve
                    </button>
                </div>
            </div>
        </>
      )}

    </div>
  );
};

export default AdminVerifications;