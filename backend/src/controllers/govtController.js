const ProblemStatement = require('../models/ProblemStatement');
const Team = require('../models/Team');

// @desc    Get master dashboard of all non-duplicate problems with complete lifecycle tracking
// @route   GET /api/govt/dashboard
// @access  Private (GOVT_OFFICER)
const getGovtDashboard = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // We only care about root problems (not duplicates)
    const query = { isDuplicate: false };

    const total = await ProblemStatement.countDocuments(query);
    const problems = await ProblemStatement.find(query)
      .populate('submittedBy', 'name email role profileDetails.fullName')
      .populate('acceptedBy', 'name email profileDetails.institutionName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Attach tracking details (Teams, Solutions, Industry Allocation) for each problem
    const trackedProblems = await Promise.all(
      problems.map(async (problem) => {
        const teams = await Team.find({ problemStatement: problem._id })
          .populate('university', 'name email profileDetails.institutionName')
          .populate('industryAllocation.industryId', 'name email profileDetails.companyName')
          .lean();

        // Aggregated data for this problem
        const totalTeamsRegistered = teams.length;
        const totalSolutionsSubmitted = teams.filter((t) => t.solution && t.solution.submittedAt).length;

        // Map team details for a complete view
        const teamDetails = teams.map((team) => ({
          teamId: team._id,
          teamName: team.teamName,
          universityName: team.university?.profileDetails?.institutionName || 'Unknown University',
          leaderName: team.leaderName,
          hasSubmittedSolution: !!(team.solution && team.solution.submittedAt),
          solutionDetails: team.solution || null,
          industryAllocation: team.industryAllocation || null
        }));

        return {
          ...problem,
          tracking: {
            isAcceptedByUniversity: !!problem.acceptedBy,
            acceptedByUniversityName: problem.acceptedByUniversityName || null,
            totalTeamsRegistered,
            totalSolutionsSubmitted,
            teams: teamDetails
          }
        };
      })
    );

    return res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      count: trackedProblems.length,
      data: trackedProblems
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getGovtDashboard
};
