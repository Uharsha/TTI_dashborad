const { Resend } = require("resend");

const clean = (value) => String(value || "").trim().replace(/^['"]|['"]$/g, "");

const apiKey = clean(process.env.RESEND_API_KEY || process.env.RESEND_KEY);
const defaultFrom = clean(
  process.env.RESEND_FROM ||
    process.env.EMAIL_USER ||
    process.env.GMAIL_USER ||
    process.env.MAIL_USER
);

if (!apiKey) {
  console.warn("Mailer not configured: missing RESEND_API_KEY.");
}
if (!defaultFrom) {
  console.warn("Mailer not configured: missing RESEND_FROM.");
}

const resend = apiKey ? new Resend(apiKey) : null;

const sendMail = async (options = {}) => {
  if (!resend) {
    throw new Error("Resend client is not configured (missing RESEND_API_KEY).");
  }

  const {
    from,
    to,
    subject,
    html,
    text,
    cc,
    bcc,
    replyTo,
  } = options;

  const resolvedFrom = clean(from || defaultFrom);
  if (!resolvedFrom) {
    throw new Error("Missing sender email (RESEND_FROM).");
  }

  return resend.emails.send({
    from: resolvedFrom,
    to,
    subject,
    html,
    text,
    cc,
    bcc,
    replyTo,
  });
};

module.exports = { sendMail };
