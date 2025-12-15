import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { useSocket } from "../context/SocketProvider";
import { apiRequest } from "../utils/api";
import {
  Loader2, Send, UserRound, ChevronLeft, Search, Moon, Sun, Smile,
  Phone, Video, Info, X, Trash2, CheckCheck, Check, BellOff, ExternalLink, Ban, ChevronRight
} from "lucide-react";
import debounce from "lodash.debounce";
import style from "../styles/messages.module.css";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import EmojiPicker from "emoji-picker-react";
import { toast } from "react-toastify";

dayjs.extend(relativeTime);

const REACTIONS = ["👍", "❤️", "😂", "🔥", "😮", "😢"];

export default function Messages() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  // --- STATE ---
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  
  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Real-time & UI
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [theme, setTheme] = useState(() => localStorage.getItem("chat_theme") || "light");
  const [showProfile, setShowProfile] = useState(false);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, data: null });

  // Refs
  const selectedChatRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputAreaRef = useRef(null);
  const textareaRef = useRef(null);

  // Sync Ref
  useEffect(() => { selectedChatRef.current = selectedChat; }, [selectedChat]);

  // --- HELPERS ---
  const formatTime = (iso) => {
    if (!iso) return "";
    const d = dayjs(iso);
    return d.isValid() ? d.format("h:mm A") : "";
  };

  const formatLastSeen = (iso) => {
    if (!iso) return "Offline";
    return `Last seen ${dayjs(iso).fromNow()}`;
  };

  const getChatPartner = (chat) => {
    if (!chat || !user) return {};
    const isUser1 = String(chat.user1_id) === String(user.unique_id);
    
    const partnerId = isUser1 ? chat.user2_id : chat.user1_id;
    const isOnline = onlineUsers.includes(String(partnerId));

    return {
      id: partnerId,
      unique_id: partnerId,
      name: isUser1 
        ? (chat.user2_full_name || chat.user2_name || chat.user2_username || "Unknown") 
        : (chat.user1_full_name || chat.user1_name || chat.user1_username || "Unknown"),
      avatar: isUser1 ? chat.user2_avatar : chat.user1_avatar,
      email: isUser1 ? chat.user2_email : chat.user1_email,
      last_active: isUser1 ? chat.user2_last_active : chat.user1_last_active,
      online: isOnline
    };
  };

  const getDisplayUser = (u) => ({
    id: u.unique_id,
    name: u.full_name || u.name || u.username || "Unknown User",
    avatar: u.avatar_url || u.avatar,
    email: u.email || "No email"
  });

  const autoGrow = () => {
    if(textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  };

  // --- 1. INITIAL LOAD ---
  useEffect(() => {
    if (!user) return;
    const loadConvos = async () => {
      try {
        const res = await apiRequest(`/messages/user/${user.unique_id}`, "GET");
        setConversations(Array.isArray(res) ? res : []);
      } catch (err) { console.error(err); }
    };
    loadConvos();
  }, [user]);

  // --- 2. HANDLE REDIRECT ---
  useEffect(() => {
    const initChat = async () => {
      const startChatWith = location.state?.startChatWith;
      if (startChatWith && user) {
        const existing = conversations.find(c => String(c.user1_id) === String(startChatWith) || String(c.user2_id) === String(startChatWith));
        if (existing) {
          loadChatMessages(existing);
        } else {
          try {
            const res = await apiRequest("/messages/conversation", "POST", {
              user1_id: user.unique_id, user2_id: startChatWith
            });
            const updatedList = await apiRequest(`/messages/user/${user.unique_id}`, "GET");
            setConversations(updatedList || []);
            const newChat = updatedList.find(c => c.conversation_id === res.conversation_id);
            loadChatMessages(newChat || res);
          } catch(e) {}
        }
        window.history.replaceState({}, document.title);
      }
    };
    if (user && (conversations.length > 0 || conversations.length === 0)) initChat();
  }, [location.state, user, conversations.length]);

  // --- 3. SOCKET LISTENERS ---
  useEffect(() => {
    if (!socket || !user) return;

    socket.emit("user_online", { userId: user.unique_id });
    socket.on("online_users", (users) => setOnlineUsers((users || []).map(String)));
    
    // A. INCOMING MESSAGE
    const handleIncoming = (data) => {
      const convId = String(data.conversationId || data.conversation_id);
      const incomingSenderId = String(data.senderId);
      const myId = String(user.unique_id);
      
      const isActive = selectedChatRef.current && String(selectedChatRef.current.conversation_id) === convId;

      if (isActive) {
        // PREVENT DOUBLE BUBBLE: If I sent it, ignore socket echo
        if (incomingSenderId !== myId) {
          setMessages(prev => {
            if (prev.some(m => m.id === data.id)) return prev;
            return [...prev, {
              id: data.id,
              sender_id: data.senderId, // Use camelCase from socket payload
              message: data.message,
              created_at: data.created_at,
              seen: true, 
              reactions: {}
            }];
          });
          socket.emit("message_seen", { conversationId: convId, messageId: data.id, userId: myId });
        } else {
          // If it IS my message returning from server, update status/ID (don't add new bubble)
          setMessages(prev => prev.map(m => m.tempId === data.tempId ? { ...m, id: data.id, seen: false } : m));
        }
        scrollToBottom();
      }
    };

    // B. SIDEBAR UPDATE
    const handleSidebarUpdate = (data) => {
      const convId = String(data.conversation_id);
      const isActive = selectedChatRef.current && String(selectedChatRef.current.conversation_id) === convId;

      setConversations(prev => {
        const otherChats = prev.filter(c => String(c.conversation_id) !== convId);
        const existing = prev.find(c => String(c.conversation_id) === convId);
        
        const unreadCount = isActive ? 0 : data.unread_messages;

        const updated = existing 
          ? { ...existing, ...data, unread_messages: unreadCount } 
          : { ...data, unread_messages: unreadCount }; 

        return [updated, ...otherChats];
      });
    };

    // C. STATUS UPDATE
    const handleStatus = ({ messageId, conversationId, seen }) => {
      if (selectedChatRef.current && String(selectedChatRef.current.conversation_id) === String(conversationId) && seen) {
        if(messageId) setMessages(prev => prev.map(m => m.id === messageId ? {...m, seen: true} : m));
        else setMessages(prev => prev.map(m => ({...m, seen: true})));
      }
    };

    // D. REACTION UPDATE
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

    socket.on("receive_message", handleIncoming);
    socket.on("conversation_updated", handleSidebarUpdate);
    socket.on("update_message_status", handleStatus);
    socket.on("reaction_update", handleReactionUpdate);

    return () => {
      socket.off("receive_message", handleIncoming);
      socket.off("conversation_updated", handleSidebarUpdate);
      socket.off("update_message_status", handleStatus);
      socket.off("reaction_update", handleReactionUpdate);
    };
  }, [socket, user]);

  // --- ACTIONS ---
  const loadChatMessages = async (chat) => {
    if (!chat) return;
    setSelectedChat(chat);
    selectedChatRef.current = chat;
    setLoadingMessages(true);
    setShowProfile(false);
    
    if(socket) socket.emit("join_conversation", { conversationId: chat.conversation_id });

    try {
      const res = await apiRequest(`/messages/${chat.conversation_id}`, "GET");
      setMessages(res || []);
      
      setConversations(prev => prev.map(c => 
        c.conversation_id === chat.conversation_id ? { ...c, unread_messages: 0 } : c
      ));
      
      if(socket) socket.emit("message_seen", { conversationId: chat.conversation_id, userId: user.unique_id });

    } catch (e) { setMessages([]); } 
    finally { setLoadingMessages(false); scrollToBottom(); }
  };

  // ✅ FIXED: Optimistic UI now uses 'sender_id' (snake_case) to match DB format
  const sendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;
    
    const tempId = `temp-${Date.now()}`;
    
    // 1. Prepare Object for UI (Must use sender_id)
    const optimisticMsg = {
      id: tempId,
      conversation_id: selectedChat.conversation_id,
      sender_id: user.unique_id, // ✅ FIX: Use snake_case for UI render check
      message: newMessage.trim(),
      created_at: new Date().toISOString(),
      seen: false,
      reactions: {},
      tempId: tempId
    };

    // 2. Prepare Payload for Server (Must use senderId for socket)
    const serverPayload = {
      conversationId: selectedChat.conversation_id,
      senderId: user.unique_id, // Server expects camelCase
      message: newMessage.trim(),
      id: tempId
    };

    // Optimistic Append
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage("");
    if(textareaRef.current) textareaRef.current.style.height = "44px";
    scrollToBottom();
    
    // Send to Server
    socket.emit("send_message", serverPayload);
    
    // Sidebar Update
    setConversations(prev => prev.map(c => 
      c.conversation_id === selectedChat.conversation_id 
      ? { ...c, last_message: optimisticMsg.message, updated_at: optimisticMsg.created_at } 
      : c
    ));
  };

  const handleReaction = (msg, emoji) => {
    const hasReacted = msg.reactions?.[user.unique_id] === emoji;
    const type = hasReacted ? 'remove' : 'add';
    
    setMessages(prev => prev.map(m => {
      if (m.id === msg.id) {
        const reactions = { ...(m.reactions || {}) };
        if (hasReacted) delete reactions[user.unique_id];
        else reactions[user.unique_id] = emoji;
        return { ...m, reactions };
      }
      return m;
    }));

    if (type === 'add') socket.emit("add_reaction", { messageId: msg.id, conversationId: selectedChat.conversation_id, emoji });
    else socket.emit("remove_reaction", { messageId: msg.id, conversationId: selectedChat.conversation_id });
    
    setContextMenu({ visible: false, x: 0, y: 0, data: null });
  };

  const deleteConversation = async () => {
    if (!selectedChat) return;
    if (!window.confirm("Delete this conversation?")) return;
    try {
      await apiRequest(`/messages/conversation/${selectedChat.conversation_id}`, "DELETE");
      setConversations(prev => prev.filter(c => c.conversation_id !== selectedChat.conversation_id));
      setSelectedChat(null);
      setShowProfile(false);
      toast.success("Deleted");
    } catch (e) { toast.error("Failed"); }
  };

  const blockUser = async () => {
    const other = getChatPartner(selectedChat);
    if(window.confirm(`Block ${other.name}?`)) {
      try {
        await apiRequest("/users/block", "POST", { blocker_id: user.unique_id, blocked_id: other.unique_id });
        toast.success("Blocked");
      } catch(e) { toast.error("Failed"); }
    }
  };

  const createChat = async (u) => {
    setSearchQuery(""); setSearchResults([]);
    try {
      const res = await apiRequest("/messages/conversation", "POST", { user1_id: user.unique_id, user2_id: u.id });
      const fullList = await apiRequest(`/messages/user/${user.unique_id}`, "GET");
      setConversations(fullList || []);
      const newChat = fullList.find(c => c.conversation_id === res.conversation_id);
      loadChatMessages(newChat || res);
    } catch(e) {}
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  
  const startSearch = debounce(async (q) => {
    if(!q.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await apiRequest(`/users/search?query=${q}`, "GET");
      setSearchResults(Array.isArray(res) ? res : []);
    } catch(e){} finally { setSearchLoading(false); }
  }, 300);

  const activePartner = getChatPartner(selectedChat);

  return (
    <div className={`${style.container} ${theme === 'dark' ? style.dark : ''}`}>
      
      {/* SIDEBAR */}
      <aside className={`${style.sidebar} ${selectedChat ? style.mobileHidden : ''}`}>
        <div className={style.sidebarHeader}>
          <div style={{display:'flex', gap:10, alignItems:'center'}}>
            <div className={style.avatarLarge} style={{width:35, height:35}}>
              {user?.avatar_url ? <img src={user.avatar_url} className={style.avatarIMG} alt="me"/> : <UserRound size={20}/>}
            </div>
            <span style={{fontWeight:600}}>Chats</span>
          </div>
          <button onClick={() => setTheme(theme==='light'?'dark':'light')} style={{background:'none', border:'none', cursor:'pointer'}}>{theme==='light'?<Moon size={20}/>:<Sun size={20}/>}</button>
        </div>

        <div className={style.searchWrapper}>
          <Search className={style.searchIcon}/>
          <input className={style.searchInput} placeholder="Search users..." value={searchQuery} onChange={e=>{setSearchQuery(e.target.value); startSearch(e.target.value);}}/>
          {searchQuery && <div style={{position:'absolute', top:55, left:0, right:0, background:'var(--sidebar-bg)', borderBottom:'1px solid var(--border-color)', zIndex:20}}>
             {searchLoading ? <div style={{padding:15}}>Searching...</div> : searchResults.map(u => {
               const display = getDisplayUser(u);
               return (
                 <div key={display.id} onClick={()=>createChat(display)} style={{padding:12, cursor:'pointer', display:'flex', gap:10, alignItems:'center', borderBottom:'1px solid var(--border-color)'}}>
                   <div className={style.avatarLarge} style={{width:30, height:30}}>{display.avatar ? <img src={display.avatar} className={style.avatarIMG}/> : <UserRound size={16}/>}</div>
                   <div><div style={{fontWeight:600}}>{display.name}</div><div style={{fontSize:12, color:'gray'}}>{display.email}</div></div>
                 </div>
               )
             })}
          </div>}
        </div>

        <div className={style.chatList}>
          {conversations.map(c => {
            const u = getChatPartner(c);
            return (
              <div key={c.conversation_id} className={`${style.chatItem} ${selectedChat?.conversation_id === c.conversation_id ? style.chatItemActive : ''}`} onClick={()=>loadChatMessages(c)}>
                <div className={style.avatarWrapper}>
                  <div className={style.avatarLarge}>{u.avatar ? <img src={u.avatar} className={style.avatarIMG}/> : <UserRound size={20}/>}</div>
                  {u.online && <div className={style.onlineIndicator}/>}
                </div>
                <div className={style.chatInfo}>
                  <div className={style.chatName}>{u.name}</div>
                  <div className={style.chatLastMessage}>
                    {String(c.last_message_sender) === String(user.unique_id) && "You: "}
                    {c.last_message || "No messages"}
                  </div>
                </div>
                <div className={style.chatTime}>
                  <span>{formatTime(c.updated_at)}</span>
                  {c.unread_messages > 0 && <span className={style.unreadBadge}>{c.unread_messages}</span>}
                </div>
                <ChevronRight size={16} color="#ccc" style={{marginLeft:5}}/>
              </div>
            )
          })}
        </div>
      </aside>

      {/* CHAT WINDOW */}
      <main className={`${style.chatWindow} ${!selectedChat ? style.mobileHidden : ''}`}>
        {selectedChat ? (
          <>
            <div className={style.chatHeader} onClick={()=>setShowProfile(!showProfile)}>
              <div style={{display:'flex', gap:10, alignItems:'center', flex:1}}>
                <ChevronLeft className={style.headerIcon} style={{display:'none'}} onClick={(e)=>{e.stopPropagation(); setSelectedChat(null);}}/>
                <div className={style.avatarLarge} style={{width:40, height:40}}>{activePartner.avatar ? <img src={activePartner.avatar} className={style.avatarIMG}/> : <UserRound/>}</div>
                <div>
                  <div className={style.headerName}>{activePartner.name}</div>
                  <div className={activePartner.online ? style.headerStatus : style.headerStatusOffline}>
                    {activePartner.online ? "Online" : formatLastSeen(activePartner.last_active)}
                  </div>
                </div>
              </div>
              <div className={style.headerActions}>
                <Phone className={style.headerIcon} onClick={(e)=>{e.stopPropagation(); toast.info("Voice call coming soon")}}/>
                <Video className={style.headerIcon} onClick={(e)=>{e.stopPropagation(); toast.info("Video call coming soon")}}/>
                <Info className={style.headerIcon} onClick={()=>setShowProfile(!showProfile)}/>
              </div>
            </div>

            <div className={style.messagesArea}>
              {loadingMessages ? <div style={{display:'flex', justifyContent:'center', marginTop:20}}><Loader2 className={style.loader}/></div> : 
               messages.map((msg, i) => {
                const mine = String(msg.sender_id) === String(user.unique_id);
                return (
                  <div key={i} className={`${style.msgWrapper} ${mine ? style.msgRight : style.msgLeft}`}>
                    <div className={style.msgBubble} onContextMenu={(e)=>{e.preventDefault(); setContextMenu({visible:true, x:e.clientX, y:e.clientY, data:msg});}}>
                      {msg.message}
                      
                      {/* Reactions */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className={style.reactionBar}>
                          {Array.from(new Set(Object.values(msg.reactions))).map((r, ri) => <span key={ri}>{r}</span>)}
                        </div>
                      )}

                      <div className={style.msgMeta}>
                        <span>{formatTime(msg.created_at)}</span>
                        {mine && (msg.seen ? <CheckCheck size={14} color="#53bdeb"/> : <Check size={14} color="#8696a0"/>)}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className={style.inputAreaWrapper} ref={inputAreaRef}>
              {showEmojiPanel && <div className={style.emojiPanel}><EmojiPicker onEmojiClick={(e)=>setNewMessage(p=>p+e.emoji)} height={350}/></div>}
              <button className={style.emojiBtn} onClick={()=>setShowEmojiPanel(!showEmojiPanel)}><Smile/></button>
              <textarea ref={textareaRef} className={style.inputBox} rows={1} placeholder="Type a message..." value={newMessage} onChange={e=>{setNewMessage(e.target.value); autoGrow();}} onKeyDown={e=>{if(e.key==='Enter' && !e.shiftKey){e.preventDefault(); sendMessage();}}}/>
              <button className={style.sendBtn} onClick={sendMessage}><Send/></button>
            </div>
          </>
        ) : (
          <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--text-secondary)'}}>
            <div style={{fontSize:50}}>👋</div>
            <h2>Welcome to Chat</h2>
          </div>
        )}
      </main>

      {/* PROFILE SIDEBAR */}
      {showProfile && selectedChat && (
        <aside className={style.profileSidebar}>
          <div className={style.profileHeader}><span>Contact Info</span><X style={{cursor:'pointer'}} onClick={()=>setShowProfile(false)}/></div>
          <div className={style.profileContent}>
            <img src={activePartner.avatar || "/person-placeholder.png"} className={style.profileAvatarLarge}/>
            <div className={style.profileName}>{activePartner.name}</div>
            <div className={style.profileEmail}>{activePartner.email}</div>
            <div className={style.section}>
              <div style={{display:'flex', flexDirection:'column', gap:10, marginTop:10}}>
                <button onClick={()=>window.open(`/profile/${activePartner.unique_id}`)} style={{padding:10, border:'1px solid #09707d', color:'#09707d', background:'none', borderRadius:6, cursor:'pointer', display:'flex', alignItems:'center', gap:8}}><ExternalLink size={16}/> View Profile</button>
                <button onClick={blockUser} style={{padding:10, border:'1px solid #ef4444', color:'#ef4444', background:'none', borderRadius:6, cursor:'pointer', display:'flex', alignItems:'center', gap:8}}><Ban size={16}/> Block User</button>
                <button onClick={deleteConversation} style={{padding:10, border:'1px solid #6b7280', color:'#6b7280', background:'none', borderRadius:6, cursor:'pointer', display:'flex', alignItems:'center', gap:8}}><Trash2 size={16}/> Delete Chat</button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Context Menu */}
      {contextMenu.visible && (
        <div className={style.contextMenu} style={{top: contextMenu.y, left: contextMenu.x}}>
          <div className={style.reactionPicker}>
            {REACTIONS.map(emoji => (
              <div key={emoji} className={style.reactionEmoji} onClick={() => handleReaction(contextMenu.data, emoji)}>
                {emoji}
              </div>
            ))}
          </div>
          <div className={style.contextMenuItem} onClick={() => { navigator.clipboard.writeText(contextMenu.data.message); setContextMenu({visible:false, data:null}); }}>
            Copy Message
          </div>
        </div>
      )}
    </div>
  );
}