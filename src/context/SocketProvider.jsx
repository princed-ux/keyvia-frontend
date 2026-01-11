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
      transports: ["websocket"], // Forces WebSocket only for better performance
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
        // Buyers and Owners just connect; specific chats are joined dynamically in Messages.jsx
        console.log(`${user.role} connected:`, user.unique_id);
      }
      
      // Announce user is online globally
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
        // We assume 'data.message' holds the text
        toast.info(`New Message: ${data.message.substring(0, 30)}${data.message.length > 30 ? "..." : ""}`, {
            onClick: () => window.location.href = "/dashboard/messages" // Or appropriate route based on role
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
  }, [user]); // Re-run if user changes (login/logout)

  // Helper function to force join a specific chat room
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