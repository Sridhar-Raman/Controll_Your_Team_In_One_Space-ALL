const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    type: { type: String, enum: ["private", "group"], default: "private" },
    groupName: { type: String }, // For dynamic groups, we usually generate this on the fly
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  },
  { timestamps: true },
);

ConversationSchema.index({ type: 1, participants: 1 });

module.exports =mongoose.model("Conversation", ConversationSchema);
