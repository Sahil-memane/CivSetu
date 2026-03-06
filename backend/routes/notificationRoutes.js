const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const verifyToken = require("../middleware/authMiddleware");
const { saveNotificationToDb } = require("../services/notificationService");

// @route   POST /api/notifications/test
// @desc    Create a test notification for the current user
// @access  Private
router.post("/test", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    console.log(`🧪 Creating test notification for: ${uid}`);

    await saveNotificationToDb(uid, {
      title: "Test Notification",
      body: "This is a test notification to verify the fetching system is working.",
      type: "SYSTEM",
      data: { test: true },
    });

    res.json({ message: "Test notification triggered" });
  } catch (error) {
    console.error("❌ Error triggering test notification:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/notifications
// @desc    Get all notifications for current user
// @access  Private
router.get("/", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    console.log(`🔍 Fetching notifications via Backend API for: ${uid}`);

    const notificationsRef = db
      .collection("users")
      .doc(uid)
      .collection("notifications");
    const snapshot = await notificationsRef
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`✅ Found ${notifications.length} notifications for ${uid}`);
    res.json({ notifications });
  } catch (error) {
    console.error("❌ Error fetching notifications via Backend:", error);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
});

// @route   PATCH /api/notifications/read-all
// @desc    Mark all notifications as read for current user
// @access  Private
router.patch("/read-all", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const notificationsRef = db
      .collection("users")
      .doc(uid)
      .collection("notifications");
    const snapshot = await notificationsRef.where("read", "==", false).get();

    if (snapshot.empty) {
      return res.json({ message: "No unread notifications" });
    }

    const batch = db.batch();
    snapshot.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PATCH /api/notifications/:id/read
// @desc    Mark a single notification as read
// @access  Private
router.patch("/:id/read", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { id } = req.params;

    const notifRef = db
      .collection("users")
      .doc(uid)
      .collection("notifications")
      .doc(id);
    const doc = await notifRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await notifRef.update({ read: true });
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
