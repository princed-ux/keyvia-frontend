import React from "react";
import style from "../styles/Dashboard.module.css";

const Dashboard = () => {
  return (
    <div className={style.dashboardContainer}>
      <h2>🧭 Admin Dashboard</h2>
      <p>Welcome back, Admin. Manage users, listings, and oversee system performance.</p>
    </div>
  );
};

export default Dashboard;
