const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");

dotenv.config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyze issue using Gemini's multimodal capabilities
 * @param {Object} data - Issue data
 * @param {Buffer[]} data.images - Array of image buffers
 * @param {string} data.description - Text description
 * @param {string} data.category - Issue category
 * @returns {Promise<Object>} Analysis result with priority and reasoning
 */
async function analyzeIssueMultimodal({ images, description, category }) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Prepare image parts for Gemini
    const imageParts = images.map((buffer) => ({
      inlineData: {
        data: buffer.toString("base64"),
        mimeType: "image/jpeg",
      },
    }));

    // Create comprehensive prompt
    const prompt = `You are an AI assistant analyzing civic infrastructure issues for priority assignment.

**Issue Details:**
- Category: ${category}
- Description: ${description}

**Your Task:**
Analyze the provided image(s) and description to determine the priority level of this civic issue.

**Priority Levels:**
- CRITICAL: Immediate safety hazard (fire, flooding, exposed electrical, structural collapse, major accidents)
- HIGH: Significant issue affecting safety or major functionality (large potholes, major leaks, blocked roads)
- MEDIUM: Moderate impact on daily life (broken streetlights, minor leaks, moderate damage)
- LOW: Minor inconvenience or cosmetic issues (small cracks, minor wear)

**Analysis Factors:**
1. Safety risk to citizens
2. Severity of damage visible in images
3. Impact scope (how many people affected)
4. Urgency keywords in description
5. Category-specific considerations

**Response Format (JSON):**
{
  "priority": "CRITICAL|HIGH|MEDIUM|LOW",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why this priority was assigned",
  "safetyRisk": "Description of any safety concerns",
  "suggestedAction": "Recommended immediate action if any"
}

Provide ONLY the JSON response, no additional text.`;

    // Call Gemini with multimodal input
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format from Gemini");
    }

    const analysis = JSON.parse(jsonMatch[0]);

    console.log("✅ Gemini AI Analysis Complete:", {
      priority: analysis.priority,
      confidence: analysis.confidence,
    });

    return analysis;
  } catch (error) {
    console.error("❌ Gemini AI Analysis Error:", error.message);

    // Fallback to category-based priority
    return {
      priority: getCategoryBaseline(category),
      confidence: 0.5,
      reasoning: "AI analysis unavailable, using category baseline",
      safetyRisk: "Unknown - manual review recommended",
      suggestedAction: "Review by relevant department",
      error: error.message,
    };
  }
}

/**
 * Get baseline priority based on category
 */
function getCategoryBaseline(category) {
  const baselines = {
    water: "MEDIUM",
    pothole: "MEDIUM",
    streetlight: "LOW",
    drainage: "MEDIUM",
    garbage: "LOW",
    road: "MEDIUM",
    other: "LOW",
  };
  return baselines[category] || "LOW";
}

/**
 * Analyze text description for urgency keywords
 */
function analyzeTextUrgency(description) {
  const urgencyKeywords = {
    critical: ["fire", "flood", "collapse", "emergency", "danger", "accident"],
    high: ["urgent", "serious", "major", "severe", "hazard", "unsafe"],
    medium: ["broken", "damaged", "leaking", "blocked"],
  };

  const lowerDesc = description.toLowerCase();

  if (urgencyKeywords.critical.some((kw) => lowerDesc.includes(kw))) {
    return "CRITICAL";
  }
  if (urgencyKeywords.high.some((kw) => lowerDesc.includes(kw))) {
    return "HIGH";
  }
  if (urgencyKeywords.medium.some((kw) => lowerDesc.includes(kw))) {
    return "MEDIUM";
  }

  return "LOW";
}

module.exports = {
  analyzeIssueMultimodal,
  analyzeTextUrgency,
  getCategoryBaseline,
};
