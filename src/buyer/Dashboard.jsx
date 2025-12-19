import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Heart, Calendar, MessageSquare, MapPin, 
  ArrowRight, Clock, Home, Search 
} from "lucide-react";
import { useAuth } from "../context/AuthProvider";
import style from "../styles/BuyerDashboard.module.css";

const BuyerDashboard = () => {
  const { user } = useAuth();
  
  // Mock Data (Replace with API calls later)
  const stats = [
    { label: "Saved Homes", value: 12, icon: Heart, color: "#e11d48" },
    { label: "Tour Requests", value: 3, icon: Calendar, color: "#007983" },
    { label: "Unread Messages", value: 5, icon: MessageSquare, color: "#f59e0b" },
  ];

  const savedHomes = [
    {
      id: "PRD-001",
      image: "/placeholder.png",
      price: "$450,000",
      address: "123 Peachtree St, Atlanta, GA",
      beds: 3,
      baths: 2,
      status: "Active"
    },
    {
      id: "PRD-002",
      image: "/placeholder.png",
      price: "$320,000",
      address: "45 Westside Blvd, Atlanta, GA",
      beds: 2,
      baths: 2,
      status: "Pending"
    }
  ];

  const upcomingTours = [
    { id: 1, address: "123 Peachtree St", date: "Mon, Dec 23", time: "10:00 AM", agent: "Sarah Connors" },
    { id: 2, address: "88 Midtown Ave", date: "Tue, Dec 24", time: "2:00 PM", agent: "Mike Ross" },
  ];

  return (
    <div className={style.pageWrapper}>
      
      {/* --- HEADER --- */}
      <header className={style.header}>
        <div>
          <h1>Hello, {user?.name?.split(" ")[0] || "Buyer"}! 👋</h1>
          <p>Here is what's happening with your home search.</p>
        </div>
        <Link to="/buy" className={style.browseBtn}>
          <Search size={18} /> Browse Homes
        </Link>
      </header>

      {/* --- STATS GRID --- */}
      <div className={style.statsGrid}>
        {stats.map((stat, index) => (
          <div key={index} className={style.statCard}>
            <div className={style.iconBox} style={{ color: stat.color, background: `${stat.color}15` }}>
              <stat.icon size={24} />
            </div>
            <div>
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={style.contentGrid}>
        
        {/* --- LEFT: SAVED HOMES --- */}
        <div className={style.mainSection}>
          <div className={style.sectionHeader}>
            <h3><Heart size={18} className={style.redIcon} /> Saved Homes</h3>
            <Link to="/saved" className={style.viewAll}>View All</Link>
          </div>

          <div className={style.homesGrid}>
            {savedHomes.map((home) => (
              <Link to={`/listing/${home.id}`} key={home.id} className={style.homeCard}>
                <div className={style.imageWrapper}>
                  <img src={home.image} alt="Home" />
                  <span className={`${style.badge} ${home.status === 'Active' ? style.active : style.pending}`}>
                    {home.status}
                  </span>
                </div>
                <div className={style.cardDetails}>
                  <div className={style.price}>{home.price}</div>
                  <div className={style.address}>{home.address}</div>
                  <div className={style.meta}>
                    <span>{home.beds} bds</span> • <span>{home.baths} ba</span>
                  </div>
                </div>
              </Link>
            ))}
            
            {/* Add New Placeholders if empty */}
            {savedHomes.length === 0 && (
              <div className={style.emptyState}>
                <Home size={40} />
                <p>You haven't saved any homes yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* --- RIGHT: UPCOMING TOURS & ACTIVITY --- */}
        <div className={style.sidebar}>
          
          {/* TOURS WIDGET */}
          <div className={style.widgetCard}>
            <h3><Calendar size={18} /> Upcoming Tours</h3>
            <div className={style.tourList}>
              {upcomingTours.length > 0 ? (
                upcomingTours.map((tour) => (
                  <div key={tour.id} className={style.tourItem}>
                    <div className={style.dateBox}>
                      <strong>{tour.date.split(" ")[1]}</strong>
                      <span>{tour.date.split(" ")[2]}</span>
                    </div>
                    <div className={style.tourInfo}>
                      <h4>{tour.address}</h4>
                      <p><Clock size={12} /> {tour.time} • w/ {tour.agent}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className={style.emptyText}>No upcoming tours scheduled.</p>
              )}
            </div>
            <button className={style.outlineBtn}>Manage Schedule</button>
          </div>

          {/* MESSAGES PREVIEW */}
          <div className={style.widgetCard}>
            <h3><MessageSquare size={18} /> Recent Messages</h3>
            <div className={style.messagePreview}>
              <div className={style.messageItem}>
                <div className={style.avatar}>SC</div>
                <div>
                  <h4>Sarah Connors</h4>
                  <p>Is 10 AM still good for you?</p>
                </div>
              </div>
              <div className={style.messageItem}>
                <div className={style.avatar}>MR</div>
                <div>
                  <h4>Mike Ross</h4>
                  <p>The owner accepted the offer!</p>
                </div>
              </div>
            </div>
            <Link to="/messages" className={style.linkBtn}>
              Go to Inbox <ArrowRight size={16} />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;