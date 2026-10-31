import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  ArrowLeft, 
  MapPin, 
  AlertTriangle, 
  Users, 
  Clock, 
  Tag, 
  Building2, 
  CheckCircle2, 
  ThumbsUp, 
  MessageSquare, 
  Send, 
  ShieldCheck, 
  Sparkles,
  FileText,
  ImageOff,
  GraduationCap
} from 'lucide-react';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const lifecycleStages = [
  { key: 'SUBMITTED', title: 'Submitted', desc: 'Citizen issue logged with GIS & photos' },
  { key: 'CLASSIFIED', title: 'AI Classified', desc: 'Domain, severity & cluster verified' },
  { key: 'ALLOCATED', title: 'University Allocated', desc: 'Routed to engineering faculty & mentors' },
  { key: 'ACCEPTED', title: 'College Accepted', desc: 'Faculty mentor adopted challenge' },
  { key: 'IN_PROGRESS', title: 'Team Prototyping', desc: 'Student innovators building active prototype' },
  { key: 'VALIDATED', title: 'Field Testing', desc: 'Live trial & municipality testing' },
  { key: 'DEPLOYED', title: 'Resolved & Deployed', desc: 'Final civic sign-off & long-term maintenance' }
];

const ProblemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [problem, setProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [upvotesCount, setUpvotesCount] = useState(0);
  
  // Real backend comments state
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchProblemAndComments = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          navigate('/login');
          return;
        }
        
        // Fetch problem details
        const response = await fetch(`https://sih-26-jarr.onrender.com/api/problems/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }

        if (!response.ok) throw new Error('Failed to fetch problem details');
        
        const data = await response.json();
        const p = data.data;
        setProblem(p);
        
        // Strict backend upvotes
        const backendUpvotes = p.upvotesCount ?? (Array.isArray(p.upvotedBy) ? p.upvotedBy.length : 0);
        setUpvotesCount(backendUpvotes);
        setHasUpvoted(Array.isArray(p.upvotedBy) && p.upvotedBy.includes(user._id || user.id));

        // Fetch real comments from backend
        try {
          const commentsRes = await fetch(`https://sih-26-jarr.onrender.com/api/problems/${id}/comments`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (commentsRes.ok) {
            const commentsData = await commentsRes.json();
            setComments(commentsData.data || []);
          }
        } catch (commentErr) {
          console.error('Failed to fetch comments', commentErr);
        } finally {
          setCommentsLoading(false);
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProblemAndComments();
  }, [id, navigate, user._id, user.id]);

  const handleToggleUpvote = async () => {
    const nextUpvoted = !hasUpvoted;
    setHasUpvoted(nextUpvoted);
    setUpvotesCount(prev => Math.max(0, prev + (nextUpvoted ? 1 : -1)));

    try {
      const token = localStorage.getItem('accessToken');
      if (token && id) {
        const res = await fetch(`https://sih-26-jarr.onrender.com/api/problems/${id}/upvote`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.data) {
            setUpvotesCount(resData.data.upvotesCount ?? (Array.isArray(resData.data.upvotedBy) ? resData.data.upvotedBy.length : upvotesCount));
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch(`https://sih-26-jarr.onrender.com/api/problems/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: newComment.trim() })
      });

      if (res.ok) {
        const resData = await res.json();
        if (resData.data) {
          setComments(prev => [resData.data, ...prev]);
          setNewComment('');
        }
      }
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch(severity?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-[#4a6b4e]/10 text-[#4a6b4e] border-[#4a6b4e]/20';
    }
  };

  // Determine current lifecycle step index based on backend status
  const currentStatus = problem?.status || 'SUBMITTED';
  let activeStageIndex = 0;
  if (currentStatus === 'SUBMITTED') activeStageIndex = 0;
  else if (currentStatus === 'CLASSIFIED') activeStageIndex = 1;
  else if (currentStatus === 'ALLOCATED') activeStageIndex = 2;
  else if (currentStatus === 'ACCEPTED' || currentStatus === 'PROPOSAL') activeStageIndex = 3;
  else if (currentStatus === 'IN_PROGRESS' || currentStatus === 'PROTOTYPE') activeStageIndex = 4;
  else if (currentStatus === 'VALIDATED') activeStageIndex = 5;
  else if (currentStatus === 'DEPLOYED' || currentStatus === 'RESOLVED') activeStageIndex = 6;

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f4f1e1] text-[#2c4230] font-sans">
        <Sparkles className="animate-spin text-[#4a6b4e] mr-2" /> Loading challenge tracking details...
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f4f1e1] text-red-700 font-sans p-6">
        <div className="bg-white p-8 rounded-3xl border border-red-200 max-w-md text-center shadow-md">
          <AlertTriangle className="mx-auto text-red-600 mb-3" size={36} />
          <h3 className="text-lg font-bold mb-2">Failed to load problem</h3>
          <p className="text-xs text-red-600 mb-4">{error || 'Problem not found'}</p>
          <Link to="/feed" className="px-4 py-2 bg-[#2c4230] text-[#f4f1e1] rounded-xl text-xs font-bold">
            Back to Public Feed
          </Link>
        </div>
      </div>
    );
  }

  // University assigned strictly from backend
  const assignedUniversityName = 
    problem.acceptedByUniversityName ||
    problem.acceptedBy?.name ||
    problem.acceptedBy?.universityName ||
    problem.collegeSuggestions?.[0]?.college_name ||
    null;

  const topCollegeSuggestion = problem.collegeSuggestions?.[0];

  const lat = problem.location?.latitude || problem.location?.coordinates?.latitude || 23.3441;
  const lng = problem.location?.longitude || problem.location?.coordinates?.longitude || 85.3096;

  const validMedia = Array.isArray(problem.imagesAndMedia)
    ? problem.imagesAndMedia.filter((m: any) => m && m.url && typeof m.url === 'string' && !m.url.includes('placeholder.com'))
    : [];

  return (
    <div className="flex h-screen w-screen bg-[#f4f1e1] font-sans text-[#2c4230] overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto relative bg-[#f4f1e1]">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#e2ded0] px-8 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <Link to="/feed" className="p-2 hover:bg-[#f4f1e1] rounded-full transition-colors text-[#2c4230]">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h2 className="text-xl font-extrabold text-[#2c4230]">Challenge Lifecycle & Solution Tracker</h2>
              <p className="text-xs text-[#556958]">ID: #{problem._id?.substring(0, 10)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleToggleUpvote}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                hasUpvoted 
                  ? 'bg-[#2c4230] text-[#f4f1e1] shadow-sm' 
                  : 'bg-[#f4f1e1] text-[#2c4230] hover:bg-[#e2ded0] border border-[#e2ded0]'
              }`}
            >
              <ThumbsUp size={14} className={hasUpvoted ? 'fill-current' : ''} />
              <span>{upvotesCount} Upvotes</span>
            </button>
            <Link 
              to="/explore"
              className="px-3.5 py-2 bg-white text-[#2c4230] border border-[#e2ded0] rounded-full text-xs font-bold hover:bg-[#f4f1e1] transition-all flex items-center gap-1.5 shadow-sm"
            >
              <MapPin size={14} className="text-[#4a6b4e]" /> Map View
            </Link>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main 2-Column Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Header Primary Card */}
            <section className="bg-white p-8 rounded-3xl border border-[#e2ded0] shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${getSeverityColor(problem.aiAnalysis?.severity)}`}>
                  {problem.aiAnalysis?.severity || 'NORMAL'} SEVERITY
                </span>
                <span className="px-3 py-1 bg-[#4a6b4e]/10 text-[#2c4230] border border-[#4a6b4e]/20 text-xs font-bold rounded-full">
                  {problem.aiAnalysis?.problem_classification || 'Civic Problem'}
                </span>
                <span className="px-3 py-1 bg-[#f4f1e1] text-[#2c4230] border border-[#e2ded0] text-xs font-bold rounded-full">
                  Status: {currentStatus}
                </span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2c4230] mb-3 leading-tight">
                {problem.title || "Civic Challenge Statement"}
              </h1>
              
              <div className="flex flex-wrap items-center gap-6 text-xs text-[#556958] font-medium mb-6 pb-6 border-b border-[#e2ded0]">
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-[#4a6b4e]" />
                  {problem.location?.district || 'Ranchi'}, {problem.location?.state || 'Jharkhand'}
                  {problem.location?.village && ` • ${problem.location.village}`}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-[#4a6b4e]" /> {new Date(problem.createdAt || Date.now()).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1.5">
                  <Tag size={14} className="text-[#4a6b4e]" /> Submitter: {problem.submittedBy?.name || 'Local Citizen'}
                </span>
              </div>

              <div className="text-sm text-[#3e4a36] space-y-3">
                <h3 className="text-base font-bold text-[#2c4230]">Detailed Problem Description</h3>
                <p className="whitespace-pre-wrap leading-relaxed text-[#4a5848] bg-[#f4f1e1]/40 p-4 rounded-2xl border border-[#e2ded0]/80">
                  {problem.description}
                </p>
              </div>
            </section>

            {/* Lifecycle Stepper (Precision Flex Alignment) */}
            <section className="bg-white p-8 rounded-3xl border border-[#e2ded0] shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#2c4230] flex items-center gap-2">
                  <ShieldCheck className="text-[#4a6b4e]" size={20} /> Resolution Progress & Lifecycle
                </h3>
                <span className="text-xs font-bold text-[#4a6b4e] bg-[#4a6b4e]/10 px-3 py-1 rounded-full">
                  Stage {activeStageIndex + 1} of {lifecycleStages.length}
                </span>
              </div>

              <div className="space-y-1">
                {lifecycleStages.map((stage, idx) => {
                  const isDone = idx < activeStageIndex;
                  const isCurrent = idx === activeStageIndex;
                  const isLast = idx === lifecycleStages.length - 1;

                  return (
                    <div key={stage.key} className="flex items-start gap-4">
                      {/* Left Column: Node + Connector Line */}
                      <div className="flex flex-col items-center shrink-0 w-8 self-stretch">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0 z-10 transition-all ${
                          isDone 
                            ? 'bg-[#2c4230] border-[#2c4230] text-white' 
                            : isCurrent 
                            ? 'bg-[#f9d877] border-[#2c4230] text-[#2c4230] shadow-[0_0_0_4px_rgba(249,216,119,0.35)]' 
                            : 'bg-white border-[#e2ded0] text-[#7d8c7c]'
                        }`}>
                          {isDone ? <CheckCircle2 size={15} /> : idx + 1}
                        </div>

                        {!isLast && (
                          <div className={`w-0.5 flex-1 my-1.5 transition-colors ${
                            isDone ? 'bg-[#2c4230]' : 'bg-[#e2ded0]'
                          }`} style={{ minHeight: '28px' }} />
                        )}
                      </div>

                      {/* Content Box */}
                      <div className={`flex-1 p-3.5 rounded-2xl border transition-all mb-3 ${
                        isCurrent 
                          ? 'bg-[#f4f1e1] border-[#4a6b4e]/40 shadow-sm' 
                          : 'bg-white border-[#e2ded0]/60'
                      }`}>
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`text-sm font-bold ${isCurrent ? 'text-[#2c4230]' : isDone ? 'text-[#3e4a36]' : 'text-[#7d8c7c]'}`}>
                            {stage.title}
                          </h4>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-[#2c4230] bg-[#f9d877] px-2 py-0.5 rounded-md shrink-0">
                              Active Phase
                            </span>
                          )}
                          {isDone && (
                            <span className="text-[10px] font-semibold text-[#4a6b4e] bg-[#4a6b4e]/10 px-2 py-0.5 rounded-md shrink-0">
                              Completed
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#556958] mt-1 leading-relaxed">{stage.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* AI Analysis Card */}
            {problem.aiAnalysis && (
              <section className="bg-gradient-to-br from-[#2c4230] to-[#1e2d21] text-[#f4f1e1] p-8 rounded-3xl shadow-md relative overflow-hidden">
                <div className="absolute inset-0 opacity-15 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] mix-blend-overlay"></div>
                <div className="relative z-10 space-y-4">
                  <h3 className="text-xl font-bold flex items-center gap-2 text-[#f9d877]">
                    <Sparkles size={20} /> IndicBERT AI Intelligence Brief
                  </h3>
                  
                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
                    <p className="text-xs font-bold text-[#a4c2a8] uppercase tracking-wider mb-1 font-mono">AI Executive Summary</p>
                    <p className="text-sm leading-relaxed">{problem.aiAnalysis.summary}</p>
                  </div>

                  {problem.aiAnalysis.required_expertise && (
                    <div className="pt-2">
                      <p className="text-xs font-bold text-[#a4c2a8] uppercase tracking-wider mb-2 font-mono">Required Domain Expertise</p>
                      <div className="flex flex-wrap gap-2">
                        {problem.aiAnalysis.required_expertise.map((exp: string, idx: number) => (
                          <span key={idx} className="bg-white/15 text-white px-3 py-1 rounded-full text-xs font-semibold border border-white/20">
                            {exp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Real Backend Community Discussion Section */}
            <section className="bg-white p-8 rounded-3xl border border-[#e2ded0] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-6">
              <h3 className="text-lg font-bold text-[#2c4230] flex items-center gap-2">
                <MessageSquare className="text-[#4a6b4e]" size={20} /> Community Discussion & Updates ({comments.length})
              </h3>

              {/* Add Comment Input */}
              <form onSubmit={handleAddComment} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Share a field observation, question, or solution update..."
                  className="flex-1 px-4 py-3 bg-[#f4f1e1]/80 border border-[#e2ded0] rounded-2xl text-xs outline-none focus:bg-white focus:border-[#4a6b4e] text-[#2c4230]"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  disabled={submittingComment}
                />
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="px-5 py-3 bg-[#2c4230] hover:bg-[#1e2d21] text-[#f4f1e1] font-bold text-xs rounded-2xl flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-60"
                >
                  <Send size={14} /> {submittingComment ? 'Posting...' : 'Post'}
                </button>
              </form>

              {/* Comment List (Real backend data) */}
              <div className="space-y-3 pt-2">
                {commentsLoading ? (
                  <div className="text-center py-6 text-xs text-[#7d8c7c]">Loading comments...</div>
                ) : comments.length === 0 ? (
                  <div className="p-6 bg-[#f4f1e1]/40 rounded-2xl border border-[#e2ded0] text-center text-xs text-[#7d8c7c]">
                    No community updates or comments yet. Post the first update above!
                  </div>
                ) : (
                  comments.map((c: any) => {
                    const authorName = c.author?.name || c.authorName || 'Citizen Contributor';
                    const authorRole = c.author?.role ? c.author.role.replace('_', ' ') : 'Citizen';
                    const commentDate = c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recent';

                    return (
                      <div key={c._id || c.id} className="p-4 bg-[#f4f1e1]/50 rounded-2xl border border-[#e2ded0] flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#2c4230] text-[#f4f1e1] font-bold text-xs flex items-center justify-center shrink-0 border border-[#4a6b4e]/30">
                          {authorName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#2c4230]">{authorName}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#2c4230]/10 text-[#2c4230] capitalize">
                                {authorRole}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#7d8c7c]">{commentDate}</span>
                          </div>
                          <p className="text-xs text-[#3e4a36] leading-relaxed">{c.text || c.content}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          {/* Right Sidebar: University Team, Evidence & Map */}
          <div className="space-y-8">
            
            {/* Assigned Academic Team Card from Backend */}
            <section className="bg-white p-6 rounded-3xl border border-[#e2ded0] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-4">
              <h3 className="text-xs font-bold text-[#2c4230] uppercase tracking-wider flex items-center gap-2 font-mono">
                <Building2 className="text-[#4a6b4e]" size={16} /> Assigned University
              </h3>
              
              {assignedUniversityName ? (
                <div className="space-y-3">
                  <div className="p-4 bg-[#f4f1e1] rounded-2xl border border-[#e2ded0]">
                    <div className="flex items-center gap-2 text-[#4a6b4e] mb-1">
                      <GraduationCap size={16} />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Adopted Institution</span>
                    </div>
                    <h4 className="font-bold text-sm text-[#2c4230]">{assignedUniversityName}</h4>
                    {topCollegeSuggestion && (
                      <p className="text-xs text-[#556958] mt-1">
                        {topCollegeSuggestion.district ? `District: ${topCollegeSuggestion.district}` : ''} 
                        {topCollegeSuggestion.faculty_expertise ? ` • ${topCollegeSuggestion.faculty_expertise}` : ''}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#3e4a36] p-3 bg-white rounded-xl border border-[#e2ded0]">
                    <Users size={16} className="text-[#4a6b4e] shrink-0" />
                    <span className="font-medium">Faculty & Student R&D Team Allocated</span>
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-[#f4f1e1]/60 rounded-2xl border border-[#e2ded0] text-center space-y-2">
                  <GraduationCap size={28} className="mx-auto text-[#7d8c7c]" />
                  <h4 className="text-xs font-bold text-[#2c4230]">Awaiting University Allocation</h4>
                  <p className="text-[11px] text-[#556958]">
                    AI matching engine is evaluating nearby universities based on domain specialization and proximity.
                  </p>
                </div>
              )}
            </section>

            {/* Geolocation Map Widget */}
            <section className="bg-white p-6 rounded-3xl border border-[#e2ded0] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-3">
              <h3 className="text-xs font-bold text-[#2c4230] uppercase tracking-wider flex items-center gap-2 font-mono">
                <MapPin className="text-[#4a6b4e]" size={16} /> GIS Location
              </h3>
              
              <div className="h-56 rounded-2xl overflow-hidden border border-[#e2ded0] relative z-0">
                <MapContainer center={[lat, lng]} zoom={12} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[lat, lng]}>
                    <Popup>
                      <strong>{problem.title}</strong><br/>
                      {problem.location?.district}, {problem.location?.state}
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>

              <div className="text-xs text-[#556958] space-y-1 pt-1">
                <p><strong>District:</strong> {problem.location?.district || 'Ranchi'}</p>
                <p><strong>Coordinates:</strong> {Number(lat).toFixed(4)}° N, {Number(lng).toFixed(4)}° E</p>
              </div>
            </section>

            {/* Photo Evidence Gallery */}
            <section className="bg-white p-6 rounded-3xl border border-[#e2ded0] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-3">
              <h3 className="text-xs font-bold text-[#2c4230] uppercase tracking-wider flex items-center gap-2 font-mono">
                <FileText className="text-[#4a6b4e]" size={16} /> Photo & Evidence
              </h3>

              {validMedia.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {validMedia.map((media: any, idx: number) => (
                    <a 
                      key={idx} 
                      href={media.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="block rounded-xl overflow-hidden border border-[#e2ded0] hover:scale-105 transition-transform"
                    >
                      <img 
                        src={media.url} 
                        alt={media.name || "Evidence"} 
                        className="w-full h-24 object-cover" 
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-[#f4f1e1]/60 rounded-2xl border border-[#e2ded0] text-center flex flex-col items-center justify-center gap-1.5">
                  <ImageOff size={22} className="text-[#a4b3a4]" />
                  <span className="text-xs font-semibold text-[#7d8c7c]">No Evidence Attached</span>
                </div>
              )}
            </section>

          </div>

        </div>
      </main>
    </div>
  );
};

export default ProblemDetail;
