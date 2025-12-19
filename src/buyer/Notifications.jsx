import React from "react";
import { Bell, Mail, Info } from "lucide-react";
import style from "../styles/BuyerDashboard.module.css";

const BuyerNotifications = () => {
  const notifications = [
    { id: 1, type: "info", text: "Your tour request for 123 Peachtree St was confirmed.", time: "2 hours ago" },
    { id: 2, type: "message", text: "New message from Agent Mike Ross.", time: "1 day ago" },
    { id: 3, type: "alert", text: "Price drop alert! A home in your favorites just dropped by $5k.", time: "2 days ago" },
  ];

  return (
    <div className={style.pageWrapper}>
      <header className={style.header}>
        <div>
          <h1>Notifications</h1>
          <p>Stay updated with alerts and messages.</p>
        </div>
      </header>

      <div className={style.notifList}>
        {notifications.map((n) => (
          <div key={n.id} className={style.notifItem}>
            <div className={style.notifIcon}>
              {n.type === "message" ? <Mail size={18}/> : <Bell size={18}/>}
            </div>
            <div className={style.notifContent}>
              <p>{n.text}</p>
              <span>{n.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BuyerNotifications;