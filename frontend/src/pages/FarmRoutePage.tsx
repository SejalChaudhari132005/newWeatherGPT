import React, { useState, useEffect, useCallback } from 'react';
import { useWeather } from '../hooks/useWeather';
import { useLocation } from '../hooks/useLocation';
import { useAuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useUI } from '../context/UIContext';
import { farmService } from '../services/farmService';
import { farmRouteEngine, FarmRoutePlan, FarmActivityItem } from '../services/farmRouteEngine';
import { FarmProfile } from '../types/farm';

import { FarmRouteHeader } from '../components/roles/farmer/farmroute/FarmRouteHeader';
import { FarmRouteSummaryCard } from '../components/roles/farmer/farmroute/FarmRouteSummaryCard';
import { FarmRouteTimeline } from '../components/roles/farmer/farmroute/FarmRouteTimeline';
import { FarmRouteActivityDetailModal } from '../components/roles/farmer/farmroute/FarmRouteActivityDetailModal';
import { FarmRouteWhyCard } from '../components/roles/farmer/farmroute/FarmRouteWhyCard';
import { FarmRouteCompareCard } from '../components/roles/farmer/farmroute/FarmRouteCompareCard';
import { ManageFarmModal } from '../components/roles/farmer/ManageFarmModal';
import { MessageSquare, Mic, ChevronRight } from 'lucide-react';

interface FarmRoutePageProps {
  onOpenChatWithPrompt?: (prompt: string) => void;
  onBack?: () => void;
}

export const FarmRoutePage: React.FC<FarmRoutePageProps> = ({
  onOpenChatWithPrompt,
  onBack,
}) => {
  const { weather, loading: weatherLoading, refreshWeather } = useWeather();
  const { location } = useLocation();
  const { profile } = useAuthContext();
  const { language } = useLanguage();
  const { setActiveTab } = useUI();

  const [farm, setFarm] = useState<FarmProfile | null>(null);
  const [isManageFarmOpen, setIsManageFarmOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<FarmActivityItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isReplanning, setIsReplanning] = useState(false);
  const [plan, setPlan] = useState<FarmRoutePlan | null>(null);

  const userId = profile?.user_id || profile?.id || 'farmer_user';

  // 1. Load Farm Profile
  const loadFarm = useCallback(async () => {
    try {
      let f = await farmService.getFarm(userId);
      if (!f) {
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
      console.warn('[FarmRoutePage] Failed to load farm profile:', e);
    }
  }, [userId, location?.latitude, location?.longitude, location?.city, location?.district, location?.state]);

  useEffect(() => {
    loadFarm();
  }, [loadFarm]);

  // 2. Generate / Re-generate Plan when weather or farm changes
  useEffect(() => {
    const generated = farmRouteEngine.generatePlan({
      farm,
      weather,
      language,
    });
    setPlan(generated);
  }, [farm, weather, language]);

  const handleReplan = async () => {
    setIsReplanning(true);
    if (refreshWeather) {
      await refreshWeather().catch(() => {});
    }
    setTimeout(() => {
      const regenerated = farmRouteEngine.generatePlan({
        farm,
        weather,
        language,
      });
      setPlan(regenerated);
      setIsReplanning(false);
    }, 400);
  };

  const handleSelectActivity = (activity: FarmActivityItem) => {
    setSelectedActivity(activity);
    setIsDetailModalOpen(true);
  };

  const handleAskGpt = (promptText?: string) => {
    const defaultPrompt =
      language === 'mr'
        ? 'माझ्या शेतासाठी उद्याचे काम नियोजन कसे असावे? कृपया मार्गदर्शन करा.'
        : language === 'hi'
        ? 'मेरे खेत के लिए कल की कार्य योजना कैसी होनी चाहिए? कृपया मार्गदर्शन करें।'
        : 'Plan my farm activities for the next 2 days based on the weather.';

    if (onOpenChatWithPrompt) {
      onOpenChatWithPrompt(promptText || defaultPrompt);
    } else {
      setActiveTab('ask');
    }
  };

  const locationLabel = farm
    ? `${farm.village || location?.city || 'Kalyan'}, ${farm.state || 'Maharashtra'}`
    : `${location?.city || 'Kalyan'}, ${location?.state || 'Maharashtra'}`;

  return (
    <div className="w-full min-h-screen bg-[#F5F7F9] pb-28 font-sans space-y-3.5">
      {/* 1. Page Header */}
      <FarmRouteHeader
        onBack={onBack || (() => setActiveTab('home'))}
        locationName={locationLabel}
        onOpenLocationModal={() => setIsManageFarmOpen(true)}
      />

      <div className="px-3 sm:px-4 space-y-3.5">
        {/* 2. Farm Summary Card */}
        <FarmRouteSummaryCard
          farm={farm}
          onOpenManageFarm={() => setIsManageFarmOpen(true)}
        />

        {/* 4. Main Section — Today's Farm Plan Timeline */}
        {plan && (
          <FarmRouteTimeline
            activities={plan.activities}
            onReplan={handleReplan}
            onSelectActivity={handleSelectActivity}
            isReplanning={isReplanning}
          />
        )}

        {/* 5. "Why did WeatherGPT create this plan?" Expandable Card */}
        <FarmRouteWhyCard farm={farm} />

        {/* 6. "Compare My Options" Card */}
        {plan && plan.comparisons && (
          <FarmRouteCompareCard
            comparisons={plan.comparisons}
            onAskGpt={(prompt) => handleAskGpt(prompt)}
          />
        )}

        {/* 7. Bottom Agromet Advisory Consultation Desk */}
        <div className="gov-panel p-3 flex items-center justify-between gap-3 border-l-4 border-l-[#006B3C]">
          <div
            onClick={() => handleAskGpt()}
            className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
          >
            <div className="w-8 h-8 rounded-none bg-[#006B3C]/10 flex items-center justify-center shrink-0 border border-[#006B3C]/30 text-[#006B3C]">
              <MessageSquare className="w-4 h-4 text-[#006B3C]" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#1F2933] uppercase tracking-wide truncate">
                {language === 'mr'
                  ? 'नियोजनामध्ये बदल किंवा सल्ल हवा आहे?'
                  : language === 'hi'
                  ? 'योजना में बदलाव या सलाह चाहिए?'
                  : 'Modify Plan or Request Advisory'}
              </h4>
              <p className="text-[11px] text-[#5B6770] font-medium truncate">
                {language === 'mr'
                  ? 'WeatherGPT सल्लागारास विचारा (उदा. "उद्या पाऊस पडल्यास काय करावे?")'
                  : language === 'hi'
                  ? 'WeatherGPT सलाहकार से पूछें (उदा. "अगर कल बारिश हो तो क्या करें?")'
                  : 'Ask WeatherGPT (e.g. "What if it rains tomorrow?" or "Adjust spraying")'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleAskGpt()}
            className="gov-btn-primary px-3 py-1.5 flex items-center gap-1 text-[11px] uppercase font-bold shrink-0"
            aria-label="Ask WeatherGPT"
          >
            <span>{language === 'mr' ? 'विचारा' : language === 'hi' ? 'पूछें' : 'Consult'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Activity Detail Drawer / Modal */}
      <FarmRouteActivityDetailModal
        activity={selectedActivity}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onAskGpt={(prompt) => handleAskGpt(prompt)}
      />

      {/* Manage Farm Modal */}
      <ManageFarmModal
        isOpen={isManageFarmOpen}
        onClose={() => setIsManageFarmOpen(false)}
        farm={farm}
        userId={userId}
        onFarmUpdated={(updatedFarm) => {
          setFarm(updatedFarm);
        }}
      />
    </div>
  );
};
