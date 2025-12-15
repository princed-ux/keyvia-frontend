import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthProvider";
import { useNavigate } from "react-router-dom";
import style from "../styles/signup.module.css"; 
import { Timer, ShieldCheck, ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

const LoginVerifyOtp = () => {
  const { loginVerifyOtp } = useAuth();
  const navigate = useNavigate();

  const email = sessionStorage.getItem("loginEmail");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef([]);

  // 🚨 Guard
  useEffect(() => {
    if (verifying) return; 
    if (!email) {
      Swal.fire({
        icon: "warning",
        title: "Session Expired",
        text: "Please login again.",
        timer: 2000,
        showConfirmButton: false
      });
      navigate("/login");
    }
  }, [email, navigate, verifying]);

  // Timer
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Input Handling
  const handleChange = (index, e) => {
    const value = e.target.value;
    if (value && !/^[a-zA-Z0-9]$/.test(value.slice(-1))) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1).toUpperCase(); 
    setOtp(newOtp);

    if (value && index < 5) inputRefs.current[index + 1].focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // ----------------- SUBMIT & REDIRECT LOGIC -----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setVerifying(true);
    const code = otp.join("");
    
    try {
      // 1. Verify and get User Data response
      const res = await loginVerifyOtp(code); 
      
      // 2. Intelligent Redirect based on Role & Flags
      // Note: res needs to be the response object returned by apiRequest in AuthProvider
      const user = res?.user || res; // Handle if wrapper returns just user or full response

      if (user) {
        toast.success(`Welcome, ${user.name}`);

        if (user.is_super_admin) {
          navigate("/super-admin/dashboard");
        } else if (user.role === "admin") {
          navigate("/admin/dashboard");
        } else if (user.role === "agent") {
          navigate("/dashboard");
        } else if (user.role === "owner") {
          navigate("/owner/dashboard");
        } else if (user.role === "buyer") {
          navigate("/buyer/dashboard");
        } else if (user.role === "developer") {
          navigate("/developer/dashboard");
        } else {
          navigate("/");
        }
      }
    } catch (err) {
      setVerifying(false);
      Swal.fire({
        icon: "error",
        title: "Verification Failed",
        text: err?.response?.data?.message || "Invalid Code"
      });
    }
  };

  return (
    <div className={style.container}>
      <div className={style.bgCircle1} style={{ left: '-10%', top: '20%' }}></div>
      <div className={style.bgCircle2} style={{ right: '-10%', bottom: '20%' }}></div>

      <div className={style.right} style={{ width: "100%", maxWidth: "480px", margin: "0 auto", zIndex: 2 }}>
        
        <button onClick={() => navigate("/login")} className={style.backButton} style={{ marginBottom: "20px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", color: "#666" }}>
          <ArrowLeft size={18} /> Back to Login
        </button>

        <form onSubmit={handleSubmit} className={style.form} style={{ padding: "40px", borderRadius: "20px", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}>
          
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <div style={{ background: "#eff6ff", width: "60px", height: "60px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 15px", color: "#2563eb" }}>
              <ShieldCheck size={32} />
            </div>
            <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "10px" }}>Security Verification</h2>
            <p className="text-muted" style={{ fontSize: "14px", lineHeight: "1.5" }}>
              Please enter the 6-digit code sent to<br/>
              <b style={{ color: "#333" }}>{email}</b>
            </p>
          </div>

          {/* OTP INPUTS */}
          <div className={style.otpContainer} style={{ gap: "8px", justifyContent: "center" }}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={style.otpBox}
                style={{ width: "45px", height: "55px", fontSize: "22px", borderRadius: "12px", textTransform: "uppercase" }}
              />
            ))}
          </div>

          {/* TIMER */}
          <div className={style.timerSection} style={{ marginTop: "20px" }}>
            {timer > 0 ? (
              <p className={style.timerText}>
                <Timer size={16} style={{ display: "inline", marginBottom: "-2px" }} /> Code expires in <span className={style.highlight}>00:{timer < 10 ? `0${timer}` : timer}</span>
              </p>
            ) : (
              <p className={style.expiredText} style={{ color: "red" }}>Code expired. Please login again.</p>
            )}
          </div>

          <button
            type="submit"
            className={style.button}
            disabled={verifying || otp.join("").length < 6}
            style={{ marginTop: "20px" }}
          >
            {verifying ? "Verifying..." : "Verify & Login"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default LoginVerifyOtp;