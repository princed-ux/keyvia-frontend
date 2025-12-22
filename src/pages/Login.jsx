import React, { useState, useEffect } from "react"; // ✅ Added useEffect
import { useAuth } from "../context/AuthProvider";
import client from "../api/axios";
import { useNavigate, Link, useSearchParams } from "react-router-dom"; // ✅ Added useSearchParams
import Swal from "sweetalert2";
import style from "../styles/login.module.css";
import { Eye, EyeOff } from "lucide-react";

// Assets
import emailImg from "../assets/emailFile.png";
import passwordImg from "../assets/passwordFile.png";
import house from "../assets/tallbuildings.jpg";

const Login = () => {
  const navigate = useNavigate();
  const { loginStart } = useAuth();
  const [searchParams] = useSearchParams(); // ✅ Get URL params

  const [form, setForm] = useState({ email: "", password: "" });
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ----------------- ✅ CHECK FOR EXPIRED SESSION -----------------
  useEffect(() => {
    if (searchParams.get("sessionExpired")) {
      // Fire the alert
      Swal.fire({
        icon: "warning",
        title: "Session Expired",
        text: "Your session has timed out. Please login again to continue.",
        confirmButtonColor: "#007983",
      });

      // Clean the URL (remove the ?sessionExpired=true part) so it doesn't pop up on refresh
      window.history.replaceState({}, document.title, "/login");
    }
  }, [searchParams]);

  // ----------------- Input Change -----------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ----------------- Submit -----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email.trim() || !form.password) {
      return Swal.fire({
        icon: "error",
        title: "Missing fields",
        text: "Please enter your email and password.",
      });
    }

    setSubmitting(true);
    try {
      await loginStart(form.email.trim().toLowerCase(), form.password);
      sessionStorage.setItem("loginEmail", form.email.trim().toLowerCase());
      navigate("/login/verify");
      
    } catch (error) {
       console.error(error);
       if(error.response) {
         Swal.fire({ icon: 'error', title: 'Login Failed', text: error.response.data.message });
       }
    } finally {
      setSubmitting(false);
    }
  };

  // ----------------- Forgot Password -----------------
  const handleForgotPassword = async () => {
    if (!form.email.trim()) {
      return Swal.fire({
        icon: "warning",
        title: "Email required",
        text: "Please enter your email address to reset your password.",
      });
    }

    try {
      await client.post("/api/auth/forgot-password", { 
        email: form.email.trim().toLowerCase() 
      });

      Swal.fire({
        icon: "success",
        title: "Password Reset Email Sent",
        html: `A password reset email has been sent to <b>${form.email}</b>.<br/>The link will expire in 1 hour.`,
        confirmButtonText: "OK",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err?.response?.data?.message || "Unable to send reset email.",
      });
    }
  };

  return (
    <div className={style.container}>
      <div className={style.left}>
        <img src={house} alt="house" className={style.sideImage} />
      </div>

      <div>
        <button className={style.mobileSignUp} onClick={() => navigate("/signup")}>
          Sign Up
        </button>
      </div>

      <div className={style.right}>
        <form onSubmit={handleSubmit} className={style.form} noValidate>

          <div className={style.header}>
            <h2 className="text-center">Welcome back to KeyVia!!</h2>
            <p className="text-center">Please login to your account</p>
          </div>

          {/* Email */}
          <div className={style.inputContainer}>
            <label className={style.label}>Email</label>
            <div className={style.inputWrapper}>
              <img className={style.inputIcon} src={emailImg} alt="Email" />
              <input
                name="email"
                type="email"
                placeholder="Enter email address"
                value={form.email}
                onChange={handleChange}
                required
                className={style.emailInput}
              />
            </div>
          </div>

          {/* Password */}
          <div className={style.inputContainer}>
            <label className={style.label}>Password</label>
            <div className={style.inputWrapper}>
              <img className={style.inputIcon} src={passwordImg} alt="Password" />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={form.password}
                onChange={handleChange}
                required
                className={style.emailInput}
              />
              <button
                type="button"
                className={style.eyeToggle}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Options */}
          <div className={style.options}>
            <div>
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <label htmlFor="remember">Remember me</label>
            </div>

            <button type="button" className={style.forgotBtn} onClick={handleForgotPassword}>
              Forgot Password?
            </button>
          </div>

          {/* Submit */}
          <button type="submit" className={style.button} disabled={submitting}>
            {submitting ? "Verifying..." : "Login"}
          </button>

          <p className={style.signUp}>
            Don't have an account?{" "}
            <Link to="/signup" className={style.link}>Sign Up</Link>
          </p>

        </form>
      </div>
    </div>
  );
};

export default Login;