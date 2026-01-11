import React, { createContext, useState, useEffect, useContext, useRef } from "react";
import { useSocket } from "./SocketProvider";
import { useAuth } from "./AuthProvider";
import VideoCall from "../components/VideoCall";

const CallContext = createContext();
export const useCall = () => useContext(CallContext);

export const CallProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [activeCall, setActiveCall] = useState(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  const noAnswerTimeout = useRef(null);

  useEffect(() => {
    if (!socket || !user) return;

    const handleIncomingCall = (data) => {
      setActiveCall({
        isIncoming: true,
        partnerId: data.from,
        partnerAvatar: data.avatar || null,
        signal: data.signal,
        name: data.name,
        isVideo: Boolean(data.isVideo), // ✅ hard boolean
      });
      setIsCallModalOpen(true);
    };

    const handleCallAccepted = () => {
      if (noAnswerTimeout.current) clearTimeout(noAnswerTimeout.current);
    };

    const handleCallEnded = () => endCall();

    socket.on("callUser", handleIncomingCall);
    socket.on("callAccepted", handleCallAccepted);
    socket.on("callEnded", handleCallEnded);

    return () => {
      socket.off("callUser", handleIncomingCall);
      socket.off("callAccepted", handleCallAccepted);
      socket.off("callEnded", handleCallEnded);
    };
  }, [socket, user]);

  // ---------------------------------------------------
  // START CALL
  // ---------------------------------------------------
  const startCall = (partnerId, partnerName, partnerAvatar, isVideo = true) => {
    setActiveCall({
      isIncoming: false,
      partnerId,
      name: partnerName,
      partnerAvatar: partnerAvatar || null,
      isVideo: Boolean(isVideo),
    });

    setIsCallModalOpen(true);

    if (noAnswerTimeout.current) clearTimeout(noAnswerTimeout.current);

    noAnswerTimeout.current = setTimeout(() => {
      socket?.emit("call_missed", {
        to: partnerId,
        from: user.unique_id,
        isVideo,
      });
      endCall();
    }, 40000);
  };

  const endCall = () => {
    if (noAnswerTimeout.current) clearTimeout(noAnswerTimeout.current);
    setActiveCall(null);
    setIsCallModalOpen(false);
  };

  return (
    <CallContext.Provider value={{ startCall, endCall, activeCall }}>
      {children}
      {isCallModalOpen && activeCall && (
        <VideoCall activeCall={activeCall} closeModal={endCall} />
      )}
    </CallContext.Provider>
  );
};
