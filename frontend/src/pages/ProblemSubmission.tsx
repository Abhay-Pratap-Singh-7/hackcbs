import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  UploadCloud, 
  MapPin, 
  Send, 
  CheckCircle, 
  Navigation, 
  Sparkles, 
  X, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [existingInterventions, setExistingInterventions] = useState('');
  void existingInterventions; void setExistingInterventions;
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);

  // Location State
  const [position, setPosition] = useState<L.LatLng | null>(new L.LatLng(23.3441, 85.3096));
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('Ranchi');
  const [state, setState] = useState('Jharkhand');
  const [pincode, setPincode] = useState('');
  const [village, setVillage] = useState('');

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition(L.latLng(pos.coords.latitude, pos.coords.longitude));
        },
        (err) => {
          setError('Failed to get current location: ' + err.message);
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  // Auto-fetch location details on map pin drop
  React.useEffect(() => {
    if (position) {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&zoom=18&addressdetails=1`)
        .then(res => res.json())
        .then(data => {
          if (data && data.address) {
            setState(data.address.state || 'Jharkhand');
            setDistrict(data.address.state_district || data.address.county || data.address.city || 'Ranchi');
            setPincode(data.address.postcode || '');
            setVillage(data.address.village || data.address.town || data.address.suburb || data.address.neighbourhood || '');
            setAddress(data.display_name || '');
          }
        })
        .catch(err => console.error("Error fetching location details:", err));
    }
  }, [position]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setMediaFiles(prev => [...prev, ...filesArray]);

      filesArray.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setMediaPreviews(prev => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || description.length < 30) {
      setError('Description must be at least 30 characters long to provide enough context for AI analysis.');
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

      let uploadedMedia: any[] = [];
      if (mediaFiles.length > 0) {
        const formData = new FormData();
        mediaFiles.forEach((file) => {
          formData.append('files', file);
        });

        const uploadRes = await fetch('https://sih-26-jarr.onrender.com/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json().catch(() => ({}));
          throw new Error(uploadErr.message || 'Failed to upload evidence to Cloudinary');
        }

        const uploadData = await uploadRes.json();
        uploadedMedia = uploadData.data || [];
      } else {
        uploadedMedia.push({
          url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80',
          mediaType: 'image',
          name: 'Civic Evidence'
        });
      }

      const payload = {
        title: title || `${district} Civic Infrastructure Challenge`,
        description,
        location: {
          address,
          district,
          state,
          pincode,
          village,
          latitude: position?.lat || 23.3441,
          longitude: position?.lng || 85.3096
        },
        imagesAndMedia: uploadedMedia,
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#f4f1e1] font-sans text-[#2c4230] overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto relative bg-[#f4f1e1]">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#e2ded0] px-8 py-5 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-2xl font-black text-[#2c4230] flex items-center gap-2">
              Post Civic Problem & Evidence <Sparkles size={20} className="text-[#f9d877]" />
            </h2>
            <p className="text-xs text-[#556958] mt-0.5">
              Geotag issues with photos. IndicBERT AI will automatically classify, triage, and route to university R&D teams.
            </p>
          </div>

          <Link
            to="/explore"
            className="px-4 py-2 bg-white text-[#2c4230] border border-[#e2ded0] rounded-full text-xs font-bold hover:bg-[#f4f1e1] transition-all flex items-center gap-1.5 shadow-sm"
          >
            <MapPin size={14} className="text-[#4a6b4e]" /> View Map
          </Link>
        </header>

        <div className="p-8 max-w-5xl mx-auto w-full">
          {success ? (
            <div className="bg-white p-10 rounded-3xl border border-[#e2ded0] shadow-[0_8px_32px_rgba(0,0,0,0.06)] text-center animate-in zoom-in-95 space-y-6">
              <div className="w-16 h-16 bg-[#4a6b4e]/10 text-[#4a6b4e] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={36} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#2c4230] mb-1">
                  Problem Logged & AI-Classified Successfully!
                </h2>
                <p className="text-xs text-[#556958]">
                  Your challenge is now registered in the state-wide university R&D allocation pipeline.
                </p>
              </div>

              {/* AI Analysis Summary */}
              <div className="bg-[#f4f1e1] p-6 rounded-2xl text-left border border-[#e2ded0] space-y-3">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-[#2c4230] text-[#f4f1e1] font-bold text-xs uppercase rounded-full">
                    {success.aiAnalysis?.problem_classification || 'Classified'}
                  </span>
                  <span className="px-3 py-1 bg-red-100 text-red-800 font-bold text-xs uppercase rounded-full border border-red-200">
                    Severity: {success.aiAnalysis?.severity || 'Moderate'}
                  </span>
                  <span className="px-3 py-1 bg-white text-[#2c4230] font-bold text-xs rounded-full border border-[#e2ded0]">
                    District: {district}
                  </span>
                </div>

                <div className="pt-2">
                  <p className="font-bold text-[#2c4230] text-xs uppercase tracking-wider mb-1 font-mono">
                    AI Problem Summary
                  </p>
                  <p className="text-xs text-[#3e4a36] leading-relaxed">
                    {success.aiAnalysis?.summary || description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setSuccess(null);
                    setDescription('');
                    setTitle('');
                    setMediaFiles([]);
                    setMediaPreviews([]);
                  }}
                  className="px-6 py-2.5 bg-[#f4f1e1] text-[#2c4230] hover:bg-[#e2ded0] rounded-xl text-xs font-bold transition-all border border-[#e2ded0]"
                >
                  Submit Another Issue
                </button>
                <Link
                  to={`/problem/${success._id || success.id}`}
                  className="px-6 py-2.5 bg-[#2c4230] hover:bg-[#1e2d21] text-[#f4f1e1] rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  <span>Track Lifecycle & University Allocation</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs font-medium flex items-center gap-2">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              {/* Step 1: Issue Details */}
              <section className="bg-white p-7 rounded-3xl border border-[#e2ded0] shadow-[0_4px_16px_rgba(0,0,0,0.03)] space-y-4">
                <div className="flex items-center gap-2 border-b border-[#e2ded0] pb-3">
                  <span className="w-6 h-6 rounded-full bg-[#2c4230] text-white text-xs font-bold flex items-center justify-center">1</span>
                  <h3 className="text-base font-bold text-[#2c4230]">Issue Statement & Details</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#2c4230] uppercase tracking-wider mb-1 font-mono">
                      Issue Title (Optional)
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 bg-[#f4f1e1]/60 border border-[#e2ded0] rounded-xl text-xs outline-none focus:bg-white focus:border-[#4a6b4e] transition-all text-[#2c4230]"
                      placeholder="e.g., Acute Drinking Water Contamination & Arsenic Spikes"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2c4230] uppercase tracking-wider mb-1 font-mono">
                      Detailed Description * (Min 30 chars)
                    </label>
                    <textarea
                      required
                      className="w-full p-3.5 bg-[#f4f1e1]/60 border border-[#e2ded0] rounded-xl text-xs outline-none focus:bg-white focus:border-[#4a6b4e] transition-all min-h-[110px] text-[#2c4230] leading-relaxed"
                      placeholder="Describe the issue in detail, its impact on the local community, persistence duration, and any failed interventions..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </section>

              {/* Step 2: Photo Evidence Upload */}
              <section className="bg-white p-7 rounded-3xl border border-[#e2ded0] shadow-[0_4px_16px_rgba(0,0,0,0.03)] space-y-4">
                <div className="flex items-center gap-2 border-b border-[#e2ded0] pb-3">
                  <span className="w-6 h-6 rounded-full bg-[#2c4230] text-white text-xs font-bold flex items-center justify-center">2</span>
                  <h3 className="text-base font-bold text-[#2c4230]">Photo & Evidence Upload</h3>
                </div>

                <div className="border-2 border-dashed border-[#e2ded0] rounded-2xl p-8 text-center hover:bg-[#f4f1e1]/40 transition-colors cursor-pointer relative bg-[#f4f1e1]/20">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                  />
                  <UploadCloud size={40} className="mx-auto text-[#4a6b4e] mb-2" />
                  <p className="font-bold text-xs text-[#2c4230] mb-0.5">Click or drag & drop photo evidence</p>
                  <p className="text-[11px] text-[#7d8c7c]">Supports JPG, PNG, WEBP, PDF (Max 5MB each)</p>
                </div>

                {/* Previews */}
                {mediaPreviews.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs font-bold text-[#2c4230] mb-2 font-mono uppercase">Attached Evidence ({mediaPreviews.length})</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {mediaPreviews.map((src, i) => (
                        <div key={i} className="relative h-20 rounded-xl overflow-hidden border border-[#e2ded0] group bg-[#e8e4d3]">
                          <img src={src} alt={`evidence-${i}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeMedia(i)}
                            className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Step 3: Location Mapping & GIS */}
              <section className="bg-white p-7 rounded-3xl border border-[#e2ded0] shadow-[0_4px_16px_rgba(0,0,0,0.03)] space-y-4">
                <div className="flex items-center justify-between border-b border-[#e2ded0] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#2c4230] text-white text-xs font-bold flex items-center justify-center">3</span>
                    <h3 className="text-base font-bold text-[#2c4230]">GIS Geotagging & Location</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="text-xs bg-[#f4f1e1] text-[#2c4230] hover:bg-[#e2ded0] px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 transition-colors border border-[#e2ded0]"
                  >
                    <Navigation size={13} className="text-[#4a6b4e]" /> Auto-Detect Location
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#2c4230] uppercase mb-1 font-mono">District *</label>
                        <input
                          required
                          type="text"
                          className="w-full p-2.5 bg-[#f4f1e1]/60 border border-[#e2ded0] rounded-xl text-xs outline-none focus:bg-white text-[#2c4230]"
                          value={district}
                          onChange={e => setDistrict(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#2c4230] uppercase mb-1 font-mono">State *</label>
                        <input
                          required
                          type="text"
                          className="w-full p-2.5 bg-[#f4f1e1]/60 border border-[#e2ded0] rounded-xl text-xs outline-none focus:bg-white text-[#2c4230]"
                          value={state}
                          onChange={e => setState(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#2c4230] uppercase mb-1 font-mono">Local Address / Landmark</label>
                      <input
                        type="text"
                        className="w-full p-2.5 bg-[#f4f1e1]/60 border border-[#e2ded0] rounded-xl text-xs outline-none focus:bg-white text-[#2c4230]"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#2c4230] uppercase mb-1 font-mono">Village / Ward</label>
                        <input
                          type="text"
                          className="w-full p-2.5 bg-[#f4f1e1]/60 border border-[#e2ded0] rounded-xl text-xs outline-none focus:bg-white text-[#2c4230]"
                          value={village}
                          onChange={e => setVillage(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#2c4230] uppercase mb-1 font-mono">Pincode</label>
                        <input
                          type="text"
                          className="w-full p-2.5 bg-[#f4f1e1]/60 border border-[#e2ded0] rounded-xl text-xs outline-none focus:bg-white text-[#2c4230]"
                          value={pincode}
                          onChange={e => setPincode(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Leaflet Pin Drop Map */}
                  <div className="h-56 w-full rounded-2xl overflow-hidden border border-[#e2ded0] relative z-0">
                    <MapContainer center={[23.3441, 85.3096]} zoom={7} style={{ height: '100%', width: '100%' }}>
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors'
                      />
                      <LocationPicker position={position} setPosition={setPosition} />
                    </MapContainer>
                    <div className="absolute top-2 right-2 z-[400] bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow text-[10px] font-bold text-[#2c4230] pointer-events-none">
                      {position ? `Lat: ${position.lat.toFixed(4)}, Lng: ${position.lng.toFixed(4)}` : 'Click map to drop pin'}
                    </div>
                  </div>
                </div>
              </section>

              {/* Submit CTA */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#2c4230] hover:bg-[#1e2d21] text-[#f4f1e1] shadow-md font-bold text-sm px-8 py-3.5 rounded-2xl flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Sparkles className="animate-spin" size={18} />
                      <span>Classifying with IndicBERT AI...</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Submit Problem & Start Tracking</span>
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
