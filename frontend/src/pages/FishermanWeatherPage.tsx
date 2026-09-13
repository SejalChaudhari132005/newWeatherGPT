import React, { useState, useEffect, useCallback } from 'react';
import { useWeather } from '../hooks/useWeather';
import { useAuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useUI } from '../context/UIContext';
import { fisherIntelligenceService } from '../services/fisherIntelligenceService';
import { MarineDecisionData } from '../types/fisherIntelligence';
import { FishermanHeroCard, HarborInfo } from '../components/roles/fisher/FishermanHeroCard';
import { CitizenLightMultiDayForecast } from '../components/dashboard/CitizenLightMultiDayForecast';
import { CitizenAskFloatingBar } from '../components/dashboard/CitizenAskFloatingBar';
import { Waves, Wind, Clock } from 'lucide-react';

export const INDIAN_COASTAL_HARBORS: HarborInfo[] = [
  { name: 'Sassoon Docks (Mumbai)', lat: 18.913, lon: 72.825, state: 'Maharashtra' },
  { name: 'Versova Harbor (Mumbai)', lat: 19.135, lon: 72.812, state: 'Maharashtra' },
  { name: 'Mirkarwada (Ratnagiri)', lat: 16.985, lon: 73.284, state: 'Maharashtra' },
  { name: 'Malpe Port (Udupi)', lat: 13.348, lon: 74.698, state: 'Karnataka' },
  { name: 'Mangalore Old Port', lat: 12.868, lon: 74.838, state: 'Karnataka' },
  { name: 'Kochi Fishing Harbor (Cochin)', lat: 9.948, lon: 76.257, state: 'Kerala' },
  { name: 'Kasimedu Harbor (Chennai)', lat: 13.125, lon: 80.298, state: 'Tamil Nadu' },
  { name: 'Visakhapatnam Harbor', lat: 17.695, lon: 83.298, state: 'Andhra Pradesh' },
  { name: 'Porbandar Port', lat: 21.642, lon: 69.609, state: 'Gujarat' },
  { name: 'Veraval Harbor', lat: 20.900, lon: 70.360, state: 'Gujarat' },
  { name: 'Paradip Harbor', lat: 20.265, lon: 86.671, state: 'Odisha' },
];

const DEPARTURE_TIMES = ['04:30 AM', '05:30 AM', '06:00 AM', '07:00 AM', '08:00 AM'];

interface FishermanWeatherPageProps {
  onOpenChatWithPrompt?: (prompt: string) => void;
}

export const FishermanWeatherPage: React.FC<FishermanWeatherPageProps> = ({
  onOpenChatWithPrompt,
}) => {
  const { weather, loading: weatherLoading } = useWeather();
  const { language } = useLanguage();
  const { setActiveTab } = useUI();

  const [selectedHarbor, setSelectedHarbor] = useState<HarborInfo>(INDIAN_COASTAL_HARBORS[0]);
  const [selectedDeparture, setSelectedDeparture] = useState('05:30 AM');
  const [marineData, setMarineData] = useState<MarineDecisionData | null>(null);
  const [loadingMarine, setLoadingMarine] = useState(false);

  const loadMarineData = useCallback(async () => {
    setLoadingMarine(true);
    try {
      const data = await fisherIntelligenceService.getMarineDecisions({
        latitude: selectedHarbor.lat,
        longitude: selectedHarbor.lon,
        departureTime: selectedDeparture,
      });
      setMarineData(data);
    } catch (err) {
      console.error('[FishermanWeatherPage] Failed to fetch marine decisions:', err);
    } finally {
      setLoadingMarine(false);
    }
  }, [selectedHarbor.lat, selectedHarbor.lon, selectedDeparture]);

  useEffect(() => {
    loadMarineData();
  }, [loadMarineData]);

  const handleAskGpt = (promptText?: string) => {
    if (onOpenChatWithPrompt) {
      onOpenChatWithPrompt(
        promptText ||
          (language === 'mr'
            ? `आज ${selectedHarbor.name} बंदरावरून समुद्रात जाण्यासाठी हवामान व लाटांची स्थिती कशी आहे? कृपया मार्गदर्शन करा.`
            : language === 'hi'
            ? `आज ${selectedHarbor.name} बंदरगाह से समुद्र में जाने के लिए मौसम व लहरों की स्थिति कैसी है? कृपया मार्गदर्शन करें।`
            : `How are the coastal weather and sea wave conditions near ${selectedHarbor.name} today? Please advise on sailing safety.`)
      );
    } else {
      setActiveTab('ask');
    }
  };

  // Hourly items from weather forecast
  const hourlySlots = (weather?.hourly || []).slice(0, 12).map((h, idx) => ({
    time: h.time || `${idx}:00`,
    temp: h.temp ?? 28,
    condition: h.condition || 'Clear',
    rainProb: h.rainProb ?? 0,
    windSpeed: Math.round((marineData?.sailing_clearance?.max_wind_speed_kts ?? 11) + (idx > 6 ? 2 : 0)),
    waveHeight: (
      (marineData?.sea_state?.wave_height_m ?? 1.14) +
      (idx > 6 ? 0.3 : 0)
    ).toFixed(1),
  }));

  return (
    <div className="w-full px-3.5 sm:px-4 pt-3 pb-24 space-y-3.5 font-['Arimo',sans-serif]">
      {/* 1. Official Marine Observatory Hero Card (Image + Weather + Parameters Table) */}
      <FishermanHeroCard
        harbor={selectedHarbor}
        harborsList={INDIAN_COASTAL_HARBORS}
        onSelectHarbor={(h) => setSelectedHarbor(h)}
        departureTime={selectedDeparture}
        departureTimesList={DEPARTURE_TIMES}
        onSelectDeparture={(t) => setSelectedDeparture(t)}
        clearance={marineData?.sailing_clearance}
        seaState={marineData?.sea_state}
        weather={weather}
        onRefresh={loadMarineData}
        loading={loadingMarine || weatherLoading}
      />

      {/* FishFinder Live Marine Map Quick Navigation Banner */}
      <div className="gov-panel p-3 bg-gradient-to-r from-[#17365D] to-[#004B87] text-white flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xs bg-[#006B3C] text-white flex items-center justify-center shrink-0">
            <Waves className="w-4 h-4 text-[#FFD700]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wide">🌊 LIVE FISHFINDER MAP</span>
              <span className="text-[9px] font-bold bg-[#006B3C] px-1 rounded-xs">INCOIS PFZ</span>
            </div>
            <p className="text-[11px] text-[#CBD5E1] truncate">
              View favorable fishing opportunity zones, SST & chlorophyll upwelling
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('radar')}
          className="px-3 py-1.5 bg-[#FF9933] hover:bg-[#F97316] text-[#0F172A] text-xs font-black uppercase rounded-xs transition-colors cursor-pointer shrink-0 shadow-xs"
        >
          Open Map
        </button>
      </div>

      {/* 2. Hourly Coastal & Marine Progression */}
      <div className="gov-panel">
        <div className="gov-panel-header flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#17365D]" />
            <h3 className="text-xs font-bold text-[#17365D] uppercase tracking-wider">
              {language === 'mr'
                ? 'तासनिहाय सागरी हवामान अंदाज (पुढील १२ तास)'
                : language === 'hi'
                ? 'प्रति घंटा तटीय मौसम पूर्वानुमान (अगले 12 घंटे)'
                : 'Hourly Coastal Weather Progression (Next 12 Hours)'}
            </h3>
          </div>
          <span className="gov-badge gov-badge-info text-[10px]">IMD METEOGRAM</span>
        </div>

        <div className="p-3 bg-white">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {hourlySlots.map((slot, idx) => (
              <div
                key={idx}
                className="min-w-[78px] p-2 bg-[#F8FAFC] border border-[#D6DCE1] rounded-none flex flex-col items-center justify-between text-center shrink-0 space-y-1"
              >
                <span className="text-[10px] font-bold text-[#5B6770]">{slot.time}</span>
                <span className="text-xs font-black text-[#17365D]">{slot.temp}°C</span>
                <div className="flex items-center gap-1 text-[9px] font-semibold text-[#1D5F91]">
                  <Waves className="w-2.5 h-2.5" />
                  <span>{slot.waveHeight}m</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-semibold text-[#006B3C]">
                  <Wind className="w-2.5 h-2.5" />
                  <span>{slot.windSpeed} kts</span>
                </div>
                {slot.rainProb > 20 && (
                  <span className="text-[9px] font-bold text-[#B42318] bg-red-50 px-1 rounded-none border border-red-200">
                    {slot.rainProb}% rain
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. 7-Day Coastal Synoptic Outlook */}
      <CitizenLightMultiDayForecast
        daily={weather?.daily || []}
      />

      {/* 4. Floating Ask Marine AI Bar */}
      <CitizenAskFloatingBar
        onOpenChat={() => handleAskGpt()}
      />
    </div>
  );
};
