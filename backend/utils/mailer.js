const nodemailer = require("nodemailer");

const smtpUser = process.env.EMAIL_USER || process.env.GMAIL_USER;
const smtpPass = process.env.EMAIL_PASSWORD || process.env.GMAIL_PASS;

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

module.exports = transporter;
