import React from 'react';
import { MapPin, Search, Mic, Bell, User, Radio, Globe, ChevronDown, LogOut } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useLocationContext } from '../../context/LocationContext';
import { useAuthContext } from '../../context/AuthContext';
import { useLanguage, LANGUAGES, LanguageCode } from '../../context/LanguageContext';
import { DemoBadge } from '../common/DemoBadge';

export const Header: React.FC = () => {
  const { setLocationModalOpen, setVoiceModalOpen } = useUI();
  const { location } = useLocationContext();
  const { userProfile, handleSignOut } = useAuthContext();
  const { language, setLanguage } = useLanguage();

  const locationLabel = location?.source === 'manual' ? 'SELECTED LOCATION' : 'CURRENT LOCATION';
  
  const formattedLocation = location?.city
    ? `${location.city}${location.state ? `, ${location.state}` : ''}`
    : location?.latitude != null
    ? 'Location detected'
    : 'Select Location';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 md:ml-64 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Location Dropdown Pill */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLocationModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-sky-50 hover:bg-sky-100/80 border border-sky-200/80 text-sky-900 transition-all cursor-pointer group"
          >
            <div className="p-1 rounded-lg bg-sky-600 text-white">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <div className="text-[9px] text-sky-600 font-black uppercase tracking-wider leading-none">
                📍 {locationLabel}
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center gap-1">
                {formattedLocation}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:translate-y-0.5 transition-transform" />
              </div>
            </div>
          </button>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden lg:flex items-center flex-1 max-w-sm mx-2">
          <div
            onClick={() => setLocationModalOpen(true)}
            className="w-full relative flex items-center bg-slate-100/80 hover:bg-slate-100 border border-slate-200/80 rounded-2xl px-3.5 py-2 cursor-pointer transition-colors"
          >
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <span className="text-xs text-slate-400 font-medium">Search city, village or location...</span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <DemoBadge label="LIVE WEATHER" variant="sky" />
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60">
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Active Context</span>
            </div>
          </div>

          {/* Language Selector */}
          <div className="relative flex items-center">
            <Globe className="w-4 h-4 text-slate-400 absolute left-2 pointer-events-none" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              className="pl-7 pr-2 py-2 bg-slate-100/80 border border-slate-200 text-slate-700 text-xs rounded-xl font-bold focus:outline-none cursor-pointer"
            >
              {LANGUAGES.slice(0, 3).map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName}
                </option>
              ))}
            </select>
          </div>

          {/* Voice Microphone */}
          <button
            type="button"
            onClick={() => setVoiceModalOpen(true)}
            className="p-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20 transition-all cursor-pointer"
            title="Voice Assistant"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Notifications */}
          <button type="button" className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors relative cursor-pointer">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
          </button>

          {/* User Profile Info & Sign Out Button */}
          <div className="flex items-center gap-1">
            <div className="p-2 px-3 rounded-2xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5">
              <User className="w-4 h-4 text-sky-600" />
              <span className="capitalize text-slate-800">{userProfile?.username || userProfile?.role || 'User'}</span>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="p-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 transition-colors cursor-pointer"
              title="Sign Out / Onboarding"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
