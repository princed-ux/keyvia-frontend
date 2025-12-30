import React, { useRef, useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import style from "../styles/SideNav.module.css";
import img from "../assets/person.png";
import { useAuth } from "../context/AuthProvider.jsx";
import Swal from "sweetalert2";

/* =======================
   IMAGE VALIDATION
======================= */
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_EXT = ["png", "jpg", "jpeg", "gif", "webp"];

const validateImage = (file) => {
  if (!file) return { ok: false, msg: "No file selected" };
  if (!file.type.startsWith("image/")) return { ok: false, msg: "Invalid image type" };
  if (file.size > MAX_BYTES) return { ok: false, msg: "Image exceeds 2MB limit" };

  const ext = file.name.split(".").pop().toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) return { ok: false, msg: "Unsupported image format" };

  return { ok: true };
};

const DeveloperSideNav = () => {
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [avatar, setAvatar] = useState(user?.profileImage || img);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showId, setShowId] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  /* =======================
     DROPDOWN BEHAVIOR
  ======================= */
  useEffect(() => {
    const close = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  /* =======================
     IMAGE UPLOAD
  ======================= */
  const handleImage = (e) => {
    const file = e.target.files[0];
    const check = validateImage(file);

    if (!check.ok) {
      Swal.fire("Upload Error", check.msg, "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result);
    reader.readAsDataURL(file);

    // TODO: Upload to backend / cloud storage
  };

  /* =======================
     COPY SPECIAL ID
  ======================= */
  const copyId = async () => {
    await navigator.clipboard.writeText(user?.special_id || "");
    Swal.fire({
      toast: true,
      icon: "success",
      title: "Special ID copied",
      timer: 1500,
      showConfirmButton: false,
      position: "top-end",
    });
  };

  /* =======================
     LOGOUT
  ======================= */
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  /* =======================
     NAVIGATION
  ======================= */
  const navItems = [
    { to: "/developer/dashboard", label: "Dashboard", icon: "fa-home", end: true },
    { to: "/developer/projects", label: "Projects", icon: "fa-building" },
    { to: "/developer/add-project", label: "Add Project", icon: "fa-plus-circle" },
    { to: "/developer/investors", label: "Investors", icon: "fa-chart-line" },
    { to: "/developer/messages", label: "Messages", icon: "fa-envelope" },
    { to: "/developer/settings", label: "Settings", icon: "fa-cog" },
  ];

  return (
    <div className={style.allcontainer}>
      {/* SIDEBAR */}
      <aside className={style.side}>
        <div className={style.logo}>
          <div className={style.avatarWrap}>
            <img src={avatar} alt="Developer" className={style.avatar} />
            <div className={style.cameraIcon} onClick={() => inputRef.current.click()}>
              <i className="fa-regular fa-camera" />
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleImage}
            />
          </div>

          <div className={style.agentInfo}>
            <h4>{user?.name || "Developer"}</h4>
            <p>Real Estate Developer</p>
          </div>
        </div>

        <nav className={style.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? `${style.link} ${style.active}` : style.link
              }
            >
              <i className={`fas ${item.icon}`} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button className={style.logout} onClick={() => setConfirmLogout(true)}>
          <i className="fas fa-sign-out-alt" /> Logout
        </button>
      </aside>

      {/* MAIN */}
      <main className={style.mainContainer}>
        <div className={style.topnav}>
          <span>Developer Console</span>

          <div ref={dropdownRef} className={style.userSection}>
            <span onClick={() => setDropdownOpen(!dropdownOpen)}>
              {user?.email}
              <i className="fas fa-chevron-down" />
            </span>

            {dropdownOpen && (
              <div className={style.dropdown}>
                <div>
                  <strong>Role:</strong> Developer
                </div>

                <div className={style.uniqueBox}>
                  <span>
                    {showId ? user?.special_id : "••••••••"}
                  </span>
                  <button onClick={() => setShowId(!showId)}>
                    <i className={`fas ${showId ? "fa-eye" : "fa-eye-slash"}`} />
                  </button>
                  <button onClick={copyId}>
                    <i className="fas fa-copy" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <section className={style.main}>
          <Outlet />
        </section>
      </main>

      {/* LOGOUT CONFIRM */}
      {confirmLogout && (
        <div className={style.modalOverlay}>
          <div className={style.modal}>
            <h3>Logout</h3>
            <p>Do you want to exit the Developer Console?</p>
            <div>
              <button onClick={() => setConfirmLogout(false)}>Cancel</button>
              <button onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeveloperSideNav;
