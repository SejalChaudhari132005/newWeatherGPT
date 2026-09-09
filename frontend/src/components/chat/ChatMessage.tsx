import React from 'react';
import { ChatMessage as ChatMessageType } from '../../types/chat';
import { WeatherSummaryCard } from './WeatherSummaryCard';
import { WeatherAlertCard } from './WeatherAlertCard';
import { HourlyForecastCard } from './HourlyForecastCard';
import { DailyForecastCard } from './DailyForecastCard';
import { SourceCard } from './SourceCard';
import { ConfidenceBadge } from './ConfidenceBadge';
import { MessageActions } from './MessageActions';

interface Props {
  message: ChatMessageType;
  onFollowupClick?: (text: string) => void;
  onRegenerate?: () => void;
}

// Simple markdown formatter for bold, bullet points, and headers
const renderFormattedText = (text: string) => {
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    // Check if bullet point
    const isBullet = line.trim().startsWith('•') || line.trim().startsWith('- ') || line.trim().startsWith('* ');
    const cleanedLine = isBullet ? line.trim().replace(/^[•\-\*]\s*/, '') : line;

    // Parse **bold** parts
    const parts = cleanedLine.split(/(\*\*.*?\*\*)/g);
    const content = parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={partIdx} className="font-black text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    if (isBullet) {
      return (
        <li key={lineIdx} className="ml-4 list-disc text-slate-800 my-0.5 leading-relaxed">
          {content}
        </li>
      );
    }

    if (!line.trim()) {
      return <div key={lineIdx} className="h-2" />;
    }

    return (
      <p key={lineIdx} className="leading-relaxed text-slate-800 my-1">
        {content}
      </p>
    );
  });
};

export const ChatMessage: React.FC<Props> = ({
  message,
  onFollowupClick,
  onRegenerate,
}) => {
  const isUser = message.sender === 'user';

  // 1. USER MESSAGE (Right-aligned compact bubble)
  if (isUser) {
    return (
      <div className="flex justify-end my-3 font-['Arimo'] animate-fadeIn">
        <div className="max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl rounded-tr-xs bg-[#004aad] text-white shadow-sm">
          <p className="text-sm font-bold leading-relaxed">{message.text}</p>
          <div className="text-[10px] text-blue-100 font-semibold text-right pt-1 opacity-80">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  }

  // 2. ASSISTANT MESSAGE (ChatGPT-style Left-aligned with Cloud Identity)
  const meta = message.metadata;
  const weatherCtx = meta?.weather_context;
  const hasAlerts = meta?.alerts && meta.alerts.length > 0;
  const confScore = meta?.confidence?.score;

  return (
    <div className="flex gap-3 my-4 max-w-[95%] sm:max-w-[90%] font-['Arimo'] animate-fadeIn">
      {/* ☁ WeatherGPT Cloud Identity Avatar */}
      <div className="w-8 h-8 rounded-full bg-sky-50 border border-sky-200/80 shadow-2xs flex items-center justify-center shrink-0 mt-1">
        <img src="/assets/logo-icon.png" alt="WeatherGPT" className="w-5 h-5 object-contain" />
      </div>

      <div className="flex-1 space-y-2 min-w-0">
        {/* Assistant Name & Live Indicators */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1">
              <span>WeatherGPT</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <ConfidenceBadge score={confScore} label={meta?.confidence?.level} />
        </div>

        {/* Assistant Response Card */}
        <div className="p-4 sm:p-5 rounded-3xl rounded-tl-xs bg-white border border-slate-200/90 shadow-2xs space-y-2.5">
          {/* Official Warning Card (if verified alert exists) */}
          {hasAlerts && <WeatherAlertCard alerts={weatherCtx?.alerts || (meta?.alerts as any)} />}

          {/* Full Weather Summary Card for overview queries */}
          {weatherCtx?.current_weather && (meta?.intent === 'CURRENT_WEATHER' || meta?.intent === 'LOCATION_WEATHER' || meta?.intent === 'WEATHER_OVERVIEW') && (
            <WeatherSummaryCard
              weather={weatherCtx.current_weather}
              locationName={meta?.location?.city || weatherCtx.location?.city}
            />
          )}

          {/* Compact Weather Summary Card for temperature queries */}
          {weatherCtx?.current_weather && meta?.intent === 'TEMPERATURE' && (
            <WeatherSummaryCard
              weather={weatherCtx.current_weather}
              locationName={meta?.location?.city || weatherCtx.location?.city}
              compact={true}
            />
          )}

          {/* Formatted Narrative Answer */}
          <div className="text-sm font-medium text-slate-800 space-y-1">
            {renderFormattedText(message.text)}
          </div>

          {/* Hourly Timeline if hourly intent */}
          {meta?.intent === 'HOURLY_FORECAST' && weatherCtx?.forecast && (
            <HourlyForecastCard forecast={weatherCtx.forecast} />
          )}

          {/* Multi-Day Timeline if forecast query */}
          {(meta?.intent === 'DAILY_FORECAST' || meta?.intent === 'FORECAST') && weatherCtx?.forecast && (
            <DailyForecastCard forecast={weatherCtx.forecast} />
          )}

          {/* Transparent Source Attribution & Live Freshness */}
          <SourceCard
            sources={meta?.sources}
            location={meta?.location}
            retrievedAt={meta?.timestamp || weatherCtx?.retrieved_at}
            latencyMs={meta?.latencies?.total_ms}
          />
        </div>

        {/* Interactive Action Buttons (e.g. Route / Radar Actions) */}
        {meta?.action_buttons && meta.action_buttons.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {meta.action_buttons.map((btn: any, bIdx: number) => (
              <button
                key={bIdx}
                onClick={() => onFollowupClick && onFollowupClick(btn.action)}
                className="px-3 py-1.5 rounded-2xl bg-gradient-to-r from-blue-50 to-sky-50 hover:from-blue-100 hover:to-sky-100 text-[#004aad] text-xs font-black border border-blue-200/90 transition-all cursor-pointer shadow-2xs active:scale-98"
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* Message Actions (Read aloud, Copy, Feedback, Regenerate) */}
        <MessageActions text={message.text} onRegenerate={onRegenerate} />

        {/* Suggested Followups */}
        {message.suggestedFollowups && message.suggestedFollowups.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {message.suggestedFollowups.map((followup, idx) => (
              <button
                key={idx}
                onClick={() => onFollowupClick && onFollowupClick(followup)}
                className="px-3 py-1 rounded-full bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-[#004aad] text-xs font-bold border border-slate-200/80 transition-colors cursor-pointer shadow-2xs"
              >
                {followup}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

