const express = require("express");
const router = express.Router();
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

const Admission = require("../models/Admission");
const mailer = require("../utils/mailer");
const COURSE_TEACHERS = require("../utils/teacher");
const auth = require("../models/Middleware/Auth");
const normalizeUrl = (value = "") => String(value).trim().replace(/\/+$/, "");
const DASHBOARD_URL = normalizeUrl(
  process.env.DASHBOARD_URL ||
    process.env.FRONTEND_URL ||
    "https://tti-dashborad-99d7.vercel.app"
);
const MAIL_FROM =
  process.env.EMAIL_USER ||
  process.env.GMAIL_USER ||
  process.env.MAIL_USER ||
  process.env.SMTP_USER;
const activeOnly = (query = {}) => ({ isDeleted: { $ne: true }, ...query });

const safeSendMail = async (mailOptions) => {
  try {
    await mailer.sendMail({
      from: MAIL_FROM,
      ...mailOptions,
    });
    return true;
  } catch (err) {
    console.error("Mail send failed:", err.message);
    return false;
  }
};

// Simple admin-only test mail endpoint for verifying SMTP config
router.post("/test-mail", auth, async (req, res) => {
  try {
    if (req.user.role !== "HEAD") {
      return res.status(403).json({ error: "Only HEAD can send test emails" });
    }

    const { to, subject, html, text } = req.body || {};
    if (!to) {
      return res.status(400).json({ error: "Recipient email (to) is required" });
    }

    await mailer.sendMail({
      from: MAIL_FROM,
      to,
      subject: subject || "Test email - TTI",
      html: html || "<p>Resend test mail from TTI backend.</p>",
      text: text || "Resend test mail from TTI backend.",
    });

    return res.json({ success: true, message: "Test email sent" });
  } catch (err) {
    console.error("Test mail error:", err.message);
    return res.status(500).json({ error: "Test email failed", detail: err.message });
  }
});

/* ================== CLOUDINARY CONFIG ================== */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ================== MULTER STORAGE ================== */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "admissions",
    allowed_formats: ["jpg", "jpeg", "png", "pdf", "webp"],
    public_id: (req, file) => Date.now() + "-" + file.originalname,
  },
});

const upload = multer({ storage });

/* ================== SAVE ADMISSION ================== */
router.post(
  "/saveAdmission",
  upload.fields([
    { name: "passport_photo", maxCount: 1 },
    { name: "adhar", maxCount: 1 },
    { name: "UDID", maxCount: 1 },
    { name: "disability", maxCount: 1 },
    { name: "marks", maxCount: 1 },
    { name: "Degree_memo", maxCount: 1 },
    { name: "doctor", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      // 1. Check if files exist at all to prevent crash
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ error: "No files were uploaded. Please attach all required documents." });
      }

      // 2. Safely extract paths using optional chaining
      const admissionData = {
        ...req.body,
        course: req.body.course ? req.body.course.trim() : null,
        RulesDeclaration: Boolean(req.body.declaration === "true"),
        passport_photo: req.files["passport_photo"]?.[0]?.path || null,
        adhar: req.files["adhar"]?.[0]?.path || null,
        UDID: req.files["UDID"]?.[0]?.path || null,
        disability: req.files["disability"]?.[0]?.path || null,
        Degree_memo: req.files["marks"]?.[0]?.path || req.files["Degree_memo"]?.[0]?.path || null,
        doctor: req.files["doctor"]?.[0]?.path || null,
      };

      // 3. Simple validation: Ensure core files are present
      if (!admissionData.passport_photo || !admissionData.adhar || !admissionData.disability || !admissionData.UDID || !admissionData.Degree_memo || !admissionData.doctor) {
        return res.status(400).json({ error: "Passport Photo, Adhar, Disability, Degree Memo, and Doctor's Certificate are mandatory." });
      }

      const admission = new Admission(admissionData);
      const user = await admission.save();

      /* 📧 MAIL TO STUDENT */
      await safeSendMail({
        to: user.email,
        subject: "Admission Submitted – TTI",
        html: `Dear ${user.name}, <br> <br>

Thank you for applying to the <b>TTI Foundation</b>.<br>

We are pleased to inform you that your admission application has been <b>successfully submitted</b>. Our team will review your application, and you will be notified about the next steps via email.<br>

Please ensure that you regularly check your email for updates regarding your application status.<br><br>

Warm regards,<br>
<b>TTI Foundation – Admissions Team</b><br><br>
<p style="font-size:12px;color:#666;">
This is an automatically generated email. Replies to this message are not monitored.
</p>
`,
      });

      /* 📧 MAIL TO HEAD */
      if (!process.env.HEAD_EMAIL) {
        console.error("HEAD_EMAIL is not configured; skipping head notification email.");
      } else {
      await safeSendMail({
        to: process.env.HEAD_EMAIL,
        subject: "New Admission Request",
        html: `
         Dear Sir/Madam,<br>

A new admission application has been submitted and requires your review.<br><br>

<b>Applicant Details:</b><br>
Name: ${user.name}<br>
Course Applied: ${user.course}<br>
<p>
      <a href="${user.passport_photo}" target="_blank">
        View Full Image
      </a>
    </p>
    <p>call: <a href="tel:${user.mobile}">${user.mobile}</a></p>

Please log in to the admin dashboard to review and take the necessary action.<br>
Dashboard: <a href="${DASHBOARD_URL}" target="_blank">${DASHBOARD_URL}</a><br><br>

Regards,<br>
<b>TTI Foundation – Admission System</b><br>
<p style="font-size:12px;color:#666;">
This is an automatically generated email. Replies to this message are not monitored.
</p>

        `,
      });
      }

      res.status(201).json({ success: true, message: "Admission submitted successfully!" });

    } catch (err) {
      if (err && err.code === 11000) {
        return res.status(409).json({ error: "You have already submitted the form with this email or mobile." });
      }
      console.error("saveAdmission failed:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  }
);

/* ================== HEAD APPROVE ================== */
router.put("/head/approve/:id", auth, async (req, res) => {
  try {
    // Only HEAD can approve at this stage
    if (req.user.role !== "HEAD") {
      return res.status(403).json({ error: "Only HEAD can approve applications" });
    }

    const user = await Admission.findOne(activeOnly({ _id: req.params.id }));
    if (!user) return res.status(404).json({ message: "Invalid request" });

    const teacherEntry = COURSE_TEACHERS[user.course];
    if (!teacherEntry) {
      return res.status(400).json({ error: `No teacher found for course: ${user.course}` });
    }
    const teachers = Array.isArray(teacherEntry) ? teacherEntry : [teacherEntry];
    const teacherEmails = teachers.map((t) => t.email).filter(Boolean);
    const teacherNames = teachers
      .map((t) => t.name)
      .filter(Boolean)
      .join(" and ");
    if (!teacherEmails.length) {
      return res.status(400).json({ error: `No teacher email configured for course: ${user.course}` });
    }

    user.status = "HEAD_ACCEPTED";
    await user.save();

    /* 📧 MAIL ONLY TO TEACHER */
    await safeSendMail({
      to: teacherEmails.join(", "),
      subject: "Candidate Approved – Schedule Interview",
      html: `
       Dear ${teacherNames || "Teacher"},<br>

We would like to inform you that the following candidate has been <b>approved by the Head</b> and is ready for the interview process.<br><br>

<b>Candidate Details</b><br>
Name: ${user.name}<br>
Course: ${user.course}<br>
<p>
      <a href="${user.passport_photo}" target="_blank">
        View Full Image
      </a>
    </p>

Please log in to the dashboard and schedule the interview at your convenience.<br>
Dashboard: <a href="${DASHBOARD_URL}" target="_blank">${DASHBOARD_URL}</a><br><br>

Best regards,<br>
<b>TTI Foundation – Admissions Team</b><br>
<p style="font-size:12px;color:#666;">
This is an automatically generated email. Replies to this message are not monitored.
</p>
      `,
    });

    res.json({ success: true, message: "Head approved and Teacher notified." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* ================== HEAD REJECT ================== */
router.put("/head/reject/:id", auth, async (req, res) => {
  try {
    // Only HEAD can reject at this stage
    if (req.user.role !== "HEAD") {
      return res.status(403).json({ error: "Only HEAD can reject applications" });
    }

    const user = await Admission.findOne(activeOnly({ _id: req.params.id }));
    if (!user) return res.status(404).json({ message: "Invalid request" });

    user.status = "HEAD_REJECTED";
    user.finalStatus = "REJECTED";
    user.decisionDone = true;
    await user.save();

    await safeSendMail({
      to: user.email,
      subject: "Application Rejected",
      html: `
      <p>Dear ${user.name},</p>

    <p>
      Thank you for your interest in the programs offered by 
      <b>TTI Foundation</b>.
    </p>

    <p>
      After careful review of your application, we regret to inform you that
      your application has not been approved at this stage.
    </p>

    <p>
      We appreciate the time and effort you put into submitting your application
      and encourage you to apply again in the future if you meet the eligibility criteria.
    </p>

    <p>
      We wish you all the best in your future endeavors.
    </p>

    <br>
    Warm regards,<br>
    <b>TTI Foundation – Admissions Team</b>

    <br><br>
    <hr>
    <p style="font-size:12px;color:#666;">
      This is an automatically generated email. Replies to this message are not monitored.
</p>`,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================== HEAD DELETE (SOFT DELETE) ================== */
router.put("/head/delete/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "HEAD") {
      return res.status(403).json({ error: "Only HEAD can delete applications" });
    }

    const user = await Admission.findOne(activeOnly({ _id: req.params.id }));
    if (!user) return res.status(404).json({ error: "Application not found or already deleted" });

    const reason = String(req.body?.reason || "").trim();
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedBy = req.user.id || null;
    user.deletionReason = reason.slice(0, 500);
    await user.save();

    return res.json({ success: true, message: "Application deleted successfully." });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Delete failed" });
  }
});

/* ================== SCHEDULE INTERVIEW (TEACHER ONLY) ================== */
router.post("/schedule-interview/:id", auth, async (req, res) => {
  try {
    // Only TEACHER can schedule interviews
    if (req.user.role !== "TEACHER") {
      return res.status(403).json({ error: "Only TEACHER can schedule interviews" });
    }

    const { date, time, platform, link } = req.body;

    const student = await Admission.findOne(activeOnly({ _id: req.params.id }));
    if (!student) return res.status(404).json({ message: "Invalid request" });

    // Verify teacher's course matches student's course
    if (student.course !== req.user.course) {
      return res.status(403).json({ error: "You can only schedule interviews for your course candidates" });
    }

    const updatedStudent = await Admission.findByIdAndUpdate(
      req.params.id,
      { interview: { date, time, platform, link }, status: "INTERVIEW_SCHEDULED" },
      { new: true }
    );

    // 📧 Mail interview details to student
    await safeSendMail({
      to: updatedStudent.email,
      subject: "Interview Scheduled – TTI",
      html: `
       Dear ${updatedStudent.name},<br>

We are pleased to inform you that your interview has been scheduled.<br><br>

<b>Interview Details:</b><br>
Date: ${date}<br>
Time: ${time}<br>
Platform: ${platform}<br>
Meeting Link: ${link}<br><br>

Please ensure that you join the interview on time.<br>
We wish you the very best.<br><br>

Sincerely,<br>
<b>TTI Foundation – Admissions Team</b><br>
 <p style="font-size:12px;color:#666;">
This is an automatically generated email. Replies to this message are not monitored.
</p>
      `,
    });

    res.json({ success: true, message: "Interview scheduled & mail sent"});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================== FINAL APPROVE (TEACHER ONLY) ================== */
router.put("/final/approve/:id", auth, async (req, res) => {
  try {
    // Only TEACHER can give final approval
    if (req.user.role !== "TEACHER") {
      return res.status(403).json({ error: "Only TEACHER can give final approval" });
    }

    const user = await Admission.findOne(activeOnly({ _id: req.params.id }));
    if (!user) return res.status(404).json({ message: "Invalid request" });

    // Verify teacher's course matches student's course
    if (user.course !== req.user.course) {
      return res.status(403).json({ error: "You can only approve candidates from your course" });
    }

    user.status = "SELECTED";
    user.finalStatus = "SELECTED";
    user.decisionDone = true;
    await user.save();

    // 📧 Congratulations mail
    await safeSendMail({
      to: user.email,
      subject: "Congratulations – TTI",
      html: `
      Dear ${user.name},<br>

Congratulations!<br>

We are delighted to inform you that you have been <b>successfully selected</b> after the interview process for the <b>${user.course}</b> course at <b>TTI Foundation</b>.<br>

Further instructions regarding onboarding will be shared with you shortly.<br>

We look forward to having you with us.<br><br>

Warm regards,<br>
<b>TTI Foundation – Admissions Team</b><br>
<p style="font-size:12px;color:#666;">
This is an automatically generated email. Replies to this message are not monitored.
</p>
`,
    });

    res.json({ success: true, message: "Final approval done & mail sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================== FINAL REJECT (TEACHER ONLY) ================== */
router.put("/final/reject/:id", auth, async (req, res) => {
  try {
    // Only TEACHER can give final rejection
    if (req.user.role !== "TEACHER") {
      return res.status(403).json({ error: "Only TEACHER can give final rejection" });
    }

    const user = await Admission.findOne(activeOnly({ _id: req.params.id }));
    if (!user) return res.status(404).json({ message: "Invalid request" });

    // Verify teacher's course matches student's course
    if (user.course !== req.user.course) {
      return res.status(403).json({ error: "You can only reject candidates from your course" });
    }

    user.status = "REJECTED";
    user.finalStatus = "REJECTED";
    user.decisionDone = true;
    await user.save();

    // 📧 Apology mail
    await safeSendMail({
      to: user.email,
      subject: "Interview Result – TTI",
      html: `
      Dear ${user.name},<br>

Thank you for taking the time to apply and attend the interview with <b>TTI Foundation</b>.<br>

After careful consideration, we regret to inform you that you have not been selected at this time.<br>

We truly appreciate your interest and encourage you to apply again in the future.<br>

We wish you all the best in your academic and professional journey.<br><br>

Sincerely,<br>
<b>TTI Foundation – Admissions Team</b><br>
<p style="font-size:12px;color:#666;">
This is an automatically generated email. Replies to this message are not monitored.
</p>
      `,
    });

    res.json({ success: true, message: "Final rejection done & mail sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================== DASHBOARD APIs ================== */

// GET ADMISSIONS - ROLE-BASED FILTERING
router.get("/get-data", auth, async (req, res) => {
  try {
    const { role, course } = req.user;
    let query = {};

    if (role === "TEACHER") {
      // Teachers see only HEAD_ACCEPTED applications for their course
      query = { 
        course: course,
        status: "HEAD_ACCEPTED"
      };
    }
    // HEAD sees all applications (query remains empty)

    const admissions = await Admission.find(activeOnly(query));
    res.json(admissions);
  } catch (err) {
    res.status(500).json({ error: "Error fetching admissions" });
  }
});

// HEAD SUBMITTED APPLICATIONS
router.get("/submitted", auth, async (req, res) => {
  if (req.user.role !== "HEAD") {
    return res.status(403).json({ error: "Only HEAD can view submitted applications" });
  }
  res.json(await Admission.find(activeOnly({ status: "SUBMITTED" })));
});

// HEAD ACCEPTED APPLICATIONS
router.get("/head-accepted", auth, async (req, res) => {
  if (req.user.role !== "HEAD") {
    return res.status(403).json({ error: "Only HEAD can view head-accepted applications" });
  }
  res.json(await Admission.find(activeOnly({ status: "HEAD_ACCEPTED" })));
});

// HEAD REJECTED APPLICATIONS
router.get("/head-rejected", auth, async (req, res) => {
  if (req.user.role !== "HEAD") {
    return res.status(403).json({ error: "Only HEAD can view head-rejected applications" });
  }
  res.json(await Admission.find(activeOnly({ status: "HEAD_REJECTED" })));
});

// HEAD FINAL SELECTED CANDIDATES
router.get("/head/final-selected", auth, async (req, res) => {
  if (req.user.role !== "HEAD") {
    return res.status(403).json({ error: "Only HEAD can view final selected candidates" });
  }
  res.json(await Admission.find(activeOnly({ finalStatus: "SELECTED" })));
});

// HEAD FINAL REJECTED CANDIDATES
router.get("/head/final-rejected", auth, async (req, res) => {
  if (req.user.role !== "HEAD") {
    return res.status(403).json({ error: "Only HEAD can view final rejected candidates" });
  }
  res.json(await Admission.find(activeOnly({ finalStatus: "REJECTED" })));
});

// TEACHER APPROVED CANDIDATES
router.get("/teacher-accepted", auth, async (req, res) => {
  if (req.user.role !== "TEACHER" && req.user.role !== "HEAD") {
    return res.status(403).json({ error: "Only TEACHER or HEAD can view approved candidates" });
  }

  const query =
    req.user.role === "HEAD"
      ? { finalStatus: "SELECTED" }
      : { course: req.user.course, finalStatus: "SELECTED" };

  res.json(await Admission.find(activeOnly(query)));
});

// TEACHER HEAD ACCEPTED CANDIDATES (for interview scheduling)
router.get("/teacher-head-accepted", auth, async (req, res) => {
  if (req.user.role !== "TEACHER") {
    return res.status(403).json({ error: "Only TEACHER can view head-accepted candidates" });
  }
  res.json(await Admission.find(activeOnly({ course: req.user.course, status: "HEAD_ACCEPTED" })));
});

// TEACHER REJECTED CANDIDATES
router.get("/teacher-rejected", auth, async (req, res) => {
  if (req.user.role !== "TEACHER" && req.user.role !== "HEAD") {
    return res.status(403).json({ error: "Only TEACHER or HEAD can view rejected candidates" });
  }

  const query =
    req.user.role === "HEAD"
      ? { finalStatus: "REJECTED" }
      : { course: req.user.course, finalStatus: "REJECTED" };

  res.json(await Admission.find(activeOnly(query)));
});

// INTERVIEW SCHEDULED
router.get("/interview_required", auth, async (req, res) => {
  const { role, course } = req.user;
  let query = { status: "INTERVIEW_SCHEDULED" };

  if (role === "TEACHER") {
    query.course = course; // Teachers see only their course interviews
  }

  res.json(await Admission.find(activeOnly(query)));
});

module.exports = router;





