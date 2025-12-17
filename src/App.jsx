import React from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";

// ---------- Public Pages ----------
import Home from "./pages/Home.jsx";
import Buy from "./pages/Buy.jsx";
import Rent from "./pages/Rent.jsx";
import Sell from "./pages/Sell.jsx";

// ---------- Auth Pages ----------
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import SignupVerifyOtp from "./pages/SignupVerifyOtp.jsx";
import LoginVerifyOtp from "./pages/LoginVerifyOtp.jsx";
import SignupRole from "./pages/SignupRole.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import AgentProfiles from "./pages/AgentProfile";

// ---------- Fallback ----------
import NotFound from "./main/NotFound.jsx";

// ---------- Agent Pages ----------
import AgentSideNav from "./agent/SideNav.jsx";
import AgentDashboard from "./agent/Dashboard.jsx";
import AgentProfile from "./agent/Profile.jsx";
import AgentListings from "./agent/Listings.jsx";
import AgentMessages from "./agent/Messages.jsx";
import AgentApplications from "./agent/Applications.jsx";
import AgentNotifications from "./agent/Notifications.jsx";
import AgentAnalytics from "./agent/Analytics.jsx";
import AgentSettings from "./agent/Settings.jsx";
import AgentPayment from "./agent/Payments.jsx";

// ---------- Settings Subpages ----------
import AccountSettings from "./settings/AccountSettings.jsx";
import NotificationPreferences from "./settings/NotificationPreferences.jsx";
import LanguageRegion from "./settings/LanguageRegion.jsx";
import PrivacySecurity from "./settings/PrivacySecurity.jsx";
import ManageListings from "./settings/ManageListings.jsx";

// ---------- Owner Pages ----------
import OwnerSideNav from "./owner/SideNav.jsx"; // Updated SideNav
import OwnerDashboard from "./owner/Dashboard.jsx";
import OwnerProfile from "./owner/Profile.jsx";         // ✅ New
import OwnerProperties from "./owner/Properties.jsx";   // ✅ Renamed from Listings to match sidebar
import OwnerAddProperty from "./owner/AddProperty.jsx"; // ✅ New
import OwnerMessages from "./owner/Messages.jsx";
import OwnerPayments from "./owner/Payments.jsx";       // ✅ New
import OwnerApplications from "./owner/Applications.jsx"; // ✅ New
import OwnerNotifications from "./owner/Notifications.jsx"; // ✅ New
import OwnerSettings from "./owner/Settings.jsx";

// ---------- Buyer Pages ----------
import BuyerSideNav from "./buyer/SideNav.jsx";
import BuyerDashboard from "./buyer/Dashboard.jsx";
import BuyerMessages from "./buyer/Messages.jsx";
import BuyerSettings from "./buyer/Settings.jsx";
import BuyerFavorites from "./buyer/Favorites.jsx";

// ---------- Developer Pages ----------
import DeveloperSideNav from "./developer/SideNav.jsx";
import DeveloperDashboard from "./developer/Dashboard.jsx";
import DeveloperProjects from "./developer/Projects.jsx";
import DeveloperMessages from "./developer/Messages.jsx";
import DeveloperSettings from "./developer/Settings.jsx";

// ---------- Admin Pages (Standard) ----------
import AdminSideNav from "./admin/SideNav.jsx";
import AdminDashboard from "./admin/Dashboard.jsx";
// import AdminUsers from "./admin/Users.jsx"; // Removed for Standard Admin
import AdminProperties from "./admin/Properties.jsx";
import AdminMessages from "./admin/Messages.jsx";
import AdminNotifications from "./admin/Notifications.jsx";
import AdminSettings from "./admin/Settings.jsx";

// ---------- Super Admin Pages (CEO) ----------
import SuperAdminSideNav from "./admin-super/SideNav.jsx";
import SuperAdminDashboard from "./admin-super/Dashboard.jsx"; // Ensure this file exists
import SuperAdminUsers from "./admin-super/Users.jsx";         // Ensure this file exists
import SuperAdminAdmins from "./admin-super/ManageAdmins.jsx"; // Ensure this file exists
import SuperAdminProperties from "./admin-super/Properties.jsx"; // Or reuse AdminProperties
import SuperAdminPayments from "./admin-super/Payments.jsx";     // Ensure this file exists
import SuperAdminMessages from "./admin-super/Messages.jsx";     // Or reuse AdminMessages
import SuperAdminNotifications from "./admin-super/Notifications.jsx";
import SuperAdminSettings from "./admin-super/Settings.jsx";

// ---------- Protected Route ----------
import ProtectedRoute from "./routes/ProtectedRoute.jsx";

function App() {
  return (
    <Routes>
      {/* ---------- Public Pages ---------- */}
      <Route path="/" element={<Home />} />
      <Route path="/buy" element={<Buy />} />
      <Route path="/rent" element={<Rent />} />
      <Route path="/sell" element={<Sell />} />

      {/* ---------- Auth Flow ---------- */}
      <Route path="/signup" element={<Signup />} />
      <Route path="/signup/verify" element={<SignupVerifyOtp />} />
      <Route path="/signup/role" element={<SignupRole />} />

      <Route path="/login" element={<Login />} />
      <Route path="/login/verify" element={<LoginVerifyOtp />} />

      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />

      <Route path="/profile/:unique_id" element={<AgentProfiles />} />

      {/* ---------- Agent Dashboard ---------- */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="agent">
            <AgentSideNav />
          </ProtectedRoute>
        }
      >
        <Route index element={<AgentDashboard />} />
        <Route path="profile" element={<AgentProfile />} />
        <Route path="listings" element={<AgentListings />} />
        <Route path="messages" element={<AgentMessages />} />
        <Route path="payments" element={<AgentPayment />} />
        <Route path="applications" element={<AgentApplications />} />
        <Route path="notifications" element={<AgentNotifications />} />
        <Route path="analytics" element={<AgentAnalytics />} />

        <Route path="settings" element={<AgentSettings />}>
          <Route path="account" element={<AccountSettings />} />
          <Route path="notifications" element={<NotificationPreferences />} />
          <Route path="language&region" element={<LanguageRegion />} />
          <Route path="privacy&security" element={<PrivacySecurity />} />
          <Route path="listings" element={<ManageListings />} />
        </Route>
      </Route>

      {/* ---------- Owner Dashboard Routes ---------- */}
      <Route
        path="/owner"
        element={
          <ProtectedRoute requiredRole="owner">
            <OwnerSideNav />
          </ProtectedRoute>
        }
      >
        {/* Default redirect to dashboard */}
        <Route index element={<OwnerDashboard />} />
        
        {/* Main Pages */}
        <Route path="dashboard" element={<OwnerDashboard />} />
        <Route path="profile" element={<OwnerProfile />} />
        <Route path="properties" element={<OwnerProperties />} />
        <Route path="add-property" element={<OwnerAddProperty />} />
        
        {/* Operations */}
        <Route path="payments" element={<OwnerPayments />} />
        <Route path="applications" element={<OwnerApplications />} />
        <Route path="notifications" element={<OwnerNotifications />} />
        <Route path="messages" element={<OwnerMessages />} />
        
        {/* Settings */}
        <Route path="settings" element={<OwnerSettings />} />
      </Route>

      {/* ---------- Buyer Dashboard ---------- */}
      <Route
        path="/buyer"
        element={
          <ProtectedRoute requiredRole="buyer">
            <BuyerSideNav />
          </ProtectedRoute>
        }
      >
        <Route index element={<BuyerDashboard />} />
        <Route path="dashboard" element={<BuyerDashboard />} />
        <Route path="messages" element={<BuyerMessages />} />
        <Route path="favorites" element={<BuyerFavorites />} />
        <Route path="settings" element={<BuyerSettings />} />
      </Route>

      {/* ---------- Developer Dashboard ---------- */}
      <Route
        path="/developer"
        element={
          <ProtectedRoute requiredRole="developer">
            <DeveloperSideNav />
          </ProtectedRoute>
        }
      >
        <Route index element={<DeveloperDashboard />} />
        <Route path="dashboard" element={<DeveloperDashboard />} />
        <Route path="projects" element={<DeveloperProjects />} />
        <Route path="messages" element={<DeveloperMessages />} />
        <Route path="settings" element={<DeveloperSettings />} />
      </Route>

      {/* ---------- Standard Admin Dashboard ---------- */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminSideNav />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        {/* Removed Users Route for Standard Admin */}
        <Route path="properties" element={<AdminProperties />} />
        <Route path="messages" element={<AdminMessages />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* ---------- Super Admin Dashboard (CEO) ---------- */}
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute requiredRole="super_admin"> {/* Custom Role Check needed in ProtectedRoute */}
            <SuperAdminSideNav />
          </ProtectedRoute>
        }
      >
        <Route index element={<SuperAdminDashboard />} />
        <Route path="dashboard" element={<SuperAdminDashboard />} />
        <Route path="users" element={<SuperAdminUsers />} />
        <Route path="admins" element={<SuperAdminAdmins />} />
        <Route path="properties" element={<SuperAdminProperties />} />
        <Route path="payments" element={<SuperAdminPayments />} />
        <Route path="messages" element={<SuperAdminMessages />} />
        <Route path="notifications" element={<SuperAdminNotifications />} />
        <Route path="settings" element={<SuperAdminSettings />} />
      </Route>

      {/* ---------- 404 ---------- */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;