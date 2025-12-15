import React, { useRef, useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,          // For User Profiles
  ShieldAlert,    // For Manage Admins
  Building2,      // Properties
  CreditCard,     // Payments/Financials
  MessageSquare,
  Bell,           // Notifications
  Settings,
  LogOut,
  Camera,
} from "lucide-react";
import Swal from "sweetalert2";
import style from "../styles/SideNav.module.css";
import { useAuth } from "../context/AuthProvider.jsx";
import defaultAvatar from "../assets/person.png";

// ---------------- IMAGE VALIDATION ----------------
const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_EXT = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"];

function isValidImage(file) {
  if (!file) return { ok: false, reason: "No file selected" };
  if (!file.type?.startsWith("image/")) return { ok: false, reason: "Not an image" };
  const ext = file.name.split(".").pop().toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) return { ok: false, reason: "File type not allowed" };
  if (file.size > MAX_BYTES) return { ok: false, reason: "File too large (max 2MB)" };
  return { ok: true };
}

// ---------------- SUPER ADMIN SIDENAV ----------------
const SuperAdminSideNav = () => {
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [avatarSrc, setAvatarSrc] = useState(user?.profileImage || defaultAvatar);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSpecialId, setShowSpecialId] = useState(false);

  // ---------------- DROPDOWN BEHAVIOR ----------------
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    const handleEsc = (e) => e.key === "Escape" && setShowDropdown(false);
    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  // ---------------- IMAGE UPLOAD ----------------
  const openPicker = () => inputRef.current?.click();

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
  };

  // ---------------- LOGOUT ----------------
  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutModal(false);
      navigate("/");
    } catch (err) {
      Swal.fire({ icon: "error", title: "Logout Failed" });
    }
  };

  // ---------------- COPY ID ----------------
  const copySpecialId = async () => {
    await navigator.clipboard.writeText(user?.special_id || "");
    Swal.fire({ icon: "success", title: "Copied!", timer: 1000, showConfirmButton: false });
  };

  return (
    <div className={style.allcontainer}>
      
      {/* Sidebar Navigation */}
      <aside className={style.side}>
        <div className={style.logo}>
          
          {/* Avatar Section */}
          <div className={style.avatarWrap}>
            <img src={avatarSrc} alt="CEO" className={style.avatar} onError={(e) => (e.currentTarget.src = defaultAvatar)} />
            <div className={style.cameraIcon} onClick={openPicker}><Camera size={16} /></div>
            <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className={style.fileInput} />
          </div>

          {/* User Info */}
          <div className={style.agentInfo}>
            <h4 className={style.agentName}>{user?.name || "Super Admin"}</h4>
            {/* Special Gold Title for You */}
            <p className={style.agentTitle} style={{color: '#d4af37', fontWeight: 'bold'}}>CEO / Super Admin</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className={style.nav}>
          <NavLink to="/super-admin/dashboard" end className={({ isActive }) => `${style.link} ${isActive ? style.active : ""}`}>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>

          <div className={style.divider}>MANAGEMENT</div>

          {/* 1. User Profiles (Manage Users) */}
          <NavLink to="/super-admin/users" className={({ isActive }) => `${style.link} ${isActive ? style.active : ""}`}>
            <Users size={18} /> User Profiles
          </NavLink>

          {/* 2. Manage Other Admins */}
          <NavLink to="/super-admin/admins" className={({ isActive }) => `${style.link} ${isActive ? style.active : ""}`}>
            <ShieldAlert size={18} /> Manage Admins
          </NavLink>

          <div className={style.divider}>OPERATIONS</div>

          {/* 3. Properties */}
          <NavLink to="/super-admin/properties" className={({ isActive }) => `${style.link} ${isActive ? style.active : ""}`}>
            <Building2 size={18} /> All Properties
          </NavLink>

          {/* 4. Payments & Finance */}
          <NavLink to="/super-admin/payments" className={({ isActive }) => `${style.link} ${isActive ? style.active : ""}`}>
            <CreditCard size={18} /> Payments & Finance
          </NavLink>

          <div className={style.divider}>COMMUNICATION</div>

          {/* 5. Messages */}
          <NavLink to="/super-admin/messages" className={({ isActive }) => `${style.link} ${isActive ? style.active : ""}`}>
            <MessageSquare size={18} /> Support Chat
          </NavLink>

          {/* 6. Notifications */}
          <NavLink to="/super-admin/notifications" className={({ isActive }) => `${style.link} ${isActive ? style.active : ""}`}>
            <Bell size={18} /> Notifications
          </NavLink>

          <NavLink to="/super-admin/settings" className={({ isActive }) => `${style.link} ${isActive ? style.active : ""}`}>
            <Settings size={18} /> Settings
          </NavLink>
        </nav>

        <div className={style.footer}>
          <button onClick={() => setShowLogoutModal(true)} className={style.logout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={style.mainContainer}>
        <div className={style.topnav}>
          <h2 className={style.topTitle}>Super Admin Control</h2>

          {/* Top Bar User Section */}
          <div className={style.userSection} ref={dropdownRef}>
            <div className={style.userEmail} onClick={() => setShowDropdown(!showDropdown)}>
              {user?.email || "ceo@keyvia.com"}
              <i className={`fas fa-chevron-${showDropdown ? "up" : "down"} ml-2`} />
            </div>

            {showDropdown && (
              <div className={style.dropdown}>
                <div className={style.dropdownItem}>
                  <strong>Status:</strong>
                  <span className={style.roleValue}><span className={style.ceo} style={{color: '#d4af37'}}>MASTER ADMIN</span></span>
                </div>
                <div className={style.dropdownItem}>
                  <strong>Super ID:</strong>
                  <div className={style.uniqueBox}>
                    <span className={style.uniqueValue}>
                      {showSpecialId ? user?.special_id || "N/A" : "••••••••••"}
                    </span>
                    <button onClick={() => setShowSpecialId(!showSpecialId)} className={style.eyeBtn}>
                      <i className={`fas ${showSpecialId ? "fa-eye" : "fa-eye-slash"}`} />
                    </button>
                    <button onClick={copySpecialId} className={style.copyBtn}><i className="fas fa-copy" /></button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={style.userSection}>
            <div className={style.iconBadge}>
               <Bell size={18} />
               <span className={style.badgeDot}></span>
            </div>
            <Settings size={18} />
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
            <p>Are you sure you want to log out?</p>
            <div className={style.modalButtons}>
              <button onClick={() => setShowLogoutModal(false)} className={style.cancelBtn}>Cancel</button>
              <button onClick={handleLogout} className={style.confirmBtn}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminSideNav;