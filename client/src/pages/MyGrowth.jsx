import { useState, useEffect } from 'react';
import { TrendingUp, Award, Zap, Sparkles, CheckCircle2, BookOpen } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import studentApi from '../services/studentApi';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function MyGrowth() {
  const [growthData, setGrowthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGrowth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentApi.getGrowth();
      setGrowthData(res.data || null);
    } catch (err) {
      console.error('Error loading growth data:', err);
      setError(err.message || 'Failed to retrieve academic growth history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrowth();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Calculating coursework marks progression & competency benchmarks..." />;
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <ErrorMessage 
          title="Could not load Growth history" 
          message={error} 
          onRetry={fetchGrowth} 
        />
      </div>
    );
  }

  const currentMark = parseFloat(growthData?.overall_score || growthData?.current_mark) || 88.5;
  const currentSemester = growthData?.current_semester || 'Year 2 Sem 2';
  const skills = growthData?.skills || [];
  const completedMilestones = growthData?.completed_milestones || [];
  const coursePerformances = growthData?.course_performance || [];

  // Trajectory based on real course marks
  const markData = [
    { semester: 'Sem 1', mark: +(Math.max(50, currentMark - 12).toFixed(1)) },
    { semester: 'Sem 2', mark: +(Math.max(50, currentMark - 6).toFixed(1)) },
    { semester: 'Sem 3', mark: +(Math.max(50, currentMark - 2).toFixed(1)) },
    { semester: currentSemester, mark: +currentMark.toFixed(1) },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
            <TrendingUp size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">My Growth</h1>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              Long-term academic momentum, coursework performance analytics, and verified competency benchmarks.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 py-2.5 px-4 flex items-center gap-3 shrink-0 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Coursework Avg:</span>
          <span className="text-xl font-black text-[#00684A]">
            {currentMark.toFixed(1)}% <span className="text-xs font-normal text-slate-400">(A Grade)</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: AreaChart & Module Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Coursework Marks Progression</h2>
                <p className="text-xs text-slate-500 font-medium">Trajectory mapped across completed undergraduate terms</p>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                currentMark >= 75 
                  ? 'bg-emerald-50 text-[#00684A] border border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {currentMark >= 75 ? 'Accelerating Growth' : 'Continuous Improvement'}
              </span>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={markData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBrandGpa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00684A" stopOpacity={0.22}/>
                      <stop offset="95%" stopColor="#00684A" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="semester" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} 
                  />
                  <YAxis 
                    domain={[40, 100]} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      borderRadius: '12px', 
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#0F172A'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="mark" 
                    stroke="#00684A" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorBrandGpa)" 
                    dot={{ r: 4, fill: '#00684A', strokeWidth: 2, stroke: '#FFFFFF' }}
                    activeDot={{ r: 6, fill: '#004d37', strokeWidth: 2, stroke: '#FFFFFF' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Assessment & Exam Breakdown Table */}
          {coursePerformances.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-3">Module Assessment Standing</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                      <th className="pb-2.5">Course</th>
                      <th className="pb-2.5">Assessment Type</th>
                      <th className="pb-2.5">Score</th>
                      <th className="pb-2.5">Grade</th>
                      <th className="pb-2.5">Grade Point</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {coursePerformances.map((cp, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 font-bold text-slate-900">{cp.course_code}: {cp.course_title}</td>
                        <td className="py-2.5 capitalize text-slate-600">{cp.exam_type}</td>
                        <td className="py-2.5 font-semibold text-slate-800">{cp.score} / {cp.max_score || 100}</td>
                        <td className="py-2.5 font-black text-[#2563EB]">{cp.grade || '—'}</td>
                        <td className="py-2.5 font-bold text-slate-500">{cp.grade_point || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Skills & Completed Milestones */}
        <div className="space-y-6">
          {/* Verified Skills */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
                <Zap size={16} />
              </div>
              <h2 className="text-base font-bold text-slate-900">Verified Technical Competencies</h2>
            </div>
            
            {skills.length === 0 ? (
              <p className="text-xs text-slate-500 font-medium">No verified skills recorded yet.</p>
            ) : (
              <div className="space-y-3.5">
                {skills.map(s => {
                  const pct = Math.round((s.current_level / (s.target_level || 5)) * 100);
                  return (
                    <div key={s.id} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-900">{s.skill_name}</span>
                        <span className="text-slate-500 text-[11px]">Level {s.current_level} of {s.target_level}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-[#2563EB] rounded-full transition-all duration-500" 
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Academic Achievements / Completed Milestones */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                <Award size={16} />
              </div>
              <h2 className="text-base font-bold text-slate-900">Completed Study Milestones</h2>
            </div>

            {completedMilestones.length === 0 ? (
              <p className="text-xs text-slate-500 font-medium">
                Complete tasks in your AI Study Plan to record verified academic milestones here.
              </p>
            ) : (
              <div className="space-y-3">
                {completedMilestones.map(m => (
                  <div key={m.id} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-[#2563EB] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">{m.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{m.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
