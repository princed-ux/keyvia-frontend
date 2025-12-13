import React, { useState } from "react";
import { useAuth } from "../context/AuthProvider";
import { Link } from "react-router-dom"; // Don't forget this import
import Swal from "sweetalert2";
import style from "../styles/signup.module.css";
import house from "../assets/tallbuildings.jpg";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react"; // Modern Icons

const Signup = () => {
  const { signupStart } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ----------------- Handle Input -----------------
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ----------------- Validation -----------------
  const validate = () => {
    if (!formData.name.trim()) return "Full Name is required.";
    if (!formData.email.trim()) return "Email is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return "Invalid email format.";
    if (formData.password.length < 6) return "Password must be at least 6 chars.";
    return null;
  };

  // ----------------- Submit -----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return Swal.fire({ icon: "error", title: "Oops", text: err });

    setSubmitting(true);
    try {
      // Send all 3 fields at once
      await signupStart(formData.name, formData.email, formData.password);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={style.container}>
      {/* LEFT IMAGE */}
      <div className={style.left}>
        <img src={house} alt="house" className={style.sideImage} />
      </div>

      <div className={style.right}>
        <form onSubmit={handleSubmit} className={style.form} noValidate>
          <h2 className="text-center">Create Account</h2>
          <p className="text-center text-muted">Sign up to get started</p>

          {/* Name */}
          <div className={style.inputContainer}>
            <label className={style.label}>Full Name</label>
            <div className={style.inputWrapper}>
              <User size={20} className={style.inputIcon} />
              <input
                name="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                className={style.emailInput}
              />
            </div>
          </div>

          {/* Email */}
          <div className={style.inputContainer}>
            <label className={style.label}>Email Address</label>
            <div className={style.inputWrapper}>
              <Mail size={20} className={style.inputIcon} />
              <input
                name="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                className={style.emailInput}
              />
            </div>
          </div>

          {/* Password */}
          <div className={style.inputContainer}>
            <label className={style.label}>Password</label>
            <div className={style.inputWrapper}>
              <Lock size={20} className={style.inputIcon} />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                className={style.emailInput}
              />
              <button
                type="button"
                className={style.eyeToggle}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className={style.button} disabled={submitting}>
            {submitting ? "Creating Account..." : "Sign Up"}
          </button>

          <p className={style.login}>
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;