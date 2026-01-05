const { db } = require("../config/firebase");
const fs = require("fs");
const path = require("path");

// 4 Citizens
const citizens = [
  {
    uid: "9cyjqqxiqBfaUMFHRWghLWwOlbU2",
    name: "Citizen 2",
    email: "citizen2@gmail.com",
  },
  {
    uid: "JuX8nc4bDRaKqA1yHQwymjpPbxB3",
    name: "Citizen 3",
    email: "citizen3@gmail.com",
  },
  {
    uid: "leIsiK06jCVWdd9WMEVXsjlqIyZ2",
    name: "Citizen 1",
    email: "citizen1@gmail.com",
  },
  {
    uid: "mrrbucpTeweFTP51NCNFlotsqjg1",
    name: "Sahil Memane",
    email: "sahilmemane007@gmail.com",
  },
];

// Create dummy files for proofs
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Generate some dummy filenames
const dummyPhotos = [
  "pothole_proof.jpg",
  "garbage_proof.jpg",
  "water_leak.jpg",
];
const dummyDocs = ["repair_request.pdf", "official_complaint.docx"];

// Create the files if they don't exist
dummyPhotos.forEach((f) => {
  const filePath = path.join(uploadsDir, f);
  if (!fs.existsSync(filePath))
    fs.writeFileSync(filePath, "dummy image content");
});
dummyDocs.forEach((f) => {
  const filePath = path.join(uploadsDir, f);
  if (!fs.existsSync(filePath))
    fs.writeFileSync(filePath, "dummy document content");
});

// Sample issues data with Pune, India coordinates
const sampleIssues = [
  // POTHOLE issues
  {
    category: "pothole",
    title: "Large pothole on MG Road causing accidents",
    description:
      "A deep pothole has formed near the traffic signal. Multiple vehicles have been damaged. Urgent repair needed.",
    location: "18.582733, 73.806843",
    priority: "high",
    status: "pending",
  },
  {
    category: "pothole",
    title: "Multiple potholes on residential street",
    description:
      "Several small to medium potholes making the road difficult to navigate, especially during rain.",
    location: "18.520430, 73.856743",
    priority: "medium",
    status: "pending",
  },
  {
    category: "pothole",
    title: "Pothole near school entrance",
    description:
      "Dangerous pothole right at the school entrance. Children and parents at risk.",
    location: "18.528550, 73.874537",
    priority: "critical",
    status: "pending",
  },

  // WATER issues
  {
    category: "water",
    title: "Water pipe burst flooding the street",
    description:
      "Major water leak from underground pipe. Water flowing continuously for 2 days. Wastage of water.",
    location: "18.516726, 73.856255",
    priority: "critical",
    status: "pending",
  },
  {
    category: "water",
    title: "Leaking water connection at junction",
    description:
      "Small but continuous leak at pipe junction. Water being wasted daily.",
    location: "18.559008, 73.771263",
    priority: "medium",
    status: "pending",
  },

  // GARBAGE issues
  {
    category: "garbage",
    title: "Overflowing garbage bins attracting stray animals",
    description:
      "Garbage bins haven't been emptied in 4 days. Foul smell and health hazard.",
    location: "18.530326, 73.845436",
    priority: "high",
    status: "pending",
  },
  {
    category: "garbage",
    title: "Illegal dumping site near residential area",
    description:
      "People dumping construction waste and household garbage in open area. Becoming a health hazard.",
    location: "18.551842, 73.897285",
    priority: "high",
    status: "pending",
  },
  {
    category: "garbage",
    title: "Garbage collection not happening regularly",
    description:
      "Scheduled garbage pickup missed for the third time this month.",
    location: "18.467354, 73.867405",
    priority: "medium",
    status: "pending",
  },

  // STREETLIGHT issues
  {
    category: "streetlight",
    title: "Street lights not working for a week",
    description:
      "Entire street in darkness. Safety concern for residents, especially women and children.",
    location: "18.540365, 73.825721",
    priority: "high",
    status: "pending",
  },
  {
    category: "streetlight",
    title: "Broken street light pole",
    description:
      "Light pole damaged and hanging dangerously. Could fall and cause injury.",
    location: "18.489395, 73.827209",
    priority: "critical",
    status: "pending",
  },

  // DRAINAGE issues
  {
    category: "drainage",
    title: "Blocked drainage causing waterlogging",
    description:
      "Drainage completely blocked. Water accumulates during rain creating mosquito breeding ground.",
    location: "18.563726, 73.914093",
    priority: "high",
    status: "pending",
  },
  {
    category: "drainage",
    title: "Open manhole without cover",
    description:
      "Manhole cover missing for 2 weeks. Extremely dangerous, especially at night.",
    location: "18.512583, 73.856430",
    priority: "critical",
    status: "pending",
  },

  // ROAD issues
  {
    category: "road",
    title: "Road surface completely damaged",
    description:
      "Major road damage after monsoon. Road barely usable. Needs complete resurfacing.",
    location: "18.521428, 73.855347",
    priority: "high",
    status: "pending",
  },
  {
    category: "road",
    title: "Cracks developing on main road",
    description:
      "Multiple cracks appearing on the road surface. Will worsen if not repaired soon.",
    location: "18.568220, 73.914093",
    priority: "medium",
    status: "pending",
  },

  // OTHER issues
  {
    category: "other",
    title: "Illegal parking blocking road",
    description:
      "Vehicles parked permanently on the road causing traffic congestion.",
    location: "18.530430, 73.845743",
    priority: "low",
    status: "pending",
  },
];

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Step 1: Clear existing issues
    console.log("🗑️  Clearing existing issues...");
    const existingIssues = await db.collection("issues").get();
    const deletePromises = existingIssues.docs.map((doc) => doc.ref.delete());
    await Promise.all(deletePromises);
    console.log(`   Deleted ${existingIssues.size} existing issues`);

    // Step 2: Create sample issues
    console.log("📝 Creating sample issues...");
    const issuePromises = sampleIssues.map((issue) => {
      // Randomly assign to a citizen
      const citizen = citizens[Math.floor(Math.random() * citizens.length)];

      // Random date within last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      // Randomly assign dummy files
      const hasPhoto = Math.random() > 0.3;
      const hasDoc = Math.random() > 0.7;
      const hasVoice = Math.random() > 0.5;

      const issueFiles = {
        images: [],
        voice: null,
      };

      if (hasPhoto) {
        issueFiles.images.push(
          `uploads/${
            dummyPhotos[Math.floor(Math.random() * dummyPhotos.length)]
          }`
        );
      }
      if (hasDoc) {
        issueFiles.images.push(
          `uploads/${dummyDocs[Math.floor(Math.random() * dummyDocs.length)]}`
        );
      }
      if (hasVoice) {
        issueFiles.voice = `uploads/dummy_voice.webm`;
        const voicePath = path.join(uploadsDir, "dummy_voice.webm");
        if (!fs.existsSync(voicePath))
          fs.writeFileSync(voicePath, "dummy audio content");
      }

      const issueData = {
        ...issue,
        uid: citizen.uid,
        createdAt: createdAt.toISOString(),
        updatedAt: createdAt.toISOString(),
        verifications: Math.floor(Math.random() * 10),
        files: issueFiles,
        aiAnalysis: {
          confidence: 0.7 + Math.random() * 0.25,
          reasoning: `AI detected ${issue.priority} priority based on ${issue.category} severity and description analysis.`,
          analysis: {
            baseline: issue.priority.toUpperCase(),
            textUrgency: issue.priority.toUpperCase(),
          },
        },
      };

      return db.collection("issues").add(issueData);
    });

    const createdIssues = await Promise.all(issuePromises);
    console.log(`✅ Created ${createdIssues.length} sample issues`);

    // Step 3: Display summary
    console.log("\n📊 Summary by citizen:");
    for (const citizen of citizens) {
      const userIssues = await db
        .collection("issues")
        .where("uid", "==", citizen.uid)
        .get();
      console.log(`   ${citizen.name}: ${userIssues.size} issues`);
    }

    console.log("\n📊 Summary by category:");
    const categories = [
      "pothole",
      "water",
      "garbage",
      "streetlight",
      "drainage",
      "road",
      "other",
    ];
    for (const category of categories) {
      const categoryIssues = await db
        .collection("issues")
        .where("category", "==", category)
        .get();
      console.log(`   ${category}: ${categoryIssues.size} issues`);
    }

    console.log("\n✅ Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
