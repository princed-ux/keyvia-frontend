import React from "react";
import style from "../styles/Dashboard.module.css";

const Users = () => {
  return (
    <div className={style.dashboardContainer}>
      <h2>👥 Manage Users</h2>
      <p>View and manage all user accounts — owners, agents, buyers, and developers.</p>
    </div>
  );
};

export default Users;
