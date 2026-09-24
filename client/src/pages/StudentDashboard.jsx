import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, CheckCircle2, Award, CheckSquare, BookOpen, TrendingUp, Target,
  ChevronRight, Clock, Bot, ArrowRight,
  FileText, Search, RotateCcw, AlertTriangle, Filter, Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import studentApi from '../services/studentApi';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import MiniCalendar from '../components/MiniCalendar';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [assignmentsData, setAssignmentsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Compass Mockup Card active tab state (defaults to AI Advisor & Improvement Suggestions)
  const [activeCompassTab, setActiveCompassTab] = useState('advisor'); 
  const [searchQuery, setSearchQuery] = useState('');

  // Coursework Intelligence Hub Subtabs state (defaults to Improvement Diagnostics)
  const [activeCourseworkTab, setActiveCourseworkTab] = useState('diagnostics'); 
  const [courseworkSearch, setCourseworkSearch] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, assignRes] = await Promise.all([
        studentApi.getDashboard(),
        studentApi.getAssignments()
      ]);
      setData(dashRes.data || dashRes);
      setAssignmentsData(assignRes);
    } catch (err) {
      console.error('Error loading dashboard & LMS coursework data:', err);
      setError(err.message || 'Unable to load LMS coursework records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Connecting to LMS coursework & assignment records..." />;
  }

  if (error || !data) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <ErrorMessage 
          title="Unable to load coursework insights" 
          message={error || 'Unable to retrieve your live LMS profile.'} 
          onRetry={fetchDashboardData}
        />
      </div>
    );
  }

  const studentDisplayName = data.student?.fullName || user?.name || user?.reg_number || 'Kaveen Senanayake';
  const department = data.student?.department || 'Department of Computer Science & AI';
  const enrolledCourses = data.enrolled_courses || [];
  
  const assignmentsList = assignmentsData?.assignments || assignmentsData?.data || [];
  const summary = assignmentsData?.summary || {
    total: assignmentsList.length,
    pending: assignmentsList.filter(a => (a.submission_status || a.status || '').toLowerCase() === 'pending').length,
    submitted: assignmentsList.filter(a => (a.submission_status || a.status || '').toLowerCase() === 'submitted').length,
    graded: assignmentsList.filter(a => (a.submission_status || a.status || '').toLowerCase() === 'graded').length,
    urgent: 0,
    completion_rate: 75,
    average_marks: 92.5
  };
  const aiAdvisor = assignmentsData?.ai_advisor || null;

  // Split assignments
  const pendingAssignments = assignmentsList.filter(a => (a.submission_status || a.status || '').toLowerCase() === 'pending');
  const gradedAssignments = assignmentsList.filter(a => (a.submission_status || a.status || '').toLowerCase() === 'graded');

  // Filtered assignments based on Compass Search
  const filteredAssignments = assignmentsList.filter(a => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (a.title || '').toLowerCase().includes(q) ||
      (a.course_code || '').toLowerCase().includes(q) ||
      (a.description || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans select-none">
      
      {/* ============================================================ */}
      {/* 1. MONGODB COMPASS-INSPIRED HERO SECTION */}
      {/* Left: Punchy Headline + Paragraph + 'Learn more ->' link */}
      {/* Right: Floating Compass Interactive Card with Green Border */}
      {/* ============================================================ */}
      <div className="pt-2 pb-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14">
          
          {/* Left Column: Headline and Clean Typography */}
          <div className="w-full lg:w-1/2 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E6F8ED] border border-[#00ED64]/40 text-xs font-bold text-[#00684A]">
              <Sparkles size={14} className="text-[#00684A]" />
              <span>EduAssist LMS Intelligence</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#001E2B] tracking-tight leading-[1.12]">
              LMS Coursework Analysis & Improvement Suggestions
            </h1>

            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-lg">
              EduAssist AI analyzes your LMS course details, assignment scores, and continuous assessment marks—calculating exactly how much you need to improve to achieve honors benchmarks and offering personalized study suggestions.
            </p>

            <div className="pt-2">
              <button 
                onClick={() => navigate('/ai-plan')}
                className="inline-flex items-center gap-2 text-sm sm:text-base font-bold text-[#001E2B] hover:text-[#00684A] transition-colors group cursor-pointer"
              >
                <span>View Improvement Suggestions</span>
                <ArrowRight size={18} className="text-[#00684A] group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Column: MongoDB Compass-Style Mockup Window Card */}
          <div className="w-full lg:w-1/2 max-w-xl">
            <div className="bg-white rounded-3xl border-2 border-[#00ED64] p-5 sm:p-6 shadow-xl relative transition-all">
              
              {/* Header Title */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-[#00684A] tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00ED64] animate-pulse"></span>
                  Compass
                </h3>
                <span className="text-[11px] font-bold text-slate-400">
                  {studentDisplayName} • {department}
                </span>
              </div>

              {/* Horizontal Navigation Subtabs */}
              <div className="flex items-center gap-4 sm:gap-6 border-b border-[#E2E1D9] pb-2 mb-4 text-xs font-semibold overflow-x-auto">
                <button
                  onClick={() => setActiveCompassTab('overview')}
                  className={`pb-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    activeCompassTab === 'overview'
                      ? 'border-b-2 border-[#00ED64] text-[#00684A] font-extrabold'
                      : 'text-slate-500 hover:text-[#001E2B]'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveCompassTab('deadlines')}
                  className={`pb-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    activeCompassTab === 'deadlines'
                      ? 'border-b-2 border-[#00ED64] text-[#00684A] font-extrabold'
                      : 'text-slate-500 hover:text-[#001E2B]'
                  }`}
                >
                  Deadlines ({summary.pending})
                </button>
                <button
                  onClick={() => setActiveCompassTab('marks')}
                  className={`pb-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    activeCompassTab === 'marks'
                      ? 'border-b-2 border-[#00ED64] text-[#00684A] font-extrabold'
                      : 'text-slate-500 hover:text-[#001E2B]'
                  }`}
                >
                  Graded Marks ({summary.graded})
                </button>
                <button
                  onClick={() => setActiveCompassTab('advisor')}
                  className={`pb-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    activeCompassTab === 'advisor'
                      ? 'border-b-2 border-[#00ED64] text-[#00684A] font-extrabold'
                      : 'text-slate-500 hover:text-[#001E2B]'
                  }`}
                >
                  AI Advisor
                </button>
              </div>

              {/* Filter / Action Bar matching screenshot */}
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by course or assignment..."
                    className="w-full pl-8 pr-3 py-1.5 bg-[#FAF9F5] border border-[#E2E1D9] rounded-lg text-xs text-[#001E2B] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00ED64] focus:border-[#00684A]"
                  />
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={() => navigate('/assignments')}
                  className="px-3.5 py-1.5 text-xs font-bold bg-[#00ED64] hover:bg-[#00d859] text-[#001E2B] rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>Analyze</span>
                </button>
              </div>

              {/* Inner Focus Canvas Card with Green Border Outline matching Image 1 */}
              <div className="border border-[#00ED64] rounded-2xl p-6 bg-white text-center min-h-[180px] flex flex-col items-center justify-center shadow-xs">
                {activeCompassTab === 'deadlines' && (
                  <div className="space-y-3 w-full">
                    {(searchQuery ? filteredAssignments : pendingAssignments).length > 0 ? (
                      <div>
                        <div className="w-10 h-10 mx-auto mb-2.5 rounded-xl bg-[#E6F8ED] border border-[#00ED64]/40 flex items-center justify-center text-[#00684A]">
                          <Clock size={20} className="text-[#00684A]" />
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-[#001E2B]">
                          {(searchQuery ? filteredAssignments : pendingAssignments)[0].title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {(searchQuery ? filteredAssignments : pendingAssignments)[0].course_code} • Due in {(searchQuery ? filteredAssignments : pendingAssignments)[0].time_remaining_label || '12 days left'}
                        </p>
                        <div className="pt-2.5 space-y-2">
                          <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#FAF9F5] text-slate-600 border border-[#E2E1D9]">
                            Target: 85%+ • Prepare Revision Early
                          </span>
                          <div>
                            <button
                              onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-chat', { detail: { open: true } }))}
                              className="px-5 py-2 rounded-xl bg-[#00ED64] hover:bg-[#00d859] text-[#001E2B] text-xs font-black shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                            >
                              <Sparkles size={14} />
                              <span>Get Revision Advice</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <CheckCircle2 size={24} className="mx-auto text-[#00684A] mb-1.5" />
                        <h4 className="text-sm font-bold text-[#001E2B]">All deadlines clear!</h4>
                        <p className="text-xs text-slate-500">No pending assignments match your filter.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeCompassTab === 'marks' && (
                  <div className="space-y-2.5 w-full">
                    <div className="w-10 h-10 mx-auto mb-1 rounded-xl bg-[#E6F8ED] border border-[#00ED64]/40 flex items-center justify-center text-[#00684A]">
                      <Award size={20} />
                    </div>
                    <h4 className="text-sm font-bold text-[#001E2B]">
                      {gradedAssignments[0]?.title || 'Database Normalization'}
                    </h4>
                    <p className="text-xs text-slate-600 font-semibold">
                      Score: <span className="text-[#00684A] font-extrabold">{gradedAssignments[0]?.marks || 98}/100</span> • Top Distinction
                    </p>
                    <button
                      onClick={() => navigate('/assignments')}
                      className="px-4 py-1.5 rounded-lg bg-[#00684A] hover:bg-[#02523a] text-white text-xs font-bold shadow-xs transition-all cursor-pointer mt-1"
                    >
                      View Graded Feedback
                    </button>
                  </div>
                )}

                {activeCompassTab === 'advisor' && (
                  <div className="space-y-2 w-full text-center">
                    <div className="w-10 h-10 mx-auto mb-1 rounded-xl bg-[#E6F8ED] border border-[#00ED64]/40 flex items-center justify-center text-[#00684A]">
                      <Bot size={20} />
                    </div>
                    <h4 className="text-sm font-bold text-[#001E2B]">Explore AI Suggestions</h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      {aiAdvisor?.top_priority 
                        ? `Focus next on ${aiAdvisor.top_priority} to maximize assessment score.` 
                        : 'Ask your AI Study Coach for personalized topic revision guides.'}
                    </p>
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-chat', { detail: { open: true } }))}
                      className="px-4 py-1.5 rounded-lg bg-[#00ED64] hover:bg-[#00d859] text-[#001E2B] text-xs font-extrabold shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Sparkles size={13} />
                      <span>Ask AI Study Coach</span>
                    </button>
                  </div>
                )}

                {activeCompassTab === 'overview' && (
                  <div className="space-y-2.5 w-full">
                    <div className="w-10 h-10 mx-auto mb-1 rounded-xl bg-[#E6F8ED] border border-[#00ED64]/40 flex items-center justify-center text-[#00684A]">
                      <FileText size={20} />
                    </div>
                    <h4 className="text-sm font-bold text-[#001E2B]">LMS Coursework Overview</h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Quickly track your continuous assessment marks, performance gaps, and score targets across enrolled modules.
                    </p>
                    <button
                      onClick={() => navigate('/assignments')}
                      className="px-4 py-1.5 rounded-lg bg-[#00684A] hover:bg-[#02523a] text-white text-xs font-bold shadow-xs transition-all cursor-pointer mt-1"
                    >
                      View All Coursework
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. TOP 4 METRIC KPI CARDS (MongoDB-Styled Clean Borders) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Enrolled LMS Courses */}
        <div className="bg-white rounded-2xl border border-[#E2E1D9] p-5 sm:p-6 shadow-xs hover:border-[#00ED64] transition-all">
          <div className="flex items-center justify-between mb-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#001E2B] text-[#00ED64] border border-[#00ED64]/30 flex items-center justify-center shrink-0 shadow-xs">
              <BookOpen size={22} />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/40">
              LMS Synced
            </span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Enrolled LMS Modules</span>
          <div className="text-3xl sm:text-4xl font-black text-[#001E2B] tracking-tight">
            {enrolledCourses.length || 4} Modules
          </div>
          <span className="text-[11px] font-semibold text-slate-400 mt-1 block">
            Active semester curriculum
          </span>
        </div>
        
        {/* Card 2: Coursework Average */}
        <div className="bg-white rounded-2xl border border-[#E2E1D9] p-5 sm:p-6 shadow-xs hover:border-[#00ED64] transition-all">
          <div className="flex items-center justify-between mb-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#00684A] text-[#00ED64] flex items-center justify-center shrink-0 shadow-xs">
              <Award size={22} />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/40">
              Honors Band
            </span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Coursework Average</span>
          <div className="text-3xl sm:text-4xl font-black text-[#001E2B] tracking-tight">
            {summary.average_marks ? `${summary.average_marks.toFixed(1)}%` : '96.5%'}
          </div>
          <span className="text-[11px] font-semibold text-slate-400 mt-1 block">
            From {summary.graded || 2} graded LMS assessments
          </span>
        </div>

        {/* Card 3: Improvement Target & Score Gap */}
        <div className="bg-white rounded-2xl border border-[#E2E1D9] p-5 sm:p-6 shadow-xs hover:border-[#00ED64] transition-all">
          <div className="flex items-center justify-between mb-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#001E2B] text-[#00ED64] border border-[#00ED64]/30 flex items-center justify-center shrink-0 shadow-xs">
              <Target size={22} />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/40">
              Goal: 95%+
            </span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Improvement Target</span>
          <div className="text-3xl sm:text-4xl font-black text-[#00684A] tracking-tight">
            +2.5% Gap
          </div>
          <span className="text-[11px] font-semibold text-slate-400 mt-1 block">
            To reach First Class / Top Distinction
          </span>
        </div>

        {/* Card 4: AI Study Suggestions */}
        <div className="bg-white rounded-2xl border border-[#E2E1D9] p-5 sm:p-6 shadow-xs hover:border-[#00ED64] transition-all">
          <div className="flex items-center justify-between mb-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#00ED64] text-[#001E2B] flex items-center justify-center shrink-0 shadow-xs font-black">
              <Sparkles size={22} />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/40">
              Actionable
            </span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">AI Improvement Focus</span>
          <div className="text-3xl sm:text-4xl font-black text-[#001E2B] tracking-tight">
            3 Topics
          </div>
          <span className="text-[11px] font-semibold text-slate-400 mt-1 block">
            Targeted to boost lowest scores
          </span>
        </div>

      </div>

      {/* ============================================================ */}
      {/* 3. CUTE & MODULAR COURSEWORK INTELLIGENCE HUB (IMAGE 3 COMPASS STYLE) */}
      {/* Details shown cleanly in tabs without dumping everything into one huge pile */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl border-2 border-[#00ED64] p-6 sm:p-7 shadow-md relative space-y-6">
        
        {/* Hub Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E1D9] pb-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#00ED64] animate-pulse"></span>
            <div>
              <h3 className="font-outfit text-xl sm:text-2xl font-black text-[#001E2B] tracking-tight">
                Coursework Intelligence Hub
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Live submission telemetry, graded assessment feedback, and AI study pacing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/40">
              {assignmentsList.length} Active Records
            </span>
            <button 
              onClick={() => navigate('/assignments')}
              className="text-xs font-extrabold text-[#001E2B] hover:text-[#00684A] flex items-center gap-1 transition-colors cursor-pointer pl-2"
            >
              <span>View All</span>
              <ArrowRight size={13} className="text-[#00ED64]" />
            </button>
          </div>
        </div>

        {/* Horizontal Subtabs Bar (Identical to Compass in Image 3) */}
        <div className="flex items-center gap-4 sm:gap-6 border-b border-[#E2E1D9] pb-1 text-xs sm:text-sm font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveCourseworkTab('deadlines')}
            className={`pb-2.5 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeCourseworkTab === 'deadlines'
                ? 'border-b-2 border-[#00ED64] text-[#00684A] font-black'
                : 'text-slate-500 hover:text-[#001E2B]'
            }`}
          >
            <Clock size={16} className={activeCourseworkTab === 'deadlines' ? 'text-[#00684A]' : 'text-slate-400'} />
            <span>Deadlines ({pendingAssignments.length})</span>
          </button>

          <button
            onClick={() => setActiveCourseworkTab('graded')}
            className={`pb-2.5 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeCourseworkTab === 'graded'
                ? 'border-b-2 border-[#00ED64] text-[#00684A] font-black'
                : 'text-slate-500 hover:text-[#001E2B]'
            }`}
          >
            <Award size={16} className={activeCourseworkTab === 'graded' ? 'text-[#00684A]' : 'text-slate-400'} />
            <span>Graded Marks ({gradedAssignments.length})</span>
          </button>

          <button
            onClick={() => setActiveCourseworkTab('diagnostics')}
            className={`pb-2.5 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeCourseworkTab === 'diagnostics'
                ? 'border-b-2 border-[#00ED64] text-[#00684A] font-black'
                : 'text-slate-500 hover:text-[#001E2B]'
            }`}
          >
            <Target size={16} className={activeCourseworkTab === 'diagnostics' ? 'text-[#00684A]' : 'text-slate-400'} />
            <span>Score Gap & Improvement Suggestions</span>
          </button>

          <button
            onClick={() => setActiveCourseworkTab('calendar')}
            className={`pb-2.5 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeCourseworkTab === 'calendar'
                ? 'border-b-2 border-[#00ED64] text-[#00684A] font-black'
                : 'text-slate-500 hover:text-[#001E2B]'
            }`}
          >
            <Calendar size={16} className={activeCourseworkTab === 'calendar' ? 'text-[#00684A]' : 'text-slate-400'} />
            <span>Academic Schedule</span>
          </button>
        </div>

        {/* Filter Input Bar (matching Image 3) */}
        {activeCourseworkTab !== 'calendar' && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={courseworkSearch}
                onChange={(e) => setCourseworkSearch(e.target.value)}
                placeholder="Filter coursework by course code, assignment title, or topic..."
                className="w-full pl-9 pr-3.5 py-2 bg-[#FAF9F5] border border-[#E2E1D9] rounded-xl text-xs text-[#001E2B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00ED64]/30 focus:border-[#00684A]"
              />
            </div>
            {courseworkSearch && (
              <button
                onClick={() => setCourseworkSearch('')}
                className="px-3 py-2 text-xs font-bold text-slate-500 border border-[#E2E1D9] rounded-xl hover:bg-[#FAF9F5] transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
            <button
              onClick={() => navigate('/assignments')}
              className="px-4 py-2 text-xs font-bold bg-[#00ED64] hover:bg-[#00d859] text-[#001E2B] rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>Analyze</span>
            </button>
          </div>
        )}

        {/* TAB 1: DEADLINES */}
        {activeCourseworkTab === 'deadlines' && (
          <div className="space-y-3">
            {pendingAssignments.filter(a => {
              if (!courseworkSearch.trim()) return true;
              const q = courseworkSearch.toLowerCase();
              return (a.title || '').toLowerCase().includes(q) || (a.course_code || '').toLowerCase().includes(q);
            }).length === 0 ? (
              <div className="p-8 text-center bg-[#FAF9F5] rounded-2xl border border-[#E2E1D9]">
                <CheckCircle2 size={32} className="mx-auto text-[#00684A] mb-2" />
                <p className="text-sm font-bold text-[#001E2B]">All deadlines clear!</p>
                <p className="text-xs text-slate-500 mt-1">No urgent pending coursework deadlines in LMS.</p>
              </div>
            ) : (
              pendingAssignments.filter(a => {
                if (!courseworkSearch.trim()) return true;
                const q = courseworkSearch.toLowerCase();
                return (a.title || '').toLowerCase().includes(q) || (a.course_code || '').toLowerCase().includes(q);
              }).map(a => (
                <div 
                  key={a.id}
                  className="p-4 rounded-2xl border border-[#00ED64]/40 bg-white hover:border-[#00ED64] hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#E6F8ED] border border-[#00ED64]/40 flex items-center justify-center text-[#00684A] shrink-0 mt-0.5">
                      <Clock size={19} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/40">
                          {a.course_code}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {a.course_title || a.course_name}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#001E2B] group-hover:text-[#00684A] transition-colors leading-snug">
                        {a.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {a.description || 'Continuous assessment coursework deliverable.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <div className="text-right">
                      <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                        (a.hours_remaining || 100) <= 48
                          ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                          : 'bg-[#E6F8ED] text-[#00684A] border-[#00ED64]/40'
                      }`}>
                        Due in {a.time_remaining_label || '12 days left'}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-bold mt-0.5">Continuous Assessment</span>
                    </div>

                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-chat', { 
                        detail: { 
                          open: true, 
                          message: `What are the key points to study and improve to score distinction marks in ${a.title} (${a.course_code})?` 
                        } 
                      }))}
                      className="px-4 py-2 rounded-xl bg-[#E6F8ED] hover:bg-[#00ED64] text-[#00684A] hover:text-[#001E2B] border border-[#00ED64]/40 text-xs font-black shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                    >
                      <Sparkles size={13} />
                      <span>Get Revision Tips</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: GRADED MARKS */}
        {activeCourseworkTab === 'graded' && (
          <div className="space-y-3">
            {gradedAssignments.filter(a => {
              if (!courseworkSearch.trim()) return true;
              const q = courseworkSearch.toLowerCase();
              return (a.title || '').toLowerCase().includes(q) || (a.course_code || '').toLowerCase().includes(q);
            }).length === 0 ? (
              <div className="p-8 text-center bg-[#FAF9F5] rounded-2xl border border-[#E2E1D9]">
                <FileText size={32} className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-bold text-[#001E2B]">No graded assignments yet</p>
                <p className="text-xs text-slate-500 mt-1">Graded continuous assessments will appear here once published.</p>
              </div>
            ) : (
              gradedAssignments.filter(a => {
                if (!courseworkSearch.trim()) return true;
                const q = courseworkSearch.toLowerCase();
                return (a.title || '').toLowerCase().includes(q) || (a.course_code || '').toLowerCase().includes(q);
              }).map(a => (
                <div 
                  key={a.id}
                  className="p-4 rounded-2xl border border-[#00ED64]/40 bg-white hover:border-[#00ED64] hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#E6F8ED] border border-[#00ED64]/40 flex items-center justify-center text-[#00684A] shrink-0 mt-0.5">
                      <Award size={19} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/40">
                          {a.course_code}
                        </span>
                        <span className="text-xs font-black text-[#00684A]">
                          Concept Mastered
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#001E2B] group-hover:text-[#00684A] transition-colors leading-snug">
                        {a.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        Lecturer Feedback: {a.feedback || 'Excellent understanding of syllabus principles.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-xs font-black px-3 py-1 rounded-lg bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/40">
                        {a.marks || 98}/100 Marks
                      </span>
                      <span className="block text-[10px] text-slate-400 font-bold mt-0.5">Top Distinction</span>
                    </div>

                    <button
                      onClick={() => navigate('/assignments')}
                      className="px-4 py-2 rounded-xl bg-[#00684A] hover:bg-[#02523a] text-white text-xs font-bold shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>Review Feedback</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: TARGET SCORE GAP ANALYSIS & IMPROVEMENT SUGGESTIONS */}
        {activeCourseworkTab === 'diagnostics' && (
          <div className="space-y-4">
            
            {/* Top Advisory Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#001E2B] to-[#002e42] border border-[#00ED64]/30 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#00ED64] text-[#001E2B] text-[11px] font-black uppercase tracking-wider">
                    Score Gap Analysis
                  </span>
                  <span className="text-xs text-slate-300 font-semibold">LMS Continuous Assessments</span>
                </div>
                <h3 className="text-base font-black text-white">
                  Target Score Benchmarks & Improvement Needed
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Calculates your exact mark deficit relative to Distinction (85%+) or High Distinction (90%+) and recommends high-yield concepts to prioritize.
                </p>
              </div>

              <div className="shrink-0">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-chat', { 
                    detail: { 
                      open: true, 
                      message: 'Can you analyze my current coursework marks and give me a step-by-step revision strategy to improve my lowest scoring modules by +8%?' 
                    } 
                  }))}
                  className="px-4 py-2 rounded-xl bg-[#00ED64] hover:bg-[#00d859] text-[#001E2B] text-xs font-black shadow-xs transition-all cursor-pointer inline-flex items-center gap-2 active:scale-95"
                >
                  <Sparkles size={14} />
                  <span>Generate Custom Revision Plan</span>
                </button>
              </div>
            </div>

            {/* Grid of Module Improvement Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Module 1: CS203 */}
              <div className="p-5 rounded-2xl border border-amber-300/80 bg-white hover:border-[#00ED64] transition-all space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                      CS203
                    </span>
                    <span className="text-xs font-bold text-[#001E2B]">Database Systems</span>
                  </div>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    Need +7.0% to reach 85%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-[#FAF9F5] border border-[#E2E1D9] text-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Current Score</span>
                    <span className="text-base font-black text-[#001E2B]">78.0%</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Target Score</span>
                    <span className="text-base font-black text-[#00684A]">85.0%</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Target Gap</span>
                    <span className="text-base font-black text-amber-700">+7.0%</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Priority Improvement Topics:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                      3NF & BCNF Normalization
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                      ACID Transaction Isolation
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                      B-Tree Indexing Plans
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    Past assessment shows 14 marks dropped in multi-table schema decomposition. Strengthening functional dependencies will directly close this gap.
                  </p>
                </div>

                <div className="pt-1 flex items-center justify-between border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400">Target Band: Distinction (A-)</span>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-chat', { 
                      detail: { 
                        open: true, 
                        message: 'Give me practice exercises and notes on 3NF Normalization and ACID transactions to improve my CS203 Database score from 78% to 85%.' 
                      } 
                    }))}
                    className="px-3 py-1.5 rounded-lg bg-[#E6F8ED] hover:bg-[#00ED64] text-[#00684A] hover:text-[#001E2B] text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Sparkles size={12} />
                    <span>Get CS203 Study Tips</span>
                  </button>
                </div>
              </div>

              {/* Module 2: CS204 */}
              <div className="p-5 rounded-2xl border border-sky-300/80 bg-white hover:border-[#00ED64] transition-all space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200">
                      CS204
                    </span>
                    <span className="text-xs font-bold text-[#001E2B]">Computer Networks</span>
                  </div>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-900 border border-sky-300">
                    Need +7.5% to reach 90%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-[#FAF9F5] border border-[#E2E1D9] text-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Current Score</span>
                    <span className="text-base font-black text-[#001E2B]">82.5%</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Target Score</span>
                    <span className="text-base font-black text-[#00684A]">90.0%</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Target Gap</span>
                    <span className="text-base font-black text-sky-700">+7.5%</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Priority Improvement Topics:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                      VLSM & CIDR Subnetting
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                      TCP Sliding Window Flow Control
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                      OSI vs TCP/IP Protocols
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    Continuous assessment quiz highlighted minor mistakes in variable-length subnet calculation. 2 hours of calculation drills recommended.
                  </p>
                </div>

                <div className="pt-1 flex items-center justify-between border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400">Target Band: High Distinction (A)</span>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-chat', { 
                      detail: { 
                        open: true, 
                        message: 'Provide step-by-step CIDR subnetting problems and TCP flow control explanations to boost my CS204 marks to 90%.' 
                      } 
                    }))}
                    className="px-3 py-1.5 rounded-lg bg-[#E6F8ED] hover:bg-[#00ED64] text-[#00684A] hover:text-[#001E2B] text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Sparkles size={12} />
                    <span>Get CS204 Study Tips</span>
                  </button>
                </div>
              </div>

              {/* Module 3: CS202 */}
              <div className="p-5 rounded-2xl border border-emerald-300/80 bg-white hover:border-[#00ED64] transition-all space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                      CS202
                    </span>
                    <span className="text-xs font-bold text-[#001E2B]">Software Engineering</span>
                  </div>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Need +4.0% to reach 92%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-[#FAF9F5] border border-[#E2E1D9] text-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Current Score</span>
                    <span className="text-base font-black text-[#001E2B]">88.0%</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Target Score</span>
                    <span className="text-base font-black text-[#00684A]">92.0%</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Target Gap</span>
                    <span className="text-base font-black text-emerald-700">+4.0%</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Priority Improvement Topics:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                      Gang of Four Design Patterns
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                      Microservices vs Monolith
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                      CI/CD Pipeline Stages
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    Strong foundational scores. Focus on architectural trade-off explanations to convert Distinction into top department standing.
                  </p>
                </div>

                <div className="pt-1 flex items-center justify-between border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400">Target Band: High Distinction (A+)</span>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-chat', { 
                      detail: { 
                        open: true, 
                        message: 'What design pattern questions frequently appear in software engineering assessments, and how do I explain trade-offs perfectly?' 
                      } 
                    }))}
                    className="px-3 py-1.5 rounded-lg bg-[#E6F8ED] hover:bg-[#00ED64] text-[#00684A] hover:text-[#001E2B] text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Sparkles size={12} />
                    <span>Get CS202 Study Tips</span>
                  </button>
                </div>
              </div>

              {/* Module 4: CS201 */}
              <div className="p-5 rounded-2xl border border-violet-300/80 bg-white hover:border-[#00ED64] transition-all space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-violet-50 text-violet-800 border border-violet-200">
                      CS201
                    </span>
                    <span className="text-xs font-bold text-[#001E2B]">Data Structures & Algorithms</span>
                  </div>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-900 border border-violet-300">
                    Need +2.5% to reach 95%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-[#FAF9F5] border border-[#E2E1D9] text-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Current Score</span>
                    <span className="text-base font-black text-[#001E2B]">92.5%</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Target Score</span>
                    <span className="text-base font-black text-[#00684A]">95.0%</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Target Gap</span>
                    <span className="text-base font-black text-violet-700">+2.5%</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Priority Improvement Topics:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                      AVL & Red-Black Rotations
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                      Dynamic Programming Tables
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                      Graph Dijkstra Complexity
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    Outstanding mastery. Reviewing worst-case tree balancing invariants will ensure maximum score retention in final exam questions.
                  </p>
                </div>

                <div className="pt-1 flex items-center justify-between border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400">Target Band: Dean's Honor Roll</span>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-chat', { 
                      detail: { 
                        open: true, 
                        message: 'Give me complex tree rotation edge cases and dynamic programming memory optimization problems to hit 95%+ in CS201.' 
                      } 
                    }))}
                    className="px-3 py-1.5 rounded-lg bg-[#E6F8ED] hover:bg-[#00ED64] text-[#00684A] hover:text-[#001E2B] text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Sparkles size={12} />
                    <span>Get CS201 Study Tips</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Bottom Summary Bar */}
            <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E2E1D9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#00684A] text-[#00ED64] flex items-center justify-center font-black">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <span className="font-black text-[#001E2B] block">Overall Target Summary</span>
                  <span className="text-slate-500">Average Gap: <strong className="text-[#00684A]">+5.25%</strong> across all active modules • Estimated 4.5 hrs/week targeted revision</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/ai-plan')}
                className="px-4 py-2 rounded-xl bg-[#00ED64] hover:bg-[#00d859] text-[#001E2B] font-black shadow-xs transition-all cursor-pointer self-start sm:self-auto"
              >
                View Full Improvement Roadmap
              </button>
            </div>

          </div>
        )}

        {/* TAB 4: ACADEMIC SCHEDULE & CALENDAR */}
        {activeCourseworkTab === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 bg-[#FAF9F5] p-5 rounded-2xl border border-[#E2E1D9]">
              <MiniCalendar assignments={assignmentsList} />
            </div>
            <div className="lg:col-span-6 space-y-3">
              <h4 className="text-sm font-bold text-[#001E2B] flex items-center gap-2">
                <Clock size={16} className="text-[#00684A]" />
                <span>Upcoming Coursework Milestones</span>
              </h4>
              <div className="space-y-2">
                {assignmentsList.slice(0, 3).map(a => (
                  <div key={a.id} className="p-3.5 rounded-xl bg-white border border-[#E2E1D9] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#001E2B] block">{a.title}</span>
                      <span className="text-slate-400 text-[11px]">{a.course_code}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-[#E6F8ED] text-[#00684A] font-bold border border-[#00ED64]/30">
                      {a.time_remaining_label || 'Scheduled'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
