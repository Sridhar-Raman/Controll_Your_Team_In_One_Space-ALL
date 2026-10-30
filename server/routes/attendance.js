const router = require("express").Router();
const Attendance = require("../models/Attendance");
const { verifyToken } = require("../middleware/auth");
const {
  isTracked,
  startSession,
  endSession,
} = require("../utils/attendanceSession");

// POST: Make sure today's session is running. Login starts it; this covers a
// returning browser session whose token is still valid on a new day.
router.post("/start", verifyToken, async (req, res) => {
  try {
    if (!isTracked(req.user.role)) return res.json(null);
    res.json(await startSession(req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: End today's session (called on logout)
router.post("/end", verifyToken, async (req, res) => {
  try {
    if (isTracked(req.user.role)) await endSession(req.user.id);
    res.json({ message: "Session ended" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Today's Stats
router.get("/my-stats", verifyToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const record = await Attendance.findOne({
      userId: req.user.id,
      date: today,
    }).lean();
    res.json(record || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Monthly History
router.get("/history/:year/:month", verifyToken, async (req, res) => {
  try {
    const { year, month } = req.params;
    if (!/^\d{4}$/.test(year) || !/^\d{1,2}$/.test(month)) {
      return res.status(400).json({ error: "Invalid year or month" });
    }
    // Dates are "YYYY-MM-DD" strings, so an anchored prefix uses the index.
    const history = await Attendance.find({
      userId: req.user.id,
      date: { $regex: `^${year}-${month.padStart(2, "0")}` },
    }).lean();
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;