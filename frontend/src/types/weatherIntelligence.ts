import { IMDAlert } from './alert';
import { WeatherLocationMeta, WeatherHourlyItem, WeatherDailyItem } from './weather';

export interface ProvenanceValue<T> {
  value: T | null;
  unit: string | null;
  source: string;
  observed_at?: string | null;
  retrieved_at?: string | null;
}

export interface CurrentIntelligence {
  temperature: ProvenanceValue<number>;
  feels_like: ProvenanceValue<number>;
  humidity: ProvenanceValue<number>;
  wind_speed: ProvenanceValue<number>;
  wind_direction: ProvenanceValue<string | number>;
  pressure: ProvenanceValue<number>;
  visibility: ProvenanceValue<number>;
  uv_index: ProvenanceValue<number>;
  precipitation: ProvenanceValue<number>;
  rain_probability: ProvenanceValue<number>;
  condition: string;
  icon: string;
  weather_code: number | null;
  observed_at: string;
}

export interface ForecastIntelligence {
  hourly: WeatherHourlyItem[];
  daily: WeatherDailyItem[];
  source: string;
}

export interface OfficialObservation {
  source: string;
  station_name?: string | null;
  station_code?: string | null;
  district?: string | null;
  subdivision?: string | null;
  state?: string | null;
  temperature?: number | null;
  humidity?: number | null;
  rainfall_past_24h?: number | null;
  forecast_summary?: string | null;
  observed_at?: string | null;
  attribution?: string;
}

export interface OfficialIntelligence {
  status: 'available' | 'unavailable' | 'partial' | string;
  observations: OfficialObservation[];
  advisories: any[];
  message?: string | null;
  attribution: string;
}

export type RiskLevel = 'low' | 'moderate' | 'high' | 'extreme';

export interface RiskItem {
  category: string;
  level: RiskLevel;
  score: number;
  reason: string;
  icon?: string;
}

export interface RiskAssessment {
  overall_level: RiskLevel;
  items: Record<string, RiskItem>;
  summary: string;
  disclaimer: string;
}

export type InsightCategory =
  | 'rain'
  | 'temperature'
  | 'wind'
  | 'uv'
  | 'visibility'
  | 'comfort'
  | 'advisory'
  | 'general';

export interface WeatherInsight {
  id: string;
  category: InsightCategory;
  headline: string;
  detail: string;
  icon: string;
  is_advisory: boolean;
}

export interface ConfidenceAssessment {
  score: number;
  level: 'low' | 'moderate' | 'high';
  agreement_level: 'good' | 'moderate' | 'low' | 'unverified';
  conflict_warnings: string[];
  factors: string[];
  note: string;
}

export interface ProviderStatusItem {
  provider: string;
  status: 'available' | 'degraded' | 'unavailable';
  latency_ms?: number | null;
  last_success?: string | null;
  error?: string | null;
}

export interface DataFreshness {
  observed_at?: string | null;
  retrieved_at: string;
  status: 'fresh' | 'recent' | 'stale';
  age_minutes: number;
}

export interface WeatherIntelligenceData {
  location: WeatherLocationMeta;
  current: CurrentIntelligence;
  forecast: ForecastIntelligence;
  official_information: OfficialIntelligence;
  alerts: IMDAlert[];
  risks: RiskAssessment;
  insights: WeatherInsight[];
  confidence: ConfidenceAssessment;
  source_status: Record<string, ProviderStatusItem>;
  data_freshness: DataFreshness;
  generated_at: string;
}

export interface WeatherIntelligenceResponse {
  success: boolean;
  data: WeatherIntelligenceData | null;
  message?: string | null;
}
