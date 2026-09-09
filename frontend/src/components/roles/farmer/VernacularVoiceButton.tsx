import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles, Languages, Loader2 } from 'lucide-react';
import { useVoice } from '../../../hooks/useVoice';

interface VernacularVoiceButtonProps {
  marathiText: string;
  englishText: string;
}

export const VernacularVoiceButton: React.FC<VernacularVoiceButtonProps> = ({
  marathiText,
  englishText,
}) => {
  const { speakText, isSpeaking, stopSpeech } = useVoice();
  const [selectedLang, setSelectedLang] = useState<'mr-IN' | 'hi-IN' | 'en-IN'>('mr-IN');
  const [showTranscript, setShowTranscript] = useState(false);

  const handlePlayVoice = () => {
    if (isSpeaking) {
      stopSpeech();
      return;
    }

    setShowTranscript(true);
    const textToSpeak = selectedLang === 'mr-IN' ? marathiText : englishText;
    speakText(textToSpeak, selectedLang);
  };

  return (
    <div className="bg-gradient-to-br from-emerald-800 to-teal-900 rounded-3xl p-4 sm:p-5 text-white shadow-md space-y-3.5 border border-emerald-700/50">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/20 shrink-0">
            <Languages className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Regional Voice Briefing
              </h3>
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 whitespace-nowrap">
                BHASHINI AI
              </span>
            </div>
            <p className="text-[11px] text-emerald-100/80">
              Listen to your farm advisory in Marathi / Hindi / English
            </p>
          </div>
        </div>

        {/* Language Switcher & Play Button */}
        <div className="flex items-center gap-2 w-full pt-0.5">
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value as any)}
            className="flex-1 bg-white/10 text-white text-xs font-bold px-3 py-2.5 rounded-xl border border-white/20 backdrop-blur-xs outline-none cursor-pointer hover:bg-white/20 transition-all truncate"
          >
            <option value="mr-IN" className="bg-slate-900 text-white">मराठी (Marathi)</option>
            <option value="hi-IN" className="bg-slate-900 text-white">हिंदी (Hindi)</option>
            <option value="en-IN" className="bg-slate-900 text-white">English</option>
          </select>

          <button
            onClick={handlePlayVoice}
            className={`flex-1 px-4 py-2.5 rounded-xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              isSpeaking
                ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
                : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-4 h-4 shrink-0" />
                <span>थांबवा (Stop)</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 shrink-0" />
                <span>🎙 ऐका (Listen)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Audio Transcript Drawer */}
      {showTranscript && (
        <div className="p-3.5 rounded-2xl bg-black/30 border border-white/15 backdrop-blur-md space-y-1.5 animate-fadeIn">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>Regional Voice Advisory Text:</span>
          </div>
          <p className="text-xs sm:text-sm font-medium leading-relaxed text-white/95">
            {selectedLang === 'mr-IN' ? marathiText : englishText}
          </p>
        </div>
      )}
    </div>
  );
};
