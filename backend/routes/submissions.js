const express = require("express");
const router = express.Router();
const Submission = require("../models/Submission");
const { protect } = require("../middleware/auth");

// GET /api/submissions/user/me
router.get("/user/me", protect, async (req, res) => {
  try {
    const submissions = await Submission.find({ userId: req.user.uid }).sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/submissions/user/:userId
router.get("/user/:userId", protect, async (req, res) => {
  try {
    const submissions = await Submission.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/submissions - optional create record
router.post("/", protect, async (req, res) => {
  const { problemId, language, result, difficulty, runtimeMs } = req.body;

  if (!language || !result || !difficulty) {
    return res.status(400).json({ error: "language, result, and difficulty are required." });
  }

  try {
    const submission = await Submission.create({
      userId: req.user.uid,
      problemId,
      language,
      result,
      difficulty,
      runtimeMs,
    });
    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
