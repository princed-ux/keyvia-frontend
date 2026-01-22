import React, { useEffect, useState, useRef, useMemo } from "react";
import { toast } from 'react-toastify';
import client from "../api/axios";
import styles from "../styles/profile.module.css";
import { useAuth } from "../context/AuthProvider.jsx";
import {
  User, Mail, Phone, MapPin, Globe, Camera,
  X, Home, DollarSign, Calendar, ShieldCheck,
  Loader2, Info, Send, Eye, ChevronDown, Search
} from "lucide-react";

// ✅ Import Country & City Data
import { COUNTRIES } from "../data/countries"; 
import { City } from 'country-state-city'; 

// ✅ 1. Import Hook
import useAutoFetch from '../hooks/useAutoFetch';

const getAvatarColor = (name) => {
  if (!name) return "#09707D"; 
  const colors = ["#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5", "#2196F3", "#03A9F4", "#00BCD4", "#009688", "#4CAF50", "#8BC34A", "#CDDC39", "#FFC107", "#FF9800", "#FF5722", "#795548", "#607D8B"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const BuyerProfile = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const countryDropdownRef = useRef(null);

  /* ------------------ Form State ------------------ */
  const [form, setForm] = useState({
    username: "", full_name: user?.name || "", email: user?.email || "",
    phone: "", gender: "", country: "", city: "", bio: "",
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
  
  // Modals & Dropdowns
  const [showImageModal, setShowImageModal] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  
  // Country/City Search State
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  /* ------------------ Helpers ------------------ */
  // Get Country Code for City Logic
  const currentCountryCode = useMemo(() => {
      const c = COUNTRIES.find(c => c.name === form.country);
      return c ? (c.iso || c.code || c.iso2).toUpperCase() : null;
  }, [form.country]);

  // Get Phone Dial Code
  const dialCode = useMemo(() => {
      const c = COUNTRIES.find(c => c.name === form.country);
      return c ? c.code : "+";
  }, [form.country]);

  // Filtered Countries for Search
  const filteredCountries = useMemo(() => {
      if (!countrySearch) return COUNTRIES;
      return COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()));
  }, [countrySearch]);

  // Load Cities
  const citiesOfCountry = useMemo(() => {
      if (!currentCountryCode) return [];
      return City.getCitiesOfCountry(currentCountryCode);
  }, [currentCountryCode]);

  /* ------------------ Fetch Profile (Auto-Fetch) ------------------ */
  const fetchProfile = async () => {
    // Only show loading on initial fetch, not background refresh
    if (!initialForm.email) setLoading(true);
    
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

      // Only update form if NOT editing
      if (!editing) {
          setForm(profileData);
          setInitialForm(profileData);
          setRemoteAvatarUrl(data.avatar_url || null);
      }

      updateUser({
        name: profileData.full_name,
        avatar_url: data.avatar_url || null,
        country: profileData.country 
      });
    } catch (err) {
      console.error("Profile fetch error:", err);
      // Optional: toast.error("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 2. Use the Hook
  useAutoFetch(fetchProfile);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setIsCountryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ------------------ Handlers ------------------ */
  const handleCameraClick = () => {
      if(fileInputRef.current) fileInputRef.current.click();
  };

  const onSelectAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Invalid image file.");
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleCityChange = (e) => {
      const val = e.target.value;
      setForm(prev => ({ ...prev, city: val }));
      if (!val || val.length === 0) { setShowCityDropdown(false); return; }
      const matches = citiesOfCountry.filter(c => c.name.toLowerCase().startsWith(val.toLowerCase())).slice(0, 10);
      setCitySuggestions(matches);
      setShowCityDropdown(matches.length > 0);
  };

  const selectCity = (cityName) => {
      setForm(prev => ({...prev, city: cityName}));
      setShowCityDropdown(false);
  };

  const executeSave = async () => {
    if (!form.full_name.trim()) return toast.warning("Full Name is required.");
    setSaving(true);
    try {
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        const avatarRes = await client.put("/api/profile/avatar", formData);
        setRemoteAvatarUrl(avatarRes.data.avatar_url);
        updateUser({ avatar_url: avatarRes.data.avatar_url });
        setAvatarFile(null);
      }
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

  // ✅ Render Helpers
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

  const renderPhoneInput = () => (
      <div className={styles.inputGroup}>
          <label className={styles.label}><Phone size={16}/> Phone Number</label>
          <div className={styles.phoneRow}>
              {/* Dial Code Box */}
              <div className={`${styles.dialCodeBox} ${!editing ? styles.disabledBox : ''}`}>
                  {dialCode}
              </div>
              {/* Phone Input */}
              <input
                type="text"
                className={`${styles.input} ${styles.phoneInput}`}
                value={form.phone || ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                disabled={!editing} 
                placeholder="123 456 7890"
              />
          </div>
      </div>
  );

  const renderCountryInput = () => {
      const selectedC = COUNTRIES.find(c => c.name === form.country);
      return (
        <div className={styles.inputGroup} ref={countryDropdownRef}>
            <label className={styles.label}><Globe size={16}/> Country</label>
            
            {editing ? (
                <div className={styles.dropdownTrigger} onClick={() => setIsCountryOpen(!isCountryOpen)}>
                    {selectedC ? (
                        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                            <img src={selectedC.flag} alt="" className={styles.flagIcon}/> 
                            {selectedC.name}
                        </div>
                    ) : (
                        <span style={{color:'#9ca3af'}}>Select Country...</span>
                    )}
                    <ChevronDown size={16} className={isCountryOpen ? styles.rotate180 : ''}/>
                </div>
            ) : (
                <div className={`${styles.input} ${styles.inputDisabled}`} style={{display:'flex', alignItems:'center', gap:'8px'}}>
                    {selectedC && <img src={selectedC.flag} alt="" className={styles.flagIcon}/>}
                    {form.country || "Not Set"}
                </div>
            )}

            {isCountryOpen && editing && (
                <div className={styles.dropdownMenu}>
                    <div className={styles.searchContainer}>
                        <Search size={14} className={styles.searchIcon}/>
                        <input 
                            autoFocus 
                            placeholder="Search country..." 
                            className={styles.searchInput}
                            value={countrySearch} 
                            onChange={e => setCountrySearch(e.target.value)} 
                            onClick={e => e.stopPropagation()}
                        />
                    </div>
                    <ul className={styles.countryList}>
                        {filteredCountries.map(c => (
                            <li key={c.iso} onClick={() => { setForm({...form, country: c.name}); setIsCountryOpen(false); }}>
                                <img src={c.flag} alt="" className={styles.flagIcon}/> {c.name}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
      );
  };

  const renderCityInput = () => (
      <div className={styles.inputGroup} style={{position: 'relative'}}>
          <label className={styles.label}><MapPin size={16}/> City</label>
          <input
            className={`${styles.input} ${!editing ? styles.inputDisabled : ""}`}
            value={form.city || ""}
            onChange={handleCityChange}
            disabled={!editing}
            placeholder={!editing ? "" : "Start typing city..."}
            autoComplete="off"
            onFocus={() => editing && form.city && handleCityChange({target: {value: form.city}})} 
            onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)} 
          />
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
    if (source) return <img src={source} alt="Avatar" className={styles.avatar} onClick={() => setShowImageModal(true)} />;
    const n = form.full_name?.trim() || "User";
    const initials = n.split(" ").length > 1 ? (n.split(" ")[0][0] + n.split(" ")[1][0]).toUpperCase() : n[0]?.toUpperCase() || "U";
    return (
        <div className={styles.avatar} onClick={() => setShowImageModal(true)} style={{backgroundColor: getAvatarColor(n), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '40px', fontWeight: '600', cursor: 'pointer'}}>
            {initials}
        </div>
    );
  };

  if (loading) return <div style={{height:'80vh', display:'flex', alignItems:'center', justifyContent:'center'}}><Loader2 className="animate-spin" size={40} color="#09707D"/></div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
            <h1>Buyer Profile</h1>
            <p>Manage your preferences & account details. Your profile is <strong style={{color:'#10b981'}}>Live & Visible</strong> to agents.</p>
        </div>
        <button className={styles.viewPublicBtn} onClick={() => window.open(`/profile/@${form.username || user?.unique_id}`, '_blank')}>
            <Eye size={18}/> View Public Profile
        </button>
      </div>

      <div className={styles.layout}>
        <div className={styles.sidebar}>
          <div className={styles.avatarCard}>
            <div className={styles.avatarWrapper}>
                {renderAvatar()}
                {editing && <button className={styles.cameraBtn} onClick={handleCameraClick}><Camera size={18} /></button>}
                <input type="file" hidden accept="image/*" ref={fileInputRef} onChange={onSelectAvatar} />
            </div>
            <div className={styles.userInfo}>
                <h2 className={styles.userName}>{form.full_name || "User Name"}</h2>
                <div style={{display:'flex', alignItems:'center', gap:'6px', justifyContent:'center', margin:'5px 0'}}>
                    <ShieldCheck size={16} color="#09707d"/> <span style={{fontSize:'14px', color:'#09707d', fontWeight:'600'}}>Verified Buyer</span>
                </div>
                <div className={styles.locationTag}><MapPin size={14} /> {form.city || "City"}, {form.country || "Country"}</div>
            </div>
            <div className={styles.actionButtons}>
                <button className={editing ? styles.cancelBtn : styles.editBtn} onClick={editing ? () => {setEditing(false); setForm(initialForm);} : () => setEditing(true)} disabled={saving}>
                    {editing ? <><X size={18} /> Cancel</> : <><User size={18} /> Edit Profile</>}
                </button>
                {editing && <button className={styles.saveBtn} onClick={executeSave} disabled={saving}>{saving ? "Saving..." : <><Send size={18} /> Save Changes</>}</button>}
            </div>
          </div>
        </div>

        <div className={styles.content}>
            <div className={styles.tabs}>
                {[{ id: "profile", label: "Personal Info", icon: <User size={18}/> }, { id: "preferences", label: "Buying Preferences", icon: <Home size={18}/> }].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ""}`}>
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            <div className={styles.tabContent}>
                {activeTab === "profile" && (
                    <div className={styles.formGrid}>
                        {renderInput("username", "Username", <User size={16}/>)}
                        {renderInput("full_name", "Full Name", <User size={16}/>)}
                        {renderInput("email", "Email", <Mail size={16}/>, "email", true)}
                        
                        {/* ✅ ORDER FIXED: Country First */}
                        {renderCountryInput()}

                        {/* ✅ ORDER FIXED: Phone Second (Dependent on Country) */}
                        {renderPhoneInput()}

                        {/* ✅ City with Auto-complete */}
                        {renderCityInput()}

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

                {activeTab === "preferences" && (
                    <div className={styles.formGrid}>
                        {renderInput("budget_min", "Min Budget ($)", <DollarSign size={16}/>, "number")}
                        {renderInput("budget_max", "Max Budget ($)", <DollarSign size={16}/>, "number")}
                        <div className={styles.inputGroup}>
                            <label className={styles.label}><Home size={16}/> Property Type</label>
                            <select id="property_type" className={styles.select} value={form.property_type} onChange={(e) => setForm({...form, property_type: e.target.value})} disabled={!editing}>
                                <option value="">Any Type</option><option value="Apartment">Apartment</option><option value="Duplex">Duplex</option><option value="Detached House">Detached House</option><option value="Bungalow">Bungalow</option><option value="Land">Land</option>
                            </select>
                        </div>
                        {renderInput("preferred_location", "Preferred Areas", <MapPin size={16}/>)}
                        {renderInput("move_in_date", "Target Move-in Date", <Calendar size={16}/>, "date")}
                    </div>
                )}
            </div>
        </div>
      </div>

      {showImageModal && (
        <div className={styles.modalOverlay} onClick={() => setShowImageModal(false)}>
            <div className={styles.modalContent}>
                {(avatarPreview || remoteAvatarUrl) ? <img src={avatarPreview || remoteAvatarUrl} alt="Full" /> : <div style={{width:'100%', height:'300px', backgroundColor: getAvatarColor(form.full_name)}}/>}
            </div>
        </div>
      )}
    </div>
  );
};

export default BuyerProfile;