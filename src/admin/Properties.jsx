// src/pages/Properties.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { CheckCircle, XCircle, Trash2, ArrowRight, ArrowLeft } from "lucide-react";
import style from "../styles/adminProperty.module.css";
import { useAuth } from "../context/AuthProvider.jsx";

/*
  Full replacement Properties.jsx
  - Slide modal between Listing Details and Agent Profile (Option A)
  - Uses your existing backend endpoints:
      GET  /api/listings
      PUT  /api/listings/product/:id/approve
      PUT  /api/listings/product/:id/status  { status: 'rejected' }
      DELETE /api/listings/product/:id
  - Payment page route: /payment?product_id=PRD-...
  - Agent public profile route: /profile/:unique_id  (adjust if yours differs)
*/

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Properties = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  // Modal state
  const [selected, setSelected] = useState(null); // the selected listing object
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPage, setModalPage] = useState("listing"); // "listing" | "profile"
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);

  // Fetch listings (public route returns only approved; admin sees full list via agent endpoint if needed)
  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/listings`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      // API returns array rows (as implemented server-side)
      setListings(Array.isArray(res.data) ? res.data : res.data.listings || []);
    } catch (err) {
      console.error("Error fetching listings:", err);
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  // Helper: auth header
  const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } });

  // Admin actions
  // APPROVE
const handleApprove = async (id) => {
  setBusyId(id);
  try {
    await axios.put(
      `${API_BASE}/api/listings/product/${id}`,
      { status: "approved" },
      authHeader()
    );

    toast.success("Listing approved");
    setListings(prev => prev.map(l => 
      l.product_id === id ? { ...l, status: "approved" } : l
    ));

  } catch (err) {
    console.error("Approve failed:", err);
    toast.error("Failed to approve listing");
  } finally {
    setBusyId(null);
  }
};


// REJECT
const handleReject = async (id) => {
  setBusyId(id);
  try {
    await axios.put(
      `${API_BASE}/api/listings/product/${id}`,
      { status: "rejected" },
      authHeader()
    );

    toast.info("Listing rejected");
    setListings(prev => prev.map(l => 
      l.product_id === id ? { ...l, status: "rejected" } : l
    ));

  } catch (err) {
    console.error("Reject failed:", err);
    toast.error("Failed to reject listing");
  } finally {
    setBusyId(null);
  }
};


  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    setBusyId(id);
    try {
      await axios.delete(`${API_BASE}/api/listings/product/${id}`, authHeader());
      toast.success("Listing deleted");
      setListings((prev) => prev.filter((l) => l.product_id !== id));
      closeModal();
    } catch (err) { 
      console.error("Delete failed:", err);
      toast.error("Failed to delete listing");
    } finally {
      setBusyId(null);
    }
  };

  // Open modal for a listing
  const openModal = (listing) => {
    setSelected(listing);
    setModalPage("listing");
    setModalOpen(true);
    setActivePhotoIndex(null);
    // prevent background scroll
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelected(null);
    setActivePhotoIndex(null);
    document.body.style.overflow = "";
  };

  // Photo helpers
  const photosFor = (listing) => {
    if (!listing) return [];
    if (Array.isArray(listing.photos)) return listing.photos.map((p) => (typeof p === "string" ? p : p.url));
    return [];
  };

  // Go to payment page (agent should handle actual payment). open in new tab so admin can remain here.
  const openPayment = (productId) => {
    const url = `/payment?product_id=${encodeURIComponent(productId)}`;
    window.open(url, "_blank");
  };

  // Open agent public profile (opens new tab)
  const openAgentProfilePage = (agentUniqueId) => {
    const url = `/profile/${encodeURIComponent(agentUniqueId)}`;
    window.open(url, "_blank");
  };

  // Render
  return (
    <div className={style.dashboardContainer}>
      <h2>🏠 Properties Management</h2>
      <p className={style.subtitle}>
        Review, approve, or remove property listings submitted by agents and owners.
      </p>

      {loading ? (
        <p className={style.loading}>Loading listings...</p>
      ) : listings.length === 0 ? (
        <p className={style.empty}>No listings available.</p>
      ) : (
        <div className={style.cardsContainer}>
          {listings.map((listing) => {
            const thumb = photosFor(listing)[0] || "/placeholder.png";
            return (
              <div
                key={listing.product_id}
                className={style.card}
                onClick={() => openModal(listing)}
              >
                <img src={thumb} alt={listing.title} className={style.cardImage} />
                <div className={style.cardContent}>
                  <h3>{listing.title}</h3>
                  <p>
                    {listing.property_type || "—"} |{" "}
                    {listing.price ? `$${Number(listing.price).toLocaleString()}` : "—"}
                  </p>
                  <span className={`${style.status} ${style[listing.status?.toLowerCase()] || ""}`}>
                    {listing.status || "Pending"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Slide Modal */}
      {modalOpen && selected && (
        <div className={style.slideModalOverlay} onClick={closeModal}>
          <div
            className={`${style.slideModal} ${modalPage === "profile" ? style.toProfile : ""}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* header */}
            <div className={style.modalHeader}>
              <div className={style.headerLeft}>
                {/* back arrow when on profile page */}
                {modalPage === "profile" ? (
                  <button
                    className={style.iconBtn}
                    onClick={() => setModalPage("listing")}
                    aria-label="Back to listing"
                    title="Back to listing"
                  >
                    <ArrowLeft size={20} />
                  </button>
                ) : (
                  <button className={style.iconBtn} onClick={closeModal} aria-label="Close">
                    ×
                  </button>
                )}
              </div>

              <div className={style.headerTitle}>
                <h3>{selected.title}</h3>
                <small className={`${style.status} ${style[selected.status?.toLowerCase()] || ""}`}>
                  {selected.status || "Pending"}
                </small>
              </div>

              <div className={style.headerRight}>
                {/* arrow to go to profile view */}
                <button
                  className={style.goToProfileBtn}
                  onClick={() => setModalPage("profile")}
                  title="View agent profile"
                >
                  View Agent Profile <ArrowRight size={16} />
                </button>
              </div>
            </div>

            {/* content area (two panels: listing & profile) */}
            <div className={style.modalBodyContainer}>
              {/* Panel A - Listing (left) */}
              <div className={style.panelListing}>
                <div className={style.leftColumn}>
                  {/* main image / gallery */}
                  <div className={style.mainMedia}>
                    {photosFor(selected).length > 0 ? (
                      <>
                        <img
                          src={photosFor(selected)[activePhotoIndex ?? 0]}
                          alt="main"
                          className={style.mainImage}
                          onClick={() => setActivePhotoIndex(activePhotoIndex === null ? 0 : activePhotoIndex)}
                        />
                        <div className={style.thumbRow}>
                          {photosFor(selected).map((p, i) => (
                            <img
                              key={i}
                              src={p}
                              alt={`thumb-${i}`}
                              className={`${style.thumb} ${i === (activePhotoIndex ?? 0) ? style.thumbActive : ""}`}
                              onClick={() => setActivePhotoIndex(i)}
                            />
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className={style.noImage}>No images</div>
                    )}
                  </div>

                  {/* property details */}
                  <div className={style.propertyDetails}>
                    <p><strong>Type:</strong> {selected.property_type || "—"}</p>
                    <p><strong>Category:</strong> {selected.category || "N/A"}</p>
                    <p>
                      <strong>Price:</strong>{" "}
                      {selected.price ? `$${Number(selected.price).toLocaleString()}` : "—"}{" "}
                      {selected.price_currency || ""}
                    </p>
                    {selected.address && <p><strong>Address:</strong> {selected.address}</p>}
                    <p><strong>Description:</strong> {selected.description || "—"}</p>

                    {/* features if available */}
                    {selected.features && selected.features.length > 0 && (
                      <div className={style.features}>
                        <strong>Features:</strong>
                        <ul>
                          {Array.isArray(selected.features)
                            ? selected.features.map((f, i) => <li key={i}>{f}</li>)
                            : <li>{String(selected.features)}</li>}
                        </ul>
                      </div>
                    )}

                    {/* video / virtual tour */}
                    {selected.video_url && (
                      <div style={{ marginTop: 12 }}>
                        <h4>Property Video</h4>
                        <iframe
                          src={selected.video_url}
                          title="Property Video"
                          style={{ width: "100%", height: 320, border: "none", borderRadius: 8 }}
                          allowFullScreen
                        />
                      </div>
                    )}

                    {selected.virtual_tour_url && (
                      <div style={{ marginTop: 12 }}>
                        <h4>Virtual Tour</h4>
                        <iframe
                          src={selected.virtual_tour_url}
                          title="Virtual Tour"
                          style={{ width: "100%", height: 320, border: "none", borderRadius: 8 }}
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className={style.rightColumn}>
                  {/* quick meta */}
                  <div className={style.metaBox}>
                    <p><strong>Product ID:</strong> {selected.product_id}</p>
                    <p><strong>Created:</strong> {new Date(selected.created_at).toLocaleString()}</p>
                    <p><strong>Listing Type:</strong> {selected.listing_type || "—"}</p>
                    <p><strong>Bedrooms:</strong> {selected.bedrooms ?? "—"}</p>
                    <p><strong>Bathrooms:</strong> {selected.bathrooms ?? "—"}</p>
                    <p><strong>Parking:</strong> {selected.parking ?? "—"}</p>
                  </div>

                  {/* actions */}
                  <div className={style.actionBox}>
                    <button
                      className={style.approveBtn}
                      onClick={() => handleApprove(selected.product_id)}
                      disabled={busyId === selected.product_id}
                    >
                      <CheckCircle size={16} /> Approve
                    </button>

                    <button
                      className={style.rejectBtn}
                      onClick={() => handleReject(selected.product_id)}
                      disabled={busyId === selected.product_id}
                    >
                      <XCircle size={16} /> Reject
                    </button>

                    <button
                      className={style.deleteBtn}
                      onClick={() => handleDelete(selected.product_id)}
                      disabled={busyId === selected.product_id}
                    >
                      <Trash2 size={16} /> Delete
                    </button>

                    {/* Payment button for admin/agent to quickly go to payment */}
                    <button
                      className={style.paymentBtn}
                      onClick={() => openPayment(selected.product_id)}
                      title="Open payment page"
                    >
                      Proceed to Payment
                    </button>

                    {/* Direct link to agent's public profile in new tab */}
                    <button
                      className={style.profileLinkBtn}
                      onClick={() => openAgentProfilePage(selected.agent?.unique_id || selected.agent_unique_id)}
                    >
                      View Full Public Profile
                    </button>
                  </div>
                </div>
              </div>

              {/* Panel B - Agent Profile (right) */}
              <div className={style.panelProfile}>
                <div className={style.profileInner}>
                  <div className={style.profileHeader}>
                    <img
                      src={selected.agent?.avatar_url || selected.avatar_url || "/person-placeholder.png"}
                      alt={selected.agent?.full_name || "Agent"}
                      className={style.profileAvatar}
                    />
                    <div>
                      <h3>{selected.agent?.full_name || selected.full_name || "Agent"}</h3>
                      <p className={style.username}>@{selected.agent?.username || selected.username || ""}</p>
                      <p className={style.agency}>{selected.agent?.agency_name || selected.agency_name || ""}</p>
                      <p className={style.location}>{selected.agent?.city || selected.city || ""}, {selected.agent?.country || selected.country || ""}</p>
                    </div>
                  </div>

                  <div className={style.profileBio}>
                    <p>{selected.agent?.bio || selected.bio || "No bio available."}</p>
                  </div>

                  <div className={style.contactBlock}>
                    { (selected.agent?.email || selected.profile_email || selected.email) && <p><strong>Email:</strong> {selected.agent?.email || selected.profile_email || selected.email}</p> }
                    { (selected.agent?.phone || selected.phone) && <p><strong>Phone:</strong> {selected.agent?.phone || selected.phone}</p> }
                    { selected.agent?.experience && <p><strong>Experience:</strong> {selected.agent.experience}</p> }
                  </div>

                  {/* Social links (if present) */}
                  <div className={style.socials}>
                    {selected.agent?.social_instagram && <a href={selected.agent.social_instagram} target="_blank" rel="noreferrer">Instagram</a>}
                    {selected.agent?.social_twitter && <a href={selected.agent.social_twitter} target="_blank" rel="noreferrer">Twitter</a>}
                    {selected.agent?.social_linkedin && <a href={selected.agent.social_linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}
                  </div>

                  <div className={style.profileFooter}>
                    <button className={style.openProfilePage} onClick={() => openAgentProfilePage(selected.agent?.unique_id || selected.agent_unique_id)}>
                      Open Public Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* small lightbox overlay for single image zoom */}
            {activePhotoIndex !== null && (
              <div className={style.lightboxOverlay} onClick={() => setActivePhotoIndex(null)}>
                <div className={style.lightboxInner} onClick={(e) => e.stopPropagation()}>
                  <img src={photosFor(selected)[activePhotoIndex]} alt={`photo-${activePhotoIndex}`} className={style.lightboxImage} />
                  <button className={style.lightboxClose} onClick={() => setActivePhotoIndex(null)}>×</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Properties;
