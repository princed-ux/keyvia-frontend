import React, { useState } from 'react';
import client from '../api/axios'; // Adjust path if needed
import { 
  FileText, Check, X, DollarSign, 
  Calendar, Briefcase, ChevronRight, MapPin, CreditCard,
  MessageSquare, Loader2, User
} from 'lucide-react';
import { formatPrice, getCurrencySymbol } from '../utils/format'; 
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import style from '../styles/OwnerApplications.module.css'; // Verify this path

// ✅ 1. Import the Hook
import useAutoFetch from '../hooks/useAutoFetch'; 

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

dayjs.extend(relativeTime);

const OwnerApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null); 
  const [processingId, setProcessingId] = useState(null);

  // ✅ 2. Define Fetch Function
  const fetchApplications = async () => {
    try {
      const res = await client.get('/api/applications/owner');
      setApplications(res.data);
    } catch (err) {
      console.error("Error fetching applications:", err);
      if(loading) toast.error("Failed to load applications.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 3. Apply the Hook
  useAutoFetch(fetchApplications);

  const handleStatusUpdate = async (id, status) => {
    if (processingId === id) return;
    setProcessingId(id);

    const previousApps = [...applications];
    const previousSelected = selectedApp ? { ...selectedApp } : null;

    setApplications(prev => prev.map(app => app.id === id ? { ...app, status } : app));
    if (selectedApp && selectedApp.id === id) {
        setSelectedApp(prev => ({ ...prev, status }));
    }

    try {
      await client.patch(`/api/applications/${id}/status`, { status });

      const action = status === 'approved' ? 'Approved' : 'Rejected';
      toast.success(`Application ${action} successfully`); 

    } catch (err) {
      console.error("Update failed", err);
      setApplications(previousApps);
      if (previousSelected) setSelectedApp(previousSelected);
      
      const errorMessage = err.response?.data?.details || err.response?.data?.message || "Server Connection Error";
      toast.error(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const handleVerify = () => {
    toast.info("Integration with TransUnion/Checkr coming soon!", {
        icon: "🔒"
    });
  };

  const StatusBadge = ({ status }) => {
    const config = {
      approved: { color: '#059669', bg: '#ecfdf5', label: 'Approved', dot: '#059669' },
      rejected: { color: '#dc2626', bg: '#fef2f2', label: 'Rejected', dot: '#dc2626' },
      pending: { color: '#d97706', bg: '#fffbeb', label: 'Pending Review', dot: '#f59e0b' }
    };
    const s = config[status] || config.pending;

    return (
      <span className={style.statusBadge} style={{ color: s.color, backgroundColor: s.bg }}>
        <span className={style.statusDot} style={{ backgroundColor: s.dot }} />
        {s.label}
      </span>
    );
  };

  if (loading) return (
    <div className={style.loadingState}>
        <Loader2 className={style.spinner} size={32} />
        <p>Loading applications...</p>
    </div>
  );

  return (
    <div className={style.pageContainer}>
      <ToastContainer position="top-right" autoClose={3000} />

      <div className={style.header}>
        <div>
            <h1>Received Applications</h1>
            <p>Manage offers from interested tenants or buyers.</p>
        </div>
        <div className={style.countBadge}>
            {applications.length} Total
        </div>
      </div>

      {applications.length === 0 ? (
        <div className={style.emptyState}>
          <div className={style.emptyIconWrapper}><FileText size={40} /></div>
          <h3>No applications received yet</h3>
          <p>When buyers apply to your listings, they will appear here.</p>
        </div>
      ) : (
        <div className={style.grid}>
          {applications.map((app) => (
            <div key={app.id} className={style.card} onClick={() => setSelectedApp(app)}>
              <div className={style.cardTop}>
                <img 
                  src={app.listing_image || "/placeholder.png"} 
                  alt="Listing" 
                  className={style.listingThumb} 
                />
                <div className={style.listingDetails}>
                  <h4>{app.listing_title}</h4>
                  <div className={style.priceRow}>
                    <span className={style.price}>{getCurrencySymbol(app.price_currency)}{formatPrice(app.listing_price)}</span>
                    <span className={style.dotSep}>•</span>
                    <span className={style.timeAgo}>{dayjs(app.created_at).fromNow()}</span>
                  </div>
                </div>
              </div>

              <div className={style.cardBody}>
                <div className={style.applicantRow}>
                    <img src={app.buyer_avatar || "/person-placeholder.png"} alt="Buyer" className={style.buyerAvatar} />
                    <div className={style.buyerText}>
                        <h5>{app.buyer_name}</h5>
                        <div className={style.creditTag}>
                            <CreditCard size={12} /> Score: 
                            <span className={app.credit_score >= 700 ? style.goodScore : style.badScore}>
                                {app.credit_score}
                            </span>
                        </div>
                    </div>
                    <ChevronRight size={18} className={style.arrowIcon} />
                </div>
              </div>

              <div className={style.cardFooter}>
                <StatusBadge status={app.status} />
                <span className={style.incomeText}>Inc: {formatPrice(app.annual_income)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- SLIDE-OVER DETAILS MODAL --- */}
      {selectedApp && (
        <div className={style.modalOverlay} onClick={() => setSelectedApp(null)}>
          <div className={style.modalContent} onClick={e => e.stopPropagation()}>
            
            <div className={style.modalHeader}>
              <div className={style.headerTitle}>
                <h2>Application Details</h2>
                <span className={style.idLabel}>ID: #{selectedApp.id.toString().padStart(4, '0')}</span>
              </div>
              <button onClick={() => setSelectedApp(null)} className={style.closeBtn}><X size={24}/></button>
            </div>

            <div className={style.scrollableBody}>
              <div className={style.profileSection}>
                <div className={style.profileHeader}>
                    <img src={selectedApp.buyer_avatar || "/person-placeholder.png"} alt="" className={style.largeAvatar} />
                    <div>
                        <h3>{selectedApp.buyer_name}</h3>
                        <p className={style.contactLine}>{selectedApp.buyer_email}</p>
                        <p className={style.contactLine}>{selectedApp.buyer_phone}</p>
                    </div>
                    <div className={style.statusWrapper}><StatusBadge status={selectedApp.status} /></div>
                </div>
              </div>

              <div className={style.sectionDivider} />

              <h4 className={style.sectionTitle}>Financial Qualifications</h4>
              <div className={style.statsGrid}>
                <div className={style.statBox}>
                    <div className={style.statIcon}><DollarSign size={18}/></div>
                    <div className={style.statInfo}>
                        <label>Annual Income</label>
                        <strong>{getCurrencySymbol("USD")}{formatPrice(selectedApp.annual_income)}</strong>
                    </div>
                </div>

                <div className={style.statBox}>
                    <div className={style.statIcon}><Briefcase size={18}/></div>
                    <div className={style.statInfo} style={{width: '100%'}}> 
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <label>Credit Score</label>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleVerify(); }}
                                style={{
                                    fontSize:'10px', padding:'2px 6px', 
                                    background:'#e0f2fe', color:'#0284c7', 
                                    border:'none', borderRadius:'4px', 
                                    cursor:'pointer', fontWeight:'600'
                                }}
                            >
                                Verify
                            </button>
                        </div>
                        <strong style={{color: selectedApp.credit_score > 700 ? '#10b981' : '#f59e0b'}}>
                            {selectedApp.credit_score || 'N/A'}
                        </strong>
                    </div>
                </div>

                <div className={style.statBox}>
                    <div className={style.statIcon}><Calendar size={18}/></div>
                    <div className={style.statInfo}>
                        <label>Move-in Date</label>
                        <strong>{dayjs(selectedApp.move_in_date).format("MMM D, YYYY")}</strong>
                    </div>
                </div>
                <div className={style.statBox}>
                    <div className={style.statIcon}><User size={18}/></div>
                    <div className={style.statInfo}>
                        <label>Occupants</label>
                        <strong>{selectedApp.occupants_count || 1} People</strong>
                    </div>
                </div>
              </div>

              <div className={style.messageSection}>
                <h4 className={style.sectionTitle}><MessageSquare size={16}/> Personal Message</h4>
                <div className={style.messageBubble}>
                    {selectedApp.message || "No additional message provided by the applicant."}
                </div>
              </div>

              <div className={style.listingContext}>
                  <img src={selectedApp.listing_image || "/placeholder.png"} alt="" />
                  <div>
                      <span>Applied for:</span>
                      <h5>{selectedApp.listing_title}</h5>
                      <p><MapPin size={12}/> {selectedApp.listing_address || "No Address Hidden"}</p>
                  </div>
              </div>
            </div>

            {selectedApp.status === 'pending' ? (
                <div className={style.stickyFooter}>
                    <button 
                        className={style.rejectBtn}
                        onClick={() => handleStatusUpdate(selectedApp.id, 'rejected')}
                        disabled={processingId === selectedApp.id}
                    >
                        <X size={18}/> Reject
                    </button>
                    <button 
                        className={style.approveBtn}
                        onClick={() => handleStatusUpdate(selectedApp.id, 'approved')}
                        disabled={processingId === selectedApp.id}
                    >
                        {processingId === selectedApp.id ? "Processing..." : <><Check size={18}/> Approve Application</>}
                    </button>
                </div>
            ) : (
                <div className={style.stickyFooter}>
                    <div className={selectedApp.status === 'approved' ? style.approvedBanner : style.rejectedBanner}>
                        {selectedApp.status === 'approved' ? 
                            <><Check size={18}/> This application has been approved.</> : 
                            <><X size={18}/> This application has been rejected.</>
                        }
                    </div>
                </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerApplications;