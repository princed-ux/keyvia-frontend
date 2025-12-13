import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import Loading from "../common/Loading";

export default function ProtectedRoute({ requiredRole, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1. Wait for AuthProvider to load user from Storage
  if (loading) return <Loading text="Loading..." />;

  // 2. Check if User exists
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Check Verification (Optional, but good security)
  // If your backend doesn't send 'is_verified' in the login response, remove this block.
  // But our verifySignupOtp DOES set it true, so this is safe if user data is fresh.
  /* if (user.is_verified === false) { 
     return <Navigate to="/login" replace />; 
  }
  */

  // 4. Check Role (FIXED: Uses String Comparison)
  // We check 'user.role' (e.g., "agent") instead of 'user.is_agent'
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    // Check if the user's role string is in the allowed list
    if (!roles.includes(user.role)) {
      return <Navigate to="/" replace />; // Unauthorized -> Home
    }
  }

  return children || <Outlet />;
}