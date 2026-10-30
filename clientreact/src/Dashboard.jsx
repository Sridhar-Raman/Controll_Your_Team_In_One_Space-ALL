import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
} from "recharts";

import { CalendarCheck, Clock, AlertTriangle, TrendingUp, Users } from "lucide-react";
import { API_URL } from "./apiConfig";

// Chart ink for the light cream cards.
const INK = {
  series: "#7d3d71",
  primary: "#2a1530",
  secondary: "#5d4a5b",
  muted: "#8b7a89",
  grid: "rgba(74, 31, 69, 0.12)",
  axis: "rgba(74, 31, 69, 0.28)",
};

// Pastel chip colours for the tile icons (background, icon).
const TONES = {
  lilac: ["#eadbe6", "#6a2c5e"],
  amber: ["#f3e3c4", "#a8741a"],
  green: ["#d9ebe0", "#2f7d4f"],
  red: ["#f7d9d9", "#b23b3b"],
};

const TASK_STATUSES = ["Pending", "Planning", "Processing", "Completed"];
const DAILY_TARGET_HOURS = 8;

// Attendance dates are UTC "YYYY-MM-DD" strings, so bucket days the same way.
const dayKey = (d) => d.toISOString().slice(0, 10);

function lastSevenDays() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    days.push({
      key: dayKey(d),
      label: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
    });
  }
  return days;
}

const sessionHours = (rec) => {
  if (!rec?.checkInTime) return 0;
  const end = rec.checkOutTime ? new Date(rec.checkOutTime) : new Date();
  return Math.max(0, (end - new Date(rec.checkInTime)) / 3600000);
};

function StatTile({ label, value, sub, icon: Icon, tone = "lilac" }) {
  const [chipBg, chipFg] = TONES[tone];
  return (
    <div
      className="glass card"
      style={{ padding: "18px 20px", minWidth: 0, display: "flex", alignItems: "center", gap: "16px" }}>
      <div
        aria-hidden="true"
        style={{
          width: 56,
          height: 56,
          flexShrink: 0,
          borderRadius: 14,
          background: chipBg,
          color: chipFg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
        {Icon && <Icon size={26} />}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "1.9rem", fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: "0.95rem", color: INK.secondary, marginTop: 2 }}>
          {label.charAt(0) + label.slice(1).toLowerCase()}
        </div>
        {sub && <div style={{ fontSize: "0.75rem", color: INK.muted }}>{sub}</div>}
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children, tableRows }) {
  return (
    <div
      className="glass card"
      style={{
        padding: 0,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        minHeight: 0,
        position: "relative",
        overflow: "hidden",
      }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 12,
          padding: "16px 22px",
          borderBottom: "1px solid var(--line)",
        }}>
        <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{title}</h3>
        {subtitle && (
          <div style={{ fontSize: "0.82rem", color: INK.secondary, textAlign: "right" }}>
            {subtitle}
          </div>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "14px 18px 16px" }}>
        {children}
      </div>
      {/* Screen-reader table view of the same data */}
      {tableRows && (
        <table
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            overflow: "hidden",
            clip: "rect(0 0 0 0)",
          }}>
          <caption>{title}</caption>
          <tbody>
            {tableRows.map(([k, v]) => (
              <tr key={k}>
                <th scope="row">{k}</th>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function BarTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#2a1530",
        border: "none",
        borderRadius: 8,
        padding: "6px 10px",
        fontSize: "0.78rem",
        color: "#fff",
      }}>
      <div style={{ color: "#d6bad0" }}>{label}</div>
      <strong>
        {payload[0].value}
        {typeof unit === "function" ? unit(payload[0].value) : unit}
      </strong>
    </div>
  );
}

function Dashboard({ token, showToast, userRole }) {
  const isAdmin = userRole === "Admin";

  const [teamSize, setTeamSize] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const [metrics, setMetrics] = useState({
    tasks: 0,
    speed: 0,
    quality: 0,
    onTime: 0,
    efficiency: 0,
  });

  const fetchData = async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const days = lastSevenDays();
    const months = [...new Set(days.map((d) => `${d.year}/${d.month}`))];

    try {
      const [metricRes, tasksRes, ...extraRes] = await Promise.all([
        axios.get(`${API_URL}/employee/performance-metrics`, { headers }),
        // Admins see company-wide tasks; everyone else sees their own.
        isAdmin
          ? axios.get(`${API_URL}/admin/all-tasks`, { headers })
          : axios.get(`${API_URL}/employee/me`, { headers }),
        // Admins get the headcount; everyone else gets their weekly hours
        // (admins are not time-tracked).
        ...(isAdmin
          ? [axios.get(`${API_URL}/admin/users`, { headers })]
          : months.map((m) => axios.get(`${API_URL}/attendance/history/${m}`, { headers }))),
      ]);

      setMetrics(metricRes.data);
      setTasks(
        isAdmin ? tasksRes.data : tasksRes.data.performance?.assignedTasks || [],
      );
      if (isAdmin) setTeamSize(extraRes[0].data.length);
      else setAttendance(extraRes.flatMap((r) => r.data));
    } catch (e) {
      console.error("Fetch Error:", e);
      showToast("Could not load dashboard data", "error");
    }
  };

  useEffect(() => {
    if (token) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const taskStats = useMemo(() => {
    const now = Date.now();
    const byStatus = TASK_STATUSES.map((status) => ({
      status,
      count: tasks.filter((t) => t.status === status).length,
    }));
    const completed = byStatus.find((s) => s.status === "Completed").count;
    const overdue = tasks.filter(
      (t) => t.status !== "Completed" && t.deadline && new Date(t.deadline) < now,
    ).length;
    return { byStatus, completed, overdue, total: tasks.length };
  }, [tasks]);

  const weekHours = useMemo(() => {
    const byDay = new Map(attendance.map((rec) => [rec.date, sessionHours(rec)]));
    return lastSevenDays().map((d) => ({
      day: d.label,
      hours: Math.round((byDay.get(d.key) || 0) * 10) / 10,
    }));
  }, [attendance]);

  const weekTotal = Math.round(weekHours.reduce((s, d) => s + d.hours, 0) * 10) / 10;

  const axisProps = {
    tick: { fill: INK.muted, fontSize: 11 },
    axisLine: { stroke: INK.axis },
    tickLine: false,
  };
  const scopeLabel = isAdmin ? "company-wide" : "your tasks";

  return (
    <section
      className="page-content themed"
      style={{
        padding: 0, // no side inset, so tiles and charts span the same width as the header card
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}>
      {/* Headline numbers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(150px, 100%), 1fr))",
          gap: "16px",
          flexShrink: 0,
        }}>
        <StatTile
          icon={CalendarCheck}
          tone="lilac"
          label={isAdmin ? "TOTAL TASKS" : "TASKS DONE"}
          value={isAdmin ? taskStats.total : `${taskStats.completed}/${taskStats.total}`}
          sub={isAdmin ? `${taskStats.completed} completed` : "completed of assigned"}
        />
        {isAdmin ? (
          <StatTile icon={Users} tone="red" label="TEAM MEMBERS" value={teamSize} sub="registered users" />
        ) : (
          <StatTile icon={Clock} tone="amber" label="HOURS THIS WEEK" value={`${weekTotal} hrs`} sub="last 7 days" />
        )}
        <StatTile
          icon={AlertTriangle}
          tone="red"
          label="OVERDUE"
          value={taskStats.overdue}
          sub={taskStats.overdue ? "need attention" : "all on schedule"}
        />
        <StatTile
          icon={TrendingUp}
          tone="green"
          label="EFFICIENCY"
          value={`${metrics.efficiency || 0}%`}
          sub="weighted score"
        />
      </div>

      {/* Charts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
          gridAutoRows: "minmax(220px, 1fr)",
          gap: "16px",
          flex: 1,
          minHeight: 0,
        }}>
        <ChartCard
          title="Tasks by Status"
          subtitle={`${scopeLabel}`}
          tableRows={taskStats.byStatus.map((s) => [s.status, `${s.count} tasks`])}>
          <div style={{ flex: 1, minHeight: 0, position: "relative" }}><div style={{ position: "absolute", inset: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={taskStats.byStatus}
                margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={INK.grid} />
                <XAxis dataKey="status" {...axisProps} />
                <YAxis {...axisProps} allowDecimals={false} />
                <RechartsTooltip
                  cursor={{ fill: "rgba(74, 31, 69, 0.06)" }}
                  content={<BarTooltip unit={(n) => (n === 1 ? " task" : " tasks")} />}
                />
                <Bar
                  dataKey="count"
                  fill={INK.series}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={56}
                />
              </BarChart>
            </ResponsiveContainer>
          </div></div>
        </ChartCard>

        {!isAdmin && (
          <ChartCard
            title="Hours Worked"
            subtitle={`Last 7 days, dashed line = ${DAILY_TARGET_HOURS}h target`}
            tableRows={weekHours.map((d) => [d.day, `${d.hours} hours`])}>
            <div style={{ flex: 1, minHeight: 0, position: "relative" }}><div style={{ position: "absolute", inset: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekHours} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={INK.grid} />
                  <XAxis dataKey="day" {...axisProps} />
                  <YAxis
                    {...axisProps}
                    domain={[0, 10]}
                    ticks={[0, 2, 4, 6, 8, 10]}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "rgba(74, 31, 69, 0.06)" }}
                    content={<BarTooltip unit=" hrs" />}
                  />
                  <ReferenceLine
                    y={DAILY_TARGET_HOURS}
                    stroke={INK.muted}
                    strokeDasharray="4 4"
                  />
                  <Bar
                    dataKey="hours"
                    fill={INK.series}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div></div>
          </ChartCard>
        )}
      </div>
    </section>
  );
}

export default Dashboard;
