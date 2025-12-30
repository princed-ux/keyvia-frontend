import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../api/axios"; // ✅ Use your configured client
import Swal from "sweetalert2";
import styles from "../styles/reset.module.css"; // We will create this
import { Lock, Key, Eye, EyeOff, CheckCircle2, Circle, Loader2, ShieldCheck } from "lucide-react";
import house from "../assets/tallbuildings.jpg"; // Re-using your asset

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password Validation Criteria
  const criteria = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      return Swal.fire({ icon: "warning", title: "Missing Fields", text: "Please fill in all fields.", confirmButtonColor: "#09707D" });
    }

    if (password !== confirmPassword) {
      return Swal.fire({ icon: "error", title: "Mismatch", text: "Passwords do not match.", confirmButtonColor: "#09707D" });
    }

    // Check criteria
    const allMet = Object.values(criteria).every(Boolean);
    if (!allMet) {
      return Swal.fire({ icon: "warning", title: "Weak Password", text: "Please meet all password requirements.", confirmButtonColor: "#09707D" });
    }

    setLoading(true);

    try {
      // ✅ Correct API Call using client
      await client.post(`/api/auth/reset-password/${token}`, { newPassword: password });

      await Swal.fire({
        icon: "success",
        title: "Password Reset!",
        text: "You can now login with your new password.",
        confirmButtonColor: "#09707D",
      });

      navigate("/login");
    } catch (err) {
      console.error("Reset error:", err);
      Swal.fire({
        icon: "error",
        title: "Reset Failed",
        text: err?.response?.data?.message || "Invalid or expired token.",
        confirmButtonColor: "#09707D",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Left Image (Consistent with Login) */}
      <div className={styles.left}>
        <div className={styles.imageOverlay}>
          <div className={styles.overlayContent}>
            <h2>Secure Your Account.</h2>
            <p>Create a new strong password to protect your profile.</p>
          </div>
        </div>
        <img src={house} alt="Building" className={styles.sideImage} />
      </div>

      {/* Right Form */}
      <div className={styles.right}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          
          <div className={styles.headerSection}>
            <div className={styles.iconCircle}>
                <ShieldCheck size={28} />
            </div>
            <h2>Reset Password</h2>
            <p className="text-muted">Enter your new credentials below.</p>
          </div>

          {/* New Password */}
          <div className={styles.inputContainer}>
            <label className={styles.label}>New Password</label>
            <div className={styles.inputWrapper}>
              <Lock size={20} className={styles.inputIcon} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className={styles.input}
              />
              <button type="button" className={styles.eyeToggle} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            {/* Password Checklist */}
            <div className={styles.checklist}>
                <div className={criteria.length ? styles.met : styles.unmet}>{criteria.length ? <CheckCircle2 size={12}/> : <Circle size={12}/>} 8+ Chars</div>
                <div className={criteria.upper ? styles.met : styles.unmet}>{criteria.upper ? <CheckCircle2 size={12}/> : <Circle size={12}/>} Uppercase</div>
                <div className={criteria.number ? styles.met : styles.unmet}>{criteria.number ? <CheckCircle2 size={12}/> : <Circle size={12}/>} Number</div>
                <div className={criteria.special ? styles.met : styles.unmet}>{criteria.special ? <CheckCircle2 size={12}/> : <Circle size={12}/>} Symbol</div>
            </div>
          </div>

          {/* Confirm Password */}
          <div className={styles.inputContainer}>
            <label className={styles.label}>Confirm Password</label>
            <div className={styles.inputWrapper}>
              <Key size={20} className={styles.inputIcon} />
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className={styles.input}
              />
              <button type="button" className={styles.eyeToggle} onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? <><Loader2 size={20} className={styles.spinner} /> Resetting...</> : "Set New Password"}
          </button>

          <p className={styles.backLink}>
            Remembered it? <a href="/login">Back to Login</a>
          </p>
        </form>
      </div>
    </div>
  );
}