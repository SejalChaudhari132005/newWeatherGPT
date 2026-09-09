import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Fish,
  MapPin,
  RefreshCw,
  MessageSquare,
  Sparkles,
  ArrowLeft,
  Wind,
  Waves,
  Clock,
  Compass,
  Send,
  Loader2,
  Bot,
  User,
  ShieldAlert,
  LifeBuoy,
} from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { useUI } from '../context/UIContext';
import { useAuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { fisherIntelligenceService } from '../services/fisherIntelligenceService';
import { chatService } from '../services/chatService';
import { MarineDecisionData } from '../types/fisherIntelligence';

import { SailingDecisionGauge } from '../components/roles/fisher/SailingDecisionGauge';
import { ReturnTimeTimeline } from '../components/roles/fisher/ReturnTimeTimeline';
import { SeaStateCard } from '../components/roles/fisher/SeaStateCard';
import { TideScheduleCard } from '../components/roles/fisher/TideScheduleCard';
import { ZoneRiskCard } from '../components/roles/fisher/ZoneRiskCard';
import { MarineEmergencyCard } from '../components/roles/fisher/MarineEmergencyCard';
import { VernacularMarineVoiceButton } from '../components/roles/fisher/VernacularMarineVoiceButton';
import { RoleDashboardSwitcher } from '../components/roles/RoleDashboardSwitcher';
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
    `Can I sail past 10 nautical miles from ${selectedHarbor.name} today?`,
    `If I depart at ${selectedDeparture}, when must I return to harbor?`,
    'What is the maximum wave height and swell period today?',
    'Show me the high tide and low tide schedule for today.',
  ];

  return (
    <div className="w-full pb-6 pt-2 px-3 space-y-4 animate-fadeIn font-['Arimo']">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer shrink-0"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div className="p-2.5 bg-blue-500/10 rounded-2xl text-blue-600 border border-blue-500/20 shrink-0">
              <Fish className="w-6 h-6" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  🎣 MY SEA
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                  Safe-to-Sail
                </span>
                <DemoBadge />
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                Marine hydrodynamics & departure safety
              </p>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadMarineData}
            disabled={loading}
            className="p-2 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200/60 transition-all cursor-pointer disabled:opacity-50 shrink-0"
            title="Refresh Marine Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Harbor & Departure Selector Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
          {/* Harbor Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-200/80 text-xs font-bold text-slate-700 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <select
              value={selectedHarbor.name}
              onChange={(e) => {
                const found = INDIAN_HARBORS.find((h) => h.name === e.target.value);
                if (found) setSelectedHarbor(found);
              }}
              className="bg-transparent text-slate-900 font-black outline-none cursor-pointer w-full text-xs truncate"
            >
              {INDIAN_HARBORS.map((h) => (
                <option key={h.name} value={h.name}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          {/* Departure Time Selector */}
          <div className="flex items-center justify-between gap-1.5 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-200/80 text-xs font-bold text-slate-700">
            <div className="flex items-center gap-1.5 min-w-0">
              <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-[10px] text-slate-400 uppercase font-extrabold whitespace-nowrap">Depart:</span>
              <select
                value={selectedDeparture}
                onChange={(e) => setSelectedDeparture(e.target.value)}
                className="bg-transparent text-slate-900 font-black outline-none cursor-pointer text-xs"
              >
                {DEPARTURE_TIMES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => (onBack ? onBack() : setActiveTab('home'))}
              className="text-[10px] text-blue-700 font-black bg-blue-50 px-2 py-1 rounded-xl hover:bg-blue-100 transition-colors shrink-0"
              title="Switch to Live Dashboard"
            >
              🏠 Home
            </button>
          </div>
        </div>
      </div>

      {/* Global Role Dashboard Switcher */}
      <RoleDashboardSwitcher
        currentDashboard="fisher"
        onNavigate={(tab) => {
          if (tab === 'home' && onBack) {
            onBack();
          } else {
            setActiveTab(tab);
          }
        }}
      />

      {/* Main Loading / Error States */}
      {loading && !decisionData ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-xs space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Fetching Hydrodynamic Sea Telemetry...</h3>
            <p className="text-xs text-slate-400 mt-0.5">Analyzing wave heights, swell period, tides, and return vector...</p>
          </div>
        </div>
      ) : error && !decisionData ? (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center space-y-3 text-rose-800">
          <ShieldAlert className="w-7 h-7 text-rose-600 mx-auto" />
          <h3 className="text-sm font-bold">{error}</h3>
          <button
            onClick={loadMarineData}
            className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-rose-700 transition-all cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      ) : decisionData ? (
        <div className="space-y-4">
          {/* 1-Tap Regional Voice Audio Briefing */}
          <VernacularMarineVoiceButton
            marathiText={decisionData.vernacular_advisory_text}
            englishText={`Fishermen advisory for ${selectedHarbor.name}: Sailing status is ${decisionData.sailing_clearance.status.toUpperCase()}. Significant wave height is ${decisionData.sea_state.wave_height_m} meters with wind speed at ${decisionData.sailing_clearance.max_wind_speed_kts} knots. Departure at ${selectedDeparture} has a recommended return deadline of ${decisionData.return_time_intelligence.recommended_return_time}.`}
          />

          {/* Hero Sailing Decision Indicator */}
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

          {/* Interactive Marine Q&A Chat Card */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">Sea Assistant</h3>
                  <p className="text-[11px] text-slate-500 font-medium truncate">Ask about wave risks, tides & departure</p>
                </div>
              </div>

              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                AI Agent
              </span>
            </div>

            {/* Horizontal Scroll Prompt Suggestion Chips */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 snap-x -mx-1 px-1">
              {promptSuggestions.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendQuery(prompt)}
                  disabled={isAsking}
                  className="text-[11px] font-semibold bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-3 py-1.5 rounded-full border border-slate-200/80 transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 snap-start shadow-2xs"
                >
                  <Sparkles className="w-3 h-3 text-blue-500 shrink-0" />
                  <span>{prompt}</span>
                </button>
              ))}
            </div>

            {/* Messages Feed */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto p-3 rounded-2xl bg-slate-50 border border-slate-200/60 no-scrollbar">
              {qaMessages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                        isUser
                          ? 'bg-blue-600 text-white'
                          : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                      }`}
                    >
                      {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>

                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                        isUser
                          ? 'bg-blue-600 text-white font-medium rounded-tr-xs'
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                      }`}
                    >
                      <MarkdownRenderer content={msg.text} isUser={isUser} />
                      <div
                        className={`text-[8px] mt-1 font-medium text-right ${
                          isUser ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isAsking && (
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium p-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  <span>Analyzing wave telemetry & forecast...</span>
                </div>
              )}
              <div ref={qaEndRef} />
            </div>

            {/* Chat Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendQuery(inputQuery);
              }}
              className="flex items-center gap-2 pt-0.5"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask about waves, tides, return cutoff..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                disabled={isAsking}
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isAsking}
                className="p-2.5 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer shrink-0 shadow-xs active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};
