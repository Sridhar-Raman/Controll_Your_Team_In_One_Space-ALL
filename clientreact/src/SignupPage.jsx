import React, { useState } from "react";
import axios from "axios";
import { CheckCircle2 } from "lucide-react";
import BrandLogo from "./BrandLogo";
import PasswordInput from "./PasswordInput";
import { API_URL } from "./apiConfig";

const DEPARTMENTS = ["Cloud", "Development", "Design", "Security", "QA", "General"];
const MIN_PASSWORD_LENGTH = 8;

const linkStyle = {
  background: "none",
  border: "none",
  padding: 0,
  color: "var(--accent)",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "inherit",
};

// Public sign-up: creates a *pending* Employee account that an admin must approve.
export default function SignupPage({ go }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const setField = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < MIN_PASSWORD_LENGTH) {
      return setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }
    if (form.password !== form.confirm) return setError("Passwords do not match");

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/auth/signup`, {
        name: form.name,
        email: form.email,
        department: form.department,
        password: form.password,
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || "Could not send your request. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="overlay login-screen" style={{ overflowY: "auto" }}>
      <div
        className="glass login-card"
        style={{ width: "min(440px, 92vw)", margin: "auto", textAlign: "left" }}>
        <BrandLogo size={48} caption="User management" spaced={false} onLight />

        {done ? (
          <div style={{ textAlign: "center", display: "grid", gap: 14, padding: "8px 0" }}>
            <CheckCircle2 size={46} style={{ color: "#2f7d4f", margin: "0 auto" }} />
            <h2 style={{ margin: 0 }}>Request sent</h2>
            <p style={{ margin: 0, color: "var(--ink-2)", lineHeight: 1.55 }}>
              An administrator will review your request. You will be able to log in
              with <strong>{form.email}</strong> once it is approved.
            </p>
            <button
              type="button"
              className="action-btn"
              onClick={() => go("login")}>
              Go to log in
            </button>
            <button type="button" style={linkStyle} onClick={() => go("")}>
              Back to home
            </button>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
            <div>
              <h2 style={{ margin: "4px 0 2px" }}>Request an account</h2>
              <div style={{ fontSize: "0.85rem", color: "var(--ink-2)" }}>
                An admin approves new accounts before you can log in.
              </div>
            </div>

            <input
              className="glass-input"
              placeholder="Full name"
              autoComplete="name"
              required
              maxLength={80}
              value={form.name}
              onChange={setField("name")}
            />
            <input
              className="glass-input"
              type="email"
              placeholder="Work email"
              autoComplete="email"
              required
              value={form.email}
              onChange={setField("email")}
            />
            <select
              className="custom-select"
              required
              value={form.department}
              onChange={setField("department")}
              aria-label="Department"
              style={{ height: 42 }}>
              <option value="" disabled>
                Select your department
              </option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <PasswordInput
              className="glass-input"
              placeholder={`Password (min ${MIN_PASSWORD_LENGTH} characters)`}
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={form.password}
              onChange={setField("password")}
            />
            <PasswordInput
              className="glass-input"
              placeholder="Confirm password"
              autoComplete="new-password"
              required
              value={form.confirm}
              onChange={setField("confirm")}
            />

            {error && (
              <div
                role="alert"
                style={{
                  color: "#b23b3b",
                  background: "rgba(178,59,59,0.08)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: "0.85rem",
                }}>
                {error}
              </div>
            )}

            <button type="submit" className="action-btn" disabled={submitting}>
              {submitting ? "Sending request..." : "Request account"}
            </button>

            <div style={{ textAlign: "center", fontSize: "0.88rem", color: "var(--ink-2)" }}>
              Already have an account?{" "}
              <button type="button" style={linkStyle} onClick={() => go("login")}>
                Log in
              </button>
              <div style={{ marginTop: 6 }}>
                <button type="button" style={linkStyle} onClick={() => go("")}>
                  Back to home
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
