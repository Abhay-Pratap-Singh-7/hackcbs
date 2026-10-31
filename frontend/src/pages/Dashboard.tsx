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
      case 'critical': return 'bg-red-900/10 text-red-800 border-red-900/20';
      case 'high': return 'bg-orange-900/10 text-orange-800 border-orange-900/20';
      case 'medium': return 'bg-amber-900/10 text-amber-800 border-amber-900/20';
      default: return 'bg-[#4a6b4e]/10 text-[#4a6b4e] border-[#4a6b4e]/20';
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
    <div className="flex h-screen w-screen bg-[#f4f1e1] font-sans text-[#3e4a36] overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto relative bg-[#f4f1e1]">
        
        {/* Thematic Header Banner */}
        <div className="relative h-48 w-full shrink-0 overflow-hidden bg-[#4a6b4e] flex items-end px-10 pb-6 rounded-bl-3xl">
          {/* Subtle nature overlay pattern / gradient */}
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#2c4230] to-transparent opacity-80"></div>
          
          <div className="relative z-10 flex w-full justify-between items-end">
            <div className="flex flex-col text-[#f4f1e1]">
              <h2 className="text-3xl font-black tracking-tight flex items-center gap-2 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                Welcome back, {userName.split(' ')[0]} <Leaf className="text-[#a4c2a8] animate-pulse" size={24} />
              </h2>
              <p className="text-sm font-medium text-[#c0d4c3] flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#f9d877]" />
                Here's a summary of your civic island.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/submit-problem')} className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-[#8b9e7b] hover:bg-[#6c825a] text-white text-sm font-bold rounded-xl shadow-lg border border-[#a4c2a8]/30 transition-all hover:-translate-y-0.5">
                <Activity size={16} /> New Submission
              </button>
              <div className="w-14 h-14 rounded-full bg-[#f4f1e1] text-[#2c4230] flex items-center justify-center font-bold text-2xl shadow-lg ring-4 ring-[#8b9e7b]/50">
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section with Earthy Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 p-10 pb-6 z-10 relative -mt-8">
          <div className="group bg-[#fffdf2] p-6 rounded-3xl shadow-md border-2 border-[#e6dec8] hover:border-[#a4c2a8] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#f4f1e1] rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 opacity-50"></div>
            <div className="flex items-start justify-between relative z-10">
              <div>
                <h3 className="text-xs font-bold text-[#8b7e6a] mb-1 uppercase tracking-widest">Total Submissions</h3>
                <p className="text-4xl font-black text-[#2c4230]" style={{ fontFamily: 'Georgia, serif' }}>{problems.length}</p>
              </div>
              <div className="p-4 bg-[#f4f1e1] text-[#6c825a] rounded-2xl border border-[#e6dec8] group-hover:bg-[#6c825a] group-hover:text-[#fffdf2] transition-colors duration-300">
                <FileText size={24} strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-[#6c825a] gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
              <TrendingUp size={14} /> View history <ChevronRight size={14} />
            </div>
          </div>
          
          <div className="group bg-[#fffdf2] p-6 rounded-3xl shadow-md border-2 border-[#e6dec8] hover:border-[#cda483] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#f4f1e1] rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 opacity-50"></div>
            <div className="flex items-start justify-between relative z-10">
              <div>
                <h3 className="text-xs font-bold text-[#8b7e6a] mb-1 uppercase tracking-widest">Pending Tasks</h3>
                <p className="text-4xl font-black text-[#8c593b]" style={{ fontFamily: 'Georgia, serif' }}>{pendingCount}</p>
              </div>
              <div className="p-4 bg-[#fdf6f0] text-[#8c593b] rounded-2xl border border-[#eedcca] group-hover:bg-[#8c593b] group-hover:text-[#fffdf2] transition-colors duration-300">
                <AlertTriangle size={24} strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-[#8c593b] gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
              Requires attention <ChevronRight size={14} />
            </div>
          </div>
          
          <div className="group bg-[#fffdf2] p-6 rounded-3xl shadow-md border-2 border-[#e6dec8] hover:border-[#8b9e7b] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#f4f1e1] rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 opacity-50"></div>
            <div className="flex items-start justify-between relative z-10">
              <div>
                <h3 className="text-xs font-bold text-[#8b7e6a] mb-1 uppercase tracking-widest">Resolved</h3>
                <p className="text-4xl font-black text-[#4a6b4e]" style={{ fontFamily: 'Georgia, serif' }}>{resolvedCount}</p>
              </div>
              <div className="p-4 bg-[#f0f4f1] text-[#4a6b4e] rounded-2xl border border-[#dce6de] group-hover:bg-[#4a6b4e] group-hover:text-[#fffdf2] transition-colors duration-300">
                <CheckCircle size={24} strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-[#4a6b4e] gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
              See resolved cases <ChevronRight size={14} />
            </div>
          </div>
        </section>

        {/* Main Feed Section */}
        <section className="px-10 pb-12 z-10 relative">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black text-[#2c4230]" style={{ fontFamily: 'Georgia, serif' }}>Recent Activity</h3>
            <button onClick={() => navigate('/feed')} className="text-sm font-bold text-[#6c825a] hover:text-[#4a6b4e] flex items-center gap-1 transition-colors bg-[#fffdf2] px-4 py-2 rounded-xl border border-[#e6dec8] shadow-sm hover:shadow">
              View all <ChevronRight size={16} />
            </button>
          </div>
          
          {loading ? (
            <div className="bg-[#fffdf2] p-12 rounded-3xl text-center border-2 border-[#e6dec8] flex flex-col items-center justify-center shadow-sm">
              <div className="w-12 h-12 border-4 border-[#dce6de] border-t-[#4a6b4e] rounded-full animate-spin mb-4"></div>
              <p className="text-[#8b7e6a] font-bold tracking-wide">Gathering records...</p>
            </div>
          ) : error ? (
            <div className="bg-[#fff6f5] p-10 rounded-3xl text-center border-2 border-[#f0cdcc] flex flex-col items-center shadow-sm">
              <AlertTriangle className="text-[#a83232] mb-3" size={40} />
              <p className="text-[#a83232] font-bold">{error}</p>
            </div>
          ) : problems.length === 0 ? (
            <div className="bg-[#fffdf2] p-12 rounded-3xl text-center border-2 border-[#e6dec8] shadow-sm flex flex-col items-center">
              <div className="w-20 h-20 bg-[#f4f1e1] rounded-full flex items-center justify-center mb-6 border border-[#e6dec8]">
                <Leaf className="text-[#8b9e7b]" size={32} />
              </div>
              <h4 className="text-xl font-black text-[#2c4230] mb-2" style={{ fontFamily: 'Georgia, serif' }}>It's quiet here...</h4>
              <p className="text-[#8b7e6a] max-w-md mb-8 font-medium">You haven't submitted any civic problems yet. Help improve your community by planting the seeds of change!</p>
              <button onClick={() => navigate('/submit-problem')} className="px-6 py-3 bg-[#6c825a] hover:bg-[#4a6b4e] text-white font-bold rounded-xl shadow-md border border-[#4a6b4e] transition-all hover:-translate-y-0.5">
                Submit Your First Problem
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {problems.map((problem, index) => (
                <div 
                  key={problem._id} 
                  className="group bg-[#fffdf2] p-5 rounded-2xl shadow-sm border-2 border-[#e6dec8] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md hover:border-[#a4c2a8] transition-all duration-300 cursor-pointer animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => navigate(`/problem/${problem._id}`)}
                >
                  <div className="flex-1 w-full">
                    <div className="flex items-center justify-between md:justify-start gap-4 mb-2">
                      <h4 className="text-lg font-bold text-[#2c4230] group-hover:text-[#4a6b4e] transition-colors line-clamp-1">{problem.title}</h4>
                      <span className="md:hidden px-3 py-1 text-xs font-bold bg-[#f4f1e1] text-[#8b7e6a] rounded-lg border border-[#e6dec8]">
                        {new Date(problem.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-[#5a6154] line-clamp-2 leading-relaxed mb-4">{problem.description}</p>
                    
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-3 py-1.5 text-xs font-bold bg-[#f4f1e1] text-[#6c825a] rounded-lg border border-[#e6dec8]">
                        {problem.aiAnalysis?.problem_classification || 'Unclassified'}
                      </span>
                      <span className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${getSeverityColor(problem.aiAnalysis?.severity)} relative ${getSeverityGlow(problem.aiAnalysis?.severity)}`}>
                        {problem.aiAnalysis?.severity || 'UNKNOWN'} SEVERITY
                      </span>
                      <span className="hidden md:block text-xs font-bold text-[#8b7e6a] ml-auto bg-[#f4f1e1] px-3 py-1 rounded-lg border border-[#e6dec8]">
                        {new Date(problem.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="shrink-0 w-full md:w-auto flex items-center justify-between md:flex-col md:items-end gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-[#e6dec8]">
                    <span className={`px-4 py-2 text-xs font-black uppercase rounded-xl tracking-wider w-full md:w-auto text-center border-2 ${
                      problem.status === 'RESOLVED' 
                        ? 'bg-[#f0f4f1] text-[#4a6b4e] border-[#dce6de]' 
                        : problem.status === 'IN_PROGRESS'
                          ? 'bg-[#f0f6fa] text-[#406882] border-[#dcebf5]'
                          : 'bg-[#f4f1e1] text-[#8b7e6a] border-[#e6dec8]'
                    }`}>
                      {problem.status || 'SUBMITTED'}
                    </span>
                    <div className="hidden md:flex items-center gap-1 text-xs font-black text-[#6c825a] opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
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
