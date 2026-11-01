const BASE_URL = process.env.HF_SPACE_URL || 'https://abhay958-teamsetu.hf.space';

/**
 * Executes a Gradio API call using the official 2-step Server-Sent Events (SSE) protocol:
 * Step 1: POST /gradio_api/call/<api_name> with {"data": ["<json_string>"]} -> returns { event_id }
 * Step 2: GET /gradio_api/call/<api_name>/<event_id> -> streams SSE output until completion
 *
 * @param {string} apiName - Name of the Gradio API endpoint (e.g., 'match_colleges', 'analyze_problem')
 * @param {object|string} payload - Payload object or stringified JSON passed in data array
 * @returns {Promise<any>} Parsed response data
 */
const callGradioApi = async (apiName, payload) => {
  const token = process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN;
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const postUrl = `${BASE_URL}/gradio_api/call/${apiName}`;

  // Step 1: Initiate task via POST /gradio_api/call/<api_name>
  const postRes = await fetch(postUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data: [payloadStr] })
  });

  if (!postRes.ok) {
    const errorText = await postRes.text();
    throw new Error(`[HF Gradio ${apiName} Step 1 Error ${postRes.status}]: ${errorText}`);
  }

  const { event_id } = await postRes.json();
  if (!event_id) {
    throw new Error(`[HF Gradio ${apiName}]: Missing event_id in Step 1 response.`);
  }

  // Step 2: Retrieve stream output via GET /gradio_api/call/<api_name>/<event_id>
  const streamUrl = `${BASE_URL}/gradio_api/call/${apiName}/${event_id}`;
  const streamRes = await fetch(streamUrl, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  if (!streamRes.ok) {
    const errorText = await streamRes.text();
    throw new Error(`[HF Gradio ${apiName} Step 2 Error ${streamRes.status}]: ${errorText}`);
  }

  const text = await streamRes.text();
  const lines = text.split('\n');
  let lastData = null;
  let isError = false;
  let errorMsg = '';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('event: error')) {
      isError = true;
    }
    if (line.startsWith('data:')) {
      const dataStr = line.substring(5).trim();
      if (isError) {
        try {
          const errObj = JSON.parse(dataStr);
          errorMsg = errObj.error || errObj.message || dataStr;
        } catch (_) {
          errorMsg = dataStr;
        }
      } else {
        lastData = dataStr;
      }
    }
  }

  if (isError) {
    if (errorMsg.includes('ZeroGPU runs limit')) {
      throw new Error(
        `Hugging Face ZeroGPU quota exceeded. Please configure HF_TOKEN in backend/.env with your Hugging Face access token.`
      );
    }
    throw new Error(errorMsg || `Error returned from Hugging Face Space endpoint ${apiName}`);
  }

  if (!lastData) {
    throw new Error(`[HF Gradio ${apiName}]: No data returned from event stream.`);
  }

  let parsed = JSON.parse(lastData);
  let result = Array.isArray(parsed) ? parsed[0] : parsed;
  if (typeof result === 'string') {
    try {
      result = JSON.parse(result);
    } catch (_) {}
  }

  if (result && result.success === false) {
    throw new Error(result.error || `Error in ${apiName} response.`);
  }

  return result && result.data !== undefined ? result.data : result;
};

/**
 * API 1: Problem Analyzer (Groq AI)
 * Endpoint: POST /gradio_api/call/analyze_problem
 *
 * @param {string} description - Problem description text
 * @returns {Promise<object>} Groq structured analysis (summary, key_points, problem_classification, severity, suggested_solution, required_expertise)
 */
const runProblemAnalysis = async (description) => {
  return await callGradioApi('analyze_problem', { description });
};

/**
 * API 2: Deduplication Checker (Multilingual-E5-Large + FAISS)
 * Endpoint: POST /gradio_api/call/check_duplicate
 *
 * @param {object} problem - Target problem object or aiAnalysis
 * @param {object} location - GPS location coordinates ({ latitude, longitude, district })
 * @param {Array} candidates - Candidate problem documents
 * @param {number} maxDistanceKm - Maximum geographic distance radius in km (default 10.0)
 * @param {number} similarityThreshold - Cosine similarity cutoff (default 0.88)
 * @returns {Promise<{deduplication: object, embedding: Array<number>}>}
 */
const runDeduplication = async (
  problem,
  location = {},
  candidates = [],
  maxDistanceKm = 10.0,
  similarityThreshold = 0.88
) => {
  return await callGradioApi('check_duplicate', {
    problem,
    location,
    candidates,
    maxDistanceKm: Number(maxDistanceKm || 10.0),
    similarityThreshold: Number(similarityThreshold || 0.88)
  });
};

/**
 * API 3: College Matcher Engine
 * Endpoint: POST /gradio_api/call/match_colleges
 *
 * @param {object} problemData - Problem document or aiAnalysis
 * @param {object} locationData - GPS location coordinates ({ latitude, longitude, district })
 * @param {number} topK - Number of colleges to match (default 5)
 * @returns {Promise<Array<object>>} Top-K ranked colleges with match breakdown
 */
const runCollegeMatchingPipeline = async (problemData = {}, locationData = {}, topK = 5) => {
  const analysis = problemData.aiAnalysis || problemData;
  const payload = {
    aiAnalysis: {
      summary: analysis.summary || problemData.description || problemData.title || '',
      problem_classification: analysis.problem_classification || problemData.category || 'water resources',
      required_expertise: Array.isArray(analysis.required_expertise) ? analysis.required_expertise : ['Civil Engineering']
    },
    location: {
      latitude: Number(locationData.latitude ?? locationData.lat ?? locationData.coordinates?.latitude ?? 23.3441),
      longitude: Number(locationData.longitude ?? locationData.lng ?? locationData.coordinates?.longitude ?? 85.3096),
      district: locationData.district || 'Ranchi'
    },
    top_k: Number(topK || 5),
    topKColleges: Number(topK || 5)
  };

  return await callGradioApi('match_colleges', payload);
};

/**
 * API 4: Company / Industry Matcher
 * Endpoint: POST /gradio_api/call/match_companies
 *
 * @param {object} problemData - Problem document or aiAnalysis
 * @param {object} locationData - GPS location coordinates
 * @param {Array} candidateCompanies - List of companies from DB
 * @param {number} topK - Number of companies to match (default 5)
 * @returns {Promise<Array<object>>} Top-K ranked companies
 */
const runCompanyMatchingPipeline = async (problemData = {}, locationData = {}, candidateCompanies = [], topK = 5) => {
  const analysis = problemData.aiAnalysis || problemData;
  const payload = {
    aiAnalysis: analysis,
    location: {
      latitude: Number(locationData.latitude ?? locationData.lat ?? locationData.coordinates?.latitude ?? 23.3441),
      longitude: Number(locationData.longitude ?? locationData.lng ?? locationData.coordinates?.longitude ?? 85.3096),
      district: locationData.district || 'Ranchi'
    },
    candidates: candidateCompanies,
    candidateCompanies: candidateCompanies,
    top_k: Number(topK || 5),
    topKCompanies: Number(topK || 5)
  };

  return await callGradioApi('match_companies', payload);
};

/**
 * API 5: Composite Full Pipeline (Analyze + Dedup + College Match + Company Match)
 * Endpoint: POST /gradio_api/call/analyze
 *
 * @param {string} description - Problem description
 * @param {object} location - Location coordinates
 * @param {object} selfTags - Optional tags
 * @param {Array} candidates - Candidate problem docs
 * @param {object} options - Optional distance and top-k limits
 * @returns {Promise<{aiAnalysis, embedding, deduplication, matchedColleges, matchedCompanies}>}
 */
const runAIPipeline = async (description, location = {}, selfTags = {}, candidates = [], options = {}) => {
  const payload = {
    description,
    location,
    selfTags,
    candidates,
    maxDistanceKm: Number(options.maxDistanceKm || 10.0),
    similarityThreshold: Number(options.similarityThreshold || 0.88),
    topKColleges: Number(options.topKColleges || 5),
    topKCompanies: Number(options.topKCompanies || 5)
  };

  return await callGradioApi('analyze', payload);
};

module.exports = {
  callGradioApi,
  runProblemAnalysis,
  runDeduplication,
  runCollegeMatchingPipeline,
  runCompanyMatchingPipeline,
  runAIPipeline
};
