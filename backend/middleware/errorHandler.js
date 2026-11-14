const mongoose = require("mongoose");

/** JSON 404 for unknown routes (must be mounted after all routes). */
const notFound = (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: `${req.method} ${req.originalUrl}`,
  });
};

/**
 * Central error handler.
 * Never leaks stack traces, file paths or driver internals to the client.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  let status = err.status || err.statusCode || 500;
  let message = "Internal server error";

  if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Invalid JSON body";
  } else if (err.type === "entity.too.large") {
    status = 413;
    message = "Request body too large";
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join("; ");
  } else if (err.code === 11000) {
    status = 409;
    message = "Duplicate entry";
  } else if (status >= 400 && status < 500 && err.expose !== false) {
    // Errors deliberately created with a 4xx status may expose their message.
    message = err.message;
  }

  if (status >= 500) {
    console.error(`[${new Date().toISOString()}] ${err.name || "Error"}:`, err.message);
    if (process.env.NODE_ENV !== "production") {
      console.error(err.stack);
    }
  }

  if (res.headersSent) return;
  res.status(status).json({ error: message });
};

module.exports = { notFound, errorHandler };
