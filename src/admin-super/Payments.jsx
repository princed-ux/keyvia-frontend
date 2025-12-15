import React from "react";

const SuperAdminPayments = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h2>Payments & Finance</h2>
      <p>Overview of all financial transactions.</p>

      <table style={{ width: "100%", marginTop: "20px", border: "1px solid #ddd" }}>
        <thead>
          <tr style={{ background: "#f4f4f4" }}>
            <th style={{ padding: "10px" }}>Transaction ID</th>
            <th style={{ padding: "10px" }}>Amount</th>
            <th style={{ padding: "10px" }}>User</th>
            <th style={{ padding: "10px" }}>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: "10px" }}>#TXN-12345</td>
            <td style={{ padding: "10px" }}>$500.00</td>
            <td style={{ padding: "10px" }}>Alice Cooper</td>
            <td style={{ padding: "10px" }}>2025-10-23</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default SuperAdminPayments;