import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Fish,
  MapPin,
  RefreshCw,
  MessageSquare,
  Sparkles,
  ArrowLeft,
  Send,
  Loader2,
  Bot,
  User,
  ShieldAlert,
  LifeBuoy,
  ExternalLink,
} from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { useUI } from '../context/UIContext';
import { useAuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { fisherIntelligenceService } from '../services/fisherIntelligenceService';
import { chatService } from '../services/chatService';
import { MarineDecisionData } from '../types/fisherIntelligence';

import { FishermanHeroCard } from '../components/roles/fisher/FishermanHeroCard';
import { SailingDecisionGauge } from '../components/roles/fisher/SailingDecisionGauge';
import { ReturnTimeTimeline } from '../components/roles/fisher/ReturnTimeTimeline';
import { SeaStateCard } from '../components/roles/fisher/SeaStateCard';
import { TideScheduleCard } from '../components/roles/fisher/TideScheduleCard';
import { ZoneRiskCard } from '../components/roles/fisher/ZoneRiskCard';
import { MarineEmergencyCard } from '../components/roles/fisher/MarineEmergencyCard';
import { VernacularMarineVoiceButton } from '../components/roles/fisher/VernacularMarineVoiceButton';
import { DemoBadge } from '../components/common/DemoBadge';
import { MarkdownRenderer } from '../components/common/MarkdownRenderer';

interface MarineQAMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface FisherDashboardPageProps {
  onOpenChatWithPrompt?: (prompt: string) => void;
  onBack?: () => void;
}

// Major Indian Coastal Harbors
const INDIAN_HARBORS = [
  { name: 'Sassoon Docks (Mumbai)', lat: 18.913, lon: 72.825, state: 'Maharashtra' },
  { name: 'Versova Harbor (Mumbai)', lat: 19.135, lon: 72.812, state: 'Maharashtra' },
  { name: 'Mirkarwada (Ratnagiri)', lat: 16.985, lon: 73.284, state: 'Maharashtra' },
  { name: 'Malpe Port (Udupi)', lat: 13.348, lon: 74.698, state: 'Karnataka' },
  { name: 'Kochi Fishing Harbor (Cochin)', lat: 9.948, lon: 76.257, state: 'Kerala' },
  { name: 'Kasimedu Harbor (Chennai)', lat: 13.125, lon: 80.298, state: 'Tamil Nadu' },
  { name: 'Visakhapatnam Harbor', lat: 17.695, lon: 83.298, state: 'Andhra Pradesh' },
  { name: 'Porbandar Port', lat: 21.642, lon: 69.609, state: 'Gujarat' },
  { name: 'Paradip Harbor', lat: 20.265, lon: 86.671, state: 'Odisha' },
];

const DEPARTURE_TIMES = ['04:30 AM', '05:30 AM', '06:00 AM', '07:00 AM', '08:00 AM'];

export const FisherDashboardPage: React.FC<FisherDashboardPageProps> = ({
  onOpenChatWithPrompt,
  onBack,
}) => {
  const { userLocation } = useWeather();
  const { setActiveTab } = useUI();
  const { profile } = useAuthContext();
  const { language } = useLanguage();

  const [selectedHarbor, setSelectedHarbor] = useState(INDIAN_HARBORS[0]);
  const [selectedDeparture, setSelectedDeparture] = useState('05:30 AM');
  const [decisionData, setDecisionData] = useState<MarineDecisionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Marine Q&A Chat State
  const [inputQuery, setInputQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [qaMessages, setQaMessages] = useState<MarineQAMessage[]>([]);
  const qaEndRef = useRef<HTMLDivElement | null>(null);

  const latitude = selectedHarbor.lat;
  const longitude = selectedHarbor.lon;
  const userId = profile?.user_id || 'fisher_user';

  const loadMarineData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fisherIntelligenceService.getMarineDecisions({
        latitude,
        longitude,
        departureTime: selectedDeparture,
      });
      setDecisionData(data);
    } catch (err: any) {
      console.error('[FisherDashboardPage] Failed to load marine decisions:', err);
      setError('Could not load live marine hydrodynamic data.');
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, selectedDeparture]);

  useEffect(() => {
    loadMarineData();
  }, [loadMarineData]);

  // Initial greeting in Q&A box
  useEffect(() => {
    if (decisionData && qaMessages.length === 0) {
      setQaMessages([
        {
          id: 'init-marine',
          sender: 'assistant',
          text: `नमस्कार मासेमार मित्रांनो! मी WeatherGPT Marine Assistant आहे. ${selectedHarbor.name} बंदरावरून समुद्रातील लाटा, वाऱ्याचा वेग, परतीची वेळ किंवा भरती-ओहोटीबद्दल कोणताही प्रश्न विचारा.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [decisionData, qaMessages.length, selectedHarbor.name]);

  const handleSendQuery = async (queryText: string) => {
    const textToSend = queryText.trim();
    if (!textToSend || isAsking) return;

    const userMsg: MarineQAMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setQaMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsAsking(true);

    try {
      const contextualPrompt = decisionData
        ? `[Harbor: ${selectedHarbor.name}, Sailing Status: ${decisionData.sailing_clearance.status}, Significant Wave Height: ${decisionData.sea_state.wave_height_m}m, Max Coastal Wind: ${decisionData.sailing_clearance.max_wind_speed_kts} kts, Return Deadline: ${decisionData.return_time_intelligence.recommended_return_time}, Safe Duration: ${decisionData.return_time_intelligence.safe_duration_hours} hours] ${textToSend}`
        : textToSend;

      const resp = await chatService.sendMessage({
        message: contextualPrompt,
        userId,
        location: {
          latitude,
          longitude,
          city: selectedHarbor.name,
        },
        userRole: 'fisher',
        language: language || 'en',
      });

      const assistantMsg: MarineQAMessage = {
        id: `a_${Date.now()}`,
        sender: 'assistant',
        text: resp.text || resp.message || 'समुद्रातील हवामान सामान्य आहे.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setQaMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('[FisherDashboardPage] Marine Q&A failed:', err);
      const fallbackAnswer = decisionData
        ? `${selectedHarbor.name} बंदरासाठी: सद्यस्थितीत प्रवासाची स्थिती ${decisionData.sailing_clearance.status.toUpperCase()} आहे. लाटांची उंची ${decisionData.sea_state.wave_height_m} मीटर असून परतीची सुरक्षित वेळ ${decisionData.return_time_intelligence.recommended_return_time} आहे.`
        : 'माफ करा, संपर्क साधण्यात अडचण येत आहे. कृपया पुन्हा प्रयत्न करा.';

      setQaMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          text: fallbackAnswer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAsking(false);
      setTimeout(() => {
        qaEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const promptSuggestions = [
    `Can I sail past 10 NM from ${selectedHarbor.name}?`,
    `If I depart at ${selectedDeparture}, when to return?`,
    'What is the wave height and swell period?',
    'Show me the high and low tide schedule.',
  ];

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
                NATIONAL MARITIME & COASTAL ADVISORY SYSTEM
              </div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {language === 'mr' ? 'माझा समुद्र — सागरी हवामान व सुरक्षितता प्रणाली' : language === 'hi' ? 'मेरा समुद्र — समुद्री मौसम व सुरक्षा प्रणाली' : 'MY SEA — MARINE HYDRODYNAMICS & SAILING SAFETY'}
              </h1>
            </div>
          </div>

          {/* Quick Refresh Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadMarineData}
              disabled={loading}
              className="px-3 py-1.5 bg-[#FF9933] hover:bg-[#F97316] text-slate-950 font-bold text-xs rounded-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              title="Refresh Marine Telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'SYNCING...' : 'REFRESH'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-4 space-y-4">
        {/* Hero Card with User-Provided Fishing Boats Photo */}
        <FishermanHeroCard
          harbor={selectedHarbor}
          harborsList={INDIAN_HARBORS}
          onSelectHarbor={setSelectedHarbor}
          departureTime={selectedDeparture}
          departureTimesList={DEPARTURE_TIMES}
          onSelectDeparture={setSelectedDeparture}
          clearance={decisionData?.sailing_clearance}
          seaState={decisionData?.sea_state}
          onRefresh={loadMarineData}
        />

        {/* Main Loading / Error States */}
        {loading && !decisionData ? (
          <div className="gov-panel p-8 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#006B3C] animate-spin mx-auto" />
            <div>
              <h3 className="text-sm font-bold text-[#17365D]">Fetching Hydrodynamic Sea Telemetry...</h3>
              <p className="text-xs text-[#5B6770] mt-0.5">Analyzing wave heights, swell period, tides, and return vector...</p>
            </div>
          </div>
        ) : error && !decisionData ? (
          <div className="gov-panel p-6 text-center space-y-3 bg-[#FEF2F2] border-rose-300">
            <ShieldAlert className="w-8 h-8 text-rose-600 mx-auto" />
            <h3 className="text-sm font-bold text-rose-900">{error}</h3>
            <button
              onClick={loadMarineData}
              className="px-4 py-2 bg-[#FF9933] hover:bg-[#F97316] text-slate-950 text-xs font-black rounded-xs shadow-xs transition-all cursor-pointer uppercase"
            >
              Retry Connection
            </button>
          </div>
        ) : decisionData ? (
          <div className="space-y-4">
            {/* 1-Tap Regional Voice Audio Briefing (Vernacular Marathi / English) */}
            <VernacularMarineVoiceButton
              marathiText={decisionData.vernacular_advisory_text}
              englishText={`Fishermen advisory for ${selectedHarbor.name}: Sailing status is ${decisionData.sailing_clearance.status.toUpperCase()}. Significant wave height is ${decisionData.sea_state.wave_height_m} meters with wind speed at ${decisionData.sailing_clearance.max_wind_speed_kts} knots. Departure at ${selectedDeparture} has a recommended return deadline of ${decisionData.return_time_intelligence.recommended_return_time}.`}
            />

            {/* Port Clearance Decision Indicator */}
            <SailingDecisionGauge clearance={decisionData.sailing_clearance} />

            {/* Return-Time Intelligence Timeline */}
            <ReturnTimeTimeline
              returnIntel={decisionData.return_time_intelligence}
              temporalCurve={decisionData.temporal_curve}
            />

            {/* Hydrodynamic Sea State */}
            <SeaStateCard seaState={decisionData.sea_state} />

            {/* Tide Predictions */}
            <TideScheduleCard tides={decisionData.tide_schedule} />

            {/* Fishing Zone Danger Matrix */}
            <ZoneRiskCard zoneRisks={decisionData.zone_risks} />

            {/* Emergency Marine Broadcast & Coast Guard SOS */}
            <MarineEmergencyCard
              officialBulletin={decisionData.official_bulletin}
              sosContact={decisionData.sos_emergency_contact}
            />

            {/* Official Marine Q&A AI Assistant Card */}
            <div className="gov-panel">
              <div className="gov-panel-header flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#006B3C]" />
                  <span>MARITIME AI ASSISTANT (सागरी सल्लागार)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenChatWithPrompt) {
                      onOpenChatWithPrompt(`Provide marine forecast and sailing safety advisory for ${selectedHarbor.name}`);
                    } else {
                      setActiveTab('ask');
                    }
                  }}
                  className="text-[11px] font-bold text-[#006B3C] hover:underline flex items-center gap-1 cursor-pointer uppercase tracking-wider"
                >
                  <span>OPEN FULL CHAT</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3 sm:p-4 space-y-3">
                {/* Horizontal Scroll Prompt Suggestion Chips */}
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {promptSuggestions.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendQuery(prompt)}
                      disabled={isAsking}
                      className="px-3 py-1 bg-[#F8FAFC] hover:bg-[#FFF7ED] text-[#17365D] hover:text-[#EA580C] text-xs font-semibold rounded-xs border border-[#CBD5E1] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      [ {prompt} ]
                    </button>
                  ))}
                </div>

                {/* Structured Message Stream */}
                {qaMessages.length > 0 && (
                  <div className="max-h-64 overflow-y-auto space-y-2 p-3 rounded-xs bg-[#F8FAFC] border border-[#CBD5E1]">
                    {qaMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] font-bold text-[#5B6770] mb-0.5 uppercase tracking-wider">
                          {msg.sender === 'user' ? 'Fisherman' : 'Marine Intelligence Officer'} • {msg.timestamp}
                        </span>
                        <div
                          className={`max-w-[90%] rounded-xs p-2.5 text-xs font-medium border leading-relaxed ${
                            msg.sender === 'user'
                              ? 'bg-[#17365D] text-white border-[#17365D]'
                              : 'bg-white text-[#1F2933] border-[#CBD5E1]'
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
                    {isAsking && (
                      <div className="flex items-center gap-2 text-xs text-[#5B6770] font-medium p-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF9933]" />
                        <span>Analyzing marine hydrodynamic telemetry...</span>
                      </div>
                    )}
                    <div ref={qaEndRef} />
                  </div>
                )}

                {/* Input Row */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendQuery(inputQuery);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder="Type marine query (e.g., wave height, swell, departure cutoff, tides)..."
                    className="flex-1 px-3 py-2 rounded-xs border border-[#CBD5E1] focus:outline-none focus:border-[#006B3C] text-xs text-[#1F2933] placeholder-[#5B6770] bg-white"
                    disabled={isAsking}
                  />
                  <button
                    type="submit"
                    disabled={isAsking || !inputQuery.trim()}
                    className="px-4 py-2 rounded-xs bg-[#FF9933] hover:bg-[#F97316] text-slate-950 font-black text-xs disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer uppercase tracking-wider shadow-xs"
                  >
                    {isAsking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>SUBMIT</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
