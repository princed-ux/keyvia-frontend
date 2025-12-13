import React from "react";
import style from "../styles/Dashboard.module.css";

const Dashboard = () => {
  return (
    <div className={style.dashboardContainer}>
      <h2>🏠 Owner Dashboard</h2>
      <p>Welcome! Here you can manage your listed properties, tenants, and messages.</p>
    </div>
  );
};

export default Dashboard;
