import React, { useState, useEffect, useRef } from 'react';
import { Search, Navigation, MapPin, X, Check, Loader2, AlertCircle, Globe } from 'lucide-react';
import { useLocation } from '../../hooks/useLocation';
import { locationService } from '../../services/locationService';
import { UserLocation } from '../../types/location';

const POPULAR_LOCATIONS: UserLocation[] = [
  { latitude: 18.5204, longitude: 73.8567, city: 'Pune', district: 'Pune', state: 'Maharashtra', country: 'India', source: 'manual' },
  { latitude: 19.0760, longitude: 72.8777, city: 'Mumbai', district: 'Mumbai', state: 'Maharashtra', country: 'India', source: 'manual' },
  { latitude: 25.5941, longitude: 85.1376, city: 'Patna', district: 'Patna', state: 'Bihar', country: 'India', source: 'manual' },
  { latitude: 28.6139, longitude: 77.2090, city: 'Delhi', district: 'Delhi', state: 'Delhi', country: 'India', source: 'manual' },
  { latitude: 12.9716, longitude: 77.5946, city: 'Bengaluru', district: 'Bengaluru', state: 'Karnataka', country: 'India', source: 'manual' },
  { latitude: 19.9975, longitude: 73.7898, city: 'Nashik', district: 'Nashik', state: 'Maharashtra', country: 'India', source: 'manual' },
  { latitude: 22.5726, longitude: 88.3639, city: 'Kolkata', district: 'Kolkata', state: 'West Bengal', country: 'India', source: 'manual' },
  { latitude: 13.0827, longitude: 80.2707, city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', country: 'India', source: 'manual' },
  { latitude: 9.9312, longitude: 76.2673, city: 'Kochi', district: 'Ernakulam', state: 'Kerala', country: 'India', source: 'manual' },
  { latitude: 23.0225, longitude: 72.5714, city: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat', country: 'India', source: 'manual' },
];

export const LocationSelectorModal: React.FC = () => {
  const { location, detectLocation, selectLocation, loading, statusMessage, error, isSelectorOpen, closeSelector } = useLocation();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on open
  useEffect(() => {
    if (isSelectorOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setSearchResults([]);
    }
  }, [isSelectorOpen]);

  // Debounced Search
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        const results = await locationService.searchLocations(trimmed);
        if (isMounted) {
          setSearchResults(results);
          setSearching(false);
        }
      } catch (e) {
        if (isMounted) {
          setSearching(false);
        }
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query]);

  if (!isSelectorOpen) return null;

  const handleGPSDetect = async () => {
    const res = await detectLocation();
    if (res) {
      closeSelector();
    }
  };

  const handleSelect = async (loc: UserLocation) => {
    await selectLocation(loc);
    closeSelector();
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0) {
        handleSelect(searchResults[0]);
      } else if (query.trim().length >= 2) {
        setSearching(true);
        const results = await locationService.searchLocations(query.trim());
        setSearchResults(results);
        setSearching(false);
        if (results.length > 0) {
          handleSelect(results[0]);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 font-['Arimo'] flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-[#004aad] to-[#38b6ff] text-white">
          <div>
            <h2 className="text-lg font-black tracking-tight">Set Your Location</h2>
            <p className="text-xs text-sky-100 font-medium mt-0.5">Search any city, state, district, or village</p>
          </div>
          <button
            type="button"
            onClick={closeSelector}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search any place (e.g. Bihar, Jalgaon, Kalyan, Tokyo)..."
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#38b6ff] focus:bg-white focus:outline-none text-sm text-slate-800 font-semibold placeholder:text-slate-400 transition-all shadow-inner"
            />
            {searching ? (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#38b6ff] animate-spin" />
            ) : query.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSearchResults([]);
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          {/* GPS Auto-Detect Button */}
          <button
            type="button"
            onClick={handleGPSDetect}
            disabled={loading}
            className="w-full p-4 rounded-2xl bg-sky-50 hover:bg-sky-100/80 border border-sky-200 text-[#004aad] flex items-center justify-between transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#38b6ff]/15 group-hover:bg-[#38b6ff]/25 text-[#004aad] transition-colors">
                <Navigation className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-black tracking-tight">Use Current Location</div>
                <div className="text-xs text-sky-700 font-semibold mt-0.5">{statusMessage}</div>
              </div>
            </div>
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#004aad]" />
            ) : (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#004aad] text-white">GPS</span>
            )}
          </button>

          {/* GPS Error Alert */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Search Mode or Popular List */}
          {query.trim().length >= 2 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  {searching ? 'Searching Worldwide...' : `Matching Places (${searchResults.length})`}
                </span>
                {searchResults.length > 0 && (
                  <span className="text-[10px] text-sky-600 font-semibold">Press Enter to select top</span>
                )}
              </div>

              {searching && searchResults.length === 0 ? (
                <div className="p-6 text-center text-slate-400 space-y-2 rounded-2xl border border-dashed border-slate-200">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#004aad]" />
                  <p className="text-xs font-semibold text-slate-600">Searching across India & global coordinates for "{query}"...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                  {searchResults.map((res, i) => {
                    const mainTitle = res.city || res.displayName?.split(',')[0] || res.state || 'Location';
                    const subTitle = [res.district && res.district !== res.city ? `${res.district} Dist.` : null, res.state, res.country]
                      .filter(Boolean)
                      .join(' • ');

                    return (
                      <button
                        key={`${res.latitude}-${res.longitude}-${i}`}
                        type="button"
                        onClick={() => handleSelect(res)}
                        className="w-full p-3 rounded-2xl border border-slate-100 hover:border-sky-300 hover:bg-sky-50/70 flex items-center justify-between text-left transition-all group cursor-pointer bg-white shadow-xs"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-[#004aad]/10 group-hover:text-[#004aad] text-slate-500 transition-colors shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-bold text-slate-900 group-hover:text-[#004aad] transition-colors truncate">
                              {mainTitle}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                              {subTitle || res.displayName}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md shrink-0 ml-2 border border-slate-100">
                          {res.latitude.toFixed(2)}, {res.longitude.toFixed(2)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <Globe className="w-6 h-6 mx-auto text-slate-400" />
                  <p className="text-xs font-bold text-slate-700">No exact match for "{query}"</p>
                  <p className="text-[11px] text-slate-500">Check spelling or search by district, state, or PIN code.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <div className="text-xs font-black uppercase text-slate-400 tracking-wider px-1">
                Popular Cities
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-0.5">
                {POPULAR_LOCATIONS.map((loc) => {
                  const isSelected = Boolean(location?.city && location.city.toLowerCase() === loc.city?.toLowerCase());
                  return (
                    <button
                      key={loc.city}
                      type="button"
                      onClick={() => handleSelect(loc)}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#004aad] border-[#004aad] text-white shadow-md'
                          : 'bg-white border-slate-100 hover:border-sky-200 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin className={`w-4 h-4 ${isSelected ? 'text-sky-200' : 'text-slate-400'}`} />
                        <div>
                          <span className="text-xs font-bold block">{loc.city}, {loc.state}</span>
                          <span className={`text-[10px] block ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                            {loc.district} District
                          </span>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
