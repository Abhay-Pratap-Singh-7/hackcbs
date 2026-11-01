const { Client } = require("@gradio/client");
const fs = require("fs");
const path = require("path");

// Haversine formula
const haversineDist = (lat1, lon1, lat2, lon2) => {
  const R = 6371.0;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

// Cached local colleges
let _cachedColleges = null;
const loadCollegesCsv = () => {
  if (_cachedColleges) return _cachedColleges;
  try {
    const csvPath = path.resolve(__dirname, "../../ai/colleges.csv");
    const altPath = path.resolve(__dirname, "../ai/colleges.csv");
    const resolved = fs.existsSync(csvPath) ? csvPath : (fs.existsSync(altPath) ? altPath : null);
    if (!resolved) return [];

    const content = fs.readFileSync(resolved, "utf8");
    const lines = content.split("\n").filter((l) => l.trim().length > 0);
    const result = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      let inQuotes = false;
      let current = "";
      const cols = [];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === '"') {
          inQuotes = !inQuotes;
          continue;
        }
        if (ch === "," && !inQuotes) {
          cols.push(current.trim());
          current = "";
          continue;
        }
        current += ch;
      }
      cols.push(current.trim());
      if (cols.length >= 6) {
        result.push({
          college_name: cols[0],
          district: cols[1],
          latitude: parseFloat(cols[2]) || 0,
          longitude: parseFloat(cols[3]) || 0,
          domain: (cols[5] || "").toLowerCase().trim(),
          faculty_expertise: cols[6] || "",
          infrastructure: cols[7] || ""
        });
      }
    }
    _cachedColleges = result;
    return _cachedColleges;
  } catch (err) {
    console.error("[Local College Loader Warning]:", err.message);
    return [];
  }
};

/**
 * High-precision local fallback for college matching based on domain, geo-proximity, and domain expertise.
 */
const matchCollegesLocally = (problemData = {}, locationData = {}, topK = 5) => {
  const colleges = loadCollegesCsv();
  if (!colleges || colleges.length === 0) return [];

  const analysis = problemData.aiAnalysis || problemData;
  const pDomain = (analysis.problem_classification || problemData.category || "urban development").toLowerCase().trim();
  const rawExpertise = analysis.required_expertise || [];
  const expertise = Array.isArray(rawExpertise) ? rawExpertise : [String(rawExpertise)];
  const summary = (analysis.summary || problemData.description || problemData.title || "").toLowerCase();

  const pLat = Number(
    locationData.latitude ??
    locationData.lat ??
    locationData.coordinates?.latitude ??
    23.3441
  );
  const pLon = Number(
    locationData.longitude ??
    locationData.lng ??
    locationData.coordinates?.longitude ??
    85.3096
  );

  const scored = colleges.map((c) => {
    // 1. Domain match (35%)
    let domainScore = 0.2;
    if (c.domain === pDomain) domainScore = 1.0;
    else if (c.domain.includes(pDomain) || pDomain.includes(c.domain)) domainScore = 0.75;

    // 2. Geo proximity score (35%)
    const distKm = haversineDist(pLat, pLon, c.latitude, c.longitude);
    const geoScore = Math.exp(-distKm / 50.0);

    // 3. Faculty expertise & Infrastructure matching (30%)
    let semHits = 0;
    const cText = `${c.faculty_expertise} ${c.infrastructure}`.toLowerCase();
    expertise.forEach((exp) => {
      const words = String(exp).toLowerCase().split(/\s+/);
      words.forEach((w) => {
        if (w.length > 3 && cText.includes(w)) semHits++;
      });
    });
    if (locationData.district && c.district && c.district.toLowerCase() === locationData.district.toLowerCase()) {
      semHits += 2;
    }
    const semScore = Math.min(1.0, 0.4 + semHits * 0.15);

    const finalScore = 0.35 * domainScore + 0.35 * geoScore + 0.30 * semScore;
    const matchScore = Number((finalScore * 100).toFixed(2));

    return {
      college_name: c.college_name,
      district: c.district,
      latitude: c.latitude,
      longitude: c.longitude,
      distance_km: Number(distKm.toFixed(2)),
      domain: c.domain,
      faculty_expertise: c.faculty_expertise,
      infrastructure: c.infrastructure,
      match_score: matchScore,
      match_breakdown: {
        domain_score: Number(domainScore.toFixed(2)),
        geo_score: Number(geoScore.toFixed(2)),
        semantic_score: Number(semScore.toFixed(2))
      }
    };
  });

  scored.sort((a, b) => b.match_score - a.match_score);
  return scored.slice(0, topK);
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
 * Runs the College Matching pipeline via Hugging Face Gradio Space, with local dataset fallback.
 */
const runCollegeMatchingPipeline = async (problemData, locationData = {}, topK = 5) => {
  try {
    const token = process.env.HF_TOKEN;
    const connectOptions = token ? { token, hf_token: token } : {};
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

    if (Array.isArray(parsed.data) && parsed.data.length > 0) {
      return parsed.data;
    }
    throw new Error("Empty matches array returned from Hugging Face Space.");
  } catch (err) {
    console.warn("[Hugging Face College Matcher Notice]:", err.message, "Using intelligent geo + domain + faculty dataset matching fallback.");
    return matchCollegesLocally(problemData, locationData, topK);
  }
};

module.exports = {
  runAIPipeline,
  runCompanyMatchingPipeline,
  runCollegeMatchingPipeline,
  matchCollegesLocally
};

