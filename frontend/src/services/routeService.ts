import { RouteAnalysisResponse, DepartureComparisonResponse } from '../types/route';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const routeService = {
  async analyzeRoute(params: {
    origin_lat: number;
    origin_lon: number;
    destination_lat: number;
    destination_lon: number;
    origin_name?: string;
    destination_name?: string;
    departure_time?: string;
    travel_date?: string;
    language?: string;
    user_id?: string;
  }): Promise<RouteAnalysisResponse> {
    const res = await fetch(`${API_BASE_URL}/api/route/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      throw new Error(`Route analysis failed: ${res.statusText}`);
    }
    return res.json();
  },

  async compareDepartureTimes(params: {
    origin_lat: number;
    origin_lon: number;
    destination_lat: number;
    destination_lon: number;
    origin_name?: string;
    destination_name?: string;
    travel_date?: string;
    candidate_times?: string[];
    language?: string;
  }): Promise<DepartureComparisonResponse> {
    const res = await fetch(`${API_BASE_URL}/api/route/compare-times`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      throw new Error(`Departure time comparison failed: ${res.statusText}`);
    }
    return res.json();
  },

  async setRouteAlert(payload: {
    user_id: string;
    origin_name: string;
    destination_name: string;
    alert_on_rain?: boolean;
    alert_on_thunderstorm?: boolean;
    alert_on_fog?: boolean;
    alert_on_severe?: boolean;
  }) {
    const res = await fetch(`${API_BASE_URL}/api/route/alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Set route alert failed: ${res.statusText}`);
    }
    return res.json();
  },
};
