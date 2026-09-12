import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  MapPin,
  ChevronDown,
  RefreshCw,
  MessageSquare,
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  ExternalLink,
} from 'lucide-react';
import { useWeather } from '../hooks/useWeather';
import { useUI } from '../context/UIContext';
import { useAuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLocation } from '../hooks/useLocation';
import { farmerIntelligenceService } from '../services/farmerIntelligenceService';
import { chatService } from '../services/chatService';
import { farmService } from '../services/farmService';
import { FarmProfile } from '../types/farm';
import { FarmerDecisionData } from '../types/farmerIntelligence';

import { FarmMapCard } from '../components/roles/farmer/FarmMapCard';
import { FarmOverviewCard } from '../components/roles/farmer/FarmOverviewCard';
import { CropGrowthTimelineCard } from '../components/roles/farmer/CropGrowthTimelineCard';
import { SoilMoistureLossCard } from '../components/roles/farmer/SoilMoistureLossCard';
import { CurrentFarmAdvisoryCard } from '../components/roles/farmer/CurrentFarmAdvisoryCard';
import { CropRisksAlertsCard } from '../components/roles/farmer/CropRisksAlertsCard';
import { BestFarmingWindowsCard } from '../components/roles/farmer/BestFarmingWindowsCard';
import { ChemicalSprayDecisionCard } from '../components/roles/farmer/ChemicalSprayDecisionCard';
import { SatelliteCropHealthCard } from '../components/roles/farmer/SatelliteCropHealthCard';
import { ManageFarmModal } from '../components/roles/farmer/ManageFarmModal';
import { MarkdownRenderer } from '../components/common/MarkdownRenderer';
import { translatePhrase, translateCrop } from '../utils/dashboardTranslator';

interface AgriQAMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface FarmerDashboardPageProps {
  onOpenChatWithPrompt?: (prompt: string) => void;
  onBack?: () => void;
}

export const FarmerDashboardPage: React.FC<FarmerDashboardPageProps> = ({
  onOpenChatWithPrompt,
  onBack,
}) => {
  const { weather: liveWeather, loading: weatherLoading } = useWeather();
  const { setActiveTab } = useUI();
  const { profile } = useAuthContext();
  const { language } = useLanguage();
  const { location, openSelector } = useLocation();

  // Farm Profile State
  const [farm, setFarm] = useState<FarmProfile | null>(null);
  const [isManageFarmOpen, setIsManageFarmOpen] = useState(false);

  // Decision Intelligence State
  const [decisionData, setDecisionData] = useState<FarmerDecisionData>(() =>
    farmerIntelligenceService.getFallbackDecisionData()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Agri Q&A Chat State
  const [inputQuery, setInputQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [qaMessages, setQaMessages] = useState<AgriQAMessage[]>([]);
  const qaEndRef = useRef<HTMLDivElement | null>(null);

  const userId = profile?.user_id || profile?.id || 'farmer_user';

  // Determine exact coordinates
  const latitude = farm?.latitude || location?.latitude || 19.2437;
  const longitude = farm?.longitude || location?.longitude || 73.1355;

  const displayLocation =
    (farm?.village ? `${farm.village}, ` : '') +
    (farm?.district ? `${farm.district}, ` : '') +
    (farm?.state || '') ||
    location?.city ||
    'Kalyan, Maharashtra';

  // 1. Load Farm Profile from Supabase / localStorage
  const loadFarmProfile = useCallback(async () => {
    try {
      let f = await farmService.getFarm(userId);
      if (!f) {
        // Seed initial farm profile based on active location and Rice / Paddy
        f = await farmService.upsertFarm({
          user_id: userId,
          farm_name: 'My Farm',
          latitude: location?.latitude || 19.2437,
          longitude: location?.longitude || 73.1355,
          village: location?.city || 'Kolam',
          district: location?.district || 'Thane',
          state: location?.state || 'Maharashtra',
          primary_crop: 'rice',
          crop_variety: 'Kolam',
          growth_stage: 'pod_filling',
          farm_size: 2.5,
          farm_size_unit: 'acres',
          irrigation_type: 'field_irrigation',
          soil_type: 'alluvial',
        });
      }
      setFarm(f);
    } catch (e) {
      console.warn('[FarmerDashboardPage] Failed to load farm profile:', e);
    }
  }, [userId, location?.latitude, location?.longitude, location?.city, location?.district, location?.state]);

  useEffect(() => {
    loadFarmProfile();
  }, [loadFarmProfile]);

  // 2. Load Real-Time Agri Telemetry & Decision Intelligence
  const loadFarmerDecisions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await farmerIntelligenceService.getFarmerDecisions({
        latitude,
        longitude,
        crop: farm?.primary_crop || 'rice',
        stage: farm?.growth_stage || 'pod_filling',
      });
      setDecisionData(data);
    } catch (err: any) {
      console.error('[FarmerDashboardPage] Failed to load farmer decisions:', err);
      setError('Unable to load real-time farm intelligence. Showing cached guidance.');
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, farm?.primary_crop, farm?.growth_stage]);

  useEffect(() => {
    loadFarmerDecisions();
  }, [loadFarmerDecisions]);

  // Handle stage change directly from timeline
  const handleStageSelect = (stageId: string) => {
    if (farm) {
      const updated = { ...farm, growth_stage: stageId };
      setFarm(updated);
      farmService.upsertFarm(updated);
    }
  };

  // 3. Handle Agri Q&A Chat
  const handleAskQuestion = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q || isAsking) return;

    const userMsg: AgriQAMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setQaMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsAsking(true);

    try {
      const res = await chatService.sendMessage({
        message: q,
        conversationId: 'agri-assistant',
        role: 'farmer',
        location: {
          latitude,
          longitude,
          city: farm?.village || location?.city || 'Kolam',
          district: farm?.district || location?.district || 'Thane',
          state: farm?.state || location?.state || 'Maharashtra',
        },
        language,
      });

      const assistantMsg: AgriQAMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: res.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setQaMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('[FarmerDashboardPage] Q&A request failed:', err);
      const fallbackMsg: AgriQAMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text:
          language === 'mr'
            ? 'माफ करा, कृषी सहाय्यक सेवा सध्या व्यस्त आहे. कृपया थोड्या वेळाने प्रयत्न करा.'
            : language === 'hi'
            ? 'क्षमा करें, कृषि सहायक सेवा वर्तमान में व्यस्त है। कृपया थोड़ी देर बाद पुनः प्रयास करें।'
            : 'Sorry, the Agri Assistant service is currently busy. Please try again in a moment.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setQaMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsAsking(false);
    }
  };

  useEffect(() => {
    qaEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [qaMessages]);

  const handleOpenFullChat = (prefillPrompt?: string) => {
    if (onOpenChatWithPrompt) {
      onOpenChatWithPrompt(
        prefillPrompt ||
          (language === 'mr'
            ? `${displayLocation} मधील माझ्या ${farm?.primary_crop || 'भात'} पिकासाठी सविस्तर कृषी हवामान सल्ला द्या`
            : language === 'hi'
            ? `${displayLocation} में मेरी ${farm?.primary_crop || 'धान'} फसल के लिए विस्तृत कृषि मौसम सलाह दें`
            : `Give me detailed agricultural weather advice for my ${farm?.primary_crop || 'rice'} crop in ${displayLocation}`)
      );
    } else {
      setActiveTab('ask');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7F9] pb-24 font-['Arimo',sans-serif]">
      {/* 1. Official Government Header / Breadcrumb Strip */}
      <div className="bg-[#17365D] text-white border-b-2 border-[#006B3C] px-3.5 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-1.5 rounded-xs bg-[#0F233D] hover:bg-[#081525] text-white border border-[#2A4D7A] transition-colors cursor-pointer"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">
                {language === 'mr' ? 'राष्ट्रीय कृषी हवामान सेवा' : language === 'hi' ? 'राष्ट्रीय कृषि मौसम सेवा' : 'NATIONAL AGROMET ADVISORY SYSTEM'}
              </div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {language === 'mr' ? 'माझे शेत — कृषी देखरेख आणि निर्णय प्रणाली' : language === 'hi' ? 'मेरा खेत — कृषि निगरानी व निर्णय प्रणाली' : 'MY FARM — AGRICULTURAL MONITORING & DECISION PORTAL'}
              </h1>
            </div>
          </div>

          {/* Location Selector */}
          <button
            type="button"
            onClick={openSelector}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F233D] hover:bg-[#081525] border border-[#2A4D7A] text-white text-xs font-bold rounded-xs transition-colors cursor-pointer"
            title="Change Location"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="max-w-[150px] sm:max-w-[200px] truncate">
              {displayLocation}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-white/70 shrink-0" />
          </button>
        </div>
      </div>

      {/* Main Dashboard Content Container */}
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-4 space-y-4">
        {/* 2. Section: Farm Map & Farm Overview (2 Columns on Desktop, Stacked on Mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          <div className="lg:col-span-7 h-full min-h-[300px]">
            <FarmMapCard
              latitude={latitude}
              longitude={longitude}
              farmName={farm?.farm_name || 'My Farm'}
              cropName={translateCrop(farm?.primary_crop || 'rice', language)}
              farmSize={farm?.farm_size ?? 2.5}
              farmSizeUnit={farm?.farm_size_unit || 'Acres'}
              boundaryGeoJson={farm?.boundary_geojson}
            />
          </div>
          <div className="lg:col-span-5 h-full">
            <FarmOverviewCard
              farm={farm}
              onOpenManageFarm={() => setIsManageFarmOpen(true)}
            />
          </div>
        </div>

        {/* 4. Section: Crop & Growth Status + Soil Moisture & Water Loss */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          <CropGrowthTimelineCard
            cropId={farm?.primary_crop || 'rice'}
            currentStageId={farm?.growth_stage || 'pod_filling'}
            onSelectStage={handleStageSelect}
          />
          <SoilMoistureLossCard
            soilState={decisionData.soil_state}
          />
        </div>

        {/* 5. Section: Current Farm Advisory + Crop Risks & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          <CurrentFarmAdvisoryCard
            soilState={decisionData.soil_state}
            rainProbability={decisionData.current_rain_prob_pct}
            expectedRainfallMm={liveWeather?.current?.precipitation ?? 0}
            onOpenDetails={() => handleOpenFullChat()}
          />
          <CropRisksAlertsCard
            cropName={farm?.primary_crop || 'rice'}
            growthStage={farm?.growth_stage || 'pod_filling'}
            temperature={liveWeather?.current?.temperature ?? 27.4}
            windSpeed={liveWeather?.current?.wind_speed ?? 6.2}
            rainProbability={decisionData.current_rain_prob_pct ?? 15}
          />
        </div>

        {/* 6. Section: Best Farming Windows */}
        <BestFarmingWindowsCard
          windows={decisionData.best_farming_windows}
        />

        {/* 7. Section: Chemical Spray Decision + Satellite NDVI Crop Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          <ChemicalSprayDecisionCard
            windSpeed={liveWeather?.current?.wind_speed ?? 6.2}
            rainProbability={decisionData.current_rain_prob_pct ?? 15}
            humidity={liveWeather?.current?.humidity ?? 68}
            temperature={liveWeather?.current?.temperature ?? 27.4}
          />
          <SatelliteCropHealthCard
            ndviValue={0.72}
            healthStatus="Good"
            trend="Improving"
          />
        </div>

        {/* 8. Interactive Agri Assistant Desk */}
        <div className="gov-panel space-y-3">
          <div className="gov-panel-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#006B3C]" />
              <span>
                {language === 'mr' ? 'कृषी सल्ला व शंका निवारण कक्ष' : language === 'hi' ? 'कृषि परामर्श एवं सहायता केंद्र' : 'OFFICIAL AGROMET QUERY & ADVISORY DESK'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleOpenFullChat()}
              className="text-[11px] font-bold text-[#006B3C] hover:underline flex items-center gap-1 cursor-pointer uppercase tracking-wider"
            >
              <span>{language === 'mr' ? 'सविस्तर चर्चा' : language === 'hi' ? 'विस्तृत चर्चा' : 'OPEN FULL CHAT'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-3 space-y-3">
            {/* Standard Quick Query Buttons */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {[
                language === 'mr' ? 'आज शेतात काय काम करावे?' : language === 'hi' ? 'आज खेत में क्या काम करें?' : 'What to do on my farm today?',
                language === 'mr' ? 'फवारणी कधी करावी?' : language === 'hi' ? 'छिड़काव कब करें?' : 'When is safe to spray?',
                language === 'mr' ? 'पावसाचा धोका आहे का?' : language === 'hi' ? 'क्या बारिश का खतरा है?' : 'Is there a rain risk?',
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAskQuestion(prompt)}
                  className="px-3 py-1 bg-[#F8FAFC] hover:bg-[#EBF5EE] text-[#17365D] hover:text-[#006B3C] text-xs font-semibold rounded-xs border border-[#D6DCE1] transition-colors cursor-pointer whitespace-nowrap"
                >
                  [ {prompt} ]
                </button>
              ))}
            </div>

            {/* Structured Message Stream */}
            {qaMessages.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-2 p-3 rounded-xs bg-[#F8FAFC] border border-[#D6DCE1]">
                {qaMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] font-bold text-[#5B6770] mb-0.5 uppercase tracking-wider">
                      {msg.sender === 'user' ? 'Farmer / Citizen' : 'WeatherGPT Officer'} • {msg.timestamp}
                    </span>
                    <div
                      className={`max-w-[90%] rounded-xs p-2.5 text-xs font-medium border leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#17365D] text-white border-[#17365D]'
                          : 'bg-white text-[#1F2933] border-[#D6DCE1]'
                      }`}
                    >
                      {msg.sender === 'assistant' ? (
                        <MarkdownRenderer content={msg.text} />
                      ) : (
                        <span>{msg.text}</span>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={qaEndRef} />
              </div>
            )}

            {/* Input Row */}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                placeholder={
                  language === 'mr'
                    ? 'उदा. आज खत टाकावे का? पाणी कधी द्यावे?'
                    : language === 'hi'
                    ? 'उदा. क्या आज खाद डालें? पानी कब दें?'
                    : 'Type official query (e.g., Sowing schedule, spray safety, rain forecast)...'
                }
                className="flex-1 px-3 py-2 rounded-xs border border-[#D6DCE1] focus:outline-none focus:border-[#006B3C] text-xs text-[#1F2933] placeholder-[#5B6770] bg-white"
              />
              <button
                type="button"
                onClick={() => handleAskQuestion()}
                disabled={isAsking || !inputQuery.trim()}
                className="px-4 py-2 rounded-xs bg-[#006B3C] hover:bg-[#00522E] text-white font-bold text-xs disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
              >
                {isAsking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{language === 'mr' ? 'विचारा' : language === 'hi' ? 'पूछें' : 'SUBMIT'}</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Manage Farm Modal */}
      <ManageFarmModal
        isOpen={isManageFarmOpen}
        onClose={() => setIsManageFarmOpen(false)}
        farm={farm}
        userId={userId}
        onFarmUpdated={(updatedFarm) => {
          setFarm(updatedFarm);
          loadFarmerDecisions();
        }}
      />
    </div>
  );
};
