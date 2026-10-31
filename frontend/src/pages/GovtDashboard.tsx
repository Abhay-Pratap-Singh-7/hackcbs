import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle,
  Clock,
  Factory,
  GraduationCap,
  Sparkles,
  Users,
  MapPin
} from 'lucide-react';

const GovtDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState('');

  // Top level stats
  const [stats, setStats] = useState({
    totalProblems: 0,
    totalAdopted: 0,
    totalSolutions: 0,
    totalIndustryAllocated: 0
  });

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || user.role !== 'GOVT_OFFICER') {
      navigate('/login');
      return;
    }

    fetchMasterDashboard(token);
  }, [navigate]);

  const fetchMasterDashboard = async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch('https://hackcbs-cjno.onrender.com/api/govt/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      let resData;
      try {
        resData = await res.json();
      } catch (e) {
        throw new Error('Server returned an invalid response (502/504). The backend might be asleep.');
      }

      if (!res.ok) {
        throw new Error(resData.message || 'Failed to fetch Master Dashboard data.');
      }

      const problems = resData.data || [];
      setData(problems);
      calculateStats(problems);
    } catch (err: any) {
      console.warn("API Error:", err.message);
      setError(err.message);
      
      // MOCK FALLBACK for UI Testing if API is down
      const mockProblems = generateMockData();
      setData(mockProblems);
      calculateStats(mockProblems);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (problems: any[]) => {
    let adopted = 0;
    let solutions = 0;
    let industryAllocated = 0;

    problems.forEach(p => {
      if (p.tracking?.isAcceptedByUniversity) adopted++;
      if (p.tracking?.totalSolutionsSubmitted > 0) solutions += p.tracking.totalSolutionsSubmitted;
      p.tracking?.teams?.forEach((t: any) => {
        if (t.industryAllocation?.status === 'ACCEPTED' || t.industryAllocation?.status === 'PENDING') {
          industryAllocated++;
        }
      });
    });

    setStats({
      totalProblems: problems.length,
      totalAdopted: adopted,
      totalSolutions: solutions,
      totalIndustryAllocated: industryAllocated
    });
  };

  const generateMockData = () => {
    return [
      {
        _id: 'mock-1',
        title: 'Severe Water Logging in Main Market',
        description: 'The main market area gets flooded during every monsoon, disrupting local businesses for days.',
        aiAnalysis: {
          problem_classification: 'Water & Sanitation',
          severity: 'CRITICAL',
          summary: 'Urban drainage failure leading to severe economic and civic disruption.'
        },
        status: 'IN_PROGRESS',
        tracking: {
          isAcceptedByUniversity: true,
          acceptedByUniversityName: 'NIT Jamshedpur',
          totalTeamsRegistered: 2,
          totalSolutionsSubmitted: 1,
          teams: [
            {
              teamName: 'Hydro Innovators',
              leaderName: 'Anita Sharma',
              hasSubmittedSolution: true,
              solutionDetails: {
                submittedAt: new Date().toISOString(),
              },
              industryAllocation: {
                companyName: 'L&T Infrastructure',
                status: 'PENDING'
              }
            },
            {
              teamName: 'Civic Builders',
              leaderName: 'Rahul Verma',
              hasSubmittedSolution: false
            }
          ]
        }
      },
      {
        _id: 'mock-2',
        title: 'Broken Street Lights on Ring Road',
        description: 'Street lights have been non-functional for 3 months causing safety issues.',
        aiAnalysis: {
          problem_classification: 'Infrastructure & Safety',
          severity: 'HIGH',
          summary: 'Non-functional street lighting on major arterial road.'
        },
        status: 'CLASSIFIED',
        tracking: {
          isAcceptedByUniversity: false,
          acceptedByUniversityName: null,
          totalTeamsRegistered: 0,
          totalSolutionsSubmitted: 0,
          teams: []
        }
      }
    ];
  };

  const getSeverityBadge = (severity?: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'bg-civic-critical-bg text-civic-critical border-civic-critical/20';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'MEDIUM': return 'bg-civic-medium-bg text-civic-medium border-civic-medium/20';
      case 'LOW': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex bg-civic-page min-h-screen font-inter">
      <Sidebar />

      <main className="flex-1 overflow-y-auto relative pb-12">
        {/* Header */}
        <header className="bg-civic-primary-dark pt-12 pb-24 px-8 relative overflow-hidden shrink-0 shadow-md">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 max-w-7xl mx-auto">
            <div>
              <div className="flex items-center gap-2 text-civic-surface/80 text-xs font-bold uppercase tracking-wider mb-2 font-poppins">
                <Building2 size={16} />
                <span>Government Master Portal</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white font-poppins">Lifecycle Tracking Dashboard</h1>
              <p className="text-civic-surface/80 text-sm mt-2 max-w-2xl">
                Monitor the real-time progression of civic challenges from citizen submission to university prototyping and final industry implementation.
              </p>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20 space-y-8">
          
          {/* Error Banner */}
          {error && (
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-card shadow-sm flex items-start gap-3">
              <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="text-sm font-bold text-orange-800">Live API Error</h3>
                <p className="text-xs text-orange-700 mt-1">{error}</p>
                <p className="text-xs font-semibold text-orange-800 mt-2">MOCK DATA is currently being displayed for demonstration purposes.</p>
              </div>
            </div>
          )}

          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-civic-surface p-6 rounded-card shadow-civic-card border border-civic-border">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Activity size={24} />
                </div>
              </div>
              <p className="text-sm text-civic-text-muted font-bold uppercase tracking-wide">Total Submissions</p>
              <p className="text-3xl font-bold font-poppins text-civic-text-main mt-1">{stats.totalProblems}</p>
            </div>

            <div className="bg-civic-surface p-6 rounded-card shadow-civic-card border border-civic-border">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <GraduationCap size={24} />
                </div>
              </div>
              <p className="text-sm text-civic-text-muted font-bold uppercase tracking-wide">University Adopted</p>
              <p className="text-3xl font-bold font-poppins text-civic-text-main mt-1">{stats.totalAdopted}</p>
            </div>

            <div className="bg-civic-surface p-6 rounded-card shadow-civic-card border border-civic-border">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Sparkles size={24} />
                </div>
              </div>
              <p className="text-sm text-civic-text-muted font-bold uppercase tracking-wide">Solutions Built</p>
              <p className="text-3xl font-bold font-poppins text-civic-text-main mt-1">{stats.totalSolutions}</p>
            </div>

            <div className="bg-civic-surface p-6 rounded-card shadow-civic-card border border-civic-border">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                  <Factory size={24} />
                </div>
              </div>
              <p className="text-sm text-civic-text-muted font-bold uppercase tracking-wide">Industry Accepted</p>
              <p className="text-3xl font-bold font-poppins text-civic-text-main mt-1">{stats.totalIndustryAllocated}</p>
            </div>
          </div>

          {/* Main Lifecycle Feed */}
          {loading ? (
            <div className="text-center py-20">
              <Sparkles className="animate-spin mx-auto text-civic-primary mb-4" size={32} />
              <p className="text-civic-text-body font-bold text-sm">Fetching Master Analytics...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-xl font-bold font-poppins text-civic-text-main flex items-center gap-2">
                <MapPin size={24} className="text-civic-primary" /> Comprehensive Tracking
              </h2>

              {data.length === 0 ? (
                <div className="bg-civic-surface p-12 text-center rounded-card border border-civic-border shadow-civic-card">
                  <Activity size={48} className="mx-auto text-civic-text-muted mb-4 opacity-50" />
                  <h3 className="text-lg font-bold font-poppins text-civic-text-main mb-2">No Civic Problems Found</h3>
                  <p className="text-sm text-civic-text-body">The system has not received any classified problems yet.</p>
                </div>
              ) : (
                data.map((problem) => (
                  <div key={problem._id} className="bg-civic-surface rounded-card border border-civic-border shadow-civic-card overflow-hidden">
                    {/* Problem Header */}
                    <div className="p-6 border-b border-civic-border bg-slate-50/50">
                      <div className="flex flex-wrap gap-2 items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md border ${getSeverityBadge(problem.aiAnalysis?.severity)}`}>
                            {problem.aiAnalysis?.severity || 'NORMAL'}
                          </span>
                          <span className="px-2.5 py-1 bg-civic-primary-soft text-civic-primary text-[10px] font-bold rounded-md border border-civic-primary/20">
                            {problem.aiAnalysis?.problem_classification || 'General'}
                          </span>
                        </div>
                        <span className="px-3 py-1 bg-slate-800 text-white text-[11px] font-bold rounded-full shadow-sm">
                          {problem.status || 'SUBMITTED'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold font-poppins text-civic-text-main mb-2">{problem.title}</h3>
                      <p className="text-sm text-civic-text-body leading-relaxed">{problem.aiAnalysis?.summary || problem.description}</p>
                    </div>

                    {/* Lifecycle Pipeline */}
                    <div className="p-6">
                      <h4 className="text-xs font-bold text-civic-text-muted uppercase tracking-wider mb-6">Resolution Pipeline</h4>
                      
                      <div className="relative pl-6 border-l-2 border-slate-200 space-y-8">
                        
                        {/* Step 1: University Adoption */}
                        <div className="relative">
                          <div className={`absolute -left-[35px] w-6 h-6 rounded-full border-4 border-civic-surface flex items-center justify-center ${problem.tracking?.isAcceptedByUniversity ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                            {problem.tracking?.isAcceptedByUniversity && <CheckCircle size={12} className="text-white" />}
                          </div>
                          <div>
                            <h5 className={`text-sm font-bold font-poppins ${problem.tracking?.isAcceptedByUniversity ? 'text-civic-text-main' : 'text-civic-text-muted'}`}>
                              University Adoption
                            </h5>
                            {problem.tracking?.isAcceptedByUniversity ? (
                              <p className="text-xs text-civic-text-body mt-1">
                                Adopted by <span className="font-bold text-indigo-700">{problem.tracking.acceptedByUniversityName}</span>
                              </p>
                            ) : (
                              <p className="text-xs text-civic-text-muted mt-1">Pending AI allocation or university acceptance.</p>
                            )}
                          </div>
                        </div>

                        {/* Step 2: Student Prototyping */}
                        <div className="relative">
                          <div className={`absolute -left-[35px] w-6 h-6 rounded-full border-4 border-civic-surface flex items-center justify-center ${problem.tracking?.totalTeamsRegistered > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                            {problem.tracking?.totalTeamsRegistered > 0 && <CheckCircle size={12} className="text-white" />}
                          </div>
                          <div>
                            <h5 className={`text-sm font-bold font-poppins ${problem.tracking?.totalTeamsRegistered > 0 ? 'text-civic-text-main' : 'text-civic-text-muted'}`}>
                              Student Prototyping
                            </h5>
                            
                            {problem.tracking?.totalTeamsRegistered > 0 ? (
                              <div className="mt-3 space-y-3">
                                {problem.tracking.teams.map((team: any, idx: number) => (
                                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <Users size={16} className="text-slate-500" />
                                        <span className="text-sm font-bold text-civic-text-main">{team.teamName}</span>
                                      </div>
                                      {team.hasSubmittedSolution ? (
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md">Solution Submitted</span>
                                      ) : (
                                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-bold rounded-md flex items-center gap-1"><Clock size={10} /> Prototyping</span>
                                      )}
                                    </div>
                                    <p className="text-xs text-civic-text-muted">Leader: {team.leaderName}</p>
                                    
                                    {/* Sub-step: Industry Allocation within Team */}
                                    {team.hasSubmittedSolution && (
                                      <div className="mt-3 pt-3 border-t border-slate-200 flex items-start gap-2">
                                        <Factory size={14} className="text-orange-500 mt-0.5 shrink-0" />
                                        <div>
                                          <p className="text-xs text-civic-text-main font-semibold">Industry Partner: {team.industryAllocation?.companyName || 'Awaiting ML Assignment'}</p>
                                          {team.industryAllocation && (
                                            <p className={`text-[10px] font-bold uppercase mt-1 ${
                                              team.industryAllocation.status === 'ACCEPTED' ? 'text-emerald-600' : 
                                              team.industryAllocation.status === 'REJECTED' ? 'text-red-600' : 'text-orange-600'
                                            }`}>
                                              Status: {team.industryAllocation.status}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-civic-text-muted mt-1">No student teams have registered for this problem yet.</p>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default GovtDashboard;
