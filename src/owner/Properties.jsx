import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Home, 
  CreditCard,
  X,
  AlertCircle,
  CheckCircle2,
  ExternalLink
} from "lucide-react";

import client from "../api/axios"; // Adjust path if needed
import { useAuth } from "../context/AuthProvider";
import style from "../styles/Listings.module.css"; 

export default function OwnerProperties() {
  const navigate = useNavigate();
  const { user } = useAuth(); 

  // State
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null); 
  const [previewListing, setPreviewListing] = useState(null);

  const lottieUrl = "https://lottie.host/37a0df00-47f6-43d0-873c-01acfb5d1e7d/wvtiKE3P1d.lottie";

  // -------------------- Fetch Listings --------------------
  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await client.get("/api/listings/agent"); 
      setListings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch listings error:", err);
    } finally {
      setLoading(false);
    }
  };

  // -------------------- Actions --------------------
  
  // 1. Activate / Pay Logic
  const handleActivate = async (listing, e) => {
    e.stopPropagation();
    
    const confirm = await Swal.fire({
      title: "Activate Listing?",
      text: "Pay $10.00 to make this listing visible on the Buy/Rent pages.",
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Pay & Activate",
      confirmButtonColor: "#10b981"
    });

    if (!confirm.isConfirmed) return;

    setBusyId(listing.product_id);
    try {
      await client.put(`/api/listings/${listing.product_id}/activate`);
      
      // Update UI immediately
      setListings(prev => prev.map(l => 
        l.product_id === listing.product_id 
          ? { ...l, is_active: true, payment_status: 'paid', status: 'approved' } 
          : l
      ));

      Swal.fire("Live!", "Your listing is now visible to buyers/renters.", "success");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Payment failed", "error");
    } finally {
      setBusyId(null);
    }
  };

  // 2. Delete Logic
  const handleDelete = async (listing, e) => {
    e.stopPropagation(); 
    
    const confirm = await Swal.fire({
      title: "Delete Listing?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete it",
    });

    if (!confirm.isConfirmed) return;

    setBusyId(listing.product_id);

    try {
      await client.delete(`/api/listings/${listing.product_id}`);
      setListings((prev) => prev.filter((l) => l.product_id !== listing.product_id));
      
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Deleted', showConfirmButton: false, timer: 1500 });
    } catch (err) {
      Swal.fire("Error", "Could not delete listing.", "error");
    } finally {
      setBusyId(null);
    }
  };

  // 3. Edit Navigation
  const handleEdit = (listing, e) => {
    e.stopPropagation();
    navigate("/owner/add-property", { state: { editingListing: listing } });
  };

  // 4. View Public Listing
  const handleViewLive = (id, e) => {
    e.stopPropagation();
    navigate(`/listing/${id}`); // Goes to the public details page
  };

  return (
    <div className={style.container}>
      
      {/* --- HEADER --- */}
      <div className={style.header}>
        <div>
          <h1>My Properties</h1>
          <p>Manage your rental portfolio and sales</p>
        </div>
        <Link to="/owner/add-property" className={style.addButton}>
          <Plus size={20} /> Add New Property
        </Link>
      </div>

      {/* --- LISTINGS GRID --- */}
      {loading ? (
        <div className={style.loadingContainer}>
          <DotLottieReact src={lottieUrl} loop autoplay style={{ width: 150, height: 150 }} />
          <p>Loading your portfolio...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className={style.emptyState}>
          <div>
            <DotLottieReact src={lottieUrl} loop autoplay style={{ width: 250, height: 250, alignSelf: 'center' }} />
          </div>
          <div>
            <h3>No Properties Yet</h3>
            <p>List your first property to start finding tenants.</p>
            <Link to="/owner/add-property" className={style.addButtonSecondary}>
              Create Listing
            </Link>
          </div>
        </div>
      ) : (
        <div className={style.grid}>
          {listings.map((listing) => {
            // Determine Status Logic
            let badgeClass = style.pending;
            let statusText = "Pending";
            let statusIcon = <AlertCircle size={12} />;

            if (listing.status === 'rejected') {
              badgeClass = style.rejected; 
              statusText = "Rejected";
              statusIcon = <X size={12} />;
            } else if (listing.status === 'approved') {
              if (listing.is_active) {
                  badgeClass = style.active; 
                  statusText = "Active (Live)";
                  statusIcon = <CheckCircle2 size={12} />;
              } else {
                  badgeClass = style.pending; 
                  statusText = "Approved (Unpaid)";
              }
            }

            const photoUrl = listing.photos?.[0]?.url || listing.photos?.[0] || "/placeholder.png";

            return (
              <div 
                key={listing.product_id} 
                className={style.card}
                onClick={() => setPreviewListing(listing)}
              >
                {/* Image Section */}
                <div className={style.imageWrapper}>
                  <img src={photoUrl} alt={listing.title} className={style.cardImage} />
                  <span className={`${style.badge} ${badgeClass}`}>
                    {statusIcon} {statusText}
                  </span>
                </div>

                {/* Details Section */}
                <div className={style.cardBody}>
                  <h3 className={style.cardTitle}>{listing.title || "Untitled Property"}</h3>
                  <p className={style.cardAddress}>
                    <MapPin size={14} /> {listing.city}, {listing.country}
                  </p>
                  
                  <div className={style.cardMeta}>
                    <span><Home size={14}/> {listing.property_type}</span>
                    <span className={style.price}>
                      {Number(listing.price).toLocaleString()} {listing.price_currency}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className={style.actions}>
                    
                    {/* CASE 1: APPROVED BUT NOT PAID */}
                    {listing.status === 'approved' && !listing.is_active && (
                      <button 
                        className={style.actionBtn} 
                        style={{ backgroundColor: '#dcfce7', color: '#166534', borderColor: '#86efac' }}
                        onClick={(e) => handleActivate(listing, e)}
                        disabled={busyId === listing.product_id}
                        title="Pay Activation Fee"
                      >
                        <CreditCard size={16} /> Pay
                      </button>
                    )}

                    {/* CASE 2: ACTIVE (Show View Live Button) */}
                    {listing.is_active && (
                      <button 
                        className={style.actionBtn}
                        style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}
                        onClick={(e) => handleViewLive(listing.product_id, e)}
                        title="View Public Page"
                      >
                        <ExternalLink size={16} /> Live
                      </button>
                    )}

                    {/* EDIT */}
                    <button 
                      className={style.actionBtn}
                      onClick={(e) => handleEdit(listing, e)}
                      title="Edit"
                    >
                      <Edit size={16} /> Edit
                    </button>

                    {/* DELETE */}
                    <button 
                      className={`${style.actionBtn} ${style.deleteBtn}`}
                      onClick={(e) => handleDelete(listing, e)}
                      disabled={busyId === listing.product_id}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- PREVIEW MODAL --- */}
      {previewListing && (
        <div className={style.modalOverlay} onClick={() => setPreviewListing(null)}>
          <div className={style.modalContent} onClick={e => e.stopPropagation()}>
            <button className={style.closeModal} onClick={() => setPreviewListing(null)}>
              <X size={24} />
            </button>
            
            <img 
              src={previewListing.photos?.[0]?.url || previewListing.photos?.[0] || "/placeholder.png"} 
              alt="Preview" 
              className={style.modalImage} 
            />
            
            <div className={style.modalDetails}>
              <h2>{previewListing.title}</h2>
              <p className={style.modalPrice}>
                {Number(previewListing.price).toLocaleString()} {previewListing.price_currency}
              </p>
              <p className={style.modalAddress}>
                {previewListing.address}, {previewListing.city}, {previewListing.country}
              </p>
              <div className={style.modalTags}>
                <span>{previewListing.bedrooms} Beds</span>
                <span>{previewListing.bathrooms} Baths</span>
                <span>{previewListing.square_footage} sqft</span>
              </div>
              <p className={style.modalDesc}>{previewListing.description || "No description."}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}