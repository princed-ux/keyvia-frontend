import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const TitleUpdater = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = "Keyvia"; // Default fallback

    // --- PUBLIC PAGES ---
    if (path === "/") title = "Keyvia | Find Your Dream Home";
    else if (path === "/buy") title = "Keyvia | Buy Property";
    else if (path === "/rent") title = "Keyvia | Rent Property";
    else if (path === "/sell") title = "Keyvia | Sell Your Home";
    else if (path === "/login") title = "Keyvia | Login";
    else if (path === "/signup") title = "Keyvia | Sign Up";

    // --- AGENT DASHBOARD ---
    else if (path.startsWith("/dashboard")) {
      if (path.includes("/profile")) title = "Agent | Profile";
      else if (path.includes("/listings")) title = "Agent | My Listings";
      else if (path.includes("/messages")) title = "Agent | Messages";
      else if (path.includes("/payments")) title = "Agent | Payments";
      else title = "Agent | Dashboard";
    }

    // --- BUYER DASHBOARD ---
    else if (path.startsWith("/buyer")) {
      if (path.includes("/profile")) title = "Buyer | Profile";
      else if (path.includes("/favorites")) title = "Buyer | Saved Homes";
      else if (path.includes("/messages")) title = "Buyer | Messages";
      else title = "Buyer | Dashboard";
    }

    // --- SUPER ADMIN ---
    else if (path.startsWith("/super-admin")) {
      title = "Keyvia | Super Admin";
    }

    // Update the document title
    document.title = title;

  }, [location]); // Run every time the route changes

  return null; // This component doesn't render anything visible
};

export default TitleUpdater;