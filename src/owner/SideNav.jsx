// src/components/OwnerSideNav.jsx
import React, { useRef, useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import style from "../styles/SideNav.module.css"; // Reuse existing CSS
import defaultImg from "../assets/person.png";
import { useAuth } from "../context/AuthProvider.jsx";
import Swal from "sweetalert2";

// =======================
// OWNER SIDENAV COMPONENT
// =======================
const OwnerSideNav = () => {
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const location = useLocation();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSpecialId, setShowSpecialId] = useState(false);

  // ==========================
  // CLOSE DROPDOWN BEHAVIOR
  // ==========================
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    const handleEsc = (event) => {
      if (event.key === "Escape") setShowDropdown(false);
    };
    const handleScroll = () => setShowDropdown(false);

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  // ==========================
  // LOGOUT HANDLER
  // ==========================
  const confirmLogout = async () => {
    try {
      await logout();
      setShowLogoutModal(false);
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
      Swal.fire({
        icon: "error",
        title: "Logout Failed",
        text: "Please try again.",
      });
    }
  };

  // ==========================
  // COPY SPECIAL ID
  // ==========================
  const copySpecialId = async () => {
    try {
      await navigator.clipboard.writeText(user?.special_id || "");
      Swal.fire({
        icon: "success",
        title: "Copied!",
        text: "Special ID copied to clipboard.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // ==========================
  // DYNAMIC TITLES MAP
  // ==========================
  const pathTitles = {
    "/owner/dashboard": "Dashboard",
    "/owner/profile": "My Profile",
    "/owner/properties": "My Properties",
    "/owner/add-property": "Add Property",
    "/owner/payments": "Payments & Finance",
    "/owner/messages": "Messages",
    "/owner/applications": "Applications",
    "/owner/notifications": "Notifications",
    "/owner/settings": "Settings",
  };

  // Determine current title (fallback to Dashboard)
  const currentTitle = pathTitles[location.pathname] || "Owner Dashboard";

  // ==========================
  // SIDEBAR NAVIGATION LINKS
  // ==========================
  const navLinks = [
    { to: "/owner/dashboard", icon: "fas fa-chart-pie", label: "Dashboard", end: true },
    { to: "/owner/profile", icon: "fas fa-user-circle", label: "My Profile" },
    { to: "/owner/properties", icon: "fas fa-building", label: "My Properties" },
    { to: "/owner/add-property", icon: "fas fa-plus-circle", label: "Add Property" },
    { to: "/owner/payments", icon: "fas fa-wallet", label: "Payments" }, // ✅ Added
    { to: "/owner/messages", icon: "fas fa-comment-alt", label: "Messages" },
    { to: "/owner/applications", icon: "fas fa-file-contract", label: "Applications" }, // ✅ Added
    { to: "/owner/notifications", icon: "fas fa-bell", label: "Notifications" }, // ✅ Added
    { to: "/owner/settings", icon: "fas fa-cog", label: "Settings" },
  ];

  // ==========================
  // JSX RETURN
  // ==========================
  return (
    <div className={style.allcontainer}>
      {/* Sidebar */}
      <div className={style.side}>
        <div className={style.logo}>
          {/* Avatar */}
          <div className={style.avatarWrap}>
            <img
              src={user?.avatar_url || defaultImg}
              alt="Owner avatar"
              className={style.avatar}
              onError={(e) => (e.currentTarget.src = defaultImg)}
            />
          </div>

          {/* User Info */}
          <div className={style.agentInfo}>
            <h4 className={style.agentName}>{user?.name || "Landlord Name"}</h4>
            <p className={style.agentTitle}>Property Owner</p>
          </div>
        </div>

        {/* Navigation Links */}
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

        {/* Footer */}
        <div className={style.footer}>
          <button
            className={style.logout}
            onClick={() => setShowLogoutModal(true)}
          >
            <i className="fas fa-sign-out-alt" /> <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={style.mainContainer}>
        {/* Top Navigation Bar */}
        <div className={style.topnav}>
          <div className={style.topTitle}>{currentTitle}</div>

          {/* Email + Dropdown */}
          <div className={style.userSection} ref={dropdownRef}>
            <div
              className={style.userEmail}
              onClick={() => setShowDropdown(!showDropdown)}
              role="button"
              tabIndex={0}
            >
              {user?.email || "owner@example.com"}
              <i
                className={`fas fa-chevron-${showDropdown ? "up" : "down"} ml-2`}
              />
            </div>

            {showDropdown && (
              <div className={style.dropdown}>
                <div className={style.dropdownItem}>
                  <strong>Role:</strong>
                  <span className={style.roleValue}>
                    {user?.role || "Owner"}
                  </span>
                </div>

                <div className={style.dropdownItem}>
                  <strong>Special ID:</strong>
                  <div className={style.uniqueBox}>
                    <span className={style.uniqueValue}>
                      {showSpecialId
                        ? user?.special_id || "N/A"
                        : "•".repeat((user?.special_id || "").length || 8)}
                    </span>
                    <button
                      onClick={() => setShowSpecialId(!showSpecialId)}
                      className={style.eyeBtn}
                      title={showSpecialId ? "Hide Special ID" : "Show Special ID"}
                    >
                      <i
                        className={`fas ${showSpecialId ? "fa-eye" : "fa-eye-slash"}`}
                      />
                    </button>
                    <button
                      onClick={copySpecialId}
                      className={style.copyBtn}
                      title="Copy Special ID"
                    >
                      <i className="fas fa-copy" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Page Content Outlet */}
        <div className={style.main}>
          <div className={style.pageWrapper}>
            <Outlet />
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className={style.modalOverlay}>
          <div className={style.modal}>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out?</p>
            <div className={style.modalButtons}>
              <button
                onClick={() => setShowLogoutModal(false)}
                className={style.cancelBtn}
              >
                Cancel
              </button>
              <button onClick={confirmLogout} className={style.confirmBtn}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerSideNav;