import React, { useState } from "react";
import { 
  FileText, CheckCircle2, XCircle, Clock, MapPin, Loader2, 
  User, ChevronRight, X, DollarSign, Briefcase, Calendar, 
  Users, MessageSquare 
} from "lucide-react";
import client from "../api/axios"; 
import style from "../styles/BuyerApplications.module.css";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { formatPrice, getCurrencySymbol } from '../utils/format'; 
import { toast, Toaster } from 'react-hot-toast';

// ✅ 1. Import the Hook
import useAutoFetch from '../hooks/useAutoFetch';

const BuyerApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const navigate = useNavigate();

  // ✅ 2. Define Fetch Function
  const fetchApps = async () => {
    try {
      const res = await client.get("/api/applications/buyer");
      setApplications(res.data);
    } catch (err) {
      console.error("Failed to fetch applications", err);
      // Only show error on initial load, not background refresh
      if(loading) toast.error("Could not load your applications.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 3. Use the Hook (Replaces manual useEffect)
  // Auto-refreshes when socket says "application_status" changed
  useAutoFetch(fetchApps);

  // Helper to safely get the first image
  const getFirstImage = (photos) => {
    try {
      if (!photos) return "/placeholder.png";
      const parsed = typeof photos === 'string' ? JSON.parse(photos) : photos;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0].url || parsed[0];
      }
      return "/placeholder.png";
    } catch (e) {
      return "/placeholder.png";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved": 
        return <span className={`${style.statusBadge} ${style.success}`}><CheckCircle2 size={14}/> Approved</span>;
      case "rejected": 
        return <span className={`${style.statusBadge} ${style.danger}`}><XCircle size={14}/> Rejected</span>;
      default: 
        return <span className={`${style.statusBadge} ${style.warning}`}><Clock size={14}/> Pending Review</span>;
    }
  };

  if (loading) {
    return (
        <div className={style.loaderContainer}>
            <Loader2 className="animate-spin" size={40} color="#09707D"/>
        </div>
    );
  }

  return (
    <div className={style.pageWrapper}>
      <Toaster position="top-right" />
      
      <header className={style.header}>
        <div>
          <h1>My Applications</h1>
          <p>Track the status of your property applications.</p>
        </div>
        <div className={style.countBadge}>{applications.length} Total</div>
      </header>

      <div className={style.applicationList}>
        {applications.length === 0 ? (
            <div className={style.emptyState}>
                <div className={style.emptyIcon}><FileText size={48} /></div>
                <h3>No Applications Yet</h3>
                <p>Start exploring properties and apply to see them here.</p>
                <button className={style.browseBtn} onClick={() => navigate('/listings')}>Browse Properties</button>
            </div>
        ) : (
            applications.map((app) => (
            <div key={app.id} className={style.appCard} onClick={() => setSelectedApp(app)}>
                
                {/* 1. Property Image */}
                <div className={style.imageWrapper}>
                    <img src={getFirstImage(app.photos)} alt="Property" />
                    <div className={style.imageOverlay}>View</div>
                </div>
                
                {/* 2. Main Info */}
                <div className={style.appInfo}>
                    <div className={style.infoHeader}>
                        <h4>{app.property}</h4>
                        <span className={style.dateLabel}>{dayjs(app.created_at).format("MMM D, YYYY")}</span>
                    </div>
                    
                    <p className={style.addressRow}>
                        <MapPin size={14} className={style.iconMuted}/> 
                        {app.address}, {app.city}
                    </p>

                    <div className={style.metaRow}>
                        <span className={style.agentTag}>
                            <User size={12}/> {app.agent_name || "Unknown Agent"}
                        </span>
                        {app.agency_name && <span className={style.agencyTag}>• {app.agency_name}</span>}
                    </div>
                </div>

                {/* 3. Status & Action */}
                <div className={style.statusSection}>
                    {getStatusBadge(app.status)}
                    <button className={style.detailsBtn} onClick={(e) => { e.stopPropagation(); setSelectedApp(app); }}>
                        Details <ChevronRight size={14}/>
                    </button>
                </div>
            </div>
            ))
        )}
      </div>

      {/* ✅ DETAILS MODAL */}
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
              
              {/* Property Context */}
              <div className={style.listingContext}>
                  <img src={getFirstImage(selectedApp.photos)} alt="Property" />
                  <div>
                      <span>Applied for:</span>
                      <h5>{selectedApp.property}</h5>
                      <p><MapPin size={12}/> {selectedApp.address}, {selectedApp.city}</p>
                  </div>
              </div>

              <div className={style.sectionDivider} />

              <div className={style.statusBannerWrapper}>
                  <span className={style.statusLabel}>Current Status:</span>
                  {getStatusBadge(selectedApp.status)}
              </div>

              <h4 className={style.sectionTitle}>Your Submitted Details</h4>
              <div className={style.statsGrid}>
                <div className={style.statBox}>
                    <div className={style.statIcon}><DollarSign size={18}/></div>
                    <div className={style.statInfo}>
                        <label>Annual Income</label>
                        <strong>{getCurrencySymbol("USD")}{formatPrice(selectedApp.annual_income || 0)}</strong>
                    </div>
                </div>
                <div className={style.statBox}>
                    <div className={style.statIcon}><Briefcase size={18}/></div>
                    <div className={style.statInfo}>
                        <label>Credit Score</label>
                        <strong>{selectedApp.credit_score || 'N/A'}</strong>
                    </div>
                </div>
                <div className={style.statBox}>
                    <div className={style.statIcon}><Calendar size={18}/></div>
                    <div className={style.statInfo}>
                        <label>Desired Move-in Date</label>
                        <strong>{selectedApp.move_in_date ? dayjs(selectedApp.move_in_date).format("MMM D, YYYY") : 'N/A'}</strong>
                    </div>
                </div>
                <div className={style.statBox}>
                    <div className={style.statIcon}><Users size={18}/></div>
                    <div className={style.statInfo}>
                        <label>Occupants</label>
                        <strong>{selectedApp.occupants_count || 1} People</strong>
                    </div>
                </div>
              </div>

              <div className={style.messageSection}>
                <h4 className={style.sectionTitle}><MessageSquare size={16}/> Your Message</h4>
                <div className={style.messageBubble}>
                    {selectedApp.message || "No additional message provided."}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerApplications;