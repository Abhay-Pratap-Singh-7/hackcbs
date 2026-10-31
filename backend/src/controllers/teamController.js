const Team = require('../models/Team');
const ProblemStatement = require('../models/ProblemStatement');
const Company = require('../models/Company');
const { User, ROLES } = require('../models/User');
const { validateTeamRegistration, validateSolutionSubmission } = require('../validations/teamValidation');
const { runCompanyMatchingPipeline } = require('../services/pythonAiService');

// @desc    Register a new team for an accepted problem
// @route   POST /api/university/teams
// @access  Private (INSTITUTE_ADMIN)
const registerTeam = async (req, res, next) => {
  try {
    const { error } = validateTeamRegistration(req.body);
    if (error) {
      const messages = error.details.map((d) => d.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }

    const { problemStatementId, teamName, leaderName, leaderGender, mentorName, members } = req.body;
    const user = req.user;

    // Check if team name already exists
    const existingTeam = await Team.findOne({ teamName: new RegExp(`^${teamName}$`, 'i') });
    if (existingTeam) {
      return res.status(400).json({ success: false, message: 'Team name already exists. Please choose a different name.' });
    }

    // Check if the problem statement exists and is accepted by this university
    const problem = await ProblemStatement.findById(problemStatementId);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem statement not found.' });
    }

    if (problem.status !== 'ACCEPTED' || String(problem.acceptedBy) !== String(user._id)) {
      return res.status(403).json({ success: false, message: 'You can only register teams for problems that your university has accepted.' });
    }

    // Create the team
    const team = await Team.create({
      university: user._id,
      problemStatement: problemStatementId,
      teamName,
      leaderName,
      leaderGender,
      mentorName,
      members
    });

    return res.status(201).json({
      success: true,
      message: 'Team registered successfully.',
      data: team
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all teams registered under the university
// @route   GET /api/university/teams
// @access  Private (INSTITUTE_ADMIN)
const getUniversityTeams = async (req, res, next) => {
  try {
    const user = req.user;

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await Team.countDocuments({ university: user._id });
    const teams = await Team.find({ university: user._id })
      .populate('problemStatement', 'title aiAnalysis location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      count: teams.length,
      data: teams
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit a solution for a specific team
// @route   POST /api/university/teams/:id/solution
// @access  Private (INSTITUTE_ADMIN)
const submitSolution = async (req, res, next) => {
  try {
    const { error } = validateSolutionSubmission(req.body);
    if (error) {
      const messages = error.details.map((d) => d.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }

    const { docxLink, demoVideoLink, prototypeLink, description } = req.body;
    const user = req.user;

    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    if (String(team.university) !== String(user._id)) {
      return res.status(403).json({ success: false, message: 'You can only submit solutions for teams registered under your university.' });
    }

    team.solution = {
      docxLink,
      demoVideoLink,
      prototypeLink,
      description,
      submittedAt: new Date()
    };

    // --- Industry Allocation (4th ML Model) ---
    const problem = await ProblemStatement.findById(team.problemStatement);
    if (problem) {
      // Fetch candidate companies from Company collection
      let candidateCompanies = [];
      try {
        candidateCompanies = await Company.find({ isVerified: true }).select('name domain expertise location isVerified').lean();
      } catch (dbErr) {
        console.warn('[DB Warning]: Could not fetch candidate companies.', dbErr.message);
      }

      // Run Hugging Face model
      try {
        const matchedCompanies = await runCompanyMatchingPipeline(
          problem.aiAnalysis || { description: problem.description },
          problem.location,
          candidateCompanies,
          1 // topK = 1
        );

        if (matchedCompanies && matchedCompanies.length > 0) {
          const topCompany = matchedCompanies[0];
          
          // Try to find the registered INDUSTRY_PARTNER user in the database
          const industryUser = await User.findOne({
            role: ROLES.INDUSTRY_PARTNER,
            'profileDetails.companyName': new RegExp(`^${topCompany.company_name}$`, 'i')
          });

          team.industryAllocation = {
            companyName: topCompany.company_name,
            industryId: industryUser ? industryUser._id : null,
            status: 'PENDING'
          };
        }
      } catch (aiErr) {
        console.error('[Industry Matching Error]:', aiErr.message);
      }
    }

    await team.save();

    // Optionally update the problem status to IN_PROGRESS
    if (problem && problem.status === 'ACCEPTED') {
      problem.status = 'IN_PROGRESS';
      await problem.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Solution submitted and industry allocated successfully.',
      data: team
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerTeam,
  getUniversityTeams,
  submitSolution
};
