import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, PlusCircle, Globe, Sprout, Menu, X, UploadCloud } from 'lucide-react';

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
    { name: 'Submit', path: '/submit-problem', icon: <PlusCircle size={20} /> },
    { name: 'Public Feed', path: '/feed', icon: <Globe size={20} /> },
    { name: 'Bulk Ingest', path: '/bulk-ingest', icon: <UploadCloud size={20} /> },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        className="md:hidden fixed top-5 left-5 z-[60] p-2 bg-civic-surface text-civic-text-main border border-civic-border-subtle rounded-xl shadow-sm hover:bg-civic-page transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-civic-text-main/50 backdrop-blur-sm z-[50]" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-[260px] bg-civic-primary border-r border-civic-primary-dark flex flex-col h-screen shrink-0 overflow-hidden font-inter transition-transform duration-300 z-[55] fixed md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Wood texture overlay for the sidebar background */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] pointer-events-none mix-blend-overlay"></div>
      
      {/* Logo Area */}
      <div className="p-6 pt-10 text-center relative z-10 flex flex-col items-center">
        <Link to="/" className="block relative transition-transform hover:scale-105">
          <img src="/assets/logo.webp" alt="Jharkhand Samadhan" className="max-w-[150px] h-auto mx-auto" />
        </Link>
      </div>

      <nav className="flex-1 px-4 py-8 flex flex-col gap-3 relative z-10 mt-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-4 px-5 py-3.5 rounded-xl font-semibold text-[15px] transition-all duration-300 relative overflow-hidden ${
              path === item.path
                ? 'bg-civic-primary-dark text-white shadow-sm'
                : 'text-civic-primary-soft/80 hover:bg-civic-primary-dark/50 hover:text-white hover:-translate-y-0.5'
            }`}
          >
            {item.icon} <span className="font-poppins">{item.name}</span>
            {path === item.path && (
              <Sprout size={16} className="absolute right-4 text-civic-primary-light opacity-80" />
            )}
          </Link>
        ))}
      </nav>



      <div className="p-5 relative z-10 border-t border-civic-primary-dark bg-civic-primary">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-civic-text-main hover:bg-civic-bg-page shadow-sm active:translate-y-1 font-semibold text-[14.5px] rounded-xl transition-all font-poppins"
        >
          <LogOut size={20} /> See you later!
        </button>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
