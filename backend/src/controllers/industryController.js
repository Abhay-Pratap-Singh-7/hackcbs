const Team = require('../models/Team');

// @desc    Get all solutions allocated to the logged-in industry (PENDING)
// @route   GET /api/industry/allocated-solutions
// @access  Private (INDUSTRY_PARTNER)
const getAllocatedSolutions = async (req, res, next) => {
  try {
    const user = req.user;

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {
      'industryAllocation.industryId': user._id,
      'industryAllocation.status': 'PENDING'
    };

    const total = await Team.countDocuments(query);
    const teams = await Team.find(query)
      .populate('university', 'name email profileDetails.institutionName')
      .populate('problemStatement', 'title description aiAnalysis location')
      .sort({ 'solution.submittedAt': -1 })
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

// @desc    Accept or reject a team's solution
// @route   PUT /api/industry/solutions/:teamId/status
// @access  Private (INDUSTRY_PARTNER)
const updateSolutionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const user = req.user;

    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be ACCEPTED or REJECTED' });
    }

    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (String(team.industryAllocation?.industryId) !== String(user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this solution.' });
    }

    team.industryAllocation.status = status;
    await team.save();

    return res.status(200).json({
      success: true,
      message: `Solution successfully ${status.toLowerCase()}.`,
      data: team
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all ACCEPTED solutions for the logged-in industry
// @route   GET /api/industry/accepted-solutions
// @access  Private (INDUSTRY_PARTNER)
const getAcceptedSolutions = async (req, res, next) => {
  try {
    const user = req.user;

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {
      'industryAllocation.industryId': user._id,
      'industryAllocation.status': 'ACCEPTED'
    };

    const total = await Team.countDocuments(query);
    const teams = await Team.find(query)
      .populate('university', 'name email profileDetails.institutionName')
      .populate('problemStatement', 'title description aiAnalysis location')
      .sort({ updatedAt: -1 })
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

module.exports = {
  getAllocatedSolutions,
  updateSolutionStatus,
  getAcceptedSolutions
};
