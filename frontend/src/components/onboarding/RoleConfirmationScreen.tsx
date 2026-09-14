import React from 'react';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { ROLE_CARDS } from './RoleSelectionScreen';
import { OnboardingHeader } from '../common/OnboardingHeader';

export const RoleConfirmationScreen: React.FC = () => {
  const { userProfile, setOnboardingStep } = useAuthContext();
  const selectedRole = userProfile?.role || 'citizen';
  const roleCard = ROLE_CARDS.find((r) => r.id === selectedRole) || ROLE_CARDS[0];

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex items-center justify-center p-4 sm:p-6 md:p-8 relative font-['Arimo']">
      <div className="w-full max-w-md bg-white sm:rounded-3xl sm:shadow-2xl sm:border sm:border-slate-200/80 p-6 sm:p-8 flex flex-col justify-between min-h-[85vh] sm:min-h-[520px] text-center transition-all">
        {/* Top Header with WeatherGPT Logo */}
        <div>
          <OnboardingHeader onBack={() => setOnboardingStep('ROLE')} badge="Role Confirmed" />

          <div className="space-y-3 pt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Role Preferences Saved</span>
            </div>

            <div className="my-4 inline-flex p-5 rounded-3xl bg-slate-50 border border-slate-200 shadow-md animate-bounce">
              {roleCard.icon}
            </div>

            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Great, {userProfile?.username || 'User'}!
            </h2>

            <p className="text-lg font-bold text-sky-700">
              We'll personalize WeatherGPT for your role as {roleCard.title}.
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs max-w-xs mx-auto my-3 text-left">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" /> Personalized Intelligence
              </div>
              <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                {roleCard.description}
              </p>
            </div>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setOnboardingStep('LOCATION')}
            className="w-full py-4 rounded-2xl bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white font-extrabold text-base shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Continue to Location Setup</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
