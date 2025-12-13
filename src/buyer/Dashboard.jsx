import React from "react";
import style from "../styles/Dashboard.module.css";

const Dashboard = () => {
  return (
    <div className={style.dashboardContainer}>
      <h2>👤 Buyer Dashboard</h2>
      <p>Welcome! View saved listings, manage your applications, and messages.</p>
    </div>
  );
};

export default Dashboard;
