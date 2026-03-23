const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firebaseUID: { type: String, required: true, unique: true },
    name: { type: String, default: "" },
    email: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
