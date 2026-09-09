export type DecisionBadgeColor = 'green' | 'yellow' | 'orange' | 'red';

export interface SailingClearance {
  status: 'favorable' | 'caution' | 'no_departure';
  badge_color: DecisionBadgeColor;
  primary_reason: string;
  max_wave_height_m: number;
  max_wind_speed_kts: number;
  squall_risk: boolean;
  clearance_window: string | null;
}

export interface TemporalMarineSlot {
  time_slot: string;
  status: 'favorable' | 'caution' | 'dangerous';
  badge_color: DecisionBadgeColor;
  wave_height_m: number;
  wind_speed_kts: number;
  swell_period_s: number;
  wind_direction_deg?: number;
  notes: string;
}

export interface ReturnTimeAnalysis {
  departure_time: string;
  recommended_return_time: string;
  cutoff_hour: string;
  safe_duration_hours: number;
  deterioration_reason: string;
  alert_level: 'normal' | 'warning' | 'critical';
}

export interface TideExtrema {
  tide_type: 'high' | 'low';
  time: string;
  height_m: number;
}

export interface ZoneRisk {
  zone_name: 'Near-Shore (0-5 nm)' | 'Coastal (5-20 nm)' | 'Deep-Sea (>20 nm)';
  risk_level: 'low' | 'moderate' | 'high' | 'severe';
  max_wave_height_m: number;
  advisory: string;
}

export interface SeaStateSummary {
  wave_height_m: number;
  wave_period_s: number;
  wave_direction_deg: number;
  swell_height_m: number;
  swell_period_s: number;
  ocean_current_knots?: number | null;
  sea_surface_temp_c?: number | null;
  beaufort_scale: number;
  beaufort_description: string;
}

export interface MarineDecisionData {
  location: {
    latitude: number;
    longitude: number;
    name?: string;
    city?: string;
    state?: string;
  };
  departure_time: string;
  sailing_clearance: SailingClearance;
  return_time_intelligence: ReturnTimeAnalysis;
  sea_state: SeaStateSummary;
  temporal_curve: TemporalMarineSlot[];
  zone_risks: ZoneRisk[];
  tide_schedule: TideExtrema[];
  official_bulletin?: string | null;
  sos_emergency_contact: string;
  vernacular_advisory_text: string;
  provenance: {
    source: string;
    evaluated_at: string;
    confidence_score: number;
    disclaimer?: string;
  };
  generated_at: string;
}

export interface MarineDecisionResponse {
  success: boolean;
  data?: MarineDecisionData;
  message?: string;
}
