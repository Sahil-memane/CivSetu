const admin = require("firebase-admin");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, "../.env") });

// Initialize Firebase Admin (Using existing service account handling pattern if possible,
// but for scripts usually easiest to just init with cert if available, or application default)
// Checking how server.js does it.
// server.js does: const { db, bucket } = require("../config/firebase");
// Let's reuse that config if possible, but we need to step out of 'scripts' folder.

const { db } = require("../config/firebase");

async function backfillIssues() {
  console.log("🚀 Starting backfill of existing issues...");

  try {
    const issuesRef = db.collection("issues");
    const snapshot = await issuesRef.get();

    if (snapshot.empty) {
      console.log("No matching documents.");
      return;
    }

    const batchSize = 500;
    let batch = db.batch();
    let count = 0;
    let totalUpdated = 0;

    for (const doc of snapshot.docs) {
      const issue = doc.data();

      // Skip if already has isValid field (optional optimization)
      if (issue.isValid !== undefined) {
        continue;
      }

      const docRef = issuesRef.doc(doc.id);
      batch.update(docRef, { isValid: true });
      count++;
      totalUpdated++;

      if (count >= batchSize) {
        await batch.commit();
        console.log(`Updated batch of ${count} issues.`);
        batch = db.batch();
        count = 0;
      }
    }

    if (count > 0) {
      await batch.commit();
      console.log(`Updated final batch of ${count} issues.`);
    }

    console.log(
      `✅ Backfill complete. Marked ${totalUpdated} issues as verified.`
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Error running backfill:", error);
    process.exit(1);
  }
}

backfillIssues();
