import React from 'react';
import { Home, Sprout, Fish, Plane, Sparkles, ArrowRight } from 'lucide-react';
import { useUI, ActiveTab } from '../../context/UIContext';
import { useWeather } from '../../context/WeatherContext';
import { useAuthContext } from '../../context/AuthContext';

interface RoleDashboardSwitcherProps {
  currentDashboard: 'home' | 'live' | 'farmer' | 'fisher' | 'aviation';
  className?: string;
  variant?: 'banner' | 'pills' | 'cards';
  onNavigate?: (tab: ActiveTab) => void;
  showAllRoles?: boolean;
}

export const RoleDashboardSwitcher: React.FC<RoleDashboardSwitcherProps> = ({
  currentDashboard,
  className = '',
  variant = 'pills',
  onNavigate,
  showAllRoles = false,
}) => {
  const { setActiveTab } = useUI();
  const { activeRole, setActiveRole } = useWeather();
  const { profile, userProfile } = useAuthContext();

  const handleSelect = (tab: ActiveTab, roleName?: string) => {
    if (roleName) {
      setActiveRole(roleName);
    }
    if (onNavigate) {
      onNavigate(tab);
    } else {
      setActiveTab(tab);
    }
  };

  // Determine user's selected role
  const rawRole = (profile?.role || userProfile?.role || activeRole || 'citizen').toLowerCase().trim();

  // Define full catalog of role dashboards
  const allDashboards = [
    {
      id: 'home' as ActiveTab,
      roleKey: 'citizen',
      roleName: 'Citizen',
      label: 'Live Weather',
      shortLabel: '🏠 Live Weather',
      badge: 'Live',
      icon: Home,
      desc: 'Hyperlocal observations & IMD warnings',
      activeClass: 'bg-white text-[#004aad] border-slate-300 shadow-sm font-black',
      inactiveClass: 'bg-slate-100/90 text-slate-700 hover:bg-slate-200/80 border-transparent',
      accentColor: 'text-[#004aad]',
    },
    {
      id: 'farmer' as ActiveTab,
      roleKey: 'farmer',
      roleName: 'Farmer',
      label: '🌾 MY FARM',
      shortLabel: '🌾 My Farm',
      badge: 'Crop Intelligence',
      icon: Sprout,
      desc: 'Spraying windows, soil moisture & crop risks',
      activeClass: 'bg-emerald-600 text-white border-emerald-500 shadow-md font-black',
      inactiveClass: 'bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100 border-emerald-200/60',
      accentColor: 'text-emerald-600',
    },
    {
      id: 'fisher' as ActiveTab,
      roleKey: 'fisher',
      roleName: 'Fisher',
      label: '🎣 MY SEA',
      shortLabel: '🎣 My Sea',
      badge: 'Safe-to-Sail',
      icon: Fish,
      desc: 'Sailing clearance, tides & return cutoff',
      activeClass: 'bg-cyan-700 text-white border-cyan-600 shadow-md font-black',
      inactiveClass: 'bg-cyan-50/80 text-cyan-950 hover:bg-cyan-100 border-cyan-200/60',
      accentColor: 'text-cyan-700',
    },
    {
      id: 'aviation' as ActiveTab,
      roleKey: 'aviation',
      roleName: 'Aviation',
      label: '✈️ MY OPERATIONS',
      shortLabel: '✈️ Flight Ops',
      badge: 'Flight Briefing',
      icon: Plane,
      desc: 'Runway crosswinds, flight rules & METAR',
      activeClass: 'bg-indigo-600 text-white border-indigo-500 shadow-md font-black',
      inactiveClass: 'bg-indigo-50/80 text-indigo-950 hover:bg-indigo-100 border-indigo-200/60',
      accentColor: 'text-indigo-600',
    },
  ];

  // Filter dashboards strictly as per the user's role:
  // 1. Citizen -> Only Live Dashboard (no extra switches shown)
  // 2. Farmer  -> Live Weather + My Farm
  // 3. Fisher  -> Live Weather + My Sea
  // 4. Aviation-> Live Weather + My Operations
  let filteredDashboards = allDashboards;

  if (!showAllRoles) {
    if (rawRole === 'farmer') {
      filteredDashboards = allDashboards.filter((d) => d.id === 'home' || d.id === 'farmer');
    } else if (rawRole === 'fisher' || rawRole === 'fisherman') {
      filteredDashboards = allDashboards.filter((d) => d.id === 'home' || d.id === 'fisher');
    } else if (rawRole === 'aviation' || rawRole === 'pilot' || rawRole === 'dispatcher') {
      filteredDashboards = allDashboards.filter((d) => d.id === 'home' || d.id === 'aviation');
    } else {
      // Default / Citizen persona: Only live dashboard, no secondary switches
      filteredDashboards = allDashboards.filter((d) => d.id === 'home');
    }
  }

  // If there is only 1 dashboard (Citizen), hide the switcher strip entirely to keep the UI clean
  if (filteredDashboards.length <= 1 && !showAllRoles) {
    return null;
  }

  const isCurrent = (id: string) => {
    if ((currentDashboard === 'live' || currentDashboard === 'home') && id === 'home') return true;
    return currentDashboard === id;
  };

  if (variant === 'cards') {
    // For specialized roles, show a focused card to access their dedicated role dashboard
    const roleSpecificDashboard = filteredDashboards.find((d) => d.id !== 'home');
    if (!roleSpecificDashboard) return null;

    const Icon = roleSpecificDashboard.icon;
    const isRoleActive = isCurrent(roleSpecificDashboard.id);

    return (
      <div className={`p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-2xl ${roleSpecificDashboard.accentColor} bg-slate-50 border border-slate-100`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900">
                {roleSpecificDashboard.label} — Decision Workspace
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                {roleSpecificDashboard.desc}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleSelect(roleSpecificDashboard.id, roleSpecificDashboard.roleName)}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0 active:scale-95 ${
              isRoleActive
                ? 'bg-slate-900 text-white'
                : 'bg-gradient-to-r from-[#004aad] to-[#38b6ff] text-white hover:opacity-95'
            }`}
          >
            <span>{isRoleActive ? 'Viewing Dashboard' : 'Open Workspace'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      {/* 2-Tab Segmented Switcher Strip for the User's Persona */}
      <div className="p-1.5 rounded-2xl bg-slate-200/75 border border-slate-300/70 backdrop-blur-md flex items-center gap-2 overflow-x-auto no-scrollbar shadow-inner max-w-md mx-auto">
        {filteredDashboards.map((d) => {
          const Icon = d.icon;
          const active = isCurrent(d.id);
          return (
            <button
              key={d.id}
              onClick={() => handleSelect(d.id, d.roleName)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95 ${
                active ? `${d.activeClass} border` : `${d.inactiveClass}`
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="font-black truncate">{d.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
