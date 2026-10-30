
import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  Hash,
  Paperclip,
  FileText,
  User as UserIcon,
  Circle,
  Search,
  ChevronLeft,
  Menu,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";

export default function ChatDrawer({ socket, user, isOpen, onClose }) {
  const [selectedChat, setSelectedChat] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // States for Edit/Delete functionality
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editBuffer, setEditBuffer] = useState("");
  const [deleteConfirmationId, setDeleteConfirmationId] = useState(null);

  const scrollRef = useRef();
  const fileInputRef = useRef();

  const groups = [{ id: "global_all", name: "The Hub", type: "global" }];

  // Listeners that don't depend on the open chat: registered once per socket
  // instead of being torn down and re-added on every chat switch.
  useEffect(() => {
    if (!socket) return;
    socket.emit("get_users");

    const onUserList = (data) =>
      setEmployees(data.filter((emp) => emp._id !== user.id));
    const onPrivateChatReady = (data) =>
      setSelectedChat({
        id: data.conversationId,
        name: data.name || "Direct Message",
        type: "private",
      });
    const onMessageUpdated = (updatedMsg) =>
      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m)),
      );
    const onMessageDeleted = (deletedId) =>
      setMessages((prev) => prev.filter((m) => m._id !== deletedId));
    const onChatHistory = (history) => setMessages(history);

    socket.on("user_list", onUserList);
    socket.on("private_chat_ready", onPrivateChatReady);
    socket.on("message_updated", onMessageUpdated);
    socket.on("message_deleted", onMessageDeleted);
    socket.on("chat_history", onChatHistory);

    return () => {
      socket.off("user_list", onUserList);
      socket.off("private_chat_ready", onPrivateChatReady);
      socket.off("message_updated", onMessageUpdated);
      socket.off("message_deleted", onMessageDeleted);
      socket.off("chat_history", onChatHistory);
    };
  }, [socket, user.id]);

  const selectedChatId = selectedChat?.id;
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg) => {
      if (msg.conversationId === "global_all" && selectedChatId !== "global_all") {
        setHasUnread(true);
      }
      if (msg.conversationId === selectedChatId) {
        setMessages((prev) => {
          const isDuplicate = prev.some(
            (m) =>
              (msg._id && m._id === msg._id) ||
              (msg.tempId && m.tempId === msg.tempId),
          );
          if (isDuplicate) return prev;
          return [...prev, msg];
        });
      }
    };

    socket.on("receive_message", handleReceiveMessage);
    return () => socket.off("receive_message", handleReceiveMessage);
  }, [socket, selectedChatId]);

  useEffect(() => {
    if (selectedChat && socket && selectedChat.id !== "loading") {
      setMessages([]);
      socket.emit("join_room", selectedChat.id);
      if (selectedChat.id === "global_all") setHasUnread(false);
    }
  }, [selectedChat, socket]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat || !socket) return;
    const tempId = Date.now().toString();
    const isLink = /^(ftp|http|https):\/\/[^ "]+$/.test(message.trim());

    const optimisticMessage = {
      _id: tempId,
      tempId,
      conversationId: selectedChat.id,
      text: message,
      senderId: user.id,
      senderName: user.name,
      fileType: isLink ? "link" : "text",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    socket.emit("send_message", optimisticMessage);
    setMessage("");
  };

  const startEdit = (msg) => {
    setEditingMessageId(msg._id);
    setEditBuffer(msg.text);
    setActiveMenuId(null);
  };

  const handleSaveEdit = (msgId) => {
    if (!editBuffer.trim()) return;
    socket.emit("edit_message", { messageId: msgId, text: editBuffer });
    setMessages((prev) =>
      prev.map((m) =>
        m._id === msgId ? { ...m, text: editBuffer, isEdited: true } : m,
      ),
    );
    setEditingMessageId(null);
  };

  const confirmDelete = () => {
    if (deleteConfirmationId) {
      socket.emit("delete_message", { messageId: deleteConfirmationId });
      setMessages((prev) => prev.filter((m) => m._id !== deleteConfirmationId));
      setDeleteConfirmationId(null);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !socket || !selectedChat) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const tempId = Date.now().toString();
      const optimisticFile = {
        _id: tempId,
        tempId,
        conversationId: selectedChat.id,
        senderId: user.id, // display only; the server uses the authenticated user
        senderName: user.name,
        text: "",
        fileUrl: reader.result,
        fileName: file.name,
        fileType: file.type.startsWith("image/") ? "image" : "doc",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticFile]);
      socket.emit("send_message", { ...optimisticFile, _id: undefined });
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const formatTime = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  return (
    <div
      className={`page-content glass ${isOpen ? "open" : ""}`}
      style={{
        height: "calc(100vh - 40px)",
        display: "flex",
        flexDirection: "row",
        overflow: "hidden",
        padding: 0,
        gap: 0,
        position: "relative",
      }}>
      {/* Sidebar: Chat List */}
      <div
        style={{
          width: isSidebarOpen ? "320px" : "0px",
          opacity: isSidebarOpen ? 1 : 0,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          borderRight: isSidebarOpen ? "1px solid var(--glass-border)" : "none",
          display: "flex",
          flexDirection: "column",
          background: "rgba(74, 31, 69, 0.06)",
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}>
        <div style={{ padding: "20px" }}>
          <h2
            style={{
              fontSize: "1.1rem",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "15px",
            }}>
            <MessageSquare size={18} color="var(--accent)" /> Intelligence
          </h2>
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                opacity: 0.5,
              }}
            />
            <input
              type="text"
              placeholder="Search frequency..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "83%",
                background: "rgba(74, 31, 69, 0.05)",
                border: "1px solid var(--glass-border)",
                borderRadius: "8px",
                padding: "8px 10px 8px 30px",
                fontSize: "0.8rem",
                color: "var(--ink)",
                outline: "none",
              }}
            />
          </div>
        </div>

        <div
          className="feed-scroll"
          style={{ flex: 1, overflowY: "auto", padding: "0 15px 15px 15px" }}>
          {filteredGroups.length > 0 && (
            <>
              <p
                className="section-header"
                style={{
                  fontSize: "0.65rem",
                  color: "var(--text-dim)",
                  marginBottom: "8px",
                }}>
                CHANNELS
              </p>
              {filteredGroups.map((g) => (
                <div
                  key={g.id}
                  className={`talent-item glass ${selectedChat?.id === g.id ? "active" : ""}`}
                  onClick={() => setSelectedChat(g)}
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "6px",
                    background:
                      selectedChat?.id === g.id ? "var(--accent-soft)" : "",
                  }}>
                  <div style={{ color: "var(--accent)" }}>
                    <Hash size={16} />
                  </div>
                  <div
                    style={{ flex: 1, fontSize: "0.85rem", fontWeight: 600 }}>
                    {g.name}
                  </div>
                  {hasUnread && (
                    <Circle
                      size={6}
                      fill="var(--accent)"
                      color="var(--accent)"
                    />
                  )}
                </div>
              ))}
            </>
          )}

          {filteredEmployees.length > 0 && (
            <>
              <p
                className="section-header"
                style={{
                  fontSize: "0.65rem",
                  color: "var(--text-dim)",
                  marginTop: "20px",
                  marginBottom: "8px",
                }}>
                DIRECT MESSAGES
              </p>
              {filteredEmployees.map((emp) => (
                <div
                  key={emp._id}
                  className={`talent-item glass ${selectedChat?.name === emp.name ? "active" : ""}`}
                  onClick={() =>
                    socket.emit("start_private_chat", {
                      participantId: emp._id,
                    })
                  }
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "6px",
                    background:
                      selectedChat?.name === emp.name
                        ? "var(--accent-soft)"
                        : "",
                  }}>
                  <div style={{ position: "relative" }}>
                    <UserIcon size={16} />
                    <div
                      style={{
                        position: "absolute",
                        bottom: -1,
                        right: -1,
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background:
                          emp.pulseStatus === "Active"
                            ? "var(--success)"
                            : "var(--text-dim)",
                        border: "1px solid #2a1530",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 500 }}>
                      {emp.name}
                    </div>
                    <div style={{ fontSize: "0.65rem", opacity: 0.5 }}>
                      {emp.role}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "rgba(74, 31, 69, 0.04)",
        }}>
        {selectedChat ? (
          <>
            <div
              style={{
                padding: "15px 25px",
                borderBottom: "1px solid var(--glass-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backdropFilter: "blur(10px)",
              }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  style={{
                    background: "rgba(74, 31, 69, 0.05)",
                    border: "1px solid var(--glass-border)",
                    color: "var(--ink)",
                    cursor: "pointer",
                    padding: "6px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                  }}>
                  {isSidebarOpen ? (
                    <ChevronLeft size={18} />
                  ) : (
                    <Menu size={18} />
                  )}
                </button>
                <div>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>
                    {selectedChat.name}
                  </h3>
                  <div
                    style={{
                      fontSize: "0.6rem",
                      color: "var(--accent)",
                      letterSpacing: "1px",
                    }}>
                    ENCRYPTED CHANNEL
                  </div>
                </div>
              </div>
            </div>

            <div
              className="feed-scroll"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "25px",
                display: "flex",
                flexDirection: "column",
                gap: "15px",
              }}>
              {messages.map((msg, i) => {
                const isMine =
                  msg.sender === user.id || msg.senderId === user.id;
                const isEditing = editingMessageId === msg._id;

                return (
                  <div
                    key={msg._id || i}
                    style={{
                      alignSelf: isMine ? "flex-end" : "flex-start",
                      maxWidth: "70%",
                      position: "relative",
                    }}>
                    {/* Action Menu - Positions on Left for outgoing, Right for incoming (or can be fixed left as requested) */}
                    {activeMenuId === msg._id && (
                      <div
                        className="glass"
                        style={{
                          position: "absolute",
                          left: "-110px", // Opens on the left side
                          top: "0",
                          zIndex: 10,
                          borderRadius: "8px",
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          background: "#fbf9f6", border: "1px solid var(--line)",
                          border: "1px solid var(--glass-border)",
                          boxShadow: "0 6px 18px rgba(74, 31, 69, 0.18)",
                        }}>
                        <button
                          onClick={() => startEdit(msg)}
                          style={{
                            padding: "8px 12px",
                            background: "none",
                            border: "none",
                            color: "var(--ink)",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                          }}>
                          <Edit2 size={12} /> Edit
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirmationId(msg._id);
                            setActiveMenuId(null);
                          }}
                          style={{
                            padding: "8px 12px",
                            background: "none",
                            border: "none",
                            color: "#ff4d4d",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                          }}>
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    )}

                    <div
                      style={{
                        padding: "12px 16px",
                        borderRadius: isMine
                          ? "16px 16px 4px 16px"
                          : "16px 16px 16px 4px",
                        background: isMine
                          ? "linear-gradient(135deg, var(--accent), #8a4a80)"
                          : "var(--glass)",
                        color: isMine ? "#fff" : "var(--ink)",
                        border: isMine
                          ? "none"
                          : "1px solid var(--glass-border)",
                        position: "relative",
                      }}>
                      {!isMine && (
                        <div
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 800,
                            marginBottom: "4px",
                            color: "var(--accent)",
                          }}>
                          {msg.senderName}
                        </div>
                      )}

                      {isEditing ? (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}>
                          <textarea
                            value={editBuffer}
                            onChange={(e) => setEditBuffer(e.target.value)}
                            style={{
                              background: "rgba(74, 31, 69, 0.2)",
                              border: "none",
                              color: isMine ? "#fff" : "var(--ink)",
                              borderRadius: "4px",
                              padding: "5px",
                              width: "100%",
                              fontSize: "0.9rem",
                            }}
                          />
                          <div
                            style={{
                              display: "flex",
                              gap: "10px",
                              justifyContent: "flex-end",
                            }}>
                            <X
                              size={16}
                              onClick={() => setEditingMessageId(null)}
                              style={{ cursor: "pointer" }}
                            />
                            <Check
                              size={16}
                              onClick={() => handleSaveEdit(msg._id)}
                              style={{ cursor: "pointer" }}
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          {msg.fileType === "image" ? (
                            <img
                              src={msg.fileUrl}
                              style={{ maxWidth: "100%", borderRadius: "8px" }}
                              onClick={() => setFullScreenImage(msg.fileUrl)}
                              alt="upload"
                            />
                          ) : msg.fileType === "doc" ? (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                              }}>
                              <FileText size={18} /> <span>{msg.fileName}</span>
                            </div>
                          ) : (
                            <span
                              style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>
                              {msg.text}
                            </span>
                          )}
                        </>
                      )}

                      <div
                        style={{
                          fontSize: "0.55rem",
                          textAlign: "right",
                          marginTop: "6px",
                          opacity: 0.6,
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: "5px",
                        }}>
                        {msg.isEdited && <span>(edited)</span>}
                        {formatTime(msg.createdAt)}
                      </div>

                      {/* Three Dots Icon - Positioned based on sender */}
                      {isMine && !isEditing && (
                        <div
                          style={{
                            position: "absolute",
                            left: "-25px",
                            top: "5px",
                            cursor: "pointer",
                            opacity: 0.5,
                          }}
                          onClick={() =>
                            setActiveMenuId(
                              activeMenuId === msg._id ? null : msg._id,
                            )
                          }>
                          <MoreVertical size={16} color="#fff" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            <form
              onSubmit={sendMessage}
              style={{
                padding: "20px 25px",
                background: "rgba(74, 31, 69, 0.06)",
                borderTop: "1px solid var(--glass-border)",
              }}>
              <div
                style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="nav-link"
                  style={{ width: "auto", padding: "8px", marginBottom: 0 }}>
                  <Paperclip size={18} />
                </button>
                <input
                  className="glass-input"
                  placeholder="Transmit message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "10px 18px",
                    borderRadius: "10px",
                    border: "1px solid var(--glass-border)",
                  }}
                />
                <button
                  type="submit"
                  className="send-btn-neon"
                  style={{
                    height: "40px",
                    width: "40px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                  <Send size={18} />
                </button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                hidden
                onChange={handleFileUpload}
              />
            </form>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}>
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                style={{
                  position: "absolute",
                  top: "20px",
                  left: "20px",
                  background: "rgba(74, 31, 69, 0.05)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--ink)",
                  cursor: "pointer",
                  padding: "8px",
                  borderRadius: "8px",
                }}>
                <Menu size={20} />
              </button>
            )}
            <MessageSquare size={60} style={{ opacity: 0.1 }} />
            <p
              style={{
                marginTop: "15px",
                letterSpacing: "2px",
                fontSize: "0.75rem",
                opacity: 0.3,
              }}>
              SELECT A SIGNAL TO MONITOR
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Popup */}
      {deleteConfirmationId && (
        <div
          className="overlay"
          style={{
            zIndex: 4000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.7)",
          }}>
          <div
            className="glass"
            style={{
              padding: "30px",
              borderRadius: "15px",
              maxWidth: "400px",
              width: "90%",
              textAlign: "center",
              border: "1px solid var(--glass-border)",
              backdropFilter: "blur(20px)",
            }}>
            <AlertTriangle
              size={40}
              color="#ff4d4d"
              style={{ marginBottom: "15px" }}
            />
            <h3 style={{ marginBottom: "10px", fontSize: "1.2rem" }}>
              Purge Transmission?
            </h3>
            <p
              style={{
                fontSize: "0.85rem",
                opacity: 0.7,
                marginBottom: "25px",
                lineHeight: "1.5",
              }}>
              Are you sure you want to permanently delete this signal? This
              action cannot be intercepted or reversed.
            </p>
            <div
              style={{
                display: "flex",
                gap: "15px",
                justifyContent: "center",
              }}>
              <button
                onClick={() => setDeleteConfirmationId(null)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  background: "rgba(74, 31, 69, 0.1)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--ink)",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}>
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  background: "#ff4d4d",
                  border: "none",
                  color: "var(--ink)",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {fullScreenImage && (
        <div
          className="overlay"
          style={{ zIndex: 3000 }}
          onClick={() => setFullScreenImage(null)}>
          <img
            src={fullScreenImage}
            style={{
              maxHeight: "90vh",
              maxWidth: "90vw",
              borderRadius: "12px",
              border: "2px solid var(--accent)",
            }}
            alt="fullview"
          />
        </div>
      )}
    </div>
  );
}