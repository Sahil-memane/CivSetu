const { admin, db } = require("../config/firebase");

/**
 * Send a notification to a specific device or topic
 * @param {string} token - FCM token of the recipient
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Optional data payload
 */
async function sendNotification(token, title, body, data = {}) {
  try {
    if (!token) {
      console.warn("⚠️ No FCM token provided for notification");
      return;
    }

    const message = {
      notification: {
        title,
        body,
      },
      data,
      token,
    };

    const response = await admin.messaging().send(message);
    console.log("✅ Notification sent successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ Error sending notification:", error);
  }
}

/**
 * Save notification to Firestore for In-App persistence
 * @param {string} uid - User ID
 * @param {Object} notificationData - { title, body, type, data }
 */
async function saveNotificationToDb(uid, notificationData) {
  try {
    if (!uid) return;
    await db
      .collection("users")
      .doc(uid)
      .collection("notifications")
      .add({
        ...notificationData,
        read: false,
        createdAt: new Date().toISOString(),
      });
    console.log(`✅ Saved persistent notification for ${uid}`);
  } catch (error) {
    console.error("❌ Error saving notification to DB:", error);
  }
}

/**
 * Notify citizen when their issue is resolved
 * @param {Object} issue - The issue document data
 * @param {string} citizenFcmToken - The FCM token of the citizen
 */
async function notifyCitizenOnResolution(issue, citizenFcmToken) {
  const title = "Issue Resolved";
  const body = `Your reported issue '${issue.title}' has been resolved. Thank you for helping improve the city.`;

  // Only send push notification if token exists
  if (citizenFcmToken) {
    await sendNotification(citizenFcmToken, title, body, {
      issueId: issue.id,
      type: "RESOLUTION",
    });
  }

  // Always Save In-App Notification
  await saveNotificationToDb(issue.uid, {
    title,
    body,
    type: "RESOLUTION",
    data: { issueId: issue.id },
  });
}

/**
 * Notify admins when an issue breaches SLA
 * @param {Object} issue - The issue document data
 * @param {string[]} adminTokens - Array of admin FCM tokens
 */
async function notifyAdminOnBreach(issue, adminTokens) {
  if (!adminTokens || adminTokens.length === 0) return;

  const title = "SLA Breach Alert";
  const body = `Issue '${issue.title}' has breached its SLA. Immediate action required.`;

  // Send to all admins (topic subscription is better, but individual for now is fine)
  const promises = adminTokens.map((token) =>
    sendNotification(token, title, body, {
      issueId: issue.id,
      type: "SLA_BREACH",
      priority: issue.priority,
    })
  );

  await Promise.all(promises);

  // Save In-App Notification for Admins (Fetching relevant admins again or looping tokens if mapped to UIDs)
  // For MVP/Demo: Query all admins to save notification
  try {
    const adminsSnapshot = await db
      .collection("users")
      .where("role", "==", "official")
      .get();
    const savePromises = [];
    adminsSnapshot.forEach((doc) => {
      savePromises.push(
        saveNotificationToDb(doc.id, {
          title,
          body,
          type: "SLA_BREACH",
          data: { issueId: issue.id, priority: issue.priority },
        })
      );
    });
    await Promise.all(savePromises);
  } catch (err) {
    console.error("Error saving admin notifications:", err);
  }
}

module.exports = {
  notifyCitizenOnResolution,
  notifyAdminOnBreach,
  sendNotification,
  notifyCitizenOnBreach,
  notifyCitizenOnSubmission,
  notifyCitizenOnStatusChange,
};

/**
 * Notify citizen when their issue breaches SLA
 * @param {Object} issue - The issue document data
 * @param {string} citizenFcmToken - Optional FCM token
 */
async function notifyCitizenOnBreach(issue, citizenFcmToken = null) {
  const title = "Issue Delayed (SLA Breach)";
  const body = `We are sorry, but your reported issue '${issue.title}' is taking longer than expected to resolve.`;

  // Push Notification
  if (citizenFcmToken) {
    await sendNotification(citizenFcmToken, title, body, {
      issueId: issue.id,
      type: "SLA_BREACH",
    });
  }

  // In-App Notification
  await saveNotificationToDb(issue.uid, {
    title,
    body,
    type: "SLA_BREACH",
    data: { issueId: issue.id },
  });
}

/**
 * Notify citizen when they successfully submit an issue
 * @param {Object} issue - The issue document data (must include uid, id, title)
 */
async function notifyCitizenOnSubmission(issue) {
  const title = "Issue Reported Successfully";
  const body = `Your issue '${issue.title}' has been successfully reported. Token ID: ${issue.id}`;

  await saveNotificationToDb(issue.uid, {
    title,
    body,
    type: "SUBMISSION",
    data: { issueId: issue.id },
  });
}

/**
 * Notify citizen when their issue status changes
 * @param {Object} issue - The issue document data
 * @param {string} newStatus - The new status
 */
async function notifyCitizenOnStatusChange(issue, newStatus) {
  const title = "Issue Status Updated";
  const body = `Your reported issue '${issue.title}' is now ${newStatus}.`;

  await saveNotificationToDb(issue.uid, {
    title,
    body,
    type: "STATUS_CHANGE",
    data: { issueId: issue.id, status: newStatus },
  });
}
