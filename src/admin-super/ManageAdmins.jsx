import React from "react";

const SuperAdminAdmins = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h2>Manage Admins</h2>
      <p>Create or remove standard admins.</p>
      <button style={{ padding: "10px 20px", background: "#09707d", color: "#fff", border: "none", borderRadius: "5px" }}>
        + Add New Admin
      </button>

      <div style={{ marginTop: "20px" }}>
        <p>Current Admins:</p>
        <ul>
          <li>Jane Smith (Moderator) - <button>Remove</button></li>
          <li>Mike Ross (Support) - <button>Remove</button></li>
        </ul>
      </div>
    </div>
  );
};

export default SuperAdminAdmins;