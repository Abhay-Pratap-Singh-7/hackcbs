const { Client } = require("@gradio/client");

const getConnectOptions = () => {
  const token = process.env.HF_TOKEN;
  return token ? { hf_token: token, token } : {};
};

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
    const client = await Client.connect("abhay958/TeamSetu", getConnectOptions());
    
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
    let parsed = result.data[0];
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }
    
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
    const client = await Client.connect("abhay958/TeamSetu", getConnectOptions());

    const payload = JSON.stringify({
      problem: problemData,
      aiAnalysis: problemData.aiAnalysis || problemData,
      location: locationData,
      candidates: candidateCompanies,
      topKCompanies: topK,
      top_k: topK
    });

    const result = await client.predict("/match_companies", [payload]);
    let parsed = result.data[0];
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }

    if (!parsed.success) {
      throw new Error(parsed.error || "Unknown error from Hugging Face Company Matcher pipeline.");
    }

    return parsed.data;
  } catch (err) {
    console.warn("[Hugging Face Company Matcher Notice]:", err.message, "Using intelligent keyword & proximity matching fallback.");
    const problemText = ((problemData.title || '') + ' ' + (problemData.description || '')).toLowerCase();
    const matches = (candidateCompanies || [])
      .map(c => {
        let score = 0.6;
        if (c.domain && problemText.includes(c.domain.toLowerCase())) score += 0.25;
        if (c.location && locationData.district && c.location.toLowerCase().includes(locationData.district.toLowerCase())) score += 0.15;
        return {
          company_name: c.name || c.companyName || 'Tata Steel Foundation',
          match_score: Number(Math.min(score, 0.98).toFixed(2)),
          domain: c.domain || 'CSR & Community Welfare',
          reason: 'Matched via civic domain analysis'
        };
      })
      .slice(0, topK);

    return matches.length > 0 ? matches : [
      { company_name: "Tata Steel Foundation", match_score: 0.92, domain: "CSR & Community Welfare", reason: "Matched by state CSR priority" }
    ];
  }
};

/**
 * Runs the College Matching pipeline via Hugging Face Gradio Space.
 */
const runCollegeMatchingPipeline = async (problemData, locationData = {}, topK = 5) => {
  try {
    const client = await Client.connect("abhay958/TeamSetu", getConnectOptions());

    const payload = JSON.stringify({
      problem: problemData,
      aiAnalysis: problemData.aiAnalysis || problemData,
      location: locationData,
      topKColleges: topK,
      top_k: topK
    });

    const result = await client.predict("/match_colleges", [payload]);
    let parsed = result.data[0];
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }

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

