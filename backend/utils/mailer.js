const nodemailer = require("nodemailer");

const smtpUser = process.env.EMAIL_USER || process.env.GMAIL_USER;
const rawSmtpPass =
  process.env.EMAIL_PASSWORD ||
  process.env.EMAIL_PASS ||
  process.env.GMAIL_PASS;
const smtpPass = rawSmtpPass ? String(rawSmtpPass).replace(/\s+/g, "") : "";

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
