import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, ChevronRight, MessageSquare, Clock, ImageIcon } from 'lucide-react';

const PublicFeed = () => {
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      let url = 'https://sih-26-jarr.onrender.com/api/problems';
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(url, {
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

      if (!response.ok) throw new Error('Failed to fetch public feed');
      
      const data = await response.json();
      setProblems(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProblems = problems.filter(p => 
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.aiAnalysis?.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.location?.district?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSeverityColor = (severity: string) => {
    switch(severity?.toLowerCase()) {
      case 'critical': return 'bg-civic-critical-bg text-civic-critical border-civic-critical/20';
      case 'high': return 'bg-red-50 text-red-600 border-red-600/20';
      case 'medium': return 'bg-civic-medium-bg text-civic-medium border-civic-medium/20';
      default: return 'bg-civic-resolved-bg text-civic-resolved border-civic-resolved/20';
    }
  };

  return (
    <div className="flex h-screen w-screen bg-civic-page font-inter text-civic-text-body overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto relative bg-civic-page">
        <header className="sticky top-0 z-20 flex flex-col gap-4 pl-20 pr-10 md:px-10 py-6 bg-civic-surface/80 backdrop-blur-md border-b border-civic-border-subtle shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-civic-text-main m-0 font-poppins">Public Feed</h2>
              <p className="text-sm font-medium text-civic-text-muted mt-1">See what's happening in your community.</p>
            </div>
            <div className="flex items-center bg-white rounded-2xl border border-civic-border-subtle px-4 py-2.5 shadow-sm focus-within:border-civic-primary transition-colors w-72">
              <Search className="w-4 h-4 text-civic-text-muted mr-2" />
              <input 
                type="text" 
                placeholder="Search Ranchi, Kanke, issues..." 
                className="w-full text-sm text-civic-text-main placeholder-civic-text-muted bg-transparent border-none outline-none"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </header>

        <section className="p-10 pb-12 z-10">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="w-12 h-12 border-4 border-civic-border-subtle border-t-civic-primary rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500 font-medium">{error}</div>
          ) : filteredProblems.length === 0 ? (
            <div className="text-center py-20 text-gray-500 font-medium">No challenges found matching your criteria.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProblems.map((problem) => (
                <div key={problem._id} className="bg-civic-surface rounded-card border border-civic-border-subtle shadow-civic-card overflow-hidden transition-all duration-200 hover:shadow-civic-hover flex flex-col cursor-pointer" onClick={() => navigate(`/problem/${problem._id}`)}>
                  
                  {/* Header Media */}
                  <div className="relative h-48 w-full bg-civic-page border-b border-civic-border-subtle">
                    {problem.imagesAndMedia && problem.imagesAndMedia.length > 0 ? (
                      <img src={problem.imagesAndMedia[0].url} alt="Problem" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-civic-page">
                        <ImageIcon size={48} className="text-civic-border-subtle" />
                      </div>
                    )}
                    
                    {/* Civic Concern Pill */}
                    <div className="absolute top-3 left-3 bg-civic-primary text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 shadow">
                      <span>🌿</span>
                      <span>Civic Concern</span>
                    </div>

                    {/* Urgency Chip */}
                    <div className={`absolute top-3 right-3 text-[11px] font-bold px-3 py-1 rounded-full shadow-sm border ${getSeverityColor(problem.aiAnalysis?.severity)}`}>
                      {problem.aiAnalysis?.severity || 'UNKNOWN'}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-1 bg-civic-primary-soft text-civic-primary border border-civic-primary/20 text-xs font-bold rounded-md uppercase tracking-wide">
                        {problem.aiAnalysis?.problem_classification || 'Unclassified'}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-civic-text-main group-hover:text-civic-primary transition-colors text-lg mb-2 line-clamp-2 leading-tight font-poppins">
                      {problem.title || "Untitled Problem"}
                    </h3>
                    
                    <p className="text-sm text-civic-text-body line-clamp-3 mb-4 flex-1 leading-relaxed">
                      {problem.aiAnalysis?.summary || problem.description}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs text-civic-text-muted font-bold mb-4">
                      <MapPin size={14} className="text-civic-primary"/>
                      {problem.location?.district}, {problem.location?.state}
                    </div>

                    <div className="pt-4 border-t border-civic-border-subtle flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-4 text-xs text-civic-text-muted font-bold">
                        <span className="flex items-center gap-1"><Clock size={14} /> {new Date(problem.createdAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1 hover:text-civic-primary cursor-pointer transition-colors"><MessageSquare size={14} /> Discuss</span>
                      </div>
                      
                      <Link 
                        to={`/problem/${problem._id}`} 
                        className="text-civic-primary font-bold text-sm flex items-center gap-1 hover:text-civic-primary-dark transition-colors"
                      >
                        View Details <ChevronRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default PublicFeed;
