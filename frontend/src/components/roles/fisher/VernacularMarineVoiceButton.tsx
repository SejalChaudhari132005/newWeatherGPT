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
    <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-3xl p-4 sm:p-5 text-white shadow-lg space-y-3.5 border border-blue-800">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/20 shrink-0">
              <Radio className="w-5 h-5 text-cyan-300" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold flex items-center gap-1.5 flex-wrap">
                <span>1-Tap Coastal Voice Advisory</span>
              </h3>
              <p className="text-[11px] text-blue-200/80 truncate">
                Listen in your local coastal language
              </p>
            </div>
          </div>

          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/30 text-cyan-200 border border-cyan-400/30 shrink-0">
            BHASHINI
          </span>
        </div>

        {/* Language Switcher & Play Button */}
        <div className="flex items-center gap-2 pt-0.5">
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value as any)}
            className="flex-1 bg-white/10 text-white text-xs font-bold px-3 py-2.5 rounded-2xl border border-white/20 backdrop-blur-xs outline-none cursor-pointer hover:bg-white/20 transition-all truncate"
          >
            <option value="mr-IN" className="bg-slate-900 text-white">मराठी (Marathi)</option>
            <option value="hi-IN" className="bg-slate-900 text-white">हिंदी (Hindi)</option>
            <option value="ta-IN" className="bg-slate-900 text-white">தமிழ் (Tamil)</option>
            <option value="en-IN" className="bg-slate-900 text-white">English</option>
          </select>

          <button
            onClick={handlePlayVoice}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
              isSpeaking
                ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
                : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-4 h-4" />
                <span>थांबवा</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>🎙 ऐका Listen</span>
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
