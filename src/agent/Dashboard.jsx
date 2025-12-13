// src/pages/dashboard/AgentDashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import ApexCharts from "react-apexcharts";
import axios from "axios";
import style from "../styles/AgentDashboard.module.css";
import { useAuth } from "../context/AuthProvider.jsx";

const Dashboard = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch stats and chart data together
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, chartRes] = await Promise.all([
          axios.get("/api/agent/stats"),
          axios.get("/api/agent/chart"),
        ]);

        setStats(statsRes.data);
        setChartData(chartRes.data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const chartSeries = useMemo(() => {
    return [
      {
        name: "Listings Views",
        data: chartData?.data || [0, 0, 0, 0, 0, 0, 0], // safe fallback
      },
    ];
  }, [chartData]);

  const chartOptions = useMemo(() => {
    return {
      chart: { type: "area", height: 300, toolbar: { show: false }, foreColor: "#adb5bd" },
      stroke: { curve: "smooth", width: 3 },
      colors: ["#4f46e5"],
      grid: { borderColor: "#e5e7eb" },
      dataLabels: { enabled: false },
      xaxis: {
        categories: chartData?.labels || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        labels: { style: { colors: "#6b7280" } },
      },
      yaxis: { labels: { style: { colors: "#6b7280" } } },
      tooltip: { theme: "dark" },
      fill: {
        type: "gradient",
        gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1, stops: [0, 90, 100] },
      },
    };
  }, [chartData]);

  const formatMoney = (num) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num);

  if (loading)
    return (
      <div className={style.dashboardContainer}>
        <p>Loading dashboard...</p>
      </div>
    );

  return (
    <div className={style.dashboardContainer}>
      {/* Welcome Header */}
      <div className={style.header}>
        <h2>
          Welcome back, <span>{user?.name || "Agent"}</span> 👋
        </h2>
        <p>Your weekly summary overview.</p>
      </div>

      {/* Summary Cards */}
      <div className={style.cards}>
        <div className={style.card}>
          <i className="fas fa-building"></i>
          <div>
            <h4>{stats.listings}</h4>
            <p>Total Listings</p>
          </div>
        </div>

        <div className={style.card}>
          <i className="fas fa-check-circle"></i>
          <div>
            <h4>{stats.activeListings}</h4>
            <p>Active Listings</p>
          </div>
        </div>

        <div className={style.card}>
          <i className="fas fa-envelope"></i>
          <div>
            <h4>{stats.messages}</h4>
            <p>Messages</p>
          </div>
        </div>

        <div className={style.card}>
          <i className="fas fa-dollar-sign"></i>
          <div>
            <h4>{formatMoney(stats.earnings)}</h4>
            <p>Total Earnings</p>
          </div>
        </div>
      </div>

      {/* Apex Chart */}
      <div className={style.chartSection} style={{ touchAction: "pan-y" }}>
        <h3>Weekly Views Overview</h3>
        <ApexCharts options={chartOptions} series={chartSeries} type="area" height={300} />
      </div>

      {/* Recent Activity */}
      <div className={style.activitySection}>
        <h3>Recent Activity</h3>
        <ul>
          <li>🏠 Listing “Palm View Estate” got 45 new views</li>
          <li>💬 You received 3 new messages from buyers</li>
          <li>💼 You updated “Ocean Breeze Apartment” listing</li>
          <li>📈 2 new offers received this week</li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
