import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios"; 
import style from "../styles/signupRole.module.css";
import {
  Briefcase,
  Home,
  Search, 
  CheckCircle2,
  Building2,
  ArrowRight,
  Loader2,
} from "lucide-react";

// ✅ REMOVED DEVELOPER ROLE
const roles = [
  {
    key: "buyer",
    title: "Home Seeker",
    description: "I am looking to buy or rent my dream home.",
    icon: <Search size={32} />,
  },
  {
    key: "agent",
    title: "Real Estate Agent",
    description: "I want to list properties and manage clients.",
    icon: <Briefcase size={32} />,
  },
  {
    key: "owner",
    title: "Landlord / Owner",
    description: "I own a property and want to list it myself.",
    icon: <Home size={32} />,
  },
];

const SignupRole = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // ✅ NEW: Success Flag to prevent race conditions
  const [isSuccess, setIsSuccess] = useState(false); 

  // Retrieve the temp token
  const token = sessionStorage.getItem("signupTempToken");

  // 🚨 Security Guard
  useEffect(() => {
    // If we just finished successfully, STOP checking the token.
    // This prevents the "Session Expired" error from popping up while redirecting.
    if (isSuccess) return;

    if (!token) {
      Swal.fire({
        icon: "warning",
        title: "Session Expired",
        text: "Please sign up again.",
        confirmButtonColor: "#09707D",
      });
      navigate("/signup");
    }
  }, [token, navigate, isSuccess]);

  // ---------------- Submit Logic ----------------
  const handleSubmit = async () => {
    if (!selectedRole) return;

    try {
      setSubmitting(true);

      // 🛑 Using raw axios
      await axios.post(
        "http://localhost:5000/api/auth/signup/role",
        { role: selectedRole },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // ✅ MARK SUCCESS BEFORE CLEANUP
      setIsSuccess(true);

      // Success Animation
      await Swal.fire({
        icon: "success",
        title: "Profile Configured!",
        text: "Your account is ready. Redirecting to login...",
        timer: 2000,
        showConfirmButton: false,
        backdrop: `rgba(9, 112, 125, 0.2)`, 
      });

      // Cleanup
      sessionStorage.removeItem("signupTempToken");
      sessionStorage.removeItem("signupEmail");
      
      navigate("/login");

    } catch (err) {
      console.error("Role Error:", err);
      // Reset success flag on error
      setIsSuccess(false); 
      
      Swal.fire({
        icon: "error",
        title: "Setup Failed",
        text: err?.response?.data?.message || "Something went wrong.",
      });
    } finally {
      // Only stop loading state if we FAILED.
      // If we succeeded, we want the button to stay disabled while redirecting.
      if (!isSuccess) {
          setSubmitting(false);
      }
    }
  };

  return (
    <div className={style.container}>
      <div className={style.glassWrapper}>
        
        {/* Header */}
        <div className={style.header}>
          <div className={style.brandBadge}>
            <Building2 size={24} color="#fff" />
          </div>
          <h1 className={style.title}>Select Your Profile</h1>
          <p className={style.subtitle}>
            How will you use Keyvia? This helps us customize your dashboard.
          </p>
        </div>

        {/* Roles Grid */}
        <div className={style.grid}>
          {roles.map((role) => (
            <div
              key={role.key}
              className={`${style.card} ${
                selectedRole === role.key ? style.activeCard : ""
              }`}
              onClick={() => setSelectedRole(role.key)}
            >
              {/* Checkmark Badge */}
              <div className={`${style.checkBadge} ${selectedRole === role.key ? style.showCheck : ""}`}>
                <CheckCircle2 size={18} />
              </div>

              <div className={style.iconWrapper}>
                {React.cloneElement(role.icon, {
                    color: selectedRole === role.key ? "#09707D" : "#64748b"
                })}
              </div>
              
              <h3 className={style.roleTitle}>{role.title}</h3>
              <p className={style.roleDesc}>{role.description}</p>
            </div>
          ))}
        </div>

        {/* Footer Action */}
        <div className={style.footer}>
          <button
            className={style.submitBtn}
            disabled={!selectedRole || submitting}
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className={style.spinner} size={20} />
                Finalizing...
              </>
            ) : (
              <>
                Complete Setup <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default SignupRole;