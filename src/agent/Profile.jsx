import React, { useEffect, useState } from "react";
import client from "../api/axios"; 
import styles from "../styles/profile.module.css";
import defaultPerson from "../assets/person.png";
import { useAuth } from "../context/AuthProvider.jsx";
import { toast } from 'react-toastify'; 
import {
  User, Mail, Phone, MapPin, Building, FileText, Briefcase, Globe,
  Camera, Save, X, Instagram, Facebook, Linkedin, Twitter, Info,
  Share2, CheckCircle2, ShieldAlert
} from "lucide-react";

const Profile = () => {
  const { user, updateUser } = useAuth();

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
  
  const [verificationStatus, setVerificationStatus] = useState("pending");
  const [rejectionReason, setRejectionReason] = useState("");

  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("profile");
  const [showImageModal, setShowImageModal] = useState(false);

  // ------------------ Fetch Profile ------------------
  const fetchProfile = async () => {
    try {
      const res = await client.get("/api/profile");
      const data = res.data || {}; // Ensure data is object
      
      // ✅ ROBUST MAPPING: Prefer Profile DB -> Then User Context -> Then Empty
      const profileData = {
        username: data.username || "",
        full_name: data.full_name || user?.name || "",
        email: data.email || user?.email || "",
        
        // 🔒 Locked Fields (Critical Fix)
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
      
      setVerificationStatus(data.verification_status || "pending"); 
      setRejectionReason(data.rejection_reason || "");

      // Sync Context
      updateUser({
        name: profileData.full_name,
        avatar_url: data.avatar_url || null,
        phone: profileData.phone,
        country: profileData.country
      });

    } catch (err) {
      console.error("Profile fetch error:", err);
      // Don't toast error immediately on load, just log it.
      // Falls back to user context defaults set above if API fails.
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  // ------------------ Avatar & Validation ------------------
  const onSelectAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = "Username is required.";
    if (!form.full_name.trim()) e.full_name = "Full name is required.";
    // Removed strict city validation to allow saving partial profile
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      // 1. Upload Avatar if changed
      let newAvatarUrl = remoteAvatarUrl;
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        const avatarRes = await client.put("/api/avatar", formData, { headers: { "Content-Type": "multipart/form-data" }});
        newAvatarUrl = avatarRes.data.avatar_url;
        setRemoteAvatarUrl(newAvatarUrl);
        updateUser({ avatar_url: newAvatarUrl });
      }

      // 2. Update Profile
      // Ensure phone/country are sent back even if disabled (just in case backend needs them)
      await client.put("/api/profile", form);
      
      setForm((f) => ({ ...f }));
      setInitialForm((f) => ({ ...f }));
      setEditing(false);
      setVerificationStatus('pending'); 
      updateUser({ name: form.full_name });

      toast.success("Profile Updated Successfully!");

    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  // ------------------ Render Input Helper ------------------
  const renderInput = (id, label, icon, type = "text", disabled = false) => (
    <div className={styles.inputGroup}>
      <label htmlFor={id} className={styles.label}>{icon} {label}</label>
      <input
        id={id} type={type}
        className={`${styles.input} ${errors[id] ? styles.errorBorder : ""} ${disabled ? styles.inputDisabled : ""}`}
        value={form[id] || ""}
        onChange={(e) => setForm({ ...form, [id]: e.target.value })}
        disabled={disabled || !editing} 
        readOnly={disabled} 
        placeholder={!editing ? "" : `Enter ${label}`}
        style={disabled ? { backgroundColor: '#f9f9f9', cursor: 'not-allowed', color: '#666' } : {}}
      />
      {errors[id] && <span className={styles.errorText}>{errors[id]}</span>}
    </div>
  );

  return (
    <div className={styles.container}>
      {/* ToastContainer is handled in SideNav */}
      
      <div className={styles.header}>
        <div className={styles.headerContent}>
            <h1>Agent Profile</h1>
            <p>Manage your public identity</p>
        </div>
      </div>

      {/* Verification Status Banner */}
      <div className={styles.layout} style={{display:'block', marginBottom:0}}>
        {verificationStatus === 'pending' && <div className={`${styles.statusBanner} ${styles.statusWarning}`}><Info size={24} /><div><strong>Profile Under Review</strong><p style={{margin:0}}>Limited access until approved.</p></div></div>}
        {verificationStatus === 'rejected' && <div className={`${styles.statusBanner} ${styles.statusRejected}`}><ShieldAlert size={24} /><div><strong>Verification Failed</strong><p style={{margin:0}}>Reason: {rejectionReason}</p></div></div>}
        {verificationStatus === 'approved' && <div className={`${styles.statusBanner} ${styles.statusVerified}`}><CheckCircle2 size={24} /><div><strong>Verified Agent</strong><p style={{margin:0}}>Profile is public.</p></div></div>}
      </div>

      <div className={styles.layout}>
        {/* Left Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.avatarCard}>
            <div className={styles.avatarWrapper}>
                <img src={avatarPreview || remoteAvatarUrl || defaultPerson} alt="Avatar" className={styles.avatar} onClick={() => setShowImageModal(true)} />
                {editing && <label className={styles.cameraBtn}><Camera size={20} /><input type="file" hidden accept="image/*" onChange={onSelectAvatar} /></label>}
            </div>
            <h2 className={styles.userName}>{form.full_name || "User Name"}</h2>
            
            <div className={`${styles.badge} ${verificationStatus === 'approved' ? styles.badgeVerified : verificationStatus === 'rejected' ? styles.badgeRejected : styles.badgePending}`}>
                {verificationStatus === 'approved' ? <CheckCircle2 size={12}/> : <Info size={12}/>} {verificationStatus.toUpperCase()}
            </div>

            <p className={styles.userRole}>Real Estate Agent</p>
            <div className={styles.locationTag}><MapPin size={14} /> {form.city || "City"}, {form.country || "Country"}</div>
            
            <button className={editing ? styles.cancelBtn : styles.editBtn} onClick={editing ? () => {setEditing(false); setForm(initialForm);} : () => setEditing(true)} disabled={saving}>
                {editing ? <><X size={18} /> Cancel</> : <><Briefcase size={18} /> Edit Profile</>}
            </button>
            
            {editing && <button className={styles.saveBtn} onClick={onSave} disabled={saving}>{saving ? "Saving..." : <><Save size={18} /> Submit</>}</button>}
          </div>
        </div>

        {/* Right Content */}
        <div className={styles.content}>
            <div className={styles.tabs}>
                {[{ id: "profile", label: "Overview", icon: <User size={18}/> }, { id: "about", label: "Bio", icon: <Info size={18}/> }, { id: "socials", label: "Socials", icon: <Share2 size={18}/> }].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ""}`}>{tab.icon} {tab.label}</button>
                ))}
            </div>

            {activeTab === "profile" && (
                <div className={styles.formGrid}>
                    {renderInput("username", "Username", <User size={16}/>)}
                    {renderInput("full_name", "Full Name", <FileText size={16}/>)}
                    {renderInput("email", "Email", <Mail size={16}/>, "email", true)}
                    
                    {/* ✅ PHONE & COUNTRY ARE PERMANENTLY DISABLED (passed true) */}
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
                <div><div className={styles.inputGroupFull}><label className={styles.label}><Info size={16}/> Bio</label><textarea rows={8} className={styles.textarea} value={form.bio} onChange={(e) => setForm({...form, bio: e.target.value})} disabled={!editing} placeholder="Tell us about yourself..." /></div></div>
            )}

            {activeTab === "socials" && (
                <div><div className={styles.socialGrid}>{renderInput("social_instagram", "Instagram", <Instagram size={16}/>)}{renderInput("social_facebook", "Facebook", <Facebook size={16}/>)}{renderInput("social_linkedin", "LinkedIn", <Linkedin size={16}/>)}{renderInput("social_twitter", "Twitter", <Twitter size={16}/>)}{renderInput("social_tiktok", "TikTok", <Share2 size={16}/>)}</div></div>
            )}
        </div>
      </div>

      {showImageModal && <div className={styles.modalOverlay} onClick={() => setShowImageModal(false)}><div className={styles.modalContent}><img src={avatarPreview || remoteAvatarUrl || defaultPerson} alt="Full" /></div></div>}
    </div>
  );
};

export default Profile;