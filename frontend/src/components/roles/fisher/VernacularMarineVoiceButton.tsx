import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles, Languages, Radio } from 'lucide-react';
import { useVoice } from '../../../hooks/useVoice';

interface VernacularMarineVoiceButtonProps {
  marathiText: string;
  englishText: string;
}

export const VernacularMarineVoiceButton: React.FC<VernacularMarineVoiceButtonProps> = ({
  marathiText,
  englishText,
}) => {
  const { speakText, isSpeaking, stopSpeaking } = useVoice();
  const [selectedLang, setSelectedLang] = useState<'mr-IN' | 'hi-IN' | 'ta-IN' | 'en-IN'>('mr-IN');
  const [showTranscript, setShowTranscript] = useState(false);

  const handlePlayVoice = () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    setShowTranscript(true);
    const textToSpeak = selectedLang === 'mr-IN' ? marathiText : englishText;
    speakText(textToSpeak, selectedLang);
  };

  return (
    <div className="gov-panel overflow-hidden bg-gradient-to-br from-[#0B2545] to-[#134074] text-white shadow-sm border border-[#1D5F91]">
      <div className="p-3.5 sm:p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 bg-[#FF9933]/20 text-[#FF9933] rounded-xs border border-[#FF9933]/30 shrink-0">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-extrabold flex items-center gap-1.5 flex-wrap text-white">
                <span>1-Tap Coastal Vernacular Audio Briefing</span>
              </h3>
              <p className="text-[10px] sm:text-[11px] text-sky-200/80 truncate">
                Official marine forecast in Marathi, Hindi & Tamil
              </p>
            </div>
          </div>

          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-xs bg-[#FF9933] text-slate-950 border border-[#FF9933] shrink-0">
            BHASHINI AI
          </span>
        </div>

        {/* Language Switcher & Bright Orange Play Button */}
        <div className="flex items-center gap-2 pt-0.5">
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value as any)}
            className="flex-1 bg-white/10 text-white text-xs font-bold px-3 py-2 rounded-xs border border-white/25 backdrop-blur-xs outline-none cursor-pointer hover:bg-white/20 transition-all truncate"
          >
            <option value="mr-IN" className="bg-[#0B2545] text-white">मराठी (Marathi)</option>
            <option value="hi-IN" className="bg-[#0B2545] text-white">हिंदी (Hindi)</option>
            <option value="ta-IN" className="bg-[#0B2545] text-white">தமிழ் (Tamil)</option>
            <option value="en-IN" className="bg-[#0B2545] text-white">English (Official)</option>
          </select>

          <button
            onClick={handlePlayVoice}
            className={`px-4 py-2 rounded-xs font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
              isSpeaking
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                : 'bg-[#FF9933] hover:bg-[#F97316] text-slate-950 hover:text-black font-extrabold'
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-4 h-4" />
                <span>थांबवा STOP</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>🎙 ऐका LISTEN</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Audio Transcript Drawer */}
      {showTranscript && (
        <div className="p-4 rounded-2xl bg-black/25 border border-white/15 backdrop-blur-md space-y-1.5 animate-fadeIn">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Coastal Voice Advisory Text:</span>
          </div>
          <p className="text-sm font-semibold leading-relaxed text-white/95">
            {selectedLang === 'mr-IN' ? marathiText : englishText}
          </p>
        </div>
      )}
    </div>
  );
};
