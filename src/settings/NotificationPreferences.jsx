// import React, { useState } from "react";
// import style from "../styles/NotificationPreferences.module.css";

// const NotificationPreferences = () => {
//   const [preferences, setPreferences] = useState({
//     email: true,
//     sms: false,
//     push: true,
//   });

//   const handleToggle = (key) => {
//     setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
//   };

//   const handleSave = (e) => {
//     e.preventDefault();
//     // 🟦 Replace this with an API call to save preferences
//     alert("Notification preferences updated!");
//   };

//   return (
//     <div className={style.container}>
//       <h2 className={style.heading}>Notification Preferences</h2>
//       <p className={style.subtext}>
//         Manage how you want to receive updates, alerts, and messages.
//       </p>

//       <form onSubmit={handleSave} className={style.form}>
//         <div className={style.option}>
//           <div>
//             <h4>Email Notifications</h4>
//             <p>Receive alerts, promotions, and activity updates via email.</p>
//           </div>
//           <label className={style.switch}>
//             <input
//               type="checkbox"
//               checked={preferences.email}
//               onChange={() => handleToggle("email")}
//             />
//             <span className={style.slider}></span>
//           </label>
//         </div>

//         <div className={style.option}>
//           <div>
//             <h4>SMS Notifications</h4>
//             <p>Get important updates and alerts through text messages.</p>
//           </div>
//           <label className={style.switch}>
//             <input
//               type="checkbox"
//               checked={preferences.sms}
//               onChange={() => handleToggle("sms")}
//             />
//             <span className={style.slider}></span>
//           </label>
//         </div>

//         <div className={style.option}>
//           <div>
//             <h4>In-App Notifications</h4>
//             <p>Stay informed through notifications inside your dashboard.</p>
//           </div>
//           <label className={style.switch}>
//             <input
//               type="checkbox"
//               checked={preferences.push}
//               onChange={() => handleToggle("push")}
//             />
//             <span className={style.slider}></span>
//           </label>
//         </div>

//         <button type="submit" className={style.saveBtn}>
//           Save Preferences
//         </button>
//       </form>
//     </div>
//   );
// };

// export default NotificationPreferences;


import React, { useState } from "react";
import style from "../styles/NotificationPreferences.module.css";

const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState({
    email: true,
    sms: false,
    inApp: true,
    propertyUpdates: true,
    accountAlerts: true,
    marketing: false,
  });

  const handleChange = (e) => {
    const { name, checked } = e.target;
    setPreferences({ ...preferences, [name]: checked });
  };

  const handleSave = (e) => {
    e.preventDefault();
    // 🟦 Replace this with your API call
    alert("Notification preferences saved successfully!");
  };

  return (
    <div className={style.container}>
      <h2 className={style.heading}>Notification Preferences</h2>
      <p className={style.subtext}>
        Choose how and when you’d like to receive updates.
      </p>

      <form onSubmit={handleSave} className={style.form}>
        {/* Channels */}
        <div className={style.section}>
          <h3 className={style.sectionTitle}>Notification Channels</h3>

          <div className={style.toggleRow}>
            <label className={style.label}>Email Notifications</label>
            <input
              type="checkbox"
              name="email"
              checked={preferences.email}
              onChange={handleChange}
              className={style.toggle}
            />
          </div>

          <div className={style.toggleRow}>
            <label className={style.label}>SMS Notifications</label>
            <input
              type="checkbox"
              name="sms"
              checked={preferences.sms}
              onChange={handleChange}
              className={style.toggle}
            />
          </div>

          <div className={style.toggleRow}>
            <label className={style.label}>In-App Notifications</label>
            <input
              type="checkbox"
              name="inApp"
              checked={preferences.inApp}
              onChange={handleChange}
              className={style.toggle}
            />
          </div>
        </div>

        {/* Categories */}
        <div className={style.section}>
          <h3 className={style.sectionTitle}>Notification Categories</h3>

          <div className={style.toggleRow}>
            <label className={style.label}>Property Updates</label>
            <input
              type="checkbox"
              name="propertyUpdates"
              checked={preferences.propertyUpdates}
              onChange={handleChange}
              className={style.toggle}
            />
          </div>

          <div className={style.toggleRow}>
            <label className={style.label}>Account Alerts</label>
            <input
              type="checkbox"
              name="accountAlerts"
              checked={preferences.accountAlerts}
              onChange={handleChange}
              className={style.toggle}
            />
          </div>

          <div className={style.toggleRow}>
            <label className={style.label}>Marketing & Offers</label>
            <input
              type="checkbox"
              name="marketing"
              checked={preferences.marketing}
              onChange={handleChange}
              className={style.toggle}
            />
          </div>
        </div>

        <button type="submit" className={style.saveBtn}>
          Save Preferences
        </button>
      </form>
    </div>
  );
};

export default NotificationPreferences;
