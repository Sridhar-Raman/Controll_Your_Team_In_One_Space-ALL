import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { API_URL } from "./apiConfig";

function LeaveCenter({ token, showToast }) {
  const [history, setHistory] = useState([]);
  const [filters, setFilters] = useState({
    date: "",
    category: "All",
    days: "",
  });
  const [leave, setLeave] = useState({
    startDate: "",
    endDate: "",
    category: "Casual",
    reason: "",
  });

  const limits = { Casual: 15, Medical: 10, Emergency: 5 };

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/employee/leave-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const diff =
      Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const filteredHistory = useMemo(() => {
    return history
      .filter((h) => {
        const matchDate = filters.date
          ? h.startDate.toString().includes(filters.date)
          : true;
        const matchCat =
          filters.category !== "All" ? h.category === filters.category : true;
        const matchDays = filters.days
          ? h.duration === parseInt(filters.days)
          : true;
        return matchDate && matchCat && matchDays;
      })
      .sort(
        (a, b) =>
          new Date(b.requestedAt || b.startDate) -
          new Date(a.requestedAt || a.startDate),
      );
  }, [history, filters]);

  const submitLeave = async () => {
    const duration = calculateDays(leave.startDate, leave.endDate);
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Basic Validation
    if (!leave.startDate || !leave.endDate || !leave.reason) {
      return showToast("Please fill all fields", "error");
    }

    if (duration <= 0) {
      return showToast("End date cannot be before start date", "error");
    }

    // 2. Casual Leave Restriction (2 Days Advance)
    if (leave.category === "Casual") {
      const minDate = new Date(today);
      minDate.setDate(today.getDate() + 2);
      if (start < minDate) {
        return showToast(
          "Casual leave must be requested 2 days in advance",
          "error",
        );
      }
    }

    // 3. Overlap Check
    const isOverlapping = history.some((h) => {
      if (h.status === "Rejected" || h.status === "Revoked") return false;
      const hStart = new Date(h.startDate);
      const hEnd = new Date(h.endDate);
      // Overlap logic: (StartA <= EndB) and (EndA >= StartB)
      return start <= hEnd && end >= hStart;
    });

    if (isOverlapping) {
      return showToast(
        "You already have a leave request for these dates",
        "error",
      );
    }

    // 4. Past Date Check (Except Medical/Emergency if your policy allows)
    if (start < today && leave.category === "Casual") {
      return showToast("Cannot apply for Casual leave on past dates", "error");
    }

    try {
      await axios.post(
        `${API_URL}/employee/leave`,
        { ...leave, duration },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      showToast("Requested Successfully", "success");
      setLeave({ startDate: "", endDate: "", category: "Casual", reason: "" });
      fetchData();
    } catch (e) {
      showToast(e.response?.data?.error || "Submission failed", "error");
    }
  };

  return (
    <section
      className="page-content"
      style={{ overflow: "hidden", width: "100%" }}>
      <style>
        {`
          .leave-layout-wrapper { display: flex; flex-direction: column; gap: 20px; margin: 20px 20px 20px 0; max-width: calc(100% - 40px); box-sizing: border-box; }
          .balance-strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
          .leave-main-grid { display: grid; grid-template-columns: 380px minmax(0, 1fr); gap: 20px; align-items: stretch; }
          .glass-panel { background: var(--glass); border-radius: 20px; border: 1px solid var(--glass-border); display: flex; flex-direction: column; overflow: hidden; box-sizing: border-box; }
          .form-container { padding: 25px; min-height: 450px; }
          .history-container { height: 450px; }
          .filter-bar { display: grid; grid-template-columns: 1.2fr 1.2fr 1.2fr; gap: 35px; padding: 12px; background: rgba(74, 31, 69, 0.06); border-bottom: 1px solid var(--glass-border); margin: 0 15px 10px 15px; border-radius: 10px; }
          .filter-input { background: rgba(74, 31, 69, 0.05); border: 1px solid rgba(74, 31, 69, 0.12); color: var(--ink); border-radius: 8px; padding: 4px; font-size: 12px; outline: none; width: 95%; }
          .scroll-list { flex: 1; overflow-y: auto; padding: 0 15px 15px 15px; }
          .scroll-list::-webkit-scrollbar { width: 6px; }
          .scroll-list::-webkit-scrollbar-thumb { background: rgba(74, 31, 69, 0.1); border-radius: 10px; }
          .history-item { display: flex; align-items: center; padding: 15px; background: rgba(74, 31, 69, 0.03); border-radius: 12px; margin-bottom: 10px; border: 1px solid transparent; transition: 0.3s; }
          .history-item:hover { border-color: var(--accent-soft); background: rgba(74, 31, 69, 0.06); }
          .date-range-box { min-width: 100px; border-right: 1px solid rgba(74, 31, 69, 0.12); margin-right: 15px; display: flex; flex-direction: column; }
          .date-sub { font-size: 9px; opacity: 0.5; text-transform: uppercase; }
          .date-val { font-size: 12px; font-weight: bold; color: var(--accent); }
          .leave-desc { font-size: 11px; opacity: 0.6; margin-top: 4px; font-style: italic; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
          .status-pill.small { padding: 4px 10px; font-size: 10px; font-weight: bold; border-radius: 6px; text-transform: uppercase; margin-left: auto; }
          .status-pill.pending { background: #a8741a33; color: #a8741a; }
          .status-pill.approved { background: #2f7d4f33; color: #2f7d4f; }
          .status-pill.rejected { background: #c0392b33; color: #c0392b; }
        `}
      </style>

      <div className="leave-layout-wrapper">
        <div className="balance-strip">
          {Object.keys(limits).map((cat) => (
            <div
              className="mini-balance-card"
              key={cat}
              style={{
                background: "var(--glass)",
                padding: "20px",
                borderRadius: "15px",
                textAlign: "center",
                border: "1px solid var(--glass-border)",
              }}>
              <span
                style={{
                  fontSize: "11px",
                  opacity: 0.6,
                  textTransform: "uppercase",
                }}>
                {cat} Remaining
              </span>
              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "bold",
                  marginTop: "5px",
                }}>
                {limits[cat] -
                  history
                    .filter(
                      (h) => h.category === cat && h.status === "Approved",
                    )
                    .reduce((s, r) => s + r.duration, 0)}
              </div>
            </div>
          ))}
        </div>

        <div className="leave-main-grid">
          <div className="glass-panel form-container">
            <h3 style={{ marginBottom: "15px" }}>New Request</h3>
            <div className="form-group">
              <label className="timestamp-label">Category</label>
              <select
                className="custom-select"
                value={leave.category}
                onChange={(e) =>
                  setLeave({ ...leave, category: e.target.value })
                }>
                <option value="Casual">Casual Leave</option>
                <option value="Medical">Medical Leave</option>
                <option value="Emergency">Emergency Leave</option>
              </select>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
                marginTop: "15px",
              }}>
              <div className="form-group">
                <label className="timestamp-label">Start Date</label>
                <input
                  type="date"
                  className="glass-input"
                  value={leave.startDate}
                  onChange={(e) =>
                    setLeave({ ...leave, startDate: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="timestamp-label">End Date</label>
                <input
                  type="date"
                  className="glass-input"
                  value={leave.endDate}
                  onChange={(e) =>
                    setLeave({ ...leave, endDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: "15px", flex: 1 }}>
              <label className="timestamp-label">Reason</label>
              <textarea
                className="glass-input"
                rows="3"
                placeholder="Explain your leave..."
                style={{ resize: "none" }}
                value={leave.reason}
                onChange={(e) => setLeave({ ...leave, reason: e.target.value })}
              />
            </div>
            <button
              className="action-btn"
              onClick={submitLeave}
              style={{ width: "100%", marginTop: "15px", padding: "12px" }}>
              Submit Request
            </button>
          </div>

          <div className="glass-panel history-container">
            <h4
              style={{
                margin: "20px 0 10px 20px",
                fontSize: "14px",
                opacity: 0.8,
              }}>
              Leave History
            </h4>
            <div className="filter-bar">
              <input
                type="date"
                className="filter-input"
                onChange={(e) =>
                  setFilters({ ...filters, date: e.target.value })
                }
              />
              <select
                className="filter-input"
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }>
                <option value="All">All Categories</option>
                <option value="Casual">Casual</option>
                <option value="Medical">Medical</option>
                <option value="Emergency">Emergency</option>
              </select>
              <input
                type="number"
                placeholder="Days"
                className="filter-input"
                onChange={(e) =>
                  setFilters({ ...filters, days: e.target.value })
                }
              />
            </div>

            <div className="scroll-list">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((h) => (
                  <div className="history-item" key={h._id}>
                    <div className="date-range-box">
                      <span className="date-sub">From</span>
                      <span className="date-val">
                        {new Date(h.startDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                      <span className="date-sub" style={{ marginTop: "4px" }}>
                        To
                      </span>
                      <span className="date-val">
                        {new Date(h.endDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: "600" }}>
                        {h.category} •{" "}
                        <span style={{ opacity: 0.7, fontWeight: "400" }}>
                          {h.duration} Days
                        </span>
                      </div>
                      <div className="leave-desc" title={h.reason}>
                        {h.reason || "No description"}
                      </div>
                    </div>
                    <span
                      className={`status-pill small ${h.status.toLowerCase()}`}>
                      {h.status}
                    </span>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    marginTop: "50px",
                    opacity: 0.3,
                    fontSize: "13px",
                  }}>
                  No records found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LeaveCenter;