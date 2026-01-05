const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const verifyToken = require("../middleware/authMiddleware");
const { uploadIssueFiles } = require("../middleware/uploadMiddleware");
const { determinePriority } = require("../services/priorityEngine");
const { detectDuplicateIssues } = require("../services/visionService");

// @route   POST /api/issues/submit
// @desc    Submit a new civic issue with AI priority detection
// @access  Private
router.post("/submit", verifyToken, uploadIssueFiles, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { title, description, category, location } = req.body;

    // Validate required fields
    if (!title || !category || !location) {
      return res.status(400).json({
        message: "Missing required fields: title, category, location",
      });
    }

    // Get uploaded files (now saved locally)
    const imageFiles = req.files?.images || [];
    const voiceFile = req.files?.voice?.[0];

    // Store file paths instead of buffers
    const filePaths = imageFiles.map((file) => file.path);
    const voicePath = voiceFile ? voiceFile.path : null;

    console.log(`📝 New issue submission from user: ${uid}`);
    console.log(
      `   Category: ${category}, Files: ${imageFiles.length} images${
        voicePath ? " + 1 voice" : ""
      }`
    );

    // Step 1: For AI analysis, read first image as buffer
    let imageBuffers = [];
    if (imageFiles.length > 0) {
      const fs = require("fs");
      try {
        const firstImageBuffer = fs.readFileSync(imageFiles[0].path);
        imageBuffers = [firstImageBuffer];
      } catch (err) {
        console.warn("Could not read image for AI analysis:", err.message);
      }
    }

    // Step 2: Determine priority using AI
    const priorityResult = await determinePriority({
      images: imageBuffers,
      description: description || "",
      category,
    });

    // Step 3: Save issue to Firestore with local file paths
    const issueData = {
      uid,
      title,
      description: description || "",
      category,
      location,
      priority: priorityResult.priority.toLowerCase(),
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verifications: 0,
      files: {
        images: filePaths,
        voice: voicePath,
      },
      aiAnalysis: {
        confidence: priorityResult.confidence,
        reasoning: priorityResult.reasoning,
        analysis: priorityResult.analysis,
      },
    };

    // Add issue to Firestore
    const issueRef = await db.collection("issues").add(issueData);

    console.log(`✅ Issue created with ID: ${issueRef.id}`);
    console.log(
      `   Priority: ${priorityResult.priority} (${Math.round(
        priorityResult.confidence * 100
      )}% confidence)`
    );

    // Step 4: Return response
    res.status(201).json({
      message: "Issue submitted successfully",
      issueId: issueRef.id,
      priority: priorityResult.priority,
      confidence: priorityResult.confidence,
      reasoning: priorityResult.reasoning,
      analysis: priorityResult.analysis,
    });
  } catch (error) {
    console.error("Error submitting issue:", error);
    res.status(500).json({
      message: "Failed to submit issue",
      error: error.message,
    });
  }
});

// @route   GET /api/issues/user
// @desc    Get all issues submitted by the current user
// @access  Private
router.get("/user", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    console.log(`🔍 Fetching issues for UID: ${uid}`);

    let query = db.collection("issues").where("uid", "==", uid);

    // Temporarily comment out orderBy to check if it's an index issue
    // query = query.orderBy("createdAt", "desc");

    const issuesSnapshot = await query.get();

    const issues = [];
    issuesSnapshot.forEach((doc) => {
      issues.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log(`✅ Found ${issues.length} issues for UID: ${uid}`);
    res.json({ issues });
  } catch (error) {
    console.error("❌ Error fetching user issues:", error);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
});

// @route   GET /api/issues/all
// @desc    Get all issues for map view
// @access  Public (or semi-private)
router.get("/all", async (req, res) => {
  try {
    const issuesSnapshot = await db
      .collection("issues")
      .orderBy("createdAt", "desc")
      .get();

    const issues = [];
    issuesSnapshot.forEach((doc) => {
      issues.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json({ issues });
  } catch (error) {
    console.error("Error fetching all issues:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
