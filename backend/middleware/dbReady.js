const mongoose = require("mongoose");

const isDbReady = () => mongoose.connection.readyState === 1;

/**
 * Fails fast with 503 when MongoDB is not connected.
 * Prevents requests from hanging for the full serverSelectionTimeoutMS.
 */
const requireDB = (_req, res, next) => {
  if (!isDbReady()) {
    return res.status(503).json({
      error: "Database unavailable. Please try again shortly.",
      code: "DB_UNAVAILABLE",
    });
  }
  return next();
};

module.exports = { requireDB, isDbReady };
