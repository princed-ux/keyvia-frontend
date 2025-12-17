import React, { useEffect, useState } from "react";
import { FlutterWaveButton, closePaymentModal } from "flutterwave-react-v3";
import Swal from "sweetalert2";
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download, 
  CreditCard, 
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";

import client from "../api/axios"; // Uses your configured axios client
import { useAuth } from "../context/AuthProvider";
import style from "../styles/Payments.module.css"; // Using the same CSS module

// Configuration
const ACTIVATION_FEE_USD = 10; 

const OwnerPayments = () => {
  const { user } = useAuth();
  
  // Data State
  const [balance, setBalance] = useState(0);
  const [inactiveListings, setInactiveListings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  // Loading State
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  
  // Payment State
  const [currentPaymentData, setCurrentPaymentData] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Earnings/Stats
      const statsRes = await client.get("/agents/stats");
      setBalance(statsRes.data.earnings || 0);

      // 2. Fetch Listings (to find unpaid ones)
      const listingsRes = await client.get("/api/listings/agent");
      const allListings = Array.isArray(listingsRes.data) ? listingsRes.data : [];
      const unpaid = allListings.filter(l => l.status === 'approved' && !l.is_active);
      setInactiveListings(unpaid);

      // 3. Fetch Transaction History (Payments & Withdrawals)
      const historyRes = await client.get("/api/payments/history");
      setTransactions(Array.isArray(historyRes.data) ? historyRes.data : []);

    } catch (err) {
      console.error("Data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // 🟢 FLUTTERWAVE PAYMENT LOGIC
  // ==========================

  const initiatePayment = async (listing) => {
    setInitializing(true);
    setSelectedListing(listing);

    try {
      // Call backend to generate TX Ref
      const res = await client.post("/api/payments/initialize", { listingId: listing.product_id });
      
      const paymentData = res.data;
      if (!paymentData || !paymentData.tx_ref || !paymentData.public_key) {
        throw new Error("Invalid payment initialization");
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
      const verifyRes = await client.post("/api/payments/verify", { tx_ref, transaction_id });

      if (verifyRes.data?.success || verifyRes.data?.status === "success") {
        Swal.fire("Success!", "Your listing is now LIVE.", "success");
        fetchAllData(); // Refresh all data
      } else {
        throw new Error(verifyRes.data?.message || "Verification failed");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Payment verification failed. Please contact support.", "error");
    } finally {
      setCurrentPaymentData(null);
      setSelectedListing(null);
    }
  };

  // ==========================
  // 🔴 WITHDRAWAL LOGIC
  // ==========================
  const handleWithdraw = () => {
    Swal.fire({
      title: "Withdraw Funds",
      text: `Available Balance: $${balance.toLocaleString()}`,
      input: "number",
      inputAttributes: { min: 10, max: balance },
      showCancelButton: true,
      confirmButtonText: "Withdraw",
      showLoaderOnConfirm: true,
      preConfirm: async (amount) => {
        try {
          // await client.post("/api/payments/withdraw", { amount });
          return new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
        } catch (error) {
          Swal.showValidationMessage(`Request failed: ${error}`);
        }
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire("Success", "Withdrawal request submitted!", "success");
      }
    });
  };

  // ==========================
  // RENDER HELPERS
  // ==========================
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
          name: user?.name,
        },
        customizations: {
          title: "Activate Property",
          description: `Activation fee for ${listing.title}`,
          logo: "https://yoursite.com/logo.png", // Replace with your logo
        },
      };

      return (
        <div className="flex gap-2 mt-2">
          <FlutterWaveButton
            className={`${style.payNowBtn} bg-green-600 text-white`}
            {...config}
            text={`Confirm Pay $${ACTIVATION_FEE_USD}`}
            callback={handlePaymentSuccess}
            onClose={() => {}}
          />
          <button 
            className="px-3 py-2 text-sm text-red-500 border border-red-200 rounded hover:bg-red-50"
            onClick={() => setCurrentPaymentData(null)}
          >
            Cancel
          </button>
        </div>
      );
    }

    return (
      <button
        className={`${style.payNowBtn} flex items-center gap-2`}
        onClick={() => initiatePayment(listing)}
        disabled={initializing}
      >
        {initializing && selectedListing?.product_id === listing.product_id ? (
          <><Loader2 className="animate-spin" size={16}/> Loading...</>
        ) : (
          <><CreditCard size={16}/> Pay Activation ($ {ACTIVATION_FEE_USD})</>
        )}
      </button>
    );
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto"/> Loading finance data...</div>;

  return (
    <div className={style.paymentsPage}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Payments & Finance</h2>
        <button 
          onClick={handleWithdraw}
          className="bg-black text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-800 transition"
        >
          <DollarSign size={18} /> Withdraw Funds
        </button>
      </div>

      {/* --- 1. WALLET / EARNINGS SECTION --- */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-8 rounded-xl shadow-lg mb-8 max-w-md">
        <p className="text-blue-100 text-sm font-medium uppercase tracking-wider">Total Earnings</p>
        <h1 className="text-4xl font-bold mt-2">${balance.toLocaleString()}</h1>
        <div className="mt-6 flex gap-4">
          <div className="flex items-center gap-2 text-green-300 text-sm bg-white/10 px-3 py-1 rounded-full">
            <ArrowUpRight size={14} /> +12% this month
          </div>
        </div>
      </div>

      {/* --- 2. PENDING ACTIVATIONS SECTION --- */}
      {inactiveListings.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4 text-orange-600 font-semibold">
            <AlertCircle size={20}/> Action Required: Activate these listings
          </div>
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
        </section>
      )}

      {/* --- 3. TRANSACTION HISTORY SECTION --- */}
      <section className={style.section}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-gray-700">Transaction History</h3>
          <button className="text-gray-500 hover:text-blue-600 text-sm flex items-center gap-1">
            <Download size={14} /> Export CSV
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className={style.empty}>No transaction history found.</div>
        ) : (
          <div className={style.historyTableWrapper}>
            <table className={style.historyTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn, idx) => (
                  <tr key={txn.id || idx}>
                    <td>{new Date(txn.created_at || txn.date).toLocaleDateString()}</td>
                    <td>
                      <span className="flex items-center gap-2">
                        {txn.type === 'withdrawal' ? (
                          <><ArrowUpRight size={16} className="text-red-500" /> Withdraw</>
                        ) : (
                          <><ArrowDownLeft size={16} className="text-green-500" /> Payment</>
                        )}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-gray-500">{txn.tx_ref || txn.id?.substring(0,8)}</td>
                    <td className={`font-bold ${txn.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'}`}>
                      {txn.type === 'withdrawal' ? '-' : '+'}${Number(txn.amount).toLocaleString()}
                    </td>
                    <td>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        (txn.status === 'completed' || txn.status === 'success') ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {txn.status || 'Success'}
                      </span>
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

export default OwnerPayments;