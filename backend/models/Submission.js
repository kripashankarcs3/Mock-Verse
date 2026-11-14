const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    // Firebase UID is a string (e.g. "abc123XYZ"), never an ObjectId.
    firebaseUID: { type: String, index: true, required: false },
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

submissionSchema.index({ firebaseUID: 1, createdAt: -1 });

module.exports = mongoose.model("Submission", submissionSchema);
