import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaChevronDown, FaBell } from "react-icons/fa"; 
import style from "../styles/navbar.module.css";

// ✅ Import both logos
import logoWhite from "../assets/logoImg.png"; // White logo for transparent headers
import logoDark from "../assets/mainLogo.png";  // Brand color logo for white headers

import { useAuth } from "../context/AuthProvider.jsx";

// ✅ HELPER: Avatar Color
const getAvatarColor = (name) => {
  if (!name) return "#09707D";
  const colors = ["#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5", "#2196F3", "#03A9F4", "#00BCD4", "#009688", "#4CAF50", "#8BC34A", "#CDDC39", "#FFC107", "#FF9800", "#FF5722", "#795548", "#607D8B"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Define which paths use the Transparent Navbar (White Logo)
  const transparentPaths = ["/", "/sell"];
  const isTransparent = transparentPaths.includes(location.pathname);

  // ✅ Logout
  const handleLogout = async () => {
    await logout();
    navigate("/"); 
  };

  // ✅ Dashboard Link Logic
  const getDashboardLink = () => {
    if (!user) return "/";
    if (user.is_super_admin || user.role === 'superadmin' || user.role === 'super_admin') {
        return "/super-admin/dashboard";
    }
    const roleMap = {
      admin: "/admin/dashboard",
      agent: "/dashboard",
      owner: "/owner",
      developer: "/developer",
      buyer: "/buyer/dashboard" 
    };
    return roleMap[user.role] || "/";
  };

  const getSettingsLink = () => {
    if (!user) return "/";
    if (user.is_super_admin) return "/super-admin/settings";
    return user.role === "admin" ? "/admin/settings" : "/dashboard/settings/account";
  };

  // ✅ Close dropdown logic
  useEffect(() => {
    const closeDropdown = (e) => {
      if (!e.target.closest(`.${style.profileWrapper}`)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("click", closeDropdown);
    return () => document.removeEventListener("click", closeDropdown);
  }, []);

  const isLoggedIn = user && user.role !== "pending";
  const isActive = (path) => location.pathname === path;

  // Safe Name Logic
  const displayName = (user?.name || user?.full_name || "User").split(" ")[0];

  return (
    <nav className={`${style.navbar} ${isTransparent ? style.transparent : style.white}`}>
      {/* Logo */}
      <div className={style.logoContainer}>
        <Link to="/">
          {/* ✅ DYNAMIC LOGO SWAP */}
          <img 
            className={style.logo} 
            src={isTransparent ? logoWhite : logoDark} 
            alt="keyvia-logo" 
          />
        </Link>
      </div>

      {/* Links */}
      <ul className={style.navlinks}>
        <li>
          <Link to="/" className={`${style.link} ${isActive("/") ? style.activeLink : ""}`}>Home</Link>
        </li>
        <li>
          <Link to="/buy" className={`${style.link} ${isActive("/buy") ? style.activeLink : ""}`}>Buy</Link>
        </li>
        <li>
          <Link to="/rent" className={`${style.link} ${isActive("/rent") ? style.activeLink : ""}`}>Rent</Link>
        </li>
        <li>
          <Link to="/sell" className={`${style.link} ${isActive("/sell") ? style.activeLink : ""}`}>Sell</Link>
        </li>
      </ul>

      {/* Right Section */}
      <div className={style.buttons}>
        {isLoggedIn ? (
          <div className={style.profileWrapper}>
            {/* Icons */}
            <button className={`${style.iconBtn} ${isTransparent ? style.iconTransparent : style.iconDark}`}>
              <FaBell size={20} />
            </button>

            {/* Profile */}
            <div
              className={style.profileSection}
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
              {/* ✅ Dynamic Avatar / Initials */}
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="profile"
                  className={style.profileImage}
                />
              ) : (
                <div 
                  className={style.profileImage}
                  style={{
                    backgroundColor: getAvatarColor(user?.name),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "bold",
                    textTransform: "uppercase"
                  }}
                >
                  {displayName.charAt(0)}
                </div>
              )}

              <span className={style.username}>
                {displayName}
              </span>
              <FaChevronDown
                className={`${style.dropdownArrow} ${dropdownOpen ? style.rotate : ""}`}
              />
            </div>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className={style.dropdown}>
                <div className={style.dropdownItem} style={{pointerEvents:'none', fontWeight:'bold', color:'#09707d', borderBottom:'1px solid #eee'}}>
                    {user.role === 'superadmin' ? 'SUPER ADMIN' : user.role.toUpperCase()}
                </div>
                
                <Link to="/profile" className={style.dropdownItem}>My Profile</Link>
                
                {/* ✅ DASHBOARD (Opens in New Tab) */}
                <Link 
                    to={getDashboardLink()} 
                    className={style.dropdownItem}
                    target="_blank" 
                    rel="noopener noreferrer"
                >
                    Dashboard ↗
                </Link>

                <Link to={getSettingsLink()} className={style.dropdownItem}>Settings</Link>
                <button onClick={handleLogout} className={style.dropdownItem}>Logout</button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/login">
              <button className={`${style.login} ${!isTransparent ? style.loginDark : ''}`}>Login</button>
            </Link>
            <Link to="/signup">
              <button className={style.signup}>Sign up</button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;