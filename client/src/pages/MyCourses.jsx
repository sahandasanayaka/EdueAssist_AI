import { useState, useEffect } from 'react';
import { 
  BookOpen, GraduationCap, Award, Calendar, CheckCircle2, 
  ChevronRight, X, Sparkles, ArrowRight, Search, Clock, Layers, Users
} from 'lucide-react';
import studentApi from '../services/studentApi';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';

export default function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL'); // 'ALL' | 'CORE' | 'ADVANCED' | 'HIGH_PROGRESS'

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentApi.getCourses();
      setCourses(res.data || []);
    } catch (err) {
      console.error('Error fetching registered courses:', err);
      setError(err.message || 'Unable to load registered academic courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Retrieving enrolled courses & academic syllabi..." />;
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <ErrorMessage 
          title="Could not load registered courses" 
          message={error} 
          onRetry={fetchCourses} 
        />
      </div>
    );
  }

  const totalCredits = courses.reduce((acc, c) => acc + (parseInt(c.credits) || 3), 0);
  const avgCourseMark = courses.length > 0 
    ? Math.round(courses.reduce((acc, c) => acc + (parseFloat(c.overall_score) || 85), 0) / courses.length) 
    : 88;

  // Filter courses
  const filteredCourses = courses.filter(c => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = (c.code || '').toLowerCase().includes(q);
      const matchTitle = (c.title || '').toLowerCase().includes(q);
      const matchDesc = (c.description || '').toLowerCase().includes(q);
      const matchLecturer = (c.lecturer_name || '').toLowerCase().includes(q);
      if (!matchCode && !matchTitle && !matchDesc && !matchLecturer) return false;
    }

    const score = parseFloat(c.overall_score) || (parseFloat(c.attendance_percentage) || 75);
    if (activeCategory === 'ALL') return true;
    if (activeCategory === 'HIGH_PROGRESS') return score >= 75;
    if (activeCategory === 'CORE') return (parseInt(c.credits) || 3) >= 3;
    return true;
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
              <span>Registered Degree Curriculum</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#001E2B] tracking-tight leading-[1.12]">
              Explore course curricula and module syllabi
            </h1>

            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-lg">
              EduAssist AI tracks your enrolled university modules, continuous assessment progress, credit allocations, and lecture materials—helping you master key semester concepts.
            </p>

            <div className="pt-1 flex items-center gap-4">
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-chat', { detail: { open: true } }))}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-black px-4 py-2 rounded-xl bg-[#00ED64] hover:bg-[#00d859] text-[#001E2B] shadow-xs transition-all cursor-pointer"
              >
                <Sparkles size={15} />
                <span>Ask AI Curriculum Advisor</span>
              </button>
              
              <span className="text-xs font-bold text-[#00684A] bg-[#E6F8ED] px-3 py-1.5 rounded-xl border border-[#00ED64]/40 inline-flex items-center gap-1.5">
                <GraduationCap size={15} />
                <span>Semester 2 Active</span>
              </span>
            </div>
          </div>

          {/* Right Column: MongoDB Compass Interactive Window Card */}
          <div className="w-full lg:w-1/2 max-w-xl">
            <div className="bg-white rounded-3xl border-2 border-[#00ED64] p-5 sm:p-6 shadow-xl relative transition-all">
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-black text-[#00684A] tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00ED64] animate-pulse"></span>
                  Degree Progression Compass
                </h3>
                <span className="text-[11px] font-bold text-slate-400">
                  BSc (Hons) in AI &amp; Software
                </span>
              </div>

              <div className="p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#E2E1D9] mb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#001E2B]">Current Academic Load</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/30">
                    Optimal Pacing
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  You are registered for {courses.length} courses totaling {totalCredits} academic credits. Your continuous assessment performance is in high academic standing.
                </p>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-slate-600 pt-1">
                <span className="flex items-center gap-1.5 text-[#00684A]">
                  <Award size={14} />
                  <span>Avg Course Mark: {avgCourseMark}%</span>
                </span>
                <span className="text-[#001E2B]">
                  Credits: {totalCredits} Units
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. TOP 4 KPI METRIC CARDS (Identical to Compass Dashboard) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Enrolled Courses */}
        <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Enrolled Courses</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/30">
              Active
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-black text-[#001E2B]">{courses.length}</div>
            <span className="text-xs text-slate-400 font-medium">modules</span>
          </div>
        </div>

        {/* Card 2: Total Credits */}
        <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Credits</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#001E2B] bg-[#FAF9F5] border border-[#E2E1D9]">
              Semester 2
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-black text-[#001E2B]">{totalCredits}</div>
            <span className="text-xs text-slate-400 font-medium">academic units</span>
          </div>
        </div>

        {/* Card 3: Average Course Mark */}
        <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Coursework Avg</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/30">
              High Honors
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-black text-[#00684A]">{avgCourseMark}%</div>
            <span className="text-xs text-slate-400 font-medium">score</span>
          </div>
        </div>

        {/* Card 4: Curriculum Progress */}
        <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completion</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/30">
              On Track
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-black text-[#001E2B]">78%</div>
            <span className="text-xs text-slate-400 font-medium">syllabus pace</span>
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* 3. FILTER CAPSULES & SEARCH BAR */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl border border-[#E2E1D9] p-4 sm:p-5 shadow-2xs space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Subtabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'ALL', label: `All Modules (${courses.length})` },
              { id: 'CORE', label: `Core Computing (${courses.filter(c => (parseInt(c.credits) || 3) >= 3).length})` },
              { id: 'HIGH_PROGRESS', label: `High Progress (${courses.filter(c => (parseFloat(c.overall_score) || 75) >= 75).length})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeCategory === tab.id
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
              placeholder="Search module code or title..."
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#E2E1D9] text-xs text-[#001E2B] placeholder-slate-400 focus:outline-none focus:border-[#00ED64] focus:ring-1 focus:ring-[#00ED64]"
            />
          </div>

        </div>

        {/* ============================================================ */}
        {/* 4. COURSE CARDS GRID (Cute & Compact rounded-2xl) */}
        {/* ============================================================ */}
        {filteredCourses.length === 0 ? (
          <div className="p-8 text-center bg-[#FAF9F5] rounded-2xl border border-[#E2E1D9]">
            <BookOpen size={32} className="mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-bold text-[#001E2B]">No courses found</p>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery ? `No courses matching "${searchQuery}".` : 'No registered courses in this category.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-1">
            {filteredCourses.map(course => {
              const score = parseFloat(course.overall_score) || 0;
              const progress = score > 0 ? score : (parseFloat(course.attendance_percentage) || 75);
              const gradeDisplay = course.grade || (score >= 80 ? 'A' : (score >= 70 ? 'B' : (score >= 60 ? 'C' : 'In Progress')));

              return (
                <div 
                  key={course.code} 
                  className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Header Chips */}
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/40">
                        {course.code}
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#FAF9F5] text-[#001E2B] border border-[#E2E1D9]">
                        Grade: {gradeDisplay}
                      </span>
                    </div>
                    
                    {/* Title & Description */}
                    <h3 className="text-sm font-bold text-[#001E2B] group-hover:text-[#00684A] transition-colors leading-snug line-clamp-1 mb-1">
                      {course.title}
                    </h3>
                    
                    <p className="text-[11px] text-slate-500 mb-2.5 line-clamp-1 leading-normal font-normal">
                      {course.description || 'Core undergraduate academic module.'}
                    </p>
                    
                    {/* Compact Module Meta */}
                    <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium mb-3 bg-[#FAF9F5] px-2.5 py-1.5 rounded-xl border border-[#E2E1D9]">
                      <span className="flex items-center gap-1 truncate">
                        <BookOpen size={12} className="text-[#00684A] shrink-0" />
                        <span>{course.credits} Credits</span>
                      </span>
                      <span className="flex items-center gap-1 truncate max-w-[120px]">
                        <GraduationCap size={12} className="text-[#00684A] shrink-0" />
                        <span className="truncate">{course.lecturer_name || 'Faculty Lead'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Progress & Compact Button */}
                  <div className="pt-2.5 border-t border-[#E2E1D9] space-y-2">
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className="text-slate-500 flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-[#00684A]" />
                        <span>Progress</span>
                      </span>
                      <span className="text-[#00684A] font-black">{Math.round(progress)}%</span>
                    </div>
                    
                    {/* Gradient Progress Bar */}
                    <div className="w-full bg-[#FAF9F5] border border-[#E2E1D9] rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#00ED64] to-[#00684A] rounded-full transition-all duration-500" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <button 
                      onClick={() => setSelectedCourse(course)}
                      className="w-full mt-1 py-1.5 px-3 rounded-lg bg-[#00ED64] hover:bg-[#00d859] text-[#001E2B] font-black text-xs shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                    >
                      <span>Syllabus &amp; Materials</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ============================================================ */}
      {/* 5. COURSE DETAIL MODAL (Compass Styled) */}
      {/* ============================================================ */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#E2E1D9] animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/40">
                  {selectedCourse.code} • {selectedCourse.semester || 'Semester 2'}
                </span>
                <h2 className="text-xl font-black text-[#001E2B] mt-2.5">{selectedCourse.title}</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Department: {selectedCourse.department || 'Computer Science & AI'}
                </p>
              </div>
              <button 
                onClick={() => setSelectedCourse(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-[#FAF9F5] rounded-xl transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-[#FAF9F5] rounded-2xl border border-[#E2E1D9] space-y-2">
                <h4 className="font-bold text-[#001E2B]">Course Overview &amp; Learning Objectives</h4>
                <p className="text-slate-600 leading-relaxed font-normal">
                  {selectedCourse.description || 'This course covers core principles, algorithms, and practical frameworks required for university degree progression.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-700">
                <div className="p-3 bg-white border border-[#E2E1D9] rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Assigned Lecturer</span>
                  <span className="font-bold text-[#001E2B] text-xs">{selectedCourse.lecturer_name || 'Faculty Lead'}</span>
                </div>
                <div className="p-3 bg-white border border-[#E2E1D9] rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Credit Value</span>
                  <span className="font-bold text-[#001E2B] text-xs">{selectedCourse.credits || 3} Academic Credits</span>
                </div>
              </div>

              <div className="p-3.5 bg-[#E6F8ED]/60 rounded-2xl border border-[#00ED64]/40 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#00684A] block">Continuous Assessment Mark</span>
                  <span className="text-slate-600 text-[11px]">Evaluated continuous coursework grade</span>
                </div>
                <span className="text-sm font-black text-[#00684A] bg-white px-3 py-1 rounded-xl border border-[#00ED64]/40">
                  {selectedCourse.overall_score || 88}% Grade A
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setSelectedCourse(null)}
                className="px-5 py-2.5 bg-[#00ED64] hover:bg-[#00d859] text-[#001E2B] rounded-xl text-xs font-black transition-colors cursor-pointer active:scale-95"
              >
                Close Syllabus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
