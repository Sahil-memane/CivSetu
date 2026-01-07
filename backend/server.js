const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const path = require("path");

const authRoutes = require("./routes/authRoutes");
const issueRoutes = require("./routes/issueRoutes");
const surveyRoutes = require("./routes/surveyRoutes");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "50mb" })); // For file uploads

// Serve uploads directory safely
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/surveys", surveyRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is healthy" });
});

// Background Jobs
const cron = require("node-cron");
const { checkSLAStatus } = require("./services/slaService");

// Run SLA check every 12 hours
cron.schedule("0 */12 * * *", () => {
  console.log("⏰ Running scheduled SLA check...");
  checkSLAStatus();
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Run an immediate check on startup (optional, good for dev)
  checkSLAStatus();
});
