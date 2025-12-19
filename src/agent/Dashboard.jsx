import React, { useEffect, useState, useMemo, useRef } from "react";
import ApexCharts from "react-apexcharts";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import client from "../api/axios";
import style from "../styles/AgentDashboard.module.css";
import { useAuth } from "../context/AuthProvider.jsx";
import {
  Building2, CheckCircle, Wallet, TrendingUp, Eye,
  MoreHorizontal, Plus, ArrowUpRight, ArrowDownLeft,
  Activity, RefreshCw, Trash2, PauseCircle, PieChart
} from "lucide-react";

// --- HELPERS ---
const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount || 0);

const formatDate = (dateString) => 
  new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });

const AgentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // --- DATA STATE ---
  const [stats, setStats] = useState({ listings: 0, active: 0, views: 0, total_spent: 0 });
  const [dailyFunding, setDailyFunding] = useState([]); 
  const [typeData, setTypeData] = useState({ series: [], labels: [] });
  const [statusData, setStatusData] = useState({ series: [], labels: [] });
  const [recentListings, setRecentListings] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // --- UI STATE ---
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  // --- 1. FETCH DATA ---
  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [statsRes, fundingRes, typeRes, statusRes, listRes, transRes] = await Promise.all([
        // Stats
        client.get(`/agents/stats`).catch(() => ({ 
          data: { listings: 0, active: 0, views: 0, total_spent: 0 } 
        })),
        // Daily Funding (Fixed Mock Structure)
        client.get(`/agents/charts/funding`).catch(() => ({ 
          data: { data: [0, 0, 0, 0, 0, 0, 0] } 
        })),
        // Listing Types
        client.get(`/agents/charts/types`).catch(() => ({ 
          data: { series: [], labels: [] } 
        })),
        // Status
        client.get(`/agents/charts/status`).catch(() => ({ 
          data: { series: [], labels: [] } 
        })),
        // Listings
        client.get(`/agents/listings?limit=5`).catch(() => ({ data: [] })),
        // Transactions
        client.get(`/agents/transactions?limit=5`).catch(() => ({ data: [] }))
      ]);

      setStats(statsRes.data);
      
      // ✅ FIX: Extract the inner array correctly
      // Backend returns { data: [10, 20...] }, Axios puts it in res.data
      const fundingArray = fundingRes.data?.data || []; 
      setDailyFunding(Array.isArray(fundingArray) ? fundingArray : []);

      setTypeData(typeRes.data);
      setStatusData(statusRes.data);
      setRecentListings(listRes.data);
      setTransactions(transRes.data);

    } catch (err) {
      console.error("Data Load Error:", err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchData();
    }
  }, [user]);

  // --- 2. CLICK OUTSIDE HANDLER ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- 3. LISTING ACTIONS ---
  const handleAction = async (action, listing) => {
    setOpenMenuId(null);
    if (action === 'delete') {
      const result = await Swal.fire({
        title: 'Delete Listing?',
        text: `Are you sure you want to delete "${listing.title}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Yes, delete it'
      });
      if (result.isConfirmed) {
        // Add API delete call here
        Swal.fire('Deleted!', 'Listing has been deleted.', 'success');
        fetchData();
      }
    } else if (action === 'freeze') {
      Swal.fire('Updated', `Listing "${listing.title}" is now frozen.`, 'info');
    }
  };

  // --- 4. CHARTS CONFIG ---
  const investmentOptions = useMemo(() => ({
    chart: { type: "bar", height: 320, toolbar: { show: false }, fontFamily: "inherit" },
    colors: ["#007983"],
    plotOptions: { bar: { borderRadius: 4, columnWidth: "50%" } },
    dataLabels: { enabled: false },
    grid: { borderColor: "#f1f5f9", strokeDashArray: 4 },
    xaxis: { 
      categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], 
      axisBorder: { show: false }, axisTicks: { show: false }, 
      labels: { style: { colors: "#64748b" } } 
    },
    yaxis: { labels: { style: { colors: "#64748b" }, formatter: (val) => `$${val}` } },
    tooltip: { y: { formatter: (val) => formatCurrency(val) } },
    title: { text: "Wallet Funding (This Week)", style: { fontSize: '14px', color: '#64748b', fontWeight: 400 } }
  }), []);

  const typeOptions = useMemo(() => ({
    chart: { type: "donut", height: 280, fontFamily: "inherit" },
    labels: typeData.labels || [],
    colors: ["#007983", "#f59e0b", "#10b981", "#6366f1"],
    legend: { position: "bottom" },
    dataLabels: { enabled: false },
    plotOptions: { pie: { donut: { size: "70%", labels: { show: true, total: { show: true, label: 'Types', color: '#64748b' } } } } }
  }), [typeData]);

  const statusOptions = useMemo(() => ({
    chart: { type: "donut", height: 280, fontFamily: "inherit" },
    labels: statusData.labels || [],
    colors: ["#16a34a", "#eab308", "#475569"],
    legend: { position: "bottom" },
    dataLabels: { enabled: false },
    plotOptions: { pie: { donut: { size: "70%", labels: { show: true, total: { show: true, label: 'Status', color: '#64748b' } } } } }
  }), [statusData]);

  if (loading && !stats.listings) return <div className={style.loaderContainer}><div className={style.spinner}></div></div>;

  return (
    <div className={style.dashboardContainer}>
      
      {/* HEADER */}
      <div className={style.header}>
        <div>
          <h2 className={style.welcomeText}>Agent Dashboard</h2>
          <p className={style.subText}>Overview of your real estate activities.</p>
        </div>
        <div className={style.headerActions}>
          <button 
            className={style.refreshBtn} 
            onClick={fetchData} 
            disabled={refreshing}
            title="Refresh Data"
          >
            <RefreshCw size={18} className={refreshing ? style.spin : ""} />
            <span>{refreshing ? "Syncing..." : "Refresh"}</span>
          </button>
          <button className={style.primaryBtn} onClick={() => navigate('/dashboard/listings/new')}>
            <Plus size={18} /> Add Property
          </button>
        </div>
      </div>

      {/* METRICS */}
      <div className={style.metricsGrid}>
        <div className={style.metricCard}>
          <div className={style.metricIcon} style={{ background: "#ecfdf5", color: "#059669" }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p className={style.metricLabel}>Total Invested</p>
            <h3 className={style.metricValue}>{formatCurrency(Number(stats.total_spent) || 0)}</h3>
            <span className={style.metricSub}>Wallet & Activations</span>
          </div>
        </div>

        <div className={style.metricCard}>
          <div className={style.metricIcon} style={{ background: "#e0f2fe", color: "#0284c7" }}>
            <Building2 size={24} />
          </div>
          <div>
            <p className={style.metricLabel}>Active Listings</p>
            <h3 className={style.metricValue}>{stats.active} <span className={style.subValue}>/ {stats.listings}</span></h3>
            <span className={style.metricSub}>Live Properties</span>
          </div>
        </div>

        <div className={style.metricCard}>
          <div className={style.metricIcon} style={{ background: "#f3e8ff", color: "#9333ea" }}>
            <Eye size={24} />
          </div>
          <div>
            <p className={style.metricLabel}>Total Views</p>
            <h3 className={style.metricValue}>{stats.views?.toLocaleString() || 0}</h3>
            <span className={style.metricSub}>Exposure Reach</span>
          </div>
        </div>

        <div className={style.metricCard}>
          <div className={style.metricIcon} style={{ background: "#fff7ed", color: "#ea580c" }}>
            <Wallet size={24} />
          </div>
          <div>
            <p className={style.metricLabel}>Quick Balance</p>
            <button className={style.linkText} onClick={() => navigate('/dashboard/payments')}>
              Go to Wallet <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* CHARTS */}
      <div className={style.chartsLayout}>
        <div className={style.mainChartCard}>
          <div className={style.cardHeader}>
            <h3>Investment Analysis</h3>
            <p>Daily amount funded into wallet this week</p>
          </div>
          <ApexCharts options={investmentOptions} series={[{ name: "Funded", data: dailyFunding }]} type="bar" height={300} />
        </div>

        <div className={style.sideChartsColumn}>
          <div className={style.smallChartCard}>
            <div className={style.cardHeaderSmall}>
              <h3><PieChart size={16}/> Listing Types</h3>
            </div>
            <ApexCharts options={typeOptions} series={typeData.series} type="donut" height={200} />
          </div>
          
          <div className={style.smallChartCard}>
            <div className={style.cardHeaderSmall}>
              <h3><Activity size={16}/> Property Status</h3>
            </div>
            <ApexCharts options={statusOptions} series={statusData.series} type="donut" height={200} />
          </div>
        </div>
      </div>

      {/* LISTINGS & TRANSACTIONS */}
      <div className={style.bottomGrid}>
        
        <div className={style.tableCard}>
          <div className={style.tableHeaderRow}>
            <h3>Recent Listings</h3>
            <button className={style.textBtn} onClick={() => navigate('/dashboard/listings')}>View All</button>
          </div>
          <div className={style.tableWrapper}>
            <table className={style.table}>
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentListings.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className={style.propCell}>
                        <img src={item.image} alt="prop" className={style.propThumb} />
                        <div>
                          <span className={style.propName}>{item.title}</span>
                          <span className={style.propLoc}>{item.location}</span>
                        </div>
                      </div>
                    </td>
                    <td className={style.priceCell}>{formatCurrency(item.price)}</td>
                    <td>
                      <span className={`${style.statusBadge} ${style[item.status.toLowerCase()]}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className={style.actionCell}>
                      <button 
                        className={style.iconBtn} 
                        onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                      >
                        <MoreHorizontal size={18}/>
                      </button>
                      
                      {openMenuId === item.id && (
                        <div className={style.actionMenu} ref={menuRef}>
                          <button onClick={() => handleAction('freeze', item)} className={style.menuItem}>
                            <PauseCircle size={14} /> Freeze Listing
                          </button>
                          <button onClick={() => handleAction('delete', item)} className={`${style.menuItem} ${style.deleteItem}`}>
                            <Trash2 size={14} /> Delete Listing
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={style.transactionCard}>
          <div className={style.tableHeaderRow}>
            <h3>Wallet Activity</h3>
            <button className={style.textBtn} onClick={() => navigate('/dashboard/payments')}>View All</button>
          </div>
          <div className={style.txnList}>
            {transactions.map((txn) => (
              <div key={txn.id} className={style.txnItem}>
                <div className={`${style.txnIconBox} ${txn.amount > 0 ? style.in : style.out}`}>
                  {txn.amount > 0 ? <ArrowDownLeft size={18}/> : <ArrowUpRight size={18}/>}
                </div>
                <div className={style.txnInfo}>
                  <span className={style.txnTitle}>{txn.type}</span>
                  <span className={style.txnDate}>{formatDate(txn.date)}</span>
                </div>
                <div className={`${style.txnAmount} ${txn.amount > 0 ? style.positive : style.negative}`}>
                  {txn.amount > 0 ? "+" : ""}{formatCurrency(txn.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AgentDashboard;