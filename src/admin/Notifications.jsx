import React from "react";
import style from "../styles/Dashboard.module.css";

const Notifications = () => {
  return (
    <div className={style.dashboardContainer}>
      <h2>🔔 System Notifications</h2>
      <p>View recent platform alerts and moderation activities.</p>
    </div>
  );
};

export default Notifications;
