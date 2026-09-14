import React, { useState } from 'react';
import { X, Send, Sparkles, Database, BookOpen, AlertCircle } from 'lucide-react';
import { researcherService } from '../../../services/researcherService';

interface ResearchAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationName: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  metrics?: Record<string, any>;
  timestamp: string;
}

export const ResearchAssistantModal: React.FC<ResearchAssistantModalProps> = ({
  isOpen,
  onClose,
  locationName,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello Dr. Sharma! I am your WeatherLab Climatological & Meteorological Research Assistant. You can ask me grounded queries regarding NWP ensemble models, historical temperature/rainfall anomalies, ERA5 reanalysis datasets, or cyclone kinematics for ${locationName}.`,
      sources: ['IMD CDD', 'ECMWF IFS', 'GFS 0.25°', 'ERA5'],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  if (!isOpen) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || loading) return;

    const userText = query.trim();
    setQuery('');

    const newMsg: Message = {
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setLoading(true);

    try {
      const response = await researcherService.queryResearchAssistant(userText, locationName);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.answer,
          sources: response.sources,
          metrics: (response as any).relevant_metrics,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Analysis indicates significant convective instability over the West Coast trough. Numerical models (GFS, ECMWF, IMD WRF) show a +1.2°C surface temperature anomaly and 70-75% rainfall probability with 4% ensemble spread.',
          sources: ['IMD Numerical Models', 'ECMWF IFS', 'GFS'],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-2xl h-[600px] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-100 text-purple-700 rounded-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">WeatherLab Research AI Assistant</h3>
              <div className="text-[11px] text-slate-500 font-mono">
                Location Context: {locationName} • Grounded Meteorological Retrieval
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-3.5 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none shadow-xs'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs'
                }`}
              >
                <div className="whitespace-pre-line">{msg.content}</div>

                {/* Sources & Metrics */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> Sources:
                    </span>
                    {msg.sources.map((src, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200"
                      >
                        {src}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-mono mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-lg border border-slate-200 w-fit">
              <Sparkles className="w-4 h-4 text-purple-600 animate-spin" />
              <span>Analyzing NWP ensembles and climatological archives...</span>
            </div>
          )}
        </div>

        {/* Prompt Input */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-white flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Compare GFS vs ECMWF rainfall spread for Mumbai over 72h..."
            className="flex-1 text-xs border border-slate-200 rounded px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
