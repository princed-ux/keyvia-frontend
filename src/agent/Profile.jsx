import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import client from "../api/axios"; 
import styles from "../styles/profile.module.css";
import defaultPerson from "../assets/person.png";
import { useAuth } from "../context/AuthProvider.jsx";
import { COUNTRIES } from "../data/countries"; // ✅ Import Country Data
import {
  User, Mail, Phone, MapPin, Building, FileText, Briefcase, Globe,
  Camera, Save, X, Instagram, Facebook, Linkedin, Twitter, Info,
  Share2, CheckCircle2, AlertTriangle, ShieldAlert
} from "lucide-react";

const Profile = () => {
  const { user, updateUser } = useAuth();

  // ------------------ Form State ------------------
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    email: "",
    phone: "",
    gender: "",
    country: "",
    city: "",
    bio: "",
    agency_name: "",
    license_number: "", // Optional but boosts approval
    experience: "",
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
  
  // ✅ Verification State
  const [verificationStatus, setVerificationStatus] = useState("pending"); // pending | approved | rejected
  const [rejectionReason, setRejectionReason] = useState("");
  const [dialCode, setDialCode] = useState(""); // Holds +234, etc.

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("profile");
  const [showImageModal, setShowImageModal] = useState(false);

  // ------------------ Fetch Profile ------------------
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await client.get("/api/profile");
      const data = res.data;
      
      const profileData = {
        username: data.username ?? "",
        full_name: data.full_name ?? user?.name ?? "",
        email: data.email ?? user?.email ?? "",
        phone: data.phone ?? "", // Should ideally store number without code, or split it
        gender: data.gender ?? "",
        country: data.country ?? "",
        city: data.city ?? "",
        bio: data.bio ?? "",
        agency_name: data.agency_name ?? "",
        license_number: data.license_number ?? "",
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
      
      // ✅ Set Verification Status from Backend
      setVerificationStatus(data.verification_status || "pending"); 
      setRejectionReason(data.rejection_reason || "");

      // ✅ Set Initial Dial Code
      const foundCountry = COUNTRIES.find(c => c.name === data.country);
      if (foundCountry) setDialCode(foundCountry.code);

      updateUser({
        name: profileData.full_name,
        avatar_url: data.avatar_url || null,
      });

    } catch (err) {
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  // ------------------ Country & Phone Logic ------------------
  const handleCountryChange = (e) => {
    const selectedCountryName = e.target.value;
    const countryData = COUNTRIES.find(c => c.name === selectedCountryName);
    
    setForm(prev => ({ ...prev, country: selectedCountryName }));
    if (countryData) {
        setDialCode(countryData.code);
    } else {
        setDialCode("");
    }
  };

  // ------------------ Avatar Logic ------------------
  const onSelectAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((p) => ({ ...p, avatar: "Please select an image file." }));
      return;
    }
    setErrors((p) => ({ ...p, avatar: undefined }));
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // ------------------ Validation & Save ------------------
  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = "Username is required.";
    if (!form.full_name.trim()) e.full_name = "Full name is required.";
    if (!form.phone.trim()) e.phone = "Phone is required.";
    if (!form.gender) e.gender = "Required.";
    if (!form.country) e.country = "Required.";
    if (!form.city.trim()) e.city = "Required.";
    
    // ✅ Enforce Profile Picture for Verification
    if (!remoteAvatarUrl && !avatarFile) {
        Swal.fire("Profile Picture Required", "To verify your identity, a profile picture is required.", "warning");
        return false;
    }

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
        const avatarRes = await client.put("/api/avatar", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        newAvatarUrl = avatarRes.data.avatar_url;
        setRemoteAvatarUrl(newAvatarUrl);
        updateUser({ avatar_url: newAvatarUrl });
      }

      // 2. Combine Phone with Code (Optional: Backend usually prefers E.164 format)
      // Here we just save the form. We assume 'phone' is the number user typed.
      // You might want to save `full_phone: ${dialCode}${form.phone}` in backend.
      
      const payload = { ...form };
      
      // ✅ Trigger Verification Reset: If editing, status goes back to Pending
      if (verificationStatus === 'rejected' || verificationStatus === 'approved') {
         // Backend logic usually handles setting this to 'pending' on update
      }

      const res = await client.put("/api/profile", payload);
      const updatedProfile = res.data.profile;
      
      setForm((f) => ({ ...f, ...updatedProfile }));
      setInitialForm((f) => ({ ...f, ...updatedProfile }));
      
      // ✅ Update Frontend Status immediately to Pending (Optimistic UI)
      setVerificationStatus('pending');
      
      setEditing(false);
      updateUser({ name: updatedProfile.full_name });

      Swal.fire({
        icon: "success",
        title: "Profile Submitted!",
        text: "Your changes have been sent to Admin for review. Your account features may be limited until approved.",
        confirmButtonColor: "#09707d"
      });

    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  // ------------------ Render Helpers ------------------
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
        onChange={(e) => setForm({ ...form, [id]: e.target.value })}
        disabled={!editing || disabled}
        placeholder={!editing ? "" : `Enter ${label}`}
      />
      {errors[id] && <span className={styles.errorText}>{errors[id]}</span>}
    </div>
  );

  return (
    <div className={styles.container}>
      {/* --- Header --- */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
            <h1>Agent Profile</h1>
            <p>Manage your public identity and credentials</p>
        </div>
      </div>

      {/* --- Verification Warning Banner --- */}
      <div className={styles.layout} style={{display:'block', marginBottom:0}}>
        {verificationStatus === 'pending' && (
            <div className={`${styles.statusBanner} ${styles.statusWarning}`}>
                <Info size={24} />
                <div>
                    <strong>Profile Under Review</strong>
                    <p style={{margin:0}}>You cannot post listings or fund your wallet until an Admin approves your profile updates.</p>
                </div>
            </div>
        )}
        {verificationStatus === 'rejected' && (
            <div className={`${styles.statusBanner} ${styles.statusRejected}`}>
                <ShieldAlert size={24} />
                <div>
                    <strong>Verification Failed</strong>
                    <p style={{margin:0}}>Reason: {rejectionReason || "Incomplete information"}. Please edit your profile to fix these issues.</p>
                </div>
            </div>
        )}
        {verificationStatus === 'approved' && (
            <div className={`${styles.statusBanner} ${styles.statusVerified}`}>
                <CheckCircle2 size={24} />
                <div>
                    <strong>Verified Agent</strong>
                    <p style={{margin:0}}>Your profile is public. You can post listings and access all features.</p>
                </div>
            </div>
        )}
      </div>

      <div className={styles.layout}>
        
        {/* --- LEFT SIDEBAR --- */}
        <div className={styles.sidebar}>
          <div className={styles.avatarCard}>
            <div className={styles.avatarWrapper}>
                <img
                  src={avatarPreview || remoteAvatarUrl || defaultPerson}
                  alt="Avatar"
                  className={styles.avatar}
                  onClick={() => setShowImageModal(true)}
                />
                {editing && (
                    <label className={styles.cameraBtn}>
                        <Camera size={20} />
                        <input type="file" hidden accept="image/*" onChange={onSelectAvatar} />
                    </label>
                )}
            </div>
            
            <h2 className={styles.userName}>{form.full_name || "User Name"}</h2>
            
            {/* Status Badge */}
            <div className={`${styles.badge} ${
                verificationStatus === 'approved' ? styles.badgeVerified : 
                verificationStatus === 'rejected' ? styles.badgeRejected : 
                styles.badgePending
            }`}>
                {verificationStatus === 'approved' ? <CheckCircle2 size={12}/> : <Info size={12}/>}
                {verificationStatus.toUpperCase()}
            </div>

            <p className={styles.userRole}>Real Estate Agent</p>
            
            <div className={styles.locationTag}>
                <MapPin size={14} />
                {form.city || "City"}, {form.country || "Country"}
            </div>

            <button 
                className={editing ? styles.cancelBtn : styles.editBtn} 
                onClick={editing ? () => {setEditing(false); setForm(initialForm);} : () => setEditing(true)}
                disabled={saving}
            >
                {editing ? <><X size={18} /> Cancel</> : <><Briefcase size={18} /> Edit Profile</>}
            </button>

            {editing && (
                <button className={styles.saveBtn} onClick={onSave} disabled={saving}>
                    {saving ? "Saving..." : <><Save size={18} /> Submit for Review</>}
                </button>
            )}
          </div>
        </div>

        {/* --- RIGHT CONTENT --- */}
        <div className={styles.content}>
            
            {/* Tabs */}
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

            {/* --- TAB: PROFILE --- */}
            {activeTab === "profile" && (
                <div className={styles.formGrid}>
                    {renderInput("username", "Username", <User size={16}/>)}
                    {renderInput("full_name", "Full Name", <FileText size={16}/>)}
                    {renderInput("email", "Email Address", <Mail size={16}/>, "email", true)}
                    
                   {/* Country Select with Image Flags */}
<div className={styles.inputGroup}>
  <label className={styles.label}>
    <Globe size={16} /> Country
  </label>

  <div className={styles.countrySelectWrapper}>
    {/* Selected Country Flag */}
    {form.country && (
      <img
        src={COUNTRIES.find(c => c.name === form.country)?.flag}
        alt={form.country}
        className={styles.countryFlag}
      />
    )}

    <select
      id="country"
      className={styles.select}
      value={form.country}
      onChange={handleCountryChange} // ✅ updates phone dial code
      disabled={!editing}
    >
      <option value="">Select Country</option>
      {COUNTRIES.map(c => (
        <option key={c.iso} value={c.name}>
          {c.name}
        </option>
      ))}
    </select>
  </div>

  {errors.country && (
    <span className={styles.errorText}>{errors.country}</span>
  )}
</div>

                    {/* Phone Input with Country Flag + Dial Code */}
<div className={styles.inputGroup}>
  <label className={styles.label}>
    <Phone size={16} /> Phone Number
  </label>

  <div className={styles.phoneGroup}>
    {/* Flag + Dial Code */}
    <div className={styles.dialBox}>
      {form.country ? (
        <>
          <img
            src={COUNTRIES.find(c => c.name === form.country)?.flag}
            alt={form.country}
            className={styles.phoneFlag}
          />
          <span className={styles.dialCode}>
            {dialCode}
          </span>
        </>
      ) : (
        <span className={styles.dialPlaceholder}>🌐</span>
      )}
    </div>

    <input
      type="tel"
      className={styles.phoneInput}
      placeholder="801 234 5678"
      value={form.phone}
      onChange={(e) =>
        setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })
      }
      disabled={!editing}
    />
  </div>

  {errors.phone && (
    <span className={styles.errorText}>{errors.phone}</span>
  )}
</div>

                    
                    {renderInput("agency_name", "Agency Name (Optional)", <Building size={16}/>)}
                    {renderInput("license_number", "License No. (Optional)", <Briefcase size={16}/>)}
                    {renderInput("experience", "Experience (Years)", <CheckCircle2 size={16}/>)}
                    {renderInput("city", "City", <MapPin size={16}/>)}
                    
                    <div className={styles.inputGroup}>
                        <label className={styles.label}><User size={16}/> Gender</label>
                        <select 
                            id="gender" 
                            className={styles.select} 
                            value={form.gender} 
                            onChange={(e) => setForm({...form, gender: e.target.value})}
                            disabled={!editing}
                        >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                         {errors.gender && <span className={styles.errorText}>{errors.gender}</span>}
                    </div>
                </div>
            )}

            {/* --- TAB: ABOUT --- */}
            {activeTab === "about" && (
                <div>
                    <div className={styles.inputGroupFull}>
                        <label htmlFor="bio" className={styles.label}>
                            <Info size={16}/> Professional Bio
                        </label>
                        <textarea
                            id="bio"
                            rows={8}
                            className={styles.textarea}
                            value={form.bio}
                            onChange={(e) => setForm({...form, bio: e.target.value})}
                            disabled={!editing}
                            placeholder="Tell clients about your experience, specialties, and why they should choose you..."
                        />
                    </div>
                </div>
            )}

            {/* --- TAB: SOCIALS --- */}
            {activeTab === "socials" && (
                <div>
                    <div className={styles.socialGrid}>
                        {renderInput("social_instagram", "Instagram", <Instagram size={16}/>)}
                        {renderInput("social_facebook", "Facebook", <Facebook size={16}/>)}
                        {renderInput("social_linkedin", "LinkedIn", <Linkedin size={16}/>)}
                        {renderInput("social_twitter", "Twitter / X", <Twitter size={16}/>)}
                        {renderInput("social_tiktok", "TikTok", <Share2 size={16}/>)}
                    </div>
                </div>
            )}

        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className={styles.modalOverlay} onClick={() => setShowImageModal(false)}>
            <div className={styles.modalContent}>
                <img src={avatarPreview || remoteAvatarUrl || defaultPerson} alt="Full" />
            </div>
        </div>
      )}

    </div>
  );
};

export default Profile;