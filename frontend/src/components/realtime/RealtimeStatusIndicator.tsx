import React from 'react';
import { Radio, RefreshCw, WifiOff } from 'lucide-react';
import { RealtimeConnectionStatus } from '../../types/realtime';

interface RealtimeStatusIndicatorProps {
  status: RealtimeConnectionStatus;
  onClick?: () => void;
  className?: string;
  showLabel?: boolean;
}

export const RealtimeStatusIndicator: React.FC<RealtimeStatusIndicatorProps> = ({
  status,
  onClick,
  className = '',
  showLabel = true,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          color: 'text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
          dot: 'bg-emerald-600 animate-pulse',
          icon: Radio,
          label: 'REAL-TIME CONNECTED',
          tooltip: 'Live WebSocket pipeline connected (Push updates active)',
        };
      case 'reconnecting':
        return {
          color: 'text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
          dot: 'bg-amber-600',
          icon: RefreshCw,
          label: 'RECONNECTING...',
          tooltip: 'Attempting to reconnect with exponential backoff',
        };
      case 'connecting':
        return {
          color: 'text-sky-700 bg-sky-50 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
          dot: 'bg-sky-600',
          icon: RefreshCw,
          label: 'CONNECTING...',
          tooltip: 'Establishing WebSocket connection',
        };
      case 'offline':
      default:
        return {
          color: 'text-slate-600 bg-slate-100 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
          dot: 'bg-slate-400',
          icon: WifiOff,
          label: 'REAL-TIME OFFLINE',
          tooltip: 'WebSocket offline. REST API fallback active.',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      title={config.tooltip}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold tracking-wider rounded border transition-colors ${config.color} ${
        onClick ? 'cursor-pointer hover:brightness-95 active:scale-[0.98]' : 'cursor-default'
      } ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {showLabel && <span>{config.label}</span>}
      {status === 'reconnecting' && <Icon className="w-2.5 h-2.5 animate-spin ml-0.5" />}
    </button>
  );
};
