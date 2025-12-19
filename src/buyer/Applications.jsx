import React from "react";
import { FileText, CheckCircle2, XCircle, Clock } from "lucide-react";
import style from "../styles/BuyerDashboard.module.css";

const BuyerApplications = () => {
  const applications = [
    {
      id: "APP-101",
      property: "Luxury Condo in Midtown",
      address: "123 Peachtree St",
      status: "Pending",
      date: "Dec 20, 2025",
      agent: "Sarah Connors"
    },
    {
      id: "APP-102",
      property: "Modern Townhouse",
      address: "88 Midtown Ave",
      status: "Approved",
      date: "Dec 18, 2025",
      agent: "Mike Ross"
    }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved": return <span className={`${style.statusBadge} ${style.success}`}><CheckCircle2 size={12}/> Approved</span>;
      case "Rejected": return <span className={`${style.statusBadge} ${style.danger}`}><XCircle size={12}/> Rejected</span>;
      default: return <span className={`${style.statusBadge} ${style.warning}`}><Clock size={12}/> Pending</span>;
    }
  };

  return (
    <div className={style.pageWrapper}>
      <header className={style.header}>
        <div>
          <h1>My Applications</h1>
          <p>Track the status of your rental or purchase applications.</p>
        </div>
      </header>

      <div className={style.applicationList}>
        {applications.map((app) => (
          <div key={app.id} className={style.appCard}>
            <div className={style.appIcon}><FileText size={24} /></div>
            <div className={style.appInfo}>
              <h4>{app.property}</h4>
              <p>{app.address}</p>
              <span className={style.appMeta}>Applied on {app.date} • Agent: {app.agent}</span>
            </div>
            <div className={style.appStatus}>
              {getStatusBadge(app.status)}
              <button className={style.outlineBtn}>View Details</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BuyerApplications;