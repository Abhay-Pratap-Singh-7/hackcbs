const { Client } = require("@gradio/client");

/**
 * Runs the AI pipeline via the remote Hugging Face Gradio Space.
 *
 * @param {string} description       - Problem description text
 * @param {object} location          - Location object (with coordinates)
 * @param {object} selfTags          - Self-tags / keywords
 * @param {Array}  candidates        - Existing MongoDB problem docs for dedup check
 * @returns {Promise<{aiAnalysis, embedding, deduplication}>}
 */
const runAIPipeline = async (description, location = {}, selfTags = {}, candidates = []) => {
  try {
    const connectOptions = process.env.HF_TOKEN ? { hf_token: process.env.HF_TOKEN } : {};
    const client = await Client.connect("abhay958/TeamSetu", connectOptions);
    
    const payload = JSON.stringify({
      description,
      location,
      selfTags,
      candidates,
      maxDistanceKm: 10.0,
      similarityThreshold: 0.88
    });

    const result = await client.predict("/analyze", [payload]);
    
    // Gradio returns an array of outputs. The first output is our JSON string.
    const parsed = JSON.parse(result.data[0]);
    
    if (!parsed.success) {
      throw new Error(parsed.error || "Unknown error from Hugging Face AI pipeline.");
    }
    
    return parsed.data;
  } catch (err) {
    console.error("[Hugging Face AI Pipeline Error]:", err.message);
    throw err;
  }
};

/**
 * Runs the Industry/Company Matching pipeline via Hugging Face Gradio Space.
 *
 * @param {object} problemData        - Problem statement document or AI analysis object
 * @param {object} locationData       - Location coordinates object
 * @param {Array}  candidateCompanies - MongoDB registered companies list
 * @param {number} topK               - Number of matches to return (default 5)
 * @returns {Promise<Array>}
 */
const runCompanyMatchingPipeline = async (problemData, locationData = {}, candidateCompanies = [], topK = 5) => {
  try {
    const connectOptions = process.env.HF_TOKEN ? { hf_token: process.env.HF_TOKEN } : {};
    const client = await Client.connect("abhay958/TeamSetu", connectOptions);

    const payload = JSON.stringify({
      problem: problemData,
      aiAnalysis: problemData.aiAnalysis || problemData,
      location: locationData,
      candidates: candidateCompanies,
      topKCompanies: topK,
      top_k: topK
    });

    const result = await client.predict("/match_companies", [payload]);
    const parsed = JSON.parse(result.data[0]);

    if (!parsed.success) {
      throw new Error(parsed.error || "Unknown error from Hugging Face Company Matcher pipeline.");
    }

    return parsed.data;
  } catch (err) {
    console.error("[Hugging Face Company Matcher Error]:", err.message);
    throw err;
  }
};

/**
 * Runs the College Matching pipeline via Hugging Face Gradio Space.
 */
const runCollegeMatchingPipeline = async (problemData, locationData = {}, topK = 5) => {
  try {
    const connectOptions = process.env.HF_TOKEN ? { hf_token: process.env.HF_TOKEN } : {};
    const client = await Client.connect("abhay958/TeamSetu", connectOptions);

    const payload = JSON.stringify({
      problem: problemData,
      aiAnalysis: problemData.aiAnalysis || problemData,
      location: locationData,
      topKColleges: topK,
      top_k: topK
    });

    const result = await client.predict("/match_colleges", [payload]);
    const parsed = JSON.parse(result.data[0]);

    if (!parsed.success) {
      throw new Error(parsed.error || "Unknown error from Hugging Face College Matcher pipeline.");
    }

    return parsed.data;
  } catch (err) {
    console.error("[Hugging Face College Matcher Error]:", err.message);
    throw err;
  }
};

module.exports = {
  runAIPipeline,
  runCompanyMatchingPipeline,
  runCollegeMatchingPipeline
};

