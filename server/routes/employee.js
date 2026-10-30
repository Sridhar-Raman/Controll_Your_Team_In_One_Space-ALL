

const router = require("express").Router();
const User = require("../models/User");
const LeaveRequest = require("../models/LeaveRequest");
const Attendance = require("../models/Attendance");
const Report = require("../models/Report");
const { verifyToken } = require("../middleware/auth");

// --- NEW DYNAMIC PERFORMANCE ROUTE ---
router.get("/performance-metrics", verifyToken, async (req, res) => {
  try {
    const [user, attendance, reports, approvedLeaves] = await Promise.all([
      User.findById(req.user.id, "performance.assignedTasks").lean(),
      Attendance.find({ userId: req.user.id }, "checkInTime").lean(),
      Report.find({ userId: req.user.id }, "status").lean(),
      LeaveRequest.countDocuments({
        employeeId: req.user.id,
        status: "Approved",
      }),
    ]);
    const tasks = user?.performance?.assignedTasks || [];

    // 1. Tasks Score: (Completed / Total) * 100
    const completedTasks = tasks.filter((t) => t.status === "Completed");
    const taskScore =
      tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

    // 2. Speed Score: Based on avg completion time (Baseline 24h)
    let avgSpeed = 0;
    if (completedTasks.length > 0) {
      const totalHours = completedTasks.reduce((acc, t) => {
        const duration =
          (new Date(t.completedAt) - new Date(t.assignedAt)) / (1000 * 60 * 60);
        return acc + duration;
      }, 0);
      const avgHours = totalHours / completedTasks.length;
      avgSpeed = Math.max(0, Math.min(100, 100 - avgHours / 24)); // Normalized to 24h window
    }

    // 3. Quality Score: Based on EOD statuses
    const qualityScore =
      reports.length > 0
        ? (reports.filter((r) => r.status === "Completed").length /
            reports.length) *
          100
        : 0;

    // 4. On-Time Score: Attendance Punctuality
    const onTimeScore =
      attendance.length > 0
        ? (attendance.filter((a) => {
            if (!a.checkInTime) return false;
            const time = new Date(a.checkInTime);
            return (
              time.getHours() < 9 ||
              (time.getHours() === 9 && time.getMinutes() <= 30)
            );
          }).length /
            attendance.length) *
          100
        : 0;

    // 5. Efficiency: Weighted Average minus Leave Penalty
    const leavePenalty = approvedLeaves * 2;
    const baseEfficiency =
      (taskScore + avgSpeed + qualityScore + onTimeScore) / 4;
    const efficiencyScore = Math.max(
      0,
      Math.min(100, baseEfficiency - leavePenalty),
    );

    res.json({
      tasks: Math.round(taskScore),
      speed: Math.round(avgSpeed),
      quality: Math.round(qualityScore),
      onTime: Math.round(onTimeScore),
      efficiency: Math.round(efficiencyScore),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password").lean();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/update-task-status/:taskId", verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["Pending", "Planning", "Processing", "Completed"];
    if (!allowed.includes(status))
      return res.status(400).json({ error: "Invalid status" });

    const set = { "performance.assignedTasks.$.status": status };
    if (status === "Completed")
      set["performance.assignedTasks.$.completedAt"] = new Date();

    const user = await User.findOneAndUpdate(
      { _id: req.user.id, "performance.assignedTasks._id": req.params.taskId },
      { $set: set },
      { new: true, projection: "performance.assignedTasks" },
    );
    const task = user?.performance.assignedTasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json({ message: "Task Updated", task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/endorse/:id", verifyToken, async (req, res) => {
  try {
    const targetId = req.params.id;
    const senderId = req.user.id;
    if (targetId === senderId)
      return res.status(400).json({ error: "Self-endorsement blocked." });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Atomically claim today's single endorsement; fails if already used.
    const claimed = await User.updateOne(
      {
        _id: senderId,
        $or: [
          { lastEndorsementDate: null },
          { lastEndorsementDate: { $lt: startOfToday } },
        ],
      },
      { lastEndorsementDate: new Date() },
    );
    if (!claimed.modifiedCount)
      return res.status(400).json({ error: "Daily limit reached." });

    const endorsed = await User.updateOne(
      { _id: targetId, "performance.endorsedBy": { $ne: senderId } },
      {
        $inc: { "performance.endorsements": 1 },
        $push: { "performance.endorsedBy": senderId },
      },
    );
    if (!endorsed.modifiedCount) {
      // Refund the daily slot: target missing or already endorsed.
      await User.updateOne({ _id: senderId }, { lastEndorsementDate: null });
      return res.status(400).json({ error: "Already endorsed." });
    }
    res.json({ message: "Endorsed!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/leave", verifyToken, async (req, res) => {
  try {
    const { startDate, endDate, category, reason } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end) || end < start)
      return res.status(400).json({ error: "Invalid leave dates" });
    const duration =
      Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
    const newLeave = new LeaveRequest({
      employeeId: req.user.id,
      startDate,
      endDate,
      category,
      reason,
      duration,
    });
    await newLeave.save();
    res.json(newLeave);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/leave-history", verifyToken, async (req, res) => {
  try {
    const history = await LeaveRequest.find({ employeeId: req.user.id })
      .sort({ requestedAt: -1 })
      .lean();
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;