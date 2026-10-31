import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Filter, 
  Search, 
  MapPin, 
  ChevronRight, 
  ThumbsUp, 
  Sparkles, 
  AlertCircle,
  Map as MapIcon,
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
      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
      onError={() => setHasError(true)}
    />
  );
};

const PublicFeed = () => {
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  
  // Filter & Search states
  const [activeTab, setActiveTab] = useState('All'); // All, Nearby, Trending, Needs Support, Solved
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [upvotedMap, setUpvotedMap] = useState<{ [id: string]: boolean }>({});
  const [upvotesCountMap, setUpvotesCountMap] = useState<{ [id: string]: number }>({});
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const filterTabs = ['All', 'Nearby', 'Trending', 'Needs Support', 'Solved'];

  // Reset and fetch first page on filter change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchFeed(1, true);
  }, [categoryFilter]);

  const fetchFeed = async (pageNumber: number, isInitial: boolean = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      let url = `https://sih-26-jarr.onrender.com/api/problems?page=${pageNumber}&limit=12`;
      if (categoryFilter) {
        url += `&category=${encodeURIComponent(categoryFilter)}`;
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
      const rawProblems = data.data || [];
      const pagination = data.pagination;

      if (isInitial) {
        setProblems(rawProblems);
      } else {
        setProblems(prev => {
          // Avoid duplicate problems by _id
          const existingIds = new Set(prev.map(p => p._id));
          const newItems = rawProblems.filter((p: any) => !existingIds.has(p._id));
          return [...prev, ...newItems];
        });
      }

      // Check if more pages exist
      if (pagination) {
        setHasMore(pagination.page < pagination.pages && rawProblems.length > 0);
      } else {
        setHasMore(rawProblems.length === 12);
      }

      // Initialize upvotes state strictly from backend
      setUpvotedMap(prev => {
        const next = { ...prev };
        rawProblems.forEach((p: any) => {
          next[p._id] = p.upvotedBy?.includes(user._id || user.id) || false;
        });
        return next;
      });

      setUpvotesCountMap(prev => {
        const next = { ...prev };
        rawProblems.forEach((p: any) => {
          next[p._id] = p.upvotesCount ?? (Array.isArray(p.upvotedBy) ? p.upvotedBy.length : 0);
        });
        return next;
      });

      setPage(pageNumber);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const target = e.currentTarget;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 250;

    if (isNearBottom && !loading && !loadingMore && hasMore) {
      fetchFeed(page + 1, false);
    }
  };

  const handleToggleUpvote = async (problemId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const isCurrentlyUpvoted = !!upvotedMap[problemId];
    const currentCount = upvotesCountMap[problemId] || 0;

    setUpvotedMap(prev => ({ ...prev, [problemId]: !isCurrentlyUpvoted }));
    setUpvotesCountMap(prev => ({ ...prev, [problemId]: Math.max(0, currentCount + (isCurrentlyUpvoted ? -1 : 1)) }));

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const res = await fetch(`https://sih-26-jarr.onrender.com/api/problems/${problemId}/upvote`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const resData = await res.json();
        if (resData.data) {
          setUpvotesCountMap(prev => ({ 
            ...prev, 
            [problemId]: resData.data.upvotesCount ?? (Array.isArray(resData.data.upvotedBy) ? resData.data.upvotedBy.length : prev[problemId]) 
          }));
        }
      }
    } catch (err) {
      console.error('Failed to update upvote on server', err);
    }
  };

  const filteredProblems = problems.filter(p => {
    const matchSearch =
      searchQuery === '' ||
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location?.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.aiAnalysis?.summary?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;

    if (activeTab === 'Nearby' && user.district) {
      return p.location?.district?.toLowerCase() === user.district?.toLowerCase();
    }
    if (activeTab === 'Solved') {
      return p.status === 'DEPLOYED' || p.status === 'RESOLVED';
    }
    if (activeTab === 'Needs Support') {
      return p.status === 'SUBMITTED' || p.status === 'CLASSIFIED';
    }
    if (activeTab === 'Trending') {
      return (upvotesCountMap[p._id] || 0) >= 5;
    }
    return true;
  });

  const getSeverityBadge = (severity: string) => {
    switch(severity?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-[#4a6b4e]/10 text-[#4a6b4e] border-[#4a6b4e]/20';
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#f4f1e1] font-sans text-[#2c4230] overflow-hidden">
      <Sidebar />

      <main 
        onScroll={handleScroll}
        className="flex-1 flex flex-col overflow-y-auto relative bg-[#f4f1e1]"
      >
        {/* Thematic Header Bar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#e2ded0] px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div>
            <h2 className="text-2xl font-black text-[#2c4230] flex items-center gap-2">
              Civic Challenge Feed <Sparkles size={20} className="text-[#f9d877]" />
            </h2>
            <p className="text-xs text-[#556958] mt-0.5">
              Explore civic challenges, upvote critical priorities, and collaborate on solutions.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7d8c7c]" size={16} />
              <input 
                type="text" 
                placeholder="Search district, issue..." 
                className="pl-9 pr-4 py-2 bg-[#f4f1e1]/80 border border-[#e2ded0] rounded-full text-xs outline-none focus:bg-white focus:border-[#4a6b4e] w-48 sm:w-60 transition-all text-[#2c4230]"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Category dropdown */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7d8c7c]" size={15} />
              <select 
                className="pl-8 pr-7 py-2 bg-[#f4f1e1]/80 border border-[#e2ded0] rounded-full text-xs outline-none focus:bg-white focus:border-[#4a6b4e] appearance-none cursor-pointer text-[#2c4230] font-medium"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
              >
                <option value="">All Domains</option>
                <option value="water resources">Water Resources</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="health">Public Health</option>
                <option value="education">Education</option>
                <option value="environment">Environment</option>
              </select>
            </div>

            {/* Link to Explore Map */}
            <Link
              to="/explore"
              className="px-3.5 py-2 bg-[#2c4230] text-[#f4f1e1] hover:bg-[#1e2d21] rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <MapIcon size={14} /> Map View
            </Link>
          </div>
        </header>

        <div className="p-8 w-full space-y-6">
          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {filterTabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm shrink-0 ${
                  activeTab === tab
                    ? 'bg-[#2c4230] text-[#f4f1e1] shadow-[0_2px_8px_rgba(44,66,48,0.25)]'
                    : 'bg-white text-[#556958] hover:bg-white/80 border border-[#e2ded0]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Feed Content */}
          {loading ? (
            <div className="text-center py-24 text-[#556958] font-medium flex flex-col items-center gap-3">
              <Sparkles className="animate-spin text-[#4a6b4e]" size={28} />
              <span>Fetching community challenges...</span>
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-700 bg-red-50 rounded-2xl border border-red-200 font-medium text-xs">
              {error}
            </div>
          ) : filteredProblems.length === 0 ? (
            <div className="text-center py-24 text-[#556958] bg-white rounded-3xl border border-[#e2ded0] p-8 shadow-sm">
              <AlertCircle size={36} className="mx-auto text-[#7d8c7c] mb-3" />
              <h4 className="text-base font-bold text-[#2c4230] mb-1">No civic challenges found</h4>
              <p className="text-xs text-[#7d8c7c] max-w-md mx-auto">
                No issues match your current filters. Try changing category or search terms, or post a new problem.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProblems.map(problem => {
                const isUpvoted = !!upvotedMap[problem._id];
                const upvotes = upvotesCountMap[problem._id] ?? (problem.upvotesCount ?? problem.upvotedBy?.length ?? 0);
                const firstPhotoUrl = problem.imagesAndMedia?.[0]?.url;

                return (
                  <div 
                    key={problem._id} 
                    className="bg-white rounded-3xl border border-[#e2ded0] shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all flex flex-col h-full overflow-hidden"
                  >
                    {/* Card Photo Evidence / Header */}
                    <div className="h-44 bg-[#e8e4d3] relative overflow-hidden flex items-center justify-center">
                      <CardEvidenceImage url={firstPhotoUrl} />
                      
                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className={`px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase rounded-full shadow-sm border ${getSeverityBadge(problem.aiAnalysis?.severity)}`}>
                          {problem.aiAnalysis?.severity || 'NORMAL'}
                        </span>
                      </div>

                      {/* Status Tag */}
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-0.5 bg-black/60 backdrop-blur-md text-white text-[10.5px] font-bold rounded-full">
                          {problem.status || 'SUBMITTED'}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Domain Tag */}
                        <div className="flex items-center gap-2 mb-2.5">
                          <span className="px-2.5 py-0.5 bg-[#4a6b4e]/10 text-[#2c4230] text-[11px] font-bold rounded-md border border-[#4a6b4e]/20">
                            {problem.aiAnalysis?.problem_classification || 'Civic Problem'}
                          </span>
                        </div>
                        
                        {/* Title */}
                        <h3 className="font-bold text-[#2c4230] text-base mb-2 line-clamp-2 leading-snug">
                          {problem.title || "Civic Infrastructure Issue"}
                        </h3>
                        
                        {/* Summary / Description */}
                        <p className="text-xs text-[#556958] line-clamp-3 mb-4 leading-relaxed">
                          {problem.aiAnalysis?.summary || problem.description}
                        </p>

                        {/* Location */}
                        <div className="flex items-center gap-1 text-[11.5px] text-[#556958] font-medium mb-4">
                          <MapPin size={13} className="text-[#4a6b4e] shrink-0" />
                          <span className="truncate">
                            {problem.location?.district || 'Ranchi'}, {problem.location?.state || 'Jharkhand'}
                            {problem.location?.village && ` • ${problem.location.village}`}
                          </span>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-3 border-t border-[#e2ded0] flex items-center justify-between mt-auto text-xs">
                        {/* Upvote Button */}
                        <button
                          onClick={(e) => handleToggleUpvote(problem._id, e)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                            isUpvoted
                              ? 'bg-[#2c4230] text-[#f4f1e1] shadow-sm'
                              : 'bg-[#f4f1e1] text-[#3e4a36] hover:bg-[#e2ded0]'
                          }`}
                        >
                          <ThumbsUp size={13} className={isUpvoted ? 'fill-current' : ''} />
                          <span>{upvotes} Upvotes</span>
                        </button>

                        {/* Details Link */}
                        <Link 
                          to={`/problem/${problem._id}`} 
                          className="text-[#2c4230] font-bold text-xs flex items-center gap-1 hover:text-[#4a6b4e] transition-colors"
                        >
                          <span>Track Solution</span>
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Pagination Loading Spinner / End status */}
          {loadingMore && (
            <div className="py-8 flex items-center justify-center gap-2 text-xs font-bold text-[#4a6b4e]">
              <Sparkles className="animate-spin" size={18} />
              <span>Loading more civic challenges...</span>
            </div>
          )}

          {!hasMore && problems.length > 0 && !loading && (
            <div className="py-8 text-center text-xs text-[#7d8c7c] font-medium border-t border-[#e2ded0]/60 mt-4">
              <span>✓ You have viewed all community challenges in this category</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PublicFeed;
