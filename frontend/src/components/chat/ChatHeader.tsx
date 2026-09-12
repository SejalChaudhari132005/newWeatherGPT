import React from 'react';
import { Menu, User } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { useLocation } from '../../hooks/useLocation';
import { useLanguage } from '../../context/LanguageContext';

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
  const { language } = useLanguage();

  const city = location?.city || profile?.city || (language === 'mr' ? 'स्थानिक परिसर' : language === 'hi' ? 'स्थानीय क्षेत्र' : 'Local Area');

  const liveText = language === 'mr' ? 'थेट हवामान' : language === 'hi' ? 'लाइव मौसम' : language === 'ta' ? 'நேரடி வானிலை' : language === 'te' ? 'ప్రత్యక్ష వాతావరణం' : 'Live Weather';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3.5 py-2 select-none font-['Arimo'] shrink-0 shadow-2xs">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        {/* LEFT: ☰ Menu Sidebar Toggle */}
        <button
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
          title="Open chat history"
          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* CENTER: WeatherGPT Logo + Title + Live Weather Indicator */}
        <div className="flex flex-col items-center justify-center leading-tight">
          <div className="flex items-center gap-1.5">
            <img src="/assets/logo-icon.png" alt="WeatherGPT" className="w-4 h-4 sm:w-5 sm:h-5 object-contain" />
            <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              WeatherGPT
            </h1>
          </div>

          <div className="flex items-center gap-1 text-[9.5px] font-extrabold text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{liveText}</span>
            <span className="text-slate-400 font-semibold">• {city}</span>
          </div>
        </div>

        {/* RIGHT: Profile Avatar */}
        <button
          onClick={onNavigateProfile}
          aria-label="Profile"
          title="Open user profile"
          className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#004aad] to-[#38b6ff] text-white flex items-center justify-center font-black text-xs shadow-2xs cursor-pointer hover:opacity-90 transition-opacity shrink-0"
        >
          {profile?.username ? profile.username.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
};


