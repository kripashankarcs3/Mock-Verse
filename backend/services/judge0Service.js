const axios = require("axios");

const JUDGE0_API_URL = process.env.JUDGE0_API_URL || "https://ce.judge0.com";

/**
 * Language IDs for Judge0 CE
 * 54 = C++ (GCC 9.2.0)
 * 62 = Java (OpenJDK 13.0.1)
 */
const getLanguageId = (language) => {
  const normalized = language.toLowerCase();
  if (normalized === "cpp" || normalized === "c++") return 54;
  if (normalized === "java") return 62;
  throw new Error(`Unsupported language: ${language}. Only cpp and java are supported.`);
};

/**
 * Runs code against a single input using Judge0 CE public API (no API key needed).
 */
const runSingleTestCase = async (code, languageStr, inputStr = "") => {
  const language_id = getLanguageId(languageStr);

  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
  };

  // If RapidAPI key is provided, use RapidAPI endpoint instead
  const apiKey = process.env.JUDGE0_API_KEY;
  const apiHost = process.env.JUDGE0_API_HOST;
  if (apiKey && apiKey.trim() !== "") {
    headers["X-RapidAPI-Key"] = apiKey;
    headers["X-RapidAPI-Host"] = apiHost || "judge0-ce.p.rapidapi.com";
  }

  const options = {
    method: "POST",
    url: `${JUDGE0_API_URL}/submissions`,
    params: {
      base64_encoded: "false",
      wait: "true",
      fields: "*",
    },
    headers,
    data: {
      language_id,
      source_code: code,
      stdin: inputStr,
    },
    timeout: 30000,
  };

  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`Judge0 API Error: ${JSON.stringify(error.response.data)}`);
    } else {
      throw new Error(`Judge0 Service Error: ${error.message}`);
    }
  }
};

module.exports = {
  getLanguageId,
  runSingleTestCase,
};
