import React from 'react';
import { AlertTriangle, ShieldAlert, Clock, Building2 } from 'lucide-react';
import { WeatherContextPayload } from '../../types/chat';

interface Props {
  alerts?: WeatherContextPayload['alerts'];
}

export const WeatherAlertCard: React.FC<Props> = ({ alerts }) => {
  if (!alerts || alerts.length === 0) return null;

  const alert = alerts[0];
  const severity = (alert.severity || 'yellow').toLowerCase();

  const getSeverityStyle = () => {
    switch (severity) {
      case 'red':
        return 'bg-red-50 border-red-300 text-red-950';
      case 'orange':
        return 'bg-orange-50 border-orange-300 text-orange-950';
      case 'yellow':
        return 'bg-amber-50 border-amber-300 text-amber-950';
      default:
        return 'bg-blue-50 border-blue-300 text-blue-950';
    }
  };

  const getBadgeStyle = () => {
    switch (severity) {
      case 'red':
        return 'bg-red-600 text-white';
      case 'orange':
        return 'bg-orange-500 text-white';
      case 'yellow':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-blue-600 text-white';
    }
  };

  return (
    <div className={`my-3 p-4 rounded-2xl border shadow-xs ${getSeverityStyle()} font-['Arimo'] animate-fadeIn`}>
      <div className="flex items-start justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <div className="text-xs font-black uppercase tracking-wider">
              Official IMD Warning
            </div>
            <div className="text-sm font-black text-slate-900 mt-0.5">
              {alert.title}
            </div>
          </div>
        </div>

        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${getBadgeStyle()}`}>
          {alert.severity_label || alert.severity || 'Active'}
        </span>
      </div>

      {alert.description && (
        <p className="text-xs font-semibold text-slate-700 leading-relaxed pt-1">
          {alert.description}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/60 text-[10px] font-bold text-slate-500 mt-2">
        <div className="flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5 text-[#004aad]" />
          <span>{alert.source || 'Early Warning Division'}</span>
        </div>

        {alert.valid_until && (
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Valid until: {new Date(alert.valid_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
      </div>
    </div>
  );
};
