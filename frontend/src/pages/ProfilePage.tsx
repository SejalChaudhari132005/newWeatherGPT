import React, { useState } from 'react';
import { ArrowLeft, User, Phone, MapPin, Briefcase, Globe, Check, Save } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import { useWeather } from '../context/WeatherContext';
import { useLanguage, LanguageCode } from '../context/LanguageContext';
import { ALL_ROLES } from '../types/role';

interface Props {
  onBack: () => void;
}

export const ProfilePage: React.FC<Props> = ({ onBack }) => {
  const { profile, updateProfile } = useAuthContext();
  const { userLocation } = useWeather();
  const { language: currentLang, setLanguage: setGlobalLanguage, supportedLanguages } = useLanguage();

  const [username, setUsername] = useState(profile?.username || '');
  const [role, setRole] = useState(profile?.role || 'citizen');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(
    (profile?.preferred_language as LanguageCode) || currentLang || 'en'
  );
  const [isSaved, setIsSaved] = useState(false);

  const locationDisplay = userLocation
    ? `${userLocation.city}, ${userLocation.state || userLocation.country}`
    : profile?.city
    ? `${profile.city}, ${profile.state || profile.country}`
    : 'Nashik, Maharashtra';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalLanguage(selectedLanguage);
    await updateProfile({
      username: username.trim(),
      role,
      preferred_language: selectedLanguage,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] p-4 sm:p-6 font-['Arimo'] max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2.5 rounded-2xl bg-white text-slate-700 border border-slate-200 shadow-2xs hover:bg-slate-50 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">User Profile</h2>
          <p className="text-xs text-slate-500 font-medium">Manage your personal details & weather assistance preferences</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-md space-y-6">
        {/* User Avatar & Title */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-200">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#004aad] to-[#38b6ff] text-white flex items-center justify-center font-black text-2xl shadow-lg">
            {username ? username.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">{profile?.username || 'WeatherGPT User'}</h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-100 text-[#004aad] text-xs font-black uppercase mt-1">
              <Briefcase className="w-3 h-3" /> {role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Username */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Username</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#38b6ff]"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Phone (Read Only) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Mobile Number (Supabase Verified)</label>
            <div className="relative">
              <input
                type="text"
                value={profile?.phone || '+91 98765 43210'}
                disabled
                className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-bold text-slate-500 cursor-not-allowed"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Location (Read Only / Change Location) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Saved Location Context</label>
            <div className="relative">
              <input
                type="text"
                value={`📍 ${locationDisplay}`}
                disabled
                className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 cursor-not-allowed"
              />
              <MapPin className="w-4 h-4 text-rose-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Assistance Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#38b6ff]"
            >
              {ALL_ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.icon} {r.title}
                </option>
              ))}
            </select>
          </div>

          {/* Preferred Language */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Preferred Language</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as any)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#38b6ff]"
            >
              {supportedLanguages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name} {l.nativeName !== l.name ? `(${l.nativeName})` : ''}
                </option>
              ))}
            </select>
          </div>

          {isSaved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#38b6ff] to-[#004aad] hover:opacity-95 text-white font-extrabold text-base shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            <Save className="w-5 h-5" />
            <span>Save Profile</span>
          </button>
        </form>
      </div>
    </div>
  );
};
