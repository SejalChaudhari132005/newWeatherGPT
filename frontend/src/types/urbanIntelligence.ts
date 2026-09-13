export interface WaterloggingHotspotItem {
  hotspot_name: string;
  ward_name: string;
  elevation_dip_m: number;
  predicted_water_depth_cm: number;
  drainage_status: 'OPERATIONAL' | 'AT CAPACITY' | 'SURCHARGED' | 'CRITICAL' | string;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | string;
  mitigation_action: string;
}

export interface DrainageRunoffMetricItem {
  time_window: string;
  projected_rainfall_mm: number;
  runoff_volume_m3_per_hr: number;
  drainage_capacity_m3_per_hr: number;
  capacity_status: 'CLEAR' | 'NEAR CAPACITY' | 'SURCHARGED' | string;
}

export interface HeatIslandMetricItem {
  zone_name: string;
  canopy_cover_pct: number;
  impervious_surface_pct: number;
  ambient_temp_c: number;
  surface_temp_c: number;
  uhi_delta_c: number;
  vulnerability_rating: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | string;
}

export interface InfrastructureExposureItem {
  facility_name: string;
  facility_type: 'METRO_STATION' | 'HOSPITAL_ACCESS' | 'UNDERPASS' | 'PRIMARY_ARTERIAL' | 'POWER_SUBSTATION' | string;
  location_ward: string;
  exposure_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | string;
  operational_impact: string;
  recommended_action: string;
}

export interface UrbanWeatherIntelligenceData {
  location_name: string;
  latitude: number;
  longitude: number;
  urban_flood_risk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | string;
  rainfall_24h_mm: number;
  peak_rainfall_window: string;
  peak_intensity_mmh: number;
  critical_infrastructure_risk_count: number;
  surface_runoff_coefficient: number;
  drainage_capacity_utilization_pct: number;
  urban_heat_island_delta_c: number;
  surface_temperature_c: number;
  heat_stress_category: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME' | string;
  air_ventilation_index: 'GOOD' | 'MODERATE' | 'STAGNANT' | string;
  updated_at: string;
}

export interface UrbanPlannerBriefingResponse {
  success: boolean;
  location_name: string;
  timestamp: string;
  urban_intelligence: UrbanWeatherIntelligenceData;
  waterlogging_hotspots: WaterloggingHotspotItem[];
  drainage_timeline: DrainageRunoffMetricItem[];
  heat_island_zones: HeatIslandMetricItem[];
  infrastructure_exposure: InfrastructureExposureItem[];
  planning_recommendations: string[];
}
