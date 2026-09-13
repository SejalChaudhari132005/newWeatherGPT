import React from 'react';
import { UserCheck, Sprout, Fish, ShieldAlert, Plane, Building, GraduationCap, ArrowRight } from 'lucide-react';
import { useWeather } from '../../context/WeatherContext';
import { useUI } from '../../context/UIContext';
import { UserRole } from '../../types/role';

export const RoleBasedAdvisoryCard: React.FC = () => {
  const { activeRole, setActiveRole } = useWeather();
  const { setActiveTab } = useUI();

  const roles: { id: UserRole; title: string; desc: string; icon: any; color: string }[] = [
    { id: 'Citizen', title: 'Citizen', desc: 'Daily commute & outdoor safety', icon: UserCheck, color: 'bg-sky-50 text-sky-700 border-sky-200' },
    { id: 'Farmer', title: 'Farmer', desc: 'Crop advisory & irrigation windows', icon: Sprout, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { id: 'Fisher', title: 'Fisher', desc: 'Wave height & safe sailing hours', icon: Fish, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { id: 'Disaster Manager', title: 'Disaster Manager', desc: 'Flood warnings & shelter routes', icon: ShieldAlert, color: 'bg-rose-50 text-rose-700 border-rose-200' },
    { id: 'Aviation', title: 'Aviation', desc: 'Visibility & runway crosswinds', icon: Plane, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { id: 'Urban Planner', title: 'Urban Planner', desc: 'Waterlogging & drainage load', icon: Building, color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { id: 'Researcher', title: 'Researcher', desc: 'Microclimate & anomaly trends', icon: GraduationCap, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  ];

  return (
    <div className="bg-white rounded-[28px] p-5 sm:p-6 shadow-sm border border-slate-200/60 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">WeatherGPT For You</h3>
          <p className="text-[11px] text-slate-400 font-medium">Tap role to customize advisories</p>
        </div>

        <button
            if (activeRole.toLowerCase() === 'farmer') {
              setActiveTab('farmer');
            } else if (activeRole.toLowerCase() === 'fisher') {
              setActiveTab('fisher');
            } else if (activeRole.toLowerCase() === 'aviation') {
              setActiveTab('aviation');
            } else if (activeRole.toLowerCase().includes('disaster')) {
              setActiveTab('disaster');
            } else {
              setActiveTab('advisories');
            }
          }}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer shrink-0"
        >
          <span>
            {activeRole.toLowerCase() === 'farmer'
              ? '🌾 My Farm'
              : activeRole.toLowerCase() === 'fisher'
              ? '🎣 My Sea'
              : activeRole.toLowerCase() === 'aviation'
              ? '✈️ My Operations'
              : activeRole.toLowerCase().includes('disaster')
              ? '🚨 Disaster Ops'
              : 'All Advisories'}
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Horizontal Scroll Chips on Mobile / Responsive Grid on Desktop */}
      <div className="flex sm:grid sm:grid-cols-4 lg:grid-cols-7 gap-2.5 overflow-x-auto snap-x snap-mandatory py-1 no-scrollbar">
        {roles.map((r) => {
          const Icon = r.icon;
          const isSelected = activeRole.toLowerCase() === r.id.toLowerCase();
          return (
            <button
              key={r.id}
              onClick={() => {
                setActiveRole(r.id);
                if (r.id === 'Farmer') {
                  setActiveTab('farmer');
                } else if (r.id === 'Fisher') {
                  setActiveTab('fisher');
                } else if (r.id === 'Aviation') {
                  setActiveTab('aviation');
                } else if (r.id === 'Citizen') {
                  setActiveTab('home');
                } else if (r.id === 'Disaster Manager') {
                  setActiveTab('disaster');
                }
              }}
              className={`min-w-[130px] sm:min-w-0 snap-center p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer shrink-0 sm:shrink ${
                isSelected
                  ? `${r.color} ring-2 ring-sky-500/40 shadow-xs font-bold scale-[1.02]`
                  : 'bg-slate-50 border-slate-200/70 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Icon className="w-4 h-4" />
                {isSelected && <span className="w-2 h-2 rounded-full bg-current"></span>}
              </div>
              <div>
                <div className="text-xs font-extrabold truncate">{r.title}</div>
                <div className="text-[10px] opacity-75 line-clamp-1 mt-0.5">{r.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
