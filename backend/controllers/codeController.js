const { runSingleTestCase } = require("../services/judge0Service");
const Problem = require("../models/Problem");
const Submission = require("../models/Submission");

// Format conversion for outputs
const normalizeOutput = (str) => {
  if (!str) return "";
  return String(str).trim().replace(/\r\n/g, "\n");
};

const durationToSeconds = (timeStr) => {
  const time = parseFloat(timeStr);
  return isNaN(time) ? "0.000" : time.toFixed(3);
};

exports.runCode = async (req, res) => {
  try {
    const { code, language, input = "" } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: "Code and language are required" });
    }

    const result = await runSingleTestCase(code, language, input);

    // Judge0 structure
    // result.stdout, result.stderr, result.compile_output, result.time, result.memory, result.status.description
    const response = {
      stdout: result.stdout ? normalizeOutput(result.stdout) : "",
      stderr: result.stderr ? normalizeOutput(result.stderr) : "",
      compile_output: result.compile_output ? normalizeOutput(result.compile_output) : "",
      time: result.time || "0",
      memory: result.memory || "0",
      status: result.status?.description || "Unknown",
    };

    return res.json(response);
  } catch (err) {
    console.error("runCode error API map:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

exports.submitCode = async (req, res) => {
  try {
    const { problemId, code, language, userId } = req.body;

    if (!problemId || !code || !language) {
      return res.status(400).json({ error: "Problem ID, code, and language required" });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    const testCases = problem.testCases || [];
    if (testCases.length === 0) {
      return res.status(400).json({ error: "No test cases found for this problem" });
    }

    const results = [];
    let passedCount = 0;
    let maxTime = 0;
    let maxMemory = 0;
    
    // We run sequentially to avoid ratelimiting the free Judge0 API too hard
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const resultPayload = await runSingleTestCase(code, language, tc.input);

      const actualOut = resultPayload.stdout ? normalizeOutput(resultPayload.stdout) : "";
      const expectedOut = normalizeOutput(tc.expectedOutput);
      const isPass = actualOut === expectedOut && resultPayload.status?.id === 3; // 3 means Accepted

      if (isPass) passedCount++;

      const execTime = parseFloat(resultPayload.time || "0");
      if (execTime > maxTime) maxTime = execTime;
      const memKB = parseFloat(resultPayload.memory || "0");
      if (memKB > maxMemory) maxMemory = memKB;

      let errorMsg = resultPayload.stderr || resultPayload.compile_output;
      let statusDesc = resultPayload.status?.description || "Failed";
      
      results.push({
        testcase: i + 1,
        status: isPass ? "Passed" : statusDesc,
        expected: expectedOut,
        actual: actualOut,
        durationSeconds: durationToSeconds(resultPayload.time),
        error: errorMsg || null,
      });
    }

    const finalStatus = passedCount === testCases.length ? "Passed" : "Failed";

    // Save history
    // We will save if we have userId, or even if we don't maybe. Let's just save.
    const newSub = new Submission({
      userId: userId || null, 
      problemId: problem._id,
      code,
      language,
      status: finalStatus,
      executionTime: maxTime * 1000, // stored in ms
      memoryStats: maxMemory, // stored in KB
      testcasesPassed: `${passedCount}/${testCases.length}`
    });
    await newSub.save();

    return res.json({
      verdict: finalStatus,
      passedCount,
      totalTestCases: testCases.length,
      maxTime: maxTime.toFixed(3),
      maxMemory: maxMemory,
      results
    });
  } catch (err) {
    console.error("submitCode error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};
