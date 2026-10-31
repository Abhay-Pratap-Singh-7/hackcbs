import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { UploadCloud, MapPin, Send, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationPicker = ({ position, setPosition }: { position: any, setPosition: any }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
};

const ProblemSubmission = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<any>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      navigate('/login');
    }
  }, [navigate]);

  // Form State
  const [description, setDescription] = useState('');
  const [existingInterventions] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  
  // Location State
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [village, setVillage] = useState('');

  // Auto-fetch location details on map pin drop
  React.useEffect(() => {
    if (position) {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&zoom=18&addressdetails=1`)
        .then(res => res.json())
        .then(data => {
          if (data && data.address) {
            setState(data.address.state || '');
            setDistrict(data.address.state_district || data.address.county || data.address.city || '');
            setPincode(data.address.postcode || '');
            setVillage(data.address.village || data.address.town || data.address.suburb || data.address.neighbourhood || '');
            setAddress(data.display_name || '');
          }
        })
        .catch(err => console.error("Error fetching location details:", err));
    }
  }, [position]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || description.length < 50) {
      setError('Description must be at least 50 characters long to provide enough context for AI analysis.');
      return;
    }
    if (!district) {
      setError('District location is required.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const payload = {
        description,
        location: {
          address,
          district,
          state,
          pincode,
          village,
          latitude: position?.lat || 0,
          longitude: position?.lng || 0
        },
        imagesAndMedia: [
          // Mocking upload for MVP
          { url: 'https://via.placeholder.com/600x400.png?text=Evidence', mediaType: 'image', name: 'Evidence' }
        ],
        supportingInfo: {
          existingInterventions
        }
      };

      const response = await fetch('https://sih-26-jarr.onrender.com/api/problems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || 'Problem submission failed');
      }

      setSuccess(data.data);
      // Reset form on success could go here
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#f3f6f4] font-sans text-gray-900">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto relative">
        <header className="flex items-center justify-between px-10 py-8 bg-white border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 m-0">Submit Civic Problem</h2>
            <p className="text-sm text-gray-500 mt-1">AI will automatically classify the domain and urgency.</p>
          </div>
        </header>

        <div className="p-10 max-w-5xl mx-auto w-full">
          {success ? (
            <div className="bg-white p-10 rounded-2xl border border-green-200 shadow-sm text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Problem Submitted Successfully!</h2>
              <p className="text-gray-600 mb-6">AI has analyzed and classified your submission.</p>
              
              <div className="bg-gray-50 p-6 rounded-xl text-left border border-gray-200 mb-6">
                <div className="flex gap-4 items-start mb-4">
                  <span className="px-3 py-1 bg-primary/10 text-primary font-bold text-xs uppercase rounded">
                    {success.aiAnalysis?.problem_classification}
                  </span>
                  <span className="px-3 py-1 bg-red-100 text-red-700 font-bold text-xs uppercase rounded">
                    Severity: {success.aiAnalysis?.severity}
                  </span>
                </div>
                <p className="font-medium text-gray-900 mb-2">AI Summary:</p>
                <p className="text-gray-700 text-sm">{success.aiAnalysis?.summary}</p>
              </div>
              
              <button onClick={() => setSuccess(null)} className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-hover">
                Submit Another Issue
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Step 1: Description */}
              <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">1. Issue Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Detailed Description *</label>
                    <p className="text-xs text-gray-500 mb-2">Describe the problem, its impact, and how long it has persisted. (Min 50 chars)</p>
                    <textarea 
                      required
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-h-[120px]"
                      placeholder="e.g., During peak summer months, over 5,000 residents face acute drinking water shortage..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </section>

              {/* Step 2: Location */}
              <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4 flex items-center gap-2">
                  <MapPin size={20} className="text-primary"/> 2. Location Mapping
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">District *</label>
                        <input required type="text" className="w-full p-3 border border-gray-300 rounded-xl" value={district} onChange={e => setDistrict(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">State *</label>
                        <input required type="text" className="w-full p-3 border border-gray-300 rounded-xl" value={state} onChange={e => setState(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Local Address / Landmark</label>
                      <input type="text" className="w-full p-3 border border-gray-300 rounded-xl" value={address} onChange={e => setAddress(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Village/City</label>
                        <input type="text" className="w-full p-3 border border-gray-300 rounded-xl" value={village} onChange={e => setVillage(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Pincode</label>
                        <input type="text" className="w-full p-3 border border-gray-300 rounded-xl" value={pincode} onChange={e => setPincode(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="h-[300px] w-full rounded-xl overflow-hidden border border-gray-300 relative z-0">
                    <MapContainer center={[23.6102, 85.2799]} zoom={6} style={{ height: '100%', width: '100%' }}>
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors'
                      />
                      <LocationPicker position={position} setPosition={setPosition} />
                    </MapContainer>
                    <div className="absolute top-2 right-2 z-[400] bg-white px-3 py-1 rounded shadow text-xs font-bold pointer-events-none">
                      {position ? `Lat: ${position.lat.toFixed(4)}, Lng: ${position.lng.toFixed(4)}` : 'Click map to drop pin'}
                    </div>
                  </div>
                </div>
              </section>

              {/* Step 3: Media */}
              <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4 flex items-center gap-2">
                  <ImageIcon size={20} className="text-primary"/> 3. Evidence Upload
                </h3>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                  <input 
                    type="file" 
                    multiple 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      if (e.target.files) setMediaFiles(Array.from(e.target.files));
                    }}
                  />
                  <UploadCloud size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="font-bold text-gray-700 mb-1">Drag and drop images/documents here</p>
                  <p className="text-sm text-gray-500">or click to browse from your computer (Max 5MB)</p>
                  {mediaFiles.length > 0 && (
                    <div className="mt-4 text-left border-t border-gray-200 pt-4">
                      <p className="text-xs font-bold text-gray-700 mb-2">Selected files:</p>
                      <ul className="text-sm text-gray-600 list-disc pl-5">
                        {mediaFiles.map((f, i) => (
                          <li key={i}>{f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>

              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg px-8 py-4 rounded-xl flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-70"
                >
                  {loading ? 'Analyzing with AI...' : (
                    <>
                      <Send size={20} /> Submit Problem
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProblemSubmission;
