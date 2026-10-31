const axios = require('axios');
const { exec } = require('child_process');
const path = require('path');

// System prompt matching ai/prompts.py
const SYSTEM_PROMPT = `
You are an AI problem analysis system for a citizen problem-solving platform focused on identifying and analyzing real-world community problems.

Your task is to analyze the citizen's problem description and produce a structured JSON analysis.

You MUST perform all of the following tasks:
1. Create a concise but meaningful summary of the problem.
2. Identify the key points of the problem.
3. Classify the problem into EXACTLY ONE of the allowed categories:
   - education
   - healthcare
   - agriculture
   - water resources
   - environment
   - energy
   - urban development
   - accessibility
   - public administration
   - livelihood
4. Assess the severity of the problem (low, medium, high, critical).
5. Suggest practical and realistic potential solutions.
6. Identify the academic/technical expertise required to address the problem (e.g., Water Resources, Civil Engineering, Public Health, Environmental Science, Computer Science, Urban Planning).

Return ONLY a valid JSON object matching this structure:
{
  "summary": "Concise summary",
  "key_points": "Key points describing impact",
  "problem_classification": "water resources",
  "severity": "high",
  "suggested_solution": "Practical solutions",
  "required_expertise": ["Civil Engineering", "Water Resources"]
}
`;

/**
 * Analyze Problem Statement using Groq AI API (model: openai/gpt-oss-120b)
 * @param {string} problemDescription
 * @returns {Promise<Object>} Structured AI Analysis
 */
const analyzeProblemWithGroq = async (problemDescription) => {
  const apiKey = process.env.GROQ_API_KEY || '';

  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    console.warn('[AI Service Warning]: GROQ_API_KEY is missing. Returning default classification.');
    return getDefaultAnalysis(problemDescription);
  }

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Analyze the following citizen problem:\n\n--- START PROBLEM ---\n${problemDescription}\n--- END PROBLEM ---`
          }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      }
    );

    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Groq AI returned an empty response.');
    }

    const parsed = JSON.parse(content);

    const analysis = {
      summary: parsed.summary || problemDescription.substring(0, 100) + '...',
      key_points: parsed.key_points || 'Citizen reported community issue requiring government/university intervention.',
      problem_classification: (parsed.problem_classification || 'urban development').toLowerCase(),
      severity: (parsed.severity || 'medium').toLowerCase(),
      suggested_solution: parsed.suggested_solution || 'Field inspection by technical domain team and stakeholder action plan.',
      required_expertise: Array.isArray(parsed.required_expertise) ? parsed.required_expertise : ['Civil Engineering'],
      analyzedAt: new Date()
    };

    console.log(`[Groq AI Classification Success]: Category = "${analysis.problem_classification}", Severity = "${analysis.severity}"`);
    return analysis;
  } catch (error) {
    console.error('[Groq AI Error]:', error.response ? JSON.stringify(error.response.data) : error.message);
    return getDefaultAnalysis(problemDescription);
  }
};

// Default fallback analysis if Groq API call fails
const getDefaultAnalysis = (problemDescription) => {
  const text = problemDescription.toLowerCase();
  let category = 'urban development';
  let severity = 'medium';

  if (text.includes('water') || text.includes('drain') || text.includes('sewage') || text.includes('tds')) {
    category = 'water resources';
  } else if (text.includes('health') || text.includes('hospital') || text.includes('doctor') || text.includes('disease')) {
    category = 'healthcare';
  } else if (text.includes('crop') || text.includes('farmer') || text.includes('soil') || text.includes('agri')) {
    category = 'agriculture';
  } else if (text.includes('school') || text.includes('student') || text.includes('teacher') || text.includes('education')) {
    category = 'education';
  } else if (text.includes('power') || text.includes('light') || text.includes('solar') || text.includes('electricity')) {
    category = 'energy';
  }

  if (text.includes('severe') || text.includes('danger') || text.includes('emergency') || text.includes('die')) {
    severity = 'high';
  }

  return {
    summary: problemDescription.length > 100 ? problemDescription.substring(0, 97) + '...' : problemDescription,
    key_points: 'Community reported issue requiring technical assessment.',
    problem_classification: category,
    severity: severity,
    suggested_solution: 'Deployment of regional university student/faculty team for site audit.',
    required_expertise: ['Domain Expert', 'Civil Engineering'],
    analyzedAt: new Date()
  };
};

module.exports = {
  analyzeProblemWithGroq
};
