import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 w-fit shadow-2xs font-['Arimo'] animate-fadeIn">
      <img src="/assets/logo-icon.png" alt="WeatherGPT" className="w-5 h-5 object-contain animate-bounce" />
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-slate-500">WeatherGPT is thinking...</span>
        <div className="flex gap-1 items-center pl-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#38b6ff] animate-ping"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#004aad] animate-pulse"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#fcd444] animate-ping"></span>
        </div>
      </div>
    </div>
  );
};
