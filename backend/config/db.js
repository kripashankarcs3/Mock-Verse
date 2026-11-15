const mongoose = require("mongoose");
const dns = require("dns");

// Force Node.js to use IPv4 DNS (fixes querySrv ECONNREFUSED on Windows)
dns.setDefaultResultOrder("ipv4first");

// Fail queries immediately instead of buffering for 10 s when the DB is down.
// The requireDB middleware turns this into a clean 503 for DB-backed routes.
mongoose.set("bufferCommands", false);

const connectDB = async () => {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.warn("⚠️  MONGO_URI missing in .env — DB-backed routes will return 503.");
    return;
  }

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: Number(process.env.MONGO_TIMEOUT_MS) || 5000,
      family: 4, // Force IPv4
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.error(
      "⚠️  Server running without a database — DB routes return 503. " +
        "Check the Atlas IP allowlist / MONGO_URI."
    );
    // Server stays up so DB-free routes (code execution) keep working.
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB disconnected");
});

module.exports = connectDB;
