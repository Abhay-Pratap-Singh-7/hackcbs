import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, PlusCircle, Globe, Sprout, Menu, X, UploadCloud, MapPin } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const navItems = [
    ...(user.role === 'INSTITUTE_ADMIN' 
        ? [{ name: 'University Portal', path: '/university/dashboard', icon: <LayoutDashboard size={20} /> }] 
        : [{ name: 'Home', path: '/dashboard', icon: <LayoutDashboard size={20} /> }]),
    { name: 'Explore Map', path: '/explore', icon: <MapPin size={20} /> },
    { name: 'Submit Problem', path: '/submit-problem', icon: <PlusCircle size={20} /> },
    { name: 'Public Feed', path: '/feed', icon: <Globe size={20} /> },
    { name: 'Bulk Ingest', path: '/bulk-ingest', icon: <UploadCloud size={20} /> },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        className="md:hidden fixed top-5 left-5 z-[60] p-2 bg-[#f4f1e1] text-[#2c4230] border border-[#e2ded0] rounded-xl shadow-md hover:bg-[#ebe6d3] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[50]" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={`w-[260px] bg-[#2c4230] border-r-2 border-[#1e2d21] flex flex-col h-screen shrink-0 overflow-hidden font-sans transition-transform duration-300 z-[55] fixed md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Thematic Wood Texture & Gradient overlay matching Dashboard App Bar */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] pointer-events-none mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#4a6b4e]/30 via-transparent to-[#1e2d21]/70 pointer-events-none"></div>
        
        {/* Logo Area */}
        <div className="p-6 pt-8 text-center relative z-10 flex flex-col items-center border-b border-[#3d5942]/60">
          <Link to="/" className="block relative transition-transform hover:scale-105">
            <img src="/assets/logo.webp" alt="Jharkhand Samadhan" className="max-w-[160px] h-auto mx-auto drop-shadow-md" />
          </Link>
          <span className="text-[11px] font-semibold text-[#a4c2a8] tracking-widest uppercase mt-2 font-mono">
            Citizen Action Hub
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-2.5 relative z-10 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = path === item.path || (item.path !== '/' && path.startsWith(item.path + '/'));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-[14.5px] transition-all duration-300 relative overflow-hidden ${
                  isActive
                    ? 'bg-[#f4f1e1] text-[#2c4230] shadow-[0_4px_12px_rgba(0,0,0,0.15)] font-bold'
                    : 'text-[#c0d4c3] hover:bg-[#3d5942]/60 hover:text-[#f4f1e1] hover:-translate-y-0.5'
                }`}
              >
                <span className={isActive ? 'text-[#2c4230]' : 'text-[#a4c2a8]'}>{item.icon}</span>
                <span className="font-sans">{item.name}</span>
                {isActive && (
                  <Sprout size={16} className="absolute right-3.5 text-[#4a6b4e] opacity-90 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom User / Logout Section */}
        <div className="p-4 relative z-10 border-t border-[#3d5942]/60 bg-[#1e2d21]/80">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-[#4a6b4e] text-[#f4f1e1] font-bold flex items-center justify-center text-xs border border-[#a4c2a8]/30">
              {user.name ? user.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#f4f1e1] truncate">{user.name || 'Citizen'}</p>
              <p className="text-[10px] text-[#a4c2a8] truncate">{user.district || 'Jharkhand, IN'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-[#8c593b] hover:bg-[#73472d] text-[#f4f1e1] shadow-sm active:translate-y-0.5 font-bold text-[13px] rounded-xl transition-all"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
