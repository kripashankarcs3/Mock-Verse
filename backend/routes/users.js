const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/users — create or update the authenticated user's profile
router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const { name, email } = req.body;
    const firebaseUID = req.user.uid;

    if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "A valid email is required" });
    }

    const existing = await User.findOne({ firebaseUID });
    const user = await User.findOneAndUpdate(
      { firebaseUID },
      { name: typeof name === "string" ? name.slice(0, 120) : "", email },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(existing ? 200 : 201).json(user);
  })
);

// GET /api/users/me — current user's profile
router.get(
  "/me",
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ firebaseUID: req.user.uid }).select("name email createdAt");
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  })
);

// GET /api/users/:firebaseUID — self only (kept for backward compatibility)
router.get(
  "/:firebaseUID",
  protect,
  asyncHandler(async (req, res) => {
    if (req.params.firebaseUID !== req.user.uid) {
      return res.status(403).json({ error: "You can only view your own profile" });
    }
    const user = await User.findOne({ firebaseUID: req.user.uid }).select("name email createdAt");
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  })
);

module.exports = router;
