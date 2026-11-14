const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Problem = require("../models/Problem");
const { protect } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");

const MAX_TEST_CASES = 50;
const MAX_CASE_LENGTH = 10_000;
const MAX_DESCRIPTION_LENGTH = 20_000;
const MAX_CODE_LENGTH = 50_000;

const toBoolean = (value) => value === true || value === "true";

/** Validate + normalise incoming test cases. Throws a 400-ish error on bad input. */
const normalizeTestCases = (raw) => {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) {
    const err = new Error("testCases must be an array");
    err.status = 400;
    throw err;
  }
  if (raw.length > MAX_TEST_CASES) {
    const err = new Error(`At most ${MAX_TEST_CASES} test cases are allowed`);
    err.status = 400;
    throw err;
  }

  return raw.map((tc) => {
    const input = String(tc?.input ?? "");
    const expectedOutput = String(tc?.expectedOutput ?? tc?.output ?? "");
    if (input.length > MAX_CASE_LENGTH || expectedOutput.length > MAX_CASE_LENGTH) {
      const err = new Error(`Each test case must be under ${MAX_CASE_LENGTH} characters`);
      err.status = 400;
      throw err;
    }
    return { input, expectedOutput };
  });
};

const pickWritableFields = (body) => {
  const fields = {};
  if (body.title !== undefined) {
    fields.title = String(body.title).trim();
    if (!fields.title) {
      const err = new Error("title cannot be empty");
      err.status = 400;
      throw err;
    }
  }
  if (body.description !== undefined) {
    fields.description = String(body.description).slice(0, MAX_DESCRIPTION_LENGTH);
  }
  if (body.testCases !== undefined) fields.testCases = normalizeTestCases(body.testCases);
  if (body.isPublic !== undefined) fields.isPublic = toBoolean(body.isPublic);
  if (body.language !== undefined) fields.language = String(body.language).slice(0, 40);
  if (body.code !== undefined) fields.code = String(body.code).slice(0, MAX_CODE_LENGTH);
  return fields;
};

// POST /api/problems — Create a new problem (owner = authenticated user)
router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const fields = pickWritableFields(req.body);

    if (!fields.title) {
      return res.status(400).json({ error: "title is required" });
    }

    const problem = await Problem.create({
      title: fields.title,
      description: fields.description || "",
      testCases: fields.testCases || [],
      isPublic: fields.isPublic === true,
      createdBy: req.user.uid,
      language: fields.language || "cpp",
      code: fields.code || "",
    });

    return res.status(201).json(problem);
  })
);

// GET /api/problems — public problems
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const problems = await Problem.find({ isPublic: true }).sort({ createdAt: -1 }).limit(200);
    return res.json(problems);
  })
);

// GET /api/problems/user/:userId — own problems only
router.get(
  "/user/:userId",
  protect,
  asyncHandler(async (req, res) => {
    if (req.params.userId !== req.user.uid) {
      return res.status(403).json({ error: "You can only view your own problems" });
    }
    const problems = await Problem.find({ createdBy: req.user.uid })
      .sort({ createdAt: -1 })
      .limit(200);
    return res.json(problems);
  })
);

// GET /api/problems/:id — public problem (or not found)
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid problem id" });
    }
    const problem = await Problem.findOne({ _id: req.params.id, isPublic: true });
    if (!problem) return res.status(404).json({ error: "Problem not found" });
    return res.json(problem);
  })
);

// PUT /api/problems/:id — update (owner only)
router.put(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid problem id" });
    }

    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ error: "Problem not found" });
    if (problem.createdBy !== req.user.uid) {
      return res.status(403).json({ error: "You can only edit your own problems" });
    }

    const fields = pickWritableFields(req.body);
    Object.assign(problem, fields);
    await problem.save();

    return res.json(problem);
  })
);

// DELETE /api/problems/:id — owner only
router.delete(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid problem id" });
    }

    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ error: "Problem not found" });
    if (problem.createdBy !== req.user.uid) {
      return res.status(403).json({ error: "You can only delete your own problems" });
    }

    await problem.deleteOne();
    return res.json({ message: "Problem deleted successfully" });
  })
);

module.exports = router;
