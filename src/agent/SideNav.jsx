import React, { useRef, useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import style from "../styles/SideNav.module.css";
import { useAuth } from "../context/AuthProvider.jsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { 
  LayoutDashboard, User, Building, Wallet, MessageSquare, 
  FileText, Bell, Settings, LogOut, ChevronDown, ChevronUp, Eye, EyeOff, Copy
} from "lucide-react";

// Helper
const getAvatarColor = (name) => {
  if (!name) return "#09707D";
  const colors = ["#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5", "#2196F3"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const SideNav = () => {
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const location = useLocation();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSpecialId, setShowSpecialId] = useState(false);

  // ✅ REDIRECT IF NOT VERIFIED
  useEffect(() => {
    if (user && !user.phone_verified) {
      navigate("/onboarding");
    }
  }, [user, navigate]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const confirmLogout = async () => { 
      try { await logout(); setShowLogoutModal(false); navigate("/"); } catch (err) {} 
  };
  
  const copySpecialId = async () => { 
      try { await navigator.clipboard.writeText(user?.special_id || ""); toast.success("ID Copied!"); } catch (err) {} 
  };

  const pathTitles = { 
      "/dashboard": "Dashboard", 
      "/dashboard/profile": "My Profile", 
      "/dashboard/listings": "Listings", 
      "/dashboard/payments": "Payments", 
      "/dashboard/messages": "Messages", 
      "/dashboard/applications": "Applications", 
      "/dashboard/notifications": "Notifications", 
      "/dashboard/settings/account": "Settings" 
  };
  const currentTitle = pathTitles[location.pathname] || "Agent Dashboard";

  return (
    <div className={style.allcontainer}>
      <ToastContainer position="top-right" autoClose={3000} style={{ zIndex: 999999 }} />

      {/* --- SIDEBAR --- */}
      <div className={style.side}>
        <div className={style.logo}>
          <div className={style.avatarWrap}>
            {user?.avatar_url ? (
              <img src={user.avatar_url} className={style.avatar} alt="User" onError={(e) => (e.currentTarget.style.display = "none")} />
            ) : (
              <div className={style.avatar} style={{ backgroundColor: getAvatarColor(user?.name), display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "20px", fontWeight: "bold" }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className={style.agentInfo}>
            <h4 className={style.agentName}>{user?.name}</h4>
            <p className={style.agentTitle}>Real Estate Agent</p>
          </div>
        </div>

        <nav className={style.nav}>
          <NavLink to="/dashboard" end className={({ isActive }) => isActive ? `${style.link} ${style.active}` : style.link}>
            <LayoutDashboard size={18} /> <span>Dashboard</span>
          </NavLink>
          <NavLink to="profile" className={({ isActive }) => isActive ? `${style.link} ${style.active}` : style.link}>
            <User size={18} /> <span>Profile</span>
          </NavLink>
          <NavLink to="listings" className={({ isActive }) => isActive ? `${style.link} ${style.active}` : style.link}>
            <Building size={18} /> <span>Listings</span>
          </NavLink>
          <NavLink to="payments" className={({ isActive }) => isActive ? `${style.link} ${style.active}` : style.link}>
            <Wallet size={18} /> <span>Payments</span>
          </NavLink>
          <NavLink to="messages" className={({ isActive }) => isActive ? `${style.link} ${style.active}` : style.link}>
            <MessageSquare size={18} /> <span>Messages</span>
          </NavLink>
          <NavLink to="applications" className={({ isActive }) => isActive ? `${style.link} ${style.active}` : style.link}>
            <FileText size={18} /> <span>Applications</span>
          </NavLink>
          <NavLink to="notifications" className={({ isActive }) => isActive ? `${style.link} ${style.active}` : style.link}>
            <Bell size={18} /> <span>Notifications</span>
          </NavLink>
          <NavLink to="settings/account" className={({ isActive }) => isActive ? `${style.link} ${style.active}` : style.link}>
            <Settings size={18} /> <span>Settings</span>
          </NavLink>
        </nav>

        <div className={style.footer}>
          <button className={style.logout} onClick={() => setShowLogoutModal(true)}>
            <LogOut size={18} /> <span>Logout</span>
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT WRAPPER --- */}
      <div className={style.mainContainer}>
        <div className={style.topnav}>
          <div className={style.topTitle}>{currentTitle}</div>
          <div className={style.userSection} ref={dropdownRef}>
            <div className={style.userEmail} onClick={() => setShowDropdown(!showDropdown)}>
              {user?.email} 
              {showDropdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            
            {showDropdown && (
              <div className={style.dropdown}>
                <div className={style.dropdownItem}><strong>Role:</strong> Agent</div>
                <div className={style.dropdownItem}>
                  <strong>ID:</strong> 
                  <div className={style.uniqueBox}>
                    <span className={style.uniqueValue}>{showSpecialId ? user?.special_id : "••••••••"}</span>
                    <button onClick={() => setShowSpecialId(!showSpecialId)} className={style.eyeBtn}>
                        {showSpecialId ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                    <button onClick={copySpecialId} className={style.copyBtn}><Copy size={14}/></button>
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

      {showLogoutModal && (
        <div className={style.modalOverlay}>
          <div className={style.modal}>
            <h3>Confirm Logout</h3><p>Are you sure?</p>
            <div className={style.modalButtons}>
              <button onClick={() => setShowLogoutModal(false)} className={style.cancelBtn}>Cancel</button>
              <button onClick={confirmLogout} className={style.confirmBtn}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 

export default SideNav;