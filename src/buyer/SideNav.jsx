import React, { useRef, useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import style from "../styles/SideNav.module.css";
import img from "../assets/person.png";
import { useAuth } from "../context/AuthProvider.jsx";
import Swal from "sweetalert2";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_EXT = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"];

function isValidImage(file) {
  if (!file) return { ok: false, reason: "No file selected" };
  if (!file.type?.startsWith("image/")) return { ok: false, reason: "Not an image" };
  const ext = file.name.split(".").pop().toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) return { ok: false, reason: "File type not allowed" };
  if (file.size > MAX_BYTES) return { ok: false, reason: "File too large (max 2MB)" };
  return { ok: true };
}

const SideNav = () => {
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [avatarSrc, setAvatarSrc] = useState(user?.profileImage || img);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSpecialId, setShowSpecialId] = useState(false);

  // Dropdown close behavior
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

  // Image upload
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
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarSrc(ev.target.result);
    reader.readAsDataURL(file);
  };

  // Logout handler
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

  // Copy special_id
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
      <div className={style.side}>
        <div className={style.logo}>
          <div className={style.avatarWrap}>
            <img src={avatarSrc} alt="Buyer avatar" className={style.avatar} />
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
            <h4 className={style.agentName}>{user?.name || "Buyer Name"}</h4>
            <p className={style.agentTitle}>Property Buyer</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className={style.nav}>
          <NavLink
            to="/buyer/dashboard"
            end
            className={({ isActive }) =>
              isActive ? `${style.link} ${style.active}` : style.link
            }
          >
            <i className="fas fa-home" /> <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="favorites"
            className={({ isActive }) =>
              isActive ? `${style.link} ${style.active}` : style.link
            }
          >
            <i className="fas fa-heart" /> <span>My Favorites</span>
          </NavLink>

          <NavLink
            to="applications"
            className={({ isActive }) =>
              isActive ? `${style.link} ${style.active}` : style.link
            }
          >
            <i className="fas fa-file-alt" /> <span>Applications</span>
          </NavLink>

          <NavLink
            to="messages"
            className={({ isActive }) =>
              isActive ? `${style.link} ${style.active}` : style.link
            }
          >
            <i className="fas fa-envelope" /> <span>Messages</span>
          </NavLink>

          <NavLink
            to="notifications"
            className={({ isActive }) =>
              isActive ? `${style.link} ${style.active}` : style.link
            }
          >
            <i className="fas fa-bell" /> <span>Notifications</span>
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

      {/* Main Container */}
      <div className={style.mainContainer}>
        <div className={style.topnav}>
          <div className={style.topTitle}>Buyer Dashboard</div>

          <div className={style.userSection} ref={dropdownRef}>
            <div
              className={style.userEmail}
              onClick={() => setShowDropdown(!showDropdown)}
              role="button"
              tabIndex={0}
            >
              {user?.email || "user@example.com"}
              <i
                className={`fas fa-chevron-${
                  showDropdown ? "up" : "down"
                } ml-2`}
              />
            </div>

            {showDropdown && (
              <div className={style.dropdown}>
                <div className={style.dropdownItem}>
                  <strong>Role:</strong>
                  <span className={style.roleValue}>
                    {user?.role || "Not assigned"}
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
                      title={
                        showSpecialId ? "Hide Special ID" : "Show Special ID"
                      }
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
