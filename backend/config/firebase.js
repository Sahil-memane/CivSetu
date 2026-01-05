const admin = require("firebase-admin");
const dotenv = require("dotenv");

dotenv.config();

// Check if credentials are provided via environment variables or service account file
// For this setup, we'll try to load from a standard path or environment variables
// You should place your serviceAccountKey.json in the backend root or config folder

let serviceAccount;

try {
  // Option 1: Load from file (Recommended for local dev)
  serviceAccount = require("../serviceAccountKey.json");
  console.log("✅ Service Account Key loaded successfully");
} catch (error) {
  // Option 2: Try environment variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      console.log("✅ Service Account loaded from environment variable");
    } catch (parseError) {
      console.warn("⚠️ Failed to parse FIREBASE_SERVICE_ACCOUNT env var");
    }
  } else {
    console.warn(
      "⚠️ No Firebase credentials found. Database access will fail.\n" +
        "📝 Please add serviceAccountKey.json to the backend folder.\n" +
        "See FIREBASE_SETUP_GUIDE.md for instructions."
    );
  }
}

let hasDbAccess = false;

if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    hasDbAccess = true;
  } else {
    // Fallback or initialization without explicit creds (may work on Google Cloud environment)
    // Or just initialize default which might fail on local without setup
    // For now, let's just initialize to allow the app to crash lazily if auth is used
    try {
      admin.initializeApp({
        projectId: "civsetu-c18ea", // Explicitly set Project ID to fix "Unable to detect Project Id"
      });
      console.log(
        "Firebase Admin initialized with default credentials and Project ID: civsetu-c18ea. (DB Access likely restricted)"
      );
      // hasDbAccess remains false
    } catch (e) {
      console.warn("Failed to initialize Firebase Admin:", e.message);
    }
  }
} else {
  // If already initialized (e.g. hot reload), assume we have access if we had creds, or hard to tell.
  // Ideally check app options. For simplicity in this dev loop:
  hasDbAccess = !!serviceAccount;
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth, hasDbAccess };
