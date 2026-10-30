const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

// Credentials come from the environment so no password lives in the repo.
// Set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD in server/.env (or the shell) before running.
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || "Admin";
const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL || "admin@syncnode.io").trim().toLowerCase();
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
const FORCE = process.argv.includes("--force");

const seedData = async () => {
  try {
    if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
      console.error("❌ Set SEED_ADMIN_PASSWORD (at least 8 characters) before seeding.");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connected to MongoDB (${mongoose.connection.name}) for seeding...`);

    // Never wipe a database that already has users unless explicitly asked.
    const existing = await User.countDocuments();
    if (existing > 0 && !FORCE) {
      console.error(
        `❌ This database already has ${existing} user(s). Nothing was changed.\n` +
          "   Re-run with --force to delete ALL users and create the admin.",
      );
      process.exit(1);
    }
    if (existing > 0) {
      await User.deleteMany({});
      console.log("Existing users cleared.");
    }

    await new User({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "Admin",
      status: "Active",
      department: "Executive",
      salary: 0,
      performance: { endorsements: 0, endorsedBy: [], assignedTasks: [] },
    }).save();

    console.log("---------------------------------------------------------");
    console.log("✅ Database seeded (admin only)");
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log("Password: the value of SEED_ADMIN_PASSWORD");
    console.log("---------------------------------------------------------");

    process.exit();
  } catch (err) {
    console.error("❌ Seeding Error:", err);
    process.exit(1);
  }
};

seedData();
