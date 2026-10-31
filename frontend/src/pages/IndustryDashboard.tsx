import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
  Factory,
  CheckCircle,
  XCircle,
  FileText,
  Video,
  Code,
  Users,
  MapPin,
  Clock,
  Briefcase
} from 'lucide-react';
const IndustryDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted'>('pending');
  const [pendingSolutions, setPendingSolutions] = useState<any[]>([]);
  const [acceptedSolutions, setAcceptedSolutions] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || userData.role !== 'INDUSTRY_PARTNER') {
      navigate('/login');
      return;
    }

    setUser(userData);
    fetchPendingSolutions(token);
    fetchAcceptedSolutions(token);
  }, [navigate]);

  const fetchPendingSolutions = async (token: string) => {
    try {
      const res = await fetch('https://sih-26-jarr.onrender.com/api/industry/allocated-solutions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let data;
      try { data = await res.json(); } catch(e) { throw new Error('Backend unresponsive'); }
      if (!res.ok) throw new Error(data.message || 'Failed to fetch pending solutions');
      
      setPendingSolutions(data.data || []);
    } catch (err: any) {
      console.warn("API Error:", err.message);
      // MOCK FALLBACK
      setPendingSolutions(generateMockPending());
    }
  };

  const fetchAcceptedSolutions = async (token: string) => {
    try {
      const res = await fetch('https://sih-26-jarr.onrender.com/api/industry/accepted-solutions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let data;
      try { data = await res.json(); } catch(e) { throw new Error('Backend unresponsive'); }
      if (!res.ok) throw new Error(data.message || 'Failed to fetch accepted solutions');
      
      setAcceptedSolutions(data.data || []);
    } catch (err: any) {
      console.warn("API Error:", err.message);
      // MOCK FALLBACK
      setAcceptedSolutions(generateMockAccepted());
    }
  };

  const handleDecision = async (teamId: string, action: 'ACCEPTED' | 'REJECTED') => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`https://sih-26-jarr.onrender.com/api/industry/solutions/${teamId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: action })
      });
      
      let data;
      try { data = await res.json(); } catch(e) { throw new Error('Backend unresponsive'); }
      if (!res.ok) throw new Error(data.message || 'Failed to update status');

      showNotification(`Solution successfully ${action.toLowerCase()}.`, 'success');
      fetchPendingSolutions(token);
      fetchAcceptedSolutions(token);
    } catch (err: any) {
      console.warn("API Error:", err.message);
      
      // MOCK FALLBACK
      showNotification(`MOCK: Solution ${action.toLowerCase()} locally for demo.`, 'success');
      const solution = pendingSolutions.find(s => s._id === teamId);
      if (solution) {
        setPendingSolutions(prev => prev.filter(s => s._id !== teamId));
        if (action === 'ACCEPTED') {
          setAcceptedSolutions(prev => [{...solution, industryAllocation: { ...solution.industryAllocation, status: 'ACCEPTED'}}, ...prev]);
        }
      }
    }
  };

  const generateMockPending = () => [
    {
      _id: 'mock-team-1',
      teamName: 'Hydro Innovators',
      leaderName: 'Anita Sharma',
      problemStatement: {
        title: 'Severe Water Logging in Main Market',
        location: { district: 'Jamshedpur' },
        aiAnalysis: { problem_classification: 'Water & Sanitation' }
      },
      solution: {
        docxLink: 'https://example.com/docs/hydro-solution.pdf',
        prototypeLink: 'https://github.com/hydro-innovators',
        demoVideoLink: 'https://youtube.com/watch?v=demo',
        description: 'We have developed a smart IoT drainage sensor network that communicates with municipal pumping stations to automatically clear water logging before it reaches critical levels.',
        submittedAt: new Date(Date.now() - 86400000).toISOString()
      },
      industryAllocation: {
        companyName: 'L&T Infrastructure',
        status: 'PENDING'
      }
    }
  ];

  const generateMockAccepted = () => [
    {
      _id: 'mock-team-2',
      teamName: 'Civic Builders',
      leaderName: 'Rahul Verma',
      problemStatement: {
        title: 'Broken Street Lights on Ring Road',
        location: { district: 'Ranchi' },
        aiAnalysis: { problem_classification: 'Infrastructure & Safety' }
      },
      solution: {
        docxLink: 'https://example.com/docs/civic-solution.pdf',
        description: 'Solar-powered smart street lights with motion detection to save energy.',
        submittedAt: new Date(Date.now() - 500000000).toISOString()
      },
      industryAllocation: {
        companyName: 'Tata Power',
        status: 'ACCEPTED'
      }
    }
  ];

  return (
    <div className="flex bg-civic-page min-h-screen font-inter">
      <Sidebar />

      <main className="flex-1 overflow-y-auto relative pb-12">
        {notification && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg font-bold text-sm ${notification.type === 'success' ? 'bg-civic-primary text-white' : 'bg-red-500 text-white'}`}>
            {notification.msg}
          </div>
        )}

        {/* Header */}
        <header className="bg-civic-primary-dark pt-12 pb-24 px-8 relative overflow-hidden shrink-0 shadow-md">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
          <div className="relative z-10 max-w-6xl mx-auto">
            <div className="flex items-center gap-2 text-civic-surface/80 text-xs font-bold uppercase tracking-wider mb-2 font-poppins">
              <Factory size={16} />
              <span>Industry Partner Portal</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white font-poppins">Solution Adoption Center</h1>
            <p className="text-civic-surface/80 text-sm mt-2 max-w-2xl">
              Welcome, <span className="font-bold text-white">{user?.profileDetails?.companyName || 'Industry Partner'}</span>. Review and adopt innovative prototypes built by top university students to solve critical civic challenges.
            </p>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
          
          {/* Tabs */}
          <div className="flex items-center gap-2 bg-civic-surface p-1.5 rounded-full w-fit shadow-sm border border-civic-border mb-8">
            <button 
              className={`px-6 py-2.5 rounded-full text-sm font-bold font-poppins transition-all duration-200 flex items-center gap-2 ${activeTab === 'pending' ? 'bg-civic-primary text-white shadow-md' : 'text-civic-text-body hover:bg-slate-100 hover:text-civic-text-main'}`}
              onClick={() => setActiveTab('pending')}
            >
              <Clock size={16} /> Incoming Prototypes
            </button>
            <button 
              className={`px-6 py-2.5 rounded-full text-sm font-bold font-poppins transition-all duration-200 flex items-center gap-2 ${activeTab === 'accepted' ? 'bg-civic-primary text-white shadow-md' : 'text-civic-text-body hover:bg-slate-100 hover:text-civic-text-main'}`}
              onClick={() => setActiveTab('accepted')}
            >
              <CheckCircle size={16} /> Accepted Implementations
            </button>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {(activeTab === 'pending' ? pendingSolutions : acceptedSolutions).length === 0 ? (
              <div className="bg-civic-surface p-12 text-center rounded-card border border-civic-border shadow-civic-card">
                <Briefcase size={48} className="mx-auto text-civic-text-muted mb-4 opacity-50" />
                <h3 className="text-lg font-bold font-poppins text-civic-text-main mb-2">No Solutions Found</h3>
                <p className="text-sm text-civic-text-body">There are currently no solutions in this category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {(activeTab === 'pending' ? pendingSolutions : acceptedSolutions).map((item) => (
                  <div key={item._id} className="bg-civic-surface rounded-card border border-civic-border shadow-civic-card overflow-hidden flex flex-col md:flex-row">
                    
                    {/* Left: Problem Details */}
                    <div className="p-6 border-b md:border-b-0 md:border-r border-civic-border bg-slate-50/50 md:w-5/12 shrink-0">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2.5 py-1 bg-civic-primary-soft text-civic-primary text-[10px] font-bold rounded-md border border-civic-primary/20">
                          {item.problemStatement?.aiAnalysis?.problem_classification || 'General'}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-civic-text-muted font-bold">
                          <MapPin size={12} />
                          {item.problemStatement?.location?.district || 'Unknown Location'}
                        </div>
                      </div>
                      <h3 className="text-lg font-bold font-poppins text-civic-text-main mb-2">{item.problemStatement?.title}</h3>
                      
                      <div className="mt-6 pt-4 border-t border-civic-border">
                        <h4 className="text-xs font-bold text-civic-text-muted uppercase tracking-wider mb-3">Development Team</h4>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold font-poppins">
                            <Users size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-civic-text-main">{item.teamName}</p>
                            <p className="text-xs text-civic-text-body">Led by {item.leaderName}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Solution Details & Actions */}
                    <div className="p-6 md:w-7/12 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-bold font-poppins text-civic-text-main">Engineering Solution</h4>
                          <span className="text-xs text-civic-text-muted">
                            Submitted: {new Date(item.solution?.submittedAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-civic-text-body leading-relaxed mb-6">
                          {item.solution?.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-3 mb-6">
                          {item.solution?.docxLink && (
                            <a href={item.solution.docxLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-xs font-bold hover:bg-blue-100 transition-colors">
                              <FileText size={14} /> Documentation
                            </a>
                          )}
                          {item.solution?.prototypeLink && (
                            <a href={item.solution.prototypeLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md text-xs font-bold hover:bg-slate-200 transition-colors">
                              <Code size={14} /> Repository
                            </a>
                          )}
                          {item.solution?.demoVideoLink && (
                            <a href={item.solution.demoVideoLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-md text-xs font-bold hover:bg-red-100 transition-colors">
                              <Video size={14} /> Demo Video
                            </a>
                          )}
                        </div>
                      </div>

                      {activeTab === 'pending' ? (
                        <div className="flex items-center gap-3 pt-4 border-t border-civic-border">
                          <button 
                            onClick={() => handleDecision(item._id, 'ACCEPTED')}
                            className="flex-1 bg-civic-primary hover:bg-civic-primary-dark text-white font-bold py-2.5 rounded-xl transition-colors font-poppins text-sm flex items-center justify-center gap-2"
                          >
                            <CheckCircle size={18} /> Accept Implementation
                          </button>
                          <button 
                            onClick={() => handleDecision(item._id, 'REJECTED')}
                            className="px-6 py-2.5 bg-white border border-civic-border hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-civic-text-body font-bold rounded-xl transition-colors font-poppins text-sm flex items-center gap-2"
                          >
                            <XCircle size={18} /> Reject
                          </button>
                        </div>
                      ) : (
                        <div className="pt-4 border-t border-civic-border">
                          <div className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold py-2.5 rounded-xl font-poppins text-sm flex items-center justify-center gap-2">
                            <CheckCircle size={18} /> Officially Accepted for Development
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </main>
    </div>
  );
};

export default IndustryDashboard;
