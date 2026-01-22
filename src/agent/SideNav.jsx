import React, { useRef, useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import style from "../styles/SideNav.module.css";
import { useAuth } from "../context/AuthProvider.jsx";
import { useSocket } from "../context/SocketProvider.jsx"; 
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { 
  LayoutDashboard, User, Building, Wallet, MessageSquare, 
  FileText, Bell, Settings, LogOut, ChevronDown, ChevronUp, Eye, EyeOff, Copy, X, Trash2
} from "lucide-react";
import client from "../api/axios"; 
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

// ✅ 1. Import Hook
import useAutoFetch from '../hooks/useAutoFetch';

dayjs.extend(relativeTime);

const getAvatarColor = (name) => {
  if (!name) return "#09707D";
  const colors = ["#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5", "#2196F3"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const SideNav = () => {
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { socket } = useSocket(); 
  const location = useLocation();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSpecialId, setShowSpecialId] = useState(false);
  
  const [counts, setCounts] = useState({
    notifications: 0,
    applications: 0, 
    messages: 0   
  });

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]); 

  // ✅ 2. SECURITY CHECK
  // Agents MUST be verified. If not, send to onboarding.
  useEffect(() => { 
    if (user && user.role !== 'buyer' && !user.phone_verified) {
        navigate("/onboarding");
    }
  }, [user, navigate]);

  // Helper: Get Token
  const getAuthHeader = () => {
      let token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      if (!token) return {};
      token = token.replace(/^"|"$/g, '');
      return { headers: { Authorization: `Bearer ${token}` } };
  };

  // ✅ 3. AUTO-FETCH COUNTS
  // This keeps the red dots (badges) in sync automatically
  const fetchCounts = async () => {
    try {
      const config = getAuthHeader();
      if (!config.headers) return;

      const res = await client.get("/api/notifications/counts", config);
      setCounts(res.data);
    } catch (err) {
      console.error("Failed to fetch counts");
    }
  };

  // Apply the Hook
  useAutoFetch(fetchCounts);

  // 4. Real-Time Logic (Sound & Instant Toast)
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data) => {
        const audio = new Audio("/assets/notification.mp3"); 
        audio.play().catch(() => {});
        toast.info(data.message || "New Notification");
        
        // If dropdown is open, add it immediately
        if (showNotifDropdown) {
            setNotifications(prev => [data, ...prev]);
        }
    };

    socket.on("notification", handleNotification);
    
    return () => {
      socket.off("notification", handleNotification);
    };
  }, [socket, showNotifDropdown]);

  // Click Outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowDropdown(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleNotifications = async () => {
    if (!showNotifDropdown) {
        try {
            const config = getAuthHeader();
            const res = await client.get("/api/notifications", config);
            setNotifications(res.data);
            
            // Mark read immediately
            await client.patch("/api/notifications/mark-read", {}, config);
            
            // Clear local count
            setCounts(prev => ({ ...prev, notifications: 0 }));

        } catch (err) {
            if (err.response && err.response.status === 401) {
                toast.error("Session expired.");
            }
        }
    }
    setShowNotifDropdown(!showNotifDropdown);
  };

  const handleNotifClick = (link) => { setShowNotifDropdown(false); if (link) navigate(link); };
  
  const handleDeleteNotif = async (e, id) => {
    e.preventDefault();
    try {
        const config = getAuthHeader();
        await client.delete(`/api/notifications/${id}`, config);
        setNotifications(prev => prev.filter(n => n.id !== id));
        toast.success("Notification deleted");
    } catch (err) { toast.error("Could not delete"); }
  };

  const handleClearAll = async () => {
    try {
        const config = getAuthHeader();
        await client.delete("/api/notifications", config);
        setNotifications([]);
        toast.success("All cleared!");
    } catch (err) { toast.error("Failed to clear"); }
  };

  const confirmLogout = async () => { try { await logout(); setShowLogoutModal(false); navigate("/"); } catch (err) {} };
  const copySpecialId = async () => { try { await navigator.clipboard.writeText(user?.special_id || ""); toast.success("ID Copied!"); } catch (err) {} };

  // --- NAVIGATION LINKS ---
  const navLinks = [
    { to: "/dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard", end: true },
    { to: "profile", icon: <User size={18} />, label: "Profile" },
    { to: "listings", icon: <Building size={18} />, label: "Listings" },
    { to: "payments", icon: <Wallet size={18} />, label: "Payments" },
    { to: "messages", icon: <MessageSquare size={18} />, label: "Messages", badge: counts.messages > 0 },
    { to: "applications", icon: <FileText size={18} />, label: "Applications", badge: counts.applications > 0 },
    { to: "settings/account", icon: <Settings size={18} />, label: "Settings" }
  ];

  const currentTitle = navLinks.find(l => location.pathname.includes(l.to.replace('/dashboard', '')))?.label || "Agent Dashboard";

  return (
    <div className={style.allcontainer}>
      <ToastContainer position="top-right" autoClose={3000} style={{ zIndex: 999999 }} />

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
          {navLinks.map((link) => (
            <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => isActive ? `${style.link} ${style.active}` : style.link}
                onClick={() => {
                    // Optimistic reset on click
                    if(link.label === "Applications") setCounts(p => ({...p, applications: 0}));
                    if(link.label === "Messages") setCounts(p => ({...p, messages: 0}));
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    {link.icon} 
                    <span style={{ marginLeft: '10px' }}>{link.label}</span>
                    {link.badge && (
                        <span className={style.sidebarDot} style={{ marginLeft: 'auto', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }}></span>
                    )}
                </div>
            </NavLink>
          ))}
        </nav>

        <div className={style.footer}>
          <button className={style.logout} onClick={() => setShowLogoutModal(true)}>
            <LogOut size={18} /> <span>Logout</span>
          </button>
        </div>
      </div>

      <div className={style.mainContainer}>
        <div className={style.topnav}>
          <div className={style.topTitle}>{currentTitle}</div>
          
          <div className={style.topRightSection}>
            <div className={style.notifWrapper} ref={notifRef}>
                <div className={style.bellContainer} onClick={toggleNotifications}>
                    <Bell size={20} className={style.bellIcon} /> 
                    {counts.notifications > 0 && (
                        <span className={style.redDot}>
                            {counts.notifications > 9 ? "9+" : counts.notifications}
                        </span>
                    )}
                </div>

                {showNotifDropdown && (
                    <div className={style.notifDropdown}>
                        <div className={style.notifHeader}>
                            <h4>Notifications</h4>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={handleClearAll} title="Clear All" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>
                                    <Trash2 size={16} />
                                </button>
                                <button onClick={() => setShowNotifDropdown(false)}><X size={16}/></button>
                            </div>
                        </div>
                        <div className={style.notifList}>
                            {notifications.length === 0 ? (
                                <div className={style.emptyNotif}>No new notifications</div>
                            ) : (
                                notifications.map((notif, index) => (
                                    <div 
                                        key={index} 
                                        className={style.notifItem} 
                                        onClick={() => handleNotifClick(notif.link)}
                                        onContextMenu={(e) => handleDeleteNotif(e, notif.id)}
                                    >
                                        <div className={style.notifContent}>
                                            <strong>{notif.title || "Alert"}</strong>
                                            <p>{notif.message}</p>
                                            <span>{dayjs(notif.created_at).fromNow()}</span>
                                        </div>
                                        {!notif.is_read && <div className={style.unreadIndicator} />}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

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