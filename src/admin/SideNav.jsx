import React, { useRef, useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,     
  MessageSquare, 
  Bell,          
  Settings,      
  LogOut,        
  UserCheck,     // For Profile Reviews
  ShieldCheck,   // ✅ For Verifications (Legal/License)
  Users,         
  ShieldAlert,   
  ChevronDown,
  FileText
} from "lucide-react";
import style from "../styles/SideNav.module.css"; 
import { useAuth } from "../context/AuthProvider.jsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const getInitials = (name) => {
    if (!name) return "AD";
    return name.substring(0, 2).toUpperCase();
};

const AdminSideNav = () => {
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSpecialId, setShowSpecialId] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try { await logout(); navigate("/"); } catch (err) {}
  };

  const copySpecialId = async () => {
    try { await navigator.clipboard.writeText(user?.unique_id || ""); toast.success("ID Copied!"); } catch (err) {}
  };

  const pathTitles = {
      "/admin/dashboard": "Admin Dashboard",
      "/admin/verifications": "License & Identity Verification", // Legal Check
      "/admin/profile-reviews": "Profile Quality Reviews",       // Content/AI Check
      "/admin/properties": "Property Management",
      "/admin/users": "User Database",
      "/admin/messages": "Support Tickets",
      "/admin/settings": "Platform Settings",
      "/admin/audit-logs": "System Logs"
  };
  const currentTitle = pathTitles[location.pathname] || "Admin Portal";

  return (
    <div className={style.allcontainer}>
      <ToastContainer position="top-right" autoClose={3000} style={{ zIndex: 999999 }} />
      
      {/* --- SIDEBAR --- */}
      <aside className={style.side}>
        <div className={style.logo}>
          <div className={style.avatarWrap}>
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Admin" className={style.avatar} onError={(e) => (e.currentTarget.style.display = 'none')} />
            ) : (
                <div className={style.avatar} style={{background: '#1e293b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold'}}>
                    {getInitials(user?.name)}
                </div>
            )}
          </div>
          <div className={style.agentInfo}>
            <h4 className={style.agentName}>{user?.name || "Administrator"}</h4>
            <p className={style.agentTitle}>Admin Console</p>
          </div>
        </div>

        <nav className={style.nav}>
          <div className={style.navSectionLabel}>OVERVIEW</div>
          
          <NavLink to="/admin/dashboard" end className={({ isActive }) => isActive ? `${style.link} ${style.active}` : style.link}>
            <LayoutDashboard size={18} /> <span>Dashboard</span>
          </NavLink>

          <div className={style.navSectionLabel} style={{marginTop: 15}}>APPROVALS</div>

          {/* ✅ 1. VERIFICATIONS (Legal/License Check) */}
          <NavLink to="/admin/verifications" className={({ isActive }) => isActive ? `${style.link} ${style.active}` : style.link}>
            <ShieldCheck size={18} /> <span>Verifications</span>
            <span className={style.badgeDot}></span> 
          </NavLink>

          {/* ✅ 2. PROFILE REVIEWS (Quality/AI Check) */}
          <NavLink to="/admin/profile-reviews" className={({ isActive }) => isActive ? `${style.link} ${style.active}` : style.link}>
            <UserCheck size={18} /> <span>Profile Reviews</span>
          </NavLink>

          {/* ✅ 3. PROPERTY REVIEWS */}
          <NavLink to="/admin/properties" className={({ isActive }) => isActive ? `${style.link} ${style.active}` : style.link}>
            <Building2 size={18} /> <span>Properties</span>
          </NavLink>

          <div className={style.navSectionLabel} style={{marginTop: 15}}>SYSTEM</div>

          <NavLink to="/admin/messages" className={({ isActive }) => isActive ? `${style.link} ${style.active}` : style.link}>
            <MessageSquare size={18} /> <span>Support</span>
          </NavLink>

          <NavLink to="/admin/settings" className={({ isActive }) => isActive ? `${style.link} ${style.active}` : style.link}>
            <Settings size={18} /> <span>Settings</span>
          </NavLink>
        </nav>

        <div className={style.footer}>
          <button onClick={() => setShowLogoutModal(true)} className={style.logout}>
            <LogOut size={18} /> <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className={style.mainContainer}>
        <div className={style.topnav}>
          <div className={style.topTitle}>
             {currentTitle}
             {user?.is_super_admin && <span className={style.superBadge}>ROOT</span>}
          </div>

          <div className={style.userSection} ref={dropdownRef}>
            <div className={style.userEmail} onClick={() => setShowDropdown(!showDropdown)}>
              {user?.email} <ChevronDown size={16} />
            </div>

            {showDropdown && (
              <div className={style.dropdown}>
                <div className={style.dropdownItem}>
                  <strong>Role:</strong> <span style={{color: '#ef4444', fontWeight: 'bold'}}>ADMIN</span>
                </div>
                <div className={style.dropdownItem}>
                  <strong>Admin ID:</strong>
                  <div className={style.uniqueBox}>
                    <span className={style.uniqueValue}>{showSpecialId ? user?.unique_id : "••••••••••••"}</span>
                    <button onClick={() => setShowSpecialId(!showSpecialId)} className={style.eyeBtn}><i className={`fas ${showSpecialId ? "fa-eye" : "fa-eye-slash"}`} /></button>
                    <button onClick={copySpecialId} className={style.copyBtn}><i className="fas fa-copy" /></button>
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
            <h3>Terminate Session?</h3>
            <p>You are about to log out of the Admin Console.</p>
            <div className={style.modalButtons}>
              <button onClick={() => setShowLogoutModal(false)} className={style.cancelBtn}>Cancel</button>
              <button onClick={handleLogout} className={style.confirmBtn} style={{background: '#ef4444'}}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSideNav;