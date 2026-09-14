import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface OnboardingHeaderProps {
  onBack?: () => void;
  badge?: string;
}

export const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({ onBack, badge }) => {
  return (
    <div className="w-full mb-5">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <img
            src="/assets/logo-icon.png"
            alt="WeatherGPT Logo"
            className="w-8 h-8 object-contain drop-shadow-xs"
          />
          <div className="flex flex-col text-left leading-none">
            <span className="font-black text-slate-900 tracking-tight text-base font-['Arimo']">
              WeatherGPT
            </span>
            {badge && (
              <span className="text-[10px] font-bold text-sky-600 mt-0.5">
                {badge}
              </span>
            )}
          </div>
        </div>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Go Back"
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
