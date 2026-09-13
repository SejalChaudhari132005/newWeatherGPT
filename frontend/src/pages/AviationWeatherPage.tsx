import React, { useState, useEffect, useCallback } from 'react';
import { useWeather } from '../hooks/useWeather';
import { useAuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useUI } from '../context/UIContext';
import { aviationIntelligenceService } from '../services/aviationIntelligenceService';
import {
  AviationBriefingData,
  AirportCatalogItem,
} from '../types/aviationIntelligence';
import { AviationHeroCard } from '../components/roles/aviation/AviationHeroCard';
import { AirportComparisonModal } from '../components/roles/aviation/AirportComparisonModal';
import { CitizenLightMultiDayForecast } from '../components/dashboard/CitizenLightMultiDayForecast';
import { CitizenAskFloatingBar } from '../components/dashboard/CitizenAskFloatingBar';
import {
  Plane,
  Compass,
  ArrowLeftRight,
  Clock,
  Wind,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Sparkles,
  Navigation,
} from 'lucide-react';

interface AviationWeatherPageProps {
  onOpenChatWithPrompt?: (prompt: string) => void;
}

export const AviationWeatherPage: React.FC<AviationWeatherPageProps> = ({
  onOpenChatWithPrompt,
}) => {
  const { weather, loading: weatherLoading } = useWeather();
  const { language } = useLanguage();
  const { setActiveTab } = useUI();
  const { profile } = useAuthContext();

  const [catalog, setCatalog] = useState<AirportCatalogItem[]>([]);
  const [selectedIcao, setSelectedIcao] = useState('VABB');
  const [selectedRunwayOverride, setSelectedRunwayOverride] = useState<string | undefined>(undefined);
  const [briefingData, setBriefingData] = useState<AviationBriefingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Load Airport Catalog
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const list = await aviationIntelligenceService.getAirportsCatalog();
        setCatalog(list);
      } catch (e) {
        console.warn('[AviationWeatherPage] Could not load airport catalog:', e);
      }
    };
    loadCatalog();
  }, []);

  // Load Aviation Briefing Data
  const loadBriefing = useCallback(async () => {
    setLoading(true);
    try {
      const data = await aviationIntelligenceService.getAviationBriefing({
        icao: selectedIcao,
        activeRunwayOverride: selectedRunwayOverride,
      });
      setBriefingData(data);
    } catch (err: any) {
      console.error('[AviationWeatherPage] Failed to load aviation briefing:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedIcao, selectedRunwayOverride]);

  useEffect(() => {
    loadBriefing();
  }, [loadBriefing]);

  const handleAskGpt = (promptText?: string) => {
    if (onOpenChatWithPrompt) {
      onOpenChatWithPrompt(
        promptText ||
          (language === 'mr'
            ? `आज ${briefingData?.airport_name || 'विमानतळावर'} उड्डाण आणि रनवे क्रॉसविंडची स्थिती कशी आहे? कृपया मार्गदर्शन करा.`
            : language === 'hi'
            ? `आज ${briefingData?.airport_name || 'हवाई अड्डे पर'} उड़ान एवं रनवे क्रॉसविंड की स्थिति कैसी है? कृपया मार्गदर्शन करें।`
            : `How are the flight operating conditions, crosswind vectors, and ceiling at ${briefingData?.airport_name || selectedIcao} today? Please advise.`)
      );
    } else {
      setActiveTab('ask');
    }
  };

  // Compute 12-Hour Aerodrome Runway & Wind Progression
  const activeRunwayHeading = briefingData?.active_runway?.runway_heading_deg ?? 272;
  const baseWindKts = briefingData?.active_runway?.wind_speed_kts ?? Math.round((weather?.current?.wind_speed ?? 10) * 0.539957);
  const hourlySlots = (weather?.hourly || []).slice(0, 12).map((h, idx) => {
    const windSpeedKts = Math.round(baseWindKts + (idx % 3 === 0 ? 2 : idx % 2 === 0 ? -1 : 0));
    const windDirDeg = 240 + ((idx * 15) % 60);
    const angleRad = Math.abs(windDirDeg - activeRunwayHeading) * (Math.PI / 180);
    const crosswindKts = Math.round(windSpeedKts * Math.sin(angleRad));
    const isExceeded = crosswindKts > 20;

    return {
      time: h.time || `${idx}:00`,
      temp: h.temp ?? 30,
      condition: h.condition || 'Clear',
      rainProb: h.rainProb ?? 0,
      windSpeedKts,
      windDirDeg,
      crosswindKts,
      isExceeded,
      flightCategory: isExceeded || (h.rainProb ?? 0) > 60 ? 'MVFR' : 'VFR',
    };
  });

  return (
    <div className="w-full px-3.5 sm:px-4 pt-3 pb-24 space-y-3.5 font-['Arimo',sans-serif]">
      {/* 1. Official Aviation Observatory Hero Card */}
      <AviationHeroCard
        briefingData={briefingData}
        catalog={
          catalog.length > 0
            ? catalog
            : aviationIntelligenceService.getFallbackAirportsCatalog()
        }
        selectedIcao={selectedIcao}
        onSelectIcao={(icao) => {
          setSelectedIcao(icao);
          setSelectedRunwayOverride(undefined);
        }}
        selectedRunwayId={briefingData?.active_runway?.runway_id}
        onSelectRunwayId={(rwyId) => setSelectedRunwayOverride(rwyId)}
        onRefresh={loadBriefing}
        loading={loading || weatherLoading}
      />

      {/* Flight Operations Quick Navigation & Route Comparison Banner */}
      <div className="gov-panel p-3 bg-[#17365D] text-white space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-xs bg-[#FF9933] text-[#0F172A] flex items-center justify-center shrink-0 font-black">
              <Plane className="w-3.5 h-3.5 text-[#17365D]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wide text-white">
                  Flight Operations & Dispatch
                </span>
                <span className="text-[9px] font-bold bg-[#006B3C] text-white px-1.5 py-0.2 rounded-xs">
                  METAR / TAF / Corridors
                </span>
              </div>
              <p className="text-[11px] text-[#CBD5E1] truncate">
                Interactive runway crosswinds, weather corridor intelligence, and alternate comparison
              </p>
            </div>
          </div>
        </div>

        {/* Clean, Non-overlapping Action Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('radar')}
            className="w-full py-1.5 px-2 bg-[#006B3C] hover:bg-[#008249] text-white text-xs font-bold uppercase rounded-xs transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5 border border-[#005530]"
          >
            <Navigation className="w-3.5 h-3.5 text-white" />
            <span>SkyRoute</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('advisories')}
            className="w-full py-1.5 px-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold uppercase rounded-xs transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5 border border-[#6D28D9]"
          >
            <Plane className="w-3.5 h-3.5 text-white" />
            <span>Flight Advisory</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCompareOpen(true)}
            className="col-span-2 sm:col-span-1 py-1.5 px-2 bg-white/15 hover:bg-white/25 text-white text-xs font-bold uppercase rounded-xs transition-colors cursor-pointer border border-white/20 flex items-center justify-center gap-1.5"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-amber-300" />
            <span>Compare</span>
          </button>
        </div>
      </div>

      {/* 2. Hourly Aerodrome Progression & Crosswind Drift */}
      <div className="gov-panel">
        <div className="gov-panel-header flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#17365D]" />
            <h3 className="text-xs font-bold text-[#17365D] uppercase tracking-wider">
              {language === 'mr'
                ? 'तासनिहाय हवामान व क्रॉसविंड प्रवाह'
                : language === 'hi'
                ? 'घंटेवार मौसम एवं क्रॉसविंड प्रवाह'
                : '12-Hour Aerodrome & Crosswind Drift Forecast'}
            </h3>
          </div>
          <span className="text-[10px] text-[#5B6770] font-mono">
            RWY {briefingData?.active_runway?.runway_id || '27'} ({activeRunwayHeading}°)
          </span>
        </div>

        {/* Horizontal Hourly Forecast Timeline */}
        <div className="p-3 bg-white overflow-x-auto no-scrollbar">
          <div className="flex gap-2 min-w-max">
            {hourlySlots.map((slot, index) => (
              <div
                key={index}
                className={`p-2.5 rounded-xs border flex flex-col items-center justify-between gap-1 w-24 text-center ${
                  slot.isExceeded
                    ? 'bg-[#FEF2F2] border-[#FCA5A5]'
                    : 'bg-[#F8FAFC] border-[#D6DCE1]'
                }`}
              >
                <span className="text-[10px] font-bold text-[#5B6770] uppercase">
                  {slot.time}
                </span>

                <div className="text-base font-black text-[#1F2933]">
                  {Math.round(slot.temp)}°C
                </div>

                {/* Wind & Crosswind */}
                <div className="w-full bg-white border border-[#E2E8F0] rounded-xs p-1 text-[10px] space-y-0.5 font-mono">
                  <div className="font-bold text-[#17365D] flex items-center justify-center gap-0.5">
                    <Wind className="w-2.5 h-2.5" />
                    <span>{slot.windSpeedKts} kts</span>
                  </div>
                  <div
                    className={`font-bold ${
                      slot.isExceeded ? 'text-[#B42318]' : 'text-[#006B3C]'
                    }`}
                  >
                    X-Wind: {slot.crosswindKts}k
                  </div>
                </div>

                {/* Flight Category Pill */}
                <span
                  className={`px-1.5 py-0.2 text-[9px] font-black uppercase rounded-xs ${
                    slot.flightCategory === 'VFR'
                      ? 'bg-[#006B3C] text-white'
                      : 'bg-[#FF9933] text-[#0F172A]'
                  }`}
                >
                  {slot.flightCategory}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. 7-Day Terminal Aerodrome Multi-Day Trend */}
      <CitizenLightMultiDayForecast
        daily={weather?.daily || []}
        onViewDetails={() => setActiveTab('home')}
      />

      {/* 4. Aviation AI Dispatcher Ask Copilot Floating Bar */}
      <CitizenAskFloatingBar
        onOpenChat={() => handleAskGpt()}
      />

      {/* Airport Comparison Modal */}
      <AirportComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        catalog={
          catalog.length > 0
            ? catalog
            : aviationIntelligenceService.getFallbackAirportsCatalog()
        }
        defaultOriginIcao={selectedIcao}
        defaultDestIcao={selectedIcao === 'VAPO' ? 'VABB' : 'VAPO'}
      />
    </div>
  );
};

export default AviationWeatherPage;
