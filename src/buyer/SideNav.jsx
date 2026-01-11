import React, { useRef, useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import style from "../styles/SideNav.module.css";
import defaultImg from "../assets/person.png";
import { useAuth } from "../context/AuthProvider.jsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";

// =======================
// HELPER: AVATAR COLOR
// =======================
const getAvatarColor = (name) => {
  if (!name) return "#09707D";
  const colors = ["#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5", "#2196F3", "#03A9F4", "#00BCD4", "#009688", "#4CAF50", "#8BC34A", "#CDDC39", "#FFC107", "#FF9800", "#FF5722", "#795548", "#607D8B"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const SideNav = () => {
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSpecialId, setShowSpecialId] = useState(false);

  // --- 1. NETWORK STATUS CHECKER ---
  useEffect(() => {
    const handleOffline = () => toast.warn("You are offline. Features may be limited.");
    const handleOnline = () => toast.success("Back Online!");

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // --- 2. CLOSE DROPDOWN ON CLICK OUTSIDE ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- 3. LOGOUT HANDLER ---
  const confirmLogout = async () => {
    try {
      await logout();
      setShowLogoutModal(false);
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // --- 4. COPY ID HANDLER ---
  const copySpecialId = async () => {
    const idToCopy = user?.special_id || "N/A";
    if (idToCopy === "N/A") return toast.error("ID not available");
    
    try {
      await navigator.clipboard.writeText(idToCopy);
      toast.success("ID Copied!");
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  // --- NAVIGATION LINKS ---
  const navLinks = [
    { to: "/buyer/dashboard", icon: "fas fa-home", label: "Dashboard", end: true },
    { to: "profile", icon: "fas fa-user", label: "Profile" },
    { to: "favorites", icon: "fas fa-heart", label: "Saved Homes" },
    { to: "applications", icon: "fas fa-file-contract", label: "Applications" },
    { to: "messages", icon: "fas fa-envelope", label: "Messages" },
    { to: "notifications", icon: "fas fa-bell", label: "Notifications" },
    { to: "payments", icon: "fas fa-wallet", label: "Wallet" },
    { to: "settings/account", icon: "fas fa-cog", label: "Settings" },
  ];

  // Dynamic Title
  const currentTitle = navLinks.find(link => 
    location.pathname.includes(link.to.replace('/buyer/', ''))
  )?.label || "Dashboard";

  return (
    <div className={style.allcontainer}>
      <ToastContainer position="top-right" autoClose={3000} style={{ zIndex: 999999 }} />
      
      {/* --- SIDEBAR --- */}
      <div className={style.side}>
        
        {/* Profile / Logo Area */}
        <div className={style.logo}>
          <div className={style.avatarWrap}>
            {user?.avatar_url ? (
              <img 
                src={user.avatar_url} 
                className={style.avatar} 
                alt="User" 
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            ) : (
              <div 
                className={style.avatar} 
                style={{ 
                  backgroundColor: getAvatarColor(user?.name), 
                  display: "flex", alignItems: "center", justifyContent: "center", 
                  color: "white", fontSize: "22px", fontWeight: "bold", 
                  textTransform: "uppercase", letterSpacing: "1px" 
                }}
              >
                {(() => { 
                  const n = user?.name || "User"; 
                  return n.trim().split(" ").length > 1 
                    ? (n.split(" ")[0][0] + n.split(" ")[n.split(" ").length - 1][0]).toUpperCase() 
                    : n[0].toUpperCase(); 
                })()}
              </div>
            )}
          </div>

          <div className={style.agentInfo}>
            <h4 className={style.agentName}>{user?.name || "Buyer"}</h4>
            <p className={style.agentTitle}>Property Seeker</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className={style.nav}>
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                isActive ? `${style.link} ${style.active}` : style.link
              }
            >
              <i className={link.icon} /> <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer / Logout */}
        <div className={style.footer}>
          <button className={style.logout} onClick={() => setShowLogoutModal(true)}>
            <i className="fas fa-sign-out-alt" /> <span>Logout</span>
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className={style.mainContainer}>
        
        {/* Top Navigation */}
        <div className={style.topnav}>
          <div className={style.topTitle}>{currentTitle}</div>

          <div className={style.userSection} ref={dropdownRef}>
            <div 
              className={style.userEmail} 
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {user?.email || "user@example.com"}
              <i className={`fas fa-chevron-${showDropdown ? "up" : "down"} ml-2`} style={{marginLeft: '8px'}} />
            </div>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className={style.dropdown}>
                <div className={style.dropdownItem}>
                  <strong>Role:</strong> Buyer
                </div>

                <div className={style.dropdownItem}>
                  <strong>Special ID:</strong>
                  <div className={style.uniqueBox}>
                    <span className={style.uniqueValue}>
                      {showSpecialId 
                        ? (user?.special_id || "Processing...") 
                        : "••••••••"}
                    </span> 
                    <button className={style.eyeBtn} onClick={() => setShowSpecialId(!showSpecialId)}>
                      <i className={`fas ${showSpecialId ? "fa-eye" : "fa-eye-slash"}`} />
                    </button> 
                    
                    <button className={style.copyBtn} onClick={copySpecialId}>
                      <i className="fas fa-copy" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className={style.main}>
          <div className={style.pageWrapper}>
            <Outlet />
          </div>
        </div>
      </div>

      {/* --- LOGOUT MODAL --- */}
      {showLogoutModal && (
        <div className={style.modalOverlay}>
          <div className={style.modal}>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out?</p>
            <div className={style.modalButtons}>
              <button 
                className={style.cancelBtn} 
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button className={style.confirmBtn} onClick={confirmLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SideNav;