import React, { useRef, useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,          // General Users
  ShieldAlert,    // Admin Team
  Building2,
  CreditCard,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Camera,
  ChevronDown,
  Globe,          // Platform Health
  Database        // System Data
} from "lucide-react";
import Swal from "sweetalert2";
import style from "../styles/SuperAdminSideNav.module.css"; 
import { useAuth } from "../context/AuthProvider.jsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import defaultAvatar from "../assets/person.png";

// Image Validator
const MAX_BYTES = 2 * 1024 * 1024;
function isValidImage(file) {
  if (!file) return { ok: false, reason: "No file selected" };
  if (!file.type?.startsWith("image/")) return { ok: false, reason: "Not an image" };
  if (file.size > MAX_BYTES) return { ok: false, reason: "File too large (max 2MB)" };
  return { ok: true };
}

const SuperAdminSideNav = () => {
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [avatarSrc, setAvatarSrc] = useState(user?.profileImage || defaultAvatar);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSpecialId, setShowSpecialId] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    const check = isValidImage(file);
    if (!check.ok) {
      Swal.fire({ icon: "error", title: "Invalid Image", text: check.reason });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarSrc(ev.target.result);
    reader.readAsDataURL(file);
    // TODO: Upload API call
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const copySpecialId = async () => {
    await navigator.clipboard.writeText(user?.unique_id || "");
    toast.success("Super Admin ID Copied!");
  };

  // Dynamic Titles
  const pathTitles = {
      "/super-admin/dashboard": "Executive Dashboard",
      "/super-admin/users": "User Database (All Roles)",
      "/super-admin/admins": "Admin Team Management",
      "/super-admin/properties": "Global Property Registry",
      "/super-admin/payments": "Financial Overview",
      "/super-admin/messages": "Escalated Support",
      "/super-admin/settings": "System Configuration"
  };
  const currentTitle = pathTitles[location.pathname] || "Master Control";

  return (
    <div className={style.allcontainer}>
      <ToastContainer position="top-right" autoClose={3000} style={{ zIndex: 999999 }} />
      
      {/* Sidebar */}
      <aside className={style.side}>
        <div className={style.logo}>
          <div className={style.avatarWrap}>
            <img 
                src={avatarSrc} 
                alt="CEO" 
                className={style.avatar} 
                onError={(e) => (e.currentTarget.src = defaultAvatar)} 
            />
            <div className={style.cameraIcon} onClick={() => inputRef.current?.click()}>
                <Camera size={14} />
            </div>
            <input 
                ref={inputRef} 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className={style.fileInput} 
            />
          </div>
          <div className={style.agentInfo}>
            <h4 className={style.agentName}>{user?.name || "CEO"}</h4>
            <p className={style.agentTitle}>MASTER ADMIN</p>
          </div>
        </div>

        <nav className={style.nav}>
          <div className={style.navSectionLabel}>ANALYTICS</div>
          
          <NavLink to="/super-admin/dashboard" end className={({ isActive }) => `${style.link} ${isActive ? style.active : ""}`}>
            <LayoutDashboard size={18} /> <span>Overview</span>
          </NavLink>

          <div className={style.navSectionLabel} style={{marginTop: 15}}>PEOPLE & ROLES</div>

          <NavLink to="/super-admin/users" className={({ isActive }) => `${style.link} ${isActive ? style.active : ""}`}>
            <Users size={18} /> <span>All Users</span>
          </NavLink>

          <NavLink to="/super-admin/admins" className={({ isActive }) => `${style.link} ${isActive ? style.active : ""}`}>
            <ShieldAlert size={18} /> <span>Manage Admins</span>
          </NavLink>

          <div className={style.navSectionLabel} style={{marginTop: 15}}>PLATFORM DATA</div>

          <NavLink to="/super-admin/properties" className={({ isActive }) => `${style.link} ${isActive ? style.active : ""}`}>
            <Building2 size={18} /> <span>Properties</span>
          </NavLink>

          <NavLink to="/super-admin/payments" className={({ isActive }) => `${style.link} ${isActive ? style.active : ""}`}>
            <CreditCard size={18} /> <span>Revenue</span>
          </NavLink>

          <div className={style.navSectionLabel} style={{marginTop: 15}}>SYSTEM</div>

          <NavLink to="/super-admin/messages" className={({ isActive }) => `${style.link} ${isActive ? style.active : ""}`}>
            <MessageSquare size={18} /> <span>Support</span>
          </NavLink>

          <NavLink to="/super-admin/notifications" className={({ isActive }) => `${style.link} ${isActive ? style.active : ""}`}>
            <Bell size={18} /> <span>Broadcasts</span>
          </NavLink>

          <NavLink to="/super-admin/settings" className={({ isActive }) => `${style.link} ${isActive ? style.active : ""}`}>
            <Settings size={18} /> <span>Global Config</span>
          </NavLink>
        </nav>

        <div className={style.footer}>
          <button onClick={() => setShowLogoutModal(true)} className={style.logout}>
            <LogOut size={18} /> <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={style.mainContainer}>
        
        {/* Top Nav */}
        <div className={style.topnav}>
          <div className={style.topTitle}>
             {currentTitle}
             <span className={style.superBadge}>ROOT</span>
          </div>

          <div className={style.userSection} ref={dropdownRef}>
            <div className={style.userEmail} onClick={() => setShowDropdown(!showDropdown)}>
              {user?.email}
              <ChevronDown size={16} />
            </div>

            {showDropdown && (
              <div className={style.dropdown}>
                <div className={style.dropdownItem}>
                  <strong>Role:</strong>
                  <span className={style.roleValue}>SUPER ADMIN</span>
                </div>
                <div className={style.dropdownItem}>
                  <strong>Master ID:</strong>
                  <div className={style.uniqueBox}>
                    <span className={style.uniqueValue}>
                      {showSpecialId ? user?.unique_id : "••••••••••••"}
                    </span>
                    <button onClick={() => setShowSpecialId(!showSpecialId)} className={style.eyeBtn}>
                      <i className={`fas ${showSpecialId ? "fa-eye" : "fa-eye-slash"}`} />
                    </button>
                    <button onClick={copySpecialId} className={style.copyBtn}>
                        <i className="fas fa-copy" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <main className={style.main}>
          <div className={style.pageWrapper}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className={style.modalOverlay}>
          <div className={style.modal}>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to exit the Master Console?</p>
            <div className={style.modalButtons}>
              <button onClick={() => setShowLogoutModal(false)} className={style.cancelBtn}>Cancel</button>
              <button onClick={handleLogout} className={style.confirmBtn} style={{background: '#dc2626'}}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminSideNav;