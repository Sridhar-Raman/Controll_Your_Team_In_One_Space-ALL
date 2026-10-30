

import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import "./App.css";
import { io } from "socket.io-client";
import { RiLogoutCircleRLine } from "react-icons/ri";

import { Radar } from "react-chartjs-2";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  MessageSquare,
  Home,
  Folder,
  Clock,
  FileText,
  Calendar,
  LogOut,
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

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

// Import your components
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

export default function EmployeeDashboard({ token, user, showToast, logout }) {
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
              {user.role || "EMPLOYEE"}
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
        {currentPage === "leave" && (
          <LeaveCenter token={token} showToast={showToast} />
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
