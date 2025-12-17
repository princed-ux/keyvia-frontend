import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios"; // 👈 Using raw axios to bypass interceptors
import style from "../styles/signupRole.module.css";
import {
  Briefcase,
  Home,
  Code2,
  ShoppingCart,
  CheckCircle2,
  Building2,
  ArrowRight,
  Loader2,
} from "lucide-react";

// Updated Role Data with better descriptions
const roles = [
  {
    key: "agent",
    title: "Real Estate Agent",
    description: "I want to list properties, manage clients, and close deals.",
    icon: <Briefcase size={32} />,
  },
  {
    key: "owner",
    title: "Property Owner",
    description: "I own property and want to list it for rent or sale.",
    icon: <Home size={32} />,
  },
  {
    key: "buyer",
    title: "Buyer / Tenant",
    description: "I am looking for a dream home to buy or a place to rent.",
    icon: <ShoppingCart size={32} />,
  },
  {
    key: "developer",
    title: "Developer",
    description: "I want to showcase new projects and developments.",
    icon: <Code2 size={32} />,
  },
];

const SignupRole = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Retrieve the temp token
  const token = sessionStorage.getItem("signupTempToken");

  // 🚨 Security Guard
  useEffect(() => {
    if (!token) {
      Swal.fire({
        icon: "warning",
        title: "Session Expired",
        text: "Please sign up again.",
        confirmButtonColor: "#09707D",
      });
      navigate("/signup");
    }
  }, [token, navigate]);

  // ---------------- Submit Logic ----------------
  const handleSubmit = async () => {
    if (!selectedRole) return;

    try {
      setSubmitting(true);

      // 🛑 Using raw axios to prevent global interceptor conflicts
      await axios.post(
        "http://localhost:5000/api/auth/signup/role",
        { role: selectedRole },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Manual Header
            "Content-Type": "application/json",
          },
        }
      );

      // Success Animation
      Swal.fire({
        icon: "success",
        title: "Welcome Aboard!",
        text: "Your account is fully set up.",
        confirmButtonText: "Go to Login",
        confirmButtonColor: "#09707D",
        allowOutsideClick: false,
        backdrop: `rgba(0,0,123,0.4)`,
      }).then(() => {
        sessionStorage.removeItem("signupTempToken");
        sessionStorage.removeItem("signupEmail");
        navigate("/login");
      });
    } catch (err) {
      console.error("Role Error:", err);
      Swal.fire({
        icon: "error",
        title: "Setup Failed",
        text: err?.response?.data?.message || "Something went wrong.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={style.container}>
      {/* Background Decor */}
      <div className={style.bgCircle1}></div>
      <div className={style.bgCircle2}></div>

      <div className={style.contentWrapper}>
        {/* Header Section */}
        <div className={style.header}>
          <div className={style.logoIcon}>
            <Building2 size={40} color="#09707D" />
          </div>
          <h1 className={style.title}>How will you use Keyvia?</h1>
          <p className={style.subtitle}>
            Select your primary role to customize your experience.
          </p>
        </div>

        {/* Grid Selection */}
        <div className={style.grid}>
          {roles.map((role) => (
            <div
              key={role.key}
              className={`${style.card} ${
                selectedRole === role.key ? style.activeCard : ""
              }`}
              onClick={() => setSelectedRole(role.key)}
            >
              <div className={style.cardHeader}>
                <div
                  className={`${style.iconWrapper} ${
                    selectedRole === role.key ? style.activeIcon : ""
                  }`}
                >
                  {role.icon}
                </div>
                {selectedRole === role.key && (
                  <CheckCircle2 className={style.checkIcon} size={24} />
                )}
              </div>
              <h3 className={style.roleTitle}>{role.title}</h3>
              <p className={style.roleDesc}>{role.description}</p>
            </div>
          ))}
        </div>

        {/* Action Section */}
        <div className={style.footer}>
          <button
            className={style.submitBtn}
            disabled={!selectedRole || submitting}
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className={style.spinner} size={20} />
                Setting up profile...
              </>
            ) : (
              <>
                Finish Setup <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupRole;