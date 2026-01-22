import React, { createContext, useContext, useState, useEffect } from "react";
import { useSocket } from "./SocketProvider";
import { toast } from "react-toastify";

const RefreshContext = createContext();

export const useGlobalRefresh = () => useContext(RefreshContext);

export const GlobalRefreshProvider = ({ children }) => {
  const { socket } = useSocket();
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    if (!socket) return;

    // List of event types that should trigger a data refresh
    const REFRESH_TRIGGERS = [
        'application_status', 
        'new_application',
        'listing_status',
        'new_listing',
        'payment_update'
    ];

    const handleSocketEvent = (data) => {
      // 1. Check if Auto-Refresh setting is ON (Default to true)
      const isAutoRefreshOn = JSON.parse(localStorage.getItem("keyvia_auto_refresh") || "true");

      // 2. Check if the event type requires a refresh
      // If the event has a 'type' property (like your notifications), check it.
      // If it's a direct event name, you might need a different check.
      // Assuming your socket sends { type: '...', message: '...' }
      if (isAutoRefreshOn && REFRESH_TRIGGERS.includes(data.type)) {
          console.log(`🔄 Global Refresh Triggered by: ${data.type}`);
          
          // Increment version. All components listening to this will re-run their useEffect.
          setRefreshVersion(prev => prev + 1);
          
          // Optional: Show a subtle toast
          // toast.info(`Data updated: ${data.message}`); 
      }
    };

    // Listen to the main notification channel
    socket.on("notification", handleSocketEvent);
    
    // Listen to other specific channels if you have them
    // socket.on("listings_update", handleSocketEvent);

    return () => {
      socket.off("notification", handleSocketEvent);
    };
  }, [socket]);

  return (
    <RefreshContext.Provider value={{ refreshVersion }}>
      {children}
    </RefreshContext.Provider>
  );
};