import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  Clock, AlertCircle, CheckCircle2, ListFilter, ArrowRight
} from 'lucide-react';

export default function MiniCalendar({ assignments = [] }) {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'priorities'

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Map assignments to dates
  const assignmentDatesMap = {};
  assignments.forEach((a) => {
    if (a.due_date) {
      const d = new Date(a.due_date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!assignmentDatesMap[key]) assignmentDatesMap[key] = [];
      assignmentDatesMap[key].push(a);
    }
  });

  const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const isSelected = (day) => {
    return selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
  };

  const selectedKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`;
  const selectedDayAssignments = assignmentDatesMap[selectedKey] || [];

  // Next upcoming deadline across all assignments
  const upcomingAssignments = assignments
    .filter(a => a.submission_status !== 'submitted' && a.submission_status !== 'graded')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Widget Header with View Switcher */}
        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-[#E2E1D9]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E6F8ED] text-[#00684A] flex items-center justify-center font-bold">
              <CalendarIcon size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#001E2B] tracking-tight">Academic Schedule</h3>
              <p className="text-[11px] text-slate-500 font-medium">Calendar &amp; due dates</p>
            </div>
          </div>

          {/* Toggle between Calendar and Priority List */}
          <div className="flex items-center p-0.5 bg-[#FAF9F5] rounded-xl border border-[#E2E1D9]">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-white text-[#001E2B] shadow-xs border border-[#E2E1D9] font-extrabold'
                  : 'text-slate-500 hover:text-[#001E2B]'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode('priorities')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'priorities'
                  ? 'bg-white text-[#001E2B] shadow-xs border border-[#E2E1D9] font-extrabold'
                  : 'text-slate-500 hover:text-[#001E2B]'
              }`}
            >
              List
            </button>
          </div>
        </div>

        {viewMode === 'calendar' ? (
          <div>
            {/* Month & Year Navigation */}
            <div className="flex items-center justify-between mb-3 px-1">
              <h4 className="text-sm font-extrabold text-[#001E2B] tracking-tight">
                {monthNames[month]} <span className="text-[#00684A] font-bold">{year}</span>
              </h4>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1 rounded-lg hover:bg-[#FAF9F5] text-slate-500 hover:text-[#001E2B] transition-colors cursor-pointer"
                  title="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1 rounded-lg hover:bg-[#FAF9F5] text-slate-500 hover:text-[#001E2B] transition-colors cursor-pointer"
                  title="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {daysOfWeek.map((day) => (
                <span key={day} className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-1">
                  {day}
                </span>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center mb-3.5">
              {/* Empty prefix slots */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="h-7 w-full"></div>
              ))}

              {/* Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const key = `${year}-${month}-${day}`;
                const hasDeadline = Boolean(assignmentDatesMap[key]);
                const isCurrentDay = isToday(day);
                const isCurrentSelected = isSelected(day);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDate(new Date(year, month, day))}
                    className={`h-7 w-full rounded-lg text-xs font-semibold flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                      isCurrentDay
                        ? 'bg-[#00684A] text-white font-extrabold shadow-xs'
                        : isCurrentSelected
                        ? 'bg-[#E6F8ED] text-[#00684A] font-bold ring-1 ring-[#00ED64]'
                        : 'text-slate-700 hover:bg-[#FAF9F5]'
                    }`}
                  >
                    <span>{day}</span>
                    {hasDeadline && !isCurrentDay && (
                      <span className="w-1 h-1 rounded-full bg-[#00ED64] absolute bottom-0.5"></span>
                    )}
                    {hasDeadline && isCurrentDay && (
                      <span className="w-1 h-1 rounded-full bg-white absolute bottom-0.5"></span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Date Context or Next Deadline Card */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              {selectedDayAssignments.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 flex items-center gap-1">
                      <Clock size={12} />
                      <span>Due on {selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                      {selectedDayAssignments.length} Deadline{selectedDayAssignments.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  {selectedDayAssignments.map((a, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 mt-1">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          <span className="text-[#2563EB]">{a.course_code}:</span> {a.title}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate('/assignments')}
                        className="text-[11px] font-bold text-[#00684A] hover:underline shrink-0 cursor-pointer"
                      >
                        Submit &rarr;
                      </button>
                    </div>
                  ))}
                </div>
              ) : upcomingAssignments.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Clock size={12} className="text-[#00684A]" />
                      <span>Next Upcoming Deadline</span>
                    </span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                      {upcomingAssignments[0].time_remaining_label || 'Upcoming'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      <span className="text-[#00684A]">{upcomingAssignments[0].course_code}:</span> {upcomingAssignments[0].title}
                    </p>
                    <button
                      onClick={() => navigate('/assignments')}
                      className="text-[11px] font-bold text-[#00684A] hover:underline shrink-0 cursor-pointer"
                    >
                      View &rarr;
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>No deadlines recorded for this period.</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Priority List View */
          <div className="space-y-2 mb-2">
            {upcomingAssignments.slice(0, 3).map((a, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-800">
                      {a.course_code}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      Due {new Date(a.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 truncate">{a.title}</p>
                </div>
                <button
                  onClick={() => navigate('/assignments')}
                  className="px-2 py-1 rounded-lg bg-[#00684A] hover:bg-[#02523a] text-white text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
                >
                  Submit
                </button>
              </div>
            ))}
            {upcomingAssignments.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-400 font-medium">
                All assignments are completed!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer link to full coursework assignments page */}
      <div className="pt-3 border-t border-slate-100 mt-3">
        <button
          onClick={() => navigate('/assignments')}
          className="w-full text-center text-xs font-bold text-[#00684A] hover:text-[#02523a] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
        >
          <span>Open Full Coursework Board</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
