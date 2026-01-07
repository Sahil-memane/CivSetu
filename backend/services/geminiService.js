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
async function analyzeIssueMultimodal(data) {
  const { images, description, category, title } = data;
  try {
    // LAYER 1: HARD HEURISTIC CHECKS (Fail Fast)
    const textContent = `${title} ${description}`.toLowerCase();

    // 1. Keyword Blocklist (Substring matching, no word boundaries for 'test')
    // Catches "testness", "mytest", "test1234"
    if (
      textContent.includes("test") ||
      textContent.includes("demo") ||
      textContent.includes("dummy") ||
      textContent.includes("sample")
    ) {
      console.warn("🚫 Rejected by Keyword Check");
      return {
        isValid: false,
        rejectionReason: "Submission contains prohibited testing keywords.",
        confidence: 1.0,
      };
    }

    // 2. Text-Only Strictness (If no images)
    if (!images || images.length === 0) {
      const wordCount = description.trim().split(/\s+/).length;
      if (description.length < 20 || wordCount < 4) {
        return {
          isValid: false,
          rejectionReason:
            "Description is too short. Please explain the issue in detail (at least 4 words) since no photos were provided.",
          confidence: 1.0,
        };
      }

      // 3. Gibberish Detector (Basic Vowel Check)
      // detailed texts usually have vowels. "dcdvrfdc" has none.
      const vowels = description.match(/[aeiou]/gi);
      if (!vowels || vowels.length < 2) {
        // Extremely low vowel count -> likely mash
        return {
          isValid: false,
          rejectionReason: "Text appears to be unreadable or gibberish.",
          confidence: 1.0,
        };
      }
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Prepare image parts for Gemini
    const imageParts = (images || []).map((imgObj) => {
      // Handle both {buffer, mimeType} object and raw Buffer (legacy support)
      const buffer = imgObj.buffer || imgObj;
      const mimeType = imgObj.mimeType || "image/jpeg";

      return {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: mimeType,
        },
      };
    });

    // Create comprehensive prompt
    const hasImages = imageParts.length > 0;
    const prompt = `You are an AI Smart City Guard. Your goal is to strictly validate civic issue reports to prevent spam, fake, or low-quality submissions.

**Submission Data:**
- Title: "${data.title || "N/A"}"
- Category: "${category}"
- Description: "${description}"
- Address: "${data.address || "N/A"}"
- GPS: ${
      data.coordinates
        ? `${data.coordinates.lat}, ${data.coordinates.lng}`
        : "N/A"
    }
- Has Media: ${hasImages ? "YES" : "NO"}

**Validation Protocol (Execute in Order):**

1.  **Gibberish & Spam Detection**:
    *   Analyze the Title and Description for lack of semantic meaning (e.g., "dwdwdef", "asdf", "12345", "test issue").
    *   Check for keyboard mashing or repetitive nonsensical patterns.
    *   **Action**: If found, REJECT with reason "Text appears to be gibberish or spam."

2.  **Contextual Validity**:
    *   Does the text describe a *real* civic problem?
    *   Reject generic/placeholder text (e.g., "Description", "Fix this", "Issue here") unless accompanied by a very clear image.
    *   Reject personal rants, commercial ads, or content unrelated to public infrastructure.
    *   **Action**: If invalid, REJECT with reason "Content is unrelated to civic infrastructure."

3.  **"No-Proof" Strict Mode** (Triggered if Has Media = NO):
    *   If there are NO images, the Description MUST be detailed (approx. 10+ words) and specific (mentioning exact location or nature of defect).
    *   Reject vague reports like "Road is bad" or "Pothole here" without photos, as they are unverified.
    *   **Action**: REJECT with reason "Insufficient details. Please attach a photo or provide a detailed description."

4.  **Consistency Check**:
    *   Does the Description match the Category? (e.g., Category: "Water Leak", Desc: "Streetlight not working").
    *   **Action**: Warn or REJECT if completely mismatched.

**Output Decision (JSON):**
{
  "isValid": boolean,
  "rejectionReason": "Specific, user-friendly reason if rejected (or null).",
  "priority": "CRITICAL|HIGH|MEDIUM|LOW",
  "confidence": 0.0-1.0,
  "analysis": {
     "gibberishScore": 0.0-1.0, // 1.0 means high probability of gibberish
     "detailLevel": "LOW|MEDIUM|HIGH",
     "categoryMatch": boolean
  },
  "reasoning": "Internal thought process",
  "safetyRisk": "Description of safety concerns",
  "suggestedAction": "Action plan"
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
