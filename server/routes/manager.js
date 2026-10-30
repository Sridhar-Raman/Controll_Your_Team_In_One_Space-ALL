

const router = require("express").Router();
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const Report = require("../models/Report");
const { verifyToken, authorize } = require("../middleware/auth");

// Internal Helper: Ensures Manager only accesses users in their department
const checkDeptAccess = async (managerId, targetUserId) => {
  const [manager, target] = await Promise.all([
    User.findById(managerId, "department").lean(),
    User.findById(targetUserId, "department").lean(),
  ]);
  return !!(manager && target && manager.department === target.department);
};

const getDepartment = async (userId) =>
  (await User.findById(userId, "department").lean())?.department;

// ✅ GET MANAGER'S PROFILE
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password").lean();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Department Leads for Task Assignment
router.get("/my-leads", verifyToken, authorize("Manager"), async (req, res) => {
  try {
    const leads = await User.find(
      {
        role: "Lead",
        department: await getDepartment(req.user.id),
      },
      "name role department performance",
    ).lean();
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post(
  "/assign-task-to-lead",
  verifyToken,
  authorize("Manager"),
  async (req, res) => {
    try {
      const { leadId, title, deadline } = req.body;
      const manager = await User.findById(
        req.user.id,
        "name role department",
      ).lean();
      // Only leads in the manager's own department are valid targets.
      const result = await User.updateOne(
        { _id: leadId, role: "Lead", department: manager.department },
        {
          $push: {
            "performance.assignedTasks": {
              title,
              deadline: new Date(deadline),
              status: "Pending",
              assignedBy: {
                name: manager.name,
                role: manager.role,
                id: manager._id,
              },
            },
          },
        },
      );
      if (!result.matchedCount) {
        return res.status(404).json({ error: "Lead target not found" });
      }

      res.json({ message: "Task deployed to Lead!" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// GET: Summary of Leads
router.get(
  "/leads-summary",
  verifyToken,
  authorize("Manager"),
  async (req, res) => {
    try {
      const leads = await User.find(
        { role: "Lead", department: await getDepartment(req.user.id) },
        "name pulseStatus",
      ).lean();

      // Single grouped count instead of one countDocuments per lead.
      const counts = await User.aggregate([
        { $match: { lead_id: { $in: leads.map((l) => l._id) } } },
        { $group: { _id: "$lead_id", count: { $sum: 1 } } },
      ]);
      const countByLead = new Map(counts.map((c) => [String(c._id), c.count]));

      res.json(
        leads.map((lead) => ({
          _id: lead._id,
          name: lead.name,
          employeeCount: countByLead.get(String(lead._id)) || 0,
          status: lead.pulseStatus || "Available",
        })),
      );
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// GET: Employee/Lead Tasks (Audit)
router.get(
  "/employee-tasks/:memberId",
  verifyToken,
  authorize("Manager"),
  async (req, res) => {
    try {
      if (!(await checkDeptAccess(req.user.id, req.params.memberId))) {
        return res.status(403).json({ error: "Access Denied" });
      }
      const user = await User.findById(
        req.params.memberId,
        "performance.assignedTasks",
      ).lean();
      res.json(user.performance?.assignedTasks || []);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// GET: Employee/Lead Attendance (Audit)
router.get(
  "/employee-attendance/:memberId",
  verifyToken,
  authorize("Manager"),
  async (req, res) => {
    try {
      if (!(await checkDeptAccess(req.user.id, req.params.memberId))) {
        return res.status(403).json({ error: "Access Denied" });
      }
      const logs = await Attendance.find({ userId: req.params.memberId })
        .sort({ date: -1 })
        .lean();
      const formattedLogs = logs.map((log) => ({
        date: log.date,
        checkInTime: log.checkInTime,
        checkOutTime: log.checkOutTime,
        totalHours:
          log.checkInTime && log.checkOutTime
            ? (
                (new Date(log.checkOutTime) - new Date(log.checkInTime)) /
                3600000
              ).toFixed(1)
            : 0,
        isLate: log.checkInTime
          ? new Date(log.checkInTime).getHours() >= 9
          : false,
      }));
      res.json(formattedLogs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// GET: Employee/Lead EODs (Audit)
router.get(
  "/employee-eods/:memberId",
  verifyToken,
  authorize("Manager"),
  async (req, res) => {
    try {
      if (!(await checkDeptAccess(req.user.id, req.params.memberId))) {
        return res.status(403).json({ error: "Access Denied" });
      }
      const reports = await Report.find({ userId: req.params.memberId })
        .sort({ date: -1 })
        .lean();
      res.json(
        reports.map((r) => ({
          _id: r._id,
          createdAt: r.date,
          summary: r.workDone,
          blockers: r.blockers,
          status: r.status,
          session: r.session,
        })),
      );
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// GET: Organization Directory
router.get(
  "/all-employees",
  verifyToken,
  authorize("Manager"),
  async (req, res) => {
    try {
      const employees = await User.find(
        {
          role: "Employee",
          department: await getDepartment(req.user.id),
          status: { $nin: ["Pending", "Rejected"] },
        },
        "name role pulseStatus lead_id performance.assignedTasks",
      )
        .populate("lead_id", "name")
        .lean();

      // One aggregation for everyone's hours instead of one query per employee.
      const hours = await Attendance.aggregate([
        {
          $match: {
            userId: { $in: employees.map((e) => e._id) },
            checkInTime: { $ne: null },
            checkOutTime: { $ne: null },
          },
        },
        {
          $group: {
            _id: "$userId",
            ms: { $sum: { $subtract: ["$checkOutTime", "$checkInTime"] } },
          },
        },
      ]);
      const hoursByUser = new Map(hours.map((h) => [String(h._id), h.ms / 3600000]));

      const formatted = employees.map((e) => {
        const tasks = e.performance?.assignedTasks || [];
        const activeTasks = tasks.filter((t) => t.status !== "Completed");
        const latestTask =
          activeTasks.length > 0 ? activeTasks[activeTasks.length - 1] : null;

        return {
          _id: e._id,
          name: e.name,
          role: e.role,
          assignedLeadName: e.lead_id ? e.lead_id.name : "Direct Management",
          currentTask: latestTask ? latestTask.title : "Idle",
          status: e.pulseStatus || "Available",
          pendingTasks: activeTasks.length,
          totalHours: Math.round(hoursByUser.get(String(e._id)) || 0),
        };
      });
      res.json(formatted);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// GET: Company Performance
router.get(
  "/company-performance",
  verifyToken,
  authorize("Manager"),
  async (req, res) => {
    try {
      // Count in the database rather than loading every task document.
      const [counts] = await User.aggregate([
        { $match: { department: await getDepartment(req.user.id) } },
        { $unwind: "$performance.assignedTasks" },
        {
          $group: {
            _id: null,
            completed: {
              $sum: {
                $cond: [
                  { $eq: ["$performance.assignedTasks.status", "Completed"] },
                  1,
                  0,
                ],
              },
            },
            total: { $sum: 1 },
          },
        },
      ]);
      const completed = counts?.completed || 0;
      res.json({ completed, pending: (counts?.total || 0) - completed });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

module.exports = router;