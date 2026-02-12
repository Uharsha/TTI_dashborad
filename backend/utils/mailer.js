const nodemailer = require("nodemailer");

const clean = (value) => String(value || "").trim().replace(/^['"]|['"]$/g, "");

const smtpUser = clean(
  process.env.EMAIL_USER ||
    process.env.GMAIL_USER ||
    process.env.MAIL_USER ||
    process.env.SMTP_USER
);
const rawSmtpPass =
  process.env.EMAIL_PASSWORD ||
  process.env.EMAIL_PASS ||
  process.env.GMAIL_PASS ||
  process.env.GMAIL_PASSWORD ||
  process.env.MAIL_PASS ||
  process.env.SMTP_PASS;
const smtpPass = rawSmtpPass ? clean(rawSmtpPass).replace(/\s+/g, "") : "";

if (!smtpUser || !smtpPass) {
  console.warn("Mailer not configured: missing EMAIL/GMAIL credentials.");
}

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

module.exports = transporter;
