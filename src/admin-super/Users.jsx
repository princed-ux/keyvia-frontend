import React from "react";

const SuperAdminUsers = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h2>User Management</h2>
      <p>Manage all registered users (Agents, Owners, Buyers, Developers).</p>
      
      <table style={{ width: "100%", marginTop: "20px", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: "10px" }}>Name</th>
            <th style={{ padding: "10px" }}>Role</th>
            <th style={{ padding: "10px" }}>Status</th>
            <th style={{ padding: "10px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: "10px" }}>John Doe</td>
            <td style={{ padding: "10px" }}>Agent</td>
            <td style={{ padding: "10px", color: "green" }}>Active</td>
            <td style={{ padding: "10px" }}><button>Ban</button></td>
          </tr>
          {/* We will map real users here later */}
        </tbody>
      </table>
    </div>
  );
};

export default SuperAdminUsers;