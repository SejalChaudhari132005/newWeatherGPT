import { CurrentAirQualityResponse, HourlyAirQualityResponse } from '../types/airQuality';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export class AirQualityService {
  /**
   * Fetches current Air Quality data and citizen interpretation
   * Uses exact latitude and longitude
   */
  public async getCurrentAirQuality(
    latitude: number,
    longitude: number,
    city?: string,
    state?: string
  ): Promise<CurrentAirQualityResponse> {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
    });
    if (city) params.append('city', city);
    if (state) params.append('state', state);

    const response = await fetch(`${API_BASE_URL}/api/air-quality/current?${params.toString()}`);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || `Air Quality API error: HTTP ${response.status}`);
    }

    const json = await response.json();
    if (json.success) {
      // Map response to CurrentAirQualityResponse interface
      const data = json.air_quality || {};
      const interp = json.interpretation || {};
      const loc = json.location || {};

      return {
        latitude: loc.latitude ?? latitude,
        longitude: loc.longitude ?? longitude,
        aqi: data.aqi ?? 0,
        aqi_scale: data.aqi_scale || 'European AQI (CAMS)',
        category: (interp.category || data.category || 'UNKNOWN') as any,
        category_label: interp.category_label || data.category_label || 'Unknown',
        category_color: this.getCategoryColor(interp.category || data.category),
        primary_pollutant: interp.primary_pollutant_name || data.primary_pollutant_name || 'Particulate Matter',
        health_advisory: interp.outdoor_advisory || 'Air quality status is monitored.',
        sensitive_group_advisory: interp.sensitive_group_advisory,
        activity_recommendation: interp.outdoor_advisory,
        weather_synergy_note: interp.combined_weather_note,
        pollutants: (data.pollutants || []).map((p: any) => ({
          code: p.code,
          name: p.name,
          concentration: p.value ?? 0,
          unit: p.unit || 'μg/m³',
          category: p.category,
          category_label: p.category_label,
          description: p.description,
        })),
        observed_at: data.timestamp || json.updated_at || new Date().toISOString(),
        data_source: json.source || 'Open-Meteo / CAMS European Model',
        attribution: 'Open-Meteo & Copernicus Atmosphere Monitoring Service (CAMS)',
      };
    }
    throw new Error('Invalid air quality response structure returned from backend');
  }

  /**
   * Fetches 24-hour Air Quality trend & hourly data
   */
  public async getHourlyAirQuality(
    latitude: number,
    longitude: number,
    hours: number = 24
  ): Promise<HourlyAirQualityResponse> {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      hours: hours.toString(),
    });

    const response = await fetch(`${API_BASE_URL}/api/air-quality/hourly?${params.toString()}`);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || `Air Quality hourly API error: HTTP ${response.status}`);
    }

    const json = await response.json();
    if (json.success) {
      const loc = json.location || {};
      return {
        latitude: loc.latitude ?? latitude,
        longitude: loc.longitude ?? longitude,
        current_aqi: json.hours && json.hours.length > 0 ? (json.hours[0].aqi ?? 0) : 0,
        trend: json.trend || 'STABLE',
        trend_summary: json.trend_summary || 'Air quality levels are stable.',
        hourly: (json.hours || []).map((h: any) => ({
          time: h.hour_label || h.time,
          aqi: h.aqi ?? 0,
          category: h.category,
          pm2_5: h.pm2_5,
          pm10: h.pm10,
          no2: h.no2,
          o3: h.o3,
          so2: h.so2,
          co: h.co,
        })),
        data_source: json.source || 'Open-Meteo / CAMS European Model',
        attribution: 'Open-Meteo & Copernicus Atmosphere Monitoring Service (CAMS)',
      };
    }
    throw new Error('Invalid air quality hourly response structure returned from backend');
  }

  public getCategoryColor(category?: string): string {
    switch (category?.toUpperCase()) {
      case 'GOOD':
        return '#10B981'; // Emerald 500
      case 'FAIR':
        return '#84CC16'; // Lime 500
      case 'MODERATE':
        return '#F59E0B'; // Amber 500
      case 'POOR':
        return '#F97316'; // Orange 500
      case 'VERY_POOR':
        return '#EF4444'; // Red 500
      case 'EXTREMELY_POOR':
        return '#7C3AED'; // Purple 600
      default:
        return '#6B7280'; // Gray 500
    }
  }

  public getCategoryBadgeStyle(category?: string): { bg: string; text: string; border: string } {
    switch (category?.toUpperCase()) {
      case 'GOOD':
        return { bg: '#10B981', text: '#FFFFFF', border: '#059669' };
      case 'FAIR':
        return { bg: '#84CC16', text: '#FFFFFF', border: '#65A30D' };
      case 'MODERATE':
        return { bg: '#F59E0B', text: '#FFFFFF', border: '#D97706' };
      case 'POOR':
        return { bg: '#F97316', text: '#FFFFFF', border: '#EA580C' };
      case 'VERY_POOR':
        return { bg: '#EF4444', text: '#FFFFFF', border: '#DC2626' };
      case 'EXTREMELY_POOR':
        return { bg: '#7C3AED', text: '#FFFFFF', border: '#6D28D9' };
      default:
        return { bg: '#64748B', text: '#FFFFFF', border: '#475569' };
    }
  }
}

export const airQualityService = new AirQualityService();
