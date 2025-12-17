import React, { useEffect, useState } from "react";
import client from "../api/axios";
import { DollarSign, ArrowUpRight, ArrowDownLeft, Download } from "lucide-react";
import Swal from "sweetalert2";

const OwnerPayments = () => {
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Get Balance (Total Earnings)
        const statsRes = await client.get("/agents/stats");
        setBalance(statsRes.data.earnings || 0);

        // 2. Get Transaction History
        const txnRes = await client.get("/agents/transactions?limit=20");
        setTransactions(txnRes.data);
      } catch (err) {
        console.error("Payment fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
          // Replace with actual withdrawal endpoint
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Payments & Finance</h2>
        <button 
          onClick={handleWithdraw}
          className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-700"
        >
          <DollarSign size={18} /> Withdraw Funds
        </button>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-8 rounded-xl shadow-lg mb-8 max-w-md">
        <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Total Earnings</p>
        <h1 className="text-4xl font-bold mt-2">${balance.toLocaleString()}</h1>
        <div className="mt-6 flex gap-4">
          <div className="flex items-center gap-2 text-green-400 text-sm bg-gray-700/50 px-3 py-1 rounded-full">
            <ArrowUpRight size={14} /> +12% this month
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold text-gray-700">Recent Transactions</h3>
          <button className="text-gray-500 hover:text-blue-600 text-sm flex items-center gap-1">
            <Download size={14} /> Export CSV
          </button>
        </div>
        
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading history...</div>
        ) : transactions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No transactions found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-sm text-gray-500 border-b">
                <th className="p-4 font-medium">ID</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4 text-sm font-mono text-gray-600">{txn.id.substring(0, 8)}...</td>
                  <td className="p-4">
                    <span className="flex items-center gap-2 text-sm">
                      {txn.type === 'Withdrawal' ? (
                        <ArrowUpRight size={16} className="text-red-500" />
                      ) : (
                        <ArrowDownLeft size={16} className="text-green-500" />
                      )}
                      {txn.type}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(txn.date).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      txn.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                      txn.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {txn.status}
                    </span>
                  </td>
                  <td className={`p-4 text-right font-bold ${txn.type === 'Withdrawal' ? 'text-red-600' : 'text-green-600'}`}>
                    {txn.type === 'Withdrawal' ? '-' : '+'}${Number(txn.amount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default OwnerPayments;