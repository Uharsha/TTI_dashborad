const nodemailer = require("nodemailer");
const dns = require("dns");

// Some environments resolve Gmail SMTP to IPv6 first, which can fail with
// ENETUNREACH when IPv6 routing is unavailable. Prefer IPv4 in that case.
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

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
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

module.exports = transporter;
