import React, { useState } from 'react';
import { Sparkles, ArrowRight, Check, User, Sprout, Anchor, ShieldAlert, Building2, Search, Plane } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { UserRole } from '../../types/user';

interface RoleCard {
  id: UserRole;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export const ROLE_CARDS: RoleCard[] = [
  {
    id: 'citizen',
    title: 'Citizen',
    description: 'Daily weather, travel and safety information.',
    icon: <User className="w-5 h-5 text-sky-600" />,
  },
  {
    id: 'farmer',
    title: 'Farmer',
    description: 'Crop, rainfall and field-weather guidance.',
    icon: <Sprout className="w-5 h-5 text-emerald-600" />,
  },
  {
    id: 'fisherman',
    title: 'Fisherman',
    description: 'Marine weather, wind, waves and fishing safety.',
    icon: <Anchor className="w-5 h-5 text-cyan-600" />,
  },
  {
    id: 'disaster_manager',
    title: 'Disaster Manager',
    description: 'Warnings, risk intelligence and emergency information.',
    icon: <ShieldAlert className="w-5 h-5 text-amber-600" />,
  },
  {
    id: 'urban_planner',
    title: 'Urban Planner',
    description: 'Weather impact and infrastructure intelligence.',
    icon: <Building2 className="w-5 h-5 text-indigo-600" />,
  },
  {
    id: 'researcher',
    title: 'Researcher',
    description: 'Historical weather and climate analysis.',
    icon: <Search className="w-5 h-5 text-purple-600" />,
  },
  {
    id: 'aviation',
    title: 'Aviation',
    description: 'Aviation weather and atmospheric conditions.',
    icon: <Plane className="w-5 h-5 text-blue-600" />,
  },
];

export const RoleSelectionScreen: React.FC = () => {
  const { handleSaveRole, userProfile } = useAuthContext();
  const [selectedRole, setSelectedRole] = useState<UserRole>(userProfile?.role || 'citizen');

  const handleContinue = () => {
    handleSaveRole(selectedRole);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex items-center justify-center p-4 sm:p-6 md:p-8 relative">
      <div className="w-full max-w-md bg-white sm:rounded-3xl sm:shadow-2xl sm:border sm:border-slate-200/80 p-6 sm:p-8 flex flex-col justify-between min-h-[85vh] sm:min-h-[580px] transition-all">
        {/* Top Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold mb-3 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>Select Your Role</span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">What best describes you?</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            We'll personalize WeatherGPT for your needs.
          </p>
        </div>

        {/* List of 7 Selectable Cards */}
        <div className="my-4 space-y-2.5 max-h-[55vh] sm:max-h-[380px] overflow-y-auto pr-1">
          {ROLE_CARDS.map((r) => {
            const isSelected = selectedRole === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRole(r.id)}
                className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-sky-50 border-sky-500 ring-2 ring-sky-500/20 shadow-sm'
                    : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className="p-2.5 rounded-xl bg-white shrink-0 shadow-2xs border border-slate-100">{r.icon}</span>
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">{r.title}</div>
                    <div className="text-xs text-slate-500 font-medium">{r.description}</div>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Action */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full py-4 rounded-2xl bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white font-extrabold text-base shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Continue</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
