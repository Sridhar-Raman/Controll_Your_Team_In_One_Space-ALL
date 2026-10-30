import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "./apiConfig";

function AttendanceTab({ token, todayRecord, liveTimer }) {
  const [history, setHistory] = useState([]);
  const [viewDate, setViewDate] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState(null);
  const [hoverTimeout, setHoverTimeout] = useState(null);

  // Dynamic Year Generation: From 2024 up to the Current Real-Time Year
  const currentYear = new Date().getFullYear();
  const startYear = 2024;
  const years = Array.from(
    { length: currentYear - startYear + 1 },
    (_, i) => startYear + i,
  );

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

  const fetchHistory = async () => {
    try {
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth() + 1;
      const res = await axios.get(
        `${API_URL}/attendance/history/${year}/${month}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setHistory(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [viewDate, token]);

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

  const formatTime = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const timeString = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const isLate = hours > 9 || (hours === 9 && minutes > 30);
    return { timeString, isLate };
  };

  const calculateDuration = (start, end, recordDate) => {
    if (!start) return "0h 0m";
    const today = new Date().toISOString().split("T")[0];

    // If no end time and it's a past date, we can't calculate duration
    if (!end && recordDate !== today) return "N/A";

    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const diffMs = endTime - startTime;
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    return `${diffHrs}h ${diffMins}m`;
  };

  const getRecordForDay = (day) => {
    const dateStr = `${viewDate.getFullYear()}-${(viewDate.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    return history.find((h) => h.date === dateStr);
  };

  const handleMouseEnter = (day) => {
    const timeout = setTimeout(() => {
      setHoveredDay(day);
    }, 200);
    setHoverTimeout(timeout);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setHoveredDay(null);
  };

  // --- Navigation Handlers ---
  const handleMonthChange = (offset) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(viewDate.getMonth() + offset);

    // Safety check: Don't allow navigating into the future
    if (newDate > new Date()) return;

    setViewDate(newDate);
  };

  const handleYearChange = (year) => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(parseInt(year));

    // If the selected year and current month combo is in the future, reset to current date
    if (newDate > new Date()) {
      setViewDate(new Date());
    } else {
      setViewDate(newDate);
    }
  };

  const isCurrentMonth =
    viewDate.getMonth() === new Date().getMonth() &&
    viewDate.getFullYear() === new Date().getFullYear();

  return (
    <section
      className="page-content"
      style={{
        height: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        paddingBottom: "10px",
      }}>
      <div
        className="dashboard-grid"
        style={{
          gridTemplateColumns: "1fr 1fr 1fr",
          marginBottom: "15px",
          flexShrink: 0,
        }}>
        <div className="glass card">
          <small>Today's Check-in</small>
          <h3>
            {todayRecord?.checkInTime
              ? formatTime(todayRecord.checkInTime).timeString
              : "--:--"}
          </h3>
        </div>
        <div className="glass card">
          <small>Total Hours Today</small>
          <h3>{liveTimer}</h3>
        </div>
        <div className="glass card">
          <small>Month Absent Count</small>
          <h3 style={{ color: "#c0392b" }}>
            {daysInMonth - history.length - 4}
          </h3>
        </div>
      </div>

      <div
        className="glass card"
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}>
        <div
          className="calendar-controls"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
            flexShrink: 0,
          }}>
          <button
            className="action-btn small"
            onClick={() => handleMonthChange(-1)}>
            {"<"}
          </button>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>{months[viewDate.getMonth()]}</h3>
            <select
              className="custom-select"
              value={viewDate.getFullYear()}
              onChange={(e) => handleYearChange(e.target.value)}>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <button
            className="action-btn small"
            disabled={isCurrentMonth}
            style={{ opacity: isCurrentMonth ? 0.3 : 1 }}
            onClick={() => handleMonthChange(1)}>
            {">"}
          </button>
        </div>

        <div
          className="calendar-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "8px",
            flex: 1,
            overflowY: "auto",
            paddingRight: "5px",
          }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              style={{
                background: "rgba(74, 31, 69, 0.06)",
                padding: "8px",
                textAlign: "center",
                borderRadius: "5px",
                fontSize: "0.75rem",
              }}>
              {d}
            </div>
          ))}
          {Array(firstDay)
            .fill(null)
            .map((_, i) => (
              <div key={`empty-${i}`}></div>
            ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const record = getRecordForDay(day);
            const dateObj = new Date(
              viewDate.getFullYear(),
              viewDate.getMonth(),
              day,
            );
            const isFuture = dateObj > new Date();
            const isSunday = dateObj.getDay() === 0;

            return (
              <div
                key={day}
                className="calendar-cell"
                onMouseEnter={() => !isFuture && handleMouseEnter(day)}
                onMouseLeave={handleMouseLeave}
                style={{
                  background: isFuture ? "rgba(74, 31, 69, 0.05)" : "#fff",
                  color: "#000",
                  height: "60px",
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  position: "relative",
                  cursor: isFuture ? "default" : "pointer",
                  transition: "transform 0.2s",
                }}>
                <span
                  style={{
                    fontSize: "0.65rem",
                    opacity: 0.5,
                    position: "absolute",
                    top: "4px",
                    left: "6px",
                  }}>
                  {day}
                </span>
                {record ? (
                  <span
                    style={{
                      color: "#2f7d4f",
                      fontWeight: "bold",
                      fontSize: "1.1rem",
                    }}>
                    P
                  </span>
                ) : (
                  !isFuture &&
                  !isSunday && (
                    <span
                      style={{
                        color: "#c0392b",
                        fontWeight: "bold",
                        fontSize: "1.1rem",
                      }}>
                      A
                    </span>
                  )
                )}

                {hoveredDay === day && !isFuture && (
                  <div className="attendance-tooltip">
                    {record ? (
                      <>
                        <div className="tooltip-row">
                          <span>Check-In:</span>
                          <span
                            style={{
                              color: formatTime(record.checkInTime).isLate
                                ? "#c0392b"
                                : "#2f7d4f",
                            }}>
                            {formatTime(record.checkInTime).timeString}
                          </span>
                        </div>
                        <div className="tooltip-row">
                          <span>Check-Out:</span>
                          <span>
                            {record.checkOutTime ? (
                              formatTime(record.checkOutTime).timeString
                            ) : record.date ===
                              new Date().toISOString().split("T")[0] ? (
                              "Active"
                            ) : (
                              <span style={{ color: "#c0392b" }}>
                                Missed Checkout
                              </span>
                            )}
                          </span>
                        </div>

                        <hr
                          style={{
                            border: "0.5px solid rgba(74, 31, 69, 0.12)",
                            margin: "5px 0",
                          }}
                        />
                        <div
                          className="tooltip-row"
                          style={{ fontWeight: "bold" }}>
                          <span>Total:</span>
                          <span>
                            {calculateDuration(
                              record.checkInTime,
                              record.checkOutTime,
                              record.date,
                            )}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: "center", fontSize: "0.8rem" }}>
                        {isSunday ? "Weekend - No Record" : "No records found."}
                      </div>
                    )}
                    <div className="tooltip-arrow"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default AttendanceTab;