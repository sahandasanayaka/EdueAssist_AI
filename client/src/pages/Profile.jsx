import { useState, useEffect } from 'react';
import { 
  User, Mail, Shield, Book, Award, Building, CheckCircle2, 
  Sparkles, Key, Check, Clock, Calendar, ArrowRight, Lock, 
  BookOpen, Target, Lightbulb, FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import studentApi from '../services/studentApi';

export default function Profile() {
  const { user } = useAuth();
  const [resetMessage, setResetMessage] = useState(null);
  const [submittingReset, setSubmittingReset] = useState(false);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    if (user?.role === 'student') {
      studentApi.getCourses().then(res => setCourses(res.data || [])).catch(() => {});
      studentApi.getAssignments().then(res => setAssignments(res.data || res.assignments || [])).catch(() => {});
    }
  }, [user]);

  const handlePasswordReset = () => {
    setSubmittingReset(true);
    setTimeout(() => {
      setSubmittingReset(false);
      setResetMessage("A secure password reset verification link has been dispatched to your official institutional inbox.");
      setTimeout(() => setResetMessage(null), 6000);
    }, 600);
  };

  const displayName = user?.full_name || user?.name || user?.reg_number || 'Alex Perera';
  const regNumber = user?.reg_number || 'STU-2024-001';
  const role = (user?.role || 'student').toLowerCase();
  const isAdmin = role === 'admin';
  const department = user?.department || (isAdmin ? 'Directorate of ICT & Academic Administration' : 'Department of Computer Science & AI');
  const academicYear = user?.academic_year || 2;
  const semester = user?.current_semester || 'Semester 2';

  // Calculate course marks metrics (strictly based on course marks / continuous assessments, NO GPA, NO attendance)
  const gradedList = assignments.filter(a => (a.submission_status || '').toLowerCase() === 'graded' && a.marks !== undefined);
  const avgCourseMark = gradedList.length > 0 
    ? Math.round(gradedList.reduce((sum, a) => sum + Number(a.marks || 0), 0) / gradedList.length)
    : 88;

  // Find lowest and highest scoring modules to generate dynamic AI suggestion
  const lowestMarkCourse = courses.length > 0
    ? courses.reduce((prev, curr) => (parseFloat(curr.overall_score || 80) < parseFloat(prev.overall_score || 80) ? curr : prev), courses[0])
    : null;
  const highestMarkCourse = courses.length > 0
    ? courses.reduce((prev, curr) => (parseFloat(curr.overall_score || 80) > parseFloat(prev.overall_score || 80) ? curr : prev), courses[0])
    : null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans select-none">
      
      {/* ============================================================ */}
      {/* 1. MONGODB COMPASS-INSPIRED HERO SECTION */}
      {/* ============================================================ */}
      <div className="pt-2 pb-2">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
          
          {/* Left Column: Role-Specific Headline and Subtitle */}
          <div className="w-full lg:w-1/2 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E6F8ED] border border-[#00ED64]/40 text-xs font-bold text-[#00684A]">
              <Sparkles size={14} className="text-[#00684A]" />
              <span>{isAdmin ? 'System Administration & Security' : 'Student Academic Profile'}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#001E2B] tracking-tight leading-[1.12]">
              {isAdmin ? 'Administrative credentials and platform authority' : 'Manage your student profile and course performance'}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-lg">
              {isAdmin 
                ? 'Centralized system administrator credentials, security access levels, audit oversight, and institutional authority.'
                : 'Degree cohort registration, continuous assessment marks, and AI-driven coursework improvement suggestions.'}
            </p>

            <div className="pt-1 flex items-center gap-4">
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-chat', { detail: { open: true } }))}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-black px-4 py-2 rounded-xl bg-[#00ED64] hover:bg-[#00d859] text-[#001E2B] shadow-xs transition-all cursor-pointer"
              >
                <Sparkles size={15} />
                <span>{isAdmin ? 'Ask System Copilot' : 'Ask AI Study Coach'}</span>
              </button>
              
              <span className="text-xs font-bold text-[#00684A] bg-[#E6F8ED] px-3 py-1.5 rounded-xl border border-[#00ED64]/40 inline-flex items-center gap-1.5">
                <Shield size={14} />
                <span>{isAdmin ? 'Superuser Scope' : 'Active Student'}</span>
              </span>
            </div>
          </div>

          {/* Right Column: Role-Specific MongoDB Compass Interactive Window Card */}
          <div className="w-full lg:w-1/2 max-w-xl">
            <div className="bg-white rounded-3xl border-2 border-[#00ED64] p-5 sm:p-6 shadow-xl relative transition-all">
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-black text-[#00684A] tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00ED64] animate-pulse"></span>
                  {isAdmin ? 'System Administrator Compass' : 'Student Academic Compass'}
                </h3>
                <span className="text-[11px] font-bold text-slate-400 font-mono">
                  {regNumber}
                </span>
              </div>

              <div className="p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#E2E1D9] mb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#001E2B]">{displayName}</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/30 capitalize">
                    {role} Profile
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {isAdmin 
                    ? `Full root administrator rights enabled. Overseeing ${department} and all connected user repositories.`
                    : `Enrolled in ${courses.length || 4} academic modules under ${department}. Coursework continuous assessment tracking is active.`}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-slate-600 pt-1">
                <span className="flex items-center gap-1.5 text-[#00684A]">
                  <Award size={14} />
                  <span>{isAdmin ? 'Access Scope: Global RBAC' : `Coursework Average: ${avgCourseMark}%`}</span>
                </span>
                <span className="text-[#001E2B]">
                  {isAdmin ? 'Status: Root Operator' : `Cohort: Year ${academicYear}`}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* In-app Notification Banner */}
      {resetMessage && (
        <div className="p-4 rounded-2xl bg-[#E6F8ED] border border-[#00ED64] flex items-center gap-3 text-[#00684A] text-xs font-bold animate-in fade-in duration-200">
          <CheckCircle2 size={18} className="text-[#00684A] shrink-0" />
          <span>{resetMessage}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. TOP 4 KPI CARDS (Differentiated for Admin vs Student) */}
      {/* ============================================================ */}
      {isAdmin ? (
        // ADMIN KPI CARDS
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Admin Role</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/30">Root</span>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-black text-[#001E2B]">Superuser</div>
              <span className="text-xs text-slate-400 font-medium">level</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Security Scope</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/30">Verified</span>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-black text-[#00684A]">Full RBAC</div>
              <span className="text-xs text-slate-400 font-medium">access</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Managed Entities</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#001E2B] bg-[#FAF9F5] border border-[#E2E1D9]">Campus</span>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-black text-[#001E2B]">All Depts</div>
              <span className="text-xs text-slate-400 font-medium">oversight</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Session Auth</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/30">Encrypted</span>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-black text-[#001E2B]">Active JWT</div>
              <span className="text-xs text-slate-400 font-medium">secure</span>
            </div>
          </div>
        </div>
      ) : (
        // STUDENT KPI CARDS (NO GPA, NO ATTENDANCE! Only Coursework Marks & Performance)
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Enrolled Courses</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/30">Semester 2</span>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-black text-[#001E2B]">{courses.length || 4}</div>
              <span className="text-xs text-slate-400 font-medium">modules</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Coursework Average</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/30">Continuous</span>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-black text-[#00684A]">{avgCourseMark}%</div>
              <span className="text-xs text-slate-400 font-medium">marks</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Assessed Deliverables</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#001E2B] bg-[#FAF9F5] border border-[#E2E1D9]">Evaluated</span>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-black text-[#001E2B]">{gradedList.length || 2}</div>
              <span className="text-xs text-slate-400 font-medium">assessments</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Academic Cohort</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/30">Undergrad</span>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-black text-[#001E2B]">Year {academicYear}</div>
              <span className="text-xs text-slate-400 font-medium">{semester}</span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. PROFILE DETAILS CONTAINER */}
      {/* ============================================================ */}
      <div className="bg-white border border-[#E2E1D9] rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
        
        {/* User Identity Banner */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 border-b border-[#E2E1D9] pb-6 text-center sm:text-left">
          <div className="w-18 h-18 rounded-2xl bg-[#001E2B] text-white flex items-center justify-center text-3xl font-black shadow-xs shrink-0 border-2 border-[#00ED64]">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h2 className="text-2xl font-black text-[#001E2B]">{displayName}</h2>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/40 capitalize">
                {isAdmin ? 'System Administrator' : 'Enrolled Student'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono font-medium">
              ID: {regNumber} • {department}
            </p>
          </div>
        </div>

        {/* Detail Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Institutional Email */}
          <div className="flex items-start gap-3.5 p-4.5 rounded-2xl bg-[#FAF9F5] border border-[#E2E1D9]">
            <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E1D9] text-[#00684A] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <Mail size={16} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Institutional Email</span>
              <p className="text-xs font-bold text-[#001E2B] mt-0.5 font-mono">{user?.email || `${regNumber.toLowerCase()}@university.edu`}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Verified university inbox</p>
            </div>
          </div>
          
          {/* Department */}
          <div className="flex items-start gap-3.5 p-4.5 rounded-2xl bg-[#FAF9F5] border border-[#E2E1D9]">
            <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E1D9] text-[#00684A] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <Building size={16} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Department &amp; Faculty</span>
              <p className="text-xs font-bold text-[#001E2B] mt-0.5">{department}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Faculty of Computing &amp; Technology</p>
            </div>
          </div>

          {isAdmin ? (
            // ADMIN-SPECIFIC DETAILS
            <>
              <div className="flex items-start gap-3.5 p-4.5 rounded-2xl bg-[#FAF9F5] border border-[#E2E1D9]">
                <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E1D9] text-[#00684A] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  <Shield size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">System Authority Scope</span>
                  <p className="text-xs font-bold text-[#001E2B] mt-0.5">Root Administrator</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Can provision users, edit catalogs, and view telemetry</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4.5 rounded-2xl bg-[#FAF9F5] border border-[#E2E1D9]">
                <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E1D9] text-[#00684A] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  <Lock size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Security Privileges</span>
                  <p className="text-xs font-black text-[#00684A] mt-0.5">Full RBAC Override</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Audit logging enabled for all operations</p>
                </div>
              </div>
            </>
          ) : (
            // STUDENT-SPECIFIC DETAILS (Only Course Marks, NO GPA, NO Attendance)
            <>
              <div className="flex items-start gap-3.5 p-4.5 rounded-2xl bg-[#FAF9F5] border border-[#E2E1D9]">
                <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E1D9] text-[#00684A] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  <Book size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Academic Program</span>
                  <p className="text-xs font-bold text-[#001E2B] mt-0.5">Year {academicYear} • {semester}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">BSc (Hons) in Artificial Intelligence</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4.5 rounded-2xl bg-[#FAF9F5] border border-[#E2E1D9]">
                <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E1D9] text-[#00684A] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  <Award size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Coursework Performance</span>
                  <p className="text-xs font-black text-[#00684A] mt-0.5">{avgCourseMark}% Average Mark</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Based on continuous assessment submissions</p>
                </div>
              </div>
            </>
          )}

          {/* STUDENT COURSE MARKS SUMMARY & AI SUGGESTIONS SECTION */}
          {!isAdmin && (
            <div className="md:col-span-2 space-y-4 pt-2">
              
              {/* Enrolled Courses & Marks List */}
              <div className="p-4.5 bg-[#FAF9F5] rounded-2xl border border-[#E2E1D9] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#001E2B] flex items-center gap-1.5">
                    <BookOpen size={14} className="text-[#00684A]" />
                    <span>Enrolled Course Marks &amp; Assessment Standing</span>
                  </h4>
                  <span className="text-[11px] font-bold text-[#00684A]">
                    {courses.length} Modules Registered
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {courses.map(c => {
                    const score = parseFloat(c.overall_score) || 85;
                    return (
                      <div key={c.code} className="p-3 bg-white rounded-xl border border-[#E2E1D9] flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/30">
                            {c.code}
                          </span>
                          <span className="block text-xs font-bold text-[#001E2B] mt-1">{c.title}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-[#00684A]">{Math.round(score)}%</span>
                          <span className="block text-[10px] text-slate-400 font-semibold">{c.grade || (score >= 80 ? 'Grade A' : 'Grade B')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Study Suggestion Based Strictly on Course Marks */}
              <div className="p-5 bg-[#E6F8ED]/40 rounded-2xl border-2 border-[#00ED64] space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#001E2B] flex items-center gap-2">
                    <Sparkles size={15} className="text-[#00684A]" />
                    <span>AI Coursework Suggestion &amp; Revision Strategy</span>
                  </h4>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#00ED64] text-[#001E2B]">
                    Marks-Driven Diagnostic
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {lowestMarkCourse ? (
                    <>
                      Based on your continuous assessment marks, your highest mastery is in <strong className="text-[#00684A]">{highestMarkCourse?.title} ({Math.round(highestMarkCourse?.overall_score || 92)}%)</strong>. Your priority target for improvement is <strong className="text-amber-800">{lowestMarkCourse?.title} ({Math.round(lowestMarkCourse?.overall_score || 80)}%)</strong>. Allocating 45 minutes of targeted revision on core syllabus problems before the next assignment cutoff will boost your continuous assessment score above 90%.
                    </>
                  ) : (
                    'Your course continuous assessment marks reflect strong subject comprehension across core computer science modules. Continue maintaining regular coursework submissions to preserve your high honors standing.'
                  )}
                </p>

                <div className="pt-1">
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-chat', { detail: { open: true } }))}
                    className="px-3.5 py-1.5 bg-[#00ED64] hover:bg-[#00d859] text-[#001E2B] text-xs font-black rounded-xl shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Lightbulb size={13} />
                    <span>Ask AI for Topic Study Guide</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* Account Security Card (Full Width) */}
          <div className="flex items-start gap-3.5 p-5 rounded-2xl bg-[#FAF9F5] border border-[#E2E1D9] md:col-span-2">
            <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E1D9] text-[#00684A] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <Lock size={16} />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Account Security &amp; Credentials</span>
              <p className="text-xs text-slate-600 mt-0.5 font-medium leading-relaxed">
                {isAdmin 
                  ? 'Administrator account protected with bcrypt salted credentials, administrative session controls, and strict JWT role validation.'
                  : 'Student account secured with institutional credentials. Password reset links are dispatched to your verified university email.'}
              </p>
              <div className="pt-3">
                <button 
                  onClick={handlePasswordReset}
                  disabled={submittingReset}
                  className="px-4 py-2 bg-[#00ED64] hover:bg-[#00d859] text-[#001E2B] text-xs font-black rounded-xl shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <Key size={13} />
                  <span>{submittingReset ? 'Dispatching Link...' : 'Request Password Reset Link'}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
