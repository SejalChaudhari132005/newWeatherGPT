import { MapLayersResponse, RadarStation } from '../types/radar';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export interface RadarFrameItem {
  time: number;
  path: string;
  iso?: string;
  is_nowcast?: boolean;
}

export interface RadarFramesResponse {
  success: boolean;
  provider: string;
  host: string;
  generatedAt: number;
  tilePattern: string;
  frames: RadarFrameItem[];
  latestFrame: RadarFrameItem | null;
  totalFrames: number;
  satelliteFrames: { time: number; path: string; tileUrl: string }[];
  attribution: string;
  message?: string;
}

export interface RadarLayer {
  id: 'rain' | 'cloud' | 'wind' | 'lightning' | 'temperature';
  label: string;
}

export const RADAR_LAYERS: RadarLayer[] = [
  { id: 'rain', label: 'Rainfall Radar' },
  { id: 'cloud', label: 'Cloud Cover' },
  { id: 'wind', label: 'Wind Vector' },
  { id: 'lightning', label: 'Thunder & Lightning' },
  { id: 'temperature', label: 'Surface Temp' },
];

export const TIMELINE_SLOTS: string[] = [
  '-2 hrs',
  '-1.5 hrs',
  '-1 hr',
  '-30 min',
  'Now (Live)',
  '+30 min',
  '+1 hr',
];


export const radarService = {
  async getRadarData(latitude: number, longitude: number): Promise<{ success: boolean; radar: RadarStation }> {
    const res = await fetch(`${API_BASE_URL}/api/weather/radar?latitude=${latitude}&longitude=${longitude}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch radar data: ${res.statusText}`);
    }
    return res.json();
  },

  async getRadarFrames(): Promise<RadarFramesResponse> {
    const res = await fetch(`${API_BASE_URL}/api/radar/frames`);
    if (!res.ok) {
      throw new Error(`Failed to fetch radar frames: ${res.statusText}`);
    }
    return res.json();
  },

  async getMapLayers(latitude: number, longitude: number): Promise<MapLayersResponse> {
    const res = await fetch(`${API_BASE_URL}/api/map/layers?latitude=${latitude}&longitude=${longitude}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch map layers: ${res.statusText}`);
    }
    return res.json();
  },

  async getSatelliteData(latitude: number, longitude: number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/map/satellite?latitude=${latitude}&longitude=${longitude}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch satellite data: ${res.statusText}`);
    }
    return res.json();
  },

  async getRegionalGrid(latitude: number, longitude: number): Promise<{
    success: boolean;
    center: { latitude: number; longitude: number };
    total_points: number;
    points: Array<{
      name: string;
      latitude: number;
      longitude: number;
      temperature: number;
      apparent_temperature: number;
      precipitation: number;
      rain: number;
      humidity: number;
      wind_speed: number;
      wind_direction: number;
      weather_code: number;
    }>;
    timestamp: number;
  }> {
    const res = await fetch(`${API_BASE_URL}/api/radar/regional-grid?latitude=${latitude}&longitude=${longitude}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch regional grid: ${res.statusText}`);
    }
    return res.json();
  },
};

