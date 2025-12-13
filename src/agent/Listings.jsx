// src/pages/Listings.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import style from "../styles/Listings.module.css";
import PropertyForm from "../common/PropertyForm";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { apiRequest } from "../utils/api";

const isLoggedIn = () => !!localStorage.getItem("accessToken");

export default function Listings() {
  const lottie =
    "https://lottie.host/37a0df00-47f6-43d0-873c-01acfb5d1e7d/wvtiKE3P1d.lottie";
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingListing, setEditingListing] = useState(null);

  const [previewListing, setPreviewListing] = useState(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);

  // -------------------- Fetch Listings --------------------
  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/api/listings/agent", "GET");
      setListings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch listings error:", err);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Could not load listings",
        text: "Please try again.",
        timer: 2500,
        showConfirmButton: false,
      });
    } finally {
      setLoading(false);
    }
  };

  // -------------------- Form Handlers --------------------
  const openCreateForm = () => {
    if (!isLoggedIn()) {
      Swal.fire({
        icon: "warning",
        title: "You must be logged in",
        text: "Please log in to create a listing.",
      }).then(() => navigate("/login"));
      return;
    }
    setEditingListing(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEditForm = (listing) => {
    if (!isLoggedIn()) {
      Swal.fire({
        icon: "warning",
        title: "You must be logged in",
        text: "Please log in to edit your listing.",
      }).then(() => navigate("/login"));
      return;
    }
    setEditingListing(listing);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingListing(null);
  };

  // -------------------- Submit Listing --------------------
  const submitListing = async (payload, product_id) => {
    if (!isLoggedIn()) {
      Swal.fire({
        icon: "warning",
        title: "Session expired",
        text: "Please log in to publish your listing.",
      }).then(() => navigate("/login"));
      return;
    }

    try {
      if (!payload.title || !payload.price) {
        return Swal.fire("Error", "Title and Price are required.", "error");
      }

      const formData = new FormData();

      for (const key in payload) {
        const value = payload[key];
        if (value == null) continue;

        // Only append actual files
        if ((key === "video" || key === "virtualTour") && !(value instanceof File))
          continue;

        if (key === "photos" && Array.isArray(value)) {
          value.forEach((f) => {
            if (f instanceof File) formData.append("photos", f);
          });
        } else if (key === "video" && value instanceof File) {
          formData.append("video_file", value);
        } else if (key === "virtualTour" && value instanceof File) {
          formData.append("virtual_file", value);
        } else if (key === "features") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }

      // Include existing photos from editing
      if (editingListing?.photos?.length) {
        const existing = editingListing.photos.filter((p) => typeof p === "string");
        if (existing.length) formData.append("existingPhotos", JSON.stringify(existing));
      }

      const path = product_id
        ? `/api/listings/product/${product_id}`
        : `/api/listings`;
      const method = product_id ? "PUT" : "POST";

      const res = await apiRequest(path, method, formData, true);
      const data = res.listing || res;

      setListings((s) => [
        data,
        ...s.filter((l) => l.product_id !== data.product_id),
      ]);

      localStorage.setItem(
        "my_listings",
        JSON.stringify([
          data,
          ...JSON.parse(localStorage.getItem("my_listings") || "[]").filter(
            (l) => l.product_id !== data.product_id
          ),
        ])
      );

      setShowForm(false);

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: product_id ? "Listing updated!" : "Listing created!",
        text: `"${data.title}" saved successfully.`,
        timer: 2000,
        showConfirmButton: false,
      });

      return data;
    } catch (err) {
      console.error("Submit listing error:", err);
      Swal.fire(
        "Error",
        err.message || "Failed to save listing. Try again.",
        "error"
      );
    }
  };

  // -------------------- Delete Listing --------------------
  const handleDelete = async (listing) => {
    const confirm = await Swal.fire({
      title: `Delete "${listing.title}"?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    });
    if (!confirm.isConfirmed) return;

    setBusyId(listing.product_id);
    const prev = [...listings];
    setListings((s) => s.filter((l) => l.product_id !== listing.product_id));

    try {
      await apiRequest(`/api/listings/product/${listing.product_id}`, "DELETE");
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Listing deleted",
        text: `"${listing.title}" has been removed.`,
        timer: 2000,
        showConfirmButton: false,
      });
      localStorage.setItem(
        "my_listings",
        JSON.stringify(
          JSON.parse(localStorage.getItem("my_listings") || "[]").filter(
            (l) => l.product_id !== listing.product_id
          )
        )
      );
    } catch (err) {
      console.error("Delete listing error:", err);
      setListings(prev);
      Swal.fire(
        "Delete Failed",
        "Could not delete listing. Try again.",
        "error"
      );
    } finally {
      setBusyId(null);
    }
  };

  // -------------------- Render --------------------
  return (
    <div className={style.container}>
      {/* Header */}
      <div className={style.header}>
        <h2>My Listings</h2>
        <button onClick={openCreateForm} className={style.addButton}>
          + Add Listing
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div id="formSection" style={{ marginTop: 20 }}>
          <PropertyForm
            closeBtn={closeForm}
            initialData={editingListing}
            submitListing={submitListing}
          />
        </div>
      )}

      {/* Listings Table */}
      <div
        ref={tableRef}
        style={{
          background: "#fff",
          padding: 18,
          borderRadius: 10,
          marginTop: 16,
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center" }}>
            <DotLottieReact
              src={lottie}
              loop
              autoplay
              style={{ width: 120, height: 120, margin: "0 auto" }}
            />
            <p>Loading listings…</p>
          </div>
        ) : listings.length === 0 ? (
          <div className={style.noListingsContainer}>
            <div className={style.noListings}>
              <DotLottieReact src={lottie} loop autoplay />
            </div>
            <p style={{ color: "#6b7280" }}>
              You have no listings yet. Add your first property to get started.
            </p>
          </div>
        ) : (
          <div className={style.cardsContainer}>
            {listings.map((listing, index) => (
              <div
                key={listing.product_id}
                className={style.card}
                onClick={() => setPreviewListing(listing)}
              >
                <div className={style.cardNumber}>{index + 1}</div>
                <img
                  src={
                    typeof listing.photos?.[0] === "string"
                      ? listing.photos[0]
                      : listing.photos?.[0]?.url || "/placeholder.png"
                  }
                  alt={listing.title || "Untitled"}
                  className={style.cardImage}
                />

                <div className={style.cardContent}>
                  <h3 className={style.cardTitle}>
                    {listing.title || "Untitled"}
                  </h3>
                  {listing.address && (
                    <p className={style.cardAddress}>{listing.address}</p>
                  )}
                  <p className={style.cardTypePrice}>
                    {listing.property_type || "—"} |{" "}
                    {listing.price
                      ? `${listing.price} ${listing.price_currency || ""}`
                      : "—"}
                  </p>
                  <span
                    className={`status ${
                      listing.status?.toLowerCase() || "unknown"
                    }`}
                  >
                    {listing.status || "Unknown"}
                  </span>
                </div>
                <div className={style.cardActions}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditForm(listing);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(listing);
                    }}
                    disabled={busyId === listing.product_id}
                  >
                    {busyId === listing.product_id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
