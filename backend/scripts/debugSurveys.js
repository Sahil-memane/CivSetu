const { db } = require("../config/firebase");

async function listSurveys() {
  console.log("--- DEBUGGING SURVEYS COLLECTION ---");
  try {
    const snapshot = await db.collection("surveys").get();

    console.log(`Total Surveys Found: ${snapshot.size}`);

    if (snapshot.empty) {
      console.log("The 'surveys' collection is EMPTY.");
      return;
    }

    snapshot.forEach((doc) => {
      console.log(
        `[${doc.id}] Title: ${doc.data().title}, CreatedAt: ${
          doc.data().createdAt
        }`
      );
    });
  } catch (error) {
    console.error("Error fetching surveys:", error);
  }
}

listSurveys();
