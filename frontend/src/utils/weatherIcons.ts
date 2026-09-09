/**
 * Utility to map WMO weather codes and normalized conditions to icons/emojis.
 */

export interface WeatherIconInfo {
  iconName: string;
  emoji: string;
}

export const getWeatherIconInfo = (weatherCode?: number | null, condition?: string): WeatherIconInfo => {
  const code = weatherCode ?? -1;
  const condLower = (condition || '').toLowerCase();

  // Thunderstorm
  if (code >= 95 || condLower.includes('thunder')) {
    return { iconName: 'cloud-lightning', emoji: '⛈️' };
  }
  // Snow
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86) || condLower.includes('snow')) {
    return { iconName: 'cloud-snow', emoji: '❄️' };
  }
  // Heavy Rain / Showers
  if (code === 65 || code === 67 || code === 82 || condLower.includes('heavy rain')) {
    return { iconName: 'cloud-rain-wind', emoji: '🌧️' };
  }
  // Moderate / Light Rain / Drizzle / Showers
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || condLower.includes('rain') || condLower.includes('drizzle') || condLower.includes('shower')) {
    return { iconName: 'cloud-drizzle', emoji: '🌦️' };
  }
  // Fog
  if (code === 45 || code === 48 || condLower.includes('fog')) {
    return { iconName: 'cloud-fog', emoji: '🌫️' };
  }
  // Overcast / Cloudy
  if (code === 3 || condLower.includes('overcast') || condLower.includes('cloudy')) {
    return { iconName: 'cloud', emoji: '☁️' };
  }
  // Partly Cloudy / Mainly Clear
  if (code === 1 || code === 2 || condLower.includes('partly') || condLower.includes('mainly clear')) {
    return { iconName: 'cloud-sun', emoji: '⛅' };
  }
  // Clear / Sun
  return { iconName: 'sun', emoji: '☀️' };
};
