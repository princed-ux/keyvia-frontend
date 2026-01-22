import React, { useEffect, useState, useMemo, useRef } from "react";
import Swal from "sweetalert2";
import client from "../api/axios"; 
import styles from "../styles/profile.module.css"; 
import { useAuth } from "../context/AuthProvider.jsx";
import { toast } from 'react-toastify';
import {
  User, Mail, Phone, MapPin, Building, FileText, Briefcase, Globe,
  Camera, Save, X, Instagram, Facebook, Linkedin, Twitter, Info,
  Share2, CheckCircle2, ShieldAlert, AlertTriangle, Sparkles, RefreshCw, Loader2, Clock, UploadCloud
} from "lucide-react";

// ✅ Import Countries & Cities Logic
import { COUNTRIES } from "../data/countries"; 
import { City } from 'country-state-city'; 

// ✅ 1. Import Hook
import useAutoFetch from '../hooks/useAutoFetch';

// ✅ HELPER: Generate Consistent Color
const getAvatarColor = (name) => {
  if (!name) return "#09707D"; 
  const colors = ["#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5", "#2196F3", "#03A9F4", "#00BCD4", "#009688", "#4CAF50", "#8BC34A", "#CDDC39", "#FFC107", "#FF9800", "#FF5722", "#795548", "#607D8B"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const OwnerProfile = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  // ------------------ Form State ------------------
  const [form, setForm] = useState({
    username: "", full_name: user?.name || "", email: user?.email || "",
    phone: "", gender: "", country: "", city: "", bio: "",
    company_name: "", experience: "", 
    social_tiktok: "", social_instagram: "", social_facebook: "", social_linkedin: "", social_twitter: "",
  });

  const [initialForm, setInitialForm] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [remoteAvatarUrl, setRemoteAvatarUrl] = useState(null);
  
  // Status Tracking
  const [verificationStatus, setVerificationStatus] = useState("new"); 
  const [rejectionReason, setRejectionReason] = useState("");

  const [loading, setLoading] = useState(true); 
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("profile");
  
  // Modals
  const [showImageModal, setShowImageModal] = useState(false);
  const [showUploadGuideline, setShowUploadGuideline] = useState(false);

  // 🏙️ City Autocomplete State
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  // ------------------ Fetch Profile (Updated) ------------------
  const fetchProfile = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    // Don't set loading(true) if it's an auto-refresh to prevent UI flash
    else if (!initialForm.email) setLoading(true);

    try {
      const res = await client.get("/api/profile");
      const data = res.data || {};
      
      const validCountry = (data.country && data.country !== "Unknown") 
                           ? data.country 
                           : (user?.country && user.country !== "Unknown" ? user.country : "");

      const validPhone = data.phone || user?.phone || "";

      const profileData = {
        username: data.username ?? "",
        full_name: data.full_name ?? user?.name ?? "",
        email: data.email ?? user?.email ?? "",
        phone: validPhone,
        country: validCountry,
        
        gender: data.gender ?? "",
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

      // Only update form if NOT editing
      if (!editing) {
          setForm(profileData);
          setInitialForm(profileData);
          setRemoteAvatarUrl(data.avatar_url || null);
          setVerificationStatus(data.verification_status || "new");
          setRejectionReason(data.rejection_reason || "");
          setErrors({});
      }

      updateUser({
        name: profileData.full_name,
        avatar_url: data.avatar_url || null,
        phone: validPhone,
        country: validCountry
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

  // ✅ 2. Use the Hook
  useAutoFetch(fetchProfile);

  // =========================================================
  // 🏙️ CITY LOGIC
  // =========================================================

  const currentCountryCode = useMemo(() => {
      const c = COUNTRIES.find(c => c.name === form.country);
      const rawCode = c ? (c.iso || c.code || c.iso2) : null;
      return rawCode ? rawCode.toUpperCase() : null;
  }, [form.country]);

  const citiesOfCountry = useMemo(() => {
      if (!currentCountryCode) return [];
      return City.getCitiesOfCountry(currentCountryCode);
  }, [currentCountryCode]);

  const handleCityChange = (e) => {
      const val = e.target.value;
      setForm(prev => ({ ...prev, city: val }));

      if (!val || val.length === 0) {
          setShowCityDropdown(false);
          return;
      }

      const matches = citiesOfCountry.filter(c => 
          c.name.toLowerCase().startsWith(val.toLowerCase())
      ).slice(0, 10);
      
      setCitySuggestions(matches);
      setShowCityDropdown(matches.length > 0);
  };

  const selectCity = (cityName) => {
      setForm(prev => ({...prev, city: cityName}));
      setShowCityDropdown(false);
  };

  // ------------------ Avatar Logic ------------------
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

  // ------------------ Save Logic ------------------
  const onChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = "Username is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveRequest = async () => {
    if (!validate()) {
        toast.error("Please fill in required fields.");
        return;
    }
    if (verificationStatus === 'new' && !avatarFile && !remoteAvatarUrl) {
        toast.error("Please upload a profile photo to complete registration.");
        return;
    }
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
        setRemoteAvatarUrl(avatarRes.data.avatar_url);
        setAvatarFile(null);
        updateUser({ avatar_url: avatarRes.data.avatar_url });
      }

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
      setVerificationStatus('pending'); 
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

  // --- Render Helpers --- (Same as before)
  const renderInput = (id, label, icon, type = "text", disabled = false) => (
    <div className={styles.inputGroup}>
      <label htmlFor={id} className={styles.label}>
        {icon} {label}
      </label>
      <input
        id={id}
        type={type}
        className={`${styles.input} ${errors[id] ? styles.errorBorder : ""} ${disabled ? styles.inputDisabled : ""}`}
        value={form[id] || ""}
        onChange={onChange}
        disabled={!editing || disabled}
        placeholder={!editing ? "" : `Enter ${label}`}
      />
      {errors[id] && <span className={styles.errorText}>{errors[id]}</span>}
    </div>
  );

  const renderCountryInput = () => {
      const countryObj = COUNTRIES.find(c => c.name === form.country);
      const flag = countryObj?.flag || "🌍"; 
      const displayCountry = form.country || "Select via Edit";

      return (
        <div className={styles.inputGroup}>
            <label className={styles.label}><Globe size={16}/> Country</label>
            <div className={`${styles.input} ${styles.inputDisabled}`} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <img src={flag} alt="" style={{width: 20, borderRadius: 2}} />
                <span>{displayCountry}</span>
            </div>
        </div>
      );
  };

  const renderCityInput = () => (
      <div className={styles.inputGroup} style={{position: 'relative'}}>
          <label htmlFor="city" className={styles.label}><MapPin size={16}/> City</label>
          <input
            id="city"
            className={`${styles.input} ${errors.city ? styles.errorBorder : ""}`}
            value={form.city || ""}
            onChange={handleCityChange}
            disabled={!editing}
            placeholder={!editing ? "" : "Start typing city..."}
            autoComplete="off"
            onFocus={() => editing && form.city && handleCityChange({target: {value: form.city}})}
            onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
          />
          {errors.city && <span className={styles.errorText}>{errors.city}</span>}
          
          {showCityDropdown && editing && (
              <div className={styles.cityDropdown}>
                  {citySuggestions.map((c) => (
                      <div key={c.name} className={styles.cityOption} onClick={() => selectCity(c.name)}>
                          {c.name}
                      </div>
                  ))}
                  {citySuggestions.length === 0 && (
                      <div className={styles.cityOption} style={{color: '#999', cursor: 'default'}}>No cities found</div>
                  )}
              </div>
          )}
      </div>
  );

  const renderAvatar = () => {
    const source = avatarPreview || remoteAvatarUrl;
    if (source) {
        return <img src={source} alt="Avatar" className={styles.avatar} onClick={() => setShowImageModal(true)} />;
    }
    const name = form.full_name?.trim() || "User";
    const nameParts = name.split(" ");
    let initials = nameParts.length > 1 ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase() : nameParts[0][0]?.toUpperCase() || "U";
    const bgColor = getAvatarColor(name);
    return (
        <div className={styles.avatar} onClick={() => setShowImageModal(true)} style={{backgroundColor: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '48px', fontWeight: 'bold', cursor: 'pointer', objectFit: 'cover'}}>
            {initials}
        </div>
    );
  };

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
      
      <div className={styles.header}>
        <div className={styles.headerContent}>
            <h1>Landlord Profile</h1>
            <p>Manage your public identity & properties</p>
        </div>
        <div className={styles.headerActions}>
             <button className={styles.refreshBtn} onClick={() => fetchProfile(true)} disabled={refreshing} title="Refresh Status">
                <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} /> Refresh
             </button>
             <div className={`${styles.statusPill} ${verificationStatus === 'approved' ? styles.statusVerified : verificationStatus === 'rejected' ? styles.statusRejected : verificationStatus === 'pending' ? styles.statusPending : ''}`} style={verificationStatus === 'new' ? {display:'none'} : {}}>
                {verificationStatus === 'approved' && <><CheckCircle2 size={16} /> APPROVED</>}
                {verificationStatus === 'pending' && <><Clock size={16} /> PENDING</>}
                {verificationStatus === 'rejected' && <><AlertTriangle size={16} /> REJECTED</>}
            </div>

            <button 
                className={styles.viewPublicBtn} 
                onClick={() => window.open(`/profile/@${form.username || user?.unique_id}`, '_blank')}
                title="View Public Profile"
                style={{
                    display:'flex', alignItems:'center', gap:'8px', padding:'8px 16px', 
                    background:'white', border:'1px solid #ddd', borderRadius:'8px', 
                    cursor:'pointer', fontWeight:'600', color:'#333', marginRight: '10px'
                }}
            >
                <Globe size={18}/> View Public
            </button>
        </div>
      </div>

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
            <div><strong>Profile Under Review</strong><p>Thanks for submitting! Our team is reviewing your details.</p></div>
        </div>
      )}
      {verificationStatus === 'rejected' && (
        <div className={styles.errorBox}>
            <ShieldAlert size={24} className={styles.errorIcon} />
            <div><strong>Verification Rejected:</strong> <p>{rejectionReason || "Please fix your profile details."}</p></div>
        </div>
      )}

      <div className={styles.layout}>
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
                <h2 className={styles.userName}>{form.full_name || "Landlord Name"}</h2>
                <p className={styles.userRole}>Property Owner</p>
                <div className={styles.locationTag}>
                    <MapPin size={14} /> {form.city || "City"}, {form.country || "Country"}
                </div>
            </div>

            <div className={styles.actionButtons}>
                <button className={editing ? styles.cancelBtn : styles.editBtn} onClick={editing ? onCancel : () => setEditing(true)} disabled={saving}>
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

        <div className={styles.content}>
            <div className={styles.tabs}>
                {[{ id: "profile", label: "Overview", icon: <User size={18}/> }, { id: "about", label: "About & Bio", icon: <Info size={18}/> }, { id: "socials", label: "Social Media", icon: <Share2 size={18}/> }].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ""}`}>
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            <div className={styles.tabContent}>
                {activeTab === "profile" && (
                    <div className={styles.formGrid}>
                        {renderInput("username", "Username", <User size={16}/>)}
                        {renderInput("full_name", "Full Name", <FileText size={16}/>, "text", true)}
                        {renderInput("email", "Email Address", <Mail size={16}/>, "email", true)}
                        {renderCountryInput()}
                        {renderInput("phone", "Phone Number", <Phone size={16}/>, "tel", true)}
                        
                        {renderInput("company_name", "Company Name", <Building size={16}/>)}
                        {renderInput("experience", "Years as Landlord", <Briefcase size={16}/>)}
                        
                        {renderCityInput()}
                        
                        <div className={styles.inputGroup}>
                            <label className={styles.label}><User size={16}/> Gender</label>
                            <select id="gender" className={styles.select} value={form.gender} onChange={onChange} disabled={!editing}>
                                <option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option>
                            </select>
                        </div>
                    </div>
                )}

                {activeTab === "about" && (
                    <div className={styles.inputGroupFull}>
                        <label className={styles.label}><Info size={16}/> Bio / About Me</label>
                        <textarea rows={8} className={styles.textarea} value={form.bio} onChange={onChange} disabled={!editing} placeholder="Tell potential tenants about yourself..." />
                    </div>
                )}

                {activeTab === "socials" && (
                    <div className={styles.socialGrid}>
                        {renderInput("social_instagram", "Instagram", <Instagram size={16}/>)}
                        {renderInput("social_facebook", "Facebook", <Facebook size={16}/>)}
                        {renderInput("social_linkedin", "LinkedIn", <Linkedin size={16}/>)}
                        {renderInput("social_twitter", "Twitter / X", <Twitter size={16}/>)}
                    </div>
                )}
            </div>
        </div>
      </div>

      {showImageModal && (
        <div className={styles.modalOverlay} onClick={() => setShowImageModal(false)}>
            <div className={styles.modalContent}>
                {(avatarPreview || remoteAvatarUrl) ? <img src={avatarPreview || remoteAvatarUrl} alt="Full" /> : null}
            </div>
        </div>
      )}

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
                    </ul>
                </div>
                <div className={styles.guidelineActions}>
                    <button className={styles.cancelBtn} onClick={() => setShowUploadGuideline(false)}>Cancel</button>
                    <button className={styles.confirmBtn} onClick={handleProceedToUpload}>
                        <UploadCloud size={18} /> Select Photo
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default OwnerProfile;