const mongoose = require("mongoose");

const admissionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true, unique: true },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },

    state: { type: String, required: true },
    district: { type: String, required: true },
    disabilityStatus: { type: String, required: true },
    education: { type: String, required: true },
    enrolledCourse: { type: String, required: true },
    basicComputerKnowledge: { type: String, enum: ["Fair", "Good", "Excellent", "Outstanding", "None"], required: true },
    basicEnglishSkills: { type: String, enum: ["Fair", "Good", "Excellent", "Outstanding", "None"], required: true },
    ScreenReader: { type: String, enum: ["Fair", "Good", "Excellent", "Outstanding", "None"], required: true },
    course: {
      type: String,
      enum: [
        "DBMS",
        "CloudComputing",
        "Accessibility",
        "BasicComputers",
        "MachineLearning"
      ],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "SUBMITTED",
        "HEAD_ACCEPTED",
        "HEAD_REJECTED",
        "INTERVIEW_SCHEDULED",
        "SELECTED",
        "REJECTED",
      ],
      default: "SUBMITTED",
    },

    teacherStatus: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED"],
      default: "PENDING",
    },

    finalStatus: {
      type: String,
      enum: ["PENDING", "SELECTED", "REJECTED"],
      default: "PENDING",
    },

    decisionDone: { type: Boolean, default: false },

    interview: {
      date: Date,
      time: String,
      platform: String,
      link: String,
    },

    passport_photo: String,
    adhar: String,
    UDID: String,
    disability: String,
    Degree_memo: String,
    doctor: String,
    RulesDeclaration: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admission", admissionSchema);
