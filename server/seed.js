

const path = require("path");
// Use this line because the file is now in the same folder as seed.js
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    // 1. Clear existing data completely
    await User.deleteMany({});
    console.log("Existing users cleared.");

    // 2. Prepare Admin Credentials
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash("password123", salt);

    // 3. Create only the default Admin
    const adminUser = new User({
      name: "Sarah Chen",
      email: "admin@syncnode.io",
      password: password,
      role: "Admin",
      department: "Executive",
      salary: 150000,
      performance: {
        endorsements: 0,
        endorsedBy: [],
        assignedTasks: [],
      },
    });

    await adminUser.save();

    console.log("---------------------------------------------------------");
    console.log("✅ SyncNode Database Seeded (Admin Only)");
    console.log("Email: admin@syncnode.io");
    console.log("Password: password123");
    console.log("---------------------------------------------------------");

    process.exit();
  } catch (err) {
    console.error("❌ Seeding Error:", err);
    process.exit(1);
  }
};

seedData();