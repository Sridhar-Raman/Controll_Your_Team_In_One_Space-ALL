import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { RiLogoutCircleRLine } from "react-icons/ri";
import { IoNotificationsCircleSharp } from "react-icons/io5";
import { API_URL } from "./apiConfig";

const ACCENT = "#5c2252";

const pillStyle = {
  position: "relative",
  padding: "8px 16px",
  border: "1px solid rgba(92, 34, 82, 0.3)",
  borderRadius: "20px",
  color: ACCENT,
  cursor: "pointer",
  fontSize: "0.85rem",
  display: "flex",
  alignItems: "center",
  transition: "0.3s",
};

const dateInputStyle = {
  background: "rgba(255, 255, 255, 0.05)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "6px",
  padding: "2px 8px",
  color: "var(--ink)",
  fontSize: "0.75rem",
  outline: "none",
};

// Notifications + logout icon buttons for the top bar, shared by every role.
// Each icon expands to show its label on hover (see .icon-label-btn).
export default function HeaderActions({ token, userId, logout }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("Today"); // Today | All | Date
  const [filterDate, setFilterDate] = useState("");
  const [hasUnread, setHasUnread] = useState(false);

  const lastReadKey = `lastReadNotif_${userId}`;

  const loadNotifications = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/notifications/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);

      // Unread = newest item is later than the last time the panel was opened.
      if (res.data.length > 0) {
        const newest = new Date(res.data[0].fullDate || Date.now()).getTime();
        const lastRead = parseInt(localStorage.getItem(lastReadKey), 10);
        setHasUnread(!lastRead || newest > lastRead);
      }
    } catch (err) {
      console.error("Could not load notifications:", err);
    }
  }, [token, lastReadKey]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const open = () => {
    setIsOpen(true);
    setHasUnread(false);
    localStorage.setItem(lastReadKey, Date.now().toString());
    loadNotifications();
  };

  const visible = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return notifications.filter((n) => {
      const day = n.fullDate ? n.fullDate.split("T")[0] : today;
      if (filter === "Today") return day === today;
      if (filter === "Date" && filterDate) return day === filterDate;
      return true;
    });
  }, [notifications, filter, filterDate]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && setIsOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  return (
    <>
      <button
        onClick={open}
        className="glass icon-label-btn"
        aria-label="Notifications"
        style={pillStyle}>
        <IoNotificationsCircleSharp size={18} />
        <span className="icon-label">Notifications</span>
        {hasUnread && (
          <span
            style={{
              position: "absolute",
              top: "1px",
              right: "-2px",
              width: "10px",
              height: "10px",
              background: "#ff4b82",
              borderRadius: "50%",
              boxShadow: "0 0 10px #ff4b82",
            }}
          />
        )}
      </button>

      <button
        onClick={logout}
        className="glass icon-label-btn"
        aria-label="Logout"
        style={pillStyle}>
        <RiLogoutCircleRLine size={18} />
        <span className="icon-label">Logout</span>
      </button>

      {/* Portal: the top bar's glass blur would otherwise clip a fixed overlay. */}
      {isOpen &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Updates"
            onClick={() => setIsOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.8)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
              backdropFilter: "blur(5px)",
            }}>
            <div
              className="glass card"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "90%",
                maxWidth: "500px",
                maxHeight: "80vh",
                display: "flex",
                flexDirection: "column",
                padding: "25px",
                border: "1px solid var(--line)",
                boxShadow: "0 0 30px rgba(0,0,0,0.5)",
              }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}>
                <h3 style={{ margin: 0, color: ACCENT }}>🔔 Updates</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--ink)",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                  }}>
                  &times;
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                }}>
                {["Today", "All", "Date"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      padding: "5px 12px",
                      fontSize: "0.75rem",
                      borderRadius: "15px",
                      border: `1px solid ${ACCENT}`,
                      background: filter === f ? ACCENT : "transparent",
                      color: filter === f ? "#000" : ACCENT,
                      cursor: "pointer",
                    }}>
                    {f}
                  </button>
                ))}
                {filter === "Date" && (
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    style={dateInputStyle}
                  />
                )}
              </div>

              <div style={{ overflowY: "auto", flex: 1, paddingRight: "5px" }}>
                {visible.length > 0 ? (
                  visible.map((note, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "12px",
                        background: "rgba(74,31,69,0.06)",
                        borderRadius: "8px",
                        marginBottom: "10px",
                        borderLeft: `4px solid ${ACCENT}`,
                      }}>
                      <div style={{ fontSize: "0.85rem", marginBottom: "4px" }}>
                        {note.message}
                      </div>
                      <div style={{ fontSize: "0.7rem", opacity: 0.5 }}>
                        {note.time} •{" "}
                        {note.fullDate
                          ? new Date(note.fullDate).toLocaleDateString()
                          : "Today"}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: "center", opacity: 0.5, marginTop: "20px" }}>
                    No notifications found.
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
