export type AlertSeverity =
  | 'INFO'
  | 'ADVISORY'
  | 'WATCH'
  | 'WARNING'
  | 'SEVERE'
  | 'EMERGENCY';

export type AlertType =
  | 'RAIN'
  | 'HEAVY_RAIN'
  | 'EXTREME_RAIN'
  | 'THUNDERSTORM'
  | 'LIGHTNING'
  | 'HEATWAVE'
  | 'STRONG_WIND'
  | 'EXTREME_WIND'
  | 'FLOOD_RISK'
  | 'POOR_VISIBILITY'
  | 'EXTREME_TEMPERATURE'
  | 'CYCLONE'
  | 'FOG'
  | 'COLD_WAVE'
  | 'DUST_STORM'
  | 'HAIL'
  | 'COASTAL_WARNING'
  | 'OTHER';

export interface CitizenAlert {
  id: string;
  user_id?: string | null;
  fingerprint: string;
  type: string;
  severity: AlertSeverity;
  severity_label?: string;
  title: string;
  description: string;
  location_name: string;
  district?: string | null;
  state?: string | null;
  latitude: number;
  longitude: number;
  valid_from: string;
  valid_until: string;
  source: string;
  source_url?: string | null;
  confidence?: number | null;
  recommended_actions: string[];
  what_to_avoid: string[];
  is_read: boolean;
  is_active: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface UserAlertPreferences {
  user_id: string;
  severe_weather: boolean;
  heavy_rain: boolean;
  heatwave: boolean;
  cyclone: boolean;
  flood: boolean;
  strong_wind: boolean;
  thunderstorm: boolean;
  push_enabled: boolean;
  updated_at?: string;
}

export interface CurrentAlertsResponse {
  success: boolean;
  location: {
    city?: string;
    district?: string;
    state?: string;
    latitude: number;
    longitude: number;
  };
  active_count: number;
  alerts: CitizenAlert[];
  top_alert?: CitizenAlert | null;
  summary_message: string;
  evaluated_at: string;
}

export interface IMDAlert {
  id?: string;
  type: string;
  severity: string;
  severity_label?: string;
  title: string;
  description: string;
  valid_from?: string;
  valid_until?: string;
  affected_area: string;
  source: string;
  source_url?: string;
  issued_at?: string;
}

export interface WeatherAlert {
  id: string;
  title: string;
  location: string;
  startTime: string;
  endTime: string;
  severity: AlertSeverity;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  description: string;
  impacts: string[];
  recommendedActions: string[];
  issuedBy: string;
  updatedAt: string;
}

export interface ProactiveNotice {
  id: string;
  title: string;
  summary: string;
  timeframe: string;
  actionText: string;
}
