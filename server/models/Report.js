const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  userRole: { type: String, required: true },

  // ✅ CHANGE: Store as STRING instead of Date
  date: { type: String, required: true },

  session: { type: String, enum: ["Session 1", "Session 2"], required: true },
  workDone: { type: String, required: true },
  status: {
    type: String,
    enum: ["Completed", "In-Progress", "Blocked"],
    default: "Completed",
  },
  blockers: { type: String, default: "" },

  linkedTaskId: { type: mongoose.Schema.Types.ObjectId },
});

ReportSchema.index({ userId: 1, date: -1, session: 1 });

module.exports =mongoose.model("Report", ReportSchema);