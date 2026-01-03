import React, { useRef, useState, useEffect, useMemo } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import style from "../styles/SideNav.module.css";
import { useAuth } from "../context/AuthProvider.jsx";
import client from "../api/axios";
import { COUNTRIES } from "../data/countries";
import Swal from "sweetalert2";
import { Smartphone, Lock, Briefcase, ChevronDown } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ✅ FIREBASE
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

// =======================
// HELPER: AVATAR COLOR (Must match OwnerProfile.jsx exactly)
// =======================
const getAvatarColor = (name) => {
  if (!name) return "#09707D";
  const colors = ["#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5", "#2196F3", "#03A9F4", "#00BCD4", "#009688", "#4CAF50", "#8BC34A", "#CDDC39", "#FFC107", "#FF9800", "#FF5722", "#795548", "#607D8B"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

// =======================
// HELPER: GET INITIALS (JD instead of J)
// =======================
const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const formatPhoneNumber = (value, dialCode) => {
  const clean = value.replace(/\D/g, "");
  if (dialCode === "+1") {
    if (clean.length === 0) return "";
    if (clean.length <= 3) return `(${clean}`;
    if (clean.length <= 6) return `(${clean.slice(0, 3)}) ${clean.slice(3)}`;
    return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6, 10)}`;
  }
  return clean.replace(/(.{3,4})/g, "$1 ").trim();
};

const OwnerSideNav = () => {
  const dropdownRef = useRef(null);
  const countryDropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const location = useLocation();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSpecialId, setShowSpecialId] = useState(false);

  // --- ONBOARDING STATE ---
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);

  // --- WIZARD DATA ---
  const [tempCountry, setTempCountry] = useState(null);
  const [tempPhone, setTempPhone] = useState("");
  const [otpInput, setOtpInput] = useState("");

  // Fields
  const [agencyName, setAgencyName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [tempExperience, setTempExperience] = useState("");

  const [confirmationResult, setConfirmationResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return COUNTRIES;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.code.includes(searchQuery));
  }, [searchQuery]);

  useEffect(() => {
    if (user && !user.phone_verified) {
      setOnboardingStep(1);
      setTempCountry(null);
    }
  }, [user]);

  // --- CLOSE DROPDOWNS ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) setIsCountryOpen(false);
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCountry = (country) => {
    setTempCountry(country);
    setTempPhone("");
    setIsCountryOpen(false);
    setSearchQuery("");
  };

  const handlePhoneChange = (e) => {
    const rawVal = e.target.value;
    if (rawVal.length > 17) return;
    const dialCode = tempCountry ? tempCountry.code : "";
    setTempPhone(formatPhoneNumber(rawVal, dialCode));
  };

  // --- FIREBASE SMS ---
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
    }
  };

  const sendOtp = async () => {
    if (!tempCountry) return toast.warning("Please select your country.");
    const rawPhone = tempPhone.replace(/\D/g, "");
    if (rawPhone.length < 6) return toast.error("Invalid phone number.");

    setLoading(true);
    setupRecaptcha();

    const fullPhoneNumber = `${tempCountry.code}${rawPhone}`;
    try {
      const confirmation = await signInWithPhoneNumber(auth, fullPhoneNumber, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      toast.success(`Code sent to ${fullPhoneNumber}`);
      setOnboardingStep(2);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send SMS.");
      if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpInput || otpInput.length < 6) return toast.warning("Enter the 6-digit code.");
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otpInput);
      const token = await result.user.getIdToken();
      await client.post("/api/auth/phone/verify-firebase", { token });
      toast.success("Verified!");
      setOnboardingStep(3);
    } catch (err) {
      toast.error("Invalid Code.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FINISH ONBOARDING
  const completeOnboarding = async () => {
    if (!tempExperience) return toast.warning("Please enter experience.");

    setLoading(true);
    try {
      const rawPhone = tempPhone.replace(/\D/g, "");
      const fullPhoneNumber = `${tempCountry.code}${rawPhone}`;
      
      const userRole = user?.role || 'owner'; 

      const payload = {
        role: userRole, 
        agency_name: agencyName, 
        license_number: userRole === 'agent' ? licenseNumber : null, 
        experience: tempExperience,
        phone: fullPhoneNumber,
        country: tempCountry.name,
      };

      const res = await client.put("/api/auth/onboarding/complete", payload);

      updateUser({
        ...payload,
        phone_verified: true,
        special_id: res.data.special_id || user.special_id 
      });

      toast.success("Setup Complete!");
      setOnboardingStep(0);
    } catch (err) {
      console.error(err);
      toast.error("Error saving details.");
    } finally {
      setLoading(false);
    }
  };

  const confirmLogout = async () => { try { await logout(); setShowLogoutModal(false); navigate("/"); } catch (err) {} };
  const copySpecialId = async () => { try { await navigator.clipboard.writeText(user?.special_id || ""); toast.success("ID Copied!"); } catch (err) {} };

  const isAgent = user?.role === 'agent';

  // ✅ FIX CRASH: Defined Titles
  const pathTitles = {
    "/owner/dashboard": "Dashboard",
    "/owner/profile": "My Profile",
    "/owner/properties": "My Properties",
    "/owner/add-property": "Add Property",
    "/owner/payments": "Payments & Finance",
    "/owner/messages": "Messages",
    "/owner/applications": "Applications",
    "/owner/notifications": "Notifications",
    "/owner/settings": "Settings",
  };
  const currentTitle = pathTitles[location.pathname] || "Owner Dashboard";

  const navLinks = [
    { to: "/owner/dashboard", icon: "fas fa-chart-pie", label: "Dashboard", end: true },
    { to: "/owner/profile", icon: "fas fa-user-circle", label: "My Profile" },
    { to: "/owner/properties", icon: "fas fa-building", label: "My Properties" },
    { to: "/owner/add-property", icon: "fas fa-plus-circle", label: "Add Property" },
    { to: "/owner/payments", icon: "fas fa-wallet", label: "Payments" }, 
    { to: "/owner/messages", icon: "fas fa-comment-alt", label: "Messages" },
    { to: "/owner/applications", icon: "fas fa-file-contract", label: "Applications" }, 
    { to: "/owner/notifications", icon: "fas fa-bell", label: "Notifications" }, 
    { to: "/owner/settings", icon: "fas fa-cog", label: "Settings" },
  ];

  return (
    <div className={style.allcontainer}>
      <ToastContainer position="top-right" autoClose={3000} style={{ zIndex: 999999 }} />
      <div id="recaptcha-container"></div>

      {onboardingStep > 0 && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.9)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(5px)" }}>
          <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "16px", width: "90%", maxWidth: "420px", textAlign: "center" }}>
            
            {onboardingStep === 1 && (
                <>
                    <Smartphone size={48} color="#09707d" style={{ marginBottom: "15px" }} />
                    <h2 style={{ fontSize: "22px", marginBottom: "8px" }}>Verify Your Number</h2>
                    <div style={{ textAlign: "left", marginBottom: "15px", position: "relative" }} ref={countryDropdownRef}>
                        <div className={style.countryDropdown} onClick={() => setIsCountryOpen(!isCountryOpen)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", border: "1px solid #ddd", borderRadius: "8px", cursor: "pointer", background: "#fff" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                {tempCountry ? (<> <img src={tempCountry.flag} alt="" style={{ width: "24px", height: "16px", borderRadius: "2px" }} /> <span style={{ fontSize: "15px", fontWeight: "500" }}>{tempCountry.name}</span> </>) : (<span style={{ color: "#888" }}>Choose a country...</span>)}
                            </div>
                            <ChevronDown size={16} color="#888" />
                        </div>
                        {isCountryOpen && (
                            <div className={style.dropdownContainer} style={{ position: "absolute", top: "100%", left: 0, width: "100%", background: "#fff", border: "1px solid #eee", borderRadius: "8px", zIndex: 100, maxHeight: "200px", overflowY: "auto", marginTop: "5px" }}>
                                <div style={{ padding: "10px", background: "#f9f9f9", borderBottom: "1px solid #eee" }}>
                                    <input type="text" placeholder="Search..." autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ border: "none", background: "transparent", width: "100%", outline: "none" }} />
                                </div>
                                <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
                                    {filteredCountries.map((c) => (
                                        <li key={c.iso} onClick={() => handleSelectCountry(c)} style={{ padding: "10px 15px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", borderBottom: "1px solid #f9f9f9" }}>
                                            <img src={c.flag} alt="" style={{ width: "20px" }} /> <span>{c.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    <div style={{ textAlign: "left", marginBottom: "20px" }}>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <div style={{ padding: "12px", background: "#f8f9fa", border: "1px solid #ddd", borderRadius: "8px", minWidth: "60px", textAlign: "center", fontWeight: "600" }}>{tempCountry?.code || "🌐"}</div>
                            <input type="tel" style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "16px" }} placeholder="801 234 5678" value={tempPhone} onChange={handlePhoneChange} disabled={!tempCountry} />
                        </div>
                    </div>
                    <button onClick={sendOtp} disabled={loading || !tempCountry} style={{ width: "100%", padding: "14px", background: tempCountry ? "#09707d" : "#ccc", color: "white", border: "none", borderRadius: "8px", cursor: tempCountry ? "pointer" : "not-allowed", fontWeight: "bold", fontSize: "16px" }}>{loading ? "Sending..." : "Send Code via SMS"}</button>
                </>
            )}

            {onboardingStep === 2 && (
                <>
                    <Lock size={48} color="#09707d" style={{ marginBottom: "15px" }} />
                    <h2 style={{ fontSize: "22px", marginBottom: "10px" }}>Enter Code</h2>
                    <input type="text" maxLength={6} placeholder="000000" value={otpInput} onChange={(e) => setOtpInput(e.target.value)} style={{ width: "100%", padding: "15px", fontSize: "28px", letterSpacing: "10px", textAlign: "center", border: "2px solid #09707d", borderRadius: "10px", marginBottom: "20px", fontWeight: "bold" }} />
                    <button onClick={verifyOtp} disabled={loading} style={{ width: "100%", padding: "14px", background: "#09707d", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "16px" }}>{loading ? "Verifying..." : "Verify"}</button>
                </>
            )}

            {onboardingStep === 3 && (
              <>
                <Briefcase size={48} color="#09707d" style={{ marginBottom: "15px" }} />
                <h2 style={{ fontSize: "22px", marginBottom: "10px" }}>{isAgent ? "Agent Details" : "Landlord Details"}</h2>
                
                <div style={{ textAlign: "left", marginBottom: "15px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "5px", color: "#444" }}>
                    {isAgent ? "AGENCY NAME" : "COMPANY NAME (OPTIONAL)"}
                  </label>
                  <input type="text" placeholder={isAgent ? "e.g. Century 21" : "e.g. John's Estates"} 
                    value={agencyName} onChange={(e) => setAgencyName(e.target.value)} 
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "16px" }} 
                  />
                </div>

                {isAgent && (
                    <div style={{ textAlign: "left", marginBottom: "15px" }}>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "5px", color: "#444" }}>LICENSE NUMBER (OPTIONAL)</label>
                      <input type="text" placeholder="e.g. RE-123456" 
                        value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} 
                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "16px" }} 
                      />
                    </div>
                )}

                <div style={{ textAlign: "left", marginBottom: "25px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "5px", color: "#444" }}>YEARS OF EXPERIENCE</label>
                  <input type="number" placeholder="e.g. 5" value={tempExperience} onChange={(e) => setTempExperience(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "16px" }} />
                </div>

                <button onClick={completeOnboarding} disabled={loading} style={{ width: "100%", padding: "14px", background: "#09707d", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "16px" }}>
                  {loading ? "Saving..." : "Complete Setup"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sidebar & Main Content */}
      <div className={style.side}>
        <div className={style.logo}>
          <div className={style.avatarWrap}>
            {user?.avatar_url ? (
              <img src={user.avatar_url} className={style.avatar} alt="User" onError={(e) => (e.currentTarget.style.display = "none")} />
            ) : (
              <div className={style.avatar} style={{ backgroundColor: getAvatarColor(user?.name), display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "22px", fontWeight: "bold" }}>
                {/* ✅ FIXED: USE getInitials helper */}
                {getInitials(user?.name)}
              </div>
            )}
          </div>
          <div className={style.agentInfo}>
            <h4 className={style.agentName}>{user?.name || "User"}</h4>
            <p className={style.agentTitle}>{isAgent ? "Real Estate Agent" : "Property Owner"}</p>
          </div>
        </div>

        <nav className={style.nav}>
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => isActive ? `${style.link} ${style.active}` : style.link}>
              <i className={link.icon} /> <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={style.footer}>
          <button className={style.logout} onClick={() => setShowLogoutModal(true)}>
            <i className="fas fa-sign-out-alt" /> <span>Logout</span>
          </button>
        </div>
      </div>

      <div className={style.mainContainer}>
        <div className={style.topnav}>
          <div className={style.topTitle}>{currentTitle}</div>
          <div className={style.userSection} ref={dropdownRef}>
            <div className={style.userEmail} onClick={() => setShowDropdown(!showDropdown)}>
              {user?.email} <i className={`fas fa-chevron-${showDropdown ? "up" : "down"} ml-2`} />
            </div>
            {showDropdown && (
              <div className={style.dropdown}>
                <div className={style.dropdownItem}>
                  <strong>Role:</strong> {user?.role}
                </div>
                <div className={style.dropdownItem}>
                  <strong>Special ID:</strong>
                  <div className={style.uniqueBox}>
                    <span className={style.uniqueValue}>{showSpecialId ? (user?.special_id || "N/A") : "••••••••"}</span>
                    <button onClick={() => setShowSpecialId(!showSpecialId)} className={style.eyeBtn}><i className={`fas ${showSpecialId ? "fa-eye" : "fa-eye-slash"}`} /></button>
                    <button onClick={copySpecialId} className={style.copyBtn}><i className="fas fa-copy" /></button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className={style.main}><div className={style.pageWrapper}><Outlet /></div></div>
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

export default OwnerSideNav;