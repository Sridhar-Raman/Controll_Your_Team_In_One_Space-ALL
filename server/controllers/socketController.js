const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const User = require("../models/User");

const GLOBAL_ROOM = "global_all";
const HISTORY_LIMIT = 100;
const MAX_TEXT_LENGTH = 4000;

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const initSocket = (io) => {
  // Authenticate every socket with the same JWT the REST API uses, so the
  // client can no longer claim to be someone else via query params.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));

      const { id } = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(id).select("name").lean();
      if (!user) return next(new Error("User not found"));

      socket.user = { id: String(user._id), name: user.name };
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const { id: userId, name: userName } = socket.user;

    // Global room is open to everyone; private rooms need participation.
    const canAccessRoom = async (roomId) => {
      if (roomId === GLOBAL_ROOM) return true;
      if (!isValidId(roomId)) return false;
      return !!(await Conversation.exists({
        _id: roomId,
        participants: userId,
      }));
    };

    socket.on("get_users", async () => {
      try {
        const users = await User.find({
          _id: { $ne: userId },
          status: { $nin: ["Pending", "Rejected"] },
        })
          .select("name email role pulseStatus")
          .lean();
        socket.emit("user_list", users);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    });

    socket.on("join_room", async (roomId) => {
      try {
        if (!(await canAccessRoom(roomId))) return;
        socket.join(roomId);

        // Newest N messages, returned oldest-first for display.
        const history = await Message.find({ conversationId: roomId })
          .sort({ createdAt: -1 })
          .limit(HISTORY_LIMIT)
          .lean();
        socket.emit("chat_history", history.reverse());
      } catch (err) {
        console.error("Error fetching history:", err);
      }
    });

    socket.on("start_private_chat", async ({ participantId } = {}) => {
      try {
        if (!isValidId(participantId) || participantId === userId) return;

        let conversation = await Conversation.findOne({
          type: "private",
          participants: { $all: [participantId, userId], $size: 2 },
        }).lean();

        if (!conversation) {
          conversation = await Conversation.create({
            participants: [participantId, userId],
            type: "private",
          });
        }

        socket.emit("private_chat_ready", {
          conversationId: conversation._id.toString(),
          name: "Direct Message",
        });
      } catch (err) {
        console.error("Error starting private chat:", err);
      }
    });

    socket.on("send_message", async (data = {}) => {
      const { conversationId, text, fileUrl, fileName, fileType, tempId } = data;
      try {
        // Must have joined (and therefore been authorised for) this room.
        if (!socket.rooms.has(conversationId)) return;
        if (!text && !fileUrl) return;
        if (text && text.length > MAX_TEXT_LENGTH) return;

        const newMessage = await Message.create({
          conversationId,
          sender: userId,
          senderName: userName,
          text,
          fileUrl,
          fileName,
          fileType: fileType || "text",
        });

        if (conversationId !== GLOBAL_ROOM) {
          await Conversation.updateOne(
            { _id: conversationId },
            { lastMessage: newMessage._id },
          );
        }

        // tempId lets the sender's client de-duplicate its optimistic message.
        io.to(conversationId).emit("receive_message", {
          ...newMessage.toObject(),
          tempId,
        });
      } catch (err) {
        console.error("Error saving message:", err);
      }
    });

    socket.on("edit_message", async ({ messageId, text } = {}) => {
      try {
        if (!isValidId(messageId) || !text || text.length > MAX_TEXT_LENGTH) {
          return;
        }
        // Only the author may edit.
        const updated = await Message.findOneAndUpdate(
          { _id: messageId, sender: userId },
          { text, isEdited: true },
          { new: true },
        ).lean();
        if (updated) io.to(updated.conversationId).emit("message_updated", updated);
      } catch (err) {
        console.error("Error editing message:", err);
      }
    });

    socket.on("delete_message", async ({ messageId } = {}) => {
      try {
        if (!isValidId(messageId)) return;
        // Only the author may delete.
        const deleted = await Message.findOneAndDelete({
          _id: messageId,
          sender: userId,
        }).lean();
        if (deleted) io.to(deleted.conversationId).emit("message_deleted", messageId);
      } catch (err) {
        console.error("Error deleting message:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected`);
    });
  });
};

module.exports = initSocket;
