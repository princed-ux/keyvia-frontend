import React from "react";
import style from "../styles/Dashboard.module.css";

const Messages = () => {
  return (
    <div className={style.dashboardContainer}>
      <h2>💬 Admin Messages</h2>
      <p>Monitor communication or respond to inquiries.</p>
    </div>
  );
};

export default Messages;
