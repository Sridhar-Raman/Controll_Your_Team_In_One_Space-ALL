

import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import "./App.css";
import UserAvatar from "./UserAvatar";
import { io } from "socket.io-client";
import { RiLogoutCircleRLine } from "react-icons/ri";
import { LiaUserShieldSolid } from "react-icons/lia";
import { FaUsersGear } from "react-icons/fa6";
import { FaUserShield } from "react-icons/fa";
import { GrAnalytics } from "react-icons/gr";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Users,
  Cpu,
  Wrench,
  FileText,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Calendar,
  ThumbsUp,
  X,
  ClipboardList,
  User,
  Search,
  ChevronRight,
  ChevronLeft,
  Activity,
  AlertTriangle,
  Timer,
  Clock,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  Home,
  Folder,
  Trophy,
  Check,
  Zap,
  BarChart3,
  BrainCircuit,
  Target,
} from "lucide-react";
import { API_URL, SOCKET_URL } from "./apiConfig";

import { Radar } from "react-chartjs-2";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

import Dashboard from "./Dashboard";
import TaskCenter from "./TaskCenter";
import LeaveCenter from "./LeaveCenter";
import AttendanceTab from "./AttendanceTab";
import EODReportTab from "./EODReportTab";
import AccountTab from "./AccountTab";
import BrandLogo from "./BrandLogo";
import PageHeading from "./PageHeading";
import HeaderActions from "./HeaderActions";
import useAttendance from "./useAttendance";
import { UserCircle } from "lucide-react";
import ChatDrawer from "./ChatDrawer";

export default function ManagerDashboard({ token, user, showToast, logout }) {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const { attendance, timer } = useAttendance(token);
  const [socket, setSocket] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      auth: { token },
    });
    setSocket(newSocket);

    return () => newSocket.close();
  }, [token]);

  return (
    <>
      <aside className="glass sidebar">
        <BrandLogo />
        <hr className="divider" />
        <nav className="nav-menu">
          <button
            onClick={() => setCurrentPage("dashboard")}
            className={`nav-link ${currentPage === "dashboard" ? "active" : ""}`}>
            <Home size={18} /> Dashboard
          </button>
          <button
            onClick={() => setCurrentPage("messenger")}
            className={`nav-link ${currentPage === "messenger" ? "active" : ""}`}>
            <MessageSquare size={18} /> Messenger
          </button>
          <button
            onClick={() => setCurrentPage("tasks")}
            className={`nav-link ${currentPage === "tasks" ? "active" : ""}`}>
            <Folder size={18} /> Tasks
          </button>
          <button
            onClick={() => setCurrentPage("leads")}
            className={`nav-link ${currentPage === "leads" ? "active" : ""}`}>
            <FaUserShield size={18} /> Leads Overview
          </button>
          <button
            onClick={() => setCurrentPage("organization")}
            className={`nav-link ${currentPage === "organization" ? "active" : ""}`}>
            <FaUsersGear size={18} /> Organization
          </button>
          <button
            onClick={() => setCurrentPage("analytics")}
            className={`nav-link ${currentPage === "analytics" ? "active" : ""}`}>
            <GrAnalytics size={18} /> Analytics
          </button>
          <button
            onClick={() => setCurrentPage("manager-assign-task")}
            className={`nav-link ${currentPage === "manager-assign-task" ? "active" : ""}`}>
            <Zap size={18} /> Lead Dispatcher
          </button>
          <button
            onClick={() => setCurrentPage("attendance")}
            className={`nav-link ${currentPage === "attendance" ? "active" : ""}`}>
            <Clock size={18} /> Attendance
          </button>
          <button
            onClick={() => setCurrentPage("eod")}
            className={`nav-link ${currentPage === "eod" ? "active" : ""}`}>
            <FileText size={18} /> EOD Reports
          </button>
          <button
            onClick={() => setCurrentPage("leave")}
            className={`nav-link ${currentPage === "leave" ? "active" : ""}`}>
            <Calendar size={18} /> Leave Center
          </button>
          <button
            onClick={() => setCurrentPage("account")}
            className={`nav-link ${currentPage === "account" ? "active" : ""}`}>
            <UserCircle size={18} /> My Account
          </button>
        </nav>
        <div className="user-info">
          <UserAvatar name={user.name} />
          <div className="user-text">
            <div className="user-label-row">
              <span>{user.name}</span>
            </div>
            <span
              className="badge"
              style={{ fontSize: "0.7rem", opacity: 0.7 }}>
              MANAGER
            </span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="glass top-bar">
          <div className="header-left">
            <PageHeading page={currentPage} name={user.name} />
          </div>
          <div className="header-right">
            {attendance?.checkInTime && (
              <span className="timer-display">
                Hours Worked Today: <strong>{timer}</strong>
              </span>
            )}
          <HeaderActions token={token} userId={user.id} logout={logout} />
          </div>
        </header>

        {currentPage === "dashboard" && (
          <Dashboard token={token} userId={user.id} showToast={showToast} userRole={user.role} />
        )}
        {currentPage === "messenger" && socket && (
          <ChatDrawer
            socket={socket}
            user={user}
            isOpen={true}
            isSidebarMode={true}
          />
        )}
        {currentPage === "tasks" && (
          <TaskCenter token={token} showToast={showToast} />
        )}

        {currentPage === "leads" && (
          <LeadsTab
            token={token}
            onAudit={(lead) => setSelectedLead(lead)}
            selectedLead={selectedLead}
            onBack={() => setSelectedLead(null)}
          />
        )}

        {currentPage === "organization" && <OrganizationTab token={token} />}
        {currentPage === "analytics" && <AnalyticsTab token={token} />}
        {currentPage === "leave" && (
          <LeaveCenter token={token} showToast={showToast} />
        )}

        {currentPage === "manager-assign-task" && (
          <ManagerTaskAssigner
            token={token}
            user={user}
            showToast={showToast}
          />
        )}
        {currentPage === "attendance" && (
          <AttendanceTab
            token={token}
            todayRecord={attendance}
            liveTimer={timer}
          />
        )}
        {currentPage === "account" && (
          <AccountTab token={token} showToast={showToast} />
        )}
        {currentPage === "eod" && (
          <EODReportTab token={token} user={user} showToast={showToast} />
        )}
      </main>
    </>
  );
}


/* ---------------- ORGANIZATION TAB (INTELLIGENCE GRID) ---------------- */
function OrganizationTab({ token }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const fetchEmployeesWithIntelligence = async () => {
    try {
      const res = await axios.get(`${API_URL}/manager/all-employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const basicEmps = Array.isArray(res.data) ? res.data : [];

      // Hydrate intelligence for rating calculation
      const intelligentEmps = await Promise.all(
        basicEmps.map(async (emp) => {
          try {
            const [taskRes, attendRes, eodRes] = await Promise.all([
              axios.get(`${API_URL}/manager/employee-tasks/${emp._id}`, { headers: { Authorization: `Bearer ${token}` } }),
              axios.get(`${API_URL}/manager/employee-attendance/${emp._id}`, { headers: { Authorization: `Bearer ${token}` } }),
              axios.get(`${API_URL}/manager/employee-eods/${emp._id}`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            // 1. Task Score
            const tasks = taskRes.data || [];
            const taskScore = tasks.length > 0 ? (tasks.filter(t => t.status === "Completed").length / tasks.length) * 100 : 0;

            // 2. Attendance Score (Target 8hrs)
            const logs = attendRes.data || [];
            const avgHours = logs.length > 0 ? logs.reduce((acc, l) => acc + parseFloat(l.totalHours || 0), 0) / logs.length : 0;
            const attendScore = Math.min((avgHours / 8) * 100, 100);

            // 3. EOD Score
            const eods = eodRes.data || [];
            const eodScore = eods.length > 0 ? (eods.filter(r => r.status === "Completed").length / eods.length) * 100 : 0;

            // Average Efficiency
            const efficiency = (taskScore + attendScore + eodScore) / 3;
            
            // Map 0-100 to 0-5 for the rating bars
            const rating = Math.ceil((efficiency / 100) * 5);

            return { ...emp, rating: rating || 0, efficiency };
          } catch (e) {
            return { ...emp, rating: 0 };
          }
        })
      );

      setEmployees(intelligentEmps);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchEmployeesWithIntelligence();
  }, [token]);

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedEmployee) {
    return (
      <EmployeeAuditView 
        employee={selectedEmployee} 
        token={token} 
        onBack={() => setSelectedEmployee(null)}
      />
    );
  }

  if (loading) return <div className="page-content">Syncing Personnel Intelligence...</div>;

  return (
    <section className="page-content" style={{ animation: "fadeIn 0.5s ease" }}>
      <header className="glass top-bar" style={{ marginBottom: "20px", display: 'flex', justifyContent: 'space-between', padding: '20px' }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <h1 style={{ margin: 0 }}>Human Capital Index</h1>
          <span className="mini-label" style={{ background: "var(--accent)", color: "rgb(255, 255, 255)", padding: "2px 8px", borderRadius: "4px" }}>
            {employees.length} NODES
          </span>
        </div>
        <div style={{ position: "relative" }}>
          <input
            className="glass-input"
            placeholder="Search employee..."
            style={{ width: "300px", padding: "10px 15px", borderRadius: '8px', border: '1px solid rgba(74, 31, 69, 0.12)', background: 'rgba(74, 31, 69, 0.05)', color: 'var(--ink)' }}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className="feed-scroll" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
        {filtered.map((e) => (
          <div key={e._id} className="glass card" style={{ padding: "20px", borderLeft: "4px solid var(--accent)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                  {e.name.charAt(0)}
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "1rem" }}>{e.name}</strong>
                  <span className="mini-label" style={{ fontSize: "0.65rem", opacity: 0.6 }}>{e.role}</span>
                </div>
              </div>
            </div>

            <div style={{ background: "rgba(74, 31, 69, 0.02)", padding: "12px", borderRadius: "8px", marginBottom: "15px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span className="mini-label" style={{ fontSize: "10px" }}>PROTOCOL</span>
                <span style={{ fontSize: "11px", color: e.currentTask === "Idle" ? "var(--text-dim)" : "var(--success)" }}>
                  {e.currentTask}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="mini-label" style={{ fontSize: "10px" }}>REPORTS TO</span>
                <span style={{ fontSize: "11px", fontWeight: "bold" }}>{e.assignedLeadName}</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {/* DYNAMIC RATING BAR */}
              <div style={{ display: "flex", gap: "3px" }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: "6px",
                      height: "15px",
                      borderRadius: "2px",
                      background: i <= e.rating ? "var(--accent)" : "rgba(74, 31, 69, 0.1)",
                      boxShadow: i <= e.rating ? "0 0 5px var(--accent-soft)" : "none",
                      transition: "all 0.3s ease"
                    }}
                  ></div>
                ))}
              </div>
              
              <button className="action-btn-mini" onClick={() => setSelectedEmployee(e)} style={{ fontSize: "0.65rem", padding: "5px 12px", background: "rgba(92, 34, 82, 0.1)", border: "1px solid var(--accent)", color: "var(--accent)", cursor: "pointer" }}>
                VIEW LOGS
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- EMPLOYEE AUDIT VIEW (SUB-PAGE) ---------------- */
function EmployeeAuditView({ employee, token, onBack }) {
  const [activeSubView, setActiveSubView] = useState("menu");

  const handleBack = () => {
    if (activeSubView === "menu") onBack();
    else setActiveSubView("menu");
  };

  return (
    <section className="page-content audit-mode" style={{ animation: "fadeIn 0.3s ease" }}>
      {/* HEADER SECTION */}
      <div className="view-header">
        <button className="back-btn" onClick={handleBack}>
          <ArrowLeft size={14} />
          <span>{activeSubView === "menu" ? "Exit Audit" : "Back"}</span>
        </button>

        <h2 style={{ margin: 0, fontWeight: "400" }}>
          Analytics:{" "}
          <span style={{ color: "var(--accent)" }}>{employee.name.toUpperCase()}</span>
        </h2>

        <span className="sub-tag">{activeSubView.toUpperCase()}</span>
      </div>

      {/* WORKSPACE CONTENT */}
      <div className="audit-workspace">
        {activeSubView === "menu" ? (
          <div className="audit-menu-grid">
            {/* Efficiency Tracker */}
            <div className="audit-card glass" onClick={() => setActiveSubView("tasks")}>
              <div className="icon-box task-bg">
                <Zap color="#5c2252" />
              </div>
              <div className="text">
                <h3>Efficiency Tracker</h3>
                <p>Task completion & bottlenecks</p>
              </div>
              <ChevronRight opacity={0.3} />
            </div>

            {/* Reliability Engine */}
            <div className="audit-card glass" onClick={() => setActiveSubView("attendance")}>
              <div className="icon-box attend-bg">
                <ShieldCheck color="#2f7d4f" />
              </div>
              <div className="text">
                <h3>Reliability Engine</h3>
                <p>Attendance patterns & hours</p>
              </div>
              <ChevronRight opacity={0.3} />
            </div>

            {/* Activity Intelligence */}
            <div className="audit-card glass" onClick={() => setActiveSubView("eod")}>
              <div className="icon-box eod-bg">
                <BrainCircuit color="#6a5acd" />
              </div>
              <div className="text">
                <h3>Activity Intelligence</h3>
                <p>AI pattern detection & EOD logs</p>
              </div>
              <ChevronRight opacity={0.3} />
            </div>
          </div>
        ) : (
          <div
            className="audit-content-body">
            {activeSubView === "tasks" && (
              <TasksAudit token={token} memberId={employee._id} />
            )}
            {activeSubView === "attendance" && (
              <AttendanceAudit token={token} memberId={employee._id} />
            )}
            {activeSubView === "eod" && (
              <EODAudit token={token} memberId={employee._id} />
            )}
          </div>
        )}
      </div>
      <style>{styles}</style>
    </section>
  );
}



/* ---------------- LEADS OVERVIEW TAB ---------------- */
function LeadsTab({ token, selectedLead, onAudit, onBack }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Real-time fetch similar to TeamTab
  const fetchLeadsWithIntelligence = async () => {
    try {
      // 1. Fetch the basic summary
      const res = await axios.get(`${API_URL}/manager/leads-summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const basicLeads = Array.isArray(res.data) ? res.data : [];

      // 2. Hydrate each lead with actual efficiency metrics
      const intelligentLeads = await Promise.all(
        basicLeads.map(async (lead) => {
          try {
            // Fetch all metrics in parallel for speed
            const [taskRes, attendRes, eodRes] = await Promise.all([
              axios.get(`${API_URL}/manager/employee-tasks/${lead._id}`, {
                headers: { Authorization: `Bearer ${token}` },
              }),
              axios.get(`${API_URL}/manager/employee-attendance/${lead._id}`, {
                headers: { Authorization: `Bearer ${token}` },
              }),
              axios.get(`${API_URL}/manager/employee-eods/${lead._id}`, {
                headers: { Authorization: `Bearer ${token}` },
              }),
            ]);

            // A. Task Efficiency: 0% if no tasks exist
            const tasks = taskRes.data || [];
            const taskScore =
              tasks.length > 0
                ? (tasks.filter((t) => t.status === "Completed").length /
                    tasks.length) *
                  100
                : 0; // Fixed: Default to 0

            // B. Attendance Efficiency: 0% if no logs exist
            const logs = attendRes.data || [];
            const avgHours =
              logs.length > 0
                ? logs.reduce(
                    (acc, l) => acc + parseFloat(l.totalHours || 0),
                    0,
                  ) / logs.length
                : 0; // Fixed: Default to 0
            const attendScore = Math.min((avgHours / 8) * 100, 100);

            // C. EOD Efficiency: 0% if no EODs exist
            const eods = eodRes.data || [];
            const eodScore =
              eods.length > 0
                ? (eods.filter((r) => r.status === "Completed").length /
                    eods.length) *
                  100
                : 0; // Fixed: Default to 0

            // D. Combine (Weighted Average)
            // If a lead is brand new (no tasks, no logs, no EODs), this will now be 0.
            const finalEfficiency = Math.round(
              (taskScore + attendScore + eodScore) / 3,
            );
            return { ...lead, efficiency: finalEfficiency };
          } catch (e) {
            console.warn(`Could not fetch intelligence for ${lead.name}`);
            return { ...lead, efficiency: 0 };
          }
        }),
      );

      setLeads(intelligentLeads);
    } catch (err) {
      console.error("Leads Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadsWithIntelligence();
    const interval = setInterval(fetchLeadsWithIntelligence, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [token]);

  const leadInsights = useMemo(() => {
    const totalEff = leads.reduce((acc, l) => acc + (l.efficiency || 0), 0);
    return {
      totalNodes: leads.reduce((acc, l) => acc + (l.employeeCount || 0), 0),
      atRisk: leads.filter((l) => l.status !== "Available").length,
      avgEfficiency: leads.length > 0 ? Math.round(totalEff / leads.length) : 0,
    };
  }, [leads]);

  if (selectedLead) {
    return <LeadAuditView lead={selectedLead} token={token} onBack={onBack} />;
  }

  if (loading)
    return <div className="page-content">Analyzing Lead Intelligence...</div>;

  return (
    <section className="page-content" style={{ animation: "fadeIn 0.5s ease" }}>
      {/* 1. Top Command Bar (Imitating TeamTab) */}
      <div className="lead-command-bar glass">
        <div className="command-item">
          <Users size={18} color="#5c2252" />
          <div>
            <strong>{leadInsights.totalNodes}</strong>
            <label>Total Nodes</label>
          </div>
        </div>
        <div className="command-item">
          <AlertTriangle size={18} color="#c0392b" />
          <div>
            <strong>{leadInsights.atRisk}</strong>
            <label>Off-Pulse</label>
          </div>
        </div>
        <div className="command-item">
          <BarChart3 size={18} color="#2f7d4f" />
          <div>
            <strong>{leadInsights.avgEfficiency}%</strong>
            <label>Avg Efficiency</label>
          </div>
        </div>
      </div>

      {/* 2. Controls Row */}
      <header className="team-controls">
        <div className="section-header">
          <h1 style={{ fontSize: "1.8rem", fontWeight: "800", margin: 0 }}>
            LEAD COMMAND CENTER
          </h1>
          <span className="mini-label" style={{ color: "var(--accent)" }}>
            Department Sovereignty
          </span>
        </div>

        <div className="search-box glass">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div
        className="intelligence-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "20px",
        }}>
        {leads.length > 0 ? (
          leads.map((l) => (
            <div
              key={l._id}
              className="glass card"
              style={{
                position: "relative",
                overflow: "hidden",
                padding: "25px",
                transition: "transform 0.3s ease",
              }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "20px",
                }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem" }}>{l.name}</h3>
                  <small
                    style={{
                      opacity: 0.5,
                      textTransform: "uppercase",
                      fontSize: "0.65rem",
                      letterSpacing: "1px",
                    }}>
                    Department Lead
                  </small>
                </div>
                <div
                  className={`status-pill ${l.status === "Available" ? "approved" : "pending"}`}
                  style={{ fontSize: "0.7rem" }}>
                  {l.status}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                  marginBottom: "20px",
                }}>
                <div
                  className="stat-box"
                  style={{
                    background: "rgba(74, 31, 69, 0.03)",
                    padding: "10px",
                    borderRadius: "12px",
                    textAlign: "center",
                  }}>
                  <span className="mini-label">Nodes</span>
                  <div style={{ fontSize: "1.4rem", fontWeight: "bold" }}>
                    {l.employeeCount}
                  </div>
                </div>
                <div
                  className="stat-box"
                  style={{
                    background: "rgba(74, 31, 69, 0.03)",
                    padding: "10px",
                    borderRadius: "12px",
                    textAlign: "center",
                  }}>
                  <span className="mini-label">Efficiency</span>
                  <div
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: "bold",
                      color: "var(--accent)",
                    }}>
                    {l.efficiency}%
                  </div>
                </div>
              </div>
              <div
                className="progress-container"
                style={{
                  marginBottom: "16px",
                  height: "30px",
                  padding: "10px",
                 
                }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.7rem",
                    marginBottom: "8px",

                    opacity: 0.7,
                  }}>
                  <span>Team Bandwidth</span>
                  <span>{l.efficiency}%</span>
                </div>
                <div
                  style={{
                    height: "4px",
                    background: "rgba(74, 31, 69, 0.1)",
                    borderRadius: "2px",
                    
                  }}>
                  <div
                    style={{
                      width: `${l.efficiency}%`,
                      height: "100%",
                      background:
                        l.efficiency > 50 ? "var(--accent)" : "#c0392b",
                      borderRadius: "2px",
                      boxShadow: `0 0 10px ${l.efficiency > 50 ? "var(--accent)" : "#c0392b"}`,
                    }}></div>
                </div>
              </div>

              <button
                className="action-btn-mini"
                onClick={() => onAudit(l)}
                style={{
                  width: "100%",
                  marginTop: "10px",
                  background: "rgba(92, 34, 82, 0.1)",
                  border: "1px solid var(--accent)",
                  color: "var(--accent)",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                AUDIT PIPELINE
              </button>
            </div>
          ))
        ) : (
          <div
            className="glass card"
            style={{
              gridColumn: "1/-1",
              textAlign: "center",
              padding: "50px",
              opacity: 0.5,
            }}>
            <p>No high-level leads identified in this sector.</p>
          </div>
        )}
      </div>
      <style>{styles}</style>
    </section>
  );
}


/* ---------------- LEAD AUDIT VIEW ---------------- */
function LeadAuditView({ lead, token, onBack }) {
  const [activeSubView, setActiveSubView] = useState("menu");

  const handleBack = () => {
    if (activeSubView === "menu") {
      onBack(); // Returns to Leads List
    } else {
      setActiveSubView("menu"); // Returns to Audit Menu
    }
  };

  return (
    <section className="page-content audit-mode" style={{ animation: "fadeIn 0.3s ease" }}>
      {/* HEADER SECTION */}
      <div className="view-header">
        <button className="back-btn" onClick={handleBack}>
          <ArrowLeft size={14} />
          <span>{activeSubView === "menu" ? "Exit Audit" : "Back"}</span>
        </button>

        <h2 style={{ margin: 0, fontWeight: "400" }}>
          Analytics:{" "}
          <span style={{ color: "var(--accent)" }}>{lead.name.toUpperCase()}</span>
        </h2>

        <span className="sub-tag">{activeSubView.toUpperCase()}</span>
      </div>

      {/* WORKSPACE CONTENT */}
      <div className="audit-workspace">
        {activeSubView === "menu" ? (
          <div className="audit-menu-grid">
            {/* Efficiency Tracker */}
            <div className="audit-card glass" onClick={() => setActiveSubView("tasks")}>
              <div className="icon-box task-bg">
                <Zap color="#5c2252" />
              </div>
              <div className="text">
                <h3>Efficiency Tracker</h3>
                <p>Task completion & bottlenecks</p>
              </div>
              <ChevronRight opacity={0.3} />
            </div>

            {/* Reliability Engine */}
            <div className="audit-card glass" onClick={() => setActiveSubView("attendance")}>
              <div className="icon-box attend-bg">
                <ShieldCheck color="#2f7d4f" />
              </div>
              <div className="text">
                <h3>Reliability Engine</h3>
                <p>Attendance patterns & hours</p>
              </div>
              <ChevronRight opacity={0.3} />
            </div>

            {/* Activity Intelligence */}
            <div className="audit-card glass" onClick={() => setActiveSubView("eod")}>
              <div className="icon-box eod-bg">
                <BrainCircuit color="#6a5acd" />
              </div>
              <div className="text">
                <h3>Activity Intelligence</h3>
                <p>AI pattern detection & EOD logs</p>
              </div>
              <ChevronRight opacity={0.3} />
            </div>
          </div>
        ) : (
          <div className="audit-content-body">
            {activeSubView === "tasks" && (
              <TasksAudit token={token} memberId={lead._id} />
            )}
            {activeSubView === "attendance" && (
              <AttendanceAudit token={token} memberId={lead._id} />
            )}
            {activeSubView === "eod" && (
              <EODAudit token={token} memberId={lead._id} />
            )}
          </div>
        )}
      </div>
      <style>{styles}</style>
    </section>
  );
}

const TasksAudit = ({ token, memberId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
    hover: { scale: 1.02, backgroundColor: "rgba(74, 31, 69, 0.05)" },
  };

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/manager/employee-tasks/${memberId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setTasks(res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [memberId, token]);

  const getEfficiency = (task) => {
    if (!task.deadline || !task.assignedAt) return null;
    const start = new Date(task.assignedAt || task.createdAt);
    const deadline = new Date(task.deadline);
    const end = task.completedAt ? new Date(task.completedAt) : new Date();
    const now = new Date();

    const totalTime = deadline - start;
    const usedTime = end - start;
    if (totalTime <= 0) return null;
    const ratio = usedTime / totalTime;

    if (task.status === "Completed") {
      if (task.completedAt && new Date(task.completedAt) > deadline) {
        return { label: "Late", color: "#ff7f50", score: 60 };
      }
      if (ratio < 0.5) return { label: "Early", color: "#2f7d4f", score: 100 };
      if (ratio < 0.85)
        return { label: "On Time", color: "#2f7d4f", score: 90 };
      return { label: "Last Min", color: "#f39c12", score: 75 };
    }

    if (now > deadline) {
      return { label: "Overdue", color: "#c0392b", score: 20 };
    }

    return { label: "Active", color: "#2b6cb0", score: 85 };
  };

  const getStatusConfig = (status) => {
    const map = {
      Pending: { progress: 20, color: "#a8741a" },
      Blocked: { progress: 20, color: "#a8741a" },
      Planning: { progress: 40, color: "#6a5acd" },
      Processing: { progress: 60, color: "#2b6cb0" },
      "In-Progress": { progress: 60, color: "#2b6cb0" },
      Completed: { progress: 100, color: "#2f7d4f" },
    };
    return map[status] || { progress: 10, color: "#5d4a5b" };
  };

  const stats = useMemo(() => {
    const total = tasks.length || 1;
    let early = 0,
      ontime = 0,
      lastmin = 0,
      overdue = 0,
      late = 0;

    tasks.forEach((t) => {
      const eff = getEfficiency(t);
      if (eff?.label === "Early") early++;
      else if (eff?.label === "On Time") ontime++;
      else if (eff?.label === "Last Min") lastmin++;
      else if (eff?.label === "Late") late++;
      else if (eff?.label === "Overdue") overdue++;
    });

    const completed = tasks.filter((t) => t.status === "Completed").length;
    const active = tasks.filter((t) =>
      ["Processing", "In-Progress", "Pending", "Planning"].includes(t.status),
    ).length;

    const totalScore = tasks.reduce(
      (acc, t) => acc + (getEfficiency(t)?.score || 0),
      0,
    );

    return {
      total: tasks.length,
      completed,
      active,
      overdue,
      late,
      early,
      ontime,
      lastmin,
      perfScore: Math.round(totalScore / total),
    };
  }, [tasks]);

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const isOverdue =
      new Date(t.deadline) < new Date() && t.status !== "Completed";

    if (filter === "completed")
      return matchesSearch && t.status === "Completed";
    if (filter === "active")
      return (
        matchesSearch &&
        ["Processing", "In-Progress", "Pending", "Planning"].includes(t.status)
      );
    if (filter === "overdue") return matchesSearch && isOverdue;
    return matchesSearch;
  });

  if (loading)
    return <div className="audit-loader">Initializing Neural Audit...</div>;

  return (
    <div className="audit-dashboard-wrapper">
      <div className="audit-grid-3">
        {/* LEFT: ANALYSIS & FILTERS */}
        <aside className="audit-col left-analysis glass">
          <div className="section-label-btn">Core Analytics</div>
          <div className="radial-metric-container">
            <svg viewBox="0 0 36 36" className="circular-chart main-gauge">
              <path
                className="circle-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <motion.path
                className="circle"
                strokeDasharray={`${(stats.completed / (stats.total || 1)) * 100}, 100`}
                initial={{ strokeDasharray: "0, 100" }}
                animate={{
                  strokeDasharray: `${(stats.completed / (stats.total || 1)) * 100}, 100`,
                }}
                transition={{ duration: 1.5, type: "spring" }}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20.35" className="percentage">
                {Math.round((stats.completed / (stats.total || 1)) * 100)}%
              </text>
            </svg>
            <div className="metric-status-btn">
              Workload: {stats.active > 5 ? "High" : "Optimal"}
            </div>
          </div>

          <div className="filter-button-group">
            <button
              className={`nav-btn ${filter === "all" && "active"}`}
              onClick={() => setFilter("all")}>
              <div className="btn-content">
                <span>All Records</span>
                <strong>{stats.total}</strong>
              </div>
            </button>
            <button
              className={`nav-btn active-btn ${filter === "active" && "active"}`}
              onClick={() => setFilter("active")}>
              <div className="btn-content">
                <span>Active</span>
                <strong>{stats.active}</strong>
              </div>
            </button>
            <button
              className={`nav-btn success-btn ${filter === "completed" && "active"}`}
              onClick={() => setFilter("completed")}>
              <div className="btn-content">
                <span>Completed</span>
                <strong>{stats.completed}</strong>
              </div>
            </button>
            <button
              className={`nav-btn danger-btn ${filter === "overdue" && "active"}`}
              onClick={() => setFilter("overdue")}>
              <div className="btn-content">
                <span>Overdue</span>
                <strong>{stats.overdue}</strong>
              </div>
            </button>
          </div>
        </aside>

        {/* CENTER: PRIMARY TASK FEED */}
        <main className="audit-col center-feed">
          <div className="search-box glasss">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* NEW: Horizontal Filter Switcher */}
          <div className="task-filter-switch glasss">
            {["all", "active", "completed", "overdue"].map((f) => (
              <button
                key={f}
                className={`switch-item ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            <motion.div
              className="switch-glider"
              layoutId="glider"
              animate={{
                x:
                  filter === "all"
                    ? "0%"
                    : filter === "active"
                      ? "100%"
                      : filter === "completed"
                        ? "200%"
                        : "300%",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>

          <motion.div
            className="audit-scroll-area"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            layout>
            <AnimatePresence mode="popLayout">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((t) => {
                  const eff = getEfficiency(t);
                  const config = getStatusConfig(t.status);
                  const isOverdue =
                    new Date(t.deadline) < new Date() &&
                    t.status !== "Completed";

                  return (
                    <motion.div
                      key={t._id}
                      layout
                      variants={cardVariants}
                      whileHover="hover"
                      className={`task-card-modern glass ${isOverdue ? "border-danger" : ""}`}>
                      <div className="card-top">
                        <div className="card-id-btn">
                          TASK-{t._id.slice(-4).toUpperCase()}
                        </div>
                        <div
                          className="status-pill-btn"
                          style={{ "--accent": eff?.color }}>
                          {eff?.label}
                        </div>
                      </div>
                      <h4 className="task-title-main">{t.title}</h4>
                      <div className="card-mid-btns">
                        <div className="info-btn">
                          <Timer size={12} /> {t.status}
                        </div>
                        <div className="info-btn">
                          <Calendar size={12} />{" "}
                          {new Date(t.deadline).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="card-bottom">
                        <div className="progress-labels">
                          <span className="label">Workflow Progress</span>
                          <span className="value mono-data">
                            {config.progress}%
                          </span>
                        </div>
                        <div className="gauge-container-flat">
                          <motion.div
                            className="gauge-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${config.progress}%` }}
                            style={{
                              backgroundColor: isOverdue
                                ? "#c0392b"
                                : eff?.label === "Late"
                                  ? "#ff7f50"
                                  : config.color,
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="empty-state">No {filter} tasks found.</div>
              )}
            </AnimatePresence>
          </motion.div>
        </main>

        {/* RIGHT: PERFORMANCE TRACKER */}
        <aside className="audit-col right-tracker ">
          <div className="section-label-btn">System Health</div>
          <div className="performance-index-btn">
            <label>Performance Rating</label>
            <div className="big-score-container">
              <motion.span
                className="big-score-val"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}>
                {stats.perfScore}%
              </motion.span>
            </div>
          </div>
          <div className="efficiency-distribution-wrapper">
            <label className="section-mini-label">
              Efficiency Distribution
            </label>
            <div className="multi-progress-bar">
              <div
                style={{
                  width: `${(stats.early / (stats.total || 1)) * 100}%`,
                  background: "#2f7d4f",
                }}
              />
              <div
                style={{
                  width: `${(stats.ontime / (stats.total || 1)) * 100}%`,
                  background: "#2f7d4f",
                }}
              />
              <div
                style={{
                  width: `${(stats.lastmin / (stats.total || 1)) * 100}%`,
                  background: "#f39c12",
                }}
              />
              <div
                style={{
                  width: `${(stats.late / (stats.total || 1)) * 100}%`,
                  background: "#ff7f50",
                }}
              />
              <div
                style={{
                  width: `${(stats.overdue / (stats.total || 1)) * 100}%`,
                  background: "#c0392b",
                }}
              />
            </div>
            <div className="legend-grid-mini">
              <span>
                <i style={{ background: "#2f7d4f" }} /> Early ({stats.early})
              </span>
              <span>
                <i style={{ background: "#2f7d4f" }} /> On Time ({stats.ontime})
              </span>
              <span>
                <i style={{ background: "#f39c12" }} /> Last Min (
                {stats.lastmin})
              </span>
              <span>
                <i style={{ background: "#ff7f50" }} /> Late ({stats.late})
              </span>
              <span>
                <i style={{ background: "#c0392b" }} /> Overdue ({stats.overdue}
                )
              </span>
            </div>
          </div>
          <div className="health-summary-container">
            <label className="section-mini-label">Current Standing</label>
            <div className="summary-button-stack">
              <div
                className={`summary-pill-btn ${stats.overdue === 0 ? "status-ok" : "status-warn"}`}>
                {stats.overdue === 0
                  ? "✓ Deadlines Maintained"
                  : `⚠ ${stats.overdue} Tasks Overdue`}
              </div>
              <div
                className={`summary-pill-btn ${stats.late <= 2 ? "status-ok" : "status-warn"}`}>
                {stats.late === 0
                  ? "✓ Zero Late Submissions"
                  : `${stats.late} Late Completion(s)`}
              </div>
            </div>
          </div>
          <div
            className={`intelligence-pulse-btn ${stats.overdue > 0 ? "pulse-alert" : ""}`}>
            <div className="pulse-indicator"></div>
            <p>
              {stats.overdue > 0
                ? `Critical: ${stats.overdue} unfinished tasks past deadline.`
                : stats.late > 0
                  ? `Note: ${stats.late} tasks were completed after deadline.`
                  : "All systems operating within optimal parameters."}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};


const AttendanceAudit = ({ token, memberId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState(null);

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
  const years = Array.from({ length: 5 }, (_, i) => 2024 + i);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${API_URL}/manager/employee-attendance/${memberId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const sorted = (res.data || []).sort(
          (a, b) => new Date(b.date) - new Date(a.date),
        );
        setLogs(sorted);
      } catch (e) {
        console.error("Audit Fetch Error:", e);
      } finally {
        setLoading(false);
      }
    };
    if (memberId) fetchLogs();
  }, [memberId, token]);

  const stats = useMemo(() => {
    if (!logs.length)
      return {
        score: 0,
        avgHours: 0,
        streak: 0,
        risk: false,
        insight: "Awaiting data...",
        heatmap: [],
        processed: [],
      };

    const todayStr = new Date().toISOString().split("T")[0];
    let lateCount = 0;
    let totalMins = 0;
    let incompleteCount = 0;
    let streak = 0;
    let streakActive = true;
    const latenessByDay = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const processed = logs.map((log) => {
      const checkIn = log.checkInTime ? new Date(log.checkInTime) : null;
      const checkOut = log.checkOutTime ? new Date(log.checkOutTime) : null;
      const isToday = log.date === todayStr;

      const isLate =
        checkIn &&
        (checkIn.getHours() > 9 ||
          (checkIn.getHours() === 9 && checkIn.getMinutes() > 30));
      const isMissingCheckout = !log.checkOutTime && !isToday;

      let mins = 0;
      if (checkIn && checkOut) mins = Math.floor((checkOut - checkIn) / 60000);

      if (isLate) {
        lateCount++;
        latenessByDay[new Date(log.date).getDay()]++;
      }
      if (isMissingCheckout) incompleteCount++;
      totalMins += mins;

      if (streakActive && !isLate && !isMissingCheckout && log.checkInTime)
        streak++;
      else if (log.checkInTime) streakActive = false;

      return {
        ...log,
        isLate,
        isMissingCheckout,
        duration:
          mins > 0 ? `${(mins / 60).toFixed(1)}h` : isToday ? "Active" : "N/A",
        intensity:
          mins > 540
            ? "high"
            : mins > 420
              ? "normal"
              : mins > 0
                ? "low"
                : "none",
      };
    });

    const reliabilityScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          ((logs.length - (lateCount * 0.15 + incompleteCount * 0.4)) /
            (logs.length || 1)) *
            100,
        ),
      ),
    );
    const heatmap = [...processed].slice(0, 7).reverse();
    const worstDayIdx = Object.keys(latenessByDay).reduce((a, b) =>
      latenessByDay[a] > latenessByDay[b] ? a : b,
    );

    let aiInsight =
      "Operational consistency is within high-performance parameters.";
    if (reliabilityScore < 60)
      aiInsight = "Critical: Frequent check-out gaps detected.";
    else if (lateCount > 3)
      aiInsight = `Trend Alert: Habitual tardiness on ${dayNames[worstDayIdx]}s.`;
    else if (streak > 3)
      aiInsight = `Excellent: ${streak}-day punctuality streak active.`;

    return {
      processed,
      lateCount,
      incompleteCount,
      streak,
      score: reliabilityScore,
      heatmap,
      insight: aiInsight,
      risk: reliabilityScore < 75 || incompleteCount > 1,
      avgHours: (
        totalMins /
        60 /
        (logs.filter((l) => l.checkOutTime).length || 1)
      ).toFixed(1),
    };
  }, [logs]);

  const daysInMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0,
  ).getDate();
  const firstDayIdx = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth(),
    1,
  ).getDay();

  const getDayData = (day) => {
    const dStr = `${viewDate.getFullYear()}-${(viewDate.getMonth() + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    return stats.processed.find((l) => l.date === dStr);
  };

  if (loading)
    return (
      <div className="audit-loader">Synchronizing Behavioral Metrics...</div>
    );

  return (
    <div className="audit-dashboard-wrapper">
      <div className="audit-grid-3">
        {/* LEFT: ANALYSIS & CORE METRICS */}
        <aside className="audit-col left-analysis">
          <div className="section-label-btn">Reliability Index</div>
          <div className="radial-metric-container">
            <svg viewBox="0 0 36 36" className="circular-chart main-gauge">
              <path
                className="circle-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <motion.path
                className="circle"
                stroke={
                  stats.score > 85
                    ? "#2f7d4f"
                    : stats.score > 70
                      ? "#a8741a"
                      : "#c0392b"
                }
                strokeDasharray={`${stats.score}, 100`}
                initial={{ strokeDasharray: "0, 100" }}
                animate={{ strokeDasharray: `${stats.score}, 100` }}
                transition={{ duration: 1.5, type: "spring" }}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20.35" className="percentage">
                {stats.score}%
              </text>
            </svg>
            <div
              className={`metric-status-btn ${stats.risk ? "risk" : "optimal"}`}>
              {stats.risk ? "Action Required" : "Optimal"}
            </div>
          </div>

          <div className="stats-vertical-stack">
            <div className="mini-stat-card">
              <span>Punctuality Streak</span>
              <strong>{stats.streak} Days</strong>
            </div>
            <div className="mini-stat-card">
              <span>Avg Daily Hours</span>
              <strong>{stats.avgHours}h</strong>
            </div>
          </div>

          <div className="heatmap-container">
            <label className="section-mini-label">7D Intensity</label>
            <div className="heatmap-grid">
              {stats.heatmap.map((day, idx) => (
                <div
                  key={idx}
                  className={`heat-cell ${day.intensity}`}
                  title={`${day.date}: ${day.duration}`}>
                  <span>
                    {new Date(day.date).toLocaleDateString(undefined, {
                      weekday: "narrow",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* CENTER: INTERACTIVE CALENDAR FEED */}
        <main className="audit-col center-feed">
          <div className="cal-header-top">
            <div className="header-title">
              <Activity size={16} className="pulse-icon" />
              <span>Attendance Intelligence</span>
            </div>

            <div className="cal-nav-controls">
              <button
                className="nav-arrow"
                onClick={() =>
                  setViewDate(
                    new Date(viewDate.setMonth(viewDate.getMonth() - 1)),
                  )
                }>
                <ChevronLeft size={24} />
              </button>
              <div className="nav-date-display">
                <span className="month-name">
                  {months[viewDate.getMonth()]}
                </span>
                <select
                  value={viewDate.getFullYear()}
                  onChange={(e) =>
                    setViewDate(
                      new Date(e.target.value, viewDate.getMonth(), 1),
                    )
                  }>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="nav-arrow"
                disabled={viewDate >= new Date()}
                onClick={() =>
                  setViewDate(
                    new Date(viewDate.setMonth(viewDate.getMonth() + 1)),
                  )
                }>
                <ChevronRight size={24} />
              </button>
            </div>
          </div>

          <div className="calendar-grid-container">
            <div className="tiny-cal-grid">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={`h-${i}`} className="cal-weekday">
                  {d}
                </div>
              ))}
              {Array(firstDayIdx)
                .fill(null)
                .map((_, i) => (
                  <div key={`e-${i}`} className="empty-cell" />
                ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                (day) => {
                  const d = getDayData(day);
                  const isPast =
                    new Date(viewDate.getFullYear(), viewDate.getMonth(), day) <
                    new Date();
                  return (
                    <div
                      key={day}
                      className={`cal-date-cell ${d ? "has-data" : ""}`}
                      onMouseEnter={() => d && setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}>
                      <span className="date-num">{day}</span>
                      <div className="status-indicator">
                        {d ? (
                          <span className={d.isLate ? "status-l" : "status-p"}>
                            {d.isLate ? "L" : "P"}
                          </span>
                        ) : (
                          isPast && <span className="status-a">A</span>
                        )}
                      </div>
                      <AnimatePresence>
                        {hoveredDay === day && d && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="cal-hover-card">
                            <strong>{d.duration}</strong>
                            <small>
                              {d.checkInTime
                                ? new Date(d.checkInTime).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" },
                                  )
                                : "--"}
                            </small>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </main>

        {/* RIGHT: SYSTEM HEALTH & RISK */}
        <aside className="audit-col right-tracker">
          <div className="section-label-btn">Pattern Analysis</div>

          <div
            className={`risk-card-modern ${stats.risk ? "high-risk" : "low-risk"}`}>
            <div className="risk-content">
              {stats.risk ? (
                <ShieldAlert size={20} />
              ) : (
                <ShieldCheck size={20} />
              )}
              <div className="risk-text">
                <strong>
                  {stats.risk ? "Elevated Risk" : "Stable Pattern"}
                </strong>
                <p>
                  {stats.risk
                    ? "Inconsistencies found"
                    : "Consistent behaviors"}
                </p>
              </div>
            </div>
          </div>

          <div className="insight-box">
            <div className="ai-tag">
              <Sparkles size={10} /> AI Diagnostic
            </div>
            <div className="ai-quote">"{stats.insight}"</div>
          </div>

          <div className="stats-vertical-stack">
            <div className="mini-stat-card">
              <span>Late Entries</span>
              <strong className="val-late">{stats.lateCount} Days</strong>
            </div>
            <div className="mini-stat-card">
              <span>Check-out Gaps</span>
              <strong className="val-gap">{stats.incompleteCount} Days</strong>
            </div>
          </div>

          <div className="integrity-pulse">
            <div className="pulse-dot"></div>
            <span>
              {stats.score > 90 ? "Integrity: Peak" : "Integrity: Tracking"}
            </span>
          </div>
        </aside>
      </div>

      <style>{`
        .audit-dashboard-wrapper { color: var(--ink-2); height: 100%; padding: 10px; }
        .audit-grid-3 { display: grid; grid-template-columns: 240px 1fr 240px; gap: 15px; height: 100%; align-items: start; }
        
        .glass-panel { 
          background: rgba(15, 23, 42, 0.6); 
          border: 1px solid rgba(74, 31, 69, 0.12); 
          border-radius: 16px; 
          padding: 20px; 
          backdrop-filter: blur(10px);
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .section-mini-label { 
          font-size: 0.65rem; 
          text-transform: uppercase; 
          letter-spacing: 1px; 
          color: #6a5acd; 
          font-weight: 700; 
          margin-bottom: 15px; 
        }

        /* Metrics & Gauge */
        .circular-chart { width: 90px; height: 90px; }
        .circle-bg { fill: none; stroke: rgba(74, 31, 69, 0.14); stroke-width: 2.5; }
        .circle { fill: none; stroke-width: 2.5; stroke-linecap: round; }
        .percentage { fill: white; font-size: 0.5rem; text-anchor: middle; font-weight: 800; }
        
        .metric-status-btn.optimal { background: rgba(46, 204, 113, 0.15); color: #2f7d4f; }
        .metric-status-btn.risk { background: rgba(255, 71, 87, 0.15); color: #c0392b; border:1px solid #c0392b }

        .stats-vertical-stack { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
        .mini-stat-card { background: rgba(74, 31, 69, 0.03); padding: 12px; border-radius: 12px; border: 1px solid rgba(74, 31, 69, 0.12); }
        .mini-stat-card span { display: block; font-size: 0.6rem; opacity: 0.6; margin-bottom: 4px; }
        .mini-stat-card strong { font-size: 1rem; color: var(--ink); }

        /* Calendar Styling */
        .cal-header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid rgba(74, 31, 69, 0.12); }
        .header-title { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 0.85rem; color: var(--ink); }
        .pulse-icon { color: #6a5acd; animation: pulse 2s infinite; }
        
        .cal-nav-controls { display: flex; align-items: center; gap: 12px; }
        .nav-arrow { background: rgba(74, 31, 69, 0.05); border: none; color: var(--ink); width: 28px; height: 28px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .nav-date-display { display: flex; align-items: center; gap: 8px; }
        .month-name { font-size: 1rem; font-weight: 800; color: #6a5acd; }
        .nav-date-display select { background: transparent; border: none; color: var(--ink); font-size: 0.8rem; font-weight: 700; outline: none; cursor: pointer; }
        select,option{color:black;}
        .calendar-grid-container { flex: 1; display: flex; align-items: center; }
        .tiny-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; width: 100%; }
        .cal-weekday { font-size: 0.65rem; font-weight: 800; color: rgba(42, 21, 48, 0.6); text-align: center; padding-bottom: 5px; }
        .cal-date-cell { aspect-ratio: 1/1; background: rgba(74, 31, 69, 0.02); border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; border: 1px solid transparent; transition: all 0.2s; }
        .cal-date-cell.has-data { background: rgba(162, 155, 254, 0.05); border-color: rgba(162, 155, 254, 0.1); }
        .cal-date-cell:hover { background: rgba(162, 155, 254, 0.15); transform: translateY(-2px); }
        .date-num { position: absolute; top: 5px; left: 6px; font-size: 0.6rem; font-weight: 700; opacity: 0.4; }
        .status-indicator { font-weight: 900; font-size: 1rem; }
        .status-p { color: #2f7d4f; text-shadow: 0 0 10px rgba(46, 204, 113, 0.3); }
        .status-l { color: #a8741a; text-shadow: 0 0 10px rgba(241, 196, 15, 0.3); }
        .status-a { color: #c0392b; opacity: 0.5; }

        /* Tooltip */
        .cal-hover-card { position: absolute; bottom: 110%; left: 50%; transform: translateX(-50%); background: #fbf9f6; padding: 8px 12px; border-radius: 8px; border: 1px solid #6a5acd; z-index: 50; box-shadow: 0 10px 25px rgba(0,0,0,0.4); white-space: nowrap; text-align: center; }
        .cal-hover-card strong { display: block; font-size: 0.8rem; color: var(--ink); }
        .cal-hover-card small { font-size: 0.65rem; color: #6a5acd; }

        /* Right Side Analysis */
        .risk-card-modern { padding: 15px; border-radius: 12px; margin-bottom: 10px; margin-top:10px;}
        .low-risk { background: rgba(46, 204, 113, 0.1); border: 1px solid rgba(46, 204, 113, 0.2); color: #2f7d4f; }
        .high-risk { background: rgba(255, 71, 87, 0.1); border: 1px solid rgba(255, 71, 87, 0.2); color: #c0392b; }
        .risk-content { display: flex; gap: 12px; align-items: flex-start; }
        .risk-text strong { display: block; font-size: 0.8rem; margin-bottom: 2px; }
        .risk-text p { font-size: 0.65rem; color: rgba(42, 21, 48, 0.7); margin: 0; }

        .insight-box { background: rgba(162, 155, 254, 0.05); padding: 15px; border-radius: 12px; border-left: 3px solid #6a5acd; margin-bottom: 20px; }
        .ai-tag { font-size: 0.6rem; color: #6a5acd; font-weight: 800; display: flex; align-items: center; gap: 4px; margin-bottom: 8px; }
        .ai-quote { font-size: 0.75rem; font-style: italic; color: #5d4a5b; line-height: 1.5; }

        .quick-stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: auto; }
        .quick-stats-row{ display:flex; flex-direction:column; font-size: 0.75rem; font-style: italic; color: #5d4a5b; line-height: 1.5;}
        .q-item { background: rgba(74, 31, 69, 0.03); padding: 10px; border-radius: 10px; text-align: center; }
        .q-item small { display: block; font-size: 0.55rem; opacity: 0.5; margin-bottom: 5px; }
        .q-item span { font-weight: 800; font-size: 1.1rem; }
        .val-late { color: #a8741a; }
        .val-gap { color: #c0392b; }

        .integrity-pulse { display: flex; align-items: center; gap: 8px; padding-top: 20px; font-size: 0.65rem; font-weight: 700; opacity: 0.8; }
        .pulse-dot { width: 6px; height: 6px; background: #2f7d4f; border-radius: 50%; box-shadow: 0 0 8px #2f7d4f; }

        .heatmap-grid { display: flex; gap: 4px; }
        .heat-cell { flex: 1; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 0.55rem; font-weight: 800; color: rgba(42, 21, 48, 0.5); }
        .heat-cell.high { background: #2f7d4f; color: var(--ink); }
        .heat-cell.normal { background: rgba(46, 204, 113, 0.4); }
        .heat-cell.low { background: rgba(46, 204, 113, 0.15); }
        .heat-cell.none { background: rgba(74, 31, 69, 0.05); }

        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
      `}</style>
    </div>
  );
};

const EODAudit = ({ token, memberId }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionFilter, setSessionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(""); // New state for date picker

  const detectWorkType = (report = {}) => {
    const isBlocked =
      report.status === "Blocked" ||
      (report.blockers && report.blockers.trim().length > 0);
    if (isBlocked) {
      return {
        label: "Blocked",
        icon: <AlertCircle size={12} />,
        color: "#c0392b",
        bg: "rgba(255, 71, 87, 0.15)",
      };
    }

    const lowText = (report.summary || "").toLowerCase();

    if (
      lowText.includes("fix") ||
      lowText.includes("bug") ||
      lowText.includes("issue") ||
      lowText.includes("debug") ||
      lowText.includes("patch")
    )
      return {
        label: "Debug",
        icon: <Wrench size={12} />,
        color: "#c0392b",
        bg: "rgba(255, 71, 87, 0.1)",
      };

    if (
      lowText.includes("feat") ||
      lowText.includes("build") ||
      lowText.includes("implement") ||
      lowText.includes("develop") ||
      lowText.includes("coding")
    )
      return {
        label: "Development",
        icon: <Cpu size={12} />,
        color: "#2f7d4f",
        bg: "rgba(46, 204, 113, 0.1)",
      };

    if (
      lowText.includes("ui") ||
      lowText.includes("ux") ||
      lowText.includes("design") ||
      lowText.includes("css") ||
      lowText.includes("layout") ||
      lowText.includes("styling")
    )
      return {
        label: "Design",
        icon: <Palette size={12} />,
        color: "#ff9f43",
        bg: "rgba(255, 159, 67, 0.1)",
      };

    if (
      lowText.includes("meet") ||
      lowText.includes("call") ||
      lowText.includes("discuss") ||
      lowText.includes("sync") ||
      lowText.includes("standup")
    )
      return {
        label: "Sync",
        icon: <Users size={12} />,
        color: "#a8741a",
        bg: "rgba(241, 196, 15, 0.1)",
      };

    if (
      lowText.includes("research") ||
      lowText.includes("learn") ||
      lowText.includes("study") ||
      lowText.includes("plan") ||
      lowText.includes("doc")
    )
      return {
        label: "Docs/Research",
        icon: <BookOpen size={12} />,
        color: "#00d2d3",
        bg: "rgba(0, 210, 211, 0.1)",
      };

    return {
      label: "General",
      icon: <FileText size={12} />,
      color: "#6a5acd",
      bg: "rgba(162, 155, 254, 0.1)",
    };
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/manager/employee-eods/${memberId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setReports(res.data || []);
      } catch (e) {
        console.error("EOD Fetch Error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [memberId, token]);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesSearch = r.summary
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesSession =
        sessionFilter === "all" || r.session === sessionFilter;
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;

      // Date filtering logic
      let matchesDate = true;
      if (selectedDate) {
        const reportDate = new Date(r.createdAt || r.date)
          .toISOString()
          .split("T")[0];
        matchesDate = reportDate === selectedDate;
      }

      return matchesSearch && matchesSession && matchesStatus && matchesDate;
    });
  }, [reports, sessionFilter, statusFilter, searchQuery, selectedDate]);

  const insights = useMemo(() => {
    const categories = {
      Development: 0,
      Debug: 0,
      Blocked: 0,
      Design: 0,
      Sync: 0,
      "Docs/Research": 0,
      General: 0,
    };
    if (!filteredReports.length)
      return { score: 0, blockers: 0, categories, suggestions: [] };

    let totalDetailScore = 0;
    let blockersCount = 0;

    filteredReports.forEach((r) => {
      totalDetailScore += Math.min(100, (r.summary?.length || 0) / 5);
      const type = detectWorkType(r);
      categories[type.label]++;
      if (type.label === "Blocked") blockersCount++;
    });

    const avgDetail = totalDetailScore / filteredReports.length;
    const suggestions = [];

    if (blockersCount > filteredReports.length * 0.3)
      suggestions.push({
        text: "High friction in this view. Check blockers.",
        type: "error",
      });
    if (categories.Debug > categories.Development)
      suggestions.push({
        text: "Heavy focus on stabilization over new features.",
        type: "warn",
      });
    if (avgDetail < 40)
      suggestions.push({
        text: "Brief reporting detected. Request more detail.",
        type: "warn",
      });

    return {
      score: Math.round(avgDetail),
      blockers: blockersCount,
      categories,
      suggestions: suggestions.length
        ? suggestions
        : [{ text: "Consistent reporting in current view.", type: "neutral" }],
    };
  }, [filteredReports]);

  if (loading)
    return (
      <div className="audit-loader">Decoding Productivity Patterns...</div>
    );

  return (
    <div className="audit-dashboard-wrapper">
      <div className="audit-grid-3">
        {/* LEFT COLUMN: Analytics */}
        <div className="audit-col left-analysis glass">
          <div className="section-label-btn">Active Analysis</div>
          <div className="score-displayy">
            <h2 style={{ color: insights.score > 70 ? "#2f7d4f" : "#a8741a" }}>
              {insights.score}%
            </h2>
            <p>Filtered Detail Index</p>
          </div>

          <div className="work-distribution">
            <label className="mini-label">
              Work Distribution (Current View)
            </label>
            <div className="distribution-scroll-area">
              {Object.entries(insights.categories).map(
                ([key, val]) =>
                  val > 0 && (
                    <div key={key} className="dist-row">
                      <span>{key}</span>
                      <div className="dist-track">
                        <div
                          className="dist-bar"
                          style={{
                            width: `${(val / (filteredReports.length || 1)) * 100}%`,
                            background: detectWorkType(
                              key === "Blocked"
                                ? { status: "Blocked" }
                                : { summary: key },
                            ).color,
                          }}
                        />
                      </div>
                      <small>{val}</small>
                    </div>
                  ),
              )}
            </div>
          </div>

          <div className="ai-suggestions-box">
            <div className="ai-head">
              <Sparkles size={14} /> Intelligence Feedback
            </div>
            {insights.suggestions.map((s, i) => (
              <div key={i} className={`suggestion-item ${s.type}`}>
                {s.text}
              </div>
            ))}
          </div>
        </div>

        {/* CENTER COLUMN: Feed */}
        <main className="audit-col center-feed">
          <div
            className="search-row-container"
            style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <div
              className="search-box glass"
              style={{ flex: 1, marginBottom: "0" }}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search in logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div
              className="date-picker-box glass"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0 10px",
                borderRadius: "8px",
                background: "rgba(74, 31, 69, 0.05)",
              }}>
              <Calendar
                size={14}
                style={{ marginRight: "8px", opacity: 0.6 }}
              />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--ink)",
                  fontSize: "0.75rem",
                  outline: "none",
                  cursor: "pointer",
                }}
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate("")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "rgba(42, 21, 48, 0.4)",
                    marginLeft: "5px",
                    cursor: "pointer",
                  }}>
                  ×
                </button>
              )}
            </div>
          </div>

          <div
            className="task-filter-switch glasss"
            style={{ marginBottom: "10px" }}>
            {["all", "Session 1", "Session 2"].map((s) => (
              <button
                key={s}
                className={`switch-item ${sessionFilter === s ? "active" : ""}`}
                onClick={() => setSessionFilter(s)}>
                {s}
              </button>
            ))}
          </div>

          <div
            className="status-chip-group"
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "15px",
              overflowX: "auto",
              paddingBottom: "5px",
            }}>
            {["all", "In-Progress", "Completed", "Blocked"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "0.7rem",
                  whiteSpace: "nowrap",
                  border: "1px solid rgba(74, 31, 69, 0.12)",
                  background:
                    statusFilter === status ? "#2b6cb0" : "transparent",
                  color:
                    statusFilter === status ? "#fff" : "rgba(42, 21, 48, 0.7)",
                  cursor: "pointer",
                  transition: "0.2s",
                }}>
                {status}
              </button>
            ))}
          </div>

          <div className="audit-scroll-area">
            {filteredReports.length > 0 ? (
              filteredReports.map((r, i) => {
                const type = detectWorkType(r);
                const isBlocked = type.label === "Blocked";
                return (
                  <div
                    key={i}
                    className={`eod-card glass ${isBlocked ? "blocked-border" : ""}`}>
                    <div className="eod-card-header">
                      <span
                        className="type-tag"
                        style={{ background: type.bg, color: type.color }}>
                        {type.icon} {type.label}
                      </span>
                      <span className="eod-date">
                        {new Date(r.createdAt || r.date).toLocaleDateString(
                          undefined,
                          { weekday: "short", month: "short", day: "numeric" },
                        )}
                      </span>
                    </div>
                    <div
                      className="eod-content"
                      style={{ fontSize: "0.85rem" }}>
                      {r.summary}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginTop: "10px",
                      }}>
                      <div
                        className="card-id-btn"
                        style={{ fontSize: "0.65rem", padding: "2px 8px" }}>
                        {r.session}
                      </div>
                      <div
                        className="card-id-btn"
                        style={{
                          fontSize: "0.65rem",
                          padding: "2px 8px",
                          color: isBlocked ? "#c0392b" : "#2b6cb0",
                        }}>
                        {r.status}
                      </div>
                    </div>

                    {isBlocked && (
                      <div
                        className="blocker-zone"
                        style={{
                          marginTop: "10px",
                          border: "1px solid rgba(255,71,87,0.2)",
                        }}>
                        <AlertCircle size={14} color="#c0392b" /> &nbsp;
                        <strong>Blocker:</strong>{" "}
                        {r.blockers || "Employee flagged as Blocked"}
                      </div>
                    )}

                    <div className="eod-actions">
                      <button className="action-btn-mini">
                        <CheckCircle size={12} /> Acknowledge
                      </button>
                      <button className="action-btn-mini">
                        <MessageSquare size={12} /> Review
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">No matching EOD logs found.</div>
            )}
          </div>
        </main>

        {/* RIGHT COLUMN: Resource Health */}
        <div className="audit-col right-tracker glass">
          <div className="section-label-btnn">Resource Health</div>
          <div className="health-stat">
            <div
              className="stat-icon-circle"
              style={{
                background: "rgba(255, 71, 87, 0.1)",
                color: "#c0392b",
              }}>
              <ShieldAlert size={20} />
            </div>
            <div className="stat-info">
              <strong>{insights.blockers} Blockers</strong>
              <p>In current selection</p>
            </div>
          </div>

          <div className="health-stat">
            <div
              className="stat-icon-circle"
              style={{
                background: "rgba(46, 204, 113, 0.1)",
                color: "#2f7d4f",
              }}>
              <TrendingUp size={20} />
            </div>
            <div className="stat-info">
              <strong>{filteredReports.length} Reports</strong>
              <p>In current view</p>
            </div>
          </div>

          <div className="burn-graph" style={{ marginTop: "20px" }}>
            <div className="summary-button-stack">
              <label className="mini-label">Session Context</label>
              <p
                style={{
                  fontSize: "0.75rem",
                  opacity: 0.6,
                  marginTop: "5px",
                  lineHeight: "1.4",
                }}>
                Primary Activity:{" "}
                <strong>{filteredReports[0]?.session || sessionFilter}</strong>.{" "}
                <br />
                Filtering status: <strong>{statusFilter}</strong>
                {searchQuery && (
                  <>
                    {" "}
                    matching <strong>"{searchQuery}"</strong>
                  </>
                )}
                {selectedDate && (
                  <>
                    {" "}
                    on <strong>{selectedDate}</strong>
                  </>
                )}
                . <br />
                Reporting granularity: <strong>{insights.score}%</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
      <style>{`
          .blocked-border { border-left: 4px solid #c0392b !important; background: rgba(255, 71, 87, 0.02) !important; }
          .status-chip-group button:hover { background: rgba(74, 31, 69, 0.1); }
          .status-chip-group::-webkit-scrollbar { display: none; }

          /* Date Picker Styling */
          input[type="date"]::-webkit-calendar-picker-indicator {
            filter: invert(1);
            opacity: 0.5;
            cursor: pointer;
          }
          
          .distribution-scroll-area {
            max-height: 160px;
            overflow-y: auto;
            padding-right: 8px;
            margin-top: 10px;
          }

          .distribution-scroll-area::-webkit-scrollbar {
            width: 4px;
          }
          .distribution-scroll-area::-webkit-scrollbar-track {
            background: rgba(74, 31, 69, 0.05);
            border-radius: 10px;
          }
          .distribution-scroll-area::-webkit-scrollbar-thumb {
            background: rgba(74, 31, 69, 0.2);
            border-radius: 10px;
          }
          .distribution-scroll-area::-webkit-scrollbar-thumb:hover {
            background: rgba(74, 31, 69, 0.3);
          }
      `}</style>
    </div>
  );
};



/* ---------------- ANALYTICS TAB (HIGH-INTELLIGENCE) ---------------- */
function AnalyticsTab({ token }) {
  const [analytics, setAnalytics] = useState({
    rawLeads: [],
    rawEmployees: [],
    companyStats: { completed: 0, pending: 0 },
    loading: true
  });

  useEffect(() => {
    const fetchGlobalIntelligence = async () => {
      try {
        // Fetching all dimensions of the department
        const [leadsRes, empsRes, statsRes] = await Promise.all([
          axios.get(`${API_URL}/manager/leads-summary`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/manager/all-employees`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/manager/company-performance`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        setAnalytics({
          rawLeads: leadsRes.data || [],
          rawEmployees: empsRes.data || [],
          companyStats: statsRes.data || { completed: 0, pending: 0 },
          loading: false
        });
      } catch (err) {
        console.error("Analytics Engine Error:", err);
      }
    };
    fetchGlobalIntelligence();
  }, [token]);

  // --- Derived Intelligence ---
  const derivedMetrics = useMemo(() => {
    const { rawLeads, rawEmployees, companyStats } = analytics;
    if (analytics.loading) return null;

    const totalTasks = companyStats.completed + companyStats.pending;
    const deliveryRate = totalTasks > 0 ? Math.round((companyStats.completed / totalTasks) * 100) : 0;
    
    // Calculate Dept-wide average hours
    const avgDeptHours = rawEmployees.length > 0 
      ? (rawEmployees.reduce((acc, curr) => acc + (curr.totalHours || 0), 0) / rawEmployees.length).toFixed(1)
      : 0;

    return {
      deliveryRate,
      avgDeptHours,
      leadPerformance: rawLeads.map(l => ({ name: l.name, value: l.employeeCount })),
      workloadDistribution: [companyStats.completed, companyStats.pending]
    };
  }, [analytics]);

  if (analytics.loading) return <div className="page-content">Initializing Analytics Engine...</div>;

  const radarData = {
    labels: ['Velocity', 'Attendance', 'Task Load', 'Punctuality', 'Stability', 'Throughput'],
    datasets: [{
      label: 'Departmental Health',
      data: [derivedMetrics.deliveryRate, 85, 70, 92, 88, 80], // Real + Mock for radar complexity
      backgroundColor: 'rgba(92, 34, 82, 0.2)',
      borderColor: '#5c2252',
      borderWidth: 2,
      pointBackgroundColor: '#5c2252',
    }]
  };

  return (
    <section className="page-content" style={{ animation: "fadeIn 0.5s ease" }}>
      {/* 1. TOP TIER: MACRO METRICS */}
      <div className="analytics-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '25px' }}>
        <StatCard title="DELIVERY INDEX" value={`${derivedMetrics.deliveryRate}%`} color="var(--accent)" />
        <StatCard title="AVG NODE HOURS" value={derivedMetrics.avgDeptHours} color="var(--success)" />
        <StatCard title="TOTAL BACKLOG" value={analytics.companyStats.pending} color="var(--warning)" />
        <StatCard title="ACTIVE LEADS" value={analytics.rawLeads.length} color="#a188ff" />
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '25px' }}>
        
        {/* LEFT: HEALTH MATRIX */}
        <div className="glass card" style={{ padding: '25px' , display:"flex",flexDirection:"column", alignItems:"center"}}>
          <h3 className="mini-label" style={{ alignSelf:"flex-start" }}>System Stability Radar</h3>
          <div style={{ height: '300px', marginTop: '20px' }}>
            <Radar data={radarData} options={radarOptions} />
          </div>
        </div>

        {/* RIGHT: OPERATIONAL EFFICIENCY */}
        <div className="glass card" style={{ padding: '25px' }}>
          <h3 className="mini-label">Node Distribution & Throughput</h3>
          <div className="node-stats-container" style={{ marginTop: '20px' }}>
             {analytics.rawLeads.map(lead => (
               <div key={lead._id} style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px' }}>
                    <span>{lead.name} (Lead)</span>
                    <span>{lead.employeeCount} Nodes Managed</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(74, 31, 69, 0.05)', borderRadius: '3px' }}>
                    <div style={{ 
                      width: `${(lead.employeeCount / analytics.rawEmployees.length) * 100}%`, 
                      height: '100%', 
                      background: 'var(--accent)', 
                      borderRadius: '3px',
                      boxShadow: '0 0 10px var(--accent-soft)'
                    }}></div>
                  </div>
               </div>
             ))}
          </div>
          
          <div style={{ marginTop: '30px', padding: '15px', background: 'rgba(74, 31, 69, 0.02)', borderRadius: '10px' }}>
             <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}>Intelligence Suggestion:</h4>
             <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.6, lineHeight: '1.4' }}>
               {analytics.companyStats.pending > 10 
                 ? "High bottleneck detected in pipeline. Consider redistributing tasks from overloaded Leads to Available nodes." 
                 : "Department throughput is optimal. System is ready for higher task injection."}
             </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// --- Helper Components & Options ---
function StatCard({ title, value, color }) {
  return (
    <div className="glass card" style={{ padding: '20px', borderLeft: `3px solid ${color}` }}>
      <span className="mini-label" style={{ fontSize: '9px', opacity: 0.7 }}>{title}</span>
      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: '5px', color: color }}>{value}</div>
    </div>
  );
}

const radarOptions = {
  scales: {
    r: {
      grid: { color: 'rgba(42, 21, 48, 0.14)' },
      angleLines: { color: 'rgba(42, 21, 48, 0.05)' },
      pointLabels: { color: 'rgba(42, 21, 48, 0.75)', font: { size: 10 } },
      ticks: { display: false, max: 100, min: 0 }
    }
  },
  plugins: { legend: { display: false } }
};


function ManagerTaskAssigner({ token, showToast }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtering States
  const [searchTerm, setSearchTerm] = useState("");
  const [loadFilter, setLoadFilter] = useState("All");

  const [modal, setModal] = useState({
    show: false,
    empId: "",
    empName: "",
    title: "",
    deadline: "",
  });

  const fetchLeads = async () => {
    try {
      const res = await axios.get(`${API_URL}/manager/my-leads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeads(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [token]);

  // Combined Filtering Logic
  const filteredLeads = leads.filter((l) => {
    const activeTasks =
      l.performance?.assignedTasks?.filter((t) => t.status !== "Completed")
        .length || 0;
    const matchesSearch = l.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    let matchesLoad = true;
    if (loadFilter === "Ready") matchesLoad = activeTasks === 0;
    if (loadFilter === "Busy") matchesLoad = activeTasks > 0 && activeTasks < 4;
    if (loadFilter === "Overloaded") matchesLoad = activeTasks >= 4;

    return matchesSearch && matchesLoad;
  });

  const deployTask = async () => {
    if (!modal.title || !modal.deadline)
      return showToast("Fields required", "error");
    try {
      await axios.post(
        `${API_URL}/manager/assign-task-to-lead`,
        {
          leadId: modal.empId,
          title: modal.title,
          deadline: modal.deadline,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      showToast("Protocol Successful: Task Deployed", "success");
      setModal({
        show: false,
        empId: "",
        empName: "",
        title: "",
        deadline: "",
      });
      fetchLeads(); // Refresh list to update load bars
    } catch (e) {
      showToast("Deployment failed", "error");
    }
  };

  return (
    <section className="page-content" style={{ animation: "fadeIn 0.5s ease" }}>
      <div
        className="intelligence-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          gap: "20px",
        }}>
        {/* Left Col: Target Selection (Leads) */}
        <div
          className="col left glass"
          style={{ display: "flex", flexDirection: "column" }}>
          <div
            className="section-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "15px",
            }}>
            <span
              className="mini-label"
              style={{ color: "var(--accent)", margin: 0 }}>
              DEPT LEAD DIRECTORY
            </span>
            <span style={{ opacity: 0.5, fontSize: "0.7rem" }}>
              {filteredLeads.length} NODES ACTIVE
            </span>
          </div>

          {/* --- FILTER INTERFACE --- */}
          <div
            className="filter-bar"
            style={{
              padding: "12px 15px",
              background: "rgba(74, 31, 69, 0.02)",
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "10px",
            }}>
            <input
              className="glass-input"
              placeholder="Search Lead Name..."
              style={{ fontSize: "0.75rem" }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="custom-select"
              style={{ fontSize: "0.7rem" }}
              value={loadFilter}
              onChange={(e) => setLoadFilter(e.target.value)}>
              <option value="All">Any Load</option>
              <option value="Ready">Ready (0)</option>
              <option value="Busy">Busy (1-3)</option>
              <option value="Overloaded">Overloaded (4+)</option>
            </select>
          </div>

          <div
            className="feed-scroll"
            style={{
              maxHeight: "65vh",
              overflowY: "auto",
              padding: "15px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "15px",
            }}>
            {filteredLeads.length === 0 ? (
              <div
                style={{
                  gridColumn: "1/-1",
                  textAlign: "center",
                  opacity: 0.3,
                  padding: "60px",
                }}>
                <ShieldAlert size={40} style={{ marginBottom: "15px" }} />
                <p>No department leads found matching these parameters.</p>
              </div>
            ) : (
              filteredLeads.map((l) => {
                const activeTasks =
                  l.performance?.assignedTasks?.filter(
                    (t) => t.status !== "Completed",
                  ).length || 0;
                const isSelected = modal.empId === l._id;

                return (
                  <div
                    key={l._id}
                    className={`glass card ${isSelected ? "active-border" : ""}`}
                    style={{
                      cursor: "pointer",
                      padding: "15px",
                      transition: "all 0.3s ease",
                      borderLeft: isSelected
                        ? `4px solid var(--accent)`
                        : `4px solid rgba(74, 31, 69, 0.1)`,
                    }}
                    onClick={() =>
                      setModal({
                        ...modal,
                        show: true,
                        empId: l._id,
                        empName: l.name,
                      })
                    }>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "center",
                        }}>
                        <div
                          className="stat-icon-circle"
                          style={{
                            background: isSelected
                              ? "var(--accent)"
                              : "var(--accent-soft)",
                            color: isSelected ? "#000" : "var(--accent)",
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            fontSize: "0.8rem",
                            fontWeight: "bold",
                          }}>
                          {l.name.charAt(0)}
                        </div>
                        <div>
                          <strong
                            style={{ display: "block", fontSize: "0.9rem" }}>
                            {l.name}
                          </strong>
                          <small style={{ fontSize: "0.7rem", opacity: 0.6 }}>
                            {l.department} Lead
                          </small>
                        </div>
                      </div>
                      <ArrowRight
                        size={14}
                        style={{
                          opacity: isSelected ? 1 : 0.2,
                          color: isSelected ? "var(--accent)" : "#fff",
                        }}
                      />
                    </div>

                    <div style={{ marginTop: "15px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "5px",
                        }}>
                        <span
                          className="mini-label"
                          style={{ fontSize: "9px" }}>
                          Current Load
                        </span>
                        <span style={{ fontSize: "10px", fontWeight: "bold" }}>
                          {activeTasks} Tasks
                        </span>
                      </div>
                      <div
                        style={{
                          height: "4px",
                          background: "rgba(74, 31, 69, 0.05)",
                          borderRadius: "2px",
                          overflow: "hidden",
                        }}>
                        <div
                          style={{
                            width: `${Math.min(activeTasks * 25, 100)}%`,
                            height: "100%",
                            background:
                              activeTasks >= 4
                                ? "var(--danger)"
                                : activeTasks > 2
                                  ? "var(--warning)"
                                  : "var(--success)",
                            transition: "width 0.5s ease",
                          }}></div>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: "12px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}>
                      <span
                        style={{
                          fontSize: "0.65rem",
                          opacity: 0.5,
                          textTransform: "uppercase",
                        }}>
                        {l.role}
                      </span>
                      {activeTasks === 0 && (
                        <span
                          style={{
                            fontSize: "9px",
                            color: "var(--success)",
                            fontWeight: "bold",
                          }}>
                          READY FOR DISPATCH
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Dispatcher Panel */}
        <div className="col right glass" style={{ padding: "20px" }}>
          <div className="section-header" style={{ marginBottom: "20px" }}>
            <span className="mini-label">TASK DISPATCHER</span>
          </div>

          {modal.show ? (
            <div style={{ animation: "slideIn 0.3s ease" }}>
              <div
                className="ai-insight-box"
                style={{
                  background: "rgba(92, 34, 82, 0.03)",
                  border: "1px solid var(--accent-soft)",
                  borderRadius: "12px",
                  padding: "20px",
                }}>
                <div
                  className="ai-head"
                  style={{
                    color: "var(--accent)",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}>
                  <Sparkles size={16} />
                  <span style={{ fontWeight: "bold", letterSpacing: "0.5px" }}>
                    TARGET: {modal.empName.toUpperCase()}
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: "15px" }}>
                  <label className="mini-label">
                    <Target size={10} style={{ marginRight: "5px" }} /> MISSION
                    OBJECTIVE
                  </label>
                  <input
                    className="glass-input"
                    placeholder="Describe mission objective..."
                    value={modal.title}
                    style={{ width: "100%", marginTop: "5px" }}
                    onChange={(e) =>
                      setModal({ ...modal, title: e.target.value })
                    }
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "20px" }}>
                  <label className="mini-label">
                    <Calendar size={10} style={{ marginRight: "5px" }} />{" "}
                    DEADLINE (UTC)
                  </label>
                  <input
                    type="datetime-local"
                    className="glass-input"
                    style={{ width: "100%", marginTop: "5px" }}
                    onChange={(e) =>
                      setModal({ ...modal, deadline: e.target.value })
                    }
                  />
                </div>

                <button
                  className="action-btn"
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "var(--accent)",
                    color: "rgb(255, 255, 255)",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                  onClick={deployTask}>
                  <Zap size={16} fill="white" /> DEPLOY TASK
                </button>

                <button
                  className="action-btn-mini"
                  style={{
                    width: "100%",
                    marginTop: "10px",
                    padding: "10px",
                    opacity: 0.6,
                  }}
                  onClick={() =>
                    setModal({
                      ...modal,
                      show: false,
                      empId: "",
                      empName: "",
                      title: "",
                      deadline: "",
                    })
                  }>
                  ABORT DISPATCH
                </button>
              </div>

              <div
                style={{
                  marginTop: "20px",
                  padding: "15px",
                  borderRadius: "12px",
                  background: "rgba(74, 31, 69, 0.02)",
                  border: "1px dashed rgba(74, 31, 69, 0.12)",
                }}>
                <p
                  style={{
                    fontSize: "0.7rem",
                    opacity: 0.5,
                    margin: 0,
                    lineHeight: "1.4",
                  }}>
                  <ShieldAlert
                    size={12}
                    style={{ verticalAlign: "middle", marginRight: "5px" }}
                  />
                  As a Manager, your task deployment to Leads will be
                  prioritized in their respective department queues.
                </p>
              </div>
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "80px 20px",
                opacity: 0.3,
              }}>
              <BrainCircuit
                size={48}
                style={{ marginBottom: "20px", color: "var(--accent)" }}
              />
              <p className="mini-label" style={{ fontSize: "11px" }}>
                Waiting for Lead Selection
              </p>
              <p style={{ fontSize: "0.8rem" }}>
                Select a department lead from the directory to initialize the
                protocol.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const styles = `
/* 🚀 THE LAYOUT ENGINE FIX */
.audit-dashboard-wrapper {
  width: 100%;
  /* Calculate height: Total viewport minus the 70px header */
  height: calc(100vh - 70px); 
  display: flex;
  flex-direction: column;
  padding: 15px; 
  overflow: hidden; /* Prevents the whole page from scrolling */
  box-sizing: border-box;
}

.audit-grid-3 {
  display: grid;
  grid-template-columns: 280px 1fr 280px;
  gap: 14px;
  flex: 1;          /* Grows to fill available space */
  min-height: 0;    /* 🔥 CRITICAL: Allows flex children to shrink/be contained */
  margin-top: 0;
  max-height:90%;
  padding-bottom: 10px; /* Provides the gap at the bottom you were missing */
}

.audit-col {
  display: flex;
  flex-direction: column;
  background: rgba(74, 31, 69, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(74, 31, 69, 0.12);
  border-radius: 16px;
  padding: 15px;
  overflow: hidden; /* Keeps the column itself fixed */
  height: 100%;    /* Fills the grid row height */
}
  .audit-col.center-feed {
  display: flex;
  flex-direction: column;
  background: rgba(74, 31, 69, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(74, 31, 69, 0.12);
  border-radius: 16px;
  padding: 30px;
  overflow: hidden; /* Keeps the column itself fixed */
  height: 100%;    /* Fills the grid row height */
}


/* 🔥 INTERNAL SCROLL AREAS */
/* Any area inside a column that has a list MUST use this class */
.audit-scroll-area, .feed-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 8px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px; /* Reduced gap between cards from 15px/20px to 8px */
}

/* Custom Scrollbar for a cleaner look */
.audit-scroll-area::-webkit-scrollbar, 
.feed-scroll::-webkit-scrollbar {
  width: 4px;
}

.audit-scroll-area::-webkit-scrollbar-thumb, 
.feed-scroll::-webkit-scrollbar-thumb {
  background: rgba(74, 31, 69, 0.1);
  border-radius: 10px;
}
/* Ensure the top-bar in App.css remains the source of truth for header height */
.top-bar {
  min-height: 70px;
  max-height: 70px; /* Added constraint to prevent expansion */
}
  .page-content.audit-mode { display: flex; flex-direction: column; height: calc(100vh - 80px); overflow: hidden; }
  .audit-workspace { flex: 1; display: flex; flex-direction: column; overflow: hidden; margin-top: -18px; }
  .audit-content-body { flex: 1; display: flex; flex-direction: column; overflow: hidden; height: 100%; }

  .audit-panel.full-bleed { display: flex; flex-direction: column; height: 100%; width: 100%; }
  .audit-fixed-header { flex-shrink: 0; padding-bottom: 10px; }

  /* Activity Stream (EOD Audit) Styles */
  .consistency-bar { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(74, 31, 69, 0.12); }
  .c-info { display: flex; flex-direction: column; gap: 8px; }
  .c-info .label { font-size: 0.75rem; text-transform: uppercase; opacity: 0.6; letter-spacing: 0.5px; }
  .c-track { display: flex; gap: 6px; }
  .c-dot { width: 25px; height: 6px; background: rgba(74, 31, 69, 0.1); border-radius: 4px; }
  .c-dot.filled { background: #2f7d4f; box-shadow: 0 0 10px rgba(46,213,115,0.3); }
  .c-stat { font-size: 0.85rem; font-weight: 600; color: #2f7d4f; }

  .eod-timeline-container { position: relative; padding-left: 40px; }
  .timeline-v-line { position: absolute; left: 20px; top: 0; bottom: 0; width: 2px; background: linear-gradient(to bottom, #a8741a 0%, rgba(255,165,2,0) 100%); opacity: 0.3; }

  .timeline-card { position: relative; padding: 20px; margin-bottom: 25px; border-radius: 15px; border: 1px solid rgba(74, 31, 69, 0.12); transition: 0.3s; }
  .timeline-card.has-blocker { border: 1px solid rgba(255, 71, 87, 0.3); background: rgba(255, 71, 87, 0.02); }
  .timeline-marker { position: absolute; left: -26px; top: 22px; width: 12px; height: 12px; background: #1e1e1e; border: 2px solid #a8741a; border-radius: 50%; z-index: 2; }

  .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
  .date-tag { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; font-weight: 600; opacity: 0.8; }
  .blocker-warning { display: flex; align-items: center; gap: 5px; color: #c0392b; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; background: rgba(255,71,87,0.1); padding: 4px 10px; border-radius: 20px; }

  .card-body p { font-size: 0.95rem; line-height: 1.6; opacity: 0.9; margin-bottom: 15px; }
  .daily-win-box { display: flex; gap: 12px; background: rgba(255,165,2,0.05); padding: 12px; border-radius: 10px; border-left: 3px solid #a8741a; margin-bottom: 15px; }
  .daily-win-box strong { display: block; font-size: 0.7rem; text-transform: uppercase; color: #a8741a; margin-bottom: 2px; }
  .daily-win-box p { margin: 0; font-size: 0.85rem; font-style: italic; }

  .center-feed {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;   /* 🔥 prevents push down */
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* Reduced from 20px to a tight 5px top/bottom */
  padding: 5px 15px; 
  margin-bottom: 5px;
  border-bottom: 1px solid rgba(74, 31, 69, 0.12);
  background: rgba(74, 31, 69, 0.01);
}

/* Make the title significantly smaller and less dominant */
.view-header h2 {
  font-size: 0.85rem !important;
  opacity: 0.7;
}

/* Slim down the back button */
.back-btn {
  background: transparent;
  border: none;
  color: var(--ink-2);
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 4px 8px;
}

.back-btn:hover {
  color: var(--ink);
}

/* Shrink the sub-tag since it's redundant info */
.sub-tag {
  padding: 2px 8px;
  font-size: 9px;
  height: fit-content;
}

  /* Container for the buttons */
.card-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  border-top: 1px solid rgba(74, 31, 69, 0.12);
  padding-top: 15px;
}

/* Base button style */
.actions-btn {
  background: rgba(74, 31, 69, 0.05);
  border: 1px solid rgba(74, 31, 69, 0.12);
  color: var(--ink);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* Smooth spring-like transition */
  position: relative;
  overflow: hidden;
}

/* Hover: Scale up and increase brightness */
.actions-btn:hover {
  transform: translateY(-2px) scale(1.05);
  background: rgba(74, 31, 69, 0.12);
  color: var(--ink);
}

/* Acknowledge (Green) Glow */
.actions-btn.acknowledge:hover {
  border-color: #2f7d4f;
  color: #2f7d4f;
  box-shadow: 0 0 15px rgba(46, 213, 115, 0.4),
              0 0 5px rgba(46, 213, 115, 0.2);
  text-shadow: 0 0 8px rgba(46, 213, 115, 0.6);
}

/* Comment (Blue) Glow */
.actions-btn.comment:hover {
  border-color: #1e90ff;
  color: #1e90ff;
  box-shadow: 0 0 15px rgba(30, 144, 255, 0.4),
              0 0 5px rgba(30, 144, 255, 0.2);
  text-shadow: 0 0 8px rgba(30, 144, 255, 0.6);
}

/* Active state (Click effect) */
.actions-btn:active {
  transform: translateY(0) scale(0.98);
  transition: 0.1s;
}
  /* Tasks Audit & Generic UI Styles */
  .task-filter-bar { display: flex; gap: 10px; padding: 12px; border-radius: 12px; margin-bottom: 15px; align-items: center; border: 1px solid rgba(74, 31, 69, 0.12); }
  .f-search { display: flex; align-items: center; gap: 8px; background: rgba(74, 31, 69, 0.03); padding: 5px 12px; border-radius: 8px; flex: 1; }
  .f-search input { background: none; border: none; color: var(--ink); font-size: 0.85rem; outline: none; width: 100%; }
  .task-filter-bar select { background: rgba(74, 31, 69, 0.05); border: 1px solid rgba(74, 31, 69, 0.12); color: var(--ink); padding: 5px 10px; border-radius: 8px; font-size: 0.8rem; outline: none; cursor: pointer; }

  .audit-item { padding: 22px; margin-bottom: 20px; border-radius: 12px; display: flex; align-items: center; }
  .item-meta { display: flex; justify-content: space-between; margin-top: 8px; opacity: 0.7; font-size: 0.85rem; }
  .item-title-row { display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 4px; }
  .audit-progress-wrapper { margin-top: 18px; width: 100%; }
  .progress-info { display: flex; justify-content: space-between; margin-bottom: 6px; }
   .progress-container { height: 6px; background: rgba(74, 31, 69, 0.1); border-radius: 10px; overflow: hidden; }
  .progress-bar { height: 100%; transition: 0.4s; }

  
  .sub-tag {padding: 4px 15px;
  border-radius: 20px;
background: rgba(92, 34, 82, 0.2);
  color: var(--accent);
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 600; 
  
  }
  .audit-menu-grid { display: flex; flex-direction: column; gap: 15px; max-width: 600px; margin: 40px auto; width: 100%; }
  .audit-card { display: flex; align-items: center; padding: 25px; gap: 20px; cursor: pointer; transition: 0.2s; border: 1px solid rgba(74, 31, 69, 0.12); }
  .audit-card:hover { transform: scale(1.02); background: rgba(74, 31, 69, 0.08); }

  .status-snapshot { display: flex; gap: 15px; margin-bottom: 15px; }
  .snap-card { flex: 1; padding: 15px; border-radius: 12px; text-align: center; }
  .snap-card .num { display: block; font-size: 1.8rem; font-weight: bold; }
  .snap-card label { font-size: 0.7rem; text-transform: uppercase; opacity: 0.6; }

  .reliability-score { display: flex; align-items: center; gap: 30px; padding: 20px; border-radius: 15px; }
  .score-circle { border-right: 1px solid rgba(74, 31, 69, 0.12); padding-right: 30px; }
  .score-circle h3 { font-size: 2.2rem; margin: 0; color: #2f7d4f; }
  .log-row { justify-content: space-between; }

  .member-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
  .member-card { padding: 20px; position: relative; cursor: pointer; text-align: center; border: 1px solid rgba(74, 31, 69, 0.12); }
  .member-card:hover { transform: translateY(-5px); border-color: #2f7d4f; }
  .avatar-large { width: 60px; height: 60px; background: rgba(74, 31, 69, 0.05); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; color: #2f7d4f; border: 1px solid rgba(74, 31, 69, 0.12); }
  .view-btn { width: 100%; padding: 10px; background: rgba(46,213,115,0.1); border: 1px solid #2f7d4f; color: #2f7d4f; border-radius: 8px; margin-top: 15px; cursor: pointer; }
  .team-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; margin-top:-25px; }
  .search-box { display: flex; align-items: center; padding: 8px 15px; border-radius: 12px; gap: 10px; width: 300px; }
  .search-box input { background: none; border: none; color: var(--ink); outline: none; width: 100%; }
  .icon-box { width: 45px; height: 45px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
  .task-bg { background: rgba(46,213,115,0.2); color: #2f7d4f; }
  .attend-bg { background: rgba(30,144,255,0.2); color: #1e90ff; }
  .eod-bg { background: rgba(255,165,2,0.2); color: #a8741a; }
  .session-badge { opacity: 0.5; font-size: 0.75rem; margin-left: 5px; font-weight: normal; }
.blocker-text { color: #c0392b; font-size: 0.85rem; margin-top: -10px; margin-bottom: 10px; }

/* New Intelligence Dashboard */
.eod-intelligence-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 25px;
}
.intel-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  border-radius: 12px;
  border: 1px solid rgba(74, 31, 69, 0.12);
  cursor: pointer;
  transition: 0.3s;
}
.intel-card:hover, .intel-card.active {
  background: rgba(74, 31, 69, 0.08);
  border-color: rgba(74, 31, 69, 0.2);
  transform: translateY(-2px);
}
.intel-card.active { border-color: #6a5acd; }
.intel-info { display: flex; flex-direction: column; }
.intel-info .val { font-size: 1.1rem; font-weight: 700; color: var(--ink); }
.intel-info label { font-size: 0.65rem; text-transform: uppercase; opacity: 0.5; letter-spacing: 0.5px; }

/* Enhanced Timeline Cards */
.calendar-pill {
  background: rgba(74, 31, 69, 0.05);
  padding: 5px 10px;
  border-radius: 8px;
  text-align: center;
  display: flex;
  flex-direction: column;
  min-width: 45px;
  border: 1px solid rgba(74, 31, 69, 0.12);
}
.day-num { font-size: 1rem; font-weight: 800; line-height: 1; }
.month-name { font-size: 0.6rem; text-transform: uppercase; opacity: 0.7; }
.session-info { display: flex; flex-direction: column; gap: 2px; }
.session-info strong { font-size: 0.9rem; }

.report-badges { display: flex; gap: 8px; }
.status-tag { font-size: 0.65rem; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; font-weight: 700; }
.status-tag.completed { background: rgba(46,213,115,0.1); color: #2f7d4f; }
.status-tag.in-progress { background: rgba(30,144,255,0.1); color: #1e90ff; }
.urgent-badge { background: #c0392b; color: var(--ink); font-size: 0.6rem; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; animation: pulse 2s infinite; }

.section-label { font-size: 0.7rem; text-transform: uppercase; opacity: 0.4; font-weight: 700; margin-bottom: 8px; letter-spacing: 1px; }
.work-desc { font-size: 0.95rem; color: var(--ink-2); }

.blocker-callout {
  background: rgba(255,71,87,0.08);
  border: 1px dashed rgba(255,71,87,0.3);
  padding: 12px;
  border-radius: 10px;
  margin-top: 15px;
}
.callout-header { display: flex; align-items: center; gap: 6px; color: #c0392b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 5px; }
.blocker-callout p { margin: 0; font-size: 0.85rem; color: #ff7675; }

.spacer { flex: 1; }
.report-id { font-family: monospace; font-size: 0.7rem; opacity: 0.2; }

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}
  .lead-command-bar { display: flex; gap: 20px; padding: 15px 25px; border-radius: 15px; margin-bottom: 25px; background: rgba(74, 31, 69, 0.03); border: 1px solid rgba(74, 31, 69, 0.12); sticky top: 0; z-index: 10; }
  .command-item { display: flex; align-items: center; gap: 12px; }
  .command-item strong { display: block; font-size: 1.2rem; line-height: 1; }
  .command-item label { font-size: 0.7rem; text-transform: uppercase; opacity: 0.5; }

  .member-card.status-risk { border-left: 4px solid #c0392b; }
  .member-card.status-low { border-left: 4px solid #a8741a; }
  .member-card.status-good { border-left: 4px solid #2f7d4f; }

  .reliability-engine { display: flex; align-items: center; gap: 20px; padding: 20px; border-radius: 15px; margin-bottom: 20px; }
  .engine-circle { width: 80px; height: 80px; }
  .circular-chart { display: block; margin: 10px auto; max-width: 100%; max-height: 250px; }
  .circle-bg { fill: none; stroke: #333; stroke-width: 2.8; }
  .circle { fill: none; stroke-width: 2.8; stroke-linecap: round; stroke: #2f7d4f; transition: stroke-dasharray 0.3s ease; }
  .percentage { fill: #fff; font-size: 0.5rem; text-anchor: middle; font-weight: bold; }

  .lead-suggestions-panel { padding: 20px; border-radius: 15px; margin-bottom: 20px; background: rgba(162, 155, 254, 0.05); border: 1px solid rgba(162, 155, 254, 0.2); }
  .panel-header { display: flex; align-items: center; gap: 8px; font-weight: bold; color: #6a5acd; margin-bottom: 12px; }
  .lead-suggestions-panel ul { list-style: none; padding: 0; }
  .lead-suggestions-panel li { font-size: 0.9rem; margin-bottom: 8px; padding-left: 15px; position: relative; }
  .lead-suggestions-panel li::before { content: "→"; position: absolute; left: 0; color: #6a5acd; }

  .mini-task-monitor { display: flex; gap: 20px; padding: 20px; border-radius: 15px; align-items: center; margin-bottom: 20px; }
  .doughnut-placeholder { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; position: relative; }
  .doughnut-placeholder::after { content: ""; position: absolute; width: 45px; height: 45px; background: #fbf9f6; border-radius: 50%; }
  .doughnut-placeholder span { z-index: 1; font-weight: bold; }
  .monitor-info { flex: 1; }
  .m-row { display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px; opacity: 0.8; }
  .m-alert { font-size: 0.75rem; color: #c0392b; font-weight: bold; margin-top: 8px; }

  .timeline-card { padding: 20px; margin-bottom: 20px; border-radius: 15px; }
  .type-badge { font-size: 0.75rem; font-weight: bold; text-transform: uppercase; }
  .blocker-callout { background: rgba(255,71,87,0.1); padding: 10px; border-radius: 8px; margin: 10px 0; font-size: 0.85rem; color: #c0392b; }
  
  .log-row { display: flex; justify-content: space-between; padding: 12px 20px; border-radius: 10px; margin-bottom: 10px; font-size: 0.9rem; }
  .txt-danger { color: #c0392b; }
  .txt-success { color: #2f7d4f; }

  .tasks-split-layout {
  display: flex;
  gap: 20px;
  height: 100%;
}

.tasks-left {
  flex: 2;
  max-height: 500px;
  overflow-y: auto;
}

.tasks-right {
  flex: 1;
  padding: 20px;
  border-radius: 15px;
  position: sticky;
  top: 20px;
  height: fit-content;
}

.tasks-right h3 {
  margin-bottom: 15px;
  font-size: 1rem;
}

.doughnut-placeholder.big {
  width: 120px;
  height: 120px;
  margin: 20px auto;
}

.legend-grid {
  display: grid;
  gap: 8px;
  font-size: 0.8rem;
}

.dot {
  width: 8px;
  height: 8px;
  display: inline-block;
  margin-right: 6px;
  border-radius: 2px;
}

.green { background: #2f7d4f; }
.blue { background: #2b6cb0; }
.yellow { background: #a8741a; }
.purple { background: #6a5acd; }
.red { background: #c0392b; }

.insight-box {
  margin-top: 15px;
  padding: 10px;
  border-radius: 10px;
  font-size: 0.75rem;
}

.insight-box.good {
  background: rgba(46,213,115,0.1);
  color: #2f7d4f;
}

.insight-box.danger {
  background: rgba(255,71,87,0.1);
  color: #c0392b;
}



    .section-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.5; margin-bottom: 15px; }
  
  /* Glass Cards */
 
  .task-card-modern.border-danger { border-color: rgba(255, 71, 87, 0.4); }
  
  .card-mid { display: flex; gap: 15px; margin-bottom: 15px; opacity: 0.6; font-size: 0.75rem; }
  .meta-item { display: flex; align-items: center; gap: 4px; }
  
  .progress-text { display: flex; justify-content: space-between; font-size: 0.7rem; margin-bottom: 5px; }
  .mono-data { font-family: 'JetBrains Mono', monospace; font-weight: bold; }
  
  /* Vertical Gauges */
  .efficiency-v-gauges { display: flex; justify-content: space-around; height: 150px; margin: 20px 0; }
  .v-gauge-item { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .v-gauge-track { width: 8px; height: 100%; background: rgba(74, 31, 69, 0.1); border-radius: 10px; position: relative; overflow: hidden; display: flex; align-items: flex-end; }
  .v-gauge-fill { width: 100%; transition: 1s cubic-bezier(0.4, 0, 0.2, 1); }
  .v-gauge-label { font-size: 9px; opacity: 0.5; max-width: 60px; text-align: center; }

  .big-score { font-size: 2.5rem; color: #2b6cb0; text-shadow: 0 0 15px rgba(52, 152, 219, 0.3); }
  
  /* Filters */
  .filter-card.active { border-color: #2b6cb0; background: rgba(52, 152, 219, 0.05); }
  .search-header { display: flex; align-items: center; gap: 10px; padding: 10px 15px; margin-bottom: 15px; }
  .search-header input { background: none; border: none; color: var(--ink); flex: 1; outline: none; font-size: 0.85rem; }
  .clear-search { cursor: pointer; opacity: 0.5; }

  /* Button-style Section Labels */
.section-label-btn {
  background: rgba(74, 31, 69, 0.05);
  border: 1px solid rgba(74, 31, 69, 0.12);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 800;
  color: #6a5acd;
  text-align: center;
  margin-bottom: 10px;
}

.section-label-btnn {
  background: rgba(74, 31, 69, 0.05);
  border: 1px solid rgba(74, 31, 69, 0.12);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 800;
  color: #6a5acd;
  text-align: center;
  margin-bottom: 20px;
}

/* Metric Button Look */
.metric-status-btn {
  background: rgba(52, 152, 219, 0.1);
  border: 1px solid rgba(52, 152, 219, 0.3);
  color: #2b6cb0;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: bold;
  margin-top: 15px;
  margin-bottom:8px;
}
.metric-status-btn.risk { 
background: rgba(219, 52, 69, 0.1);
  border: 1px solid rgba(219, 52, 80, 0.3);
  color: #c0392b;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: bold;
  margin-top: 15px;
  margin-bottom:8px;
}
  .metric-status-btn.optimal { 
background: rgba(52, 152, 219, 0.1);
  border: 1px solid rgba(52, 152, 219, 0.3);
  color: #2b6cb0;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: bold;
  margin-top: 15px;
  margin-bottom:8px;
}

/* Sidebar Navigation Buttons */
.filter-button-group { display: flex; flex-direction: column; gap: 8px; }
.nav-btn {
  background: rgba(74, 31, 69, 0.03);
  border: 1px solid rgba(74, 31, 69, 0.12);
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--ink);
}
.nav-btn .btn-content { display: flex; justify-content: space-between; align-items: center; }
.nav-btn span { font-size: 0.8rem; opacity: 0.7; }
.nav-btn strong { font-family: monospace; font-size: 1rem; }

.nav-btn:hover { background: rgba(74, 31, 69, 0.08); transform: translateX(5px); }
.nav-btn.active { border-color: #6a5acd; background: rgba(162, 155, 254, 0.1); }
.nav-btn.success-btn.active { border-color: #2f7d4f; background: rgba(46, 213, 115, 0.1); }
.nav-btn.danger-btn.active { border-color: #c0392b; background: rgba(255, 71, 87, 0.1); }

/* Task Card Specifics */
.card-id-btn { font-size: 0.6rem; font-family: monospace; background: rgba(74, 31, 69, 0.05); padding: 2px 6px; border-radius: 4px; opacity: 0.5; }
.status-pill-btn { font-size: 0.65rem; font-weight: 900; text-transform: uppercase; color: var(--accent); border: 1px solid var(--accent); padding: 2px 10px; border-radius: 4px; }

/* Info pills inside cards */
.card-mid-btns { display: flex; justify-content:space-between; margin-bottom: 10px; }
.info-btn { 
  display: flex; align-items: center; gap: 6px; 
  background: rgba(74, 31, 69, 0.03); 
  padding: 4px 10px; 
  border-radius: 6px; 
  font-size: 0.7rem; 
  border: 1px solid rgba(74, 31, 69, 0.12); 
}

/* Right Column: Performance Index Button Look */
.performance-index-btn {
  background: rgba(74, 31, 69, 0.02);
  border: 1px solid rgba(74, 31, 69, 0.12);
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 2px;
}
.performance-index-btn label { font-size: 0.65rem; text-transform: uppercase; opacity: 0.5; display: block; margin-bottom: 5px; }
.big-score-val { font-size: 3rem; font-weight: 800; color: #2b6cb0; text-shadow: 0 0 20px rgba(52, 152, 219, 0.4); }

/* Intelligence Pulse look */
.intelligence-pulse-btn {
  margin-top: 18px;
  padding: 2px;
    backdrop-filter: blur(18px);
  border: 1px solid rgba(92, 34, 82, 0.35);
  border-radius: 18px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.35);
  height:30px;
  display: flex;
  gap: 5px;
  align-items: center;
  
}
.intelligence-pulse-btn p { font-size: 0.7rem; line-height: 1.4; margin: 0; opacity: 0.8; }

/* Intelligence Pulse look */
.intelligence-pulse-btnn {
  margin-top: 18px;
  padding: 2px;
    backdrop-filter: blur(18px);
  border: 1px solid rgba(92, 34, 82, 0.35);
  border-radius: 18px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.35);
  height:100px;
  display: flex;
  gap: 5px;
  align-items: center;
  
}
.intelligence-pulse-btnn p { font-size: 0.7rem; line-height: 1.4; margin: 0; opacity: 0.8; }


/* Efficiency Distribution Bar Styles */
.efficiency-distribution-wrapper {
  margin: 20px 0;
  padding: 15px;
  background: rgba(74, 31, 69, 0.03);
  border-radius: 12px;
}

.section-mini-label {
  font-size: 10px;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 1px;
  display: block;
  margin-bottom: 10px;
}

.multi-progress-bar {
  display: flex;
  height: 8px;
  border-radius: 10px;
  overflow: hidden;
  background: rgba(74, 31, 69, 0.1);
  margin-bottom: 12px;
}

.legend-grid-mini {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.legend-grid-mini span {
  font-size: 10px;
  display: flex;
  align-items: center;
  color: var(--text-main);
}

.legend-grid-mini i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 6px;
}

/* Alert State for Pulse */
.pulse-alert {
  border: 1px solid rgba(255, 71, 87, 0.3) !important;
}

.pulse-alert .pulse-indicator {
  background: #c0392b;
  box-shadow: 0 0 10px #c0392b;
}

/* Task Progress Overrides */
.task-card-modern.border-danger {
  border-left: 3px solid #c0392b !important;
}

/* Container for the multi-colored efficiency bar */
.efficiency-distribution-wrapper {
  margin: 20px 0;
  padding: 15px;
  background: rgba(74, 31, 69, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(74, 31, 69, 0.12);
}

.section-mini-label {
  font-size: 10px;
  text-transform: uppercase;
  color: #5d4a5b;
  letter-spacing: 1px;
  display: block;
  margin-bottom: 12px;
}

.multi-progress-bar {
  display: flex;
  height: 8px;
  border-radius: 10px;
  overflow: hidden;
  background: rgba(74, 31, 69, 0.1);
  margin-bottom: 12px;
}

.legend-grid-mini {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.legend-grid-mini span {
  font-size: 10px;
  display: flex;
  align-items: center;
  color: var(--ink-2);
}

.legend-grid-mini i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 6px;
}

/* Alert Styling for Pulse */
.pulse-alert {
  border: 1px solid rgba(255, 71, 87, 0.4) !important;
  background: rgba(255, 71, 87, 0.05) !important;
}

.pulse-alert .pulse-indicator {
  background: #c0392b;
  box-shadow: 0 0 12px #c0392b;
}

/* Card Overrides */
.task-card-modern.border-danger {
  border-left: 3px solid #c0392b !important;
}



.gauge-fill {
  height: 100%;
  border-radius: 10px;
}

.progress-labels{
display:flex;
justify-content:space-between;
margin-bottom:5px;
}

/* Button-style Summary Pointers */
.health-summary-container {
  margin: 1px 0;
}

.summary-button-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-pill-btn {
  padding: 10px 15px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  background: rgba(74, 31, 69, 0.03);
  border: 1px solid rgba(74, 31, 69, 0.12);
}

.summary-pill-btn.status-ok {
  color: #2f7d4f;
  border-left: 4px solid #2f7d4f;
}

.summary-pill-btn.status-warn {
  color: #ff7f50;
  border-left: 4px solid #ff7f50;
  background: rgba(255, 127, 80, 0.05);
}

/* Update Pulse Alert to only trigger on active Overdue tasks */
.pulse-alert {
  border: 1px solid rgba(255, 71, 87, 0.4) !important;
  background: rgba(255, 71, 87, 0.05) !important;
}

/* Ensure the horizontal bar looks clean */
.multi-progress-bar {
  display: flex;
  height: 8px;
  border-radius: 10px;
  overflow: hidden;
  background: rgba(74, 31, 69, 0.08);
  margin-bottom: 12px;
}

/* Center Column Switcher Styles */
.task-filter-switch {
  display: flex;
  position: relative;
  padding: 4px;
  background: rgba(74, 31, 69, 0.04);
  border-radius: 12px;
  border: 1px solid rgba(74, 31, 69, 0.12);
  overflow: hidden;
}

.switch-item {
  flex: 1;
  padding: 10px 0;
  font-size: 11px;
  font-weight: 600;
  color: rgba(42, 21, 48, 0.5);
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  background: none;
  border: none;
  outline: none;
  z-index: 2;
  transition: color 0.3s ease;
}

.switch-item.active {
  color: var(--ink);
}

.switch-glider {
  position: absolute;
  top: 4px;
  left: 4px;
  height: calc(100% - 8px);
  width: calc(25% - 2px);
  background: rgba(74, 31, 69, 0.1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  z-index: 1;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: rgba(42, 21, 48, 0.3);
  font-size: 13px;
  font-style: italic;
  border: 1px dashed rgba(74, 31, 69, 0.12);
  border-radius: 15px;
  margin-top: 20px;
}


.audit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 5px;
  margin-bottom: 5px !important; /* Tightens the space between header and columns */
}

.streak-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(241, 196, 15, 0.1);
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid rgba(241, 196, 15, 0.3);
  font-size: 0.85rem;
  color: #a8741a;
  font-weight: 600;
}

/* --- Intelligence Grid Layout --- */
.intelligence-grid {
  display: grid;
  grid-template-columns: 280px 1fr 300px;
  gap: 20px;
}

.col.glass {
  background: rgba(74, 31, 69, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(74, 31, 69, 0.12);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.section-header {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--ink-2);
  margin-bottom: 20px;
  font-weight: 700;
}

/* --- Circular Gauge --- */
.gauge-section {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
}

.circular-chart {
  width: 70px;
  height: 70px;
}

.circle-bg {
  fill: none;
  stroke: rgba(74, 31, 69, 0.14);
  stroke-width: 3;
}

.circle {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray 1s ease;
}

.percentage {
  fill: #fff;
  font-size: 0.5rem;
  font-weight: 700;
  text-anchor: middle;
}

.gauge-label strong {
  display: block;
  font-size: 1rem;
}

.gauge-label span {
  font-size: 0.7rem;
  color: var(--ink-2);
}

/* --- Metric Bars --- */
.metric-bars {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.bar-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  margin-bottom: 6px;
}

.bar-track {
  height: 6px;
  background: rgba(74, 31, 69, 0.05);
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 1s ease;
}

/* --- Activity Timeline Feed --- */



.feed-card {
  display: flex;
  align-items: center;
  gap: 15px;
  background: rgba(74, 31, 69, 0.02);
  border: 1px solid rgba(74, 31, 69, 0.12);
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 10px;
  position: relative;
  transition: transform 0.2s ease;
}

.feed-card:hover {
  transform: translateX(5px);
  background: rgba(74, 31, 69, 0.04);
}

.card-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 45px;
  border-right: 1px solid rgba(74, 31, 69, 0.12);
}

.card-date .day { font-size: 1.1rem; font-weight: 700; }
.card-date .month { font-size: 0.65rem; text-transform: uppercase; color: var(--ink-2); }

.time-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.intensity-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.intensity-dot.high { background: #2f7d4f; box-shadow: 0 0 8px #2f7d4f; }
.intensity-dot.normal { background: #2b6cb0; }
.intensity-dot.low { background: #95a5a6; }

.status-tag {
  position: absolute;
  right: 12px;
  font-size: 0.65rem;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 700;
  text-transform: uppercase;
}

.status-tag.warn { background: rgba(255, 71, 87, 0.2); color: #c0392b; }
.status-tag.late { background: rgba(241, 196, 15, 0.2); color: #a8741a; }

/* --- Risk & AI Insights --- */
.risk-status {
  display: flex;
  gap: 15px;
  padding: 15px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.risk-status.safe { background: rgba(46, 204, 113, 0.1); border: 1px solid rgba(46, 204, 113, 0.2); color: #2f7d4f; }
.risk-status.danger { background: rgba(255, 71, 87, 0.1); border: 1px solid rgba(255, 71, 87, 0.2); color: #c0392b; }

.risk-text strong { display: block; font-size: 0.9rem; }
.risk-text p { font-size: 0.75rem; opacity: 0.8; margin: 0; }

.ai-insight-box {
  background: rgba(162, 155, 254, 0.05);
  border-left: 3px solid #6a5acd;
  padding: 15px;
  border-radius: 0 8px 8px 0;
  margin-bottom: auto;
}

.ai-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #6a5acd;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.ai-insight-box p {
  font-size: 0.85rem;
  font-style: italic;
  line-height: 1.4;
  margin: 0;
  color: var(--ink-2);
}

.summary-footer {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.stat-pill {
  flex: 1;
  background: rgba(74, 31, 69, 0.05);
  padding: 10px;
  border-radius: 8px;
  text-align: center;
}

.stat-pill strong { display: block; font-size: 1.1rem; }
.stat-pill span { font-size: 0.65rem; color: var(--ink-2); text-transform: uppercase; }

/* --- EOD Audit Container --- */
.eod-audit-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.score-display {
  text-align: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(74, 31, 69, 0.12);
  margin-bottom: 20px;
}

.score-display h2 { font-size: 2.5rem; margin: 0; }
.score-display p { font-size: 0.75rem; color: var(--ink-2); }


.score-displayy {
  text-align: center;
  padding:-1px;
  border-bottom: 1px solid rgba(74, 31, 69, 0.12);
  margin-bottom: 10px;
}

.score-displayy h2 { font-size: 2.5rem; margin-bottom:-15px; margin-top:-15px; }
.score-displayy p { font-size: 0.75rem; color: var(--ink-2); }

.work-distribution {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 5px;
}

.dist-row {
  display: grid;
  grid-template-columns: 80px 1fr 20px;
  align-items: center;
  gap: 10px;
  font-size: 0.75rem;
}

.dist-track {
  height: 4px;
  background: rgba(74, 31, 69, 0.05);
  border-radius: 2px;
  overflow: hidden;
}

.dist-bar { height: 100%; transition: width 0.5s ease; }

.ai-suggestions-box {
  background: rgba(74, 31, 69, 0.02);
  border-radius: 12px;
  padding: 15px;
}

.suggestion-item {
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  margin-top: 8px;
  border-left: 3px solid transparent;
}

.suggestion-item.error { background: rgba(255, 71, 87, 0.1); color: #c0392b; border-left-color: #c0392b; }
.suggestion-item.warn { background: rgba(241, 196, 15, 0.1); color: #a8741a; border-left-color: #a8741a; }
.suggestion-item.success { background: rgba(46, 204, 113, 0.1); color: #2f7d4f; border-left-color: #2f7d4f; }
.suggestion-item.neutral { background: rgba(74, 31, 69, 0.05); color: var(--ink-2); border-left-color: #888; }

/* --- EOD Feed --- */
.eod-card {
  padding: 15px;
  border-radius: 12px;
  margin-bottom: 15px;
  border: 1px solid rgba(74, 31, 69, 0.12);
}

.eod-card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.type-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.65rem;
  font-weight: 700;
}

.eod-date { font-size: 0.75rem; color: var(--ink-2); }

.eod-content {
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--ink-2);
  margin-bottom: 15px;
}

.blocker-zone {
  display: flex;
  gap: 1px;
  background: rgba(255, 71, 87, 0.05);
  padding: 6px;
  border-radius: 8px;
  border: 1px solid rgba(255, 71, 87, 0.1);
  color: #c0392b
  font-size: 0.75rem; 
}

.blocker-text { font-size: 0.75rem; }

.eod-actions { display: flex; gap: 10px; margin-top:10px;}

.action-btn-mini {
  background: rgba(74, 31, 69, 0.05);
  border: none;
  color: var(--ink-2);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.7rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.action-btn-mini:hover { background: rgba(74, 31, 69, 0.1); color: var(--ink); }

/* --- Health Stats --- */
.health-stat {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px;
}

.stat-icon-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info strong { display: block; font-size: 1rem; }
.stat-info p { font-size: 0.7rem; color: var(--ink-2); margin: 0; }

.burn-graph {
  margin-top: auto;
  padding: 15px;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(74, 31, 69, 0.03) 0%, rgba(74, 31, 69, 0) 100%);
}

.back-btn{background: var(--accent);border: none;padding: 10px 18px;border-radius: 10px;font-weight: 600;color: rgb(255, 255, 255);cursor: pointer;transition: all 0.2s ease;}
.back-btn:hover {
background: var(--accent);border: none;padding: 10px 18px;border-radius: 10px;font-weight: 600;color: rgb(255, 255, 255);cursor: pointer;transition: all 0.2s ease;
  box-shadow: 0 6px 18px rgba(92, 34, 82, 0.35);
}

/* 1. Ensure the parent grid takes up the full available height and doesn't expand */



/* 3. Optional: Style the scrollbars to match your dark 'glass' theme */
.audit-col::-webkit-scrollbar {
  width: 5px;
}

.audit-col::-webkit-scrollbar-track {
  background: transparent;
}

.audit-col::-webkit-scrollbar-thumb {
  background: rgba(74, 31, 69, 0.1);
  border-radius: 10px;
}

.audit-col::-webkit-scrollbar-thumb:hover {
  background: rgba(74, 31, 69, 0.2);
}

/* 4. Ensure any internal absolute elements don't break the scroll context */
.left-analysis, .center-feed, .right-stats {
  position: relative;
}
  /* Ensure the main container doesn't grow past the viewport */
.eod-audit-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Force the grid to fill the container and not expand */
.intelligence-grid {
  display: grid;
  grid-template-columns: 280px 1fr 300px;
  gap: 20px;
  flex: 1;          /* Take up remaining height */
  height: 100%;     /* Lock to container height */
  min-height: 0;    /* Critical for flex children scrolling */
}

/* Apply scroll logic to every column */
.intelligence-grid .col {
  display: flex;
  flex-direction: column;
  padding: 20px;
  
  /* --- SCROLL LOGIC --- */
  overflow-y: auto;   /* Show scrollbar only if needed */
  min-height: 0;      /* Allow column to shrink and force scroll */
  height: 100%;       /* Match grid height */
  /* -------------------- */
  
  scrollbar-width: thin; /* Firefox support */
  scrollbar-color: rgba(74, 31, 69, 0.1) transparent;
}

/* Custom Scrollbar Styling (Chrome/Safari/Edge) */
.intelligence-grid .col::-webkit-scrollbar {
  width: 5px;
}

.intelligence-grid .col::-webkit-scrollbar-track {
  background: transparent;
}

.intelligence-grid .col::-webkit-scrollbar-thumb {
  background: rgba(74, 31, 69, 0.1);
  border-radius: 10px;
}

.intelligence-grid .col::-webkit-scrollbar-thumb:hover {
  background: rgba(74, 31, 69, 0.2);
}

/* Remove internal scroll containers to let the main column handle it */


/* 🚀 REVISED DASHBOARD ARCHITECTURE */




/* CENTER FEED SPECIFIC */



.card-id-btn, .status-pill-btn {
  font-size: 10px !important; /* Small labels */
  padding: 2px 8px !important;
}


.info-btn {
  font-size: 0.75rem !important;
  opacity: 0.7;
}

/* RADIAL & GAUGES SLIMDOWN */
.circular-chart.main-gauge {
  max-width: 100px; /* Smaller circular chart */
  margin: 0 auto;
}

.big-score-val {
  font-size: 1.8rem !important; /* Reduced from likely 2.5rem */
}

/* HORIZONTAL FILTER SWITCHER */
.task-filter-switch {
  display: flex;
  padding: 4px;
  gap: 4px;
  margin-bottom: 10px;
}

.switch-item {
  font-size: 11px;
  padding: 6px 0;
  flex: 1;
  text-align: center;
  z-index: 2;
}

/* LEGEND & SUMMARY SLIMDOWN */
.legend-grid-mini span {
  font-size: 0.7rem !important;
  display: flex;
  align-items: center;
  gap: 5px;
}

.summary-pill-btn {
  font-size: 0.75rem !important;
  padding: 6px 10px !important;
}



/* The Grid Logic */


/* Responsive: Stack on smaller screens */
@media (max-width: 1100px) {
  .audit-grid-3 {
    grid-template-columns: 1fr 1fr; /* Two columns */
  }
  .right-tracker {
    grid-column: span 2; /* Move health to bottom */
  }
}

@media (max-width: 768px) {
  .audit-grid-3 {
    grid-template-columns: 1fr; /* Single column */
  }
  .audit-col {
    grid-column: span 1;
  }
}

/* Glass effect refinement */
.glass {
    background: var(--glass);
  backdrop-filter: blur(18px);
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.35);
}

.glasss{
background: var(--glass);
  backdrop-filter: blur(18px);
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.35);
}
.task-card-modern {
  padding: 12px 16px; /* Reduced vertical padding from ~22px to 12px */
  margin-bottom: 0;   /* Use the gap from the parent container instead */
  border-radius: 12px;
  transition: all 0.2s ease;
}
  .card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px; /* Reduced from 12px+ */
}
  .task-title-main {
  font-size: 0.95rem;
  margin: 0 0 8px 0; /* Tightened margins */
  line-height: 1.3;
}
.card-bottom {
  margin-top: 5px;
}
  .gauge-container-flat {
  height: 4px; /* Slimmer progress bar */
  background: rgba(74, 31, 69, 0.05);
  border-radius: 10px;
  overflow: hidden;
}


.left-analysis{
  display: flex;
  flex-direction: column;
  background: rgba(74, 31, 69, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(74, 31, 69, 0.12);
  border-radius: 16px;
  padding: 15px;
  gap:15px;
  
  overflow: hidden; /* Keeps the column itself fixed */
  height: 100%;    /* Fills the grid row height */
}
  .ai-suggestions-box{
     border: 1px solid rgba(92, 34, 82, 0.35);
  }
     .burn-graph{
     border: 1px solid rgba(92, 34, 82, 0.35);
     }

     .right-tracker glass{
       display: flex;
  flex-direction: column;
  background: rgba(74, 31, 69, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(74, 31, 69, 0.12);
  border-radius: 16px;
  padding: 15px;
  overflow: hidden; /* Keeps the column itself fixed */
  height: 100%;    /* Fills the grid row height */
     }
`;

