import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plane,
  RefreshCw,
  ArrowLeft,
  Compass,
  FileText,
  SlidersHorizontal,
  Send,
  Loader2,
  Bot,
  User,
  ShieldAlert,
  Sparkles,
  ArrowLeftRight,
  Navigation,
} from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { useUI } from '../context/UIContext';
import { useAuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { aviationIntelligenceService } from '../services/aviationIntelligenceService';
import { chatService } from '../services/chatService';
import { AviationBriefingData, AirportCatalogItem } from '../types/aviationIntelligence';

import { AirportSelector } from '../components/roles/aviation/AirportSelector';
import { FlightCategoryBadge } from '../components/roles/aviation/FlightCategoryBadge';
import { RunwayCrosswindDial } from '../components/roles/aviation/RunwayCrosswindDial';
import { ConversationalBriefingCard } from '../components/roles/aviation/ConversationalBriefingCard';
import { MetarTafDecoder } from '../components/roles/aviation/MetarTafDecoder';
import { AirportComparisonModal } from '../components/roles/aviation/AirportComparisonModal';
import { MarkdownRenderer } from '../components/common/MarkdownRenderer';

interface AviationQAMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface AviationDashboardPageProps {
  onOpenChatWithPrompt?: (prompt: string) => void;
  onBack?: () => void;
}

export const AviationDashboardPage: React.FC<AviationDashboardPageProps> = ({
  onOpenChatWithPrompt,
  onBack,
}) => {
  const { setActiveTab } = useUI();
  const { profile } = useAuthContext();
  const { language } = useLanguage();

  const [catalog, setCatalog] = useState<AirportCatalogItem[]>([]);
  const [selectedIcao, setSelectedIcao] = useState('VABB');
  const [activeRunwayOverride, setActiveRunwayOverride] = useState<string | undefined>(undefined);
  const [briefingData, setBriefingData] = useState<AviationBriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Aviation Q&A Chat State
  const [inputQuery, setInputQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [qaMessages, setQaMessages] = useState<AviationQAMessage[]>([]);
  const qaEndRef = useRef<HTMLDivElement | null>(null);

  const userId = profile?.user_id || 'aviation_ops_user';

  // Load Airport Catalog
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const list = await aviationIntelligenceService.getAirportsCatalog();
        setCatalog(list);
      } catch (e) {
        console.warn('[AviationDashboardPage] Could not load airport catalog:', e);
      }
    };
    loadCatalog();
  }, []);

  // Load Aviation Briefing Data
  const loadBriefing = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await aviationIntelligenceService.getAviationBriefing({
        icao: selectedIcao,
        activeRunwayOverride,
      });
      setBriefingData(data);
    } catch (err: any) {
      console.error('[AviationDashboardPage] Failed to load aviation briefing:', err);
      setError('Could not load live aviation aerodrome data.');
    } finally {
      setLoading(false);
    }
  }, [selectedIcao, activeRunwayOverride]);

  useEffect(() => {
    loadBriefing();
  }, [loadBriefing]);

  // Initial greeting in Q&A box
  useEffect(() => {
    if (briefingData && qaMessages.length === 0) {
      setQaMessages([
        {
          id: 'init-aviation',
          sender: 'assistant',
          text: `Welcome, Captain / Dispatcher. I am WeatherGPT Aviation Operations Assistant. I am monitoring ${briefingData.airport_name} (${briefingData.icao}/${briefingData.iata}). Ask about runway crosswind vectors, holding fuel, alternate aerodrome suitability, or METAR interpretation.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [briefingData, qaMessages.length]);

  const handleSendQuery = async (queryText: string) => {
    const textToSend = queryText.trim();
    if (!textToSend || isAsking) return;

    const userMsg: AviationQAMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setQaMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsAsking(true);

    try {
      const resp = await chatService.sendMessage({
        message: textToSend,
        userId,
        location: {
          latitude: briefingData?.coordinates.latitude || 19.0896,
          longitude: briefingData?.coordinates.longitude || 72.8656,
          city: `${briefingData?.airport_name} (${briefingData?.icao})`,
        },
        userRole: 'aviation',
        language: language || 'en',
      });

      const botMsg: AviationQAMessage = {
        id: `b_${Date.now()}`,
        sender: 'assistant',
        text: resp.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setQaMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('[AviationDashboardPage] Q&A chat error:', err);
      const errorMsg: AviationQAMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: 'Apologies, I encountered an issue retrieving aerodrome telemetry. Please check the runway crosswind dial above.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setQaMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAsking(false);
      setTimeout(() => {
        qaEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const currentAirportMeta = catalog.find((a) => a.icao.toUpperCase() === selectedIcao.toUpperCase());
  const availableRunways = currentAirportMeta?.runways || [];

  return (
    <div className="w-full pb-20 pt-2 px-3 sm:px-4 space-y-3.5 font-['Arimo',sans-serif]">
      {/* 1. Route Planning & Aerodrome Tools Action Header */}
      <div className="gov-panel p-2.5 bg-white flex items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xs bg-[#17365D] text-white flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4 text-amber-300" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-[#17365D] uppercase tracking-wide truncate">
              {language === 'mr'
                ? 'उड्डाण सल्लागार व धावपट्टी साधने'
                : language === 'hi'
                ? 'उड़ान सलाहकार एवं रनवे उपकरण'
                : 'Flight Advisory & Runway Operations'}
            </h2>
            <p className="text-[10px] text-[#5B6770] truncate">
              DGCA & IMD Aeronautical Telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsCompareOpen(true)}
            className="px-2.5 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-black uppercase rounded-xs transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Compare Aerodromes</span>
            <span className="sm:hidden">Compare</span>
          </button>
          <button
            type="button"
            onClick={() => (onBack ? onBack() : setActiveTab('home'))}
            className="px-2.5 py-1.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#17365D] border border-[#D6DCE1] text-xs font-bold uppercase rounded-xs transition-colors cursor-pointer"
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => loadBriefing()}
            disabled={loading}
            className="p-1.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#D6DCE1] text-[#17365D] rounded-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Aerodrome Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Loading / Error / Data */}
      {loading && !briefingData ? (
        <div className="gov-panel p-8 flex flex-col items-center justify-center gap-2.5 text-center">
          <Loader2 className="w-8 h-8 text-[#17365D] animate-spin" />
          <div className="text-sm font-bold text-[#17365D]">Calculating Aerodrome Flight Telemetry...</div>
          <p className="text-xs text-[#5B6770]">Evaluating runway crosswinds, cloud ceiling, altimeter QNH, and METAR/TAF vectors.</p>
        </div>
      ) : error && !briefingData ? (
        <div className="gov-panel p-6 bg-[#FEF2F2] border-[#FCA5A5] text-[#B42318] text-center space-y-2">
          <ShieldAlert className="w-8 h-8 mx-auto text-[#B42318]" />
          <div className="font-extrabold text-sm">{error}</div>
          <button
            onClick={() => loadBriefing()}
            className="px-4 py-2 bg-[#B42318] text-white rounded-xs text-xs font-bold shadow-xs hover:bg-[#912018] cursor-pointer"
          >
            Retry Fetch
          </button>
        </div>
      ) : briefingData ? (
        <div className="space-y-3.5">
          {/* 0. SKYROUTE Signature Feature Banner */}
          <div className="bg-[#17365D] border-2 border-[#006B3C] text-white p-3.5 sm:p-4 rounded-xs shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#006B3C] rounded-xs text-white shrink-0">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-bold tracking-wider font-mono">
                    SKYROUTE
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-[#006B3C] text-white font-bold rounded-xs uppercase">
                    Map-First Intelligence
                  </span>
                </div>
                <div className="text-xs font-semibold text-gray-200">
                  Weather-Aware Flight Route Corridor
                </div>
                <p className="text-[11px] text-gray-300 italic">
                  “See the weather before you fly through it.”
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('radar')}
              className="w-full sm:w-auto px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs uppercase tracking-wider rounded-xs border border-[#6D28D9] shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Navigation className="w-4 h-4" />
              <span>Plan Flight Route</span>
            </button>
          </div>

          {/* 1. Airport & Runway Selector */}
          <AirportSelector
            catalog={
              catalog.length > 0
                ? catalog
                : [
                    currentAirportMeta || {
                      icao: 'VABB',
                      iata: 'BOM',
                      name: 'Chhatrapati Shivaji Maharaj International Airport',
                      city: 'Mumbai',
                      state: 'Maharashtra',
                      latitude: 19.0896,
                      longitude: 72.8656,
                      elevation_ft: 39,
                      runways: [
                        { id: '27', heading_deg: 272, length_m: 3660 },
                        { id: '09', heading_deg: 92, length_m: 3660 },
                      ],
                    },
                  ]
            }
            selectedIcao={selectedIcao}
            onSelectIcao={(icao) => {
              setSelectedIcao(icao);
              setActiveRunwayOverride(undefined);
            }}
            selectedRunwayId={briefingData.active_runway.runway_id}
            onSelectRunwayId={(rwyId) => setActiveRunwayOverride(rwyId)}
            availableRunways={availableRunways}
          />

          {/* 2. Flight Rules & Aerodrome Operating Status Badge */}
          <FlightCategoryBadge flightRules={briefingData.flight_rules} />

          {/* 3. Ultra-Realistic Cockpit Avionics Runway Crosswind & Headwind Compass Visualizer */}
          <RunwayCrosswindDial
            activeRunway={briefingData.active_runway}
            alternateRunways={briefingData.alternate_runways}
            onSelectRunway={(rwyId) => setActiveRunwayOverride(rwyId)}
          />

          {/* 4. 3-Hour Executive Flight Briefing & Period Requiring Attention */}
          <ConversationalBriefingCard
            briefingData={briefingData}
            onAskChatWithPrompt={(prompt) => handleSendQuery(prompt)}
          />

          {/* 5. Interactive METAR & TAF Tokenized Decoder */}
          <MetarTafDecoder
            decodedMetarTaf={briefingData.decoded_metar_taf}
            icao={briefingData.icao}
          />

          {/* 6. Interactive Flight Ops Q&A Chat Box */}
          <div className="gov-panel p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2 border-b border-[#D6DCE1] pb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xs bg-[#17365D] text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-amber-300" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[#17365D] flex items-center gap-1.5 truncate">
                    <span>Aviation Flight Dispatcher Copilot</span>
                    <span className="w-2 h-2 rounded-full bg-[#006B3C] animate-pulse shrink-0"></span>
                  </h3>
                  <p className="text-[11px] text-[#5B6770] font-medium truncate">
                    Instant AI queries grounded in verified IMD/ICAO aerodrome telemetry
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Messages Log */}
            <div className="max-h-72 overflow-y-auto space-y-3 p-3 bg-[#F8FAFC] rounded-xs border border-[#D6DCE1] pr-1">
              {qaMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="w-6 h-6 rounded-xs bg-[#17365D] text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-amber-300" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] p-3 rounded-xs text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#17365D] text-white font-medium shadow-2xs'
                        : 'bg-white text-[#1F2933] font-medium border border-[#D6DCE1] shadow-2xs'
                    }`}
                  >
                    <MarkdownRenderer content={msg.text} isUser={msg.sender === 'user'} />
                    <div
                      className={`text-[9px] mt-1 font-semibold ${
                        msg.sender === 'user' ? 'text-amber-200' : 'text-[#5B6770]'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-6 h-6 rounded-xs bg-[#5B6770] text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}
              {isAsking && (
                <div className="flex items-center gap-2 text-xs font-bold text-[#17365D] bg-white p-2.5 rounded-xs border border-[#D6DCE1] w-fit animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#17365D]" />
                  <span>Analyzing runway vectors & aerodrome bulletins...</span>
                </div>
              )}
              <div ref={qaEndRef} />
            </div>

            {/* Quick Pilot Prompts */}
            <div className="space-y-1.5 pt-1 border-t border-[#D6DCE1]">
              <span className="text-[10px] font-bold text-[#5B6770] uppercase tracking-wider block">
                Quick Dispatch Queries:
              </span>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  'Is crosswind exceeding limit on active runway?',
                  'Cloud base & visibility forecast for next 3 hours?',
                  'Compare landing conditions with alternate airport.',
                  'Explain altimeter QNH setting and thunderstorm CAPE.',
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendQuery(suggestion)}
                    className="px-2.5 py-1 rounded-xs bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#6D28D9] text-[11px] font-bold border border-[#DDD6FE] whitespace-nowrap cursor-pointer transition-all shrink-0"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendQuery(inputQuery);
              }}
              className="flex items-center gap-2 pt-1"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask about crosswinds, ceiling, fuel, or alternates..."
                className="flex-1 w-full bg-white border border-[#D6DCE1] text-[#1F2933] text-xs font-medium py-2.5 px-3 rounded-xs outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all placeholder-[#5B6770]"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isAsking}
                className="p-2.5 rounded-xs bg-[#7C3AED] hover:bg-[#6D28D9] text-white transition-all cursor-pointer disabled:opacity-40 shadow-xs flex items-center justify-center shrink-0 active:scale-95"
              >
                {isAsking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {/* Dual Airport Comparison Modal */}
      <AirportComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        catalog={catalog.length > 0 ? catalog : aviationIntelligenceService.getFallbackAirportsCatalog()}
        defaultOriginIcao={selectedIcao}
        defaultDestIcao={selectedIcao === 'VAPO' ? 'VABB' : 'VAPO'}
      />
    </div>
  );
};

export default AviationDashboardPage;
