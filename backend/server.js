require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { exec } = require("child_process");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// ── MongoDB Connection ───────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB se connect ho gaya!"))
    .catch((err) => console.error("❌ MongoDB connection mein error:", err.message));
} else {
  console.warn("⚠️  MONGO_URI nahi mila .env mein — MongoDB routes kaam nahi karenge.");
}

// ── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/users", require("./routes/users"));
app.use("/api/problems", require("./routes/problems"));

const TEMP_DIR = path.join(__dirname, "temp");
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}


const javaCommand = "java";
const javacCommand = "javac";

const normalizeOutput = (str) => {
  if (!str) return "";
  return str.trim().replace(/\r\n/g, "\n");
};

const durationToSeconds = (durationMs) => (durationMs / 1000).toFixed(3);

const runAgainstTestCases = async ({ testCases, execute }) => {
  const results = [];

  for (let i = 0; i < testCases.length; i += 1) {
    const tc = testCases[i];

    try {
      const startedAt = Date.now();
      const output = await execute(tc, i);
      const durationMs = Date.now() - startedAt;
      const actual = normalizeOutput(output);
      const expected = normalizeOutput(tc.expectedOutput);

      results.push({
        testcase: i + 1,
        status: actual === expected ? "Passed" : "Failed",
        expected,
        actual,
        durationMs,
        durationSeconds: durationToSeconds(durationMs),
        error: null,
      });
    } catch (err) {
      results.push({
        testcase: i + 1,
        status: err.error.includes("Time Limit Exceeded") ? "TLE" : "Runtime Error",
        expected: normalizeOutput(tc.expectedOutput),
        actual: "",
        durationMs: typeof err.durationMs === "number" ? err.durationMs : null,
        durationSeconds:
          typeof err.durationMs === "number" ? durationToSeconds(err.durationMs) : null,
        error: err.error,
      });
    }
  }

  return results;
};

app.get("/health", (_req, res) => {
  res.json({ message: "Backend is running" });
});

app.post("/run", async (req, res) => {
  const { code, language, testCases } = req.body;
  const uniqueId = uuidv4();
  const results = [];

  try {
    if (!code || !language || !Array.isArray(testCases) || testCases.length === 0) {
      return res.status(400).json({
        error: "code, language, and at least one test case are required",
        type: "validation",
      });
    }

    if (language === "cpp") {
      const codeFile = path.join(TEMP_DIR, `${uniqueId}.cpp`);
      const exeFile = path.join(
        TEMP_DIR,
        process.platform === "win32" ? `${uniqueId}.exe` : `${uniqueId}.out`
      );

      fs.writeFileSync(codeFile, code);

      await new Promise((resolve, reject) => {
        exec(`g++ "${codeFile}" -o "${exeFile}"`, (error, _stdout, stderr) => {
          if (error) {
            reject({ type: "compile", error: stderr || error.message });
          } else {
            resolve();
          }
        });
      });

      const cppResults = await runAgainstTestCases({
        testCases,
        execute: (tc, i) =>
          new Promise((resolve, reject) => {
            const inputFile = path.join(TEMP_DIR, `${uniqueId}_${i}.in`);
            fs.writeFileSync(inputFile, tc.input || "");

            const executeCmd =
              process.platform === "win32"
                ? `"${exeFile}" < "${inputFile}"`
                : `"./${uniqueId}.out" < "${inputFile}"`;

            exec(
              executeCmd,
              { timeout: 3000, cwd: TEMP_DIR },
              (error, stdout, stderr) => {
                if (error) {
                  if (error.killed) {
                    reject({
                      type: "runtime",
                      error: "Time Limit Exceeded (3 seconds)",
                    });
                  } else {
                    reject({
                      type: "runtime",
                      error: stderr || error.message,
                    });
                  }
                } else {
                  resolve(stdout);
                }
              }
            );
          }),
      });

      results.push(...cppResults);
    } else if (language === "java") {
      const className = `Main_${uniqueId.replace(/-/g, "_")}`;
      const codeFile = path.join(TEMP_DIR, `${className}.java`);
      
      // Update the code to match the unique class name
      const updatedCode = code.replace(/public\s+class\s+Main\b/, `public class ${className}`);
      fs.writeFileSync(codeFile, updatedCode);

      await new Promise((resolve, reject) => {
        exec(
          `${javacCommand} "${codeFile}"`,
          { cwd: TEMP_DIR, timeout: 5000 },
          (error, _stdout, stderr) => {
            if (error) {
              if (error.killed) {
                reject({ type: "compile", error: "Compilation Time Limit Exceeded (5s)" });
              } else {
                reject({ type: "compile", error: stderr || error.message });
              }
            } else {
              resolve();
            }
          }
        );
      });

      const javaResults = await runAgainstTestCases({
        testCases,
        execute: (tc, i) =>
          new Promise((resolve, reject) => {
            const inputFile = path.join(TEMP_DIR, `${uniqueId}_${i}.in`);
            fs.writeFileSync(inputFile, tc.input || "");

            exec(
              `${javaCommand} -cp "${TEMP_DIR}" ${className} < "${inputFile}"`,
              { timeout: 3000, cwd: TEMP_DIR },
              (error, stdout, stderr) => {
                if (error) {
                  if (error.killed) {
                    reject({
                      type: "runtime",
                      error: "Time Limit Exceeded (3 seconds)",
                    });
                  } else {
                    reject({
                      type: "runtime",
                      error: stderr || error.message,
                    });
                  }
                } else {
                  resolve(stdout);
                }
              }
            );
          }),
      });

      results.push(...javaResults);
    } else {
      return res.status(400).json({
        error: "Only cpp and java are supported",
        type: "validation",
      });
    }

    return res.json(results);
  } catch (err) {
    return res
      .status(400)
      .json({ error: err.error || "Compilation Error", type: err.type });
  } finally {
    try {
      if (fs.existsSync(TEMP_DIR)) {
        const files = fs.readdirSync(TEMP_DIR);
        files.forEach((file) => {
          if (file.includes(uniqueId)) {
            fs.unlinkSync(path.join(TEMP_DIR, file));
          }
        });
      }
    } catch (cleanupErr) {
      console.error("Temp file cleanup mein error aaya:", cleanupErr);
    }
  }
});

const PORT = Number(process.env.PORT) || 5001;
const server = app.listen(PORT, () => {
  console.log(`Backend mast chal raha hai bhai http://localhost:${PORT} par`);
});
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use (common on Windows: something holds 5000). Set PORT in the environment to a free port, e.g. PORT=5002 npm start`
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});
