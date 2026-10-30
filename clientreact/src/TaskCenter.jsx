import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { API_URL } from "./apiConfig";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

function TaskCenter({ token, showToast }) {
  const [tasks, setTasks] = useState([]);
  const [activePopover, setActivePopover] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [now, setNow] = useState(new Date());

  // Filter States
  const [filterDate, setFilterDate] = useState("");
  const [filterMode, setFilterMode] = useState("assignedAt"); // 'assignedAt' or 'deadline'

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_URL}/employee/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allTasks = res.data.performance?.assignedTasks || [];
      const currentTime = new Date();
      const processedTasks = allTasks.map((t) => ({
        ...t,
        isAtRisk:
          (t.status === "Pending" ||
            t.status === "Planning" ||
            t.status === "Processing") &&
          new Date(t.deadline) < currentTime,
      }));
      setTasks(processedTasks);
    } catch (e) {
      console.error("Fetch Error:", e);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [token]);

  useEffect(() => {
    const handleGlobalClick = () => setActivePopover(null);
    if (activePopover) window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, [activePopover]);

  const updateStatus = async (taskId, newStatus, e) => {
    if (e) e.stopPropagation();
    try {
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
      );
      setActivePopover(null);
      await axios.patch(
        `${API_URL}/employee/update-task-status/${taskId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(`Moved to ${newStatus}`, "success");
    } catch (e) {
      showToast("Sync failed", "error");
      fetchTasks();
    }
  };

  const calculateDuration = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffMs = Math.abs(e - s);
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getTimeRemaining = (deadline) => {
    const diff = new Date(deadline) - now;
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / 1000 / 60) % 60);
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${mins}m remaining`;
    return `${mins}m remaining`;
  };

  const columnConfig = [
    { id: "Pending", color: "#a8741a" },
    { id: "Planning", color: "#6a5acd" },
    { id: "Processing", color: "#2b6cb0" },
    { id: "Completed", color: "#2f7d4f" },
  ];

  const stats = useMemo(() => {
    return columnConfig.map((col) => ({
      name: col.id,
      value: tasks.filter((t) => t.status === col.id).length,
      color: col.color,
    }));
  }, [tasks]);

  const attentionFeed = useMemo(() => {
    return tasks.filter((t) => t.isAtRisk).slice(0, 4);
  }, [tasks]);

  const totalLoad = stats.reduce((sum, s) => sum + s.value, 0);
  const completedTasks = tasks.filter(
    (t) => t.status === "Completed" && t.completedAt
  );
  const avgCycleTime =
    completedTasks.length > 0
      ? completedTasks.reduce(
          (sum, t) =>
            sum +
            Math.abs(
              new Date(t.completedAt) - new Date(t.assignedAt || t.createdAt)
            ),
          0
        ) / completedTasks.length
      : null;

  const filteredTasks = useMemo(() => {
    let result = tasks.filter((t) => t.status === selectedCategory);

    if (filterDate) {
      result = result.filter((t) => {
        const dateObj = new Date(
          filterMode === "assignedAt" ? t.assignedAt || t.createdAt : t.deadline
        );
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        const localDateString = `${year}-${month}-${day}`;
        return localDateString === filterDate;
      });
    }
    return result;
  }, [tasks, selectedCategory, filterDate, filterMode]);

  return (
    <section
      className="page-content"
      style={{
        padding: 0,
        height: "calc(100vh - 120px)",
        overflow: "hidden",
      }}
    >
      <style>
        {`
          .console-container { 
            padding: 20px; 
            color: var(--ink); 
            height: 100%; 
            overflow: hidden; 
            box-sizing: border-box;
          }
          .analytics-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 20px; margin-bottom: 30px; }
          .system-gauge-pane { background: var(--glass); border-radius: 20px; padding: 30px; display: flex; flex-direction: column; align-items: center; justify-content: space-between; position: relative; min-height: 240px; }
          .at-risk-pane { background: rgba(74, 31, 69, 0.06); border-radius: 20px; padding: 30px; }
          .stat-grid-compact { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
          .small-stat-card { background: var(--glass); border: 1px solid var(--glass-border); padding: 15px; border-radius: 14px; text-align: center; cursor: pointer; transition: 0.2s; }
          .small-stat-card:hover { background: var(--accent-soft); border-color: var(--accent); transform: translateY(-3px); }
          .compact-task-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; padding-bottom: 40px; }
          .compact-card { padding: 16px !important; border-radius: 12px !important; position: relative; min-height: 140px; display: flex; flex-direction: column; justify-content: space-between; }
          .task-title { font-size: 0.9rem; font-weight: 600; color: var(--ink); margin-bottom: 12px; }
          .timestamp-label { font-size: 8px; text-transform: uppercase; color: var(--text-dim); }
          .timestamp-value { font-size: 11px; color: rgba(42, 21, 48, 0.9); font-family: monospace; margin-bottom: 8px; }
          .task-status-overlay { position: absolute; inset: 0; background: #fbf9f6; border: 1px solid var(--accent); border-radius: 12px; padding: 12px; z-index: 10; display: flex; flex-direction: column; justify-content: center; animation: popIn 0.2s ease-out; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
          .pop-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid rgba(74, 31, 69, 0.12); padding-bottom: 5px; }
          .pop-title { font-size: 9px; font-weight: bold; color: var(--accent); letter-spacing: 1px; }
          .pop-close { background: none; border: none; color: var(--ink); cursor: pointer; font-size: 16px; line-height: 1; padding: 2px 5px; opacity: 0.6; }
          .pop-close:hover { opacity: 1; }
          .task-status-btn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
          .task-status-option { font-size: 10px; padding: 6px 2px; border-radius: 6px; cursor: pointer; background: rgba(74, 31, 69, 0.03); transition: 0.2s; border: 1px solid transparent; }
          .task-status-option:hover { background: rgba(74, 31, 69, 0.1); }
          .filter-bar { background: rgba(74, 31, 69, 0.05); padding: 10px 15px; border-radius: 12px; margin-bottom: 20px; display: flex; align-items: center; gap: 20px; border: 1px solid var(--glass-border); }
          .filter-group { display: flex; align-items: center; gap: 10px; }
          .filter-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; }
          .filter-input { background: #fbf9f6; border: 1px solid var(--glass-border); color: var(--ink); padding: 5px 10px; border-radius: 6px; font-size: 12px; outline: none; }
          .filter-toggle { display: flex; background: #fbf9f6; border-radius: 8px; overflow: hidden; border: 1px solid var(--glass-border); }
          .toggle-btn { padding: 6px 12px; font-size: 10px; border: none; background: transparent; color: var(--text-dim); cursor: pointer; transition: 0.2s; }
          .toggle-btn.active { background: var(--accent); color: var(--ink); }
          
          @keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          .completion-badge, .remaining-badge { margin-top: 8px; padding: 6px; border-radius: 6px; text-align: center; }
          .completion-badge { background: rgba(46, 204, 113, 0.1); border: 1px solid #2f7d4f; }
          .remaining-badge { background: rgba(74, 31, 69, 0.05); border: 1px solid rgba(74, 31, 69, 0.2); }
        `}
      </style>

      <div className="console-container">
        {!selectedCategory ? (
          <div
            className="summary-view"
            style={{ animation: "fadeIn 0.5s ease" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "25px",
                padding: "0 5px",
              }}
            >
              <h2
                style={{
                  fontWeight: "400",
                  letterSpacing: "0.5px",
                  margin: 0,
                }}
              >
                Workflow <span style={{ color: "var(--accent)" }}>Console</span>
              </h2>
              <div style={{ display: "flex", gap: "15px" }}>
                <div className="burn-badge" style={{ fontSize: "11px" }}>
                  SYSTEM LOAD: {totalLoad} NODES
                </div>
                {avgCycleTime && (
                  <div className="time-badge" style={{ fontSize: "11px" }}>
                    AV. CYCLE: {calculateDuration(0, avgCycleTime)}
                  </div>
                )}
              </div>
            </div>

            <div className="stat-grid-compact">
              {stats.map((s) => (
                <div
                  key={s.name}
                  className="small-stat-card"
                  onClick={() => setSelectedCategory(s.name)}
                >
                  <div
                    style={{
                      color: s.color,
                      fontSize: "15px",
                      fontWeight: "bold",
                    }}
                  >
                    {s.name.toUpperCase()}
                  </div>
                  <div
                    style={{
                      fontSize: "2.5rem",
                      fontWeight: "bold",
                      margin: "8px 0",
                    }}
                  >
                    {s.value}
                  </div>
                  <div style={{ opacity: 0.4, fontSize: "9px" }}>
                    TOTAL NODES
                  </div>
                </div>
              ))}
            </div>

            <div className="analytics-grid">
              <div className="system-gauge-pane glass">
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: "500",
                    alignSelf: "flex-start",
                    color: "var(--text-dim)",
                    opacity: 0.6,
                    margin: 0,
                  }}
                >
                  System capacity
                </h3>
                <div
                  style={{
                    height: "250px",
                    width: "100%",
                    position: "relative",
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats}
                        startAngle={180}
                        endAngle={0}
                        innerRadius={90}
                        outerRadius={125}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        animationBegin={0}
                        animationDuration={600}
                        isAnimationActive={true}
                      >
                        {stats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          background: "#fbf9f6",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div
                    style={{
                      position: "absolute",
                      bottom: "10px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "28px", fontWeight: "bold" }}>
                      {totalLoad}
                    </div>
                    <div style={{ fontSize: "10px", opacity: 0.5 }}>
                      ACTIVE WIP
                    </div>
                  </div>
                </div>
              </div>

              <div className="at-risk-pane glass">
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: "500",
                    marginBottom: "15px",
                    marginTop: 0,
                    color: "var(--danger)",
                  }}
                >
                  Nodes Requiring Attention ({attentionFeed.length})
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {attentionFeed.length === 0 && (
                    <div
                      style={{
                        color: "var(--success)",
                        textAlign: "center",
                        padding: "50px 0",
                        fontSize: "13px",
                      }}
                    >
                      ✓ System Stable.
                    </div>
                  )}
                  {attentionFeed.map((t) => (
                    <div
                      key={t._id}
                      className="glass talent-item"
                      style={{
                        borderColor: "var(--danger)",
                        background: "rgba(255, 71, 87, 0.05)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span
                          style={{
                            color: "var(--danger)",
                            fontSize: "8px",
                            fontWeight: "bold",
                          }}
                        >
                          DELAYED
                        </span>
                        <strong style={{ fontSize: "13px" }}>{t.title}</strong>
                        <small style={{ fontSize: "10px" }}>
                          In {t.status}
                        </small>
                      </div>
                      <div
                        className="time-badge"
                        style={{
                          color: "var(--danger)",
                          background: "rgba(255, 71, 87, 0.1)",
                          borderColor: "var(--danger)",
                        }}
                      >
                        D:{" "}
                        {new Date(t.deadline).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="detail-view"
            style={{
              animation: "fadeIn 0.4s ease",
              height: "100%",
              overflowY: "auto",
              paddingRight: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "15px" }}
              >
                <button
                  className="action-btn small"
                  onClick={() => {
                    setSelectedCategory(null);
                    setFilterDate(""); // Reset filter on back
                  }}
                >
                  ← BACK
                </button>
                <h3
                  style={{
                    margin: 0,
                    color: columnConfig.find((c) => c.id === selectedCategory)
                      .color,
                  }}
                >
                  {selectedCategory} PHASE
                </h3>
              </div>

              <div className="filter-bar" style={{ margin: 0 }}>
                <div className="filter-group">
                  <span className="filter-label">Filter:</span>
                  <div className="filter-toggle">
                    <button
                      className={`toggle-btn ${
                        filterMode === "assignedAt" ? "active" : ""
                      }`}
                      onClick={() => setFilterMode("assignedAt")}
                    >
                      Assigned
                    </button>
                    <button
                      className={`toggle-btn ${
                        filterMode === "deadline" ? "active" : ""
                      }`}
                      onClick={() => setFilterMode("deadline")}
                    >
                      Due
                    </button>
                  </div>
                </div>
                <div className="filter-group">
                  <input
                    type="date"
                    className="filter-input"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  />
                  {filterDate && (
                    <button
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--danger)",
                        cursor: "pointer",
                        fontSize: "10px",
                      }}
                      onClick={() => setFilterDate("")}
                    >
                      CLEAR
                    </button>
                  )}
                </div>
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "100px 40px",
                  opacity: 0.5,
                }}
              >
                No tasks match the selected criteria.
              </div>
            ) : (
              <div className="compact-task-grid">
                {filteredTasks.map((t) => {
                  const isActive = activePopover === t._id;
                  const isOverdue =
                    new Date(t.deadline) < now &&
                    selectedCategory !== "Completed";
                  const remainingText = getTimeRemaining(t.deadline);
                  const col = columnConfig.find(
                    (c) => c.id === selectedCategory
                  );

                  return (
                    <div key={t._id} style={{ position: "relative" }}>
                      <div
                        className="glass card compact-card"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePopover(isActive ? null : t._id);
                        }}
                        style={{
                          borderLeft: `4px solid ${col.color}`,
                          background: isActive
                            ? "rgba(74, 31, 69, 0.12)"
                            : "rgba(74, 31, 69, 0.07)",
                          cursor: "pointer",
                        }}>
                        <div className="task-title">{t.title}</div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "2px",
                          }}>
                          <div>
                            <div className="timestamp-label">Assigned At</div>
                            <div className="timestamp-value">
                              {new Date(
                                t.assignedAt || t.createdAt,
                              ).toLocaleString([], {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </div>
                          </div>
                          <div>
                            <div className="timestamp-label">Due Deadline</div>
                            <div
                              className="timestamp-value"
                              style={{
                                color: isOverdue ? "var(--danger)" : "inherit",
                              }}>
                              {new Date(t.deadline).toLocaleString([], {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </div>
                          </div>
                        </div>
                        {/* NEW SECTION: ASSIGNED BY */}
                        <div
                          style={{
                            marginTop: "4px",
                            paddingTop: "6px",
                            borderTop: "1px solid rgba(74, 31, 69, 0.12)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}>
                          <div
                            className="timestamp-label"
                            style={{ fontSize: "9px" }}>
                            Assigned By
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: "6px",
                              alignItems: "center",
                            }}>
                            <span
                              style={{
                                fontSize: "9px",
                                padding: "0 4px",
                                borderRadius: "2px",
                              }}
                              className="timestamp-label">
                              {t.assignedBy?.name || "System Admin"}
                            </span>
                            <span
                              style={{
                                fontSize: "8px",
                                color: "var(--accent)",
                                border: "1px solid var(--accent)",
                                padding: "0 4px",
                                borderRadius: "2px",
                              }}>
                              {t.assignedBy?.role?.toUpperCase() || "ADMIN"}
                            </span>
                          </div>
                        </div>

                        {t.status === "Completed" && t.completedAt ? (
                          <div className="completion-badge">
                            <div
                              className="timestamp-label"
                              style={{ color: "#2f7d4f" }}>
                              Total Workflow Time
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                fontWeight: "bold",
                                color: "var(--ink)",
                              }}>
                              {calculateDuration(
                                t.assignedAt || t.createdAt,
                                t.completedAt,
                              )}
                            </div>
                          </div>
                        ) : isOverdue ? (
                          <div
                            style={{
                              marginTop: "10px",
                              color: "#c0392b",
                              fontSize: "8px",
                              fontWeight: "bold",
                              textAlign: "center",
                              letterSpacing: "1px",
                            }}>
                            ⚠️ CRITICAL DELAY
                          </div>
                        ) : (
                          <div className="remaining-badge">
                            <div
                              className="timestamp-label"
                              style={{ color: "var(--accent)" }}>
                              Time Remaining
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                fontWeight: "600",
                                color: "var(--ink)",
                              }}>
                              {remainingText || "Calculating..."}
                            </div>
                          </div>
                        )}

                        {isActive && (
                          <div
                            className="task-status-overlay"
                            onClick={(e) => e.stopPropagation()}>
                            <div className="pop-header">
                              <span className="pop-title">SET PHASE</span>
                              <button
                                className="pop-close"
                                onClick={() => setActivePopover(null)}>
                                &times;
                              </button>
                            </div>
                            <div className="task-status-btn-grid">
                              {columnConfig.map((btn) => (
                                <button
                                  key={btn.id}
                                  className="task-status-option"
                                  onClick={(e) =>
                                    updateStatus(t._id, btn.id, e)
                                  }
                                  style={{
                                    borderColor:
                                      btn.id === t.status
                                        ? btn.color
                                        : btn.color + "44",
                                    color: btn.color,
                                  }}>
                                  {btn.id}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default TaskCenter;