import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, PlusCircle, Globe, UploadCloud, Sprout } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { name: 'Home', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Submit', path: '/submit-problem', icon: <PlusCircle size={20} /> },
    { name: 'Public Feed', path: '/feed', icon: <Globe size={20} /> },
    { name: 'Bulk Ingest', path: '/bulk-ingest', icon: <UploadCloud size={20} /> },
  ];

  return (
    <aside className="w-[260px] bg-[#2c4230] border-r-4 border-[#1e2d21] flex flex-col h-screen shrink-0 relative overflow-hidden">
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
            className={`flex items-center gap-4 px-5 py-3.5 rounded-full font-bold text-[15px] transition-all duration-300 relative overflow-hidden ${
              path === item.path
                ? 'bg-[#f4f1e1] text-[#2c4230] shadow-[0_4px_0_#8b9e7b]'
                : 'text-[#c0d4c3] hover:bg-[#3d5942] hover:text-[#f4f1e1] hover:-translate-y-0.5'
            }`}
          >
            {item.icon} <span style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.5px' }}>{item.name}</span>
            {path === item.path && (
              <Sprout size={16} className="absolute right-4 text-[#8b9e7b] opacity-80" />
            )}
          </Link>
        ))}
      </nav>



      <div className="p-5 relative z-10 border-t-2 border-[#1e2d21] bg-[#223325]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#8c593b] hover:bg-[#6b4226] text-[#fffdf2] shadow-[0_4px_0_#4a2e1b] active:shadow-[0_0px_0_#4a2e1b] active:translate-y-1 font-bold text-[14.5px] rounded-xl transition-all"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          <LogOut size={20} /> See you later!
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
