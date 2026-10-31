import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { Link, useNavigate } from 'react-router-dom';
import { Filter, Search, MapPin, ChevronRight, MessageSquare, Clock } from 'lucide-react';

const PublicFeed = () => {
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeed();
  }, [categoryFilter]);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      let url = 'https://sih-26-jarr.onrender.com/api/problems';
      if (categoryFilter) {
        url += `?category=${categoryFilter}`;
      }
      
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
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      default: return 'bg-green-500 text-white';
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#f3f6f4] font-sans text-gray-900">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto relative">
        <header className="sticky top-0 z-10 flex flex-col md:flex-row md:items-center justify-between px-10 py-6 bg-white border-b border-gray-200 gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 m-0">Public Challenge Feed</h2>
            <p className="text-sm text-gray-500 mt-1">Discover, discuss, and track civic issues in your area.</p>
          </div>
          
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search district, issue..." 
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm outline-none focus:border-primary w-64"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select 
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-full text-sm outline-none focus:border-primary appearance-none bg-white cursor-pointer"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="water resources">Water Resources</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="health">Public Health</option>
                <option value="education">Education</option>
              </select>
            </div>
          </div>
        </header>

        <div className="p-10 max-w-6xl mx-auto w-full">
          {loading ? (
            <div className="text-center py-20 text-gray-500 font-medium">Loading challenges...</div>
          ) : error ? (
            <div className="text-center py-20 text-red-500 font-medium">{error}</div>
          ) : filteredProblems.length === 0 ? (
            <div className="text-center py-20 text-gray-500 font-medium">No challenges found matching your criteria.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProblems.map(problem => (
                <div key={problem._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full overflow-hidden">
                  {/* Card Header (Image/Color Block) */}
                  <div className="h-40 bg-gray-100 relative">
                    {problem.imagesAndMedia && problem.imagesAndMedia.length > 0 ? (
                      <img src={problem.imagesAndMedia[0].url} alt="Evidence" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                        No Image Provided
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className={`px-2.5 py-1 text-[11px] font-bold uppercase rounded shadow-sm ${getSeverityColor(problem.aiAnalysis?.severity)}`}>
                        {problem.aiAnalysis?.severity || 'UNKNOWN'}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-md">
                        {problem.aiAnalysis?.problem_classification || 'Unclassified'}
                      </span>
                    </div>
                    
                    <h3 className="font-extrabold text-gray-900 text-lg mb-2 line-clamp-2 leading-tight">
                      {problem.title || "Untitled Problem"}
                    </h3>
                    
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">
                      {problem.aiAnalysis?.summary || problem.description}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-4">
                      <MapPin size={14} className="text-gray-400"/>
                      {problem.location?.district}, {problem.location?.state}
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                        <span className="flex items-center gap-1"><Clock size={14} /> {new Date(problem.createdAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><MessageSquare size={14} /> Discuss</span>
                      </div>
                      
                      <Link 
                        to={`/problem/${problem._id}`} 
                        className="text-primary font-bold text-sm flex items-center gap-1 hover:text-primary-hover"
                      >
                        View Details <ChevronRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PublicFeed;
