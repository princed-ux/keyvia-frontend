import React from "react";
import style from "../styles/Dashboard.module.css";

const Favourites = () => {
  return (
    <div className={style.dashboardContainer}>
      <h2>💖 Favourite Listings</h2>
      <p>View and manage your saved properties here. You can compare, remove, or contact agents directly.</p>
    </div>
  );
};

export default Favourites;
