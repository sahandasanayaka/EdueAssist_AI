import { useState, useEffect } from 'react';
import { 
  CheckSquare, Clock, AlertCircle, FileText, Upload, Sparkles, 
  CheckCircle2, Check, AlertTriangle, Award, ChevronRight, X, Info, Target, ArrowRight, Search, Calendar
} from 'lucide-react';
import studentApi from '../services/studentApi';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [priorityActions, setPriorityActions] = useState([]);
  const [aiAdvisor, setAiAdvisor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // Filter & Search states
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'GRADED' | 'SUBMITTED' | 'URGENT'
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentApi.getAssignments();
      const list = res.data || res.assignments || [];
      setAssignments(list);
      setSummary(res.summary || null);
      setPriorityActions(res.priority_actions || []);
      setAiAdvisor(res.ai_advisor || null);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Checking active coursework, deadlines & AI priorities..." />;
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <ErrorMessage 
          title="Could not load assignments" 
          message={error} 
          onRetry={fetchAssignments} 
        />
      </div>
    );
  }

  // Filter assignments according to tab & search query
  const filteredAssignments = assignments.filter(a => {
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (a.title || '').toLowerCase().includes(q);
      const matchCourse = (a.course_code || '').toLowerCase().includes(q) || (a.course_title || '').toLowerCase().includes(q);
      const matchDesc = (a.description || '').toLowerCase().includes(q);
      if (!matchTitle && !matchCourse && !matchDesc) return false;
    }

    const s = (a.submission_status || 'pending').toUpperCase();
    if (activeTab === 'ALL') return true;
    if (activeTab === 'PENDING') return s === 'PENDING' || s === 'OVERDUE' || s === 'LATE';
    if (activeTab === 'GRADED') return s === 'GRADED';
    if (activeTab === 'SUBMITTED') return s === 'SUBMITTED';
    if (activeTab === 'URGENT') return (a.priority || '').toUpperCase() === 'URGENT';
    return true;
  });

  const urgentCount = summary?.urgent_count ?? assignments.filter(a => (a.priority || '').toUpperCase() === 'URGENT').length;
  const pendingCount = summary?.pending ?? assignments.filter(a => {
    const s = (a.submission_status || 'pending').toUpperCase();
    return s === 'PENDING' || s === 'OVERDUE' || s === 'LATE';
  }).length;
  const overdueCount = summary?.overdue ?? assignments.filter(a => (a.submission_status || '').toUpperCase() === 'OVERDUE').length;
  const gradedCount = summary?.graded ?? assignments.filter(a => (a.submission_status || '').toUpperCase() === 'GRADED').length;
  const submittedCount = summary?.submitted ?? assignments.filter(a => (a.submission_status || '').toUpperCase() === 'SUBMITTED').length;
  const completedCount = submittedCount + gradedCount;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans select-none">
      
      {/* ============================================================ */}
      {/* 1. MONGODB COMPASS-INSPIRED HERO SECTION */}
      {/* ============================================================ */}
      <div className="pt-2 pb-2">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
          
          {/* Left Column: Bold headline and clean explanation */}
          <div className="w-full lg:w-1/2 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E6F8ED] border border-[#00ED64]/40 text-xs font-bold text-[#00684A]">
              <Sparkles size={14} className="text-[#00684A]" />
              <span>Continuous Assessment Hub</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#001E2B] tracking-tight leading-[1.12]">
              Track coursework deliverables and submission status
            </h1>

            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-lg">
              EduAssist AI monitors submission countdowns, lecturer assessment rubrics, and continuous assessment weightings—helping you stay organized and submit solutions with zero stress.
            </p>

            <div className="pt-1 flex items-center gap-4">
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-chat', { detail: { open: true } }))}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-black px-4 py-2 rounded-xl bg-[#00ED64] hover:bg-[#00d859] text-[#001E2B] shadow-xs transition-all cursor-pointer"
              >
                <Sparkles size={15} />
                <span>Ask AI Assignment Coach</span>
              </button>
              
              {urgentCount > 0 && (
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  <span>{urgentCount} Urgent Deliverable{urgentCount > 1 ? 's' : ''}</span>
                </span>
              )}
            </div>
          </div>

          {/* Right Column: MongoDB Compass Interactive Window Card */}
          <div className="w-full lg:w-1/2 max-w-xl">
            <div className="bg-white rounded-3xl border-2 border-[#00ED64] p-5 sm:p-6 shadow-xl relative transition-all">
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-black text-[#00684A] tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00ED64] animate-pulse"></span>
                  AI Coursework Advisor
                </h3>
                <span className="text-[11px] font-bold text-slate-400">
                  Live Syllabus Sync
                </span>
              </div>

              <div className="p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#E2E1D9] mb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#001E2B]">Pacing &amp; Deadline Strategy</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/30">
                    High Priority
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {aiAdvisor?.overview || 'Balance your upcoming submissions by tackling high-weight continuous assessments first. Submit drafts at least 24 hours prior to deadline.'}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-slate-600 pt-1">
                <span className="flex items-center gap-1.5 text-[#00684A]">
                  <Clock size={14} />
                  <span>Next Cutoff: {assignments[0]?.time_remaining_label || '2 Days'}</span>
                </span>
                <span className="text-[#001E2B]">
                  Completion: {summary?.completion_rate || 75}%
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* In-app Notification Banner */}
      {notification && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in duration-200 ${
          notification.type === 'success' 
            ? 'bg-[#E6F8ED] text-[#00684A] border-[#00ED64]' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 size={18} className="text-[#00684A] shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
          )}
          <span className="text-xs font-bold">{notification.message}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. TOP 4 KPI CARDS (Identical to Compass Dashboard Style) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Pending */}
        <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Tasks</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-amber-700 bg-amber-50 border border-amber-200">
              {urgentCount > 0 ? `${urgentCount} Urgent` : 'Pending'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-black text-[#001E2B]">{pendingCount}</div>
            <span className="text-xs text-slate-400 font-medium">to submit</span>
          </div>
        </div>

        {/* Card 2: Overdue */}
        <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-rose-300 p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Overdue</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-rose-700 bg-rose-50 border border-rose-200">
              {overdueCount > 0 ? 'Action Req.' : 'Zero Overdue'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-black text-rose-600">{overdueCount}</div>
            <span className="text-xs text-slate-400 font-medium">past deadline</span>
          </div>
        </div>

        {/* Card 3: Graded & Average Mark */}
        <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Mark</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/30">
              Top Distinction
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-black text-[#00684A]">
              {summary?.average_marks ? `${summary.average_marks}%` : '92.5%'}
            </div>
            <span className="text-xs text-slate-400 font-medium">grade</span>
          </div>
        </div>

        {/* Card 4: Submission Completion */}
        <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completion</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/30">
              {completedCount}/{summary?.total || assignments.length} Done
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-black text-[#001E2B]">
              {summary?.completion_rate || 75}%
            </div>
            <span className="text-xs text-slate-400 font-medium">completed</span>
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* 3. ASSIGNMENTS FILTER & SEARCH BAR */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl border border-[#E2E1D9] p-4 sm:p-5 shadow-2xs space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Subtabs (Capsule Pills) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'ALL', label: `All Tasks (${assignments.length})` },
              { id: 'PENDING', label: `Pending (${pendingCount})` },
              { id: 'GRADED', label: `Graded & Marks (${gradedCount})` },
              { id: 'SUBMITTED', label: `Submitted (${submittedCount})` },
              { id: 'URGENT', label: `Urgent (${urgentCount})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#00684A] text-white shadow-xs'
                    : 'bg-[#FAF9F5] text-slate-600 hover:text-[#001E2B] hover:bg-slate-100 border border-[#E2E1D9]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by module or task..."
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#E2E1D9] text-xs text-[#001E2B] placeholder-slate-400 focus:outline-none focus:border-[#00ED64] focus:ring-1 focus:ring-[#00ED64]"
            />
          </div>

        </div>

        {/* ============================================================ */}
        {/* 4. ASSIGNMENT CARDS LIST */}
        {/* ============================================================ */}
        {filteredAssignments.length === 0 ? (
          <div className="p-8 text-center bg-[#FAF9F5] rounded-2xl border border-[#E2E1D9]">
            <CheckSquare size={32} className="mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-bold text-[#001E2B]">No coursework found</p>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery ? `No assignments matching "${searchQuery}".` : 'No assignments found in this category.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3.5 pt-1">
            {filteredAssignments.map(a => {
              const rawStatus = (a.submission_status || 'pending').toUpperCase();
              const isSubmitted = rawStatus === 'SUBMITTED';
              const isGraded = rawStatus === 'GRADED';
              const isOverdue = rawStatus === 'OVERDUE';
              const isLate = rawStatus === 'LATE';
              const priority = (a.priority || 'LOW').toUpperCase();

              return (
                <div 
                  key={a.id} 
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 group bg-white ${
                    isGraded
                      ? 'border-[#00ED64]/50 hover:border-[#00ED64]'
                      : priority === 'URGENT'
                        ? 'border-rose-200 hover:border-rose-400'
                        : 'border-[#E2E1D9] hover:border-[#00ED64]'
                  } hover:shadow-xs`}
                >
                  <div className="flex items-start gap-3.5 flex-1">
                    
                    {/* Icon Avatar */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                      isGraded || isSubmitted
                        ? 'bg-[#E6F8ED] text-[#00684A] border-[#00ED64]/40' 
                        : isOverdue || priority === 'URGENT'
                          ? 'bg-rose-50 text-rose-600 border-rose-200' 
                          : 'bg-[#FAF9F5] text-[#001E2B] border-[#E2E1D9]'
                    }`}>
                      {isGraded ? <Award size={19} /> : isSubmitted ? <CheckCircle2 size={19} /> : <FileText size={19} />}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      
                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/40">
                          {a.course_code}
                        </span>

                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                          priority === 'URGENT' 
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : priority === 'HIGH'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {priority} Priority
                        </span>

                        <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                          isGraded 
                            ? 'bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/40' 
                            : isSubmitted 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                              : isOverdue 
                                ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                : 'bg-[#FAF9F5] text-slate-700 border border-[#E2E1D9]'
                        }`}>
                          {isGraded ? `Graded: ${a.marks || 95}/100 Marks` : rawStatus}
                        </span>
                      </div>

                      {/* Title & Course */}
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-[#001E2B] group-hover:text-[#00684A] transition-colors leading-snug">
                          {a.title}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">{a.course_title}</p>
                      </div>

                      {a.description && (
                        <p className="text-xs text-slate-600 max-w-2xl leading-relaxed font-normal">
                          {a.description}
                        </p>
                      )}

                      {/* Meta Pills */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium pt-0.5">
                        <span className={`flex items-center gap-1 font-bold ${
                          isOverdue ? 'text-rose-600' : priority === 'URGENT' ? 'text-amber-600' : 'text-[#00684A]'
                        }`}>
                          <Clock size={13} />
                          {a.time_remaining_label || `Due: ${new Date(a.due_date).toLocaleDateString()}`}
                        </span>
                        <span>Weight: {a.weight || 15}% CA</span>
                        <span>Max Marks: {a.total_marks || 100}</span>
                      </div>

                      {/* Lecturer Feedback (if graded) */}
                      {a.feedback && (
                        <div className="mt-2 p-2.5 bg-[#E6F8ED]/70 rounded-xl border border-[#00ED64]/40 text-xs text-slate-800">
                          <span className="font-bold text-[#00684A]">Lecturer Feedback:</span> {a.feedback}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Status Badge */}
                  <div className="shrink-0 flex items-center justify-end pt-2 lg:pt-0">
                    {isSubmitted || isGraded ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#00684A] bg-[#E6F8ED] px-4 py-2 rounded-xl border border-[#00ED64]/40">
                        <Check size={14} />
                        <span>{isGraded ? 'Feedback Available' : 'Submitted'}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
                        <Clock size={14} className="text-amber-600" />
                        <span>Not Submitted</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
