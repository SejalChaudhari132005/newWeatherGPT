import React, { useState } from 'react';
import { User, ArrowRight, Sparkles } from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';
import { OnboardingHeader } from '../common/OnboardingHeader';

export const ProfileSetupScreen: React.FC = () => {
  const { profile, saveUsername, isSubmitting } = useProfile();
  const [nameInput, setNameInput] = useState(profile?.username || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    saveUsername(nameInput.trim());
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex items-center justify-center p-4 sm:p-6 md:p-8 relative font-['Arimo']">
      <div className="w-full max-w-md bg-white sm:rounded-3xl sm:shadow-2xl sm:border sm:border-slate-200/80 p-6 sm:p-8 flex flex-col justify-between min-h-[85vh] sm:min-h-[520px] transition-all">
        {/* Top Header with WeatherGPT Logo */}
        <div>
          <OnboardingHeader badge="Profile Setup" />

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold mb-3 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>Step 1 of 3 • Personalization</span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Tell us about yourself</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            WeatherGPT will address you by your name and personalize alerts for you.
          </p>
        </div>

        {/* Username Input Form */}
        <form onSubmit={handleSubmit} className="my-auto space-y-4 py-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Your Name / Username</label>

            <div className="relative">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter your name (e.g. Sejal)..."
                className="w-full pl-4 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-2xs transition-all"
                autoFocus
              />
              <User className="w-5 h-5 text-slate-400 absolute right-3.5 top-4" />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-medium">
            * Stored securely in your WeatherGPT profile.
          </p>
        </form>

        {/* Bottom Continue Action */}
        <div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !nameInput.trim()}
            className="w-full py-4 rounded-2xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 active:scale-[0.98] text-white font-extrabold text-base shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Continue to Role Selection</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
