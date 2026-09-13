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
  Anchor,
  Waves,
} from 'lucide-react';
import { useWeather } from '../hooks/useWeather';
import { useUI } from '../context/UIContext';
import { useAuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { fisherIntelligenceService } from '../services/fisherIntelligenceService';
import { chatService } from '../services/chatService';
import { MarineDecisionData } from '../types/fisherIntelligence';

import { HarborInfo } from '../components/roles/fisher/FishermanHeroCard';
import { SailingDecisionGauge } from '../components/roles/fisher/SailingDecisionGauge';
import { ReturnTimeTimeline } from '../components/roles/fisher/ReturnTimeTimeline';
import { SeaStateCard } from '../components/roles/fisher/SeaStateCard';
import { TideScheduleCard } from '../components/roles/fisher/TideScheduleCard';
import { ZoneRiskCard } from '../components/roles/fisher/ZoneRiskCard';
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
const INDIAN_HARBORS: HarborInfo[] = [
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

export const FisherDashboardPage: React.FC<FisherDashboardPageProps> = ({
  onOpenChatWithPrompt,
  onBack,
}) => {
  const { setActiveTab } = useUI();
  const { profile } = useAuthContext();
  const { language } = useLanguage();

  const [selectedHarbor, setSelectedHarbor] = useState<HarborInfo>(INDIAN_HARBORS[0]);
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

  // Initial welcome message in selected language
  useEffect(() => {
    if (qaMessages.length === 0) {
      setQaMessages([
        {
          id: 'init-marine',
          sender: 'assistant',
          text:
            language === 'mr'
              ? `नमस्कार मासेमार मित्रांनो! मी WeatherGPT Marine Assistant आहे. ${selectedHarbor.name} बंदरावरून समुद्रातील लाटा, वाऱ्याचा वेग, परतीची वेळ किंवा भरती-ओहोटीबद्दल कोणताही प्रश्न विचारा.`
              : language === 'hi'
              ? `नमस्कार मछुआरे भाइयों! मैं WeatherGPT Marine Assistant हूँ। ${selectedHarbor.name} से समुद्री लहरों, हवा की गति, सुरक्षित वापसी समय या ज्वार-भाटे के बारे में कोई भी प्रश्न पूछें।`
              : `Welcome to WeatherGPT Marine Intelligence for ${selectedHarbor.name}. Ask any questions regarding wave height, wind speed, departure clearance, or return deadlines.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [selectedHarbor.name, language]);

  const handleSendQuery = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isAsking) return;

    const userMsg: MarineQAMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setQaMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsAsking(true);

    setTimeout(() => {
      qaEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    try {
      const response = await chatService.sendMessage({
        conversationId: `marine_session_${userId}`,
        userId,
        message: textToSend,
        role: 'fisher',
        location: {
          latitude,
          longitude,
          city: selectedHarbor.name,
          state: selectedHarbor.state,
        },
        language,
      });

      const assistantReply = response.assistantMessage?.text || response.text || response.message || '';

      const assistantMsg: MarineQAMessage = {
        id: `ast_${Date.now()}`,
        sender: 'assistant',
        text: assistantReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setQaMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('[FisherDashboardPage] Marine Q&A failed:', err);
      const fallbackAnswer =
        language === 'mr'
          ? `माफ करा, संपर्क साधण्यात अडचण येत आहे. कृपया पुन्हा प्रयत्न करा.`
          : language === 'hi'
          ? `क्षमा करें, सर्वर से संपर्क नहीं हो पाया। कृपया पुनः प्रयास करें।`
          : 'Could not connect to Marine Intelligence service. Please try again.';

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
    <div className="w-full px-3.5 sm:px-4 pt-3 pb-24 space-y-3.5 font-['Arimo',sans-serif]">
      {/* 1. Coastal Harbor & Departure Port Selector Bar */}
      <div className="gov-panel p-3.5 bg-white border border-[#D6DCE1]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-[#006B3C] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Anchor className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-wider uppercase text-[#006B3C]">
                {language === 'mr' ? 'सागरी बंदर व नौकानयन क्षेत्र' : language === 'hi' ? 'समुद्री बंदरगाह व नौवहन क्षेत्र' : 'Coastal Harbor & Departure Port'}
              </div>
              <div className="text-sm font-bold text-[#17365D]">
                {selectedHarbor.name} ({selectedHarbor.state})
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#1F2933]">
                {language === 'mr' ? 'बंदर:' : language === 'hi' ? 'बंदरगाह:' : 'Harbor:'}
              </span>
              <select
                value={selectedHarbor.name}
                onChange={(e) => {
                  const h = INDIAN_HARBORS.find((item) => item.name === e.target.value);
                  if (h) setSelectedHarbor(h);
                }}
                className="gov-select text-xs font-bold text-[#17365D] bg-white border border-[#D6DCE1] px-2.5 py-1.5 rounded-none cursor-pointer focus:outline-none focus:border-[#006B3C]"
              >
                {INDIAN_HARBORS.map((h) => (
                  <option key={h.name} value={h.name}>
                    {h.name} - {h.state}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#1F2933]">
                {language === 'mr' ? 'प्रस्थान:' : language === 'hi' ? 'प्रस्थान:' : 'Depart:'}
              </span>
              <select
                value={selectedDeparture}
                onChange={(e) => setSelectedDeparture(e.target.value)}
                className="gov-select text-xs font-bold text-[#17365D] bg-white border border-[#D6DCE1] px-2.5 py-1.5 rounded-none cursor-pointer focus:outline-none focus:border-[#006B3C]"
              >
                {DEPARTURE_TIMES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={loadMarineData}
              disabled={loading}
              className="gov-btn-secondary px-2.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#006B3C]' : 'text-[#1F2933]'}`} />
              <span className="hidden sm:inline">{language === 'mr' ? 'अपडेट' : language === 'hi' ? 'अपडेट' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

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
                  Explore favorable fishing zones, SST & chlorophyll upwelling on interactive map
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

          {/* Port Clearance Decision Indicator */}
          <SailingDecisionGauge clearance={decisionData.sailing_clearance} />

          {/* Return-Time Intelligence Timeline */}
          <ReturnTimeTimeline
            returnIntel={decisionData.return_time_intelligence}
            temporalCurve={decisionData.temporal_curve}
          />

          {/* Hydrodynamic Sea State & Beaufort Metrics Table */}
          <SeaStateCard seaState={decisionData.sea_state} />

          {/* Tide Predictions & Harbor Draft Table */}
          <TideScheduleCard tides={decisionData.tide_schedule} />

          {/* Fishing Zone Danger Matrix */}
          <ZoneRiskCard zoneRisks={decisionData.zone_risks} />

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
                className="text-[11px] text-[#006B3C] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Full Chat View</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="p-3.5 space-y-3">
              {/* Prompt Suggestions */}
              <div className="flex flex-wrap gap-1.5">
                {promptSuggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendQuery(s)}
                    className="text-[11px] px-2.5 py-1 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#17365D] font-semibold border border-[#CBD5E1] rounded-none transition-colors cursor-pointer text-left"
                  >
                    💬 {s}
                  </button>
                ))}
              </div>

              {/* Message Box */}
              <div className="max-h-60 overflow-y-auto space-y-2.5 p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-none text-xs">
                {qaMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 ${
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.sender === 'assistant' && (
                      <div className="w-6 h-6 rounded-none bg-[#006B3C] text-white flex items-center justify-center shrink-0 text-[10px] font-bold">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div
                      className={`p-2 rounded-none max-w-[85%] text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#17365D] text-white'
                          : 'bg-white text-[#1F2933] border border-[#D6DCE1] shadow-2xs'
                      }`}
                    >
                      <div className="text-[9px] font-bold opacity-75 mb-0.5">
                        {msg.sender === 'user' ? 'Fisherman' : 'Marine Intelligence Officer'} • {msg.timestamp}
                      </div>
                      <div className="prose prose-xs max-w-none dark:prose-invert">
                        {msg.sender === 'assistant' ? (
                          <MarkdownRenderer content={msg.text} />
                        ) : (
                          <span>{msg.text}</span>
                        )}
                      </div>
                    </div>
                    {msg.sender === 'user' && (
                      <div className="w-6 h-6 rounded-none bg-[#17365D] text-white flex items-center justify-center shrink-0 text-[10px] font-bold">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))}
                {isAsking && (
                  <div className="flex items-center gap-2 text-xs text-[#5B6770] italic">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#006B3C]" />
                    <span>Analyzing marine hydrodynamic telemetry...</span>
                  </div>
                )}
                <div ref={qaEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendQuery();
                  }}
                  placeholder="Type marine query (e.g., wave height, swell, departure cutoff, tides)..."
                  className="flex-1 bg-white border border-[#CBD5E1] text-[#1F2933] text-xs px-3 py-2 rounded-none focus:outline-none focus:border-[#006B3C]"
                />
                <button
                  type="button"
                  onClick={() => handleSendQuery()}
                  disabled={isAsking || !inputQuery.trim()}
                  className="gov-btn-primary px-3 py-2 text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <span>Send</span>
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
