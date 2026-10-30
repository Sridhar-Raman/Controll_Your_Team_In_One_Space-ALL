

const router = require("express").Router();
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const Report = require("../models/Report");
const { verifyToken, authorize } = require("../middleware/auth");

// ✅ GET LEAD'S PROFILE
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password").lean();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET MY TEAM
router.get("/my-team", verifyToken, authorize("Lead"), async (req, res) => {
  try {
    const team = await User.find(
      { lead_id: req.user.id },
      "name pulseStatus performance.assignedTasks",
    ).lean();

    // One aggregation for the whole team instead of one query per member.
    const hours = await Attendance.aggregate([
      {
        $match: {
          userId: { $in: team.map((m) => m._id) },
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

    const formattedTeam = team.map((m) => {
      const tasks = m.performance?.assignedTasks || [];
      const activeTasks = tasks.filter((t) => t.status !== "Completed");
      const latestTask =
        activeTasks.length > 0 ? activeTasks[activeTasks.length - 1] : null;

      return {
        _id: m._id,
        name: m.name,
        pulseStatus: m.pulseStatus,
        currentTask: latestTask ? latestTask.title : "Idle",
        dueTime: latestTask ? latestTask.deadline : null,
        status: latestTask ? latestTask.status : m.pulseStatus || "Available",
        pendingTasks: activeTasks.length,
        totalHours: Math.round(hoursByUser.get(String(m._id)) || 0),
      };
    });

    res.json(formattedTeam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET EMPLOYEE TASKS
router.get(
  "/employee-tasks/:memberId",
  verifyToken,
  authorize("Lead"),
  async (req, res) => {
    try {
      const { memberId } = req.params;
      const employee = await User.findOne(
        { _id: memberId, lead_id: req.user.id },
        "performance.assignedTasks",
      ).lean();
      if (!employee)
        return res.status(404).json({ error: "Employee not found" });
      res.json(employee.performance?.assignedTasks || []);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// ✅ GET EMPLOYEE ATTENDANCE
router.get(
  "/employee-attendance/:memberId",
  verifyToken,
  authorize("Lead"),
  async (req, res) => {
    try {
      const { memberId } = req.params;
      // Leads may only view their own team members.
      if (!(await User.exists({ _id: memberId, lead_id: req.user.id }))) {
        return res.status(404).json({ error: "Employee not found" });
      }
      const logs = await Attendance.find({ userId: memberId })
        .sort({ date: -1 })
        .lean();

      const formattedLogs = logs.map((log) => {
        let totalHours = 0;
        let isLate = false;

        if (log.checkInTime && log.checkOutTime) {
          const diff = new Date(log.checkOutTime) - new Date(log.checkInTime);
          totalHours = (diff / (1000 * 60 * 60)).toFixed(1);
        }

        if (log.checkInTime) {
          const checkIn = new Date(log.checkInTime);
          if (
            checkIn.getHours() > 9 ||
            (checkIn.getHours() === 9 && checkIn.getMinutes() > 30)
          ) {
            isLate = true;
          }
        }

        return {
          date: log.date,
          totalHours,
          isLate,
          checkInTime: log.checkInTime,
          checkOutTime: log.checkOutTime,
        };
      });
      res.json(formattedLogs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// ✅ GET EMPLOYEE EODs
router.get(
  "/employee-eods/:memberId",
  verifyToken,
  authorize("Lead"),
  async (req, res) => {
    try {
      const { memberId } = req.params;
      if (!(await User.exists({ _id: memberId, lead_id: req.user.id }))) {
        return res.status(404).json({ error: "Employee not found" });
      }

      const reports = await Report.find({ userId: memberId })
        .sort({ date: -1 })
        .lean();

      const formattedReports = reports.map((r) => ({
        _id: r._id,
        createdAt: r.date,
        summary: r.workDone,
        blockers: r.blockers,
        status: r.status,
        session: r.session,
      }));

      res.json(formattedReports);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// ✅ ASSIGN TASK
router.post(
  "/assign-task-to-member",
  verifyToken,
  authorize("Lead"),
  async (req, res) => {
    try {
      const { employeeId, title, deadline } = req.body;

      const lead = await User.findById(req.user.id, "name role").lean();
      const result = await User.updateOne(
        { _id: employeeId, lead_id: req.user.id },
        {
          $push: {
            "performance.assignedTasks": {
              title,
              deadline: new Date(deadline),
              status: "Pending",
              assignedBy: { name: lead.name, role: lead.role, id: lead._id },
            },
          },
        },
      );
      if (!result.matchedCount) {
        return res
          .status(403)
          .json({ error: "Unauthorized: Target not in your team." });
      }

      res.json({ message: "Task deployed to team member!" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// ✅ GET DISPATCH DIRECTORY
router.get(
  "/dispatch-directory",
  verifyToken,
  authorize("Lead"),
  async (req, res) => {
    try {
      const team = await User.find(
        { lead_id: req.user.id },
        "name role performance department",
      ).lean();
      res.json(team);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

module.exports = router;