import React from 'react';
import { Home, Sprout, Fish, Plane } from 'lucide-react';
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
  onNavigate,
  showAllRoles = false,
}) => {
  const { setActiveTab } = useUI();
  const { activeRole, setActiveRole } = useWeather();
  const { profile, userProfile } = useAuthContext();

  const handleSelect = (tab: ActiveTab, roleName?: string) => {
    if (roleName) {
      setActiveRole(roleName as any);
    }
    if (onNavigate) {
      onNavigate(tab);
    } else {
      setActiveTab(tab);
    }
  };

  const rawRole = (profile?.role || userProfile?.role || activeRole || 'citizen').toLowerCase().trim();

  const allDashboards = [
    {
      id: 'home' as ActiveTab,
      roleKey: 'citizen',
      roleName: 'Citizen',
      label: 'CITIZEN WEATHER',
      icon: Home,
    },
    {
      id: 'farmer' as ActiveTab,
      roleKey: 'farmer',
      roleName: 'Farmer',
      label: 'MY FARM ADVISORY',
      icon: Sprout,
    },
    {
      id: 'fisher' as ActiveTab,
      roleKey: 'fisher',
      roleName: 'Fisher',
      label: 'COASTAL & FISHERIES',
      icon: Fish,
    },
    {
      id: 'aviation' as ActiveTab,
      roleKey: 'aviation',
      roleName: 'Aviation',
      label: 'AVIATION & AIRPORTS',
      icon: Plane,
    },
  ];

  let filteredDashboards = allDashboards;

  if (!showAllRoles) {
    if (rawRole === 'farmer') {
      filteredDashboards = allDashboards.filter((d) => d.id === 'home' || d.id === 'farmer');
    } else if (rawRole === 'fisher' || rawRole === 'fisherman') {
      filteredDashboards = allDashboards.filter((d) => d.id === 'home' || d.id === 'fisher');
    } else if (rawRole === 'aviation' || rawRole === 'pilot' || rawRole === 'dispatcher') {
      filteredDashboards = allDashboards.filter((d) => d.id === 'home' || d.id === 'aviation');
    } else {
      filteredDashboards = allDashboards.filter((d) => d.id === 'home');
    }
  }

  if (filteredDashboards.length <= 1 && !showAllRoles) {
    return null;
  }

  const isCurrent = (id: string) => {
    if ((currentDashboard === 'live' || currentDashboard === 'home') && id === 'home') return true;
    return currentDashboard === id;
  };

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <div className="flex items-center gap-1 p-1 bg-white border border-[#D6DCE1] rounded-none overflow-x-auto no-scrollbar">
        {filteredDashboards.map((d) => {
          const Icon = d.icon;
          const active = isCurrent(d.id);
          return (
            <button
              key={d.id}
              onClick={() => handleSelect(d.id, d.roleName)}
              className={`flex-1 py-1.5 px-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 border ${
                active
                  ? 'bg-[#17365D] text-white border-[#17365D]'
                  : 'bg-white text-[#1F2933] border-transparent hover:bg-[#F5F7F9]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{d.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
