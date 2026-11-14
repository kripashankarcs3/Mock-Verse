const axios = require("axios");

/**
 * Language IDs for Judge0 CE API
 * 54 = C++ (GCC 9.2.0)
 * 62 = Java (OpenJDK 13.0.1)
 */
const getLanguageId = (language) => {
  const normalized = String(language || "").toLowerCase();
  if (normalized === "cpp" || normalized === "c++") return 54;
  if (normalized === "java") return 62;
  const error = new Error(`Unsupported language: ${language}. Only cpp and java are supported.`);
  error.status = 400;
  throw error;
};

const toBase64 = (str) => Buffer.from(str || "").toString("base64");
const fromBase64 = (str) => {
  if (!str) return "";
  try {
    return Buffer.from(str, "base64").toString("utf8");
  } catch {
    return str;
  }
};

const judgeError = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const REQUEST_TIMEOUT_MS = 15_000;
const POLL_INTERVAL_MS = 1_000;
const OVERALL_TIMEOUT_MS = 30_000;

/** Single axios call with Judge0 error normalisation. */
const request = async (config) => {
  try {
    return await axios(config);
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      const detail = data?.error || data?.message || String(JSON.stringify(data) || "").slice(0, 200);
      if (status === 429) throw judgeError("JUDGE_RATE_LIMIT", "Judge0 rate limit reached");
      if (status >= 500) throw judgeError("JUDGE_UPSTREAM", `Judge0 upstream error (${status})`);
      throw judgeError("JUDGE_REQUEST", `Judge0 rejected the request (${status}): ${detail}`);
    }
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      throw judgeError("JUDGE_TIMEOUT", "Judge0 request timed out");
    }
    throw judgeError("JUDGE_UNAVAILABLE", "Judge0 is unreachable");
  }
};

/**
 * Runs code against a single input using Judge0 CE API.
 * Uses ce.judge0.com (free, no API key needed) or RapidAPI Judge0 if key is set.
 */
const runSingleTestCase = async (code, languageStr, inputStr = "") => {
  const languageId = getLanguageId(languageStr);

  const apiUrl = process.env.JUDGE0_API_URL || "https://ce.judge0.com";
  const apiKey = process.env.JUDGE0_API_KEY;
  const apiHost = process.env.JUDGE0_API_HOST;

  const headers = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["X-RapidAPI-Key"] = apiKey;
    headers["X-RapidAPI-Host"] = apiHost || "judge0-ce.p.rapidapi.com";
  }

  const submitRes = await request({
    method: "post",
    url: `${apiUrl}/submissions?base64_encoded=true&wait=false`,
    data: {
      source_code: toBase64(code),
      language_id: languageId,
      stdin: toBase64(inputStr),
    },
    headers,
    timeout: REQUEST_TIMEOUT_MS,
  });

  const token = submitRes.data?.token;
  if (!token) throw judgeError("JUDGE_UPSTREAM", "No token received from Judge0");

  // Poll until the submission leaves the queue (status id >= 3) or we time out.
  const deadline = Date.now() + OVERALL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);

    const resultRes = await request({
      method: "get",
      url: `${apiUrl}/submissions/${token}?base64_encoded=true`,
      headers,
      timeout: REQUEST_TIMEOUT_MS,
    });

    const data = resultRes.data;
    const statusId = data.status?.id;

    // Status IDs: 1=In Queue, 2=Processing, 3=Accepted, 4+=Error
    if (statusId && statusId >= 3) {
      return {
        stdout: fromBase64(data.stdout),
        stderr: fromBase64(data.stderr),
        compile_output: fromBase64(data.compile_output),
        time: data.time || "0",
        memory: data.memory || "0",
        status: {
          id: statusId,
          description: data.status?.description || "Unknown",
        },
      };
    }
  }

  throw judgeError("JUDGE_TIMEOUT", "Judge0: execution timed out");
};

module.exports = {
  getLanguageId,
  runSingleTestCase,
};
