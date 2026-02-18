const express = require("express");
const router = express.Router();
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const dns = require("dns");

if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const Admission = require("../models/Admission");
const Notification = require("../models/Notification");
const ActivityLog = require("../models/ActivityLog");
const mailer = require("../utils/mailer");
const { sendSms } = require("../utils/sms");
const COURSE_TEACHERS = require("../utils/teacher");
const auth = require("../middleware/authMiddleware");
const normalizeUrl = (value = "") => String(value).trim().replace(/\/+$/, "");
const DASHBOARD_URL = normalizeUrl(
  process.env.DASHBOARD_URL ||
    process.env.FRONTEND_URL ||
    "https://tti-dashborad-99d7.vercel.app"
);
const resolveMailFrom = () => {
  const meta = mailer.getMailerMeta ? mailer.getMailerMeta() : null;
  if (meta?.resendConfigured) {
    return meta.resendFrom || process.env.RESEND_FROM || "TTI <onboarding@resend.dev>";
  }
  if (meta?.smtpConfigured) {
    return (
      meta.smtpUser ||
      process.env.EMAIL_USER ||
      process.env.GMAIL_USER ||
      process.env.MAIL_USER ||
      process.env.SMTP_USER
    );
  }
  return (
    process.env.RESEND_FROM ||
    process.env.EMAIL_USER ||
    process.env.GMAIL_USER ||
    process.env.MAIL_USER ||
    process.env.SMTP_USER
  );
};
const activeOnly = (query = {}) => ({ isDeleted: { $ne: true }, ...query });
const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const createNotification = async ({ title, message, role = "ALL", course = null, userId = null, meta = {} }) => {
  try {
    await Notification.create({ title, message, role, course, userId, meta });
  } catch (err) {
    console.error("Notification create failed:", err.message);
  }
};

const createActivityLog = async ({
  action,
  req = null,
  admission = null,
  note = "",
  meta = {},
  actorRole = "SYSTEM",
  actorName = "",
}) => {
  try {
    const actor = req?.user || {};
    await ActivityLog.create({
      action,
      actorId: actor?.id || null,
      actorRole: actor?.role || actorRole,
      actorName: actor?.name || actor?.email || actorName,
      admissionId: admission?._id || null,
      candidateName: admission?.name || "",
      candidateCourse: admission?.course || "",
      note,
      meta,
    });
  } catch (err) {
    console.error("Activity log failed:", err.message);
  }
};

const safeSendMail = async (mailOptions) => {
  try {
    const from = resolveMailFrom();
    const payload = from ? { from, ...mailOptions } : { ...mailOptions };
    const result = await mailer.sendMail(payload);
    return { success: true, error: null, provider: result?.provider || null };
  } catch (err) {
    console.error("Mail send failed:", err.message);
    return { success: false, error: err.message || "Unknown mail error", provider: null };
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
    const meta = mailer.getMailerMeta ? mailer.getMailerMeta() : null;
    const sender = resolveMailFrom();
    const providerAvailable =
      meta ? meta.resendConfigured || meta.smtpConfigured : Boolean(sender);

    if (!providerAvailable) {
      return res.status(500).json({
        error: "Mail provider is not configured",
        detail: "Set RESEND_API_KEY or SMTP credentials (GMAIL_USER + GMAIL_PASS).",
      });
    }

    const result = await safeSendMail({
      from: sender,
      to,
      subject: subject || "Test email - TTI",
      html: html || "<p>Resend test mail from TTI backend.</p>",
      text: text || "Resend test mail from TTI backend.",
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: "Test email failed",
        detail: result.error,
      });
    }

    return res.json({
      success: true,
      message: "Test email sent",
      sender,
      provider: result.provider || meta?.activePreference || "unknown",
    });
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
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ error: "No files were uploaded. Please attach all required documents." });
      }

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

      if (!admissionData.passport_photo || !admissionData.adhar || !admissionData.disability || !admissionData.UDID || !admissionData.Degree_memo || !admissionData.doctor) {
        return res.status(400).json({ error: "Passport Photo, Adhar, Disability, Degree Memo, and Doctor's Certificate are mandatory." });
      }

      const admission = new Admission(admissionData);
      const user = await admission.save();
      const mailStatus = { student: false, head: false };
      const mailErrors = { student: null, head: null };

      await createNotification({
        title: "New Admission Submitted",
        message: `${user.name} applied for ${user.course}.`,
        role: "HEAD",
        meta: { admissionId: user._id, type: "ADMISSION_SUBMITTED" },
      });
      await createActivityLog({
        action: "ADMISSION_SUBMITTED",
        admission: user,
        note: "New admission submitted by candidate.",
        meta: { candidateEmail: user.email, candidateMobile: user.mobile },
      });

      const headEmail = String(process.env.HEAD_EMAIL || "").trim();

      const mailFrom = resolveMailFrom();
      const withSender = (options) => (mailFrom ? { from: mailFrom, ...options } : options);

      const [studentMail, headMail] = await Promise.allSettled([
        mailer.sendMail(
          withSender({
          to: user.email,
          subject: "Admission Submitted - TTI",
          html: `Dear ${user.name}, <br> <br>

Thank you for applying to the <b>TTI Foundation</b>.<br>

We are pleased to inform you that your admission application has been <b>successfully submitted</b>. Our team will review your application, and you will be notified about the next steps via email.<br>

Please ensure that you regularly check your email for updates regarding your application status.<br><br>

Warm regards,<br>
<b>TTI Foundation - Admissions Team</b><br><br>
<p style="font-size:12px;color:#666;">
This is an automatically generated email. Replies to this message are not monitored.
</p>
`,
          text: `Dear ${user.name},

Thank you for applying to TTI Foundation.

Your admission application has been successfully submitted. Our team will review your application and notify you about the next steps by email.

Please regularly check your email for updates.

Warm regards,
TTI Foundation - Admissions Team

This is an automatically generated email. Replies are not monitored.`,
          })
        ),
        headEmail
          ? mailer.sendMail(
              withSender({
                to: headEmail,
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
<b>TTI Foundation - Admission System</b><br>
<p style="font-size:12px;color:#666;">
This is an automatically generated email. Replies to this message are not monitored.
</p>

        `,
                text: `Dear Sir/Madam,

A new admission application has been submitted and requires your review.

Applicant Details:
Name: ${user.name}
Course Applied: ${user.course}
Mobile: ${user.mobile}
Photo: ${user.passport_photo}

Dashboard: ${DASHBOARD_URL}

Regards,
TTI Foundation - Admission System

This is an automatically generated email. Replies are not monitored.`,
              })
            )
          : Promise.reject(new Error("HEAD_EMAIL is not configured.")),
      ]);

      mailStatus.student = studentMail.status === "fulfilled";
      mailStatus.head = headMail.status === "fulfilled";
      mailErrors.student =
        studentMail.status === "rejected"
          ? studentMail.reason?.message || "Failed to send candidate email."
          : null;
      mailErrors.head =
        headMail.status === "rejected" ? headMail.reason?.message || "Failed to send head email." : null;

      if (!mailStatus.student || !mailStatus.head) {
        console.error("Admission mail delivery failed:", mailErrors);
      }

      const headPhone = String(
        process.env.HEAD_PHONE ||
        process.env.HEAD_MOBILE ||
        process.env.CONTACT_NUMBER ||
        ""
      ).trim();
      if (headPhone) {
        await sendSms({
          to: headPhone,
          body: `TTI: New admission from ${user.name} for ${user.course}.`,
        }).catch((err) => console.error("SMS send failed:", err.message));
      }
      
      return res.status(201).json({
        success: true,
        message: "Admission submitted successfully!",
        admissionId: user._id,
        mailStatus,
        mailErrors,
        mailWarning:
          !mailStatus.student || !mailStatus.head
            ? "Admission saved, but one or more notification emails failed."
            : null,
      });

    } catch (err) {
      if (err && err.code === 11000) {
        return res.status(409).json({ error: "You have already submitted the form with this email or mobile." });
      }
      console.error("saveAdmission failed:", err);
      return res.status(500).json({ error: err.message || "Internal server error" });
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
    await createNotification({
      title: "Candidate Approved by Head",
      message: `${user.name} is approved for ${user.course}. Please schedule interview.`,
      role: "TEACHER",
      course: user.course,
      meta: { admissionId: user._id, type: "HEAD_APPROVED" },
    });
    await createActivityLog({
      action: "HEAD_APPROVED",
      req,
      admission: user,
      note: "Candidate approved by HEAD.",
    });

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
    await createNotification({
      title: "Candidate Rejected by Head",
      message: `${user.name} was rejected at head review stage.`,
      role: "HEAD",
      meta: { admissionId: user._id, type: "HEAD_REJECTED" },
    });
    await createActivityLog({
      action: "HEAD_REJECTED",
      req,
      admission: user,
      note: "Candidate rejected by HEAD.",
    });

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
    await createNotification({
      title: "Application Deleted",
      message: `${user.name}'s application was deleted by HEAD.`,
      role: "HEAD",
      meta: { admissionId: user._id, type: "HEAD_DELETED" },
    });
    await createActivityLog({
      action: "HEAD_DELETED",
      req,
      admission: user,
      note: reason ? `Deleted with reason: ${reason}` : "Deleted without reason.",
      meta: { reason },
    });

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
    await createNotification({
      title: "Interview Scheduled",
      message: `${updatedStudent.name}'s interview is scheduled on ${date} at ${time}.`,
      role: "HEAD",
      meta: { admissionId: updatedStudent._id, type: "INTERVIEW_SCHEDULED" },
    });
    await createActivityLog({
      action: "INTERVIEW_SCHEDULED",
      req,
      admission: updatedStudent,
      note: `Interview scheduled on ${date} at ${time}.`,
      meta: { date, time, platform, link },
    });

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
    await createNotification({
      title: "Final Selection Done",
      message: `${user.name} is selected by teacher for ${user.course}.`,
      role: "HEAD",
      meta: { admissionId: user._id, type: "FINAL_SELECTED" },
    });
    await createActivityLog({
      action: "FINAL_SELECTED",
      req,
      admission: user,
      note: "Candidate finally selected by TEACHER.",
    });

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
    await createNotification({
      title: "Final Rejection Done",
      message: `${user.name} was finally rejected by teacher for ${user.course}.`,
      role: "HEAD",
      meta: { admissionId: user._id, type: "FINAL_REJECTED" },
    });
    await createActivityLog({
      action: "FINAL_REJECTED",
      req,
      admission: user,
      note: "Candidate finally rejected by TEACHER.",
    });

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

// AUDIT LOGS
router.get("/audit-logs", auth, async (req, res) => {
  try {
    const role = String(req.user.role || "").toUpperCase();
    const limit = Math.min(parsePositiveInt(req.query?.limit, 100), 300);
    const query = {};
    if (role === "TEACHER") {
      query.$or = [{ actorId: req.user.id }, { actorRole: "SYSTEM" }];
    }

    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({ success: true, logs, count: logs.length });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to fetch audit logs" });
  }
});

/* ================== NOTIFICATIONS ================== */
router.get("/notifications", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = String(req.user.role || "").toUpperCase();
    const course = req.user.course || null;
    const requestedDays = String(req.query?.days || "").trim().toLowerCase();
    const defaultDays = parsePositiveInt(process.env.NOTIFICATION_WINDOW_DAYS, 30);
    const days =
      requestedDays === "all"
        ? 0
        : parsePositiveInt(requestedDays, defaultDays);
    const limit = Math.min(parsePositiveInt(req.query?.limit, 50), 200);
    const createdAtQuery =
      days > 0
        ? { createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } }
        : {};

    const roleFilter =
      role === "TEACHER"
        ? [{ role: "TEACHER", $or: [{ course: null }, { course }] }, { role: "ALL" }]
        : role === "HEAD"
          ? [{ role: "HEAD" }, { role: "ALL" }]
          : [{ role: "ALL" }];

    const notifications = await Notification.find({
      $or: [...roleFilter, { userId }],
      ...createdAtQuery,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const withReadState = notifications.map((n) => ({
      ...n,
      isRead: Array.isArray(n.readBy)
        ? n.readBy.some((entry) => String(entry) === String(userId))
        : false,
    }));

    const unreadCount = withReadState.filter((n) => !n.isRead).length;
    return res.json({ success: true, unreadCount, notifications: withReadState, windowDays: days });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to fetch notifications" });
  }
});

router.put("/notifications/:id/read", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const note = await Notification.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { readBy: userId } },
      { new: true }
    );
    if (!note) return res.status(404).json({ error: "Notification not found" });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to mark read" });
  }
});

router.put("/notifications/read-all", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = String(req.user.role || "").toUpperCase();
    const course = req.user.course || null;
    const roleFilter =
      role === "TEACHER"
        ? [{ role: "TEACHER", $or: [{ course: null }, { course }] }, { role: "ALL" }]
        : role === "HEAD"
          ? [{ role: "HEAD" }, { role: "ALL" }]
          : [{ role: "ALL" }];

    await Notification.updateMany(
      { $or: [...roleFilter, { userId }] },
      { $addToSet: { readBy: userId } }
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to mark all as read" });
  }
});

module.exports = router;





