import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "./apiConfig";

const pad = (n) => n.toString().padStart(2, "0");

const formatElapsed = (from, to) => {
  const diff = Math.max(0, Math.floor((to - from) / 1000));
  return `${pad(Math.floor(diff / 3600))}:${pad(Math.floor((diff % 3600) / 60))}:${pad(diff % 60)}`;
};

// Time tracker for the logged-in user. There is no manual check-in: the server
// starts today's session at login, and this hook makes sure it is running and
// ticks the "hours worked today" timer. Pass enabled=false (admins) to turn
// tracking off entirely.
export default function useAttendance(token, enabled = true) {
  const [attendance, setAttendance] = useState(null);
  const [timer, setTimer] = useState("00:00:00");

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    axios
      .post(
        `${API_URL}/attendance/start`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .then((res) => !cancelled && setAttendance(res.data))
      .catch((err) => console.error("Could not start time tracker:", err));
    return () => {
      cancelled = true;
    };
  }, [token, enabled]);

  useEffect(() => {
    if (!attendance?.checkInTime) {
      setTimer("00:00:00");
      return;
    }
    const start = new Date(attendance.checkInTime);

    if (attendance.checkOutTime) {
      setTimer(formatElapsed(start, new Date(attendance.checkOutTime)));
      return;
    }

    const tick = () => setTimer(formatElapsed(start, new Date()));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [attendance]);

  return { attendance, timer };
}
