
const router = require("express").Router();
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const Report = require("../models/Report");
const LeaveRequest = require("../models/LeaveRequest");
const { verifyToken } = require("../middleware/auth");

router.get("/all", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    // Look back up to 7 days for "All" view history
    const historyLimit = new Date();
    historyLimit.setDate(historyLimit.getDate() - 7);

    const [user, myLeaves] = await Promise.all([
      User.findById(userId, "role performance.assignedTasks").lean(),
      LeaveRequest.find({
        employeeId: userId,
        status: { $in: ["Approved", "Rejected", "Revoked"] },
        updatedAt: { $gte: historyLimit },
      })
        .sort({ updatedAt: -1 })
        .lean(),
    ]);
    const role = user.role;
    let notifications = [];

    // 1. Leave status updates

    myLeaves.forEach((l) =>
      notifications.push({
        message: `Your leave request was ${l.status.toLowerCase()}.`,
        time: "Recent",
        fullDate: l.updatedAt,
      }),
    );

    // 2. New tasks
    const myNewTasks = (user.performance?.assignedTasks || []).filter(
      (t) => new Date(t.assignedAt) > historyLimit,
    );
    myNewTasks.forEach((t) =>
      notifications.push({
        message: `New task assigned: ${t.title}`,
        time: "Task",
        fullDate: t.assignedAt,
      }),
    );

    // 3. LEAD / MANAGER specific
    if (["Lead", "Manager", "Admin"].includes(role)) {
      let teamQuery = {};
      if (role === "Lead") teamQuery = { lead_id: userId };
      if (role === "Manager") teamQuery = { manager_id: userId };

      const team = await User.find(
        teamQuery,
        "name performance.assignedTasks",
      ).lean();
      const teamIds = team.map((t) => t._id);

      // Late Check-ins (Last 7 days)
      const lateAtts = await Attendance.find({
        userId: { $in: teamIds },
        date: { $gte: historyLimit.toISOString().split("T")[0] },
      })
        .populate("userId", "name")
        .lean();

      lateAtts.forEach((a) => {
        if (a.checkInTime && a.userId) {
          const checkIn = new Date(a.checkInTime);
          if (
            checkIn.getHours() > 9 ||
            (checkIn.getHours() === 9 && checkIn.getMinutes() > 30)
          ) {
            const formattedTime = checkIn.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            });
            notifications.push({
              message: `${a.userId.name} checked in late at ${formattedTime}`,
              time: "Attendance",
              fullDate: a.checkInTime,
            });
          }
        }
      });

      // Task Completions
      team.forEach((member) => {
        (member.performance?.assignedTasks || []).forEach((t) => {
          if (
            t.status === "Completed" &&
            t.completedAt &&
            new Date(t.completedAt) > historyLimit
          ) {
            notifications.push({
              message: `${member.name} completed: ${t.title}`,
              time: "Update",
              fullDate: t.completedAt,
            });
          }
        });
      });
    }

    // Sort all by date descending (newest first)
    notifications.sort((a, b) => new Date(b.fullDate) - new Date(a.fullDate));

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;