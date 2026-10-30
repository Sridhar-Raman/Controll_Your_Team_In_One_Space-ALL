const Attendance = require("../models/Attendance");

// The time tracker has no manual check-in: a session starts when a non-admin
// user logs in. Admins are not tracked.
const isTracked = (role) => role !== "Admin";

const todayKey = () => new Date().toISOString().split("T")[0];

// Ensure today's record exists. With `resume`, a record closed by an earlier
// logout is reopened so the timer runs again after logging back in.
const startSession = async (userId, { resume = false } = {}) => {
  const date = todayKey();

  try {
    await Attendance.updateOne(
      { userId, date },
      { $setOnInsert: { checkInTime: new Date(), status: "P" } },
      { upsert: true },
    );
  } catch (err) {
    // Concurrent request already created it (unique userId + date index).
    if (err.code !== 11000) throw err;
  }

  if (resume) {
    await Attendance.updateOne(
      { userId, date, checkOutTime: { $ne: null } },
      { $unset: { checkOutTime: "" } },
    );
  }

  return Attendance.findOne({ userId, date }).lean();
};

// Close today's open session (logout). Safe to call repeatedly.
const endSession = async (userId) => {
  await Attendance.updateOne(
    { userId, date: todayKey(), checkInTime: { $ne: null }, checkOutTime: null },
    { checkOutTime: new Date() },
  );
};

module.exports = { isTracked, startSession, endSession };
