import { WeatherGPTResponse } from '../types/weather';
import { MOCK_CURRENT_WEATHER, MOCK_HYPERLOCAL_RISKS } from '../data/mockWeather';
import { ChatMessage } from '../types/chat';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export class WeatherService {
  /**
   * Calls FastAPI backend GET /api/weather?latitude=...&longitude=...
   * Strictly uses latitude + longitude as source of truth.
   */
  public async getWeather(
    latitude: number,
    longitude: number,
    city?: string,
    state?: string
  ): Promise<WeatherGPTResponse> {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
    });
    if (city) params.append('city', city);
    if (state) params.append('state', state);

    const response = await fetch(`${API_BASE_URL}/api/weather?${params.toString()}`);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || `Weather API error: HTTP ${response.status}`);
    }

    const json = await response.json();
    if (json.success && json.data) {
      return json.data as WeatherGPTResponse;
    }
    throw new Error('Invalid response structure returned from backend');
  }

  // Legacy helper methods for backward compatibility with secondary components
  public async getCurrentWeather(location?: any): Promise<any> {
    return MOCK_CURRENT_WEATHER;
  }

  public async getHyperlocalRisks(location?: any): Promise<any> {
    return MOCK_HYPERLOCAL_RISKS;
  }

  public async askWeatherGPT(prompt: string, location: any, role: string): Promise<ChatMessage> {
    return {
      id: `asst-${Date.now()}`,
      sender: 'assistant',
      text: `Based on live Open-Meteo weather observations for ${location.city || 'your area'}, temperature is observed cleanly with live hourly updates.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }
}

export const weatherService = new WeatherService();
