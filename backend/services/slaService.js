const { db } = require("../config/firebase");
const {
  notifyAdminOnBreach,
  notifyCitizenOnBreach,
} = require("./notificationService");

/**
 * Calculate SLA details based on priority and category
 * @param {string} priority - CRITICAL, HIGH, MEDIUM, LOW
 * @param {string} category - Issue category (unused currently but kept for extensibility)
 * @returns {Object} SLA details
 */
function calculateSLA(priority, category) {
  const priorityMap = {
    CRITICAL: 1,
    HIGH: 2,
    MEDIUM: 4,
    LOW: 7,
  };

  const slaDays = priorityMap[priority.toUpperCase()] || 7;
  const now = new Date();
  const slaStartDate = now.toISOString();

  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + slaDays);
  const slaEndDate = endDate.toISOString();

  return {
    slaDays,
    slaStartDate,
    slaEndDate,
    daysRemaining: slaDays, // Initial value
    slaStatus: "ON_TRACK", // Initial status
    adminEscalatedPriority: "LOW", // Initial admin priority
  };
}

/**
 * Update SLA status for a single issue based on current time
 * @param {Object} issue - Issue data from Firestore
 * @returns {Object|null} Updated fields if changed, else null
 */
function getUpdatedSLAStatus(issue) {
  if (
    !issue.slaEndDate ||
    issue.status === "resolved" ||
    issue.status === "rejected"
  ) {
    return null; // Do not update SLA for closed issues
  }

  const now = new Date();
  const endDate = new Date(issue.slaEndDate);
  const totalDuration = issue.slaDays * 24 * 60 * 60 * 1000; // ms
  const timeRemaining = endDate - now; // ms

  // Convert to days (can be fractional or negative)
  const daysRemaining = parseFloat(
    (timeRemaining / (1000 * 60 * 60 * 24)).toFixed(2)
  );
  const daysRemainingInt = Math.ceil(daysRemaining); // e.g. 0.5 days -> 1 day left

  let slaStatus = "ON_TRACK";
  if (daysRemaining <= 0) {
    slaStatus = "BREACHED";
  } else if (timeRemaining <= totalDuration * 0.5) {
    slaStatus = "AT_RISK";
  } else {
    slaStatus = "ON_TRACK";
  }

  // Admin Escalation Logic
  let adminEscalatedPriority = "LOW";
  // Logic: >50% days left: LOW, <=50%: MEDIUM, <=25%: HIGH, 0: CRITICAL
  const percentageLeft = timeRemaining / totalDuration;

  if (daysRemaining <= 0) {
    adminEscalatedPriority = "critical"; // standardized lowercase
  } else if (percentageLeft <= 0.25) {
    adminEscalatedPriority = "high";
  } else if (percentageLeft <= 0.5) {
    adminEscalatedPriority = "medium";
  } else {
    adminEscalatedPriority = "low";
  }

  // Check if anything actually changed to avoid unnecessary writes
  if (
    issue.slaStatus === slaStatus &&
    issue.adminEscalatedPriority === adminEscalatedPriority &&
    Math.abs(issue.daysRemaining - daysRemaining) < 0.01 // Floating point tolerance
  ) {
    return null;
  }

  return {
    daysRemaining, // Store exact float for precision if needed, or use formatted in UI
    slaStatus,
    adminEscalatedPriority,
  };
}

/**
 * Background job to check and update all active issues
 * Should be called by cron
 */
async function checkSLAStatus() {
  console.log("⏰ Starting SLA Status Code Check...");
  try {
    const issuesRef = db.collection("issues");
    // Only check unresolved issues
    const snapshot = await issuesRef
      .where("status", "in", ["pending", "in-progress", "escalated"]) // Fixed: "in_progress" -> "in-progress", removed "assigned", ensured resolved/rejected are excluded
      .get();

    if (snapshot.empty) {
      console.log("✅ No active issues to check.");
      return;
    }

    const batch = db.batch();
    let updatesCount = 0;
    const breachedIssues = [];

    snapshot.forEach((doc) => {
      const issue = doc.data();
      const updates = getUpdatedSLAStatus(issue);

      if (updates) {
        // If status changed to BREACHED just now (and wasn't before), notify
        if (
          updates.slaStatus === "BREACHED" &&
          issue.slaStatus !== "BREACHED"
        ) {
          const fullIssue = {
            id: doc.id,
            ...issue,
            priority: issue.priority || "MEDIUM",
          };
          breachedIssues.push(fullIssue);
          // Notify Citizen
          notifyCitizenOnBreach(fullIssue);
        }

        batch.update(doc.ref, updates);
        updatesCount++;
      }
    });

    if (updatesCount > 0) {
      await batch.commit();
      console.log(`✅ Updated SLA status for ${updatesCount} issues.`);
    }

    // Notify admins about breaches
    if (breachedIssues.length > 0) {
      console.log(`⚠️ identified ${breachedIssues.length} new SLA breaches.`);
      // Fetch admins (mock or real) - For MVP assuming a separate collection or role
      // const adminTokens = await getAdminTokens();
      // await notifyAdminOnBreach(breachedIssues[0], adminTokens);
      // Note: Batch notification logic can be refined
    }
  } catch (error) {
    console.error("❌ Error in SLA background check:", error);
  }
}

module.exports = {
  calculateSLA,
  getUpdatedSLAStatus,
  checkSLAStatus,
};
