/**
 * Crop Profiles Configuration System for WeatherGPT "My Farm".
 * Provides stage timelines, water requirement thresholds, and localized labels.
 */

import { LanguageCode } from '../context/LanguageContext';

export interface CropStageInfo {
  id: string;
  label: string;
  localizedLabels?: Record<LanguageCode, string>;
  daysDuration?: number;
  waterDemandMultiplier?: number; // 1.0 = normal, 1.5 = high (flowering/grain filling)
}

export interface CropProfile {
  id: string;
  name: string;
  localizedNames: Record<LanguageCode, string>;
  stages: CropStageInfo[];
  thumbnailUrl: string;
  optimalTempMin: number;
  optimalTempMax: number;
  optimalHumidityMin: number;
  optimalHumidityMax: number;
  maxWindForSprayKmh: number;
}

export const CROP_PROFILES: Record<string, CropProfile> = {
  rice: {
    id: 'rice',
    name: 'Rice / Paddy',
    localizedNames: {
      en: 'Rice / Paddy',
      mr: 'भात / धान',
      hi: 'धान / चावल',
      gu: 'ડાંગર / ચોખા',
      ta: 'நெல்',
      te: 'వరి',
      kn: 'ಭತ್ತ',
      ml: 'നെല്ല്',
      bn: 'ধান',
      pa: 'ਝੋਨਾ',
      or: 'ଧାନ',
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?auto=format&fit=crop&w=600&q=80',
    optimalTempMin: 22,
    optimalTempMax: 32,
    optimalHumidityMin: 60,
    optimalHumidityMax: 85,
    maxWindForSprayKmh: 12,
    stages: [
      { id: 'sowing', label: 'Sowing' },
      { id: 'tillering', label: 'Tillering' },
      { id: 'panicle_initiation', label: 'Panicle Init.' },
      { id: 'pod_filling', label: 'Pod/Grain Filling' },
      { id: 'maturity', label: 'Maturity' },
    ],
  },
  paddy: {
    id: 'paddy',
    name: 'Rice / Paddy',
    localizedNames: {
      en: 'Rice / Paddy',
      mr: 'भात / धान',
      hi: 'धान / चावल',
      gu: 'ડાંગર / ચોખા',
      ta: 'நெல்',
      te: 'వరి',
      kn: 'ಭತ್ತ',
      ml: 'നെല്ല്',
      bn: 'ধান',
      pa: 'ਝੋਨਾ',
      or: 'ଧାନ',
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?auto=format&fit=crop&w=600&q=80',
    optimalTempMin: 22,
    optimalTempMax: 32,
    optimalHumidityMin: 60,
    optimalHumidityMax: 85,
    maxWindForSprayKmh: 12,
    stages: [
      { id: 'sowing', label: 'Sowing' },
      { id: 'tillering', label: 'Tillering' },
      { id: 'panicle_initiation', label: 'Panicle Init.' },
      { id: 'pod_filling', label: 'Pod/Grain Filling' },
      { id: 'maturity', label: 'Maturity' },
    ],
  },
  soybean: {
    id: 'soybean',
    name: 'Soybean',
    localizedNames: {
      en: 'Soybean',
      mr: 'सोयाबीन',
      hi: 'सोयाबीन',
      gu: 'સોયાબીન',
      ta: 'சோயாபீன்',
      te: 'సోయాబీన్',
      kn: 'ಸೋಯಾಬೀನ್',
      ml: 'സോയാബീൻ',
      bn: 'সয়াবিন',
      pa: 'ਸੋਇਆਬੀਨ',
      or: 'ସୋୟାବିନ',
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=600&q=80',
    optimalTempMin: 20,
    optimalTempMax: 30,
    optimalHumidityMin: 50,
    optimalHumidityMax: 75,
    maxWindForSprayKmh: 12,
    stages: [
      { id: 'sowing', label: 'Sowing' },
      { id: 'germination', label: 'Germination' },
      { id: 'vegetative', label: 'Vegetative' },
      { id: 'flowering', label: 'Flowering' },
      { id: 'pod_filling', label: 'Pod Filling' },
      { id: 'maturity', label: 'Maturity' },
    ],
  },
  cotton: {
    id: 'cotton',
    name: 'Cotton',
    localizedNames: {
      en: 'Cotton',
      mr: 'कापूस',
      hi: 'कपास',
      gu: 'કપાસ',
      ta: 'பருத்தி',
      te: 'ప్రత్తి',
      kn: 'ಹತ್ತಿ',
      ml: 'പരുത്തി',
      bn: 'তুলা',
      pa: 'ਕਪਾਹ',
      or: 'କପା',
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=400&q=80',
    optimalTempMin: 24,
    optimalTempMax: 35,
    optimalHumidityMin: 40,
    optimalHumidityMax: 70,
    maxWindForSprayKmh: 10,
    stages: [
      { id: 'sowing', label: 'Sowing' },
      { id: 'vegetative', label: 'Vegetative' },
      { id: 'square_formation', label: 'Square Init.' },
      { id: 'flowering', label: 'Flowering' },
      { id: 'boll_formation', label: 'Boll Formation' },
      { id: 'bursting', label: 'Boll Bursting' },
    ],
  },
  wheat: {
    id: 'wheat',
    name: 'Wheat',
    localizedNames: {
      en: 'Wheat',
      mr: 'गहू',
      hi: 'गेहूं',
      gu: 'ઘઉં',
      ta: 'கோதுமை',
      te: 'గోధుమ',
      kn: 'ಗೋಧಿ',
      ml: 'ഗോതമ്പ്',
      bn: 'গম',
      pa: 'ਕਣਕ',
      or: 'ଗହମ',
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80',
    optimalTempMin: 15,
    optimalTempMax: 25,
    optimalHumidityMin: 40,
    optimalHumidityMax: 65,
    maxWindForSprayKmh: 14,
    stages: [
      { id: 'sowing', label: 'Crown Root' },
      { id: 'tillering', label: 'Tillering' },
      { id: 'jointing', label: 'Jointing' },
      { id: 'heading', label: 'Heading' },
      { id: 'milking', label: 'Milking' },
      { id: 'maturity', label: 'Maturity' },
    ],
  },
  sugarcane: {
    id: 'sugarcane',
    name: 'Sugarcane',
    localizedNames: {
      en: 'Sugarcane',
      mr: 'ऊस',
      hi: 'गन्ना',
      gu: 'શેરડી',
      ta: 'கரும்பு',
      te: 'చెరకు',
      kn: 'ಕಬ್ಬು',
      ml: 'കരിമ്പ്',
      bn: 'আখ',
      pa: 'ਗੰਨਾ',
      or: 'ଆଖୁ',
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=400&q=80',
    optimalTempMin: 25,
    optimalTempMax: 36,
    optimalHumidityMin: 55,
    optimalHumidityMax: 85,
    maxWindForSprayKmh: 15,
    stages: [
      { id: 'germination', label: 'Germination' },
      { id: 'tillering', label: 'Tillering' },
      { id: 'grand_growth', label: 'Grand Growth' },
      { id: 'maturity', label: 'Ripening / Maturity' },
    ],
  },
  maize: {
    id: 'maize',
    name: 'Maize / Corn',
    localizedNames: {
      en: 'Maize / Corn',
      mr: 'मका',
      hi: 'मक्का',
      gu: 'મકાઈ',
      ta: 'மக்காச்சோளம்',
      te: 'మొక్కజొన్న',
      kn: 'ಮೆಕ್ಕೆಜೋಳ',
      ml: 'ചോളം',
      bn: 'ভুট্টা',
      pa: 'ਮੱਕੀ',
      or: 'ମକା',
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=400&q=80',
    optimalTempMin: 20,
    optimalTempMax: 32,
    optimalHumidityMin: 45,
    optimalHumidityMax: 70,
    maxWindForSprayKmh: 12,
    stages: [
      { id: 'sowing', label: 'Emergence' },
      { id: 'vegetative', label: 'Knee High' },
      { id: 'tasseling', label: 'Tasseling' },
      { id: 'silking', label: 'Silking' },
      { id: 'pod_filling', label: 'Grain Filling' },
      { id: 'maturity', label: 'Maturity' },
    ],
  },
  onion: {
    id: 'onion',
    name: 'Onion',
    localizedNames: {
      en: 'Onion',
      mr: 'कांदा',
      hi: 'प्याज',
      gu: 'ડુંગળી',
      ta: 'வெங்காயம்',
      te: 'ఉల్లిపాయ',
      kn: 'ಈರುಳ್ಳಿ',
      ml: 'സവാള',
      bn: 'পেঁয়াজ',
      pa: 'ਪਿਆਜ਼',
      or: 'ପିଆଜ',
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?auto=format&fit=crop&w=400&q=80',
    optimalTempMin: 18,
    optimalTempMax: 28,
    optimalHumidityMin: 50,
    optimalHumidityMax: 70,
    maxWindForSprayKmh: 10,
    stages: [
      { id: 'sowing', label: 'Transplanting' },
      { id: 'vegetative', label: 'Vegetative' },
      { id: 'bulb_formation', label: 'Bulb Formation' },
      { id: 'maturity', label: 'Bulb Maturity' },
      { id: 'harvesting', label: 'Harvesting' },
    ],
  },
  tomato: {
    id: 'tomato',
    name: 'Tomato',
    localizedNames: {
      en: 'Tomato',
      mr: 'टोमॅटो',
      hi: 'टमाटर',
      gu: 'ટામેટાં',
      ta: 'தக்காளி',
      te: 'టమోటా',
      kn: 'ಟೊಮೆಟೊ',
      ml: 'തക്കാളി',
      bn: 'টমেটো',
      pa: 'ਟਮਾਟਰ',
      or: 'ଟମାଟୋ',
    },
    thumbnailUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80',
    optimalTempMin: 20,
    optimalTempMax: 30,
    optimalHumidityMin: 50,
    optimalHumidityMax: 70,
    maxWindForSprayKmh: 10,
    stages: [
      { id: 'sowing', label: 'Transplanting' },
      { id: 'vegetative', label: 'Early Growth' },
      { id: 'flowering', label: 'Flowering' },
      { id: 'pod_filling', label: 'Fruit Set' },
      { id: 'maturity', label: 'Fruit Ripening' },
    ],
  },
};

/**
 * Resolves standard crop profile and fallback
 */
export function getCropProfile(cropName?: string | null): CropProfile {
  if (!cropName) return CROP_PROFILES.rice;
  const key = cropName.toLowerCase().trim().replace(/[\s\-_/]+/g, '');
  if (key.includes('rice') || key.includes('paddy') || key.includes('भात') || key.includes('धान')) {
    return CROP_PROFILES.rice;
  }
  if (key.includes('soy') || key.includes('सोया')) {
    return CROP_PROFILES.soybean;
  }
  if (key.includes('cotton') || key.includes('कापूस') || key.includes('कपास')) {
    return CROP_PROFILES.cotton;
  }
  if (key.includes('wheat') || key.includes('गहू') || key.includes('गेहूं')) {
    return CROP_PROFILES.wheat;
  }
  if (key.includes('sugar') || key.includes('ऊस') || key.includes('गन्ना')) {
    return CROP_PROFILES.sugarcane;
  }
  if (key.includes('maize') || key.includes('corn') || key.includes('मका')) {
    return CROP_PROFILES.maize;
  }
  if (key.includes('onion') || key.includes('कांदा') || key.includes('प्याज')) {
    return CROP_PROFILES.onion;
  }
  if (key.includes('tomato') || key.includes('टोमॅटो') || key.includes('टमाटर')) {
    return CROP_PROFILES.tomato;
  }
  return CROP_PROFILES.rice;
}
