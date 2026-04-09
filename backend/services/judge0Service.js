const axios = require("axios");

const JUDGE0_API_URL = process.env.JUDGE0_API_URL || "https://judge0-ce.p.rapidapi.com";
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || "dummy_key_replace_me"; // Will expect to see it in .env
const JUDGE0_API_HOST = process.env.JUDGE0_API_HOST || "judge0-ce.p.rapidapi.com";

/**
 * According to standard Judge0 CE mappings
 * 54 = C++ (GCC 9.2.0)
 * 62 = Java (OpenJDK 13.0.1)
 *
 * NOTE: Python has been explicitly removed based on user request.
 */
const getLanguageId = (language) => {
  const normalized = language.toLowerCase();
  if (normalized === "cpp" || normalized === "c++") return 54;
  if (normalized === "java") return 62;
  throw new Error(`Unsupported language: ${language}. Only cpp and java are supported.`);
};

const getAxiosHeaders = () => {
  return {
    "content-type": "application/json",
    "Content-Type": "application/json", // Judge0 prefers it sometimes
    "X-RapidAPI-Key": JUDGE0_API_KEY,
    "X-RapidAPI-Host": JUDGE0_API_HOST,
  };
};

/**
 * Runs a snippet of code against a single std input. 
 * 'wait=true' returns the execution result directly (synchronous). 
 */
const runSingleTestCase = async (code, languageStr, inputStr = "") => {
  const language_id = getLanguageId(languageStr);
  const options = {
    method: "POST",
    url: `${JUDGE0_API_URL}/submissions`,
    params: {
      base64_encoded: "false",
      wait: "true",
      fields: "*"
    },
    headers: getAxiosHeaders(),
    data: {
      language_id,
      source_code: code,
      stdin: inputStr,
    },
  };

  try {
    const response = await axios.request(options);
    return response.data; // Will contain stdout, stderr, compile_output, status
  } catch (error) {
    if (error.response) {
      // Return their error message if available
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
