import React from 'react';
import {
  CloudSun,
  Anchor,
  Activity,
  MessageSquare,
  Radar,
  AlertTriangle,
  Sprout,
  User,
  ChevronDown,
  Menu,
  CalendarCheck,
  Bell,
  Waves,
  Plane,
  Navigation,
  FlaskConical,
  Layers,
} from 'lucide-react';
import { useUI, ActiveTab } from '../../context/UIContext';
import { useWeather } from '../../context/WeatherContext';
import { useAuthContext } from '../../context/AuthContext';
import { useLanguage, LANGUAGES, LanguageCode } from '../../context/LanguageContext';
import { translatePhrase } from '../../utils/dashboardTranslator';
import { ProfileModal } from '../profile/ProfileModal';
import { useRealtimeWeather } from '../../hooks/useRealtimeWeather';
import { RealtimeStatusIndicator } from '../realtime/RealtimeStatusIndicator';
import { LiveEventNotification } from '../realtime/LiveEventNotification';
import { RealtimeDemoControlModal } from '../realtime/RealtimeDemoControlModal';

interface MobileAppShellProps {
  children: React.ReactNode;
  onOpenSidebar?: () => void;
}

export const MobileAppShell: React.FC<MobileAppShellProps> = ({ children, onOpenSidebar }) => {
  const { activeTab, setActiveTab } = useUI();
  const { userLocation, activeRole } = useWeather();
  const { profile } = useAuthContext();
  const { language, setLanguage } = useLanguage();
  const [unreadAlertCount, setUnreadAlertCount] = React.useState<number>(0);
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState<boolean>(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = React.useState<boolean>(false);

  const roleKey = (activeRole || profile?.role || 'citizen').toLowerCase().trim();
  const isFarmer = roleKey === 'farmer';
  const isFisher = roleKey === 'fisher' || roleKey === 'fisherman';
  const isAviation = roleKey.includes('aviation') || roleKey === 'pilot' || roleKey === 'dispatcher';
  const isResearcher = roleKey === 'researcher';

  // Real-time WebSocket hook
  const { status: realtimeStatus, latestEvent } = useRealtimeWeather({
    role: roleKey,
    autoConnect: true,
  });

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
    {
      id: 'advisories',
      label: isResearcher
        ? 'WeatherLab'
        : isAviation
        ? (language === 'mr' ? 'उड्डाण सल्लागार' : language === 'hi' ? 'उड़ान सलाहकार' : 'Flight Advisory')
        : isFisher
        ? (translatePhrase('sailingAdvisory', language) || 'Sailing Advisory')
        : isFarmer
        ? translatePhrase('myFarm', language)
        : translatePhrase('airQuality', language),
      icon: isResearcher ? FlaskConical : isAviation ? Plane : isFisher ? Anchor : isFarmer ? Sprout : Activity,
    },
    { id: 'ask', label: 'WeatherGPT', icon: MessageSquare },
    { id: 'alerts', label: translatePhrase('alerts', language), icon: AlertTriangle },
    {
      id: 'radar',
      label: isResearcher
        ? 'Research Map'
        : isAviation
        ? 'SkyRoute'
        : isFisher
        ? 'FishFinder'
        : isFarmer
        ? translatePhrase('planMyDay', language)
        : translatePhrase('mapRadar', language),
      icon: isResearcher ? Layers : isAviation ? Navigation : isFisher ? Waves : isFarmer ? CalendarCheck : Radar,
    },
  ];

  return (
    <div className="min-h-screen w-full flex justify-center bg-[#F0F3F6] font-['Noto_Sans',sans-serif] antialiased selection:bg-[#006B3C] selection:text-white">
      {/* Mobile Application Frame */}
      <div className="w-full max-w-md min-h-screen bg-[#F5F7F9] shadow-md relative flex flex-col justify-between overflow-x-hidden border-x border-[#D6DCE1]">
        
        {/* Portal Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-[#D6DCE1] select-none">
          {/* Main Portal Header Bar */}
          <div className="px-3 py-2 flex items-center justify-between bg-white">
            {/* Left: Branding & Portal Name */}
            <div className="flex items-center gap-2 min-w-0">
              {(activeTab === 'ask' || activeTab === 'chat') && onOpenSidebar && (
                <button
                  type="button"
                  onClick={onOpenSidebar}
                  aria-label="Open chat history"
                  className="p-1 rounded bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#17365D] border border-[#CBD5E1] transition-colors cursor-pointer shrink-0"
                >
                  <Menu className="w-4 h-4" />
                </button>
              )}

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xs bg-[#006B3C] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                  IN
                </div>
                <div className="flex flex-col leading-tight min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-[#17365D] tracking-tight">WeatherGPT</span>
                    <span className="text-[9px] font-bold bg-[#E2E8F0] text-[#17365D] px-1 rounded-xs uppercase">
                      Portal
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-[#5B6770] truncate">
                    {isResearcher
                      ? 'National Atmospheric Research & Climatology Center'
                      : isAviation
                      ? 'IMD / DGCA Aviation Meteorological Service'
                      : isFisher
                      ? 'National Coastal & Marine Weather Service'
                      : isFarmer
                      ? 'National Agro-Meteorological System'
                      : 'National Weather Intelligence Service'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Realtime Status & Language Selector & Profile */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Realtime Status Indicator Badge */}
              <RealtimeStatusIndicator
                status={realtimeStatus}
                onClick={() => setIsDemoModalOpen(true)}
                showLabel={false}
                className="py-1 px-1.5"
              />

              {/* Language Selector */}
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                  className="appearance-none bg-[#F8FAFC] border border-[#D6DCE1] text-[#17365D] text-[11px] font-bold py-1 pl-2 pr-5 rounded-xs hover:border-[#17365D] focus:outline-none transition-colors cursor-pointer"
                  title="Select Language"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="font-semibold text-slate-800">
                      {lang.nativeName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#5B6770]" />
              </div>

              {/* Profile / Role Button */}
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="p-1.5 rounded-xs bg-[#17365D] text-white hover:bg-[#0F233D] transition-colors cursor-pointer border border-[#17365D]"
                title="User Profile & Settings"
              >
                <User className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* User Profile & Role Switcher Modal */}
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />

        {/* Real-time Ingestion Demo Control & Monitor Modal */}
        <RealtimeDemoControlModal
          isOpen={isDemoModalOpen}
          onClose={() => setIsDemoModalOpen(false)}
          status={realtimeStatus}
        />

        {/* Real-time In-App Push Notification Banner */}
        <LiveEventNotification
          event={latestEvent}
          onViewAlert={(ev) => {
            setActiveTab('alerts');
          }}
        />

        {/* Scrollable Main Content Body */}
        <main
          className={`flex-1 relative ${
            activeTab === 'ask' || activeTab === 'chat'
              ? 'flex flex-col overflow-hidden h-[calc(100dvh-75px)] pb-0'
              : 'overflow-y-auto pb-28'
          }`}
        >
          {children}
        </main>

        {/* Official Government Bottom Navigation Bar (Rectangular, 0px radius, top indicator) */}
        <nav
          aria-label="Portal Navigation"
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-white border-t border-[#D6DCE1] shadow-lg grid grid-cols-5 shrink-0"
        >
          {navDockItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isAlertTab = item.id === 'alerts';

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center py-2 px-1 transition-colors cursor-pointer border-r border-[#E2E8F0] last:border-r-0 ${
                  isActive
                    ? isFarmer
                      ? 'bg-[#F0FDF4] text-[#006B3C] font-black'
                      : 'bg-[#F1F5F9] text-[#17365D] font-black'
                    : 'bg-white text-[#5B6770] hover:bg-[#F8FAFC] font-bold'
                }`}
              >
                {/* Active Top Border Indicator */}
                {isActive && (
                  <div
                    className={`absolute top-0 left-0 right-0 h-[3px] ${
                      isAlertTab ? 'bg-[#B42318]' : isFarmer ? 'bg-[#006B3C]' : isFisher ? 'bg-[#17365D]' : 'bg-[#17365D]'
                    }`}
                  />
                )}

                <div className="relative mb-0.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? isAlertTab
                          ? 'text-[#B42318]'
                          : isFarmer
                          ? 'text-[#006B3C]'
                          : 'text-[#17365D]'
                        : 'text-[#5B6770]'
                    }`}
                  />
                  {isAlertTab && unreadAlertCount > 0 && (
                    <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-[#B42318] text-white rounded-xs text-[8px] font-black">
                      {unreadAlertCount}
                    </span>
                  )}
                </div>

                <span className="text-[10px] tracking-tight truncate w-full text-center">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
