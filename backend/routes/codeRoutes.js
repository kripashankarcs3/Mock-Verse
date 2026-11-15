const express = require("express");
const router = express.Router();
const codeController = require("../controllers/codeController");
const { optionalProtect } = require("../middleware/auth");
const { createRateLimiter } = require("../middleware/rateLimit");

// Execution is still usable for guests, but it is throttled per IP so the
// Judge0 proxy cannot be used as a free compile farm.
const executionLimiter = createRateLimiter({ name: "execution", windowMs: 60_000, max: 60 });

router.post("/run-code", executionLimiter, optionalProtect, codeController.runCode);
router.post("/submit-code", executionLimiter, optionalProtect, codeController.submitCode);

module.exports = router;
