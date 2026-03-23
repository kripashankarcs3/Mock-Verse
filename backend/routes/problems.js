const express = require("express");
const router = express.Router();
const Problem = require("../models/Problem");

// POST /api/problems — Create a new problem
router.post("/", async (req, res) => {
  const { title, description, testCases, isPublic, createdBy, language, code } = req.body;

  if (!title || !createdBy) {
    return res.status(400).json({ error: "title and createdBy are required" });
  }

  try {
    const problem = await Problem.create({
      title,
      description: description || "",
      testCases: testCases || [],
      isPublic: isPublic || false,
      createdBy,
      language: language || "cpp",
      code: code || "",
    });
    return res.status(201).json(problem);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/problems — Get all public problems
router.get("/", async (req, res) => {
  try {
    const problems = await Problem.find({ isPublic: true }).sort({ createdAt: -1 });
    return res.json(problems);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/problems/user/:userId — Get all problems by a specific user (Firebase UID)
router.get("/user/:userId", async (req, res) => {
  try {
    const problems = await Problem.find({ createdBy: req.params.userId }).sort({
      createdAt: -1,
    });
    return res.json(problems);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/problems/:id — Update a problem by MongoDB ID
router.put("/:id", async (req, res) => {
  try {
    const problem = await Problem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!problem) return res.status(404).json({ error: "Problem not found" });
    return res.json(problem);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/problems/:id — Delete a problem by MongoDB ID
router.delete("/:id", async (req, res) => {
  try {
    const problem = await Problem.findByIdAndDelete(req.params.id);
    if (!problem) return res.status(404).json({ error: "Problem not found" });
    return res.json({ message: "Problem deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
