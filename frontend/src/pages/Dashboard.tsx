import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { FileText, AlertTriangle, CheckCircle, ChevronRight, Activity, TrendingUp, Sparkles, Leaf } from 'lucide-react';

const Dashboard = () => {
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('User');
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.name) setUserName(user.name);
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }

    const fetchProblems = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('https://sih-26-jarr.onrender.com/api/problems?my=true', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const data = await response.json();
        setProblems(data.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, [navigate]);

  const getSeverityColor = (severity: string) => {
    switch(severity?.toLowerCase()) {
      case 'critical': return 'bg-civic-critical-bg text-civic-critical border-civic-critical/20';
      case 'high': return 'bg-red-50 text-red-600 border-red-600/20';
      case 'medium': return 'bg-civic-medium-bg text-civic-medium border-civic-medium/20';
      default: return 'bg-civic-resolved-bg text-civic-resolved border-civic-resolved/20';
    }
  };

  const getSeverityGlow = (severity: string) => {
    switch(severity?.toLowerCase()) {
      case 'critical': return 'shadow-[0_0_10px_rgba(153,27,27,0.15)]';
      case 'high': return 'shadow-[0_0_10px_rgba(154,52,18,0.15)]';
      case 'medium': return 'shadow-[0_0_10px_rgba(146,64,14,0.15)]';
      default: return 'shadow-[0_0_10px_rgba(74,107,78,0.15)]';
    }
  };

  const resolvedCount = problems.filter(p => p.status === 'RESOLVED').length;
  const pendingCount = problems.length - resolvedCount;

  return (
    <div className="flex h-screen w-screen bg-civic-page font-inter text-civic-text-body overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto relative bg-civic-page">
        
        {/* Thematic Header Banner */}
        <div className="relative h-48 w-full shrink-0 overflow-hidden bg-civic-primary flex items-end pl-20 pr-10 md:px-10 pb-6 rounded-bl-3xl">
          {/* Subtle nature overlay pattern / gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-civic-primary-dark to-transparent opacity-80"></div>
          
          <div className="relative z-10 flex w-full justify-between items-end">
            <div className="flex flex-col text-white">
              <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2 mb-1 font-poppins">
                Welcome back, {userName.split(' ')[0]} <Leaf className="text-civic-primary-light animate-pulse" size={24} />
              </h2>
              <p className="text-sm font-medium text-civic-primary-soft flex items-center gap-1.5">
                <Sparkles size={14} className="text-yellow-300" />
                Here's a summary of your civic island.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/submit-problem')} className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-civic-primary-light hover:bg-civic-primary text-white text-sm font-bold rounded-xl shadow-sm border border-civic-primary transition-all hover:-translate-y-0.5 font-poppins">
                <Activity size={16} /> New Submission
              </button>
              <div className="w-14 h-14 rounded-full bg-white text-civic-primary flex items-center justify-center font-bold text-2xl shadow-sm ring-4 ring-civic-primary-light/50">
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section with Earthy Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 p-10 pb-6 z-10 relative -mt-8">
          <div className="group bg-civic-surface p-6 rounded-card shadow-civic-card border border-civic-border-subtle hover:border-civic-primary hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-civic-page rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 opacity-50"></div>
            <div className="flex items-start justify-between relative z-10">
              <div>
                <h3 className="text-xs font-bold text-civic-text-muted mb-1 uppercase tracking-widest">Total Submissions</h3>
                <p className="text-4xl font-bold text-civic-text-main font-poppins">{problems.length}</p>
              </div>
              <div className="p-4 bg-civic-page text-civic-primary rounded-2xl border border-civic-border-subtle group-hover:bg-civic-primary group-hover:text-white transition-colors duration-300">
                <FileText size={24} strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-civic-primary gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
              <TrendingUp size={14} /> View history <ChevronRight size={14} />
            </div>
          </div>
          
          <div className="group bg-civic-surface p-6 rounded-card shadow-civic-card border border-civic-border-subtle hover:border-civic-orange hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-civic-page rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 opacity-50"></div>
            <div className="flex items-start justify-between relative z-10">
              <div>
                <h3 className="text-xs font-bold text-civic-text-muted mb-1 uppercase tracking-widest">Pending Tasks</h3>
                <p className="text-4xl font-bold text-civic-orange font-poppins">{pendingCount}</p>
              </div>
              <div className="p-4 bg-orange-50 text-civic-orange rounded-2xl border border-orange-100 group-hover:bg-civic-orange group-hover:text-white transition-colors duration-300">
                <AlertTriangle size={24} strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-civic-orange gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
              Requires attention <ChevronRight size={14} />
            </div>
          </div>
          
          <div className="group bg-civic-surface p-6 rounded-card shadow-civic-card border border-civic-border-subtle hover:border-civic-resolved hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-civic-page rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 opacity-50"></div>
            <div className="flex items-start justify-between relative z-10">
              <div>
                <h3 className="text-xs font-bold text-civic-text-muted mb-1 uppercase tracking-widest">Resolved</h3>
                <p className="text-4xl font-bold text-civic-resolved font-poppins">{resolvedCount}</p>
              </div>
              <div className="p-4 bg-civic-resolved-bg text-civic-resolved rounded-2xl border border-civic-resolved/20 group-hover:bg-civic-resolved group-hover:text-white transition-colors duration-300">
                <CheckCircle size={24} strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-civic-resolved gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
              See resolved cases <ChevronRight size={14} />
            </div>
          </div>
        </section>

        {/* Main Feed Section */}
        <section className="px-10 pb-12 z-10 relative">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-civic-text-main font-poppins">Recent Activity</h3>
            <button onClick={() => navigate('/feed')} className="text-sm font-semibold text-civic-primary hover:text-civic-primary-dark flex items-center gap-1 transition-colors bg-white px-4 py-2 rounded-xl border border-civic-border-subtle shadow-sm hover:shadow">
              View all <ChevronRight size={16} />
            </button>
          </div>
          
          {loading ? (
            <div className="bg-civic-surface p-12 rounded-card text-center border border-civic-border-subtle flex flex-col items-center justify-center shadow-sm">
              <div className="w-12 h-12 border-4 border-civic-border-subtle border-t-civic-primary rounded-full animate-spin mb-4"></div>
              <p className="text-civic-text-muted font-bold tracking-wide">Gathering records...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-10 rounded-card text-center border border-red-200 flex flex-col items-center shadow-sm">
              <AlertTriangle className="text-red-500 mb-3" size={40} />
              <p className="text-red-600 font-bold">{error}</p>
            </div>
          ) : problems.length === 0 ? (
            <div className="bg-civic-surface p-12 rounded-card text-center border border-civic-border-subtle shadow-sm flex flex-col items-center">
              <div className="w-20 h-20 bg-civic-page rounded-full flex items-center justify-center mb-6 border border-civic-border-subtle">
                <Leaf className="text-civic-primary" size={32} />
              </div>
              <h4 className="text-xl font-bold text-civic-text-main mb-2 font-poppins">It's quiet here...</h4>
              <p className="text-civic-text-muted max-w-md mb-8 font-medium">You haven't submitted any civic problems yet. Help improve your community by planting the seeds of change!</p>
              <button onClick={() => navigate('/submit-problem')} className="px-6 py-3 bg-civic-primary hover:bg-civic-primary-dark text-white font-semibold rounded-xl shadow-sm transition-all hover:-translate-y-0.5">
                Submit Your First Problem
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {problems.map((problem, index) => (
                <div 
                  key={problem._id} 
                  className="group bg-civic-surface p-5 rounded-card shadow-sm border border-civic-border-subtle flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md hover:border-civic-primary transition-all duration-200 cursor-pointer animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => navigate(`/problem/${problem._id}`)}
                >
                  <div className="flex-1 w-full">
                    <div className="flex items-center justify-between md:justify-start gap-4 mb-2">
                      <h4 className="text-lg font-bold text-civic-text-main group-hover:text-civic-primary transition-colors line-clamp-1 font-poppins">{problem.title}</h4>
                      <span className="md:hidden px-3 py-1 text-xs font-semibold bg-civic-page text-civic-text-muted rounded-lg border border-civic-border-subtle">
                        {new Date(problem.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-civic-text-body line-clamp-2 leading-relaxed mb-4">{problem.description}</p>
                    
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-3 py-1.5 text-xs font-bold bg-civic-primary-soft text-civic-primary rounded-lg border border-civic-primary/20">
                        {problem.aiAnalysis?.problem_classification || 'Unclassified'}
                      </span>
                      <span className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${getSeverityColor(problem.aiAnalysis?.severity)} relative ${getSeverityGlow(problem.aiAnalysis?.severity)}`}>
                        {problem.aiAnalysis?.severity || 'UNKNOWN'} SEVERITY
                      </span>
                      <span className="hidden md:block text-xs font-semibold text-civic-text-muted ml-auto bg-civic-page px-3 py-1 rounded-lg border border-civic-border-subtle">
                        {new Date(problem.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="shrink-0 w-full md:w-auto flex items-center justify-between md:flex-col md:items-end gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-civic-border-subtle">
                    <span className={`px-4 py-2 text-xs font-bold uppercase rounded-xl tracking-wider w-full md:w-auto text-center border ${
                      problem.status === 'RESOLVED' 
                        ? 'bg-civic-resolved-bg text-civic-resolved border-civic-resolved/20' 
                        : problem.status === 'IN_PROGRESS'
                          ? 'bg-blue-50 text-civic-blue border-blue-200'
                          : 'bg-civic-page text-civic-text-muted border-civic-border-subtle'
                    }`}>
                      {problem.status || 'SUBMITTED'}
                    </span>
                    <div className="hidden md:flex items-center gap-1 text-xs font-bold text-civic-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      Open <ChevronRight size={14} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
