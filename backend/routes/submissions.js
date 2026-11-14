const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Problem = require("../models/Problem");
const Submission = require("../models/Submission");
const { protect } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");

// GET /api/submissions/user/me
router.get(
  "/user/me",
  protect,
  asyncHandler(async (req, res) => {
    const submissions = await Submission.find({ firebaseUID: req.user.uid })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(submissions);
  })
);

// GET /api/submissions/user/:userId — self only
router.get(
  "/user/:userId",
  protect,
  asyncHandler(async (req, res) => {
    if (req.params.userId !== req.user.uid) {
      return res.status(403).json({ error: "You can only view your own submissions" });
    }
    const submissions = await Submission.find({ firebaseUID: req.user.uid })
      .sort({ createdAt: -1 })
      .limit(100);
    return res.json(submissions);
  })
);

// POST /api/submissions — create a record for the authenticated user
router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const { problemId, code, language, status, executionTime, memoryStats, testcasesPassed } =
      req.body;

    if (!language || !status) {
      return res.status(400).json({ error: "language and status are required." });
    }

    if (problemId && !mongoose.isValidObjectId(problemId)) {
      return res.status(400).json({ error: "Invalid problemId" });
    }

    const submission = await Submission.create({
      firebaseUID: req.user.uid,
      problemId: problemId || undefined,
      code,
      language,
      status,
      executionTime,
      memoryStats,
      testcasesPassed,
    });

    return res.status(201).json(submission);
  })
);

module.exports = router;
