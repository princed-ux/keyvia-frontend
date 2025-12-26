import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaChevronDown, FaBell } from "react-icons/fa"; 
import style from "../styles/navbar.module.css";
import logo from "../assets/logoImg.png";
import defaultProfile from "../assets/person.png";
import { useAuth } from "../context/AuthProvider.jsx";

const Navbar = () => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Define which paths use the Transparent Navbar
  const transparentPaths = ["/", "/sell"];
  const isTransparent = transparentPaths.includes(location.pathname);

  // ✅ Logout
  const handleLogout = async () => {
    await logout();
    navigate("/"); 
  };

  // ✅ Dashboard Link Logic (Fixed for Super Admin)
  const getDashboardLink = () => {
    if (!user) return "/";

    // 1. Super Admin Check
    if (user.is_super_admin || user.role === 'superadmin' || user.role === 'super_admin') {
        return "/super-admin/dashboard";
    }

    // 2. Standard Roles
    const roleMap = {
      admin: "/admin/dashboard",
      agent: "/dashboard",
      owner: "/owner",
      developer: "/developer",
      buyer: "/buyer"
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
          <img className={style.logo} src={logo} alt="keyvia-logo" />
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
              <img
                src={user.avatar_url || defaultProfile} 
                alt="profile"
                className={style.profileImage}
              />
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