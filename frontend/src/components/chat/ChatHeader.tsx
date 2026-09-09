import React from 'react';
import { Menu, User, Sparkles } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { useLocation } from '../../hooks/useLocation';

interface Props {
  onOpenSidebar: () => void;
  onNavigateProfile: () => void;
  onNavigateLocation?: () => void;
  onNavigateDashboard?: () => void;
}

export const ChatHeader: React.FC<Props> = ({
  onOpenSidebar,
  onNavigateProfile,
}) => {
  const { profile } = useAuthContext();
  const { location } = useLocation();

  const city = location?.city || profile?.city || 'Local Area';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 select-none font-['Arimo']">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        {/* LEFT: ☰ Menu Sidebar Toggle */}
        <button
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
          title="Open chat history"
          className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* CENTER: WeatherGPT Logo + Title + Live Weather Indicator */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-1.5">
            <img src="/assets/logo-icon.png" alt="WeatherGPT" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              WeatherGPT
            </h1>
          </div>

          <div className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Weather</span>
            <span className="text-slate-400 font-medium">• {city}</span>
          </div>
        </div>

        {/* RIGHT: Profile Avatar */}
        <button
          onClick={onNavigateProfile}
          aria-label="Profile"
          title="Open user profile"
          className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#004aad] to-[#38b6ff] text-white flex items-center justify-center font-black text-xs shadow-sm cursor-pointer hover:opacity-90 transition-opacity shrink-0"
        >
          {profile?.username ? profile.username.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};

