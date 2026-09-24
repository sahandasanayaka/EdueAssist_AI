import { useState } from 'react';
import { 
  Settings as SettingsIcon, Bell, Moon, Smartphone, Sparkles, 
  Shield, CheckCircle2, RefreshCw, Zap, Sliders, Volume2, Database, ArrowRight
} from 'lucide-react';

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [aiProactiveHints, setAiProactiveHints] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);
  const [cacheClearing, setCacheClearing] = useState(false);
  const [saveBanner, setSaveBanner] = useState(null);

  const handleSavePreferences = () => {
    setSaveBanner("System preferences and AI copilot settings have been synced successfully.");
    setTimeout(() => setSaveBanner(null), 4000);
  };

  const handleClearCache = () => {
    setCacheClearing(true);
    setTimeout(() => {
      setCacheClearing(false);
      setSaveBanner("Local LMS coursework cache flushed and synchronized with server.");
      setTimeout(() => setSaveBanner(null), 4000);
    }, 800);
  };

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
              <span>System &amp; Intelligence Preferences</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#001E2B] tracking-tight leading-[1.12]">
              Configure system parameters and AI coach settings
            </h1>

            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-lg">
              EduAssist AI adapts notification delivery channels, study pacing algorithms, visual interfaces, and cache synchronization rules to fit your academic routine.
            </p>

            <div className="pt-1 flex items-center gap-4">
              <button 
                onClick={handleSavePreferences}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-black px-4 py-2 rounded-xl bg-[#00ED64] hover:bg-[#00d859] text-[#001E2B] shadow-xs transition-all cursor-pointer"
              >
                <CheckCircle2 size={15} />
                <span>Save All Preferences</span>
              </button>
              
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-chat', { detail: { open: true } }))}
                className="text-xs sm:text-sm font-bold text-[#001E2B] hover:text-[#00684A] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Test AI Coach Response</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Right Column: MongoDB Compass Interactive Window Card */}
          <div className="w-full lg:w-1/2 max-w-xl">
            <div className="bg-white rounded-3xl border-2 border-[#00ED64] p-5 sm:p-6 shadow-xl relative transition-all">
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-black text-[#00684A] tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00ED64] animate-pulse"></span>
                  Compass Engine Configuration
                </h3>
                <span className="text-[11px] font-bold text-slate-400">
                  Build v2.4.0
                </span>
              </div>

              <div className="p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#E2E1D9] mb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#001E2B]">Inference &amp; Pacing Status</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/30">
                    Optimal Health
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Low-latency Gemini 3.6 Flash connection active. Push delivery is operational for upcoming continuous assessments.
                </p>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-slate-600 pt-1">
                <span className="flex items-center gap-1.5 text-[#00684A]">
                  <Zap size={14} />
                  <span>Latency: ~340ms Grounded</span>
                </span>
                <span className="text-[#001E2B]">
                  Telemetry: Active
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* In-app Notification Banner */}
      {saveBanner && (
        <div className="p-4 rounded-2xl bg-[#E6F8ED] border border-[#00ED64] flex items-center gap-3 text-[#00684A] text-xs font-bold animate-in fade-in duration-200">
          <CheckCircle2 size={18} className="text-[#00684A] shrink-0" />
          <span>{saveBanner}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. TOP 4 KPI METRIC CARDS (Identical to Compass Dashboard) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: System Status */}
        <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">System Health</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/30">
              99.9% Up
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-black text-[#001E2B]">Normal</div>
            <span className="text-xs text-slate-400 font-medium">status</span>
          </div>
        </div>

        {/* Card 2: AI Latency */}
        <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Inference Latency</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/30">
              Gemini 3.6
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-black text-[#00684A]">~340ms</div>
            <span className="text-xs text-slate-400 font-medium">speed</span>
          </div>
        </div>

        {/* Card 3: Alert Channels */}
        <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Alert Channels</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#001E2B] bg-[#FAF9F5] border border-[#E2E1D9]">
              Multi-channel
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-black text-[#001E2B]">{notifications ? (smsAlerts ? '2 Active' : '1 Active') : (smsAlerts ? '1 Active' : 'Muted')}</div>
            <span className="text-xs text-slate-400 font-medium">channels</span>
          </div>
        </div>

        {/* Card 4: Data Sync */}
        <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Data Caching</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/30">
              In-Memory
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-black text-[#001E2B]">Synced</div>
            <span className="text-xs text-slate-400 font-medium">real-time</span>
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* 3. SETTINGS TOGGLE MODULES CONTAINER (Compass Styled) */}
      {/* ============================================================ */}
      <div className="bg-white border border-[#E2E1D9] rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
        
        {/* Toggle 1: Coursework Push Alerts */}
        <div className="flex items-center justify-between border-b border-[#E2E1D9] pb-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#FAF9F5] border border-[#E2E1D9] text-[#00684A] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#001E2B]">Push Coursework Alerts</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-normal max-w-xl">
                Receive instant AI notices when assignment cutoffs, graded marks, or daily study milestones approach.
              </p>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={() => setNotifications(!notifications)}
            className={`w-12 h-6.5 rounded-full transition-colors relative focus:outline-none p-0.5 cursor-pointer shrink-0 ${
              notifications ? 'bg-[#00ED64]' : 'bg-slate-200'
            }`}
          >
            <span className={`block w-5.5 h-5.5 rounded-full bg-white shadow-xs transition-transform ${
              notifications ? 'translate-x-5.5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Toggle 2: SMS Reminders */}
        <div className="flex items-center justify-between border-b border-[#E2E1D9] pb-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#FAF9F5] border border-[#E2E1D9] text-[#00684A] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <Smartphone size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#001E2B]">Critical Academic SMS Alerts</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-normal max-w-xl">
                Dispatches urgent SMS notifications if continuous assessment marks or assignment submission deadlines require immediate attention.
              </p>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={() => setSmsAlerts(!smsAlerts)}
            className={`w-12 h-6.5 rounded-full transition-colors relative focus:outline-none p-0.5 cursor-pointer shrink-0 ${
              smsAlerts ? 'bg-[#00ED64]' : 'bg-slate-200'
            }`}
          >
            <span className={`block w-5.5 h-5.5 rounded-full bg-white shadow-xs transition-transform ${
              smsAlerts ? 'translate-x-5.5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Toggle 3: AI Proactive Study Hints */}
        <div className="flex items-center justify-between border-b border-[#E2E1D9] pb-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#FAF9F5] border border-[#E2E1D9] text-[#00684A] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#001E2B]">Proactive AI Copilot Recommendations</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-normal max-w-xl">
                Allow EduAssist AI to suggest revision tips and past exam papers based on your continuous assessment weaknesses.
              </p>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={() => setAiProactiveHints(!aiProactiveHints)}
            className={`w-12 h-6.5 rounded-full transition-colors relative focus:outline-none p-0.5 cursor-pointer shrink-0 ${
              aiProactiveHints ? 'bg-[#00ED64]' : 'bg-slate-200'
            }`}
          >
            <span className={`block w-5.5 h-5.5 rounded-full bg-white shadow-xs transition-transform ${
              aiProactiveHints ? 'translate-x-5.5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Action Item: Cache & Data Sync */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#FAF9F5] border border-[#E2E1D9] text-[#00684A] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <Database size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#001E2B]">Coursework Data Cache Management</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-normal max-w-xl">
                Clear locally cached assignment submissions and force a full re-synchronization with university database servers.
              </p>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={handleClearCache}
            disabled={cacheClearing}
            className="px-4 py-2 bg-white hover:bg-[#FAF9F5] text-[#001E2B] border border-[#E2E1D9] hover:border-[#00ED64] text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={13} className={cacheClearing ? 'animate-spin text-[#00684A]' : ''} />
            <span>{cacheClearing ? 'Flushing...' : 'Clear Cache'}</span>
          </button>
        </div>

      </div>

    </div>
  );
}
