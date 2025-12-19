import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { 
  CreditCard, History, Wallet, AlertCircle, 
  Loader2, CheckCircle2, Plus, Zap, ArrowUpRight, Building2
} from "lucide-react";
import { useAuth } from "../context/AuthProvider";
import style from "../styles/Payments.module.css"; // ✅ Corrected Path

// ================= CONFIG =================
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const WALLET_PRICE = 15; // Discounted Price for Owners
const DIRECT_PRICE = 20; // Standard Card Price

const OwnerPayments = () => {
  const { user } = useAuth();
  const userId = user?.unique_id || user?.id;

  // ================= STATE =================
  const [inactiveListings, setInactiveListings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  });

  // ================= LOAD SCRIPTS =================
  useEffect(() => {
    if (!window.FlutterwaveCheckout) {
      const script = document.createElement("script");
      script.src = "https://checkout.flutterwave.com/v3.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // ================= FETCH DATA =================
  useEffect(() => {
    if (userId) fetchData();
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Get Wallet Balance
      const walletRes = await axios.get(`${API_BASE}/api/wallet`, authHeader());
      setWalletBalance(Number(walletRes.data?.balance || 0));

      // 2. Get Owner's Inactive Listings
      const listingsRes = await axios.get(`${API_BASE}/api/listings/agent`, authHeader()); 
      const unpaid = Array.isArray(listingsRes.data)
        ? listingsRes.data.filter((l) => l.status === "approved" && !l.is_active)
        : [];
      setInactiveListings(unpaid);

      // 3. Get Payment History
      const historyRes = await axios.get(`${API_BASE}/api/payments/history`, authHeader());
      setPayments(Array.isArray(historyRes.data) ? historyRes.data : []);

    } catch (err) {
      console.error("Owner Data Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ================= HELPER: SELECT CURRENCY =================
  const selectCurrency = async () => {
    const { value: currency } = await Swal.fire({
      title: 'Select Payment Currency',
      text: 'Pay in your local currency. We handle the conversion.',
      input: 'select',
      inputOptions: {
        USD: 'USD ($)',
        NGN: 'Naira (₦)',
        GBP: 'Pounds (£)',
        EUR: 'Euro (€)',
        KES: 'Kenyan Shilling (KSh)',
        GHS: 'Ghana Cedi (₵)'
      },
      inputPlaceholder: 'Choose currency',
      showCancelButton: true,
      confirmButtonColor: '#007983',
      confirmButtonText: 'Continue'
    });
    return currency;
  };

  // ================= ACTION 1: FUND WALLET =================
  const handleFundWallet = async () => {
    // 1. Ask for Amount (USD)
    const { value: amount } = await Swal.fire({
      title: 'Add Funds',
      text: 'Enter amount in USD (min $5).',
      input: 'number',
      inputValue: 20,
      showCancelButton: true,
      confirmButtonColor: '#007983',
      confirmButtonText: 'Next'
    });

    if (!amount || amount < 5) return;

    // 2. Ask for Currency
    const currency = await selectCurrency();
    if (!currency) return;

    setProcessingId('FUND');
    try {
      const res = await axios.post(
        `${API_BASE}/api/wallet/fund`, 
        { amount, currency }, // Send chosen currency
        authHeader()
      );
      openFlutterwave(res.data, "FUND_WALLET");
    } catch (err) {
      Swal.fire("Error", "Could not initialize funding.", "error");
      setProcessingId(null);
    }
  };

  // ================= ACTION 2: PAY WITH WALLET ($15) =================
  const payWithWallet = async (listing) => {
    if (walletBalance < WALLET_PRICE) {
      return Swal.fire({
        title: "Insufficient Wallet Balance",
        text: `You need $${WALLET_PRICE} to activate. Your balance is $${walletBalance}.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Fund Wallet Now",
        confirmButtonColor: "#007983"
      }).then((result) => {
        if (result.isConfirmed) handleFundWallet();
      });
    }

    const confirm = await Swal.fire({
      title: 'Confirm Activation',
      text: `Activate "${listing.title}" for $${WALLET_PRICE} (Wallet)?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#007983',
      confirmButtonText: 'Yes, Activate'
    });

    if (!confirm.isConfirmed) return;

    setProcessingId(listing.product_id);
    try {
      await axios.post(`${API_BASE}/api/wallet/activate`, { listingId: listing.product_id }, authHeader());
      Swal.fire("Success", "Property Activated Successfully!", "success");
      fetchData();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Activation failed", "error");
    } finally {
      setProcessingId(null);
    }
  };

  // ================= ACTION 3: DIRECT CARD PAYMENT ($20) =================
  const payDirect = async (listing) => {
    // 1. Ask for Currency
    const currency = await selectCurrency();
    if (!currency) return;

    setProcessingId(listing.product_id);
    try {
      const res = await axios.post(
        `${API_BASE}/api/payments/initialize`, 
        { listingId: listing.product_id, currency }, 
        authHeader()
      );
      openFlutterwave(res.data, "DIRECT_PAY", listing);
    } catch (err) {
      Swal.fire("Error", "Payment initialization failed", "error");
      setProcessingId(null);
    }
  };

  // ================= FLUTTERWAVE HANDLER =================
  const openFlutterwave = (paymentData, type, listing = null) => {
    window.FlutterwaveCheckout({
      public_key: paymentData.public_key,
      tx_ref: paymentData.tx_ref,
      amount: paymentData.amount, // Now in Local Currency (e.g. NGN)
      currency: paymentData.currency, // e.g. "NGN"
      payment_options: "card,mobilemoney,ussd",
      customer: {
        email: user?.email,
        name: user?.full_name,
      },
      customizations: {
        title: type === "FUND_WALLET" ? "Landlord Wallet Fund" : "Property Activation",
        description: type === "FUND_WALLET" ? "Adding funds to account" : `Activation for ${listing?.title}`,
        logo: "https://your-logo-url.com/logo.png",
      },
      callback: (response) => verifyTransaction(response, type),
      onclose: () => setProcessingId(null),
    });
  };

  const verifyTransaction = async (response, type) => {
    const endpoint = type === "FUND_WALLET" ? "/api/wallet/verify" : "/api/payments/verify";
    
    try {
      const res = await axios.post(
        `${API_BASE}${endpoint}`,
        { transaction_id: response.transaction_id, tx_ref: response.tx_ref },
        authHeader()
      );

      if (res.data?.success) {
        Swal.fire("Success", type === "FUND_WALLET" ? "Funds Added!" : "Property Activated!", "success");
        fetchData();
      } else {
        throw new Error("Failed");
      }
    } catch (err) {
      Swal.fire("Error", "Payment verification failed.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading && !walletBalance) {
    return <div className={style.loaderContainer}><Loader2 className="animate-spin" size={40} color="#007983" /></div>;
  }

  return (
    <div className={style.pageWrapper}>
      
      {/* HEADER */}
      <header className={style.header}>
        <div>
          <h1>Landlord Finance</h1>
          <p>Manage property payments and wallet balance</p>
        </div>
        <button className={style.refreshBtn} onClick={fetchData}>
          <History size={16} /> Sync Data
        </button>
      </header>

      <div className={style.gridContainer}>
        
        {/* --- LEFT COLUMN: WALLET & ACTIONS --- */}
        <div className={style.leftColumn}>
          
          {/* PROFESSIONAL WALLET CARD */}
          <div className={style.walletCard} style={{ background: 'linear-gradient(135deg, #111827 0%, #007983 100%)' }}>
            <div className={style.cardPattern} />
            <div className={style.cardContent}>
              <div className={style.cardTop}>
                <div className={style.chip} />
                <span className={style.cardBrand}>LANDLORD PREMIER</span>
              </div>
              <div className={style.balanceGroup}>
                <span className={style.balanceLabel}>Current Balance</span>
                <h2 className={style.balanceAmount}>
                  ${walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </h2>
              </div>
              <div className={style.cardBottom}>
                <div className={style.holderInfo}>
                  <span>OWNER</span>
                  <strong>{user?.full_name?.toUpperCase() || "LANDLORD"}</strong>
                </div>
                <div className={style.expiryInfo}>
                  <span>STATUS</span>
                  <strong>VERIFIED</strong>
                </div>
              </div>
            </div>
          </div>

          {/* FUND BUTTON */}
          <button 
            className={style.fundBtn} 
            onClick={handleFundWallet} 
            disabled={processingId === 'FUND'}
          >
            {processingId === 'FUND' ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
            <span>Add Funds to Wallet</span>
          </button>

          {/* PENDING LISTINGS */}
          <div className={style.section}>
            <div className={style.sectionHeader}>
              <h3><AlertCircle size={18} /> Inactive Properties</h3>
            </div>
            
            {inactiveListings.length === 0 ? (
              <div className={style.emptyState}>
                <Building2 size={40} className={style.successIcon} />
                <p>All your properties are active & visible!</p>
              </div>
            ) : (
              <div className={style.pendingList}>
                {inactiveListings.map(listing => (
                  <div key={listing.product_id} className={style.pendingCard}>
                    <div className={style.pendingMeta}>
                      <h4>{listing.title}</h4>
                      <span>{listing.city} • {listing.listing_type}</span>
                    </div>
                    
                    <div className={style.actionRow}>
                      {/* Option A: Wallet ($15) */}
                      <button 
                        className={style.walletPayBtn}
                        onClick={() => payWithWallet(listing)}
                        disabled={!!processingId}
                        title="Save $5 using Wallet"
                      >
                        <Zap size={14} fill="currentColor" />
                        <span>Wallet ${WALLET_PRICE}</span>
                      </button>

                      {/* Option B: Direct ($20) */}
                      <button 
                        className={style.directPayBtn}
                        onClick={() => payDirect(listing)}
                        disabled={!!processingId}
                      >
                        <span>Card ${DIRECT_PRICE}</span>
                        <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- RIGHT COLUMN: HISTORY --- */}
        <div className={style.rightColumn}>
          <div className={style.section}>
            <div className={style.sectionHeader}>
              <h3>Payment History</h3>
            </div>

            {payments.length === 0 ? (
              <div className={style.emptyTable}>No transaction history found.</div>
            ) : (
              <div className={style.tableWrapper}>
                <table className={style.historyTable}>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Ref</th>
                      <th>Date</th>
                      <th className={style.textRight}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id}>
                        <td>
                          <span className={style.statusBadge}>
                            {p.purpose === 'wallet_funding' ? 'Top Up' : 'Activation'}
                          </span>
                        </td>
                        <td className={style.refText}>{p.tx_ref?.substring(0, 10)}...</td>
                        <td>{new Date(p.created_at).toLocaleDateString()}</td>
                        <td className={style.amountText}>
                          {p.currency === 'NGN' ? '₦' : '$'}{p.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default OwnerPayments;