// src/pages/Payments.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FlutterWaveButton, closePaymentModal } from "flutterwave-react-v3";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthProvider.jsx";
import style from "../styles/Payments.module.css";

/**
 * Payments page — fixed activation fee $60 (USD).
 * Backend endpoints (this file expects):
 *  - GET  /api/agents/:agentId/listings?status=inactive
 *  - POST /api/payments/initialize   { listingId }
 *  - POST /api/payments/verify       { tx_ref, transaction_id? }
 *  - GET  /api/agents/:agentId/payments
 *
 * Make sure you set FLW public key server-side and return it from initialize.
 */

const ACTIVATION_FEE_USD = 60; // fixed amount

const Payments = () => {
  const { user } = useAuth();
  const agentId = user?.unique_id || user?.id || user?.user_id;
  const [inactiveListings, setInactiveListings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [currentPaymentData, setCurrentPaymentData] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);

  useEffect(() => {
    if (!agentId) return;
    fetchInactiveListings();
    fetchPaymentHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  async function fetchInactiveListings() {
    setLoadingListings(true);
    try {
      // expects the server to return only approved + unpaid listings
      const res = await axios.get(`/api/agents/${agentId}/listings?status=inactive`);
      setInactiveListings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch inactive listings:", err?.response?.data || err);
      Swal.fire("Error", "Could not load inactive listings. Try again later.", "error");
    } finally {
      setLoadingListings(false);
    }
  }

  async function fetchPaymentHistory() {
    setLoadingPayments(true);
    try {
      const res = await axios.get(`/api/agents/${agentId}/payments`);
      setPayments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch payments:", err?.response?.data || err);
      Swal.fire("Error", "Could not load payment history.", "error");
    } finally {
      setLoadingPayments(false);
    }
  }

  const initiatePayment = async (listing) => {
    if (!agentId) {
      Swal.fire("Not authenticated", "Please login and try again.", "warning");
      return;
    }

    setInitializing(true);
    setSelectedListing(listing);

    try {
      // We pass a stable identifier: product_id (or id)
      const payload = { listingId: listing.product_id || listing.product_id || listing.id };
      const res = await axios.post("/api/payments/initialize", payload);
      const paymentData = res.data;

      if (!paymentData || !paymentData.tx_ref || !paymentData.public_key) {
        throw new Error("Invalid payment initialization response");
      }

      setCurrentPaymentData(paymentData);
      // FlutterWaveButton is rendered for this listing below
    } catch (err) {
      console.error("Payment initialization failed:", err?.response?.data || err);
      Swal.fire("Error", "Could not initialize payment. Try again.", "error");
      setCurrentPaymentData(null);
      setSelectedListing(null);
    } finally {
      setInitializing(false);
    }
  };

  const handlePaymentSuccess = async (response) => {
    closePaymentModal();

    const tx_ref = response?.tx_ref || response?.data?.tx_ref;
    const transaction_id = response?.transaction_id || response?.data?.id || null;

    if (!tx_ref) {
      Swal.fire("Payment Error", "Transaction reference missing.", "error");
      return;
    }

    Swal.fire({
      title: "Verifying payment",
      text: "Please wait while we confirm the transaction.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const verifyRes = await axios.post("/api/payments/verify", { tx_ref, transaction_id });
      const verifyData = verifyRes.data;

      // server returns { status: 'success', payment: {...} }
      if (verifyData?.status === "success" || verifyData?.payment?.status === "successful") {
        Swal.fire("Payment successful", "Listing has been activated.", "success");
        fetchInactiveListings();
        fetchPaymentHistory();
      } else {
        console.warn("Verification response:", verifyData);
        Swal.fire("Verification failed", "We could not confirm payment. Contact support.", "error");
      }
    } catch (err) {
      console.error("Verification failed:", err?.response?.data || err);
      Swal.fire("Error", "Verification failed. Please contact support.", "error");
    } finally {
      setCurrentPaymentData(null);
      setSelectedListing(null);
    }
  };

  const handlePaymentClose = () => {
    setCurrentPaymentData(null);
    setSelectedListing(null);
  };

  const renderPayButton = (listing) => {
    const activeInit =
      currentPaymentData &&
      selectedListing &&
      (selectedListing.product_id || selectedListing.id) === (listing.product_id || listing.id);

    if (activeInit && currentPaymentData) {
      const cfg = {
        public_key: currentPaymentData.public_key,
        tx_ref: currentPaymentData.tx_ref,
        amount: currentPaymentData.amount ?? ACTIVATION_FEE_USD,
        currency: currentPaymentData.currency || "USD",
        payment_options: "card,banktransfer,ussd",
        customer: {
          email: (user && (user.email || user.contact_email)) || (currentPaymentData.customer?.email || ""),
          phonenumber:
            (user && (user.phone || user.contact_phone)) || (currentPaymentData.customer?.phonenumber || ""),
          name: (user && (user.full_name || user.name)) || (currentPaymentData.customer?.name || ""),
        },
        customizations: {
          title: "Activate Listing",
          description: listing.title || "Listing activation fee ($60)",
        },
        meta: {
          listingId: listing.product_id || listing.id,
          agentId,
        },
      };

      return (
        <div className={style.inlinePayWrapper}>
          <FlutterWaveButton
            className={style.payNowBtn}
            callback={handlePaymentSuccess}
            onClose={handlePaymentClose}
            disabled={false}
            flutterWaveConfig={cfg}
          >
            Pay $60
          </FlutterWaveButton>

          <button
            className={style.cancelBtn}
            onClick={() => {
              setCurrentPaymentData(null);
              setSelectedListing(null);
            }}
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
        {initializing && selectedListing?.product_id === listing.product_id ? "Preparing..." : `Pay $60`}
      </button>
    );
  };

  return (
    <div className={style.paymentsPage}>
      <h2 className={style.pageTitle}>Payments</h2>

      <p style={{ color: "#374151" }}>
        To make your listing visible to buyers you must pay an activation fee of <strong>$60 USD</strong>.
        After successful payment the listing will be activated and will appear on the appropriate page:
        <code>/sell</code> for sale listings and <code>/rent</code> for rentals.
      </p>

      <section className={style.section}>
        <h3>Listings Requiring Activation</h3>

        {loadingListings ? (
          <div>Loading listings...</div>
        ) : inactiveListings.length === 0 ? (
          <div className={style.empty}>You have no inactive listings that need payment.</div>
        ) : (
          <div className={style.listingGrid}>
            {inactiveListings.map((listing) => (
              <div key={listing.product_id || listing.id} className={style.listingCard}>
                <div className={style.listingHeader}>
                  <div className={style.listingTitle}>{listing.title || "Untitled listing"}</div>
                  <div className={style.listingPrice}>$60 USD</div>
                </div>

                <div className={style.listingBody}>
                  <p className={style.listingMeta}>
                    Type: {listing.listing_type || listing.property_type || "—"} • Location:{" "}
                    {listing.city || listing.country || "—"}
                  </p>
                  <div className={style.listingActions}>{renderPayButton(listing)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={style.section}>
        <h3>Payment History</h3>
        {loadingPayments ? (
          <div>Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className={style.empty}>No payments yet.</div>
        ) : (
          <div className={style.historyTableWrapper}>
            <table className={style.historyTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Listing</th>
                  <th>Amount</th>
                  <th>Reference</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id || p.tx_ref}>
                    <td>{new Date(p.created_at || p.createdAt || Date.now()).toLocaleString()}</td>
                    <td>{p.listing_title || p.listing?.title || p.listingId || "—"}</td>
                    <td>{p.currency || "USD"} {p.amount}</td>
                    <td>{p.tx_ref || p.reference || p.transaction_id || "—"}</td>
                    <td className={p.status === "successful" || p.status === "paid" ? style.success : style.failed}>
                      {p.status}
                    </td>
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
