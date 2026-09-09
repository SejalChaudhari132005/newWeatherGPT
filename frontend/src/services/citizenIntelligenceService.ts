/**
 * CitizenIntelligenceService — WeatherGPT Step 8
 * Synthesizes dynamic, verified Citizen intelligence cards:
 * - Outdoor Plan (Umbrella, walking, outdoor plans)
 * - Commute Safety (Roadways, visibility, rain impact)
 * - Weather Advice (UV protection, hydration, clothing)
 * - Official Warning (Prominent IMD alert)
 * - Outdoor Suitability (Event planning: GOOD / MODERATE / POOR)
 */

import { WeatherIntelligenceData } from '../types/weatherIntelligence';

export interface CitizenCard {
  id: string;
  category: 'Official Warning' | 'Outdoor Plan' | 'Commute Safety' | 'Weather Advice' | 'Outdoor Suitability';
  icon: string;
  status: 'good' | 'warning' | 'critical' | 'caution';
  title: string;
  message: string;
  detail?: string;
  actionPrompt?: string;
  priority: number;
}

export interface CitizenIntelligenceResult {
  role: 'citizen';
  summary: string;
  cards: CitizenCard[];
  outdoorSuitability: {
    status: 'GOOD' | 'MODERATE' | 'POOR';
    label: string;
    summary: string;
    reasons: string[];
  };
  warningPresent: boolean;
}

export function synthesizeCitizenIntelligence(data: WeatherIntelligenceData): CitizenIntelligenceResult {
  const curr = data.current;
  const temp = curr.temperature?.value ?? 25.0;
  const feelsLike = curr.feels_like?.value ?? temp;
  const rainProb = curr.rain_probability?.value ?? 0.0;
  const wind = curr.wind_speed?.value ?? 10.0;
  const vis = curr.visibility?.value ?? 10.0;
  const uv = curr.uv_index?.value ?? 0.0;
  const humidity = curr.humidity?.value ?? 60.0;
  const condition = curr.condition || 'Mainly Clear';
  const city = data.location.city || 'your area';

  // Check today forecast rain probability
  let forecastRainProb = rainProb;
  if (data.forecast?.daily && data.forecast.daily.length > 0) {
    const todayDaily = data.forecast.daily[0];
    const dailyRain = todayDaily.rainProbability ?? todayDaily.rainProb;
    if (dailyRain != null) {
      forecastRainProb = Math.max(rainProb, dailyRain);
    }
  }

  const cards: CitizenCard[] = [];

  // 1. Official Weather Warning (Highest Priority per Section 17)
  let warningPresent = false;
  if (data.alerts && data.alerts.length > 0) {
    const topAlert = data.alerts[0];
    warningPresent = true;
    cards.push({
      id: 'official_warning',
      category: 'Official Warning',
      icon: 'AlertTriangle',
      status: 'critical',
      title: '⚠️ OFFICIAL WEATHER WARNING',
      message: `${topAlert.title}. Source: ${topAlert.source || 'IMD'}. Follow instructions from local authorities.`,
      detail: topAlert.description || `Valid for ${topAlert.affected_area || city}.`,
      actionPrompt: `Explain the official ${topAlert.source || 'IMD'} warning active in ${city} and safety steps`,
      priority: 1,
    });
  }

  // 2. Outdoor Plan Card (Section 15 & 16: Only show umbrella when relevant)
  if (forecastRainProb >= 40.0) {
    const isHeavy = forecastRainProb >= 75.0;
    cards.push({
      id: 'outdoor_plan',
      category: 'Outdoor Plan',
      icon: 'CloudRain',
      status: isHeavy ? 'warning' : 'caution',
      title: '🌧 OUTDOOR PLAN',
      message: isHeavy
        ? `Carry an umbrella or raincoat today. Rain probability is elevated at ${Math.round(forecastRainProb)}% in ${city}.`
        : `Carry an umbrella if you're heading out later today. Rain probability is around ${Math.round(forecastRainProb)}%.`,
      detail: 'Showers may affect outdoor activities and open-air plans.',
      actionPrompt: `Should I carry an umbrella today in ${city}?`,
      priority: 2,
    });
  } else if (temp >= 36.0) {
    cards.push({
      id: 'outdoor_plan',
      category: 'Outdoor Plan',
      icon: 'Sun',
      status: 'caution',
      title: '☀️ OUTDOOR PLAN',
      message: `High daytime heat of ${temp.toFixed(1)}°C in ${city}. Avoid strenuous outdoor plans during peak afternoon hours.`,
      detail: 'Plan outdoor exercise or walks for early morning or after sunset.',
      actionPrompt: `Is it safe to go for an outdoor workout in this heat in ${city}?`,
      priority: 2,
    });
  } else {
    cards.push({
      id: 'outdoor_plan',
      category: 'Outdoor Plan',
      icon: 'CheckCircle2',
      status: 'good',
      title: '🌿 OUTDOOR PLAN',
      message: `Great conditions for walking and outdoor plans in ${city}. Skies are ${condition.toLowerCase()} with low rain chance (${Math.round(forecastRainProb)}%).`,
      detail: `Favorable atmospheric comfort with mild ${wind.toFixed(0)} km/h breeze.`,
      actionPrompt: `Can I go for a walk this evening in ${city}?`,
      priority: 2,
    });
  }

  // 3. Commute Safety Card (Section 15 & 16: Only show advisory when relevant)
  if (vis < 3.0) {
    cards.push({
      id: 'commute_safety',
      category: 'Commute Safety',
      icon: 'Eye',
      status: vis < 1.0 ? 'critical' : 'warning',
      title: '🚗 COMMUTE SAFETY',
      message: `Reduced visibility down to ${vis.toFixed(1)} km due to ${condition.toLowerCase()}. Drive with headlights and allow extra travel time.`,
      detail: 'Low visibility roadway alert. Keep safe following distance.',
      actionPrompt: `Is it safe to drive right now in ${city}?`,
      priority: 3,
    });
  } else if (forecastRainProb >= 50.0) {
    cards.push({
      id: 'commute_safety',
      category: 'Commute Safety',
      icon: 'Car',
      status: 'warning',
      title: '🚗 COMMUTE SAFETY',
      message: `Rain may reduce road traction and visibility during the commute in ${city}.`,
      detail: 'Allow extra buffer time for traffic delays and wet roadways.',
      actionPrompt: `Will rain affect my commute this evening in ${city}?`,
      priority: 3,
    });
  } else if (wind >= 35.0) {
    cards.push({
      id: 'commute_safety',
      category: 'Commute Safety',
      icon: 'Wind',
      status: 'caution',
      title: '🚗 COMMUTE SAFETY',
      message: `Strong crosswinds of ${Math.round(wind)} km/h reported. Two-wheelers and high-profile vehicles should exercise caution.`,
      detail: 'Open flyovers and expressways may experience sudden wind gusts.',
      actionPrompt: `Is travel safe with ${Math.round(wind)} km/h wind in ${city}?`,
      priority: 3,
    });
  } else {
    cards.push({
      id: 'commute_safety',
      category: 'Commute Safety',
      icon: 'Car',
      status: 'good',
      title: '🚗 COMMUTE SAFETY',
      message: `Roadways are clear and visibility is excellent (${vis.toFixed(0)} km). Normal commute expected.`,
      detail: 'No weather-related roadway disruptions reported.',
      actionPrompt: `Check road travel conditions for ${city}`,
      priority: 3,
    });
  }

  // 4. UV / Weather & Clothing Advice (Section 15 & 16)
  if (uv >= 6.0) {
    cards.push({
      id: 'weather_advice',
      category: 'Weather Advice',
      icon: 'Sun',
      status: 'warning',
      title: '☀️ UV ADVISORY',
      message: `UV Index is high at ${uv.toFixed(1)}. Consider sun protection, carry sunglasses, and apply sunscreen during extended outdoor exposure.`,
      detail: 'Peak UV exposure occurs between 11 AM and 3 PM.',
      actionPrompt: `What UV precautions should I take in ${city} today?`,
      priority: 4,
    });
  } else if (humidity >= 85.0 && temp >= 28.0) {
    cards.push({
      id: 'weather_advice',
      category: 'Weather Advice',
      icon: 'Droplets',
      status: 'caution',
      title: '💧 HUMIDITY & CLOTHING',
      message: `High humidity (${Math.round(humidity)}%) makes ${temp.toFixed(0)}°C feel closer to ${Math.round(feelsLike)}°C. Wear light, breathable cotton clothing.`,
      detail: 'Stay well hydrated with water or electrolyte fluids throughout the day.',
      actionPrompt: `What should I wear today in ${city}?`,
      priority: 4,
    });
  } else if (temp <= 16.0) {
    cards.push({
      id: 'weather_advice',
      category: 'Weather Advice',
      icon: 'Shirt',
      status: 'good',
      title: '🧥 CLOTHING ADVISORY',
      message: `Cool atmospheric temperatures of ${temp.toFixed(1)}°C. A light jacket or sweater is recommended for early morning and evening.`,
      detail: 'Brisk conditions expected as temperatures dip overnight.',
      actionPrompt: `What should I wear for cool weather in ${city}?`,
      priority: 4,
    });
  } else {
    cards.push({
      id: 'weather_advice',
      category: 'Weather Advice',
      icon: 'Smile',
      status: 'good',
      title: '🌤 WEATHER COMFORT',
      message: `Comfortable outdoor conditions. Feels like ${Math.round(feelsLike)}°C with pleasant humidity levels (${Math.round(humidity)}%).`,
      detail: 'No special weather precautions required.',
      actionPrompt: `What's the weather outlook for today in ${city}?`,
      priority: 4,
    });
  }

  // 5. Section 23: Event Planning / Outdoor Suitability Assessment
  let suitabilityStatus: 'GOOD' | 'MODERATE' | 'POOR' = 'GOOD';
  const suitabilityReasons: string[] = [];

  if (warningPresent) {
    suitabilityStatus = 'POOR';
    suitabilityReasons.push('Active official meteorological warning in effect');
  } else if (forecastRainProb >= 65.0) {
    suitabilityStatus = 'POOR';
    suitabilityReasons.push(`High rain probability (${Math.round(forecastRainProb)}%)`);
  } else if (forecastRainProb >= 35.0 || temp >= 36.0 || wind >= 30.0) {
    suitabilityStatus = 'MODERATE';
    if (forecastRainProb >= 35.0) suitabilityReasons.push(`Scattered rain risk (${Math.round(forecastRainProb)}%)`);
    if (temp >= 36.0) suitabilityReasons.push(`Afternoon heat (${temp.toFixed(1)}°C)`);
    if (wind >= 30.0) suitabilityReasons.push(`Breezy winds (${Math.round(wind)} km/h)`);
  } else {
    suitabilityStatus = 'GOOD';
    suitabilityReasons.push(`Clear skies, pleasant ${temp.toFixed(1)}°C, negligible rain risk`);
  }

  const outdoorSuitability = {
    status: suitabilityStatus,
    label: 'WeatherGPT assessment',
    summary: `Outdoor suitability is ${suitabilityStatus}: ${suitabilityReasons.join('; ')}.`,
    reasons: suitabilityReasons,
  };

  return {
    role: 'citizen',
    summary: `Citizen intelligence for ${city}: ${cards[0]?.message || 'Conditions analyzed cleanly.'}`,
    cards,
    outdoorSuitability,
    warningPresent,
  };
}
