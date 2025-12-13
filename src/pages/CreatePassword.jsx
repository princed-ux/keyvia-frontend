// src/pages/CreatePassword.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import client from "../api/axios";
import style from "../styles/signup.module.css";
import passwordImg from "../assets/passwordFile.png";
import { Eye, EyeOff } from "lucide-react";

const CreatePassword = () => {
  const navigate = useNavigate();

  const signupToken = sessionStorage.getItem("signupToken");
  const email = sessionStorage.getItem("signupEmail");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 🚨 Guard: must come from OTP verification
  useEffect(() => {
    if (!signupToken || !email) {
      Swal.fire(
        "Session expired",
        "Please restart signup process",
        "warning"
      );
      navigate("/signup");
    }
  }, [signupToken, email, navigate]);

  // ---------------- Validation ----------------
  const validate = () => {
    if (password.length < 6)
      return "Password must be at least 6 characters";

    if (password !== confirmPassword)
      return "Passwords do not match";

    return null;
  };

  // ---------------- Submit ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    const error = validate();
    if (error) {
      return Swal.fire("Invalid Password", error, "error");
    }

    setSubmitting(true);

    try {
      await client.post(
        "/api/auth/signup/password",
        { password },
        {
          headers: {
            Authorization: `Bearer ${signupToken}`,
          },
        }
      );

      Swal.fire({
        icon: "success",
        title: "Password Created",
        text: "Continue account setup",
        timer: 1200,
        showConfirmButton: false,
      });

      navigate("/signup/role");
    } catch (err) {
      Swal.fire(
        "Error",
        err?.response?.data?.message || "Failed to set password",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={style.container}>
      <div className={style.right}>
        <form onSubmit={handleSubmit} className={style.form}>
          <h2 className="text-center">Create Password</h2>
          <p className="text-center">
            Set a password for <b>{email}</b>
          </p>

          {/* PASSWORD */}
          <div className={style.inputContainer}>
            <label className={style.label}>Password</label>
            <div className={style.inputWrapper}>
              <img src={passwordImg} className={style.inputIcon} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={style.emailInput}
              />
              <button
                type="button"
                className={style.eyeToggle}
                onClick={() => setShowPassword((p) => !p)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* CONFIRM PASSWORD */}
          <div className={style.inputContainer}>
            <label className={style.label}>Confirm Password</label>
            <div className={style.inputWrapper}>
              <img src={passwordImg} className={style.inputIcon} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={style.emailInput}
              />
            </div>
          </div>

          <button
            type="submit"
            className={style.button}
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePassword;
