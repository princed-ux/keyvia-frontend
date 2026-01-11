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

// ✅ FIREBASE
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

// --- HELPERS ---
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
  if (c.includes("united kingdom") || c.includes("uk"))
    return "Redress Scheme / TPO Number";
  if (
    c.includes("australia") ||
    c.includes("canada") ||
    c.includes("united states")
  )
    return "State/Provincial License Number";
  if (c.includes("new zealand")) return "REA License Number";
  if (c.includes("nigeria")) return "LASRERA / NIESV ID";
  return "Real Estate License Number";
};

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const countryDropdownRef = useRef(null);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Phone State
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempCountry, setTempCountry] = useState(null);
  const [tempPhone, setTempPhone] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Profile State
  const [agencyName, setAgencyName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [experience, setExperience] = useState("");

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.includes(searchQuery)
    );
  }, [searchQuery]);

  // ✅ FIX: Hydrate state from user context on mount
  useEffect(() => {
    if (user?.country) {
      const found = COUNTRIES.find((c) => c.name === user.country);
      if (found) setTempCountry(found);
    }
  }, [user]);

  useEffect(() => {
    if (user?.phone_verified) {
      if (
        user.role === "agent" &&
        (!user.license_number || !user.agency_name)
      ) {
        setStep(3);
      } else if (
        user.role === "owner" &&
        user.verification_status === "pending"
      ) {
        if (!user.country) setStep(3);
        else navigate("/owner/dashboard");
      } else {
        const dash = user.role === "owner" ? "/owner/dashboard" : "/dashboard";
        navigate(dash);
      }
    }
  }, [user, navigate]);

  // --- HANDLERS ---
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => console.log("Recaptcha Verified"),
        }
      );
    }
  };

  const handleSendOtp = async () => {
    if (!tempCountry) return toast.warning("Select a country.");
    const rawPhone = tempPhone.replace(/\D/g, "");
    if (rawPhone.length < 6) return toast.error("Invalid phone.");

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
      console.error(err);
      toast.error("SMS Failed. Try again.");
      if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpInput.length < 6) return toast.warning("Enter 6-digit code.");
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otpInput);
      const firebaseToken = await result.user.getIdToken();
      await client.post("/api/auth/phone/verify-firebase", {
        token: firebaseToken,
      });

      toast.success("Phone Verified!");

      // ✅ Update Context immediately so Step 3 has access to verified phone
      const rawPhone = tempPhone.replace(/\D/g, "");
      const fullPhone = `${tempCountry.code}${rawPhone}`;

      updateUser({
        phone_verified: true,
        phone: fullPhone,
        country: tempCountry?.name,
      });

      setStep(3);
    } catch (err) {
      console.error(err);
      toast.error("Invalid Code.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSetup = async () => {
    if (user.role === "agent") {
      if (!agencyName) return toast.warning("Agency Name is required.");
      if (!licenseNumber) return toast.warning("License Number is required.");
    }
    setLoading(true);
    try {
      // 1. Construct the data
      const rawPhone = tempPhone.replace(/\D/g, "");
      const computedPhone =
        tempCountry && rawPhone
          ? `${tempCountry.code}${rawPhone}`
          : user?.phone || "";

      const computedCountry = tempCountry?.name || user?.country || "Unknown";

      const payload = {
        role: user.role,
        country: computedCountry,
        phone: computedPhone,
        agency_name: agencyName,
        license_number: licenseNumber,
        experience: experience,
      }; // 2. Send to Backend

      const res = await client.put("/api/auth/onboarding/complete", payload); // 3. Update Local Context

      updateUser({
        ...payload,
        special_id: res.data.special_id,
        verification_status: "new",
        phone_verified: true,
      });

      toast.success("Welcome to Keyvia!");
      const dash = user.role === "owner" ? "/owner/dashboard" : "/dashboard";
      navigate(dash);
    } catch (err) {
      console.error("Onboarding Error:", err); // ✅ FIX: Catch the 409 Conflict specifically

      if (err.response && err.response.status === 409) {
        toast.error(
          err.response.data.message ||
            "Identity Conflict: Phone or License already in use."
        );
      } else if (
        err.response &&
        err.response.data &&
        err.response.data.message
      ) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Setup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={style.container}>
      <ToastContainer position="top-center" />
      <div id="recaptcha-container"></div>

      <div className={style.onboardingCard}>
        {/* PROGRESS BAR */}
        <div className={style.progressRow}>
          <div className={`${style.step} ${step >= 1 ? style.activeStep : ""}`}>
            1
          </div>
          <div className={style.line}></div>
          <div className={`${style.step} ${step >= 2 ? style.activeStep : ""}`}>
            2
          </div>
          <div className={style.line}></div>
          <div className={`${style.step} ${step >= 3 ? style.activeStep : ""}`}>
            3
          </div>
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
                : "You're Verified!"}
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#64748b",
                marginBottom: "20px",
              }}
            >
              {user?.role === "agent"
                ? "Enter your license details to build trust with clients."
                : "Your phone number is verified. You can now post listings."}
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
                    {/* ✅ FIX: Show user country if tempCountry is null */}
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
