const nodemailer = require("nodemailer");
const dns = require("dns");

if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const clean = (value) => String(value || "").trim().replace(/^['"]|['"]$/g, "");

const resendApiKey = clean(process.env.RESEND_API_KEY);
const resendFrom = clean(process.env.RESEND_FROM || process.env.RESEND_EMAIL_FROM || "TTI <onboarding@resend.dev>");

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

const smtpConfigured = Boolean(smtpUser && smtpPass);
const resendConfigured = Boolean(resendApiKey);

if (!resendConfigured && !smtpConfigured) {
  console.warn("Mailer not configured: missing RESEND_API_KEY and SMTP credentials.");
}

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  : null;

const splitRecipients = (value) => {
  if (Array.isArray(value)) return value.map((v) => clean(v)).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((v) => clean(v))
    .filter(Boolean);
};

const sendViaResend = async (options = {}) => {
  const to = splitRecipients(options.to);
  if (!to.length) throw new Error("Resend: recipient email is required.");

  const payload = {
    from: clean(options.from || resendFrom),
    to,
    subject: options.subject || "",
  };
  if (options.html) payload.html = options.html;
  if (options.text) payload.text = options.text;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reason = data?.message || data?.error || `Resend HTTP ${response.status}`;
    throw new Error(`Resend send failed: ${reason}`);
  }

  return { provider: "resend", id: data?.id || null };
};

const sendViaSmtp = async (options = {}) => {
  if (!transporter) throw new Error("SMTP is not configured.");
  const info = await transporter.sendMail(options);
  return { provider: "smtp", id: info?.messageId || null };
};

const sendMail = async (options = {}) => {
  if (resendConfigured) {
    try {
      return await sendViaResend(options);
    } catch (resendErr) {
      if (!smtpConfigured) throw resendErr;
      console.error("Resend failed, falling back to SMTP:", resendErr.message);
    }
  }

  if (!smtpConfigured) {
    throw new Error("No mail provider configured. Set RESEND_API_KEY or SMTP credentials.");
  }

  return sendViaSmtp(options);
};

const getMailerMeta = () => ({
  resendConfigured,
  smtpConfigured,
  activePreference: resendConfigured ? "resend" : smtpConfigured ? "smtp" : "none",
  resendFrom,
  smtpUser,
});

module.exports = { sendMail, getMailerMeta };
