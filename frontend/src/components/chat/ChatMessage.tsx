import React from 'react';
import { ChatMessage as ChatMessageType, ActiveNavPage } from '../../types/chat';
import { useLanguage } from '../../context/LanguageContext';
import { WeatherSummaryCard } from './WeatherSummaryCard';
import { WeatherAlertCard } from './WeatherAlertCard';
import { HourlyForecastCard } from './HourlyForecastCard';
import { DailyForecastCard } from './DailyForecastCard';
import { ChatAirQualityCard } from './ChatAirQualityCard';
import { ChatRadarPreviewCard } from './ChatRadarPreviewCard';
import { SourceCard } from './SourceCard';
import { MessageActions } from './MessageActions';
import { Wind, ShieldCheck, Thermometer, CloudSun, AlertTriangle, Lightbulb } from 'lucide-react';

interface Props {
  message: ChatMessageType;
  onFollowupClick?: (text: string) => void;
  onNavigate?: (page: ActiveNavPage) => void;
  onRegenerate?: () => void;
}

const highlightTokens = (text: string) => {
  const tokenRegex = /(\b\d+(?:\.\d+)?\s*°\s*[CF]\b|\b\d+(?:\.\d+)?\s*%|\b\d+(?:\.\d+)?\s*(?:km\/h|ug\/m3|μg\/m³|hPa)\b|\bUV\s*\d+\b|\bअतिनील\s*निर्देशांक\s*≈?\s*\d+\b)/gi;
  const segments = text.split(tokenRegex);

  return segments.map((seg, idx) => {
    if (seg.match(/°\s*[CF]/i)) {
      return (
        <span
          key={idx}
          className="inline-flex items-center px-1 py-0.2 rounded-none text-xs font-bold bg-[#F8FAFC] text-[#17365D] border border-[#D6DCE1] mx-0.5 font-mono"
        >
          {seg.trim()}
        </span>
      );
    }
    if (seg.match(/%/)) {
      return (
        <span
          key={idx}
          className="inline-flex items-center px-1 py-0.2 rounded-none text-xs font-bold bg-[#F8FAFC] text-[#1D5F91] border border-[#D6DCE1] mx-0.5 font-mono"
        >
          {seg.trim()}
        </span>
      );
    }
    if (seg.match(/(?:km\/h|ug\/m3|μg\/m³|hPa)/i)) {
      return (
        <span
          key={idx}
          className="inline-flex items-center px-1 py-0.2 rounded-none text-xs font-bold bg-[#F8FAFC] text-[#006B3C] border border-[#D6DCE1] mx-0.5 font-mono"
        >
          {seg.trim()}
        </span>
      );
    }
    if (seg.match(/UV|अतिनील/i)) {
      return (
        <span
          key={idx}
          className="inline-flex items-center px-1 py-0.2 rounded-none text-xs font-bold bg-amber-50 text-[#B7791F] border border-amber-200 mx-0.5"
        >
          {seg.trim()}
        </span>
      );
    }
    return seg;
  });
};

const formatLineContent = (rawText: string) => {
  let cleaned = rawText
    .replace(/[#*]+/g, '')
    .replace(/\s*:\s*$/, ':')
    .trim();

  return highlightTokens(cleaned);
};

const renderFormattedNarrative = (rawText: string) => {
  if (!rawText) return null;

  let text = rawText
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\s+\*\s+\*/g, '')
    .replace(/\*\s+\*/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*\s*-\s*/g, '\n- ')
    .replace(/\*\s*•\s*/g, '\n- ')
    .replace(/\s*:\s*\*\s*/g, ': ');

  const knownHeaders = [
    'हवा गुणवत्ता निर्देशांक',
    'सध्याची परिस्थिती',
    'आजचा अंदाज',
    'अधिकृत चेतावणी',
    'व्यावहारिक शिफारस',
    'बाह्य क्रियाकलाप',
    'संवेदनशील गट',
    'चिंतेचे मुख्य प्रदूषक',
    'मुख्य प्रदूषक',
    'हवामान सारांश',
    'Current Conditions',
    'Today\'s Forecast',
    'Official Warning',
    'Practical Recommendation',
    'Outdoor Activity',
    'Sensitive Groups',
    'Weather Summary',
  ];
  for (const h of knownHeaders) {
    text = text.replace(new RegExp(`(?<!\\n\\n)(?:-|\b)(${h}(?:\\s*\\([^)]*\\))?):?\\s*`, 'gi'), '\n\n$1:\n');
  }

  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  return (
    <div className="space-y-2 text-[#1F2933] text-xs sm:text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const lowerLine = line.toLowerCase();
        const isHeader =
          line.endsWith(':') ||
          knownHeaders.some((h) => lowerLine.startsWith(h.toLowerCase()));

        if (isHeader) {
          let icon = <Lightbulb className="w-3.5 h-3.5 text-[#006B3C]" />;

          if (lowerLine.includes('सध्याची') || lowerLine.includes('current')) {
            icon = <Thermometer className="w-3.5 h-3.5 text-[#17365D]" />;
          } else if (lowerLine.includes('अंदाज') || lowerLine.includes('forecast')) {
            icon = <CloudSun className="w-3.5 h-3.5 text-[#1D5F91]" />;
          } else if (lowerLine.includes('चेतावणी') || lowerLine.includes('warning') || lowerLine.includes('इशारा')) {
            icon = lowerLine.includes('नाही') || lowerLine.includes('none')
              ? <ShieldCheck className="w-3.5 h-3.5 text-[#006B3C]" />
              : <AlertTriangle className="w-3.5 h-3.5 text-[#B7791F]" />;
          } else if (lowerLine.includes('हवा गुणवत्ता') || lowerLine.includes('air quality') || lowerLine.includes('प्रदूषक')) {
            icon = <Wind className="w-3.5 h-3.5 text-[#006B3C]" />;
          } else if (lowerLine.includes('शिफारस') || lowerLine.includes('क्रियाकलाप') || lowerLine.includes('activity')) {
            icon = <Lightbulb className="w-3.5 h-3.5 text-[#B7791F]" />;
          }

          const headerTitle = line.replace(/:$/, '').trim();

          return (
            <div
              key={idx}
              className="p-2 bg-[#F8FAFC] border-b border-[#D6DCE1] flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-[#17365D] mt-2.5 mb-1"
            >
              {icon}
              <span>{headerTitle}</span>
            </div>
          );
        }

        // Bullet points
        const isBullet = line.startsWith('•') || line.startsWith('- ') || line.startsWith('* ');
        if (isBullet) {
          const cleanBulletText = line.replace(/^[•\-\*]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="w-1.5 h-1.5 rounded-none bg-[#006B3C] mt-1.5 shrink-0" />
              <div className="flex-1">{formatLineContent(cleanBulletText)}</div>
            </div>
          );
        }

        // Numbered list item
        const matchNum = line.match(/^(\d+\.)\s*(.*)/);
        if (matchNum) {
          return (
            <div key={idx} className="p-2 bg-white border border-[#D6DCE1] flex items-start gap-2 my-1">
              <span className="w-4 h-4 rounded-none bg-[#17365D] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {matchNum[1].replace('.', '')}
              </span>
              <div className="flex-1">{formatLineContent(matchNum[2])}</div>
            </div>
          );
        }

        // Regular paragraph
        return (
          <p key={idx} className="my-1">
            {formatLineContent(line)}
          </p>
        );
      })}
    </div>
  );
};

export const ChatMessage: React.FC<Props> = ({
  message,
  onFollowupClick,
  onNavigate,
  onRegenerate,
}) => {
  const isUser = message.sender === 'user';

  // 1. USER QUERY ROW (Right-aligned rectangular government query panel)
  if (isUser) {
    return (
      <div className="flex justify-end my-2.5 font-sans animate-fadeIn">
        <div className="max-w-[85%] sm:max-w-[75%] p-3 bg-[#17365D] text-white border border-[#17365D] space-y-1">
          <div className="text-[10px] text-sky-200 font-bold uppercase tracking-wider">
            CITIZEN QUERY
          </div>
          <p className="text-xs sm:text-sm font-medium leading-relaxed">{message.text}</p>
          <div className="text-[10px] text-sky-200/80 font-mono text-right pt-0.5">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  }

  // 2. ASSISTANT RESPONSE (Rectangular government consultation bulletin)
  const meta = message.metadata;
  const weatherCtx = meta?.weather_context;
  const hasAlerts = meta?.alerts && meta.alerts.length > 0;
  const isAirQuality = meta?.intent === 'AIR_QUALITY' || !!(meta as any)?.air_quality;

  const handleOpenRadar = () => {
    if (onNavigate) {
      onNavigate('map');
    } else if (onFollowupClick) {
      onFollowupClick('navigate_map');
    }
  };

  return (
    <div className="flex gap-2.5 my-3 font-sans animate-fadeIn">
      {/* Official Department Tag Avatar */}
      <div className="w-8 h-8 rounded-none bg-[#006B3C] text-white flex items-center justify-center shrink-0 border border-[#006B3C]">
        <span className="text-[10px] font-bold">IMD</span>
      </div>

      {/* Advisory Consultation Content */}
      <div className="space-y-2 max-w-[88%] sm:max-w-[85%]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#17365D] uppercase tracking-wider">
            WEATHERGPT ADVISORY SERVICE
          </span>
          <span className="text-[10px] text-[#5B6770] font-mono">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Structured Panel */}
        <div className="gov-panel p-3.5 space-y-3">
          {/* Warning Card if verified alert exists */}
          {hasAlerts && <WeatherAlertCard alerts={weatherCtx?.alerts || (meta?.alerts as any)} />}

          {/* Embedded Air Quality Card */}
          {isAirQuality && (meta as any)?.air_quality && (
            <ChatAirQualityCard
              airQuality={(meta as any).air_quality}
              locationName={meta?.location?.city || weatherCtx?.location?.city}
            />
          )}

          {/* Embedded Weather Summary Card */}
          {!isAirQuality && weatherCtx?.current_weather && (
            <WeatherSummaryCard
              weather={weatherCtx.current_weather}
              locationName={meta?.location?.city || weatherCtx.location?.city}
              compact={false}
            />
          )}

          {/* Formatted Narrative Answer */}
          <div className="pt-1">
            {renderFormattedNarrative(message.text)}
          </div>

          {/* Hourly Timeline */}
          {meta?.intent === 'HOURLY_FORECAST' && weatherCtx?.forecast && (
            <HourlyForecastCard forecast={weatherCtx.forecast} />
          )}

          {/* Multi-Day Timeline */}
          {(meta?.intent === 'DAILY_FORECAST' || meta?.intent === 'FORECAST') && weatherCtx?.forecast && (
            <DailyForecastCard forecast={weatherCtx.forecast} />
          )}

          {/* Doppler Radar Preview */}
          {(meta?.intent === 'RADAR' || meta?.intent === 'MAP' || (meta as any)?.show_map) && (
            <ChatRadarPreviewCard
              locationName={meta?.location?.city || weatherCtx?.location?.city}
              onOpenMap={handleOpenRadar}
            />
          )}

        </div>

        {/* Dynamic Interactive Action Buttons */}
        {meta?.action_buttons && meta.action_buttons.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {meta.action_buttons.map((btn: any, bIdx: number) => (
              <button
                key={bIdx}
                onClick={() => onFollowupClick && onFollowupClick(btn.action)}
                className="gov-btn-primary px-3 py-1.5 text-xs font-bold uppercase cursor-pointer"
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* Message Actions */}
        <MessageActions text={message.text} onRegenerate={onRegenerate} />

        {/* Suggested Followups */}
        {message.suggestedFollowups && message.suggestedFollowups.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {message.suggestedFollowups.map((followup, idx) => (
              <button
                key={idx}
                onClick={() => onFollowupClick && onFollowupClick(followup)}
                className="gov-btn-secondary px-2.5 py-1 text-xs font-semibold cursor-pointer"
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
