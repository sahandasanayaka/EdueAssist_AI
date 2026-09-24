import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ 
  icon: Icon = Inbox, 
  title = 'No records found', 
  message = 'There are currently no items available in this category.',
  actionText,
  onAction
}) {
  return (
    <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-full bg-[#0F172A] text-white flex items-center justify-center mb-4 shadow-xs">
        <Icon size={24} />
      </div>
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-5 leading-relaxed font-medium">
        {message}
      </p>
      {actionText && onAction && (
        <button 
          onClick={onAction}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-2 px-4 rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
