import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  MapPin, 
  Search, 
  Navigation, 
  ChevronRight, 
  Layers, 
  Sparkles, 
  X, 
  ImageOff,
  Clock
} from 'lucide-react';

// Custom Marker Icons for severity
const createCustomIcon = (severity: string, isSelected: boolean) => {
  let bgColor = '#4a6b4e';
  if (severity?.toLowerCase() === 'critical' || severity?.toLowerCase() === 'high') {
    bgColor = '#dc2626';
  } else if (severity?.toLowerCase() === 'medium') {
    bgColor = '#ea580c';
  }

  const pulseRing = isSelected 
    ? `<div style="position: absolute; inset: -6px; border-radius: 9999px; background: ${bgColor}; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
    : '';

  const html = `
    <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
      ${pulseRing}
      <div style="width: 32px; height: 32px; border-radius: 9999px; background: ${bgColor}; border: 2.5px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: #ffffff;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-map-pin',
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });
};

// Recenter handler component for leaflet
const MapRecenter = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 12, { duration: 1.2 });
  }, [center, map]);
  return null;
};

const ExploreMap = () => {
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProblem, setSelectedProblem] = useState<any | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([23.3441, 85.3096]); // Ranchi coordinates
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const navigate = useNavigate();

  const categories = [
    'All',
    'Water Resources',
    'Infrastructure',
    'Public Health',
    'Education',
    'Environment',
    'Electricity'
  ];

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('https://hackcbs-cjno.onrender.com/api/problems', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setProblems(data.data || []);
        }
      } catch (err) {
        console.error('Failed to load explore map problems', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, [navigate]);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(coords);
          setMapCenter(coords);
        },
        (err) => {
          console.warn('Geolocation failed:', err.message);
        }
      );
    }
  };

  const filteredProblems = problems.filter((p) => {
    const matchCategory =
      categoryFilter === 'All' ||
      p.aiAnalysis?.problem_classification?.toLowerCase().includes(categoryFilter.toLowerCase()) ||
      p.title?.toLowerCase().includes(categoryFilter.toLowerCase());

    const matchSearch =
      searchQuery === '' ||
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location?.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location?.address?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchCategory && matchSearch;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-[#4a6b4e]/10 text-[#4a6b4e] border-[#4a6b4e]/20';
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#f4f1e1] font-sans text-[#2c4230] overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#f4f1e1]">
        {/* Top Floating Explore Bar */}
        <div className="absolute top-5 left-6 right-6 z-[400] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pointer-events-none">
          {/* Search Box */}
          <div className="pointer-events-auto flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-[#e2ded0] max-w-md w-full">
            <Search size={18} className="text-[#4a6b4e]" />
            <input
              type="text"
              placeholder="Search issues, district, or landmark..."
              className="bg-transparent text-sm w-full outline-none text-[#2c4230] placeholder-[#7d8c7c]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-[#7d8c7c] hover:text-[#2c4230]">
                <X size={16} />
              </button>
            )}
          </div>

          {/* Quick Filter Chips & Action */}
          <div className="pointer-events-auto flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {categories.slice(0, 5).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm shrink-0 ${
                  categoryFilter === cat
                    ? 'bg-[#2c4230] text-[#f4f1e1] shadow-[0_2px_8px_rgba(44,66,48,0.25)]'
                    : 'bg-white/90 text-[#3e4a36] hover:bg-white border border-[#e2ded0]'
                }`}
              >
                {cat}
              </button>
            ))}

            <button
              onClick={handleLocateMe}
              className="p-2.5 rounded-full bg-white/95 text-[#2c4230] border border-[#e2ded0] shadow-md hover:bg-[#f4f1e1] transition-all flex items-center justify-center shrink-0"
              title="Locate My Position"
            >
              <Navigation size={16} className="text-[#4a6b4e]" />
            </button>
          </div>
        </div>

        {/* Map View */}
        <div className="w-full h-full relative z-0">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center bg-[#f4f1e1] text-[#4a6b4e] font-semibold gap-2">
              <Sparkles className="animate-spin" size={20} /> Loading GIS Map...
            </div>
          ) : (
            <MapContainer
              center={mapCenter}
              zoom={11}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors | Civic GIS'
              />

              <MapRecenter center={mapCenter} />

              {/* User Location Marker */}
              {userLocation && (
                <Marker
                  position={userLocation}
                  icon={L.divIcon({
                    html: `<div style="width:16px;height:16px;border-radius:9999px;background:#2563eb;border:3px solid #fff;box-shadow:0 0 10px rgba(37,99,235,0.6);"></div>`,
                    className: 'user-pos-marker',
                    iconSize: [16, 16],
                  })}
                />
              )}

              {/* Problem Statement Markers */}
              {filteredProblems.map((p, idx) => {
                const lat = p.latitude || p.location?.latitude || p.location?.coordinates?.latitude || (23.3441 + (idx % 7 - 3) * 0.04);
                const lng = p.longitude || p.location?.longitude || p.location?.coordinates?.longitude || (85.3096 + (idx % 5 - 2) * 0.04);
                const pId = p.id || p._id;
                const isSelected = (selectedProblem?.id || selectedProblem?._id) === pId;
                const severity = p.ai_analysis?.severity || p.aiAnalysis?.severity || 'medium';

                return (
                  <Marker
                    key={pId || idx}
                    position={[lat, lng]}
                    icon={createCustomIcon(severity, isSelected)}
                    eventHandlers={{
                      click: () => {
                        setSelectedProblem(p);
                        setMapCenter([lat, lng]);
                      },
                    }}
                  />
                );
              })}
            </MapContainer>
          )}
        </div>

        {/* Bottom / Side Detail Preview Drawer */}
        {selectedProblem && (
          <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-[420px] z-[500] bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-[0_12px_36px_rgba(0,0,0,0.18)] border border-[#e2ded0] animate-in slide-in-from-bottom-6 transition-all duration-300">
            {/* Header & Close */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase ${getSeverityBadge(selectedProblem.aiAnalysis?.severity)}`}>
                  {selectedProblem.aiAnalysis?.severity || 'NORMAL'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#4a6b4e]/10 text-[#4a6b4e] border border-[#4a6b4e]/20">
                  {selectedProblem.aiAnalysis?.problem_classification || 'Civic Problem'}
                </span>
              </div>
              <button
                onClick={() => setSelectedProblem(null)}
                className="p-1 rounded-full text-[#7d8c7c] hover:bg-[#f4f1e1] hover:text-[#2c4230] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Title & Location */}
            <h3 className="text-lg font-bold text-[#2c4230] leading-snug mb-1">
              {selectedProblem.title || 'Civic Challenge'}
            </h3>
            <p className="text-xs text-[#556958] flex items-center gap-1 mb-3">
              <MapPin size={13} className="text-[#4a6b4e]" />
              {selectedProblem.location?.district || 'Central Delhi'}, {selectedProblem.location?.state || 'Delhi'}
              {selectedProblem.location?.village && ` • ${selectedProblem.location.village}`}
            </p>

            {/* Evidence Image Preview */}
            <div className="relative h-32 w-full rounded-2xl overflow-hidden mb-3 bg-[#ede8d8] flex items-center justify-center border border-[#e2ded0]">
              {selectedProblem.imagesAndMedia && selectedProblem.imagesAndMedia.length > 0 && selectedProblem.imagesAndMedia[0].url && !selectedProblem.imagesAndMedia[0].url.includes('placeholder.com') ? (
                <img
                  src={selectedProblem.imagesAndMedia[0].url}
                  alt="Evidence"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                    if ((e.target as HTMLElement).parentElement) {
                      const fallback = document.createElement('div');
                      fallback.className = 'flex flex-col items-center justify-center text-[#7d8c7c] text-xs font-semibold gap-1 w-full h-full';
                      fallback.innerHTML = '<span>No Evidence Attached</span>';
                      (e.target as HTMLElement).parentElement?.appendChild(fallback);
                    }
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-[#7d8c7c] text-xs font-semibold gap-1">
                  <ImageOff size={20} className="text-[#a4b3a4]" />
                  <span>No Evidence Attached</span>
                </div>
              )}
            </div>

            {/* AI Summary / Description snippet */}
            <p className="text-xs text-[#3e4a36] leading-relaxed line-clamp-2 mb-4 bg-[#f4f1e1]/60 p-2.5 rounded-xl border border-[#e2ded0]/60">
              {selectedProblem.aiAnalysis?.summary || selectedProblem.description}
            </p>

            {/* Status Info */}
            <div className="flex items-center justify-between text-xs text-[#556958] py-2 border-t border-[#e2ded0] mb-4">
              <span className="font-semibold text-[#2c4230]">Status: {selectedProblem.status || 'IN_PROGRESS'}</span>
              <span className="flex items-center gap-1 text-[11px] text-[#7d8c7c]">
                <Clock size={12} /> {new Date(selectedProblem.createdAt || Date.now()).toLocaleDateString()}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link
                to={`/problem/${selectedProblem.id || selectedProblem._id}`}
                className="flex-1 py-2.5 bg-[#2c4230] hover:bg-[#1e2d21] text-[#f4f1e1] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <span>View Full Tracking & Solution</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {/* Legend in Bottom Left */}
        <div className="absolute bottom-6 left-6 z-[400] hidden sm:flex items-center gap-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-[#e2ded0] shadow-md text-xs font-medium text-[#2c4230]">
          <span className="flex items-center gap-1.5 font-bold">
            <Layers size={14} className="text-[#4a6b4e]" /> GIS Map Legend:
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span> Critical / High
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Medium
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4a6b4e] inline-block"></span> Low / Active
          </span>
        </div>
      </main>
    </div>
  );
};

export default ExploreMap;
