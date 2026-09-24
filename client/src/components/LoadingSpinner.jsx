import React from 'react';

export default function LoadingSpinner({ message = 'Loading live academic data...', minHeight = 'min-h-[360px]' }) {
  return (
    <div className={`p-8 flex flex-col items-center justify-center ${minHeight} text-[#2563EB] font-semibold gap-3`}>
      <div className="w-10 h-10 border-4 border-blue-100 border-t-[#2563EB] rounded-full animate-spin"></div>
      <p className="text-slate-500 text-xs sm:text-sm font-medium animate-pulse">
        {message}
      </p>
    </div>
  );
}
