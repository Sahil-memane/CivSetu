const { admin, db, bucket } = require("../config/firebase");
const fs = require("fs");
const path = require("path");

const UPLOADS_DIR = path.join(__dirname, "../uploads");

async function migrateUploads() {
  console.log("🚀 Starting migration of local uploads to Firebase Storage...");

  try {
    const issuesSnapshot = await db.collection("issues").get();
    let updatedCount = 0;

    for (const doc of issuesSnapshot.docs) {
      const issue = doc.data();
      const updates = {};
      let needsUpdate = false;

      // 1. Migrate Images
      if (issue.files && issue.files.images) {
        const newImageUrls = [];
        for (const imgPath of issue.files.images) {
          // Check if it's a local path (starts with "uploads/")
          if (typeof imgPath === "string" && imgPath.includes("uploads")) {
            const filename = path.basename(imgPath);
            const localFilePath = path.join(UPLOADS_DIR, filename);

            if (fs.existsSync(localFilePath)) {
              console.log(`📤 Uploading image: ${filename}`);
              try {
                const destination = `issues/images/${filename}`;
                await bucket.upload(localFilePath, {
                  destination: destination,
                  metadata: { contentType: "image/jpeg" }, // Simplification
                });

                const fileRef = bucket.file(destination);
                const [url] = await fileRef.getSignedUrl({
                  action: "read",
                  expires: "03-01-2500",
                });
                newImageUrls.push(url);
                needsUpdate = true;
              } catch (err) {
                console.error(`❌ Failed to upload ${filename}:`, err.message);
                newImageUrls.push(imgPath); // Keep original if failed
              }
            } else {
              console.warn(`⚠️ Local file not found: ${filename}`);
              newImageUrls.push(imgPath);
            }
          } else {
            newImageUrls.push(imgPath); // Already a URL or different format
          }
        }
        if (needsUpdate) {
          if (!updates.files) updates.files = { ...issue.files };
          updates.files.images = newImageUrls;
        }
      }

      // 2. Migrate Voice
      if (issue.files && issue.files.voice) {
        const voicePath = issue.files.voice;
        if (typeof voicePath === "string" && voicePath.includes("uploads")) {
          const filename = path.basename(voicePath);
          const localFilePath = path.join(UPLOADS_DIR, filename);

          if (fs.existsSync(localFilePath)) {
            console.log(`🎤 Uploading voice: ${filename}`);
            try {
              const destination = `issues/voice/${filename}`;
              await bucket.upload(localFilePath, {
                destination: destination,
                metadata: { contentType: "audio/webm" },
              });

              const fileRef = bucket.file(destination);
              const [url] = await fileRef.getSignedUrl({
                action: "read",
                expires: "03-01-2500",
              });

              if (!updates.files) updates.files = { ...issue.files };
              updates.files.voice = url;
              needsUpdate = true;
            } catch (err) {
              console.error(
                `❌ Failed to upload voice ${filename}:`,
                err.message
              );
            }
          }
        }
      }

      // 3. Update Firestore Document
      if (needsUpdate) {
        await db.collection("issues").doc(doc.id).update(updates);
        console.log(`✅ Updated issue ${doc.id}`);
        updatedCount++;
      }
    }

    console.log(`\n🎉 Migration complete. Updated ${updatedCount} issues.`);
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

migrateUploads();
