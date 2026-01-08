const express = require("express");
const router = express.Router();
const { bucket } = require("../config/firebase");

/**
 * @route   GET /api/apk/download-url
 * @desc    Get a signed download URL for the Android APK
 * @access  Public
 */
router.get("/download-url", async (req, res) => {
  try {
    const apkPath = "apk/CivSetu_Mobile_App.apk";
    const file = bucket.file(apkPath);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "APK file not found in storage",
      });
    }

    // Generate a signed URL that expires in 1 hour
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 60 * 60 * 1000, // 1 hour from now
    });

    res.json({
      success: true,
      downloadUrl: url,
      fileName: "CivSetu_Mobile_App.apk",
      message: "Download URL generated successfully",
    });
  } catch (error) {
    console.error("Error generating APK download URL:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate download URL",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/apk/info
 * @desc    Get APK file information
 * @access  Public
 */
router.get("/info", async (req, res) => {
  try {
    const apkPath = "apk/CivSetu_Mobile_App.apk";
    const file = bucket.file(apkPath);

    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "APK file not found",
      });
    }

    const [metadata] = await file.getMetadata();

    res.json({
      success: true,
      info: {
        name: metadata.name,
        size: metadata.size,
        sizeInMB: (parseInt(metadata.size) / (1024 * 1024)).toFixed(2),
        contentType: metadata.contentType,
        updated: metadata.updated,
      },
    });
  } catch (error) {
    console.error("Error fetching APK info:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch APK information",
      error: error.message,
    });
  }
});

module.exports = router;
