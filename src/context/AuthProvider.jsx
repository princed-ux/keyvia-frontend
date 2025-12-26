import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import client, { attachToken } from "../api/axios.js";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

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
    if (accessToken) {
        attachToken(accessToken);
    }
    setLoading(false);
  }, [accessToken]);

  // ================= HELPERS =================
  const showError = (title, msg) =>
    Swal.fire({ icon: "error", title, text: msg, confirmButtonColor: '#d33' });

  const showSuccess = (title, msg) =>
    Swal.fire({
      icon: "success",
      title,
      text: msg,
      timer: 1500,
      showConfirmButton: false,
    });

  const extractError = (err, fallback = "Something went wrong") =>
    err?.response?.data?.message || fallback;

  // ✅ ROBUST UPDATE USER FUNCTION (Persists to LocalStorage)
  const updateUser = (newData) => {
    setUser((prevUser) => {
      const updatedUser = { ...prevUser, ...newData };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  // ====================================================
  // ================= SIGNUP FLOW ======================
  // ====================================================

  const signupStart = async (name, email, password) => {
    try {
      await client.post("/api/auth/signup", { name, email, password });
      sessionStorage.setItem("signupEmail", email);
      navigate("/signup/verify");
    } catch (err) {
      showError("Signup Failed", extractError(err));
    }
  };

  const signupVerifyOtp = async (code) => {
    try {
      let email = sessionStorage.getItem("signupEmail");

      if (!email) {
        const { value: userEmail } = await Swal.fire({
          title: "Session Restored",
          text: "Please confirm your email address:",
          input: "email",
          allowOutsideClick: false,
          showCancelButton: true,
          confirmButtonColor: '#09707d'
        });
        if (!userEmail) return; 
        email = userEmail;
        sessionStorage.setItem("signupEmail", email);
      }

      const res = await client.post("/api/auth/signup/verify", { email, code });

      if (res.data.token) {
        sessionStorage.setItem("signupTempToken", res.data.token);
        showSuccess("Verified!", "Please select your account type.");
        navigate("/signup/role");
      } else {
        throw new Error("No token received.");
      }
    } catch (err) {
      showError("Verification Failed", extractError(err, "Invalid code"));
    }
  };

  const signupResendOtp = async () => {
    try {
      const email = sessionStorage.getItem("signupEmail");
      if (!email) return showError("Error", "Email not found.");
      await client.post("/api/auth/signup/resend", { email });
      Swal.fire({ icon: "info", title: "Code Sent", timer: 1500, showConfirmButton: false });
    } catch (err) {
      showError("Resend Failed", extractError(err));
    }
  };

  const setRole = async (role) => {
    try {
      const token = sessionStorage.getItem("signupTempToken");
      if (!token) throw new Error("Session expired.");

      await client.post(
        "/api/auth/signup/role",
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      sessionStorage.clear();
      await Swal.fire({
        icon: "success",
        title: "Account Created!",
        text: "Please log in.",
        confirmButtonColor: '#09707d'
      });
      navigate("/login");
    } catch (err) {
      showError("Setup Failed", extractError(err));
    }
  };

  // ====================================================
  // ================= LOGIN FLOW =======================
  // ====================================================

  const loginStart = async (email, password) => {
    try {
      await client.post("/api/auth/login/start", { email, password });
      sessionStorage.setItem("loginEmail", email);
      return true;
    } catch (err) {
      showError("Login Failed", extractError(err));
      return false;
    }
  };

  const loginVerifyOtp = async (code) => {
    try {
      const email = sessionStorage.getItem("loginEmail");
      if(!email) {
          showError("Session Expired", "Please login again.");
          navigate("/login");
          return;
      }

      const res = await client.post("/api/auth/login/verify", { email, code });

      const token = res.data.accessToken;
      const u = res.data.user;

      console.log("LOGIN RESPONSE USER:", u); // 🔍 Debugging

      // Save Session
      setAccessToken(token);
      attachToken(token);
      localStorage.setItem("accessToken", token);
      
      setUser(u);
      localStorage.setItem("user", JSON.stringify(u));
      sessionStorage.removeItem("loginEmail"); 
      
      // ✅ FIX 1: Handle "Undefined" Name
      // It tries 'name', then 'full_name', then extracts from email
      const displayName = u.name || u.full_name || u.email?.split('@')[0] || "User"; 
      showSuccess("Login Successful", `Welcome back, ${displayName}!`);

      // ✅ FIX 2: Stronger Super Admin Check
      // Checks boolean true/1 OR string 'superadmin'/'super_admin'
      const isSuper = u.is_super_admin === true || u.role === 'superadmin' || u.role === 'super_admin';

      if (isSuper) {
        navigate("/super-admin/dashboard");
      } else {
        switch(u.role) {
            case "admin": navigate("/admin/dashboard"); break;
            case "agent": navigate("/dashboard"); break;
            case "owner": navigate("/owner"); break;
            case "buyer": navigate("/buyer"); break;
            case "developer": navigate("/developer"); break;
            default: navigate("/"); 
        }
      }

      return true;
    } catch (err) {
      showError("Verification Failed", extractError(err));
      return false;
    }
  };

  const logout = async () => {
    try {
      await client.post("/api/auth/logout");
    } catch (err) {
        console.error("Logout error", err);
    } finally {
      setAccessToken(null);
      setUser(null);
      attachToken(null);
      localStorage.clear();
      sessionStorage.clear();
      navigate("/login");
    }
  };

  const value = {
    accessToken,
    user,
    loading,
    updateUser,
    signupStart,
    signupVerifyOtp,
    signupResendOtp, 
    setRole,
    loginStart,
    loginVerifyOtp,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};