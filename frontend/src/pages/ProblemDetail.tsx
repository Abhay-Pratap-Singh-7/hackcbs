import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ArrowLeft, MapPin, AlertTriangle, Lightbulb, Users, Clock, Tag } from 'lucide-react';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ProblemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [problem, setProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          navigate('/login');
          return;
        }
        
        const response = await fetch(`https://sih-26-jarr.onrender.com/api/problems/${id}`, {
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

        if (!response.ok) throw new Error('Failed to fetch problem details');
        
        const data = await response.json();
        setProblem(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [id, navigate]);

  const getSeverityColor = (severity: string) => {
    switch(severity?.toLowerCase()) {
      case 'critical': return 'bg-civic-critical-bg text-civic-critical border-civic-critical/20';
      case 'high': return 'bg-red-50 text-red-600 border-red-600/20';
      case 'medium': return 'bg-civic-medium-bg text-civic-medium border-civic-medium/20';
      default: return 'bg-civic-resolved-bg text-civic-resolved border-civic-resolved/20';
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-civic-page">Loading...</div>;
  if (error) return <div className="flex h-screen items-center justify-center bg-civic-page text-red-500">{error}</div>;
  if (!problem) return <div className="flex h-screen items-center justify-center bg-civic-page">Problem not found.</div>;

  return (
    <div className="flex h-screen w-screen bg-civic-page font-inter text-civic-text-body">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto relative">
        <header className="sticky top-0 z-10 flex items-center gap-4 pl-20 pr-10 md:px-10 py-6 bg-civic-surface border-b border-civic-border-subtle">
          <Link to="/feed" className="p-2 hover:bg-civic-page rounded-full transition-colors text-civic-text-body">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-civic-text-main m-0 font-poppins">Challenge Details</h2>
            <p className="text-sm text-civic-text-muted mt-1">ID: {problem._id}</p>
          </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Left Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Header & Primary Info */}
            <section className="bg-civic-surface p-8 rounded-card border border-civic-border-subtle shadow-sm">
              <div className="flex flex-wrap gap-3 mb-4">
                <span className={`px-3 py-1 text-[11px] font-bold uppercase rounded-md border ${getSeverityColor(problem.aiAnalysis?.severity)}`}>
                  {problem.aiAnalysis?.severity || 'UNKNOWN'} SEVERITY
                </span>
                <span className="px-3 py-1 bg-civic-primary-soft text-civic-primary border border-civic-primary/20 text-xs font-bold rounded-md">
                  {problem.aiAnalysis?.problem_classification || 'Unclassified'}
                </span>
                <span className="px-3 py-1 bg-civic-page text-civic-text-muted border border-civic-border-subtle text-xs font-bold rounded-md">
                  {problem.status || 'SUBMITTED'}
                </span>
              </div>
              
              <h1 className="text-3xl font-bold text-civic-text-main mb-4 font-poppins">{problem.title || "Untitled Problem"}</h1>
              
              <div className="flex items-center gap-6 text-sm text-civic-text-muted font-medium mb-6">
                <span className="flex items-center gap-1.5"><MapPin size={16} className="text-civic-primary"/> {problem.location?.district}, {problem.location?.state}</span>
                <span className="flex items-center gap-1.5"><Clock size={16} /> {new Date(problem.createdAt).toLocaleDateString()}</span>
                <span className="flex items-center gap-1.5"><Tag size={16} /> By: {problem.submittedBy?.name || 'Anonymous'}</span>
              </div>

              <div className="prose max-w-none text-civic-text-body">
                <h3 className="text-lg font-bold text-civic-text-main mb-2 font-poppins">Detailed Description</h3>
                <p className="whitespace-pre-wrap">{problem.description}</p>
                
                {problem.desiredOutcome && (
                  <>
                    <h3 className="text-lg font-bold text-civic-text-main mt-6 mb-2 font-poppins">Desired Outcome</h3>
                    <p>{problem.desiredOutcome}</p>
                  </>
                )}
              </div>
            </section>

            {/* AI Analysis Section */}
            {problem.aiAnalysis && (
              <section className="bg-civic-primary-soft p-8 rounded-card border border-civic-primary/20 shadow-sm">
                <h3 className="text-xl font-bold text-civic-primary-dark mb-6 flex items-center gap-2 font-poppins">
                  <Lightbulb className="text-civic-orange" /> AI Analysis
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-civic-primary-dark mb-2 flex items-center gap-2"><AlertTriangle size={16}/> Summary</h4>
                    <p className="text-civic-text-body leading-relaxed bg-white p-4 rounded-xl border border-civic-primary/10">{problem.aiAnalysis.summary}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-civic-primary-dark mb-2 flex items-center gap-2"><AlertTriangle size={16}/> Key Points</h4>
                    <div className="text-civic-text-body leading-relaxed bg-white p-4 rounded-xl text-sm border border-civic-primary/10">
                      {problem.aiAnalysis.key_points}
                    </div>
                  </div>

                  {problem.aiAnalysis.required_expertise && problem.aiAnalysis.required_expertise.length > 0 && (
                    <div>
                      <h4 className="font-bold text-civic-primary-dark mb-3 flex items-center gap-2"><Users size={16}/> Required Expertise</h4>
                      <div className="flex flex-wrap gap-2">
                        {problem.aiAnalysis.required_expertise.map((exp: string, idx: number) => (
                          <span key={idx} className="bg-civic-page text-civic-primary-dark px-3 py-1.5 rounded-lg text-xs font-bold border border-civic-border-subtle">
                            {exp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Discussion / Comments Placeholder */}
            <section className="bg-civic-surface p-8 rounded-card border border-civic-border-subtle shadow-sm">
              <h3 className="text-xl font-bold text-civic-text-main mb-6 font-poppins">Discussion & Updates</h3>
              <div className="p-8 border-2 border-dashed border-civic-border-subtle rounded-xl text-center text-civic-text-muted font-medium">
                Community discussion feature is coming soon.
              </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            
            {/* Map Widget */}
            {problem.location?.coordinates?.latitude && problem.location?.coordinates?.longitude && (
              <section className="bg-civic-surface p-5 rounded-card border border-civic-border-subtle shadow-sm">
                <h3 className="text-sm font-bold text-civic-text-main mb-4 flex items-center gap-2 font-poppins">
                  <MapPin size={16} className="text-civic-primary"/> Geolocation
                </h3>
                <div className="h-64 rounded-xl overflow-hidden border border-civic-border-subtle z-0 relative">
                  <MapContainer 
                    center={[problem.location.coordinates.latitude, problem.location.coordinates.longitude]} 
                    zoom={12} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[problem.location.coordinates.latitude, problem.location.coordinates.longitude]}>
                      <Popup>
                        <strong>{problem.title}</strong><br/>
                        Severity: {problem.aiAnalysis?.severity}
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
                <div className="mt-4 space-y-2 text-sm text-civic-text-body">
                  <p><strong>District:</strong> {problem.location.district}</p>
                  <p><strong>State:</strong> {problem.location.state}</p>
                  {problem.location.pincode && <p><strong>Pincode:</strong> {problem.location.pincode}</p>}
                </div>
              </section>
            )}

            {/* Media Widget */}
            {problem.imagesAndMedia && problem.imagesAndMedia.length > 0 && (
              <section className="bg-civic-surface p-5 rounded-card border border-civic-border-subtle shadow-sm">
                <h3 className="text-sm font-bold text-civic-text-main mb-4 font-poppins">Attached Evidence</h3>
                <div className="grid grid-cols-2 gap-2">
                  {problem.imagesAndMedia.map((media: any, idx: number) => (
                    <a key={idx} href={media.url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-civic-border-subtle hover:opacity-90 transition-opacity">
                      <img src={media.url} alt={media.name || "Evidence"} className="w-full h-24 object-cover" />
                    </a>
                  ))}
                </div>
              </section>
            )}

          </div>

        </div>
      </main>
    </div>
  );
};

export default ProblemDetail;
