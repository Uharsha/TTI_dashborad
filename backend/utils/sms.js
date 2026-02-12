const clean = (value) => String(value || "").trim();

const sendSms = async ({ to, body }) => {
  const accountSid = clean(process.env.TWILIO_ACCOUNT_SID);
  const authToken = clean(process.env.TWILIO_AUTH_TOKEN);
  const from = clean(process.env.TWILIO_FROM_NUMBER);
  const provider = clean(process.env.SMS_PROVIDER || "twilio").toLowerCase();

  if (provider !== "twilio") return false;
  if (!accountSid || !authToken || !from || !to || !body) return false;

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const payload = new URLSearchParams({ From: from, To: to, Body: body });
  const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SMS failed: ${text}`);
  }
  return true;
};

module.exports = { sendSms };
