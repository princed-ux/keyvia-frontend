import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthProvider.jsx";
import { toast } from "react-toastify";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) return;

    // Initialize Socket Connection
    const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
      auth: { token: localStorage.getItem("accessToken") },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    // -------------------------
    // CONNECT EVENTS
    // -------------------------
    newSocket.on("connect", () => {
      console.log("🔌 Socket connected:", newSocket.id);

      // Join rooms based on role
      if (user.role === "agent") {
        newSocket.emit("join_agent_room", { agent_id: user.unique_id });
        console.log(`Agent ${user.unique_id} joined agent room`);
      } else if (user.role === "admin") {
        newSocket.emit("join_admins");
        console.log("Admin joined admin room");
      } else {
        console.log(`${user.role} connected:`, user.unique_id);
      }
      
      // ✅ CRITICAL: This allows server.js to run socket.join(userId)
      // This is what makes the Notification Bell work!
      newSocket.emit("user_online", { userId: user.unique_id });
    });

    // -------------------------
    // LISTING ALERTS (Global)
    // -------------------------
    newSocket.on("listing_status_update", ({ listing }) => {
      toast.info(
        `Your listing "${listing.title}" was ${listing.status.toUpperCase()}`
      );
    });

    newSocket.on("new_listing_submitted", ({ listing }) => {
      if (user.role === "admin") {
        toast.success(`New listing pending review: ${listing.title}`);
      }
    });

    // -------------------------
    // GLOBAL MESSAGE NOTIFICATION
    // -------------------------
    newSocket.on("receive_message", (data) => {
      // Only show toast if user is NOT on the messages page
      if (!window.location.pathname.includes("/messages")) {
        toast.info(`New Message: ${data.message.substring(0, 30)}${data.message.length > 30 ? "..." : ""}`, {
            onClick: () => window.location.href = "/dashboard/messages"
        });
      }
    });

    // -------------------------
    // CONNECTION ERRORS
    // -------------------------
    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.off("connect");
      newSocket.off("receive_message");
      newSocket.off("listing_status_update");
      newSocket.disconnect();
    };
  }, [user]); 

  // Helper function to force join a specific chat room (Used in Chat UI)
  const joinConversation = (conversationId) => {
    if (socket) {
      socket.emit("join_conversation", { conversationId });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, joinConversation }}>
      {children}
    </SocketContext.Provider>
  );
};