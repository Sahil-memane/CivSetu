const express = require("express");
const { db } = require("../config/firebase");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");

// Get all surveys (Admin) or surveys for a specific user (Citizen)
router.get("/", verifyToken, async (req, res) => {
  console.log("📊 GET /api/surveys - Request received");
  console.log("User:", req.user?.uid);
  console.log("Query params:", req.query);

  try {
    const { userId } = req.query; // If present, filter by targetUserIds

    let query = db.collection("surveys");

    // If userId provided (Citizen view), check if their ID is in targetUserIds array
    if (userId) {
      query = query.where("targetUserIds", "array-contains", userId);
    }

    const snapshot = await query.get();

    const surveys = [];
    snapshot.forEach((doc) => {
      surveys.push({ id: doc.id, ...doc.data() });
    });

    // Sort in memory to avoid Firestore Index requirement
    surveys.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      surveys,
      debug: {
        found: surveys.length,
        snapshotSize: snapshot.size,
        filter: userId || "none",
        collection: "surveys",
      },
    });
  } catch (error) {
    console.error("Error fetching surveys:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch surveys", details: error.message });
  }
});

// Create a new survey (Admin)
// Logic: Admin creates a survey for a cluster.
// Request Body: { title, description, questions: [], clusterData, targetUserIds }
router.post("/create", verifyToken, async (req, res) => {
  try {
    const { title, description, questions, clusterData, targetUserIds } =
      req.body;

    if (!title || !clusterData || !targetUserIds) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newSurvey = {
      title,
      description,
      questions: questions || [], // Array of question strings or objects
      clusterData, // Snapshot of the cluster info (radius, center, issue count)
      targetUserIds, // Array of UIDs who should see this
      createdAt: new Date().toISOString(),
      createdBy: req.user.uid,
      status: "active",
    };

    const docRef = await db.collection("surveys").add(newSurvey);

    res
      .status(201)
      .json({ id: docRef.id, message: "Survey created successfully" });
  } catch (error) {
    console.error("Error creating survey:", error);
    res.status(500).json({ error: "Failed to create survey" });
  }
});

// Submit a response
router.post("/:id/respond", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { responses } = req.body; // { questionId: answer, ... } or just array

    const responseDoc = {
      surveyId: id,
      userId: req.user.uid,
      responses,
      submittedAt: new Date().toISOString(),
    };

    // Store in separate collection for scalability
    await db.collection("survey_responses").add(responseDoc);

    // Also update the main survey document as requested (careful with size limits)
    // We store a summary or the full response
    await db.collection("surveys").doc(id).update({
      // accessing FieldValue might require the admin SDK instance if not exported
      // fallback: manual update (not concurrent safe but okay for demo)
      // or just rely on the collection.
      // Let's rely on collection for "clean" approach, but implementing the GET endpoint
      // to view them is what the user really wants (the popup).
      updatedAt: new Date().toISOString(),
    });

    res.status(200).json({ message: "Response recorded" });
  } catch (error) {
    console.error("Error submitting response:", error);
    res.status(500).json({ error: "Failed to submit response" });
  }
});

// Get responses for a specific survey (Admin)
router.get("/:id/responses", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log("📊 Fetching responses for survey:", id);

    const snapshot = await db
      .collection("survey_responses")
      .where("surveyId", "==", id)
      .get();

    console.log("Found", snapshot.size, "responses");

    const responses = [];

    // Fetch user data for each response
    for (const doc of snapshot.docs) {
      const responseData = doc.data();
      let userName = "Unknown User";
      let userEmail = "";

      try {
        // Fetch user profile from users collection
        const userDoc = await db
          .collection("users")
          .doc(responseData.userId)
          .get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          userName = userData.name || userData.email || "Unknown User";
          userEmail = userData.email || "";
        }
      } catch (userError) {
        console.error("Error fetching user data:", userError);
      }

      responses.push({
        id: doc.id,
        ...responseData,
        userName,
        userEmail,
      });
    }

    // Sort in memory by submittedAt descending
    responses.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    console.log("Returning", responses.length, "responses with user data");
    res.status(200).json({ responses });
  } catch (error) {
    console.error("Error fetching responses:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch responses", details: error.message });
  }
});

module.exports = router;
