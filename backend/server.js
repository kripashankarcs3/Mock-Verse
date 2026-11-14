require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const { isDbReady } = require("./middleware/dbReady");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// ── App-level hardening ─────────────────────────────────────────────────────
app.disable("x-powered-by");

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173,http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin/non-browser clients (no Origin header) and allowlisted origins.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  })
);

// Code payloads can be larger than the 100 kB default but stay bounded.
app.use(express.json({ limit: "1mb" }));

// ── MongoDB Connection ───────────────────────────────────────────────────────
connectDB();

// ── Health ───────────────────────────────────────────────────────────────────
const healthPayload = () => ({
  status: isDbReady() ? "ok" : "degraded",
  database: isDbReady() ? "connected" : "disconnected",
  judge0: process.env.JUDGE0_API_KEY ? "rapidapi" : "public",
  uptimeSeconds: Math.round(process.uptime()),
});

app.get(["/health", "/api/health"], (_req, res) => {
  res.status(isDbReady() ? 200 : 503).json(healthPayload());
});

// ── API Routes ───────────────────────────────────────────────────────────────
const { requireDB } = require("./middleware/dbReady");
app.use("/api/users", requireDB, require("./routes/users"));
app.use("/api/problems", requireDB, require("./routes/problems"));
app.use("/api/submissions", requireDB, require("./routes/submissions"));
// Execution does not require Mongo (submit history is best-effort).
app.use("/api/execution", require("./routes/codeRoutes"));

// ── 404 + central error handling (must be last) ──────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 5001;
const server = app.listen(PORT, () => {
  console.log(`🚀 Backend chal raha hai: http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} already in use. Set PORT in .env to a free port.`);
  } else {
    console.error(err);
  }
  process.exit(1);
});

// ── Graceful shutdown ────────────────────────────────────────────────────────
const shutdown = async (signal) => {
  console.log(`${signal} received — shutting down...`);
  server.close(async () => {
    try {
      await mongoose.disconnect();
    } catch {
      /* ignore */
    }
    process.exit(0);
  });
  // Don't hang forever if connections stay open.
  setTimeout(() => process.exit(0), 10_000).unref();
};

["SIGINT", "SIGTERM"].forEach((signal) => process.on(signal, () => shutdown(signal)));
