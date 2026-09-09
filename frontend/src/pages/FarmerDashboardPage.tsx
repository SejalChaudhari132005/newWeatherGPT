import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sprout,
  MapPin,
  RefreshCw,
  MessageSquare,
  Sparkles,
  ArrowLeft,
  Wind,
  Droplets,
  Thermometer,
  CloudRain,
  Send,
  Volume2,
  VolumeX,
  Loader2,
  Bot,
  User,
  ExternalLink,
} from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { useUI } from '../context/UIContext';
import { useAuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useVoice } from '../hooks/useVoice';
import { farmerIntelligenceService } from '../services/farmerIntelligenceService';
import { chatService } from '../services/chatService';
import { FarmerDecisionData } from '../types/farmerIntelligence';

import { CropStageSelector } from '../components/roles/farmer/CropStageSelector';
import { SprayingRiskCard } from '../components/roles/farmer/SprayingRiskCard';
import { FarmingWindowsTimeline } from '../components/roles/farmer/FarmingWindowsTimeline';
import { SoilMoistureGauge } from '../components/roles/farmer/SoilMoistureGauge';
import { PestDiseaseRiskCard } from '../components/roles/farmer/PestDiseaseRiskCard';
import { VernacularVoiceButton } from '../components/roles/farmer/VernacularVoiceButton';
import { RoleDashboardSwitcher } from '../components/roles/RoleDashboardSwitcher';
import { DemoBadge } from '../components/common/DemoBadge';
import { MarkdownRenderer } from '../components/common/MarkdownRenderer';

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
  const { userLocation } = useWeather();
  const { setActiveTab } = useUI();
  const { profile } = useAuthContext();
  const { language } = useLanguage();
  const { speakText, isSpeaking, stopSpeech } = useVoice();

  const [selectedCrop, setSelectedCrop] = useState('soybean');
  const [selectedStage, setSelectedStage] = useState('flowering');
  const [decisionData, setDecisionData] = useState<FarmerDecisionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Agri Q&A Chat State
  const [inputQuery, setInputQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [qaMessages, setQaMessages] = useState<AgriQAMessage[]>([]);
  const qaEndRef = useRef<HTMLDivElement | null>(null);

  const latitude = userLocation?.latitude || 19.076;
  const longitude = userLocation?.longitude || 72.8777;
  const locationName = userLocation?.city || 'Farming Field Zone';
  const userId = profile?.user_id || 'farmer_user';

  const loadFarmerData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await farmerIntelligenceService.getFarmerDecisions({
        latitude,
        longitude,
        crop: selectedCrop,
        stage: selectedStage,
        plannedSprayHour: 8,
      });
      setDecisionData(data);
    } catch (err: any) {
      console.error('[FarmerDashboardPage] Failed to load farmer decisions:', err);
      setError('Could not load live agricultural telemetry.');
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, selectedCrop, selectedStage]);

  useEffect(() => {
    loadFarmerData();
  }, [loadFarmerData]);

  // Initial greeting in Q&A box
  useEffect(() => {
    if (decisionData && qaMessages.length === 0) {
      setQaMessages([
        {
          id: 'init-agri',
          sender: 'assistant',
          text: `नमस्कार शेतकरी मित्रांनो! मी WeatherGPT Agri Assistant आहे. ${decisionData.crop} (${decisionData.phenological_stage}) पिकाबद्दल फवारणी, सिंचन, खते किंवा रोग नियंत्रणासंबंधी कोणताही प्रश्न विचारा.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [decisionData, qaMessages.length]);

  const handleSendQuery = async (queryText: string) => {
    const textToSend = queryText.trim();
    if (!textToSend || isAsking) return;

    const userMsg: AgriQAMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setQaMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsAsking(true);

    try {
      // Grounded agricultural context
      const contextualPrompt = decisionData
        ? `[Crop: ${decisionData.crop}, Stage: ${decisionData.phenological_stage}, Field Temp: ${decisionData.current_temp_c}°C, Humidity: ${decisionData.current_humidity_pct}%, Rain Prob: ${decisionData.current_rain_prob_pct}%, Spray Risk: ${decisionData.spraying_suitability.overall_risk}, Soil: ${decisionData.soil_state.moisture_status}] ${textToSend}`
        : textToSend;

      const res = await chatService.sendMessage(
        undefined,
        userId,
        contextualPrompt,
        'farmer',
        {
          latitude,
          longitude,
          city: locationName,
        },
        language
      );

      const aiMsg: AgriQAMessage = {
        id: `a_${Date.now()}`,
        sender: 'assistant',
        text: res.assistantMessage.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setQaMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('[FarmerDashboardPage] Q&A request failed:', err);
      // Fallback local grounded answer
      const fallbackAnswer = decisionData
        ? `सध्या ${decisionData.crop} पिकासाठी फवारणी जोखीम ${decisionData.spraying_suitability.overall_risk} आहे. फवारणीसाठी योग्य वेळ: ${decisionData.spraying_suitability.optimal_window || 'सकाळी 07:00 ते 10:00'}. जमिनीतील ओलावा: ${decisionData.soil_state.moisture_status}.`
        : `तापमान आणि हवामानाच्या अंदाजानुसार शेतीची कामे नियोजित करा.`;

      setQaMessages((prev) => [
        ...prev,
        {
          id: `a_fallback_${Date.now()}`,
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

  const handleOpenFullChat = (promptText?: string) => {
    const text = promptText || `Give me an agricultural weather briefing for ${decisionData?.crop || selectedCrop} in ${locationName}`;
    if (onOpenChatWithPrompt) {
      onOpenChatWithPrompt(text);
    } else {
      setActiveTab('ask');
    }
  };

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

            <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-sm shrink-0">
              <Sprout className="w-6 h-6" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  🌾 MY FARM
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider">
                  Crop Intelligence
                </span>
                <DemoBadge label="AGRI LIVE" variant="green" />
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                <span className="truncate">{locationName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => (onBack ? onBack() : setActiveTab('home'))}
              className="text-[10px] text-emerald-800 font-black bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Switch to Live Weather Dashboard"
            >
              🏠 Home
            </button>
            <button
              onClick={loadFarmerData}
              disabled={loading}
              className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-xl text-slate-700 transition-all cursor-pointer disabled:opacity-50 shadow-2xs shrink-0"
              title="Refresh Field Telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Global Role Dashboard Switcher */}
      <RoleDashboardSwitcher
        currentDashboard="farmer"
        onNavigate={(tab) => {
          if (tab === 'home' && onBack) {
            onBack();
          } else {
            setActiveTab(tab);
          }
        }}
      />

      {/* Interactive Crop & Stage Picker */}
      <CropStageSelector
        selectedCrop={selectedCrop}
        selectedStage={selectedStage}
        onCropChange={(crop) => setSelectedCrop(crop)}
        onStageChange={(stage) => setSelectedStage(stage)}
      />

      {loading && !decisionData ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col items-center justify-center gap-2.5 text-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <div className="text-sm font-bold text-slate-800">Calculating Crop Weather Intelligence...</div>
          <p className="text-xs text-slate-400">Evaluating soil moisture, FAO-56 ET0, wash-off, and drift windows.</p>
        </div>
      ) : decisionData ? (
        <>
          {/* Live Telemetry Summary 2x2 Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 flex items-center gap-2.5 shadow-2xs">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-xl shrink-0">
                <Thermometer className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider truncate">Field Temp</div>
                <div className="text-sm sm:text-base font-black text-slate-900 whitespace-nowrap">{decisionData.current_temp_c}°C</div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 flex items-center gap-2.5 shadow-2xs">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <Droplets className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider truncate">Air Humidity</div>
                <div className="text-sm sm:text-base font-black text-slate-900 whitespace-nowrap">{decisionData.current_humidity_pct}%</div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 flex items-center gap-2.5 shadow-2xs">
              <div className="p-2 bg-sky-50 text-sky-600 rounded-xl shrink-0">
                <CloudRain className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider truncate">Rain Chance</div>
                <div className="text-sm sm:text-base font-black text-slate-900 whitespace-nowrap">{decisionData.current_rain_prob_pct}%</div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 flex items-center gap-2.5 shadow-2xs">
              <div className="p-2 bg-teal-50 text-teal-600 rounded-xl shrink-0">
                <Wind className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider truncate">Wind Speed</div>
                <div className="text-sm sm:text-base font-black text-slate-900 whitespace-nowrap">{decisionData.spraying_suitability.wind_speed_kmh} km/h</div>
              </div>
            </div>
          </div>

          {/* 1-Tap Vernacular Regional Voice Audio */}
          <VernacularVoiceButton
            marathiText={decisionData.regional_advisory_text}
            englishText={decisionData.executive_summary}
          />

          {/* Hero Card: Chemical Spraying Risk */}
          <SprayingRiskCard
            assessment={decisionData.spraying_suitability}
            cropName={decisionData.crop}
          />

          {/* Best Farming Windows Timeline */}
          <FarmingWindowsTimeline
            windows={decisionData.best_farming_windows}
          />

          {/* Soil Moisture & ET0 Gauges */}
          <SoilMoistureGauge
            soilState={decisionData.soil_state}
          />

          {/* Pest & Disease Alerts */}
          <PestDiseaseRiskCard
            risks={decisionData.pest_disease_risks}
            cropName={decisionData.crop}
          />

          {/* Interactive Agri Bot Q&A Card with Live Question/Answer Field */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-emerald-200/80 shadow-md space-y-3.5">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-2xl shrink-0">
                  <Bot className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-1.5 truncate">
                    <span>Agri Assistant (कृषी सल्लागार)</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium truncate">
                    Ask about {decisionData.crop}, spraying, or soil moisture
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleOpenFullChat()}
                className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200/60 shrink-0"
              >
                <span>Chat View</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Q&A Conversation Stream */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {qaMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`p-3.5 rounded-2xl max-w-[85%] text-xs font-medium leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none shadow-xs'
                        : 'bg-emerald-50/70 border border-emerald-100 text-slate-800 rounded-bl-none shadow-xs'
                    }`}
                  >
                    <MarkdownRenderer content={msg.text} isUser={msg.sender === 'user'} />
                    <div
                      className={`flex items-center justify-between gap-2 mt-1 text-[10px] ${
                        msg.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {msg.sender === 'assistant' && (
                        <button
                          onClick={() => (isSpeaking ? stopSpeech() : speakText(msg.text, language === 'mr' ? 'mr-IN' : 'en-IN'))}
                          className="text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer font-bold"
                          title="Listen in Voice"
                        >
                          {isSpeaking ? <VolumeX className="w-3 h-3 text-rose-500" /> : <Volume2 className="w-3 h-3" />}
                          <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
                        </button>
                      )}
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
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200/80 w-fit animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>कृषी सल्लागार विश्लेषण करत आहे... (Analyzing field weather)...</span>
                </div>
              )}

              <div ref={qaEndRef} />
            </div>

            {/* Quick Clickable Suggestions */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Quick Questions (पटकन विचारा):
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button
                  onClick={() => handleSendQuery(`उद्या सकाळी ${decisionData.crop} पिकावर फवारणी करणे सुरक्षित आहे का?`)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-200 whitespace-nowrap cursor-pointer transition-all shrink-0"
                >
                  🧪 उद्या फवारणी करावी का?
                </button>
                <button
                  onClick={() => handleSendQuery(`आजच्या जमिनीतील ओलाव्यानुसार मी कधी पाणी (सिंचन) दिले पाहिजे?`)}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold border border-blue-200 whitespace-nowrap cursor-pointer transition-all shrink-0"
                >
                  💧 पाणी (सिंचन) कधी करावे?
                </button>
                <button
                  onClick={() => handleSendQuery(`${decisionData.crop} पिकासाठी कीड आणि बुरशीपासून बचावासाठी काय उपाययोजना करावी?`)}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 text-xs font-bold border border-rose-200 whitespace-nowrap cursor-pointer transition-all shrink-0"
                >
                  🐛 कीड व रोग नियंत्रण सल्ला
                </button>
              </div>
            </div>

            {/* Interactive Question Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendQuery(inputQuery);
              }}
              className="flex items-center gap-2 pt-1"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder={`उदा. ${decisionData.crop} पिकाबद्दल प्रश्न विचारा... / Ask about your crop...`}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium py-3 pl-3.5 pr-10 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-2xs"
                  disabled={isAsking}
                />
              </div>

              <button
                type="submit"
                disabled={!inputQuery.trim() || isAsking}
                className="p-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-2xl shadow-md transition-all flex items-center justify-center shrink-0 cursor-pointer active:scale-95"
                title="Send Question"
              >
                {isAsking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>

          {/* Provenance & Confidence Notice */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-500 flex items-center justify-between">
            <div>
              <strong>Data Provenance: </strong>
              <span>{decisionData.provenance.source} • Evaluated {new Date(decisionData.generated_at).toLocaleTimeString()}</span>
            </div>
            <div className="font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
              Confidence: {decisionData.provenance.confidence_score}%
            </div>
          </div>
        </>
      ) : (
        <div className="p-6 bg-rose-50 rounded-3xl border border-rose-200 text-rose-800 text-sm font-semibold">
          {error || 'Unable to retrieve farm intelligence. Please check network connection.'}
        </div>
      )}
    </div>
  );
};
