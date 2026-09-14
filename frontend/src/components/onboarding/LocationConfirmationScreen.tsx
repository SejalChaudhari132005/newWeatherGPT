import React from 'react';
import { MapPin, Navigation, Check, Edit2, Sparkles } from 'lucide-react';
import { useLocation } from '../../hooks/useLocation';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { OnboardingHeader } from '../common/OnboardingHeader';

export const LocationConfirmationScreen: React.FC = () => {
  const { location, openSelector } = useLocation();
  const { confirmOnboarding, isSubmitting } = useProfile();
  const { goToStep } = useAuth();

  const primaryTitle = (location?.city && location.city !== 'India')
    ? location.city
    : ((location?.district && location.district !== 'India') ? location.district : (location?.state || 'Current Location'));

  const rawParts = [
    (location?.district && location.district !== primaryTitle && location.district !== 'India') ? location.district : null,
    (location?.state && location.state !== primaryTitle) ? location.state : null,
    location?.country || 'India'
  ].filter(Boolean) as string[];

  const subtitle = rawParts.filter((item, pos) => rawParts.indexOf(item) === pos).join(', ');
  const isGps = (location?.source || location?.location_source) === 'gps';

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex items-center justify-center p-4 sm:p-6 md:p-8 relative font-['Arimo']">
      <div className="w-full max-w-md bg-white sm:rounded-3xl sm:shadow-2xl sm:border sm:border-slate-200/80 p-6 sm:p-8 flex flex-col justify-between min-h-[85vh] sm:min-h-[520px] text-center transition-all">
        {/* Top Header with WeatherGPT Logo */}
        <div>
          <OnboardingHeader onBack={() => goToStep('LOCATION')} badge="Location Confirmation" />

          <div className="pt-2 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Location Confirmed</span>
            </div>

            <div className="my-4 inline-flex p-5 rounded-3xl bg-slate-50 border border-slate-200 shadow-md text-sky-600 animate-float">
              <MapPin className="w-14 h-14" />
            </div>

            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              📍 {primaryTitle}
            </h2>

            <p className="text-sm font-bold text-slate-500">
              {subtitle}
            </p>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600">
              <Navigation className="w-3.5 h-3.5 text-sky-600" />
              <span>{isGps ? 'Detected from current GPS / network location' : 'Selected manually'}</span>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100/80 text-xs font-semibold text-sky-900 max-w-xs mx-auto my-3">
              WeatherGPT will personalize weather intelligence for this exact location.
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={confirmOnboarding}
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white font-extrabold text-base shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>Confirm Location & Enter</span>
          </button>

          <button
            onClick={() => {
              openSelector();
              goToStep('LOCATION');
            }}
            className="w-full py-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm border border-slate-200/80 shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Edit2 className="w-4 h-4 text-slate-500" />
            <span>Change Location (Search Any Village/City)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
