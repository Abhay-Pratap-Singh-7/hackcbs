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
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#f3f6f4]">Loading...</div>;
  if (error) return <div className="flex h-screen items-center justify-center bg-[#f3f6f4] text-red-500">{error}</div>;
  if (!problem) return <div className="flex h-screen items-center justify-center bg-[#f3f6f4]">Problem not found.</div>;

  return (
    <div className="flex h-screen w-screen bg-[#f3f6f4] font-sans text-gray-900">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto relative">
        <header className="sticky top-0 z-10 flex items-center gap-4 px-10 py-6 bg-white border-b border-gray-200">
          <Link to="/feed" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 m-0">Challenge Details</h2>
            <p className="text-sm text-gray-500 mt-1">ID: {problem._id}</p>
          </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Left Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Header & Primary Info */}
            <section className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex flex-wrap gap-3 mb-4">
                <span className={`px-3 py-1 text-xs font-bold uppercase rounded-md border ${getSeverityColor(problem.aiAnalysis?.severity)}`}>
                  {problem.aiAnalysis?.severity || 'UNKNOWN'} SEVERITY
                </span>
                <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 text-xs font-bold rounded-md">
                  {problem.aiAnalysis?.problem_classification || 'Unclassified'}
                </span>
                <span className="px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold rounded-md">
                  {problem.status || 'SUBMITTED'}
                </span>
              </div>
              
              <h1 className="text-3xl font-extrabold text-gray-900 mb-4">{problem.title || "Untitled Problem"}</h1>
              
              <div className="flex items-center gap-6 text-sm text-gray-500 font-medium mb-6">
                <span className="flex items-center gap-1.5"><MapPin size={16} /> {problem.location?.district}, {problem.location?.state}</span>
                <span className="flex items-center gap-1.5"><Clock size={16} /> {new Date(problem.createdAt).toLocaleDateString()}</span>
                <span className="flex items-center gap-1.5"><Tag size={16} /> By: {problem.submittedBy?.name || 'Anonymous'}</span>
              </div>

              <div className="prose max-w-none text-gray-700">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Detailed Description</h3>
                <p className="whitespace-pre-wrap">{problem.description}</p>
                
                {problem.desiredOutcome && (
                  <>
                    <h3 className="text-lg font-bold text-gray-900 mt-6 mb-2">Desired Outcome</h3>
                    <p>{problem.desiredOutcome}</p>
                  </>
                )}
              </div>
            </section>

            {/* AI Analysis Section */}
            {problem.aiAnalysis && (
              <section className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-2xl border border-indigo-100 shadow-sm">
                <h3 className="text-xl font-extrabold text-indigo-900 mb-6 flex items-center gap-2">
                  <Lightbulb className="text-amber-500" /> AI Analysis
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-indigo-800 mb-2 flex items-center gap-2"><AlertTriangle size={16}/> Summary</h4>
                    <p className="text-indigo-900/80 leading-relaxed bg-white/60 p-4 rounded-xl">{problem.aiAnalysis.summary}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-indigo-800 mb-2 flex items-center gap-2"><AlertTriangle size={16}/> Key Points</h4>
                    <div className="text-indigo-900/80 leading-relaxed bg-white/60 p-4 rounded-xl text-sm">
                      {problem.aiAnalysis.key_points}
                    </div>
                  </div>

                  {problem.aiAnalysis.required_expertise && problem.aiAnalysis.required_expertise.length > 0 && (
                    <div>
                      <h4 className="font-bold text-indigo-800 mb-3 flex items-center gap-2"><Users size={16}/> Required Expertise</h4>
                      <div className="flex flex-wrap gap-2">
                        {problem.aiAnalysis.required_expertise.map((exp: string, idx: number) => (
                          <span key={idx} className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-indigo-200">
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
            <section className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Discussion & Updates</h3>
              <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-500 font-medium">
                Community discussion feature is coming soon.
              </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            
            {/* Map Widget */}
            {problem.location?.coordinates?.latitude && problem.location?.coordinates?.longitude && (
              <section className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin size={16} className="text-primary"/> Geolocation
                </h3>
                <div className="h-64 rounded-xl overflow-hidden border border-gray-200 z-0 relative">
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
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <p><strong>District:</strong> {problem.location.district}</p>
                  <p><strong>State:</strong> {problem.location.state}</p>
                  {problem.location.pincode && <p><strong>Pincode:</strong> {problem.location.pincode}</p>}
                </div>
              </section>
            )}

            {/* Media Widget */}
            {problem.imagesAndMedia && problem.imagesAndMedia.length > 0 && (
              <section className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Attached Evidence</h3>
                <div className="grid grid-cols-2 gap-2">
                  {problem.imagesAndMedia.map((media: any, idx: number) => (
                    <a key={idx} href={media.url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity">
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
