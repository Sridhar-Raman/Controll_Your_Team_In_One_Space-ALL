

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const initSocket = require("./controllers/socketController");

const app = express();
app.set("trust proxy", 1); // so rate limiting sees the real client IP behind a proxy
const server = http.createServer(app);

const DEFAULT_FRONTEND_URL = "https://syncnode-m83d.onrender.com";
const LOCAL_FRONTEND_URL = "http://localhost:5173";
// FRONTEND_URL may hold several comma-separated origins (e.g. your production
// Vercel domain plus a preview URL). Trailing slashes are ignored.
const FRONTEND_URLS = (process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL)
  .split(",")
  .map((url) => url.trim().replace(/\/+$/, ""))
  .filter(Boolean);
const ALLOWED_ORIGINS = [...FRONTEND_URLS, LOCAL_FRONTEND_URL, "http://127.0.0.1:5173"];

// 2. Middleware
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS origin not allowed: ${origin}`));
      }
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    credentials: true,
  }),
);

// 3. Socket.io Configuration
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Socket CORS origin not allowed: ${origin}`));
      }
    },
    methods: ["GET", "POST"],
  },
  // Adding transport settings helps with stable connections on Render
  transports: ["websocket", "polling"],
});

// 4. Database Connection
const dbURI = process.env.MONGO_URI;
if (!dbURI || !process.env.JWT_SECRET) {
  console.error("❌ MONGO_URI and JWT_SECRET must be set in server/.env");
  process.exit(1);
}

mongoose
  .connect(dbURI)
  .then(() => console.log(`💎 SyncNode DB Connected (database: ${mongoose.connection.name})`))
  .catch((err) => {
    console.error("❌ Connection Error Detail:", err.message);
  });

// 5. Initialize Socket Logic
initSocket(io);

// 6. Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/employee", require("./routes/employee"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/lead", require("./routes/lead"));
app.use("/api/manager", require("./routes/manager"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/notifications", require("./routes/notifications"));

// 7. Start Server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`🚀 Orbiting on Port ${PORT}`));