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

// Middleware
app.use(cors());
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
const PORT = process.env.PORT || 5550;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 Health Check: http://localhost:${PORT}/health`);
  console.log(`📍 Auth Routes: http://localhost:${PORT}/api/auth`);
  console.log(`📍 Admission Routes: http://localhost:${PORT}/admission`);
});
