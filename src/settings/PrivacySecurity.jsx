import React, { useState } from "react";
import style from "../styles/PrivacySecurity.module.css";

const PrivacySettings = () => {
  const [visibility, setVisibility] = useState(true);
  const [discoverable, setDiscoverable] = useState(true);
  const [dataSharing, setDataSharing] = useState("minimal");

  const handleDeleteAccount = () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete your account? This action cannot be undone."
    );
    if (confirmDelete) {
      // 🟦 Replace this with your delete account API logic
      alert("Your account has been deleted.");
    }
  };

  return (
    <div className={style.container}>
      <h2 className={style.heading}>Privacy & Security</h2>
      <p className={style.subtext}>
        Control how your information is shown and shared across the platform.
      </p>

      {/* Profile Visibility */}
      <div className={style.section}>
        <h3 className={style.sectionTitle}>Profile Visibility</h3>
        <p className={style.desc}>
          Toggle whether your profile is visible to other users on the platform.
        </p>
        <div className={style.toggleRow}>
          <span>Show my profile to others</span>
          <label className={style.switch}>
            <input
              type="checkbox"
              checked={visibility}
              onChange={() => setVisibility(!visibility)}
            />
            <span className={style.slider}></span>
          </label>
        </div>
      </div>

      {/* Search Discoverability */}
      <div className={style.section}>
        <h3 className={style.sectionTitle}>Search Discoverability</h3>
        <p className={style.desc}>
          Allow your profile to appear in search results and agent directories.
        </p>
        <div className={style.toggleRow}>
          <span>Appear in search results</span>
          <label className={style.switch}>
            <input
              type="checkbox"
              checked={discoverable}
              onChange={() => setDiscoverable(!discoverable)}
            />
            <span className={style.slider}></span>
          </label>
        </div>
      </div>

      {/* Data Sharing Preferences */}
      <div className={style.section}>
        <h3 className={style.sectionTitle}>Data Sharing</h3>
        <p className={style.desc}>
          Choose how your data is shared with partners and third-party tools.
        </p>
        <div className={style.radioGroup}>
          <label className={style.radioLabel}>
            <input
              type="radio"
              name="dataSharing"
              value="minimal"
              checked={dataSharing === "minimal"}
              onChange={(e) => setDataSharing(e.target.value)}
            />
            Minimal — Only required data
          </label>

          <label className={style.radioLabel}>
            <input
              type="radio"
              name="dataSharing"
              value="standard"
              checked={dataSharing === "standard"}
              onChange={(e) => setDataSharing(e.target.value)}
            />
            Standard — Improve your experience
          </label>

          <label className={style.radioLabel}>
            <input
              type="radio"
              name="dataSharing"
              value="full"
              checked={dataSharing === "full"}
              onChange={(e) => setDataSharing(e.target.value)}
            />
            Full — Personalized content & ads
          </label>
        </div>
      </div>

      {/* Delete Account */}
      <div className={style.sectionDanger}>
        <h3 className={style.sectionTitle}>Delete Account</h3>
        <p className={style.desc}>
          Once you delete your account, all your data and listings will be
          permanently removed.
        </p>
        <button className={style.deleteBtn} onClick={handleDeleteAccount}>
          Delete Account
        </button>
      </div>
    </div>
  );
};

export default PrivacySettings;
