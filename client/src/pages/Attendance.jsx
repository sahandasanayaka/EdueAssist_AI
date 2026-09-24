import { useState, useEffect } from 'react';
import { Calendar, AlertTriangle, CheckCircle2, Award, Clock } from 'lucide-react';
import studentApi from '../services/studentApi';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';

export default function Attendance() {
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAttendance = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentApi.getAttendance();
      setAttendanceData(res.data || null);
    } catch (err) {
      console.error('Error loading attendance:', err);
      setError(err.message || 'Failed to retrieve attendance logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Querying university biometric & lecture logs..." />;
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <ErrorMessage 
          title="Could not load attendance" 
          message={error} 
          onRetry={fetchAttendance} 
        />
      </div>
    );
  }

  const records = attendanceData?.courses || [];
  const overallPercentage = attendanceData?.overall_percentage || 0;
  const lowAttendanceCourses = records.filter(r => r.is_low_attendance);
  const compliantCount = records.filter(r => r.attendance_percentage >= 75).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
            <Calendar size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Attendance Records</h1>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              Lecture &amp; lab session records synchronized directly with university biometric loggers.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 py-2.5 px-4 flex items-center gap-3 shrink-0 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Rate:</span>
          <span className={`text-xl font-black ${overallPercentage >= 80 ? 'text-[#2563EB]' : (overallPercentage >= 75 ? 'text-amber-600' : 'text-rose-600')}`}>
            {overallPercentage}%
          </span>
        </div>
      </div>

      {/* Top 3 Quick Stats Row (OddGigs Modern LMS Color Badges) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <Calendar size={22} className="text-white" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Total Enrolled Modules</span>
            <span className="text-2xl font-black text-slate-900">{records.length} Modules</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
            <CheckCircle2 size={22} className="text-white" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Exam Compliant Modules</span>
            <span className="text-2xl font-black text-emerald-600">{compliantCount} / {records.length} Eligible</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex items-center gap-4">
          <div className={`w-11 h-11 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-md ${
            lowAttendanceCourses.length > 0 ? 'bg-rose-500 shadow-rose-500/20' : 'bg-amber-500 shadow-amber-500/20'
          }`}>
            <AlertTriangle size={22} className="text-white" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">At-Risk Modules</span>
            <span className={`text-2xl font-black ${lowAttendanceCourses.length > 0 ? 'text-rose-600' : 'text-[#2563EB]'}`}>
              {lowAttendanceCourses.length} Detected
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Advisory Banner */}
      {lowAttendanceCourses.length > 0 ? (
        <div className="bg-white rounded-2xl border border-rose-200 p-5 shadow-sm flex flex-col sm:flex-row items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Academic Advisory: Exam Eligibility Risk Detected
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-normal">
              You have {lowAttendanceCourses.length} module(s) below the mandatory 75% university examination threshold:
              {' '}<span className="font-semibold text-slate-900">{lowAttendanceCourses.map(c => `${c.course_title || c.course_code} (${c.attendance_percentage}%)`).join(', ')}</span>.
              Please attend upcoming lecture hours to restore compliance.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <p className="text-xs font-semibold text-slate-700">
            Excellent attendance record! All enrolled modules comply with university minimum attendance standards (75%+).
          </p>
        </div>
      )}

      {/* Course Attendance Gauges */}
      {records.length === 0 ? (
        <EmptyState 
          icon={Calendar} 
          title="No Attendance Records" 
          message="No attendance records have been registered for your account yet." 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {records.map(rec => {
            const isGood = rec.attendance_percentage >= 80;
            const isWarning = rec.attendance_percentage >= 75 && rec.attendance_percentage < 80;
            const barColor = isGood ? '#2563EB' : isWarning ? '#F59E0B' : '#EF4444';

            return (
              <div key={rec.course_code} className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200">
                      {rec.course_code}
                    </span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      isGood 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : isWarning 
                          ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {rec.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-4">{rec.course_title || rec.course_code}</h3>
                </div>

                {/* Percentage / Progress Indicator */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-baseline justify-between">
                    <span className={`text-3xl font-black ${isGood ? 'text-[#2563EB]' : isWarning ? 'text-amber-600' : 'text-rose-600'}`}>
                      {rec.attendance_percentage}%
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {rec.attended_classes} of {rec.total_classes} classes
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min(100, Math.max(5, rec.attendance_percentage))}%`,
                        backgroundColor: barColor
                      }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1">
                    <span>{rec.absent_classes || 0} Absent session(s)</span>
                    <span className={isGood ? 'text-emerald-700 font-bold' : isWarning ? 'text-amber-700 font-bold' : 'text-rose-600 font-bold'}>
                      {isGood ? 'Eligible for Finals' : (isWarning ? 'Attention Needed' : 'Ineligible')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
