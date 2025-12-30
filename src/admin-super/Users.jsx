import React, { useEffect, useState } from "react";
import client from "../api/axios";
import style from "../styles/SuperAdminDashboard.module.css"; 
import { 
  Search, Trash2, Ban, CheckCircle, 
  Filter, Shield, Mail 
} from "lucide-react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

const SuperAdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  // --- FETCH USERS ---
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await client.get("/api/super-admin/users");
      setUsers(res.data.users);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- ACTIONS ---
  
  // 1. DELETE USER
  const handleDelete = async (user) => {
    const result = await Swal.fire({
      title: `Delete ${user.name}?`,
      text: "This action is permanent! All their listings and data will be wiped.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Yes, Delete Permanently"
    });

    if (!result.isConfirmed) return;

    try {
      await client.delete(`/api/super-admin/users/${user.unique_id}`);
      setUsers(users.filter(u => u.unique_id !== user.unique_id));
      Swal.fire("Deleted!", "User has been removed.", "success");
    } catch (err) {
      Swal.fire("Error", "Could not delete user.", "error");
    }
  };

  // 2. BAN / UNBAN USER (Now with Reason!)
  const handleToggleBan = async (user) => {
    const isBanning = !user.is_banned;
    
    // Config for Ban vs Unban
    const title = isBanning ? `Ban ${user.name}?` : `Unban ${user.name}?`;
    const text = isBanning 
        ? "They will be logged out immediately." 
        : "They will regain access to the platform.";
    const confirmColor = isBanning ? "#ea580c" : "#16a34a";
    const confirmText = isBanning ? "Yes, Ban User" : "Yes, Restore Access";

    // If Banning, we ask for a REASON
    let reason = null;

    if (isBanning) {
        const { value: banReason, isDismissed } = await Swal.fire({
            title: title,
            input: 'text',
            inputLabel: 'Reason for ban (Optional)',
            inputPlaceholder: 'e.g. Violation of posting rules',
            text: text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: confirmColor,
            confirmButtonText: confirmText
        });

        if (isDismissed) return; // User cancelled
        reason = banReason || "Violation of Terms"; // Default reason
    } else {
        // Simple confirm for unbanning
        const result = await Swal.fire({
            title: title,
            text: text,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: confirmColor,
            confirmButtonText: confirmText
        });
        if (!result.isConfirmed) return;
    }

    try {
      // Send data to backend
      const res = await client.put(`/api/super-admin/users/${user.unique_id}/ban`, { 
        is_banned: isBanning,
        ban_reason: reason 
      });
      
      // Update local state instantly
      setUsers(users.map(u => 
        u.unique_id === user.unique_id ? { 
            ...u, 
            is_banned: isBanning, 
            ban_reason: reason 
        } : u
      ));
      
      toast.success(res.data.message);
    } catch (err) {
      toast.error("Action failed.");
      console.error(err);
    }
  };

  // --- FILTERING LOGIC ---
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(search.toLowerCase()) || 
      user.email.toLowerCase().includes(search.toLowerCase());
    
    const matchesRole = filterRole === "all" || user.role === filterRole;

    return matchesSearch && matchesRole;
  });

  return (
    <div className={style.container}>
      {/* Header */}
      <div className={style.header}>
        <div>
          <h1>User Management</h1>
          <p>Oversee, manage, and control all registered accounts.</p>
        </div>
        <div className={style.dateBadge}>
          {users.length} Total Users
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "20px", flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ flex: 1, position: "relative", minWidth: "250px" }}>
          <Search size={18} style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              width: "100%", padding: "12px 12px 12px 45px", borderRadius: "10px", 
              border: "1px solid #e2e8f0", fontSize: "0.95rem", outline: "none" 
            }}
          />
        </div>

        {/* Role Filter (REMOVED DEVELOPER) */}
        <div style={{ position: "relative" }}>
          <Filter size={18} style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
          <select 
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{ 
              padding: "12px 12px 12px 45px", borderRadius: "10px", border: "1px solid #e2e8f0", 
              background: "white", fontSize: "0.95rem", cursor: "pointer", outline: "none" 
            }}
          >
            <option value="all">All Roles</option>
            <option value="agent">Agents</option>
            <option value="owner">Owners</option>
            <option value="buyer">Buyers</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className={style.activityCard}>
        <table className={style.table}>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: "center", padding: "40px" }}>Loading users...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: "center", padding: "40px" }}>No users found.</td></tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.unique_id}>
                  <td>
                    <div className={style.userCell}>
                      <div style={{ 
                        width: "36px", height: "36px", borderRadius: "50%", 
                        background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "14px", fontWeight: "bold", color: "#64748b"
                      }}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ color: "#0f172a" }}>{user.name}</div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      padding: "4px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase",
                      background: user.role === 'agent' ? '#e0f2fe' : user.role === 'owner' ? '#f3e8ff' : '#f1f5f9',
                      color: user.role === 'agent' ? '#0369a1' : user.role === 'owner' ? '#7e22ce' : '#475569'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    {user.is_banned ? (
                      <span className={`${style.statusPill} ${style.pillWarning}`} style={{ background: "#fee2e2", color: "#b91c1c", display:"flex", alignItems:"center", gap:"5px" }}>
                        <Ban size={12} /> Banned
                      </span>
                    ) : (
                      <span className={`${style.statusPill} ${style.pillSuccess}`}>Active</span>
                    )}
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td style={{ textAlign: "right" }}>
                    <button 
                      onClick={() => handleToggleBan(user)}
                      title={user.is_banned ? "Unban User" : "Ban User"}
                      style={{ 
                        background: "none", border: "none", cursor: "pointer", marginRight: "10px",
                        color: user.is_banned ? "#16a34a" : "#ea580c"
                      }}
                    >
                      {user.is_banned ? <CheckCircle size={18} /> : <Ban size={18} />}
                    </button>
                    
                    <button 
                      onClick={() => handleDelete(user)}
                      title="Delete Permanently"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SuperAdminUsers;