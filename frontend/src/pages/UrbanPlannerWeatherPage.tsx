import React, { useState, useEffect, useCallback } from 'react';
import { useWeather } from '../hooks/useWeather';
import { useLocation } from '../hooks/useLocation';
import { useLanguage } from '../context/LanguageContext';
import { useUI } from '../context/UIContext';
import { urbanIntelligenceService } from '../services/urbanIntelligenceService';
import {
  UrbanWeatherIntelligenceData,
  WaterloggingHotspotItem,
  DrainageRunoffMetricItem,
  HeatIslandMetricItem,
  InfrastructureExposureItem,
  UrbanPlannerBriefingResponse,
} from '../types/urbanIntelligence';

import { UrbanWeatherHeroCard } from '../components/roles/urban/UrbanWeatherHeroCard';
import { WaterloggingHotspotsCard } from '../components/roles/urban/WaterloggingHotspotsCard';
import { DrainageRunoffTimeline } from '../components/roles/urban/DrainageRunoffTimeline';
import { HeatIslandVulnerabilityCard } from '../components/roles/urban/HeatIslandVulnerabilityCard';
import { InfrastructureExposureCard } from '../components/roles/urban/InfrastructureExposureCard';
import { CitizenLightMultiDayForecast } from '../components/dashboard/CitizenLightMultiDayForecast';
import { CitizenAskFloatingBar } from '../components/dashboard/CitizenAskFloatingBar';
import {
  Building2,
  ChevronDown,
  RefreshCw,
  Clock,
  Waves,
} from 'lucide-react';

const AVAILABLE_URBAN_METROS = [
  { name: 'Pune Urban Core', lat: 18.5204, lon: 73.8567, corporation: 'PMC / PCMC' },
  { name: 'Mumbai MMR', lat: 19.0760, lon: 72.8777, corporation: 'BMC' },
  { name: 'Thane Corporation', lat: 19.2183, lon: 72.9781, corporation: 'TMC' },
  { name: 'Bengaluru Urban', lat: 12.9716, lon: 77.5946, corporation: 'BBMP' },
  { name: 'Chennai Basin', lat: 13.0827, lon: 80.2707, corporation: 'GCC' },
  { name: 'Delhi NCR (Yamuna)', lat: 28.6139, lon: 77.2090, corporation: 'MCD / NDMC' },
  { name: 'Hyderabad Core', lat: 17.3850, lon: 78.4867, corporation: 'GHMC' },
  { name: 'Ahmedabad Urban', lat: 23.0225, lon: 72.5714, corporation: 'AMC' },
];

interface UrbanPlannerWeatherPageProps {
  onOpenChatWithPrompt?: (prompt: string) => void;
}

export const UrbanPlannerWeatherPage: React.FC<UrbanPlannerWeatherPageProps> = ({
  onOpenChatWithPrompt,
}) => {
  const { location } = useLocation();
  const { language } = useLanguage();
  const { setActiveTab } = useUI();

  const [selectedMetro, setSelectedMetro] = useState(AVAILABLE_URBAN_METROS[0]);
  const [metroDropdownOpen, setMetroDropdownOpen] = useState(false);
  const [briefing, setBriefing] = useState<UrbanPlannerBriefingResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync initial location if available
  useEffect(() => {
    if (location?.city) {
      const match = AVAILABLE_URBAN_METROS.find((m) =>
        location.city?.toLowerCase().includes(m.name.toLowerCase().split(' ')[0])
      );
      if (match) setSelectedMetro(match);
    }
  }, [location?.city]);

  // Load live urban briefing from dedicated backend
  const loadBriefing = useCallback(async () => {
    setLoading(true);
    try {
      const data = await urbanIntelligenceService.getUrbanBriefing(
        selectedMetro.lat,
        selectedMetro.lon,
        selectedMetro.name
      );
      setBriefing(data);
    } catch (err) {
      console.error('[UrbanPlannerWeatherPage] Failed to fetch live urban briefing:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMetro]);

  useEffect(() => {
    loadBriefing();
  }, [loadBriefing]);

  const handleAskGpt = (promptText?: string) => {
    if (onOpenChatWithPrompt) {
      onOpenChatWithPrompt(
        promptText ||
          (language === 'mr'
            ? `आज ${selectedMetro.name} मध्ये वादळी पावसाच्या निचऱ्याची आणि पूर व्यवस्थापनाची स्थिती काय आहे?`
            : language === 'hi'
            ? `आज ${selectedMetro.name} में जलभराव और जल निकासी प्रबंधन की क्या स्थिति है?`
            : `What is the current urban flood risk, stormwater drainage surcharge, and UHI mitigation plan for ${selectedMetro.name}?`)
      );
    } else {
      setActiveTab('ask');
    }
  };

  const intel =
    briefing?.urban_intelligence ||
    urbanIntelligenceService.getFallbackIntelligence(
      selectedMetro.lat,
      selectedMetro.lon,
      selectedMetro.name
    );

  const hotspots =
    briefing?.waterlogging_hotspots ||
    urbanIntelligenceService.getFallbackHotspots(selectedMetro.name);

  const timeline =
    briefing?.drainage_timeline ||
    urbanIntelligenceService.getFallbackDrainageTimeline();

  const heatZones =
    briefing?.heat_island_zones ||
    urbanIntelligenceService.getFallbackHeatZones(selectedMetro.name);

  const infra =
    briefing?.infrastructure_exposure ||
    urbanIntelligenceService.getFallbackInfrastructure(selectedMetro.name);

  return (
    <div className="w-full px-3.5 sm:px-4 pt-3 pb-24 space-y-3.5 font-['Arimo',sans-serif]">
      {/* 1. Official Jurisdiction Selector Bar */}
      <div className="gov-panel p-2.5 bg-white border border-[#D6DCE1] rounded-xs shadow-xs flex items-center justify-between gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setMetroDropdownOpen(!metroDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xs bg-[#F8FAFC] border border-[#D6DCE1] hover:border-[#17365D] text-[#17365D] font-bold text-xs transition-all cursor-pointer shadow-2xs"
          >
            <Building2 className="w-3.5 h-3.5 text-[#006B3C]" />
            <span>{selectedMetro.name}</span>
            <span className="text-[10px] text-[#5B6770] font-normal hidden sm:inline">({selectedMetro.corporation})</span>
            <ChevronDown className={`w-3 h-3 text-[#5B6770] transition-transform ${metroDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {metroDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 rounded-xs bg-white border border-[#D6DCE1] shadow-lg z-50 overflow-hidden">
              <div className="p-2 border-b border-[#D6DCE1] text-[10px] font-black uppercase text-[#5B6770] tracking-wider bg-[#F8FAFC]">
                Select Municipal Corporation
              </div>
              <div className="max-h-56 overflow-y-auto p-1 space-y-0.5">
                {AVAILABLE_URBAN_METROS.map((m) => (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => {
                      setSelectedMetro(m);
                      setMetroDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xs text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      selectedMetro.name === m.name
                        ? 'bg-[#17365D] text-white'
                        : 'text-[#1F2933] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    <div>
                      <div>{m.name}</div>
                      <div className="text-[9px] font-normal opacity-75">{m.corporation}</div>
                    </div>
                    {selectedMetro.name === m.name && (
                      <span className="text-[9px] uppercase font-black text-emerald-300">Active</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={loadBriefing}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xs bg-white border border-[#D6DCE1] text-xs font-bold text-[#17365D] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-[#17365D]' : ''}`} />
          <span className="hidden sm:inline">Sync Live</span>
        </button>
      </div>

      {/* 2. Master Hero Card (Theme 9: Urban Weather Intelligence) */}
      <UrbanWeatherHeroCard
        data={intel}
        loading={loading}
        onRefresh={loadBriefing}
        onOpenChatWithPrompt={handleAskGpt}
      />

      {/* 3. Waterlogging Hotspots Card */}
      <WaterloggingHotspotsCard
        hotspots={hotspots}
        onOpenChatWithPrompt={handleAskGpt}
      />

      {/* 4. Drainage Runoff Timeline (Hydrograph) */}
      <DrainageRunoffTimeline timeline={timeline} />

      {/* 5. Urban Heat Island (UHI) Vulnerability */}
      <HeatIslandVulnerabilityCard zones={heatZones} />

      {/* 6. Critical Infrastructure Exposure */}
      <InfrastructureExposureCard infrastructure={infra} />

      {/* 7. Multi-Day Atmospheric Outlook */}
      <div className="gov-panel bg-white border border-[#D6DCE1] rounded-xs shadow-xs text-[#1F2933]">
        <div className="gov-panel-header bg-white border-b border-[#D6DCE1] px-3.5 py-2.5 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#17365D]">
            5-Day Municipal Weather Horizon
          </h3>
          <span className="text-[10px] font-bold text-[#5B6770] uppercase tracking-widest">
            City Forecast
          </span>
        </div>
        <div className="p-3">
          <CitizenLightMultiDayForecast />
        </div>
      </div>

      {/* Floating Interactive Chat Bar */}
      <CitizenAskFloatingBar
        onOpenChat={() => handleAskGpt()}
      />
    </div>
  );
};
