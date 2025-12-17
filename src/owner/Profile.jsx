import React, { useEffect, useState, useMemo } from "react";
import { getNames } from "country-list";
import Swal from "sweetalert2";
import client from "../api/axios"; // Adjust path if needed
import styles from "../styles/profile.module.css"; // Reuse existing profile CSS
import defaultPerson from "../assets/person.png"; // Adjust path if needed
import { useAuth } from "../context/AuthProvider.jsx";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  FileText,
  Briefcase,
  Globe,
  Camera,
  Save,
  X,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Info,
  Share2
} from "lucide-react";

const OwnerProfile = () => {
  const { user, updateUser } = useAuth();

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
    company_name: "", // Replaces agency_name for owners
    experience: "",   // Years investing/owning
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
        phone: data.phone ?? "",
        gender: data.gender ?? "",
        country: data.country ?? "",
        city: data.city ?? "",
        bio: data.bio ?? "",
        company_name: data.agency_name ?? "", // Map DB 'agency_name' to 'company_name' for UI
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
      setErrors({});

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

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  // ------------------ Avatar Logic ------------------
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const onSelectAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((p) => ({ ...p, avatar: "Please select an image file." }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((p) => ({ ...p, avatar: "Image must be under 5MB." }));
      return;
    }

    setErrors((p) => ({ ...p, avatar: undefined }));
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
    if (!form.full_name.trim()) e.full_name = "Full name is required.";
    if (!form.phone.trim()) e.phone = "Phone is required.";
    if (!form.country) e.country = "Required.";
    if (!form.city.trim()) e.city = "Required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = async () => {
    if (!validate()) {
      Swal.fire({ icon: 'error', title: 'Oops...', text: 'Please check the required fields.' });
      return;
    }

    setSaving(true);
    try {
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        
        const avatarRes = await client.put("/api/avatar", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });

        const newAvatarUrl = avatarRes.data.avatar_url;
        setRemoteAvatarUrl(newAvatarUrl);
        setAvatarFile(null);
        updateUser({ avatar_url: newAvatarUrl });
      }

      // Map UI 'company_name' back to DB 'agency_name'
      const payload = { ...form, agency_name: form.company_name };

      const res = await client.put("/api/profile", payload);

      const updatedProfile = res.data.profile;
      
      // Update local state
      const mappedProfile = {
          ...updatedProfile,
          company_name: updatedProfile.agency_name // Remap back for UI
      };

      setForm((f) => ({ ...f, ...mappedProfile }));
      setInitialForm((f) => ({ ...f, ...mappedProfile }));
      setEditing(false);

      updateUser({ name: updatedProfile.full_name });

      Swal.fire({
        icon: "success",
        title: "Saved!",
        text: "Your profile has been updated.",
        timer: 1500,
        showConfirmButton: false,
      });

    } catch (err) {
      console.error("Save error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err?.response?.data?.message || "Failed to update profile.",
      });
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
        onChange={onChange}
        disabled={!editing || disabled}
        placeholder={!editing ? "" : `Enter ${label}`}
      />
      {errors[id] && <span className={styles.errorText}>{errors[id]}</span>}
    </div>
  );

  if (loading) return <div className="p-8 text-center">Loading profile...</div>;

  return (
    <div className={styles.container}>
      {/* --- Header / Cover --- */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
            <h1>Landlord Profile</h1>
            <p>Manage your public identity and contact details</p>
        </div>
      </div>

      <div className={styles.layout}>
        
        {/* --- LEFT SIDEBAR (Avatar & Quick Info) --- */}
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
            
            <h2 className={styles.userName}>{form.full_name || "Landlord Name"}</h2>
            <p className={styles.userRole}>Property Owner</p>
            
            <div className={styles.locationTag}>
                <MapPin size={14} />
                {form.city || "City"}, {form.country || "Country"}
            </div>

            <button 
                className={editing ? styles.cancelBtn : styles.editBtn} 
                onClick={editing ? onCancel : () => setEditing(true)}
                disabled={saving}
            >
                {editing ? <><X size={18} /> Cancel</> : <><Briefcase size={18} /> Edit Profile</>}
            </button>

            {editing && (
                <button className={styles.saveBtn} onClick={onSave} disabled={saving}>
                    {saving ? "Saving..." : <><Save size={18} /> Save Changes</>}
                </button>
            )}
          </div>
        </div>

        {/* --- RIGHT CONTENT (Tabs & Forms) --- */}
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
                    {renderInput("phone", "Phone Number", <Phone size={16}/>)}
                    
                    {/* Owner Specific Fields */}
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
                <div>
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

export default OwnerProfile;