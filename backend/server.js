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
const apkRoutes = require("./routes/apkRoutes");

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
app.use("/api/apk", apkRoutes);

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

// Serve static files (Frontend)
const fs = require("fs");
const publicPath = path.join(__dirname, "public");

if (process.env.NODE_ENV === "production" || fs.existsSync(publicPath)) {
  // Set static folder
  app.use(express.static(publicPath));

  // Any route not handled by API will match this and serve index.html
  app.get(/(.*)/, (req, res) => {
    res.sendFile(path.resolve(publicPath, "index.html"));
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Run an immediate check on startup (optional, good for dev)
  checkSLAStatus();
});
