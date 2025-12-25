import React, { useRef, useState, useEffect, useMemo } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import style from "../styles/SideNav.module.css";
import defaultImg from "../assets/person.png";
import { useAuth } from "../context/AuthProvider.jsx";
import client from "../api/axios"; 
import { COUNTRIES } from "../data/countries"; 
import { Smartphone, Lock, Briefcase, MessageSquare, MessageCircle, ChevronDown, Search, Clock } from "lucide-react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// =======================
// HELPER: PHONE FORMATTER
// =======================
const formatPhoneNumber = (value, dialCode) => {
  const clean = value.replace(/\D/g, ""); 
  if (dialCode === "+1") {
    if (clean.length === 0) return "";
    if (clean.length <= 3) return `(${clean}`;
    if (clean.length <= 6) return `(${clean.slice(0, 3)}) ${clean.slice(3)}`;
    return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6, 10)}`;
  }
  return clean.replace(/(.{3,4})/g, '$1 ').trim();
};

const SideNav = () => {
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
  const [deliveryMethod, setDeliveryMethod] = useState("sms"); 
  const [otpInput, setOtpInput] = useState("");
  
  // ✅ New Fields
  const [tempLicense, setTempLicense] = useState("");
  const [tempExperience, setTempExperience] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  // --- FILTER COUNTRIES ---
  const filteredCountries = useMemo(() => {
    if (!searchQuery) return COUNTRIES;
    return COUNTRIES.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.code.includes(searchQuery)
    );
  }, [searchQuery]);

  // --- CHECK VERIFICATION STATUS ON MOUNT ---
  useEffect(() => {
    // 🔒 ONE-TIME CHECK: Only if phone is NOT verified
    if (user && !user.phone_verified) {
        setOnboardingStep(1);
        setTempCountry(null); 
    }
  }, [user]);

  // Close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setIsCountryOpen(false);
        setSearchQuery(""); 
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
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
    if(rawVal.length > 17) return; 
    const dialCode = tempCountry ? tempCountry.code : "";
    const formatted = formatPhoneNumber(rawVal, dialCode);
    setTempPhone(formatted);
  };

  // --- 1. SEND OTP ---
  const sendOtp = async () => {
    if(!tempCountry) {
        toast.warning("Please select your country.");
        return;
    }
    const rawPhone = tempPhone.replace(/\D/g, "");
    if(rawPhone.length < 6) {
        toast.error("Invalid phone number.");
        return;
    }

    const fullPhoneNumber = `${tempCountry.code}${rawPhone}`;
    setLoading(true);

    try {
        await client.post("/api/auth/send-otp", {
            phone: fullPhoneNumber,
            channel: deliveryMethod 
        });
        toast.success(`Code sent to ${fullPhoneNumber}`);
        setOnboardingStep(2); 
    } catch (err) {
        console.error("OTP Error:", err);
        toast.error(err.response?.data?.message || "Failed to send code.");
    } finally {
        setLoading(false);
    }
  };

  // --- 2. VERIFY OTP ---
  const verifyOtp = async () => {
    if(!otpInput || otpInput.length < 4) {
        toast.warning("Enter the code.");
        return;
    }
    const rawPhone = tempPhone.replace(/\D/g, "");
    const fullPhoneNumber = `${tempCountry.code}${rawPhone}`;
    setLoading(true);

    try {
        await client.post("/api/auth/verify-otp", {
            phone: fullPhoneNumber,
            code: otpInput
        });
        toast.success("Phone Verified!");
        setOnboardingStep(3); 
    } catch (err) {
        toast.error(err.response?.data?.message || "Invalid Code.");
    } finally {
        setLoading(false);
    }
  };

  // --- 3. FINISH ONBOARDING ---
  const completeOnboarding = async () => {
    if(!tempExperience) {
        toast.warning("Please enter your years of experience.");
        return;
    }

    setLoading(true);
    try {
        const rawPhone = tempPhone.replace(/\D/g, "");
        const fullPhoneNumber = `${tempCountry.code}${rawPhone}`;

        // Send to Backend
        await client.put("/api/auth/onboarding/complete", { 
            license_number: tempLicense,
            experience: tempExperience, // ✅ Sending Experience
            phone: fullPhoneNumber,
            country: tempCountry.name
        });

        // Update Local State (So modal never shows again)
        updateUser({ 
            phone: fullPhoneNumber, 
            country: tempCountry.name,
            license_number: tempLicense, 
            experience: tempExperience,
            phone_verified: true // 🔒 LOCKS THE MODAL
        });

        toast.success("Setup Complete! Welcome.");
        setOnboardingStep(0); 

    } catch (err) {
        console.error(err);
        toast.error("Could not save details, but phone is verified.");
        setOnboardingStep(0);
    } finally {
        setLoading(false);
    }
  };

  const confirmLogout = async () => {
    try { await logout(); setShowLogoutModal(false); navigate("/"); } 
    catch (err) { console.error("Logout failed:", err); }
  };

  const copySpecialId = async () => {
    try { await navigator.clipboard.writeText(user?.special_id || ""); toast.success("ID Copied!"); } catch (err) {}
  };

  const pathTitles = {
    "/dashboard": "Dashboard", "/dashboard/profile": "Profile", "/dashboard/listings": "Listings",
    "/dashboard/payments": "Payments", "/dashboard/messages": "Messages", "/dashboard/applications": "Applications",
    "/dashboard/notifications": "Notifications", "/dashboard/settings/account": "Settings",
  };
  const currentTitle = pathTitles[location.pathname] || "Dashboard";

  return (
    <div className={style.allcontainer}>
      <ToastContainer position="top-right" autoClose={3000} style={{ zIndex: 999999 }} />

      {/* --- ONBOARDING MODAL --- */}
      {onboardingStep > 0 && (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex',
            alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                backgroundColor: 'white', padding: '30px', borderRadius: '16px',
                width: '90%', maxWidth: '420px', textAlign: 'center', 
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '1px solid #eee'
            }}>
                {onboardingStep === 1 && (
                    <>
                        <Smartphone size={48} color="#09707d" style={{marginBottom:'15px'}} />
                        <h2 style={{fontSize:'22px', marginBottom:'8px'}}>Verify Your Number</h2>
                        <p style={{color:'#666', fontSize:'14px', marginBottom:'25px'}}>Required to access the dashboard.</p>
                        
                        <div style={{textAlign:'left', marginBottom:'15px', position:'relative'}} ref={countryDropdownRef}>
                            <label style={{display:'block', fontSize:'12px', fontWeight:'bold', marginBottom:'5px', color:'#444'}}>SELECT COUNTRY</label>
                            <div className={style.countryDropdown} onClick={() => setIsCountryOpen(!isCountryOpen)} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px', border:'1px solid #ddd', borderRadius:'8px', cursor:'pointer', background:'#fff'}}>
                                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                    {tempCountry ? (
                                        <> <img src={tempCountry.flag} alt="" style={{width:'24px', height:'16px', borderRadius:'2px'}}/> <span style={{fontSize:'15px', fontWeight:'500'}}>{tempCountry.name}</span> </>
                                    ) : ( <span style={{color:'#888'}}>Choose a country...</span> )}
                                </div>
                                <ChevronDown size={16} color="#888" />
                            </div>
                            {isCountryOpen && (
                                <div className={style.dropdownContainer} style={{position:'absolute', top:'100%', left:0, width:'100%', background:'#fff', border:'1px solid #eee', borderRadius:'8px', zIndex:100, maxHeight:'200px', overflowY:'auto', marginTop:'5px'}}>
                                    <div style={{padding:'10px', background:'#f9f9f9', borderBottom:'1px solid #eee'}}>
                                        <input type="text" placeholder="Search..." autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{border:'none', background:'transparent', width:'100%', outline:'none'}} />
                                    </div>
                                    <ul style={{padding:0, margin:0, listStyle:'none'}}>
                                        {filteredCountries.map(c => (
                                            <li key={c.iso} onClick={() => handleSelectCountry(c)} style={{padding:'10px 15px', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', borderBottom:'1px solid #f9f9f9'}}>
                                                <img src={c.flag} alt="" style={{width:'20px'}}/> <span>{c.name}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div style={{textAlign:'left', marginBottom:'20px'}}>
                            <label style={{display:'block', fontSize:'12px', fontWeight:'bold', marginBottom:'5px', color:'#444'}}>PHONE NUMBER</label>
                            <div style={{display:'flex', gap:'10px'}}>
                                <div style={{padding:'12px', background:'#f8f9fa', border:'1px solid #ddd', borderRadius:'8px', minWidth:'60px', textAlign:'center', fontWeight:'600'}}>{tempCountry?.code || "🌐"}</div>
                                <input type="tel" style={{flex:1, padding:'12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'16px'}} placeholder="801 234 5678" value={tempPhone} onChange={handlePhoneChange} disabled={!tempCountry} />
                            </div>
                        </div>

                        <div style={{textAlign:'left', marginBottom:'20px'}}>
                            <label style={{display:'block', fontSize:'12px', fontWeight:'bold', marginBottom:'5px', color:'#444'}}>METHOD</label>
                            <div style={{display:'flex', gap:'10px'}}>
                                <button onClick={() => setDeliveryMethod('sms')} style={{flex:1, padding:'10px', borderRadius:'8px', border: deliveryMethod==='sms' ? '2px solid #09707d' : '1px solid #eee', background: deliveryMethod==='sms' ? '#eefcfd' : '#fff', cursor:'pointer'}}>SMS</button>
                                <button onClick={() => setDeliveryMethod('whatsapp')} style={{flex:1, padding:'10px', borderRadius:'8px', border: deliveryMethod==='whatsapp' ? '2px solid #25D366' : '1px solid #eee', background: deliveryMethod==='whatsapp' ? '#e8fbf0' : '#fff', cursor:'pointer'}}>WhatsApp</button>
                            </div>
                        </div>

                        <button onClick={sendOtp} disabled={loading || !tempCountry} style={{width:'100%', padding:'14px', background: tempCountry ? '#09707d' : '#ccc', color:'white', border:'none', borderRadius:'8px', cursor: tempCountry ? 'pointer' : 'not-allowed', fontWeight:'bold', fontSize:'16px'}}>{loading ? "Sending..." : "Send Code"}</button>
                    </>
                )}

                {onboardingStep === 2 && (
                    <>
                        <Lock size={48} color="#09707d" style={{marginBottom:'15px'}} />
                        <h2 style={{fontSize:'22px', marginBottom:'10px'}}>Enter Code</h2>
                        <p style={{color:'#666', fontSize:'14px', marginBottom:'20px'}}>Sent via {deliveryMethod}</p>
                        <input type="text" maxLength={6} placeholder="000000" value={otpInput} onChange={(e) => setOtpInput(e.target.value)} style={{width:'100%', padding:'15px', fontSize:'28px', letterSpacing:'10px', textAlign:'center', border:'2px solid #09707d', borderRadius:'10px', marginBottom:'20px', fontWeight:'bold'}} />
                        <button onClick={verifyOtp} disabled={loading} style={{width:'100%', padding:'14px', background:'#09707d', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', fontSize:'16px'}}>{loading ? "Verifying..." : "Verify"}</button>
                        <p style={{marginTop:'15px', color:'#09707d', cursor:'pointer', fontSize:'13px'}} onClick={()=>setOnboardingStep(1)}>Wrong number?</p>
                    </>
                )}

                {/* ✅ STEP 3: LICENSE + EXPERIENCE */}
                {onboardingStep === 3 && (
                    <>
                        <Briefcase size={48} color="#09707d" style={{marginBottom:'15px'}} />
                        <h2 style={{fontSize:'22px', marginBottom:'10px'}}>Professional Info</h2>
                        <p style={{color:'#666', fontSize:'14px', marginBottom:'20px'}}>Tell us a bit about your experience.</p>
                        
                        <div style={{textAlign:'left', marginBottom:'15px'}}>
                            <label style={{display:'block', fontSize:'12px', fontWeight:'700', marginBottom:'5px', color:'#444'}}>LICENSE NUMBER (OPTIONAL)</label>
                            <input type="text" placeholder="e.g. REC-12345" value={tempLicense} onChange={(e) => setTempLicense(e.target.value)} style={{ width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'16px' }} />
                        </div>

                        <div style={{textAlign:'left', marginBottom:'25px'}}>
                            <label style={{display:'block', fontSize:'12px', fontWeight:'700', marginBottom:'5px', color:'#444'}}>YEARS OF EXPERIENCE</label>
                            <input type="number" placeholder="e.g. 5" value={tempExperience} onChange={(e) => setTempExperience(e.target.value)} style={{ width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid #ddd', fontSize:'16px' }} />
                        </div>

                        <button onClick={completeOnboarding} disabled={loading} style={{ width:'100%', padding:'14px', background:'#09707d', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', fontSize:'16px' }}>
                            {loading ? "Saving..." : "Complete Setup"}
                        </button>
                    </>
                )}
            </div>
        </div>
      )}

      {/* --- SIDEBAR & NAV (Standard) --- */}
      <div className={style.side}>
        <div className={style.logo}>
          <div className={style.avatarWrap}><img src={user?.avatar_url || defaultImg} className={style.avatar} onError={(e) => (e.currentTarget.src = defaultImg)}/></div>
          <div className={style.agentInfo}><h4 className={style.agentName}>{user?.name}</h4><p className={style.agentTitle}>{user?.role}</p></div>
        </div>
        <nav className={style.nav}>
          {[{ to: "/dashboard", icon: "fas fa-home", label: "Dashboard", end: true }, { to: "profile", icon: "fas fa-user", label: "Profile" }, { to: "listings", icon: "fas fa-building", label: "Listings" }, { to: "payments", icon: "fas fa-wallet", label: "Payments" }, { to: "messages", icon: "fas fa-message", label: "Chat Messages" }, { to: "applications", icon: "fas fa-file-alt", label: "Applications" }, { to: "notifications", icon: "fas fa-bell", label: "Notifications" }, { to: "settings/account", icon: "fas fa-cog", label: "Settings" }].map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => isActive ? `${style.link} ${style.active}` : style.link }><i className={link.icon} /> <span>{link.label}</span></NavLink>
          ))}
        </nav>
        <div className={style.footer}><button className={style.logout} onClick={() => setShowLogoutModal(true)}><i className="fas fa-sign-out-alt" /> <span>Logout</span></button></div>
      </div>

      <div className={style.mainContainer}>
        <div className={style.topnav}>
          <div className={style.topTitle}>{currentTitle}</div>
          <div className={style.userSection} ref={dropdownRef}>
            <div className={style.userEmail} onClick={() => setShowDropdown(!showDropdown)}>{user?.email}<i className={`fas fa-chevron-${showDropdown ? "up" : "down"} ml-2`} /></div>
            {showDropdown && (
              <div className={style.dropdown}>
                <div className={style.dropdownItem}><strong>Role:</strong> {user?.role}</div>
                <div className={style.dropdownItem}><strong>Special ID:</strong> {showSpecialId ? user?.special_id : "••••••••"} <button onClick={() => setShowSpecialId(!showSpecialId)} className={style.eyeBtn}><i className={`fas ${showSpecialId ? "fa-eye" : "fa-eye-slash"}`} /></button> <button onClick={copySpecialId} className={style.copyBtn}><i className="fas fa-copy" /></button></div>
              </div>
            )}
          </div>
        </div>
        <div className={style.main}><div className={style.pageWrapper}><Outlet /></div></div>
      </div>

      {showLogoutModal && (
        <div className={style.modalOverlay}><div className={style.modal}><h3>Confirm Logout</h3><p>Are you sure?</p><div className={style.modalButtons}><button onClick={() => setShowLogoutModal(false)} className={style.cancelBtn}>Cancel</button><button onClick={confirmLogout} className={style.confirmBtn}>Logout</button></div></div></div>
      )}
    </div>
  );
};

export default SideNav;