import React, { useEffect, useState, useRef } from "react";
import client from "../api/axios"; 
import styles from "../styles/profile.module.css";
import { useAuth } from "../context/AuthProvider.jsx";
import { toast } from 'react-toastify'; 
import Swal from "sweetalert2"; 
import {
  User, Mail, Phone, MapPin, Building, FileText, Briefcase, Globe,
  Camera, X, Instagram, Facebook, Linkedin, Twitter, Info,
  Share2, CheckCircle2, ShieldAlert, AlertTriangle, UploadCloud, Clock, Sparkles, Send, RefreshCw, Loader2
} from "lucide-react";

// ✅ HELPER: Generate a consistent color based on the user's name
const getAvatarColor = (name) => {
  if (!name) return "#09707D"; // Brand color fallback
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

const Profile = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  // ------------------ Form State ------------------
  const [form, setForm] = useState({
    username: "", full_name: "", email: "", 
    phone: "", gender: "", country: "", city: "", 
    bio: "", agency_name: "", license_number: "", experience: "", 
    social_tiktok: "", social_instagram: "", social_facebook: "", social_linkedin: "", social_twitter: "",
  });

  const [initialForm, setInitialForm] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [remoteAvatarUrl, setRemoteAvatarUrl] = useState(null);
  
  // Status Tracking
  const [verificationStatus, setVerificationStatus] = useState("new"); 
  const [rejectionReason, setRejectionReason] = useState("");
  
  const [loading, setLoading] = useState(true); // ✅ Initial Loading State
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  
  // Modals
  const [showImageModal, setShowImageModal] = useState(false);
  const [showUploadGuideline, setShowUploadGuideline] = useState(false);

  // ------------------ Fetch Profile ------------------
  const fetchProfile = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await client.get("/api/profile");
      const data = res.data || {}; 
      
      const profileData = {
        username: data.username || "",
        full_name: data.full_name || user?.name || "",
        email: data.email || user?.email || "",
        phone: data.phone || user?.phone || "", 
        country: data.country || user?.country || "", 
        license_number: data.license_number || user?.license_number || "", 
        experience: data.experience || user?.experience || "", 
        gender: data.gender || "",
        city: data.city || "",
        bio: data.bio || "",
        agency_name: data.agency_name || "",
        social_tiktok: data.social_tiktok || "",
        social_instagram: data.social_instagram || "",
        social_facebook: data.social_facebook || "",
        social_linkedin: data.social_linkedin || "",
        social_twitter: data.social_twitter || "",
      };

      setForm(profileData);
      setInitialForm(profileData);
      setRemoteAvatarUrl(data.avatar_url || user?.avatar_url || null);
      
      setVerificationStatus(data.verification_status || "new"); 
      setRejectionReason(data.rejection_reason || "");
      
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

  // ------------------ Handlers ------------------
  const handleCameraClick = () => setShowUploadGuideline(true);

  const handleProceedToUpload = () => {
    setShowUploadGuideline(false);
    if(fileInputRef.current) fileInputRef.current.click();
  };

  const onSelectAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // ✅ Wrapper to handle Warnings before Saving
  const handleSaveRequest = async () => {
    // 1. Validation: New User MUST upload photo
    if (verificationStatus === 'new' && !avatarFile && !remoteAvatarUrl) {
        toast.error("Please upload a profile photo to complete registration.");
        return;
    }

    // 2. Warning: If user is APPROVED, warn them about losing status
    if (verificationStatus === 'approved') {
        const result = await Swal.fire({
            title: 'Update Profile?',
            text: "Modifying your profile will reset your status to 'Pending'. An admin must re-approve you before your listings go live again.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#09707D',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, update it!'
        });

        if (!result.isConfirmed) return; // Stop if they cancel
    }

    // 3. Proceed to Save
    executeSave();
  };

  const executeSave = async () => {
    setSaving(true);
    try {
      // 1. Upload Avatar (Only if changed)
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        const avatarRes = await client.put("/api/profile/avatar", formData);
        
        setRemoteAvatarUrl(avatarRes.data.avatar_url);
        updateUser({ avatar_url: avatarRes.data.avatar_url });
        setAvatarFile(null); 
      }

      // 2. Update Text Profile
      await client.put("/api/profile", form);
      
      setForm((f) => ({ ...f }));
      setInitialForm((f) => ({ ...f }));
      setEditing(false);
      
      // ✅ Optimistic Update: Set status to pending immediately
      setVerificationStatus('pending'); 
      updateUser({ name: form.full_name });

      toast.success("Submitted for review!", { icon: "🚀" });

    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile.");
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

  const hasPhoto = !!remoteAvatarUrl || !!avatarFile;

  // ✅ Render Dynamic Avatar (Image or Initials)
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

    // Generate Initials (e.g., "John Doe" -> "JD")
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
                fontSize: '40px',
                fontWeight: '600',
                cursor: 'pointer',
                letterSpacing: '1px'
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
            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .custom-spinner { animation: spin 1s linear infinite; }
            `}</style>
            <Loader2 size={50} color="#09707D" className="custom-spinner" />
            <p style={{ marginTop: '15px', color: '#09707D', fontSize: '18px', fontWeight: '600' }}>Loading profile...</p>
        </div>
    );
  }

  return (
    <div className={styles.container}>
      
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
            <h1>Agent Profile</h1>
            <p>Manage your public identity & credentials</p>
        </div>
        <div className={styles.headerActions}>
             
             {/* Refresh Button */}
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
                <p>Welcome! To start listing properties, please fill out your details and upload a photo. Click <strong>"Edit Profile"</strong> to begin.</p>
            </div>
        </div>
      )}

      {verificationStatus === 'pending' && (
        <div className={styles.infoBox}>
            <Clock size={24} className={styles.infoIcon} />
            <div>
                <strong>Profile Under Review</strong>
                <p>Thanks for submitting! Our team is reviewing your details (approx 2-3 mins).</p>
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
        {/* Left Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.avatarCard}>
            <div className={styles.avatarWrapper}>
                
                {/* ✅ Render the Dynamic Avatar */}
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
                <p className={styles.userRole}>Real Estate Agent</p>
                <div className={styles.locationTag}>
                    <MapPin size={14} /> {form.city || "City"}, {form.country || "Country"}
                </div>
            </div>

            <div className={styles.actionButtons}>
                <button 
                    className={editing ? styles.cancelBtn : styles.editBtn} 
                    onClick={editing ? () => {setEditing(false); setForm(initialForm);} : () => setEditing(true)} 
                    disabled={saving}
                >
                    {editing ? <><X size={18} /> Cancel</> : <><Briefcase size={18} /> Edit Profile</>}
                </button>
                
                {editing && (
                    /* ✅ Call handleSaveRequest instead of onSave */
                    <button className={styles.saveBtn} onClick={handleSaveRequest} disabled={saving}>
                        {saving ? "Saving..." : <><Send size={18} /> {verificationStatus === 'new' ? "Submit for Approval" : "Update Profile"}</>}
                    </button>
                )}
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className={styles.content}>
            <div className={styles.tabs}>
                {[{ id: "profile", label: "Overview", icon: <User size={18}/> }, { id: "about", label: "Bio", icon: <Info size={18}/> }, { id: "socials", label: "Socials", icon: <Share2 size={18}/> }].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ""}`}>
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            <div className={styles.tabContent}>
                {activeTab === "profile" && (
                    <div className={styles.formGrid}>
                        {renderInput("username", "Username", <User size={16}/>)}
                        {/* ✅ Full Name LOCKED */}
                        {renderInput("full_name", "Full Name", <FileText size={16}/>, "text", true)}
                        {renderInput("email", "Email", <Mail size={16}/>, "email", true)}
                        {renderInput("country", "Country", <Globe size={16}/>, "text", true)} 
                        {renderInput("phone", "Phone Number", <Phone size={16}/>, "text", true)}
                        {renderInput("agency_name", "Agency Name", <Building size={16}/>)}
                        {renderInput("license_number", "License No.", <Briefcase size={16}/>)}
                        {renderInput("experience", "Experience (Years)", <CheckCircle2 size={16}/>)}
                        {renderInput("city", "City", <MapPin size={16}/>)}
                        
                        <div className={styles.inputGroup}>
                            <label className={styles.label}><User size={16}/> Gender</label>
                            <select id="gender" className={styles.select} value={form.gender} onChange={(e) => setForm({...form, gender: e.target.value})} disabled={!editing}>
                                <option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option>
                            </select>
                        </div>
                    </div>
                )}

                {activeTab === "about" && (
                    <div className={styles.inputGroupFull}>
                        <label className={styles.label}><Info size={16}/> Bio</label>
                        <textarea rows={10} className={styles.textarea} value={form.bio} onChange={(e) => setForm({...form, bio: e.target.value})} disabled={!editing} placeholder="Tell us about yourself..." />
                    </div>
                )}

                {activeTab === "socials" && (
                    <div className={styles.socialGrid}>
                        {renderInput("social_instagram", "Instagram", <Instagram size={16}/>)}
                        {renderInput("social_facebook", "Facebook", <Facebook size={16}/>)}
                        {renderInput("social_linkedin", "LinkedIn", <Linkedin size={16}/>)}
                        {renderInput("social_twitter", "Twitter", <Twitter size={16}/>)}
                        {renderInput("social_tiktok", "TikTok", <Share2 size={16}/>)}
                    </div>
                )}
            </div>
        </div>
      </div>

      {showImageModal && (
        <div className={styles.modalOverlay} onClick={() => setShowImageModal(false)}>
            <div className={styles.modalContent}>
                {/* ✅ Modal now supports Large Letter Avatar */}
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
                        fontSize: '100px', // Large text for modal
                        fontWeight: 'bold',
                        borderRadius: '8px' 
                    }}>
                        {/* Same logic for the modal display */}
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

      {/* --- UPLOAD GUIDELINE MODAL --- */}
      {showUploadGuideline && (
        <div className={styles.modalOverlay}>
            <div className={styles.guidelineModal}>
                <div className={styles.guidelineHeader}>
                    <AlertTriangle size={32} className={styles.guidelineIcon} />
                    <h3>Photo Upload Rules</h3>
                </div>
                <div className={styles.guidelineBody}>
                    <p>To verify your identity, you must upload a valid photo.</p>
                    <ul className={styles.rulesList}>
                        <li>✅ <strong>Real Photo:</strong> A clear picture of yourself.</li>
                        <li>✅ <strong>Professional:</strong> Straight face, decent dressing.</li>
                        <li>❌ <strong>No Animations:</strong> No cartoons, anime, or avatars.</li>
                        <li>❌ <strong>No Styles/Forming:</strong> No heavy filters, side poses, or covering face.</li>
                    </ul>
                    <p className={styles.warningText}>
                        Photos that are not well-mannered or unclear will be <strong>rejected</strong> by the admin immediately.
                    </p>
                </div>
                <div className={styles.guidelineActions}>
                    <button className={styles.cancelBtn} onClick={() => setShowUploadGuideline(false)}>Cancel</button>
                    
                    {/* ✅ DYNAMIC BUTTON TEXT */}
                    <button className={styles.confirmBtn} onClick={handleProceedToUpload}>
                        <UploadCloud size={18} /> I Understand, {hasPhoto ? "Change Photo" : "Select Photo"}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default Profile;