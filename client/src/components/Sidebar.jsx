import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  CheckSquare, 
  Target, 
  Lightbulb, 
  User, 
  Settings,
  Sparkles,
  Users,
  ChevronLeft,
  ChevronRight,
  Bot
} from 'lucide-react';
import ChatbotLogo from './ChatbotLogo';

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const { user } = useAuth();

  const handleOpenAiAssistant = (e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('toggle-ai-chat', { detail: { open: true } }));
    if (onCloseMobile) onCloseMobile();
  };

  const getLinks = () => {
    if (user?.role === 'student') {
      return [
        { to: "/student-dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/courses", icon: BookOpen, label: "My Courses" },
        { to: "/assignments", icon: CheckSquare, label: "Assignments" },
        { to: "/ai-plan", icon: Target, label: "AI Study Plan" },
        { to: "/resources", icon: Lightbulb, label: "Resources" },
      ];
    }
    return [
      { to: "/admin-dashboard", icon: LayoutDashboard, label: "Command Center" },
      { to: "/admin-users", icon: Users, label: "Users & LMS Data" },
    ];
  };

  const renderContent = (isIconOnly = false) => (
    <div className="h-full flex flex-col bg-[#001E2B] border-r border-[#002D40] select-none text-white">
      {/* Brand Header */}
      <div className={`h-16 flex items-center border-b border-[#002D40] bg-[#001E2B] ${
        isIconOnly ? 'justify-center px-2' : 'justify-between px-5'
      }`}>
        <NavLink 
          to="/" 
          className="flex items-center gap-2.5 shrink-0" 
          onClick={onCloseMobile}
          title="EduAssist AI"
        >
          <ChatbotLogo size={32} />
          {!isIconOnly && (
            <div className="flex flex-col">
              <span className="font-outfit text-base font-extrabold text-white tracking-tight leading-none">
                EduAssist <span className="text-[#00ED64]">AI</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">
                {user?.role === 'student' ? 'Student Workspace' : 'Admin Console'}
              </span>
            </div>
          )}
        </NavLink>

        {/* Toggle Collapse Button (Desktop only) */}
        {!isIconOnly && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#002D40] transition-colors cursor-pointer"
            title="Collapse sidebar to maximize page space"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
        <div>
          {!isIconOnly && (
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              {user?.role === 'student' ? 'LMS Coursework & AI' : 'Administration'}
            </p>
          )}
          <nav className="space-y-1.5">
            {getLinks().map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                onClick={onCloseMobile}
                title={isIconOnly ? link.label : undefined}
                className={({ isActive }) =>
                  `flex items-center rounded-xl text-sm font-bold transition-all duration-150 group ${
                    isIconOnly ? 'justify-center p-3' : 'gap-3 px-3.5 py-2.5'
                  } ${
                    isActive 
                      ? 'bg-[#00684A] text-white shadow-md shadow-emerald-950/40 border border-[#00ED64]/50' 
                      : 'text-slate-300 hover:bg-[#002D40] hover:text-white border border-transparent'
                  }`
                }
              >
                <link.icon size={19} className="shrink-0 text-slate-400 group-hover:text-[#00ED64]" />
                {!isIconOnly && <span className="truncate">{link.label}</span>}
              </NavLink>
            ))}

            {/* AI Assistant Item for Students */}
            {user?.role === 'student' && (
              <button
                type="button"
                onClick={handleOpenAiAssistant}
                title={isIconOnly ? "AI Academic Copilot" : undefined}
                className={`w-full flex items-center rounded-xl text-sm font-bold text-emerald-200 bg-gradient-to-r from-emerald-950/60 to-[#023430]/60 border border-[#00ED64]/30 hover:border-[#00ED64]/60 hover:bg-[#003B32] transition-all duration-150 group cursor-pointer shadow-xs mt-3 ${
                  isIconOnly ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sparkles size={19} className="text-[#00ED64] group-hover:scale-110 transition-transform shrink-0" />
                  {!isIconOnly && <span>AI Assistant</span>}
                </div>
                {!isIconOnly && (
                  <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-[#00ED64] text-[#001E2B] shadow-xs">
                    Active
                  </span>
                )}
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Profile & Settings Footer */}
      <div className="p-3 border-t border-[#002D40] bg-[#00141D] space-y-1">
        {!isIconOnly && (
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Preferences
          </p>
        )}
        <NavLink 
          to="/profile" 
          onClick={onCloseMobile}
          title={isIconOnly ? "Profile" : undefined}
          className={({ isActive }) =>
            `flex items-center rounded-xl text-sm font-medium transition-colors ${
              isIconOnly ? 'justify-center p-2.5' : 'gap-3 px-3 py-2'
            } ${
              isActive ? 'bg-[#00684A] text-white font-semibold' : 'text-slate-300 hover:bg-[#002D40] hover:text-white'
            }`
          }
        >
          <User size={18} className="text-slate-400 shrink-0" /> 
          {!isIconOnly && <span>Profile</span>}
        </NavLink>
        <NavLink 
          to="/settings" 
          onClick={onCloseMobile}
          title={isIconOnly ? "Settings" : undefined}
          className={({ isActive }) =>
            `flex items-center rounded-xl text-sm font-medium transition-colors ${
              isIconOnly ? 'justify-center p-2.5' : 'gap-3 px-3 py-2'
            } ${
              isActive ? 'bg-[#00684A] text-white font-semibold' : 'text-slate-300 hover:bg-[#002D40] hover:text-white'
            }`
          }
        >
          <Settings size={18} className="text-slate-400 shrink-0" /> 
          {!isIconOnly && <span>Settings</span>}
        </NavLink>

        {/* Expand button when icon only */}
        {isIconOnly && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#002D40] transition-colors cursor-pointer mt-1"
            title="Expand sidebar"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {renderContent(false)}
          </div>
        </div>
      )}
    </>
  );
}
