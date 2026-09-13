import React, { useState } from 'react';
import {
  User,
  Phone,
  MapPin,
  Sprout,
  Anchor,
  Plane,
  ShieldAlert,
  FlaskConical,
  Building2,
  Check,
  X,
  LogOut,
} from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { useWeather } from '../../context/WeatherContext';
import { useUI, ActiveTab } from '../../context/UIContext';
import { useLocation } from '../../hooks/useLocation';
import { UserRole } from '../../types/user';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RoleItem {
  id: UserRole;
  title: string;
  roleName: string;
  targetTab: ActiveTab;
  icon: React.ComponentType<{ className?: string }>;
}

const ROLES: RoleItem[] = [
  {
    id: 'citizen',
    title: 'Citizen',
    roleName: 'Citizen',
    targetTab: 'home',
    icon: User,
  },
  {
    id: 'farmer',
    title: 'Farmer',
    roleName: 'Farmer',
    targetTab: 'home',
    icon: Sprout,
  },
  {
    id: 'fisherman',
    title: 'Fisherman',
    roleName: 'Fisher',
    targetTab: 'home',
    icon: Anchor,
  },
  {
    id: 'aviation',
    title: 'Aviation',
    roleName: 'Aviation',
    targetTab: 'home',
    icon: Plane,
  },
  {
    id: 'researcher',
    title: 'Researcher',
    roleName: 'Researcher',
    targetTab: 'home',
    icon: FlaskConical,
  },
  {
    id: 'disaster_manager',
    title: 'Disaster Manager',
    roleName: 'Disaster Manager',
    targetTab: 'alerts',
    icon: ShieldAlert,
  },
  {
    id: 'urban_planner',
    title: 'Urban Planner',
    roleName: 'Urban Planner',
    targetTab: 'home',
    icon: Building2,
  },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, profile, phoneNumber, handleSaveRole, updateProfile, signOut } = useAuthContext();
  const { activeRole, setActiveRole, userLocation } = useWeather();
  const { setActiveTab } = useUI();
  const { location, openSelector } = useLocation();
  const [switchingRole, setSwitchingRole] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentProfile = userProfile || profile;
  const username = currentProfile?.username?.trim() || 'User';
  const phone = currentProfile?.phone || phoneNumber || '';
  const currentRole = (currentProfile?.role || activeRole || 'citizen').toLowerCase();

  const userCity =
    location?.city ||
    currentProfile?.city ||
    userLocation?.city ||
    currentProfile?.district ||
    '';

  const userState = location?.state || currentProfile?.state || userLocation?.state || '';
  const locationText = [userCity, userState].filter(Boolean).join(', ') || 'India';

  const handleRoleClick = async (roleItem: RoleItem) => {
    try {
      setSwitchingRole(roleItem.id);

      await handleSaveRole(roleItem.id);
      await updateProfile({ role: roleItem.id });
      setActiveRole(roleItem.roleName as any);
      setActiveTab(roleItem.targetTab);

      setTimeout(() => {
        setSwitchingRole(null);
        onClose();
      }, 150);
    } catch (err) {
      console.error('Failed to switch role:', err);
      setSwitchingRole(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-14 sm:pt-16 bg-black/25 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[300px] bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* User Summary Header */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0">
                {username.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate">{username}</h3>
                {phone && <p className="text-xs text-slate-500">{phone}</p>}
                <p className="text-[11px] text-slate-400 truncate">{locationText}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Change Location Action Button */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0 text-xs text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate font-medium">{locationText}</span>
            </div>
            <button
              onClick={() => {
                onClose();
                openSelector();
              }}
              className="text-[11px] font-bold text-[#004aad] hover:text-sky-600 px-2 py-1 rounded-md hover:bg-sky-50 transition-colors cursor-pointer shrink-0 ml-1.5"
            >
              Change Location
            </button>
          </div>
        </div>

        {/* Dashboard Selection (Clean list, no heavy colored boxes) */}
        <div className="p-2">
          <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Switch Dashboard
          </div>

          <div className="space-y-0.5 mt-1">
            {ROLES.map((roleItem) => {
              const Icon = roleItem.icon;
              const isSelected = currentRole === roleItem.id;
              const isSwitching = switchingRole === roleItem.id;

              return (
                <button
                  key={roleItem.id}
                  onClick={() => handleRoleClick(roleItem)}
                  disabled={isSwitching}
                  className={`w-full px-2.5 py-2 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer text-xs ${
                    isSelected
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-slate-900' : 'text-slate-400'}`} />
                    <span>{roleItem.title}</span>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-slate-900 stroke-[2.5]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sign Out Footer */}
        <div className="p-2 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={() => {
              signOut();
              onClose();
            }}
            className="w-full px-2.5 py-2 rounded-xl text-left flex items-center gap-2 text-xs font-medium text-rose-600 hover:bg-rose-50/80 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
