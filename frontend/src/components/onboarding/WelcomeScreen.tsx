import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { WeatherGptLogo } from '../common/WeatherGptLogo';

export const WelcomeScreen: React.FC = () => {
  const { goToStep } = useAuth();

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden font-['Arimo']">
      {/* Background Soft Glows (Primary Colors: #fcd444 & #38b6ff) */}
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-[#fcd444]/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#38b6ff]/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white sm:rounded-3xl sm:shadow-xl sm:border sm:border-slate-200/80 p-6 sm:p-8 flex flex-col justify-between min-h-[85vh] sm:min-h-[580px] relative z-10">
        
        {/* Main Branding Section */}
        <div className="text-center space-y-4 pt-6">
          {/* FRONT SCREEN LOGO IMAGE + "WeatherGPT" TEXT UNDERNEATH */}
          <div className="flex justify-center py-2">
            <WeatherGptLogo size="hero" showText={true} />
          </div>

          {/* Tagline */}
          <div className="space-y-1 pt-2">
            <p className="text-base sm:text-lg font-bold text-slate-800 leading-snug">"Your weather. Your language.</p>
            <p className="text-base sm:text-lg font-bold text-slate-800 leading-snug">Your decision."</p>
          </div>
        </div>

        {/* Bottom CTA Buttons with Primary Color Palette (#38b6ff & #004aad) */}
        <div className="space-y-3 pt-6">
          <button
            onClick={() => goToStep('PHONE')}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#38b6ff] to-[#004aad] hover:opacity-95 active:scale-[0.98] text-white font-extrabold text-base shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer font-['Arimo']"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => goToStep('PHONE')}
            className="w-full py-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-[#004aad] font-bold text-sm border border-slate-200 shadow-2xs transition-all cursor-pointer font-['Arimo']"
          >
            Sign In
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secured with Supabase Authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
};
