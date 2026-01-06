const { db } = require("../config/firebase");

async function randomizeStatus() {
  try {
    console.log("🔄 Starting status randomization...");
    const issuesSnap = await db.collection("issues").get();

    if (issuesSnap.empty) {
      console.log("No issues found.");
      return;
    }

    const batch = db.batch();
    const statuses = ["in-progress", "pending"]; // "pending" can be interpreted as Pending Review
    // We avoid 'resolved' or 'escalated' for now to keep them active-looking

    let count = 0;
    issuesSnap.forEach((doc) => {
      const randomStatus =
        statuses[Math.floor(Math.random() * statuses.length)];
      const updateData = { status: randomStatus };

      // Also update verifications to look real
      if (Math.random() > 0.5) {
        updateData.verifications = Math.floor(Math.random() * 5) + 1;
      }

      batch.update(doc.ref, updateData);
      count++;
    });

    await batch.commit();
    console.log(
      `✅ Successfully updated ${count} issues with random statuses.`
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Error randomizing statuses:", error);
    process.exit(1);
  }
}

randomizeStatus();
