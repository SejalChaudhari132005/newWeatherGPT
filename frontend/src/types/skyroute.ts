/**
 * SkyRoute Frontend Type Definitions
 * Weather-Aware Flight Route Intelligence
 */

export type HazardSeverity = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
export type HazardType = 'thunderstorm' | 'rain' | 'wind' | 'turbulence' | 'visibility' | 'warning';
export type RouteImpact = 'INTERSECTION' | 'NEAR ROUTE' | 'OFF ROUTE';

export interface AirportEndpoint {
  icao: string;
  iata: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  elevation_ft?: number;
}

export interface RouteGeometry {
  type: 'LineString';
  coordinates: [number, number][]; // [lon, lat]
}

export interface CorridorGeometry {
  type: 'Polygon';
  coordinates: [number, number][][]; // [[lon, lat], ...]
}

export interface RouteStageInfo {
  title: string;
  location_name: string;
  risk_level: HazardSeverity;
  weather_condition: string;
  temperature_c: number;
  visibility_km: number;
  wind_kts: number;
  summary: string;
  concerns: string[];
}

export interface WeatherHazardFeature {
  hazard_id: string;
  type: HazardType;
  title: string;
  severity: HazardSeverity;
  location_description: string;
  coordinates_center: [number, number]; // [lat, lon]
  geometry: {
    type: string;
    coordinates: any;
  };
  distance_from_corridor_km: number;
  route_impact: RouteImpact;
  expected_time_window: string;
  operational_impact: string;
  source: string;
  updated_at: string;
  valid_until?: string;
  parameters: Record<string, any>;
}

export interface RouteRiskSummary {
  score: number;
  level: HazardSeverity;
  confidence: 'HIGH' | 'MODERATE' | 'LIMITED';
  available_parameters_count: number;
  total_parameters_count: number;
  total_hazards: number;
  route_intersections: number;
  near_route_hazards: number;
  major_concern: string;
  rationale: string;
}

export interface SkyRouteData {
  origin: AirportEndpoint;
  destination: AirportEndpoint;
  distance_nm: number;
  distance_km: number;
  estimated_flight_time: string;
  route_linestring: RouteGeometry;
  corridor_polygon: CorridorGeometry;
  risk_summary: RouteRiskSummary;
  stages: {
    departure: RouteStageInfo;
    enroute: RouteStageInfo;
    arrival: RouteStageInfo;
  };
  hazards: WeatherHazardFeature[];
  ai_weather_brief: string;
  sources: { name: string; type: string; updated: string }[];
  disclaimer: string;
  generated_at: string;
}

export interface SkyRouteResponse {
  success: boolean;
  data?: SkyRouteData;
  message?: string;
}
