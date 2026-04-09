const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false }, // Keeping it optional in case user is not logged in / testing
    problemId: { type: mongoose.Schema.Types.ObjectId, ref: "Problem", required: false },
    code: { type: String, required: true },
    language: { type: String, required: true },
    status: { type: String, required: true }, // "Passed", "Failed", "TLE", "Compilation Error", "Runtime Error"
    executionTime: { type: Number }, // in ms
    memoryStats: { type: Number }, // in KB
    testcasesPassed: { type: String }, // e.g. "5/10"
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", submissionSchema);
