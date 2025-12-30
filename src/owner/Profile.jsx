import React, { useEffect, useState, useMemo, useRef } from "react";
import { getNames } from "country-list";
import Swal from "sweetalert2";
import client from "../api/axios"; 
import styles from "../styles/profile.module.css"; 
import { useAuth } from "../context/AuthProvider.jsx";
import { toast } from 'react-toastify';
import {
  User, Mail, Phone, MapPin, Building, FileText, Briefcase, Globe,
  Camera, Save, X, Instagram, Facebook, Linkedin, Twitter, Info,
  Share2, CheckCircle2, ShieldAlert, AlertTriangle, UploadCloud, Clock, Sparkles, Send, RefreshCw, Loader2
} from "lucide-react";

// ✅ HELPER: Generate Consistent Color
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

const OwnerProfile = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  // ------------------ Countries ------------------
  const countries = useMemo(() => {
    const extras = ["Taiwan", "Kosovo"];
    return Array.from(new Set([...getNames(), ...extras])).sort((a, b) =>
      a.localeCompare(b)
    );
  }, []);

  // ------------------ Form State ------------------
  const [form, setForm] = useState({
    username: "",
    full_name: user?.name || "",
    email: user?.email || "",
    phone: "",
    gender: "",
    country: "",
    city: "",
    bio: "",
    company_name: "", // agency_name in DB
    experience: "",   // experience in DB
    social_tiktok: "",
    social_instagram: "",
    social_facebook: "",
    social_linkedin: "",
    social_twitter: "",
  });

  const [initialForm, setInitialForm] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [remoteAvatarUrl, setRemoteAvatarUrl] = useState(null);
  
  // Status Tracking
  const [verificationStatus, setVerificationStatus] = useState("new"); 
  const [rejectionReason, setRejectionReason] = useState("");

  const [loading, setLoading] = useState(true); // Initial loading
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("profile");
  
  // Modals
  const [showImageModal, setShowImageModal] = useState(false);

  // ------------------ Fetch Profile ------------------
  const fetchProfile = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await client.get("/api/profile");
      const data = res.data || {};
      
      const profileData = {
        username: data.username ?? "",
        full_name: data.full_name ?? user?.name ?? "",
        email: data.email ?? user?.email ?? "",
        phone: data.phone ?? "",
        gender: data.gender ?? "",
        country: data.country ?? "",
        city: data.city ?? "",
        bio: data.bio ?? "",
        company_name: data.agency_name ?? "", 
        experience: data.experience ?? "",
        social_tiktok: data.social_tiktok ?? "",
        social_instagram: data.social_instagram ?? "",
        social_facebook: data.social_facebook ?? "",
        social_linkedin: data.social_linkedin ?? "",
        social_twitter: data.social_twitter ?? "",
      };

      setForm(profileData);
      setInitialForm(profileData);
      setRemoteAvatarUrl(data.avatar_url || null);
      
      setVerificationStatus(data.verification_status || "new");
      setRejectionReason(data.rejection_reason || "");
      setErrors({});

      updateUser({
        name: profileData.full_name,
        avatar_url: data.avatar_url || null,
        phone: profileData.phone,
        country: profileData.country
      });

      if (isManualRefresh) toast.success("Status refreshed!");

    } catch (err) {
      console.error("Profile fetch error:", err);
      if (isManualRefresh) toast.error("Failed to refresh.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  // ------------------ Avatar Logic ------------------
  const onSelectAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // ------------------ Form Handlers ------------------
  const onChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = "Username is required.";
    // Full name is read-only, but strict check anyway
    if (!form.full_name.trim()) e.full_name = "Full name is required.";
    if (!form.phone.trim()) e.phone = "Phone is required.";
    if (!form.country) e.country = "Required.";
    if (!form.city.trim()) e.city = "Required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ✅ Handle Save Request (With Warning)
  const handleSaveRequest = async () => {
    if (!validate()) {
        toast.error("Please fill in required fields.");
        return;
    }

    // New User Validation
    if (verificationStatus === 'new' && !avatarFile && !remoteAvatarUrl) {
        toast.error("Please upload a profile photo to complete registration.");
        return;
    }

    // Approved User Warning
    if (verificationStatus === 'approved') {
        const result = await Swal.fire({
            title: 'Update Profile?',
            text: "Modifying your profile will reset your status to 'Pending'. An admin must re-approve you.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#09707D',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, update it!'
        });

        if (!result.isConfirmed) return;
    }

    executeSave();
  };

  const executeSave = async () => {
    setSaving(true);
    try {
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        
        const avatarRes = await client.put("/api/profile/avatar", formData);
        const newAvatarUrl = avatarRes.data.avatar_url;
        
        setRemoteAvatarUrl(newAvatarUrl);
        setAvatarFile(null);
        updateUser({ avatar_url: newAvatarUrl });
      }

      // Map UI 'company_name' back to DB 'agency_name'
      const payload = { ...form, agency_name: form.company_name };

      const res = await client.put("/api/profile", payload);
      const updatedProfile = res.data.profile;
      
      const mappedProfile = {
          ...updatedProfile,
          company_name: updatedProfile.agency_name 
      };

      setForm((f) => ({ ...f, ...mappedProfile }));
      setInitialForm((f) => ({ ...f, ...mappedProfile }));
      setEditing(false);
      setVerificationStatus('pending'); // Optimistic Update

      updateUser({ name: updatedProfile.full_name });

      toast.success("Submitted for review!", { icon: "🚀" });

    } catch (err) {
      console.error("Save error:", err);
      toast.error(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => {
    setEditing(false);
    setErrors({});
    setAvatarFile(null);
    setAvatarPreview(null);
    setForm(initialForm);
  };

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

    // Initials Logic
    const name = form.full_name?.trim() || "User";
    const nameParts = name.split(" ");
    let initials = "";
    if (nameParts.length > 1) {
        initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    } else {
        initials = nameParts[0][0]?.toUpperCase() || "U";
    }
    const bgColor = getAvatarColor(name);

    return (
        <div 
            className={styles.avatar} 
            onClick={() => setShowImageModal(true)}
            style={{
                backgroundColor: bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '48px',
                fontWeight: 'bold',
                cursor: 'pointer',
                objectFit: 'cover'
            }}
        >
            {initials}
        </div>
    );
  };

  // ------------------ Render Input Helper ------------------
  const renderInput = (id, label, icon, type = "text", disabled = false) => (
    <div className={styles.inputGroup}>
      <label htmlFor={id} className={styles.label}>
        {icon} {label}
      </label>
      <input
        id={id}
        type={type}
        className={`${styles.input} ${errors[id] ? styles.errorBorder : ""}`}
        value={form[id] || ""}
        onChange={onChange}
        disabled={!editing || disabled}
        placeholder={!editing ? "" : `Enter ${label}`}
      />
      {errors[id] && <span className={styles.errorText}>{errors[id]}</span>}
    </div>
  );

  // ------------------ Loading State (Brand Color & Animated) ------------------
  if (loading) {
      return (
          <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '80vh' 
          }}>
              {/* ✅ Guaranteed Spin Animation */}
              <style>{`
                  @keyframes spin { 100% { transform: rotate(360deg); } }
                  .custom-spinner { animation: spin 1s linear infinite; }
              `}</style>
              
              <Loader2 size={50} color="#09707D" className="custom-spinner" />
              
              <p style={{ 
                  marginTop: '15px', 
                  color: '#09707D', 
                  fontSize: '18px', 
                  fontWeight: '600' 
              }}>
                  Loading profile...
              </p>
          </div>
      );
  }

  return (
    <div className={styles.container}>
      
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
            <h1>Landlord Profile</h1>
            <p>Manage your public identity & properties</p>
        </div>
        <div className={styles.headerActions}>
             
             <button 
                className={styles.refreshBtn} 
                onClick={() => fetchProfile(true)}
                disabled={refreshing}
                title="Refresh Status"
             >
                <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} /> Refresh
             </button>

             {/* Status Badge */}
             <div className={`${styles.statusPill} ${
                verificationStatus === 'approved' ? styles.statusVerified : 
                verificationStatus === 'rejected' ? styles.statusRejected : 
                verificationStatus === 'pending' ? styles.statusPending : ''
             }`} style={verificationStatus === 'new' ? {display:'none'} : {}}>
                {verificationStatus === 'approved' && <><CheckCircle2 size={16} /> APPROVED</>}
                {verificationStatus === 'pending' && <><Clock size={16} /> PENDING</>}
                {verificationStatus === 'rejected' && <><AlertTriangle size={16} /> REJECTED</>}
            </div>
        </div>
      </div>

      {/* --- Status Banners --- */}
      {(verificationStatus === 'new' || !verificationStatus) && (
        <div className={styles.actionBox}>
            <Sparkles size={24} className={styles.actionIcon} />
            <div>
                <strong>Complete Your Profile</strong>
                <p>Welcome! To start listing properties, please fill out your details and upload a photo.</p>
            </div>
        </div>
      )}

      {verificationStatus === 'pending' && (
        <div className={styles.infoBox}>
            <Clock size={24} className={styles.infoIcon} />
            <div>
                <strong>Profile Under Review</strong>
                <p>Thanks for submitting! Our team is reviewing your details.</p>
            </div>
        </div>
      )}

      {verificationStatus === 'rejected' && (
        <div className={styles.errorBox}>
            <ShieldAlert size={24} className={styles.errorIcon} />
            <div>
                <strong>Verification Rejected:</strong> 
                <p>{rejectionReason || "Please fix your profile details."}</p>
            </div>
        </div>
      )}

      {/* Main Layout */}
      <div className={styles.layout}>
        
        {/* --- LEFT SIDEBAR (Avatar & Quick Info) --- */}
        <div className={styles.sidebar}>
          <div className={styles.avatarCard}>
            <div className={styles.avatarWrapper}>
                
                {renderAvatar()}

                {editing && (
                    <label className={styles.cameraBtn}>
                        <Camera size={20} />
                        <input type="file" hidden accept="image/*" onChange={onSelectAvatar} />
                    </label>
                )}
            </div>
            
            <h2 className={styles.userName}>{form.full_name || "Landlord Name"}</h2>
            <p className={styles.userRole}>Property Owner</p>
            
            <div className={styles.locationTag}>
                <MapPin size={14} />
                {form.city || "City"}, {form.country || "Country"}
            </div>

            <div className={styles.actionButtons}>
                <button 
                    className={editing ? styles.cancelBtn : styles.editBtn} 
                    onClick={editing ? onCancel : () => setEditing(true)}
                    disabled={saving}
                >
                    {editing ? <><X size={18} /> Cancel</> : <><Briefcase size={18} /> Edit Profile</>}
                </button>

                {editing && (
                    <button className={styles.saveBtn} onClick={handleSaveRequest} disabled={saving}>
                        {saving ? "Saving..." : <><Save size={18} /> {verificationStatus === 'new' ? "Submit" : "Update"}</>}
                    </button>
                )}
            </div>
          </div>
        </div>

        {/* --- RIGHT CONTENT (Tabs & Forms) --- */}
        <div className={styles.content}>
            
            <div className={styles.tabs}>
                {[
                    { id: "profile", label: "Overview", icon: <User size={18}/> },
                    { id: "about", label: "About & Bio", icon: <Info size={18}/> },
                    { id: "socials", label: "Social Media", icon: <Share2 size={18}/> },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ""}`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            <div className={styles.tabContent}>
                {/* --- TAB: PROFILE --- */}
                {activeTab === "profile" && (
                    <div className={styles.formGrid}>
                        {renderInput("username", "Username", <User size={16}/>)}
                        
                        {/* ✅ FULL NAME LOCKED (READ ONLY) */}
                        {renderInput("full_name", "Full Name", <FileText size={16}/>, "text", true)}
                        
                        {renderInput("email", "Email Address", <Mail size={16}/>, "email", true)}
                        {renderInput("phone", "Phone Number", <Phone size={16}/>)}
                        
                        {renderInput("company_name", "Company Name", <Building size={16}/>)}
                        {renderInput("experience", "Years as Landlord", <Briefcase size={16}/>)}
                        {renderInput("city", "City", <MapPin size={16}/>)}
                        
                        <div className={styles.inputGroup}>
                            <label className={styles.label}><Globe size={16}/> Country</label>
                            <select 
                                id="country" 
                                className={styles.select} 
                                value={form.country} 
                                onChange={onChange}
                                disabled={!editing}
                            >
                                <option value="">Select Country</option>
                                {countries.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {errors.country && <span className={styles.errorText}>{errors.country}</span>}
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}><User size={16}/> Gender</label>
                            <select 
                                id="gender" 
                                className={styles.select} 
                                value={form.gender} 
                                onChange={onChange}
                                disabled={!editing}
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Prefer not to say">Prefer not to say</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* --- TAB: ABOUT --- */}
                {activeTab === "about" && (
                    <div className={styles.inputGroupFull}>
                        <label htmlFor="bio" className={styles.label}>
                            <Info size={16}/> Bio / About Me
                        </label>
                        <textarea
                            id="bio"
                            rows={8}
                            className={styles.textarea}
                            value={form.bio}
                            onChange={onChange}
                            disabled={!editing}
                            placeholder="Tell potential tenants about yourself or your property management style..."
                        />
                    </div>
                )}

                {/* --- TAB: SOCIALS --- */}
                {activeTab === "socials" && (
                    <div className={styles.socialGrid}>
                        {renderInput("social_instagram", "Instagram", <Instagram size={16}/>)}
                        {renderInput("social_facebook", "Facebook", <Facebook size={16}/>)}
                        {renderInput("social_linkedin", "LinkedIn", <Linkedin size={16}/>)}
                        {renderInput("social_twitter", "Twitter / X", <Twitter size={16}/>)}
                        {renderInput("social_tiktok", "TikTok", <Share2 size={16}/>)}
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Image Modal (Supports Initials) */}
      {showImageModal && (
        <div className={styles.modalOverlay} onClick={() => setShowImageModal(false)}>
            <div className={styles.modalContent}>
                {(avatarPreview || remoteAvatarUrl) ? (
                    <img src={avatarPreview || remoteAvatarUrl} alt="Full" />
                ) : (
                    <div style={{
                        width: '100%', 
                        height: '100%', 
                        minHeight: '300px', 
                        backgroundColor: getAvatarColor(form.full_name),
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '100px', 
                        fontWeight: 'bold',
                        borderRadius: '8px' 
                    }}>
                        {(() => {
                            const n = form.full_name?.trim() || "User";
                            const parts = n.split(" ");
                            return parts.length > 1 
                                ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() 
                                : parts[0][0]?.toUpperCase();
                        })()}
                    </div>
                )}
            </div>
        </div>
      )}

    </div>
  );
};

export default OwnerProfile;