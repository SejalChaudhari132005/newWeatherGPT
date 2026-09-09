import React, { useState } from 'react';
import { ArrowLeft, Settings, Volume2, Bell, Shield, Sliders, Check, Globe } from 'lucide-react';
import { useLanguage, LanguageCode } from '../context/LanguageContext';
import { useAuthContext } from '../context/AuthContext';

interface Props {
  onBack: () => void;
}

export const SettingsPage: React.FC<Props> = ({ onBack }) => {
  const { language, setLanguage, supportedLanguages } = useLanguage();
  const { updateProfile } = useAuthContext();

  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
  const [windUnit, setWindUnit] = useState<'kmh' | 'mph' | 'ms'>('kmh');
  const [rainUnit, setRainUnit] = useState<'mm' | 'in'>('mm');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(language);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLanguage(selectedLanguage);
    await updateProfile({
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
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Settings</h2>
          <p className="text-xs text-slate-500 font-medium">Configure language, unit formats, voice assistant & notifications</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Language Selection Section */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-md space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#004aad]" /> Language / भाषा
          </h3>
          <p className="text-xs text-slate-500">Select your preferred Indian language for WeatherGPT chat, voice, and advisories</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
            {supportedLanguages.map((l) => {
              const isSelected = selectedLanguage === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setSelectedLanguage(l.code)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#004aad] bg-sky-50/70 ring-2 ring-[#004aad]/20 shadow-xs'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black text-slate-900">{l.name}</span>
                    <span
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-[#004aad] bg-[#004aad]' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-[#004aad] mt-1">{l.nativeName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Units Section */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-md space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#38b6ff]" /> Unit Preferences
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Temperature */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase block">Temperature</label>
              <div className="flex rounded-xl bg-slate-200 p-1">
                <button
                  type="button"
                  onClick={() => setTempUnit('C')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                    tempUnit === 'C' ? 'bg-[#004aad] text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  °C
                </button>
                <button
                  type="button"
                  onClick={() => setTempUnit('F')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                    tempUnit === 'F' ? 'bg-[#004aad] text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  °F
                </button>
              </div>
            </div>

            {/* Wind Speed */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase block">Wind Speed</label>
              <select
                value={windUnit}
                onChange={(e) => setWindUnit(e.target.value as any)}
                className="w-full py-2 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value="kmh">km/h</option>
                <option value="mph">mph</option>
                <option value="ms">m/s</option>
              </select>
            </div>

            {/* Rain */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase block">Rainfall</label>
              <select
                value={rainUnit}
                onChange={(e) => setRainUnit(e.target.value as any)}
                className="w-full py-2 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value="mm">mm</option>
                <option value="in">inches</option>
              </select>
            </div>
          </div>
        </div>

        {/* Voice & Audio Section */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-md space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#004aad]" /> Voice Input & Speech (BHASHINI)
          </h3>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-800">Voice Assistant Input</div>
              <div className="text-[10px] text-slate-500">Enable microphone speech input and TTS readout in Indian languages</div>
            </div>
            <input
              type="checkbox"
              checked={voiceEnabled}
              onChange={(e) => setVoiceEnabled(e.target.checked)}
              className="w-5 h-5 accent-[#004aad] cursor-pointer"
            />
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-md space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" /> Notifications & Alerts
          </h3>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-800">Severe Weather Alerts</div>
              <div className="text-[10px] text-slate-500">Push notifications for severe thunderstorms, floods & heatwaves</div>
            </div>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              className="w-5 h-5 accent-[#004aad] cursor-pointer"
            />
          </div>
        </div>

        {isSaved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Settings saved!</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#38b6ff] to-[#004aad] text-white font-extrabold text-base shadow-lg shadow-blue-900/20 transition-all cursor-pointer"
        >
          Save Settings
        </button>
      </form>
    </div>
  );
};
