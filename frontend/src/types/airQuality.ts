export type AirQualityCategory = 
  | 'GOOD' 
  | 'FAIR' 
  | 'MODERATE' 
  | 'POOR' 
  | 'VERY_POOR' 
  | 'EXTREMELY_POOR';

export type TrendDirection = 'IMPROVING' | 'STABLE' | 'WORSENING';

export interface PollutantItem {
  code: string;           // 'pm2_5', 'pm10', 'no2', 'o3', 'so2', 'co'
  name: string;           // 'PM2.5', 'PM10', 'Nitrogen Dioxide', etc.
  concentration: number;  // μg/m³
  unit: string;           // 'μg/m³'
  category: AirQualityCategory;
  category_label: string; // 'Good', 'Fair', etc.
  is_primary?: boolean;
  description?: string;
}

export interface CurrentAirQualityResponse {
  latitude: number;
  longitude: number;
  aqi: number;
  aqi_scale: string;      // e.g. "European AQI (CAMS)"
  category: AirQualityCategory;
  category_label: string;
  category_color: string;
  primary_pollutant: string;
  health_advisory: string;
  sensitive_group_advisory?: string | null;
  activity_recommendation?: string | null;
  weather_synergy_note?: string | null;
  pollutants: PollutantItem[];
  observed_at: string;
  data_source: string;
  attribution: string;
}

export interface HourlyAirQualityItem {
  time: string;
  aqi: number;
  category: AirQualityCategory;
  pm2_5?: number | null;
  pm10?: number | null;
  no2?: number | null;
  o3?: number | null;
  so2?: number | null;
  co?: number | null;
}

export interface HourlyAirQualityResponse {
  latitude: number;
  longitude: number;
  current_aqi: number;
  trend: TrendDirection;
  trend_summary: string;
  hourly: HourlyAirQualityItem[];
  data_source: string;
  attribution: string;
}
