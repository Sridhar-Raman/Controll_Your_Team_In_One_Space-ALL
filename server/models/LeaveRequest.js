
const mongoose = require("mongoose");

const LeaveSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  duration: Number,
  category: {
    type: String,
    enum: ["Casual", "Medical", "Emergency"],
    default: "Casual",
  },
  reason: String,
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected", "Revoked"], // Added Revoked
    default: "Pending",
  },
  rejectionReason: { type: String, default: "" }, // New field for audit trail
  requestedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

LeaveSchema.index({ employeeId: 1, status: 1 });

module.exports =mongoose.model("LeaveRequest", LeaveSchema);
