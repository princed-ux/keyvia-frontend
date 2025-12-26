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
    
    // ✅ CASE A: Route requires Super Admin
    // We check for both spelling variations ("super_admin" or "superadmin")
    if (requiredRole === "super_admin" || requiredRole === "superadmin") {
      
      // Allow access if:
      // 1. The boolean flag `is_super_admin` is TRUE
      // OR
      // 2. The role string is explicitly 'superadmin'
      if (!user.is_super_admin && user.role !== 'superadmin') {
        // User is logged in but NOT authorized -> Kick them out
        return <Navigate to="/admin/dashboard" replace />; 
      }
    } 
    
    // ✅ CASE B: Standard Role Check (agent, owner, buyer, admin)
    else {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      
      // If the user's role isn't in the allowed list
      if (!roles.includes(user.role)) {
        return <Navigate to="/" replace />; // Unauthorized -> Home
      }
    }
  }

  return children || <Outlet />;
}