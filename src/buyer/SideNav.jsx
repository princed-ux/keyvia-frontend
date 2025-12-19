import React, { useRef, useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import style from "../styles/SideNav.module.css";
import defaultImg from "../assets/person.png";
import { useAuth } from "../context/AuthProvider.jsx";
import Swal from "sweetalert2";

const SideNav = () => {
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Avatar source
  const avatarSrc = user?.avatar_url || user?.profileImage || defaultImg;
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSpecialId, setShowSpecialId] = useState(false);

  // --- 1. NETWORK STATUS CHECKER ---
  useEffect(() => {
    const handleOffline = () => {
      Swal.fire({
        icon: 'warning',
        title: 'No Internet Connection',
        text: 'You are currently offline. Some features may not work.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
        background: '#fff3cd', // Light yellow for warning
        color: '#856404'
      });
    };

    const handleOnline = () => {
      Swal.fire({
        icon: 'success',
        title: 'Back Online',
        text: 'Internet connection restored.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#d4edda', // Light green for success
        color: '#155724'
      });
    };

    // Add listeners
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Initial check on mount
    if (!navigator.onLine) {
      handleOffline();
    }

    // Cleanup
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // --- 2. Close Dropdown on Outside Click ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- 3. Logout Handler ---
  const confirmLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // --- 4. Copy ID Handler ---
  const copyId = () => {
    navigator.clipboard.writeText(user?.special_id || "");
    Swal.fire({ 
      icon: 'success', 
      title: 'Copied!', 
      toast: true, 
      position: 'top-end', 
      showConfirmButton: false, 
      timer: 1500 
    });
  };

  // --- NAVIGATION LINKS ---
  const navLinks = [
    { to: "/buyer/dashboard", icon: "fas fa-home", label: "Dashboard", end: true },
    { to: "profile", icon: "fas fa-user", label: "Profile" },
    { to: "favorites", icon: "fas fa-heart", label: "Saved Homes" },
    { to: "applications", icon: "fas fa-file-contract", label: "Applications" },
    { to: "viewings", icon: "fas fa-calendar-check", label: "Tours & Viewings" },
    { to: "messages", icon: "fas fa-envelope", label: "Messages" },
    { to: "notifications", icon: "fas fa-bell", label: "Notifications" },
    { to: "payments", icon: "fas fa-wallet", label: "Wallet & Pay" },
    { to: "settings/account", icon: "fas fa-cog", label: "Settings" },
  ];

  // --- Dynamic Page Title ---
  const getPageTitle = () => {
    const found = navLinks.find(link => 
      location.pathname.includes(link.to.replace('/buyer/', ''))
    );
    return found ? found.label : "Buyer Dashboard";
  };

  return (
    <div className={style.allcontainer}>
      
      {/* --- SIDEBAR --- */}
      <div className={style.side}>
        
        {/* Profile / Logo Area */}
        <div className={style.logo}>
          <div className={style.avatarWrap} style={{ cursor: 'default' }}>
            <img 
              src={avatarSrc} 
              alt="User" 
              className={style.avatar} 
              onError={(e) => (e.currentTarget.src = defaultImg)}
            />
          </div>

          <div className={style.agentInfo}>
            <h4 className={style.agentName}>{user?.full_name || "Buyer Name"}</h4>
            <p className={style.agentTitle}>{user?.role || "Property Seeker"}</p>
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
          <div className={style.topTitle}>{getPageTitle()}</div>

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
                  <strong>Role:</strong>
                  <span className={style.roleValue}>{user?.role || "Buyer"}</span>
                </div>

                <div className={style.dropdownItem}>
                  <strong>Special ID:</strong>
                  <div className={style.uniqueBox}>
                    <span className={style.uniqueValue}>
                      {showSpecialId ? user?.unique_id : "••••••••"}
                    </span>
                    <button className={style.eyeBtn} onClick={() => setShowSpecialId(!showSpecialId)}>
                      <i className={`fas ${showSpecialId ? "fa-eye" : "fa-eye-slash"}`} />
                    </button>
                    <button className={style.copyBtn} onClick={copyId}>
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