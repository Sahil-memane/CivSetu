const { db } = require("../config/firebase");

// Pune Centroid for demo
const PUNE_LAT = 18.5204;
const PUNE_LNG = 73.8567;

function getRandomOffset() {
  // Random offset ~0-5km
  return (Math.random() - 0.5) * 0.05;
}

// Check if string looks like coordinates "18.123, 73.123"
function isCoordinateString(str) {
  return /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/.test(
    str
  );
}

async function migrateLocations() {
  try {
    console.log("🌍 Starting location migration...");
    const issuesSnap = await db.collection("issues").get();

    if (issuesSnap.empty) {
      console.log("No issues found.");
      return;
    }

    const batch = db.batch();
    let count = 0;

    issuesSnap.forEach((doc) => {
      const data = doc.data();
      let updateData = {};

      // If 'coordinates' is already mostly there, skip? No, enforce structure.
      if (!data.coordinates || !data.coordinates.lat) {
        // Check if existing location is coordinate-like
        if (isCoordinateString(data.location)) {
          // Split and use
          const [lat, lng] = data.location
            .split(",")
            .map((s) => parseFloat(s.trim()));
          updateData.coordinates = { lat, lng };
          // Keep location as string for 'address'
        } else {
          // Generate random coordinate near Pune
          updateData.coordinates = {
            lat: PUNE_LAT + getRandomOffset(),
            lng: PUNE_LNG + getRandomOffset(),
          };
        }

        // Ensure location field exists as string (fallback)
        if (!data.location) {
          updateData.location = "Unknown Location";
        }

        batch.update(doc.ref, updateData);
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`✅ Migrated ${count} issues to include GPS coordinates.`);
    } else {
      console.log("All issues already have coordinates.");
    }
    process.exit(0);
  } catch (error) {
    console.error("❌ Error migrating locations:", error);
    process.exit(1);
  }
}

migrateLocations();
