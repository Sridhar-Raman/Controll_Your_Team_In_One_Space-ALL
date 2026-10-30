import React, { useState, useEffect } from "react";
import axios from "axios";
import UserAvatar from "./UserAvatar";
import PasswordInput from "./PasswordInput";
import { API_URL } from "./apiConfig";

const MIN_PASSWORD_LENGTH = 8;

function DetailRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "16px",
        padding: "10px 0",
        borderBottom: "1px solid var(--line)",
      }}>
      <span style={{ opacity: 0.6, fontSize: "0.8rem" }}>{label}</span>
      <strong style={{ fontSize: "0.9rem", textAlign: "right" }}>
        {value || "—"}
      </strong>
    </div>
  );
}

export default function AccountTab({ token, showToast }) {
  const [account, setAccount] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => !cancelled && setAccount(res.data))
      .catch(() => !cancelled && setLoadError(true));
    return () => {
      cancelled = true;
    };
  }, [token]);

  const setField = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (form.next.length < MIN_PASSWORD_LENGTH) {
      return showToast(
        `New password must be at least ${MIN_PASSWORD_LENGTH} characters`,
        "error",
      );
    }
    if (form.next !== form.confirm) {
      return showToast("New passwords do not match", "error");
    }

    setSaving(true);
    try {
      await axios.post(
        `${API_URL}/auth/change-password`,
        { currentPassword: form.current, newPassword: form.next },
        authHeaders,
      );
      showToast("Password updated", "success");
      setForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      showToast(err.response?.data?.error || "Could not update password", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loadError) {
    return (
      <section className="page-content themed">
        <div className="glass card">Could not load your account details.</div>
      </section>
    );
  }

  if (!account) {
    return (
      <section className="page-content themed">
        <div className="glass card">Loading account...</div>
      </section>
    );
  }

  return (
    <section
      className="page-content themed"
      style={{
        // Details on the left, Change password on the right; the two stack on
        // narrow screens.
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "20px",
        alignItems: "start",
        alignContent: "start",
        maxWidth: "1000px",
      }}>
      <div
        className="glass card"
        style={{ padding: "24px", boxSizing: "border-box", width: "100%" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "16px",
          }}>
          <UserAvatar name={account.name} size={64} />
          <div>
            <h3 style={{ margin: 0 }}>{account.name}</h3>
            <span className="badge" style={{ fontSize: "0.7rem", opacity: 0.7 }}>
              {account.role}
            </span>
          </div>
        </div>

        <DetailRow label="Login email" value={account.email} />
        <DetailRow label="Role" value={account.role} />
        <DetailRow label="Department" value={account.department} />
        <DetailRow label="Team lead" value={account.lead?.name} />
        <DetailRow label="Manager" value={account.manager?.name} />
      </div>

      <form
        className="glass card"
        onSubmit={handleChangePassword}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}>
        <h3 style={{ margin: "0 0 6px" }}>Change password</h3>
        <PasswordInput
          className="glass-input"
          placeholder="Current password"
          autoComplete="current-password"
          required
          value={form.current}
          onChange={setField("current")}
        />
        <PasswordInput
          className="glass-input"
          placeholder={`New password (min ${MIN_PASSWORD_LENGTH} characters)`}
          autoComplete="new-password"
          required
          value={form.next}
          onChange={setField("next")}
        />
        <PasswordInput
          className="glass-input"
          placeholder="Confirm new password"
          autoComplete="new-password"
          required
          value={form.confirm}
          onChange={setField("confirm")}
        />
        <button type="submit" className="action-btn" disabled={saving}>
          {saving ? "Updating..." : "Update password"}
        </button>
      </form>
    </section>
  );
}
