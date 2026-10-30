

const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  senderName: { type: String },
  text: { type: String }, // Now optional if sending only a file
  fileUrl: { type: String, default: null }, // URL or Base64 string
  fileName: { type: String, default: null },
  fileType: {
    type: String,
    enum: ["text", "image", "doc", "link"],
    default: "text",
  },
  isEdited: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

MessageSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.model("Message", MessageSchema);