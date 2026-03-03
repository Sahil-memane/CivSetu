const { db } = require("../config/firebase");

async function updateIssueDates() {
  try {
    console.log("🔄 Starting issue date update...");

    const issuesSnapshot = await db.collection("issues").get();

    if (issuesSnapshot.empty) {
      console.log("No issues found to update.");
      process.exit(0);
    }

    console.log(`Found ${issuesSnapshot.size} issues to process.`);

    const updates = [];
    let updatedCount = 0;

    const priorityDays = {
      critical: 3,
      high: 7,
      medium: 14,
      low: 30,
    };

    for (const doc of issuesSnapshot.docs) {
      const issue = doc.data();
      const slaDays = priorityDays[issue.priority] || 14; // Default to 14 if unknown

      let createdAt = new Date();
      let slaStatus = "ON_TRACK";

      // Determine new createdAt date
      if (issue.status === "resolved" || issue.status === "rejected") {
        // For resolved/rejected, set creation to 3-10 days ago
        const daysAgo = 3 + Math.floor(Math.random() * 8);
        createdAt.setDate(createdAt.getDate() - daysAgo);
      } else {
        // For active issues, ensuring they are NOT overdue
        // Maximum age is slaDays - 2 (keeping a 2 day buffer to avoid 'AT_RISK' immediately if desired,
        // or just slaDays-1 to allow some diversity)
        // Let's make most of them "safe" (0 to 50% of SLA time used)
        // and some "mature" (50% to 80% of SLA time used)

        const safeZone = Math.floor(slaDays * 0.8);
        const maxAge = Math.max(1, safeZone);

        // Random age between 0 and maxAge days
        const daysAgo = Math.floor(Math.random() * (maxAge + 1));
        createdAt.setDate(createdAt.getDate() - daysAgo);
      }

      // Calculate SLA fields
      const slaEnd = new Date(createdAt);
      slaEnd.setDate(slaEnd.getDate() + slaDays);

      const now = new Date();
      const diffTime = slaEnd.getTime() - now.getTime();
      const daysRem = diffTime / (1000 * 3600 * 24);

      // Recalculate status
      if (issue.status !== "resolved" && issue.status !== "rejected") {
        if (daysRem < 0) slaStatus = "BREACHED";
        else if (daysRem < 2) slaStatus = "AT_RISK";
        else slaStatus = "ON_TRACK";
      } else {
        // For resolved, strictly speaking slaStatus doesn't change dynamically,
        // but usually we want it to look successful.
        slaStatus = "ON_TRACK";
      }

      // Fields to update
      const updateData = {
        createdAt: createdAt.toISOString(),
        updatedAt: createdAt.toISOString(), // simplified
        reportedAt: createdAt.toISOString(),
        slaEndDate: slaEnd.toISOString(),
        daysRemaining: daysRem,
        slaStatus: slaStatus,
        slaDays: slaDays,
      };

      // Correct resolvedAt if it exists and is inconsistent
      if (issue.status === "resolved") {
        // meaningful resolved date: shortly after creation
        const resolvedAt = new Date(createdAt);
        resolvedAt.setDate(
          resolvedAt.getDate() +
            Math.min(slaDays, Math.floor(Math.random() * 3) + 1),
        );

        // Ensure resolvedAt is not in the future
        if (resolvedAt > now) {
          resolvedAt.setTime(now.getTime() - 1000 * 60 * 60); // 1 hour ago
        }
        updateData.resolvedAt = resolvedAt.toISOString();
      }

      updates.push(doc.ref.update(updateData));
      updatedCount++;
    }

    await Promise.all(updates);
    console.log(`✅ Successfully updated dates for ${updatedCount} issues.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating issue dates:", error);
    process.exit(1);
  }
}

updateIssueDates();
