import React, { useState } from "react";
import style from "../styles/Dashboard.module.css";
// If you don't have react-icons, run: npm install react-icons
import { FaBuilding, FaHardHat, FaMoneyBillWave, FaChartLine, FaPlus } from "react-icons/fa";

const Dashboard = () => {
  // Mock Data: In the future, this comes from your Node.js backend
  const [stats] = useState([
    { id: 1, title: "Active Projects", value: "4", icon: <FaHardHat />, color: "#2563eb" },
    { id: 2, title: "Total Units", value: "128", icon: <FaBuilding />, color: "#f59e0b" },
    { id: 3, title: "Units Sold", value: "45", icon: <FaChartLine />, color: "#10b981" },
    { id: 4, title: "Revenue (YTD)", value: "$2.4M", icon: <FaMoneyBillWave />, color: "#6366f1" },
  ]);

  const [projects] = useState([
    { id: 1, name: "Skyline Heights", location: "Lagos, VI", status: "Construction", progress: 65, unitsLeft: 12 },
    { id: 2, name: "Greenwood Estate", location: "Abuja", status: "Planning", progress: 15, unitsLeft: 40 },
    { id: 3, name: "Oceanview Terraces", location: "Lekki Phase 1", status: "Completed", progress: 100, unitsLeft: 2 },
  ]);

  return (
    <div className={style.dashboardContainer}>
      {/* Header Section */}
      <header className={style.header}>
        <div>
          <h2>🏗️ Developer Dashboard</h2>
          <p>Overview of your construction projects and sales performance.</p>
        </div>
        <button className={style.createBtn}>
          <FaPlus /> New Project
        </button>
      </header>

      {/* Stats Grid */}
      <div className={style.statsGrid}>
        {stats.map((stat) => (
          <div key={stat.id} className={style.statCard}>
            <div className={style.iconBox} style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className={style.statInfo}>
              <h3>{stat.value}</h3>
              <p>{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Split */}
      <div className={style.contentSection}>
        {/* Active Projects List */}
        <div className={style.projectsTable}>
          <div className={style.sectionTitle}>
            <h3>Ongoing Projects</h3>
            <span className={style.link}>View All</span>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Inventory</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td>
                    <div className={style.projectName}>{project.name}</div>
                    <small>{project.location}</small>
                  </td>
                  <td>
                    <span className={`${style.badge} ${style[project.status.toLowerCase()]}`}>
                      {project.status}
                    </span>
                  </td>
                  <td>
                    <div className={style.progressBarContainer}>
                      <div 
                        className={style.progressBar} 
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                    <small>{project.progress}%</small>
                  </td>
                  <td>{project.unitsLeft} units left</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Activity / Notifications Panel */}
        <div className={style.activityPanel}>
          <h3>Recent Activity</h3>
          <ul className={style.activityList}>
            <li>
              <strong>Skyline Heights:</strong> Cement supply delivered.
              <br /><small>2 hours ago</small>
            </li>
            <li>
              <strong>Sales Team:</strong> Sold Unit 4B at Oceanview.
              <br /><small>5 hours ago</small>
            </li>
            <li>
              <strong>Permits:</strong> Approval pending for Greenwood.
              <br /><small>1 day ago</small>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;