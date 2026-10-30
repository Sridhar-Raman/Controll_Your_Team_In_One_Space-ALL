
import React, { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import "./App.css";
import { API_URL } from "./apiConfig";
import BrandLogo from "./BrandLogo";
import PasswordInput from "./PasswordInput";
import LandingPage from "./LandingPage";
import SignupPage from "./SignupPage";

// Each user only ever sees one dashboard, so load it on demand.
const AdminDashboard = lazy(() => import("./AdminDashboard"));
const EmployeeDashboard = lazy(() => import("./EmployeeDashboard"));
const ManagerDashboard = lazy(() => import("./ManagerDashboard"));
const LeadDashboard = lazy(() => import("./LeadDashboard"));

// Public pages use hash routes (#/, #/login, #/signup) so they work on any host.
const readRoute = () => window.location.hash.replace(/^#\/?/, "").split("?")[0];
const go = (route) => {
  window.location.hash = route ? `#/${route}` : "#/";
};

export default function App() {
  const [route, setRoute] = useState(readRoute);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState({
    id: localStorage.getItem("userId"),
    name: localStorage.getItem("userName"),
    role: localStorage.getItem("userRole"),
    lead_id: localStorage.getItem("leadId"),
    manager_id: localStorage.getItem("managerId"),
  });

  useEffect(() => {
    const onHash = () => setRoute(readRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const [toasts, setToasts] = useState([]);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // position "center" shows the toast in the middle of the screen (used for
  // the login confirmation); the default is the top-right corner.
  const showToast = (message, type = "info", position = "corner") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, position }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      position === "center" ? 2500 : 4000,
    );
  };

  const handleLogin = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      const { token: newToken, user: userData } = res.data;

      localStorage.setItem("token", newToken);
      localStorage.setItem("userId", userData.id);
      localStorage.setItem("userName", userData.name);
      localStorage.setItem("userRole", userData.role);
      localStorage.setItem("leadId", userData.lead_id || "");
      localStorage.setItem("managerId", userData.manager_id || "");

      setToken(newToken);
      setUser(userData);
      showToast("Logged in successfully", "success", "center");
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || "Invalid Credentials";
      showToast(msg, "error");
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    setLoggingOut(true);
    // Stop the time tracker before the token is discarded; never block logout on it.
    try {
      await axios.post(
        `${API_URL}/attendance/end`,
        {},
        { headers: { Authorization: `Bearer ${token}` }, timeout: 3000 },
      );
    } catch {
      /* offline or expired - log out regardless */
    }
    localStorage.clear();
    setToken(null);
    window.location.hash = "#/"; // signed-out visitors land on the home page
    window.location.reload();
  };

  // Tokens now expire: an authenticated request rejected with 401 means the
  // session is over, so send the user back to the login screen.
  useEffect(() => {
    const id = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 401 && localStorage.getItem("token")) {
          localStorage.clear();
          window.location.reload();
        }
        return Promise.reject(err);
      },
    );
    return () => axios.interceptors.response.eject(id);
  }, []);

  // Close the logout confirmation with Escape.
  useEffect(() => {
    if (!confirmingLogout) return;
    const onKey = (e) => e.key === "Escape" && !loggingOut && setConfirmingLogout(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmingLogout, loggingOut]);

  // Signed-out visitors: landing page by default, plus login and sign-up pages.
  if (!token) {
    if (route === "login") return <LoginOverlay onLogin={handleLogin} go={go} />;
    if (route === "signup") return <SignupPage go={go} />;
    return <LandingPage go={go} />;
  }

  // Every dashboard calls `logout`; it now asks for confirmation first.
  const dashboardProps = {
    token,
    user,
    showToast,
    logout: () => setConfirmingLogout(true),
  };

  return (
    <div className="app-container">
      <div id="toast-container">
        {toasts
          .filter((t) => t.position !== "center")
          .map((t) => (
            <div key={t.id} className={`toast ${t.type}`}>
              {t.message}
            </div>
          ))}
      </div>
      <div id="toast-center" role="status" aria-live="polite">
        {toasts
          .filter((t) => t.position === "center")
          .map((t) => (
            <div key={t.id} className={`toast toast-center ${t.type}`}>
              {t.type === "success" && <span aria-hidden="true">✓</span>}
              {t.message}
            </div>
          ))}
      </div>

      <Suspense fallback={null}>
        {user.role === "Admin" && <AdminDashboard {...dashboardProps} />}
        {user.role === "Manager" && <ManagerDashboard {...dashboardProps} />}
        {user.role === "Lead" && <LeadDashboard {...dashboardProps} />}
        {user.role === "Employee" && <EmployeeDashboard {...dashboardProps} />}
      </Suspense>

      {confirmingLogout && (
        <div
          className="overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
          onClick={() => !loggingOut && setConfirmingLogout(false)}>
          <div
            className="glass login-card"
            style={{ maxWidth: "360px", gap: "12px" }}
            onClick={(e) => e.stopPropagation()}>
            <h2 id="logout-title" style={{ margin: 0 }}>
              Log out?
            </h2>
            <p style={{ margin: 0, opacity: 0.8, fontSize: "0.9rem", textAlign: "center" }}>
              You will be signed out of SRI.cr user management
              {user.role !== "Admin" && " and your time tracker will stop"}.
            </p>
            <div style={{ display: "flex", gap: "10px", width: "100%" }}>
              <button
                className="action-btn"
                style={{ flex: 1, background: "rgba(74,31,69,0.08)", color: "inherit" }}
                autoFocus
                disabled={loggingOut}
                onClick={() => setConfirmingLogout(false)}>
                Cancel
              </button>
              <button
                className="action-btn"
                style={{ flex: 1 }}
                disabled={loggingOut}
                onClick={logout}>
                {loggingOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoginOverlay({ onLogin, go }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [uiError, setUiError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUiError("");
    setLoading(true);
    const result = await onLogin(email, password);
    if (!result.success) setUiError(result.message);
    setLoading(false);
  };

  return (
    <div className="overlay login-screen">
      <div className="glass login-card">
        <BrandLogo size={48} caption="User management" spaced={false} onLight />
        <form
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}>
          <input
            className="glass-input"
            placeholder="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <PasswordInput
            className="glass-input"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {uiError && (
            <div
              className="login-error-message"
              style={{
                color: "#ff4757",
                fontSize: "14px",
                textAlign: "center",
              }}>
              ⚠️ {uiError}
            </div>
          )}
          <button type="submit" className="action-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
          <div style={{ textAlign: "center", fontSize: "0.88rem", color: "var(--ink-2)" }}>
            New here?{" "}
            <button
              type="button"
              onClick={() => go("signup")}
              style={{ background: "none", border: "none", padding: 0, color: "var(--accent)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}>
              Request an account
            </button>
            <div style={{ marginTop: 6 }}>
              <button
                type="button"
                onClick={() => go("")}
                style={{ background: "none", border: "none", padding: 0, color: "var(--accent)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}>
                Back to home
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}