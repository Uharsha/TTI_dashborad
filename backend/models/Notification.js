const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["HEAD", "TEACHER", "ALL"],
      default: "ALL",
      index: true,
    },
    course: {
      type: String,
      enum: ["DBMS", "CloudComputing", "Accessibility", "BasicComputers", "MachineLearning", null],
      default: null,
      index: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
