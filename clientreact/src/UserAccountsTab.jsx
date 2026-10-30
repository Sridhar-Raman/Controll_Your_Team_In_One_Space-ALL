import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import UserAvatar from "./UserAvatar";
import PasswordInput from "./PasswordInput";
import { API_URL } from "./apiConfig";

const ROLES = ["All", "Employee", "Lead", "Manager", "Admin"];
const CREATE_ROLES = ["Employee", "Lead", "Manager", "Admin"];
const DEPARTMENTS = ["Cloud", "Development", "Design", "Security", "QA", "Executive", "General"];
const MIN_PASSWORD_LENGTH = 8;
const LOADS = ["All", "Ready", "Busy", "Overloaded"];
// Workload buckets from the open-task count (same thresholds the old Task Dispatcher used).
const loadOf = (n) => (n === 0 ? "Ready" : n < 4 ? "Busy" : "Overloaded");
// Darker status shades so the badges stay readable on the cream cards.
const LOAD_COLOR = { Ready: "#2f7d4f", Busy: "#a8741a", Overloaded: "#b23b3b" };
const EMPTY_FORM = {
  name: "",
  email: "",
  role: "Employee",
  department: "Cloud",
  password: "",
  lead_id: "",
  manager_id: "",
};

// Readable random password (no 0/O, 1/l/I) from the browser's secure RNG.
const generatePassword = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => alphabet[b % alphabet.length]).join("");
};

// Label above a control; keeps every field in the create form the same shape.
function Field({ label, children }) {
  return (
    <label className="uf-label">
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function UserAccountsTab({ token, showToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [loadFilter, setLoadFilter] = useState("All");
  const [pendingOnly, setPendingOnly] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const [confirmUser, setConfirmUser] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [issued, setIssued] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [assignUser, setAssignUser] = useState(null);
  const [task, setTask] = useState({ title: "", deadline: "" });
  const [assigning, setAssigning] = useState(false);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => !cancelled && setUsers(res.data))
      .catch(() => !cancelled && showToast("Could not load user accounts", "error"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const pendingCount = users.filter((u) => u.status === "Pending").length;
  // The "pending only" filter lapses by itself once no requests are left.
  const pendingFilterOn = pendingOnly && pendingCount > 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(
      (u) =>
        (roleFilter === "All" || u.role === roleFilter) &&
        (deptFilter === "All" || u.department === deptFilter) &&
        (loadFilter === "All" || loadOf(u.openTasks || 0) === loadFilter) &&
        (!pendingFilterOn || u.status === "Pending") &&
        (!q ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)),
    );
  }, [users, search, roleFilter, deptFilter, loadFilter, pendingFilterOn]);

  // Approve or reject a self-service sign-up request.
  const reviewRequest = async (u, action) => {
    setReviewingId(u._id);
    try {
      await axios.post(`${API_URL}/admin/users/${u._id}/${action}`, {}, authHeaders);
      const status = action === "approve" ? "Active" : "Rejected";
      setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, status } : x)));
      showToast(
        action === "approve" ? `${u.name} approved - they can now log in` : `${u.name}'s request was rejected`,
        "success",
      );
    } catch (err) {
      showToast(err.response?.data?.error || "Could not update the request", "error");
    } finally {
      setReviewingId(null);
    }
  };

  const setField = (key) => (e) => {
    const value = e.target.value;
    // Lead/manager choices belong to a department, so clear them when it changes.
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "department" ? { lead_id: "", manager_id: "" } : {}),
    }));
  };

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, password: generatePassword() });
    setShowCreate(true);
  };

  const leadOptions = users.filter((u) => u.role === "Lead" && u.department === form.department);
  const managerOptions = users.filter((u) => u.role === "Manager" && u.department === form.department);

  const openAssign = (u) => {
    setTask({ title: "", deadline: "" });
    setAssignUser(u);
  };

  const assignTask = async (e) => {
    e.preventDefault();
    if (new Date(task.deadline) <= new Date()) {
      return showToast("Deadline must be in the future", "error");
    }
    setAssigning(true);
    try {
      await axios.post(
        `${API_URL}/admin/assign-task`,
        {
          employeeId: assignUser._id,
          title: task.title.trim(),
          deadline: new Date(task.deadline).toISOString(),
        },
        authHeaders,
      );
      setUsers((prev) =>
        prev.map((u) =>
          u._id === assignUser._id ? { ...u, openTasks: (u.openTasks || 0) + 1 } : u,
        ),
      );
      showToast(`Task assigned to ${assignUser.name}`, "success");
      setAssignUser(null);
    } catch (err) {
      showToast(err.response?.data?.error || "Could not assign task", "error");
    } finally {
      setAssigning(false);
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    if (form.password.length < MIN_PASSWORD_LENGTH) {
      return showToast(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`, "error");
    }
    setCreating(true);
    try {
      const res = await axios.post(`${API_URL}/admin/add-employee`, form, authHeaders);
      setUsers((prev) =>
        [...prev, res.data.user].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setIssued({
        created: true,
        name: res.data.user.name,
        email: res.data.user.email,
        tempPassword: form.password,
      });
      setShowCreate(false);
    } catch (err) {
      showToast(err.response?.data?.error || "Could not create user", "error");
    } finally {
      setCreating(false);
    }
  };

  const resetPassword = async () => {
    setResetting(true);
    try {
      const res = await axios.post(
        `${API_URL}/admin/users/${confirmUser._id}/reset-password`,
        {},
        authHeaders,
      );
      setIssued(res.data);
      setConfirmUser(null);
    } catch (err) {
      showToast(err.response?.data?.error || "Reset failed", "error");
    } finally {
      setResetting(false);
    }
  };

  const copyCredentials = async () => {
    try {
      await navigator.clipboard.writeText(
        `Email: ${issued.email}\nTemporary password: ${issued.tempPassword}`,
      );
      showToast("Copied to clipboard", "success");
    } catch {
      showToast("Copy failed - select the text manually", "error");
    }
  };

  const overlay = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };

  return (
    <section
      className="page-content themed"
      style={{ display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto" }}>
      <div className="glass card" style={{ padding: "20px" }}>
        <h3 style={{ margin: "0 0 14px" }}>
          User Accounts ({filtered.length}/{users.length})
        </h3>
        {pendingCount > 0 && (
          <div
            role="status"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              padding: "10px 14px",
              marginBottom: 14,
              borderRadius: 12,
              background: "#f3e3c4",
              color: "#6b4a0e",
              fontSize: "0.88rem",
            }}>
            <span>
              <strong>{pendingCount}</strong> sign-up request{pendingCount === 1 ? "" : "s"} waiting for approval
            </span>
            <button
              type="button"
              className="action-btn small"
              onClick={() => setPendingOnly((v) => !v)}>
              {pendingFilterOn ? "Show all users" : "Review requests"}
            </button>
          </div>
        )}
        <div className="uf-toolbar">
          <input
            className="glass-input uf-field uf-search"
            placeholder="Search name or email..."
            aria-label="Search users"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="custom-select uf-field uf-role"
            aria-label="Filter by role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r === "All" ? "All Roles" : r}
              </option>
            ))}
          </select>
          <select
            className="custom-select uf-field uf-role"
            aria-label="Filter by department"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="All">All Depts</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            className="custom-select uf-field uf-role"
            aria-label="Filter by workload"
            value={loadFilter}
            onChange={(e) => setLoadFilter(e.target.value)}>
            {LOADS.map((l) => (
              <option key={l} value={l}>
                {l === "All" ? "Any Load" : l}
              </option>
            ))}
          </select>
          <button className="action-btn uf-btn" onClick={openCreate}>
            + Create user
          </button>
        </div>
        <p style={{ opacity: 0.6, fontSize: "0.75rem", margin: "0 0 14px" }}>
          Passwords are stored encrypted and cannot be viewed. Reset a password
          to issue new login details.
        </p>

        {loading ? (
          <div style={{ opacity: 0.7 }}>Loading accounts...</div>
        ) : filtered.length === 0 ? (
          <div style={{ opacity: 0.7 }}>No accounts match.</div>
        ) : (
          filtered.map((u) => (
            <div
              key={u._id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "10px 0",
                borderBottom: "1px solid var(--line)",
              }}>
              <UserAvatar name={u.name} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: "0.9rem" }}>{u.name}</strong>
                <div style={{ opacity: 0.6, fontSize: "0.75rem" }}>
                  {u.email} • {u.role} • {u.department}
                </div>
              </div>
              {u.status === "Pending" || u.status === "Rejected" ? (
                <>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      whiteSpace: "nowrap",
                      padding: "3px 10px",
                      borderRadius: "999px",
                      border: `1px solid ${u.status === "Pending" ? "#a8741a" : "#b23b3b"}`,
                      color: u.status === "Pending" ? "#a8741a" : "#b23b3b",
                    }}>
                    {u.status === "Pending" ? "Awaiting approval" : "Rejected"}
                  </span>
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    <button
                      className="action-btn small"
                      disabled={reviewingId === u._id}
                      onClick={() => reviewRequest(u, "approve")}>
                      Approve
                    </button>
                    {u.status === "Pending" && (
                      <button
                        className="action-btn small uf-btn-ghost"
                        disabled={reviewingId === u._id}
                        onClick={() => reviewRequest(u, "reject")}>
                        Reject
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <span
                    title="Open (not completed) tasks"
                    style={{
                      fontSize: "0.7rem",
                      whiteSpace: "nowrap",
                      padding: "3px 10px",
                      borderRadius: "999px",
                      border: `1px solid ${LOAD_COLOR[loadOf(u.openTasks || 0)]}`,
                      color: LOAD_COLOR[loadOf(u.openTasks || 0)],
                    }}>
                    {loadOf(u.openTasks || 0)} • {u.openTasks || 0} open
                  </span>
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    <button
                      className="action-btn small"
                      onClick={() => openAssign(u)}>
                      Assign task
                    </button>
                    <button
                      className="action-btn small"
                      onClick={() => setConfirmUser(u)}>
                      Reset password
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {showCreate && (
        <div style={overlay} onClick={() => !creating && setShowCreate(false)}>
          <form
            className="glass card uf-form"
            onSubmit={createUser}
            onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0 }}>Create user</h3>

            <Field label="Full name">
              <input
                className="glass-input uf-field"
                placeholder="e.g. Priya Nair"
                required
                autoFocus
                value={form.name}
                onChange={setField("name")}
              />
            </Field>

            <Field label="Login email">
              <input
                className="glass-input uf-field"
                type="email"
                placeholder="name@company.com"
                required
                value={form.email}
                onChange={setField("email")}
              />
            </Field>

            <div className="uf-row">
              <Field label="Role">
                <select
                  className="custom-select uf-field"
                  value={form.role}
                  onChange={setField("role")}>
                  {CREATE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Department">
                <select
                  className="custom-select uf-field"
                  value={form.department}
                  onChange={setField("department")}>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {(form.role === "Employee" || form.role === "Lead") && (
              <div className="uf-row">
                {form.role === "Employee" && (
                  <Field label="Team lead">
                    <select
                      className="custom-select uf-field"
                      value={form.lead_id}
                      onChange={setField("lead_id")}>
                      <option value="">None</option>
                      {leadOptions.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                <Field label="Manager">
                  <select
                    className="custom-select uf-field"
                    value={form.manager_id}
                    onChange={setField("manager_id")}>
                    <option value="">None</option>
                    {managerOptions.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            )}

            <Field label={`Password (min ${MIN_PASSWORD_LENGTH} characters)`}>
              <div className="uf-pw">
                <PasswordInput
                  defaultVisible
                  className="glass-input uf-field"
                  style={{ fontFamily: "monospace" }}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  value={form.password}
                  onChange={setField("password")}
                />
                <button
                  type="button"
                  className="action-btn uf-btn"
                  onClick={() => setForm((p) => ({ ...p, password: generatePassword() }))}>
                  Generate
                </button>
              </div>
            </Field>

            <div className="uf-actions">
              <button
                type="button"
                className="action-btn uf-btn uf-btn-ghost"
                disabled={creating}
                onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button type="submit" className="action-btn uf-btn" disabled={creating}>
                {creating ? "Creating..." : "Create user"}
              </button>
            </div>
          </form>
        </div>
      )}

      {assignUser && (
        <div style={overlay} onClick={() => !assigning && setAssignUser(null)}>
          <form
            className="glass card uf-form"
            onSubmit={assignTask}
            onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0 }}>Assign task</h3>
            <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>
              To {assignUser.name} • {assignUser.role} • {assignUser.department}
            </div>

            <Field label="Task / objective">
              <input
                className="glass-input uf-field"
                placeholder="Describe what needs to be done"
                required
                autoFocus
                maxLength={200}
                value={task.title}
                onChange={(e) => setTask((p) => ({ ...p, title: e.target.value }))}
              />
            </Field>

            <Field label="Deadline">
              <input
                className="glass-input uf-field"
                type="datetime-local"
                required
                value={task.deadline}
                onChange={(e) => setTask((p) => ({ ...p, deadline: e.target.value }))}
              />
            </Field>

            <div className="uf-actions">
              <button
                type="button"
                className="action-btn uf-btn uf-btn-ghost"
                disabled={assigning}
                onClick={() => setAssignUser(null)}>
                Cancel
              </button>
              <button type="submit" className="action-btn uf-btn" disabled={assigning}>
                {assigning ? "Assigning..." : "Assign task"}
              </button>
            </div>
          </form>
        </div>
      )}

      {confirmUser && (
        <div style={overlay} onClick={() => !resetting && setConfirmUser(null)}>
          <div
            className="glass card"
            style={{ padding: "24px", maxWidth: "380px" }}
            onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Reset password?</h3>
            <p style={{ opacity: 0.8, fontSize: "0.85rem" }}>
              {confirmUser.name} ({confirmUser.email}) will be locked out of
              their current password immediately and given a temporary one.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                className="action-btn small"
                disabled={resetting}
                onClick={() => setConfirmUser(null)}>
                Cancel
              </button>
              <button
                className="action-btn small"
                disabled={resetting}
                onClick={resetPassword}>
                {resetting ? "Resetting..." : "Reset"}
              </button>
            </div>
          </div>
        </div>
      )}

      {issued && (
        <div style={overlay}>
          <div
            className="glass card"
            style={{ padding: "24px", maxWidth: "420px" }}>
            <h3 style={{ marginTop: 0 }}>
              {issued.created ? "User created" : "New login details"}
            </h3>
            <p style={{ opacity: 0.8, fontSize: "0.8rem" }}>
              Shown once only. Share it securely and ask {issued.name} to
              change it from My Account after signing in.
            </p>
            <div
              style={{
                background: "rgba(74,31,69,0.06)",
                borderRadius: "8px",
                padding: "12px",
                fontFamily: "monospace",
                fontSize: "0.9rem",
                userSelect: "all",
                lineHeight: 1.7,
              }}>
              <div>Email: {issued.email}</div>
              <div>Password: {issued.tempPassword}</div>
            </div>
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
                marginTop: "16px",
              }}>
              <button className="action-btn small" onClick={copyCredentials}>
                Copy
              </button>
              <button className="action-btn small" onClick={() => setIssued(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
