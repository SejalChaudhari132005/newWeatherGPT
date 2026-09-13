import React, { useState, useEffect, useCallback } from 'react';
import { useWeather } from '../hooks/useWeather';
import { useLocation } from '../hooks/useLocation';
import { useAuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useUI } from '../context/UIContext';
import { disasterIntelligenceService } from '../services/disasterIntelligenceService';
import {
  SituationalRiskData,
  ActiveAlertItem,
  VulnerableZoneItem,
  DisasterBriefingResponse,
} from '../types/disasterIntelligence';

import { SituationalRiskHeroCard } from '../components/roles/disaster/SituationalRiskHeroCard';
import { ActiveAlertsStreamCard } from '../components/roles/disaster/ActiveAlertsStreamCard';
import { RainfallIntensityFloodGauge } from '../components/roles/disaster/RainfallIntensityFloodGauge';
import { LightningWindHazardCard } from '../components/roles/disaster/LightningWindHazardCard';
import { VulnerableZonesTriageCard } from '../components/roles/disaster/VulnerableZonesTriageCard';
import { EmergencyBroadcastHelplineCard } from '../components/roles/disaster/EmergencyBroadcastHelplineCard';
import { CitizenLightMultiDayForecast } from '../components/dashboard/CitizenLightMultiDayForecast';
import { CitizenAskFloatingBar } from '../components/dashboard/CitizenAskFloatingBar';
import {
  ShieldAlert,
  ChevronDown,
  RefreshCw,
  AlertTriangle,
  Radio,
  Clock,
  Navigation,
} from 'lucide-react';

const AVAILABLE_DISASTER_DISTRICTS = [
  { name: 'Pune District', lat: 18.5204, lon: 73.8567, state: 'Maharashtra' },
  { name: 'Mumbai MMR', lat: 19.0760, lon: 72.8777, state: 'Maharashtra' },
  { name: 'Thane District', lat: 19.2183, lon: 72.9781, state: 'Maharashtra' },
  { name: 'Raigad District', lat: 18.5158, lon: 73.1812, state: 'Maharashtra' },
  { name: 'Ratnagiri Coastal', lat: 16.9902, lon: 73.3120, state: 'Maharashtra' },
  { name: 'Chennai Basin', lat: 13.0827, lon: 80.2707, state: 'Tamil Nadu' },
  { name: 'Bengaluru Urban', lat: 12.9716, lon: 77.5946, state: 'Karnataka' },
  { name: 'Delhi NCR (Yamuna)', lat: 28.6139, lon: 77.2090, state: 'Delhi' },
  { name: 'Bhubaneswar (Mahanadi)', lat: 20.2961, lon: 85.8245, state: 'Odisha' },
  { name: 'Guwahati (Brahmaputra)', lat: 26.1445, lon: 91.7362, state: 'Assam' },
];

interface DisasterWeatherPageProps {
  onOpenChatWithPrompt?: (prompt: string) => void;
}

export const DisasterWeatherPage: React.FC<DisasterWeatherPageProps> = ({
  onOpenChatWithPrompt,
}) => {
  const { weather, loading: weatherLoading } = useWeather();
  const { location } = useLocation();
  const { language } = useLanguage();
  const { setActiveTab } = useUI();
  const { profile } = useAuthContext();

  const [selectedDistrict, setSelectedDistrict] = useState(AVAILABLE_DISASTER_DISTRICTS[0]);
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const [briefing, setBriefing] = useState<DisasterBriefingResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync initial location if available
  useEffect(() => {
    if (location?.city) {
      const match = AVAILABLE_DISASTER_DISTRICTS.find((d) =>
        location.city?.toLowerCase().includes(d.name.toLowerCase().split(' ')[0])
      );
      if (match) setSelectedDistrict(match);
    }
  }, [location?.city]);

  // Load live disaster briefing from dedicated backend
  const loadBriefing = useCallback(async () => {
    setLoading(true);
    try {
      const data = await disasterIntelligenceService.getDisasterBriefing(
        selectedDistrict.lat,
        selectedDistrict.lon,
        selectedDistrict.name
      );
      setBriefing(data);
    } catch (err) {
      console.error('[DisasterWeatherPage] Failed to fetch live disaster briefing:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDistrict]);

  useEffect(() => {
    loadBriefing();
  }, [loadBriefing]);

  const handleAskGpt = (promptText?: string) => {
    if (onOpenChatWithPrompt) {
      onOpenChatWithPrompt(
        promptText ||
          (language === 'mr'
            ? `आज ${selectedDistrict.name} मध्ये पूर आणि आपत्ती व्यवस्थापनाची स्थिती कशी आहे? कृपया ईओसी मार्गदर्शक तत्त्वे सांगा.`
            : language === 'hi'
            ? `आज ${selectedDistrict.name} में बाढ़ और आपदा प्रबंधन की स्थिति कैसी है? कृपया ईओसी दिशानिर्देश बताएं।`
            : `What is the current situational risk, flood vulnerability, and emergency response plan for ${selectedDistrict.name}?`)
      );
    } else {
      setActiveTab('ask');
    }
  };

  const situational =
    briefing?.situational_risk ||
    disasterIntelligenceService.getFallbackSituationalRisk(
      selectedDistrict.lat,
      selectedDistrict.lon,
      selectedDistrict.name
    );

  const alerts = briefing?.active_alerts || disasterIntelligenceService.getFallbackAlerts(selectedDistrict.name);
  const zones = briefing?.vulnerable_zones || disasterIntelligenceService.getFallbackVulnerableZones(selectedDistrict.name);

  return (
    <div className="w-full px-3.5 sm:px-4 pt-3 pb-24 space-y-3.5 font-['Arimo',sans-serif]">
      {/* 1. Official Jurisdiction Selector Bar */}
      <div className="gov-panel p-2.5 bg-white border border-[#D6DCE1] rounded-xs shadow-xs flex items-center justify-between gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setDistrictDropdownOpen(!districtDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xs bg-[#F8FAFC] border border-[#D6DCE1] hover:border-[#17365D] text-[#17365D] font-bold text-xs transition-all cursor-pointer shadow-2xs"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#B42318]" />
            <span>{selectedDistrict.name}</span>
            <span className="text-[10px] text-[#5B6770] font-normal hidden sm:inline">({selectedDistrict.state})</span>
            <ChevronDown className={`w-3 h-3 text-[#5B6770] transition-transform ${districtDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {districtDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 rounded-xs bg-white border border-[#D6DCE1] shadow-lg z-50 overflow-hidden">
              <div className="p-2 border-b border-[#D6DCE1] text-[10px] font-black uppercase text-[#5B6770] tracking-wider bg-[#F8FAFC]">
                Select District / Operational Jurisdiction
              </div>
              <div className="max-h-56 overflow-y-auto p-1 space-y-0.5">
                {AVAILABLE_DISASTER_DISTRICTS.map((d) => (
                  <button
                    key={d.name}
                    type="button"
                    onClick={() => {
                      setSelectedDistrict(d);
                      setDistrictDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xs text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      selectedDistrict.name === d.name
                        ? 'bg-[#17365D] text-white'
                        : 'text-[#1F2933] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    <div>
                      <div>{d.name}</div>
                      <div className="text-[9px] font-normal opacity-75">{d.state}</div>
                    </div>
                    {selectedDistrict.name === d.name && (
                      <span className="text-[9px] uppercase font-black text-amber-300">Active</span>
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

      {/* 2. Master Hero Card (Theme 8: Situational Weather Intelligence) */}
      <SituationalRiskHeroCard
        data={situational}
        loading={loading}
        onRefresh={loadBriefing}
        onOpenChatWithPrompt={handleAskGpt}
      />

      {/* 3. Active Alert Stream Feed */}
      <ActiveAlertsStreamCard
        alerts={alerts}
        onOpenChatWithPrompt={handleAskGpt}
      />

      {/* 4. Rainfall Intensity & Flood Hazard Gauges */}
      <RainfallIntensityFloodGauge
        rainfallIntensityMmh={situational.rainfall_intensity_mmh}
        rainfall24hMm={situational.rainfall_24h_mm}
        floodScore={situational.flood_risk_score}
        floodRiskLevel={situational.flood_risk_level}
      />

      {/* 5. Convective Lightning & Squall Wind Hazard Card */}
      <LightningWindHazardCard
        lightningDensity={situational.lightning_strike_density}
        capeIndex={situational.convective_cape_index}
        windSpeedKmh={situational.wind_speed_kmh}
        windGustKmh={situational.wind_gust_kmh}
      />

      {/* 6. Vulnerable Administrative Zones Triage */}
      <VulnerableZonesTriageCard zones={zones} />

      {/* 7. Emergency Operations & Rescue Helplines */}
      <EmergencyBroadcastHelplineCard contacts={briefing?.emergency_contacts} />

      {/* 8. Multi-Day Atmospheric Outlook */}
      <div className="gov-panel bg-white border border-[#D6DCE1] rounded-xs shadow-xs text-[#1F2933]">
        <div className="gov-panel-header bg-white border-b border-[#D6DCE1] px-3.5 py-2.5 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#17365D]">
            5-Day Severe Weather Horizon
          </h3>
          <span className="text-[10px] font-bold text-[#5B6770] uppercase tracking-widest">
            Synoptic Outlook
          </span>
        </div>
        <div className="p-3">
          <CitizenLightMultiDayForecast />
        </div>
      </div>

      {/* Floating Interactive Emergency Chat Bar */}
      <CitizenAskFloatingBar
        onOpenChat={() => handleAskGpt()}
      />
    </div>
  );
};
