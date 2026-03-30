const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    problemId: { type: mongoose.Schema.Types.ObjectId, ref: "Problem", required: false },
    language: { type: String, enum: ["cpp", "java"], required: true },
    result: { type: String, enum: ["Accepted", "Wrong Answer", "Runtime Error", "Time Limit Exceeded"], required: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
    runtimeMs: { type: Number, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", submissionSchema);
