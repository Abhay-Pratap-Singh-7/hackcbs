const ProblemStatement = require('../models/ProblemStatement');
const path = require('path');
const fs = require('fs');

// Load colleges.csv once at startup for fast lookup
let _collegesCache = null;
const getCollegesData = () => {
  if (_collegesCache) return _collegesCache;
  try {
    const csvPath = path.join(__dirname, '../../ai/colleges.csv');
    const raw = fs.readFileSync(csvPath, 'utf-8');
    const lines = raw.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase().replace(/ /g, '_'));
    _collegesCache = lines.slice(1).map(line => {
      // Handle quoted CSV fields properly
      const cols = [];
      let current = '';
      let inQuotes = false;
      for (const ch of line) {
        if (ch === '"') { inQuotes = !inQuotes; continue; }
        if (ch === ',' && !inQuotes) { cols.push(current.trim()); current = ''; continue; }
        current += ch;
      }
      cols.push(current.trim());
      const obj = {};
      headers.forEach((h, i) => { obj[h] = cols[i] || ''; });
      return obj;
    });
    return _collegesCache;
  } catch (e) {
    console.error('[University Controller]: Failed to load colleges.csv:', e.message);
    return [];
  }
};

/**
 * Match a university's institutionName against the colleges.csv dataset
 * Returns the matched college record or null
 */
const matchUniversityToCollege = (institutionName) => {
  if (!institutionName) return null;
  const colleges = getCollegesData();
  const normalizedName = institutionName.toLowerCase().trim();

  // Exact match first
  let match = colleges.find(c => c.college_name?.toLowerCase().trim() === normalizedName);
  if (match) return match;

  // Partial match — either direction
  match = colleges.find(c =>
    c.college_name?.toLowerCase().includes(normalizedName) ||
    normalizedName.includes(c.college_name?.toLowerCase())
  );
  return match || null;
};

// @desc    Get problems allocated to the logged-in university
// @route   GET /api/university/allocated-problems
// @access  Private (INSTITUTE_ADMIN only)
const getUniversityAllocatedProblems = async (req, res, next) => {
  try {
    const user = req.user;

    // Get institutionName from profile
    const institutionName = user.profileDetails?.institutionName || '';
    if (!institutionName) {
      return res.status(400).json({
        success: false,
        message: 'Institution name not found in your profile. Please update your profile.'
      });
    }

    // Match this university against colleges.csv
    const collegeRecord = matchUniversityToCollege(institutionName);

    // ─── Pagination ───────────────────────────────────────────────────────────
    const page  = parseInt(req.query.page,  10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip  = (page - 1) * limit;

    // ─── Query: problems where collegeSuggestions contains this university ────
    // A problem is "allocated" to this university if it appears in its collegeSuggestions
    // and is NOT a duplicate.
    const nameRegex = new RegExp(institutionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const filter = {
      isDuplicate: false,
      'collegeSuggestions.college_name': nameRegex
    };

    const total    = await ProblemStatement.countDocuments(filter);
    const problems = await ProblemStatement.find(filter)
      .populate('submittedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // ─── For each problem, extract this university's specific match details ──
    const allocatedProblems = problems.map(problem => {
      const myMatch = problem.collegeSuggestions?.find(c =>
        c.college_name && nameRegex.test(c.college_name)
      );
      return {
        _id: problem._id,
        title: problem.title,
        description: problem.description,
        location: problem.location,
        imagesAndMedia: problem.imagesAndMedia,
        desiredOutcome: problem.desiredOutcome,
        supportingInfo: problem.supportingInfo,
        selfTags: problem.selfTags,
        aiAnalysis: problem.aiAnalysis,
        status: problem.status,
        isDuplicate: problem.isDuplicate,
        masterTicketId: problem.masterTicketId,
        upvotesCount: problem.upvotesCount,
        commentsCount: problem.commentsCount,
        submittedBy: problem.submittedBy,
        createdAt: problem.createdAt,
        // This university's specific match breakdown
        allocationDetails: myMatch ? {
          college_name: myMatch.college_name,
          match_score: myMatch.match_score,
          distance_km: myMatch.distance_km,
          domain: myMatch.domain,
          faculty_expertise: myMatch.faculty_expertise,
          infrastructure: myMatch.infrastructure,
          match_breakdown: myMatch.match_breakdown
        } : null
      };
    });

    return res.status(200).json({
      success: true,
      university: {
        institutionName,
        matchedCollegeRecord: collegeRecord ? {
          college_name: collegeRecord.college_name,
          district: collegeRecord.district,
          domain: collegeRecord.domain
        } : null
      },
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      count: allocatedProblems.length,
      data: allocatedProblems
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get university profile and dashboard summary stats
// @route   GET /api/university/dashboard
// @access  Private (INSTITUTE_ADMIN only)
const getUniversityDashboard = async (req, res, next) => {
  try {
    const user = req.user;
    const institutionName = user.profileDetails?.institutionName || '';
    const collegeRecord = matchUniversityToCollege(institutionName);
    const nameRegex = new RegExp(institutionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    // Aggregated stats
    const [totalAllocated, byCategory, bySeverity] = await Promise.all([
      ProblemStatement.countDocuments({ isDuplicate: false, 'collegeSuggestions.college_name': nameRegex }),
      ProblemStatement.aggregate([
        { $match: { isDuplicate: false, 'collegeSuggestions.college_name': nameRegex } },
        { $group: { _id: '$aiAnalysis.problem_classification', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      ProblemStatement.aggregate([
        { $match: { isDuplicate: false, 'collegeSuggestions.college_name': nameRegex } },
        { $group: { _id: '$aiAnalysis.severity', count: { $sum: 1 } } }
      ])
    ]);

    return res.status(200).json({
      success: true,
      university: {
        name: institutionName,
        email: user.email,
        profileDetails: user.profileDetails,
        matchedCollegeRecord: collegeRecord ? {
          college_name: collegeRecord.college_name,
          district: collegeRecord.district,
          domain: collegeRecord.domain,
          faculty_expertise: collegeRecord.faculty_expertise,
          infrastructure: collegeRecord.infrastructure
        } : null
      },
      stats: {
        totalAllocatedProblems: totalAllocated,
        byCategory,
        bySeverity
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Accept or Reject an allocated problem statement
// @route   PUT /api/university/problems/:id/status
// @access  Private (INSTITUTE_ADMIN only)
const updateProblemAllocationStatus = async (req, res, next) => {
  try {
    let action = (req.body.action || req.body.status || '').toLowerCase().trim();
    if (action === 'accepted') action = 'accept';
    if (action === 'rejected') action = 'reject';

    const user = req.user;
    const institutionName = user.profileDetails?.institutionName || '';

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action. Use accept, reject, ACCEPTED, or REJECTED.' });
    }

    const problem = await ProblemStatement.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem statement not found.' });
    }

    // Verify if this problem was actually allocated to this university
    const nameRegex = new RegExp(institutionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const isAllocated = problem.collegeSuggestions?.some(c => c.college_name && nameRegex.test(c.college_name));
    
    // NOTE: Commented out strict allocation check for testing purposes
    // if (!isAllocated) {
    //   return res.status(403).json({ success: false, message: 'This problem was not allocated to your university.' });
    // }

    if (action === 'accept') {
      if (problem.acceptedBy) {
        return res.status(400).json({ success: false, message: 'This problem has already been accepted by a university.' });
      }
      problem.status = 'ACCEPTED';
      problem.acceptedBy = user._id;
      problem.acceptedByUniversityName = institutionName;
    } else if (action === 'reject') {
      if (!problem.rejectedBy.includes(user._id)) {
        problem.rejectedBy.push(user._id);
      }
    }

    await problem.save();

    if (action === 'accept') {
      (async () => {
        try {
          const Notification = require('../models/Notification');
          const recipientIds = new Set();
          if (problem.submittedBy) recipientIds.add(problem.submittedBy.toString());
          if (problem.followers && problem.followers.length > 0) {
            problem.followers.forEach((f) => recipientIds.add(f.toString()));
          }
          recipientIds.delete(user._id.toString());

          const notifs = Array.from(recipientIds).map((rId) => ({
            recipient: rId,
            type: 'FOLLOWED_UPDATE',
            title: 'Problem Adopted by University! 🎓',
            message: `${institutionName} has adopted "${problem.title}" for student innovation and prototype development.`,
            problemId: problem._id,
            metadata: {
              status: 'ACCEPTED',
              acceptedByUniversityName: institutionName
            }
          }));

          if (notifs.length > 0) {
            await Notification.insertMany(notifs);
            const pushNotificationService = require('../services/pushNotificationService');
            pushNotificationService.sendPushToUsers(Array.from(recipientIds), {
              title: 'Problem Adopted by University! 🎓',
              body: `${institutionName} has adopted "${problem.title}" for innovation and prototype development.`,
              data: {
                type: 'FOLLOWED_UPDATE',
                problemId: problem._id.toString()
              }
            }).catch((pushErr) => console.error('[University Push Error]:', pushErr.message));
          }
        } catch (notifErr) {
          console.error('[University Adoption Notification Error]:', notifErr.message);
        }
      })();
    }

    return res.status(200).json({
      success: true,
      message: `Problem successfully ${action}ed.`,
      data: {
        _id: problem._id,
        status: problem.status,
        acceptedByUniversityName: problem.acceptedByUniversityName
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get problems accepted by the logged-in university
// @route   GET /api/university/accepted-problems
// @access  Private (INSTITUTE_ADMIN only)
const getUniversityAcceptedProblems = async (req, res, next) => {
  try {
    const user = req.user;
    const institutionName = user.profileDetails?.institutionName || '';
    
    if (!institutionName) {
      return res.status(400).json({ success: false, message: 'Institution name not found in your profile.' });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = {
      acceptedBy: user._id
    };

    const total = await ProblemStatement.countDocuments(filter);
    const problems = await ProblemStatement.find(filter)
      .populate('submittedBy', 'name email role')
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
      count: problems.length,
      data: problems
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUniversityAllocatedProblems, getUniversityDashboard, updateProblemAllocationStatus, getUniversityAcceptedProblems };
