import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthProvider";
import client from "../api/axios";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import style from "../styles/login.module.css";
import { Mail, Lock, Eye, EyeOff, Loader2, LogIn } from "lucide-react"; 
import house from "../assets/tallbuildings.jpg";

const Login = () => {
  const navigate = useNavigate();
  const { loginStart } = useAuth();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({ email: "", password: "" });
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // --- Check for Session Expiry ---
  useEffect(() => {
    if (searchParams.get("sessionExpired")) {
      Swal.fire({
        icon: "warning",
        title: "Session Expired",
        text: "Your session has timed out. Please login again.",
        confirmButtonColor: "#09707D",
        timer: 3000
      });
      window.history.replaceState({}, document.title, "/login");
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email.trim() || !form.password) {
      return Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please enter your email and password.",
        confirmButtonColor: "#09707D"
      });
    }

    setSubmitting(true);
    try {
      const cleanEmail = form.email.trim().toLowerCase();
      
      const success = await loginStart(cleanEmail, form.password);
      
      if (success) {
        sessionStorage.setItem("loginEmail", cleanEmail);
        
        if (remember) {
          localStorage.setItem("rememberedEmail", form.email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }

        // ✅ ADDED: Feedback so user knows what's happening
        await Swal.fire({
            icon: 'success',
            title: 'Credentials Verified',
            text: 'We sent a verification code to your email.',
            timer: 1500,
            showConfirmButton: false
        });

        navigate("/login/verify");
      }
      
    } catch (error) {
       console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!form.email.trim()) {
      return Swal.fire({
        icon: "info",
        title: "Email Required",
        text: "Please enter your email address in the field above first.",
        confirmButtonColor: "#09707D"
      });
    }

    try {
      await client.post("/api/auth/forgot-password", { 
        email: form.email.trim().toLowerCase() 
      });

      Swal.fire({
        icon: "success",
        title: "Check Your Email",
        text: `We sent a password reset link to ${form.email}.`,
        confirmButtonColor: "#09707D"
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Request Failed",
        text: err?.response?.data?.message || "Could not send reset email.",
        confirmButtonColor: "#09707D"
      });
    }
  };

  return (
    <div className={style.container}>
      <div className={style.left}>
        <div className={style.imageOverlay}>
            <div className={style.overlayContent}>
                <h2>Welcome Back.</h2>
                <p>Manage your properties and deals efficiently with Keyvia.</p>
            </div>
        </div>
        <img src={house} alt="Luxury Home" className={style.sideImage} />
      </div>

      <div className={style.right}>
        <form onSubmit={handleSubmit} className={style.form} noValidate>

          <div className={style.headerSection}>
            <div className={style.iconCircle}>
                <LogIn size={28} />
            </div>
            <h2>Member Login</h2>
            <p className="text-muted">Access your dashboard.</p>
          </div>

          <div className={style.inputContainer}>
            <label className={style.label}>Email Address</label>
            <div className={style.inputWrapper}>
              <Mail size={20} className={style.inputIcon} />
              <input
                name="email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                className={style.emailInput}
              />
            </div>
          </div>

          <div className={style.inputContainer}>
            <label className={style.label}>Password</label>
            <div className={style.inputWrapper}>
              <Lock size={20} className={style.inputIcon} />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                className={style.emailInput}
              />
              <button
                type="button"
                className={style.eyeToggle}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className={style.optionsRow}>
            <label className={style.checkboxLabel}>
                <input 
                    type="checkbox" 
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                />
                <span className={style.customCheckbox}></span>
                <span className={style.optionText}>Remember me</span>
            </label>

            <button type="button" className={style.forgotBtn} onClick={handleForgotPassword}>
              Forgot Password?
            </button>
          </div>

          <button type="submit" className={style.button} disabled={submitting}>
             {submitting ? (
                <div className={style.loadingContent}>
                    <Loader2 size={20} className={style.spinner} /> 
                    <span>Verifying...</span>
                </div>
            ) : (
                "Login"
            )}
          </button>

          <p className={style.signUpText}>
            Don't have an account? 
            <Link to="/signup">Create Account</Link>
          </p>

        </form>
      </div>
    </div>
  );
};

export default Login;