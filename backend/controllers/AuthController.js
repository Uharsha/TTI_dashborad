const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const transporter = require("../utils/mailer");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const SENDER_EMAIL =
  process.env.EMAIL_USER ||
  process.env.GMAIL_USER ||
  process.env.MAIL_USER ||
  process.env.SMTP_USER;

const getRequesterFromToken = (req) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : "";

  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        course: user.course,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        course: user.course,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// REGISTER
const register = async (req, res) => {
  try {
    const { name, email, password, role, course } = req.body;
    const normalizedRole = String(role || "").trim().toUpperCase();
    const normalizedCourse = String(course || "").trim();

    if (!name || !email || !password || !normalizedRole) {
      return res.status(400).json({ error: "Name, email, password, and role are required" });
    }

    if (!["HEAD", "TEACHER"].includes(normalizedRole)) {
      return res.status(400).json({ error: "Invalid role. Use HEAD or TEACHER." });
    }

    if (normalizedRole === "TEACHER" && !normalizedCourse) {
      return res.status(400).json({ error: "Course is required for TEACHER." });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const requester = getRequesterFromToken(req);
    const headExists = await User.exists({ role: "HEAD" });
    if (headExists && requester?.role !== "HEAD") {
      return res.status(403).json({ error: "Only HEAD can create new accounts." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: normalizedRole,
      course: normalizedRole === "TEACHER" ? normalizedCourse : null,
    });

    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        course: user.course,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        course: user.course,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "Email is not registered." });
    }

    const token = jwt.sign(
      { id: user._id, purpose: "reset" },
      `${process.env.JWT_SECRET}${user.password}`,
      { expiresIn: "20m" }
    );

    const resetUrl = `${FRONTEND_URL}/auth?mode=reset&token=${encodeURIComponent(token)}`;

    if (!SENDER_EMAIL) {
      return res.status(500).json({
        error: "Email sender is not configured on server.",
        detail: "Set EMAIL_USER or GMAIL_USER in backend environment variables.",
      });
    }

    try {
      await transporter.sendMail({
        from: SENDER_EMAIL,
        to: user.email,
        subject: "Reset your password - TTI Dashboard",
        html: `
          <p>Hello ${user.name},</p>
          <p>We received a request to reset your password.</p>
          <p><a href="${resetUrl}" target="_blank">Click here to reset your password</a></p>
          <p>This link will expire in 20 minutes.</p>
        `,
      });
    } catch (mailErr) {
      console.error("Forgot password mail error:", mailErr.message);
      return res.status(500).json({
        error: "Unable to send reset email. Please check mail configuration.",
        detail: mailErr.message,
      });
    }

    return res.json({
      success: true,
      message: "Password reset link sent to your email.",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: "Token and new password are required." });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const decoded = jwt.decode(token);
    if (!decoded?.id || decoded?.purpose !== "reset") {
      return res.status(400).json({ error: "Invalid reset token." });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(400).json({ error: "Invalid reset token." });
    }

    jwt.verify(token, `${process.env.JWT_SECRET}${user.password}`);

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    return res.json({ success: true, message: "Password reset successful." });
  } catch (err) {
    return res.status(400).json({ error: "Reset link is invalid or expired." });
  }
};

module.exports = { login, register, forgotPassword, resetPassword };
