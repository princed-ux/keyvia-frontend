// src/context/SocketProvider.jsx
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

    const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
      auth: { token: localStorage.getItem("accessToken") },
      transports: ["websocket"],  // improve stability
    });

    // -------------------------
    // CONNECT
    // -------------------------
    newSocket.on("connect", () => {
      console.log("🔌 Socket connected:", newSocket.id);

      // Existing role logic
      if (user.role === "agent") {
        newSocket.emit("join_agent_room", { agent_id: user.unique_id });
        console.log("Agent connected to socket:", user.unique_id);
      }

      if (user.role === "admin") {
        newSocket.emit("join_admins");
        console.log("Admin connected to socket");
      }
    });

    // -------------------------
    // EXISTING LISTING EVENTS
    // -------------------------
    newSocket.on("listing_status_update", ({ listing }) => {
      toast.info(
        `Your listing "${listing.title}" was ${listing.status.toUpperCase()}`
      );
    });

    newSocket.on("new_listing_submitted", ({ listing }) => {
      toast.success(`New listing pending: ${listing.title}`);
    });

    // -------------------------
// REAL-TIME MESSAGE RECEIVED
// -------------------------
newSocket.on("receive_message", (msg) => {
  console.log("📩 New message:", msg);

  // Dispatch globally so Messages.jsx receives it
  window.dispatchEvent(
    new CustomEvent("global_new_message", { detail: msg })
  );
});



    // -------------------------
    // TYPING INDICATOR
    // -------------------------
    newSocket.on("typing_indicator", (userId) => {
      console.log("✏️ Someone typing:", userId);

      // ChatWindow will hook into this event
    });

    // -------------------------
    // DISCONNECT
    // -------------------------
    newSocket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Helper to join a conversation room
  const joinConversation = (conversationId) => {
    if (socket) {
      socket.emit("join_conversation", { conversationId });
      console.log("Joined conversation room:", conversationId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, joinConversation }}>
      {children}
    </SocketContext.Provider>
  );
};
