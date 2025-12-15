import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Search, 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  X,
  User,
  ExternalLink
} from "lucide-react";
import style from "../styles/adminProperty.module.css";
import { useAuth } from "../context/AuthProvider.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Properties = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending"); // pending | active | rejected | all
  const [search, setSearch] = useState("");
  
  // Drawer State
  const [selected, setSelected] = useState(null);
  const [busyId, setBusyId] = useState(null);

  // Auth Header
  const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } });

  // --- Fetch Listings ---
  const fetchListings = async () => {
    setLoading(true);
    try {
      // ✅ CHANGED: Use the new Admin-Only endpoint
      const res = await axios.get(
        `${API_BASE}/api/listings/admin/all`, 
        authHeader()
      );
      
      setListings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch error:", err);
      // toast.error("Could not load listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  // --- Filtering Logic ---
  const filteredListings = listings.filter(l => {
    const matchesSearch = l.title?.toLowerCase().includes(search.toLowerCase()) || 
                          l.product_id?.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filter === "all") return true;
    if (filter === "pending") return l.status === "pending";
    if (filter === "rejected") return l.status === "rejected";
    if (filter === "active") return l.status === "approved"; // Approved & Paid usually means active
    
    return true;
  });

  // --- Actions ---
  const handleUpdateStatus = async (status) => {
    if (!selected) return;
    setBusyId(selected.product_id);
    try {
      await axios.put(
        `${API_BASE}/api/listings/${selected.product_id}/status`, 
        { status }, 
        authHeader()
      );
      
      toast.success(`Listing marked as ${status}`);
      
      // Update local state
      setListings(prev => prev.map(l => 
        l.product_id === selected.product_id ? { ...l, status } : l
      ));
      setSelected(null); // Close drawer

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
      await axios.delete(`${API_BASE}/api/listings/${selected.product_id}`, authHeader());
      toast.success("Listing deleted");
      setListings(prev => prev.filter(l => l.product_id !== selected.product_id));
      setSelected(null);
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  // --- Render Helpers ---
  const getBadgeClass = (status, isActive) => {
    if (status === 'rejected') return style.rejected;
    if (status === 'pending') return style.pending;
    if (status === 'approved') return isActive ? style.active : style.pending; // Approved but not paid = pending-ish color
    return style.pending;
  };

  const getStatusText = (l) => {
    if (l.status === 'approved' && !l.is_active) return 'Approved (Unpaid)';
    if (l.status === 'approved' && l.is_active) return 'Live';
    return l.status.charAt(0).toUpperCase() + l.status.slice(1);
  };

  return (
    <div className={style.dashboardContainer}>
      {/* Header */}
      <div className={style.header}>
        <h2>Property Management</h2>
        <p className={style.subtitle}>Review incoming listings, approve properties, and manage the platform inventory.</p>
      </div>

      {/* Filter Bar */}
      <div className={style.filterBar}>
        <div className={style.tabs}>
          <button onClick={() => setFilter("pending")} className={`${style.tab} ${filter === "pending" ? style.tabActive : ""}`}>
            Pending Review
          </button>
          <button onClick={() => setFilter("active")} className={`${style.tab} ${filter === "active" ? style.tabActive : ""}`}>
            Active
          </button>
          <button onClick={() => setFilter("rejected")} className={`${style.tab} ${filter === "rejected" ? style.tabActive : ""}`}>
            Rejected
          </button>
          <button onClick={() => setFilter("all")} className={`${style.tab} ${filter === "all" ? style.tabActive : ""}`}>
            All Listings
          </button>
        </div>

        <div className={style.searchContainer}>
          <Search size={18} className={style.searchIcon} />
          <input 
            type="text" 
            placeholder="Search title or ID..." 
            className={style.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      <div className={style.grid}>
        {loading ? (
          <p>Loading...</p>
        ) : filteredListings.length === 0 ? (
          <div className={style.emptyState}>
            <p>No listings found in this category.</p>
          </div>
        ) : (
          filteredListings.map(listing => (
            <div key={listing.product_id} className={style.card} onClick={() => setSelected(listing)}>
              <img 
                src={listing.photos?.[0]?.url || listing.photos?.[0] || "/placeholder.png"} 
                alt={listing.title} 
                className={style.cardImage} 
              />
              <div className={style.cardBody}>
                <div className={style.cardHeader}>
                  <span className={`${style.badge} ${getBadgeClass(listing.status, listing.is_active)}`}>
                    {getStatusText(listing)}
                  </span>
                  <small style={{ color: '#9ca3af' }}>{new Date(listing.created_at).toLocaleDateString()}</small>
                </div>
                
                <h3 className={style.title}>{listing.title}</h3>
                <p className={style.price}>
                  {Number(listing.price).toLocaleString()} {listing.price_currency}
                </p>
                
                <div className={style.metaRow}>
                   <div className={style.metaItem}><MapPin size={14}/> {listing.city}</div>
                   <div className={style.metaItem}><Bed size={14}/> {listing.bedrooms}</div>
                   <div className={style.metaItem}><Bath size={14}/> {listing.bathrooms}</div>
                </div>

                <div className={style.agentRow}>
                  <img 
                    src={listing.agent?.avatar_url || "/person-placeholder.png"} 
                    alt="Agent" 
                    className={style.miniAvatar}
                  />
                  <span>{listing.agent?.full_name || "Unknown Agent"}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- SLIDE-OVER DRAWER --- */}
      {selected && (
        <>
          <div className={style.overlay} onClick={() => setSelected(null)} />
          <div className={style.drawer}>
            <div className={style.drawerHeader}>
              <div>
                 <h3 style={{margin:0}}>{selected.product_id}</h3>
                 <span style={{fontSize: '0.85rem', color: '#6b7280'}}>Submitted on {new Date(selected.created_at).toLocaleString()}</span>
              </div>
              <button className={style.closeBtn} onClick={() => setSelected(null)}><X size={24}/></button>
            </div>

            <div className={style.drawerContent}>
              
              {/* Gallery */}
              <div className={style.gallery}>
                <img 
                   src={selected.photos?.[0]?.url || selected.photos?.[0] || "/placeholder.png"} 
                   className={style.galleryMain} 
                   alt="Main"
                />
                {selected.photos?.slice(1, 5).map((p, i) => (
                   <img key={i} src={p.url || p} className={style.galleryThumb} alt="thumb"/>
                ))}
              </div>

              {/* Agent Card */}
              <div className={style.sectionTitle}>Listing Agent</div>
              <div className={style.agentCard}>
                <img 
                   src={selected.agent?.avatar_url || "/person-placeholder.png"} 
                   className={style.agentAvatarLarge}
                   alt="Agent"
                />
                <div className={style.agentInfo}>
                  <h4>{selected.agent?.full_name}</h4>
                  <p>@{selected.agent?.username} • {selected.agent?.agency_name}</p>
                  <p style={{marginTop: 5, color: '#09707d', fontWeight: 500}}>
                    {selected.agent?.email} • {selected.agent?.phone}
                  </p>
                </div>
                <a href={`/profile/${selected.agent?.unique_id}`} target="_blank" rel="noreferrer" style={{marginLeft: 'auto'}}>
                   <ExternalLink size={18} color="#6b7280"/>
                </a>
              </div>

              {/* Details */}
              <div className={style.sectionTitle}>Property Details</div>
              <h2 style={{marginTop: 0, marginBottom: 10}}>{selected.title}</h2>
              <p style={{fontSize: '1.2rem', fontWeight: 'bold', color: '#09707d', margin: 0}}>
                 {Number(selected.price).toLocaleString()} {selected.price_currency} 
                 {selected.listing_type === 'rent' && <span style={{fontSize: '0.9rem', color: '#6b7280'}}> / {selected.price_period}</span>}
              </p>
              
              <div className={style.infoGrid} style={{marginTop: 20}}>
                 <div className={style.infoItem}><label>Type</label><p>{selected.property_type}</p></div>
                 <div className={style.infoItem}><label>Location</label><p>{selected.address}, {selected.city}</p></div>
                 <div className={style.infoItem}><label>Beds/Baths</label><p>{selected.bedrooms} Beds / {selected.bathrooms} Baths</p></div>
                 <div className={style.infoItem}><label>Size</label><p>{selected.square_footage} sq ft</p></div>
              </div>

              <div className={style.sectionTitle}>Description</div>
              <p style={{lineHeight: 1.6, color: '#4b5563'}}>{selected.description}</p>

              {/* Video/Tour */}
              {(selected.video_url || selected.virtual_tour_url) && (
                 <div style={{marginTop: 20}}>
                    <div className={style.sectionTitle}>Media Links</div>
                    {selected.video_url && <a href={selected.video_url} target="_blank" rel="noreferrer" style={{display: 'block', marginBottom: 5, color: '#09707d'}}>View Video Tour</a>}
                    {selected.virtual_tour_url && <a href={selected.virtual_tour_url} target="_blank" rel="noreferrer" style={{display: 'block', color: '#09707d'}}>View 360° Virtual Tour</a>}
                 </div>
              )}
            </div>

            {/* Sticky Footer Actions */}
            <div className={style.drawerFooter}>
               <button 
                 className={style.btnDelete} 
                 onClick={handleDelete}
                 disabled={busyId === selected.product_id}
               >
                 <Trash2 size={18}/> Delete
               </button>

               {selected.status !== 'rejected' && (
                 <button 
                   className={style.btnReject} 
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
                   <CheckCircle size={18}/> Approve Listing
                 </button>
               )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Properties;