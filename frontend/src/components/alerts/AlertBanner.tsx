import React from 'react';
import { AlertTriangle, Clock, MapPin, Share2, ChevronRight, ShieldAlert } from 'lucide-react';
import { useWeather } from '../../context/WeatherContext';
import { useUI } from '../../context/UIContext';
import { DemoBadge } from '../common/DemoBadge';

export const AlertBanner: React.FC = () => {
  const { userLocation } = useWeather();
  const { setActiveTab } = useUI();

  const locationName = userLocation?.city || 'Your Location';

  return (
    <div className="rounded-3xl bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 p-6 border-2 border-rose-300 shadow-lg relative overflow-hidden">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-md shadow-rose-600/30 animate-pulse">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-rose-700 tracking-wider">
                ⚠ Heavy Rainfall Warning
              </span>
              <DemoBadge label="DEMO ALERT" variant="amber" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
              Convective Downpour & Waterlogging Notice
            </h3>
          </div>
        </div>

        <span className="px-3 py-1 bg-rose-600 text-white rounded-full text-xs font-black uppercase tracking-wider">
          HIGH RISK
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-xs font-semibold text-slate-700">
        <div className="flex items-center gap-2 p-2.5 bg-white/80 rounded-xl border border-rose-200/80">
          <MapPin className="w-4 h-4 text-rose-600" />
          <span>Affected Area: <strong>{locationName} & Surrounding Sector</strong></span>
        </div>

        <div className="flex items-center gap-2 p-2.5 bg-white/80 rounded-xl border border-rose-200/80">
          <Clock className="w-4 h-4 text-rose-600" />
          <span>Validity Window: <strong>4:00 PM – 9:00 PM Today</strong></span>
        </div>
      </div>

      <div className="p-4 bg-white/90 rounded-2xl border border-rose-200 mb-4">
        <div className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-2">
          Potential Impacts:
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-semibold text-slate-700">
          <li className="flex items-center gap-1.5 text-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span> Waterlogging in low-lying underpasses
          </li>
          <li className="flex items-center gap-1.5 text-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span> Peak commute traffic disruption
          </li>
          <li className="flex items-center gap-1.5 text-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span> Low visibility (&lt;1.5 km)
          </li>
        </ul>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: 'Weather Alert', text: `Heavy Rainfall Warning for ${locationName}` });
            } else {
              alert('Alert details copied to clipboard!');
            }
          }}
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share Alert</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/25 flex items-center gap-1.5 cursor-pointer"
        >
          <span>View Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
