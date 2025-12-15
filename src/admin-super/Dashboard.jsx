import React from "react";

const SuperAdminDashboard = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Super Admin Dashboard</h1>
      <p>Welcome, CEO. Here is your overview.</p>
      
      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        <div style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "8px", width: "200px" }}>
          <h3>Total Users</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold" }}>1,245</p>
        </div>
        <div style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "8px", width: "200px" }}>
          <h3>Total Revenue</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold" }}>$54,000</p>
        </div>
        <div style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "8px", width: "200px" }}>
          <h3>Active Properties</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold" }}>320</p>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;