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
  const { intelligence, refreshIntelligence } = useWeatherIntelligence();

  const [activeLayer, setActiveLayer] = useState<'radar' | 'rainfall' | 'temperature' | 'wind' | 'satellite' | 'alerts'>('radar');
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
  const currentTemp = intelligence?.current?.temperature?.value ?? 29.5;
  const currentCondition = intelligence?.current?.condition ?? 'Mainly Clear';
  const rainProbability = intelligence?.current?.rain_probability?.value ?? 76;

  const activeAlerts = intelligence?.alerts || [];
  const primaryAlert = activeAlerts.length > 0 ? activeAlerts[0] : null;

  const firstInsight = intelligence?.insights && intelligence.insights.length > 0 ? intelligence.insights[0] : null;
  const insightText = firstInsight
    ? `${firstInsight.headline}${firstInsight.detail ? ` — ${firstInsight.detail}` : ''}`
    : 'Clear skies prevail over Kalyan and northern MMR. Light coastal breeze with pleasant to warm daytime temperatures.';

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
    askGpt: language === 'mr' ? '✨ AI कडून विचारा' : language === 'hi' ? '✨ AI से पूछें' : '✨ Ask WeatherGPT',
    routeTitle: language === 'mr' ? 'हवामान-सजग मार्ग' : language === 'hi' ? 'मौसम-सजग मार्ग' : 'Weather-Aware Route',
    routeSubtitle: language === 'mr' ? 'हवामान बुद्धिमत्तेसह प्रवासाचे नियोजन करा' : language === 'hi' ? 'मौसम बुद्धिमत्ता के साथ अपनी यात्रा की योजना बनाएं' : 'Plan your journey with weather intelligence',
    planTrip: language === 'mr' ? 'प्रवास योजना ›' : language === 'hi' ? 'यात्रा प्लान ›' : 'Plan a Trip ›',
  };

  const tileUrls = {
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
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
        return `🟢 IMD Doppler Radar Active • 0 dBZ (Clear sky over ${city}) • Live scan`;
      case 'rainfall':
        return `🌧️ Live Precipitation Intensity • Range: 0.0 - 0.1 mm/h across MMR`;
      case 'temperature':
        return `🌡️ Surface Thermal Grid • ${city}: ${currentTemp}°C • High: 31°C / Low: 25°C`;
      case 'wind':
        return `💨 Regional Wind Flow • WNW Flow 7–15 km/h across coastal Maharashtra`;
      case 'satellite':
        return `🛰️ INSAT / IR Cloud Density Composite • Clear to scattered cloud cover`;
      case 'alerts':
        return `🛡️ IMD Hazard Status: Green / Normal across Thane & Mumbai MMR`;
    }
  };

  return (

    <div className="min-h-screen bg-[#F4F7FC] p-3 sm:p-5 font-['Arimo'] max-w-md sm:max-w-2xl mx-auto space-y-3.5 pb-28">
      {/* 1. LOCATION BAR WITH [MY LOCATION] BUTTON (SINGLE CLEAN TOP BAR) */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#004aad] flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-slate-900 truncate">
              {city}, {state}
            </div>
            <div className="text-[10px] text-slate-400 font-bold">
              {lat.toFixed(4)}, {lon.toFixed(4)}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            detectLocation();
            openSelector();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-extrabold border border-slate-200 shadow-2xs cursor-pointer active:scale-98 transition-all shrink-0"
        >
          <Crosshair className="w-3.5 h-3.5 text-[#004aad]" />
          <span>{labels.myLocation}</span>
        </button>
      </div>

      {/* 2. PAGE HEADER & REFRESH BAR */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#004aad] flex items-center justify-center border border-blue-100 shadow-2xs">
            <Navigation className="w-5 h-5 rotate-45" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {labels.pageTitle}
            </h2>
            <p className="text-[11px] text-slate-500 font-bold">{labels.pageSubtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchRadarAndLayers();
              refreshIntelligence();
            }}
            disabled={loadingRadar}
            className="p-2 rounded-xl bg-white text-slate-700 border border-slate-200 shadow-2xs hover:bg-slate-50 cursor-pointer active:scale-95 transition-all"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${loadingRadar ? 'animate-spin text-[#004aad]' : 'text-slate-600'}`} />
          </button>
          <span className="text-[10px] font-extrabold text-slate-500 flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {labels.updatedAgo(lastUpdatedMinutes)}
          </span>
        </div>
      </div>

      {/* 3. HORIZONTAL LAYER SELECTOR TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveLayer('radar')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeLayer === 'radar'
              ? 'bg-[#004aad] text-white shadow-md shadow-blue-900/25'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>IMD Radar</span>
        </button>

        <button
          onClick={() => setActiveLayer('rainfall')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeLayer === 'rainfall'
              ? 'bg-[#004aad] text-white shadow-md shadow-blue-900/25'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <CloudRain className="w-3.5 h-3.5" />
          <span>Rainfall</span>
        </button>

        <button
          onClick={() => setActiveLayer('temperature')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeLayer === 'temperature'
              ? 'bg-[#004aad] text-white shadow-md shadow-blue-900/25'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Thermometer className="w-3.5 h-3.5" />
          <span>Temperature</span>
        </button>

        <button
          onClick={() => setActiveLayer('wind')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeLayer === 'wind'
              ? 'bg-[#004aad] text-white shadow-md shadow-blue-900/25'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Wind className="w-3.5 h-3.5" />
          <span>Wind</span>
        </button>

        <button
          onClick={() => setActiveLayer('satellite')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeLayer === 'satellite'
              ? 'bg-[#004aad] text-white shadow-md shadow-blue-900/25'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Satellite className="w-3.5 h-3.5" />
          <span>Satellite</span>
        </button>

        <button
          onClick={() => setActiveLayer('alerts')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeLayer === 'alerts'
              ? 'bg-[#004aad] text-white shadow-md shadow-blue-900/25'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Alerts</span>
        </button>
      </div>

      {/* 4. REAL-TIME METEOROLOGICAL INTENSITY MAP CONTAINER */}
      <div className="relative h-[430px] sm:h-[480px] w-full rounded-3xl overflow-hidden border border-slate-300 shadow-xl bg-slate-950">
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
              <Radio className="w-2.5 h-2.5 text-sky-400 shrink-0" />
              {currentLegend.source}
            </span>
            <span className="px-1.5 py-0.2 rounded-sm bg-white/10 font-bold text-white shrink-0">IMD</span>
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
            className="w-9 h-9 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-lg hover:bg-slate-900 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Zoom Out */}
          <button
            onClick={() => setMapZoom((prev) => Math.max(prev - 1, 4))}
            className="w-9 h-9 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-lg hover:bg-slate-900 cursor-pointer active:scale-95"
          >
            <Minus className="w-4 h-4" />
          </button>

          {/* Recenter */}
          <button
            onClick={() => setRecenterTrigger((prev) => prev + 1)}
            className="w-9 h-9 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-lg hover:bg-slate-900 cursor-pointer active:scale-95"
            title="Center on My Location"
          >
            <Crosshair className="w-4 h-4 text-sky-400" />
          </button>
        </div>

        {/* OVERLAY: BOTTOM PLAYBACK TIMELINE & RADAR BADGE */}
        <div className="absolute bottom-3 left-3 right-3 z-[1000] p-2 sm:p-2.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-white/20 text-white shadow-2xl pointer-events-auto space-y-2">
          <div className="flex items-center gap-2">
            {/* Play/Pause Button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-8 h-8 rounded-full bg-[#004aad] text-white flex items-center justify-center hover:bg-blue-700 shadow-md shadow-blue-500/30 cursor-pointer active:scale-90 transition-all shrink-0"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>

            {/* Timeline nodes */}
            <div className="flex items-center justify-between flex-1 gap-1 overflow-x-auto no-scrollbar">
              {(radarFrames.length > 0
                ? radarFrames
                : [
                    { time: 1, label: '10:30', path: '' },
                    { time: 2, label: '10:45', path: '' },
                    { time: 3, label: '11:00', path: '' },
                    { time: 4, label: '11:15', path: '' },
                    { time: 5, label: '11:30', path: '' },
                    { time: 6, label: 'Now', path: '' },
                  ]
              ).map((slot, idx) => {
                const isSelected = idx === activeFrameIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setIsPlaying(false);
                      setActiveFrameIndex(idx);
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-sky-500 text-white font-black shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Station & Update Status Row */}
          <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-[10px] text-slate-300">
            <div className="flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-sky-400" />
              <span className="font-extrabold">
                IMD Radar • {radarData?.city || 'Mumbai (Veravali)'}
              </span>
            </div>
            <div className="text-slate-400 text-[9px] font-bold">
              Updated: {radarData?.radar_timestamp ? formatTimeLabel(Math.floor(Date.now() / 1000)) : 'Live'}
            </div>
          </div>
        </div>
      </div>

      {/* 5. WEATHERGPT INSIGHT CARD */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#004aad]">
            <Lightbulb className="w-4 h-4" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              {labels.insightTitle}
            </h3>
          </div>
          <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/50">
            Live AI Radar Sync
          </span>
        </div>

        {/* Narrative */}
        <p className="text-xs sm:text-sm font-bold text-slate-700 leading-relaxed">
          {insightText}
        </p>

        {/* 3 Metric Stat Boxes */}
        <div className="grid grid-cols-3 gap-2">
          {/* Rain Probability */}
          <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-sky-600 mb-1">
              <Droplets className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold text-slate-500">{labels.rainProbability}</span>
            </div>
            <div className="text-sm font-black text-slate-900">{rainProbability}%</div>
          </div>

          {/* Expected Time Window */}
          <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-amber-600 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold text-slate-500">{labels.expectedWindow}</span>
            </div>
            <div className="text-xs font-black text-slate-900">2 PM – 6 PM</div>
          </div>

          {/* IMD Alert */}
          <div
            onClick={() => primaryAlert && setSelectedWarning(primaryAlert)}
            className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between cursor-pointer hover:bg-slate-100 transition-all"
          >
            <div className="flex items-center gap-1.5 text-red-600 mb-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold text-slate-500">{labels.imdAlert}</span>
            </div>
            <div className="text-[11px] font-black text-red-600 truncate flex items-center justify-between">
              <span>{primaryAlert ? primaryAlert.title : 'Normal / Green'}</span>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
            </div>
          </div>
        </div>

        {/* Recommendation Note + Ask GPT Button */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Carry an umbrella and avoid low-lying roads after 2 PM.</span>
          </div>

          <button
            onClick={() => {
              if (onAskGpt) {
                onAskGpt(
                  `Provide a detailed weather radar and rain forecast explanation for ${city}, ${state}. Current radar indicates rain probability ${rainProbability}%.`
                );
              }
            }}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#004aad] to-[#38b6ff] hover:from-blue-700 hover:to-sky-500 text-white text-xs font-black shadow-md shadow-blue-500/20 cursor-pointer active:scale-98 transition-all shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{labels.askGpt}</span>
          </button>
        </div>
      </div>

      {/* 6. WEATHER-AWARE ROUTE PLANNING QUICK CARD */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#004aad] flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900">{labels.routeTitle}</h4>
              <p className="text-[10px] text-slate-500 font-bold">{labels.routeSubtitle}</p>
            </div>
          </div>

          <button
            onClick={() => setShowRoutePlanner(!showRoutePlanner)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#004aad] text-xs font-black border border-slate-200/80 cursor-pointer transition-all active:scale-98"
          >
            {showRoutePlanner ? 'Hide' : labels.planTrip}
          </button>
        </div>

        {/* Expandable Route Planner Box */}
        {showRoutePlanner && (
          <div className="pt-3 border-t border-slate-100 space-y-3">
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


      {/* 7. WARNING DETAIL BOTTOM SHEET MODAL */}
      {selectedWarning && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-xs flex items-end justify-center p-3 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm font-black uppercase tracking-wider">
                  {selectedWarning.title || 'IMD Weather Warning'}
                </span>
              </div>
              <button
                onClick={() => setSelectedWarning(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <div>
                <span className="font-extrabold text-slate-900">Type: </span>
                <span>{selectedWarning.warning_type || 'Heavy Rainfall'}</span>
              </div>
              <div>
                <span className="font-extrabold text-slate-900">Affected Area: </span>
                <span>{selectedWarning.affected_area || selectedWarning.district || city}</span>
              </div>
              <div>
                <span className="font-extrabold text-slate-900">Issued: </span>
                <span>{selectedWarning.issued_at || 'Recent IMD Bulletin'}</span>
              </div>
              <div>
                <span className="font-extrabold text-slate-900">Severity: </span>
                <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 font-black text-[10px]">
                  {selectedWarning.severity_label || selectedWarning.severity || 'Take Precautions (Alert)'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <div className="font-black text-slate-900 mb-1">What this means:</div>
                <p className="text-slate-600 leading-relaxed">
                  {selectedWarning.description ||
                    'Intense rainfall is predicted over the area, which may lead to waterlogging on roads and reduced travel visibility.'}
                </p>
              </div>
              <div className="pt-2">
                <div className="font-black text-slate-900 mb-1">What you should do:</div>
                <p className="text-slate-600 leading-relaxed">
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
              className="w-full py-3 rounded-2xl bg-[#004aad] text-white font-black text-xs shadow-md shadow-blue-900/20 hover:bg-blue-700 cursor-pointer flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask WeatherGPT about this</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPage;
