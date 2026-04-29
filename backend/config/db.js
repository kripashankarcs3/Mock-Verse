const mongoose = require("mongoose");
const dns = require("dns");

// Force Node.js to use IPv4 DNS (fixes querySrv ECONNREFUSED on Windows)
dns.setDefaultResultOrder("ipv4first");

const connectDB = async () => {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.warn("⚠️  MONGO_URI nahi mila .env mein — MongoDB connection pass ho gaya.");
    return;
  }

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      family: 4, // Force IPv4
    });
    console.log("✅ MongoDB se connect ho gaya!");
  } catch (err) {
    console.error("❌ MongoDB connection mein error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
