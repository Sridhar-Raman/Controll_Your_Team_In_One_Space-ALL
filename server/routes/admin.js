

const router = require("express").Router();
const User = require("../models/User");
const LeaveRequest = require("../models/LeaveRequest");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { verifyToken, authorize } = require("../middleware/auth");

// 1. GET: Dashboard Stats
router.get(
  "/dashboard-stats",
  verifyToken,
  authorize("Admin"),
  async (req, res) => {
    try {
      const users = await User.find({ status: { $nin: ["Pending", "Rejected"] } })
        .select("-password")
        .populate("lead_id", "name")
        .populate("manager_id", "name")
        .lean();
      const totalBurn = users.reduce((sum, u) => sum + (u.salary || 0), 0);
      res.json({ totalSalaryBurn: totalBurn, employees: users });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// 2. GET: Public Talent Hub
router.get("/talent-hub", verifyToken, async (req, res) => {
  try {
    // Exclude assignedTasks: this endpoint is visible to every user.
    const users = await User.find(
      { status: { $nin: ["Pending", "Rejected"] } },
      "name role department pulseStatus performance.endorsements performance.endorsedBy",
    ).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GET: All Leave Requests
router.get(
  "/leave-requests",
  verifyToken,
  authorize("Admin"),
  async (req, res) => {
    try {
      const requests = await LeaveRequest.find()
        .populate("employeeId", "name department")
        .sort({ _id: -1 })
        .lean();
      res.json(requests);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// 4. PATCH: Update Leave Status
router.patch(
  "/leave-status/:id",
  verifyToken,
  authorize("Admin"),
  async (req, res) => {
    try {
      const { status } = req.body;
      if (!LeaveRequest.schema.path("status").enumValues.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      // updatedAt drives the employee's leave notifications.
      const updated = await LeaveRequest.findByIdAndUpdate(
        req.params.id,
        { status, updatedAt: new Date() },
        { new: true },
      );
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// 5. POST: Assign Task
router.post(
  "/assign-task",
  verifyToken,
  authorize("Admin"),
  async (req, res) => {
    try {
      const { employeeId, title, deadline } = req.body;
      if (!employeeId || !title || !deadline)
        return res.status(400).json({ error: "Missing data" });

      const admin = await User.findById(req.user.id, "name role").lean();
      const result = await User.updateOne(
        { _id: employeeId },
        {
          $push: {
            "performance.assignedTasks": {
              title,
              deadline: new Date(deadline),
              status: "Pending",
              assignedBy: { name: admin.name, role: admin.role, id: admin._id },
            },
          },
        },
      );
      if (!result.matchedCount)
        return res.status(404).json({ error: "Employee not found" });

      res.json({ message: "Task Assigned!" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// 6. GET: Global Task Monitor
router.get("/all-tasks", verifyToken, authorize("Admin"), async (req, res) => {
  try {
    const users = await User.find({}, "name performance.assignedTasks").lean();
    const allTasks = users.flatMap((u) =>
      (u.performance?.assignedTasks || []).map((t) => ({
        ...t,
        employeeName: u.name,
      })),
    );
    res.json(allTasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. POST: Add New Employee
router.post(
  "/add-employee",
  verifyToken,
  authorize("Admin"),
  async (req, res) => {
    try {
      const { name, email, role, department, password, lead_id, manager_id } =
        req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string" ||
        !/^\S+@\S+\.\S+$/.test(email.trim())
      ) {
        return res.status(400).json({ error: "Enter a valid name, email and password" });
      }
      if (password.length < 8) {
        return res
          .status(400)
          .json({ error: "Password must be at least 8 characters" });
      }
      if (role && !User.schema.path("role").enumValues.includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      if (await User.exists({ email: email.trim() })) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const finalLeadId = lead_id || null;
      const finalManagerId = manager_id || null;

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        name: name.trim(),
        email: email.trim(),
        role,
        department,
        password: hashedPassword,
        lead_id: finalLeadId,
        manager_id: finalManagerId,
        salary: role === "Manager" ? 80000 : role === "Lead" ? 65000 : 45000,
        performance: {
          endorsements: 0,
          endorsedBy: [],
          assignedTasks: [],
        },
      });

      await newUser.save();
      res.status(201).json({
        message: "Employee created successfully",
        user: {
          id: newUser._id,
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          department: newUser.department,
        },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// 8. GET: Hierarchy Options
router.get(
  "/hierarchy-options",
  verifyToken,
  authorize("Admin"),
  async (req, res) => {
    try {
      const { role, department } = req.query;
      const query = { status: { $nin: ["Pending", "Rejected"] } };
      if (role) query.role = role;
      if (department) query.department = department;
      const users = await User.find(query, "name _id").lean();
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// 10. GET: Login accounts (no password data)
router.get("/users", verifyToken, authorize("Admin"), async (req, res) => {
  try {
    const users = await User.find(
      {},
      "name email role department status performance.assignedTasks",
    )
      .sort({ name: 1 })
      .lean();

    // Send the open-task count (for workload), not every task document.
    res.json(
      users.map(({ performance, ...u }) => ({
        ...u,
        status: u.status || "Active",
        openTasks: (performance?.assignedTasks || []).filter(
          (t) => t.status !== "Completed",
        ).length,
      })),
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. POST: Reset a user's password to a one-time temporary value.
// Passwords are bcrypt-hashed and cannot be read back, so a reset is the
// only way for an admin to hand someone working login details.
router.post(
  "/users/:id/reset-password",
  verifyToken,
  authorize("Admin"),
  async (req, res) => {
    try {
      // Unambiguous characters only (no 0/O, 1/l/I) so it is easy to read out.
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
      const tempPassword = Array.from(
        crypto.randomBytes(12),
        (b) => alphabet[b % alphabet.length],
      ).join("");

      const user = await User.findById(req.params.id, "name email");
      if (!user) return res.status(404).json({ error: "User not found" });

      user.password = await bcrypt.hash(tempPassword, 10);
      await user.save();

      res.json({ name: user.name, email: user.email, tempPassword });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// 12. POST: Approve a pending (or previously rejected) sign-up request
router.post(
  "/users/:id/approve",
  verifyToken,
  authorize("Admin"),
  async (req, res) => {
    try {
      const result = await User.updateOne(
        { _id: req.params.id, status: { $in: ["Pending", "Rejected"] } },
        { status: "Active" },
      );
      if (!result.matchedCount) {
        return res.status(404).json({ error: "No pending request for this user" });
      }
      res.json({ message: "Account approved" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// 13. POST: Reject a pending sign-up request (the record is kept so the email stays taken)
router.post(
  "/users/:id/reject",
  verifyToken,
  authorize("Admin"),
  async (req, res) => {
    try {
      const result = await User.updateOne(
        { _id: req.params.id, status: "Pending" },
        { status: "Rejected" },
      );
      if (!result.matchedCount) {
        return res.status(404).json({ error: "No pending request for this user" });
      }
      res.json({ message: "Request rejected" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

module.exports = router;
