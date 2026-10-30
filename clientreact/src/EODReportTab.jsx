

import React, { useState, useEffect } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, Edit3, X, Send } from "lucide-react";
import { API_URL } from "./apiConfig";

export default function EODReportTab({ token, user, showToast }) {
  // --- State ---
  const [reports, setReports] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [viewDate, setViewDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDayReports, setSelectedDayReports] = useState([]);
  const [activeTab, setActiveTab] = useState("Session 1");
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    session: "Session 1",
    workDone: "",
    status: "Completed",
    blockers: "",
    date: new Date().toISOString().split("T")[0],
  });

  // --- Data Fetching ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth() + 1;

      const [reportsRes, attendRes] = await Promise.all([
        axios.get(`${API_URL}/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/attendance/history/${year}/${month}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setReports(reportsRes.data);
      setAttendance(attendRes.data);
    } catch (e) {
      showToast("Error loading dashboard data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [viewDate, token]);

  // --- Helpers ---
  const daysInMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0,
  ).getDate();
  const firstDay = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth(),
    1,
  ).getDay();
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getReportsForDay = (day) => {
    const dateStr = `${viewDate.getFullYear()}-${(viewDate.getMonth() + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    return reports.filter((r) => r.date === dateStr);
  };

  const getAttendanceForDay = (day) => {
    const dateStr = `${viewDate.getFullYear()}-${(viewDate.getMonth() + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    return attendance.find((a) => a.date === dateStr);
  };

  const isWithinEditWindow = (day) => {
    const targetDate = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth(),
      day,
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = today - targetDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 3;
  };

  // --- Handlers ---
  const handleOpenCell = (day, attendanceRec) => {
    const dateObj = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const isSunday = dateObj.getDay() === 0;

    if (dateObj > new Date()) return;

    if (!attendanceRec && !isSunday) {
      showToast("You were absent", "info");
      return;
    }

    const dayReports = getReportsForDay(day);
    setSelectedDayReports(dayReports);

    if (dayReports.length > 0) setActiveTab(dayReports[0].session);
    else setActiveTab("Session 1");

    setShowViewModal(true);
  };

  const handleNewEOD = (day) => {
    const dateObj = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const isSunday = dateObj.getDay() === 0;
    const attendanceRec = getAttendanceForDay(day);

    if (!attendanceRec && !isSunday) {
      showToast("Cannot submit EOD for days marked as Absent", "error");
      return;
    }

    const dateStr = `${viewDate.getFullYear()}-${(viewDate.getMonth() + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    const existingSessions = getReportsForDay(day).map((r) => r.session);

    setEditingId(null);
    setFormData({
      session: existingSessions.includes("Session 1")
        ? "Session 2"
        : "Session 1",
      workDone: "",
      status: "Completed",
      blockers: "",
      date: dateStr,
    });
    setShowSubmitModal(true);
  };

  const handleEditInit = (report) => {
    setEditingId(report._id);
    setFormData({
      session: report.session,
      workDone: report.workDone,
      status: report.status,
      blockers: report.blockers || "",
      date: report.date,
    });
    setShowViewModal(false);
    setShowSubmitModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      session: "Session 1",
      workDone: "",
      status: "Completed",
      blockers: "",
      date: new Date().toISOString().split("T")[0],
    });
    setShowSubmitModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Logic: If status is Blocked but blockers field is empty, default it
    const finalData = { ...formData };
    if (finalData.status === "Blocked" && !finalData.blockers.trim()) {
      finalData.blockers = "No description provided for this blocker.";
    }

    try {
      if (editingId) {
        await axios.put(`${API_URL}/reports/${editingId}`, finalData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showToast("Report updated", "success");
      } else {
        await axios.post(`${API_URL}/reports`, finalData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showToast("Report submitted", "success");
      }
      resetForm();
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || "Submission failed", "error");
    }
  };

  return (
    <section
      className="page-content"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        height: "90vh",
        overflow: "hidden",
      }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <button
            className="action-btn small"
            onClick={() =>
              setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))
            }>
            <ChevronLeft size={18} />
          </button>
          <h2
            style={{
              minWidth: "150px",
              textAlign: "center",
              fontSize: "1.2rem",
            }}>
            {months[viewDate.getMonth()]} {viewDate.getFullYear()}
          </h2>
          <button
            className="action-btn small"
            onClick={() => {
              const next = new Date(viewDate.setMonth(viewDate.getMonth() + 1));
              if (next <= new Date()) setViewDate(next);
            }}>
            <ChevronRight size={18} />
          </button>
        </div>
        <button
          className="action-btn btn-checkin"
          onClick={() => handleNewEOD(new Date().getDate())}>
          <Send size={16} style={{ marginRight: "8px" }} /> Submit Today
        </button>
      </div>

      <div
        className="glass card"
        style={{ flex: 1, padding: "10px", overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "8px",
            height: "100%",
            gridTemplateRows: "auto repeat(6, 1fr)",
          }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              style={{
                textAlign: "center",
                fontWeight: "bold",
                opacity: 0.6,
                fontSize: "0.8rem",
              }}>
              {d}
            </div>
          ))}
          {Array(firstDay)
            .fill(null)
            .map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const dayReports = getReportsForDay(day);
            const attendanceRec = getAttendanceForDay(day);
            const dateObj = new Date(
              viewDate.getFullYear(),
              viewDate.getMonth(),
              day,
            );
            const isFuture = dateObj > new Date();
            const isSunday = dateObj.getDay() === 0;
            const canEdit = isWithinEditWindow(day);
            const isPresent = !!attendanceRec || isSunday;

            return (
              <div
                key={day}
                className="calendar-cell"
                onClick={() => handleOpenCell(day, attendanceRec)}
                style={{
                  background: "rgba(74, 31, 69, 0.03)",
                  border: "1px solid rgba(74, 31, 69, 0.12)",
                  borderRadius: "8px",
                  padding: "5px",
                  position: "relative",
                  cursor: isFuture ? "default" : "pointer",
                  opacity: isFuture ? 0.3 : 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}>
                <span style={{ fontSize: "0.7rem", opacity: 0.5 }}>{day}</span>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    flex: 1,
                    justifyContent: "center",
                    gap: "2px",
                  }}>
                  {!isFuture && !isSunday && !attendanceRec && (
                    <div
                      style={{
                        color: "#c0392b",
                        fontWeight: "bold",
                        fontSize: "1.1rem",
                      }}>
                      A
                    </div>
                  )}

                  {canEdit && isPresent && dayReports.length < 2 && (
                    <button
                      className="edit-icon-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNewEOD(day);
                      }}>
                      <Send size={10} />
                    </button>
                  )}

                  <div
                    style={{ display: "flex", gap: "3px", marginTop: "4px" }}>
                    {dayReports.map((r, idx) => (
                      <div key={idx} className="session-badge">
                        {r.session === "Session 1" ? "1" : "2"}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showSubmitModal && (
        <div className="modal-overlay">
          <div className="glass card modal-content" style={{ width: "350px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "15px",
              }}>
              <h3>{editingId ? "Update EOD" : "New EOD"}</h3>
              <X className="close-icon" onClick={resetForm} />
            </div>
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div
                style={{
                  padding: "8px",
                  background: "rgba(74, 31, 69, 0.05)",
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                }}>
                Date: <strong>{formData.date}</strong>
              </div>
              <select
                className="custom-select"
                value={formData.session}
                disabled={!!editingId}
                onChange={(e) =>
                  setFormData({ ...formData, session: e.target.value })
                }>
                <option value="Session 1">Session 1</option>
                <option value="Session 2">Session 2</option>
              </select>
              <textarea
                className="glass-input"
                rows="4"
                placeholder="Work done..."
                required
                value={formData.workDone}
                onChange={(e) =>
                  setFormData({ ...formData, workDone: e.target.value })
                }
              />
              <select
                className="custom-select"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }>
                <option value="Completed">Completed</option>
                <option value="In-Progress">In-Progress</option>
                <option value="Blocked">Blocked</option>
              </select>

              {/* Added Blocker Details field if status is Blocked */}
              {formData.status === "Blocked" && (
                <textarea
                  className="glass-input blocker-input"
                  rows="2"
                  placeholder="What is blocking you?"
                  required
                  value={formData.blockers}
                  onChange={(e) =>
                    setFormData({ ...formData, blockers: e.target.value })
                  }
                  style={{ border: "1px solid #c0392b" }}
                />
              )}

              <button type="submit" className="action-btn btn-checkin">
                {editingId ? "Update Report" : "Submit Report"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showViewModal && (
        <div className="modal-overlay">
          <div
            className="glass card modal-content"
            style={{ width: "450px", minHeight: "250px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}>
              <h3>Report Details</h3>
              <X
                className="close-icon"
                onClick={() => setShowViewModal(false)}
              />
            </div>
            <div
              style={{
                display: "flex",
                borderBottom: "1px solid rgba(74, 31, 69, 0.12)",
                marginBottom: "10px",
              }}>
              {["Session 1", "Session 2"].map((tab) => (
                <div
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "8px 15px",
                    cursor: "pointer",
                    borderBottom:
                      activeTab === tab ? "2px solid #2f7d4f" : "none",
                    opacity: activeTab === tab ? 1 : 0.5,
                  }}>
                  {tab}
                </div>
              ))}
            </div>
            <div style={{ padding: "5px" }}>
              {(() => {
                const report = selectedDayReports.find(
                  (r) => r.session === activeTab,
                );
                if (!report)
                  return (
                    <p
                      style={{
                        opacity: 0.5,
                        textAlign: "center",
                        marginTop: "15px",
                      }}>
                      No report for this session
                    </p>
                  );
                return (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}>
                      <span className={`badge ${report.status.toLowerCase()}`}>
                        {report.status}
                      </span>
                      {isWithinEditWindow(new Date(report.date).getDate()) && (
                        <button
                          className="edit-icon-btn"
                          onClick={() => handleEditInit(report)}>
                          <Edit3 size={14} />
                        </button>
                      )}
                    </div>
                    <p
                      style={{
                        marginTop: "10px",
                        fontSize: "0.9rem",
                        whiteSpace: "pre-wrap",
                      }}>
                      {report.workDone}
                    </p>
                    {report.blockers && (
                      <div
                        style={{
                          marginTop: "10px",
                          padding: "8px",
                          background: "rgba(255, 71, 87, 0.1)",
                          borderRadius: "4px",
                          fontSize: "0.85rem",
                          borderLeft: "3px solid #c0392b",
                        }}>
                        <strong>Blocker:</strong> {report.blockers}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
        .modal-content { padding: 25px; border: 1px solid rgba(74, 31, 69, 0.12); }
        .session-badge { background: rgba(46, 213, 115, 0.2); color: #2f7d4f; border: 1px solid #2f7d4f; border-radius: 4px; width: 18px; height: 18px; font-size: 0.65rem; display: flex; align-items: center; justify-content: center; font-weight: bold; }
        .edit-icon-btn { background: #2f7d4f; color: black; border: none; border-radius: 4px; padding: 4px; cursor: pointer; display: flex; align-items: center; }
        .badge { padding: 3px 8px; border-radius: 4px; font-size: 0.7rem; }
        .badge.completed { background: rgba(46, 213, 115, 0.2); color: #2f7d4f; }
        .badge.blocked { background: rgba(255, 71, 87, 0.2); color: #c0392b; }
        .badge.in-progress { background: rgba(255, 165, 2, 0.2); color: #a8741a; }
        .blocker-input::placeholder { color: #c0392b; opacity: 0.7; }
      `}</style>
    </section>
  );
}