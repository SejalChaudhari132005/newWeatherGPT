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
import { RoleDashboardSwitcher } from '../components/roles/RoleDashboardSwitcher';
import { DemoBadge } from '../components/common/DemoBadge';
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
    <div className="w-full pb-6 pt-2 px-3 space-y-4 animate-fadeIn font-['Arimo']">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer shrink-0"
                title="Go Back to Home Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-sm shrink-0">
              <Plane className="w-6 h-6" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  ✈️ MY OPERATIONS
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[9px] font-black uppercase tracking-wider">
                  Flight Intelligence
                </span>
                <DemoBadge label="OPS LIVE" variant="blue" />
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1 mt-0.5">
                <Compass className="w-3 h-3 text-indigo-600 shrink-0" />
                <span className="truncate">{briefingData ? `${briefingData.airport_name} (${briefingData.icao})` : 'Aerodrome Telemetry'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsCompareOpen(true)}
              className="text-[10px] text-indigo-800 font-black bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1"
              title="Compare Route Aerodromes"
            >
              <ArrowLeftRight className="w-3 h-3" />
              <span className="hidden sm:inline">Compare</span>
            </button>
            <button
              onClick={() => (onBack ? onBack() : setActiveTab('home'))}
              className="text-[10px] text-slate-800 font-black bg-slate-100 hover:bg-slate-200 border border-slate-200/80 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Switch to Live Weather Dashboard"
            >
              🏠 Home
            </button>
            <button
              onClick={() => loadBriefing()}
              disabled={loading}
              className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-xl text-slate-700 transition-all cursor-pointer disabled:opacity-50 shadow-2xs shrink-0"
              title="Refresh Aerodrome Telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Global Role Dashboard Switcher */}
      <RoleDashboardSwitcher
        currentDashboard="aviation"
        onNavigate={(tab) => {
          if (tab === 'home' && onBack) {
            onBack();
          } else {
            setActiveTab(tab);
          }
        }}
      />

      {/* Main Content Loading / Error / Data */}
      {loading && !briefingData ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col items-center justify-center gap-2.5 text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <div className="text-sm font-bold text-slate-800">Calculating Aerodrome Flight Telemetry...</div>
          <p className="text-xs text-slate-400">Evaluating runway crosswinds, cloud ceiling, altimeter QNH, and METAR/TAF vectors.</p>
        </div>
      ) : error && !briefingData ? (
        <div className="p-6 bg-rose-50 rounded-3xl border border-rose-200 text-rose-800 text-center space-y-2">
          <ShieldAlert className="w-8 h-8 mx-auto text-rose-600" />
          <div className="font-extrabold text-sm">{error}</div>
          <button
            onClick={() => loadBriefing()}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-rose-700 cursor-pointer"
          >
            Retry Fetch
          </button>
        </div>
      ) : briefingData ? (
        <div className="space-y-4">
          {/* 1. Airport & Runway Selector */}
          <AirportSelector
            catalog={catalog.length > 0 ? catalog : [currentAirportMeta || {
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
            }]}
            selectedIcao={selectedIcao}
            onSelectIcao={(icao) => {
              setSelectedIcao(icao);
              setActiveRunwayOverride(undefined); // Reset active runway when airport changes
            }}
            selectedRunwayId={briefingData.active_runway.runway_id}
            onSelectRunwayId={(rwyId) => setActiveRunwayOverride(rwyId)}
            availableRunways={availableRunways}
          />

          {/* 2. Flight Rules & Aerodrome Operating Status Badge */}
          <FlightCategoryBadge flightRules={briefingData.flight_rules} />

          {/* 3. Runway Crosswind & Headwind Compass Visualizer */}
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
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-indigo-200/80 shadow-md space-y-3.5">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-2 rounded-2xl bg-indigo-100 text-indigo-700 shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-1.5 truncate">
                    <span>Aviation Assistant</span>
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shrink-0"></span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium truncate">
                    Instant AI queries grounded in verified aerodrome telemetry
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Messages Log */}
            <div className="max-h-72 overflow-y-auto space-y-3 p-3 bg-slate-50/70 rounded-2xl border border-slate-200/80 pr-1">
              {qaMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white font-medium rounded-br-none shadow-xs'
                        : 'bg-indigo-50/70 text-slate-800 font-medium border border-indigo-100 shadow-xs rounded-bl-none'
                    }`}
                  >
                    <MarkdownRenderer content={msg.text} isUser={msg.sender === 'user'} />
                    <div
                      className={`text-[9px] mt-1 font-semibold ${
                        msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-7 h-7 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              {isAsking && (
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-800 bg-indigo-50/80 p-3 rounded-2xl border border-indigo-200/80 w-fit animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Analyzing runway vectors & aerodrome bulletins...</span>
                </div>
              )}
              <div ref={qaEndRef} />
            </div>

            {/* Quick Pilot Prompts */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Quick Dispatch Queries:
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {[
                  'Is crosswind exceeding limit on active runway?',
                  'Cloud base & visibility forecast for next 3 hours?',
                  'Compare landing conditions with alternate airport.',
                  'Explain altimeter QNH setting and thunderstorm CAPE.',
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendQuery(suggestion)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold border border-indigo-200/80 whitespace-nowrap cursor-pointer transition-all shrink-0"
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
                className="flex-1 w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium py-3 pl-3.5 pr-4 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-2xs placeholder-slate-400"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isAsking}
                className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer disabled:opacity-40 shadow-md flex items-center justify-center shrink-0 active:scale-95"
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
