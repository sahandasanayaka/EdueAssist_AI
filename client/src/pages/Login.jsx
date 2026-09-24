import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatbotLogo from '../components/ChatbotLogo';
import { 
  Lock, Loader2, GraduationCap, 
  Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles, 
  AlertCircle, CheckCircle2, Bot, ArrowDown
} from 'lucide-react';

export default function Login() {
  const [selectedRole, setSelectedRole] = useState('student'); // 'student' | 'admin'
  const [credentials, setCredentials] = useState({ id: '2023CSCA001', password: 'password123' });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Role metadata configurations matching MongoDB Compass Palette
  const roleConfig = {
    student: {
      label: 'Student Portal',
      tabLabel: 'Students',
      icon: GraduationCap,
      idLabel: 'Student Registration Number',
      placeholder: 'e.g. 2023CSCA001',
      defaultId: '2023CSCA001',
      badgeBg: 'bg-[#E6F8ED] text-[#00684A] border-[#00ED64]/40',
      activeTabClass: 'border-[#00684A] text-[#00684A] bg-white rounded-t-lg font-bold',
      submitBtnClass: 'bg-[#00684A] hover:bg-[#02523a] text-white shadow-md shadow-emerald-950/20',
      demoAccounts: [
        { label: 'Student 001 (Alex Perera)', id: '2023CSCA001', desc: 'Active Coursework' },
        { label: 'Student 003 (Needs Support)', id: '2023CSCA003', desc: 'Deadline Alerts' }
      ]
    },
    admin: {
      label: 'Administrator',
      tabLabel: 'Admin',
      icon: ShieldCheck,
      idLabel: 'Administrator Username',
      placeholder: 'e.g. admin01',
      defaultId: 'admin01',
      badgeBg: 'bg-orange-50 text-[#FF6B35] border-orange-200',
      activeTabClass: 'border-[#001E2B] text-[#001E2B] bg-white rounded-t-lg font-bold',
      submitBtnClass: 'bg-[#001E2B] hover:bg-[#023430] text-[#00ED64] shadow-md shadow-slate-950/20',
      demoAccounts: [
        { label: 'System Admin (admin01)', id: 'admin01', desc: 'Institutional Control' }
      ]
    }
  };

  const currentRole = roleConfig[selectedRole];

  const handleRoleChange = (roleKey) => {
    setSelectedRole(roleKey);
    setFormError('');
    const targetConfig = roleConfig[roleKey];
    setCredentials({
      id: targetConfig.defaultId,
      password: 'password123'
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    const res = await login(credentials.id, credentials.password);
    setIsSubmitting(false);

    if (res.success && res.user) {
      navigate(`/${res.user.role}-dashboard`);
    } else {
      setFormError(res.error || 'Invalid credentials. Please verify your ID and password.');
    }
  };

  const handleQuickFill = (id, password) => {
    setCredentials({ id, password });
    setTimeout(() => {
      const submitBtn = document.getElementById('loginSubmitBtn');
      if (submitBtn) submitBtn.click();
    }, 80);
  };

  const scrollToLogin = () => {
    const el = document.getElementById('loginSection');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#001E2B] font-sans selection:bg-[#00ED64]/20 selection:text-[#001E2B] select-none">
      
      {/* Background ambient subtle blur orbs */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-[#FF6B35]/8 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="fixed bottom-0 right-10 w-[500px] h-[500px] bg-[#00ED64]/8 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* ============================================================ */}
      {/* 1. TOP HEADER (EduAssist AI + Subtle Clean Logo) */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-40 bg-[#FAF9F5]/90 backdrop-blur-md border-b border-[#E2E1D9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Subtle Clean Brand Logo with Symmetrical Graduation Cap */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <ChatbotLogo size={30} />
            <div className="flex flex-col">
              <span className="font-outfit text-lg sm:text-xl font-extrabold text-[#001E2B] tracking-tight leading-none">
                EduAssist <span className="text-[#00684A]">AI</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">
                Academic LMS Intelligence
              </span>
            </div>
          </div>

          {/* Quick Sign In Button */}
          <div className="flex items-center gap-3">
            <button 
              onClick={scrollToLogin}
              className="px-5 py-2 rounded-full bg-[#00684A] hover:bg-[#02523a] text-white text-xs sm:text-sm font-extrabold shadow-sm transition-all duration-150 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>Sign In to Portal</span>
              <ArrowDown size={14} className="text-[#00ED64]" />
            </button>
          </div>

        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. HERO SECTION: STUDENT HERO VISUAL KEPT (GIRL'S IMAGE) */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden pt-8 sm:pt-12 pb-12 sm:pb-16 bg-gradient-to-b from-[#FFF5F0] via-[#FAF9F5] to-white border-b border-[#E2E1D9]/60">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14">
            
            {/* Left Column: Bold Headline, Subtitle, Direct Action & Feature Pills */}
            <div className="w-full lg:max-w-2xl space-y-5 text-left">
              
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF6B35]/15 border border-[#FF6B35]/25 text-xs font-black uppercase tracking-wider text-[#FF6B35]">
                <Sparkles size={14} className="text-[#FF6B35]" />
                <span>AI LMS Coursework Platform</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-outfit text-4xl sm:text-5xl lg:text-6xl font-black text-[#001E2B] tracking-tight leading-[1.08]">
                Smart Learning <br />
                Deeper &amp; More <br />
                <span className="text-[#FF6B35]">-Focused</span>
              </h1>

              {/* Semester Live Sync */}
              <div className="pt-1 flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00ED64] animate-pulse"></span>
                <span>Semester 2024/2025 Live Sync</span>
              </div>

              {/* Modern Feature Pills */}
              <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs font-bold text-slate-600">
                <span className="px-3.5 py-2 rounded-xl bg-white border border-[#E2E1D9] shadow-2xs flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-[#00684A]" />
                  <span>Real-Time LMS Deadlines</span>
                </span>
                <span className="px-3.5 py-2 rounded-xl bg-white border border-[#E2E1D9] shadow-2xs flex items-center gap-2">
                  <Sparkles size={15} className="text-[#FF6B35]" />
                  <span>Marks Diagnostics</span>
                </span>
                <span className="px-3.5 py-2 rounded-xl bg-white border border-[#E2E1D9] shadow-2xs flex items-center gap-2">
                  <Bot size={15} className="text-[#00684A]" />
                  <span>Exam Study Guidance</span>
                </span>
              </div>

            </div>

            {/* Right Column: Kept Original Student Girl Photo Visual */}
            <div className="relative shrink-0 flex justify-center lg:justify-end">
              
              <div className="relative w-[320px] sm:w-[370px]">
                
                {/* Background Geometric Graphic Shapes (Emerald Green & Orange) */}
                <div className="absolute top-1/2 -translate-y-1/2 right-4 w-68 h-68 sm:w-80 sm:h-80 bg-gradient-to-tr from-[#00684A] to-[#00ED64] rounded-3xl rotate-12 -z-10 opacity-90 shadow-xl"></div>
                <div className="absolute bottom-2 -right-4 w-44 h-44 sm:w-52 sm:h-52 bg-gradient-to-tr from-[#FF6B35] to-[#FFA07A] rounded-3xl -rotate-6 -z-10 opacity-90 shadow-lg"></div>

                {/* Main Student Photo Container (Original Girl Photo) */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white w-full h-[390px] sm:h-[450px]">
                  <img 
                    src="/student-hero.jpg" 
                    alt="University Student" 
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent"></div>
                </div>

                {/* Floating Badge 1: Top Left - Verified LMS Badge */}
                <div className="absolute -top-3 -left-3 bg-white rounded-2xl p-3 shadow-xl border border-slate-100 flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                    <CheckCircle2 size={18} className="text-slate-900" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-[#001E2B] leading-none">LMS Verified</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Continuous Sync</p>
                  </div>
                </div>

                {/* Floating Badge 2: Bottom - AI Diagnostic */}
                <div className="absolute -bottom-3 left-4 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-slate-100 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#E6F8ED] text-[#00684A] flex items-center justify-center font-bold">
                    <Bot size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-[#001E2B] leading-none">AI Diagnostics</p>
                    <p className="text-[10px] font-bold text-emerald-700 mt-0.5">Continuous Assessment</p>
                  </div>
                </div>

                {/* Floating Badge 3: Top Right - Google Gemini Badge */}
                <div className="absolute top-6 -right-3 bg-white rounded-2xl p-2.5 shadow-lg border border-slate-100 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Sparkles size={17} />
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>

      </section>

      {/* ============================================================ */}
      {/* 3. EXPANSIVE & MODERN "ABOUT US" SECTION */}
      {/* ============================================================ */}
      {/* 3. EXPANSIVE & MODERN "ABOUT US & AI COPILOT" SECTION */}
      {/* ============================================================ */}
      <section className="py-14 sm:py-20 bg-white border-b border-[#E2E1D9] overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left 7 Columns: Mission & Coursework Intelligence Features (Styled like Image 2) */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              {/* Pill Badge matching Image 2 */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFEFE7] border border-[#FF6B35]/30 text-xs font-bold tracking-wider text-[#FF6B35] uppercase">
                <Sparkles size={14} className="text-[#FF6B35]" />
                <span>AI Academic Intelligence</span>
              </div>

              {/* Main Headline matching Image 2 typography & orange accent */}
              <h2 className="font-outfit text-3xl sm:text-4xl lg:text-5xl font-black text-[#001E2B] tracking-tight leading-[1.12]">
                Smart Study <br />
                Deeper &amp; More <br />
                <span className="text-[#FF6B35]">-Personalized</span>
              </h2>

              <div className="pt-1 flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00ED64] animate-pulse"></span>
                <span>100% University Syllabus Grounded</span>
              </div>

              {/* Modern Feature Pills matching Image 2 (Replacing the 3 bulky grey cards!) */}
              <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs font-bold text-slate-700">
                <span className="px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E1D9] shadow-2xs flex items-center gap-2 hover:border-[#00ED64] hover:shadow-xs transition-all">
                  <CheckCircle2 size={16} className="text-[#00684A]" />
                  <span>Real-Time LMS Deadlines</span>
                </span>
                <span className="px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E1D9] shadow-2xs flex items-center gap-2 hover:border-[#FF6B35] hover:shadow-xs transition-all">
                  <Sparkles size={16} className="text-[#FF6B35]" />
                  <span>Marks Diagnostics</span>
                </span>
                <span className="px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E1D9] shadow-2xs flex items-center gap-2 hover:border-[#00ED64] hover:shadow-xs transition-all">
                  <Bot size={16} className="text-[#00684A]" />
                  <span>Exam Study Guidance</span>
                </span>
              </div>

            </div>

            {/* Right 5 Columns: The 3D Cute Chatbot Mascot (Crystal-Clear HD Cutout) */}
            <div className="lg:col-span-5 flex justify-center items-center pt-4 lg:pt-0">
              <div className="relative w-[280px] sm:w-[340px] lg:w-[360px]">
                
                {/* Background Geometric Graphic Shapes (Emerald Green & Orange) */}
                <div className="absolute top-1/2 -translate-y-1/2 right-4 w-60 h-60 sm:w-68 sm:h-68 bg-gradient-to-tr from-[#00684A] to-[#00ED64] rounded-3xl rotate-12 -z-10 opacity-90 shadow-xl"></div>
                <div className="absolute bottom-2 -right-2 w-40 h-40 sm:w-48 sm:h-48 bg-gradient-to-tr from-[#FF6B35] to-[#FFA07A] rounded-3xl -rotate-6 -z-10 opacity-90 shadow-lg"></div>

                {/* Free-Standing 3D Cute Robot Mascot (100% Transparent Razor-Sharp HD Cutout) */}
                <div className="relative z-10 flex justify-center">
                  <img 
                    src="/chatbot-mascot.png" 
                    alt="EduAssist AI Mascot" 
                    className="w-[270px] sm:w-[320px] lg:w-[340px] h-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500 cursor-pointer"
                  />
                </div>

                {/* Floating Badge 1: Top Left - AI Copilot */}
                <div className="absolute -top-3 -left-3 bg-white rounded-2xl p-2.5 shadow-xl border border-slate-100 flex items-center gap-2 z-20">
                  <div className="w-7 h-7 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                    <CheckCircle2 size={15} className="text-slate-900" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-[#001E2B] leading-none">AI Copilot</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">Syllabus Grounded</p>
                  </div>
                </div>

                {/* Floating Badge 2: Bottom - Smart Assistant */}
                <div className="absolute -bottom-3 left-2 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 shadow-xl border border-slate-100 flex items-center gap-2 z-20">
                  <div className="w-7 h-7 rounded-xl bg-[#E6F8ED] text-[#00684A] flex items-center justify-center font-bold">
                    <Bot size={15} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-[#001E2B] leading-none">Smart Assistant</p>
                    <p className="text-[9px] font-bold text-emerald-700 mt-0.5">Continuous Assessment</p>
                  </div>
                </div>

                {/* Floating Badge 3: Top Right - Sparkles */}
                <div className="absolute top-2 -right-3 bg-white rounded-2xl p-2 shadow-lg border border-slate-100 flex items-center justify-center z-20">
                  <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Sparkles size={15} />
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. LOGIN PORTAL: CLEAN CENTERED MONGODB COMPASS WINDOW */}
      {/* ============================================================ */}
      <section id="loginSection" className="py-12 sm:py-18 bg-[#FAF9F5] border-b border-[#E2E1D9]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-lg mx-auto mb-8 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#00684A] bg-[#E6F8ED] px-3 py-1 rounded-full border border-[#00ED64]/40">
              Institutional Access
            </span>
            <h2 className="font-outfit text-2xl sm:text-3xl font-extrabold text-[#001E2B] tracking-tight">
              Sign In to Your Academic Portal
            </h2>
          </div>

          {/* Clean Centered Login Portal Container */}
          <div className="max-w-lg mx-auto">
            
            {/* Smart MongoDB Compass Window Card Container (Centered) */}
            <div className="w-full bg-white rounded-3xl shadow-xl border-2 border-[#E2E1D9] hover:border-[#00ED64]/50 transition-all overflow-hidden relative z-10">
              
              {/* Top Compass Window Bar (Tabs + Controls) */}
              <div className="bg-[#FAF9F5] border-b border-[#E2E1D9] px-6 pt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  
                  {/* Student Tab */}
                  <button
                    type="button"
                    onClick={() => handleRoleChange('student')}
                    className={`px-4 py-2 text-xs sm:text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                      selectedRole === 'student'
                        ? currentRole.activeTabClass
                        : 'border-transparent text-slate-500 hover:text-[#001E2B]'
                    }`}
                  >
                    <GraduationCap size={16} />
                    <span>Student Portal</span>
                  </button>

                  {/* Admin Tab */}
                  <button
                    type="button"
                    onClick={() => handleRoleChange('admin')}
                    className={`px-4 py-2 text-xs sm:text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                      selectedRole === 'admin'
                        ? currentRole.activeTabClass
                        : 'border-transparent text-slate-500 hover:text-[#001E2B]'
                    }`}
                  >
                    <ShieldCheck size={16} />
                    <span>Administrator</span>
                  </button>

                </div>

                {/* Simulated Window Controls */}
                <div className="flex items-center gap-1.5 pb-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                </div>
              </div>

              {/* Window Body: Clean Login Form */}
              <div className="p-6 sm:p-7">
                
                {/* Error Banner */}
                {formError && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0 text-rose-500" />
                    <span className="font-semibold">{formError}</span>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      {currentRole.idLabel}
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <currentRole.icon size={17} />
                      </div>
                      <input
                        type="text"
                        required
                        value={credentials.id}
                        onChange={(e) => setCredentials({ ...credentials, id: e.target.value })}
                        placeholder={currentRole.placeholder}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#FAF9F5] border border-[#E2E1D9] rounded-xl text-sm font-semibold text-[#001E2B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00ED64]/30 focus:border-[#00684A] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <Lock size={17} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={credentials.password}
                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                        placeholder="Enter password"
                        className="w-full pl-10 pr-11 py-2.5 bg-[#FAF9F5] border border-[#E2E1D9] rounded-xl text-sm font-semibold text-[#001E2B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00ED64]/30 focus:border-[#00684A] focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    id="loginSubmitBtn"
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3 px-4 rounded-xl font-black text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-sm ${currentRole.submitBtnClass} disabled:opacity-50`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        <span>Authenticating Session...</span>
                      </>
                    ) : (
                      <>
                        <span>Connect to {currentRole.label}</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>

                {/* 1-Click Fast Demo Logins */}
                <div className="mt-6 pt-4 border-t border-[#E2E1D9]">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
                    Fast 1-Click Demo Login
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentRole.demoAccounts.map((account) => (
                      <button
                        key={account.id}
                        type="button"
                        onClick={() => handleQuickFill(account.id, 'password123')}
                        className="p-2.5 rounded-xl border border-[#E2E1D9] bg-[#FAF9F5] hover:bg-white hover:border-[#00ED64] transition-all text-left group cursor-pointer"
                      >
                        <p className="text-xs font-bold text-[#001E2B] group-hover:text-[#00684A] transition-colors truncate">
                          {account.label}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">ID: {account.id}</p>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. MINIMAL COMPACT FOOTER */}
      {/* ============================================================ */}
      <footer className="py-6 bg-white border-t border-[#E2E1D9] text-center text-xs text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ChatbotLogo size={24} />
            <span className="font-outfit text-sm font-bold text-[#001E2B]">
              EduAssist <span className="text-[#00684A]">AI</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">
              University LMS Coursework &amp; Academic Intelligence
            </span>
          </div>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} EduAssist AI. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
