import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { 
  CreditCard, History, Wallet, AlertCircle, Lock,
  Loader2, CheckCircle2, Plus, Zap, ArrowUpRight, ShieldCheck 
} from "lucide-react";
import { useAuth } from "../context/AuthProvider";
import style from "../styles/Payments.module.css"; 

// ================= CONFIG =================
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const WALLET_PRICE = 15; // Discounted Price for Owners
const DIRECT_PRICE = 20; // Standard Card Price

const OwnerPayments = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const userId = user?.unique_id || user?.id;

  const [localStatus, setLocalStatus] = useState(user?.verification_status || 'pending');

  const [inactiveListings, setInactiveListings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
  });

  useEffect(() => {
    if (!window.FlutterwaveCheckout) {
      const script = document.createElement("script");
      script.src = "https://checkout.flutterwave.com/v3.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (userId) fetchData();
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, walletRes, listingsRes, historyRes] = await Promise.all([
          axios.get(`${API_BASE}/api/profile`, authHeader()),
          axios.get(`${API_BASE}/api/wallet`, authHeader()),
          axios.get(`${API_BASE}/api/listings/agent`, authHeader()), 
          axios.get(`${API_BASE}/api/payments/history`, authHeader())
      ]);

      const status = profileRes.data.verification_status;
      setLocalStatus(status);
      
      if (updateUser) {
          updateUser(profileRes.data);
      }

      setWalletBalance(Number(walletRes.data?.balance || 0));

      const unpaid = Array.isArray(listingsRes.data)
        ? listingsRes.data.filter((l) => l.status === "approved" && !l.is_active)
        : [];
      setInactiveListings(unpaid);

      setPayments(Array.isArray(historyRes.data) ? historyRes.data : []);

    } catch (err) {
      console.error("Data Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleFundWallet = async () => {
    const { value: amount } = await Swal.fire({
      title: 'Fund Your Wallet',
      text: 'Enter amount in USD (min $5).',
      input: 'number',
      inputValue: 20,
      showCancelButton: true,
      confirmButtonColor: '#007983',
      confirmButtonText: 'Next'
    });

    if (!amount || amount < 5) return;

    const currency = await selectCurrency();
    if (!currency) return;

    setProcessingId('FUND');
    try {
      const res = await axios.post(
        `${API_BASE}/api/wallet/fund`, 
        { amount, currency }, 
        authHeader()
      );
      openFlutterwave(res.data, "FUND_WALLET");
    } catch (err) {
      Swal.fire("Error", "Could not initialize funding.", "error");
      setProcessingId(null);
    }
  };

  const payWithWallet = async (listing) => {
    if (walletBalance < WALLET_PRICE) {
      return Swal.fire({
        title: "Insufficient Funds",
        text: `You need $${WALLET_PRICE} to activate. Your balance is $${walletBalance}.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Fund Wallet",
        confirmButtonColor: "#007983"
      }).then((result) => {
        if (result.isConfirmed) handleFundWallet();
      });
    }

    const confirm = await Swal.fire({
      title: 'Confirm Activation',
      text: `Activate "${listing.title}" for $${WALLET_PRICE}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#007983',
      confirmButtonText: 'Yes, Activate'
    });

    if (!confirm.isConfirmed) return;

    setProcessingId(listing.product_id);
    try {
      await axios.post(`${API_BASE}/api/wallet/activate`, { listingId: listing.product_id }, authHeader());
      Swal.fire("Success", "Listing Activated Successfully!", "success");
      fetchData();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Activation failed", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const payDirect = async (listing) => {
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
      Swal.fire("Error", "Initialization failed", "error");
      setProcessingId(null);
    }
  };

  const openFlutterwave = (paymentData, type, listing = null) => {
    window.FlutterwaveCheckout({
      public_key: paymentData.public_key,
      tx_ref: paymentData.tx_ref,
      amount: paymentData.amount, 
      currency: paymentData.currency, 
      payment_options: "card,mobilemoney,ussd",
      customer: { email: user?.email, name: user?.full_name },
      customizations: {
        title: type === "FUND_WALLET" ? "Wallet Top-up" : "Activate Listing",
        description: type === "FUND_WALLET" ? "Adding funds to wallet" : `Activation for ${listing?.title}`,
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
        Swal.fire("Success", type === "FUND_WALLET" ? "Wallet Funded!" : "Listing Activated!", "success");
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

  const isVerified = localStatus === 'approved';

  if (!isVerified) {
    return (
        <div className={style.lockedContainer}>
            <div className={style.lockedCard}>
                <div className={style.iconWrapper}><Lock size={48} className={style.lockedIcon} /></div>
                <h2>Wallet Locked</h2>
                <p>Your financial dashboard is restricted. To fund your wallet or activate listings, your profile must be <b>Approved</b>.</p>
                <div className={style.statusBadge}>Current Status: <span>{localStatus.toUpperCase()}</span></div>
                <button className={style.verifyBtn} onClick={() => navigate('/owner/profile')}>
                    <ShieldCheck size={18} /> Go to Verification
                </button>
            </div>
        </div>
    );
  }

  if (loading && !walletBalance) {
    return <div className={style.loaderContainer}><Loader2 className="animate-spin" size={40} color="#007983" /></div>;
  }

  return (
    <div className={style.pageWrapper}>
      <header className={style.header}>
        <div><h1>Financial Dashboard</h1><p>Manage your earnings, wallet, and property activations.</p></div>
        <button className={style.refreshBtn} onClick={fetchData}><History size={16} /> Sync Data</button>
      </header>

      <div className={style.gridContainer}>
        <div className={style.leftColumn}>
          <div className={style.walletCard} style={{ background: 'linear-gradient(135deg, #1f2937 0%, #007983 100%)' }}>
            <div className={style.cardPattern} />
            <div className={style.cardContent}>
              <div className={style.cardTop}><div className={style.chip} /><span className={style.cardBrand}>OWNER WALLET</span></div>
              <div className={style.balanceGroup}><span className={style.balanceLabel}>Current Balance</span><h2 className={style.balanceAmount}>${walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2></div>
              <div className={style.cardBottom}>
                <div className={style.holderInfo}><span>OWNER</span><strong>{user?.full_name?.toUpperCase() || "LANDLORD"}</strong></div>
                <div className={style.expiryInfo}><span>STATUS</span><strong className={style.activeText}>ACTIVE</strong></div>
              </div>
            </div>
          </div>

          <button className={style.fundBtn} onClick={handleFundWallet} disabled={processingId === 'FUND'}>
            {processingId === 'FUND' ? <Loader2 className="animate-spin" /> : <Plus size={20} />}<span>Add Funds to Wallet</span>
          </button>

          <div className={style.section}>
            <div className={style.sectionHeader}><h3><AlertCircle size={18} /> Pending Activations</h3></div>
            {inactiveListings.length === 0 ? (
              <div className={style.emptyState}><CheckCircle2 size={40} className={style.successIcon} /><p>All your approved listings are active!</p></div>
            ) : (
              <div className={style.pendingList}>
                {inactiveListings.map(listing => (
                  <div key={listing.product_id} className={style.pendingCard}>
                    <div className={style.pendingMeta}><h4>{listing.title}</h4><span>{listing.city} • {new Date(listing.created_at).toLocaleDateString()}</span></div>
                    <div className={style.actionRow}>
                      <button className={style.walletPayBtn} onClick={() => payWithWallet(listing)} disabled={!!processingId} title="Save $5 using Wallet">
                        <Zap size={14} fill="currentColor" /><span>Wallet ${WALLET_PRICE}</span>
                      </button>
                      <button className={style.directPayBtn} onClick={() => payDirect(listing)} disabled={!!processingId}>
                        <span>Card ${DIRECT_PRICE}</span><ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={style.rightColumn}>
          <div className={style.section}>
            <div className={style.sectionHeader}><h3>Payment History</h3></div>
            {payments.length === 0 ? (
              <div className={style.emptyTable}>No transaction history found.</div>
            ) : (
              <div className={style.tableWrapper}>
                <table className={style.historyTable}>
                  <thead><tr><th>Type</th><th>Ref</th><th>Date</th><th className={style.textRight}>Amount</th></tr></thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id}>
                        <td><span className={`${style.statusBadge} ${p.purpose === 'wallet_funding' ? style.funding : style.activation}`}>{p.purpose === 'wallet_funding' ? 'Top Up' : 'Activation'}</span></td>
                        <td className={style.refText}>{p.tx_ref?.substring(0, 10)}...</td>
                        <td>{new Date(p.created_at).toLocaleDateString()}</td>
                        <td className={style.amountText}>{p.currency === 'NGN' ? '₦' : '$'}{p.amount}</td>
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