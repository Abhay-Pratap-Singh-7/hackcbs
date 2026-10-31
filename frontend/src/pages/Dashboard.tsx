import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  ChevronRight, 
  Activity, 
  TrendingUp, 
  Sparkles, 
  Leaf, 
  MapPin, 
  Building2, 
  PlusCircle, 
  ShieldCheck, 
  ThumbsUp,
  ImageOff
} from 'lucide-react';

// Reusable Card Evidence Image with fallback on missing or broken images
const CardEvidenceImage = ({ url }: { url?: string }) => {
  const [hasError, setHasError] = useState(false);
  const isValidUrl = url && typeof url === 'string' && url.trim().length > 0 && !url.includes('placeholder.com') && !url.includes('via.placeholder');

  if (!isValidUrl || hasError) {
    return (
      <div className="w-full h-full bg-[#ede8d8] flex flex-col items-center justify-center text-[#7d8c7c] text-xs font-semibold gap-1.5 select-none">
        <ImageOff size={22} className="text-[#a4b3a4]" />
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

const Dashboard = () => {
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('Citizen');
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

  const getSeverityBadge = (severity: string) => {
    switch(severity?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-[#4a6b4e]/10 text-[#4a6b4e] border-[#4a6b4e]/20';
    }
  };

  const resolvedCount = problems.filter(p => p.status === 'RESOLVED' || p.status === 'DEPLOYED').length;
  const inProgressCount = problems.filter(p => p.status === 'IN_PROGRESS' || p.status === 'PROTOTYPING' || p.status === 'ALLOCATED' || p.status === 'ACCEPTED').length;

  return (
    <div className="flex h-screen w-screen bg-[#f4f1e1] font-sans text-[#2c4230] overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto relative bg-[#f4f1e1]">
        
        {/* Thematic Header Banner */}
        <div className="relative h-48 w-full shrink-0 overflow-hidden bg-[#4a6b4e] flex items-end px-8 sm:px-10 pb-6 rounded-bl-3xl shadow-sm">
          {/* Subtle nature overlay pattern / gradient */}
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#2c4230] to-transparent opacity-80"></div>
          
          <div className="relative z-10 flex w-full justify-between items-end">
            <div className="flex flex-col text-[#f4f1e1]">
              <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 mb-1">
                Welcome back, {userName.split(' ')[0]} <Leaf className="text-[#a4c2a8] animate-pulse" size={24} />
              </h2>
              <p className="text-sm font-medium text-[#c0d4c3] flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#f9d877]" />
                Jharkhand Civic Action Portal • Transforming citizen voice into university R&D solutions
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <Link 
                to="/explore" 
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-[#f4f1e1] backdrop-blur-md border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <MapPin size={14} /> Explore GIS Map
              </Link>
              <Link 
                to="/submit-problem" 
                className="px-4 py-2 bg-[#f4f1e1] text-[#2c4230] hover:bg-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
              >
                <PlusCircle size={14} /> Post Civic Issue
              </Link>
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-10 w-full space-y-8">
          
          {/* Metrics Row (3 Balanced Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Total Logged Issues */}
            <div className="bg-white p-6 rounded-3xl border border-[#e2ded0] shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#556958] uppercase tracking-wider">Your Reports</span>
                <div className="p-2.5 bg-[#4a6b4e]/10 text-[#4a6b4e] rounded-xl">
                  <FileText size={20} />
                </div>
              </div>
              <div className="my-3">
                <h3 className="text-3xl font-black text-[#2c4230]">{problems.length}</h3>
                <p className="text-xs text-[#7d8c7c] mt-0.5">Logged in your district</p>
              </div>
              <div className="text-[11px] text-[#4a6b4e] font-semibold flex items-center gap-1">
                <Activity size={13} /> 100% Geotagged
              </div>
            </div>

            {/* In Active Resolution (University R&D) */}
            <div className="bg-white p-6 rounded-3xl border border-[#e2ded0] shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#556958] uppercase tracking-wider">In University R&D</span>
                <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
                  <Building2 size={20} />
                </div>
              </div>
              <div className="my-3">
                <h3 className="text-3xl font-black text-amber-800">{inProgressCount}</h3>
                <p className="text-xs text-[#7d8c7c] mt-0.5">Under active engineering</p>
              </div>
              <div className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                <TrendingUp size={13} /> Prototyping Phase
              </div>
            </div>

            {/* Solved & Deployed */}
            <div className="bg-white p-6 rounded-3xl border border-[#e2ded0] shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#556958] uppercase tracking-wider">Deployed Solutions</span>
                <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                  <CheckCircle size={20} />
                </div>
              </div>
              <div className="my-3">
                <h3 className="text-3xl font-black text-emerald-800">{resolvedCount}</h3>
                <p className="text-xs text-[#7d8c7c] mt-0.5">Field verified solutions</p>
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck size={13} /> Civic Sign-Off
              </div>
            </div>

          </div>

          {/* Recent Tracked Issues Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#2c4230]">Your Civic Action Trackers</h3>
                <p className="text-xs text-[#556958]">Track live progress and milestones.</p>
              </div>
              <Link 
                to="/feed" 
                className="text-xs font-bold text-[#4a6b4e] hover:text-[#2c4230] flex items-center gap-1 transition-colors"
              >
                Explore Public Feed <ChevronRight size={14} />
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-16 text-[#556958] bg-white rounded-3xl border border-[#e2ded0]">
                <Sparkles className="animate-spin mx-auto text-[#4a6b4e] mb-2" size={24} />
                <span>Loading your tracked challenges...</span>
              </div>
            ) : error ? (
              <div className="text-center py-10 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-xs font-medium">
                {error}
              </div>
            ) : problems.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#e2ded0] shadow-sm">
                <AlertTriangle className="mx-auto text-[#7d8c7c] mb-3" size={36} />
                <h4 className="text-base font-bold text-[#2c4230] mb-1">No civic issues submitted yet</h4>
                <p className="text-xs text-[#556958] max-w-sm mx-auto mb-6">
                  Take a photo and submit a problem in your village or ward. Our AI will classify and route it to premier engineering universities.
                </p>
                <Link 
                  to="/submit-problem" 
                  className="px-5 py-2.5 bg-[#2c4230] text-[#f4f1e1] hover:bg-[#1e2d21] rounded-xl text-xs font-bold shadow-md inline-flex items-center gap-1.5"
                >
                  <PlusCircle size={14} /> Post Your First Issue
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {problems.map((problem) => {
                  const upvotes = problem.upvotesCount ?? problem.upvotedBy?.length ?? 0;
                  const firstPhotoUrl = problem.imagesAndMedia?.[0]?.url;

                  return (
                    <div 
                      key={problem._id} 
                      className="bg-white rounded-3xl border border-[#e2ded0] shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all flex flex-col justify-between overflow-hidden"
                    >
                      {/* Photo / Header */}
                      <div className="h-40 bg-[#e8e4d3] relative overflow-hidden flex items-center justify-center">
                        <CardEvidenceImage url={firstPhotoUrl} />

                        <div className="absolute top-3 left-3">
                          <span className={`px-2.5 py-0.5 text-[10.5px] font-bold uppercase rounded-full shadow-sm border ${getSeverityBadge(problem.aiAnalysis?.severity)}`}>
                            {problem.aiAnalysis?.severity || 'NORMAL'}
                          </span>
                        </div>

                        <div className="absolute top-3 right-3">
                          <span className="px-2.5 py-0.5 bg-black/60 backdrop-blur-md text-white text-[10.5px] font-bold rounded-full">
                            {problem.status || 'SUBMITTED'}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-0.5 bg-[#4a6b4e]/10 text-[#2c4230] text-[11px] font-bold rounded-md border border-[#4a6b4e]/20">
                              {problem.aiAnalysis?.problem_classification || 'Civic Problem'}
                            </span>
                          </div>

                          <h4 className="font-bold text-[#2c4230] text-base mb-1.5 line-clamp-2 leading-snug">
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

                        <div className="pt-3 border-t border-[#e2ded0] flex items-center justify-between text-xs">
                          <span className="text-[#7d8c7c] flex items-center gap-1 font-semibold">
                            <ThumbsUp size={13} className="text-[#4a6b4e]" /> {upvotes} Upvotes
                          </span>
                          <Link 
                            to={`/problem/${problem._id}`}
                            className="text-[#2c4230] font-bold flex items-center gap-1 hover:text-[#4a6b4e] transition-colors"
                          >
                            <span>Track Lifecycle</span>
                            <ChevronRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
