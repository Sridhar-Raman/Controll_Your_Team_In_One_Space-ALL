const router = require("express").Router();
const Report = require("../models/Report");
const User = require("../models/User");
const { verifyToken } = require("../middleware/auth");

// POST: Submit a new EOD Report
router.post("/", verifyToken, async (req, res) => {
  try {
    const { session, workDone, status, blockers, date } = req.body;

    const currentUser = await User.findById(req.user.id, "name role").lean();
    if (!currentUser) return res.status(404).json({ error: "User not found" });

    // 1. Duplicate check on userId + date string + session (String() blocks operator objects)
    const existing = await Report.exists({
      userId: req.user.id,
      date: String(date),
      session: String(session),
    });

    if (existing) {
      return res.status(400).json({
        error: `You already submitted a report for ${session} on ${date}.`,
      });
    }

    // 2. Create the report
    const newReport = new Report({
      userId: currentUser._id,
      userName: currentUser.name,
      userRole: currentUser.role,
      session,
      workDone,
      status,
      blockers,
      date, // Saves the string directly
    });

    await newReport.save();
    res.json({ message: "Report submitted successfully", report: newReport });
  } catch (err) {
    console.error("EOD Submit Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET: Fetch reports (Updated for string date filtering)
router.get("/", verifyToken, async (req, res) => {
  try {
    let query = { userId: req.user.id };

    // String() blocks operator objects like ?date[$ne]=x
    if (req.query.date) query.date = String(req.query.date);
    if (req.query.session) query.session = String(req.query.session);

    const reports = await Report.find(query).sort({ date: -1 }).lean();
    res.json(reports);
  } catch (err) {
    console.error("EOD Fetch Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT: Edit an existing EOD Report
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: "Report not found" });

    if (report.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized edit attempt." });
    }

    // Window check using the date string
    const reportDate = new Date(report.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffInDays = (today - reportDate) / (1000 * 60 * 60 * 24);

    if (diffInDays > 3) {
      return res
        .status(400)
        .json({ error: "Editing period (3 days) has expired." });
    }

    const { workDone, status, blockers } = req.body;
    report.workDone = workDone || report.workDone;
    report.status = status || report.status;
    report.blockers = blockers || "";

    await report.save();
    res.json({ message: "Report updated successfully", report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;