const User = require("../models/User");

const EXPO_PUSH_API = "https://exp.host/--/api/v2/push/send";

const isExpoPushToken = (value = "") => /^ExponentPushToken\[[^\]]+\]$/.test(String(value).trim());

const uniqueTokens = (tokens = []) => [...new Set(tokens.map((t) => String(t || "").trim()).filter(Boolean))];

const sendPushToTokens = async ({ tokens = [], title = "", body = "", data = {} }) => {
  const validTokens = uniqueTokens(tokens).filter(isExpoPushToken);
  if (!validTokens.length || !title || !body) return { sent: 0, receipts: [] };

  const messages = validTokens.map((to) => ({
    to,
    sound: "default",
    title,
    body,
    data,
    priority: "high",
  }));

  const response = await fetch(EXPO_PUSH_API, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.errors?.[0]?.message || `Expo push failed (${response.status})`);
  }

  return { sent: validTokens.length, receipts: payload?.data || [] };
};

const notifyUsersByQuery = async ({ query = {}, title = "", body = "", data = {} }) => {
  const users = await User.find(query).select("expoPushTokens").lean();
  const tokens = users.flatMap((u) => (Array.isArray(u.expoPushTokens) ? u.expoPushTokens : []));
  return sendPushToTokens({ tokens, title, body, data });
};

module.exports = {
  isExpoPushToken,
  sendPushToTokens,
  notifyUsersByQuery,
};
