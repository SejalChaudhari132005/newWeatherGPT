import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  Loader2,
  Sparkles,
  SlidersHorizontal,
  ArrowUpDown,
  Search,
  Crosshair,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { locationService } from '../../services/locationService';
import { UserLocation } from '../../types/location';

interface Props {
  defaultOrigin?: string;
  defaultOriginCoords?: { lat: number; lon: number };
  onAnalyze: (params: {
    originName: string;
    originCoords: { lat: number; lon: number };
    destName: string;
    destCoords: { lat: number; lon: number };
    departureTime: string;
    travelDate: string;
  }) => void;
  onCompareTimes: (params: {
    originName: string;
    originCoords: { lat: number; lon: number };
    destName: string;
    destCoords: { lat: number; lon: number };
    travelDate: string;
  }) => void;
  loading?: boolean;
}

const POPULAR_DESTINATIONS = [
  { name: 'Pune, Maharashtra', lat: 18.5204, lon: 73.8567 },
  { name: 'Lonavala, Maharashtra', lat: 18.7557, lon: 73.4091 },
  { name: 'Nashik, Maharashtra', lat: 19.9975, lon: 73.7898 },
  { name: 'Jalgaon, Maharashtra', lat: 21.0101, lon: 75.5696 },
  { name: 'Nagpur, Maharashtra', lat: 21.1458, lon: 79.0882 },
  { name: 'Mumbai, Maharashtra', lat: 19.0760, lon: 72.8777 },
  { name: 'Shirdi, Maharashtra', lat: 19.7645, lon: 74.4762 },
  { name: 'Kolhapur, Maharashtra', lat: 16.7050, lon: 74.2433 },
  { name: 'Alibaug, Maharashtra', lat: 18.6414, lon: 72.8722 },
  { name: 'Mahabaleshwar, Maharashtra', lat: 17.9307, lon: 73.6477 },
  { name: 'Goa (Panaji)', lat: 15.4909, lon: 73.8278 },
  { name: 'Surat, Gujarat', lat: 21.1702, lon: 72.8311 },
];

export const RoutePlanningCard: React.FC<Props> = ({
  defaultOrigin = 'Kalyan-Dombivli',
  defaultOriginCoords = { lat: 19.2437, lon: 73.1355 },
  onAnalyze,
  onCompareTimes,
  loading = false,
}) => {
  const { language } = useLanguage();
  const [originName, setOriginName] = useState(defaultOrigin);
  const [originCoords, setOriginCoords] = useState(defaultOriginCoords);
  const [destName, setDestName] = useState('Pune, Maharashtra');
  const [destCoords, setDestCoords] = useState({ lat: 18.5204, lon: 73.8567 });
  const [travelDate, setTravelDate] = useState(new Date().toISOString().split('T')[0]);
  const [departureTime, setDepartureTime] = useState('08:00');

  // Autocomplete state
  const [originSearchOpen, setOriginSearchOpen] = useState(false);
  const [destSearchOpen, setDestSearchOpen] = useState(false);
  const [originResults, setOriginResults] = useState<UserLocation[]>([]);
  const [destResults, setDestResults] = useState<UserLocation[]>([]);
  const [searchingOrigin, setSearchingOrigin] = useState(false);
  const [searchingDest, setSearchingDest] = useState(false);

  const originRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);

  // Sync default origin coords when parent updates
  useEffect(() => {
    if (defaultOrigin) setOriginName(defaultOrigin);
    if (defaultOriginCoords) setOriginCoords(defaultOriginCoords);
  }, [defaultOrigin, defaultOriginCoords.lat, defaultOriginCoords.lon]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (originRef.current && !originRef.current.contains(e.target as Node)) {
        setOriginSearchOpen(false);
      }
      if (destRef.current && !destRef.current.contains(e.target as Node)) {
        setDestSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for Origin
  useEffect(() => {
    const q = originName.trim();
    if (q.length < 2) {
      setOriginResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingOrigin(true);
      try {
        const res = await locationService.searchLocations(q);
        setOriginResults(res);
      } catch (err) {
        console.warn('Origin search error:', err);
      } finally {
        setSearchingOrigin(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [originName]);

  // Debounced search for Destination
  useEffect(() => {
    const q = destName.trim();
    if (q.length < 2) {
      setDestResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingDest(true);
      try {
        const res = await locationService.searchLocations(q);
        setDestResults(res);
      } catch (err) {
        console.warn('Dest search error:', err);
      } finally {
        setSearchingDest(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [destName]);

  const labels = {
    title: language === 'mr' ? 'हवामान-सजग मार्ग नियोजन' : language === 'hi' ? 'मौसम-जागरूक यात्रा योजना' : 'Weather-Aware Route Intelligence',
    subtitle: language === 'mr' ? 'प्रवासाच्या संपूर्ण मार्गावरील IMD चेतावणी व हवामान जोखीम तपासा' : language === 'hi' ? 'पूरे मार्ग में IMD चेतावनी और मौसम जोखिम का विश्लेषण करें' : 'Analyze live IMD warnings & weather risks along entire highway corridor',
    from: language === 'mr' ? 'प्रस्थान स्थान' : language === 'hi' ? 'प्रस्थान' : 'From (Origin)',
    to: language === 'mr' ? 'गंतव्य स्थान' : language === 'hi' ? 'गंतव्य' : 'To (Destination)',
    date: language === 'mr' ? 'तारीख' : language === 'hi' ? 'दिनांक' : 'Date',
    time: language === 'mr' ? 'प्रस्थान वेळ' : language === 'hi' ? 'प्रस्थान समय' : 'Departure Time',
    analyzeBtn: language === 'mr' ? 'मार्ग हवामान तपासा' : language === 'hi' ? 'मार्ग मौसम विश्लेषण' : 'Analyze Route Weather',
    compareBtn: language === 'mr' ? 'वेळांची तुलना करा' : language === 'hi' ? 'समय की तुलना करें' : 'Compare Departure Times',
    myLocation: language === 'mr' ? 'माझे स्थान' : language === 'hi' ? 'मेरा स्थान' : 'My GPS',
    popular: language === 'mr' ? 'लोकप्रिय गंतव्ये' : language === 'hi' ? 'लोकप्रिय गंतव्य' : 'Popular Destinations',
    searching: language === 'mr' ? 'शोधत आहे...' : language === 'hi' ? 'खोज रहे हैं...' : 'Searching...',
    noResults: language === 'mr' ? 'स्थान आढळले नाही' : language === 'hi' ? 'कोई स्थान नहीं मिला' : 'No locations found',
  };

  const handleSelectOrigin = (loc: { name: string; lat: number; lon: number }) => {
    setOriginName(loc.name);
    setOriginCoords({ lat: loc.lat, lon: loc.lon });
    setOriginSearchOpen(false);
  };

  const handleSelectDest = (loc: { name: string; lat: number; lon: number }) => {
    setDestName(loc.name);
    setDestCoords({ lat: loc.lat, lon: loc.lon });
    setDestSearchOpen(false);
  };

  const handleSwap = () => {
    const tempName = originName;
    const tempCoords = originCoords;
    setOriginName(destName);
    setOriginCoords(destCoords);
    setDestName(tempName);
    setDestCoords(tempCoords);
  };

  const handleResetToGps = () => {
    setOriginName(defaultOrigin);
    setOriginCoords(defaultOriginCoords);
    setOriginSearchOpen(false);
  };

  // Ensure coordinates are resolved before submitting
  const resolveCoordinatesAndSubmit = async (isCompare = false) => {
    let finalOrigin = { ...originCoords };
    let finalDest = { ...destCoords };

    // If destination name was typed without clicking a suggestion, geocode it
    if (destName.trim() && (destResults.length > 0 || destName !== 'Pune, Maharashtra')) {
      if (destResults.length > 0) {
        finalDest = { lat: destResults[0].latitude, lon: destResults[0].longitude };
      } else {
        try {
          const res = await locationService.searchLocations(destName.trim());
          if (res.length > 0) {
            finalDest = { lat: res[0].latitude, lon: res[0].longitude };
          }
        } catch (e) {
          console.warn('Auto-geocoding dest failed:', e);
        }
      }
    }

    // If origin name was typed without clicking suggestion, geocode it
    if (originName.trim() && originName !== defaultOrigin) {
      if (originResults.length > 0) {
        finalOrigin = { lat: originResults[0].latitude, lon: originResults[0].longitude };
      } else {
        try {
          const res = await locationService.searchLocations(originName.trim());
          if (res.length > 0) {
            finalOrigin = { lat: res[0].latitude, lon: res[0].longitude };
          }
        } catch (e) {
          console.warn('Auto-geocoding origin failed:', e);
        }
      }
    }

    setOriginCoords(finalOrigin);
    setDestCoords(finalDest);

    if (isCompare) {
      onCompareTimes({
        originName,
        originCoords: finalOrigin,
        destName,
        destCoords: finalDest,
        travelDate,
      });
    } else {
      onAnalyze({
        originName,
        originCoords: finalOrigin,
        destName,
        destCoords: finalDest,
        departureTime,
        travelDate,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resolveCoordinatesAndSubmit(false);
  };

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-md font-['Arimo'] space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#004aad] to-[#38b6ff] text-white shadow-md">
          <Navigation className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
            {labels.title}
          </h3>
          <p className="text-[11px] text-slate-500 font-semibold">{labels.subtitle}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Origin & Destination Inputs with Swap */}
        <div className="space-y-2 relative">
          {/* Origin Search */}
          <div ref={originRef} className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                {labels.from}
              </label>
              <button
                type="button"
                onClick={handleResetToGps}
                className="text-[10px] font-extrabold text-[#004aad] flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Crosshair className="w-3 h-3" />
                <span>{labels.myLocation}</span>
              </button>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus-within:bg-white focus-within:border-[#004aad] shadow-2xs transition-all">
              <MapPin className="w-4 h-4 text-[#004aad] shrink-0" />
              <input
                type="text"
                value={originName}
                onFocus={() => setOriginSearchOpen(true)}
                onChange={(e) => {
                  setOriginName(e.target.value);
                  setOriginSearchOpen(true);
                }}
                className="w-full bg-transparent outline-none text-xs font-bold text-slate-800"
                placeholder="Search any start city (e.g. Kalyan, Mumbai, Delhi)..."
              />
              {searchingOrigin && <Loader2 className="w-3.5 h-3.5 text-[#004aad] animate-spin shrink-0" />}
            </div>

            {/* Origin Autocomplete Dropdown */}
            {originSearchOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-40 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-56 overflow-y-auto animate-in fade-in duration-150">
                {originResults.length > 0 ? (
                  <div className="p-1.5 space-y-1">
                    {originResults.map((loc, idx) => {
                      const displayName = loc.displayName || `${loc.city || loc.district || 'Location'}, ${loc.state || ''} ${loc.country || 'India'}`;
                      return (
                        <button
                          key={`orig-${idx}`}
                          type="button"
                          onClick={() =>
                            handleSelectOrigin({
                              name: displayName,
                              lat: loc.latitude,
                              lon: loc.longitude,
                            })
                          }
                          className="w-full text-left px-3 py-2 text-xs font-bold text-slate-800 hover:bg-blue-50 hover:text-[#004aad] rounded-xl transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{displayName}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0 font-semibold">Select</span>
                        </button>
                      );
                    })}
                  </div>
                ) : originName.trim().length >= 2 ? (
                  <div className="p-3 text-center text-xs text-slate-400 font-bold">
                    {searchingOrigin ? labels.searching : labels.noResults}
                  </div>
                ) : (
                  <div className="p-1.5 space-y-1">
                    <div className="px-3 py-1 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                      {labels.popular}
                    </div>
                    {POPULAR_DESTINATIONS.slice(0, 5).map((d) => (
                      <button
                        key={`orig-pop-${d.name}`}
                        type="button"
                        onClick={() => handleSelectOrigin(d)}
                        className="w-full text-left px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-[#004aad] rounded-xl transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span>📍 {d.name}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">Select</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Swap Button (Floating between inputs) */}
          <div className="flex justify-end pr-3 -my-2.5 relative z-10 pointer-events-auto">
            <button
              type="button"
              onClick={handleSwap}
              className="w-7 h-7 rounded-full bg-white border border-slate-200 shadow-sm text-slate-600 hover:text-[#004aad] hover:border-[#004aad] flex items-center justify-center cursor-pointer transition-all active:rotate-180"
              title="Swap Origin & Destination"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Destination Search */}
          <div ref={destRef} className="relative">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1 block">
              {labels.to}
            </label>
            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white border border-blue-200 shadow-2xs text-xs font-bold text-slate-900 focus-within:border-[#004aad] focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <Navigation className="w-4 h-4 text-emerald-600 shrink-0 rotate-90" />
              <input
                type="text"
                value={destName}
                onFocus={() => setDestSearchOpen(true)}
                onChange={(e) => {
                  setDestName(e.target.value);
                  setDestSearchOpen(true);
                }}
                className="w-full bg-transparent outline-none text-xs font-extrabold text-slate-900 placeholder:text-slate-400"
                placeholder="Type ANY destination city (e.g. Jalgaon, Shirdi, Nagpur, Goa)..."
              />
              {searchingDest && <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin shrink-0" />}
            </div>

            {/* Destination Autocomplete Dropdown */}
            {destSearchOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-40 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-56 overflow-y-auto animate-in fade-in duration-150">
                {destResults.length > 0 ? (
                  <div className="p-1.5 space-y-1">
                    {destResults.map((loc, idx) => {
                      const displayName = loc.displayName || `${loc.city || loc.district || 'Location'}, ${loc.state || ''} ${loc.country || 'India'}`;
                      return (
                        <button
                          key={`dest-${idx}`}
                          type="button"
                          onClick={() =>
                            handleSelectDest({
                              name: displayName,
                              lat: loc.latitude,
                              lon: loc.longitude,
                            })
                          }
                          className="w-full text-left px-3 py-2 text-xs font-bold text-slate-800 hover:bg-blue-50 hover:text-[#004aad] rounded-xl transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{displayName}</span>
                          </div>
                          <span className="text-[10px] text-emerald-600 font-bold shrink-0">Select</span>
                        </button>
                      );
                    })}
                  </div>
                ) : destName.trim().length >= 2 ? (
                  <div className="p-3 text-center text-xs text-slate-400 font-bold">
                    {searchingDest ? labels.searching : labels.noResults}
                  </div>
                ) : (
                  <div className="p-1.5 space-y-1">
                    <div className="px-3 py-1 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                      {labels.popular}
                    </div>
                    {POPULAR_DESTINATIONS.map((d) => (
                      <button
                        key={`dest-pop-${d.name}`}
                        type="button"
                        onClick={() => handleSelectDest(d)}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-[#004aad] rounded-xl transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span>📍 {d.name}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">Select</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Date & Departure Time */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1 block">
              {labels.date}
            </label>
            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
              <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="w-full bg-transparent outline-none text-xs font-bold text-slate-800 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1 block">
              {labels.time}
            </label>
            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
              <Clock className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full bg-transparent outline-none text-xs font-bold text-slate-800 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="py-3 px-4 rounded-2xl bg-gradient-to-r from-[#004aad] to-[#38b6ff] hover:opacity-95 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{labels.analyzeBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => resolveCoordinatesAndSubmit(true)}
            className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#004aad]" />
            <span>{labels.compareBtn}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

