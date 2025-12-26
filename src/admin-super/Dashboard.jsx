import React, { useEffect, useState } from "react";
import client from "../api/axios"; // Adjust path if needed
import style from "../styles/SuperAdminDashboard.module.css";
import { 
  Users, DollarSign, Building2, Activity, 
  TrendingUp, ArrowUpRight, ShieldCheck, AlertCircle
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'; // npm install recharts

const SuperDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAgents: 0,
    totalRevenue: 0,
    activeListings: 0,
    pendingVerifications: 0,
    revenueSeries: [],
    userDistribution: []
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await client.get("/api/super-admin/stats");
        setStats(res.data.stats);
        setRecentActivity(res.data.activity);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // --- CHART COLORS ---
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className={style.container}>
      
      {/* HEADER */}
      <div className={style.header}>
        <div>
          <h1>Platform Overview</h1>
          <p>Welcome, CEO. Here is the pulse of your business.</p>
        </div>
        <div className={style.dateBadge}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* 1. KEY METRICS GRID */}
      <div className={style.statsGrid}>
        
        {/* REVENUE */}
        <div className={style.statCard}>
          <div className={style.statHeader}>
            <div className={`${style.iconBox} ${style.greenIcon}`}>
              <DollarSign size={24} />
            </div>
            <span style={{color:'#16a34a', fontSize:'0.8rem', fontWeight:'bold'}}>+12%</span>
          </div>
          <div>
            <div className={style.statValue}>
              ${stats.totalRevenue?.toLocaleString()}
            </div>
            <div className={style.statLabel}>Total Revenue</div>
          </div>
        </div>

        {/* TOTAL USERS */}
        <div className={style.statCard}>
          <div className={style.statHeader}>
            <div className={`${style.iconBox} ${style.blueIcon}`}>
              <Users size={24} />
            </div>
          </div>
          <div>
            <div className={style.statValue}>{stats.totalUsers?.toLocaleString()}</div>
            <div className={style.statLabel}>Total Users</div>
          </div>
        </div>

        {/* ACTIVE LISTINGS */}
        <div className={style.statCard}>
          <div className={style.statHeader}>
            <div className={`${style.iconBox} ${style.purpleIcon}`}>
              <Building2 size={24} />
            </div>
          </div>
          <div>
            <div className={style.statValue}>{stats.activeListings?.toLocaleString()}</div>
            <div className={style.statLabel}>Active Properties</div>
          </div>
        </div>

        {/* PENDING ACTIONS */}
        <div className={style.statCard}>
          <div className={style.statHeader}>
            <div className={`${style.iconBox} ${style.orangeIcon}`}>
              <AlertCircle size={24} />
            </div>
            {stats.pendingVerifications > 0 && <span style={{color:'#ea580c', fontWeight:'bold'}}>Action Needed</span>}
          </div>
          <div>
            <div className={style.statValue}>{stats.pendingVerifications}</div>
            <div className={style.statLabel}>Pending Agent Verifications</div>
          </div>
        </div>
      </div>

      {/* 2. CHARTS SECTION */}
      <div className={style.chartsSection}>
        {/* REVENUE CHART */}
        <div className={style.chartCard}>
          <h3 className={style.cardTitle}>Revenue Trends (Last 6 Months)</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={stats.revenueSeries}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="amount" stroke="#22c55e" fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* USER DISTRIBUTION */}
        <div className={style.chartCard}>
          <h3 className={style.cardTitle}>User Demographics</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={stats.userDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.userDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. RECENT ACTIVITY TABLE */}
      <div className={style.activityCard}>
        <div className={style.tableHeader}>
          <h3 className={style.cardTitle} style={{marginBottom:0}}>Recent System Activity</h3>
          <button style={{border:'none', background:'none', color:'#3b82f6', cursor:'pointer', fontWeight:'600'}}>View All</button>
        </div>
        <table className={style.table}>
          <thead>
            <tr>
              <th>User</th>
              <th>Action</th>
              <th>Amount/Details</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentActivity.length === 0 ? (
                <tr><td colSpan="5" style={{textAlign:'center', padding:30}}>No recent activity found.</td></tr>
            ) : (
                recentActivity.map((act, i) => (
                    <tr key={i}>
                        <td>
                            <div className={style.userCell}>
                                <img src={act.avatar || "/person-placeholder.png"} className={style.tableAvatar} alt="u" />
                                {act.user_name || "Unknown"}
                            </div>
                        </td>
                        <td>{act.action_type}</td>
                        <td style={{fontWeight:'bold'}}>{act.details}</td>
                        <td>{new Date(act.created_at).toLocaleDateString()}</td>
                        <td>
                            <span className={`${style.statusPill} ${act.status === 'success' ? style.pillSuccess : style.pillBlue}`}>
                                {act.status}
                            </span>
                        </td>
                    </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default SuperDashboard;