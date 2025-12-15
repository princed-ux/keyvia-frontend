import React from "react";

const SuperAdminSettings = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h2>Platform Settings</h2>
      <form style={{ maxWidth: "400px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <label>
          Site Name:
          <input type="text" defaultValue="KeyVia Real Estate" style={{ width: "100%", padding: "8px" }} />
        </label>
        <label>
          Maintenance Mode:
          <input type="checkbox" /> Enable
        </label>
        <button type="button" style={{ padding: "10px", background: "#333", color: "white", border: "none" }}>Save Changes</button>
      </form>
    </div>
  );
};

export default SuperAdminSettings;