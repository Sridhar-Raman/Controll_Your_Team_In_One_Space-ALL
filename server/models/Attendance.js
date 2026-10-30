const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  checkInTime: { type: Date },
  checkOutTime: { type: Date },
  status: { type: String, enum: ["P", "A"], default: "P" },
});
AttendanceSchema.index({ userId: 1, date: -1 }, { unique: true });

module.exports =mongoose.model("Attendance", AttendanceSchema);