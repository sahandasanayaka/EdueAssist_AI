import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  UserPlus, Trash2, Shield, User, X, Mail, CheckCircle2, 
  AlertCircle, RefreshCw, Search, GraduationCap, Building, Sparkles, 
  BookOpen, PlusCircle, Check, Clock, UserMinus
} from 'lucide-react';
import adminApi from '../services/adminApi';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';

export default function AdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeMainTab = searchParams.get('tab') === 'enrollments' ? 'enrollments' : 'users';

  const setActiveMainTab = (tab) => {
    setSearchParams(tab === 'enrollments' ? { tab: 'enrollments' } : {});
  };

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Filters
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [newUser, setNewUser] = useState({
    reg_number: '',
    full_name: '',
    email: '',
    password: '',
    role: 'student',
    department: 'Computer Science'
  });

  // Course & Enrollment State
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [unenrollingKey, setUnenrollingKey] = useState(null);

  const [enrollForm, setEnrollForm] = useState({
    student_id: '',
    course_code: ''
  });

  // Enrollment Filters
  const [enrollmentSearch, setEnrollmentSearch] = useState('');
  const [enrollmentCourseFilter, setEnrollmentCourseFilter] = useState('all');
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState('all');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getUsers({
        role: roleFilter !== 'all' ? roleFilter : undefined,
        search: searchQuery.trim() || undefined
      });
      setUsers(Array.isArray(res.data) ? res.data : (res.users || []));
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to retrieve platform users');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollmentData = async () => {
    try {
      setEnrollLoading(true);
      const [coursesRes, enrollRes] = await Promise.all([
        adminApi.getCourses(),
        adminApi.getEnrollments()
      ]);
      const rawCourses = coursesRes.data;
      setCourses(Array.isArray(rawCourses) ? rawCourses : (coursesRes.courses || []));

      const rawEnroll = enrollRes.data;
      const enrollList = Array.isArray(rawEnroll)
        ? rawEnroll
        : (Array.isArray(enrollRes.enrollments) ? enrollRes.enrollments : (rawEnroll?.enrollments || []));
      setEnrollments(enrollList);
    } catch (err) {
      console.error('Error fetching enrollment data:', err);
      setActionFeedback({
        type: 'error',
        message: 'Failed to load enrollment data from database.'
      });
    } finally {
      setEnrollLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  useEffect(() => {
    fetchEnrollmentData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleRemove = async (userItem) => {
    if (userItem.id === 1) {
      setActionFeedback({ type: 'error', message: 'Cannot delete root system administrator.' });
      setTimeout(() => setActionFeedback(null), 4000);
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to deactivate and remove ${userItem.full_name || userItem.reg_number} (${userItem.reg_number})? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      setDeletingId(userItem.id);
      await adminApi.deleteUser(userItem.id);
      setUsers(prev => prev.filter(u => u.id !== userItem.id));
      setActionFeedback({ 
        type: 'success', 
        message: `Account ${userItem.reg_number} was successfully deactivated and removed.` 
      });
    } catch (err) {
      setActionFeedback({ 
        type: 'error', 
        message: err.response?.data?.message || err.message || 'Failed to delete user account' 
      });
    } finally {
      setDeletingId(null);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newUser.reg_number.trim() || !newUser.password) {
      setActionFeedback({ type: 'error', message: 'Registration number and password are required.' });
      return;
    }

    try {
      setIsSubmitting(true);
      setActionFeedback(null);
      const res = await adminApi.createUser({
        reg_number: newUser.reg_number.trim(),
        full_name: newUser.full_name.trim() || newUser.reg_number.trim(),
        email: newUser.email.trim() || `${newUser.reg_number.trim().toLowerCase()}@university.edu`,
        password: newUser.password,
        role: newUser.role,
        department: newUser.department.trim() || 'Computer Science'
      });

      const created = res.data;
      setUsers(prev => [...prev, created]);
      setNewUser({
        reg_number: '',
        full_name: '',
        email: '',
        password: '',
        role: 'student',
        department: 'Computer Science'
      });
      setShowAddForm(false);
      setActionFeedback({ 
        type: 'success', 
        message: `Successfully provisioned account for ${created.reg_number} (${created.role}).` 
      });
    } catch (err) {
      setActionFeedback({ 
        type: 'error', 
        message: err.response?.data?.message || err.message || 'Failed to provision user account' 
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  // Enroll Student Handler
  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!enrollForm.student_id || !enrollForm.course_code) {
      setActionFeedback({ type: 'error', message: 'Please select both an eligible student and course module.' });
      return;
    }

    try {
      setIsEnrolling(true);
      setActionFeedback(null);
      await adminApi.enrollStudent({
        student_id: Number(enrollForm.student_id),
        course_code: enrollForm.course_code
      });

      setShowEnrollModal(false);
      setEnrollForm({ student_id: '', course_code: '' });
      setActionFeedback({ 
        type: 'success', 
        message: 'Student has been successfully enrolled into the academic module!' 
      });
      await fetchEnrollmentData();
    } catch (err) {
      setActionFeedback({ 
        type: 'error', 
        message: err.response?.data?.message || err.message || 'Failed to enroll student into module' 
      });
    } finally {
      setIsEnrolling(false);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  // Unenroll Student Handler
  const handleUnenroll = async (enrollment) => {
    const confirmDrop = window.confirm(
      `Are you sure you want to drop/unenroll ${enrollment.full_name || enrollment.reg_number} from "${enrollment.course_code}: ${enrollment.course_title}"?`
    );
    if (!confirmDrop) return;

    const unenrollKey = `${enrollment.student_id}-${enrollment.course_code}`;
    try {
      setUnenrollingKey(unenrollKey);
      await adminApi.unenrollStudent(enrollment.student_id, enrollment.course_code);
      setActionFeedback({
        type: 'success',
        message: `Unenrolled ${enrollment.full_name || enrollment.reg_number} from ${enrollment.course_code}.`
      });
      await fetchEnrollmentData();
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to unenroll student'
      });
    } finally {
      setUnenrollingKey(null);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const safeUsers = Array.isArray(users) ? users : [];
  const safeEnrollments = Array.isArray(enrollments) ? enrollments : [];
  const safeCourses = Array.isArray(courses) ? courses : [];

  const studentCount = safeUsers.filter(u => u.role?.toLowerCase() === 'student').length;
  const lecturerCount = safeUsers.filter(u => u.role?.toLowerCase() === 'lecturer').length;
  const adminCount = safeUsers.filter(u => u.role?.toLowerCase() === 'admin').length;

  const eligibleStudents = safeUsers.filter(u => u.role?.toLowerCase() === 'student');
  const uniqueEnrolledStudents = new Set(safeEnrollments.map(e => e.student_id)).size;
  const uniqueActiveCourses = new Set(safeEnrollments.map(e => e.course_code)).size;
  const avgEnrollmentPerStudent = uniqueEnrolledStudents > 0 
    ? (safeEnrollments.filter(e => e.enrollment_status === 'active').length / uniqueEnrolledStudents).toFixed(1) 
    : '0.0';

  const filteredEnrollments = safeEnrollments.filter(e => {
    const matchesSearch = !enrollmentSearch.trim() || 
      (e.reg_number && e.reg_number.toLowerCase().includes(enrollmentSearch.toLowerCase())) ||
      (e.full_name && e.full_name.toLowerCase().includes(enrollmentSearch.toLowerCase())) ||
      (e.course_code && e.course_code.toLowerCase().includes(enrollmentSearch.toLowerCase())) ||
      (e.course_title && e.course_title.toLowerCase().includes(enrollmentSearch.toLowerCase())) ||
      (e.department && e.department.toLowerCase().includes(enrollmentSearch.toLowerCase()));

    const matchesCourse = enrollmentCourseFilter === 'all' || e.course_code === enrollmentCourseFilter;
    const matchesStatus = enrollmentStatusFilter === 'all' || e.enrollment_status === enrollmentStatusFilter;

    return matchesSearch && matchesCourse && matchesStatus;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans select-none">
      
      {/* ============================================================ */}
      {/* 1. MONGODB COMPASS-INSPIRED HERO SECTION */}
      {/* ============================================================ */}
      <div className="pt-2 pb-2">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
          
          {/* Left Column: Bold Headline and Actions */}
          <div className="w-full lg:w-1/2 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E6F8ED] border border-[#00ED64]/40 text-xs font-bold text-[#00684A]">
              <Sparkles size={14} className="text-[#00684A]" />
              <span>Institutional Access &amp; Enrollment Hub</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#001E2B] tracking-tight leading-[1.12]">
              {activeMainTab === 'users' 
                ? 'Provision and manage university user accounts' 
                : 'Manage student course enrollments and allocations'}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-lg">
              {activeMainTab === 'users'
                ? 'Centralized institutional identity directory, degree cohort allocations, lecturer credentials, and security permissions across all faculties.'
                : 'Directly enroll undergraduates into degree modules, oversee course capacity allocations, track active statuses, and manage course drops.'}
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-3">
              {activeMainTab === 'users' ? (
                <button 
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-black px-4 py-2 rounded-xl bg-[#00ED64] hover:bg-[#00d859] text-[#001E2B] shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <UserPlus size={15} />
                  <span>Provision New User</span>
                </button>
              ) : (
                <button 
                  onClick={() => setShowEnrollModal(true)}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-black px-4 py-2 rounded-xl bg-[#00ED64] hover:bg-[#00d859] text-[#001E2B] shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <GraduationCap size={16} />
                  <span>Enroll Student in Module</span>
                </button>
              )}
              
              <button 
                onClick={() => {
                  fetchUsers();
                  fetchEnrollmentData();
                }}
                className="p-2 rounded-xl border border-[#E2E1D9] bg-white hover:bg-[#FAF9F5] text-slate-600 hover:text-[#00684A] transition-colors cursor-pointer"
                title="Refresh directory & enrollment data"
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          {/* Right Column: MongoDB Compass Interactive Summary Card */}
          <div className="w-full lg:w-1/2 max-w-xl">
            <div className="bg-white rounded-3xl border-2 border-[#00ED64] p-5 sm:p-6 shadow-xl relative transition-all">
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-black text-[#00684A] tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00ED64] animate-pulse"></span>
                  Compass Command Telemetry
                </h3>
                <span className="text-[11px] font-bold text-slate-400">
                  {activeMainTab === 'users' ? `${safeUsers.length} Active Credentials` : `${safeEnrollments.length} Total Enrollments`}
                </span>
              </div>

              <div className="p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#E2E1D9] mb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#001E2B]">
                    {activeMainTab === 'users' ? 'Role Distribution' : 'Module Capacity Overview'}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/30">
                    Verified Sync
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {activeMainTab === 'users'
                    ? `Managing ${studentCount} undergraduate student profiles, ${lecturerCount} faculty lecturers, and ${adminCount} platform administrators.`
                    : `${uniqueEnrolledStudents} distinct students actively enrolled across ${uniqueActiveCourses} taught modules with ${avgEnrollmentPerStudent} average module load.`}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-slate-600 pt-1">
                <span className="flex items-center gap-1.5 text-[#00684A]">
                  <Shield size={14} />
                  <span>Institutional RBAC Enforced</span>
                </span>
                <span className="text-[#001E2B]">
                  Domain: university.edu
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* In-app Notification Banner */}
      {actionFeedback && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in duration-200 ${
          actionFeedback.type === 'success' 
            ? 'bg-[#E6F8ED] text-[#00684A] border-[#00ED64]' 
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 size={18} className="text-[#00684A] shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-rose-500 shrink-0" />
          )}
          <span className="text-xs font-bold">{actionFeedback.message}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. MAIN NAVIGATION PILL SWITCHER */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl border border-[#E2E1D9] p-2 sm:p-2.5 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMainTab('users')}
            className={`flex-1 py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeMainTab === 'users'
                ? 'bg-[#00684A] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#001E2B] hover:bg-[#FAF9F5]'
            }`}
          >
            <User size={16} />
            <span>User Accounts Directory ({safeUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab('enrollments')}
            className={`flex-1 py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeMainTab === 'enrollments'
                ? 'bg-[#00684A] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#001E2B] hover:bg-[#FAF9F5]'
            }`}
          >
            <GraduationCap size={16} />
            <span>Student Course Enrollments ({safeEnrollments.length})</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. TOP 4 KPI CARDS (Drives by Active Main Tab) */}
      {/* ============================================================ */}
      {activeMainTab === 'users' ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Users</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/30">Active</span>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-black text-[#001E2B]">{safeUsers.length}</div>
              <span className="text-xs text-slate-400 font-medium">accounts</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Undergrads</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/30">Students</span>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-black text-[#00684A]">{studentCount}</div>
              <span className="text-xs text-slate-400 font-medium">registered</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Faculty Leads</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#001E2B] bg-[#FAF9F5] border border-[#E2E1D9]">Instructors</span>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-black text-[#001E2B]">{lecturerCount}</div>
              <span className="text-xs text-slate-400 font-medium">lecturers</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Operators</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/30">Root Scope</span>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-black text-[#001E2B]">{adminCount}</div>
              <span className="text-xs text-slate-400 font-medium">admins</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Enrollments</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/30">Modules</span>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-black text-[#001E2B]">{safeEnrollments.length}</div>
              <span className="text-xs text-slate-400 font-medium">records</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Enrolled Students</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/30">Active</span>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-black text-[#00684A]">{uniqueEnrolledStudents}</div>
              <span className="text-xs text-slate-400 font-medium">undergrads</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Courses</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#001E2B] bg-[#FAF9F5] border border-[#E2E1D9]">Taught</span>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-black text-[#001E2B]">{uniqueActiveCourses}</div>
              <span className="text-xs text-slate-400 font-medium">modules</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Avg Course Load</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/30">Per Student</span>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-black text-[#001E2B]">{avgEnrollmentPerStudent}</div>
              <span className="text-xs text-slate-400 font-medium">modules</span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. MAIN CONTENT AREA */}
      {/* ============================================================ */}
      {activeMainTab === 'users' ? (
        /* USERS DIRECTORY VIEW */
        <div className="bg-white rounded-3xl border border-[#E2E1D9] p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Role Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: `All Roles (${safeUsers.length})` },
                { id: 'student', label: `Students (${studentCount})` },
                { id: 'lecturer', label: `Lecturers (${lecturerCount})` },
                { id: 'admin', label: `Administrators (${adminCount})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setRoleFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    roleFilter === tab.id
                      ? 'bg-[#00684A] text-white shadow-xs'
                      : 'bg-[#FAF9F5] text-slate-600 hover:text-[#001E2B] hover:bg-slate-100 border border-[#E2E1D9]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-80">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Search name, reg, email..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-[#FAF9F5] border border-[#E2E1D9] rounded-xl text-[#001E2B] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00ED64] focus:border-[#00ED64] font-medium transition-all"
                />
              </div>
              <button 
                type="submit" 
                className="py-1.5 px-3.5 text-xs font-black bg-[#00ED64] hover:bg-[#00d859] text-[#001E2B] rounded-xl shadow-xs transition-all shrink-0 cursor-pointer active:scale-95"
              >
                Search
              </button>
            </form>
          </div>

          {/* Users Table */}
          {loading ? (
            <LoadingSpinner text="Querying university user directory..." />
          ) : safeUsers.length === 0 ? (
            <EmptyState 
              icon={User} 
              title="No Users Found" 
              message="No user accounts matched the current search query or role filter." 
            />
          ) : (
            <div className="overflow-x-auto pt-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2E1D9] text-slate-500 font-bold bg-[#FAF9F5]">
                    <th className="py-3 px-3.5">Registration / ID</th>
                    <th className="py-3 px-3.5">Full Name</th>
                    <th className="py-3 px-3.5">Role</th>
                    <th className="py-3 px-3.5">Department</th>
                    <th className="py-3 px-3.5">Email Address</th>
                    <th className="py-3 px-3.5 text-center">Course Marks / Status</th>
                    <th className="py-3 px-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E1D9]">
                  {safeUsers.map(u => {
                    const roleStyle = {
                      admin: 'bg-[#001E2B] text-white border-[#001E2B]',
                      lecturer: 'bg-purple-50 text-purple-700 border-purple-200',
                      student: 'bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/40'
                    }[u.role?.toLowerCase()] || 'bg-[#FAF9F5] text-slate-700 border-[#E2E1D9]';

                    return (
                      <tr key={u.id} className="hover:bg-[#FAF9F5]/70 transition-colors">
                        <td className="py-3 px-3.5 font-mono font-bold text-[#001E2B]">{u.reg_number}</td>
                        <td className="py-3 px-3.5 font-semibold text-[#001E2B]">{u.full_name}</td>
                        <td className="py-3 px-3.5">
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${roleStyle}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-slate-500 font-medium">{u.department || 'Computer Science'}</td>
                        <td className="py-3 px-3.5 text-slate-500 font-mono text-[11px]">{u.email}</td>
                        <td className="py-3 px-3.5 text-center">
                          {u.role?.toLowerCase() === 'student' ? (
                            <span className="font-bold text-[#00684A]">
                              {u.avg_score ? `Avg: ${u.avg_score}%` : 'Enrolled (Good)'}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          {u.id !== 1 && (
                            <button
                              onClick={() => handleRemove(u)}
                              disabled={deletingId === u.id}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Account"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* STUDENT ENROLLMENTS VIEW */
        <div className="bg-white rounded-3xl border border-[#E2E1D9] p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Course filter */}
              <select
                value={enrollmentCourseFilter}
                onChange={(e) => setEnrollmentCourseFilter(e.target.value)}
                className="py-1.5 px-3 rounded-xl text-xs font-bold bg-[#FAF9F5] border border-[#E2E1D9] text-[#001E2B] focus:outline-none focus:ring-1 focus:ring-[#00ED64]"
              >
                <option value="all">All Modules ({safeCourses.length})</option>
                {safeCourses.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.title}
                  </option>
                ))}
              </select>

              {/* Status filter */}
              <select
                value={enrollmentStatusFilter}
                onChange={(e) => setEnrollmentStatusFilter(e.target.value)}
                className="py-1.5 px-3 rounded-xl text-xs font-bold bg-[#FAF9F5] border border-[#E2E1D9] text-[#001E2B] focus:outline-none focus:ring-1 focus:ring-[#00ED64]"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="dropped">Dropped</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Search Box & Quick Add */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Search student, module, code..." 
                  value={enrollmentSearch}
                  onChange={(e) => setEnrollmentSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-[#FAF9F5] border border-[#E2E1D9] rounded-xl text-[#001E2B] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00ED64] focus:border-[#00ED64] font-medium transition-all"
                />
              </div>

              <button
                onClick={() => setShowEnrollModal(true)}
                className="py-1.5 px-3.5 text-xs font-black bg-[#00ED64] hover:bg-[#00d859] text-[#001E2B] rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
              >
                <PlusCircle size={14} />
                <span>Enroll Student</span>
              </button>
            </div>

          </div>

          {/* Enrollments Table */}
          {enrollLoading ? (
            <LoadingSpinner text="Retrieving student module enrollments..." />
          ) : filteredEnrollments.length === 0 ? (
            <EmptyState 
              icon={GraduationCap} 
              title="No Enrollments Found" 
              message="No student enrollment records match the selected course module or search query." 
            />
          ) : (
            <div className="overflow-x-auto pt-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2E1D9] text-slate-500 font-bold bg-[#FAF9F5]">
                    <th className="py-3 px-3.5">Student Reg Number</th>
                    <th className="py-3 px-3.5">Student Full Name</th>
                    <th className="py-3 px-3.5">Module Code</th>
                    <th className="py-3 px-3.5">Module Title</th>
                    <th className="py-3 px-3.5 text-center">Credits</th>
                    <th className="py-3 px-3.5">Enrolled Date</th>
                    <th className="py-3 px-3.5 text-center">Status</th>
                    <th className="py-3 px-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E1D9]">
                  {filteredEnrollments.map((enr) => {
                    const rowKey = `${enr.student_id}-${enr.course_code}`;
                    const isDropping = unenrollingKey === rowKey;

                    const statusStyle = {
                      active: 'bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/40',
                      completed: 'bg-blue-50 text-blue-700 border-blue-200',
                      dropped: 'bg-rose-50 text-rose-700 border-rose-200'
                    }[enr.enrollment_status?.toLowerCase()] || 'bg-slate-100 text-slate-600';

                    const enrolledDate = enr.enrolled_at 
                      ? new Date(enr.enrolled_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                      : 'Active Term';

                    return (
                      <tr key={rowKey} className="hover:bg-[#FAF9F5]/70 transition-colors">
                        <td className="py-3 px-3.5 font-mono font-bold text-[#001E2B]">{enr.reg_number}</td>
                        <td className="py-3 px-3.5 font-semibold text-[#001E2B]">{enr.full_name}</td>
                        <td className="py-3 px-3.5">
                          <span className="font-mono font-bold px-2 py-0.5 rounded-lg bg-[#FAF9F5] border border-[#E2E1D9] text-[#00684A]">
                            {enr.course_code}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-slate-700 font-medium">{enr.course_title}</td>
                        <td className="py-3 px-3.5 text-center font-bold text-[#001E2B]">{enr.credits || 3}</td>
                        <td className="py-3 px-3.5 text-slate-500 font-mono text-[11px]">{enrolledDate}</td>
                        <td className="py-3 px-3.5 text-center">
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${statusStyle}`}>
                            {enr.enrollment_status || 'active'}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          {enr.enrollment_status === 'active' && (
                            <button
                              onClick={() => handleUnenroll(enr)}
                              disabled={isDropping}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer text-xs font-bold"
                              title="Unenroll student from module"
                            >
                              <UserMinus size={14} />
                              <span>{isDropping ? 'Dropping...' : 'Drop'}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. MODAL: PROVISION NEW USER */}
      {/* ============================================================ */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#E2E1D9] space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E2E1D9] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00684A] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <UserPlus size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/40">
                    Identity &amp; Access
                  </span>
                  <h3 className="text-base font-bold text-[#001E2B] mt-1">Provision New Account</h3>
                </div>
              </div>
              <button 
                onClick={() => setShowAddForm(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-[#FAF9F5] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#001E2B] mb-1.5">
                  Registration Number / Username *
                </label>
                <input 
                  type="text" 
                  value={newUser.reg_number}
                  onChange={(e) => setNewUser({ ...newUser, reg_number: e.target.value })}
                  placeholder="e.g. 2024CSCA009 or Lec005"
                  className="w-full p-2.5 rounded-xl border border-[#E2E1D9] bg-[#FAF9F5] focus:bg-white focus:border-[#00ED64] focus:ring-1 focus:ring-[#00ED64] outline-none font-mono font-bold transition-all text-[#001E2B]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#001E2B] mb-1.5">Full Legal Name</label>
                <input 
                  type="text" 
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  placeholder="e.g. Ruwan Jayasuriya"
                  className="w-full p-2.5 rounded-xl border border-[#E2E1D9] bg-[#FAF9F5] focus:bg-white focus:border-[#00ED64] focus:ring-1 focus:ring-[#00ED64] outline-none transition-all font-medium text-[#001E2B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#001E2B] mb-1.5">Assigned Role *</label>
                  <select 
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E2E1D9] bg-[#FAF9F5] focus:bg-white focus:border-[#00ED64] focus:ring-1 focus:ring-[#00ED64] outline-none font-bold uppercase transition-all text-[#001E2B]"
                  >
                    <option value="student">Student</option>
                    <option value="lecturer">Lecturer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#001E2B] mb-1.5">Department</label>
                  <input 
                    type="text" 
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E2E1D9] bg-[#FAF9F5] focus:bg-white focus:border-[#00ED64] focus:ring-1 focus:ring-[#00ED64] outline-none transition-all font-medium text-[#001E2B]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#001E2B] mb-1.5">Initial Temporary Password *</label>
                <input 
                  type="password" 
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="w-full p-2.5 rounded-xl border border-[#E2E1D9] bg-[#FAF9F5] focus:bg-white focus:border-[#00ED64] focus:ring-1 focus:ring-[#00ED64] outline-none font-mono transition-all text-[#001E2B]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-[#FAF9F5] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-[#00ED64] hover:bg-[#00d859] text-[#001E2B] py-2 px-5 font-black rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <UserPlus size={14} />
                  <span>{isSubmitting ? 'Provisioning...' : 'Confirm & Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. MODAL: ENROLL STUDENT IN MODULE */}
      {/* ============================================================ */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#E2E1D9] space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E2E1D9] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00684A] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/40">
                    Course Allocation
                  </span>
                  <h3 className="text-base font-bold text-[#001E2B] mt-1">Enroll Student into Module</h3>
                </div>
              </div>
              <button 
                onClick={() => setShowEnrollModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-[#FAF9F5] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#001E2B] mb-1.5">
                  Select Undergraduate Student *
                </label>
                <select
                  value={enrollForm.student_id}
                  onChange={(e) => setEnrollForm({ ...enrollForm, student_id: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E2E1D9] bg-[#FAF9F5] focus:bg-white focus:border-[#00ED64] focus:ring-1 focus:ring-[#00ED64] outline-none font-medium transition-all text-[#001E2B]"
                  required
                >
                  <option value="">-- Choose registered student --</option>
                  {eligibleStudents.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.reg_number} - {st.full_name} ({st.department || 'CS'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#001E2B] mb-1.5">
                  Select Academic Course Module *
                </label>
                <select
                  value={enrollForm.course_code}
                  onChange={(e) => setEnrollForm({ ...enrollForm, course_code: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E2E1D9] bg-[#FAF9F5] focus:bg-white focus:border-[#00ED64] focus:ring-1 focus:ring-[#00ED64] outline-none font-medium transition-all text-[#001E2B]"
                  required
                >
                  <option value="">-- Choose taught module --</option>
                  {safeCourses.map(crs => (
                    <option key={crs.code} value={crs.code}>
                      {crs.code}: {crs.title} ({crs.credits || 3} Credits)
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E2E1D9] text-slate-600 space-y-1">
                <div className="font-bold text-[#001E2B] flex items-center gap-1.5">
                  <Check size={14} className="text-[#00684A]" />
                  <span>Automatic Sync</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Upon enrollment, this module will instantly appear in the student's dashboard, attendance rosters, and grading modules.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowEnrollModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-[#FAF9F5] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isEnrolling}
                  className="bg-[#00ED64] hover:bg-[#00d859] text-[#001E2B] py-2 px-5 font-black rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <GraduationCap size={15} />
                  <span>{isEnrolling ? 'Enrolling...' : 'Confirm Enrollment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
