// Dashboard Controller for role-based dashboard redirection and data access

const getDashboardData = async (req, res, next) => {
  try {
    const user = req.user;

    const roleDashboards = {
      INDIVIDUAL_CITIZEN: {
        title: 'Individual Citizen Dashboard',
        metrics: { activeRequests: 2, submittedIdeas: 1, communityRank: 42 }
      },
      NGO_COMMUNITY: {
        title: 'NGO & Community Dashboard',
        metrics: { activeProjects: 5, volunteersEnrolled: 120, totalGrantsSanctioned: '₹ 4,50,000' }
      },
      LOCAL_BODY: {
        title: 'Local Body (PRI / ULB) Dashboard',
        metrics: { wardCount: 15, activeSchemes: 8, resolutionRate: '94%' }
      },
      GOVT_OFFICER: {
        title: 'Government Officer Dashboard',
        metrics: { pendingApprovals: 14, department: user.profileDetails?.departmentMinistry || 'Govt Department', verifiedInspects: 38 }
      },
      INSTITUTE_ADMIN: {
        title: 'University & Institute Admin Dashboard',
        metrics: { registeredFaculties: 45, studentInnovators: 380, patentSubmissions: 6 }
      },
      FACULTY_MENTOR: {
        title: 'Faculty Mentor Dashboard',
        metrics: { mentoredTeams: 4, publishedPapers: 12, activeHackCBSProjects: 3 }
      },
      STUDENT_INNOVATOR: {
        title: 'Student & Innovator Portal',
        metrics: { hackathonsJoined: 3, pendingSubmissions: 1, teamMembers: 5 }
      },
      INDUSTRY_PARTNER: {
        title: 'Industry Partner & CSR Sponsor Dashboard',
        metrics: { sponsoredProjects: 8, totalCSRInvested: '₹ 25,000,000', openProblemStatements: 4 }
      }
    };

    const dashboard = roleDashboards[user.role] || {
      title: 'General Dashboard',
      metrics: {}
    };

    return res.status(200).json({
      success: true,
      message: `Welcome to the ${dashboard.title}`,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          profileDetails: user.profileDetails
        },
        dashboard: dashboard
      }
    });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = req.user;
    const { avatar } = req.body;

    if (avatar !== undefined) {
      user.avatar = avatar;
    }
    
    // Allow updating other profileDetails if passed
    if (req.body.profileDetails) {
      user.profileDetails = { ...user.profileDetails, ...req.body.profileDetails };
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          profileDetails: user.profileDetails
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardData,
  updateProfile
};
