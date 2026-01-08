const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// Initialize Firebase Admin (if not already initialized)
const serviceAccount = require("../serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "civsetu-c18ea.firebasestorage.app",
  });
}

const bucket = admin.storage().bucket();

async function uploadAPK() {
  try {
    const apkPath = path.join(__dirname, "../app_apk/CivSetu_Mobile_App.apk");
    const destination = "apk/CivSetu_Mobile_App.apk";

    console.log("📱 Starting APK upload to Firebase Storage...");
    console.log(`   Local path: ${apkPath}`);
    console.log(`   Destination: ${destination}`);

    // Check if file exists
    if (!fs.existsSync(apkPath)) {
      console.error("❌ APK file not found at:", apkPath);
      process.exit(1);
    }

    // Get file size
    const stats = fs.statSync(apkPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`   File size: ${fileSizeInMB} MB`);

    // Upload file
    await bucket.upload(apkPath, {
      destination: destination,
      metadata: {
        contentType: "application/vnd.android.package-archive",
        metadata: {
          firebaseStorageDownloadTokens: "civsetu-app", // Optional: custom token
        },
      },
    });

    console.log("✅ APK uploaded successfully!");
    console.log(`   Storage path: gs://${bucket.name}/${destination}`);

    // Make the file publicly accessible (optional - we'll use signed URLs instead)
    // await bucket.file(destination).makePublic();
    // console.log("✅ APK is now publicly accessible");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error uploading APK:", error);
    process.exit(1);
  }
}

uploadAPK();
