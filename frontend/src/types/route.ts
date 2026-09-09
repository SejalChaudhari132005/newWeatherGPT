export interface RouteSegment {
  segment_index: number;
  name: string;
  latitude: number;
  longitude: number;
  eta: string;
  eta_offset_minutes: number;
  temperature: number;
  condition: string;
  rain_probability: number;
  precipitation_rate: number;
  wind_speed: number;
  visibility_km: number;
  risk: 'low' | 'moderate' | 'high' | 'severe';
  badge_color: 'green' | 'yellow' | 'orange' | 'red';
  hazards: string[];
  reasons: string[];
  imd_warning_count: number;
}

export interface RouteAnalysisResponse {
  success: boolean;
  origin: {
    name: string;
    latitude: number;
    longitude: number;
    departure_time: string;
  };
  destination: {
    name: string;
    latitude: number;
    longitude: number;
    arrival_time: string;
  };
  travel_date: string;
  distance_km: number;
  duration_minutes: number;
  formatted_duration: string;
  overall_risk: 'low' | 'moderate' | 'high' | 'severe';
  risk_score_label: string;
  hazards: string[];
  reasons: string[];
  recommendation: {
    risk_level: string;
    summary_action: string;
    key_precautions: string[];
    departure_window: string;
  };
  segments: RouteSegment[];
  route_coordinates: [number, number][];
  sources: { provider: string; type: string }[];
  analyzed_at: string;
}

export interface DepartureTimeSlot {
  departure_time: string;
  formatted_departure: string;
  arrival_time: string;
  overall_risk: 'low' | 'moderate' | 'high' | 'severe';
  risk_rank: number;
  duration_minutes: number;
  hazards_summary: string[];
  top_reason: string;
}

export interface DepartureComparisonResponse {
  success: boolean;
  origin: string;
  destination: string;
  recommended_departure: string;
  recommendation_summary: string;
  comparison: DepartureTimeSlot[];
}
