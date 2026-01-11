import React, { useEffect, useState, useRef, useMemo } from "react";
import { getNames } from "country-list";
import Swal from "sweetalert2";
import { toast } from 'react-toastify';
import client from "../api/axios";
import styles from "../styles/profile.module.css";
import { useAuth } from "../context/AuthProvider.jsx";
import {
  User, Mail, Phone, MapPin, Globe, Camera,
  X, Home, DollarSign, Calendar, UploadCloud,
  Loader2, Briefcase, Info, Send
} from "lucide-react";

// ✅ HELPER: Generate a consistent color based on the user's name
const getAvatarColor = (name) => {
  if (!name) return "#09707D"; 
  const colors = [
    "#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5",
    "#2196F3", "#03A9F4", "#00BCD4", "#009688", "#4CAF50",
    "#8BC34A", "#CDDC39", "#FFC107", "#FF9800", "#FF5722", 
    "#795548", "#607D8B"
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const BuyerProfile = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  /* ------------------ Countries ------------------ */
  const countries = useMemo(() => {
    return Array.from(new Set(getNames())).sort((a, b) => a.localeCompare(b));
  }, []);

  /* ------------------ Form State ------------------ */
  const [form, setForm] = useState({
    username: "", full_name: user?.name || "", email: user?.email || "",
    phone: "", gender: "", country: "", city: "", bio: "",
    // Buyer Preferences
    preferred_location: "", budget_min: "", budget_max: "",
    property_type: "", move_in_date: "",
  });

  const [initialForm, setInitialForm] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [remoteAvatarUrl, setRemoteAvatarUrl] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  
  // Modals
  const [showImageModal, setShowImageModal] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  /* ------------------ Fetch Profile ------------------ */
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await client.get("/api/profile");
      const data = res.data || {};

      const profileData = {
        username: data.username || "",
        full_name: data.full_name || user?.name || "",
        email: data.email || user?.email || "",
        phone: data.phone || "",
        gender: data.gender || "",
        country: data.country || "",
        city: data.city || "",
        bio: data.bio || "",
        preferred_location: data.preferred_location || "",
        budget_min: data.budget_min || "",
        budget_max: data.budget_max || "",
        property_type: data.property_type || "",
        move_in_date: data.move_in_date || "",
      };

      setForm(profileData);
      setInitialForm(profileData);
      setRemoteAvatarUrl(data.avatar_url || null);

      updateUser({
        name: profileData.full_name,
        avatar_url: data.avatar_url || null,
      });
    } catch (err) {
      console.error("Profile fetch error:", err);
      toast.error("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  /* ------------------ Handlers ------------------ */
  const handleCameraClick = () => {
      if(fileInputRef.current) fileInputRef.current.click();
  };

  const onSelectAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const executeSave = async () => {
    // Basic Validation
    if (!form.full_name.trim()) return toast.warning("Full Name is required.");
    
    setSaving(true);
    try {
      // 1. Upload Avatar
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        const avatarRes = await client.put("/api/profile/avatar", formData);
        
        const newUrl = avatarRes.data.avatar_url;
        setRemoteAvatarUrl(newUrl);
        updateUser({ avatar_url: newUrl });
        setAvatarFile(null);
      }

      // 2. Update Profile
      const res = await client.put("/api/profile", form);
      const updated = res.data.profile || form;

      setForm(updated);
      setInitialForm(updated);
      setEditing(false);
      updateUser({ name: updated.full_name });

      toast.success("Profile Updated Successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (id, label, icon, type = "text", disabled = false) => (
    <div className={styles.inputGroup}>
      <label htmlFor={id} className={styles.label}>{icon} {label}</label>
      <input
        id={id} type={type}
        className={`${styles.input} ${disabled ? styles.inputDisabled : ""}`}
        value={form[id] || ""}
        onChange={(e) => setForm({ ...form, [id]: e.target.value })}
        disabled={disabled || !editing} 
        readOnly={disabled} 
        placeholder={!editing ? "" : `Enter ${label}`}
      />
    </div>
  );

  // ✅ Render Dynamic Avatar
  const renderAvatar = () => {
    const source = avatarPreview || remoteAvatarUrl;
    if (source) {
        return (
            <img 
                src={source} 
                alt="Avatar" 
                className={styles.avatar} 
                onClick={() => setShowImageModal(true)} 
            />
        );
    }

    const name = form.full_name?.trim() || "User";
    const nameParts = name.split(" ");
    const initials = nameParts.length > 1 
        ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase() 
        : nameParts[0][0]?.toUpperCase() || "U";

    const bgColor = getAvatarColor(name);

    return (
        <div 
            className={styles.avatar} 
            onClick={() => setShowImageModal(true)}
            style={{
                backgroundColor: bgColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '40px', fontWeight: '600', cursor: 'pointer', letterSpacing: '1px'
            }}
        >
            {initials}
        </div>
    );
  };

  // ✅ LOADING STATE
  if (loading) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <Loader2 size={50} color="#09707D" className="animate-spin" />
            <p style={{ marginTop: '15px', color: '#09707D', fontSize: '18px', fontWeight: '600' }}>Loading profile...</p>
        </div>
    );
  }

  return (
    <div className={styles.container}>
      
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
            <h1>Buyer Profile</h1>
            <p>Manage your preferences & account details</p>
        </div>
      </div>

      {/* Main Layout */}
      <div className={styles.layout}>
        {/* Left Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.avatarCard}>
            <div className={styles.avatarWrapper}>
                
                {renderAvatar()}
                
                {editing && (
                    <button className={styles.cameraBtn} onClick={handleCameraClick} type="button">
                        <Camera size={18} />
                    </button>
                )}
                
                <input type="file" hidden accept="image/*" ref={fileInputRef} onChange={onSelectAvatar} />
            </div>
            
            <div className={styles.userInfo}>
                <h2 className={styles.userName}>{form.full_name || "User Name"}</h2>
                <p className={styles.userRole}>Home Buyer</p>
                <div className={styles.locationTag}>
                    <MapPin size={14} /> {form.city || "City"}, {form.country || "Country"}
                </div>
            </div>

            <div className={styles.actionButtons}>
                <button 
                    className={editing ? styles.cancelBtn : styles.editBtn} 
                    onClick={editing ? () => {setEditing(false); setForm(initialForm); setAvatarFile(null); setAvatarPreview(null);} : () => setEditing(true)} 
                    disabled={saving}
                >
                    {editing ? <><X size={18} /> Cancel</> : <><User size={18} /> Edit Profile</>}
                </button>
                
                {editing && (
                    <button className={styles.saveBtn} onClick={executeSave} disabled={saving}>
                        {saving ? "Saving..." : <><Send size={18} /> Save Changes</>}
                    </button>
                )}
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className={styles.content}>
            <div className={styles.tabs}>
                {[{ id: "profile", label: "Personal Info", icon: <User size={18}/> }, { id: "preferences", label: "Buying Preferences", icon: <Home size={18}/> }].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ""}`}>
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            <div className={styles.tabContent}>
                
                {/* 1. PERSONAL INFO TAB */}
                {activeTab === "profile" && (
                    <div className={styles.formGrid}>
                        {renderInput("username", "Username", <User size={16}/>)}
                        {renderInput("full_name", "Full Name", <User size={16}/>)}
                        {renderInput("email", "Email", <Mail size={16}/>, "email", true)}
                        {renderInput("phone", "Phone Number", <Phone size={16}/>)}
                        {renderInput("city", "City", <MapPin size={16}/>)}
                        
                        <div className={styles.inputGroup}>
                            <label className={styles.label}><Globe size={16}/> Country</label>
                            <select id="country" className={styles.select} value={form.country} onChange={(e) => setForm({...form, country: e.target.value})} disabled={!editing}>
                                <option value="">Select Country</option>
                                {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}><User size={16}/> Gender</label>
                            <select id="gender" className={styles.select} value={form.gender} onChange={(e) => setForm({...form, gender: e.target.value})} disabled={!editing}>
                                <option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option>
                            </select>
                        </div>

                        <div className={styles.inputGroupFull} style={{marginTop: 20}}>
                            <label className={styles.label}><Info size={16}/> About Me</label>
                            <textarea rows={4} className={styles.textarea} value={form.bio} onChange={(e) => setForm({...form, bio: e.target.value})} disabled={!editing} placeholder="Tell agents what you are looking for..." />
                        </div>
                    </div>
                )}

                {/* 2. PREFERENCES TAB */}
                {activeTab === "preferences" && (
                    <div className={styles.formGrid}>
                        {renderInput("budget_min", "Min Budget", <DollarSign size={16}/>, "number")}
                        {renderInput("budget_max", "Max Budget", <DollarSign size={16}/>, "number")}
                        
                        <div className={styles.inputGroup}>
                            <label className={styles.label}><Home size={16}/> Property Type</label>
                            <select id="property_type" className={styles.select} value={form.property_type} onChange={(e) => setForm({...form, property_type: e.target.value})} disabled={!editing}>
                                <option value="">Any Type</option>
                                <option value="Apartment">Apartment</option>
                                <option value="Duplex">Duplex</option>
                                <option value="Detached House">Detached House</option>
                                <option value="Bungalow">Bungalow</option>
                                <option value="Land">Land</option>
                            </select>
                        </div>

                        {renderInput("preferred_location", "Preferred Areas", <MapPin size={16}/>)}
                        {renderInput("move_in_date", "Target Move-in Date", <Calendar size={16}/>, "date")}
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className={styles.modalOverlay} onClick={() => setShowImageModal(false)}>
            <div className={styles.modalContent}>
                {(avatarPreview || remoteAvatarUrl) ? (
                    <img src={avatarPreview || remoteAvatarUrl} alt="Full" />
                ) : (
                    <div style={{
                        width: '100%', height: '100%', minHeight: '300px',
                        backgroundColor: getAvatarColor(form.full_name),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '100px', fontWeight: 'bold', borderRadius: '8px'
                    }}>
                        {(() => {
                            const n = form.full_name?.trim() || "User";
                            const parts = n.split(" ");
                            return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0][0]?.toUpperCase();
                        })()}
                    </div>
                )}
            </div>
        </div>
      )}

    </div>
  );
};

export default BuyerProfile;