import React, { useRef, useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Camera,
  UserCheck,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import Swal from "sweetalert2";
import style from "../styles/AdminSideNav.module.css"; // ✅ Uses new Admin CSS
import { useAuth } from "../context/AuthProvider.jsx";
import defaultAvatar from "../assets/person.png";

// ---------------- IMAGE VALIDATION ----------------
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_EXT = ["png", "jpg", "jpeg", "webp"];

function isValidImage(file) {
  if (!file) return { ok: false, reason: "No file selected" };
  if (!file.type?.startsWith("image/")) return { ok: false, reason: "Not an image" };
  if (file.size > MAX_BYTES) return { ok: false, reason: "File too large (max 2MB)" };
  return { ok: true };
}

// ---------------- COMPONENT ----------------
const AdminSideNav = () => {
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [avatarSrc, setAvatarSrc] = useState(user?.profileImage || defaultAvatar);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSpecialId, setShowSpecialId] = useState(false);

  // ---------------- EVENTS ----------------
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
    // TODO: Add API call to upload admin avatar here
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const copySpecialId = async () => {
    await navigator.clipboard.writeText(user?.unique_id || "");
    Swal.fire({
      icon: "success",
      title: "Copied!",
      timer: 1000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  };

  return (
    <div className={style.allcontainer}>
      
      {/* --- SIDEBAR --- */}
      <aside className={style.side}>
        <div className={style.logo}>
          <div className={style.avatarWrap}>
            <img
              src={avatarSrc}
              alt="Admin"
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
            <h4>{user?.name || "System Admin"}</h4>
            <p className={style.agentTitle}>Admin Console</p>
          </div>
        </div>

        <nav className={style.nav}>
          <NavLink to="/admin/dashboard" end className={({ isActive }) => isActive ? `${style.link} ${style.active}` : style.link}>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>

          <NavLink to="/admin/profile-reviews" className={({ isActive }) => isActive ? `${style.link} ${style.active}` : style.link}>
            <UserCheck size={20} /> Agent Verification
          </NavLink>

          <NavLink to="/admin/property-reviews" className={({ isActive }) => isActive ? `${style.link} ${style.active}` : style.link}>
            <Building2 size={20} /> Property Listings
          </NavLink>

          <NavLink to="/admin/messages" className={({ isActive }) => isActive ? `${style.link} ${style.active}` : style.link}>
            <MessageSquare size={20} /> Support Tickets
          </NavLink>

          <NavLink to="/admin/notifications" className={({ isActive }) => isActive ? `${style.link} ${style.active}` : style.link}>
            <Bell size={20} /> System Alerts
          </NavLink>

          <div style={{flex:1}}></div> {/* Spacer */}

          <NavLink to="/admin/settings" className={({ isActive }) => isActive ? `${style.link} ${style.active}` : style.link}>
            <Settings size={20} /> Platform Settings
          </NavLink>
        </nav>

        <div className={style.footer}>
          <button onClick={() => setShowLogoutModal(true)} className={style.logout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className={style.mainContainer}>
        
        {/* Top Navbar */}
        <div className={style.topnav}>
          <h2 className={style.topTitle}>Admin Portal</h2>

          <div className={style.userSection} ref={dropdownRef}>
            <div className={style.userEmail} onClick={() => setShowDropdown(!showDropdown)}>
              {user?.email}
              {showDropdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className={style.dropdown}>
                <div className={style.dropdownItem}>
                  <strong>Access Level:</strong>
                  <span className={style.roleValue}>{user?.role?.toUpperCase()}</span>
                </div>
                <div className={style.dropdownItem}>
                  <strong>Admin ID:</strong>
                  <div className={style.uniqueBox}>
                    <span className={style.uniqueValue}>
                      {showSpecialId ? user?.unique_id : "••••••••••••"}
                    </span>
                    <button onClick={() => setShowSpecialId(!showSpecialId)} className={style.eyeBtn}>
                       {/* Icon logic handled by CSS classes usually, simplified here */}
                       {showSpecialId ? "Hide" : "Show"}
                    </button>
                    <button onClick={copySpecialId} className={style.copyBtn}>Copy</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Page Content */}
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
            <h3>End Session?</h3>
            <p>You will be returned to the login screen.</p>
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

export default AdminSideNav;