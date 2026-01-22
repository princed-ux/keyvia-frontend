import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaChevronDown, FaBell } from "react-icons/fa";
import style from "../styles/navbar.module.css";

// ✅ Import both logos
import logoWhite from "../assets/logoImg.png"; 
import logoDark from "../assets/mainLogo.png"; 

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Transparent Navbar Logic
  const transparentPaths = ["/", "/sell"];
  const isTransparent = transparentPaths.includes(location.pathname) && !mobileMenuOpen; 

  // ✅ Logout Handlers
  const handleLogoutClick = () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    await logout();
    setShowLogoutModal(false);
    navigate("/"); 
  };

  // ✅ Dashboard Link Logic
  const getDashboardLink = () => {
    if (!user) return "/";
    if (user.is_super_admin || user.role === 'superadmin') return "/super-admin/dashboard";
    const roleMap = {
      admin: "/admin/dashboard",
      agent: "/dashboard",
      owner: "/owner/dashboard",
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

  const getPublicProfileLink = () => {
    if (!user) return "/";
    if (user.username) return `/user/@${user.username}`;
    return `/user/${user.name}`;
  };

  // ✅ Close dropdowns on click outside
  useEffect(() => {
    const closeDropdown = (e) => {
      if (!e.target.closest(`.${style.profileWrapper}`)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("click", closeDropdown);
    return () => document.removeEventListener("click", closeDropdown);
  }, []);

  // ✅ Close mobile menu automatically on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // ✅ BUG FIX: Close mobile menu if screen resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isLoggedIn = user && user.role !== "pending";
  const isActive = (path) => location.pathname === path;
  const displayName = (user?.name || user?.full_name || "User").split(" ")[0];

  return (
    <>
      <nav className={`${style.navbar} ${isTransparent ? style.transparent : style.white}`}>
        
        {/* 1. Logo */}
        <div className={style.logoContainer}>
          <Link to="/">
            <img 
              className={style.logo} 
              src={isTransparent ? logoWhite : logoDark} 
              alt="keyvia-logo" 
            />
          </Link>
        </div>

        {/* 2. Desktop Links (Hidden on Mobile) */}
        <ul className={style.navlinks}>
          <li><Link to="/" className={`${style.link} ${isActive("/") ? style.activeLink : ""}`}>Home</Link></li>
          <li><Link to="/buy" className={`${style.link} ${isActive("/buy") ? style.activeLink : ""}`}>Buy</Link></li>
          <li><Link to="/rent" className={`${style.link} ${isActive("/rent") ? style.activeLink : ""}`}>Rent</Link></li>
          <li><Link to="/sell" className={`${style.link} ${isActive("/sell") ? style.activeLink : ""}`}>Sell</Link></li>
        </ul>

        {/* 3. Right Section */}
        <div className={style.rightSection}>
          
          {/* --- DESKTOP BUTTONS --- */}
          <div className={style.desktopButtons}>
              {isLoggedIn ? (
              <div className={style.profileWrapper}>
                  <button className={`${style.iconBtn} ${isTransparent ? style.iconTransparent : style.iconDark}`}>
                      <FaBell size={20} />
                  </button>

                  <div className={style.profileSection} onClick={() => setDropdownOpen((prev) => !prev)}>
                      {user.avatar_url ? (
                          <img src={user.avatar_url} alt="profile" className={style.profileImage} />
                      ) : (
                          <div className={style.profileImage} style={{ backgroundColor: getAvatarColor(user?.name), display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "14px", fontWeight: "bold", textTransform: "uppercase" }}>
                              {displayName.charAt(0)}
                          </div>
                      )}
                      <span className={style.username}>{displayName}</span>
                      <FaChevronDown className={`${style.dropdownArrow} ${dropdownOpen ? style.rotate : ""}`} />
                  </div>

                  {dropdownOpen && (
                  <div className={style.dropdown}>
                      <div className={style.dropdownItem} style={{pointerEvents:'none', fontWeight:'bold', color:'#09707d', borderBottom:'1px solid #eee'}}>
                          {user.role === 'superadmin' ? 'SUPER ADMIN' : user.role.toUpperCase()}
                      </div>
                      <Link to={getPublicProfileLink()} className={style.dropdownItem}>My Profile</Link>
                      <Link to={getDashboardLink()} className={style.dropdownItem} target="_blank" rel="noopener noreferrer">Dashboard ↗</Link>
                      <Link to={getSettingsLink()} className={style.dropdownItem}>Settings</Link>
                      <button onClick={handleLogoutClick} className={style.dropdownItem}>Logout</button>
                  </div>
                  )}
              </div>
              ) : (
              <div className={style.authBtns}>
                  <Link to="/login"><button className={`${style.login} ${!isTransparent ? style.loginDark : ''}`}>Login</button></Link>
                  <Link to="/signup"><button className={style.signup}>Sign up</button></Link>
              </div>
              )}
          </div>

          {/* --- ANIMATED HAMBURGER (Mobile) --- */}
          <button 
              className={`${style.hamburger} ${mobileMenuOpen ? style.isActive : ''} ${isTransparent ? style.hamWhite : style.hamDark}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
          >
              <span className={style.bar}></span>
              <span className={style.bar}></span>
              <span className={style.bar}></span>
          </button>
        </div>

        {/* 4. MOBILE MENU OVERLAY (IMPROVED UI) */}
        <div className={`${style.mobileMenu} ${mobileMenuOpen ? style.menuOpen : ''}`}>
            <div className={style.mobileContent}>
                
                {/* User Section (Brand Colored Card) */}
                {isLoggedIn && (
                    <div className={style.mobileUserCard}>
                        <div className={style.mobileUserHeader}>
                            {user.avatar_url ? (
                                <img src={user.avatar_url} className={style.profileImage} alt="" style={{borderColor: 'white'}} />
                            ) : (
                                <div className={style.profileImage} style={{ backgroundColor: 'white', color: '#09707d', display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "bold" }}>
                                    {displayName.charAt(0)}
                                </div>
                            )}
                            <div className={style.mobileUserInfo}>
                                <span className={style.mobileUserName}>{user.name}</span>
                                <span className={style.mobileUserRole}>{user.role.toUpperCase()}</span>
                            </div>
                        </div>
                        <div className={style.mobileUserActions}>
                            <Link to={getPublicProfileLink()} className={style.mobileUserBtn} onClick={() => setMobileMenuOpen(false)}>My Profile</Link>
                            <Link to={getDashboardLink()} className={style.mobileUserBtn} onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                        </div>
                    </div>
                )}

                {/* Navigation Links */}
                <div className={style.mobileLinksContainer}>
                    <Link to="/" className={style.mobileLink} onClick={() => setMobileMenuOpen(false)}>Home</Link>
                    <Link to="/buy" className={style.mobileLink} onClick={() => setMobileMenuOpen(false)}>Buy</Link>
                    <Link to="/rent" className={style.mobileLink} onClick={() => setMobileMenuOpen(false)}>Rent</Link>
                    <Link to="/sell" className={style.mobileLink} onClick={() => setMobileMenuOpen(false)}>Sell</Link>
                    
                    {isLoggedIn && (
                        <>
                            <div className={style.mobileDivider}></div>
                            <Link to={getSettingsLink()} className={style.mobileLink} onClick={() => setMobileMenuOpen(false)}>Account Settings</Link>
                            <button onClick={handleLogoutClick} className={style.mobileLogoutBtn}>Log Out</button>
                        </>
                    )}
                </div>

                {/* Auth Buttons (If logged out) */}
                {!isLoggedIn && (
                    <div className={style.mobileAuthContainer}>
                        <Link to="/login" className={style.mobileAuthLogin} onClick={() => setMobileMenuOpen(false)}>Login</Link>
                        <Link to="/signup" className={style.mobileAuthSignup} onClick={() => setMobileMenuOpen(false)}>Create Account</Link>
                    </div>
                )}
            </div>
        </div>
      </nav>

      {/* --- 5. LOGOUT MODAL --- */}
      {showLogoutModal && (
        <div className={style.modalOverlay}>
          <div className={style.modalContent}>
            <h3>Sign Out?</h3>
            <p>Are you sure you want to log out of Keyvia?</p>
            <div className={style.modalActions}>
              <button className={style.modalCancel} onClick={() => setShowLogoutModal(false)}>Cancel</button>
              <button className={style.modalConfirm} onClick={confirmLogout}>Log Out</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;