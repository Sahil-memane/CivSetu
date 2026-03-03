const { db } = require("../config/firebase");

// ─────────────────────────────────────────────────────────────────────────────
// restoreIssues.js
// Re-adds the predefined sample issues back to Firebase WITHOUT deleting any
// existing issues. Safe to run repeatedly — does not wipe the collection first.
//
// Document structure matches the Issue interface in:
//   frontend/src/components/issues/IssueCard.tsx
// ─────────────────────────────────────────────────────────────────────────────

// 4 Citizens (same UIDs as the original seed so notifications land correctly)
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

// ─── Helper ──────────────────────────────────────────────────────────────────
/**
 * Returns a random integer in [min, max] (inclusive).
 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Builds SLA-aware dates for an issue so that statuses look natural:
 *  - resolved / rejected → created 3-10 days ago (SLA always ON_TRACK / completed)
 *  - active issues       → created within 0–80 % of their SLA window so they
 *                           still have time left (ON_TRACK or AT_RISK at worst)
 */
function buildDates(issue) {
  const priorityDays = { critical: 3, high: 7, medium: 14, low: 30 };
  const slaDays = priorityDays[issue.priority] || 14;

  let createdAt = new Date();

  if (issue.status === "resolved" || issue.status === "rejected") {
    // Place creation 3–10 days in the past so resolution looks plausible
    createdAt.setDate(createdAt.getDate() - randInt(3, 10));
  } else {
    // Keep within 80 % of the SLA window so the issue is not immediately overdue
    const maxAge = Math.max(1, Math.floor(slaDays * 0.8));
    createdAt.setDate(createdAt.getDate() - randInt(0, maxAge));
  }

  const slaEnd = new Date(createdAt);
  slaEnd.setDate(slaEnd.getDate() + slaDays);

  const now = new Date();
  const diffMs = slaEnd.getTime() - now.getTime();
  const daysRem = diffMs / (1000 * 3600 * 24);

  let slaStatus = "ON_TRACK";
  if (issue.status !== "resolved" && issue.status !== "rejected") {
    if (daysRem < 0) slaStatus = "BREACHED";
    else if (daysRem < 2) slaStatus = "AT_RISK";
  }

  // resolvedAt — slightly after creation, never in the future
  let resolvedAt = null;
  if (issue.status === "resolved") {
    const r = new Date(createdAt);
    r.setDate(r.getDate() + Math.min(slaDays, randInt(1, 3)));
    if (r > now) r.setTime(now.getTime() - 3600 * 1000); // cap at 1 h ago
    resolvedAt = r.toISOString();
  }

  return { createdAt, slaEnd, slaDays, daysRem, slaStatus, resolvedAt };
}

// ─── Sample Issues ────────────────────────────────────────────────────────────
// All 14 issues from the original seedIssues.js, preserved exactly.
// Fields mirror the Issue interface from IssueCard.tsx.
const sampleIssues = [
  // ── POTHOLE ────────────────────────────────────────────────────────────────
  {
    category: "pothole",
    title: "Large pothole on MG Road causing accidents",
    description:
      "A deep pothole has formed near the traffic signal. Multiple vehicles have been damaged. Urgent repair needed.",
    location: "18.582733, 73.806843",
    priority: "high",
    status: "in-progress",
    files: {
      images: ["uploads/pothole_proof.jpg"],
      documents: [],
      voice: null,
    },
    planningDocs: [
      "uploads/1767979150622-262046323-Pothole_Near_School_Implementation_Plan.pdf",
    ],
    staffAllocated: "Road Maintenance Team A",
    resourcesUsed: "Asphalt, heavy roller",
  },
  {
    category: "pothole",
    title: "Multiple potholes on residential street",
    description:
      "Several small to medium potholes making the road difficult to navigate, especially during rain.",
    location: "18.520430, 73.856743",
    priority: "medium",
    status: "pending",
    files: {
      images: ["uploads/multiple_potholes.jpg"],
      documents: [],
      voice: null,
    },
  },
  {
    category: "pothole",
    title: "Pothole near school entrance",
    description:
      "Dangerous pothole right at the school entrance. Children and parents at risk.",
    location: "18.528550, 73.874537",
    priority: "critical",
    status: "in-progress",
    files: {
      images: ["uploads/school_pothole.jpg"],
      documents: [],
      voice: null,
    },
    planningDocs: [
      "uploads/1767979150622-262046323-Pothole_Near_School_Implementation_Plan.pdf",
    ],
    staffAllocated: "Emergency Repair Unit",
    actionTaken: "Site inspected, repair scheduled",
  },

  // ── WATER ──────────────────────────────────────────────────────────────────
  {
    category: "water",
    title: "Water pipe burst flooding the street",
    description:
      "Major water leak from underground pipe. Water flowing continuously for 2 days. Wastage of water.",
    location: "18.516726, 73.856255",
    priority: "critical",
    status: "resolved",
    files: {
      images: ["uploads/water_pipe_burst.jpg"],
      documents: [
        "uploads/1767719839545-26376110-Water_Pipe_Burst_Emergency_Inspection_Report.pdf",
      ],
      voice: null,
    },
    planningDocs: [
      "uploads/1767978807720-107626297-Leaking_Water_Connection_Implementation_Plan.pdf",
    ],
    staffAllocated: "Emergency Repair Unit - Team Beta",
    actionTaken:
      "Excavated site, replaced burst pipe section, pressure tested, and refilled.",
    resourcesUsed: "JCB, New Pipe Segment, Welding Gear, 4 Workers",
    resolutionProofs: [
      "uploads/1767720137287-405143787-Water_Pipe_Burst_Final_Resolution_Report.pdf",
      "uploads/pipes_fixed.jpg",
      "uploads/pipes_fixed1.jpg",
    ],
    resolutionRemarks: "Pipe replaced and leak sealed. Area cleaned up.",
  },
  {
    category: "water",
    title: "Leaking water connection at junction",
    description:
      "Small but continuous leak at pipe junction. Water being wasted daily.",
    location: "18.559008, 73.771263",
    priority: "medium",
    status: "in-progress",
    files: {
      images: ["uploads/leaking_water.jpg", "uploads/leaking_water2.jpg"],
      documents: [],
      voice: null,
    },
    planningDocs: [
      "uploads/1767978807720-107626297-Leaking_Water_Connection_Implementation_Plan.pdf",
    ],
    staffAllocated: "Water Works Dept",
  },

  // ── GARBAGE ────────────────────────────────────────────────────────────────
  {
    category: "garbage",
    title: "Overflowing garbage bins attracting stray animals",
    description:
      "Garbage bins haven't been emptied in 4 days. Foul smell and health hazard.",
    location: "18.530326, 73.845436",
    priority: "high",
    status: "resolved",
    files: {
      images: ["uploads/garbage_proof.jpg"],
      documents: [],
      voice: null,
    },
    resolutionProofs: [
      "uploads/1767698867607-404867116-garbage_resolved_1.jpg",
      "uploads/1767698867616-266871942-garbage_resolved_2.jpg",
      "uploads/Garbage_Collection_Issue_Resolution_Report_CivSetu.pdf",
    ],
    resolutionRemarks: "Garbage cleared and bins sanitized.",
  },
  {
    category: "garbage",
    title: "Illegal dumping site near residential area",
    description:
      "People dumping construction waste and household garbage in open area. Becoming a health hazard.",
    location: "18.551842, 73.897285",
    priority: "high",
    status: "in-progress",
    files: {
      images: ["uploads/illegal_dumping.jpg", "uploads/illegal_dumping2.jpg"],
      documents: [],
      voice: "uploads/dummy_voice.webm",
    },
    planningDocs: [
      "uploads/1767703860369-134943167-Illegal_Dumping_Implementation_Strategy_CivSetu.pdf",
    ],
    staffAllocated: "Sanitation Squad",
    actionTaken: "Notice issued to nearby construction sites",
  },
  {
    category: "garbage",
    title: "Garbage collection not happening regularly",
    description:
      "Scheduled garbage pickup missed for the third time this month.",
    location: "18.467354, 73.867405",
    priority: "medium",
    status: "pending",
    files: {
      images: ["uploads/stray_animals.jpg"],
      documents: [],
      voice: null,
    },
  },

  // ── STREETLIGHT ────────────────────────────────────────────────────────────
  {
    category: "streetlight",
    title: "Street lights not working for a week",
    description:
      "Entire street in darkness. Safety concern for residents, especially women and children.",
    location: "18.540365, 73.825721",
    priority: "high",
    status: "pending",
    files: {
      images: ["uploads/street_light_not_working.jpg"],
      documents: [],
      voice: null,
    },
  },
  {
    category: "streetlight",
    title: "Broken street light pole",
    description:
      "Light pole damaged and hanging dangerously. Could fall and cause injury.",
    location: "18.489395, 73.827209",
    priority: "critical",
    status: "in-progress",
    files: {
      images: [],
      documents: [],
      voice: null,
    },
    planningDocs: [
      "uploads/1767719595274-192650954-Broken_Streetlight_Pole_Site_Inspection_Report.pdf",
    ],
  },

  // ── DRAINAGE ───────────────────────────────────────────────────────────────
  {
    category: "drainage",
    title: "Blocked drainage causing waterlogging",
    description:
      "Drainage completely blocked. Water accumulates during rain creating mosquito breeding ground.",
    location: "18.563726, 73.914093",
    priority: "high",
    status: "pending",
    files: {
      images: [],
      documents: [],
      voice: null,
    },
  },
  {
    category: "drainage",
    title: "Open manhole without cover",
    description:
      "Manhole cover missing for 2 weeks. Extremely dangerous, especially at night.",
    location: "18.512583, 73.856430",
    priority: "critical",
    status: "pending",
    files: {
      images: ["uploads/open_manhole.jpg"],
      documents: [],
      voice: null,
    },
  },

  // ── ROAD ───────────────────────────────────────────────────────────────────
  {
    category: "road",
    title: "Road surface completely damaged",
    description:
      "Major road damage after monsoon. Road barely usable. Needs complete resurfacing.",
    location: "18.521428, 73.855347",
    priority: "high",
    status: "pending",
    files: {
      images: ["uploads/road_surface.jpg"],
      documents: [],
      voice: null,
    },
  },
  {
    category: "road",
    title: "Cracks developing on main road",
    description:
      "Multiple cracks appearing on the road surface. Will worsen if not repaired soon.",
    location: "18.568220, 73.914093",
    priority: "medium",
    status: "pending",
    files: {
      images: ["uploads/road_cracks.jpg"],
      documents: [],
      voice: null,
    },
  },

  // ── OTHER ──────────────────────────────────────────────────────────────────
  {
    category: "other",
    title: "Illegal parking blocking road",
    description:
      "Vehicles parked permanently on the road causing traffic congestion.",
    location: "18.530430, 73.845743",
    priority: "low",
    status: "pending",
    files: {
      images: ["uploads/illegal_parking.jpg"],
      documents: [],
      voice: null,
    },
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function restoreIssues() {
  try {
    console.log("🔄 Starting issue restore (non-destructive)...");
    console.log(`   Issues to restore: ${sampleIssues.length}`);

    const issuePromises = sampleIssues.map((issue) => {
      // Randomly assign a citizen
      const citizen = citizens[randInt(0, citizens.length - 1)];

      // Build SLA-aware dates
      const { createdAt, slaEnd, slaDays, daysRem, slaStatus, resolvedAt } =
        buildDates(issue);

      // Parse coordinates from "lat, lng" string
      const [latStr, lngStr] = issue.location.split(",").map((s) => s.trim());

      // ── Core issue document (matches Issue interface in IssueCard.tsx) ──────
      const issueData = {
        // Identity & Classification
        uid: citizen.uid,
        category: issue.category,
        title: issue.title,
        description: issue.description,
        location: issue.location,
        priority: issue.priority,
        status: issue.status,

        // Files (images / documents / voice)
        files: issue.files,

        // Engagement
        verifications: randInt(0, 9),
        agrees: [],
        disagrees: [],
        comments: [],

        // Geospatial
        coordinates: {
          lat: parseFloat(latStr),
          lng: parseFloat(lngStr),
        },

        // Timestamps
        createdAt: createdAt.toISOString(),
        updatedAt: createdAt.toISOString(),
        reportedAt: createdAt.toISOString(),

        // SLA Fields
        slaStatus: slaStatus,
        slaDays: slaDays,
        daysRemaining: daysRem,
        slaEndDate: slaEnd.toISOString(),

        // AI Analysis (mock)
        aiAnalysis: {
          confidence: parseFloat((0.7 + Math.random() * 0.25).toFixed(3)),
          reasoning: `AI detected ${issue.priority} priority based on ${issue.category} severity and description analysis.`,
          analysis: {
            baseline: issue.priority.toUpperCase(),
            textUrgency: issue.priority.toUpperCase(),
          },
        },
      };

      // ── Optional Official-Response Fields ────────────────────────────────
      if (issue.planningDocs) issueData.planningDocs = issue.planningDocs;
      if (issue.staffAllocated) issueData.staffAllocated = issue.staffAllocated;
      if (issue.actionTaken) issueData.actionTaken = issue.actionTaken;
      if (issue.resourcesUsed) issueData.resourcesUsed = issue.resourcesUsed;

      // ── Optional Resolution Fields ───────────────────────────────────────
      if (issue.resolutionProofs)
        issueData.resolutionProofs = issue.resolutionProofs;
      if (issue.resolutionRemarks)
        issueData.resolutionRemarks = issue.resolutionRemarks;
      if (resolvedAt) issueData.resolvedAt = resolvedAt;

      // ── Write to Firestore then add notifications ────────────────────────
      return db
        .collection("issues")
        .add(issueData)
        .then(async (docRef) => {
          console.log(
            `   ✅ [${issue.category.padEnd(11)}] ${issue.title.substring(0, 50)}…  → ${docRef.id}`,
          );

          // Notification 1: Submission
          try {
            await db
              .collection("users")
              .doc(citizen.uid)
              .collection("notifications")
              .add({
                title: "Issue Reported Successfully",
                body: `Your issue '${issue.title}' has been successfully reported. Token ID: ${docRef.id}`,
                type: "SUBMISSION",
                data: { issueId: docRef.id },
                read: false,
                createdAt: createdAt.toISOString(),
              });

            // Notification 2: Status Change (if not pending)
            if (issue.status !== "pending") {
              await db
                .collection("users")
                .doc(citizen.uid)
                .collection("notifications")
                .add({
                  title: "Issue Status Updated",
                  body: `Your reported issue '${issue.title}' is now ${issue.status}.`,
                  type: "STATUS_CHANGE",
                  data: { issueId: docRef.id, status: issue.status },
                  read: false,
                  createdAt: new Date().toISOString(),
                });
            }

            // Notification 3: Resolution
            if (issue.status === "resolved") {
              await db
                .collection("users")
                .doc(citizen.uid)
                .collection("notifications")
                .add({
                  title: "Issue Resolved",
                  body: `Your reported issue '${issue.title}' has been resolved. Thank you for helping improve the city.`,
                  type: "RESOLUTION",
                  data: { issueId: docRef.id },
                  read: false,
                  createdAt: new Date().toISOString(),
                });
            }
          } catch (notifError) {
            console.error(
              `   ⚠️  Notification error for ${docRef.id}:`,
              notifError.message,
            );
          }

          return docRef;
        });
    });

    const created = await Promise.all(issuePromises);
    console.log(
      `\n✅ Restore complete — ${created.length} issues added to Firebase.`,
    );

    // ── Summary ─────────────────────────────────────────────────────────────
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
    for (const cat of categories) {
      const snap = await db
        .collection("issues")
        .where("category", "==", cat)
        .get();
      console.log(
        `   ${cat.padEnd(12)}: ${snap.size} total issues in Firebase`,
      );
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Restore failed:", err);
    process.exit(1);
  }
}

restoreIssues();
