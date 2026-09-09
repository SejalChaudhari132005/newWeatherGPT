import React from 'react';
import { CloudSun, Wind, Activity, Bell, Sparkles, MessageSquare, Radar, MapPin, Sliders, AlertTriangle } from 'lucide-react';
import { useUI, ActiveTab } from '../../context/UIContext';
import { useWeather } from '../../context/WeatherContext';
import { useLanguage } from '../../context/LanguageContext';
import { translatePhrase } from '../../utils/dashboardTranslator';

export const MobileAppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeTab, setActiveTab } = useUI();
  const { userLocation } = useWeather();
  const { language } = useLanguage();
  const [unreadAlertCount, setUnreadAlertCount] = React.useState<number>(0);

  // Poll for active unread alerts count
  React.useEffect(() => {
    if (!userLocation?.latitude || !userLocation?.longitude) return;
    const checkAlerts = async () => {
      try {
        const { alertService } = await import('../../services/alertService');
        const res = await alertService.getCurrentAlerts(
          userLocation.latitude,
          userLocation.longitude,
          userLocation.city || undefined,
          userLocation.district || undefined,
          userLocation.state || undefined
        );
        const unread = (res.alerts || []).filter((a) => !a.is_read).length;
        setUnreadAlertCount(unread);
      } catch {
        // ignore
      }
    };
    checkAlerts();
    const timer = setInterval(checkAlerts, 60000);
    return () => clearInterval(timer);
  }, [userLocation?.latitude, userLocation?.longitude]);

  // Clear badge if on alerts tab
  React.useEffect(() => {
    if (activeTab === 'alerts') {
      setUnreadAlertCount(0);
    }
  }, [activeTab]);

  const navDockItems: { id: ActiveTab; label: string; icon: any }[] = [
    { id: 'home', label: translatePhrase('weather', language), icon: CloudSun },
    { id: 'advisories', label: translatePhrase('airQuality', language), icon: Activity },
    { id: 'ask', label: 'Ask GPT', icon: MessageSquare }, // Center Logo Button
    { id: 'alerts', label: translatePhrase('alerts', language), icon: AlertTriangle },
    { id: 'radar', label: translatePhrase('mapRadar', language), icon: Radar },
  ];

  return (
    <div className="min-h-screen w-full bg-[#F4F7FC] flex justify-center font-sans antialiased selection:bg-sky-500 selection:text-white">
      {/* Mobile Application Viewport (Full width on mobile/tablets, clean centered mobile column on desktop) */}
      <div className="w-full max-w-md min-h-screen bg-[#F4F7FC] shadow-xl relative flex flex-col justify-between overflow-x-hidden">

        {/* Top Status & Mobile Platform Header */}
        <div className="sticky top-0 z-40 bg-[#F4F7FC]/90 backdrop-blur-md px-4 pt-3 pb-2 flex items-center justify-between border-b border-slate-200/50 select-none">
          <div className="flex items-center gap-2">
            <img src="/assets/logo-icon.png" alt="WeatherGPT Icon" className="w-6 h-6 object-contain" />
            <span className="text-xs font-extrabold text-slate-900 tracking-tight">WeatherGPT</span>
            <span className="bg-sky-100 text-[#0F52BA] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">AI Platform</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{translatePhrase('liveAtmosphericSync', language)}</span>
          </div>
        </div>

        {/* Scrollable Main Mobile Content Body */}
        <div className="flex-1 overflow-y-auto relative pb-28">
          {children}
        </div>

        {/* Bottom Floating Curved Dock Navigation Bar */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-4 py-2 flex items-center justify-around shadow-2xl shrink-0">
          {navDockItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isCenterLogo = item.id === 'ask';

            if (isCenterLogo) {
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab('ask')}
                  className="-mt-7 p-2.5 bg-white rounded-full shadow-xl shadow-sky-500/30 border-4 border-sky-400/80 transition-transform active:scale-90 cursor-pointer flex items-center justify-center"
                  title="Ask WeatherGPT AI"
                >
                  <img src="/assets/logo-icon.png" alt="Ask WeatherGPT AI" className="w-8 h-8 object-contain animate-float" />
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center py-1 px-2.5 transition-all cursor-pointer relative ${
                  isActive ? 'text-sky-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-sky-600 stroke-[2.5]' : 'text-slate-400'}`} />
                  {item.id === 'alerts' && unreadAlertCount > 0 && (
                    <span className="absolute -top-1 -right-2 px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[8px] font-black animate-pulse shadow-xs">
                      {unreadAlertCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] capitalize tracking-tight font-bold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
