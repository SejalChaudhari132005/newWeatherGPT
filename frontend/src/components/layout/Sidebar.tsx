import React from 'react';
import {
  CloudSun,
  Home,
  MessageSquare,
  Activity,
  Radar,
  Bell,
  Sprout,
  Flame,
  Sliders,
  Map,
  Bookmark,
  MapPin,
  ChevronRight,
  LogOut,
  AlertTriangle
} from 'lucide-react';
import { useUI, ActiveTab } from '../../context/UIContext';
import { useWeather } from '../../context/WeatherContext';
import { useAuth } from '../../hooks/useAuth';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, setLocationModalOpen, emergencyMode, setEmergencyMode } = useUI();
  const { userLocation } = useWeather();
  const { signOut } = useAuth();

  const formattedCity = userLocation?.city || 'Select Location';

  const workspaceItems: { id: ActiveTab; label: string; icon: any; hasDot?: boolean }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'ask', label: 'Ask WeatherGPT', icon: MessageSquare },
    { id: 'live', label: 'Live Weather', icon: Activity },
    { id: 'radar', label: 'Radar', icon: Radar },
    { id: 'alerts', label: 'Alerts', icon: Bell, hasDot: true },
  ];

  const intelligenceItems: { id: ActiveTab; label: string; icon: any }[] = [
    { id: 'advisories', label: 'Advisories', icon: Sprout },
    { id: 'climate', label: 'Climate', icon: Flame },
    { id: 'whatif', label: 'What-If', icon: Sliders },
    { id: 'travel', label: 'Travel', icon: Map },
  ];

  return (
    <aside className="fixed top-0 left-0 bottom-0 z-40 bg-white border-r border-slate-200/80 w-64 flex-col justify-between hidden md:flex shadow-xs overflow-y-auto">
      <div className="p-5 space-y-6">
        {/* Top Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl text-white shadow-md shadow-sky-500/25">
            <CloudSun className="w-6 h-6 animate-float" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-slate-900 tracking-tight leading-none block">
              Weather<span className="text-sky-600">GPT</span>
            </span>
            <span className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase mt-0.5 block">
              WEATHER INTELLIGENCE
            </span>
          </div>
        </div>

        {/* Current Location Box */}
        <button
          onClick={() => setLocationModalOpen(true)}
          className="w-full p-3 rounded-2xl bg-sky-50/80 hover:bg-sky-100/80 border border-sky-200/60 text-left transition-all group cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-extrabold text-sky-600 uppercase tracking-wider block leading-none">
                CURRENT LOCATION
              </span>
              <span className="text-xs font-bold text-slate-800 block mt-0.5">
                Change location
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-sky-500 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Workspace Nav Section */}
        <div className="space-y-1">
          <div className="px-3 mb-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            WORKSPACE
          </div>
          {workspaceItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
                {item.hasDot && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Intelligence Nav Section */}
        <div className="space-y-1">
          <div className="px-3 mb-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            INTELLIGENCE
          </div>
          {intelligenceItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Emergency & Sign Out */}
      <div className="p-4 border-t border-slate-100 space-y-2">
        <button
          onClick={() => {
            setEmergencyMode(!emergencyMode);
            if (!emergencyMode) setActiveTab('emergency');
          }}
          className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
            emergencyMode
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/80'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Emergency Mode</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-200 text-rose-900 font-extrabold">SOS</span>
        </button>

        <button
          onClick={signOut}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 font-bold text-xs transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
