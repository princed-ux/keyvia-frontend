import React, { useEffect, useState, useMemo } from "react";
import ApexCharts from "react-apexcharts";
import { useNavigate } from "react-router-dom";
import client from "../api/axios";
import style from "../styles/AgentDashboard.module.css"; // Reuse Agent styles for consistency
import { useAuth } from "../context/AuthProvider.jsx";
import {
  Building, Users, Wallet, Wrench, ArrowUpRight, 
  Plus, MoreHorizontal, AlertCircle, PieChart, Home
} from "lucide-react";

// --- FORMATTING HELPERS ---
const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount || 0);

const OwnerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // --- STATE ---
  const [stats, setStats] = useState({ properties: 0, tenants: 0, revenue: 0, maintenance: 0 });
  const [revenueData, setRevenueData] = useState([]);
  const [occupancyData, setOccupancyData] = useState([]);
  const [recentProperties, setRecentProperties] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  // --- FETCH DATA ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, revRes, occRes, propRes, actRes] = await Promise.all([
          // 1. Stats
          client.get("/owners/stats").catch(() => ({ 
            data: { properties: 5, tenants: 12, revenue: 24500, maintenance: 3 } 
          })),
          // 2. Revenue Chart (Rent Collected)
          client.get("/owners/charts/revenue").catch(() => ({ 
            data: { data: [4500, 5200, 4800, 6100, 5900, 7200] } 
          })),
          // 3. Occupancy Chart
          client.get("/owners/charts/occupancy").catch(() => ({ 
            data: { series: [12, 3], labels: ["Occupied", "Vacant"] } 
          })),
          // 4. Recent Properties
          client.get("/owners/properties?limit=5").catch(() => ({ 
            data: [
              { id: 1, title: "Sunset Apartments", location: "Lagos", status: "Occupied", rent: 15000, tenant: "John Doe" },
              { id: 2, title: "Greenwood Villa", location: "Abuja", status: "Vacant", rent: 25000, tenant: "-" }
            ] 
          })),
          // 5. Recent Activity (Maintenance/Payments)
          client.get("/owners/activity?limit=5").catch(() => ({ 
            data: [
              { id: 1, type: "Payment", message: "Rent received from Unit 4B", date: "2025-12-19", amount: 1200 },
              { id: 2, type: "Maintenance", message: "Leaking pipe reported at Sunset Apts", date: "2025-12-18", status: "Pending" }
            ] 
          }))
        ]);

        setStats(statsRes.data);
        setRevenueData(revRes.data?.data || []);
        setOccupancyData(occRes.data);
        setRecentProperties(propRes.data);
        setRecentActivity(actRes.data);

      } catch (err) {
        console.error("Dashboard Error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) loadData();
  }, [user]);

  // --- CHARTS CONFIG ---
  const revenueOptions = useMemo(() => ({
    chart: { type: "area", height: 300, toolbar: { show: false }, fontFamily: "inherit" },
    colors: ["#16a34a"], // Green for revenue
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } },
    dataLabels: { enabled: false },
    xaxis: { categories: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], labels: { style: { colors: "#64748b" } } },
    yaxis: { labels: { style: { colors: "#64748b" }, formatter: (val) => `$${val}` } },
    tooltip: { y: { formatter: (val) => formatCurrency(val) } }
  }), []);

  const occupancyOptions = useMemo(() => ({
    chart: { type: "donut", height: 300, fontFamily: "inherit" },
    labels: occupancyData.labels || [],
    colors: ["#007983", "#e2e8f0"], // Brand Color vs Gray
    legend: { position: "bottom" },
    dataLabels: { enabled: false },
    plotOptions: { pie: { donut: { size: "70%", labels: { show: true, total: { show: true, label: 'Units', color: '#64748b' } } } } }
  }), [occupancyData]);

  if (loading) return <div className={style.loaderContainer}><div className={style.spinner}></div></div>;

  return (
    <div className={style.dashboardContainer}>
      
      {/* HEADER */}
      <div className={style.header}>
        <div>
          <h2 className={style.welcomeText}>Owner Dashboard</h2>
          <p className={style.subText}>Overview of your properties and rental income.</p>
        </div>
        <div className={style.headerActions}>
          <button className={style.secondaryBtn} onClick={() => navigate('/owner/payments')}>
            <Wallet size={18} /> Finances
          </button>
          <button className={style.primaryBtn} onClick={() => navigate('/owner/add-property')}>
            <Plus size={18} /> Add Property
          </button>
        </div>
      </div>

      {/* METRICS */}
      <div className={style.metricsGrid}>
        <div className={style.metricCard}>
          <div className={style.metricIcon} style={{ background: "#dcfce7", color: "#166534" }}>
            <Wallet size={24} />
          </div>
          <div>
            <p className={style.metricLabel}>Total Revenue</p>
            <h3 className={style.metricValue}>{formatCurrency(stats.revenue)}</h3>
            <span className={style.metricSub}>Year to Date</span>
          </div>
        </div>

        <div className={style.metricCard}>
          <div className={style.metricIcon} style={{ background: "#e0f2fe", color: "#0284c7" }}>
            <Building size={24} />
          </div>
          <div>
            <p className={style.metricLabel}>Properties</p>
            <h3 className={style.metricValue}>{stats.properties}</h3>
            <span className={style.metricSub}>Total Units Owned</span>
          </div>
        </div>

        <div className={style.metricCard}>
          <div className={style.metricIcon} style={{ background: "#f3e8ff", color: "#9333ea" }}>
            <Users size={24} />
          </div>
          <div>
            <p className={style.metricLabel}>Active Tenants</p>
            <h3 className={style.metricValue}>{stats.tenants}</h3>
            <span className={style.metricSub}>Currently Renting</span>
          </div>
        </div>

        <div className={style.metricCard}>
          <div className={style.metricIcon} style={{ background: "#fee2e2", color: "#991b1b" }}>
            <Wrench size={24} />
          </div>
          <div>
            <p className={style.metricLabel}>Maintenance</p>
            <h3 className={style.metricValue}>{stats.maintenance}</h3>
            <span className={style.metricSub}>Pending Requests</span>
          </div>
        </div>
      </div>

      {/* CHARTS */}
      <div className={style.chartsLayout}>
        <div className={style.mainChartCard}>
          <div className={style.cardHeader}>
            <h3>Revenue Overview</h3>
            <p>Monthly rent collection</p>
          </div>
          <ApexCharts options={revenueOptions} series={[{ name: "Rent Collected", data: revenueData }]} type="area" height={300} />
        </div>

        <div className={style.sideChartsColumn}>
          <div className={style.smallChartCard}>
            <div className={style.cardHeaderSmall}>
              <h3><PieChart size={16}/> Occupancy Rate</h3>
            </div>
            <ApexCharts options={occupancyOptions} series={occupancyData.series} type="donut" height={220} />
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div className={style.bottomGrid}>
        
        {/* Properties Table */}
        <div className={style.tableCard}>
          <div className={style.tableHeaderRow}>
            <h3>My Properties</h3>
            <button className={style.textBtn} onClick={() => navigate('/owner/properties')}>View All</button>
          </div>
          <div className={style.tableWrapper}>
            <table className={style.table}>
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Status</th>
                  <th>Rent</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentProperties.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className={style.propCell}>
                        <div className={style.propThumb}><Home size={20} color="#64748b"/></div>
                        <div>
                          <span className={style.propName}>{item.title}</span>
                          <span className={style.propLoc}>{item.location}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${style.statusBadge} ${item.status === 'Occupied' ? style.active : style.pending}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className={style.priceCell}>{formatCurrency(item.rent)}</td>
                    <td><button className={style.iconBtn}><MoreHorizontal size={16}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className={style.transactionCard}>
          <div className={style.tableHeaderRow}>
            <h3>Recent Activity</h3>
          </div>
          <div className={style.txnList}>
            {recentActivity.map((act) => (
              <div key={act.id} className={style.txnItem}>
                <div className={`${style.txnIconBox} ${act.type === 'Payment' ? style.in : style.out}`}>
                  {act.type === 'Payment' ? <ArrowUpRight size={18}/> : <AlertCircle size={18}/>}
                </div>
                <div className={style.txnInfo}>
                  <span className={style.txnTitle}>{act.message}</span>
                  <span className={style.txnDate}>{act.date}</span>
                </div>
                {act.amount && (
                  <div className={`${style.txnAmount} ${style.positive}`}>
                    +{formatCurrency(act.amount)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default OwnerDashboard;