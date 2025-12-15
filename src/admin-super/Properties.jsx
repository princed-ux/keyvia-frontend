import React from "react";

const SuperAdminProperties = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h2>All Properties</h2>
      <p>Review and manage all listings on the platform.</p>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px", marginTop: "20px" }}>
        <div style={{ border: "1px solid #ddd", padding: "10px", borderRadius: "8px" }}>
          <h4>Luxury Villa in Lagos</h4>
          <p>Status: Pending Review</p>
          <button>Approve</button> <button>Reject</button>
        </div>
        {/* Real properties will go here */}
      </div>
    </div>
  );
};

export default SuperAdminProperties;