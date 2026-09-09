import { WeatherIntelligenceData, WeatherIntelligenceResponse } from '../types/weatherIntelligence';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export class WeatherIntelligenceService {
  /**
   * Calls FastAPI backend GET /api/weather/intelligence?latitude=...&longitude=...
   * Strictly uses exact coordinates as source of truth.
   */
  public async getWeatherIntelligence(
    latitude: number,
    longitude: number,
    city?: string,
    district?: string,
    state?: string
  ): Promise<WeatherIntelligenceData> {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
    });
    if (city) params.append('city', city);
    if (district) params.append('district', district);
    if (state) params.append('state', state);

    const response = await fetch(`${API_BASE_URL}/api/weather/intelligence?${params.toString()}`);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || `Weather Intelligence API error: HTTP ${response.status}`);
    }

    const json: WeatherIntelligenceResponse = await response.json();
    if (json.success && json.data) {
      return json.data;
    }
    throw new Error(json.message || 'Invalid weather intelligence structure returned from backend');
  }
}

export const weatherIntelligenceService = new WeatherIntelligenceService();
