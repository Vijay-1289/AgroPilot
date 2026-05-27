import React from 'react';

export default function StageHeader({ number, title, description }) {
  return (
    <div className="mb-8 border-b border-slate-100 pb-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-extrabold tracking-wider bg-organic-lightGreen text-organic-green px-2.5 py-1 rounded-full uppercase">
          Stage {number}
        </span>
        <span className="text-xs font-bold text-organic-brown uppercase tracking-wider">
          • Organic Protocol
        </span>
      </div>
      
      <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800 font-sans">
        {title}
      </h2>
      
      {description && (
        <p className="text-slate-500 text-sm mt-1 max-w-3xl leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
