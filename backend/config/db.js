const mongoose = require("mongoose");

const connectDB = async () => {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.warn("⚠️  MONGO_URI nahi mila .env mein — MongoDB connection pass ho gaya.");
    return;
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB se connect ho gaya!");
  } catch (err) {
    console.error("❌ MongoDB connection mein error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
