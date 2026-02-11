const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["HEAD", "TEACHER"],
      required: true,
    },
    course: {
      type: String,
      enum: ["DBMS", "CloudComputing", "Accessibility", "BasicComputers", "MachineLearning"],
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
