import { useState, useEffect } from 'react';
import { 
  BookOpen, Users, GraduationCap, ArrowRight, X, Calendar, 
  Award, Clock, CheckCircle2, AlertCircle, FileText, Check, Sparkles, Send
} from 'lucide-react';
import lecturerApi from '../services/lecturerApi';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';

export default function LecturerCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected course detail
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetail, setCourseDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Selected assignment for submissions view
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionsData, setSubmissionsData] = useState(null);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Grading modal state
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeMarks, setGradeMarks] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [submittingGrade, setSubmittingGrade] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await lecturerApi.getCourses();
      setCourses(res.data || []);
    } catch (err) {
      console.error('Error fetching lecturer courses:', err);
      setError(err.message || 'Failed to retrieve assigned classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleSelectCourse = async (course) => {
    setSelectedCourse(course);
    setSelectedAssignment(null);
    setLoadingDetail(true);
    try {
      const res = await lecturerApi.getCourseDetail(course.code);
      setCourseDetail(res.data || res);
    } catch (err) {
      console.error('Error loading course detail:', err);
      setNotification({
        type: 'error',
        message: err.message || 'Failed to load course details'
      });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleViewSubmissions = async (assignment) => {
    setSelectedAssignment(assignment);
    setLoadingSubmissions(true);
    try {
      const res = await lecturerApi.getAssignmentSubmissions(assignment.id);
      setSubmissionsData(res.data || res);
    } catch (err) {
      console.error('Error loading assignment submissions:', err);
      setNotification({
        type: 'error',
        message: err.message || 'Failed to load assignment submissions'
      });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const openGradingModal = (submission) => {
    setGradingSubmission(submission);
    setGradeMarks(submission.marks !== null && submission.marks !== undefined ? String(submission.marks) : '');
    setGradeFeedback(submission.feedback || '');
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    if (gradeMarks === '' || isNaN(gradeMarks)) {
      setNotification({ type: 'error', message: 'Please enter a valid numeric mark.' });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    const maxM = selectedAssignment?.total_marks || 100;
    if (parseFloat(gradeMarks) < 0 || parseFloat(gradeMarks) > maxM) {
      setNotification({ type: 'error', message: `Marks must be between 0 and ${maxM}.` });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    setSubmittingGrade(true);
    try {
      const res = await lecturerApi.gradeSubmission(gradingSubmission.submission_id, {
        marks: parseFloat(gradeMarks),
        feedback: gradeFeedback.trim()
      });

      // Update submissions list locally
      if (submissionsData && submissionsData.submissions) {
        setSubmissionsData(prev => ({
          ...prev,
          submissions: prev.submissions.map(s => 
            s.submission_id === gradingSubmission.submission_id
              ? { ...s, marks: parseFloat(gradeMarks), feedback: gradeFeedback.trim(), status: 'graded' }
              : s
          )
        }));
      }

      // Update course detail students if loaded
      if (courseDetail && courseDetail.students) {
        setCourseDetail(prev => ({
          ...prev,
          students: prev.students.map(st => 
            st.user_id === gradingSubmission.student_id
              ? { ...st, overall_score: parseFloat(gradeMarks) }
              : st
          )
        }));
      }

      setNotification({
        type: 'success',
        message: `Evaluation saved for student ${gradingSubmission.student_name} (${gradingSubmission.reg_number}).`
      });
      setGradingSubmission(null);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to grade submission'
      });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setSubmittingGrade(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Retrieving your assigned teaching modules..." />;
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <ErrorMessage 
          title="Could not load classes" 
          message={error} 
          onRetry={fetchCourses} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <BookOpen size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Teaching Modules &amp; Rosters</h1>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              Assigned academic courses, student roster evaluation, and assignment grading console.
            </p>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in duration-200 ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 size={18} className="text-[#2563EB] shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-rose-500 shrink-0" />
          )}
          <span className="text-xs font-bold">{notification.message}</span>
        </div>
      )}

      {/* Courses Cards Grid */}
      {courses.length === 0 ? (
        <EmptyState 
          icon={BookOpen} 
          title="No Assigned Classes" 
          message="You are not currently assigned as the instructor of record for any courses." 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map(course => {
            const isSelected = selectedCourse?.code === course.code;
            return (
              <div 
                key={course.code} 
                className={`border rounded-2xl p-6 shadow-xs flex flex-col justify-between cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-[#2563EB] ring-2 ring-blue-100 bg-blue-50/20 shadow-md' 
                    : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
                }`}
                onClick={() => handleSelectCourse(course)}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 text-[#2563EB] border border-blue-200">
                      {course.code}
                    </span>
                    <span className="text-xs font-medium text-slate-500">{course.semester || 'Year 2 Sem 2'}</span>
                  </div>
                  
                  <h3 className="text-base font-bold text-slate-900 mb-1 leading-snug">{course.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4 font-medium">
                    {course.description || 'Undergraduate computer science module.'}
                  </p>

                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Enrolled</span>
                      <span className="font-extrabold text-slate-900">{course.enrolled_students || 0}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Avg Mark</span>
                      <span className="font-extrabold text-[#2563EB]">{course.avg_score ? `${course.avg_score}%` : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Attendance</span>
                      <span className="font-extrabold text-slate-700">{course.avg_attendance ? `${course.avg_attendance}%` : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                  <span className="text-[11px] font-bold text-slate-500">
                    {course.assignment_count || 0} Assignment{course.assignment_count === 1 ? '' : 's'}
                  </span>
                  <span className="text-xs font-bold text-[#2563EB] flex items-center gap-1">
                    <span>{isSelected ? 'Viewing' : 'Inspect Class'}</span>
                    <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Course Details Section (When Selected) */}
      {selectedCourse && (
        <div className="space-y-6 pt-2">
          {loadingDetail ? (
            <LoadingSpinner message={`Loading class roster & metrics for ${selectedCourse.code}...`} />
          ) : courseDetail ? (
            <div className="space-y-6">
              {/* Course Performance Banner */}
              <div className="bg-white p-6 shadow-xs border border-slate-200/80 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
                  <div>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200">
                      {courseDetail.course?.code}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mt-1.5">{courseDetail.course?.title}</h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Department of {courseDetail.course?.department} • {courseDetail.course?.credits} Credits
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-400 uppercase font-bold block">Class Size</span>
                    <span className="text-2xl font-black text-slate-900">{courseDetail.performance?.total_enrolled} Students</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500 font-medium block mb-1">Class Average</span>
                    <span className="text-lg font-black text-[#2563EB]">
                      {courseDetail.performance?.avg_score ? `${courseDetail.performance.avg_score}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500 font-medium block mb-1">Highest Score</span>
                    <span className="text-lg font-black text-[#2563EB]">
                      {courseDetail.performance?.highest_score ? `${courseDetail.performance.highest_score}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500 font-medium block mb-1">Average Attendance</span>
                    <span className="text-lg font-black text-[#2563EB]">
                      {courseDetail.performance?.avg_attendance ? `${courseDetail.performance.avg_attendance}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500 font-medium block mb-1">Assignment Rate</span>
                    <span className="text-lg font-black text-[#2563EB]">
                      {courseDetail.performance?.assignment_completion_rate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Coursework Deliverables & Submissions Management */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 rounded-full bg-[#0F172A] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Course Deliverables &amp; Grading
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Review submitted student assignments and provide evaluated marks.</p>
                  </div>
                </div>

                {(courseDetail.assignments || []).length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">No active assignments scheduled for this module.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courseDetail.assignments.map(assign => (
                      <div key={assign.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <h4 className="text-sm font-bold text-slate-900">{assign.title}</h4>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                              Max: {assign.total_marks || 100}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed font-medium">
                            {assign.description}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mb-3">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              Due: {new Date(assign.due_date).toLocaleDateString()}
                            </span>
                            <span>Weight: {assign.weight || 10}%</span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[11px] font-bold">
                            <span className="text-emerald-700">{assign.submitted || 0} Submitted</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-amber-700">{assign.pending || 0} Pending</span>
                          </div>
                          <button
                            onClick={() => handleViewSubmissions(assign)}
                            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-1.5 px-3 text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <span>Submissions</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Enrolled Student Roster Table */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0F172A] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Users size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Enrolled Student Roster
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">Active students, recorded assessment marks, and risk indicators.</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                    {courseDetail.students?.length || 0} Students
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50">
                        <th className="py-3 px-3">Registration No.</th>
                        <th className="py-3 px-3">Student Name</th>
                        <th className="py-3 px-3">Email</th>
                        <th className="py-3 px-3 text-center">Attendance</th>
                        <th className="py-3 px-3 text-center">Score</th>
                        <th className="py-3 px-3 text-center">Assignments</th>
                        <th className="py-3 px-3 text-center">Risk Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(courseDetail.students || []).map(student => (
                        <tr key={student.user_id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">{student.reg_number}</td>
                          <td className="py-3 px-3 font-semibold text-slate-800">{student.full_name}</td>
                          <td className="py-3 px-3 text-slate-500">{student.email}</td>
                          <td className="py-3 px-3 text-center font-bold">
                            <span className={student.attendance_percentage < 75 ? 'text-rose-600' : 'text-slate-700'}>
                              {student.attendance_percentage ? `${student.attendance_percentage}%` : 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-[#2563EB]">
                            {student.overall_score !== null && student.overall_score !== undefined ? `${student.overall_score}%` : '—'}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-500 font-medium">
                            {student.completed_assignments} / {student.total_assignments}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                              student.risk_level === 'HIGH' 
                                ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                : student.risk_level === 'MEDIUM'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {student.risk_level}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Submissions Drawer / Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200/80 space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200">
                  {selectedAssignment.course_code || selectedCourse?.code}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedAssignment.title}</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Max Marks: {selectedAssignment.total_marks || 100} • Due: {new Date(selectedAssignment.due_date).toLocaleDateString()}
                </p>
              </div>
              <button 
                onClick={() => setSelectedAssignment(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {loadingSubmissions ? (
                <LoadingSpinner message="Retrieving submission files and code..." />
              ) : (submissionsData?.submissions || []).length === 0 ? (
                <p className="text-center text-slate-500 italic py-8 font-medium">No submissions recorded yet for this coursework deliverable.</p>
              ) : (
                <div className="space-y-3">
                  {submissionsData.submissions.map(sub => {
                    const hasSubmitted = sub.status !== 'pending' && !!sub.submission_id;
                    const isGraded = sub.status === 'graded';
                    return (
                      <div key={sub.student_id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{sub.student_name}</span>
                            <span className="font-mono text-slate-500 text-[11px]">({sub.reg_number})</span>
                            <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                              isGraded 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : hasSubmitted 
                                  ? 'bg-blue-50 text-[#2563EB] border border-blue-200' 
                                  : 'bg-slate-100 text-slate-700'
                            }`}>
                              {sub.status}
                            </span>
                          </div>
                          {hasSubmitted ? (
                            <div className="text-slate-600 space-y-0.5 font-medium">
                              <p>Submitted at: {new Date(sub.submitted_at).toLocaleString()}</p>
                              {sub.submission_file && (
                                <p className="font-mono text-[11px] text-slate-700">File: {sub.submission_file}</p>
                              )}
                              {sub.submission_text && (
                                <p className="font-mono bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-800 line-clamp-3">
                                  {sub.submission_text}
                                </p>
                              )}
                              {isGraded && (
                                <p className="text-[#2563EB] font-bold mt-1">
                                  Score: {sub.marks} / {selectedAssignment.total_marks || 100} • Feedback: {sub.feedback || 'Evaluated'}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-slate-400 italic">No submission uploaded.</p>
                          )}
                        </div>

                        <div className="shrink-0 flex items-center justify-end">
                          {hasSubmitted && (
                            <button 
                              onClick={() => openGradingModal(sub)}
                              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-1.5 px-3 font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                            >
                              {isGraded ? 'Update Grade' : 'Grade Submission'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grading Form Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200/80 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200">
                  Coursework Evaluation
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Grade {gradingSubmission.student_name}
                </h3>
              </div>
              <button 
                onClick={() => setGradingSubmission(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGradeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Awarded Marks (Out of {selectedAssignment?.total_marks || 100})
                </label>
                <input 
                  type="number" 
                  step="0.5" 
                  min="0" 
                  max={selectedAssignment?.total_marks || 100}
                  value={gradeMarks} 
                  onChange={(e) => setGradeMarks(e.target.value)}
                  placeholder="e.g. 88.5"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-hidden font-bold text-sm transition-all"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Lecturer Constructive Feedback
                </label>
                <textarea 
                  rows={4}
                  value={gradeFeedback} 
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="Provide feedback on algorithm correctness, efficiency, design patterns..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-hidden leading-relaxed font-medium transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setGradingSubmission(null)}
                  disabled={submittingGrade}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submittingGrade}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-2 px-5 font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Check size={14} />
                  <span>{submittingGrade ? 'Saving Grade...' : 'Save & Publish Grade'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
