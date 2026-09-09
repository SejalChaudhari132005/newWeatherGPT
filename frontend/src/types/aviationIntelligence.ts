export type DecisionBadgeColor = 'green' | 'yellow' | 'orange' | 'red';
export type FlightCategory = 'VFR' | 'MVFR' | 'IFR' | 'LVP';

export interface FlightRules {
  category: FlightCategory;
  ceiling_ft_agl?: number | null;
  visibility_meters: number;
  rationale: string;
}

export interface RunwayWindComponent {
  runway_id: string;
  runway_heading_deg: number;
  wind_speed_kts: number;
  wind_direction_deg: number;
  wind_gusts_kts?: number | null;
  headwind_kts: number;
  crosswind_kts: number;
  crosswind_direction: 'left' | 'right' | 'head' | 'tail';
  is_crosswind_exceeded: boolean;
  max_demonstrated_crosswind_kts: number;
  operational_status: 'normal' | 'caution' | 'exceeded';
}

export interface PeriodRequiringAttention {
  time_window: string;
  hazard_type: 'crosswind' | 'gust' | 'convective_storm' | 'low_visibility' | 'wind_shear' | 'icing';
  severity: 'caution' | 'warning' | 'critical';
  operational_impact: string;
  suggested_action: string;
}

export interface DecodedMetarToken {
  token: string;
  meaning: string;
  category: 'station' | 'time' | 'wind' | 'visibility' | 'weather' | 'clouds' | 'temp_dew' | 'altimeter' | 'remark';
  is_hazard?: boolean;
}

export interface DecodedMetarTaf {
  raw_metar?: string | null;
  raw_taf?: string | null;
  plain_english_briefing: string;
  tokens: DecodedMetarToken[];
}

export interface AviationBriefingData {
  icao: string;
  iata?: string | null;
  airport_name: string;
  city: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  flight_rules: FlightRules;
  active_runway: RunwayWindComponent;
  alternate_runways: RunwayWindComponent[];
  conversational_briefing: string;
  period_requiring_attention?: PeriodRequiringAttention | null;
  decoded_metar_taf: DecodedMetarTaf;
  temperature_c: number;
  dew_point_c: number;
  surface_pressure_hpa: number;
  cloud_cover_pct: number;
  convective_risk: 'none' | 'low' | 'moderate' | 'high';
  cape_j_kg?: number | null;
  provenance: {
    source: string;
    evaluated_at: string;
    confidence_score: number;
    disclaimer?: string;
  };
  generated_at: string;
}

export interface AviationBriefingResponse {
  success: boolean;
  data?: AviationBriefingData;
  message?: string;
}

export interface AirportComparisonData {
  origin: AviationBriefingData;
  destination: AviationBriefingData;
  comparative_summary: string;
  favorable_airport: string;
  enroute_risk_level: 'low' | 'moderate' | 'high';
  generated_at: string;
}

export interface AirportComparisonResponse {
  success: boolean;
  data?: AirportComparisonData;
  message?: string;
}

export interface RunwayMeta {
  id: string;
  heading_deg: number;
  length_m: number;
}

export interface AirportCatalogItem {
  icao: string;
  iata: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  elevation_ft: number;
  runways: RunwayMeta[];
}

export interface AirportCatalogResponse {
  success: boolean;
  airports: AirportCatalogItem[];
}
