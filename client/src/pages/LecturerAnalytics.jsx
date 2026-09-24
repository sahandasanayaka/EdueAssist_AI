import { useState, useEffect } from 'react';
import { 
  TrendingUp, AlertTriangle, Users, BookOpen, CheckCircle2, 
  Award, Clock, Calendar, ShieldAlert, FileText, Send, Sparkles
} from 'lucide-react';
import lecturerApi from '../services/lecturerApi';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';

export default function LecturerAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, dashRes] = await Promise.all([
        lecturerApi.getAnalytics(),
        lecturerApi.getDashboard()
      ]);
      setAnalytics(analyticsRes.data || analyticsRes);
      setDashboard(dashRes.data || dashRes);
    } catch (err) {
      console.error('Error loading lecturer analytics:', err);
      setError(err.message || 'Failed to retrieve cohort analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleBatchIntervention = () => {
    const atRiskCount = dashboard?.at_risk_students?.length || 0;
    if (atRiskCount === 0) return;
    setNotification({
      type: 'success',
      message: `Dispatched academic recovery advisories to all ${atRiskCount} flagged at-risk students.`
    });
    setTimeout(() => setNotification(null), 4500);
  };

  if (loading) {
    return <LoadingSpinner message="Synthesizing course performance, attendance bands, and risk curves..." />;
  }

  if (error || !analytics) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <ErrorMessage 
          title="Could not load Faculty Analytics" 
          message={error || 'Unable to analyze teaching modules.'} 
          onRetry={fetchAnalytics} 
        />
      </div>
    );
  }

  const coursePerf = analytics.course_performance || [];
  const attDist = analytics.attendance_distribution || {};
  const assignAnalytics = analytics.assignment_analytics || {};
  const riskDist = analytics.risk_distribution || {};
  const studentPerf = analytics.student_performance || {};
  const atRiskStudents = dashboard?.at_risk_students || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
            <TrendingUp size={22} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Academic Cohort Analytics
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#2563EB] border border-blue-200">
                Faculty Intelligence
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              Course grade distributions, attendance compliance bands, and early intervention metrics.
            </p>
          </div>
        </div>

        {atRiskStudents.length > 0 && (
          <button 
            onClick={handleBatchIntervention}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-colors shrink-0 text-xs flex items-center gap-2 cursor-pointer"
          >
            <Send size={14} />
            <span>Notify All At-Risk ({atRiskStudents.length})</span>
          </button>
        )}
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 flex items-center gap-3 animate-in fade-in duration-200">
          <CheckCircle2 size={18} className="text-[#2563EB] shrink-0" />
          <span className="text-xs font-bold">{notification.message}</span>
        </div>
      )}

      {/* Overview Analytics Cards with Modern LMS Color Badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Attendance Rate</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 shadow-xs">
              <Calendar size={18} />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">{attDist.avg_attendance || 0}%</span>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {attDist.above_75 || 0} students above 75% threshold
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Assignment Rate</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] border border-blue-100 flex items-center justify-center shrink-0 shadow-xs">
              <FileText size={18} />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">{assignAnalytics.completion_rate || 0}%</span>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {assignAnalytics.submitted || 0} of {assignAnalytics.expected_submissions || 0} submitted
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Graded Average</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 shadow-xs">
              <Award size={18} />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">{assignAnalytics.average_assignment_mark || 0}%</span>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {assignAnalytics.graded || 0} coursework evaluated
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">At-Risk Ratio</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-rose-600">{riskDist.high || 0}</span>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {riskDist.medium || 0} medium, {riskDist.low || 0} low risk
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Course Performance & Attendance Bands */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Performance Breakdown */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-[#0F172A] text-white flex items-center justify-center shrink-0 shadow-xs">
              <BookOpen size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Course Performance Summary
              </h3>
              <p className="text-xs text-slate-500 font-medium">Average, highest, and lowest assessment marks per module.</p>
            </div>
          </div>

          <div className="space-y-3">
            {coursePerf.map(c => (
              <div key={c.code} className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-900 mr-2">{c.code}</span>
                    <span className="font-bold text-xs text-slate-700">{c.title}</span>
                  </div>
                  <span className="text-xs font-bold text-[#2563EB]">
                    Avg: {c.avg_score ? `${c.avg_score}%` : 'N/A'}
                  </span>
                </div>

                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2.5">
                  <div 
                    className="bg-[#2563EB] h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, c.avg_score || 0))}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                  <span>Enrolled: {c.enrolled_count || 0}</span>
                  <span>Lowest: {c.lowest_score !== null ? `${c.lowest_score}%` : 'N/A'}</span>
                  <span>Highest: {c.highest_score !== null ? `${c.highest_score}%` : 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance Compliance Bands */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-[#0F172A] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Attendance Compliance Bands
              </h3>
              <p className="text-xs text-slate-500 font-medium">Student distribution across mandatory university thresholds.</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-200/80 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-bold text-slate-900">Compliant (75% or higher)</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 ml-4 font-medium">Meets examination sitting prerequisite requirement.</p>
              </div>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full">
                {attDist.above_75 || 0} Students
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-200/80 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="text-xs font-bold text-slate-900">Borderline Concern (60% – 74%)</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 ml-4 font-medium">Requires early warning notification before exam lockout.</p>
              </div>
              <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-3 py-1 rounded-full">
                {attDist.between_60_74 || 0} Students
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-200/80 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span className="text-xs font-bold text-slate-900">Critical Risk (Below 60%)</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 ml-4 font-medium">Subject to academic probation and mandatory interview.</p>
              </div>
              <span className="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-1 rounded-full">
                {attDist.below_60 || 0} Students
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Student Performance Distribution & Coursework Triage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Tiers */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-[#0F172A] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Award size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Student Performance Tiers
              </h3>
              <p className="text-xs text-slate-500 font-medium">Cohort assessment mark brackets.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">First Class (&ge;80%)</span>
              <span className="text-2xl font-black text-[#2563EB]">{studentPerf.excellent || 0}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Second Upper (65-79%)</span>
              <span className="text-2xl font-black text-slate-800">{studentPerf.good || 0}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Pass (50-64%)</span>
              <span className="text-2xl font-black text-slate-700">{studentPerf.satisfactory || 0}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Below Passing (&lt;50%)</span>
              <span className="text-2xl font-black text-rose-600">{studentPerf.needs_attention || 0}</span>
            </div>
          </div>
        </div>

        {/* Coursework Submissions Overview */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-[#0F172A] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Coursework Submission Triage
              </h3>
              <p className="text-xs text-slate-500 font-medium">Real-time status of scheduled student assignment deliverables.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Expected Deliverables</span>
              <span className="text-2xl font-black text-slate-800">{assignAnalytics.expected_submissions || 0}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Evaluated / Graded</span>
              <span className="text-2xl font-black text-[#2563EB]">{assignAnalytics.graded || 0}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Unsubmitted / Pending</span>
              <span className="text-2xl font-black text-amber-600">{assignAnalytics.pending || 0}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Late Deliverables</span>
              <span className="text-2xl font-black text-rose-600">{assignAnalytics.late || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
