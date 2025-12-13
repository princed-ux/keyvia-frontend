import React, { useState } from "react";
import style from "../styles/LanguageRegionSettings.module.css";

const LanguageRegionSettings = () => {
  const [settings, setSettings] = useState({
    language: "en",
    region: "NG",
    currency: "NGN",
    timezone: "Africa/Lagos",
  });

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = (e) => {
    e.preventDefault();
    // 🟦 Replace this with your API call to save preferences
    alert("Language and region settings updated successfully!");
  };

  return (
    <div className={style.container}>
      <h2 className={style.heading}>Language & Region</h2>
      <p className={style.subtext}>
        Customize your language, currency, and regional preferences.
      </p>

      <form onSubmit={handleSave} className={style.form}>
        {/* Language */}
        <div className={style.formGroup}>
          <label className={style.label}>Language</label>
          <select
            name="language"
            value={settings.language}
            onChange={handleChange}
            className={style.select}
          >
            <option value="en">English</option>
            <option value="fr">French</option>
            <option value="es">Spanish</option>
            <option value="de">German</option>
            <option value="zh">Chinese (Simplified)</option>
          </select>
        </div>

        {/* Region */}
        <div className={style.formGroup}>
          <label className={style.label}>Region</label>
          <select
            name="region"
            value={settings.region}
            onChange={handleChange}
            className={style.select}
          >
            <option value="NG">Nigeria</option>
            <option value="US">United States</option>
            <option value="GB">United Kingdom</option>
            <option value="CA">Canada</option>
            <option value="KE">Kenya</option>
            <option value="ZA">South Africa</option>
          </select>
        </div>

        {/* Currency */}
        <div className={style.formGroup}>
          <label className={style.label}>Preferred Currency</label>
          <select
            name="currency"
            value={settings.currency}
            onChange={handleChange}
            className={style.select}
          >
            <option value="NGN">NGN — Nigerian Naira</option>
            <option value="USD">USD — US Dollar</option>
            <option value="GBP">GBP — British Pound</option>
            <option value="EUR">EUR — Euro</option>
            <option value="KES">KES — Kenyan Shilling</option>
            <option value="ZAR">ZAR — South African Rand</option>
          </select>
        </div>

        {/* Timezone */}
        <div className={style.formGroup}>
          <label className={style.label}>Time Zone</label>
          <select
            name="timezone"
            value={settings.timezone}
            onChange={handleChange}
            className={style.select}
          >
            <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
            <option value="Africa/Nairobi">Africa/Nairobi (GMT+3)</option>
            <option value="Europe/London">Europe/London (GMT+0)</option>
            <option value="America/New_York">America/New_York (GMT-5)</option>
            <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
          </select>
        </div>

        <button type="submit" className={style.saveBtn}>
          Save Preferences
        </button>
      </form>
    </div>
  );
};

export default LanguageRegionSettings;
