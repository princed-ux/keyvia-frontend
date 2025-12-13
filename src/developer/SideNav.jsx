import React, { useRef, useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import style from "../styles/SideNav.module.css";
import img from "../assets/person.png";
import { useAuth } from "../context/AuthProvider.jsx";
import Swal from "sweetalert2";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_EXT = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"];

function isValidImage(file) {
  if (!file) return { ok: false, reason: "No file selected" };
  if (!file.type?.startsWith("image/")) return { ok: false, reason: "Selected file is not an image" };
  const ext = file.name.split(".").pop().toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) return { ok: false, reason: "File extension not allowed" };
  if (file.size > MAX_BYTES) return { ok: false, reason: `File too large. Max ${MAX_BYTES / 1024 / 1024} MB` };
  return { ok: true };
}

const SideNav = () => {
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [avatarSrc, setAvatarSrc] = useState(user?.profileImage || img);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSpecialId, setShowSpecialId] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // =======================
  // DROPDOWN HANDLERS
  // =======================
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    const handleEsc = (event) => {
      if (event.key === "Escape") setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  // =======================
  // IMAGE UPLOAD
  // =======================
  const openPicker = () => inputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    const check = isValidImage(file);
    if (!check.ok) {
      Swal.fire({
        icon: "error",
        title: "Invalid Image",
        text: check.reason,
      });
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setAvatarSrc(ev.target.result);
    reader.readAsDataURL(file);
  };

  // =======================
  // COPY SPECIAL ID
  // =======================
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
      console.error("Copy failed:", err);
    }
  };

  // =======================
  // LOGOUT
  // =======================
  const confirmLogout = async () => {
    try {
      await logout();
      setShowLogoutModal(false);
      navigate("/");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Logout Failed",
        text: "Please try again.",
      });
    }
  };

  // =======================
  // JSX
  // =======================
  return (
    <div className={style.allcontainer}>
      {/* Sidebar */}
      <div className={style.side}>
        <div className={style.logo}>
          <div className={style.avatarWrap}>
            <img
              src={avatarSrc}
              alt="Developer avatar"
              className={style.avatar}
              onError={(e) => (e.currentTarget.src = img)}
            />
            <div className={style.cameraIcon} onClick={openPicker}>
              <i className="fa-regular fa-camera" />
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
            <h4 className={style.agentName}>{user?.name || "Developer Name"}</h4>
            <p className={style.agentTitle}>Real Estate Developer</p>
          </div>
        </div> 

        {/* Navigation Links */}
        <nav className={style.nav}>
          <NavLink
            to="/developer/dashboard"
            end
            className={({ isActive }) =>
              isActive ? `${style.link} ${style.active}` : style.link
            }
          >
            <i className="fas fa-home" /> <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="projects"
            className={({ isActive }) =>
              isActive ? `${style.link} ${style.active}` : style.link
            }
          >
            <i className="fas fa-building" /> <span>Projects</span>
          </NavLink>

          <NavLink
            to="add-project"
            className={({ isActive }) =>
              isActive ? `${style.link} ${style.active}` : style.link
            }
          >
            <i className="fas fa-plus-circle" /> <span>Add Project</span>
          </NavLink>

          <NavLink
            to="investors"
            className={({ isActive }) =>
              isActive ? `${style.link} ${style.active}` : style.link
            }
          >
            <i className="fas fa-handshake" /> <span>Investors</span>
          </NavLink>

          <NavLink
            to="messages"
            className={({ isActive }) =>
              isActive ? `${style.link} ${style.active}` : style.link
            }
          >
            <i className="fas fa-message" /> <span>Chat Messages</span>
          </NavLink>

          <NavLink
            to="settings/account"
            className={({ isActive }) =>
              isActive ? `${style.link} ${style.active}` : style.link
            }
          >
            <i className="fas fa-cog" /> <span>Settings</span>
          </NavLink>
        </nav>

        <div className={style.footer}>
          <button className={style.logout} onClick={() => setShowLogoutModal(true)}>
            <i className="fas fa-sign-out-alt" /> <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className={style.mainContainer}>
        <div className={style.topnav}>
          <div className={style.topTitle}>Developer Dashboard</div>
          <div className={style.userSection} ref={dropdownRef}>
            <div
              className={style.userEmail}
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {user?.email || "user@example.com"}
              <i className={`fas fa-chevron-${showDropdown ? "up" : "down"} ml-2`} />
            </div>

            {showDropdown && (
              <div className={style.dropdown}>
                <div className={style.dropdownItem}>
                  <strong>Role:</strong>
                  <span className={style.roleValue}>
                    {user?.role || "Developer"}
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
                      title={showSpecialId ? "Hide ID" : "Show ID"}
                    >
                      <i
                        className={`fas ${
                          showSpecialId ? "fa-eye" : "fa-eye-slash"
                        }`}
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

        {/* Page Content */}
        <div className={style.main}>
          <div className={style.pageWrapper}>
            <Outlet />
          </div>
        </div>
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

export default SideNav;
