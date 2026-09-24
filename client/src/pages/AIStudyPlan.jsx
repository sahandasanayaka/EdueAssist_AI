import { useState, useEffect } from 'react';
import { 
  Target, CheckCircle2, Clock, Sparkles, RefreshCw, 
  AlertCircle, Trash2, Sliders, Calendar, BookOpen, 
  TrendingUp, Award, ArrowRight, Check, Search
} from 'lucide-react';
import studentApi from '../services/studentApi';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';

export default function AIStudyPlan() {
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState(null);
  const [error, setError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Generation options
  const [showConfig, setShowConfig] = useState(false);
  const [days, setDays] = useState(7);
  const [dailyMinutes, setDailyMinutes] = useState(120);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL'); // 'ALL' | 'PENDING' | 'COMPLETED' | 'URGENT'

  const fetchStudyPlanAndAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const [planRes, analysisRes] = await Promise.all([
        studentApi.getStudyPlan(),
        studentApi.getAcademicAnalysis().catch(() => ({ data: null }))
      ]);

      setTasks(planRes.data || []);
      setSummary(planRes.summary || null);
      if (analysisRes?.data) {
        setAnalysis(analysisRes.data);
      }
    } catch (err) {
      console.error('Error loading study plan:', err);
      setError(err.message || 'Failed to retrieve study plan tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudyPlanAndAnalysis();
  }, []);

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setGenError(null);
    try {
      const res = await studentApi.generateStudyPlan({ days, dailyMinutes });
      setTasks(res.data || []);
      setSummary(res.summary || null);
      setShowConfig(false);
    } catch (err) {
      console.error('Study plan generation failed:', err);
      setGenError('Unable to generate your study plan right now. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleTask = async (taskId) => {
    setTogglingId(taskId);
    try {
      const res = await studentApi.toggleStudyPlanTask(taskId);
      const updatedTask = res.data;

      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: updatedTask.status, completed: updatedTask.status === 'completed' } 
          : task
      ));

      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (err) {
      console.error('Failed to toggle task status:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Remove this task from your study plan?')) return;
    setDeletingId(taskId);
    try {
      const res = await studentApi.deleteStudyPlanTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Synthesizing personalized study plan from LMS modules..." />;
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <ErrorMessage 
          title="Could not load study plan" 
          message={error} 
          onRetry={fetchStudyPlanAndAnalysis} 
        />
      </div>
    );
  }

  const completedCount = summary?.completedTasks ?? tasks.filter(t => t.completed || t.status === 'completed').length;
  const totalCount = summary?.totalTasks ?? tasks.length;
  const progressPercent = summary?.completionPercentage ?? (totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0);
  const totalMins = summary?.totalMinutes ?? tasks.reduce((sum, t) => sum + (t.estimated_minutes || 60), 0);
  const remainingMins = summary?.remainingMinutes ?? tasks.filter(t => !t.completed && t.status !== 'completed').reduce((sum, t) => sum + (t.estimated_minutes || 60), 0);

  const riskLevel = analysis?.risk?.level || 'LOW';
  const targetMark = analysis?.target_mark || '90%';
  const markTrend = analysis?.performance_trend || 'OPTIMAL';

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (t.title || '').toLowerCase().includes(q);
      const matchReason = (t.reason || t.description || '').toLowerCase().includes(q);
      const matchCode = (t.course_code || '').toLowerCase().includes(q);
      if (!matchTitle && !matchReason && !matchCode) return false;
    }

    const isDone = t.completed || t.status === 'completed';
    if (filterPriority === 'ALL') return true;
    if (filterPriority === 'PENDING') return !isDone;
    if (filterPriority === 'COMPLETED') return isDone;
    if (filterPriority === 'URGENT') return (t.priority || '').toUpperCase() === 'URGENT';
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
              <span>AI Curriculum Optimization</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#001E2B] tracking-tight leading-[1.12]">
              Optimize your semester study roadmap
            </h1>

            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-lg">
              EduAssist AI structures adaptive daily revision blocks around your upcoming assignments, syllabus topics, and exam target marks—keeping you balanced and ahead of schedule.
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-3">
              <button 
                onClick={() => setShowConfig(prev => !prev)}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-black px-4 py-2 rounded-xl bg-[#00ED64] hover:bg-[#00d859] text-[#001E2B] shadow-xs transition-all cursor-pointer"
              >
                <Sliders size={15} />
                <span>{showConfig ? 'Close Generator' : 'Generate Adaptive Plan'}</span>
              </button>

              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-chat', { detail: { open: true } }))}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold px-4 py-2 rounded-xl bg-white hover:bg-[#FAF9F5] text-[#001E2B] border border-[#E2E1D9] transition-all cursor-pointer"
              >
                <Sparkles size={15} className="text-[#00684A]" />
                <span>Ask AI Coach</span>
              </button>
              
              <button 
                onClick={fetchStudyPlanAndAnalysis}
                disabled={isGenerating}
                className="p-2 rounded-xl border border-[#E2E1D9] bg-white hover:bg-[#FAF9F5] text-slate-600 hover:text-[#00684A] transition-colors cursor-pointer"
                title="Refresh plan"
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          {/* Right Column: MongoDB Compass Interactive Window Card */}
          <div className="w-full lg:w-1/2 max-w-xl">
            <div className="bg-white rounded-3xl border-2 border-[#00ED64] p-5 sm:p-6 shadow-xl relative transition-all">
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-black text-[#00684A] tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00ED64] animate-pulse"></span>
                  Compass Study Engine
                </h3>
                <span className="text-[11px] font-bold text-slate-400">
                  Target: 90%+ Course Mark
                </span>
              </div>

              <div className="p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#E2E1D9] mb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#001E2B]">Pacing Recommendation</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/30">
                    {days} Days Window
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Allocate {dailyMinutes} mins daily across upcoming coursework. Prioritize tasks marked with High Continuous Assessment weight.
                </p>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-slate-600 pt-1">
                <span className="flex items-center gap-1.5 text-[#00684A]">
                  <Clock size={14} />
                  <span>Remaining: {remainingMins} mins</span>
                </span>
                <span className="text-[#001E2B]">
                  Roadmap: {progressPercent}% Done
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Generator Configuration Drawer (Compass Styled) */}
      {showConfig && (
        <div className="bg-white rounded-3xl border border-[#00ED64] p-5 sm:p-6 shadow-sm transition-all duration-200 space-y-4 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-[#E2E1D9] pb-3">
            <div className="flex items-center gap-2">
              <Sliders size={16} className="text-[#00684A]" />
              <h2 className="text-sm font-bold text-[#001E2B]">Configure AI Roadmap Generator</h2>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Grounded in LMS Modules</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#001E2B] block mb-2">
                Roadmap Horizon:
              </label>
              <div className="flex items-center gap-2">
                {[7, 14].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      days === d 
                        ? 'bg-[#00684A] text-white shadow-xs' 
                        : 'bg-[#FAF9F5] hover:bg-[#E2E1D9]/40 text-slate-600 border border-[#E2E1D9]'
                    }`}
                  >
                    {d} Days Pacing
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#001E2B] block mb-2">
                Daily Study Budget:
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {[60, 90, 120, 180].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDailyMinutes(m)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      dailyMinutes === m 
                        ? 'bg-[#00684A] text-white shadow-xs' 
                        : 'bg-[#FAF9F5] hover:bg-[#E2E1D9]/40 text-slate-600 border border-[#E2E1D9]'
                    }`}
                  >
                    {m} min / day
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E1D9]">
            <button
              onClick={() => setShowConfig(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-[#FAF9F5] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="bg-[#00ED64] hover:bg-[#00d859] text-[#001E2B] px-5 py-2 text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors active:scale-95 disabled:opacity-50"
            >
              <Sparkles size={14} />
              <span>{isGenerating ? 'Synthesizing...' : 'Generate Adaptive Plan'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading Banner */}
      {isGenerating && (
        <div className="p-4 rounded-2xl bg-[#E6F8ED] border border-[#00ED64] flex items-center gap-3 text-[#00684A] animate-pulse">
          <RefreshCw size={18} className="animate-spin text-[#00684A]" />
          <p className="text-xs font-bold">Synthesizing personalized study plan based on current course loads...</p>
        </div>
      )}

      {/* Error Message */}
      {genError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700">
          <AlertCircle size={18} className="shrink-0" />
          <p className="text-xs font-bold">{genError}</p>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. TOP 4 KPI CARDS (Identical to Compass Dashboard) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Academic Risk */}
        <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Academic Risk</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
              riskLevel === 'HIGH' 
                ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                : riskLevel === 'MEDIUM' 
                  ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                  : 'bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/30'
            }`}>
              {riskLevel}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-black text-[#001E2B]">{riskLevel === 'LOW' ? 'Optimal' : riskLevel}</div>
            <span className="text-xs text-slate-400 font-medium">status</span>
          </div>
        </div>

        {/* Card 2: Target Course Mark */}
        <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Course Mark</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/30 flex items-center gap-1">
              <TrendingUp size={11} />
              <span>{markTrend}</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-black text-[#001E2B]">{targetMark}</div>
            <span className="text-xs text-slate-400 font-medium">Distinction</span>
          </div>
        </div>

        {/* Card 3: Plan Progress */}
        <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Plan Progress</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/30">
              {completedCount}/{totalCount} Done
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-black text-[#00684A]">{progressPercent}%</div>
            <span className="text-xs text-slate-400 font-medium">completed</span>
          </div>
        </div>

        {/* Card 4: Remaining Effort */}
        <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Remaining Effort</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#001E2B] bg-[#FAF9F5] border border-[#E2E1D9]">
              Total: {totalMins}m
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-black text-[#001E2B]">{remainingMins}</div>
            <span className="text-xs text-slate-400 font-medium">mins to go</span>
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
              { id: 'ALL', label: `All Milestones (${tasks.length})` },
              { id: 'PENDING', label: `Pending (${tasks.filter(t => !t.completed && t.status !== 'completed').length})` },
              { id: 'COMPLETED', label: `Completed (${completedCount})` },
              { id: 'URGENT', label: `Urgent (${tasks.filter(t => (t.priority || '').toUpperCase() === 'URGENT').length})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterPriority(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  filterPriority === tab.id
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
              placeholder="Search milestone or module..."
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#E2E1D9] text-xs text-[#001E2B] placeholder-slate-400 focus:outline-none focus:border-[#00ED64] focus:ring-1 focus:ring-[#00ED64]"
            />
          </div>

        </div>

        {/* ============================================================ */}
        {/* 4. TASKS & MILESTONES LIST */}
        {/* ============================================================ */}
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center bg-[#FAF9F5] rounded-2xl border border-[#E2E1D9]">
            <Target size={32} className="mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-bold text-[#001E2B]">No study tasks found</p>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery ? `No tasks matching "${searchQuery}".` : 'No tasks in this category. Generate a new study plan above!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {filteredTasks.map(task => {
              const isCompleted = task.completed || task.status === 'completed';
              const priority = (task.priority || 'MEDIUM').toUpperCase();

              return (
                <div 
                  key={task.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 group bg-white ${
                    isCompleted 
                      ? 'bg-[#FAF9F5]/70 border-dashed border-[#E2E1D9] opacity-75' 
                      : priority === 'URGENT'
                        ? 'border-rose-200 hover:border-rose-400'
                        : 'border-[#E2E1D9] hover:border-[#00ED64]'
                  } hover:shadow-xs`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    
                    {/* Checkbox Trigger */}
                    <button 
                      onClick={() => handleToggleTask(task.id)}
                      disabled={togglingId === task.id || isGenerating}
                      className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0 cursor-pointer ${
                        isCompleted 
                          ? 'bg-[#00684A] border-[#00684A] text-white shadow-xs' 
                          : 'border-[#E2E1D9] hover:border-[#00ED64] text-transparent hover:text-[#00ED64] bg-white'
                      }`}
                      title={isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
                    >
                      <CheckCircle2 size={15} className={isCompleted ? 'stroke-[2.5]' : ''} />
                    </button>

                    <div className="flex-1 min-w-0 space-y-1">
                      
                      {/* Meta Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        {task.course_code && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/40 flex items-center gap-1">
                            <BookOpen size={11} />
                            {task.course_code}
                          </span>
                        )}

                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                          priority === 'URGENT'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : priority === 'HIGH'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {priority}
                        </span>

                        {task.estimated_minutes && (
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                            <Clock size={11} className="text-[#00684A]" />
                            {task.estimated_minutes} min
                          </span>
                        )}

                        {(task.deadline || task.due_date) && (
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                            <Calendar size={11} />
                            {new Date(task.deadline || task.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className={`text-sm sm:text-base font-bold leading-snug group-hover:text-[#00684A] transition-colors ${
                        isCompleted ? 'line-through text-slate-400' : 'text-[#001E2B]'
                      }`}>
                        {task.title}
                      </h3>

                      {/* Explanation */}
                      {(task.reason || task.description) && (
                        <p className="text-xs text-slate-500 max-w-2xl leading-relaxed font-normal">
                          {task.reason || task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-center">
                    <button 
                      onClick={() => handleToggleTask(task.id)}
                      disabled={togglingId === task.id || isGenerating}
                      className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        isCompleted 
                          ? 'bg-[#FAF9F5] hover:bg-slate-200 text-slate-600 border-[#E2E1D9]' 
                          : 'bg-[#00684A] hover:bg-[#02523a] text-white border-transparent shadow-2xs'
                      }`}
                    >
                      {isCompleted ? 'Undo' : 'Complete'}
                    </button>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      disabled={deletingId === task.id || isGenerating}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete task"
                    >
                      <Trash2 size={15} />
                    </button>
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
