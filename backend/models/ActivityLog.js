const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, trim: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    actorRole: { type: String, default: "SYSTEM", trim: true },
    actorName: { type: String, default: "", trim: true },
    admissionId: { type: mongoose.Schema.Types.ObjectId, ref: "Admission", default: null },
    candidateName: { type: String, default: "", trim: true },
    candidateCourse: { type: String, default: "", trim: true },
    note: { type: String, default: "", trim: true },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ actorRole: 1, createdAt: -1 });
activityLogSchema.index({ admissionId: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
