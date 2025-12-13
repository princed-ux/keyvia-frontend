// src/pages/Messages.jsx
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthProvider";
import { useSocket } from "../context/SocketProvider";
import { apiRequest } from "../utils/api";
import {
  Loader2,
  Send,
  UserRound,
  ChevronLeft,
  Search,
  Moon,
  Sun,
  Smile,
} from "lucide-react";
import debounce from "lodash.debounce";
import style from "../styles/messages.module.css";
import dayjs from "dayjs";
import { formatLastSeen } from "../utils/time";
import EmojiPicker from "emoji-picker-react";




// Array of 'like' style emojis
const LIKE_EMOJIS = ["👍", "❤️", "😆", "😮", "😢", "😠", "💯", "🔥", "🙏"];
const REACTIONS = ["👍", "❤️", "😂", "🔥", "😮", "😢", "😡"];

export default function Messages() {
  const { user } = useAuth();
  const { socket, joinConversation } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [openReactionFor, setOpenReactionFor] = useState(null);
  const [typingMap, setTypingMap] = useState({});
  const [theme, setTheme] = useState(
    () => localStorage.getItem("chat_theme") || "light"
  );
  // *** NEW STATE ***
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);

  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    chat: null,
  });

  const messagesEndRef = useRef(null);
  const emojiBtnRef = useRef(null);
  const inputAreaRef = useRef(null);

  const textareaRef = useRef(null);

  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto"; // reset first
    el.style.height = el.scrollHeight + "px"; // grow based on content
  }

  function autoGrowReset() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "44px"; // <- your min-height
  }

  // Theme toggle
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("chat_theme", theme);
  }, [theme]);

  // Handle clicks outside the emoji panel to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is outside the input area (which contains the panel and the button)
      if (
        inputAreaRef.current &&
        !inputAreaRef.current.contains(event.target)
      ) {
        setShowEmojiPanel(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [inputAreaRef]);

  // Fetch conversations
  const fetchChats = async () => {
    if (!user) return;
    try {
      const res = await apiRequest(`/messages/user/${user.unique_id}`, "GET");
      setConversations(res || []);
    } catch (err) {
      console.error("Error fetching conversations", err);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [user]);

  // Smooth scroll
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages]);

  // Load messages for a chat
  const loadChatMessages = async (chat) => {
    setSelectedChat(chat);
    setLoadingMessages(true);
    setShowEmojiPanel(false); // Close panel when switching chats

    const conversationId = chat.conversation_id;

    // Ensure socket room join (emit directly; also call context helper if provided)
    if (socket) {
      socket.emit("join_conversation", { conversationId });
    }
    if (typeof joinConversation === "function") {
      try {
        joinConversation(conversationId);
      } catch (e) {
        // ignore if not defined or fails
      }
    }

    try {
      const res = await apiRequest(`/messages/${conversationId}`, "GET");
      setMessages(res || []);

      // Reset unread messages when opening this chat
setConversations((prev) =>
  prev.map((c) =>
    String(c.conversation_id) === String(conversationId)
      ? { ...c, unread_messages: 0 }
      : c
  )
);


      // Mark incoming (other user's) messages as seen
      if (socket && res && res.length) {
        res.forEach((m) => {
          const senderId = m.sender_id || m.senderId;
          // if the message was sent by other user and not yet marked seen, emit seen
          if (senderId && senderId !== user.unique_id && !m.seen) {
            socket.emit("message_seen", { conversationId, messageId: m.id });
          }
        });
      }

      // Refresh chat list (to update last_message/updated_at)
      fetchChats();
    } catch (err) {
      console.error("Error loading messages", err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
      scrollToBottom(false);
    }
  };

  // ---------- Socket listeners ----------
  // online users
  useEffect(() => {
    if (!socket || !user) return;
    socket.emit("user_online", { userId: user.unique_id });
    return () => {
      socket.emit("user_offline", { userId: user.unique_id });
    };
  }, [socket, user]);

  useEffect(() => {
  if (!socket) return;
  const handleOnline = (users) => {
    // server sends Object.keys(onlineUsers) — convert all to strings
    setOnlineUsers((users || []).map(String));
  };
  socket.on("online_users", handleOnline);
  return () => socket.off("online_users", handleOnline);
}, [socket]);


  // ----------------- improved incoming messages handler -----------------
  useEffect(() => {
  if (!socket) return;

  const handleIncoming = (data) => {
    if (!data) return;

    const payloadConvId = String(data.conversationId ?? data.conversation_id);
    const senderId = data.senderId ?? data.sender_id;

    // If this chat is currently open
    const isChatOpen =
      selectedChat && String(selectedChat.conversation_id) === payloadConvId;

    // -------------------------
    // 1️⃣ Update messages list
    // -------------------------
    if (isChatOpen) {
      // Ignore your own messages (optimistic UI already appended)
      if (String(senderId) !== String(user.unique_id)) {
        setMessages((prev) => [
          ...prev,
          {
            id: data.id ?? `tmp-${Date.now()}`,
            sender_id: senderId,
            message: data.message,
            created_at: data.created_at ?? new Date().toISOString(),
            avatar_url: data.avatar_url ?? null,
            seen: data.seen ?? false,
            reactions: data.reactions ?? {},
          },
        ]);

        // Mark as seen
        if (data.id) {
          socket.emit("message_seen", {
            conversationId: payloadConvId,
            messageId: data.id,
          });
        }
      }
    }

    // -------------------------
    // 2️⃣ Update sidebar conversations
    // -------------------------
    setConversations((prev) =>
      prev.map((c) => {
        if (String(c.conversation_id) === payloadConvId) {
          const isFromOther = String(senderId) !== String(user.unique_id);
          const unread = isFromOther
            ? isChatOpen
              ? 0 // reset if chat is open
              : (c.unread_messages || 0) + 1
            : c.unread_messages || 0;

          return {
            ...c,
            last_message: data.message,
            updated_at: data.created_at ?? new Date().toISOString(),
            unread_messages: unread,
          };
        }
        return c;
      })
    );

    // -------------------------
    // 3️⃣ Fetch new conversation if not in list
    // -------------------------
    const exists = conversations.some(
      (c) => String(c.conversation_id) === payloadConvId
    );
    if (!exists) fetchChats();

    scrollToBottom();
  };

  socket.on("receive_message", handleIncoming);
  return () => socket.off("receive_message", handleIncoming);
}, [socket, selectedChat, user, conversations]);


  // ----------------- Sidebar Live Updates (merge/insert) -----------------
  useEffect(() => {
    if (!socket) return;

    const handleSidebarUpdate = (updatedConv) => {
      if (!updatedConv) return;

      // normalize id
      const updatedId = String(
        updatedConv.conversation_id ?? updatedConv.conversationId
      );

      setConversations((prev) => {
        // if exists -> replace/merge; otherwise prepend
        const exists = prev.some(
          (c) => String(c.conversation_id) === updatedId
        );
        const normalizedUpdated = {
          ...updatedConv,
          conversation_id: updatedId,
          unread_messages: Number(updatedConv.unread_messages ?? 0),
        };

        if (exists) {
          return prev.map((c) =>
            String(c.conversation_id) === updatedId
              ? { ...c, ...normalizedUpdated }
              : c
          );
        } else {
          return [normalizedUpdated, ...prev];
        }
      });
    };

    socket.on("conversation_updated", handleSidebarUpdate);
    return () => socket.off("conversation_updated", handleSidebarUpdate);
  }, [socket]);

  // ----------------- typing indicator (per-conversation) -----------------
  useEffect(() => {
    if (!socket) return;

    const handleTyping = ({ conversationId, userId }) => {
      if (!conversationId || !userId) return;
      const convId = String(conversationId);

      // add userId to the set for this conversation
      setTypingMap((prev) => {
        const copy = { ...prev };
        const s = new Set(copy[convId] ? copy[convId] : []);
        s.add(String(userId));
        copy[convId] = s;
        return copy;
      });

      // remove after timeout
      setTimeout(() => {
        setTypingMap((prev) => {
          const copy = { ...prev };
          const s = new Set(copy[convId] ? copy[convId] : []);
          s.delete(String(userId));
          if (s.size === 0) delete copy[convId];
          else copy[convId] = s;
          return copy;
        });
      }, 1800);
    };

    socket.on("typing_indicator", handleTyping);
    return () => socket.off("typing_indicator", handleTyping);
  }, [socket]);

  // message status updates (delivered/seen) - server should emit these
  useEffect(() => {
    if (!socket) return;

    const handleUpdateStatus = ({ messageId, seen, delivered }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === messageId || m.id == messageId) {
            if (seen) return { ...m, status: "seen", seen: true };
            if (delivered) return { ...m, status: "delivered" };
          }
          return m;
        })
      );
    };

    socket.on("update_message_status", handleUpdateStatus);
    socket.on("message_delivered", handleUpdateStatus);
    socket.on("message_seen", handleUpdateStatus);

    return () => {
      socket.off("update_message_status", handleUpdateStatus);
      socket.off("message_delivered", handleUpdateStatus);
      socket.off("message_seen", handleUpdateStatus);
    };
  }, [socket]);

  // Emit typing
  const handleTyping = () => {
    if (!socket || !selectedChat) return;
    socket.emit("typing", {
      conversationId: selectedChat.conversation_id,
      userId: user.unique_id,
    });
  };

  // *** NEW EMOJI HELPER ***
const handleEmojiSelect = (emoji) => {
  setNewMessage((prev) => prev + emoji);
  setTimeout(() => autoGrow(), 0);
};

  // *************************

  // ---------- Send message (optimistic UI) ----------
  const sendMessage = () => {
    if (!newMessage.trim() || !selectedChat || !socket) return;

    const tempId = `tmp-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const payload = {
      conversationId: selectedChat.conversation_id,
      senderId: user.unique_id,
      message: newMessage.trim(),
      status: "sent",
      id: tempId,
      created_at: nowIso,
      avatar_url: user.avatar_url || null,
    };

    // append locally right away
    setMessages((prev) => [...prev, payload]);
    scrollToBottom();

    // update conversations (local sidebar) — sender's last_message should update
    setConversations((prev) =>
      prev.map((c) =>
        String(c.conversation_id) === String(selectedChat.conversation_id)
          ? {
              ...c,
              last_message: payload.message,
              updated_at: payload.created_at,
            }
          : c
      )
    );

    // emit to server (server will send the authoritative receive_message with real id)
    socket.emit("send_message", {
      conversationId: payload.conversationId,
      senderId: payload.senderId,
      message: payload.message,
    });

    // clear input + UI reset
    setNewMessage("");
    autoGrowReset();
    setShowEmojiPanel(false);
  };

  // ---------- Search users ----------
  const searchUsers = debounce(async (q) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);

    try {
      const res = await apiRequest(
        `/users/search?query=${encodeURIComponent(q)}`,
        "GET"
      );
      setSearchResults(res || []);
    } catch (err) {
      console.error("Search error", err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, 350);

  useEffect(() => {
    searchUsers(searchQuery);
  }, [searchQuery]);

  // ---------- Start conversation ----------
  const startConversation = async (otherUser) => {
    try {
      const res = await apiRequest("/messages/conversation", "POST", {
        user1_id: user.unique_id,
        user2_id: otherUser.unique_id,
      });

      await fetchChats();
      await loadChatMessages(res);

      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      console.error("Failed to start chat", err);
    }
  };

  const fmtTime = (iso) => (iso ? dayjs(iso).format("h:mm A") : "");

  // Get chat display name
  const renderChatName = (chat) =>
    chat.user1_id === user.unique_id
      ? chat.user2_name || chat.user2_username
      : chat.user1_name || chat.user1_username;

  // Other user's avatar
  const otherAvatarForChat = (chat) => {
    if (!chat) return null;
    return chat.user1_id === user.unique_id
      ? chat.user2_avatar
      : chat.user1_avatar;
  };

  const getLastSeenOfOtherUser = () => {
    if (!selectedChat) return null;

    const isUser1 = selectedChat.user1_id === user.unique_id;

    return isUser1
      ? selectedChat.user2_last_active
      : selectedChat.user1_last_active;
  };

  // LIVE LAST SEEN UPDATER (optimized)
  useEffect(() => {
    if (!selectedChat) return;

    const otherId =
      selectedChat.user1_id === user.unique_id
        ? selectedChat.user2_id
        : selectedChat.user1_id;

    const fetchLastSeen = () => {
      apiRequest(`/users/last-seen/${otherId}`, "GET")
        .then((res) => {
          if (!res?.last_active) return;

          setSelectedChat((prev) => {
            if (!prev) return prev;

            const isUser1 = prev.user1_id === user.unique_id;

            return {
              ...prev,
              ...(isUser1
                ? { user2_last_active: res.last_active }
                : { user1_last_active: res.last_active }),
            };
          });
        })
        .catch(() => {});
    };

    fetchLastSeen();
    const interval = setInterval(fetchLastSeen, 20000);

    return () => clearInterval(interval);
  }, [onlineUsers, selectedChat?.conversation_id]);

  // Context menu auto-close
  useEffect(() => {
    const closeMenu = () =>
      setContextMenu((prev) => ({ ...prev, visible: false }));
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  // Delete conversation
  const deleteConversation = async (chat) => {
    if (!chat) return;

    try {
      await apiRequest(
        `/messages/conversation/${chat.conversation_id}`,
        "DELETE"
      );

      setConversations((prev) =>
        prev.filter((c) => c.conversation_id !== chat.conversation_id)
      );

      if (selectedChat?.conversation_id === chat.conversation_id) {
        setSelectedChat(null);
        setMessages([]);
      }

      setContextMenu((prev) => ({ ...prev, visible: false }));
    } catch (err) {
      console.error("Failed to delete conversation", err);
    }
  };

  // ADD REACTION
  const addReaction = (msg, emoji) => {
    if (!socket || !selectedChat) return;

    socket.emit("add_reaction", {
      messageId: msg.id,
      conversationId: selectedChat.conversation_id,
      userId: user.unique_id,
      emoji,
    });

    setOpenReactionFor(null);
  };

  // REMOVE REACTION
  const removeReaction = (msg) => {
    if (!socket || !selectedChat) return;

    socket.emit("remove_reaction", {
      messageId: msg.id,
      conversationId: selectedChat.conversation_id,
      userId: user.unique_id,
    });

    setOpenReactionFor(null);
  };

  // SOCKET: REACTION UPDATES
  useEffect(() => {
    if (!socket) return;

    const handleAdd = ({ messageId, userId, emoji }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                reactions: {
                  ...(m.reactions || {}),
                  [userId]: emoji,
                },
              }
            : m
        )
      );
    };

    const handleRemove = ({ messageId, userId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                reactions: {
                  ...(m.reactions || {}),
                  [userId]: undefined,
                },
              }
            : m
        )
      );
    };

    socket.on("reaction_added", handleAdd);
    socket.on("reaction_removed", handleRemove);

    return () => {
      socket.off("reaction_added", handleAdd);
      socket.off("reaction_removed", handleRemove);
    };
  }, [socket]);

  return (
    <div className={style.container}>
      {/* Sidebar */}
      <aside
        className={`${style.sidebar} ${
          selectedChat ? style.sidebarHiddenOnMobile : ""
        }`}
      >
        {/* HEADER */}
        <div className={style.sidebarHeader}>
          <div className={style.sidebarHeaderLeft}>
            <div className={style.avatar}>
              <UserRound className={style.avatarIcon} />
            </div>

            <div>
              <div className={style.sidebarTitle}>Chats</div>
              <div className={style.sidebarSubtitle}>Secure messages</div>
            </div>
          </div>

          {/* THEME TOGGLE */}
          <button
            className={style.themeToggleBtn}
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? (
              <Moon className={style.themeIcon} />
            ) : (
              <Sun className={style.themeIcon} />
            )}
          </button>
        </div>

        {/* SEARCH BOX */}
        <div className={style.searchWrapper}>
          <Search className={style.searchIcon} />

          <input
            className={style.searchInput}
            type="search"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* SEARCH RESULT DROPDOWN */}
          {searchQuery.trim() && (
            <div className={style.searchResults}>
              {searchLoading ? (
                <div
                  className={style.searchResultItem}
                  style={{
                    justifyContent: "center",
                    fontStyle: "italic",
                    color: "#888",
                  }}
                >
                  Searching…
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((u) => (
                  <div
                    key={u.unique_id}
                    className={style.searchResultItem}
                    onClick={() => startConversation(u)}
                  >
                    <div className={style.avatarSmall}>
                      {u.avatar_url ? (
                        <img
                          src={u.avatar_url}
                          className={style.avatarIMG}
                          alt="avatar"
                          style={{ width: 32, height: 32 }}
                        />
                      ) : (
                        <UserRound size={20} />
                      )}
                    </div>

                    <div className={style.resultInfo}>
                      <div className={style.resultName}>
                        {u.username || u.name || u.special_id}
                      </div>
                      <div className={style.resultEmail}>{u.email}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  className={style.searchResultItem}
                  style={{
                    justifyContent: "center",
                    fontStyle: "italic",
                    color: "#888",
                  }}
                >
                  No results found
                </div>
              )}
            </div>
          )}
        </div>

        {/* CHAT LIST */}
        <div className={style.chatList}>
                  {conversations.map((chat) => {
                    const otherId =
                      chat.user1_id === user.unique_id ? chat.user2_id : chat.user1_id;
                    const isTyping = typingUsers.includes(otherId);
                    const isOnline = onlineUsers.includes(otherId);
                    const avatar = otherAvatarForChat(chat);
        
                    // Count unread messages (messages where seen = false and sender is other user)
                    const unreadCount = chat.unread_messages || 0; // you need to calculate this from your backend
        
                    return (
                      <div
                        key={chat.conversation_id}
                        onClick={() => loadChatMessages(chat)}
                        className={`${style.chatItem} ${
                          selectedChat?.conversation_id === chat.conversation_id
                            ? style.chatItemActive
                            : ""
                        }`}
                      >
                        <div className={style.avatarWrapper}>
                          <div className={style.avatarLarge}>
                            {avatar ? (
                              <img
                                src={avatar}
                                className={style.avatarIMG}
                                alt="avatar"
                              />
                            ) : (
                              <UserRound className={style.avatarIcon} />
                            )}
                          </div>
                          {isOnline && <span className={style.onlineIndicator} />}
                        </div>
        
                        <div className={style.chatInfo}>
                          <div
                            className={style.chatName}
                            style={{ fontWeight: unreadCount > 0 ? "700" : "500" }}
                          >
                            {renderChatName(chat) || "Unknown"}
                          </div>
                          <div className={style.chatLastMessage}>
                            {isTyping ? (
                              <i>typing…</i>
                            ) : (
                              chat.last_message || "No messages yet"
                            )}
                          </div>
                        </div>
        
                        <div className={style.chatTime}>
                          {chat.updated_at ? fmtTime(chat.updated_at) : ""}
                          {unreadCount > 0 && (
                            <span
                              style={{
                                marginLeft: 6,
                                backgroundColor: "#09707D",
                                color: "#fff",
                                borderRadius: "12px",
                                padding: "2px 6px",
                                fontSize: 12,
                              }}
                            >
                              {unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </aside>

      {/* Chat Window */}
      <main
        className={`${style.chatWindow} ${
          !selectedChat ? style.chatHiddenOnMobile : ""
        }`}
      >
        <div className={style.chatHeader}>
          {selectedChat && (
            <ChevronLeft
              className={style.backBtn}
              onClick={() => setSelectedChat(null)}
            />
          )}

          {/* Avatar */}
          <div className={style.avatar}>
            {selectedChat ? (
              otherAvatarForChat(selectedChat) ? (
                <img
                  src={otherAvatarForChat(selectedChat)}
                  className={style.avatarIMG}
                  alt="avatar"
                />
              ) : (
                <UserRound className={style.avatarIcon} />
              )
            ) : (
              <UserRound className={style.avatarIcon} />
            )}
          </div>

          {/* Header Info */}
          <div className={style.headerInfo}>
            <div className={style.headerName}>
              {selectedChat ? renderChatName(selectedChat) : "Select a chat"}
            </div>

            <div className={style.headerStatus}>
              {selectedChat ? (
                typingUsers.length > 0 ? (
                  "typing…"
                ) : onlineUsers.includes(
                    selectedChat.user1_id === user.unique_id
                      ? selectedChat.user2_id
                      : selectedChat.user1_id
                  ) ? (
                  "online"
                ) : (
                  <>
                    <span>
                      last seen{" "}
                      {getLastSeenOfOtherUser()
                        ? formatLastSeen(getLastSeenOfOtherUser())
                        : "offline"}
                    </span>
                  </>
                )
              ) : (
                "Open a conversation"
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className={style.messagesArea}>
          {loadingMessages ? (
            <div className={style.loaderWrapper}>
              <Loader2 className={style.loader} />
            </div>
          ) : !selectedChat ? (
            <div className={style.emptyMsg}>Select a conversation to start</div>
          ) : messages.length === 0 ? (
            <div className={style.emptyMsg}>No messages yet — say hello 👋</div>
          ) : (
            <div className={style.messagesList}>
              {messages.map((msg, idx) => {
                const senderId = msg.sender_id || msg.senderId;
                const mine = senderId === user.unique_id;

                const incomingAvatar = mine
                  ? user.avatar_url
                  : msg.avatar_url || otherAvatarForChat(selectedChat);

                // ------------------------
                // GROUP REACTIONS BY EMOJI
                // ------------------------
                const grouped = {};
                if (msg.reactions) {
                  for (const [uid, emoji] of Object.entries(msg.reactions)) {
                    if (!emoji) continue;
                    if (!grouped[emoji]) grouped[emoji] = [];
                    grouped[emoji].push(uid);
                  }
                }

                return (
                  <div
                    key={msg.id || idx}
                    className={`${style.msgWrapper} ${
                      mine ? style.msgRight : style.msgLeft
                    }`}
                  >
                    {/* Incoming user avatar */}
                    {!mine && (
                      <div style={{ marginRight: 8 }}>
                        {incomingAvatar ? (
                          <img
                            src={incomingAvatar}
                            alt="avatar"
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div style={{ width: 28, height: 28 }}>
                            <UserRound />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      className={style.msgBubble}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setOpenReactionFor(msg.id);
                      }}
                    >
                      <div>{msg.message}</div>

                      {/* -------------------- */}
                      {/* WhatsApp-style reactions */}
                      {/* -------------------- */}
                      {Object.keys(grouped).length > 0 && (
                        <div className={style.reactionBar}>
                          {Object.entries(grouped).map(([emoji, users]) => (
                            <span
                              key={emoji}
                              className={style.reactionEmoji}
                              onClick={() => {
                                if (users.includes(user.unique_id)) {
                                  removeReaction(msg);
                                } else {
                                  addReaction(msg, emoji);
                                }
                              }}
                            >
                              {emoji} {users.length > 1 && users.length}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Meta */}
                      <div className={style.msgMeta}>
                        <span className={style.msgTime}>
                          {fmtTime(msg.created_at)}
                        </span>
                        {mine && (
                          <span className={style.msgStatus}>
                            {msg.status || (msg.seen ? "seen" : "sent")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Reaction Picker */}
        {openReactionFor && (
          <div className={style.reactionPicker}>
            {REACTIONS.map((emoji) => (
              <span
                key={emoji}
                className={style.reactionPickerItem}
                onClick={() =>
                  addReaction(
                    messages.find((m) => m.id === openReactionFor),
                    emoji
                  )
                }
              >
                {emoji}
              </span>
            ))}

            <span
              className={style.reactionRemove}
              onClick={() =>
                removeReaction(messages.find((m) => m.id === openReactionFor))
              }
            >
              ❌
            </span>
          </div>
        )}

        {/* Context menu */}
        {contextMenu.visible && (
          <div
            style={{
              position: "fixed",
              top: contextMenu.y,
              left: contextMenu.x,
              background: "#222",
              color: "white",
              padding: "8px 12px",
              borderRadius: 6,
              zIndex: 9999,
              width: 200,
            }}
          >
            <div
              style={{ padding: "8px 0", cursor: "pointer" }}
              onClick={() => deleteConversation(contextMenu.chat)}
            >
              Delete Conversation
            </div>

            <div
              style={{ padding: "8px 0", cursor: "pointer" }}
              onClick={() => archiveConversation(contextMenu.chat)}
            >
              Archive
            </div>

            <div
              style={{ padding: "8px 0", cursor: "pointer" }}
              onClick={() => muteConversation(contextMenu.chat)}
            >
              Mute Notifications
            </div>
          </div>
        )}

        {/* Input bar */}
        {selectedChat && (
          <div ref={inputAreaRef} className={style.inputAreaWrapper}>
            {showEmojiPanel && (
  <div className={style.emojiPanel}>
    <EmojiPicker
      onEmojiClick={(emoji) => handleEmojiSelect(emoji.emoji)}
      lazyLoadEmojis
      height={350}
      width="100%"
    />
  </div>
)}


            <div className={style.inputArea}>
              <button
                ref={emojiBtnRef}
                className={style.emojiBtn}
                type="button"
                onClick={() => setShowEmojiPanel((p) => !p)}
              >
                <Smile />
              </button>

              <textarea
                ref={textareaRef}
                className={style.inputBox}
                rows={1}
                placeholder="Type a message"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                  autoGrow();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                    autoGrowReset();
                  }
                }}
              />

              <button className={style.sendBtn} onClick={sendMessage}>
                <Send className={style.sendIcon} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
