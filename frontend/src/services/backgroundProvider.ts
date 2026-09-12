/**
 * BackgroundProvider — WeatherGPT
 * Dynamic, location-aware, landmark-aware, role-aware, and weather-condition-aware background engine.
 * Selects curated landmark imagery with subtle overlays for Citizen mode.
 */

import { getLandmarkForLocation } from './locationImageService';

export interface BackgroundQuery {
  role?: string;
  location?: string;
  weatherCondition?: string;
  isNight?: boolean;
}

export interface WeatherBackgroundResult {
  role: string;
  location: string;
  landmark: string;
  condition: string;
  theme: string;
  backgroundUrl: string;
  overlay: string;
  altText: string;
}

// Subtle, transparent dark/gradient overlays to keep landmark photo clear & vibrant while making text readable
const CITIZEN_OVERLAYS: Record<string, string> = {
  clear: 'from-slate-950/80 via-slate-900/40 to-transparent',
  cloudy: 'from-slate-950/85 via-slate-900/45 to-transparent',
  rain: 'from-slate-950/90 via-blue-950/50 to-transparent',
  storm: 'from-slate-950/92 via-slate-900/55 to-transparent',
  night: 'from-slate-950/90 via-slate-950/60 to-transparent',
  default: 'from-slate-950/80 via-slate-900/40 to-transparent',
};

/**
 * Normalizes raw weather condition string into standardized category:
 * 'clear' | 'cloudy' | 'rain' | 'storm' | 'night'
 */
export function normalizeWeatherCondition(conditionStr?: string, isNight?: boolean): string {
  if (isNight) return 'night';
  if (!conditionStr) return 'clear';

  const c = conditionStr.toLowerCase();
  if (c.includes('thunder') || c.includes('storm') || c.includes('cyclone') || c.includes('squall')) {
    return 'storm';
  }
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower') || c.includes('downpour')) {
    return 'rain';
  }
  if (c.includes('cloud') || c.includes('overcast') || c.includes('fog') || c.includes('mist') || c.includes('haze')) {
    return 'cloudy';
  }
  return 'clear';
}

/**
 * Resolves dynamic background imagery according to location GPS / query
 */
export function getWeatherBackground(query: BackgroundQuery): WeatherBackgroundResult {
  const role = (query.role || 'citizen').toLowerCase().trim();
  const rawLoc = (query.location || '').trim();
  const normalizedCondition = normalizeWeatherCondition(query.weatherCondition, query.isNight);

  const landmarkInfo = getLandmarkForLocation(rawLoc);
  const overlayClasses = CITIZEN_OVERLAYS[normalizedCondition] || CITIZEN_OVERLAYS.default;
  const displayLocation = rawLoc ? rawLoc.split(',')[0].trim() : 'New Delhi';

  return {
    role,
    location: displayLocation,
    landmark: landmarkInfo.landmark,
    condition: normalizedCondition,
    theme: 'blue',
    backgroundUrl: landmarkInfo.url,
    overlay: `bg-gradient-to-t ${overlayClasses}`,
    altText: `${landmarkInfo.landmark} for ${displayLocation}`,
  };
}
