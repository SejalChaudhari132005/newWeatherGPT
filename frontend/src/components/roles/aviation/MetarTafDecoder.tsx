import React, { useState } from 'react';
import { FileText, Copy, Check, Sparkles } from 'lucide-react';
import { DecodedMetarTaf, DecodedMetarToken } from '../../../types/aviationIntelligence';
import { MarkdownRenderer } from '../../common/MarkdownRenderer';

interface MetarTafDecoderProps {
  decodedMetarTaf: DecodedMetarTaf;
  icao: string;
}

export const MetarTafDecoder: React.FC<MetarTafDecoderProps> = ({
  decodedMetarTaf,
  icao,
}) => {
  const [viewMode, setViewMode] = useState<'interactive' | 'plain'>('interactive');
  const [selectedToken, setSelectedToken] = useState<DecodedMetarToken | null>(null);
  const [copied, setCopied] = useState(false);

  const { raw_metar, raw_taf, plain_english_briefing, tokens } = decodedMetarTaf;

  const handleCopyRaw = () => {
    if (raw_metar) {
      navigator.clipboard.writeText(`${raw_metar}\n${raw_taf || ''}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getCategoryColor = (category: string, isHazard?: boolean) => {
    if (isHazard) return 'bg-[#FEF2F2] text-[#B42318] border-[#FECACA] font-bold';
    switch (category) {
      case 'station':
        return 'bg-[#EDE9FE] text-[#6D28D9] border-[#DDD6FE]';
      case 'time':
        return 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]';
      case 'wind':
        return 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]';
      case 'visibility':
        return 'bg-[#F0F9FF] text-[#0284C7] border-[#BAE6FD]';
      case 'clouds':
        return 'bg-[#F8FAFC] text-[#334155] border-[#CBD5E1]';
      case 'temp_dew':
        return 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]';
      case 'altimeter':
        return 'bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]';
      case 'remark':
        return 'bg-[#F0FDF4] text-[#006B3C] border-[#BBF7D0]';
      default:
        return 'bg-[#F8FAFC] text-[#5B6770] border-[#D6DCE1]';
    }
  };

  return (
    <div className="gov-panel p-3.5 bg-white space-y-3 font-sans">
      {/* 1. Header & View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#D6DCE1]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-none bg-[#17365D] text-white flex items-center justify-center shrink-0 shadow-xs">
            <FileText className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#17365D] uppercase tracking-wide">
              Interactive METAR & TAF Token Decoder
            </h3>
            <p className="text-[10px] text-[#5B6770]">
              Tap any encoded group for plain-English aeronautical breakdown
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-1.5 w-full sm:w-auto">
          {/* View Mode Toggle */}
          <div className="flex bg-[#F8FAFC] p-0.5 rounded-xs border border-[#D6DCE1] text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setViewMode('interactive')}
              className={`px-2.5 py-1 rounded-xs transition-colors cursor-pointer text-center whitespace-nowrap ${
                viewMode === 'interactive'
                  ? 'bg-[#7C3AED] text-white shadow-2xs'
                  : 'text-[#5B6770] hover:text-[#17365D]'
              }`}
            >
              Interactive Tokens
            </button>
            <button
              type="button"
              onClick={() => setViewMode('plain')}
              className={`px-2.5 py-1 rounded-xs transition-colors cursor-pointer text-center whitespace-nowrap ${
                viewMode === 'plain'
                  ? 'bg-[#7C3AED] text-white shadow-2xs'
                  : 'text-[#5B6770] hover:text-[#17365D]'
              }`}
            >
              Plain English
            </button>
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopyRaw}
            className="p-1.5 rounded-xs bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#17365D] border border-[#D6DCE1] transition-colors cursor-pointer shrink-0"
            title="Copy Raw METAR / TAF"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#006B3C]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Raw METAR / TAF Monospace Terminal Block */}
      <div className="bg-[#0A1220] p-3 rounded-xs border border-[#17365D] text-slate-200 font-mono text-xs space-y-2 shadow-inner select-text">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#94A3B8] block mb-0.5">
            Raw METAR Telemetry
          </span>
          <div className="text-cyan-300 font-bold tracking-wide break-all text-[11px] sm:text-xs">
            {raw_metar || `METAR ${icao} ...`}
          </div>
        </div>
        {raw_taf && (
          <div className="pt-2 border-t border-[#1E293B]">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#94A3B8] block mb-0.5">
              Raw TAF (Terminal Aerodrome Forecast)
            </span>
            <div className="text-amber-300 font-medium tracking-wide break-all text-[11px] sm:text-xs">
              {raw_taf}
            </div>
          </div>
        )}
      </div>

      {/* 3. Interactive Mode: Token Chips & Token Breakdown */}
      {viewMode === 'interactive' ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {tokens.map((tok, idx) => {
              const isSelected = selectedToken?.token === tok.token;
              const colorClass = getCategoryColor(tok.category, tok.is_hazard);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedToken(tok)}
                  className={`px-2 py-1 rounded-xs border font-mono text-xs font-bold transition-all cursor-pointer ${colorClass} ${
                    isSelected ? 'ring-2 ring-[#7C3AED] shadow-xs' : 'hover:opacity-90'
                  }`}
                  title={tok.meaning}
                >
                  {tok.token}
                </button>
              );
            })}
          </div>

          {/* Selected Token Inspector Card */}
          {selectedToken ? (
            <div className="p-3 rounded-xs bg-[#F5F3FF] border border-[#DDD6FE] space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-black text-[#6D28D9] bg-white px-2 py-0.5 rounded-xs border border-[#DDD6FE]">
                  {selectedToken.token}
                </span>
                <span className="text-[10px] font-bold uppercase text-[#7C3AED] tracking-wider">
                  Category: {selectedToken.category}
                </span>
              </div>
              <div className="text-xs font-bold text-[#1F2933] pt-0.5">
                {selectedToken.meaning}
              </div>
            </div>
          ) : (
            <div className="text-center p-2.5 bg-[#F8FAFC] border border-[#D6DCE1] rounded-xs text-[11px] text-[#5B6770]">
              👆 Tap any token chip above to view its detailed meteorological definition.
            </div>
          )}
        </div>
      ) : (
        /* Plain English Mode */
        <div className="p-3 bg-[#F8FAFC] rounded-xs border border-[#D6DCE1] text-xs text-[#1F2933] leading-relaxed">
          <MarkdownRenderer content={plain_english_briefing} />
        </div>
      )}
    </div>
  );
};

export default MetarTafDecoder;
