import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Radio, Clock, MapPin, ChevronRight, Activity } from 'lucide-react';
import { RealtimeWeatherEvent } from '../../types/realtime';

interface LiveEventNotificationProps {
  event: RealtimeWeatherEvent | null;
  onViewAlert?: (event: RealtimeWeatherEvent) => void;
  onDismiss?: () => void;
}

export const LiveEventNotification: React.FC<LiveEventNotificationProps> = ({
  event,
  onViewAlert,
  onDismiss,
}) => {
  const [visible, setVisible] = useState(false);
  const [lastEventId, setLastEventId] = useState<string | null>(null);

  useEffect(() => {
    if (event && event.eventId !== lastEventId && event.eventType !== 'SYSTEM_STATUS') {
      setLastEventId(event.eventId);
      setVisible(true);

      // Auto dismiss after 10 seconds
      const timer = setTimeout(() => {
        setVisible(false);
        if (onDismiss) onDismiss();
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [event, lastEventId, onDismiss]);

  if (!visible || !event) return null;

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'RED':
        return 'bg-red-900/90 border-red-600 text-white';
      case 'ORANGE':
        return 'bg-amber-900/90 border-amber-600 text-white';
      case 'YELLOW':
        return 'bg-yellow-900/90 border-yellow-600 text-white';
      default:
        return 'bg-slate-900/90 border-slate-700 text-white';
    }
  };

  const getBadgeStyle = (sev: string) => {
    switch (sev) {
      case 'RED':
        return 'bg-red-500 text-white';
      case 'ORANGE':
        return 'bg-amber-500 text-slate-950 font-bold';
      case 'YELLOW':
        return 'bg-yellow-400 text-slate-950 font-bold';
      default:
        return 'bg-sky-500 text-white';
    }
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div
        className={`p-3.5 rounded-lg border shadow-2xl backdrop-blur-md transition-all ${getSeverityStyle(
          event.severity
        )}`}
      >
        {/* Header Row */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-slate-300">
              {event.is_demo ? 'DEMO REAL-TIME EVENT' : 'LIVE BROADCAST'}
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-bold tracking-wider ${getBadgeStyle(
                event.severity
              )}`}
            >
              {event.severity} ALERT
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setVisible(false);
              if (onDismiss) onDismiss();
            }}
            className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white truncate">{event.title}</h4>
            </div>
            {event.location && (
              <p className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-sky-400" />
                <span>{event.location.name}, {event.location.state || event.location.district || ''}</span>
              </p>
            )}
            <p className="text-[11px] text-slate-200 mt-1 line-clamp-2 leading-relaxed">
              {event.message}
            </p>
          </div>
        </div>

        {/* Footer info & action */}
        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            {event.latencyMs !== undefined && (
              <span className="text-[9px] font-mono bg-black/40 px-1.5 py-0.5 rounded text-emerald-400">
                ⚡ {(event.latencyMs / 1000).toFixed(2)}s latency
              </span>
            )}
          </div>
          {onViewAlert && (
            <button
              type="button"
              onClick={() => {
                setVisible(false);
                onViewAlert(event);
              }}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-300 hover:text-sky-100 hover:underline"
            >
              VIEW DETAILS
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
