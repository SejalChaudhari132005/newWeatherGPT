/**
 * Real-Time Weather Event Types and WebSocket Statuses
 */

export type RealtimeEventType =
  | 'WEATHER_ALERT'
  | 'RADAR_UPDATE'
  | 'WEATHER_OBSERVATION'
  | 'SYSTEM_STATUS'
  | 'NWP_UPDATE'
  | 'MARINE_WARNING'
  | 'AVIATION_ALERT'
  | 'AGRICULTURE_ALERT';

export type RealtimeEventSeverity = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' | 'INFO';

export interface RealtimeLocation {
  lat: number;
  lon: number;
  name: string;
  district?: string;
  state?: string;
}

export interface RealtimeWeatherEvent {
  eventType: RealtimeEventType;
  eventId: string;
  source: string;
  timestamp: string;
  receivedTimestamp?: string;
  is_demo: boolean;
  severity: RealtimeEventSeverity;
  title: string;
  message: string;
  location?: RealtimeLocation;
  validFrom?: string;
  validUntil?: string;
  targetRoles: string[];
  data?: Record<string, any>;
  clientReceivedAt?: number; // millisecond timestamp for client-side latency calculation
  latencyMs?: number;
}

export type RealtimeConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'offline';

export interface DemoPublishRequest {
  eventType: RealtimeEventType;
  severity: RealtimeEventSeverity;
  title: string;
  message: string;
  location?: RealtimeLocation;
  source?: string;
  is_demo?: boolean;
  targetRoles?: string[];
  data?: Record<string, any>;
}

export interface RealtimePipelineHealth {
  websocket: string;
  connected_clients: number;
  total_events_broadcast: number;
  last_event_timestamp: string | null;
  uptime_seconds: number;
  status: string;
  event_bus: string;
}
