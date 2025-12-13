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
  const [theme, setTheme] = useState(
    () => localStorage.getItem("chat_theme") || "light"
  );

  const messagesEndRef = useRef(null);

  // Theme toggle
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("chat_theme", theme);
  }, [theme]);

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
    const handleOnline = (users) => setOnlineUsers(users || []);
    socket.on("online_users", handleOnline);
    return () => socket.off("online_users", handleOnline);
  }, [socket]);

  // incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleIncoming = (payload) => {
      // payload expected shape from your server: { conversationId, senderId, message, created_at, full_name, username, avatar_url, ... }
      if (
        selectedChat &&
        payload.conversationId === selectedChat.conversation_id
      ) {
        setMessages((prev) => [...prev, payload]);
        // Acknowledge delivery for the sender (optional - server must support)
        if (socket && payload && payload.id) {
          socket.emit("message_delivered", {
            messageId: payload.id,
            conversationId: payload.conversationId,
          });
        }
        scrollToBottom();
      } else {
        // refresh sidebar list to show new last message
        fetchChats();
      }
    };

    socket.on("receive_message", handleIncoming);
    return () => socket.off("receive_message", handleIncoming);
  }, [socket, selectedChat]);

  // typing indicator
  useEffect(() => {
    if (!socket) return;

    const handleTyping = ({ conversationId, userId }) => {
      if (!selectedChat || conversationId !== selectedChat.conversation_id)
        return;
      setTypingUsers((prev) => [...new Set([...prev, userId])]);
      setTimeout(
        () => setTypingUsers((prev) => prev.filter((id) => id !== userId)),
        1800
      );
    };

    socket.on("typing_indicator", handleTyping);
    return () => socket.off("typing_indicator", handleTyping);
  }, [socket, selectedChat]);

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

  // ---------- Send message (single emit, no duplicate) ----------
  const sendMessage = () => {
    if (!newMessage.trim() || !selectedChat || !socket) return;

    const payload = {
      conversationId: selectedChat.conversation_id,
      senderId: user.unique_id,
      message: newMessage.trim(),
      status: "sent",
    };

    // Emit to server (server will persist and re-emit to room)
    socket.emit("send_message", payload);

    // Clear the input — we do not locally append a duplicate; we'll wait for server to emit back.
    setNewMessage("");
    // optional: small visual feedback can be added (e.g., disabled send until server ack)
  };

  // ---------- Search users ----------
  const searchUsers = debounce(async (q) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true); // start loading
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
      setSearchLoading(false); // stop loading
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
      // refresh chats and open the new one
      await fetchChats();
      await loadChatMessages(res);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      console.error("Failed to start chat", err);
    }
  };

  const fmtTime = (iso) => (iso ? dayjs(iso).format("h:mm A") : "");

  // Helper: render chat display name
  const renderChatName = (chat) =>
    chat.user1_id === user.unique_id
      ? chat.user2_name || chat.user2_username
      : chat.user1_name || chat.user1_username;

  // Helper: pick other user's avatar from conversation row (user1_avatar / user2_avatar)
  const otherAvatarForChat = (chat) => {
    if (!chat) return null;
    return chat.user1_id === user.unique_id
      ? chat.user2_avatar
      : chat.user1_avatar;
  };

  return (
    <div className={style.container}>
      {/* Sidebar */}
      <aside
        className={`${style.sidebar} ${
          selectedChat ? style.sidebarHiddenOnMobile : ""
        }`}
      >
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

        <div className={style.searchWrapper}>
          <Search className={style.searchIcon} />
          <input
            className={style.searchInput}
            type="search"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

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

          <div className={style.headerInfo}>
            <div className={style.headerName}>
              {selectedChat ? renderChatName(selectedChat) : "Select a chat"}
            </div>
            <div className={style.headerStatus}>
              {selectedChat
                ? typingUsers.length > 0
                  ? "typing…"
                  : onlineUsers.includes(
                      selectedChat.user1_id === user.unique_id
                        ? selectedChat.user2_id
                        : selectedChat.user1_id
                    )
                  ? "online"
                  : "offline"
                : "Open a conversation"}
            </div>
          </div>
        </div>

        <div className={style.messagesArea}>
          {loadingMessages ? (
            <div className={style.loaderWrapper}>
              <Loader2 className={style.loader} />
            </div>
          ) : !selectedChat ? (
            <div className={style.emptyMsg}>
              Select a conversation to start chatting
            </div>
          ) : messages.length === 0 ? (
            <div className={style.emptyMsg}>No messages yet — say hello 👋</div>
          ) : (
            <div className={style.messagesList}>
              {messages.map((msg, idx) => {
                const senderId = msg.sender_id || msg.senderId;
                const mine = senderId === user.unique_id;
                return (
                  <div
                    key={msg.id || idx}
                    className={`${style.msgWrapper} ${
                      mine ? style.msgRight : style.msgLeft
                    }`}
                  >
                    {/* show small avatar for incoming messages */}
                    {!mine && (
                      <div style={{ marginRight: 8 }}>
                        {msg.avatar_url ? (
                          <img
                            src={msg.avatar_url}
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

                    <div className={style.msgBubble}>
                      <div>{msg.message}</div>
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

        {selectedChat && (
          <div className={style.inputArea}>
            <button className={style.emojiBtn} type="button" aria-label="emoji">
              <Smile />
            </button>
            <input
              className={style.inputBox}
              type="text"
              placeholder="Type a message"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />
            <button
              className={style.sendBtn}
              onClick={sendMessage}
              aria-label="send"
            >
              <Send className={style.sendIcon} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
