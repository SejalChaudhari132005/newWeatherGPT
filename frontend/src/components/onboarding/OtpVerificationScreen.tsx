import React, { useState } from 'react';
import { CheckCircle2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { OnboardingHeader } from '../common/OnboardingHeader';

export const OtpVerificationScreen: React.FC = () => {
  const {
    phoneNumber,
    verifyOtp,
    resendOtp,
    resendTimer,
    isSubmitting,
    errorMessage,
    otpSentMessage,
    goToStep
  } = useAuth();

  const [otpInput, setOtpInput] = useState('');

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otpInput.length < 6) return;
    await verifyOtp(otpInput);
  };

  const maskedPhone = phoneNumber.length >= 10
    ? `+91 ${phoneNumber.slice(-10, -5)} ${phoneNumber.slice(-5)}`
    : phoneNumber;

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex items-center justify-center p-4 sm:p-6 md:p-8 relative font-['Arimo']">
      <div className="w-full max-w-md bg-white sm:rounded-3xl sm:shadow-2xl sm:border sm:border-slate-200/80 p-6 sm:p-8 flex flex-col justify-between min-h-[85vh] sm:min-h-[520px] transition-all">
        {/* Top Header with WeatherGPT Logo */}
        <div>
          <OnboardingHeader onBack={() => goToStep('PHONE')} badge="OTP Verification" />

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Verify your number</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Enter the 6-digit code sent to <strong className="text-slate-800">{maskedPhone}</strong>
          </p>
        </div>

        {/* Main OTP Input Section */}
        <form onSubmit={handleVerify} className="my-auto space-y-5 text-center py-4">
          {otpSentMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{otpSentMessage}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">6-Digit Verification Code</label>
            <input
              type="text"
              inputMode="numeric"
              value={otpInput}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtpInput(val);
                if (val.length === 6) verifyOtp(val);
              }}
              placeholder="• • • • • •"
              className="w-full py-4 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-black text-slate-900 tracking-[0.4em] text-center focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-2xs transition-all"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-semibold">
            {resendTimer > 0 ? (
              <span className="text-slate-400">Resend code in {resendTimer}s</span>
            ) : (
              <button
                type="button"
                onClick={resendOtp}
                className="text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Resend OTP</span>
              </button>
            )}
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center justify-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100 text-[11px] text-sky-800 font-medium leading-relaxed">
            💡 Dev Testing Code: Enter <strong>123456</strong> to verify.
          </div>
        </form>

        {/* Bottom Verify Action */}
        <div>
          <button
            onClick={handleVerify}
            disabled={isSubmitting || otpInput.length < 6}
            className="w-full py-4 rounded-2xl bg-[#004aad] hover:bg-[#003882] disabled:bg-slate-300 active:scale-[0.98] text-white font-extrabold text-base shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer font-['Arimo']"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Verifying Code...</span>
              </>
            ) : (
              <span>Verify & Continue</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
