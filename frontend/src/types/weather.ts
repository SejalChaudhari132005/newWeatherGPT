import { UserLocation } from './location';
import { IMDAlert } from './alert';

export type { UserLocation, IMDAlert };

export type WeatherCondition =
  | 'Sunny'
  | 'Partly Cloudy'
  | 'Cloudy'
  | 'Overcast'
  | 'Light Rain'
  | 'Moderate Rain'
  | 'Heavy Rain'
  | 'Thunderstorm'
  | 'Showers'
  | string;

export interface WeatherLocationMeta {
  latitude: number;
  longitude: number;
  city: string;
  district: string;
  state: string;
  country: string;
  source?: string;
  imd_station?: string;
  imd_subdivision?: string;
}

export interface WeatherCurrent {
  temperature: number | null;
  feels_like: number | null;
  humidity: number | null;
  rain_probability: number | null;
  precipitation: number | null;
  wind_speed: number | null;
  wind_direction: string | null;
  visibility: number | null;
  pressure: number | null;
  uv_index: number | null;
  condition: string;
  icon: string;
  weather_code: number | null;
  observed_at: string | null;
  source?: string;
}

export interface WeatherHourlyItem {
  time: string;
  iso_time?: string;
  temp: number;
  condition: string;
  icon: string;
  rainProb: number;
  highlight?: boolean;
  source?: string;
}

export interface WeatherDailyItem {
  day: string;
  date: string;
  high: number;
  low: number;
  condition: string;
  icon: string;
  rainProbability: number;
  rainProb?: number;
  humidity: number;
  source?: string;
}

export interface WeatherSourceMeta {
  provider: string;
  retrieved_at: string | null;
  is_cached?: boolean;
}

export interface IMDOfficialInformation {
  source: string;
  status: 'available' | 'unavailable' | string;
  station_name?: string | null;
  station_code?: string | null;
  district?: string | null;
  subdivision?: string | null;
  observed_at?: string | null;
  temperature?: number | null;
  humidity?: number | null;
  rainfall_past_24h?: number | null;
  forecast_summary?: string | null;
  attribution?: string;
  message?: string | null;
}

export interface WeatherGPTResponse {
  location: WeatherLocationMeta;
  current: WeatherCurrent;
  hourly: WeatherHourlyItem[];
  daily: WeatherDailyItem[];
  source: WeatherSourceMeta;
  official_information?: IMDOfficialInformation;
  alerts?: IMDAlert[];
}

// Legacy interfaces retained for backward compatibility with secondary components
export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  visibility: number;
  pressure: number;
  uvIndex: number;
  rainProbability: number;
  updatedAt: string;
  highTemp?: number;
  lowTemp?: number;
  airQualityIndex?: number;
  airQualityLabel?: string;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  condition: string;
  rainProbability: number;
  isHighRisk?: boolean;
}

export interface DailyForecast {
  day: string;
  date: string;
  high: number;
  low: number;
  condition: string;
  rainProbability: number;
  humidity: number;
}

export interface HyperlocalRisk {
  areaName: string;
  distanceKm: number;
  rainRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  waterloggingRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  lightning: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  wind: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  temperature: number;
}
