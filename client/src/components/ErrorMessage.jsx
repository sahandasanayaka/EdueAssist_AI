import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorMessage({ 
  title = 'Failed to load data', 
  message = 'An unexpected error occurred while communicating with the university servers.', 
  onRetry 
}) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-full bg-rose-900 text-white flex items-center justify-center shrink-0 shadow-xs">
          <AlertCircle size={18} />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-medium">
            {message}
          </p>
        </div>
      </div>

      {onRetry && (
        <button 
          onClick={onRetry}
          className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs cursor-pointer"
        >
          <RefreshCw size={13} />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}
