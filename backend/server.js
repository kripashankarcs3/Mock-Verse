require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();
app.use(cors());
app.use(express.json());

// ── MongoDB Connection ───────────────────────────────────────────────────────
connectDB();

// ── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/users", require("./routes/users"));
app.use("/api/problems", require("./routes/problems"));
app.use("/api/execution", require("./routes/codeRoutes"));

app.get("/health", (_req, res) => {
  res.json({ message: "Backend is running with Judge0 integration" });
});

// Start Server
const PORT = Number(process.env.PORT) || 5001;
const server = app.listen(PORT, () => {
  console.log(`🚀 Backend mast chal raha hai bhai http://localhost:${PORT} par`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Please set PORT in .env to a free port.`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
