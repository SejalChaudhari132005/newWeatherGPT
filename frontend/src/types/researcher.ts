/**
 * TypeScript definitions for WeatherLab / Researcher Intelligence.
 */

export interface NWPModelData {
  model_name: string;
  temperature_c: number;
  rainfall_prob_pct: number;
  rainfall_mm_24h: number;
  wind_speed_kmh: number;
  humidity_pct: number;
  pressure_hpa: number;
  hourly_series: {
    date: string;
    temp: number;
    rain: number;
    wind: number;
    humidity: number;
  }[];
}

export interface NWPComparisonResponse {
  location_name: string;
  latitude: number;
  longitude: number;
  forecast_period: string;
  models: {
    GFS: NWPModelData;
    ECMWF: NWPModelData;
    IMD_WRF: NWPModelData;
    [key: string]: NWPModelData;
  };
  consensus_level: 'High' | 'Moderate' | 'Low' | string;
  consensus_summary: string;
  disagreement_analysis: string;
  uncertainty_rating: 'Low' | 'Moderate' | 'High' | string;
  uncertainty_explanation: string;
  timeline_dates: string[];
  generated_at: string;
}

export interface ClimateAnomalyMetrics {
  location_name: string;
  baseline_period: string;
  current_temp_c: number;
  current_temp_anomaly_c: number;
  rainfall_season_mm: number;
  rainfall_anomaly_pct: number;
  extreme_events_count_ytd: number;
  historical_trend_points: {
    year: number;
    anomaly_c: number;
    baseline: number;
  }[];
  summary: string;
}

export interface DatasetItem {
  id: string;
  name: string;
  coverage: string;
  resolution: string;
  period: string;
  format: string;
  source: string;
  file_size_mb?: number;
  download_url?: string;
  parameters: string[];
}

export interface ResearchReportRequest {
  title: string;
  report_type: string;
  location_name: string;
  latitude?: number;
  longitude?: number;
  period: string;
  parameters: string[];
  include_maps: boolean;
  include_charts: boolean;
  include_nwp: boolean;
  include_findings: boolean;
  custom_notes?: string;
}

export interface ResearchReportData {
  report_id: string;
  title: string;
  report_type: string;
  location_name: string;
  generated_at: string;
  executive_summary: string;
  study_area: string;
  data_sources: { name: string; type: string }[];
  methodology: string;
  statistical_summary: Record<string, any>;
  nwp_intercomparison?: Record<string, any>;
  climate_trends?: Record<string, any>;
  key_findings: string[];
  limitations: string[];
  citations: string[];
}

export interface WeatherLabSummary {
  success: boolean;
  location_name: string;
  timestamp: string;
  nwp_comparison: NWPComparisonResponse;
  climate_anomalies: ClimateAnomalyMetrics;
  available_datasets: DatasetItem[];
  recent_reports: {
    id: string;
    title: string;
    date: string;
    format: string;
    size: string;
  }[];
  active_layers: string[];
}
