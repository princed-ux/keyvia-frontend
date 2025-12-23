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
} from "lucide-react"; // Removed 'Users' icon since they can't manage users
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

// ---------------- SIDENAV COMPONENT ----------------
const AdminSideNav = () => {
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

    const handleEsc = (event) => event.key === "Escape" && setShowDropdown(false);
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

  // ---------------- IMAGE UPLOAD ----------------
  const openPicker = () => inputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    const check = isValidImage(file);
    if (!check.ok) {
      Swal.fire({ icon: "error", title: "Invalid Image", text: check.reason });
      e.target.value = "";
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
      Swal.fire({ icon: "error", title: "Logout Failed", text: "Please try again." });
    }
  };

  // ---------------- COPY SPECIAL ID ----------------
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

  return (
    <div className={style.allcontainer}>
      {/* Sidebar */}
      <aside className={style.side}>
        <div className={style.logo}>
          {/* Avatar */}
          <div className={style.avatarWrap}>
            <img
              src={avatarSrc}
              alt="Admin avatar"
              className={style.avatar}
              onError={(e) => (e.currentTarget.src = defaultAvatar)}
            />
            <div className={style.cameraIcon} onClick={openPicker}>
              <Camera size={16} />
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className={style.fileInput}
            />
          </div>

          {/* Admin Info */}
          <div className={style.agentInfo}>
            <h4 className={style.agentName}>{user?.name || "Admin"}</h4>
            <p className={style.agentTitle}>Moderator</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className={style.nav}>
          <NavLink
            to="/admin/dashboard"
            end
            className={({ isActive }) =>
              isActive ? `${style.link} ${style.active}` : style.link
            }
          >
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>

          {/* REMOVED: Manage Users (Only for Super Admin) */}

          <NavLink
            to="/admin/profile"
            className={({ isActive }) =>
              isActive ? `${style.link} ${style.active}` : style.link
            }
          >
            <Building2 size={18} /> Review Profile
          </NavLink>
          <NavLink
            to="/admin/properties"
            className={({ isActive }) =>
              isActive ? `${style.link} ${style.active}` : style.link
            }
          >
            <Building2 size={18} /> Review Properties
          </NavLink>

          <NavLink
            to="/admin/messages"
            className={({ isActive }) =>
              isActive ? `${style.link} ${style.active}` : style.link
            }
          >
            <MessageSquare size={18} /> Support Messages
          </NavLink>

          <NavLink
            to="/admin/notifications"
            className={({ isActive }) =>
              isActive ? `${style.link} ${style.active}` : style.link
            }
          >
            <Bell size={18} /> Notifications
          </NavLink>

          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              isActive ? `${style.link} ${style.active}` : style.link
            }
          >
            <Settings size={18} /> Settings
          </NavLink>
        </nav>

        <div className={style.footer}>
          <button onClick={() => setShowLogoutModal(true)} className={style.logout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={style.mainContainer}>
        <div className={style.topnav}>
          <h2 className={style.topTitle}>Dashboard</h2>

          {/* Email + Dropdown */}
          <div className={style.userSection} ref={dropdownRef}>
            <div
              className={style.userEmail}
              onClick={() => setShowDropdown(!showDropdown)}
              role="button"
              tabIndex={0}
            >
              {user?.email || "admin@keyvia.com"}
              <i
                className={`fas fa-chevron-${showDropdown ? "up" : "down"} ml-2`}
              />
            </div>

            {showDropdown && (
              <div className={style.dropdown}>
                <div className={style.dropdownItem}>
                  <strong>Role:</strong>
                  <span className={style.roleValue}>
                    {/* Dynamic Role instead of Hardcoded CEO */}
                    <span className={style.ceo}>{user?.role?.toUpperCase() || "ADMIN"}</span>
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
                      title={showSpecialId ? "Hide" : "Show"}
                    >
                      <i className={`fas ${showSpecialId ? "fa-eye" : "fa-eye-slash"}`} />
                    </button>
                    <button
                      onClick={copySpecialId}
                      className={style.copyBtn}
                      title="Copy"
                    >
                      <i className="fas fa-copy" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={style.userSection}>
            <Bell size={18} />
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
              <button
                onClick={() => setShowLogoutModal(false)}
                className={style.cancelBtn}
              >
                Cancel
              </button>
              <button onClick={handleLogout} className={style.confirmBtn}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSideNav;