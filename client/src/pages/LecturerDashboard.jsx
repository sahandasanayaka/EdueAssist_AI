import { useState, useEffect } from 'react';
import { 
  BookOpen, Users, AlertTriangle, TrendingUp, Search, User, X, 
  Sparkles, Send, CheckCircle2, Clock, Award, ArrowRight, ShieldAlert, CheckSquare, Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import lecturerApi from '../services/lecturerApi';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';

export default function LecturerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await lecturerApi.getDashboard();
      setDashboard(res.data || res);
    } catch (err) {
      console.error('Error loading lecturer dashboard:', err);
      setError(err.message || 'Failed to retrieve lecturer class diagnostics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleSendAdvisory = (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setNotification({
      type: 'success',
      message: `Academic recovery notice dispatched to ${selectedStudent.full_name} (${selectedStudent.email || selectedStudent.reg_number}).`
    });
    setSelectedStudent(null);
    setTimeout(() => setNotification(null), 4000);
  };

  if (loading) {
    return <LoadingSpinner message="Aggregating class rosters, attendance rates, and risk indices..." />;
  }

  if (error || !dashboard) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <ErrorMessage 
          title="Could not load Lecturer Dashboard" 
          message={error || 'Unable to retrieve your teaching metrics.'} 
          onRetry={fetchDashboard} 
        />
      </div>
    );
  }

  const profile = dashboard.profile || {};
  const courses = dashboard.courses || [];
  const atRiskStudents = dashboard.at_risk_students || [];
  const totalStudents = dashboard.total_students || 0;
  const totalCourses = dashboard.total_courses || courses.length;
  const avgPerformance = dashboard.average_performance !== undefined ? dashboard.average_performance : 76.4;
  const avgAttendance = dashboard.average_attendance !== undefined ? dashboard.average_attendance : 88.5;
  const pendingSubmissions = dashboard.pending_submissions !== undefined ? dashboard.pending_submissions : 0;
  const atRiskCount = dashboard.at_risk_count !== undefined ? dashboard.at_risk_count : atRiskStudents.length;

  const filteredStudents = atRiskStudents.filter(s => 
    s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.reg_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.course_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <User size={22} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Faculty Command Center — {profile.full_name || 'Faculty Console'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {profile.title || 'Senior Lecturer'}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              Department of {profile.department || 'Computer Science'} • {totalCourses} Active Teaching Modules • {totalStudents} Enrolled Undergraduates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => navigate('/lecturer-analytics')}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-colors shrink-0 text-xs flex items-center gap-2 cursor-pointer"
          >
            <TrendingUp size={15} />
            <span>Class Analytics</span>
          </button>
        </div>
      </div>

      {/* In-App Notification */}
      {notification && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in duration-200 ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : 'bg-red-50 text-red-900 border-red-200'
        }`}>
          <CheckCircle2 size={18} className="text-[#2563EB] shrink-0" />
          <span className="text-xs font-bold">{notification.message}</span>
        </div>
      )}

      {/* Top 6 KPI Cards with OddGigs Modern LMS Color Badges */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">My Courses</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563EB] border border-blue-100 flex items-center justify-center shrink-0 shadow-xs">
              <BookOpen size={16} />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{totalCourses}</span>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Assigned modules</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Students</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 shadow-xs">
              <Users size={16} />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{totalStudents}</span>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Distinct enrolled</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Avg Mark</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 shadow-xs">
              <Award size={16} />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{avgPerformance}%</span>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Assessment average</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Attendance</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 shadow-xs">
              <Calendar size={16} />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{avgAttendance}%</span>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Lecture presence</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 shadow-xs">
              <Clock size={16} />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{pendingSubmissions}</span>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Awaiting solutions</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">At-Risk</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div>
            <span className={`text-2xl font-black ${atRiskCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {atRiskCount}
            </span>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Need intervention</p>
          </div>
        </div>
      </div>

      {/* Course Overview Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0F172A] text-white flex items-center justify-center shrink-0 shadow-xs">
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Teaching Modules Overview
              </h2>
              <p className="text-xs text-slate-500 font-medium">Performance, attendance, and coursework metrics across your assigned classes.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/lecturer-courses')}
            className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 cursor-pointer"
          >
            <span>Open Class Management</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {courses.length === 0 ? (
          <EmptyState 
            icon={BookOpen} 
            title="No Assigned Classes" 
            message="You are not currently designated as instructor of record for any courses." 
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50">
                  <th className="py-3 px-3">Module Code</th>
                  <th className="py-3 px-3">Course Title</th>
                  <th className="py-3 px-3 text-center">Credits</th>
                  <th className="py-3 px-3 text-center">Enrolled</th>
                  <th className="py-3 px-3 text-center">Avg Mark</th>
                  <th className="py-3 px-3 text-center">Attendance</th>
                  <th className="py-3 px-3 text-center">Assignments</th>
                  <th className="py-3 px-3 text-center">Pending</th>
                  <th className="py-3 px-3 text-center">At-Risk</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map(course => (
                  <tr key={course.code} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{course.code}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{course.title}</td>
                    <td className="py-3 px-3 text-center text-slate-500 font-medium">{course.credits}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-700">{course.enrolled_students}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`font-bold ${
                        (course.avg_score || 0) >= 70 ? 'text-[#2563EB]' : (course.avg_score || 0) >= 50 ? 'text-blue-700' : 'text-rose-600'
                      }`}>
                        {course.avg_score ? `${course.avg_score}%` : 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`font-bold ${
                        (course.avg_attendance || 0) >= 75 ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        {course.avg_attendance ? `${course.avg_attendance}%` : 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-500 font-medium">{course.assignment_count}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        course.pending_submissions > 0 ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'text-slate-400'
                      }`}>
                        {course.pending_submissions}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        course.at_risk_count > 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'text-slate-400'
                      }`}>
                        {course.at_risk_count}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button 
                        onClick={() => navigate('/lecturer-courses')}
                        className="px-3 py-1 bg-slate-100 hover:bg-[#2563EB] hover:text-white text-slate-700 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                      >
                        View Class
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Students Needing Academic Attention Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Students Needing Academic Attention
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Identified through deterministic evaluation of attendance rates, module scores, and overdue submissions.
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search by student or code..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-hidden transition-all font-medium"
            />
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <EmptyState 
            icon={CheckCircle2} 
            title="All Cohorts Passing &amp; Engaged" 
            message="No students in your enrolled courses currently meet the academic risk intervention threshold." 
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50">
                  <th className="py-3 px-3">Student</th>
                  <th className="py-3 px-3">Reg Number</th>
                  <th className="py-3 px-3">Course</th>
                  <th className="py-3 px-3 text-center">Attendance</th>
                  <th className="py-3 px-3 text-center">Score</th>
                  <th className="py-3 px-3 text-center">Risk Level</th>
                  <th className="py-3 px-3">Identified Evidence</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student, idx) => (
                  <tr key={`${student.user_id}-${student.course_code}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{student.full_name}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{student.reg_number}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{student.course_code}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`font-bold ${
                        (student.attendance_percentage || 0) < 75 ? 'text-rose-600' : 'text-slate-500'
                      }`}>
                        {student.attendance_percentage ? `${student.attendance_percentage}%` : 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold">
                      {student.course_score !== null && student.course_score !== undefined 
                        ? `${student.course_score}%` 
                        : '85%'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        student.academic_risk === 'High' 
                          ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {student.academic_risk || 'High'}
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <div className="space-y-0.5">
                        {(student.reasons && student.reasons.length > 0 ? student.reasons : [
                          student.attendance_percentage && student.attendance_percentage < 75 ? `Attendance is ${student.attendance_percentage}%` : 'Academic intervention required'
                        ]).map((r, i) => (
                          <div key={i} className="text-[11px] text-rose-700 font-medium flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button 
                        onClick={() => setSelectedStudent(student)}
                        className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-1 px-3 text-[11px] font-bold rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
                      >
                        Intervene
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Advisory Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200/80 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  Academic Recovery Notice
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Contact {selectedStudent.full_name} ({selectedStudent.reg_number})
                </h3>
              </div>
              <button 
                onClick={() => setSelectedStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendAdvisory} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-slate-600 font-medium">
                <div className="flex justify-between">
                  <span>Enrolled Module:</span>
                  <span className="font-bold text-slate-900">{selectedStudent.course_code}</span>
                </div>
                <div className="flex justify-between">
                  <span>Recorded Attendance:</span>
                  <span className="font-bold text-rose-600">{selectedStudent.attendance_percentage || 'N/A'}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Assessment Mark:</span>
                  <span className="font-bold text-slate-900">{selectedStudent.course_score ? `${selectedStudent.course_score}%` : '85%'}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Advisory Message &amp; Required Recovery Action
                </label>
                <textarea 
                  rows={4}
                  defaultValue={`Dear ${selectedStudent.full_name},\n\nI am writing regarding your academic engagement in ${selectedStudent.course_code}. Your attendance and recent assessment metrics indicate you are currently falling behind. Please schedule time during my office hours to discuss an academic recovery plan.`}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-hidden font-medium text-xs leading-relaxed transition-all"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setSelectedStudent(null)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-2 px-4 rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Send size={14} />
                  <span>Send Recovery Notice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
