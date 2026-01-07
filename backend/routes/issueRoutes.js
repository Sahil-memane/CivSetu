const express = require("express");
const router = express.Router();
const { db, bucket } = require("../config/firebase");
const verifyToken = require("../middleware/authMiddleware");
const { uploadIssueFiles } = require("../middleware/uploadMiddleware");
const { determinePriority } = require("../services/priorityEngine");
const { detectDuplicateIssues } = require("../services/visionService");
const { calculateSLA, getUpdatedSLAStatus } = require("../services/slaService");
const { notifyCitizenOnResolution } = require("../services/notificationService");

// Helper to upload to Firebase Storage
const uploadToFirebase = async (file, folder) => {
  if (!bucket) throw new Error("Firebase Storage bucket not configured");

  const filename = `${folder}/${Date.now()}-${Math.round(
    Math.random() * 1e9
  )}-${file.originalname}`;
  const fileUpload = bucket.file(filename);

  const blobStream = fileUpload.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
  });

  return new Promise((resolve, reject) => {
    blobStream.on("error", (error) => reject(error));
    blobStream.on("finish", async () => {
      // Get a signed URL valid for a long time (e.g., 100 years)
      try {
        const [url] = await fileUpload.getSignedUrl({
          action: "read",
          expires: "03-01-2500",
        });
        resolve(url);
      } catch (err) {
        reject(err);
      }
    });
    blobStream.end(file.buffer);
  });
};

// @route   POST /api/issues/submit
// @desc    Submit a new civic issue with AI priority detection
// @access  Private
router.post("/submit", verifyToken, uploadIssueFiles, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { title, description, category, address, latitude, longitude } =
      req.body;

    // Validate required fields
    // We treat 'address' as the primary text location now
    if (!title || !category || !address) {
      return res.status(400).json({
        message: "Missing required fields: title, category, address",
      });
    }

    // ... (uploads)
    const imageFiles = req.files?.images || [];
    const voiceFile = req.files?.voice?.[0];

    console.log(`📝 Processing submission for user: ${uid}`);

    // ... (rest of uploads)
    const imageUploadPromises = imageFiles.map((file) =>
      uploadToFirebase(file, "issues/images")
    );
    const uploadedImageUrls = await Promise.all(imageUploadPromises);

    let uploadedVoiceUrl = null;
    if (voiceFile) {
      uploadedVoiceUrl = await uploadToFirebase(voiceFile, "issues/voice");
    }

    // ... (AI analysis)
    let imageBuffers = [];
    if (imageFiles.length > 0) {
      imageBuffers = [imageFiles[0].buffer];
    }
    const priorityResult = await determinePriority({
      images: imageBuffers,
      description: description || "",
      category,
    });

    // Calculate SLA based on priority and category
    const slaDetails = calculateSLA(priorityResult.priority, category);

    // Step 3: Save issue to Firestore
    const issueData = {
      uid,
      title,
      description: description || "",
      category,
      location: address, // Store human-readable address in 'location' field
      coordinates: {
        lat: parseFloat(latitude) || 0,
        lng: parseFloat(longitude) || 0,
      },
      priority: priorityResult.priority.toLowerCase(),
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verifications: 0,
      files: {
        images: uploadedImageUrls,
        voice: uploadedVoiceUrl,
      },
      aiAnalysis: {
        confidence: priorityResult.confidence,
        reasoning: priorityResult.reasoning,
        analysis: priorityResult.analysis,
      },
      ...slaDetails // Add SLA fields
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
    const migrationPromises = []; // For lazy migration

    issuesSnapshot.forEach((doc) => {
      let issue = { id: doc.id, ...doc.data() };

      // LAZY MIGRATION: Check if SLA fields are missing
      if (!issue.slaStatus && issue.status !== "resolved" && issue.status !== "rejected") {
        // 1. Determine priority if missing (or use existing)
        const priority = issue.priority || "medium";

        // 2. Calculate SLA
        const slaDetails = calculateSLA(priority, issue.category);

        // 3. Update issue object for response
        issue = { ...issue, ...slaDetails, priority };

        // 4. Update in background
        const updateRef = db.collection("issues").doc(issue.id);
        migrationPromises.push(updateRef.update({ ...slaDetails, priority }));
      } else if (issue.slaStatus) {
        // Also check if status needs update
        const updates = getUpdatedSLAStatus(issue);
        if (updates) {
          issue = { ...issue, ...updates };
          migrationPromises.push(db.collection("issues").doc(issue.id).update(updates));
        }
      }

      issues.push(issue);
    });

    // Execute background updates
    if (migrationPromises.length > 0) {
      Promise.all(migrationPromises).catch(err => console.error("Error in lazy migration/update:", err));
    }

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
    // Reuse lazy migration logic (Ideally should be a shared helper function)
    const migrationPromises = [];

    issuesSnapshot.forEach((doc) => {
      let issue = { id: doc.id, ...doc.data() };

      if (!issue.slaStatus && issue.status !== "resolved" && issue.status !== "rejected") {
        const priority = issue.priority || "medium";
        const slaDetails = calculateSLA(priority, issue.category);
        issue = { ...issue, ...slaDetails, priority };
        migrationPromises.push(db.collection("issues").doc(issue.id).update({ ...slaDetails, priority }));
      } else if (issue.slaStatus) {
        const updates = getUpdatedSLAStatus(issue);
        if (updates) {
          issue = { ...issue, ...updates };
          migrationPromises.push(db.collection("issues").doc(issue.id).update(updates));
        }
      }
      issues.push(issue);
    });

    if (migrationPromises.length > 0) {
      Promise.all(migrationPromises).catch(err => console.error("Error in lazy migration/update (public view):", err));
    }

    res.json({ issues });
  } catch (error) {
    console.error("Error fetching all issues:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/issues/:id/engage
// @desc    Toggle agree/disagree status for an issue
// @access  Private
router.post("/:id/engage", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // "agree" or "disagree"
    const uid = req.user.uid;

    if (!["agree", "disagree"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const issueRef = db.collection("issues").doc(id);
    const issueDoc = await issueRef.get();

    if (!issueDoc.exists) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const { admin } = require("../config/firebase");
    const FieldValue = admin.firestore.FieldValue;

    // Logic: If action is "agree", add to agrees, remove from disagrees (and vice versa)
    // Actually, simple toggle: if already agreed, remove it. If not, add it and remove from disagree.

    // We can do this atomically with a transaction or just sequential updates.
    // For simplicity/performance in this MVP, we'll run updates.

    const batch = db.batch();
    const issueData = issueDoc.data();
    const agrees = issueData.agrees || [];
    const disagrees = issueData.disagrees || [];

    if (action === "agree") {
      if (agrees.includes(uid)) {
        // Already agreed -> Remove it (Toggle off)
        batch.update(issueRef, { agrees: FieldValue.arrayRemove(uid) });
      } else {
        // Not agreed -> Add to agree, Remove from disagree
        batch.update(issueRef, {
          agrees: FieldValue.arrayUnion(uid),
          disagrees: FieldValue.arrayRemove(uid),
        });
      }
    } else if (action === "disagree") {
      if (disagrees.includes(uid)) {
        // Already disagreed -> Remove it
        batch.update(issueRef, { disagrees: FieldValue.arrayRemove(uid) });
      } else {
        // Not disagreed -> Add to disagree, Remove from agree
        batch.update(issueRef, {
          disagrees: FieldValue.arrayUnion(uid),
          agrees: FieldValue.arrayRemove(uid),
        });
      }
    }

    await batch.commit();

    // Return updated counts (approximation or need to re-fetch? Re-fetching is safer for UI sync)
    // Ideally user of this endpoint should optimistcally update or re-fetch.
    res.json({ message: "Engagement updated" });
  } catch (error) {
    console.error("Error updating engagement:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/issues/:id/comment
// @desc    Add a comment to an issue (Max 3 per issue)
// @access  Private
router.post("/:id/comment", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const { uid, name } = req.user;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const issueRef = db.collection("issues").doc(id);
    const issueDoc = await issueRef.get();

    if (!issueDoc.exists) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Try to get the most specific name available
    let commenterName = name;
    if (!commenterName) {
      try {
        const userSnap = await db.collection("users").doc(uid).get();
        if (userSnap.exists) {
          commenterName = userSnap.data().name;
        }
      } catch (err) {
        console.error("Error fetching user details for comment:", err);
      }
    }

    const currentComments = issueDoc.data().comments || [];

    if (currentComments.length >= 3) {
      return res
        .status(400)
        .json({ message: "Maximum comment limit (3) reached for this issue." });
    }

    const newComment = {
      uid,
      userName: commenterName || "Anonymous",
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    const { admin } = require("../config/firebase");
    await issueRef.update({
      comments: admin.firestore.FieldValue.arrayUnion(newComment),
    });

    res.json({ message: "Comment added", comment: newComment });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/issues/:id/status
// @desc    Update issue status and planning details (with optional docs)
// @access  Private (Admin/Authority)
const { upload } = require("../middleware/uploadMiddleware");

router.put(
  "/:id/status",
  verifyToken,
  upload.fields([{ name: "planningDocs", maxCount: 5 }]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, actionTaken, staffAllocated, resourcesUsed } = req.body;

      // Upload Planning Docs if any
      const planningFiles = req.files?.planningDocs || [];
      const uploadPromises = planningFiles.map((file) =>
        uploadToFirebase(file, "issues/planning")
      );
      const uploadedDocUrls = await Promise.all(uploadPromises);

      const updateData = {
        status,
        actionTaken,
        staffAllocated,
        resourcesUsed,
        updatedAt: new Date().toISOString(),
      };

      if (uploadedDocUrls.length > 0) {
        updateData.planningDocs = uploadedDocUrls;
      }

      const issueRef = db.collection("issues").doc(id);
      await issueRef.update(updateData);

      res.json({
        message: "Issue status updated",
        planningDocs: uploadedDocUrls,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   POST /api/issues/:id/reject
// @desc    Reject an issue with reason and proofs
// @access  Private
router.post(
  "/:id/reject",
  verifyToken,
  upload.fields([{ name: "rejectionProofs", maxCount: 5 }]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;

      const proofFiles = req.files?.rejectionProofs || [];
      const uploadPromises = proofFiles.map((file) =>
        uploadToFirebase(file, "issues/rejection")
      );
      const uploadedProofUrls = await Promise.all(uploadPromises);

      const issueRef = db.collection("issues").doc(id);
      await issueRef.update({
        status: "rejected",
        rejectionReason,
        rejectionProofs: uploadedProofUrls,
        rejectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      res.json({
        message: "Issue rejected",
        rejectionProofs: uploadedProofUrls,
      });
    } catch (error) {
      console.error("Error rejecting issue:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   POST /api/issues/:id/resolve
// @desc    Finalize resolution with proofs
// @access  Private
// Reusing uploadIssueFiles for handling 'images' field in form-data
router.post("/:id/resolve", verifyToken, uploadIssueFiles, async (req, res) => {
  try {
    const { id } = req.params;
    const { finalRemarks } = req.body;

    const imageFiles = req.files?.images || [];

    // Upload proofs
    const imageUploadPromises = imageFiles.map((file) =>
      uploadToFirebase(file, "issues/resolution_proofs")
    );
    const uploadedProofUrls = await Promise.all(imageUploadPromises);

    const issueRef = db.collection("issues").doc(id);
    const issueDoc = await issueRef.get();

    if (!issueDoc.exists) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const issueData = issueDoc.data();

    // Calculate if resolved within SLA
    const resolvedAt = new Date().toISOString();
    let resolvedWithinSLA = true;
    if (issueData.slaEndDate) {
      resolvedWithinSLA = new Date(resolvedAt) <= new Date(issueData.slaEndDate);
    }

    await issueRef.update({
      status: "resolved",
      resolutionRemarks: finalRemarks,
      resolutionProofs: uploadedProofUrls,
      resolvedAt,
      resolvedWithinSLA,
      updatedAt: new Date().toISOString(),
    });

    // Notify Citizen
    try {
      const userDoc = await db.collection("users").doc(issueData.uid).get();
      if (userDoc.exists) {
        // Pass token if it exists, otherwise undefined (service handles it)
        const fcmToken = userDoc.data().fcmToken;
        await notifyCitizenOnResolution({ ...issueData, id }, fcmToken);
      }
    } catch (err) {
      console.error("Error notifying citizen:", err);
    }

    res.json({
      message: "Issue resolved successfully",
      proofs: uploadedProofUrls,
    });
  } catch (error) {
    console.error("Error resolving issue:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
