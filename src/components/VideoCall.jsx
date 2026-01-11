import React, { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { useSocket } from "../context/SocketProvider";
import { useAuth } from "../context/AuthProvider";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Maximize2,
  Minimize2,
  User,
} from "lucide-react";
import style from "../styles/VideoCall.module.css";
import Draggable from "react-draggable";

const VideoCall = ({ activeCall, closeModal }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  // 🔒 Freeze call type to avoid race conditions
  const callTypeRef = useRef(activeCall.isVideo);

  const [stream, setStream] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(!callTypeRef.current);
  const [isMinimized, setIsMinimized] = useState(false);

  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const connectionRef = useRef(null);
  const ringtoneRef = useRef(new Audio("/sounds/ringtone.mp3"));

  // ---------------------------------------------------
  // 1. MEDIA SETUP
  // ---------------------------------------------------
  useEffect(() => {
    const constraints = {
      audio: true,
      video: callTypeRef.current,
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) myVideo.current.srcObject = currentStream;
      })
      .catch((err) => console.error("Media error:", err));

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ---------------------------------------------------
  // 2. RINGTONE (INCOMING)
  // ---------------------------------------------------
  useEffect(() => {
    if (activeCall.isIncoming && !callAccepted) {
      ringtoneRef.current.loop = true;
      ringtoneRef.current.play().catch(() => {});
    }
    return () => {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    };
  }, [activeCall.isIncoming, callAccepted]);

  // ---------------------------------------------------
  // 3. SOCKET: CALL ACCEPTED (CALLER)
  // ---------------------------------------------------
  useEffect(() => {
    if (!socket) return;

    const handleCallAccepted = (signal) => {
      setCallAccepted(true);
      connectionRef.current?.signal(signal);
    };

    socket.on("callAccepted", handleCallAccepted);
    return () => socket.off("callAccepted", handleCallAccepted);
  }, [socket]);

  // ---------------------------------------------------
  // 4. INITIATE CALL (CALLER)
  // ---------------------------------------------------
  useEffect(() => {
    if (!stream || activeCall.isIncoming) return;

    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: activeCall.partnerId,
        signalData: data,
        from: user.unique_id,
        name: user.name,
        avatar: user.avatar_url || null,
        isVideo: callTypeRef.current, // ✅ frozen
      });
    });

    peer.on("stream", (remoteStream) => {
      if (userVideo.current) userVideo.current.srcObject = remoteStream;
    });

    connectionRef.current = peer;

    return () => peer.destroy();
  }, [stream]);

  // ---------------------------------------------------
  // 5. ANSWER CALL (RECEIVER)
  // ---------------------------------------------------
  const answerCall = () => {
    if (!stream) return;

    setCallAccepted(true);
    ringtoneRef.current.pause();

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (data) => {
      socket.emit("answerCall", {
        signal: data,
        to: activeCall.partnerId || activeCall.from,
      });
    });

    peer.on("stream", (remoteStream) => {
      if (userVideo.current) userVideo.current.srcObject = remoteStream;
    });

    peer.signal(activeCall.signal);
    connectionRef.current = peer;
  };

  // ---------------------------------------------------
  // 6. END CALL
  // ---------------------------------------------------
  const leaveCall = () => {
    ringtoneRef.current.pause();

    connectionRef.current?.destroy();
    connectionRef.current = null;

    if (stream) stream.getTracks().forEach((t) => t.stop());

    socket.emit("endCall", {
      to: activeCall.partnerId || activeCall.from,
      from: user.unique_id,
      isVideo: callTypeRef.current,
      endedAt: new Date().toISOString(),
    });

    closeModal();
  };

  // ---------------------------------------------------
  // 7. CONTROLS
  // ---------------------------------------------------
  const toggleMute = () => {
    setIsMuted((prev) => {
      stream?.getAudioTracks()[0] &&
        (stream.getAudioTracks()[0].enabled = prev);
      return !prev;
    });
  };

  const toggleVideo = () => {
    setIsVideoOff((prev) => {
      stream?.getVideoTracks()[0] &&
        (stream.getVideoTracks()[0].enabled = prev);
      return !prev;
    });
  };

  // ---------------------------------------------------
  // INCOMING CALL UI
  // ---------------------------------------------------
  if (activeCall.isIncoming && !callAccepted) {
    return (
      <div className={style.incomingOverlay}>
        <div className={style.incomingContent}>
          <div className={style.avatarContainer}>
            {activeCall.partnerAvatar ? (
              <img
                src={activeCall.partnerAvatar}
                className={`${style.remoteAvatar} ${style.pulsingAvatar}`}
              />
            ) : (
              <div className={style.avatarPulsing}>
                {activeCall.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <h2>{activeCall.name}</h2>
          <p className={style.callType}>
            {callTypeRef.current
              ? "Incoming Video Call..."
              : "Incoming Voice Call..."}
          </p>

          <div className={style.incomingActions}>
            <button onClick={leaveCall} className={style.declineBtn}>
              <PhoneOff size={28} />
              <span>Decline</span>
            </button>

            <button onClick={answerCall} className={style.acceptBtn}>
              {callTypeRef.current ? (
                <VideoIcon size={28} />
              ) : (
                <Phone size={28} />
              )}
              <span>Accept</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------
  // ACTIVE CALL UI
  // ---------------------------------------------------
  return (
    <Draggable disabled={!isMinimized}>
      <div
        className={`${style.callContainer} ${
          isMinimized ? style.minimized : ""
        }`}
      >
        <div className={style.remoteVideoWrapper}>
          <video playsInline ref={userVideo} autoPlay className={style.remoteVideo} />

          <div className={style.remotePlaceholder}>
            {activeCall.partnerAvatar ? (
              <img src={activeCall.partnerAvatar} className={style.activeCallAvatar} />
            ) : (
              <User size={80} />
            )}
            <h3>{activeCall.name}</h3>
            <p>{callTypeRef.current ? "Video Call" : "Voice Call"}</p>
          </div>
        </div>

        {!isMinimized && (
          <div className={style.localVideoWrapper}>
            {isVideoOff ? (
              <div className={style.localPlaceholder}>
                <User size={24} />
              </div>
            ) : (
              <video playsInline muted ref={myVideo} autoPlay className={style.localVideo} />
            )}
          </div>
        )}

        {!isMinimized && (
          <div className={style.controlsOverlay}>
            <button onClick={() => setIsMinimized(true)} className={style.controlBtn}>
              <Minimize2 size={20} />
            </button>

            {callTypeRef.current && (
              <button
                onClick={toggleVideo}
                className={`${style.controlBtn} ${isVideoOff ? style.off : ""}`}
              >
                {isVideoOff ? <VideoOff /> : <VideoIcon />}
              </button>
            )}

            <button
              onClick={toggleMute}
              className={`${style.controlBtn} ${isMuted ? style.off : ""}`}
            >
              {isMuted ? <MicOff /> : <Mic />}
            </button>

            <button onClick={leaveCall} className={`${style.controlBtn} ${style.hangup}`}>
              <PhoneOff size={28} />
            </button>
          </div>
        )}

        {isMinimized && (
          <div className={style.minimizedOverlay} onClick={() => setIsMinimized(false)}>
            <Maximize2 size={16} />
            <span>Tap to expand</span>
          </div>
        )}
      </div>
    </Draggable>
  );
};

export default VideoCall;
