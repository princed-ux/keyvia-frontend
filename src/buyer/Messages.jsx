import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { useSocket } from "../context/SocketProvider";
import { useCall } from "../context/CallProvider"; // ✅ GLOBAL CALL CONTEXT
import { apiRequest } from "../utils/api";
import {
  Send, ChevronLeft, Search, Moon, Sun, Smile,
  Phone, Video, X, Trash2, CheckCheck, Check, MoreVertical,
  MessageSquareText, Ban, Unlock, Paperclip, UserRound, PlusCircle,
  PhoneMissed // ✅ Icon for missed calls
} from "lucide-react"; 
import debounce from "lodash.debounce";
import style from "../styles/messages.module.css";

// --- Date & Time Handling ---
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc"; 
dayjs.extend(relativeTime);
dayjs.extend(utc);

import EmojiPicker from "emoji-picker-react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";

const REACTIONS = ["👍", "❤️", "😂", "🔥", "😮", "😢"];

const TypingBubble = () => (
  <div className={style.typingIndicator}>
    <span></span><span></span><span></span>
  </div>
);

export default function Messages() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { startCall } = useCall(); 
  const location = useLocation();
  const navigate = useNavigate();

  // --- STATE ---
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true); 
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  
  // UI States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [theme, setTheme] = useState(() => localStorage.getItem("chat_theme") || "light");
  const [showProfile, setShowProfile] = useState(false);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  
  // Menus
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, data: null });
  const [sidebarMenu, setSidebarMenu] = useState({ visible: false, x: 0, y: 0, chat: null });

  // Realtime
  const [typingUsers, setTypingUsers] = useState({});

  // Refs
  const selectedChatRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null); 
  const searchInputRef = useRef(null); 

  useEffect(() => { selectedChatRef.current = selectedChat; }, [selectedChat]);

  // --- HELPER: Strict Time Formatting ---
  const formatTime = (iso) => {
    if (!iso) return "";
    return dayjs.utc(iso).local().format("h:mm A");
  };

  const formatSidebarDate = (iso) => {
  if (!iso) return "";

  const date = dayjs.utc(iso).local();
  const now = dayjs();

  if (date.isSame(now, "day")) return date.format("h:mm A");
  if (date.isSame(now.subtract(1, "day"), "day")) return "Yesterday";

  return date.format("D/M/YY");
};


  // --- HELPER: Identify Chat Partner ---
  const getChatPartner = (chat) => {
    if (!chat || !user || !user.unique_id) {
        return { name: "Unknown", avatar: "/person-placeholder.png" };
    }
    
    const isUser1 = String(chat.user1_id) === String(user.unique_id);
    const partnerId = isUser1 ? chat.user2_id : chat.user1_id;
    const partnerIdString = String(partnerId);
    const isOnline = onlineUsers.includes(partnerIdString);
    const isTyping = typingUsers[partnerIdString] || false;

    const name = isUser1 
        ? (chat.user2_full_name || chat.user2_name || chat.user2_username) 
        : (chat.user1_full_name || chat.user1_name || chat.user1_username);

    const avatar = isUser1 
        ? (chat.user2_avatar || chat.user2_avatar_url) 
        : (chat.user1_avatar || chat.user1_avatar_url);

    const email = isUser1 ? chat.user2_email : chat.user1_email;
    const lastActive = isUser1 ? chat.user2_last_active : chat.user1_last_active;

    return {
      id: partnerId,
      unique_id: partnerId,
      name: name || "Unknown User",
      avatar: avatar || "/person-placeholder.png",
      email: email || "",
      last_active: lastActive,
      online: isOnline,
      isTyping: isTyping 
    };
  };

  const activePartner = getChatPartner(selectedChat);

  const autoGrow = () => {
    if(textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- 1. FETCH CONVERSATIONS ---
  const fetchConversations = async () => {
    if(!user) return;
    try {
        const res = await apiRequest(`/api/messages/user/${user.unique_id}`, "GET");
        const uniqueConvs = Array.isArray(res) ? 
            [...new Map(res.map(item => [item.conversation_id, item])).values()] 
            : [];
        setConversations(uniqueConvs);
    } catch(e) {
        console.error("Error fetching chats:", e);
    } finally {
        setLoadingConversations(false);
    }
  };

  useEffect(() => {
    setLoadingConversations(true); 
    fetchConversations();
  }, [user]);

  // --- 2. HANDLE REDIRECT ---
  useEffect(() => {
    if (loadingConversations || !user || !location.state?.startChatWith) return;

    const targetId = location.state.startChatWith;
    const existingChat = conversations.find(c => 
      String(c.user1_id) === String(targetId) || String(c.user2_id) === String(targetId)
    );

    if (existingChat) {
      if (selectedChat?.conversation_id !== existingChat.conversation_id) {
        loadChatMessages(existingChat);
      }
      navigate(location.pathname, { replace: true, state: {} });
    } else {
      fetchUserAndCreate(targetId);
    }
  }, [loadingConversations, conversations, location.state, user]);

  const fetchUserAndCreate = async (targetId) => {
      try {
          const res = await apiRequest(`/api/listings/public/agent/${targetId}`, "GET");
          if(res && res.agent) {
              const u = {
                  id: res.agent.unique_id,
                  name: res.agent.full_name,
                  avatar: res.agent.avatar_url
              };
              await createChat(u);
              navigate(location.pathname, { replace: true, state: {} });
          }
      } catch (err) {
          console.error("Error auto-creating chat:", err);
          toast.error("Could not start conversation.");
      }
  };

  // --- SOCKET LISTENERS ---
  useEffect(() => {
    if (!socket || !user) return;
    socket.emit("user_online", { userId: user.unique_id });
    socket.on("online_users", (users) => setOnlineUsers((users || []).map(String)));
    
    // 1. New Message Received
    const handleIncoming = (data) => {
      const convId = String(data.conversationId || data.conversation_id);
      const incomingSenderId = String(data.senderId);
      const myId = String(user.unique_id);
      
      const isActive = selectedChatRef.current && String(selectedChatRef.current.conversation_id) === convId;

      if (isActive) {
        setTypingUsers(prev => ({ ...prev, [incomingSenderId]: false }));

        setMessages(prev => {
            if (data.tempId) {
                const tempIndex = prev.findIndex(m => m.id === data.tempId);
                if (tempIndex !== -1) {
                    const newMsgs = [...prev];
                    newMsgs[tempIndex] = { 
                        ...data, 
                        sender_id: data.senderId, 
                        seen: false 
                    }; 
                    return newMsgs;
                }
            }
            if (prev.some(m => String(m.id) === String(data.id))) return prev;
            return [...prev, {
              id: data.id, 
              sender_id: data.senderId, 
              message: data.message,
              created_at: data.created_at,
              seen: true, 
              reactions: {}
            }];
        });

        if (incomingSenderId !== myId) {
          socket.emit("message_seen", { conversationId: convId, messageId: data.id, userId: myId });
        }
      }
    };

    // 2. Sidebar Updated
    const handleSidebarUpdate = (data) => {
      const convId = String(data.conversation_id);
      const isActive = selectedChatRef.current && String(selectedChatRef.current.conversation_id) === convId;
      
      setConversations(prev => {
        const existingIndex = prev.findIndex(c => String(c.conversation_id) === convId);
        if (existingIndex === -1) {
            fetchConversations();
            return prev; 
        }
        const oldConv = prev[existingIndex];
        const updatedChat = { 
            ...oldConv, 
            ...data, 
            unread_messages: isActive ? 0 : data.unread_messages 
        };
        const newConversations = prev.filter(c => String(c.conversation_id) !== convId);
        return [updatedChat, ...newConversations];
      });
    };

    const handleReactionUpdate = ({ messageId, userId, emoji, type }) => {
      setMessages(prev => prev.map(m => {
        if (m.id === messageId) {
          const reactions = { ...(m.reactions || {}) };
          if (type === 'add') reactions[userId] = emoji;
          else delete reactions[userId];
          return { ...m, reactions };
        }
        return m;
      }));
    };

    const handleMessageDeleted = ({ messageId }) => {
        setMessages(prev => prev.filter(m => String(m.id) !== String(messageId)));
    };

    const handleUserTyping = ({ userId }) => setTypingUsers(prev => ({ ...prev, [String(userId)]: true }));
    const handleUserStopTyping = ({ userId }) => setTypingUsers(prev => ({ ...prev, [String(userId)]: false }));

    socket.on("receive_message", handleIncoming);
    socket.on("conversation_updated", handleSidebarUpdate);
    socket.on("reaction_update", handleReactionUpdate);
    socket.on("message_deleted", handleMessageDeleted); 
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stop_typing", handleUserStopTyping);

    return () => {
      socket.off("receive_message", handleIncoming);
      socket.off("conversation_updated", handleSidebarUpdate);
      socket.off("reaction_update", handleReactionUpdate);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stop_typing", handleUserStopTyping);
    };
  }, [socket, user]);

  // --- HANDLERS ---
  const handleTypingInput = (e) => {
    setNewMessage(e.target.value);
    autoGrow();
    if (!selectedChat || !socket) return;
    socket.emit("typing", { conversationId: selectedChat.conversation_id, userId: user.unique_id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop_typing", { conversationId: selectedChat.conversation_id, userId: user.unique_id });
    }, 2000);
  };

  const loadChatMessages = async (chat) => {
    if (!chat) return;
    setMessages([]); setLoadingMessages(true); setShowProfile(false); setIsBlocked(Boolean(chat.is_blocked));
    setSelectedChat(chat); selectedChatRef.current = chat;
    
    if(socket) socket.emit("join_conversation", { conversationId: chat.conversation_id });
    
    try {
      const res = await apiRequest(`/api/messages/${chat.conversation_id}`, "GET");
      setMessages(res || []);
      setConversations(prev => prev.map(c => 
          c.conversation_id === chat.conversation_id ? { ...c, unread_messages: 0 } : c
      ));
      if(socket) socket.emit("message_seen", { conversationId: chat.conversation_id, userId: user.unique_id });
    } catch (e) { setMessages([]); } 
    finally { setLoadingMessages(false); }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit("stop_typing", { conversationId: selectedChat.conversation_id, userId: user.unique_id });

    const tempId = `temp-${Date.now()}`;
    const nowISO = new Date().toISOString(); 

    const optimisticMsg = {
      id: tempId, 
      conversation_id: selectedChat.conversation_id, 
      sender_id: user.unique_id, 
      message: newMessage.trim(), 
      created_at: nowISO, 
      seen: false, 
      reactions: {}, 
      tempId: tempId
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage("");
    if(textareaRef.current) textareaRef.current.style.height = "auto";
    
    socket.emit("send_message", { 
        conversationId: selectedChat.conversation_id, 
        senderId: user.unique_id, 
        message: optimisticMsg.message, 
        id: tempId 
    });
    
    setConversations(prev => {
        const existing = prev.find(c => c.conversation_id === selectedChat.conversation_id);
        const updateData = {
            last_message: optimisticMsg.message,
            updated_at: nowISO,
            last_message_sender: user.unique_id 
        };
        const updated = existing 
            ? { ...existing, ...updateData }
            : { ...selectedChat, ...updateData };
        const others = prev.filter(c => c.conversation_id !== selectedChat.conversation_id);
        return [updated, ...others];
    });
  };

  const handleReaction = (msg, emoji) => {
    const hasReacted = msg.reactions?.[user.unique_id] === emoji;
    const type = hasReacted ? 'remove' : 'add';
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, reactions: hasReacted ? (delete m.reactions[user.unique_id], m.reactions) : { ...m.reactions, [user.unique_id]: emoji } } : m));
    socket.emit(type === 'add' ? "add_reaction" : "remove_reaction", { messageId: msg.id, conversationId: selectedChat.conversation_id, emoji });
    setContextMenu({ visible: false, x: 0, y: 0, data: null });
  };

  const handleDeleteMessage = async (msg) => {
    setContextMenu({ visible: false, x: 0, y: 0, data: null });
    if (String(msg.id).startsWith("temp-")) {
        toast.warning("Wait for message to send...");
        return;
    }
    setMessages(prev => prev.filter(m => m.id !== msg.id));
    try {
        await apiRequest(`/api/messages/${msg.id}`, "DELETE");
        socket.emit("delete_message", { 
            messageId: msg.id, 
            conversationId: selectedChat.conversation_id 
        });
        toast.success("Deleted");
    } catch (err) {
        toast.error("Delete failed");
    }
  };

  const deleteConversation = async (targetChat) => {
    if (!targetChat) return;
    const result = await Swal.fire({ title: "Delete Chat?", text: "This will only remove it for you.", icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444" });
    if (result.isConfirmed) {
      try {
        await apiRequest(`/api/messages/conversation/${targetChat.conversation_id}`, "DELETE");
        setConversations(prev => prev.filter(c => c.conversation_id !== targetChat.conversation_id));
        if (selectedChat?.conversation_id === targetChat.conversation_id) setSelectedChat(null);
        setSidebarMenu({ ...sidebarMenu, visible: false });
      } catch (e) { toast.error("Failed"); }
    }
  };

  const blockUser = async () => {
    const other = getChatPartner(selectedChat);
    const result = await Swal.fire({ title: `Block ${other.name}?`, icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444" });
    if (result.isConfirmed) {
      try {
        await apiRequest("/users/block", "POST", { blocker_id: user.unique_id, blocked_id: other.unique_id });
        setIsBlocked(true);
        setConversations(prev => prev.map(c => c.conversation_id === selectedChat.conversation_id ? { ...c, is_blocked: true } : c));
      } catch (e) { toast.error("Failed"); }
    }
  };

  const unblockUser = async () => {
    const other = getChatPartner(selectedChat);
    try {
      await apiRequest("/users/unblock", "POST", { blocker_id: user.unique_id, blocked_id: other.unique_id });
      setIsBlocked(false);
      setConversations(prev => prev.map(c => c.conversation_id === selectedChat.conversation_id ? { ...c, is_blocked: false } : c));
      toast.success("Unblocked");
    } catch (e) { toast.error("Failed"); }
  };

  const createChat = async (u) => {
    setSearchQuery(""); setSearchResults([]);
    try {
      const res = await apiRequest("/api/messages/conversation", "POST", { user1_id: user.unique_id, user2_id: u.id });
      const isMeUser1 = res.user1_id === user.unique_id;
      const hydratedChat = {
          ...res,
          is_blocked: false,
          [isMeUser1 ? 'user2_full_name' : 'user1_full_name']: u.name || u.full_name,
          [isMeUser1 ? 'user2_avatar' : 'user1_avatar']: u.avatar,
          [isMeUser1 ? 'user2_email' : 'user1_email']: "No email visible" 
      };
      setConversations(prev => {
          if (prev.find(c => c.conversation_id === hydratedChat.conversation_id)) return prev;
          return [hydratedChat, ...prev];
      });
      loadChatMessages(hydratedChat);
    } catch(e) {
        console.error(e);
        toast.error("Could not start chat");
    }
  };

  const startSearch = debounce(async (q) => {
    if(!q.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await apiRequest(`/users/search?query=${q}`, "GET");
      setSearchResults(Array.isArray(res) ? res : []);
    } catch(e){} finally { setSearchLoading(false); }
  }, 300);

  const handleSidebarContextMenu = (e, chat) => {
      e.preventDefault();
      setSidebarMenu({ visible: true, x: e.clientX, y: e.clientY, chat });
  };

  // ✅ GLOBAL CALL TRIGGER HANDLER (Includes Avatar)
  const handleStartCall = (isVideo = true) => {
    if (activePartner && activePartner.id) {
        startCall(activePartner.id, activePartner.name, activePartner.avatar, isVideo);
    } else {
        toast.error("Select a user first");
    }
  };

  // --- RENDER ---
  return (
    <div className={`${style.container} ${theme === 'dark' ? style.dark : ''}`} onClick={() => { 
        setContextMenu({...contextMenu, visible:false}); 
        setSidebarMenu({...sidebarMenu, visible:false});
        setShowEmojiPanel(false); 
    }}>
      
      {/* 1. SIDEBAR */}
      <aside className={`${style.sidebar} ${selectedChat ? style.mobileHidden : ''}`}>
        <div className={style.sidebarHeader}>
           <h2 className={style.brandTitle}>Messages</h2>
           <div className={style.sidebarControls}>
            <button onClick={() => setTheme(theme==='light'?'dark':'light')} className={style.iconBtn}>
              {theme==='light'?<Moon size={18}/>:<Sun size={18}/>}
            </button>
          </div>
        </div>

        <div className={style.searchWrapper}>
          <div className={style.searchBar}>
            <Search className={style.searchIcon}/>
            <input 
              ref={searchInputRef}
              placeholder="Search people..." 
              value={searchQuery} 
              onChange={e=>{setSearchQuery(e.target.value); startSearch(e.target.value);}}
            />
            {searchQuery && <X size={16} className={style.clearIcon} onClick={()=>setSearchQuery("")}/>}
          </div>
          
          <AnimatePresence>
            {searchQuery && (
              <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className={style.searchResults}>
                {searchLoading ? <div className={style.loadingState}><div className={style.spinner}/></div> : 
                 searchResults.length === 0 ? <div className={style.emptyState}>No users found</div> :
                 searchResults.map(u => (
                    <div key={u.unique_id} 
                        onClick={()=>createChat({id:u.unique_id, name: u.full_name || u.username, avatar: u.avatar_url})} 
                        className={style.searchResultItem}>
                      <img src={u.avatar_url || "/person-placeholder.png"} alt=""/>
                      <span>{u.full_name || u.username}</span>
                    </div>
                 ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={style.chatList}>
          {loadingConversations ? (
            Array(5).fill(0).map((_, i) => (
                <div key={i} className={style.skeletonChatItem}>
                    <div className={`${style.skeleton} ${style.skeletonAvatar}`} />
                    <div className={style.skeletonInfo}>
                        <div className={`${style.skeleton} ${style.skeletonName}`} />
                        <div className={`${style.skeleton} ${style.skeletonPreview}`} />
                    </div>
                </div>
            ))
          ) : conversations.length === 0 ? (
            <div className={style.emptyChatList}>
              <div className={style.illustration}>
                <MessageSquareText size={36} strokeWidth={1.5} />
              </div>
              <h3>No Messages Yet</h3>
              <p>Connect with buyers, sellers, and agents to start a new conversation.</p>
              
              <button className={style.startChatBtn} onClick={() => searchInputRef.current?.focus()}>
                <PlusCircle size={18} /> 
                <span>Start New Chat</span>
              </button>
            </div>
          ) : (
            conversations.map(c => {
                const u = getChatPartner(c);
                const isActive = selectedChat?.conversation_id === c.conversation_id;
                
                if ((!c.last_message || c.last_message === "") && !isActive) return null;

                return (
                  <motion.div 
                    layout 
                    key={c.conversation_id} 
                    className={`${style.chatItem} ${isActive ? style.chatItemActive : ''}`} 
                    onClick={()=>loadChatMessages(c)}
                    onContextMenu={(e) => handleSidebarContextMenu(e, c)}
                  >
                    <div className={style.avatarWrapper}>
                        <img src={u.avatar || "/person-placeholder.png"} className={style.avatarIMG} alt="avatar"/>
                        {u.online && <span className={style.onlineDot}/>}
                    </div>
                    <div className={style.chatInfo}>
                      <div className={style.chatTopRow}>
                        <span className={style.chatName}>{u.name}</span>
                        <span className={style.chatTime}>{formatSidebarDate(c.last_message_time || c.updated_at)}</span>
                      </div>
                      <div className={style.chatBottomRow}>
                        {u.isTyping ? (
                          <span className={style.typingText}>typing...</span>
                        ) : (
                          <>
                            <span className={`${style.chatPreview} ${c.unread_messages > 0 ? style.boldPreview : ''}`}>
                              {String(c.last_message_sender) === String(user.unique_id) && "You: "}
                              {c.last_message || "Started a chat"}
                            </span>
                            {c.unread_messages > 0 && <span className={style.unreadBadge}>{c.unread_messages}</span>}
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
            })
          )}
        </div>
      </aside>

      {/* 2. CHAT AREA */}
      <main className={`${style.chatWindow} ${!selectedChat ? style.mobileHidden : ''}`}>
        {selectedChat ? (
          <>
            <header className={style.chatHeader}>
              <div className={style.headerLeft}>
                <button className={style.backBtn} onClick={()=>setSelectedChat(null)}><ChevronLeft/></button>
                <div className={style.headerAvatar} onClick={()=>setShowProfile(true)}>
                  <img src={activePartner.avatar || "/person-placeholder.png"} alt=""/>
                  {activePartner.online && <div className={style.onlineBadge}/>}
                </div>
                <div className={style.headerInfo} onClick={()=>setShowProfile(true)}>
                  <h3>{activePartner.name}</h3>
                  {activePartner.isTyping ? (
                    <span className={style.headerTyping}>is typing...</span>
                  ) : (
                    <span>{activePartner.online ? "Active now" : activePartner.last_active ? `Last seen ${dayjs(activePartner.last_active).fromNow()}` : "Offline"}</span>
                  )}
                </div>
              </div>
              <div className={style.headerActions}>
                 <button className={style.actionBtn} onClick={() => handleStartCall(false)}><Phone size={20}/></button>
                 <button className={style.actionBtn} onClick={() => handleStartCall(true)}><Video size={20}/></button>
                 <button className={style.actionBtn} onClick={(e)=>{ e.stopPropagation(); setShowProfile(!showProfile); }}><MoreVertical size={20}/></button>
              </div>
            </header>

            <div className={style.messagesArea} onClick={(e) => { e.stopPropagation(); setContextMenu({...contextMenu, visible:false}); }}>
              {loadingMessages ? (
                Array(4).fill(0).map((_, i) => (
                    <div key={i} className={`${style.skeletonMsgWrapper} ${i % 2 === 0 ? style.skeletonMsgLeft : style.skeletonMsgRight}`}>
                        {i % 2 === 0 && <div className={`${style.skeleton} ${style.skeletonAvatar}`} style={{width: 32, height: 32, marginRight: 10}} />}
                        <div className={`${style.skeleton} ${style.skeletonBubble}`} style={{ width: Math.floor(Math.random() * (250 - 100 + 1)) + 100 }} />
                    </div>
                ))
              ) : (
                <>
                  {messages.map((msg, i) => {
                      const mine = String(msg.sender_id) === String(user.unique_id);
                      
                      // ✅ RESTORED MISSING VARIABLES HERE
                      const isLastInGroup = !messages[i+1] || String(messages[i+1].sender_id) !== String(msg.sender_id);
                      const showAvatar = !mine && isLastInGroup;

                      // ✅ DETECT & RENDER MISSED CALLS (WhatsApp Style)
                      const isSystemMessage = msg.message.toLowerCase().includes("missed") && msg.message.toLowerCase().includes("call");

                      if (isSystemMessage) {
                          return (
                              <div key={msg.id || i} className={style.systemMessageWrapper} style={{display:'flex', justifyContent:'center', margin: '15px 0'}}>
                                  <div style={{background: 'rgba(0,0,0,0.05)', padding: '5px 12px', borderRadius: '15px', fontSize: '12px', color: '#666', display:'flex', alignItems:'center', gap:'5px'}}>
                                      <PhoneMissed size={14} /> {msg.message} • {formatTime(msg.created_at)}
                                  </div>
                              </div>
                          );
                      }

                      return (
                        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} key={msg.id || i} className={`${style.msgWrapper} ${mine ? style.msgRight : style.msgLeft} ${isLastInGroup ? style.groupLast : ''}`}>
                          {!mine && <div className={style.msgAvatarHolder}>{showAvatar && <img src={activePartner.avatar || "/person-placeholder.png"} alt="" className={style.miniAvatar}/>}</div>}
                          <div className={style.msgBubble} data-mine={mine} onContextMenu={(e)=>{e.preventDefault(); e.stopPropagation(); setContextMenu({visible:true, x:e.clientX, y:e.clientY, data:msg});}}>
                            {msg.message}
                            <div className={style.msgFooter}>
                              <span className={style.timestamp}>{formatTime(msg.created_at)}</span>
                              {mine && (msg.seen ? <CheckCheck size={14} className={style.seenIcon}/> : <Check size={14} className={style.sentIcon}/>)}
                            </div>
                            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                              <div className={style.reactionPill}>
                                {Object.entries(msg.reactions).slice(0,3).map(([uid, emoji]) => <span key={uid}>{emoji}</span>)}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )
                  })}
                  {activePartner.isTyping && (
                    <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className={`${style.msgWrapper} ${style.msgLeft}`}>
                        <div className={style.msgAvatarHolder}><img src={activePartner.avatar || "/person-placeholder.png"} alt="" className={style.miniAvatar}/></div>
                        <div className={style.msgBubble} style={{padding: '12px 16px', width: 'fit-content'}}><TypingBubble /></div>
                    </motion.div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className={style.inputContainer}>
                {isBlocked ? (
                    <div className={style.blockedBanner}>
                        <Ban size={18}/> <span>You have blocked this contact.</span>
                        <button onClick={unblockUser}>Unblock</button>
                    </div>
                ) : (
                    <div className={style.inputWrapper}>
                        {/* ✅ Stop Propagation on Emoji Toggle */}
                        <button className={style.attachBtn} onClick={(e)=>{ e.stopPropagation(); setShowEmojiPanel(!showEmojiPanel); }}><Smile size={20}/></button>
                        <button className={style.attachBtn}><Paperclip size={20}/></button>
                        <textarea ref={textareaRef} className={style.inputField} placeholder="Message..." value={newMessage} onChange={handleTypingInput} onKeyDown={e=>{if(e.key==='Enter' && !e.shiftKey){e.preventDefault(); sendMessage();}}} rows={1} />
                        <button className={`${style.sendBtn} ${!newMessage.trim() ? style.disabled : ''}`} onClick={sendMessage}><Send size={18} fill="currentColor"/></button>
                    </div>
                )}
                <AnimatePresence>
                  {showEmojiPanel && (
                    /* ✅ Stop Propagation on Emoji Panel */
                    <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.9}} className={style.emojiPickerContainer} onClick={(e)=>e.stopPropagation()}>
                      <EmojiPicker onEmojiClick={(e)=>setNewMessage(p=>p+e.emoji)} height={350} width="100%"/>
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>
          </>
        ) : (
          <div className={style.welcomeScreen}>
            <div className={style.welcomeContent}>
              <div className={style.welcomeIcon}><MessageSquareText size={64} strokeWidth={1.5}/></div>
              <h2>Welcome to Messages</h2>
              <p>Select a chat to start messaging or search for a new connection.</p>
            </div>
          </div>
        )}
      </main>
      
      {/* 3. PROFILE SLIDER */}
      <AnimatePresence>
        {showProfile && selectedChat && (
          <motion.aside initial={{x: "100%"}} animate={{x:0}} exit={{x:"100%"}} transition={{type:"spring", damping:25}} className={style.profilePanel} onClick={(e)=>e.stopPropagation()}>
            <div className={style.panelHeader}>
              <h3>Contact Info</h3>
              <button onClick={()=>setShowProfile(false)}><X size={20}/></button>
            </div>
            <div className={style.panelBody}>
              <div className={style.profileHero}>
                <img src={activePartner.avatar || "/person-placeholder.png"} alt=""/>
                <h2>{activePartner.name}</h2>
                <span>{activePartner.email}</span>
              </div>
              <div className={style.panelActions}>
                <button onClick={()=>navigate(`/profile/${activePartner.unique_id}`)} className={style.panelBtn}><UserRound size={18}/> View Profile</button>
                <button onClick={isBlocked ? unblockUser : blockUser} className={`${style.panelBtn} ${style.dangerBtn}`}>{isBlocked ? <Unlock size={18}/> : <Ban size={18}/>} {isBlocked ? "Unblock" : "Block"} User</button>
                <button onClick={() => deleteConversation(selectedChat)} className={`${style.panelBtn} ${style.dangerBtn}`}><Trash2 size={18}/> Delete Chat</button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* 4. MESSAGE CONTEXT MENU */}
      {contextMenu.visible && (
        <div className={style.contextBackdrop} onClick={(e)=> {e.stopPropagation(); setContextMenu({...contextMenu, visible:false})}}>
          <div className={style.contextMenu} style={{top: contextMenu.y, left: contextMenu.x}}>
            <div className={style.reactionRow}>
              {REACTIONS.map(emoji => <button key={emoji} onClick={() => handleReaction(contextMenu.data, emoji)}>{emoji}</button>)}
            </div>
            <div className={style.menuDivider}/>
            <button className={style.menuItem} onClick={() => { navigator.clipboard.writeText(contextMenu.data.message); setContextMenu({visible:false}); }}>Copy Text</button>
            
            {String(contextMenu.data.sender_id) === String(user.unique_id) && (
                <button className={`${style.menuItem} ${style.deleteItem}`} onClick={() => handleDeleteMessage(contextMenu.data)}>
                    Delete Message
                </button>
            )}
          </div>
        </div>
      )}

      {/* 5. SIDEBAR CONTEXT MENU */}
      {sidebarMenu.visible && (
        <div className={style.contextBackdrop} onClick={(e)=> {e.stopPropagation(); setSidebarMenu({...sidebarMenu, visible:false})}}>
          <div className={style.contextMenu} style={{top: sidebarMenu.y, left: sidebarMenu.x}}>
            <button className={`${style.menuItem} ${style.deleteItem}`} onClick={() => deleteConversation(sidebarMenu.chat)}>
               <Trash2 size={16} /> Delete Conversation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};