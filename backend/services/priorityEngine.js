const {
  analyzeIssueMultimodal,
  analyzeTextUrgency,
  getCategoryBaseline,
} = require("./geminiService");
const { classifyIssueImage } = require("./visionService");

/**
 * Determine final priority by combining all AI analysis
 * @param {Object} data - Issue data
 * @param {Buffer[]} data.images - Image buffers
 * @param {string} data.description - Text description
 * @param {string} data.category - User-selected category
 * @returns {Promise<Object>} Priority determination result
 */
async function determinePriority({ images, description, category }) {
  try {
    console.log("🤖 Starting AI Priority Analysis...");

    // 1. Get category baseline
    const baselinePriority = getCategoryBaseline(category);

    // 2. Analyze text for urgency
    const textPriority = analyzeTextUrgency(description);

    // 3. Classify image (if provided)
    let visionCategory = null;
    let visionConfidence = 0;

    if (images && images.length > 0) {
      const visionResult = await classifyIssueImage(images[0]);
      visionCategory = visionResult.category;
      visionConfidence = visionResult.confidence;
    }

    // 4. Run Gemini multimodal analysis (if images provided)
    let geminiAnalysis = null;

    if (images && images.length > 0) {
      geminiAnalysis = await analyzeIssueMultimodal({
        images,
        description,
        category: visionCategory || category,
      });
    }

    // 5. Combine all factors to determine final priority
    const finalPriority = combinePriorities({
      baseline: baselinePriority,
      text: textPriority,
      gemini: geminiAnalysis?.priority,
      geminiConfidence: geminiAnalysis?.confidence || 0,
    });

    const result = {
      priority: finalPriority,
      confidence: geminiAnalysis?.confidence || 0.7,
      reasoning:
        geminiAnalysis?.reasoning ||
        `Priority determined based on category (${category}) and text analysis`,
      analysis: {
        baseline: baselinePriority,
        textUrgency: textPriority,
        visionCategory: visionCategory,
        visionConfidence: visionConfidence,
        geminiPriority: geminiAnalysis?.priority,
        safetyRisk: geminiAnalysis?.safetyRisk,
        suggestedAction: geminiAnalysis?.suggestedAction,
      },
    };

    console.log("✅ Final Priority Decision:", {
      priority: result.priority,
      confidence: result.confidence,
    });

    return result;
  } catch (error) {
    console.error("❌ Priority Engine Error:", error.message);

    // Fallback to category baseline
    return {
      priority: getCategoryBaseline(category),
      confidence: 0.5,
      reasoning: "Error in AI analysis, using category baseline",
      analysis: {
        baseline: getCategoryBaseline(category),
        error: error.message,
      },
    };
  }
}

/**
 * Combine multiple priority signals into final decision
 */
function combinePriorities({ baseline, text, gemini, geminiConfidence }) {
  const priorityLevels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

  // If Gemini has high confidence, trust it
  if (gemini && geminiConfidence > 0.8) {
    return gemini;
  }

  // Otherwise, take the highest priority from all sources
  const priorities = [baseline, text, gemini].filter(Boolean);

  let highestPriority = "LOW";
  let highestIndex = 0;

  for (const priority of priorities) {
    const index = priorityLevels.indexOf(priority);
    if (index > highestIndex) {
      highestIndex = index;
      highestPriority = priority;
    }
  }

  return highestPriority;
}

module.exports = {
  determinePriority,
};
