import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa"; 
import style from "../styles/navbar.module.css";
import logo from "../assets/logoImg.png";
import defaultProfile from "../assets/person.png";
import { useAuth } from "../context/AuthProvider.jsx";

const Navbar = () => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  // ✅ Logout
  const handleLogout = async () => {
    await logout();
    navigate("/"); 
  };

  // ✅ Determine dashboard route based on ROLE STRING
  const getDashboardLink = () => {
    if (!user) return "/";
    if (user.role === "admin") return "/admin/dashboard";
    if (user.role === "agent") return "/dashboard";
    if (user.role === "owner") return "/owner/dashboard";
    if (user.role === "developer") return "/developer/dashboard";
    if (user.role === "buyer") return "/buyer/dashboard";
    return "/";
  };

  // ✅ Determine settings link based on ROLE STRING
  const getSettingsLink = () => {
    if (!user) return "/";
    if (user.role === "admin") return "/admin/settings";
    if (user.role === "agent") return "/dashboard/settings/account";
    if (user.role === "owner") return "/owner/settings";
    if (user.role === "developer") return "/developer/settings";
    if (user.role === "buyer") return "/buyer/settings";
    return "/";
  };

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const closeDropdown = (e) => {
      if (!e.target.closest(`.${style.profileWrapper}`)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("click", closeDropdown);
    return () => document.removeEventListener("click", closeDropdown);
  }, []);

  // ✅ Helper to check if user allows dropdown
  const isLoggedIn = user && user.role !== "pending";

  return (
    <nav className={style.navbar}>
      {/* Logo */}
      <div>
        <Link to="/">
          <img className={style.logo} src={logo} alt="keyvia-logo" />
        </Link>
      </div>

      {/* Links */}
      <ul className={style.navlinks}>
        <li><Link className={style.link} to="/">Home</Link></li>
        <li><Link className={style.link} to="/buy">Buy</Link></li>
        <li><Link className={style.link} to="/rent">Rent</Link></li>
        <li><Link className={style.link} to="/sell">Sell</Link></li>
      </ul>

      {/* Right Section */}
      <div className={style.buttons}>
        {isLoggedIn ? (
          <div className={style.profileWrapper}>
            {/* Profile Section */}
            <div
              className={style.profileSection}
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
              <img
                // 🛑 FIX: Changed user.profileImage to user.avatar_url
                src={user.avatar_url || defaultProfile} 
                alt="profile"
                className={style.profileImage}
              />
              <span className={style.username}>
                {user.name?.split(" ")[0] || "User"}
              </span>
              <FaChevronDown
                className={`${style.dropdownArrow} ${
                  dropdownOpen ? style.rotate : ""
                }`}
              />
            </div>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className={style.dropdown}>
                <Link to="/profile" className={style.dropdownItem}>
                  My Profile
                </Link>

                {/* Dashboard & Settings Links */}
                <Link to={getDashboardLink()} className={style.dropdownItem}>
                  Dashboard
                </Link>
                <Link to={getSettingsLink()} className={style.dropdownItem}>
                  Settings
                </Link>

                <button onClick={handleLogout} className={style.dropdownItem}>
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/login">
              <button className={style.login}>Login</button>
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