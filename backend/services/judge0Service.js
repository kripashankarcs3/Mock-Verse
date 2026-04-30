const axios = require("axios");

/**
 * Language IDs for JDoodle API
 * cpp17 = C++ (GCC 17)
 * java = Java
 */
const getLanguageConfig = (language) => {
  const normalized = language.toLowerCase();
  if (normalized === "cpp" || normalized === "c++") {
    return { language: "cpp17", versionIndex: "0" };
  }
  if (normalized === "java") {
    return { language: "java", versionIndex: "0" };
  }
  throw new Error(`Unsupported language: ${language}. Only cpp and java are supported.`);
};

/**
 * Runs code against a single input using JDoodle API (free, no card needed).
 * Free tier: 20 executions/day
 */
const runSingleTestCase = async (code, languageStr, inputStr = "") => {
  const { language, versionIndex } = getLanguageConfig(languageStr);

  const clientId = process.env.JDOODLE_CLIENT_ID;
  const clientSecret = process.env.JDOODLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET are required in .env");
  }

  const payload = {
    clientId,
    clientSecret,
    script: code,
    stdin: inputStr,
    language,
    versionIndex,
  };

  try {
    const response = await axios.post("https://api.jdoodle.com/v1/execute", payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    });

    const data = response.data;

    // Normalize JDoodle response to match our expected format
    // JDoodle returns: { output, statusCode, memory, cpuTime }
    const isSuccess = data.statusCode === 200;
    const output = data.output || "";

    // Check for common error patterns in output
    const isCompileError = output.includes("error:") && output.includes(".cpp") ||
                           output.includes("error:") && output.includes(".java");
    const isRuntimeError = data.statusCode !== 200;

    return {
      stdout: (!isCompileError && !isRuntimeError) ? output : "",
      stderr: isRuntimeError ? output : "",
      compile_output: isCompileError ? output : "",
      time: data.cpuTime || "0",
      memory: data.memory || "0",
      status: {
        id: isSuccess && !isCompileError ? 3 : 6,
        description: isSuccess && !isCompileError ? "Accepted" : "Error",
      },
    };
  } catch (error) {
    if (error.response) {
      const msg = error.response.data?.error || JSON.stringify(error.response.data);
      throw new Error(`JDoodle API Error: ${msg}`);
    }
    throw new Error(`JDoodle Service Error: ${error.message}`);
  }
};

// Keep getLanguageId for backward compatibility
const getLanguageId = (language) => {
  const normalized = language.toLowerCase();
  if (normalized === "cpp" || normalized === "c++") return 54;
  if (normalized === "java") return 62;
  throw new Error(`Unsupported language: ${language}`);
};

module.exports = {
  getLanguageId,
  runSingleTestCase,
};
