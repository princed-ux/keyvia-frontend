import React from "react";
import style from "../styles/Dashboard.module.css";

const Listings = () => {
  return (
    <div className={style.dashboardContainer}>
      <h2>📋 Your Property Listings</h2>
      <p>View, edit, or remove your current properties here.</p>
    </div>
  );
};

export default Listings;
