const vision = require("@google-cloud/vision");

// Vision API DISABLED - Requires Google Cloud billing account
// The system now uses only Gemini AI for priority detection
let client = null;

console.log(
  "ℹ️ Vision API disabled (no billing account). Using Gemini AI only for priority detection."
);

/**
 * Classify civic issue from image using Cloud Vision API
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<Object>} Classification result
 */
async function classifyIssueImage(imageBuffer) {
  // Vision API disabled - return placeholder
  console.warn("⚠️ Vision API not available, skipping image classification");
  return {
    category: "other",
    confidence: 0,
    labels: [],
    note: "Vision API disabled - no billing account",
  };
}

/**
 * Detect duplicate issues using image similarity
 * @param {Buffer} imageBuffer - New issue image
 * @param {Array} existingIssues - Array of existing issues with image URLs
 * @returns {Promise<Array>} Similar issues found
 */
async function detectDuplicateIssues(imageBuffer, existingIssues = []) {
  // Vision API disabled - return empty array
  console.warn("⚠️ Vision API not available, skipping duplicate detection");
  return [];
}

/**
 * Map Vision API labels to civic issue categories
 */
function detectCategoryFromLabels(labels) {
  const categoryKeywords = {
    pothole: ["pothole", "road", "asphalt", "pavement", "crack", "hole"],
    water: ["water", "leak", "pipe", "plumbing", "flood", "drainage"],
    garbage: ["garbage", "trash", "waste", "litter", "bin", "dump"],
    streetlight: ["light", "lamp", "street light", "illumination", "pole"],
    drainage: ["drain", "sewer", "sewage", "gutter", "manhole"],
    road: ["road", "street", "highway", "traffic", "construction"],
  };

  let bestMatch = { type: "other", confidence: 0 };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const label of labels) {
      const labelDesc = label.description.toLowerCase();
      const matchingKeyword = keywords.find((kw) => labelDesc.includes(kw));

      if (matchingKeyword && label.score > bestMatch.confidence) {
        bestMatch = {
          type: category,
          confidence: label.score,
        };
      }
    }
  }

  return bestMatch;
}

/**
 * Calculate similarity between two label arrays
 */
function calculateSimilarity(labels1, labels2) {
  const set1 = new Set(labels1.map((l) => l.toLowerCase()));
  const set2 = new Set(labels2.map((l) => l.toLowerCase()));

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

module.exports = {
  classifyIssueImage,
  detectDuplicateIssues,
};
