const mongoose = require("mongoose");

const testCaseSchema = new mongoose.Schema({
  input: { type: String, default: "" },
  expectedOutput: { type: String, default: "" },
});

const problemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    testCases: { type: [testCaseSchema], default: [] },
    isPublic: { type: Boolean, default: false },
    createdBy: { type: String, required: true }, // Firebase UID
    language: { type: String, default: "cpp" },
    code: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Problem", problemSchema);
