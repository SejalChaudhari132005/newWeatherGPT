import React, { useState, useEffect } from 'react';
import { Search, Navigation, Sparkles, AlertTriangle, X, Loader2, MapPin } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { locationService } from '../../services/locationService';
import { UserLocation } from '../../types/location';
import { OnboardingHeader } from '../common/OnboardingHeader';

export const LocationSetupScreen: React.FC = () => {
  const { handleSaveLocationGps, handleSaveLocationManual, setOnboardingStep } = useAuthContext();

  const [showManualSearch, setShowManualSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [liveResults, setLiveResults] = useState<UserLocation[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const q = searchQuery.trim();
    if (q.length >= 2) {
      setSearching(true);
      const timer = setTimeout(async () => {
        const results = await locationService.searchLocations(q);
        if (active) {
          setLiveResults(results);
          setSearching(false);
        }
      }, 300);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    } else {
      setLiveResults([]);
      setSearching(false);
    }
  }, [searchQuery]);

  const handleUseGps = async () => {
    setErrorMsg(null);
    setGpsLoading(true);

    try {
      const success = await handleSaveLocationGps();
      if (!success) {
        setErrorMsg('Unable to access your location.');
      }
    } catch (e: any) {
      console.warn('[LocationSetupScreen] GPS error:', e);
      setErrorMsg('Unable to access your location.');
    } finally {
      setGpsLoading(false);
    }
  };

  const handleSelectManualResult = async (loc: UserLocation) => {
    setShowManualSearch(false);
    await handleSaveLocationManual(loc);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex items-center justify-center p-4 sm:p-6 md:p-8 relative font-['Arimo']">
      <div className="w-full max-w-md bg-white sm:rounded-3xl sm:shadow-2xl sm:border sm:border-slate-200/80 p-6 sm:p-8 flex flex-col justify-between min-h-[85vh] sm:min-h-[520px] transition-all">
        {/* Top Header with WeatherGPT Logo */}
        <div>
          <OnboardingHeader onBack={() => setOnboardingStep('ROLE_CONFIRM')} badge="Step 3 of 3" />

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold mb-3 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>Set Your Location</span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Where are you located?</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Your location helps WeatherGPT provide accurate local weather and alerts.
          </p>
        </div>

        {/* Primary Actions */}
        <div className="my-auto space-y-3.5 py-4">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold space-y-2.5 animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{errorMsg}</div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowManualSearch(true)}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-extrabold text-xs shadow-xs cursor-pointer text-center"
                >
                  Select Location Manually
                </button>
              </div>
            </div>
          )}

          {/* Action 1: Use Current Location */}
          <button
            type="button"
            onClick={handleUseGps}
            disabled={gpsLoading}
            className="w-full p-5 rounded-3xl bg-gradient-to-r from-sky-500 via-[#005bb5] to-[#004aad] text-white shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all flex items-center justify-between text-left group cursor-pointer border border-sky-400/30"
          >
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-white/20 backdrop-blur-md group-hover:bg-white/30 transition-colors">
                <Navigation className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-base font-black tracking-tight">Use Current Location</div>
                <div className="text-xs text-sky-100 font-medium">Detect device GPS coordinates</div>
              </div>
            </div>
            {gpsLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-white shrink-0" />
            ) : (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md">GPS</span>
            )}
          </button>

          {/* Action 2: Select Location Manually */}
          <button
            type="button"
            onClick={() => setShowManualSearch(true)}
            disabled={gpsLoading}
            className="w-full p-5 rounded-3xl bg-slate-50 border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 text-slate-800 transition-all flex items-center justify-between text-left group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-slate-200/70 group-hover:bg-sky-100 group-hover:text-sky-600 transition-colors text-slate-600">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <div className="text-base font-black tracking-tight text-slate-900">Select Location Manually</div>
                <div className="text-xs text-slate-500 font-medium">Search city, town, village, or PIN code</div>
              </div>
            </div>
          </button>
        </div>

        {/* Manual Location Search Overlay */}
        {showManualSearch && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl p-5 border border-slate-100 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">Search Location</h3>
                  <p className="text-[11px] text-slate-500 font-medium">City, town, village, district, or PIN code</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualSearch(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search location (e.g. Kalyan, Pune, Nashik)..."
                  className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white shadow-inner"
                  autoFocus
                />
                {searching && (
                  <Loader2 className="w-4 h-4 absolute right-3.5 top-3.5 text-sky-500 animate-spin" />
                )}
              </div>

              <div className="overflow-y-auto space-y-1.5 flex-1 pr-1 max-h-64">
                {liveResults.length > 0 ? (
                  liveResults.map((loc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectManualResult(loc)}
                      className="w-full p-3 rounded-2xl hover:bg-sky-50/80 border border-slate-100 hover:border-sky-200 text-left transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-slate-400 group-hover:text-sky-600 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-slate-800 group-hover:text-sky-600">
                            {loc.city || loc.displayName}, {loc.state || loc.country}
                          </div>
                          <div className="text-[10px] text-slate-400">{loc.district || loc.formattedAddress}</div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : searchQuery.trim().length >= 2 && !searching ? (
                  <div className="p-4 text-center text-xs text-slate-400 font-medium">
                    No matching location found.
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400 font-medium">
                    Type a city, town, village, or PIN code to search.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-slate-400">
          Coordinates are stored securely and can be updated anytime from your profile settings.
        </div>
      </div>
    </div>
  );
};
