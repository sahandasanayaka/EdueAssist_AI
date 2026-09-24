import { useState, useEffect } from 'react';
import { 
  PlayCircle, FileText, ExternalLink, Code, BookOpen, 
  Sparkles, Search, Layers, Download, CheckCircle2, ArrowRight
} from 'lucide-react';
import studentApi from '../services/studentApi';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('ALL'); // 'ALL' | 'pdf' | 'video' | 'code'

  const fetchResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentApi.getResources();
      setResources(res.data || []);
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError(err.message || 'Failed to retrieve course learning resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Curating academic tutorials & course reference materials..." />;
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <ErrorMessage 
          title="Could not load resources" 
          message={error} 
          onRetry={fetchResources} 
        />
      </div>
    );
  }

  const pdfCount = resources.filter(r => (r.resource_type || '').toLowerCase() === 'pdf').length;
  const videoCount = resources.filter(r => (r.resource_type || '').toLowerCase() === 'video').length;
  const codeCount = resources.filter(r => (r.resource_type || '').toLowerCase() === 'code').length;

  // Filtered resources
  const filteredResources = resources.filter(r => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (r.title || '').toLowerCase().includes(q);
      const matchTopic = (r.topic || '').toLowerCase().includes(q);
      const matchCode = (r.course_code || '').toLowerCase().includes(q);
      const matchDesc = (r.description || '').toLowerCase().includes(q);
      if (!matchTitle && !matchTopic && !matchCode && !matchDesc) return false;
    }

    if (activeType === 'ALL') return true;
    return (r.resource_type || '').toLowerCase() === activeType.toLowerCase();
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
              <span>Academic Knowledge Base</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#001E2B] tracking-tight leading-[1.12]">
              Explore curated course learning resources
            </h1>

            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-lg">
              EduAssist AI aggregates lecture slide decks, laboratory source codes, tutorial videos, and academic documentation mapped directly to your degree syllabus.
            </p>

            <div className="pt-1 flex items-center gap-4">
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-chat', { detail: { open: true } }))}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-black px-4 py-2 rounded-xl bg-[#00ED64] hover:bg-[#00d859] text-[#001E2B] shadow-xs transition-all cursor-pointer"
              >
                <Sparkles size={15} />
                <span>Ask AI Research Assistant</span>
              </button>
              
              <span className="text-xs font-bold text-[#00684A] bg-[#E6F8ED] px-3 py-1.5 rounded-xl border border-[#00ED64]/40 inline-flex items-center gap-1.5">
                <BookOpen size={15} />
                <span>Verified Faculty Syllabi</span>
              </span>
            </div>
          </div>

          {/* Right Column: MongoDB Compass Interactive Window Card */}
          <div className="w-full lg:w-1/2 max-w-xl">
            <div className="bg-white rounded-3xl border-2 border-[#00ED64] p-5 sm:p-6 shadow-xl relative transition-all">
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-black text-[#00684A] tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00ED64] animate-pulse"></span>
                  Compass Knowledge Index
                </h3>
                <span className="text-[11px] font-bold text-slate-400">
                  LMS Digital Library
                </span>
              </div>

              <div className="p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#E2E1D9] mb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#001E2B]">Coursework Library Status</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/30">
                    Live Sync
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  All course materials have been cross-checked with continuous assessment rubrics. Use these materials for assignment citations and exam revision.
                </p>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-slate-600 pt-1">
                <span className="flex items-center gap-1.5 text-[#00684A]">
                  <Layers size={14} />
                  <span>Total Repositories: {resources.length}</span>
                </span>
                <span className="text-[#001E2B]">
                  Access: Unrestricted
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. TOP 4 KPI CARDS (Identical to Compass Dashboard) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Assets */}
        <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Materials</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/30">
              Indexed
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-black text-[#001E2B]">{resources.length}</div>
            <span className="text-xs text-slate-400 font-medium">assets</span>
          </div>
        </div>

        {/* Card 2: Code Repositories */}
        <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Lab Code &amp; Repos</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#001E2B] bg-[#FAF9F5] border border-[#E2E1D9]">
              Hands-on
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-black text-[#001E2B]">{codeCount}</div>
            <span className="text-xs text-slate-400 font-medium">repositories</span>
          </div>
        </div>

        {/* Card 3: Video Tutorials */}
        <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Lecture Videos</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/30">
              Interactive
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-black text-[#00684A]">{videoCount}</div>
            <span className="text-xs text-slate-400 font-medium">tutorials</span>
          </div>
        </div>

        {/* Card 4: PDF Guides */}
        <div className="bg-white rounded-2xl border border-[#E2E1D9] hover:border-[#00ED64] p-4.5 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">PDF Slide Decks</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[#00684A] bg-[#E6F8ED] border border-[#00ED64]/30">
              Syllabus
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-black text-[#001E2B]">{pdfCount}</div>
            <span className="text-xs text-slate-400 font-medium">documents</span>
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
              { id: 'ALL', label: `All Materials (${resources.length})` },
              { id: 'pdf', label: `PDF Guides (${pdfCount})` },
              { id: 'video', label: `Video Lectures (${videoCount})` },
              { id: 'code', label: `Code & Repos (${codeCount})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveType(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeType === tab.id
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
              placeholder="Search topic or module code..."
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-[#FAF9F5] border border-[#E2E1D9] text-xs text-[#001E2B] placeholder-slate-400 focus:outline-none focus:border-[#00ED64] focus:ring-1 focus:ring-[#00ED64]"
            />
          </div>

        </div>

        {/* ============================================================ */}
        {/* 4. RESOURCE CARDS GRID (Cute & Compact rounded-2xl) */}
        {/* ============================================================ */}
        {filteredResources.length === 0 ? (
          <div className="p-8 text-center bg-[#FAF9F5] rounded-2xl border border-[#E2E1D9]">
            <BookOpen size={32} className="mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-bold text-[#001E2B]">No resources found</p>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery ? `No materials matching "${searchQuery}".` : 'No resources available in this category.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-1">
            {filteredResources.map((res) => {
              const type = (res.resource_type || 'pdf').toLowerCase();
              const isVideo = type === 'video';
              const isPdf = type === 'pdf';
              const isCode = type === 'code';

              return (
                <a 
                  key={res.id} 
                  href={res.resource_url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="bg-white border border-[#E2E1D9] hover:border-[#00ED64] rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Chips */}
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-[#E6F8ED] text-[#00684A] border border-[#00ED64]/40">
                        {res.course_code}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF9F5] text-slate-500 border border-[#E2E1D9] uppercase">
                        {type}
                      </span>
                    </div>

                    {/* Icon and Type Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-[#FAF9F5] border border-[#E2E1D9] text-[#00684A] group-hover:bg-[#E6F8ED] group-hover:border-[#00ED64]/40 transition-colors">
                        {isVideo ? (
                          <PlayCircle size={16} />
                        ) : isCode ? (
                          <Code size={16} />
                        ) : (
                          <FileText size={16} />
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 truncate">
                        {res.topic || 'Reference Material'}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-[#001E2B] text-sm mb-1 leading-snug group-hover:text-[#00684A] transition-colors line-clamp-1">
                      {res.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-[11px] text-slate-500 leading-normal line-clamp-2 mb-3 font-normal">
                      {res.description || `Learning reference materials for ${res.course_code}.`}
                    </p>
                  </div>

                  {/* Action Link Footer */}
                  <div className="pt-2.5 border-t border-[#E2E1D9] flex items-center justify-between text-xs font-semibold">
                    <span className="text-[11px] text-slate-400">Verified LMS</span>
                    <span className="text-[11px] text-[#00684A] font-bold flex items-center gap-1 group-hover:underline">
                      <span>Access Material</span>
                      <ExternalLink size={11} />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
