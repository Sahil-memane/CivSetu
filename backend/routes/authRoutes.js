const express = require("express");
const router = express.Router();
const { db, hasDbAccess } = require("../config/firebase");
const verifyToken = require("../middleware/authMiddleware");

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get("/me", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    // Attempt DB fetch (Try-Catch handles the fallback if creds are missing)
    try {
      const userDoc = await db.collection("users").doc(uid).get();
      if (!userDoc.exists) {
        // If user verified but not in DB, return basic info from token
        // This happens for new users or if DB sync failed previously
        return res.json({
          uid,
          email: req.user.email,
          name: req.user.name || "User",
          role: "citizen", // Default fallback
        });
      }
      res.json(userDoc.data());
    } catch (dbError) {
      // PERMISSION/CREDENTIAL ERROR HANDLING
      if (
        dbError.message.includes("Could not load the default credentials") ||
        dbError.message.includes("Project Id")
      ) {
        console.warn(
          "Firestore access failed (missing creds). Returning token data as fallback."
        );
        // Return meaningful data from the verified token so login succeeds
        return res.json({
          uid,
          email: req.user.email,
          name: req.user.name || "User",
          role: "citizen", // Default fallback
          permissionWarning: "Running in partial mode (No DB Access)",
        });
      }
      throw dbError; // Rethrow other errors
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/auth/sync
// @desc    Sync user data from Frontend to Backend (create/update)
// @access  Private
router.post("/sync", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { email, name, role, department, phone } = req.body;

    const userData = {
      uid,
      email,
      name,
      role: role || "citizen",
      createdAt: new Date().toISOString(), // Use simple ISO string for now
    };

    if (phone) userData.phone = phone;
    if (department) userData.department = department;

    // Merge true to avoid overwriting existing fields if just updating specific ones
    await db.collection("users").doc(uid).set(userData, { merge: true });

    res.json({ message: "User synced successfully", user: userData });
  } catch (error) {
    console.error("Error syncing user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
