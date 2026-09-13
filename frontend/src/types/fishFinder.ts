export type FishingPotentialLevel = 'high' | 'moderate' | 'avoid' | 'nodata';

export type MarineSafetyCode = 'favorable' | 'caution' | 'harbor_bound';

export interface FishingZoneProperties {
  zone_id: string;
  name: string;
  short_name: string;
  center: [number, number]; // [lat, lon]
  fishing_potential: FishingPotentialLevel;
  score: number;
  score_label: string;
  score_title: string;
  distance_km: number;
  distance_nm: number;
  depth_range: string;
  target_species: string;
  sst_c: number;
  chlorophyll_mg_m3: number;
  current_knots: number;
  current_direction: string;
  wind_kmh: number;
  wind_knots: number;
  wind_direction_deg: number;
  wave_height_m: number;
  rain_level: string;
  pfz_status: string;
  pfz_available: boolean;
  marine_safety_code: MarineSafetyCode;
  marine_safety_label: string;
  marine_safety_advisory: string;
  factor_evaluations: {
    sst?: string;
    chlorophyll?: string;
    current?: string;
    sea_conditions?: string;
    pfz?: string;
    [key: string]: string | undefined;
  };
  source_provenance: string;
  updated_at: string;
}

export interface FishingZoneFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][]; // [ [ [lon, lat], ... ] ]
  };
  properties: FishingZoneProperties;
}

export interface FishFinderFeatureCollection {
  type: 'FeatureCollection';
  features: FishingZoneFeature[];
}

export interface FishFinderSummary {
  total_zones: number;
  favorable_zones_count: number;
  high_count: number;
  moderate_count: number;
  avoid_count: number;
  overall_marine_status: string;
  overall_marine_code: MarineSafetyCode;
  overall_reason: string;
  active_warning?: {
    title: string;
    severity: string;
    description?: string;
    valid_until: string;
    source: string;
  } | null;
}

export interface CoastalConditions {
  wind_kmh: number;
  wave_height_m: number;
  sea_surface_temp_c: number;
  ocean_current_knots: number;
  rain_status: string;
  source: string;
}

export interface TimelineSlot {
  hour: number;
  label: string;
  potential: FishingPotentialLevel;
  score: number;
  wave_m: number;
  wind_kmh: number;
}

export interface PfzMetadata {
  source: string;
  dataset: string;
  validity: string;
  attribution: string;
}

export interface FishFinderData {
  success: boolean;
  location: {
    latitude: number;
    longitude: number;
    harbor_name: string;
    seaward_bearing: number;
  };
  date_filter: 'today' | 'tomorrow' | '3days';
  evaluated_time: string;
  time_label: string;
  feature_collection: FishFinderFeatureCollection;
  summary: FishFinderSummary;
  coastal_conditions: CoastalConditions;
  timeline_slots: TimelineSlot[];
  pfz_metadata: PfzMetadata;
}

export interface FishFinderLayerToggles {
  fishingPotential: boolean;
  pfz: boolean;
  sst: boolean;
  chlorophyll: boolean;
  currents: boolean;
  wind: boolean;
  waves: boolean;
  warnings: boolean;
}
