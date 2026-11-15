const mongoose = require("mongoose");
const { runSingleTestCase } = require("../services/judge0Service");
const { isDbReady } = require("../middleware/dbReady");
const Problem = require("../models/Problem");
const Submission = require("../models/Submission");

const MAX_CODE_LENGTH = 100_000;
const MAX_TEST_CASES = 50;

// Format conversion for outputs
const normalizeOutput = (str) => {
  if (!str) return "";
  return String(str).trim().replace(/\r\n/g, "\n");
};

const durationToSeconds = (timeStr) => {
  const time = parseFloat(timeStr);
  return isNaN(time) ? "0.000" : time.toFixed(3);
};

/** Map Judge0/service failures onto correct HTTP semantics. */
const sendExecutionError = (res, err) => {
  console.error(`Execution error [${err.code || "unknown"}]:`, err.message);

  switch (err.code) {
    case "JUDGE_RATE_LIMIT":
      return res.status(429).json({ error: "Code execution is busy. Please retry in a moment." });
    case "JUDGE_TIMEOUT":
      return res.status(504).json({ error: "Code execution timed out. Please try again." });
    case "JUDGE_UNAVAILABLE":
    case "JUDGE_UPSTREAM":
      return res.status(502).json({ error: "Code execution service is unavailable." });
    case "JUDGE_REQUEST":
      return res.status(502).json({ error: "Code execution service rejected the request." });
    default:
      break;
  }

  const status = Number(err.status) || 500;
  return res
    .status(status)
    .json({ error: status >= 500 ? "Execution failed" : err.message });
};

const validateExecutionInput = (req, res) => {
  const { code, language } = req.body || {};

  if (!code || !language) {
    res.status(400).json({ error: "Code and language are required" });
    return false;
  }
  if (typeof code !== "string" || typeof language !== "string") {
    res.status(400).json({ error: "Code and language must be strings" });
    return false;
  }
  if (code.length > MAX_CODE_LENGTH) {
    res.status(413).json({ error: `Code must be under ${MAX_CODE_LENGTH} characters` });
    return false;
  }
  return true;
};

exports.runCode = async (req, res) => {
  if (!validateExecutionInput(req, res)) return;

  try {
    const { code, language, input = "" } = req.body;
    const result = await runSingleTestCase(code, language, String(input ?? ""));

    return res.json({
      stdout: result.stdout ? normalizeOutput(result.stdout) : "",
      stderr: result.stderr ? normalizeOutput(result.stderr) : "",
      compile_output: result.compile_output ? normalizeOutput(result.compile_output) : "",
      time: result.time || "0",
      memory: result.memory || "0",
      status: result.status?.description || "Unknown",
    });
  } catch (err) {
    return sendExecutionError(res, err);
  }
};

exports.submitCode = async (req, res) => {
  if (!validateExecutionInput(req, res)) return;

  if (!isDbReady()) {
    return res.status(503).json({
      error: "Database unavailable. Submissions cannot be graded right now.",
      code: "DB_UNAVAILABLE",
    });
  }

  try {
    const { problemId, code, language } = req.body;

    if (!problemId || !mongoose.isValidObjectId(problemId)) {
      return res.status(400).json({ error: "A valid problemId is required" });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    const testCases = (problem.testCases || []).slice(0, MAX_TEST_CASES);
    if (testCases.length === 0) {
      return res.status(400).json({ error: "No test cases found for this problem" });
    }

    const results = [];
    let passedCount = 0;
    let maxTime = 0;
    let maxMemory = 0;

    // Run sequentially to avoid hammering the free Judge0 API.
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const resultPayload = await runSingleTestCase(code, language, tc.input);

      const actualOut = resultPayload.stdout ? normalizeOutput(resultPayload.stdout) : "";
      const expectedOut = normalizeOutput(tc.expectedOutput);
      const isPass = actualOut === expectedOut && resultPayload.status?.id === 3;

      if (isPass) passedCount++;

      const execTime = parseFloat(resultPayload.time || "0");
      if (execTime > maxTime) maxTime = execTime;
      const memKB = parseFloat(resultPayload.memory || "0");
      if (memKB > maxMemory) maxMemory = memKB;

      results.push({
        testcase: i + 1,
        status: isPass ? "Passed" : resultPayload.status?.description || "Failed",
        expected: expectedOut,
        actual: actualOut,
        durationSeconds: durationToSeconds(resultPayload.time),
        error: resultPayload.stderr || resultPayload.compile_output || null,
      });
    }

    const finalStatus = passedCount === testCases.length ? "Passed" : "Failed";

    // Best-effort history: a DB outage must not throw away a computed verdict.
    if (req.user?.uid) {
      try {
        await Submission.create({
          firebaseUID: req.user.uid,
          problemId: problem._id,
          code,
          language,
          status: finalStatus,
          executionTime: Math.round(maxTime * 1000),
          memoryStats: maxMemory,
          testcasesPassed: `${passedCount}/${testCases.length}`,
        });
      } catch (saveError) {
        console.warn("Could not save submission history:", saveError.message);
      }
    }

    return res.json({
      verdict: finalStatus,
      passedCount,
      totalTestCases: testCases.length,
      maxTime: maxTime.toFixed(3),
      maxMemory,
      results,
    });
  } catch (err) {
    return sendExecutionError(res, err);
  }
};
