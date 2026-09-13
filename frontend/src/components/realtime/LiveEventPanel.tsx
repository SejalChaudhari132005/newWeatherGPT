import React, { useState } from 'react';
import {
  Radio,
  AlertTriangle,
  Radar,
  Eye,
  Server,
  Layers,
  Clock,
  MapPin,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { RealtimeWeatherEvent, RealtimeEventType } from '../../types/realtime';

interface LiveEventPanelProps {
  events: RealtimeWeatherEvent[];
  maxDisplay?: number;
  className?: string;
  onSelectEvent?: (event: RealtimeWeatherEvent) => void;
  title?: string;
  showFilters?: boolean;
}

export const LiveEventPanel: React.FC<LiveEventPanelProps> = ({
  events,
  maxDisplay = 20,
  className = '',
  onSelectEvent,
  title = 'REAL-TIME METEOROLOGICAL FEED',
  showFilters = true,
}) => {
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const getEventIcon = (type: RealtimeEventType) => {
    switch (type) {
      case 'WEATHER_ALERT':
      case 'MARINE_WARNING':
      case 'AVIATION_ALERT':
      case 'AGRICULTURE_ALERT':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
      case 'RADAR_UPDATE':
        return <Radar className="w-3.5 h-3.5 text-sky-500" />;
      case 'WEATHER_OBSERVATION':
        return <Eye className="w-3.5 h-3.5 text-emerald-500" />;
      case 'NWP_UPDATE':
        return <Layers className="w-3.5 h-3.5 text-indigo-500" />;
      case 'SYSTEM_STATUS':
      default:
        return <Server className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'RED':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800';
      case 'ORANGE':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
      case 'YELLOW':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/60 dark:text-yellow-300 dark:border-yellow-800';
      case 'GREEN':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const filteredEvents = events.filter((ev) => {
    if (selectedType === 'ALL') return true;
    if (selectedType === 'ALERTS') {
      return ['WEATHER_ALERT', 'MARINE_WARNING', 'AVIATION_ALERT', 'AGRICULTURE_ALERT'].includes(ev.eventType);
    }
    return ev.eventType === selectedType;
  });

  const displayedEvents = filteredEvents.slice(0, maxDisplay);

  return (
    <div className={`border rounded-lg bg-card text-card-foreground shadow-sm ${className}`}>
      {/* Panel Header */}
      <div className="p-3 border-b flex flex-wrap items-center justify-between gap-2 bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-xs font-bold tracking-wider uppercase">{title}</h3>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted border text-muted-foreground">
            {events.length} Events Ingested
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      {showFilters && (
        <div className="flex items-center gap-1 p-2 border-b bg-muted/10 overflow-x-auto text-[11px]">
          <Filter className="w-3 h-3 text-muted-foreground ml-1 mr-0.5" />
          {['ALL', 'ALERTS', 'RADAR_UPDATE', 'WEATHER_OBSERVATION', 'NWP_UPDATE'].map((filterKey) => (
            <button
              key={filterKey}
              type="button"
              onClick={() => setSelectedType(filterKey)}
              className={`px-2 py-0.5 rounded font-medium transition-colors text-[10px] uppercase whitespace-nowrap ${
                selectedType === filterKey
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {filterKey.replace('_', ' ')}
            </button>
          ))}
        </div>
      )}

      {/* Event Stream List */}
      <div className="divide-y max-h-[380px] overflow-y-auto">
        {displayedEvents.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-1.5">
            <Radio className="w-5 h-5 text-muted-foreground/60 animate-pulse" />
            <p>Awaiting real-time weather ingestion events...</p>
            <p className="text-[10px] text-muted-foreground/80">
              Trigger a demo event from the Demo Control Panel to test WebSocket broadcast.
            </p>
          </div>
        ) : (
          displayedEvents.map((ev) => (
            <div
              key={ev.eventId}
              onClick={() => onSelectEvent && onSelectEvent(ev)}
              className={`p-2.5 transition-colors text-xs flex flex-col gap-1 ${
                onSelectEvent ? 'hover:bg-muted/50 cursor-pointer' : ''
              }`}
            >
              {/* Top metadata line */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {getEventIcon(ev.eventType)}
                  <span className="font-semibold text-foreground text-[11px] truncate">{ev.title}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {ev.is_demo ? (
                    <span className="text-[9px] px-1.5 py-0.2 rounded border bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 font-mono font-medium">
                      DEMO STREAM
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.2 rounded border bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 font-mono font-medium">
                      IMD LIVE
                    </span>
                  )}
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded border font-mono font-bold ${getSeverityBadge(
                      ev.severity
                    )}`}
                  >
                    {ev.severity}
                  </span>
                </div>
              </div>

              {/* Message body */}
              <p className="text-muted-foreground text-[11px] line-clamp-2 leading-relaxed">
                {ev.message}
              </p>

              {/* Bottom metadata */}
              <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 pt-0.5">
                <div className="flex items-center gap-2">
                  {ev.location && (
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5 text-muted-foreground" />
                      {ev.location.name}
                    </span>
                  )}
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                    {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                {ev.latencyMs !== undefined && (
                  <span className="font-mono text-[9px] text-emerald-600 dark:text-emerald-400">
                    ⚡ {(ev.latencyMs / 1000).toFixed(2)}s
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
