import React from 'react';
import { AlertTriangle, Navigation, Building2, ShieldCheck, Share2, MapPin, X } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useWeather } from '../../context/WeatherContext';
import { DemoBadge } from '../common/DemoBadge';

export const EmergencyModeScreen: React.FC = () => {
  const { setEmergencyMode, setActiveTab } = useUI();
  const { userLocation } = useWeather();

  const locationName = userLocation?.city || 'Your Location';

  return (
    <div className="min-h-[80vh] p-6 rounded-3xl bg-slate-950 text-white border-2 border-rose-600 shadow-2xl relative overflow-hidden flex flex-col justify-between">
      {/* Top Banner Header */}
      <div>
        <div className="flex items-center justify-between pb-6 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-600 rounded-2xl text-white shadow-lg shadow-rose-600/50 animate-bounce">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-rose-500 tracking-wider">🚨 EMERGENCY MODE</h1>
                <DemoBadge label="DEMO SIMULATION" variant="amber" />
              </div>
              <p className="text-sm text-slate-400 font-semibold">
                Hyperlocal Disaster Safety Interface • {locationName} Sector
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setEmergencyMode(false);
              setActiveTab('home');
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Exit Emergency Mode
          </button>
        </div>

        {/* Warning Statement */}
        <div className="p-5 rounded-2xl bg-rose-950/80 border border-rose-700/80 mb-6">
          <h2 className="text-xl font-extrabold text-white mb-1">
            "Heavy rainfall & waterlogging detected near you."
          </h2>
          <p className="text-xs text-rose-200 font-medium">
            Automated rainfall gauges registered 58mm/hr precipitation intensity. High risk of localized inundation within 1.5 km of your position.
          </p>
        </div>

        {/* Status Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-xs text-slate-400 font-semibold mb-1">Assessed Risk Level</div>
            <div className="text-2xl font-black text-rose-500">HIGH</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-xs text-slate-400 font-semibold mb-1">Nearest Emergency Shelter</div>
            <div className="text-lg font-bold text-white">Demo Municipal Shelter #4</div>
            <div className="text-[11px] text-sky-400 font-medium">1.2 km Away</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-xs text-slate-400 font-semibold mb-1">Safe Evacuation Route</div>
            <div className="text-lg font-bold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Available
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-xs text-slate-400 font-semibold mb-1">Active Road Closures</div>
            <div className="text-2xl font-black text-amber-400">3 Closures</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => alert('Demo Safe Route Navigation initiated to higher ground shelter.')}
            className="py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm shadow-xl shadow-rose-600/40 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Navigation className="w-5 h-5" />
            <span>Find Safe Route</span>
          </button>

          <button
            onClick={() => alert('Directing to Demo Municipal Relief Center #4 (Cap: 450 persons).')}
            className="py-4 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Building2 className="w-5 h-5 text-sky-400" />
            <span>Nearest Shelter</span>
          </button>

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Emergency GPS Location',
                  text: `I am at ${userLocation?.latitude}, ${userLocation?.longitude} (${locationName}) during heavy rain.`
                });
              } else {
                alert(`GPS Coordinates copied: ${userLocation?.latitude}, ${userLocation?.longitude}`);
              }
            }}
            className="py-4 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Share2 className="w-5 h-5 text-amber-400" />
            <span>Share Location</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-500 text-center">
          * This interface is a WeatherGPT demonstration prototype. In real disaster situations, always rely on local government disaster management authority (NDRF / State Disaster Management) official broadcasts.
        </p>
      </div>
    </div>
  );
};
