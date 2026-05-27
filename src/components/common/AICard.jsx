import React from 'react';
import { Sparkles } from 'lucide-react';

export default function AICard({ 
  children, 
  title = 'AI Guidance', 
  className = '',
  severity = 'success' // success (green), warning (amber), danger (red), neutral (brown)
}) {
  const severityColors = {
    success: 'border-l-4 border-l-organic-leaf bg-organic-lightGreen/10 border-slate-100',
    warning: 'border-l-4 border-l-alert-amber bg-alert-amber/5 border-slate-100',
    danger: 'border-l-4 border-l-alert-red bg-alert-red/5 border-slate-100',
    neutral: 'border-l-4 border-l-organic-brown bg-slate-50 border-slate-100',
  };

  return (
    <div className={`glass-card rounded-2xl p-6 relative overflow-hidden transition-all duration-300 ${severityColors[severity]} ${className}`}>
      
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-organic-leaf/5 rounded-full blur-2xl pointer-events-none" />

      {/* AI Insight Badge */}
      <div className="flex items-center justify-between border-b border-slate-100/60 pb-3.5 mb-4">
        <h3 className="font-extrabold text-sm text-slate-700 tracking-tight flex items-center gap-1.5 uppercase font-sans">
          <span className="p-1 rounded-md bg-organic-green/10 text-organic-green"><Sparkles className="w-3.5 h-3.5" /></span>
          {title}
        </h3>
        <span className="text-[10px] font-extrabold tracking-widest text-organic-green bg-organic-lightGreen/60 px-2 py-0.5 rounded-md uppercase font-mono">
          🤖 AI Insight
        </span>
      </div>

      {/* Content */}
      <div className="text-slate-600 text-sm leading-relaxed relative z-10 space-y-4">
        {children}
      </div>
    </div>
  );
}
