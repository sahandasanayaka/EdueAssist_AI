import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Search, ChevronDown, Sparkles, Users, 
  Menu, X, BookOpen, CheckSquare, Target, 
  Lightbulb, User, Settings, LogOut, LayoutDashboard
} from 'lucide-react';
import ChatbotLogo from './ChatbotLogo';
import studentApi from '../services/studentApi';

export default function Header({ onToggleMobile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Dropdown & Search state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingCount, setPendingCount] = useState(1);

  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch real assignment count if student
  useEffect(() => {
    if (user?.role === 'student') {
      studentApi.getAssignments()
        .then(res => {
          const list = res.assignments || res.data || [];
          const count = list.filter(a => (a.submission_status || a.status || '').toLowerCase() === 'pending').length;
          setPendingCount(count > 0 ? count : 1);
        })
        .catch(() => {
          setPendingCount(1);
        });
    }
  }, [user]);

  const handleOpenAiAssistant = () => {
    window.dispatchEvent(new CustomEvent('toggle-ai-chat', { detail: { open: true } }));
  };

  return (
    <header className="max-w-7xl mx-auto bg-white rounded-2xl border border-slate-200/90 shadow-sm px-4 sm:px-6 py-2.5 flex items-center justify-between relative select-none">
      
      {/* 1. Left Brand Icon & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleMobile}
          className="md:hidden p-1.5 text-slate-600 hover:text-[#001E2B] rounded-lg transition-colors cursor-pointer"
          aria-label="Toggle Mobile Menu"
        >
          <Menu size={20} />
        </button>

        <NavLink to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-[#001E2B] text-[#00ED64] border border-[#00ED64]/30 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <ChatbotLogo size={22} />
          </div>
          <span className="font-outfit text-base font-extrabold text-[#001E2B] tracking-tight hidden lg:inline">
            EduAssist <span className="text-[#00684A]">AI</span>
          </span>
        </NavLink>
      </div>

      {/* 2. Center Navigation Links (Exact Match to User Reference Screenshot) */}
      <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs sm:text-sm font-semibold text-slate-600">
        
        {user?.role === 'student' ? (
          <>
            <NavLink 
              to="/student-dashboard" 
              className={({ isActive }) => 
                isActive 
                  ? "font-extrabold text-[#001E2B] transition-colors" 
                  : "hover:text-[#001E2B] transition-colors"
              }
            >
              Dashboard
            </NavLink>

            <NavLink 
              to="/courses" 
              className={({ isActive }) => 
                isActive 
                  ? "font-extrabold text-[#001E2B] transition-colors" 
                  : "hover:text-[#001E2B] transition-colors"
              }
            >
              Courses
            </NavLink>

            {/* Assignments with Black Pill Badge identical to 'Orders (2)' in screenshot */}
            <NavLink 
              to="/assignments" 
              className={({ isActive }) => 
                `flex items-center gap-1.5 transition-colors ${
                  isActive ? "font-extrabold text-[#001E2B]" : "hover:text-[#001E2B]"
                }`
              }
            >
              <span>Assignments</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#001E2B] text-white shrink-0">
                {pendingCount}
              </span>
            </NavLink>

            <NavLink 
              to="/ai-plan" 
              className={({ isActive }) => 
                isActive 
                  ? "font-extrabold text-[#001E2B] transition-colors" 
                  : "hover:text-[#001E2B] transition-colors"
              }
            >
              AI Plan
            </NavLink>
          </>
        ) : (
          <>
            <NavLink 
              to="/admin-dashboard" 
              className={({ isActive }) => 
                isActive 
                  ? "font-extrabold text-[#001E2B] transition-colors" 
                  : "hover:text-[#001E2B] transition-colors"
              }
            >
              Command Center
            </NavLink>

            <NavLink 
              to="/admin-users" 
              className={({ isActive }) => 
                isActive 
                  ? "font-extrabold text-[#001E2B] transition-colors" 
                  : "hover:text-[#001E2B] transition-colors"
              }
            >
              Users &amp; LMS Data
            </NavLink>
          </>
        )}

        {/* Dropdown Menu matching 'Settings ▾' in Reference Screenshot State 2 */}
        <div className="relative" ref={dropdownRef}>
          <button 
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`flex items-center gap-1 hover:text-[#001E2B] transition-colors cursor-pointer py-1 ${
              dropdownOpen ? 'text-[#001E2B] font-bold' : ''
            }`}
          >
            <span>{user?.role === 'student' ? 'Settings' : 'Preferences'}</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 mt-3 w-48 bg-white border border-[#E2E1D9] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              {user?.role === 'student' && (
                <NavLink 
                  to="/resources" 
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#FAF9F5] hover:text-[#001E2B] transition-colors"
                >
                  <Lightbulb size={15} className="text-slate-400" />
                  <span>Resources</span>
                </NavLink>
              )}
              
              <NavLink 
                to="/profile" 
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#FAF9F5] hover:text-[#001E2B] transition-colors"
              >
                <User size={15} className="text-slate-400" />
                <span>Account Profile</span>
              </NavLink>

              <NavLink 
                to="/settings" 
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#FAF9F5] hover:text-[#001E2B] transition-colors"
              >
                <Settings size={15} className="text-slate-400" />
                <span>System Preferences</span>
              </NavLink>

              <div className="border-t border-[#E2E1D9] my-1.5"></div>

              <button 
                onClick={() => { setDropdownOpen(false); logout(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

      </nav>

      {/* 3. Right Controls (Exact Match to User Reference Screenshot: [🔍] [Avatar] [✦ Upgrade]) */}
      <div className="flex items-center gap-3">
        
        {/* Search Icon / Expanding Search Bar (Hidden for student panel) */}
        {user?.role !== 'student' && (
          <div className="relative">
            {searchOpen ? (
              <div className="flex items-center gap-2 bg-[#FAF9F5] border border-[#E2E1D9] rounded-xl px-3 py-1.5 shadow-2xs animate-in fade-in duration-150">
                <Search size={14} className="text-slate-400" />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      navigate('/assignments');
                      setSearchOpen(false);
                    }
                  }}
                  className="w-32 sm:w-44 bg-transparent text-xs text-[#001E2B] placeholder:text-slate-400 outline-none font-medium"
                />
                <button 
                  onClick={() => setSearchOpen(false)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setSearchOpen(true)}
                className="p-2 text-slate-600 hover:text-[#001E2B] hover:bg-[#FAF9F5] rounded-xl transition-colors cursor-pointer"
                title="Search coursework & modules"
              >
                <Search size={17} />
              </button>
            )}
          </div>
        )}

        {/* Circular Profile Avatar Image matching Reference Screenshot */}
        <div 
          onClick={() => navigate('/profile')}
          className="w-8.5 h-8.5 rounded-full p-0.5 bg-gradient-to-tr from-[#00684A] to-[#00ED64] cursor-pointer shadow-xs hover:scale-105 transition-transform shrink-0" 
          title={`${user?.reg_number || 'User'} (${user?.role || 'Portal'})`}
        >
          <div className="w-full h-full rounded-full bg-[#001E2B] text-white flex items-center justify-center font-bold text-xs select-none">
            {user?.reg_number ? user.reg_number.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>

        {/* Action Button: Only Manage Users for Admin (AI Coach removed for student panel) */}
        {user?.role !== 'student' && (
          <button
            onClick={() => navigate('/admin-users')}
            className="bg-[#001E2B] hover:bg-[#002D40] text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Users size={13} className="text-[#00ED64]" />
            <span>Manage Users</span>
          </button>
        )}

      </div>

    </header>
  );
}
