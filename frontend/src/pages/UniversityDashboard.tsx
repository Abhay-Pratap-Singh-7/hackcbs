import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Building, CheckCircle, XCircle, AlertCircle, BarChart2, MapPin, ShieldCheck, Filter, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UniversityDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [allocatedProblems, setAllocatedProblems] = useState<any[]>([]);
  const [acceptedProblems, setAcceptedProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'allocated' | 'accepted'>('allocated');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDashboardData = async (token: string) => {
    try {
      setLoading(true);
      // Fetch Stats
      const statsRes = await fetch('https://sih-26-jarr.onrender.com/api/university/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData);

      // Fetch Allocated
      const allocatedRes = await fetch('https://sih-26-jarr.onrender.com/api/university/allocated-problems', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allocatedData = await allocatedRes.json();
      if (allocatedData.success) setAllocatedProblems(allocatedData.data);

      // Fetch Accepted
      const acceptedRes = await fetch('https://sih-26-jarr.onrender.com/api/university/accepted-problems', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const acceptedData = await acceptedRes.json();
      if (acceptedData.success) setAcceptedProblems(acceptedData.data);
      
    } catch (err) {
      console.error("Failed to fetch university data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    if (!userData || !token) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'INSTITUTE_ADMIN') {
      navigate('/dashboard');
      return;
    }
    setUser(parsedUser);
    fetchDashboardData(token);
  }, [navigate]);

  const handleAction = async (id: string, action: 'accept' | 'reject') => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    
    setActionLoading(id);
    try {
      const res = await fetch(`https://sih-26-jarr.onrender.com/api/university/problems/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        // Refresh data
        fetchDashboardData(token);
      }
    } catch (err) {
      console.error(`Failed to ${action} problem`, err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-civic-page font-inter text-civic-text-body">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto relative bg-civic-page">
        <header className="sticky top-0 z-20 flex flex-col gap-4 pl-20 pr-10 md:px-10 py-6 bg-civic-surface/80 backdrop-blur-md border-b border-civic-border-subtle shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-civic-text-main m-0 font-poppins">University Portal</h2>
              <p className="text-sm font-medium text-civic-text-muted mt-1">Manage allocated civic problems and track resolutions.</p>
            </div>
            {user && (
              <div className="hidden md:flex items-center gap-3 bg-civic-page px-4 py-2 rounded-xl border border-civic-border-subtle">
                <Building size={20} className="text-civic-primary" />
                <span className="font-bold text-civic-text-main text-sm">{user.profileDetails?.institutionName}</span>
              </div>
            )}
          </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto w-full flex-1 flex flex-col">
          
          {loading ? (
             <div className="flex justify-center items-center py-20">
               <div className="w-10 h-10 border-4 border-civic-border-subtle border-t-civic-primary rounded-full animate-spin"></div>
             </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-civic-surface p-6 rounded-card border border-civic-border-subtle shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-civic-text-muted font-bold text-sm uppercase tracking-wide">Total Allocated</p>
                      <h3 className="text-4xl font-bold text-civic-text-main font-poppins mt-2">{stats?.stats?.totalAllocatedProblems || 0}</h3>
                    </div>
                    <div className="p-3 bg-civic-primary-soft text-civic-primary rounded-xl">
                      <BarChart2 size={24} />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-civic-text-muted">Problems waiting for your review</p>
                </div>

                <div className="bg-civic-surface p-6 rounded-card border border-civic-border-subtle shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-civic-text-muted font-bold text-sm uppercase tracking-wide">High Severity</p>
                      <h3 className="text-4xl font-bold text-civic-text-main font-poppins mt-2">
                        {stats?.stats?.bySeverity?.find((s: any) => s._id === 'high')?.count || 0}
                      </h3>
                    </div>
                    <div className="p-3 bg-civic-critical-bg text-civic-critical rounded-xl border border-civic-critical/20">
                      <AlertTriangle size={24} />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-civic-text-muted">Requires immediate attention</p>
                </div>

                <div className="bg-civic-surface p-6 rounded-card border border-civic-border-subtle shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-civic-text-muted font-bold text-sm uppercase tracking-wide">Accepted Projects</p>
                      <h3 className="text-4xl font-bold text-civic-text-main font-poppins mt-2">{acceptedProblems.length}</h3>
                    </div>
                    <div className="p-3 bg-civic-success-bg text-civic-success rounded-xl border border-civic-success/20">
                      <ShieldCheck size={24} />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-civic-text-muted">Currently active under your university</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-4 border-b border-civic-border-subtle mb-8">
                <button 
                  onClick={() => setActiveTab('allocated')}
                  className={`pb-4 px-2 font-bold transition-all border-b-2 flex items-center gap-2 ${activeTab === 'allocated' ? 'border-civic-primary text-civic-primary' : 'border-transparent text-civic-text-muted hover:text-civic-text-main'}`}
                >
                  <Filter size={18} /> Allocated Pending Review 
                  <span className="bg-civic-primary-soft text-civic-primary px-2 py-0.5 rounded-full text-xs">{allocatedProblems.length}</span>
                </button>
                <button 
                  onClick={() => setActiveTab('accepted')}
                  className={`pb-4 px-2 font-bold transition-all border-b-2 flex items-center gap-2 ${activeTab === 'accepted' ? 'border-civic-primary text-civic-primary' : 'border-transparent text-civic-text-muted hover:text-civic-text-main'}`}
                >
                  <ShieldCheck size={18} /> Accepted Projects
                  <span className="bg-civic-success-bg text-civic-success border border-civic-success/20 px-2 py-0.5 rounded-full text-xs">{acceptedProblems.length}</span>
                </button>
              </div>

              {/* List Content */}
              {activeTab === 'allocated' && (
                <div className="flex flex-col gap-6">
                  {allocatedProblems.length === 0 ? (
                    <div className="text-center py-16 bg-civic-surface rounded-card border border-civic-border-subtle">
                      <CheckCircle size={48} className="mx-auto text-civic-border-subtle mb-4" />
                      <h3 className="text-xl font-bold text-civic-text-main font-poppins mb-2">All caught up!</h3>
                      <p className="text-civic-text-muted">There are no pending allocated problems for your university.</p>
                    </div>
                  ) : (
                    allocatedProblems.map((problem) => (
                      <div key={problem._id} className="bg-civic-surface rounded-card border border-civic-border-subtle shadow-sm p-6 md:p-8 flex flex-col lg:flex-row gap-8">
                        <div className="flex-1">
                           <div className="flex items-center gap-3 mb-3">
                             <span className="px-3 py-1 bg-civic-page text-civic-primary font-bold text-xs uppercase tracking-wide rounded-md border border-civic-border-subtle">
                               {problem.aiAnalysis?.problem_classification || 'General'}
                             </span>
                             {problem.aiAnalysis?.severity?.toLowerCase() === 'high' && (
                               <span className="px-3 py-1 bg-civic-critical-bg text-civic-critical font-bold text-xs uppercase tracking-wide rounded-md border border-civic-critical/20 flex items-center gap-1">
                                 <AlertCircle size={14}/> High Severity
                               </span>
                             )}
                           </div>
                           <h3 className="text-2xl font-bold text-civic-text-main font-poppins mb-4">{problem.title}</h3>
                           <p className="text-civic-text-body leading-relaxed mb-6 line-clamp-2">{problem.description}</p>
                           
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-civic-page rounded-xl border border-civic-border-subtle">
                             <div>
                               <p className="text-xs font-bold text-civic-text-muted uppercase mb-1">Match Score</p>
                               <p className="text-lg font-bold text-civic-success">{problem.allocationDetails?.match_score?.toFixed(1)}%</p>
                             </div>
                             <div>
                               <p className="text-xs font-bold text-civic-text-muted uppercase mb-1">Distance</p>
                               <p className="text-lg font-bold text-civic-text-main">{problem.allocationDetails?.distance_km?.toFixed(1)} km</p>
                             </div>
                             <div className="col-span-2">
                               <p className="text-xs font-bold text-civic-text-muted uppercase mb-1">Location</p>
                               <p className="text-sm font-medium text-civic-text-main flex items-center gap-1 mt-1 truncate"><MapPin size={16} className="text-civic-primary"/> {problem.location?.district}, {problem.location?.state}</p>
                             </div>
                           </div>
                        </div>
                        
                        <div className="w-full lg:w-72 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-civic-border-subtle pt-6 lg:pt-0 lg:pl-8">
                           <p className="text-sm font-bold text-civic-text-muted mb-4 text-center lg:text-left">Does your university want to take up this problem?</p>
                           <button 
                             onClick={() => handleAction(problem._id, 'accept')}
                             disabled={actionLoading === problem._id}
                             className="w-full bg-civic-primary hover:bg-civic-primary-dark text-white font-bold py-3 px-4 rounded-xl shadow-sm transition-all mb-3 flex items-center justify-center gap-2"
                           >
                             <CheckCircle size={20} /> Accept Project
                           </button>
                           <button 
                             onClick={() => handleAction(problem._id, 'reject')}
                             disabled={actionLoading === problem._id}
                             className="w-full bg-civic-page hover:bg-civic-critical-bg text-civic-text-main hover:text-civic-critical font-bold py-3 px-4 rounded-xl transition-all border border-civic-border-subtle hover:border-civic-critical/30 flex items-center justify-center gap-2"
                           >
                             <XCircle size={20} /> Reject Match
                           </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'accepted' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {acceptedProblems.length === 0 ? (
                    <div className="col-span-full text-center py-16 bg-civic-surface rounded-card border border-civic-border-subtle">
                      <ShieldCheck size={48} className="mx-auto text-civic-border-subtle mb-4" />
                      <h3 className="text-xl font-bold text-civic-text-main font-poppins mb-2">No active projects</h3>
                      <p className="text-civic-text-muted">When you accept an allocated problem, it will appear here.</p>
                    </div>
                  ) : (
                    acceptedProblems.map((problem) => (
                      <div key={problem._id} className="bg-civic-surface rounded-card border border-civic-border-subtle shadow-sm overflow-hidden flex flex-col">
                        {problem.imagesAndMedia && problem.imagesAndMedia.length > 0 && (
                           <div className="h-40 w-full bg-civic-page border-b border-civic-border-subtle">
                             <img src={problem.imagesAndMedia[0].url} alt="Evidence" className="w-full h-full object-cover" />
                           </div>
                        )}
                        <div className="p-6 flex flex-col flex-1">
                          <h3 className="text-xl font-bold text-civic-text-main font-poppins mb-2 line-clamp-2">{problem.title}</h3>
                          <div className="flex items-center gap-2 mt-auto pt-4 text-civic-success font-bold text-sm border-t border-civic-border-subtle">
                            <ShieldCheck size={18} /> Accepted by {user?.profileDetails?.institutionName}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  );
};

export default UniversityDashboard;
