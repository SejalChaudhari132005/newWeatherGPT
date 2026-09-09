import { CitizenAlert, IMDAlert, UserAlertPreferences, CurrentAlertsResponse } from '../types/alert';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export class AlertService {
  /**
   * Fetches active, evaluated weather alerts for exact coordinates.
   */
  public async getCurrentAlerts(
    latitude: number,
    longitude: number,
    city?: string,
    district?: string,
    state?: string,
    userId?: string,
    language?: string
  ): Promise<CurrentAlertsResponse> {
    try {
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      });
      if (city) params.append('city', city);
      if (district) params.append('district', district);
      if (state) params.append('state', state);
      if (userId) params.append('user_id', userId);
      if (language) params.append('language', language);

      const res = await fetch(`${API_BASE_URL}/api/alerts/current?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Alerts fetch failed HTTP ${res.status}`);
      }
      const data = await res.json();
      return data as CurrentAlertsResponse;
    } catch (err) {
      console.warn('[AlertService] getCurrentAlerts error:', err);
      return {
        success: false,
        location: { latitude, longitude, city, district, state },
        active_count: 0,
        alerts: [],
        top_alert: null,
        summary_message: '✓ No active severe weather warnings',
        evaluated_at: new Date().toISOString(),
      };
    }
  }

  /**
   * Fetches historical and recent alerts from Supabase.
   */
  public async getAlertHistory(
    latitude: number,
    longitude: number,
    city?: string,
    userId?: string,
    limit: number = 20
  ): Promise<CitizenAlert[]> {
    try {
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        limit: limit.toString(),
      });
      if (city) params.append('city', city);
      if (userId) params.append('user_id', userId);

      const res = await fetch(`${API_BASE_URL}/api/alerts/history?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        return json.history || [];
      }
    } catch (err) {
      console.warn('[AlertService] getAlertHistory error:', err);
    }
    return [];
  }

  /**
   * Fetches a single alert by ID.
   */
  public async getAlertById(alertId: string): Promise<CitizenAlert | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/alerts/${alertId}`);
      if (res.ok) {
        const json = await res.json();
        return json.alert || null;
      }
    } catch (err) {
      console.warn('[AlertService] getAlertById error:', err);
    }
    return null;
  }

  /**
   * Marks an alert as read.
   */
  public async markAlertAsRead(alertId: string, userId?: string): Promise<boolean> {
    try {
      const params = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
      const res = await fetch(`${API_BASE_URL}/api/alerts/${alertId}/read${params}`, {
        method: 'PATCH',
      });
      return res.ok;
    } catch (err) {
      console.warn('[AlertService] markAlertAsRead error:', err);
      return false;
    }
  }

  /**
   * Fetches user alert preferences.
   */
  public async getUserPreferences(userId: string): Promise<UserAlertPreferences | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/alert-preferences?user_id=${encodeURIComponent(userId || 'anonymous')}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('[AlertService] getUserPreferences error:', err);
    }
    return null;
  }

  /**
   * Updates user alert preferences.
   */
  public async updateUserPreferences(
    userId: string,
    updates: Partial<UserAlertPreferences>
  ): Promise<UserAlertPreferences | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/alert-preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, ...updates }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('[AlertService] updateUserPreferences error:', err);
    }
    return null;
  }

  /**
   * Legacy official IMD endpoint
   */
  public async getActiveIMDAlerts(
    latitude: number,
    longitude: number,
    city?: string,
    district?: string,
    state?: string
  ): Promise<IMDAlert[]> {
    try {
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      });
      if (city) params.append('city', city);
      if (district) params.append('district', district);
      if (state) params.append('state', state);

      const response = await fetch(`${API_BASE_URL}/api/alerts?${params.toString()}`);
      if (response.ok) {
        const json = await response.json();
        return json.alerts || [];
      }
    } catch (err) {
      console.warn('[AlertService] getActiveIMDAlerts error:', err);
    }
    return [];
  }
}

export const alertService = new AlertService();
