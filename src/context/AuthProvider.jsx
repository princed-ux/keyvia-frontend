import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import client, { attachToken } from "../api/axios.js";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  // ================= STATE =================
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("accessToken")
  );

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // ================= INIT =================
  useEffect(() => {
    if (accessToken) attachToken(accessToken);
    setLoading(false);
  }, [accessToken]);

  // ================= HELPERS =================
  const showError = (title, msg) =>
    Swal.fire({ icon: "error", title, text: msg });

  const showSuccess = (title, msg) =>
    Swal.fire({
      icon: "success",
      title,
      text: msg,
      timer: 1200,
      showConfirmButton: false,
    });

  const extractError = (err, fallback = "Something went wrong") =>
    err?.response?.data?.message || fallback;

  // ✅ NEW HELPER: Allows Profile Page to update local user state
  const updateUser = (newData) => {
    setUser((prev) => {
      const updated = { ...prev, ...newData };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };


  // ====================================================
  // ================= NEW SIGNUP FLOW ==================
  // ====================================================

  // STEP 1 — REGISTER (Name, Email, Password) -> SEND OTP
  const signupStart = async (name, email, password) => {
    try {
      // Updated endpoint to match new backend
      await client.post("/api/auth/signup", { name, email, password });
      
      // Save email for the OTP step
      sessionStorage.setItem("signupEmail", email);
      
      navigate("/signup/verify");
    } catch (err) {
      showError("Signup Failed", extractError(err));
    }
  };

  // STEP 2 — VERIFY OTP (Updated to prevent "Session Expired" error)
  const signupVerifyOtp = async (code) => {
    try {
      let email = sessionStorage.getItem("signupEmail");

      // 🛑 FIX: If email is missing, ask the user for it instead of kicking them out
      if (!email) {
        const { value: userEmail } = await Swal.fire({
          title: "Session Recovered",
          text: "Please confirm your email address to continue:",
          input: "email",
          inputPlaceholder: "Enter your email",
          allowOutsideClick: false,
          showCancelButton: true
        });

        if (!userEmail) return; // User cancelled
        email = userEmail;
        sessionStorage.setItem("signupEmail", email); // Save it again
      }

      const res = await client.post("/api/auth/signup/verify", {
        email,
        code,
      });

      // Save the temp token for the Role Selection step
      if (res.data.token) {
        sessionStorage.setItem("signupTempToken", res.data.token);
      } else {
        throw new Error("Verification successful, but no token received.");
      }

      showSuccess("Email Verified", "Please select your account type");
      
      // Skip password page, go straight to Role
      navigate("/signup/role");
    } catch (err) {
      console.error("Verification Error:", err);
      showError("Verification Failed", extractError(err, "Invalid or expired code"));
    }
  };

  // STEP 2b — RESEND OTP (For the Timer)
  const signupResendOtp = async () => {
    try {
      const email = sessionStorage.getItem("signupEmail");
      if (!email) return;

      await client.post("/api/auth/signup/resend", { email });
      
      Swal.fire({
        icon: "info",
        title: "Code Sent",
        text: "A new verification code has been sent to your email.",
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      showError("Resend Failed", extractError(err));
    }
  };

  // STEP 3 — SET ROLE
  const setRole = async (role) => {
    try {
      const token = sessionStorage.getItem("signupTempToken");

      await client.post(
        "/api/auth/signup/role",
        { role },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      sessionStorage.clear();
      Swal.fire({
        icon: "success",
        title: "Account Created",
        text: "You can now log in.",
      });

      navigate("/login");
    } catch (err) {
      showError("Role Setup Failed", extractError(err));
    }
  };

  // ====================================================
  // ================= LOGIN FLOW =======================
  // ====================================================

  // STEP 1 — PASSWORD CHECK + OTP SEND
  const loginStart = async (email, password) => {
    try {
      await client.post("/api/auth/login/start", { email, password });
      sessionStorage.setItem("loginEmail", email);
      
      // We return the promise here so the Login page can await it if needed
      return true; 
    } catch (err) {
      // Re-throw so component can stop loading spinner
      throw err;
    }
  };

  // STEP 2 — VERIFY LOGIN OTP
  const loginVerifyOtp = async (code) => {
    try {
      const email = sessionStorage.getItem("loginEmail");

      const res = await client.post("/api/auth/login/verify", {
        email,
        code,
      });

      const token = res.data.accessToken;
      const u = res.data.user;

      // 1. Save Data
      setAccessToken(token);
      attachToken(token);
      localStorage.setItem("accessToken", token);

      if (u) {
        setUser(u);
        localStorage.setItem("user", JSON.stringify(u));
      }

      showSuccess("Login Successful", `Welcome back, ${u.name}!`);

      // 🛑 FIX: Do NOT clear sessionStorage here to avoid loop issues
      sessionStorage.removeItem("loginEmail"); 

      // 2. INTELLIGENT REDIRECT (Updated for Super Admin)
      if (u.is_super_admin) {
        navigate("/super-admin/dashboard"); // 🚀 CEO Redirect
      } else if (u.role === "admin") {
        navigate("/admin/dashboard");       // Standard Admin
      } else if (u.role === "agent") {
        navigate("/dashboard");
      } else if (u.role === "owner") {
        navigate("/owner");
      } else if (u.role === "buyer") {
        navigate("/buyer");
      } else if (u.role === "developer") {
        navigate("/developer");
      } else {
        navigate("/"); 
      }

      // Return data in case component needs it
      return res.data;

    } catch (err) {
      // Throw error so component handles UI
      throw err;
    }
  };

  // ====================================================
  // ================= SESSION ==========================
  // ====================================================

  const logout = async () => {
    try {
      await client.post("/api/auth/logout", {}, { withCredentials: true });
    } catch {}
    finally {
      setAccessToken(null);
      setUser(null);
      attachToken(null);
      localStorage.clear();
      sessionStorage.clear();
      navigate("/login");
    }
  };

  // ================= CONTEXT =================
  const value = {
    accessToken,
    user,
    loading,

    // SIGNUP
    signupStart,
    signupVerifyOtp,
    signupResendOtp, 
    setRole,

    // LOGIN
    loginStart,
    loginVerifyOtp,

    // SESSION
    logout,

    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};