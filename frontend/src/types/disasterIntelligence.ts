export interface ActiveAlertItem {
  id: string;
  severity: 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | string;
  hazard_type: string;
  headline: string;
  affected_areas: string[];
  issued_at: string;
  valid_until: string;
  action_advisory: string;
  source: string;
}

export interface VulnerableZoneItem {
  zone_name: string;
  taluka_or_ward: string;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | string;
  exposed_population: number;
  critical_infrastructure: string[];
  waterlogging_propensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'SEVERE' | string;
  evacuation_readiness: 'STANDBY' | 'ALERT' | 'ACTIVE' | string;
}

export interface SituationalRiskData {
  location_name: string;
  latitude: number;
  longitude: number;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | string;
  risk_headline: string;
  active_alerts_count: number;
  rainfall_intensity_mmh: number;
  rainfall_24h_mm: number;
  flood_risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE' | string;
  flood_risk_score: number;
  wind_speed_kmh: number;
  wind_gust_kmh: number;
  lightning_strike_density: number;
  convective_cape_index: number;
  primary_hazard: string;
  affected_area_summary: string;
  updated_at: string;
  is_emergency_active: boolean;
}

export interface DisasterBriefingResponse {
  success: boolean;
  location_name: string;
  timestamp: string;
  situational_risk: SituationalRiskData;
  active_alerts: ActiveAlertItem[];
  vulnerable_zones: VulnerableZoneItem[];
  emergency_contacts: Array<{
    title: string;
    number: string;
    channel: string;
  }>;
  narrative_briefing: string;
}
