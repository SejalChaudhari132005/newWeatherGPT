import React, { useState } from 'react';
import { Phone, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { OnboardingHeader } from '../common/OnboardingHeader';

export const PhoneAuthScreen: React.FC = () => {
  const { sendOtp, isSubmitting, errorMessage, goToStep } = useAuth();
  const [phoneInput, setPhoneInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    await sendOtp(phoneInput);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex items-center justify-center p-4 sm:p-6 md:p-8 relative font-['Arimo']">
      <div className="w-full max-w-md bg-white sm:rounded-3xl sm:shadow-2xl sm:border sm:border-slate-200/80 p-6 sm:p-8 flex flex-col justify-between min-h-[85vh] sm:min-h-[520px] transition-all">
        {/* Top Header with WeatherGPT Logo */}
        <div>
          <OnboardingHeader onBack={() => goToStep('WELCOME')} badge="Authentication" />

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Let's get started</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Enter your mobile number to sign in or create an account</p>
        </div>

        {/* Form Input */}
        <form onSubmit={handleSubmit} className="my-auto space-y-4 py-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Mobile Number</label>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3.5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 shadow-2xs shrink-0">
                <span>🇮🇳</span>
                <span>+91</span>
              </div>

              <div className="relative flex-1">
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98765 43210"
                  className="w-full pl-4 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-2xs transition-all"
                  autoFocus
                />
                <Phone className="w-5 h-5 text-slate-400 absolute right-3.5 top-4" />
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100 text-[11px] text-sky-800 font-medium leading-relaxed">
            💡 For testing in development mode, enter any 10-digit mobile number and click <strong>Continue</strong>.
          </div>
        </form>

        {/* Bottom Button */}
        <div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || phoneInput.length < 10}
            className="w-full py-4 rounded-2xl bg-[#004aad] hover:bg-[#003882] disabled:bg-slate-300 active:scale-[0.98] text-white font-extrabold text-base shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer font-['Arimo']"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Sending Code...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
