import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import Loading from "../common/Loading";

export default function ProtectedRoute({ requiredRole, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1. Wait for AuthProvider to load user from Storage
  if (loading) return <Loading text="Loading..." />;

  // 2. Check if User exists (Not logged in)
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Role & Permission Checks
  if (requiredRole) {
    
    // CASE A: Route requires "super_admin"
    // We must check the boolean flag `is_super_admin`
    if (requiredRole === "super_admin") {
      if (!user.is_super_admin) {
        // User is logged in but NOT a Super Admin -> Redirect to Home or Dashboard
        return <Navigate to="/" replace />;
      }
    } 
    
    // CASE B: Standard Role Check (agent, owner, buyer, admin, developer)
    // We check the string `user.role`
    else {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      
      if (!roles.includes(user.role)) {
        return <Navigate to="/" replace />; // Unauthorized -> Home
      }
    }
  }

  return children || <Outlet />;
}