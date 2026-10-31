import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
  GraduationCap,
  Building2,
  CheckCircle,
  XCircle,
  Users,
  Send,
  FileText,
  Sparkles,
  MapPin,
  Plus,
  Trash2,
  Award,
  Video,
  ExternalLink,
  AlertTriangle,
  FolderPlus,
  Check,
  ImageOff,
  Eye,
  Briefcase
} from 'lucide-react';

const CardEvidenceImage = ({ url }: { url?: string }) => {
  const [hasError, setHasError] = useState(false);
  const isValidUrl = url && typeof url === 'string' && url.trim().length > 0 && !url.includes('placeholder.com') && !url.includes('via.placeholder');

  if (!isValidUrl || hasError) {
    return (
      <div className="w-full h-full bg-[#ede8d8] flex flex-col items-center justify-center text-[#7d8c7c] text-xs font-semibold gap-1 select-none">
        <ImageOff size={20} className="text-[#a4b3a4]" />
        <span>No Evidence Attached</span>
      </div>
    );
  }

  return (
    <img 
      src={url} 
      alt="Evidence" 
      className="w-full h-full object-cover" 
      onError={() => setHasError(true)}
    />
  );
};

const UniversityDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'incoming' | 'setup' | 'ongoing'>('incoming');
  
  // Dashboard Summary State
  const [summaryData, setSummaryData] = useState<any>(null);

  // Tab 1: Incoming Allocated Problems
  const [allocatedProblems, setAllocatedProblems] = useState<any[]>([]);
  const [allocatedLoading, setAllocatedLoading] = useState(true);

  // Tab 2: Accepted Problems (Setup & Team Formation)
  const [acceptedProblems, setAcceptedProblems] = useState<any[]>([]);
  const [acceptedLoading, setAcceptedLoading] = useState(true);

  // Tab 3: Registered Teams (Ongoing Problems & Solution Submission)
  const [teams, setTeams] = useState<any[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);

  // Action status message
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Modal State: View Problem Details
  const [viewingProblemDetails, setViewingProblemDetails] = useState<any | null>(null);

  // Modal State: Team Formation
  const [selectedProblemForTeam, setSelectedProblemForTeam] = useState<any | null>(null);
  const [teamForm, setTeamForm] = useState({
    teamName: '',
    leaderName: '',
    leaderGender: 'Male',
    mentorName: '',
    members: [
      { name: '', gender: 'Male' },
      { name: '', gender: 'Female' },
      { name: '', gender: 'Male' }
    ]
  });
  const [submittingTeam, setSubmittingTeam] = useState(false);
  const [teamFormError, setTeamFormError] = useState('');

  // Modal State: Solution Submission
  const [selectedTeamForSolution, setSelectedTeamForSolution] = useState<any | null>(null);
  const [solutionForm, setSolutionForm] = useState({
    docxLink: '',
    demoVideoLink: '',
    prototypeLink: '',
    description: ''
  });
  const [submittingSolution, setSubmittingSolution] = useState(false);
  const [solutionFormError, setSolutionFormError] = useState('');

  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setUser(u);
      } catch (e) {
        console.error(e);
      }
    }

    fetchSummary(token);
    fetchAllocatedProblems(token);
    fetchAcceptedProblems(token);
    fetchTeams(token);
  }, [navigate]);

  const fetchSummary = async (token: string) => {
    try {
      const res = await fetch('https://sih-26-jarr.onrender.com/api/university/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSummaryData(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAllocatedProblems = async (token: string) => {
    setAllocatedLoading(true);
    try {
      const res = await fetch('https://sih-26-jarr.onrender.com/api/university/allocated-problems?limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAllocatedProblems(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAllocatedLoading(false);
    }
  };

  const fetchAcceptedProblems = async (token: string) => {
    setAcceptedLoading(true);
    try {
      const res = await fetch('https://sih-26-jarr.onrender.com/api/university/accepted-problems?limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAcceptedProblems(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAcceptedLoading(false);
    }
  };

  const fetchTeams = async (token: string) => {
    setTeamsLoading(true);
    try {
      const res = await fetch('https://sih-26-jarr.onrender.com/api/university/teams?limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTeams(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTeamsLoading(false);
    }
  };

  // Handle Accept / Reject
  const handleProblemDecision = async (problemId: string, action: 'accept' | 'reject') => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // Optimistic UI updates
    const targetProblem = allocatedProblems.find(p => p._id === problemId);
    setAllocatedProblems(prev => prev.filter(p => p._id !== problemId));
    if (action === 'accept' && targetProblem) {
      setAcceptedProblems(prev => [{ ...targetProblem, status: 'ACCEPTED', acceptedBy: user?._id || user?.id, acceptedByUniversityName: institutionName }, ...prev]);
    }

    if (viewingProblemDetails?._id === problemId) {
      setViewingProblemDetails(null);
    }

    try {
      const res = await fetch(`https://sih-26-jarr.onrender.com/api/university/problems/${problemId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Failed to ${action} problem`);

      showNotification(`Problem successfully ${action === 'accept' ? 'accepted for R&D' : 'declined'}.`);
      
      // Refresh lists
      fetchAllocatedProblems(token);
      fetchAcceptedProblems(token);
      fetchSummary(token);

      if (action === 'accept') {
        setActiveTab('setup');
      }
    } catch (err: any) {
      showNotification(err.message || 'An error occurred', 'error');
      fetchAllocatedProblems(token);
      fetchAcceptedProblems(token);
    }
  };

  // Handle Team Formation Form
  const handleAddMember = () => {
    if (teamForm.members.length >= 5) {
      setTeamFormError('Maximum 5 team members allowed in addition to team leader (Total 6).');
      return;
    }
    setTeamForm(prev => ({
      ...prev,
      members: [...prev.members, { name: '', gender: 'Male' }]
    }));
  };

  const handleRemoveMember = (idx: number) => {
    setTeamForm(prev => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== idx)
    }));
  };

  const handleMemberChange = (idx: number, field: 'name' | 'gender', val: string) => {
    setTeamForm(prev => {
      const newMembers = [...prev.members];
      newMembers[idx] = { ...newMembers[idx], [field]: val };
      return { ...prev, members: newMembers };
    });
    setTeamFormError('');
  };

  const handleSubmitTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeamFormError('');

    if (!selectedProblemForTeam) return;

    // Validate Team Rules:
    // Total members (Leader + Members) must be between 4 and 6
    const totalMembers = 1 + teamForm.members.length;
    if (totalMembers < 4 || totalMembers > 6) {
      setTeamFormError(`Team size must be between 4 and 6 members (Current: ${totalMembers}).`);
      return;
    }

    // Must have at least 1 female
    const allGenders = [teamForm.leaderGender, ...teamForm.members.map(m => m.gender)];
    const hasFemale = allGenders.some(g => g.toLowerCase() === 'female');
    if (!hasFemale) {
      setTeamFormError('Team diversity policy requires at least one female team member.');
      return;
    }

    // Valid names
    if (!teamForm.leaderName.trim() || !teamForm.mentorName.trim() || !teamForm.teamName.trim()) {
      setTeamFormError('Please fill in team name, mentor name, and leader name.');
      return;
    }

    const hasEmptyMemberName = teamForm.members.some(m => !m.name.trim());
    if (hasEmptyMemberName) {
      setTeamFormError('Please fill in names for all team members.');
      return;
    }

    setSubmittingTeam(true);
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const pId = selectedProblemForTeam._id;
      const payload = {
        problemStatementId: pId,
        teamName: teamForm.teamName.trim(),
        leaderName: teamForm.leaderName.trim(),
        leaderGender: teamForm.leaderGender,
        mentorName: teamForm.mentorName.trim(),
        members: teamForm.members.map(m => ({ name: m.name.trim(), gender: m.gender }))
      };

      const res = await fetch('https://sih-26-jarr.onrender.com/api/university/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to register team');

      showNotification('University R&D Team successfully registered!');
      
      // Optimistic removal from setup tab and update teams
      setAcceptedProblems(prev => prev.filter(p => p._id !== pId));
      if (data.data) {
        setTeams(prev => [data.data, ...prev]);
      }

      setSelectedProblemForTeam(null);
      if (viewingProblemDetails?._id === pId) {
        setViewingProblemDetails(null);
      }

      fetchAcceptedProblems(token);
      fetchTeams(token);
      fetchSummary(token);
      setActiveTab('ongoing');
    } catch (err: any) {
      setTeamFormError(err.message || 'Failed to register team');
    } finally {
      setSubmittingTeam(false);
    }
  };

  // Handle Solution Submission
  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    setSolutionFormError('');

    if (!selectedTeamForSolution) return;

    if (!solutionForm.docxLink.trim() || !solutionForm.description.trim()) {
      setSolutionFormError('Documentation Link (.docx / PDF) and Technical Description are required.');
      return;
    }

    setSubmittingSolution(true);
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      let docxLink = solutionForm.docxLink.trim();
      if (!docxLink.startsWith('http://') && !docxLink.startsWith('https://')) {
        docxLink = `https://${docxLink}`;
      }

      let demoVideoLink = solutionForm.demoVideoLink.trim();
      if (demoVideoLink && !demoVideoLink.startsWith('http://') && !demoVideoLink.startsWith('https://')) {
        demoVideoLink = `https://${demoVideoLink}`;
      }

      let prototypeLink = solutionForm.prototypeLink.trim();
      if (prototypeLink && !prototypeLink.startsWith('http://') && !prototypeLink.startsWith('https://')) {
        prototypeLink = `https://${prototypeLink}`;
      }

      const payload = {
        docxLink,
        description: solutionForm.description.trim(),
        demoVideoLink: demoVideoLink || undefined,
        prototypeLink: prototypeLink || undefined
      };

      const res = await fetch(`https://sih-26-jarr.onrender.com/api/university/teams/${selectedTeamForSolution._id}/solution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit solution');

      showNotification('Prototype & Solution successfully submitted to municipal stakeholders!');
      setSelectedTeamForSolution(null);
      setSolutionForm({ docxLink: '', demoVideoLink: '', prototypeLink: '', description: '' });
      await fetchTeams(token);
      await fetchSummary(token);
    } catch (err: any) {
      setSolutionFormError(err.message || 'Failed to submit solution');
    } finally {
      setSubmittingSolution(false);
    }
  };

  const institutionName = 
    summaryData?.university?.name || 
    user?.profileDetails?.institutionName || 
    user?.name || 
    'University Innovation Hub';

  // Set of problem IDs that already have a team
  const teamProblemIds = new Set(
    teams.map((t: any) => typeof t.problemStatement === 'object' ? t.problemStatement?._id : t.problemStatement).filter(Boolean)
  );

  // Incoming problems: Not accepted, not rejected by me, no team formed, not in-progress
  const pendingAllocatedProblems = allocatedProblems.filter((problem: any) => {
    const isAccepted = problem.status === 'ACCEPTED' || problem.acceptedBy || teamProblemIds.has(problem._id);
    const isAdvanced = ['IN_PROGRESS', 'PROPOSAL', 'PROTOTYPE', 'VALIDATED', 'DEPLOYED'].includes(problem.status);
    const isRejectedByMe = Array.isArray(problem.rejectedBy) && problem.rejectedBy.includes(user?._id || user?.id);
    return !isAccepted && !isAdvanced && !isRejectedByMe;
  });

  // Setup problems: Accepted by this university, but team has NOT been formed yet
  const pendingSetupProblems = acceptedProblems.filter((problem: any) => {
    const hasTeam = teamProblemIds.has(problem._id);
    const isAdvanced = ['IN_PROGRESS', 'PROPOSAL', 'PROTOTYPE', 'VALIDATED', 'DEPLOYED'].includes(problem.status);
    return !hasTeam && !isAdvanced;
  });

  return (
    <div className="flex h-screen w-screen bg-[#f4f1e1] font-sans text-[#2c4230] overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto relative bg-[#f4f1e1]">
        {/* Banner Header */}
        <div className="relative h-48 w-full shrink-0 overflow-hidden bg-[#2c4230] flex items-end px-8 sm:px-10 pb-6 rounded-bl-3xl shadow-sm">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#1e2d21] to-transparent opacity-85"></div>
          
          <div className="relative z-10 flex w-full justify-between items-end">
            <div className="flex flex-col text-[#f4f1e1]">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-[#f9d877] text-[#2c4230] font-black text-[11px] rounded-md uppercase tracking-wider">
                  Academic R&D Portal
                </span>
                <span className="text-xs text-[#a4c2a8] font-medium">
                  {summaryData?.university?.matchedCollegeRecord?.domain || 'Multi-disciplinary Hub'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
                {institutionName} <GraduationCap className="text-[#f9d877]" size={26} />
              </h2>
              <p className="text-xs text-[#c0d4c3] mt-1 flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#f9d877]" />
                Transforming citizen field reports into funded engineering innovations & municipal prototypes
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <Link 
                to="/explore" 
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-[#f4f1e1] backdrop-blur-md border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <MapPin size={14} /> GIS Problem Map
              </Link>
            </div>
          </div>
        </div>

        {/* Floating Notification */}
        {notification && (
          <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 animate-bounce ${
            notification.type === 'success' 
              ? 'bg-[#2c4230] text-[#f4f1e1] border-[#4a6b4e]' 
              : 'bg-red-700 text-white border-red-800'
          }`}>
            {notification.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
            <span>{notification.msg}</span>
          </div>
        )}

        <div className="p-8 sm:p-10 w-full space-y-8">
          
          {/* Quick Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. Incoming AI Allocated */}
            <div className="bg-white p-6 rounded-3xl border border-[#e2ded0] shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#556958] uppercase tracking-wider">Incoming Challenges</span>
                <div className="p-2.5 bg-[#4a6b4e]/10 text-[#4a6b4e] rounded-xl">
                  <Building2 size={20} />
                </div>
              </div>
              <div className="my-3">
                <h3 className="text-3xl font-black text-[#2c4230]">
                  {pendingAllocatedProblems.length}
                </h3>
                <p className="text-xs text-[#7d8c7c] mt-0.5">Matched by AI domain matcher</p>
              </div>
              <div className="text-[11px] text-[#4a6b4e] font-semibold flex items-center gap-1">
                <Sparkles size={13} /> Action: Review & Accept/Decline
              </div>
            </div>

            {/* 2. Accepted / Problem Setup */}
            <div className="bg-white p-6 rounded-3xl border border-[#e2ded0] shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#556958] uppercase tracking-wider">Accepted for R&D</span>
                <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
                  <Users size={20} />
                </div>
              </div>
              <div className="my-3">
                <h3 className="text-3xl font-black text-amber-800">
                  {pendingSetupProblems.length}
                </h3>
                <p className="text-xs text-[#7d8c7c] mt-0.5">Adopted challenges awaiting team</p>
              </div>
              <div className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                <FolderPlus size={13} /> Action: Form Student Team
              </div>
            </div>

            {/* 3. Ongoing Prototype Teams */}
            <div className="bg-white p-6 rounded-3xl border border-[#e2ded0] shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#556958] uppercase tracking-wider">Active Teams & Solutions</span>
                <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Award size={20} />
                </div>
              </div>
              <div className="my-3">
                <h3 className="text-3xl font-black text-emerald-800">
                  {teams.length}
                </h3>
                <p className="text-xs text-[#7d8c7c] mt-0.5">Under active prototyping</p>
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <Send size={13} /> Action: Submit Final Solution
              </div>
            </div>

          </div>

          {/* Tab Navigation Navigation Header */}
          <div className="bg-white p-2 rounded-2xl border border-[#e2ded0] flex flex-wrap gap-2 shadow-sm">
            <button
              onClick={() => setActiveTab('incoming')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'incoming'
                  ? 'bg-[#2c4230] text-[#f4f1e1] shadow-md'
                  : 'text-[#556958] hover:bg-[#f4f1e1] hover:text-[#2c4230]'
              }`}
            >
              <Building2 size={16} />
              <span>1. Incoming Problems ({pendingAllocatedProblems.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('setup')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'setup'
                  ? 'bg-[#2c4230] text-[#f4f1e1] shadow-md'
                  : 'text-[#556958] hover:bg-[#f4f1e1] hover:text-[#2c4230]'
              }`}
            >
              <Users size={16} />
              <span>2. Problem Setup & Team Formation ({pendingSetupProblems.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('ongoing')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'ongoing'
                  ? 'bg-[#2c4230] text-[#f4f1e1] shadow-md'
                  : 'text-[#556958] hover:bg-[#f4f1e1] hover:text-[#2c4230]'
              }`}
            >
              <Award size={16} />
              <span>3. Ongoing Problems & Solutions ({teams.length})</span>
            </button>
          </div>

          {/* TAB 1: INCOMING ALLOCATED PROBLEMS */}
          {activeTab === 'incoming' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#2c4230]">Incoming Allocated Problems</h3>
                  <p className="text-xs text-[#556958]">
                    Click any problem card to inspect full challenge details, evidence, and AI recommendations before approving.
                  </p>
                </div>
              </div>

              {allocatedLoading ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-[#e2ded0] text-[#556958]">
                  <Sparkles className="animate-spin mx-auto text-[#4a6b4e] mb-2" size={24} />
                  <span>Loading allocated challenges...</span>
                </div>
              ) : pendingAllocatedProblems.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-[#e2ded0] shadow-sm">
                  <CheckCircle className="mx-auto text-[#4a6b4e] mb-3" size={36} />
                  <h4 className="text-base font-bold text-[#2c4230] mb-1">No pending incoming problems</h4>
                  <p className="text-xs text-[#556958] max-w-md mx-auto">
                    All currently routed civic problems have been addressed. New incoming reports from citizens will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingAllocatedProblems.map((problem) => {
                    const matchScore = problem.allocationDetails?.match_score || 90;
                    const distance = problem.allocationDetails?.distance_km ?? 2.5;
                    const firstPhoto = problem.imagesAndMedia?.[0]?.url;

                    return (
                      <div 
                        key={problem._id} 
                        onClick={() => navigate(`/problem/${problem._id}`)}
                        className="bg-white rounded-3xl border border-[#e2ded0] hover:border-[#4a6b4e]/50 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all flex flex-col justify-between overflow-hidden cursor-pointer group"
                      >
                        {/* Image Header */}
                        <div className="h-36 bg-[#e8e4d3] relative overflow-hidden flex items-center justify-center">
                          <CardEvidenceImage url={firstPhoto} />
                          <div className="absolute top-3 left-3 flex items-center gap-1.5">
                            <span className="px-2.5 py-0.5 bg-[#2c4230] text-[#f9d877] text-[10.5px] font-black rounded-full shadow-sm">
                              AI Match: {matchScore}%
                            </span>
                            <span className="px-2.5 py-0.5 bg-white/90 backdrop-blur-md text-[#2c4230] text-[10.5px] font-bold rounded-full shadow-sm">
                              {distance} km away
                            </span>
                          </div>
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="px-2.5 py-1 bg-[#2c4230] text-[#f4f1e1] text-[10px] font-bold rounded-full shadow-md flex items-center gap-1">
                              <Eye size={12} /> Click to View
                            </span>
                          </div>
                        </div>

                        {/* Body */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2.5 py-0.5 bg-[#4a6b4e]/10 text-[#2c4230] text-[11px] font-bold rounded-md border border-[#4a6b4e]/20">
                                {problem.aiAnalysis?.problem_classification || 'Civic Problem'}
                              </span>
                              <span className="text-[11px] text-[#7d8c7c] font-medium">
                                Severity: {problem.aiAnalysis?.severity || 'HIGH'}
                              </span>
                            </div>

                            <h4 className="font-bold text-[#2c4230] text-base mb-1.5 line-clamp-2 leading-snug group-hover:text-[#4a6b4e] transition-colors">
                              {problem.title || "Civic Challenge Statement"}
                            </h4>

                            <p className="text-xs text-[#556958] line-clamp-2 mb-3 leading-relaxed">
                              {problem.aiAnalysis?.summary || problem.description}
                            </p>

                            <div className="flex items-center gap-1.5 text-xs text-[#556958] mb-4">
                              <MapPin size={13} className="text-[#4a6b4e]" />
                              <span className="truncate">
                                {problem.location?.district || 'Ranchi'}, {problem.location?.state || 'Jharkhand'}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-4 border-t border-[#e2ded0] flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProblemDecision(problem._id, 'accept');
                              }}
                              className="flex-1 py-2.5 bg-[#2c4230] hover:bg-[#1e2d21] text-[#f4f1e1] rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle size={14} className="text-[#a4c2a8]" /> Accept Problem
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/problem/${problem._id}`);
                              }}
                              className="py-2.5 px-3 bg-[#f4f1e1] hover:bg-[#e2ded0] text-[#2c4230] rounded-xl text-xs font-bold transition-all flex items-center justify-center"
                              title="View Full Problem Tracker Page"
                            >
                              <Eye size={15} />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProblemDecision(problem._id, 'reject');
                              }}
                              className="py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center"
                              title="Reject Problem"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROBLEM SETUP & TEAM FORMATION */}
          {activeTab === 'setup' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#2c4230]">Accepted Problems Setup</h3>
                  <p className="text-xs text-[#556958]">
                    Register student teams & assign faculty mentors to begin prototyping solutions. Once a team is registered, it moves to Active Prototyping.
                  </p>
                </div>
              </div>

              {acceptedLoading ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-[#e2ded0] text-[#556958]">
                  <Sparkles className="animate-spin mx-auto text-[#4a6b4e] mb-2" size={24} />
                  <span>Loading accepted challenges...</span>
                </div>
              ) : pendingSetupProblems.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-[#e2ded0] shadow-sm">
                  <Users className="mx-auto text-[#7d8c7c] mb-3" size={36} />
                  <h4 className="text-base font-bold text-[#2c4230] mb-1">No accepted challenges awaiting team setup</h4>
                  <p className="text-xs text-[#556958] max-w-md mx-auto mb-4">
                    All accepted challenges have teams formed, or no new problems have been accepted yet.
                  </p>
                  <button
                    onClick={() => setActiveTab('incoming')}
                    className="px-4 py-2 bg-[#2c4230] text-[#f4f1e1] rounded-xl text-xs font-bold"
                  >
                    View Incoming Problems
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingSetupProblems.map((problem) => {
                    const firstPhoto = problem.imagesAndMedia?.[0]?.url;

                    return (
                      <div 
                        key={problem._id} 
                        onClick={() => navigate(`/problem/${problem._id}`)}
                        className="bg-white rounded-3xl border border-[#e2ded0] hover:border-[#4a6b4e]/50 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all flex flex-col justify-between overflow-hidden cursor-pointer group"
                      >
                        {/* Image Header */}
                        <div className="h-36 bg-[#e8e4d3] relative overflow-hidden flex items-center justify-center">
                          <CardEvidenceImage url={firstPhoto} />
                          <div className="absolute top-3 left-3">
                            <span className="px-2.5 py-0.5 bg-emerald-700 text-white text-[10.5px] font-bold rounded-full shadow-sm">
                              Status: ACCEPTED
                            </span>
                          </div>
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="px-2.5 py-1 bg-[#2c4230] text-[#f4f1e1] text-[10px] font-bold rounded-full shadow-md flex items-center gap-1">
                              <Eye size={12} /> View Details
                            </span>
                          </div>
                        </div>

                        {/* Body */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-[#2c4230] text-base mb-1.5 line-clamp-2 leading-snug group-hover:text-[#4a6b4e] transition-colors">
                              {problem.title || "Civic Challenge Statement"}
                            </h4>

                            <p className="text-xs text-[#556958] line-clamp-2 mb-3 leading-relaxed">
                              {problem.aiAnalysis?.summary || problem.description}
                            </p>

                            <div className="p-3 bg-[#f4f1e1]/60 rounded-xl border border-[#e2ded0] text-xs text-[#556958] space-y-1 mb-4">
                              <p className="font-semibold text-[#2c4230]">Domain: {problem.aiAnalysis?.problem_classification || 'Civic Infrastructure'}</p>
                              <p className="text-[11px]">Accepted by {problem.acceptedByUniversityName || institutionName}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProblemForTeam(problem);
                                setTeamFormError('');
                              }}
                              className="flex-1 py-2.5 bg-[#f9d877] hover:bg-[#eecb66] text-[#2c4230] font-black rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
                            >
                              <Users size={15} /> Form Student Team
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/problem/${problem._id}`);
                              }}
                              className="py-2.5 px-3 bg-[#f4f1e1] hover:bg-[#e2ded0] text-[#2c4230] rounded-xl text-xs font-bold transition-all flex items-center justify-center"
                              title="Open Full Problem Tracker Page"
                            >
                              <Eye size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ONGOING PROBLEMS & SOLUTION SUBMISSION */}
          {activeTab === 'ongoing' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#2c4230]">Ongoing Teams & Prototype Solutions</h3>
                  <p className="text-xs text-[#556958]">
                    Track active teams, review prototype documentation, and submit final engineering solutions.
                  </p>
                </div>
              </div>

              {teamsLoading ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-[#e2ded0] text-[#556958]">
                  <Sparkles className="animate-spin mx-auto text-[#4a6b4e] mb-2" size={24} />
                  <span>Loading ongoing teams...</span>
                </div>
              ) : teams.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-[#e2ded0] shadow-sm">
                  <Award className="mx-auto text-[#7d8c7c] mb-3" size={36} />
                  <h4 className="text-base font-bold text-[#2c4230] mb-1">No active registered teams yet</h4>
                  <p className="text-xs text-[#556958] max-w-md mx-auto mb-4">
                    Form student teams for accepted challenges in Tab 2 to start developing solutions.
                  </p>
                  <button
                    onClick={() => setActiveTab('setup')}
                    className="px-4 py-2 bg-[#2c4230] text-[#f4f1e1] rounded-xl text-xs font-bold"
                  >
                    Go to Team Setup
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {teams.map((team) => {
                    const prob = team.problemStatement || {};
                    const hasSolution = !!team.solution;

                    return (
                      <div 
                        key={team._id} 
                        onClick={() => prob._id && navigate(`/problem/${prob._id}`)}
                        className="bg-white rounded-3xl p-6 border border-[#e2ded0] hover:border-[#4a6b4e]/50 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2.5 py-0.5 bg-[#2c4230]/10 text-[#2c4230] text-xs font-bold rounded-md">
                              Team: {team.teamName}
                            </span>
                            <div className="flex items-center gap-2">
                              {prob._id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/problem/${prob._id}`);
                                  }}
                                  className="px-2.5 py-1 bg-[#f4f1e1] hover:bg-[#e2ded0] text-[#2c4230] text-[11px] font-bold rounded-full transition-all flex items-center gap-1 shadow-sm"
                                  title="View Challenge Details"
                                >
                                  <Eye size={12} /> View Tracker Page
                                </button>
                              )}
                              <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${
                                hasSolution ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {hasSolution ? 'SOLUTION SUBMITTED' : 'IN PROTOTYPING'}
                              </span>
                            </div>
                          </div>

                          <h4 className="font-bold text-base text-[#2c4230] mb-2 leading-snug group-hover:text-[#4a6b4e] transition-colors">
                            {prob.title || "Civic Challenge Problem"}
                          </h4>

                          <div className="p-3.5 bg-[#f4f1e1]/60 rounded-2xl border border-[#e2ded0] text-xs text-[#556958] space-y-1.5 mb-3">
                            <p><strong>Faculty Mentor:</strong> {team.mentorName || 'Assigned Mentor'}</p>
                            <p><strong>Team Leader:</strong> {team.leaderName} ({team.leaderGender || 'Student'})</p>
                            <p><strong>Members ({team.members?.length || 0}):</strong> {team.members?.map((m: any) => `${m.name} (${m.gender})`).join(', ')}</p>
                          </div>

                          {/* Solution Details (if submitted) */}
                          {hasSolution && (
                            <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-2">
                                <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                                  <CheckCircle size={15} /> Submitted Solution Brief
                                </p>
                                <p className="text-xs leading-relaxed text-emerald-800/90">{team.solution.description}</p>
                                
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {team.solution.docxLink && (
                                    <a 
                                      href={team.solution.docxLink} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="px-3 py-1 bg-white border border-emerald-300 rounded-lg font-bold text-[11px] text-emerald-800 hover:bg-emerald-100 inline-flex items-center gap-1 shadow-sm"
                                    >
                                      <FileText size={13} /> View Documentation
                                    </a>
                                  )}
                                  {team.solution.demoVideoLink && (
                                    <a 
                                      href={team.solution.demoVideoLink} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="px-3 py-1 bg-white border border-emerald-300 rounded-lg font-bold text-[11px] text-emerald-800 hover:bg-emerald-100 inline-flex items-center gap-1 shadow-sm"
                                    >
                                      <Video size={13} /> Demo Video
                                    </a>
                                  )}
                                  {team.solution.prototypeLink && (
                                    <a 
                                      href={team.solution.prototypeLink} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="px-3 py-1 bg-white border border-emerald-300 rounded-lg font-bold text-[11px] text-emerald-800 hover:bg-emerald-100 inline-flex items-center gap-1 shadow-sm"
                                    >
                                      <ExternalLink size={13} /> Prototype Repo / Demo
                                    </a>
                                  )}
                                </div>
                              </div>

                              {/* AI Matched Industry & Commercialization Partners */}
                              {Array.isArray(prob.companySuggestions) && prob.companySuggestions.length > 0 && (
                                <div className="p-4 bg-[#2c4230]/5 rounded-2xl border border-[#2c4230]/15 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-xs text-[#2c4230] flex items-center gap-1.5 uppercase tracking-wider font-mono">
                                      <Briefcase size={14} className="text-[#4a6b4e]" /> Matched Industry Partners ({prob.companySuggestions.length})
                                    </span>
                                    <span className="text-[10px] font-bold bg-[#f9d877] text-[#2c4230] px-2 py-0.5 rounded-md">
                                      CSR / Tech Commercialization
                                    </span>
                                  </div>

                                  <div className="space-y-2">
                                    {prob.companySuggestions.slice(0, 4).map((comp: any, cIdx: number) => {
                                      const compScore = comp.match_score !== undefined && comp.match_score !== null
                                        ? (comp.match_score <= 1 ? (comp.match_score * 100).toFixed(1) : Number(comp.match_score).toFixed(1))
                                        : null;

                                      return (
                                        <div key={cIdx} className="p-3 bg-white rounded-xl border border-[#e2ded0] text-xs space-y-1 hover:border-[#4a6b4e]/40 transition-colors">
                                          <div className="flex items-start justify-between gap-2">
                                            <h5 className="font-bold text-[#2c4230] text-xs leading-snug">
                                              {comp.company_name || 'Industry Partner'}
                                            </h5>
                                            {compScore && (
                                              <span className="px-2 py-0.5 bg-[#2c4230] text-[#f9d877] text-[10px] font-extrabold rounded-full shrink-0">
                                                {compScore}% Match
                                              </span>
                                            )}
                                          </div>
                                          
                                          <div className="flex flex-wrap items-center gap-x-2.5 text-[11px] text-[#556958]">
                                            {comp.domain && (
                                              <span className="font-semibold text-[#2c4230] capitalize bg-[#f4f1e1] px-1.5 py-0.5 rounded text-[10px]">
                                                {comp.domain}
                                              </span>
                                            )}
                                            {comp.distance_km !== undefined && comp.distance_km !== null && (
                                              <span>• {Number(comp.distance_km).toFixed(1)} km away</span>
                                            )}
                                          </div>

                                          {comp.expertise && (
                                            <p className="text-[11px] text-[#4a5848] line-clamp-2 pt-0.5">
                                              <span className="font-semibold text-[#2c4230]">Capabilities:</span> {comp.expertise}
                                            </p>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {!hasSolution && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTeamForSolution(team);
                              setSolutionFormError('');
                            }}
                            className="w-full py-2.5 bg-[#2c4230] hover:bg-[#1e2d21] text-[#f4f1e1] font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                          >
                            <Send size={14} /> Submit Final Engineering Solution
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* MODAL 1: TEAM FORMATION */}
      {selectedProblemForTeam && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 border border-[#e2ded0] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#e2ded0] pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#2c4230]">Form University Innovation Team</h3>
                <p className="text-xs text-[#556958]">For: {selectedProblemForTeam.title}</p>
              </div>
              <button 
                onClick={() => setSelectedProblemForTeam(null)}
                className="p-1 text-[#7d8c7c] hover:text-[#2c4230] rounded-full"
              >
                ✕
              </button>
            </div>

            {teamFormError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{teamFormError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitTeam} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#2c4230] mb-1">Team Name *</label>
                <input
                  type="text"
                  placeholder="e.g. CleanWater Innovators 2026"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#f4f1e1]/80 border border-[#e2ded0] rounded-xl outline-none focus:bg-white focus:border-[#4a6b4e] text-[#2c4230]"
                  value={teamForm.teamName}
                  onChange={e => setTeamForm({ ...teamForm, teamName: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-bold text-[#2c4230] mb-1">Faculty Mentor Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Anita Desai"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#f4f1e1]/80 border border-[#e2ded0] rounded-xl outline-none focus:bg-white focus:border-[#4a6b4e] text-[#2c4230]"
                  value={teamForm.mentorName}
                  onChange={e => setTeamForm({ ...teamForm, mentorName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-[#2c4230] mb-1">Team Leader Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    required
                    className="w-full px-3.5 py-2.5 bg-[#f4f1e1]/80 border border-[#e2ded0] rounded-xl outline-none focus:bg-white focus:border-[#4a6b4e] text-[#2c4230]"
                    value={teamForm.leaderName}
                    onChange={e => setTeamForm({ ...teamForm, leaderName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2c4230] mb-1">Gender *</label>
                  <select
                    className="w-full px-3 py-2.5 bg-[#f4f1e1]/80 border border-[#e2ded0] rounded-xl outline-none focus:bg-white focus:border-[#4a6b4e] text-[#2c4230]"
                    value={teamForm.leaderGender}
                    onChange={e => setTeamForm({ ...teamForm, leaderGender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Members List */}
              <div className="space-y-2 pt-2 border-t border-[#e2ded0]">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#2c4230]">
                    Team Members (Total 4 to 6 required, min 1 female)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="text-[11px] font-bold text-[#4a6b4e] hover:underline flex items-center gap-1"
                  >
                    <Plus size={13} /> Add Member
                  </button>
                </div>

                {teamForm.members.map((member, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Member ${idx + 1} Name`}
                      required
                      className="flex-1 px-3 py-2 bg-[#f4f1e1]/80 border border-[#e2ded0] rounded-xl outline-none focus:bg-white focus:border-[#4a6b4e] text-[#2c4230]"
                      value={member.name}
                      onChange={e => handleMemberChange(idx, 'name', e.target.value)}
                    />
                    <select
                      className="w-28 px-2.5 py-2 bg-[#f4f1e1]/80 border border-[#e2ded0] rounded-xl outline-none focus:bg-white focus:border-[#4a6b4e] text-[#2c4230]"
                      value={member.gender}
                      onChange={e => handleMemberChange(idx, 'gender', e.target.value)}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {teamForm.members.length > 3 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#e2ded0]">
                <button
                  type="button"
                  onClick={() => setSelectedProblemForTeam(null)}
                  className="px-4 py-2 text-[#556958] font-bold hover:bg-[#f4f1e1] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTeam}
                  className="px-5 py-2.5 bg-[#2c4230] text-[#f4f1e1] font-bold rounded-xl shadow-md hover:bg-[#1e2d21] disabled:opacity-50"
                >
                  {submittingTeam ? 'Registering...' : 'Register Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SOLUTION SUBMISSION */}
      {selectedTeamForSolution && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 border border-[#e2ded0] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#e2ded0] pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#2c4230]">Submit Engineering Solution</h3>
                <p className="text-xs text-[#556958]">Team: {selectedTeamForSolution.teamName}</p>
              </div>
              <button 
                onClick={() => setSelectedTeamForSolution(null)}
                className="p-1 text-[#7d8c7c] hover:text-[#2c4230] rounded-full"
              >
                ✕
              </button>
            </div>

            {solutionFormError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{solutionFormError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitSolution} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#2c4230] mb-1">Documentation File Link (.docx / PDF / Cloud storage) *</label>
                <input
                  type="url"
                  placeholder="https://storage.r2.dev/solution_doc.docx or Drive link"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#f4f1e1]/80 border border-[#e2ded0] rounded-xl outline-none focus:bg-white focus:border-[#4a6b4e] text-[#2c4230]"
                  value={solutionForm.docxLink}
                  onChange={e => setSolutionForm({ ...solutionForm, docxLink: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-bold text-[#2c4230] mb-1">Technical Solution Summary & Impact *</label>
                <textarea
                  rows={4}
                  placeholder="Describe the engineered solution, sensor specifications, field validation results, and maintenance plan..."
                  required
                  className="w-full px-3.5 py-2.5 bg-[#f4f1e1]/80 border border-[#e2ded0] rounded-xl outline-none focus:bg-white focus:border-[#4a6b4e] text-[#2c4230]"
                  value={solutionForm.description}
                  onChange={e => setSolutionForm({ ...solutionForm, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-bold text-[#2c4230] mb-1">Demo Video Link (YouTube / Drive - Optional)</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-3.5 py-2.5 bg-[#f4f1e1]/80 border border-[#e2ded0] rounded-xl outline-none focus:bg-white focus:border-[#4a6b4e] text-[#2c4230]"
                  value={solutionForm.demoVideoLink}
                  onChange={e => setSolutionForm({ ...solutionForm, demoVideoLink: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-bold text-[#2c4230] mb-1">Prototype / GitHub Repository Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://github.com/team/smart-water-solution"
                  className="w-full px-3.5 py-2.5 bg-[#f4f1e1]/80 border border-[#e2ded0] rounded-xl outline-none focus:bg-white focus:border-[#4a6b4e] text-[#2c4230]"
                  value={solutionForm.prototypeLink}
                  onChange={e => setSolutionForm({ ...solutionForm, prototypeLink: e.target.value })}
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#e2ded0]">
                <button
                  type="button"
                  onClick={() => setSelectedTeamForSolution(null)}
                  className="px-4 py-2 text-[#556958] font-bold hover:bg-[#f4f1e1] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSolution}
                  className="px-5 py-2.5 bg-[#2c4230] text-[#f4f1e1] font-bold rounded-xl shadow-md hover:bg-[#1e2d21] disabled:opacity-50"
                >
                  {submittingSolution ? 'Submitting...' : 'Submit Solution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL 3: VIEW FULL PROBLEM DETAILS & ACTION */}
      {viewingProblemDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 border border-[#e2ded0] shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#e2ded0] pb-4">
              <div className="space-y-1.5 pr-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-[#4a6b4e]/10 text-[#2c4230] text-[11px] font-bold rounded-md border border-[#4a6b4e]/20">
                    {viewingProblemDetails.aiAnalysis?.problem_classification || 'Civic Problem'}
                  </span>
                  <span className="px-2.5 py-0.5 bg-red-100 text-red-800 text-[11px] font-bold rounded-md">
                    {viewingProblemDetails.aiAnalysis?.severity || 'HIGH'} SEVERITY
                  </span>
                  {viewingProblemDetails.allocationDetails?.match_score && (
                    <span className="px-2.5 py-0.5 bg-[#2c4230] text-[#f9d877] text-[11px] font-black rounded-md shadow-sm">
                      {viewingProblemDetails.allocationDetails.match_score}% AI Match
                    </span>
                  )}
                  {viewingProblemDetails.allocationDetails?.distance_km !== undefined && (
                    <span className="px-2.5 py-0.5 bg-[#f4f1e1] text-[#2c4230] border border-[#e2ded0] text-[11px] font-semibold rounded-md">
                      {viewingProblemDetails.allocationDetails.distance_km} km away
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-extrabold text-[#2c4230] leading-snug">
                  {viewingProblemDetails.title || 'Civic Challenge Statement'}
                </h3>
              </div>
              <button 
                onClick={() => setViewingProblemDetails(null)}
                className="p-1.5 text-[#7d8c7c] hover:text-[#2c4230] hover:bg-[#f4f1e1] rounded-full transition-colors shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Location & Meta */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#556958] bg-[#f4f1e1]/60 p-3.5 rounded-2xl border border-[#e2ded0]">
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin size={14} className="text-[#4a6b4e]" />
                {viewingProblemDetails.location?.district || 'Ranchi'}, {viewingProblemDetails.location?.state || 'Jharkhand'}
                {viewingProblemDetails.location?.village && ` • ${viewingProblemDetails.location.village}`}
              </span>
              {viewingProblemDetails.createdAt && (
                <span>• Reported: {new Date(viewingProblemDetails.createdAt).toLocaleDateString()}</span>
              )}
              {viewingProblemDetails.submittedBy?.name && (
                <span>• Submitter: {viewingProblemDetails.submittedBy.name}</span>
              )}
            </div>

            {/* Photo Evidence if any */}
            {Array.isArray(viewingProblemDetails.imagesAndMedia) && viewingProblemDetails.imagesAndMedia.filter((m: any) => m && m.url && !m.url.includes('placeholder.com')).length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#2c4230] uppercase tracking-wider font-mono">
                  Attached Field Evidence ({viewingProblemDetails.imagesAndMedia.filter((m: any) => m && m.url && !m.url.includes('placeholder.com')).length})
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {viewingProblemDetails.imagesAndMedia.filter((m: any) => m && m.url && !m.url.includes('placeholder.com')).map((media: any, idx: number) => (
                    <a
                      key={idx}
                      href={media.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl overflow-hidden border border-[#e2ded0] hover:opacity-90 h-28 bg-[#e8e4d3]"
                    >
                      <img src={media.url} alt="Evidence" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1.5 text-xs text-[#3e4a36]">
              <label className="block text-xs font-bold text-[#2c4230] uppercase tracking-wider font-mono">
                Field Problem Description
              </label>
              <p className="whitespace-pre-wrap leading-relaxed text-[#4a5848] bg-[#f4f1e1]/40 p-4 rounded-2xl border border-[#e2ded0]/80">
                {viewingProblemDetails.description}
              </p>
            </div>

            {/* AI Intelligence Brief */}
            {viewingProblemDetails.aiAnalysis && (
              <div className="bg-gradient-to-br from-[#2c4230] to-[#1e2d21] text-[#f4f1e1] p-5 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-[#f9d877] font-bold text-xs">
                  <Sparkles size={16} /> IndicBERT AI Intelligence Brief
                </div>
                <p className="text-xs leading-relaxed text-[#e2ded0]">
                  {viewingProblemDetails.aiAnalysis.summary}
                </p>
                {viewingProblemDetails.aiAnalysis.suggested_solution && (
                  <div className="bg-white/10 p-3 rounded-xl border border-white/10 text-xs">
                    <span className="font-bold text-[#f9d877]">Suggested Engineering Approach: </span>
                    <span className="text-[#f4f1e1]/90">{viewingProblemDetails.aiAnalysis.suggested_solution}</span>
                  </div>
                )}
                {Array.isArray(viewingProblemDetails.aiAnalysis.required_expertise) && (
                  <div className="pt-1">
                    <span className="text-[11px] font-bold text-[#a4c2a8] uppercase font-mono block mb-1.5">Required Lab / Domain Expertise:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {viewingProblemDetails.aiAnalysis.required_expertise.map((exp: string, idx: number) => (
                        <span key={idx} className="bg-white/15 px-2.5 py-0.5 rounded-md text-[11px] font-semibold text-white border border-white/10">
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Allocation & Lab Matching Info */}
            {viewingProblemDetails.allocationDetails && (
              <div className="p-4 bg-[#f4f1e1]/60 rounded-2xl border border-[#e2ded0] space-y-1.5 text-xs text-[#556958]">
                <div className="flex items-center gap-1.5 text-[#2c4230] font-bold">
                  <Building2 size={14} className="text-[#4a6b4e]" />
                  <span>Matching Assessment for {institutionName}</span>
                </div>
                {viewingProblemDetails.allocationDetails.faculty_expertise && (
                  <p><strong className="text-[#2c4230]">Relevant Faculty Expertise:</strong> {viewingProblemDetails.allocationDetails.faculty_expertise}</p>
                )}
                {viewingProblemDetails.allocationDetails.infrastructure && (
                  <p><strong className="text-[#2c4230]">Relevant Campus Labs:</strong> {viewingProblemDetails.allocationDetails.infrastructure}</p>
                )}
              </div>
            )}

            {/* Active Team / Prototyping info if problem is in ongoing state */}
            {viewingProblemDetails.teamInfo && (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <Users size={14} className="text-emerald-700" /> Active Innovation Team: {viewingProblemDetails.teamInfo.teamName}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200/60 text-emerald-900">
                    {viewingProblemDetails.teamInfo.solution ? 'SOLUTION SUBMITTED' : 'IN PROTOTYPING'}
                  </span>
                </div>
                <p><strong>Faculty Mentor:</strong> {viewingProblemDetails.teamInfo.mentorName || 'Assigned Faculty Mentor'}</p>
                <p><strong>Team Leader:</strong> {viewingProblemDetails.teamInfo.leaderName} ({viewingProblemDetails.teamInfo.leaderGender || 'Student'})</p>
                {Array.isArray(viewingProblemDetails.teamInfo.members) && viewingProblemDetails.teamInfo.members.length > 0 && (
                  <p><strong>Members ({viewingProblemDetails.teamInfo.members.length}):</strong> {viewingProblemDetails.teamInfo.members.map((m: any) => `${m.name} (${m.gender})`).join(', ')}</p>
                )}
              </div>
            )}

            {/* Action Bar inside Modal */}
            <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#e2ded0]">
              <Link
                to={`/problem/${viewingProblemDetails._id}`}
                target="_blank"
                className="px-4 py-2.5 text-xs font-bold text-[#2c4230] bg-[#f4f1e1] hover:bg-[#e2ded0] rounded-xl flex items-center gap-1.5 border border-[#e2ded0]"
              >
                <ExternalLink size={14} /> Open Full Tracker Page
              </Link>

              <div className="flex items-center gap-2">
                {/* If it is an incoming problem awaiting decision */}
                {pendingAllocatedProblems.some(p => p._id === viewingProblemDetails._id) && (
                  <>
                    <button
                      onClick={() => handleProblemDecision(viewingProblemDetails._id, 'reject')}
                      className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition-all"
                    >
                      Decline Problem
                    </button>
                    <button
                      onClick={() => handleProblemDecision(viewingProblemDetails._id, 'accept')}
                      className="px-5 py-2.5 bg-[#2c4230] hover:bg-[#1e2d21] text-[#f4f1e1] text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle size={15} className="text-[#a4c2a8]" /> Accept Challenge for R&D
                    </button>
                  </>
                )}

                {/* If it is an accepted problem awaiting team */}
                {pendingSetupProblems.some(p => p._id === viewingProblemDetails._id) && (
                  <button
                    onClick={() => {
                      const prob = viewingProblemDetails;
                      setViewingProblemDetails(null);
                      setSelectedProblemForTeam(prob);
                      setTeamFormError('');
                    }}
                    className="px-5 py-2.5 bg-[#f9d877] hover:bg-[#eecb66] text-[#2c4230] text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Users size={15} /> Form Student Team
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversityDashboard;
