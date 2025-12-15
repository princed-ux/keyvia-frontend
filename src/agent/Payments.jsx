// src/pages/Payments.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FlutterWaveButton, closePaymentModal } from "flutterwave-react-v3";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthProvider.jsx";
import style from "../styles/Payments.module.css";

// Use your environment variable
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ✅ FIXED: Changed from 60 to 10
const ACTIVATION_FEE_USD = 10; 

const Payments = () => {
  const { user } = useAuth();
  // Ensure we have the user ID
  const agentId = user?.unique_id || user?.id;

  const [inactiveListings, setInactiveListings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  
  const [initializing, setInitializing] = useState(false);
  const [currentPaymentData, setCurrentPaymentData] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);

  // Helper for Auth Headers
  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
  });

  useEffect(() => {
    if (agentId) {
      fetchInactiveListings();
      fetchPaymentHistory();
    }
  }, [agentId]);

  // ✅ Use correct backend route (/api/listings/agent)
  async function fetchInactiveListings() {
    setLoadingListings(true);
    try {
      // 1. Fetch ALL agent listings
      const res = await axios.get(`${API_BASE}/api/listings/agent`, authHeader());
      
      const allListings = Array.isArray(res.data) ? res.data : [];

      // 2. Filter on Frontend: We need Approved but NOT Active
      const unpaid = allListings.filter(l => 
        l.status === 'approved' && l.is_active === false
      );

      setInactiveListings(unpaid);
    } catch (err) {
      console.error("Failed to fetch listings:", err);
    } finally {
      setLoadingListings(false);
    }
  }

  // ✅ Ensure this route exists in your backend
  async function fetchPaymentHistory() {
    setLoadingPayments(true);
    try {
      const res = await axios.get(`${API_BASE}/api/payments/history`, authHeader());
      setPayments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn("Payment history fetch failed:", err);
    } finally {
      setLoadingPayments(false);
    }
  }

  const initiatePayment = async (listing) => {
    setInitializing(true);
    setSelectedListing(listing);

    try {
      const payload = { listingId: listing.product_id };
      
      const res = await axios.post(`${API_BASE}/api/payments/initialize`, payload, authHeader());
      
      const paymentData = res.data;

      if (!paymentData || !paymentData.tx_ref || !paymentData.public_key) {
        throw new Error("Invalid payment initialization response");
      }

      setCurrentPaymentData(paymentData);
    } catch (err) {
      console.error("Payment init failed:", err);
      Swal.fire("Error", "Could not initialize payment.", "error");
      setCurrentPaymentData(null);
    } finally {
      setInitializing(false);
    }
  };

  const handlePaymentSuccess = async (response) => {
    closePaymentModal(); 

    const tx_ref = response?.tx_ref || currentPaymentData?.tx_ref;
    const transaction_id = response?.transaction_id;

    Swal.fire({
      title: "Verifying...",
      text: "Please wait while we confirm your payment.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const verifyRes = await axios.post(
        `${API_BASE}/api/payments/verify`, 
        { tx_ref, transaction_id }, 
        authHeader()
      );

      if (verifyRes.data?.success || verifyRes.data?.status === "success") {
        Swal.fire("Success!", "Your listing is now ACTIVE.", "success");
        // Refresh lists
        fetchInactiveListings();
        fetchPaymentHistory();
      } else {
        throw new Error(verifyRes.data?.message || "Verification failed");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Payment verification failed. Contact support.", "error");
    } finally {
      setCurrentPaymentData(null);
      setSelectedListing(null);
    }
  };

  const renderPayButton = (listing) => {
    const isReady = currentPaymentData && selectedListing?.product_id === listing.product_id;

    if (isReady) {
      const config = {
        public_key: currentPaymentData.public_key,
        tx_ref: currentPaymentData.tx_ref,
        amount: currentPaymentData.amount || ACTIVATION_FEE_USD,
        currency: "USD",
        payment_options: "card,mobilemoney,ussd",
        customer: {
          email: user?.email,
          phonenumber: user?.phone,
          name: user?.full_name || user?.name,
        },
        customizations: {
          title: "Activate Listing",
          description: `Activation fee for ${listing.title}`,
          logo: "https://yoursite.com/logo.png",
        },
      };

      return (
        <div className={style.inlinePayWrapper}>
          <FlutterWaveButton
            className={style.payNowBtn}
            {...config}
            text={`Proceed to Pay $${ACTIVATION_FEE_USD}`}
            callback={handlePaymentSuccess}
            onClose={() => {}}
          />
          <button 
            className={style.cancelBtn} 
            onClick={() => setCurrentPaymentData(null)}
          >
            Cancel
          </button>
        </div>
      );
    }

    return (
      <button
        className={style.payNowBtn}
        onClick={() => initiatePayment(listing)}
        disabled={initializing}
      >
        {initializing && selectedListing?.product_id === listing.product_id 
          ? "Loading..." 
          : `Pay $${ACTIVATION_FEE_USD}`}
      </button>
    );
  };

  return (
    <div className={style.paymentsPage}>
      <h2 className={style.pageTitle}>Payments & Activation</h2>
      <p style={{ color: "#6b7280", marginBottom: 30 }}>
        Approved listings require a one-time activation fee of <strong>${ACTIVATION_FEE_USD} USD</strong> to go live on the public map.
      </p>

      <section className={style.section}>
        <h3>🛑 Pending Activation</h3>
        {loadingListings ? <p>Loading...</p> : inactiveListings.length === 0 ? (
          <div className={style.empty}>No listings waiting for payment.</div>
        ) : (
          <div className={style.listingGrid}>
            {inactiveListings.map(listing => (
              <div key={listing.product_id} className={style.listingCard}>
                <div className={style.listingHeader}>
                  <span className={style.listingTitle}>{listing.title}</span>
                  <span className={style.statusBadge}>Approved</span>
                </div>
                <div className={style.listingBody}>
                   <p className={style.listingMeta}>{listing.address}, {listing.city}</p>
                   <div className={style.listingActions}>
                      {renderPayButton(listing)}
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={style.section} style={{marginTop: 40}}>
        <h3>📜 Payment History</h3>
        {loadingPayments ? <p>Loading...</p> : payments.length === 0 ? (
          <div className={style.empty}>No payment history found.</div>
        ) : (
          <div className={style.historyTableWrapper}>
            <table className={style.historyTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td>{new Date(p.created_at).toLocaleDateString()}</td>
                    <td>{p.tx_ref}</td>
                    <td>${p.amount}</td>
                    <td className={style.success}>Paid</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default Payments;