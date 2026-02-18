const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const connectDB = require("./config/db");
const admissionRoutes = require("./routes/admissionRoutes");
const authRoutes = require("./routes/authRoutes");

// Initialize Express
const app = express();

const normalizeOrigin = (value = "") =>
  String(value).trim().replace(/^['"]|['"]$/g, "").replace(/\/+$/, "");

const envOrigins = String(process.env.CORS_ORIGINS || "")
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

const defaultOrigins = [
  process.env.FRONTEND_URL,
  process.env.BASE_URL,
  "https://tti-dashborad-99d7.vercel.app",
  "https://ttiadmission.vercel.app",
  "https://tti-admission.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]
  .map(normalizeOrigin)
  .filter(Boolean);

const allowedOrigins = [...new Set([...envOrigins, ...defaultOrigins])];

// Middleware
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalized = normalizeOrigin(origin);
    if (allowedOrigins.includes(normalized)) return callback(null, true);
    // Return false instead of throwing to avoid 500 + missing CORS headers confusion.
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Connect to Database
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/admission", admissionRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "Backend is running successfully!" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});

// Start Server
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 Health Check: http://localhost:${PORT}/health`);
  console.log(`📍 Auth Routes: http://localhost:${PORT}/api/auth`);
  console.log(`📍 Admission Routes: http://localhost:${PORT}/admission`);
});
