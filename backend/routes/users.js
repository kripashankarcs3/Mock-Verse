const express = require("express");
const router = express.Router();
const User = require("../models/User");

// POST /api/users — Create or update user on login
router.post("/", async (req, res) => {
  const { firebaseUID, name, email } = req.body;

  if (!firebaseUID || !email) {
    return res.status(400).json({ error: "firebaseUID and email are required" });
  }

  try {
    const user = await User.findOneAndUpdate(
      { firebaseUID },
      { name: name || "", email },
      { upsert: true, new: true, runValidators: true }
    );
    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:firebaseUID — Get user by Firebase UID
router.get("/:firebaseUID", async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.params.firebaseUID });
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
