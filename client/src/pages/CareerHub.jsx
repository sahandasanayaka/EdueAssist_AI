import { useState, useEffect } from 'react';
import { 
  Briefcase, Target, ExternalLink, CheckCircle2, Sparkles, 
  AlertCircle, ArrowUpRight, Check, Edit3, X, BookOpen, 
  Compass, TrendingUp, Award, ChevronRight, Layers
} from 'lucide-react';
import studentApi from '../services/studentApi';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function CareerHub() {
  const [careerData, setCareerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedPathId, setSelectedPathId] = useState('');
  const [targetRoleInput, setTargetRoleInput] = useState('');
  const [targetTimelineInput, setTargetTimelineInput] = useState('12 months');
  const [isUpdatingGoal, setIsUpdatingGoal] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchCareerHub = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentApi.getCareerHub();
      const data = res.data || null;
      setCareerData(data);
      
      const goal = data?.careerGoal || data?.selected_goal;
      if (goal) {
        setSelectedPathId(goal.careerPathId || goal.career_path_id || '');
        setTargetRoleInput(goal.targetRole || goal.target_role || '');
        setTargetTimelineInput(goal.targetTimeline || goal.target_timeline || '12 months');
      }
    } catch (err) {
      console.error('Error loading career hub:', err);
      setError(err.message || 'Failed to retrieve career pathways');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCareerHub();
  }, []);

  const handleUpdateGoal = async (e) => {
    e.preventDefault();
    if (!targetRoleInput.trim() && !selectedPathId) return;

    setIsUpdatingGoal(true);
    try {
      await studentApi.updateCareerGoal({
        careerPathId: selectedPathId ? parseInt(selectedPathId, 10) : null,
        targetRole: targetRoleInput.trim(),
        targetTimeline: targetTimelineInput
      });

      setNotification({
        type: 'success',
        message: 'Target career goal updated and skill gap recalculated!'
      });
      setShowGoalModal(false);
      fetchCareerHub();
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to update career goal'
      });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsUpdatingGoal(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Synthesizing career trajectories & skill gap matrix..." />;
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <ErrorMessage 
          title="Could not load Career Hub" 
          message={error} 
          onRetry={fetchCareerHub} 
        />
      </div>
    );
  }

  // Data normalization
  const careerGoal = careerData?.careerGoal || {
    targetRole: careerData?.selected_goal?.target_role || 'Software Engineer',
    targetTimeline: careerData?.selected_goal?.target_timeline || '12 months',
    readinessScore: parseFloat(careerData?.selected_goal?.readiness_score) || 65,
    careerPathName: careerData?.selected_goal?.path_name || 'Software Engineering',
    description: 'Builds, tests, and maintains modern web and software systems.'
  };

  const readinessScore = Math.round(careerData?.readinessScore ?? careerGoal.readinessScore ?? 65);
  const skillMatchPercentage = Math.round(careerData?.skillMatchPercentage ?? 70);
  const academicAlignment = careerData?.academicAlignment || { score: 75, recommendedCourses: [], breakdown: [] };
  const skillGaps = careerData?.skillGaps || [];
  const careerPaths = careerData?.career_paths || [];
  const roadmapItems = careerData?.roadmap || [];
  const recommendedResources = careerData?.recommendedResources || [];
  const nextSteps = careerData?.nextSteps || [];
  const aiInsights = careerData?.aiInsights;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <Briefcase size={22} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Career Hub</h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200">AI Skill Gap Engine</span>
            </div>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              Target role diagnostics, verified competency benchmarks, and personalized academic alignment.
            </p>
          </div>
        </div>

        <button 
          onClick={() => setShowGoalModal(true)}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Edit3 size={14} />
          <span>Change Career Goal</span>
        </button>
      </div>

      {notification && (
        <div className={`p-3.5 rounded-2xl border flex items-center gap-3 animate-in fade-in duration-200 ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
          )}
          <span className="text-xs font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Hero: Target Career & Overall Readiness Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Current Goal
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Target Timeline: {careerGoal.targetTimeline || '12 months'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {careerGoal.targetRole}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed max-w-2xl">
              {careerGoal.description || 'Target career pathway aligned with your university curriculum and continuous assessments.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Layers size={15} className="text-[#2563EB]" />
                <span>Track: <b className="text-slate-900">{careerGoal.careerPathName || 'General Track'}</b></span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <BookOpen size={15} className="text-[#2563EB]" />
                <span>Academic Alignment: <b className="text-slate-900">{academicAlignment.score}%</b></span>
              </div>
            </div>
          </div>

          {/* Readiness Gauge Meter */}
          <div className="p-5 sm:p-6 bg-slate-50 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Career Readiness
              </span>
              <span className="text-3xl sm:text-4xl font-black text-[#2563EB]">{readinessScore}%</span>
            </div>

            <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden">
              <div 
                className="h-full bg-[#2563EB] rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(5, readinessScore))}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/70 text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Skill Match</span>
                <p className="text-xs font-bold text-slate-800">{skillMatchPercentage}%</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Coursework</span>
                <p className="text-xs font-bold text-slate-800">{academicAlignment.score}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Career Advisor Insights */}
      {aiInsights && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] border border-blue-200 flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">AI Career Advisor Insights</h3>
              <p className="text-[11px] text-slate-500 font-medium">Grounded analysis generated from your verified database skills &amp; university performance</p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
            {aiInsights.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Key Strengths */}
            {aiInsights.keyStrengths?.length > 0 && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="font-bold text-emerald-700 uppercase tracking-wider text-[10px] block mb-2">
                  Key Verified Strengths
                </span>
                <ul className="space-y-1.5">
                  {aiInsights.keyStrengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-700 font-medium">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Critical Gaps */}
            {aiInsights.criticalGaps?.length > 0 && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="font-bold text-rose-700 uppercase tracking-wider text-[10px] block mb-2">
                  Critical Priority Gaps
                </span>
                <ul className="space-y-1.5">
                  {aiInsights.criticalGaps.map((gap, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-700 font-medium">
                      <AlertCircle size={13} className="text-rose-500 shrink-0 mt-0.5" />
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {aiInsights.industryRelevance && (
            <div className="mt-3 p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs font-medium text-slate-700">
              <span className="font-bold text-[#2563EB]">Industry Relevance: </span>
              {aiInsights.industryRelevance}
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Skill Gap Matrix & Actionable Next Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Skill Gap Breakdown Matrix */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Skill Gap Matrix: {careerGoal.targetRole}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Comparison between target industry benchmarks and your verified competency levels
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg self-start sm:self-auto">
                {skillGaps.length} Core Competencies
              </span>
            </div>

            {skillGaps.length === 0 ? (
              <p className="text-xs text-slate-500 font-medium p-4 text-center">
                No skill benchmarks available for this pathway.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/50">
                      <th className="py-3 px-3">Competency</th>
                      <th className="py-3 px-3 text-center">Your Level</th>
                      <th className="py-3 px-3 text-center">Target</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-right">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {skillGaps.map((skill, idx) => {
                      const isStrong = skill.category === 'STRONG';
                      const isDeveloping = skill.category === 'DEVELOPING';
                      const isGap = skill.category === 'GAP';

                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 block">{skill.skillName}</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              Importance: {skill.importance}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-bold">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className={skill.currentLevel > 0 ? 'text-slate-900' : 'text-slate-400'}>
                                {skill.currentLevel} / 5
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center text-slate-600 font-bold">
                            {skill.requiredLevel} / 5
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isStrong && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check size={11} className="stroke-[3]" /> Strong
                              </span>
                            )}
                            {isDeveloping && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                Developing
                              </span>
                            )}
                            {isGap && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                Gap ({skill.gap})
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              skill.priority === 'HIGH' ? 'bg-rose-100 text-rose-800' :
                              skill.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {skill.priority}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 4-Stage Career Pathway Roadmap */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Career Progression Roadmap
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Stage-by-stage milestones to bridge skill gaps and achieve internship readiness
                </p>
              </div>
            </div>

            <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 pb-2">
              {roadmapItems.map((item, index) => {
                const isDone = item.done;
                return (
                  <div key={item.step || index} className="pl-6 relative">
                    <div className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white ${
                      isDone ? 'bg-[#2563EB] text-white shadow-xs' : 'bg-slate-100 text-slate-500 border-slate-100'
                    }`}>
                      {isDone ? <Check size={14} className="stroke-[3]" /> : <span className="text-xs font-bold">{item.step || index + 1}</span>}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">{item.title}</h4>
                        {isDone && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Completed
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                        {item.description || item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Academic Alignment, Next Steps & Resources */}
        <div className="space-y-6">
          
          {/* Actionable Next Steps */}
          {nextSteps.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-[#0F172A] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Compass size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Strategic Next Steps</h3>
                  <p className="text-xs text-slate-500 font-medium">Prioritized AI recommendations</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {nextSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-800">
                    <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Academic Coursework Alignment */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-[#0F172A] text-white flex items-center justify-center shrink-0 shadow-xs">
                <BookOpen size={16} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Coursework Alignment</h3>
                <p className="text-xs text-slate-500 font-medium">Curriculum match for {careerGoal.targetRole}</p>
              </div>
            </div>

            {academicAlignment.recommendedCourses?.length === 0 ? (
              <p className="text-xs text-slate-500 font-medium">Core department curriculum active.</p>
            ) : (
              <div className="space-y-2 mt-3">
                {academicAlignment.recommendedCourses.map((code, idx) => {
                  const match = academicAlignment.breakdown?.find(b => b.courseCode === code);
                  const status = match?.status || 'unfulfilled';

                  return (
                    <div key={idx} className="p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs bg-slate-50/50">
                      <div>
                        <span className="font-bold text-slate-900 block">{code}</span>
                        <span className="text-[10px] text-slate-500 capitalize">{status.replace('_', ' ')}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        status === 'in_progress' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        status === 'needs_improvement' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {status === 'completed' ? 'Completed' :
                         status === 'in_progress' ? 'In Progress' :
                         status === 'needs_improvement' ? 'Review Needed' : 'Not Taken'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Curated Course Materials */}
          {recommendedResources.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-[#0F172A] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Learning Materials</h3>
                  <p className="text-xs text-slate-500 font-medium">Handpicked resources</p>
                </div>
              </div>
              <div className="space-y-2.5 mt-3">
                {recommendedResources.map(res => (
                  <a
                    key={res.id}
                    href={res.resource_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl border border-slate-200/80 hover:border-[#2563EB] hover:shadow-xs transition-all flex items-center justify-between group block text-xs bg-slate-50/40 hover:bg-blue-50/20"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {res.resource_type}
                        </span>
                        <span className="text-[10px] font-bold text-[#2563EB]">
                          {res.course_code}
                        </span>
                      </div>
                      <h5 className="font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors leading-tight">
                        {res.title}
                      </h5>
                    </div>
                    <ExternalLink size={14} className="text-slate-400 group-hover:text-[#2563EB] shrink-0 ml-2" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Available Career Tracks Catalog Grid */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-0.5">Available Career Tracks</h3>
        <p className="text-xs text-slate-500 font-medium mb-4">University-aligned industry career tracks verified for Computer Science</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {careerPaths.map(path => {
            const isSelected = (careerGoal.careerPathId || careerData?.selected_goal?.career_path_id) === path.id;
            return (
              <div 
                key={path.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isSelected 
                    ? 'border-[#2563EB] bg-blue-50/40 shadow-xs ring-1 ring-[#2563EB]/20' 
                    : 'border-slate-200/80 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-slate-900">{path.name}</h4>
                    {isSelected && (
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-[#2563EB] border border-blue-200">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed font-medium">
                    {path.description}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedPathId(path.id);
                    setTargetRoleInput(path.name);
                    setShowGoalModal(true);
                  }}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-[#2563EB] text-white shadow-xs hover:bg-[#1D4ED8]'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{isSelected ? 'Current Goal' : 'Select Track'}</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Update Career Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200/80 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0F172A] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Target size={18} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Update Career Goal</h3>
                  <p className="text-xs text-slate-500 font-medium">Set target industry track</p>
                </div>
              </div>
              <button 
                onClick={() => setShowGoalModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Career Track
                </label>
                <select
                  value={selectedPathId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedPathId(id);
                    const found = careerPaths.find(p => p.id === parseInt(id, 10));
                    if (found) setTargetRoleInput(found.name);
                  }}
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-hidden transition-all"
                >
                  <option value="">-- Choose Track --</option>
                  {careerPaths.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Role Title
                </label>
                <input
                  type="text"
                  value={targetRoleInput}
                  onChange={(e) => setTargetRoleInput(e.target.value)}
                  placeholder="e.g. Senior Full Stack Engineer"
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-hidden transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Timeline
                </label>
                <select
                  value={targetTimelineInput}
                  onChange={(e) => setTargetTimelineInput(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-hidden transition-all"
                >
                  <option value="6 months">6 Months (Immediate)</option>
                  <option value="12 months">12 Months (Graduate Placement)</option>
                  <option value="18 months">18 Months (Postgraduate / Internship)</option>
                  <option value="24 months">24 Months (Long Term)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="w-1/2 py-2.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingGoal}
                  className="w-1/2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-2.5 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingGoal ? 'Saving...' : 'Save & Recalculate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
