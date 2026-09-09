/**
 * BackgroundProvider — WeatherGPT Step 8
 * Dynamic, location-aware, role-aware, and weather-condition-aware background engine.
 * Selects curated urban/neighborhood imagery with blue weather overlays for Citizen mode.
 */

export interface BackgroundQuery {
  role?: string;
  location?: string;
  weatherCondition?: string;
  isNight?: boolean;
}

export interface WeatherBackgroundResult {
  role: string;
  location: string;
  condition: string;
  theme: string;
  backgroundUrl: string;
  overlay: string;
  altText: string;
}

// Curated high-resolution Unsplash images organized by City/Region and Weather Condition
const URBAN_CITY_BACKGROUNDS: Record<string, Record<string, string>> = {
  pune: {
    clear: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1600&q=80',
    cloudy: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1600&q=80',
    rain: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=1600&q=80',
    storm: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1600&q=80',
    night: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1600&q=80',
    default: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1600&q=80',
  },
  kalyan: {
    clear: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1600&q=80',
    cloudy: 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&w=1600&q=80',
    rain: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=1600&q=80',
    storm: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=1600&q=80',
    night: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1600&q=80',
    default: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1600&q=80',
  },
  mumbai: {
    clear: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=1600&q=80',
    cloudy: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
    rain: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1600&q=80',
    storm: 'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&w=1600&q=80',
    night: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1600&q=80',
    default: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=1600&q=80',
  },
  nashik: {
    clear: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80',
    cloudy: 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&w=1600&q=80',
    rain: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=1600&q=80',
    storm: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1600&q=80',
    night: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1600&q=80',
    default: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80',
  },
  delhi: {
    clear: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1600&q=80',
    cloudy: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1600&q=80',
    rain: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=1600&q=80',
    storm: 'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&w=1600&q=80',
    night: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1600&q=80',
    default: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1600&q=80',
  },
  kochi: {
    clear: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80',
    cloudy: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
    rain: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1600&q=80',
    storm: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1600&q=80',
    night: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1600&q=80',
    default: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80',
  },
};

// Generic fallback citizen urban images by condition
const GENERIC_CITIZEN_BACKGROUNDS: Record<string, string> = {
  clear: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1600&q=80',
  cloudy: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1600&q=80',
  rain: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=1600&q=80',
  storm: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1600&q=80',
  night: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1600&q=80',
  default: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1600&q=80',
};

// Section 8: Citizen Background Color Overlays
const CITIZEN_OVERLAYS: Record<string, string> = {
  clear: 'from-blue-950/85 via-blue-900/55 to-sky-700/35',
  cloudy: 'from-slate-950/85 via-blue-900/60 to-slate-800/40',
  rain: 'from-blue-950/90 via-blue-900/70 to-indigo-950/50',
  storm: 'from-slate-950/92 via-navy-950/80 to-blue-950/60',
  night: 'from-slate-950/90 via-blue-950/75 to-indigo-950/55',
  default: 'from-blue-950/85 via-blue-900/60 to-sky-800/40',
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
 * Resolves dynamic background imagery according to Section 10:
 * getWeatherBackground({ role, location, weatherCondition, isNight })
 */
export function getWeatherBackground(query: BackgroundQuery): WeatherBackgroundResult {
  const role = (query.role || 'citizen').toLowerCase().trim();
  const rawLoc = (query.location || '').toLowerCase().trim();
  const normalizedCondition = normalizeWeatherCondition(query.weatherCondition, query.isNight);

  // 1. Identify city key (support sub-district / district matches)
  let cityKey = '';
  for (const knownCity of Object.keys(URBAN_CITY_BACKGROUNDS)) {
    if (rawLoc.includes(knownCity)) {
      cityKey = knownCity;
      break;
    }
  }

  // 2. Select image URL
  let backgroundUrl = '';
  if (cityKey && URBAN_CITY_BACKGROUNDS[cityKey]) {
    const cityImages = URBAN_CITY_BACKGROUNDS[cityKey];
    backgroundUrl = cityImages[normalizedCondition] || cityImages.default || cityImages.clear;
  }

  // Fallback to generic citizen urban condition
  if (!backgroundUrl) {
    backgroundUrl =
      GENERIC_CITIZEN_BACKGROUNDS[normalizedCondition] ||
      GENERIC_CITIZEN_BACKGROUNDS.default;
  }

  // 3. Citizen Theme Overlay (Section 8)
  const overlayClasses = CITIZEN_OVERLAYS[normalizedCondition] || CITIZEN_OVERLAYS.default;

  const displayLocation = query.location ? query.location.split(',')[0].trim() : 'Local Environment';

  return {
    role,
    location: displayLocation,
    condition: normalizedCondition,
    theme: 'blue',
    backgroundUrl,
    overlay: `bg-gradient-to-t ${overlayClasses}`,
    altText: `${displayLocation} ${normalizedCondition} atmosphere for ${role} view`,
  };
}
