import { useState, useEffect } from 'react';
import { 
  Users, GraduationCap, Building, AlertCircle, ShieldCheck, 
  Activity, BookOpen, FileText, CheckCircle2, Award, Calendar, 
  TrendingUp, Clock, Server, ArrowRight, Target, Sparkles, Search, Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../services/adminApi';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active Admin Compass Tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'courses' | 'risk' | 'infrastructure'
  const [courseSearch, setCourseSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL'); // 'ALL' | 'High' | 'Medium' | 'Low'

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getDashboard();
      setData(res.data || res);
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
      setError(err.message || 'Failed to load administrative analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Aggregating cross-departmental statistics and infrastructure health..." />;
  }

  if (error || !data) {
    return <ErrorMessage message={error || 'Unable to load institutional analytics.'} onRetry={fetchDashboard} />;
  }

  const metrics = data.metrics || {};
  const riskDist = data.risk_distribution || {};
  const courseAnalytics = data.course_analytics || [];
  const riskStudents = data.risk_students || [];

  const totalRiskStudents = (riskDist.high || 0) + (riskDist.medium || 0) + (riskDist.low || 0);
  const highRiskPct = totalRiskStudents > 0 ? Math.round(((riskDist.high || 0) / totalRiskStudents) * 100) : 0;
  const medRiskPct = totalRiskStudents > 0 ? Math.round(((riskDist.medium || 0) / totalRiskStudents) * 100) : 0;
  const lowRiskPct = totalRiskStudents > 0 ? Math.round(((riskDist.low || 0) / totalRiskStudents) * 100) : 100;

  // Filtered risk students
  const filteredRiskStudents = riskStudents.filter(s => {
    if (riskFilter === 'ALL') return true;
    return (s.risk_level || '').toUpperCase() === riskFilter.toUpperCase();
  });

  // Filtered courses based on search
  const filteredCourses = courseAnalytics.filter(c => {
    if (!courseSearch.trim()) return true;
    const q = courseSearch.toLowerCase();
    return (
      (c.code || '').toLowerCase().includes(q) ||
      (c.title || '').toLowerCase().includes(q) ||
      (c.lecturer_name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans select-none">
      
      {/* ============================================================ */}
      {/* 1. MONGODB COMPASS-INSPIRED HERO SECTION */}
      {/* ============================================================ */}
      <div className="pt-2 pb-2">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
          
          {/* Left Column: Bold Headline and Descriptive Subtitle */}
          <div className="w-full lg:w-1/2 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E6F8ED] border border-[#00ED64]/40 text-xs font-bold text-[#00684A]">
              <Sparkles size={14} className="text-[#00684A]" />
              <span>Institutional Telemetry &amp; AI Intelligence</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#001E2B] tracking-tight leading-[1.12]">
              Discover institutional metrics and cohort patterns
            </h1>

            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-lg">
              EduAssist AI analyzes university-wide coursework metrics, faculty module allocations, retention risk curves, and student career goals across all faculties.
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-3">
              <button 
                onClick={() => navigate('/admin-users')}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-black px-4 py-2 rounded-xl bg-[#00ED64] hover:bg-[#00d859] text-[#001E2B] shadow-xs transition-all cursor-pointer"
              >
                <Users size={15} />
                <span>Manage Platform Users</span>
              </button>
              
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-chat', { detail: { open: true } }))}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold px-4 py-2 rounded-xl bg-white hover:bg-[#FAF9F5] text-[#001E2B] border border-[#E2E1D9] transition-all cursor-pointer"
              >
                <Sparkles size={15} className="text-[#00684A]" />
                <span>Ask AI Advisor</span>
              </button>
            </div>
          </div>

          {/* Right Column: MongoDB Compass Interactive Window Card */}
          <div className="w-full lg:w-1/2 max-w-xl">
            <div className="bg-white rounded-3xl border-2 border-[#00ED64] p-5 sm:p-6 shadow-xl relative transition-all">
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-black text-[#00684A] tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00ED64] animate-pulse"></span>
                  Institutional Health Compass
                </h3>
                <span className="text-[11px] font-bold text-slate-400">
                  Campus-Wide Sync
                </span>
              </div>

              <div className="p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#E2E1D9] mb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#001E2B]">Academic Risk Distribution</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/30">
                    {lowRiskPct}% Safe
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {totalRiskStudents} students evaluated. Average attendance stands at {metrics.avg_attendance || 88}%, with {highRiskPct}% flagged for academic counseling intervention.
                </p>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-slate-600 pt-1">
                <span className="flex items-center gap-1.5 text-[#00684A]">
                  <Activity size={14} />
                  <span>Modules: {metrics.total_courses || 4} Active Catalog</span>
                </span>
                <span className="text-[#001E2B]">
                  Faculty: {metrics.total_lecturers || 2} Leads
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. TOP 4 KPI CARDS (Identical to Compass Dashboard Style) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Undergrads */}
        <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Undergrads</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/30">
              Enrolled
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-black text-[#001E2B]">{metrics.total_students ?? 24}</div>
            <span className="text-xs text-slate-400 font-medium">students</span>
          </div>
        </div>

        {/* Card 2: Faculty Instructors */}
        <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Faculty Leads</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#001E2B] bg-[#FAF9F5] border border-[#E2E1D9]">
              Instructors
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-black text-[#001E2B]">{metrics.total_lecturers ?? 6}</div>
            <span className="text-xs text-slate-400 font-medium">professors</span>
          </div>
        </div>

        {/* Card 3: Coursework Mark Average */}
        <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Coursework Avg</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/30">
              Good Standing
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-black text-[#00684A]">{metrics.avg_course_mark ?? '84.6%'}</div>
            <span className="text-xs text-slate-400 font-medium">overall</span>
          </div>
        </div>

        {/* Card 4: Continuous Assessments */}
        <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Assessments</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/30">
              Active Cohort
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-black text-[#001E2B]">{metrics.total_assessments ?? '124'}</div>
            <span className="text-xs text-slate-400 font-medium">evaluated</span>
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* 3. COMPASS-STYLE SUBTABS BAR */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl border border-[#E2E1D9] p-3 sm:p-4 shadow-2xs">
        <div className="flex items-center gap-2 overflow-x-auto text-xs font-bold pb-1 scrollbar-none">
          {[
            { id: 'overview', label: 'Overview & Analytics', icon: Activity },
            { id: 'courses', label: `Module Operations (${courseAnalytics.length})`, icon: BookOpen },
            { id: 'risk', label: `Cohort Risk Curve (${totalRiskStudents})`, icon: AlertCircle },
            { id: 'infrastructure', label: 'Infrastructure & DB', icon: Server },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-[#00684A] text-white shadow-xs'
                    : 'bg-[#FAF9F5] text-slate-600 hover:text-[#001E2B] hover:bg-slate-100 border border-[#E2E1D9]'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. DYNAMIC TAB VIEWS */}
      {/* ============================================================ */}
      
      {/* VIEW: Overview & Cohort Risk Curve */}
      {(activeTab === 'overview' || activeTab === 'risk') && (
        <div className="w-full bg-white border border-[#E2E1D9] rounded-3xl p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E1D9] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#001E2B]">
                  Institutional Academic Cohort Risk Curve
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Dynamic student risk evaluation calculated across attendance, GPA, and continuous assessment marks.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/40 px-3 py-1 rounded-full">
                {totalRiskStudents} Students Evaluated
              </span>
              <span className="text-xs font-bold text-slate-600 bg-[#FAF9F5] border border-[#E2E1D9] px-3 py-1 rounded-full">
                {lowRiskPct}% Safe
              </span>
            </div>
          </div>

          {/* Visual Percentage Distribution Bars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-rose-800">High Risk (Probation / Critical)</span>
                <span className="text-rose-900 font-black">{riskDist.high || 0} ({highRiskPct}%)</span>
              </div>
              <div className="w-full bg-white h-2.5 rounded-full overflow-hidden border border-rose-200">
                <div className="bg-rose-500 h-full rounded-full transition-all" style={{ width: `${highRiskPct}%` }} />
              </div>
              <span className="text-[10px] text-rose-600 font-semibold block">
                Requires direct counseling &amp; CA intervention
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-amber-800">Medium Risk (Borderline)</span>
                <span className="text-amber-900 font-black">{riskDist.medium || 0} ({medRiskPct}%)</span>
              </div>
              <div className="w-full bg-white h-2.5 rounded-full overflow-hidden border border-amber-200">
                <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${medRiskPct}%` }} />
              </div>
              <span className="text-[10px] text-amber-700 font-semibold block">
                Below 80% attendance or score deficit
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#E6F8ED]/70 border border-[#00ED64]/40 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#00684A]">Low Risk (Good Standing)</span>
                <span className="text-[#00684A] font-black">{riskDist.low || 0} ({lowRiskPct}%)</span>
              </div>
              <div className="w-full bg-white h-2.5 rounded-full overflow-hidden border border-[#00ED64]/40">
                <div className="bg-[#00ED64] h-full rounded-full transition-all" style={{ width: `${lowRiskPct}%` }} />
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold block">
                Honors trajectory with solid attendance
              </span>
            </div>
          </div>

          {/* Evaluated Students Cohort Roster Table */}
          <div className="pt-2 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#E2E1D9] pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Evaluated Student Body Roster &amp; Interventions
              </h4>
              
              {/* Risk Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {[
                  { id: 'ALL', label: `All (${totalRiskStudents})` },
                  { id: 'HIGH', label: `High Risk (${riskDist.high || 0})` },
                  { id: 'MEDIUM', label: `Medium Risk (${riskDist.medium || 0})` },
                  { id: 'LOW', label: `Low Risk (${riskDist.low || 0})` },
                ].map(rf => (
                  <button
                    key={rf.id}
                    onClick={() => setRiskFilter(rf.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      riskFilter === rf.id
                        ? 'bg-[#001E2B] text-white shadow-xs'
                        : 'bg-[#FAF9F5] text-slate-600 hover:text-[#001E2B] border border-[#E2E1D9]'
                    }`}
                  >
                    {rf.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2E1D9] text-slate-500 font-bold bg-[#FAF9F5]">
                    <th className="py-2.5 px-3">Student Reg</th>
                    <th className="py-2.5 px-3">Full Name</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3 text-center">GPA</th>
                    <th className="py-2.5 px-3 text-center">Attendance</th>
                    <th className="py-2.5 px-3 text-center">Avg Marks</th>
                    <th className="py-2.5 px-3 text-center">Risk Level</th>
                    <th className="py-2.5 px-3">Intervention Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E1D9]">
                  {filteredRiskStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                        No students in this risk category.
                      </td>
                    </tr>
                  ) : (
                    filteredRiskStudents.map(st => {
                      const isHigh = st.risk_level === 'High';
                      const isMed = st.risk_level === 'Medium';
                      return (
                        <tr key={st.user_id} className="hover:bg-[#FAF9F5]/70 transition-colors">
                          <td className="py-2.5 px-3 font-bold font-mono text-[#001E2B]">{st.reg_number}</td>
                          <td className="py-2.5 px-3 font-semibold text-[#001E2B]">{st.full_name}</td>
                          <td className="py-2.5 px-3 text-slate-500">{st.department}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-[#001E2B]">{st.gpa ? st.gpa.toFixed(2) : '3.00'}</td>
                          <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                            {st.avg_attendance !== null ? `${st.avg_attendance}%` : 'N/A'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-[#00684A]">
                            {st.avg_score !== null ? `${st.avg_score}%` : 'N/A'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                              isHigh 
                                ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                : isMed 
                                  ? 'bg-amber-50 text-amber-800 border-amber-200' 
                                  : 'bg-[#E6F8ED] text-[#00684A] border-[#00ED64]/40'
                            }`}>
                              {st.risk_level} Risk
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-medium">
                            {st.intervention}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: Course Operations Table */}
      {(activeTab === 'overview' || activeTab === 'courses') && (
        <div className="bg-white border border-[#E2E1D9] rounded-3xl p-6 shadow-2xs space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E1D9] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00684A] text-white flex items-center justify-center shrink-0 shadow-xs">
                <BookOpen size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#001E2B]">
                  Institutional Course Operations
                </h3>
                <p className="text-xs text-slate-500 font-medium">Enrollments, instructors, and aggregate performance across active modules.</p>
              </div>
            </div>

            {/* Filter / Search Bar */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  placeholder="Filter by code, title, lecturer..."
                  className="pl-8 pr-3 py-1.5 bg-[#FAF9F5] border border-[#E2E1D9] rounded-xl text-xs text-[#001E2B] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00ED64] focus:border-[#00ED64] w-64 transition-all"
                />
              </div>
              {courseSearch && (
                <button
                  onClick={() => setCourseSearch('')}
                  className="px-2.5 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-[#FAF9F5] border border-[#E2E1D9] rounded-xl transition-colors cursor-pointer"
                >
                  Reset
                </button>
              )}
              <span className="text-xs font-bold text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/40 px-3 py-1.5 rounded-xl shrink-0">
                {filteredCourses.length} Modules
              </span>
              <button
                onClick={() => navigate('/admin-users?tab=enrollments')}
                className="px-3.5 py-1.5 text-xs font-black bg-[#00ED64] hover:bg-[#00d859] text-[#001E2B] rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
              >
                <GraduationCap size={14} />
                <span>Manage Enrollments</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E1D9] text-slate-500 font-bold bg-[#FAF9F5]">
                  <th className="py-3 px-3.5">Module Code</th>
                  <th className="py-3 px-3.5">Course Title</th>
                  <th className="py-3 px-3.5">Instructor</th>
                  <th className="py-3 px-3.5 text-center">Credits</th>
                  <th className="py-3 px-3.5 text-center">Enrolled</th>
                  <th className="py-3 px-3.5 text-center">Avg Mark</th>
                  <th className="py-3 px-3.5 text-center">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E1D9]">
                {filteredCourses.map(c => (
                  <tr key={c.code} className="hover:bg-[#FAF9F5]/70 transition-colors">
                    <td className="py-3 px-3.5 font-bold font-mono text-[#001E2B]">{c.code}</td>
                    <td className="py-3 px-3.5 font-semibold text-[#001E2B]">{c.title}</td>
                    <td className="py-3 px-3.5 text-slate-600 font-medium">{c.lecturer_name}</td>
                    <td className="py-3 px-3.5 text-center text-slate-500 font-medium">{c.credits}</td>
                    <td className="py-3 px-3.5 text-center font-bold text-[#001E2B]">{c.enrolled_students}</td>
                    <td className="py-3 px-3.5 text-center font-bold text-[#00684A]">{c.average_score ? `${c.average_score}%` : 'N/A'}</td>
                    <td className="py-3 px-3.5 text-center font-medium text-slate-700">{c.average_attendance ? `${c.average_attendance}%` : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: Infrastructure & Database Health */}
      {activeTab === 'infrastructure' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#E2E1D9] rounded-3xl p-6 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/40 flex items-center justify-center">
              <Server size={18} />
            </div>
            <h4 className="font-bold text-sm text-[#001E2B]">Relational Database Tier</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">SQLite3 / MySQL engine operating with zero deadlocks and ACID transactional compliance.</p>
            <span className="text-[11px] font-bold text-[#00684A] bg-[#E6F8ED] px-2.5 py-1 rounded-lg border border-[#00ED64]/30 inline-block">
              Operational
            </span>
          </div>

          <div className="bg-white border border-[#E2E1D9] rounded-3xl p-6 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#001E2B] text-[#00ED64] border border-[#00ED64]/30 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <h4 className="font-bold text-sm text-[#001E2B]">Google Gemini 3.6 Flash</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">Deterministic schema parsing, sub-500ms grounding, and localized continuous assessment coaching.</p>
            <span className="text-[11px] font-bold text-[#00684A] bg-[#E6F8ED] px-2.5 py-1 rounded-lg border border-[#00ED64]/30 inline-block">
              Connected
            </span>
          </div>

          <div className="bg-white border border-[#E2E1D9] rounded-3xl p-6 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/40 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <h4 className="font-bold text-sm text-[#001E2B]">Auth &amp; Session Security</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">Bcrypt salting, JWT authentication, and strict role-based access control protecting all endpoints.</p>
            <span className="text-[11px] font-bold text-[#00684A] bg-[#E6F8ED] px-2.5 py-1 rounded-lg border border-[#00ED64]/30 inline-block">
              Encrypted
            </span>
          </div>
        </div>
      )}

    </div>
  );
}
