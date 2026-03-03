const { db } = require("../config/firebase");

async function verifyDates() {
  try {
    console.log("🔍 Verifying issue dates...");

    const issuesSnapshot = await db.collection("issues").limit(10).get();

    if (issuesSnapshot.empty) {
      console.log("No issues found.");
      process.exit(0);
    }

    console.log(`Found ${issuesSnapshot.size} issues. Checking dates:\n`);

    issuesSnapshot.forEach((doc) => {
      const issue = doc.data();
      console.log(`Issue ID: ${doc.id}`);
      console.log(`  Title: ${issue.title}`);
      console.log(`  Status: ${issue.status}`);
      console.log(`  Priority: ${issue.priority} (${issue.slaDays} days)`);
      console.log(`  Created At: ${issue.createdAt}`);
      console.log(`  SLA End Date: ${issue.slaEndDate}`);
      console.log(
        `  Days Remaining: ${issue.daysRemaining ? issue.daysRemaining.toFixed(2) : "N/A"}`,
      );
      console.log(`  SLA Status: ${issue.slaStatus}`);
      console.log("-----------------------------------");
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error verifying dates:", error);
    process.exit(1);
  }
}

verifyDates();
