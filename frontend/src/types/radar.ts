export interface RadarStation {
  radar_id: string;
  station_name: string;
  city: string;
  state: string;
  radar_latitude: number;
  radar_longitude: number;
  distance_from_user_km: number;
  coverage_radius_km: number;
  is_within_coverage: boolean;
  status: string;
  product_name: string;
  imagery_url: string;
  radar_timestamp: string;
  source: string;
  attribution: string;
}

export interface MapLayersResponse {
  success: boolean;
  coordinates: { latitude: number; longitude: number };
  radar: RadarStation;
  all_radar_stations: {
    id: string;
    name: string;
    city: string;
    state: string;
    latitude: number;
    longitude: number;
    status: string;
  }[];
  supported_layers: {
    id: string;
    name: string;
    enabled: boolean;
    source: string;
  }[];
}
