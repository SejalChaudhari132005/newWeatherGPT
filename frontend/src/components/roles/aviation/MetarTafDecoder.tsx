import React, { useState } from 'react';
import { FileText, Languages, Copy, Check, Info, AlertTriangle, Sparkles } from 'lucide-react';
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
    if (isHazard) return 'bg-rose-100 text-rose-800 border-rose-300 font-black';
    switch (category) {
      case 'station':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'time':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'wind':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'visibility':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'clouds':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'temp_dew':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'altimeter':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'remark':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
      {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-600 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900">
              Interactive METAR & TAF Decoder
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Tap any code group to see plain-English breakdown
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          {/* View Mode Toggle */}
          <div className="flex flex-1 sm:flex-initial bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-bold">
            <button
              onClick={() => setViewMode('interactive')}
              className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-center text-[11px] whitespace-nowrap ${
                viewMode === 'interactive' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Interactive Tokens
            </button>
            <button
              onClick={() => setViewMode('plain')}
              className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-center text-[11px] whitespace-nowrap ${
                viewMode === 'plain' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Plain English
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopyRaw}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 transition-colors cursor-pointer shrink-0"
            title="Copy Raw METAR / TAF"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Raw METAR / TAF Monospace Code Box */}
      <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-slate-200 font-mono text-xs space-y-2 shadow-inner">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
            Raw METAR
          </span>
          <div className="text-cyan-300 font-bold tracking-wide break-all text-[11px] sm:text-xs">
            {raw_metar || `METAR ${icao} ...`}
          </div>
        </div>
        {raw_taf && (
          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
              Raw TAF (Terminal Area Forecast)
            </span>
            <div className="text-amber-300 font-medium tracking-wide break-all text-[11px] sm:text-xs">
              {raw_taf}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Tokenized View */}
      {viewMode === 'interactive' ? (
        <div className="space-y-2.5">
          <div className="text-[11px] font-bold text-slate-500">
            Tap a token to decode its standard aeronautical meaning:
          </div>

          <div className="flex flex-wrap gap-1.5">
            {tokens.map((tokenObj, idx) => {
              const isSelected = selectedToken?.token === tokenObj.token;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedToken(tokenObj)}
                  className={`px-2.5 py-1 rounded-xl border text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${getCategoryColor(
                    tokenObj.category,
                    tokenObj.is_hazard
                  )} ${isSelected ? 'ring-2 ring-indigo-500 shadow-2xs scale-105' : 'hover:opacity-90'}`}
                >
                  <span>{tokenObj.token}</span>
                  {tokenObj.is_hazard && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                </button>
              );
            })}
          </div>

          {/* Selected Token Detail Box */}
          {selectedToken ? (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs space-y-1 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md text-[11px]">
                  {selectedToken.token}
                </span>
                <span className="text-[9px] uppercase font-bold text-slate-400">
                  Category: {selectedToken.category}
                </span>
              </div>
              <div className="text-slate-800 font-medium pt-1 text-xs">
                {selectedToken.meaning}
              </div>
              {selectedToken.is_hazard && (
                <div className="text-rose-700 font-bold text-[10px] flex items-center gap-1 pt-0.5">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>Hazard notice: Value approaches or exceeds aerodrome limits.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-50/60 border border-slate-200/60 text-slate-400 text-[11px] text-center">
              Tap any colored tag above to view full decoding.
            </div>
          )}
        </div>
      ) : (
        /* Plain English Translation View */
        <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs text-slate-800 leading-relaxed font-sans">
          <div className="flex items-center gap-1.5 text-indigo-700 font-black text-[11px] uppercase mb-1.5">
            <Languages className="w-3.5 h-3.5" />
            Plain-English Synthesis
          </div>
          <MarkdownRenderer content={plain_english_briefing} />
        </div>
      )}
    </div>
  );
};
