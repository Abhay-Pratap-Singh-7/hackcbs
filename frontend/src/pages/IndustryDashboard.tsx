import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
  Briefcase,
  Building2,
  CheckCircle,
  XCircle,
  FileText,
  Sparkles,
  MapPin,
  ExternalLink,
  AlertTriangle,
  Check,
  ImageOff,
  Eye,
  TrendingUp,
  Video,
  Award,
  Layers
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

const IndustryDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'allocated' | 'accepted'>('allocated');
  
  // Dashboard Summary State
  const [summaryData, setSummaryData] = useState<any>(null);

  // Tab 1: Allocated Solutions & Problems (Pending Review)
  const [allocatedSolutions, setAllocatedSolutions] = useState<any[]>([]);
  const [allocatedLoading, setAllocatedLoading] = useState(true);

  // Tab 2: Accepted & Adopted Solutions
  const [acceptedSolutions, setAcceptedSolutions] = useState<any[]>([]);
  const [acceptedLoading, setAcceptedLoading] = useState(true);

  // Action status message
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Modal State: Quick View Details
  const [viewingProblemDetails, setViewingProblemDetails] = useState<any | null>(null);

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
    fetchAllocatedSolutions(token);
    fetchAcceptedSolutions(token);
  }, [navigate]);

  const fetchSummary = async (token: string) => {
    try {
      const res = await fetch('https://hackcbs-cjno.onrender.com/api/industry/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSummaryData(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const normalizeItem = (item: any) => {
    if (!item || typeof item !== 'object') return item;
    return {
      ...item,
      _id: item._id || item.id,
      id: item.id || item._id
    };
  };

  const fetchAllocatedSolutions = async (token: string) => {
    setAllocatedLoading(true);
    try {
      const res = await fetch('https://hackcbs-cjno.onrender.com/api/industry/allocated-solutions?limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAllocatedSolutions((data.data || []).map(normalizeItem));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAllocatedLoading(false);
    }
  };

  const fetchAcceptedSolutions = async (token: string) => {
    setAcceptedLoading(true);
    try {
      const res = await fetch('https://hackcbs-cjno.onrender.com/api/industry/accepted-solutions?limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAcceptedSolutions((data.data || []).map(normalizeItem));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAcceptedLoading(false);
    }
  };

  // Handle Accept / Reject Decision
  const handleSolutionDecision = async (id: string, action: 'accept' | 'reject') => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`https://hackcbs-cjno.onrender.com/api/industry/solutions/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: action === 'accept' ? 'ACCEPTED' : 'REJECTED' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit decision');

      showNotification(
        action === 'accept'
          ? 'Solution accepted! Innovation added to your Adopted Portfolio for CSR / Commercialization.'
          : 'Solution declined.'
      );

      setViewingProblemDetails(null);
      fetchSummary(token);
      fetchAllocatedSolutions(token);
      fetchAcceptedSolutions(token);
    } catch (err: any) {
      showNotification(err.message || 'Operation failed', 'error');
    }
  };

  const companyName = 
    summaryData?.industry?.name || 
    user?.profileDetails?.companyName || 
    user?.name || 
    'Industry & CSR Partner';

  const industrySector =
    summaryData?.industry?.sector ||
    user?.profileDetails?.industrySector ||
    'Technology & Infrastructure';

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
                  Corporate CSR & Tech Scaling Portal
                </span>
                <span className="text-xs text-[#a4c2a8] font-medium">
                  {industrySector}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
                {companyName} <Briefcase className="text-[#f9d877]" size={26} />
              </h2>
              <p className="text-xs text-[#c0d4c3] mt-1 flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#f9d877]" />
                Adopting university engineered prototypes for CSR deployment, industrial scaling & municipal integration
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
            
            {/* 1. Allocated Challenges & Solutions */}
            <div className="bg-white p-6 rounded-3xl border border-[#e2ded0] shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#556958] uppercase tracking-wider">Allocated Solutions</span>
                <div className="p-2.5 bg-[#4a6b4e]/10 text-[#4a6b4e] rounded-xl">
                  <Briefcase size={20} />
                </div>
              </div>
              <div className="my-3">
                <h3 className="text-3xl font-black text-[#2c4230]">
                  {summaryData?.metrics?.pendingReviews ?? allocatedSolutions.length}
                </h3>
                <p className="text-xs text-[#7d8c7c] mt-0.5">Matched by AI industrial engine</p>
              </div>
              <div className="text-[11px] text-[#4a6b4e] font-semibold flex items-center gap-1">
                <Sparkles size={13} /> Action: Review & Adopt / Decline
              </div>
            </div>

            {/* 2. Adopted & Commercialized Innovations */}
            <div className="bg-white p-6 rounded-3xl border border-[#e2ded0] shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#556958] uppercase tracking-wider">Adopted Portfolio</span>
                <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Award size={20} />
                </div>
              </div>
              <div className="my-3">
                <h3 className="text-3xl font-black text-emerald-800">
                  {summaryData?.metrics?.acceptedInnovations ?? acceptedSolutions.length}
                </h3>
                <p className="text-xs text-[#7d8c7c] mt-0.5">Accepted for CSR / deployment</p>
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle size={13} /> Status: In Commercial Pipeline
              </div>
            </div>

            {/* 3. University Prototypes */}
            <div className="bg-white p-6 rounded-3xl border border-[#e2ded0] shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#556958] uppercase tracking-wider">Active Prototypes</span>
                <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
                  <TrendingUp size={20} />
                </div>
              </div>
              <div className="my-3">
                <h3 className="text-3xl font-black text-amber-800">
                  {summaryData?.metrics?.activePrototypes ?? 1}
                </h3>
                <p className="text-xs text-[#7d8c7c] mt-0.5">Available for field trials</p>
              </div>
              <div className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                <Layers size={13} /> High municipal impact potential
              </div>
            </div>

          </div>

          {/* Tab Navigation Header */}
          <div className="bg-white p-2 rounded-2xl border border-[#e2ded0] flex flex-wrap gap-2 shadow-sm">
            <button
              onClick={() => setActiveTab('allocated')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'allocated'
                  ? 'bg-[#2c4230] text-[#f4f1e1] shadow-md'
                  : 'text-[#556958] hover:bg-[#f4f1e1] hover:text-[#2c4230]'
              }`}
            >
              <Briefcase size={16} />
              <span>1. Allocated Solutions & Challenges ({allocatedSolutions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('accepted')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'accepted'
                  ? 'bg-[#2c4230] text-[#f4f1e1] shadow-md'
                  : 'text-[#556958] hover:bg-[#f4f1e1] hover:text-[#2c4230]'
              }`}
            >
              <CheckCircle size={16} />
              <span>2. Adopted & Commercialized Innovations ({acceptedSolutions.length})</span>
            </button>
          </div>

          {/* TAB 1: ALLOCATED SOLUTIONS (PENDING REVIEW) */}
          {activeTab === 'allocated' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#2c4230]">Allocated Civic Solutions & Challenges</h3>
                  <p className="text-xs text-[#556958]">
                    Review AI-matched civic problems and student engineering prototypes. Accept to adopt for CSR funding and municipal commercialization.
                  </p>
                </div>
              </div>

              {allocatedLoading ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-[#e2ded0] text-[#556958]">
                  <Sparkles className="animate-spin mx-auto text-[#4a6b4e] mb-2" size={24} />
                  <span>Loading allocated solutions...</span>
                </div>
              ) : allocatedSolutions.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-[#e2ded0] shadow-sm">
                  <CheckCircle className="mx-auto text-[#4a6b4e] mb-3" size={36} />
                  <h4 className="text-base font-bold text-[#2c4230] mb-1">No pending allocated solutions</h4>
                  <p className="text-xs text-[#556958] max-w-md mx-auto">
                    All currently routed engineering prototypes have been reviewed. New solutions submitted by academic institutions will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allocatedSolutions.map((problem) => {
                    const matchScore = problem.allocationDetails?.match_score || 92;
                    const distance = problem.allocationDetails?.distance_km ?? 12.5;
                    const firstPhoto = problem.imagesAndMedia?.[0]?.url;
                    const hasSolution = !!problem.teamInfo?.solution;

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
                              <span className={`px-2 py-0.5 text-[10.5px] font-bold rounded-md ${
                                hasSolution ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {hasSolution ? 'PROTOTYPE READY' : 'IN DEVELOPMENT'}
                              </span>
                            </div>

                            <h4 className="font-bold text-[#2c4230] text-base mb-1.5 line-clamp-2 leading-snug group-hover:text-[#4a6b4e] transition-colors">
                              {problem.title || "Civic Challenge Statement"}
                            </h4>

                            <p className="text-xs text-[#556958] line-clamp-2 mb-3 leading-relaxed">
                              {problem.teamInfo?.solution?.description || problem.aiAnalysis?.summary || problem.description}
                            </p>

                            {problem.acceptedByUniversityName && (
                              <div className="p-2.5 bg-[#f4f1e1]/70 rounded-xl border border-[#e2ded0] text-xs text-[#3e4a36] mb-3 flex items-center gap-2">
                                <Building2 size={14} className="text-[#4a6b4e] shrink-0" />
                                <span className="truncate font-semibold">{problem.acceptedByUniversityName}</span>
                              </div>
                            )}

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
                                handleSolutionDecision(problem._id, 'accept');
                              }}
                              className="flex-1 py-2.5 bg-[#2c4230] hover:bg-[#1e2d21] text-[#f4f1e1] rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle size={14} className="text-[#a4c2a8]" /> Adopt Solution (CSR)
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
                                handleSolutionDecision(problem._id, 'reject');
                              }}
                              className="py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center"
                              title="Decline"
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

          {/* TAB 2: ADOPTED & COMMERCIALIZED INNOVATIONS */}
          {activeTab === 'accepted' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#2c4230]">Adopted Innovations & CSR Portfolio</h3>
                  <p className="text-xs text-[#556958]">
                    Innovations officially adopted and sponsored by {companyName} for production scaling, CSR funding, and field deployment.
                  </p>
                </div>
              </div>

              {acceptedLoading ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-[#e2ded0] text-[#556958]">
                  <Sparkles className="animate-spin mx-auto text-[#4a6b4e] mb-2" size={24} />
                  <span>Loading adopted portfolio...</span>
                </div>
              ) : acceptedSolutions.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-[#e2ded0] shadow-sm">
                  <Award className="mx-auto text-[#7d8c7c] mb-3" size={36} />
                  <h4 className="text-base font-bold text-[#2c4230] mb-1">No adopted innovations yet</h4>
                  <p className="text-xs text-[#556958] max-w-md mx-auto mb-4">
                    Review incoming student solutions in Tab 1 and click "Adopt Solution (CSR)" to add them to your commercialization portfolio.
                  </p>
                  <button
                    onClick={() => setActiveTab('allocated')}
                    className="px-4 py-2 bg-[#2c4230] text-[#f4f1e1] rounded-xl text-xs font-bold"
                  >
                    View Allocated Solutions
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {acceptedSolutions.map((problem) => {
                    const team = problem.teamInfo || {};
                    const sol = team.solution || {};

                    return (
                      <div 
                        key={problem._id} 
                        onClick={() => navigate(`/problem/${problem._id}`)}
                        className="bg-white rounded-3xl p-6 border border-[#e2ded0] hover:border-[#4a6b4e]/50 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-md flex items-center gap-1">
                              <CheckCircle size={13} /> ADOPTED BY {companyName.toUpperCase()}
                            </span>
                            <span className="text-xs font-bold text-[#4a6b4e] bg-[#4a6b4e]/10 px-2.5 py-0.5 rounded-full">
                              {problem.aiAnalysis?.problem_classification || 'Civic Infrastructure'}
                            </span>
                          </div>

                          <h4 className="font-bold text-base text-[#2c4230] mb-2 leading-snug group-hover:text-[#4a6b4e] transition-colors">
                            {problem.title || "Civic Challenge Problem"}
                          </h4>

                          <div className="p-3.5 bg-[#f4f1e1]/60 rounded-2xl border border-[#e2ded0] text-xs text-[#556958] space-y-1.5 mb-3">
                            <p><strong>R&D Institution:</strong> {problem.acceptedByUniversityName || 'Engineering College Partner'}</p>
                            {team.teamName && <p><strong>Innovation Team:</strong> {team.teamName}</p>}
                            {team.leaderName && <p><strong>Team Leader:</strong> {team.leaderName} ({team.leaderGender || 'Student'})</p>}
                          </div>

                          {/* Solution Brief */}
                          {sol.description && (
                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-2">
                              <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                                <CheckCircle size={15} /> Submitted Solution Technical Summary
                              </p>
                              <p className="text-xs leading-relaxed text-emerald-800/90">{sol.description}</p>
                              
                              <div className="flex flex-wrap gap-2 pt-1" onClick={e => e.stopPropagation()}>
                                {sol.docxLink && (
                                  <a 
                                    href={sol.docxLink} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="px-3 py-1 bg-white border border-emerald-300 rounded-lg font-bold text-[11px] text-emerald-800 hover:bg-emerald-100 inline-flex items-center gap-1 shadow-sm"
                                  >
                                    <FileText size={13} /> Technical Docs
                                  </a>
                                )}
                                {sol.demoVideoLink && (
                                  <a 
                                    href={sol.demoVideoLink} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="px-3 py-1 bg-white border border-emerald-300 rounded-lg font-bold text-[11px] text-emerald-800 hover:bg-emerald-100 inline-flex items-center gap-1 shadow-sm"
                                  >
                                    <Video size={13} /> Demo Video
                                  </a>
                                )}
                                {sol.prototypeLink && (
                                  <a 
                                    href={sol.prototypeLink} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="px-3 py-1 bg-white border border-emerald-300 rounded-lg font-bold text-[11px] text-emerald-800 hover:bg-emerald-100 inline-flex items-center gap-1 shadow-sm"
                                  >
                                    <ExternalLink size={13} /> Prototype Repo
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/problem/${problem._id}`);
                          }}
                          className="w-full py-2.5 bg-[#2c4230] hover:bg-[#1e2d21] text-[#f4f1e1] font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                        >
                          <Eye size={14} /> Open Full Problem Lifecycle Tracker
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* QUICK PREVIEW & DECISION MODAL */}
      {viewingProblemDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 border border-[#e2ded0] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#e2ded0] pb-4">
              <div>
                <span className="px-2.5 py-0.5 bg-[#2c4230] text-[#f9d877] text-xs font-black rounded-md uppercase tracking-wider mb-1.5 inline-block">
                  {viewingProblemDetails.aiAnalysis?.problem_classification || 'Civic Problem'}
                </span>
                <h3 className="text-xl font-extrabold text-[#2c4230] leading-snug">
                  {viewingProblemDetails.title}
                </h3>
              </div>
              <button 
                onClick={() => setViewingProblemDetails(null)}
                className="p-1 text-[#7d8c7c] hover:text-[#2c4230] rounded-full"
              >
                Γ£ò
              </button>
            </div>

            <div className="p-4 bg-[#f4f1e1]/60 rounded-2xl border border-[#e2ded0] text-xs text-[#556958] space-y-1">
              <p><strong>R&D Institution:</strong> {viewingProblemDetails.acceptedByUniversityName || 'Engineering College Partner'}</p>
              <p><strong>District:</strong> {viewingProblemDetails.location?.district || 'Ranchi'}, {viewingProblemDetails.location?.state || 'Jharkhand'}</p>
              {viewingProblemDetails.teamInfo?.teamName && (
                <p><strong>Student Team:</strong> {viewingProblemDetails.teamInfo.teamName} (Mentor: {viewingProblemDetails.teamInfo.mentorName})</p>
              )}
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-[#2c4230] block">Field Problem Statement:</label>
              <p className="text-[#4a5848] bg-[#f4f1e1]/40 p-3 rounded-xl border border-[#e2ded0] whitespace-pre-wrap leading-relaxed">
                {viewingProblemDetails.description}
              </p>
            </div>

            {viewingProblemDetails.teamInfo?.solution && (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-2">
                <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle size={15} /> Submitted Engineering Solution
                </p>
                <p className="leading-relaxed">{viewingProblemDetails.teamInfo.solution.description}</p>
              </div>
            )}

            <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#e2ded0]">
              <Link
                to={`/problem/${viewingProblemDetails._id}`}
                className="px-4 py-2 text-xs font-bold text-[#2c4230] bg-[#f4f1e1] hover:bg-[#e2ded0] rounded-xl flex items-center gap-1.5 border border-[#e2ded0]"
              >
                <ExternalLink size={14} /> Open Full Lifecycle Page
              </Link>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSolutionDecision(viewingProblemDetails._id, 'reject')}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition-all"
                >
                  Decline
                </button>
                <button
                  onClick={() => handleSolutionDecision(viewingProblemDetails._id, 'accept')}
                  className="px-5 py-2 bg-[#2c4230] hover:bg-[#1e2d21] text-[#f4f1e1] text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <CheckCircle size={15} className="text-[#a4c2a8]" /> Adopt Solution (CSR)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndustryDashboard;
