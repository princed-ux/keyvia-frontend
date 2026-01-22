import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import client from "../api/axios";
import { COUNTRIES } from "../data/countries";
import {
  Smartphone,
  Lock,
  Briefcase,
  ShieldCheck,
  ChevronDown,
  CheckCircle,
  Loader2,
  Globe,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import style from "../styles/Onboarding.module.css";

// ✅ FIREBASE IMPORTS
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

// ================= HELPERS =================
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

const getLicenseLabel = (countryName) => {
  const c = countryName?.toLowerCase() || "";
  if (c.includes("india")) return "RERA Registration ID";
  if (c.includes("united kingdom") || c.includes("uk")) return "Redress Scheme / TPO Number";
  if (c.includes("australia") || c.includes("canada") || c.includes("united states")) return "State/Provincial License Number";
  if (c.includes("new zealand")) return "REA License Number";
  if (c.includes("nigeria")) return "LASRERA / NIESV ID";
  return "Real Estate License Number";
};

// ================= COMPONENT =================
const Onboarding = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const countryDropdownRef = useRef(null);

  // State
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Phone Auth State
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempCountry, setTempCountry] = useState(null);
  const [tempPhone, setTempPhone] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Profile Details State
  const [agencyName, setAgencyName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [experience, setExperience] = useState("");

  // Filter Countries
  const filteredCountries = useMemo(() => {
    if (!searchQuery) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.includes(searchQuery)
    );
  }, [searchQuery]);

  // Hydrate Country from User Context
  useEffect(() => {
    if (user?.country) {
      const found = COUNTRIES.find((c) => c.name === user.country);
      if (found) setTempCountry(found);
    }
  }, [user]);

  // ✅ REDIRECT LOGIC (Clean & Conflict-Free)
  useEffect(() => {
    if (!user) return;

    // 1. BUYERS: Should not be here. Send to Dashboard.
    if (user.role === 'buyer') {
        navigate("/buyer/dashboard", { replace: true });
        return;
    }

    // 2. COMPLETED AGENTS/OWNERS: Send to Dashboard.
    if (user.phone_verified && user.special_id) {
        const dash = user.role === "owner" ? "/owner/dashboard" : "/dashboard";
        navigate(dash, { replace: true });
        return;
    }

    // 3. INCOMPLETE AGENTS/OWNERS: If phone is verified but no ID, go to Step 3.
    if (user.phone_verified && !user.special_id) {
        setStep(3);
    }
  }, [user, navigate]);


  // ================= HANDLERS =================

  // 1. Initialize ReCaptcha
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { 
            size: "invisible", 
            callback: () => console.log("Recaptcha Verified") 
        }
      );
    }
  };

  // 2. Send SMS
  const handleSendOtp = async () => {
    if (!tempCountry) return toast.warning("Select a country.");
    const rawPhone = tempPhone.replace(/\D/g, "");
    if (rawPhone.length < 6) return toast.error("Invalid phone number.");

    setLoading(true);
    setupRecaptcha();

    const fullPhone = `${tempCountry.code}${rawPhone}`;
    try {
      const confirmation = await signInWithPhoneNumber(
        auth,
        fullPhone,
        window.recaptchaVerifier
      );
      setConfirmationResult(confirmation);
      toast.success(`Code sent to ${fullPhone}`);
      setStep(2);
    } catch (err) {
      console.error("SMS Error:", err);
      toast.error("SMS Failed. Please try again.");
      if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify OTP
  const handleVerifyOtp = async () => {
    if (otpInput.length < 6) return toast.warning("Enter the 6-digit code.");
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otpInput);
      const firebaseToken = await result.user.getIdToken();
      
      // Verify token with backend
      await client.post("/api/auth/phone/verify-firebase", {
        token: firebaseToken,
      });

      toast.success("Phone Verified!");

      // Update Context immediately
      const rawPhone = tempPhone.replace(/\D/g, "");
      const fullPhone = `${tempCountry.code}${rawPhone}`;

      updateUser({
        phone_verified: true,
        phone: fullPhone,
        country: tempCountry?.name,
      });

      setStep(3);
    } catch (err) {
      console.error("OTP Error:", err);
      toast.error("Invalid Code or Expired.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Finish Setup (Save Profile)
  const handleCompleteSetup = async () => {
    // Validation for Agents
    if (user.role === "agent") {
      if (!agencyName) return toast.warning("Agency Name is required.");
      if (!licenseNumber) return toast.warning("License Number is required.");
    }

    setLoading(true);
    try {
      const rawPhone = tempPhone.replace(/\D/g, "");
      const computedPhone =
        tempCountry && rawPhone
          ? `${tempCountry.code}${rawPhone}`
          : user?.phone || "";

      const computedCountry = tempCountry?.name || user?.country || "Unknown";

      // Fallback role logic if context is pending
      let finalRole = user.role;
      if (finalRole === 'pending' || !finalRole) {
          finalRole = (agencyName || licenseNumber) ? 'agent' : 'owner';
      }

      const payload = {
        role: finalRole,
        country: computedCountry,
        phone: computedPhone,
        agency_name: agencyName,
        license_number: licenseNumber,
        experience: experience,
      };

      const res = await client.put("/api/auth/onboarding/complete", payload);

      // Final Context Update with new Special ID
      updateUser({
        ...payload,
        special_id: res.data.special_id,
        verification_status: "new",
        phone_verified: true,
      });

      toast.success("Welcome to Keyvia!");
      const dash = user.role === "owner" ? "/owner/dashboard" : "/dashboard";
      navigate(dash, { replace: true });

    } catch (err) {
      console.error("Onboarding Error:", err);
      if (err.response && err.response.status === 409) {
        toast.error(err.response.data.message || "Identity Conflict");
      } else {
        toast.error("Setup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ================= RENDER =================
  return (
    <div className={style.container}>
      <ToastContainer position="top-center" />
      <div id="recaptcha-container"></div>

      <div className={style.onboardingCard}>
        {/* PROGRESS BAR */}
        <div className={style.progressRow}>
          <div className={`${style.step} ${step >= 1 ? style.activeStep : ""}`}>1</div>
          <div className={style.line}></div>
          <div className={`${style.step} ${step >= 2 ? style.activeStep : ""}`}>2</div>
          <div className={style.line}></div>
          <div className={`${style.step} ${step >= 3 ? style.activeStep : ""}`}>3</div>
        </div>

        {/* STEP 1: PHONE */}
        {step === 1 && (
          <div className={style.stepContent}>
            <div className={style.iconHeader}>
              <Smartphone size={32} />
            </div>
            <h2>Verify Phone Number</h2>
            <p>Verify you are a real person to start.</p>

            <div className={style.inputGroup} ref={countryDropdownRef}>
              <label>Country</label>
              <div
                className={style.dropdownTrigger}
                onClick={() => setIsCountryOpen(!isCountryOpen)}
              >
                {tempCountry ? (
                  <>
                    <img src={tempCountry.flag} alt="" /> {tempCountry.name}
                  </>
                ) : (
                  "Select Country"
                )}
                <ChevronDown size={16} />
              </div>
              {isCountryOpen && (
                <div className={style.dropdownMenu}>
                  <input
                    autoFocus
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <ul>
                    {filteredCountries.map((c) => (
                      <li
                        key={c.iso}
                        onClick={() => {
                          setTempCountry(c);
                          setIsCountryOpen(false);
                        }}
                      >
                        <img src={c.flag} alt="" /> {c.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className={style.inputGroup}>
              <label>Phone Number</label>
              <div className={style.phoneRow}>
                <div className={style.dialCode}>
                  {tempCountry?.code || "🌐"}
                </div>
                <input
                  placeholder="123 456 7890"
                  value={tempPhone}
                  onChange={(e) =>
                    setTempPhone(
                      formatPhoneNumber(e.target.value, tempCountry?.code)
                    )
                  }
                />
              </div>
            </div>

            <button
              className={style.primaryBtn}
              onClick={handleSendOtp}
              disabled={loading || !tempCountry}
            >
              {loading ? <Loader2 className="animate-spin" /> : "Send Code"}
            </button>
          </div>
        )}

        {/* STEP 2: OTP */}
        {step === 2 && (
          <div className={style.stepContent}>
            <div className={style.iconHeader}>
              <Lock size={32} />
            </div>
            <h2>Enter Code</h2>
            <p>
              Sent to {tempCountry?.code} {tempPhone}
            </p>

            <input
              className={style.otpInput}
              maxLength={6}
              placeholder="000000"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
            />

            <button
              className={style.primaryBtn}
              onClick={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button className={style.textBtn} onClick={() => setStep(1)}>
              Change Number
            </button>
          </div>
        )}

        {/* STEP 3: DETAILS */}
        {step === 3 && (
          <div className={style.stepContent}>
            <div className={style.iconHeader}>
              {user?.role === "agent" ? (
                <Briefcase size={32} />
              ) : (
                <ShieldCheck size={32} />
              )}
            </div>

            <h2>
              {user?.role === "agent"
                ? "Professional Details"
                : "Almost Done!"}
            </h2>
            <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "20px" }}>
              {user?.role === "agent"
                ? "Enter your license details to build trust with clients."
                : "Your phone is verified. Click below to finish setup."}
            </p>

            {user?.role === "agent" ? (
              <>
                <div className={style.inputGroup}>
                  <label>
                    {getLicenseLabel(tempCountry?.name || user?.country)}{" "}
                    <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    placeholder="e.g. License ID"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                  />
                </div>
                <div className={style.inputGroup}>
                  <label>
                    Agency Name <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    placeholder="e.g. Remax"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                  />
                </div>
                <div className={style.inputGroup}>
                  <label>Years of Experience</label>
                  <input
                    type="number"
                    placeholder="e.g. 5"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                {/* OWNER VIEW: Just confirmation */}
                <div className={style.infoBox}>
                  <CheckCircle size={24} className={style.greenIcon} />
                  <div>
                    <strong>Safety Check Passed</strong>
                    <p>We have verified your phone number.</p>
                  </div>
                </div>

                <div className={style.inputGroup} style={{ marginTop: 20 }}>
                  <label>Your Region</label>
                  <div className={style.readOnlyField}>
                    <Globe size={16} />{" "}
                    {tempCountry?.name || user?.country || "Global"}
                  </div>
                </div>
              </>
            )}

            <button
              className={style.primaryBtn}
              onClick={handleCompleteSetup}
              disabled={loading}
            >
              {loading ? "Saving..." : "Finish Setup"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;