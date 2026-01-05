const { db } = require("../config/firebase");
const fs = require("fs");

async function verifyData() {
  try {
    let output = "--- USER VERIFICATION DEBUG ---\n\n";

    // List all users in DB
    const allUsers = await db.collection("users").get();
    output += `Total users in DB: ${allUsers.size}\n\n`;

    const sortedUsers = allUsers.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    for (const user of sortedUsers) {
      const issues = await db
        .collection("issues")
        .where("uid", "==", user.id)
        .get();
      output += `- Name: ${user.name}\n  Email: ${user.email}\n  UID: ${user.id}\n  Created: ${user.createdAt}\n  Issues in DB: ${issues.size}\n\n`;
    }

    fs.writeFileSync("debug_users.txt", output);
    console.log("✅ Debug results written to debug_users.txt");

    process.exit(0);
  } catch (error) {
    console.error("Error verifying data:", error);
    process.exit(1);
  }
}

verifyData();
