
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";
import { io } from "socket.io-client";
import { RiLogoutCircleRLine } from "react-icons/ri";
import { RiTeamLine } from "react-icons/ri";

import { Radar } from "react-chartjs-2";
import {
  MessageSquare,
  Home,
  Folder,
  Clock,
  FileText,
  Calendar,
  LogOut,
  Target,
  Zap,
  Sparkles,
  BrainCircuit,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import UserAvatar from "./UserAvatar";

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { API_URL, SOCKET_URL } from "./apiConfig";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from "recharts";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

// Import components
import Dashboard from "./Dashboard";
import TaskCenter from "./TaskCenter";
import LeaveCenter from "./LeaveCenter";
import AttendanceTab from "./AttendanceTab";
import TeamTab from "./TeamTab";
import EODReportTab from "./EODReportTab";
import AccountTab from "./AccountTab";
import BrandLogo from "./BrandLogo";
import PageHeading from "./PageHeading";
import HeaderActions from "./HeaderActions";
import useAttendance from "./useAttendance";
import { UserCircle } from "lucide-react";
import ChatDrawer from "./ChatDrawer";
// Ensure this matches your file name

export default function LeadDashboard({ token, user, showToast, logout }) {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const { attendance, timer } = useAttendance(token);
  const [socket, setSocket] = useState(null);

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
            onClick={() => setCurrentPage("team")}
            className={`nav-link ${currentPage === "team" ? "active" : ""}`}>
            <RiTeamLine size={18} /> My Team
          </button>
          <button
            onClick={() => setCurrentPage("team-dispatch")}
            className={`nav-link ${currentPage === "team-dispatch" ? "active" : ""}`}>
            <Zap size={18} /> Team Dispatcher
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
              LEAD
            </span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="glass top-barr">
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

        {currentPage === "team" && <TeamTab token={token} />}
        {currentPage === "tasks" && (
          <TaskCenter token={token} showToast={showToast} />
        )}
        {currentPage === "leave" && (
          <LeaveCenter token={token} showToast={showToast} />
        )}
        {currentPage === "team-dispatch" && (
          <LeadTaskAssigner token={token} showToast={showToast} />
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


/* ---------------- LEAD TASK ASSIGNER (Lead Workflow Tab) ---------------- */
function LeadTaskAssigner({ token, showToast }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering States
  const [searchTerm, setSearchTerm] = useState("");
  const [loadFilter, setLoadFilter] = useState("All");

  const [modal, setModal] = useState({ 
    show: false, 
    empId: "", 
    empName: "", 
    title: "", 
    deadline: "" 
  });

  useEffect(() => {
    fetchTeam();
  }, [token]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/lead/dispatch-directory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMembers(res.data || []);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  // Combined Filtering Logic
  const filteredMembers = members.filter(m => {
    const activeTasks = m.performance?.assignedTasks?.filter(t => t.status !== 'Completed').length || 0;
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesLoad = true;
    if (loadFilter === "Ready") matchesLoad = activeTasks === 0;
    if (loadFilter === "Busy") matchesLoad = activeTasks > 0 && activeTasks < 4;
    if (loadFilter === "Overloaded") matchesLoad = activeTasks >= 4;

    return matchesSearch && matchesLoad;
  });

  const handleDeploy = async () => {
    if (!modal.title || !modal.deadline) return showToast("Fields required", "error");
    try {
      await axios.post(`${API_URL}/lead/assign-task-to-member`, {
        employeeId: modal.empId, 
        title: modal.title, 
        deadline: modal.deadline,
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      showToast("Task Deployed Successfully!", "success");
      setModal({ show: false, empId: "", empName: "", title: "", deadline: "" });
      fetchTeam(); // Refresh load status
    } catch (e) { 
      showToast("Deployment failed", "error"); 
    }
  };

  return (
    <section className="page-content" style={{ animation: "fadeIn 0.5s ease" }}>
      <div className="intelligence-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px' }}>
        
        {/* Left Col: Operative Selection */}
        <div className="col left glass" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px' }}>
            <span className="mini-label" style={{ color: 'var(--accent)', margin: 0 }}>MY ASSIGNED OPERATIVES</span>
            <span style={{ opacity: 0.5, fontSize: '0.7rem' }}>{filteredMembers.length} NODES ONLINE</span>
          </div>

          {/* --- FILTER INTERFACE --- */}
          <div className="filter-bar" style={{ padding: '12px 15px', background: 'rgba(74, 31, 69, 0.02)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
             <input 
                className="glass-input"
                placeholder="Search Operative Name..." 
                style={{ fontSize: '0.75rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
             <select className="custom-select" value={loadFilter} onChange={(e) => setLoadFilter(e.target.value)}>
                <option value="All">Any Load</option>
                <option value="Ready">Ready (0)</option>
                <option value="Busy">Busy (1-3)</option>
                <option value="Overloaded">Overloaded (4+)</option>
             </select>
          </div>

          <div className="feed-scroll" style={{ maxHeight: "65vh", overflowY: 'auto', padding: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
            {filteredMembers.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', opacity: 0.3, padding: '60px' }}>
                <ShieldAlert size={40} style={{ marginBottom: '15px' }}/>
                <p>No operatives found matching these parameters.</p>
              </div>
            ) : (
              filteredMembers.map(m => {
                const activeTasks = m.performance?.assignedTasks?.filter(t => t.status !== 'Completed').length || 0;
                const isSelected = modal.empId === m._id;

                return (
                  <div 
                    key={m._id} 
                    className={`glass card ${isSelected ? 'active-border' : ''}`} 
                    style={{ 
                      cursor: 'pointer', 
                      padding: '15px', 
                      transition: 'all 0.3s ease',
                      borderLeft: isSelected ? `4px solid var(--accent)` : `4px solid rgba(74, 31, 69, 0.12)`
                    }} 
                    onClick={() => setModal({ ...modal, show: true, empId: m._id, empName: m.name })}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div className="stat-icon-circle" style={{
                          background: isSelected ? 'var(--accent)' : 'var(--accent-soft)',
                          color: isSelected ? '#000' : 'var(--accent)',
                          width: '32px', height: '32px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' 
                        }}>
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.9rem' }}>{m.name}</strong>
                          <small style={{ fontSize: '0.7rem', opacity: 0.6 }}>{m.role || 'Operative'}</small>
                        </div>
                      </div>
                      <ArrowRight size={14} style={{ opacity: isSelected ? 1 : 0.2, color: isSelected ? 'var(--accent)' : '#fff' }}/>
                    </div>

                    <div style={{ marginTop: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span className="mini-label" style={{ fontSize: '9px' }}>Current Load</span>
                        <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{activeTasks} Tasks</span>
                      </div>
                      <div style={{ height: '4px', background: 'rgba(74, 31, 69, 0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${Math.min(activeTasks * 25, 100)}%`,
                          height: '100%', 
                          background: activeTasks > 4 ? 'var(--danger)' : activeTasks > 2 ? 'var(--warning)' : 'var(--success)',
                          transition: 'width 0.5s ease'
                        }}></div>
                      </div>
                    </div>

                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.65rem', opacity: 0.5, textTransform: 'uppercase' }}>{m.department}</span>
                      {activeTasks === 0 && <span style={{ fontSize: '9px', color: 'var(--success)', fontWeight: 'bold' }}>AVAILABLE</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Dispatcher Panel */}
        <div className="col right glass" style={{ padding: '20px' }}>
          <div className="section-header" style={{ marginBottom: '20px' }}>
            <span className="mini-label">MISSION DISPATCHER</span>
          </div>

          {modal.show ? (
            <div style={{ animation: 'slideIn 0.3s ease' }}>
              <div className="ai-insight-box" style={{ background: 'rgba(92, 34, 82, 0.03)', border: '1px solid var(--accent-soft)', borderRadius: '12px', padding: '20px' }}>
                <div className="ai-head" style={{ color: 'var(--accent)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sparkles size={16}/> 
                  <span style={{ fontWeight: 'bold', letterSpacing: '0.5px' }}>TARGET: {modal.empName.toUpperCase()}</span>
                </div>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label className="mini-label"><Target size={10} style={{marginRight: '5px'}}/> OBJECTIVE</label>
                  <input 
                    className="glass-input" 
                    placeholder="Describe mission objective..." 
                    value={modal.title}
                    style={{ width: '100%', marginTop: '5px' }}
                    onChange={e => setModal({...modal, title: e.target.value})} 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="mini-label"><Calendar size={10} style={{marginRight: '5px'}}/> DEADLINE (LOCAL)</label>
                  <input 
                    type="datetime-local" 
                    className="glass-input" 
                    style={{ width: '100%', marginTop: '5px' }}
                    onChange={e => setModal({...modal, deadline: e.target.value})}
                  />
                </div>

                <button
                  className="action-btn" 
                  style={{ width: '100%', padding: '12px', background: 'var(--accent)', color: 'rgb(255, 255, 255)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} 
                  onClick={handleDeploy}
                >
                  <Zap size={16} fill="white"/> DEPLOY MISSION
                </button>
                
                <button
                  className="action-btn-mini" 
                  style={{ width: '100%', marginTop: '10px', padding: '10px', opacity: 0.6 }} 
                  onClick={() => setModal({ ...modal, show: false, empId: "", empName: "", title: "", deadline: "" })}
                >
                  ABORT DISPATCH
                </button>
              </div>

              <div style={{ marginTop: '20px', padding: '15px', borderRadius: '12px', background: 'rgba(74, 31, 69, 0.02)', border: '1px dashed rgba(74, 31, 69, 0.1)' }}>
                <p style={{ fontSize: '0.7rem', opacity: 0.5, margin: 0, lineHeight: '1.4' }}>
                  <ShieldAlert size={12} style={{ verticalAlign: 'middle', marginRight: '5px' }}/>
                  Deploying this task will alert the operative immediately. Ensure the objective is clear and the deadline is realistic.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 20px', opacity: 0.3 }}>
              <BrainCircuit size={48} style={{ marginBottom: '20px', color: 'var(--accent)' }}/>
              <p className="mini-label" style={{ fontSize: '11px' }}>Waiting for Target Selection</p>
              <p style={{ fontSize: '0.8rem' }}>Select an operative from your team directory to initialize the task dispatch protocol.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
