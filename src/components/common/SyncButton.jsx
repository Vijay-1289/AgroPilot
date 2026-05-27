import React from 'react';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';

export default function SyncButton({ 
  onClick, 
  disabled = false, 
  loading = false, 
  label = 'Sync & Proceed',
  icon: Icon = ArrowRight,
  className = ''
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn-organic-primary w-full sm:w-auto py-3.5 px-8 font-bold text-sm tracking-wide shadow-md flex items-center justify-center gap-2.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-white" />
          <span>Synchronizing Farm Plan...</span>
        </>
      ) : (
        <>
          <span>{label}</span>
          <Icon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </>
      )}
    </button>
  );
}
