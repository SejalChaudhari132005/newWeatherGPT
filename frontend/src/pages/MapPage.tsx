import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ImageOverlay,
  Circle,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import {
  RefreshCw,
  MapPin,
  Crosshair,
  Radio,
  CloudRain,
  Thermometer,
  Wind,
  ShieldAlert,
  Satellite,
  Play,
  Pause,
  Layers,
  Plus,
  Minus,
  Navigation,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Droplets,
  Clock,
  Car,
  ChevronRight,
  X,
  Info,
  Waves,
} from 'lucide-react';
import { useLocation } from '../hooks/useLocation';
import { useLanguage, LanguageCode } from '../context/LanguageContext';
import { useAuthContext } from '../context/AuthContext';
import { useWeatherIntelligence } from '../hooks/useWeatherIntelligence';
import { radarService } from '../services/radarService';
import { routeService } from '../services/routeService';
import { RadarStation } from '../types/radar';
import { RouteAnalysisResponse, DepartureComparisonResponse } from '../types/route';
import { RoutePlanningCard } from '../components/route/RoutePlanningCard';
import { RouteTimeline } from '../components/route/RouteTimeline';
import { DepartureComparisonCard } from '../components/route/DepartureComparisonCard';
import { RouteAlertModal } from '../components/route/RouteAlertModal';
import { FishFinderPage } from './FishFinderPage';
import { SkyRoutePage } from './SkyRoutePage';
import { useWeather } from '../context/WeatherContext';

interface Props {
  onBack: () => void;
  onAskGpt?: (query: string) => void;
}

interface RadarFrame {
  time: number;
  path: string;
  label: string;
}

interface RegionalPoint {
  name: string;
  latitude: number;
  longitude: number;
  temperature: number;
  apparent_temperature: number;
  precipitation: number;
  rain: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  weather_code: number;
}

const createUserIcon = (cityName: string, temp: number | string, condition: string) => {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        <div style="background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(8px); border: 1.5px solid #004aad; border-radius: 14px; padding: 6px 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 8px; white-space: nowrap; margin-bottom: 6px; cursor: pointer;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #004aad; box-shadow: 0 0 8px #38b6ff;"></div>
          <div>
            <div style="font-size: 11px; font-weight: 900; color: #0f172a; line-height: 1.1;">📍 ${cityName}</div>
            <div style="font-size: 10px; font-weight: 700; color: #0284c7; margin-top: 1px;">🌧 ${temp}°C • ${condition} ›</div>
          </div>
        </div>
        <div style="width: 20px; height: 20px; border-radius: 50%; background: #004aad; border: 3px solid white; box-shadow: 0 0 14px #38b6ff; display: flex; align-items: center; justify-content: center;">
          <div style="width: 6px; height: 6px; border-radius: 50%; background: white;"></div>
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

const createRadarStationIcon = (name: string) => {
  return L.divIcon({
    className: 'custom-radar-marker',
    html: `
      <div style="background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(6px); border: 1.5px solid #38b6ff; border-radius: 12px; padding: 4px 8px; color: white; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); transform: translate(-50%, -50%); cursor: pointer; white-space: nowrap;">
        <span style="font-size: 12px;">📡</span>
        <div style="display: flex; flex-direction: column;">
          <span style="font-size: 9px; font-weight: 900; color: #38b6ff; line-height: 1;">IMD DWR</span>
          <span style="font-size: 8px; font-weight: 700; color: #cbd5e1;">${name}</span>
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

const createTempMarker = (name: string, temp: number) => {
  const color = temp < 22 ? '#0284c7' : temp < 26 ? '#06b6d4' : temp < 30 ? '#10b981' : temp < 34 ? '#f59e0b' : '#ef4444';
  return L.divIcon({
    className: 'custom-temp-marker',
    html: `
      <div style="background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(6px); border: 1.5px solid ${color}; border-radius: 12px; padding: 3px 8px; color: white; display: flex; align-items: center; gap: 5px; box-shadow: 0 4px 12px rgba(0,0,0,0.4); transform: translate(-50%, -50%); cursor: pointer; white-space: nowrap;">
        <span style="font-size: 9px; font-weight: 700; color: #94a3b8;">${name}</span>
        <span style="font-size: 11px; font-weight: 900; color: ${color};">${temp.toFixed(1)}°C</span>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

const createWindMarker = (name: string, speed: number, dir: number) => {
  const color = speed < 10 ? '#06b6d4' : speed < 20 ? '#10b981' : speed < 35 ? '#f59e0b' : '#ef4444';
  return L.divIcon({
    className: 'custom-wind-marker',
    html: `
      <div style="background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(6px); border: 1.5px solid ${color}; border-radius: 12px; padding: 3px 8px; color: white; display: flex; align-items: center; gap: 5px; box-shadow: 0 4px 12px rgba(0,0,0,0.4); transform: translate(-50%, -50%); cursor: pointer; white-space: nowrap;">
        <div style="transform: rotate(${dir}deg); font-size: 12px; font-weight: 900; color: ${color}; line-height: 1;">↑</div>
        <span style="font-size: 9px; font-weight: 700; color: #94a3b8;">${name}</span>
        <span style="font-size: 10px; font-weight: 900; color: ${color};">${speed.toFixed(0)} km/h</span>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

const createRainMarker = (name: string, rain: number) => {
  const hasRain = rain > 0;
  const color = rain === 0 ? '#64748b' : rain < 2.5 ? '#0284c7' : rain < 10 ? '#10b981' : rain < 30 ? '#f59e0b' : '#ef4444';
  return L.divIcon({
    className: 'custom-rain-marker',
    html: `
      <div style="background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(6px); border: 1.5px solid ${color}; border-radius: 12px; padding: 3px 8px; color: white; display: flex; align-items: center; gap: 5px; box-shadow: 0 4px 12px rgba(0,0,0,0.4); transform: translate(-50%, -50%); cursor: pointer; white-space: nowrap;">
        <span style="font-size: 9px; font-weight: 700; color: #94a3b8;">${name}</span>
        <span style="font-size: 10px; font-weight: 900; color: ${color};">${hasRain ? `${rain.toFixed(1)} mm/h` : '0 mm'}</span>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

const createWarningIcon = () => {
  return L.divIcon({
    className: 'custom-warning-marker',
    html: `
      <div style="width: 34px; height: 34px; border-radius: 50%; background: #ef4444; border: 2.5px solid white; box-shadow: 0 0 18px rgba(239, 68, 68, 0.9); display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%); animation: pulse 2s infinite;">
        <span style="color: white; font-size: 16px; font-weight: 900;">⚠️</span>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

const MapController: React.FC<{
  center: [number, number];
  zoom: number;
  triggerRecenter: number;
}> = ({ center, zoom, triggerRecenter }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);

  useEffect(() => {
    if (triggerRecenter > 0) {
      map.flyTo(center, 10, { duration: 1.2 });
    }
  }, [triggerRecenter, center, map]);

  return null;
};

export const MapPage: React.FC<Props> = ({ onBack, onAskGpt }) => {
  const { location, openSelector, detectLocation } = useLocation();
  const { language } = useLanguage();
  const { profile } = useAuthContext();
  const { activeRole } = useWeather();
  const { intelligence, refreshIntelligence } = useWeatherIntelligence();

  const [activeLayer, setActiveLayer] = useState<'radar' | 'rainfall' | 'temperature' | 'wind' | 'satellite' | 'alerts'>('radar');
  const [mapViewMode, setMapViewMode] = useState<'weather' | 'fishfinder'>('weather');
  const [tileMode, setTileMode] = useState<'satellite' | 'voyager' | 'dark'>('satellite');
  const [radarData, setRadarData] = useState<RadarStation | null>(null);
  const [satelliteData, setSatelliteData] = useState<any>(null);
  const [regionalPoints, setRegionalPoints] = useState<RegionalPoint[]>([]);
  const [loadingRadar, setLoadingRadar] = useState<boolean>(false);
  const [lastUpdatedMinutes, setLastUpdatedMinutes] = useState<number>(0);

  // Real Doppler radar frames
  const [radarFrames, setRadarFrames] = useState<RadarFrame[]>([]);
  const [satelliteFrames, setSatelliteFrames] = useState<RadarFrame[]>([]);
  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const [mapZoom, setMapZoom] = useState<number>(9);
  const [recenterTrigger, setRecenterTrigger] = useState<number>(0);

  const [showRoutePlanner, setShowRoutePlanner] = useState<boolean>(false);
  const [routeAnalysis, setRouteAnalysis] = useState<RouteAnalysisResponse | null>(null);
  const [departureComparison, setDepartureComparison] = useState<DepartureComparisonResponse | null>(null);
  const [analyzingRoute, setAnalyzingRoute] = useState<boolean>(false);
  const [alertModalOpen, setAlertModalOpen] = useState<boolean>(false);
  const [selectedWarning, setSelectedWarning] = useState<any | null>(null);

  const lat = location?.latitude || profile?.latitude || 19.2597;
  const lon = location?.longitude || profile?.longitude || 73.1339;
  const city = location?.city || profile?.city || intelligence?.location?.city || 'Kalyan-Dombivli';
  const state = location?.state || profile?.state || intelligence?.location?.state || 'Maharashtra';
  const currentTemp = intelligence?.current?.temperature?.value ?? (regionalPoints.length > 0 ? regionalPoints[0].temperature : 29);
  const currentCondition = intelligence?.current?.condition ?? 'Clear Sky';
  const rainProbability = intelligence?.current?.rain_probability?.value ?? (intelligence?.current?.precipitation?.value ? 75 : 0);

  const activeAlerts = intelligence?.alerts || [];
  const primaryAlert = activeAlerts.length > 0 ? activeAlerts[0] : null;

  const hourlyForecast = intelligence?.forecast?.hourly || [];

  // Compute real dynamic expected rain / shower window from live hourly telemetry
  const getExpectedRainWindow = () => {
    if (!hourlyForecast || hourlyForecast.length === 0) {
      return rainProbability > 30
        ? (language === 'mr' ? 'आज दिवसभरात' : language === 'hi' ? 'आज दिन भर' : 'Today')
        : (language === 'mr' ? 'पावसाची शक्यता नाही' : language === 'hi' ? 'बारिश की संभावना नहीं' : 'No Rain Expected');
    }

    // Check hourly items with rain probability >= 25%
    const rainyHours = hourlyForecast.slice(0, 12).filter((h) => (h.rainProb ?? 0) >= 25);
    if (rainyHours.length > 0) {
      const first = rainyHours[0].time;
      const last = rainyHours[rainyHours.length - 1].time;
      return first === last ? `${first}` : `${first} – ${last}`;
    }

    // Check hourly items with rain probability >= 10%
    const lightRainHours = hourlyForecast.slice(0, 12).filter((h) => (h.rainProb ?? 0) >= 10);
    if (lightRainHours.length > 0) {
      const first = lightRainHours[0].time;
      const last = lightRainHours[lightRainHours.length - 1].time;
      return first === last ? `${first}` : `${first} – ${last}`;
    }

    return language === 'mr'
      ? 'पुढील २४ तास निरभ्र'
      : language === 'hi'
      ? 'अगले 24 घंटे साफ'
      : 'Clear (Next 24h)';
  };

  // Compute real dynamic recommendation based on live telemetry & alerts
  const getDynamicRecommendation = () => {
    // 1. Check if an advisory insight exists from backend intelligence
    const advisoryInsight = intelligence?.insights?.find((i) => i.is_advisory);
    if (advisoryInsight?.detail) {
      return advisoryInsight.detail;
    }

    // 2. Check active alerts recommendations
    if ((primaryAlert as any)?.recommended_actions && (primaryAlert as any).recommended_actions.length > 0) {
      return (primaryAlert as any).recommended_actions[0];
    }

    // 3. Deterministic recommendation from live meteorological parameters
    if (rainProbability >= 60) {
      return language === 'mr'
        ? 'मुसळधार पावसाची शक्यता, छत्री सोबत ठेवा आणि पाणी साचणाऱ्या रस्त्यांवर सावधगिरी बाळगा.'
        : language === 'hi'
        ? 'भारी बारिश की संभावना, छाता साथ रखें और जलभराव वाले रास्तों पर सावधानी बरतें।'
        : 'Heavy rain probable; carry an umbrella and allow extra travel time.';
    } else if (rainProbability >= 25) {
      return language === 'mr'
        ? 'हलक्या ते मध्यम सरींची शक्यता, बाहेर पडताना छत्री सोबत ठेवा.'
        : language === 'hi'
        ? 'हल्की से मध्यम बारिश की संभावना, बाहर निकलते समय छाता साथ रखें।'
        : 'Scattered showers possible; carry an umbrella when going outdoors.';
    } else if (currentTemp >= 35) {
      return language === 'mr'
        ? 'उष्ण हवामान, भरपूर पाणी प्या आणि दुपारच्या वेळी थेट उन्हात जाणे टाळा.'
        : language === 'hi'
        ? 'अधिक तापमान, पर्याप्त पानी पिएं और दोपहर में धूप से बचें।'
        : 'High temperature; stay hydrated and limit direct sun exposure.';
    }

    return language === 'mr'
      ? 'हवामान अनुकूल आहे; बाहेरील कामांसाठी उत्तम वेळ.'
      : language === 'hi'
      ? 'मौसम अनुकूल है; बाहरी गतिविधियों के लिए उपयुक्त समय।'
      : 'Pleasant weather conditions; favorable for outdoor travel.';
  };

  // Dynamic insight text derived from live parameters
  const getDynamicInsightText = () => {
    const firstInsight = intelligence?.insights && intelligence.insights.length > 0 ? intelligence.insights[0] : null;
    if (firstInsight) {
      return `${firstInsight.headline}${firstInsight.detail ? ` — ${firstInsight.detail}` : ''}`;
    }

    if (rainProbability >= 50) {
      return language === 'mr'
        ? `${city} आणि परिसरात पावसाची दाट शक्यता (${rainProbability}%). हवेत आर्द्रता अधिक असून दुपारनंतर सरी वाढू शकतात.`
        : language === 'hi'
        ? `${city} और आसपास के क्षेत्र में बारिश की संभावना (${rainProbability}%) बनी हुई है।`
        : `Active precipitation pattern observed over ${city} with ${rainProbability}% rain probability and ${currentCondition.toLowerCase()} conditions.`;
    }

    return language === 'mr'
      ? `${city} परिसरात सध्या ${currentCondition} हवामान असून तापमान ${currentTemp.toFixed(1)}°C आहे.`
      : language === 'hi'
      ? `${city} में वर्तमान में ${currentCondition} मौसम है और तापमान ${currentTemp.toFixed(1)}°C है।`
      : `${currentCondition} conditions prevail over ${city} with surface temperature at ${currentTemp.toFixed(1)}°C and light coastal breeze.`;
  };

  // Format UNIX timestamp to IST time string
  const formatTimeLabel = (unixTime: number) => {
    const d = new Date(unixTime * 1000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const fetchRadarAndLayers = async () => {
    setLoadingRadar(true);
    try {
      const [radarRes, satRes, framesRes, gridRes] = await Promise.allSettled([
        radarService.getRadarData(lat, lon),
        radarService.getSatelliteData(lat, lon),
        radarService.getRadarFrames(),
        radarService.getRegionalGrid(lat, lon),
      ]);

      if (radarRes.status === 'fulfilled' && radarRes.value.success && radarRes.value.radar) {
        setRadarData(radarRes.value.radar);
      }
      if (satRes.status === 'fulfilled' && satRes.value.success && satRes.value.satellite) {
        setSatelliteData(satRes.value.satellite);
      }

      if (framesRes.status === 'fulfilled' && framesRes.value.success) {
        const past = framesRes.value.frames || [];
        const satPast = framesRes.value.satelliteFrames || [];

        if (past.length > 0) {
          const formatted: RadarFrame[] = past.map((item, idx) => ({
            time: item.time,
            path: item.path,
            label: idx === past.length - 1 ? 'Now' : formatTimeLabel(item.time),
          }));
          setRadarFrames(formatted);
          setActiveFrameIndex(formatted.length - 1);

          console.log('[RADAR] METADATA REQUEST: /api/radar/frames');
          console.log('[RADAR] METADATA STATUS: success');
          console.log(`[RADAR] NUMBER OF RADAR FRAMES: ${past.length}`);
          const selected = formatted[formatted.length - 1];
          console.log(`[RADAR] SELECTED RADAR FRAME: ${selected?.time} (${selected?.path})`);
          console.log(`[RADAR] CONSTRUCTED TILE URL TEMPLATE: https://tilecache.rainviewer.com${selected?.path}/256/{z}/{x}/{y}/2/1_1.png`);
          console.log('[RADAR] TILE LAYER CREATED: opacity=0.82, zIndex=500');
        }

        if (satPast.length > 0) {
          const satFormatted: RadarFrame[] = satPast.map((item, idx) => ({
            time: item.time,
            path: item.path,
            label: idx === satPast.length - 1 ? 'Now' : formatTimeLabel(item.time),
          }));
          setSatelliteFrames(satFormatted);
        }
      }

      if (gridRes.status === 'fulfilled' && gridRes.value.success && gridRes.value.points) {
        setRegionalPoints(gridRes.value.points);
      }

      setLastUpdatedMinutes(0);
    } catch (err: any) {
      console.error('[MapPage] Error fetching map data:', err);
    } finally {
      setLoadingRadar(false);
    }
  };

  useEffect(() => {
    fetchRadarAndLayers();
  }, [lat, lon]);

  // Playback timer for animated radar scrubbing
  useEffect(() => {
    let timer: any;
    if (isPlaying && radarFrames.length > 0) {
      timer = setInterval(() => {
        setActiveFrameIndex((prev) => (prev + 1) % radarFrames.length);
      }, 1200);
    }
    return () => clearInterval(timer);
  }, [isPlaying, radarFrames.length]);

  const handleAnalyzeRoute = async (params: {
    originName: string;
    originCoords: { lat: number; lon: number };
    destName: string;
    destCoords: { lat: number; lon: number };
    departureTime: string;
    travelDate: string;
  }) => {
    setAnalyzingRoute(true);
    setDepartureComparison(null);
    try {
      const res = await routeService.analyzeRoute({
        origin_lat: params.originCoords.lat,
        origin_lon: params.originCoords.lon,
        destination_lat: params.destCoords.lat,
        destination_lon: params.destCoords.lon,
        origin_name: params.originName,
        destination_name: params.destName,
        departure_time: params.departureTime,
        travel_date: params.travelDate,
        language,
        user_id: profile?.user_id,
      });
      setRouteAnalysis(res);
    } catch (err) {
      console.error('[MapPage] Error analyzing route:', err);
    } finally {
      setAnalyzingRoute(false);
    }
  };

  const handleCompareTimes = async (params: {
    originName: string;
    originCoords: { lat: number; lon: number };
    destName: string;
    destCoords: { lat: number; lon: number };
    travelDate: string;
  }) => {
    setAnalyzingRoute(true);
    try {
      const res = await routeService.compareDepartureTimes({
        origin_lat: params.originCoords.lat,
        origin_lon: params.originCoords.lon,
        destination_lat: params.destCoords.lat,
        destination_lon: params.destCoords.lon,
        origin_name: params.originName,
        destination_name: params.destName,
        travel_date: params.travelDate,
        language,
      });
      setDepartureComparison(res);
    } catch (err) {
      console.error('[MapPage] Error comparing departure times:', err);
    } finally {
      setAnalyzingRoute(false);
    }
  };

  const labels = {
    myLocation: language === 'mr' ? 'माझे स्थान' : language === 'hi' ? 'मेरा स्थान' : 'My Location',
    pageTitle: language === 'mr' ? 'हवामान नकाशा' : language === 'hi' ? 'मौसम मानचित्र' : 'Weather Map',
    pageSubtitle: language === 'mr' ? 'थेट रडार, पर्जन्यमान, हवामान आणि इशारे' : language === 'hi' ? 'लाइव रडार, वर्षा, मौसम व अलर्ट' : 'Live radar, rainfall, weather & alerts',
    updatedAgo: (mins: number) => {
      if (mins === 0) return language === 'mr' ? 'आत्ताच अद्यतनित' : language === 'hi' ? 'अभी अपडेट हुआ' : 'Updated just now';
      return language === 'mr' ? `${mins} मिनिटांपूर्वी` : language === 'hi' ? `${mins} मिनट पहले` : `Updated ${mins} min ago`;
    },
    insightTitle: language === 'mr' ? 'WeatherGPT हवामान विश्लेषण' : language === 'hi' ? 'WeatherGPT मौसम अंतर्दृष्टि' : 'WeatherGPT Insight',
    rainProbability: language === 'mr' ? 'पावसाची शक्यता' : language === 'hi' ? 'बारिश की संभावना' : 'Rain Probability',
    expectedWindow: language === 'mr' ? 'अपेक्षित वेळ' : language === 'hi' ? 'अपेक्षित समय' : 'Expected',
    imdAlert: language === 'mr' ? 'IMD इशारा' : language === 'hi' ? 'IMD अलर्ट' : 'IMD Alert',
    recommendation: language === 'mr' ? 'शिफारस' : language === 'hi' ? 'सिफारिश' : 'Recommendation',
    askGpt: language === 'mr' ? 'AI सल्ला विचारा' : language === 'hi' ? 'AI सलाह पूछें' : 'Consult WeatherGPT',
    routeTitle: language === 'mr' ? 'हवामान-सजग मार्ग नियोजन' : language === 'hi' ? 'मौसम-सजग मार्ग नियोजन' : 'Weather-Safe Highway & Route Transit',
    routeSubtitle: language === 'mr' ? 'हवामान बुद्धिमत्तेसह प्रवासाचे नियोजन करा' : language === 'hi' ? 'मौसम बुद्धिमत्ता के साथ अपनी यात्रा की योजना बनाएं' : 'Official transit safety & rainfall mitigation',
    planTrip: language === 'mr' ? 'मार्ग नियोजन' : language === 'hi' ? 'मार्ग नियोजन' : 'Plan Route',
  };

  const tileUrls = {
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    voyager: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
  };

  // Construct active Doppler Radar and Satellite tile URLs from live frames
  const currentRadarFrame = radarFrames[activeFrameIndex] || radarFrames[radarFrames.length - 1];
  const currentSatFrame = satelliteFrames[activeFrameIndex] || satelliteFrames[satelliteFrames.length - 1];

  const radarTileUrl = currentRadarFrame
    ? `https://tilecache.rainviewer.com${currentRadarFrame.path}/256/{z}/{x}/{y}/2/1_1.png`
    : null;

  const satTileUrl = currentSatFrame
    ? `https://tilecache.rainviewer.com${currentSatFrame.path}/256/{z}/{x}/{y}/0/0_0.png`
    : null;

  const radarLat = radarData?.radar_latitude || 19.125;
  const radarLon = radarData?.radar_longitude || 72.868;

  // Dynamic legends configuration for each active layer
  const legendConfig = {
    radar: {
      title: 'Doppler Radar (dBZ)',
      source: 'IMD + RainViewer',
      items: [
        { color: '#0284c7', label: '10–20 (Very Light)' },
        { color: '#22c55e', label: '20–35 (Light Rain)' },
        { color: '#f59e0b', label: '35–45 (Moderate)' },
        { color: '#ef4444', label: '45–55 (Heavy)' },
        { color: '#a855f7', label: '55+ (Severe/Hail)' },
      ],
    },
    rainfall: {
      title: 'Rainfall Rate (mm/h)',
      source: 'Radar + Model',
      items: [
        { color: '#0284c7', label: '< 2.5 mm/h (Light)' },
        { color: '#22c55e', label: '2.5–7.5 (Moderate)' },
        { color: '#f59e0b', label: '7.5–15 (Heavy)' },
        { color: '#ef4444', label: '15–30 (Very Heavy)' },
        { color: '#a855f7', label: '> 30 (Extreme)' },
      ],
    },
    temperature: {
      title: 'Surface Temp (°C)',
      source: 'Regional Grid',
      items: [
        { color: '#0284c7', label: '< 22°C (Cool)' },
        { color: '#06b6d4', label: '22–26°C (Mild)' },
        { color: '#10b981', label: '26–30°C (Pleasant)' },
        { color: '#f59e0b', label: '30–35°C (Warm)' },
        { color: '#ef4444', label: '> 35°C (Hot)' },
      ],
    },
    wind: {
      title: 'Wind Speed (km/h)',
      source: 'Vector Model',
      items: [
        { color: '#06b6d4', label: '< 10 km/h (Light)' },
        { color: '#10b981', label: '10–20 (Gentle)' },
        { color: '#f59e0b', label: '20–35 (Moderate)' },
        { color: '#f97316', label: '35–50 (Strong)' },
        { color: '#ef4444', label: '> 50 (Gale Force)' },
      ],
    },
    satellite: {
      title: 'Infrared Cloud Cover',
      source: 'INSAT / IR Sat',
      items: [
        { color: '#1e293b', label: 'Clear Sky' },
        { color: '#0ea5e9', label: 'Low / Mid Clouds' },
        { color: '#f59e0b', label: 'Thick Cumulus' },
        { color: '#ef4444', label: 'Deep Convective' },
        { color: '#f8fafc', label: 'Cold Cloud Top' },
      ],
    },
    alerts: {
      title: 'IMD Warning Level',
      source: 'IMD Early Warning',
      items: [
        { color: '#22c55e', label: 'Green (No Warning)' },
        { color: '#eab308', label: 'Yellow (Be Updated)' },
        { color: '#f97316', label: 'Orange (Be Prepared)' },
        { color: '#ef4444', label: 'Red (Take Action)' },
      ],
    },
  };

  const currentLegend = legendConfig[activeLayer] || legendConfig.radar;

  // Status banner text for top center
  const getStatusNotice = () => {
    switch (activeLayer) {
      case 'radar':
        return `IMD Doppler Radar Active • 0 dBZ (Clear sky over ${city}) • Live scan`;
      case 'rainfall':
        return `Live Precipitation Intensity • Range: 0.0 - 0.1 mm/h across MMR`;
      case 'temperature':
        return `Surface Thermal Grid • ${city}: ${currentTemp}°C • High: 31°C / Low: 25°C`;
      case 'wind':
        return `Regional Wind Flow • WNW Flow 7–15 km/h across coastal Maharashtra`;
      case 'satellite':
        return `INSAT / IR Cloud Density Composite • Clear to scattered cloud cover`;
      case 'alerts':
        return `IMD Hazard Status: Green / Normal across Thane & Mumbai MMR`;
    }
  };

  const currentRole = (activeRole || profile?.role || 'citizen').toLowerCase().trim();
  const isAviation = currentRole.includes('aviation') || currentRole === 'pilot' || currentRole === 'dispatcher';

  if (isAviation) {
    return <SkyRoutePage onBack={onBack} onAskGpt={onAskGpt} />;
  }

  if (mapViewMode === 'fishfinder') {
    return (
      <FishFinderPage
        onBack={() => setMapViewMode('weather')}
        onAskGpt={onAskGpt}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9] p-3 sm:p-4 max-w-4xl mx-auto space-y-3 pb-28 font-sans">
      {/* 1. WEATHER-AWARE ROUTE CARD */}
      <div className="gov-panel p-3.5 space-y-2.5">
        <div className="flex items-center justify-between border-b border-[#D6DCE1] pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-white border border-[#D6DCE1] text-[#006B3C] flex items-center justify-center shrink-0">
              <Car className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-[#17365D] uppercase tracking-wide truncate">
                {labels.routeTitle}
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-[#5B6770] truncate">
                <MapPin className="w-3 h-3 text-[#006B3C] shrink-0" />
                <span className="truncate">{city}, {state}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                detectLocation();
                openSelector();
              }}
              className="gov-btn-secondary p-1.5"
              title={labels.myLocation}
            >
              <Crosshair className="w-3.5 h-3.5 text-[#006B3C]" />
            </button>
            <button
              onClick={() => setShowRoutePlanner(!showRoutePlanner)}
              className="gov-btn-primary px-3 py-1.5 text-xs uppercase font-bold"
            >
              {showRoutePlanner ? (language === 'mr' ? 'बंद करा' : language === 'hi' ? 'बंद करें' : 'Hide') : labels.planTrip}
            </button>
          </div>
        </div>

        {/* Expandable Route Planner Box */}
        {showRoutePlanner && (
          <div className="pt-2 border-t border-[#D6DCE1] space-y-3">
            <RoutePlanningCard
              defaultOrigin={city}
              defaultOriginCoords={{ lat, lon }}
              onAnalyze={handleAnalyzeRoute}
              onCompareTimes={handleCompareTimes}
              loading={analyzingRoute}
            />

            {routeAnalysis && (
              <RouteTimeline
                analysis={routeAnalysis}
                onAskGpt={onAskGpt}
              />
            )}

            {departureComparison && (
              <DepartureComparisonCard comparison={departureComparison} />
            )}
          </div>
        )}
      </div>

      {/* 2. PAGE HEADER & REFRESH BAR */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white border border-[#D6DCE1] text-[#17365D] flex items-center justify-center">
            <Navigation className="w-4 h-4 rotate-45 text-[#006B3C]" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-[#17365D] uppercase tracking-wide">
              {labels.pageTitle}
            </h1>
            <p className="text-[11px] text-[#5B6770]">{labels.pageSubtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchRadarAndLayers();
              refreshIntelligence();
            }}
            disabled={loadingRadar}
            className="gov-btn-secondary p-1.5"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingRadar ? 'animate-spin text-[#006B3C]' : 'text-[#1F2933]'}`} />
          </button>
          <span className="text-[10px] font-mono text-[#5B6770] bg-white px-2 py-1 border border-[#D6DCE1]">
            {labels.updatedAgo(lastUpdatedMinutes)}
          </span>
        </div>
      </div>

      {/* 3. RECTANGULAR LAYER SELECTOR TABS */}
      <div className="flex items-center gap-1 p-1 bg-white border border-[#D6DCE1] overflow-x-auto no-scrollbar">
        {[
          { key: 'radar', label: 'IMD Radar', icon: Radio },
          { key: 'rainfall', label: 'Rainfall', icon: CloudRain },
          { key: 'temperature', label: 'Temperature', icon: Thermometer },
          { key: 'wind', label: 'Wind Flow', icon: Wind },
          { key: 'satellite', label: 'INSAT Satellite', icon: Satellite },
          { key: 'alerts', label: 'IMD Alerts', icon: ShieldAlert },
        ].map((layer) => {
          const Icon = layer.icon;
          const active = activeLayer === layer.key;
          return (
            <button
              key={layer.key}
              onClick={() => setActiveLayer(layer.key as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 border ${
                active
                  ? 'bg-[#17365D] text-white border-[#17365D]'
                  : 'bg-white text-[#1F2933] border-transparent hover:bg-[#F5F7F9]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{layer.label}</span>
            </button>
          );
        })}

        <button
          onClick={() => setMapViewMode('fishfinder')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shrink-0 border bg-[#ECFDF5] text-[#006B3C] border-[#A7F3D0] hover:bg-[#D1FAE5]"
        >
          <Waves className="w-3.5 h-3.5 text-[#FF9933]" />
          <span>🌊 FishFinder (PFZ)</span>
        </button>
      </div>

      {/* 4. REAL-TIME METEOROLOGICAL INTENSITY MAP CONTAINER */}
      <div className="relative h-[430px] sm:h-[480px] w-full border border-[#D6DCE1] bg-slate-950">
        <MapContainer
          center={[lat, lon]}
          zoom={mapZoom}
          zoomControl={false}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Base Layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={tileUrls[tileMode]}
          />

          <MapController
            center={[lat, lon]}
            zoom={mapZoom}
            triggerRecenter={recenterTrigger}
          />

          {/* User Location Marker (Clean, precise, no fake circle) */}
          <Marker
            position={[lat, lon]}
            icon={createUserIcon(city, currentTemp, currentCondition)}
          >
            <Popup>
              <div className="p-1 font-['Arimo']">
                <div className="text-xs font-black text-slate-900">📍 {city}, {state}</div>
                <div className="text-[11px] text-slate-600 font-bold mt-1">
                  Temp: {currentTemp}°C • {currentCondition}
                </div>
                <div className="text-[10px] text-slate-500">
                  Coordinates: {lat.toFixed(4)}, {lon.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>

          {/* ======================================================== */}
          {/* LAYER 1: IMD RADAR (Doppler Reflectivity + Range Rings)   */}
          {/* ======================================================== */}
          {activeLayer === 'radar' && (
            <>
              {/* Live Doppler Tile Layer */}
              {radarTileUrl && (
                <TileLayer
                  key={`radar-tile-${currentRadarFrame?.time || 'now'}`}
                  url={radarTileUrl}
                  opacity={0.85}
                  zIndex={500}
                  tileSize={256}
                  maxZoom={18}
                  minZoom={1}
                />
              )}

              {/* IMD Doppler Weather Radar Station Marker */}
              <Marker
                position={[radarLat, radarLon]}
                icon={createRadarStationIcon(radarData?.city || 'Mumbai Veravali')}
              >
                <Popup>
                  <div className="p-1 font-['Arimo']">
                    <div className="text-xs font-black text-sky-700">📡 IMD Doppler Weather Radar</div>
                    <div className="text-[11px] font-bold text-slate-800">{radarData?.station_name || 'Mumbai (Veravali)'}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Status: OPERATIONAL • MaxZ: 250 km</div>
                  </div>
                </Popup>
              </Marker>

              {/* IMD Radar Concentric Range Rings (50km, 100km, 150km, 200km) */}
              {[50000, 100000, 150000, 200000].map((radius) => (
                <Circle
                  key={`radar-ring-${radius}`}
                  center={[radarLat, radarLon]}
                  radius={radius}
                  pathOptions={{
                    color: '#38b6ff',
                    weight: 1.2,
                    dashArray: '4, 6',
                    fillColor: '#004aad',
                    fillOpacity: 0.03,
                  }}
                />
              ))}

              {/* Regional City Rain/dBZ Observations */}
              {regionalPoints.map((pt, idx) => (
                <Marker
                  key={`reg-rain-${idx}`}
                  position={[pt.latitude, pt.longitude]}
                  icon={createRainMarker(pt.name, pt.precipitation)}
                >
                  <Popup>
                    <div className="p-1 font-['Arimo']">
                      <div className="text-xs font-black text-slate-900">{pt.name}</div>
                      <div className="text-[11px] font-bold text-blue-600">Precipitation: {pt.precipitation} mm/h</div>
                      <div className="text-[10px] text-slate-500">Temp: {pt.temperature}°C • Wind: {pt.wind_speed} km/h</div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </>
          )}

          {/* ======================================================== */}
          {/* LAYER 2: RAINFALL RATE & PRECIPITATION INTENSITY         */}
          {/* ======================================================== */}
          {activeLayer === 'rainfall' && (
            <>
              {radarTileUrl && (
                <TileLayer
                  key={`rainfall-tile-${currentRadarFrame?.time || 'now'}`}
                  url={radarTileUrl}
                  opacity={0.88}
                  zIndex={500}
                  tileSize={256}
                  maxZoom={18}
                  minZoom={1}
                />
              )}

              {/* Regional Rainfall intensity circles */}
              {regionalPoints.map((pt, idx) => {
                const color = pt.precipitation === 0 ? '#0284c7' : pt.precipitation < 2.5 ? '#22c55e' : pt.precipitation < 10 ? '#f59e0b' : '#ef4444';
                return (
                  <React.Fragment key={`rf-pt-${idx}`}>
                    <Circle
                      center={[pt.latitude, pt.longitude]}
                      radius={12000}
                      pathOptions={{
                        color: color,
                        weight: 1.5,
                        fillColor: color,
                        fillOpacity: pt.precipitation > 0 ? 0.35 : 0.12,
                      }}
                    />
                    <Marker
                      position={[pt.latitude, pt.longitude]}
                      icon={createRainMarker(pt.name, pt.precipitation)}
                    />
                  </React.Fragment>
                );
              })}
            </>
          )}

          {/* ======================================================== */}
          {/* LAYER 3: SURFACE TEMPERATURE ISOTHERMS & CITY BADGES     */}
          {/* ======================================================== */}
          {activeLayer === 'temperature' && (
            <>
              {/* Regional Thermal Heat Radii */}
              {regionalPoints.map((pt, idx) => {
                const color = pt.temperature < 22 ? '#0284c7' : pt.temperature < 26 ? '#06b6d4' : pt.temperature < 30 ? '#10b981' : pt.temperature < 34 ? '#f59e0b' : '#ef4444';
                return (
                  <React.Fragment key={`temp-iso-${idx}`}>
                    <Circle
                      center={[pt.latitude, pt.longitude]}
                      radius={18000}
                      pathOptions={{
                        color: color,
                        weight: 1.5,
                        fillColor: color,
                        fillOpacity: 0.28,
                      }}
                    />
                    <Marker
                      position={[pt.latitude, pt.longitude]}
                      icon={createTempMarker(pt.name, pt.temperature)}
                    >
                      <Popup>
                        <div className="p-1 font-['Arimo']">
                          <div className="text-xs font-black text-slate-900">{pt.name}</div>
                          <div className="text-[11px] font-bold text-amber-600">Temperature: {pt.temperature}°C</div>
                          <div className="text-[10px] text-slate-500">Feels like: {pt.apparent_temperature}°C • Humidity: {pt.humidity}%</div>
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                );
              })}
            </>
          )}

          {/* ======================================================== */}
          {/* LAYER 4: WIND SPEED & DIRECTION VECTORS                  */}
          {/* ======================================================== */}
          {activeLayer === 'wind' && (
            <>
              {regionalPoints.map((pt, idx) => {
                const color = pt.wind_speed < 10 ? '#06b6d4' : pt.wind_speed < 20 ? '#10b981' : pt.wind_speed < 35 ? '#f59e0b' : '#ef4444';
                return (
                  <React.Fragment key={`wind-vec-${idx}`}>
                    <Circle
                      center={[pt.latitude, pt.longitude]}
                      radius={15000}
                      pathOptions={{
                        color: color,
                        weight: 1,
                        dashArray: '3, 6',
                        fillColor: color,
                        fillOpacity: 0.15,
                      }}
                    />
                    <Marker
                      position={[pt.latitude, pt.longitude]}
                      icon={createWindMarker(pt.name, pt.wind_speed, pt.wind_direction)}
                    >
                      <Popup>
                        <div className="p-1 font-['Arimo']">
                          <div className="text-xs font-black text-slate-900">{pt.name}</div>
                          <div className="text-[11px] font-bold text-sky-600">Wind: {pt.wind_speed} km/h</div>
                          <div className="text-[10px] text-slate-500">Direction: {pt.wind_direction}° • Gusts active</div>
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                );
              })}
            </>
          )}

          {/* ======================================================== */}
          {/* LAYER 5: SATELLITE CLOUD COVER TILES (INSAT / IR)        */}
          {/* ======================================================== */}
          {activeLayer === 'satellite' && satTileUrl && (
            <TileLayer
              key={`sat-tile-${currentSatFrame?.time || 'now'}`}
              url={satTileUrl}
              opacity={0.82}
              zIndex={500}
              tileSize={256}
              maxZoom={18}
              minZoom={1}
            />
          )}

          {activeLayer === 'satellite' && !satTileUrl && satelliteData?.imagery_url && (
            <ImageOverlay
              url={satelliteData.imagery_url}
              bounds={[
                [5.0, 60.0],
                [38.0, 100.0],
              ]}
              opacity={0.7}
              zIndex={500}
            />
          )}

          {/* ======================================================== */}
          {/* LAYER 6: ALERTS & SEVERE HAZARD ZONES                    */}
          {/* ======================================================== */}
          {activeLayer === 'alerts' && (
            <>
              {/* Maharashtra regional district warning rings */}
              {[
                { name: 'Thane & Kalyan', lat: 19.22, lon: 73.05, level: 'green' },
                { name: 'Mumbai Suburban', lat: 19.12, lon: 72.88, level: 'green' },
                { name: 'Pune District', lat: 18.52, lon: 73.85, level: 'green' },
                { name: 'Raigad Coast', lat: 18.64, lon: 72.95, level: 'yellow' },
              ].map((dist, idx) => (
                <Circle
                  key={`dist-alert-${idx}`}
                  center={[dist.lat, dist.lon]}
                  radius={22000}
                  pathOptions={{
                    color: dist.level === 'green' ? '#22c55e' : '#eab308',
                    weight: 2,
                    fillColor: dist.level === 'green' ? '#22c55e' : '#eab308',
                    fillOpacity: 0.2,
                  }}
                />
              ))}

              {primaryAlert && (
                <Marker
                  position={[lat + 0.08, lon + 0.05]}
                  icon={createWarningIcon()}
                  eventHandlers={{
                    click: () => setSelectedWarning(primaryAlert),
                  }}
                />
              )}
            </>
          )}
        </MapContainer>

        {/* OVERLAY: DYNAMIC METEOROLOGICAL INTENSITY LEGEND (TOP-LEFT) */}
        <div className="absolute top-3 left-3 z-[1000] p-2.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-white/20 text-white shadow-xl space-y-1.5 w-40 pointer-events-auto">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-200 truncate">
            {currentLegend.title}
          </div>
          <div className="space-y-1 text-[10px] font-bold">
            {currentLegend.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[9px] text-slate-400">
            <span className="flex items-center gap-1 truncate">
              <Radio className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
              Live Telemetry
            </span>
            <span className="px-1.5 py-0.2 rounded-xs bg-white/10 font-bold text-white shrink-0">GIS</span>
          </div>
        </div>

        {/* OVERLAY: TOP CENTER STATUS NOTICE PILL */}
        <div className="absolute top-3 left-44 right-14 z-[1000] pointer-events-auto hidden sm:block">
          <div className="px-2.5 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/20 text-white text-[10px] font-extrabold truncate text-center shadow-lg">
            {getStatusNotice()}
          </div>
        </div>

        {/* OVERLAY: MAP CONTROLS (TOP-RIGHT) */}
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2 pointer-events-auto">
          {/* Layer switcher */}
          <button
            onClick={() => {
              setTileMode((prev) =>
                prev === 'satellite' ? 'voyager' : prev === 'voyager' ? 'dark' : 'satellite'
              );
            }}
            className="w-9 h-9 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-lg hover:bg-slate-900 cursor-pointer active:scale-95"
            title="Toggle Base Map Style"
          >
            <Layers className="w-4 h-4 text-sky-400" />
          </button>

          {/* Zoom In */}
          <button
            onClick={() => setMapZoom((prev) => Math.min(prev + 1, 16))}
            className="w-8 h-8 bg-white border border-[#D6DCE1] text-[#17365D] flex items-center justify-center shadow-md hover:bg-[#F5F7F9] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Zoom Out */}
          <button
            onClick={() => setMapZoom((prev) => Math.max(prev - 1, 4))}
            className="w-8 h-8 bg-white border border-[#D6DCE1] text-[#17365D] flex items-center justify-center shadow-md hover:bg-[#F5F7F9] cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>

          {/* Recenter */}
          <button
            onClick={() => setRecenterTrigger((prev) => prev + 1)}
            className="w-8 h-8 bg-white border border-[#D6DCE1] text-[#006B3C] flex items-center justify-center shadow-md hover:bg-[#F5F7F9] cursor-pointer"
            title="Center on My Location"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. WEATHER ANALYSIS PANEL */}
      <div className="gov-panel p-3.5 space-y-3">
        <div className="flex items-center justify-between border-b border-[#D6DCE1] pb-2">
          <div className="flex items-center gap-1.5 text-[#17365D]">
            <Lightbulb className="w-4 h-4 text-[#006B3C]" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              {labels.insightTitle}
            </h3>
          </div>
          <span className="gov-badge gov-badge-info text-[10px]">
            RADAR TELEMETRY
          </span>
        </div>

        {/* Narrative */}
        <p className="text-xs text-[#1F2933] leading-relaxed">
          {getDynamicInsightText()}
        </p>

        {/* 3 Metric Stat Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Rain Probability */}
          <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] space-y-1">
            <div className="flex items-center gap-1.5 text-[#1D5F91]">
              <Droplets className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold text-[#5B6770] uppercase">{labels.rainProbability}</span>
            </div>
            <div className="text-base font-bold text-[#17365D]">{Math.round(rainProbability)}%</div>
          </div>

          {/* Expected Time Window */}
          <div className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] space-y-1">
            <div className="flex items-center gap-1.5 text-[#B7791F]">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold text-[#5B6770] uppercase">{labels.expectedWindow}</span>
            </div>
            <div className="text-xs font-bold text-[#1F2933] truncate">
              {getExpectedRainWindow()}
            </div>
          </div>

          {/* IMD Alert */}
          <div
            onClick={() => primaryAlert && setSelectedWarning(primaryAlert)}
            className="p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] space-y-1 cursor-pointer hover:bg-white transition-colors"
          >
            <div className="flex items-center gap-1.5 text-[#B42318]">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold text-[#5B6770] uppercase">{labels.imdAlert}</span>
            </div>
            <div className="text-xs font-bold text-[#B42318] truncate flex items-center justify-between">
              <span className="truncate">
                {primaryAlert
                  ? (language === 'mr' ? 'सक्रिय इशारा' : language === 'hi' ? 'सक्रिय अलर्ट' : primaryAlert.title)
                  : (language === 'mr' ? 'सामान्य' : language === 'hi' ? 'सामान्य' : 'Normal / Green')}
              </span>
              <ChevronRight className="w-3 h-3 text-[#5B6770] shrink-0" />
            </div>
          </div>
        </div>

        {/* Recommendation Note + Consult Button */}
        <div className="pt-2 border-t border-[#D6DCE1] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-[#1F2933]">
            <CheckCircle2 className="w-4 h-4 text-[#006B3C] shrink-0" />
            <span className="leading-snug">{getDynamicRecommendation()}</span>
          </div>

          <button
            onClick={() => {
              if (onAskGpt) {
                onAskGpt(
                  `Provide a detailed weather radar and rain forecast explanation for ${city}, ${state}. Current radar indicates rain probability ${rainProbability}%.`
                );
              }
            }}
            className="gov-btn-primary px-3 py-1.5 text-xs uppercase font-bold cursor-pointer shrink-0"
          >
            <span>{labels.askGpt}</span>
          </button>
        </div>
      </div>

      {/* 5. WARNING DETAIL MODAL */}
      {selectedWarning && (
        <div className="fixed inset-0 z-[2000] bg-[#17365D]/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white w-full max-w-md border border-[#D6DCE1] p-4 shadow-xl space-y-3 max-h-[85vh] overflow-y-auto font-sans">
            <div className="flex items-center justify-between border-b border-[#D6DCE1] pb-2">
              <div className="flex items-center gap-1.5 text-[#B42318]">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {selectedWarning.title || 'IMD Weather Warning'}
                </span>
              </div>
              <button
                onClick={() => setSelectedWarning(null)}
                className="p-1 hover:bg-[#F5F7F9] text-[#5B6770] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-[#1F2933]">
              <div>
                <span className="font-bold text-[#17365D]">Type: </span>
                <span>{selectedWarning.warning_type || 'Heavy Rainfall'}</span>
              </div>
              <div>
                <span className="font-bold text-[#17365D]">Affected Area: </span>
                <span>{selectedWarning.affected_area || selectedWarning.district || city}</span>
              </div>
              <div>
                <span className="font-bold text-[#17365D]">Issued: </span>
                <span>{selectedWarning.issued_at || 'Recent IMD Bulletin'}</span>
              </div>
              <div>
                <span className="font-bold text-[#17365D]">Severity: </span>
                <span className="gov-badge gov-badge-danger text-[9px] uppercase ml-1">
                  {selectedWarning.severity_label || selectedWarning.severity || 'Take Precautions'}
                </span>
              </div>
              <div className="pt-2 border-t border-[#D6DCE1]">
                <div className="font-bold text-[#17365D] mb-0.5">Summary:</div>
                <p className="text-[#5B6770] leading-relaxed">
                  {selectedWarning.description ||
                    'Intense rainfall is predicted over the area, which may lead to waterlogging on roads and reduced travel visibility.'}
                </p>
              </div>
              <div className="pt-1">
                <div className="font-bold text-[#17365D] mb-0.5">Advisory Action:</div>
                <p className="text-[#5B6770] leading-relaxed">
                  Avoid traveling through low-lying areas, keep emergency essentials handy, and monitor official IMD local weather updates.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const prompt = `The user is currently viewing an IMD weather warning: "${selectedWarning.title || 'Heavy Rain'}" for ${city}, ${state}. Explain what this warning means and what safety precautions a citizen should take right now.`;
                setSelectedWarning(null);
                if (onAskGpt) {
                  onAskGpt(prompt);
                }
              }}
              className="gov-btn-primary w-full py-2 text-xs uppercase font-bold cursor-pointer"
            >
              <span>Consult WeatherGPT Advisory</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPage;
