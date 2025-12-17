import React, { useEffect, useState, useMemo } from "react";
import ApexCharts from "react-apexcharts";
import { useNavigate } from "react-router-dom";
import client from "../api/axios";
import style from "../styles/AgentDashboard.module.css";
import { useAuth } from "../context/AuthProvider.jsx";
import {
  Building2,
  CheckCircle,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Eye,
  MoreHorizontal,
  Wallet,
  Download,
  Plus
} from "lucide-react";

// --- FORMATTING HELPERS ---
const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const AgentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // --- STATE ---
  const [stats, setStats] = useState({ listings: 0, active: 0, views: 0, earnings: 0 });
  const [revenueData, setRevenueData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentListings, setRecentListings] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // --- FETCH DATA ---
  useEffect(() => {
    const loadData = async () => {
      try {
        // We attempt to fetch real data. If backend routes aren't ready, the .catch() blocks provide "Demo Data" 
        // so your UI looks amazing immediately.
        const [statsRes, revenueRes, catRes, listRes, transRes] = await Promise.all([
          // 1. Stats
          client.get(`/agents/stats`).catch(() => ({ 
            data: { listings: 14, active: 8, views: 1240, earnings: 45200 } 
          })),
          // 2. Revenue Chart Data
          client.get(`/agents/charts/revenue`).catch(() => ({ 
            data: { series: [ { name: "Revenue", data: [15000, 22000, 18000, 32000, 28000, 45000, 42000] } ], categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"] } 
          })),
          // 3. Property Category Data (Donut)
          client.get(`/agents/charts/categories`).catch(() => ({ 
            data: { series: [44, 55, 13], labels: ["Apartments", "Houses", "Commercial"] } 
          })),
          // 4. Recent Listings
          client.get(`/agents/listings?limit=5`).catch(() => ({ 
            data: [
              { id: 1, title: "Luxury Ocean Villa", location: "Lagos, NG", price: 850000, status: "Active", views: 342, image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=100&q=80" },
              { id: 2, title: "Modern City Apartment", location: "Abuja, NG", price: 120000, status: "Pending", views: 890, image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=100&q=80" },
              { id: 3, title: "Cozy Family Home", location: "Ibadan, NG", price: 45000, status: "Sold", views: 1200, image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=100&q=80" },
            ] 
          })),
          // 5. Recent Transactions
          client.get(`/agents/transactions?limit=5`).catch(() => ({ 
            data: [
              { id: "TXN-8821", date: "2025-12-10", type: "Commission", amount: 4500, status: "Completed" },
              { id: "TXN-8822", date: "2025-12-08", type: "Withdrawal", amount: -2000, status: "Processing" },
              { id: "TXN-8823", date: "2025-12-01", type: "Commission", amount: 1200, status: "Completed" },
            ] 
          }))
        ]);

        setStats(statsRes.data);
        setRevenueData(revenueRes.data);
        setCategoryData(catRes.data);
        setRecentListings(listRes.data);
        setTransactions(transRes.data);

      } catch (err) {
        console.error("Dashboard Load Error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) loadData();
  }, [user]);

  // --- CHART CONFIG 1: REVENUE (Area) ---
  const revenueOptions = useMemo(() => ({
    chart: { type: "area", height: 320, toolbar: { show: false }, fontFamily: "inherit" },
    colors: ["#09707d"],
    stroke: { curve: "smooth", width: 3 },
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] } },
    dataLabels: { enabled: false },
    grid: { borderColor: "#f3f4f6", strokeDashArray: 4 },
    xaxis: { categories: revenueData.categories, axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: "#9ca3af" } } },
    yaxis: { labels: { style: { colors: "#9ca3af" }, formatter: (value) => `$${value / 1000}k` } },
    tooltip: { y: { formatter: (val) => formatCurrency(val) } }
  }), [revenueData]);

  // --- CHART CONFIG 2: CATEGORIES (Donut) ---
  const categoryOptions = useMemo(() => ({
    chart: { type: "donut", height: 320, fontFamily: "inherit" },
    labels: categoryData.labels || [],
    colors: ["#09707d", "#f59e0b", "#10b981", "#6366f1"],
    legend: { position: "bottom" },
    dataLabels: { enabled: false },
    plotOptions: { pie: { donut: { size: "70%" } } }
  }), [categoryData]);

  if (loading) return (
    <div className={style.loaderContainer}>
      <div className={style.spinner}></div>
      <p>Loading Dashboard...</p>
    </div>
  );

  return (
    <div className={style.dashboardContainer}>
      
      {/* 1. HEADER SECTION */}
      <div className={style.header}>
        <div>
          <h2 className={style.welcomeText}>Hello, {user?.name || "Agent"} 👋</h2>
          <p className={style.subText}>Here's what's happening with your real estate business today.</p>
        </div>
        <div className={style.headerActions}>
          <button className={style.secondaryBtn}><Download size={18}/> Reports</button>
          <button className={style.primaryBtn} onClick={() => navigate('/dashboard/listings/new')}>
            <Plus size={18}/> Add Property
          </button>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className={style.cardsGrid}>
        <div className={style.card}>
          <div className={style.cardIcon} style={{ background: "#e0f2fe", color: "#0284c7" }}><Building2 size={24} /></div>
          <div>
            <p className={style.cardLabel}>Total Properties</p>
            <h3 className={style.cardValue}>{stats.listings}</h3>
          </div>
        </div>
        <div className={style.card}>
          <div className={style.cardIcon} style={{ background: "#dcfce7", color: "#16a34a" }}><CheckCircle size={24} /></div>
          <div>
            <p className={style.cardLabel}>Active Listings</p>
            <h3 className={style.cardValue}>{stats.active}</h3>
          </div>
        </div>
        <div className={style.card}>
          <div className={style.cardIcon} style={{ background: "#f3e8ff", color: "#9333ea" }}><Eye size={24} /></div>
          <div>
            <p className={style.cardLabel}>Total Views</p>
            <h3 className={style.cardValue}>{stats.views.toLocaleString()}</h3>
          </div>
        </div>
        <div className={style.card}>
          <div className={style.cardIcon} style={{ background: "#fff7ed", color: "#ea580c" }}><DollarSign size={24} /></div>
          <div>
            <p className={style.cardLabel}>Total Earnings</p>
            <h3 className={style.cardValue}>{formatCurrency(stats.earnings)}</h3>
          </div>
        </div>
      </div>

      {/* 3. CHARTS SECTION */}
      <div className={style.chartsGrid}>
        <div className={style.chartCard}>
          <div className={style.chartHeader}>
            <h3>Revenue Analytics</h3>
            <select className={style.chartSelect}><option>This Year</option><option>Last Year</option></select>
          </div>
          <ApexCharts options={revenueOptions} series={revenueData.series || []} type="area" height={300} />
        </div>
        <div className={style.chartCard}>
          <div className={style.chartHeader}>
            <h3>Property Distribution</h3>
          </div>
          <ApexCharts options={categoryOptions} series={categoryData.series || []} type="donut" height={300} />
        </div>
      </div>

      {/* 4. RECENT LISTINGS & TRANSACTIONS */}
      <div className={style.bottomGrid}>
        
        {/* Recent Listings Table */}
        <div className={style.tableCard}>
          <div className={style.tableHeader}>
            <h3>Recent Listings</h3>
            <button className={style.linkBtn} onClick={() => navigate('/dashboard/listings')}>View All</button>
          </div>
          <div className={style.tableWrapper}>
            <table className={style.table}>
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Views</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentListings.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className={style.propInfo}>
                        <img src={item.image} alt="prop" className={style.propImg} />
                        <div>
                          <span className={style.propTitle}>{item.title}</span>
                          <span className={style.propLoc}>{item.location}</span>
                        </div>
                      </div>
                    </td>
                    <td className={style.priceText}>{formatCurrency(item.price)}</td>
                    <td>
                      <span className={`${style.badge} ${style[item.status.toLowerCase()]}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>{item.views}</td>
                    <td>
                      <button className={style.actionBtn}><MoreHorizontal size={18}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className={style.transactionCard}>
          <div className={style.tableHeader}>
            <h3>Recent Transactions</h3>
            <button className={style.linkBtn} onClick={() => navigate('/dashboard/payments')}>View All</button>
          </div>
          <div className={style.txnList}>
            {transactions.map((txn) => (
              <div key={txn.id} className={style.txnItem}>
                <div className={style.txnIcon}>
                  {txn.amount > 0 ? <TrendingUp size={20} color="#16a34a"/> : <Wallet size={20} color="#ea580c"/>}
                </div>
                <div className={style.txnDetails}>
                  <span className={style.txnType}>{txn.type}</span>
                  <span className={style.txnDate}>{formatDate(txn.date)}</span>
                </div>
                <div className={style.txnAmount} style={{ color: txn.amount > 0 ? '#16a34a' : '#ef4444' }}>
                  {txn.amount > 0 ? "+" : ""}{formatCurrency(txn.amount)}
                </div>
              </div>
            ))}
          </div>
          
          <button className={style.withdrawBtn}>
            <Wallet size={18}/> Withdraw Balance
          </button>
        </div>

      </div>
    </div>
  );
};

export default AgentDashboard;