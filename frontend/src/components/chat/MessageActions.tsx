import React, { useState } from 'react';
import { Volume2, Square, Copy, Check, ThumbsUp, ThumbsDown, RotateCcw, Loader2 } from 'lucide-react';
import { bhashiniVoiceService } from '../../services/bhashiniVoiceService';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  text: string;
  onRegenerate?: () => void;
}

export const MessageActions: React.FC<Props> = ({ text, onRegenerate }) => {
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [feedback, setFeedback] = useState<'liked' | 'disliked' | null>(null);

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Text-to-Speech (TTS) via BHASHINI Voice Service
  const handleToggleSpeak = async () => {
    if (isSpeaking) {
      bhashiniVoiceService.stopSpeaking();
      setIsSpeaking(false);
      setIsLoadingAudio(false);
      return;
    }

    setIsLoadingAudio(true);
    await bhashiniVoiceService.speakText(
      text,
      language,
      () => {
        setIsLoadingAudio(false);
        setIsSpeaking(true);
      },
      () => {
        setIsLoadingAudio(false);
        setIsSpeaking(false);
      },
      (err) => {
        console.warn('[MessageActions] TTS playback error:', err);
        setIsLoadingAudio(false);
        setIsSpeaking(false);
      }
    );
  };

  return (
    <div className="flex items-center gap-1 pt-1.5 font-['Arimo'] text-slate-400">
      {/* 🔊 Read Aloud / Stop Button */}
      <button
        type="button"
        onClick={handleToggleSpeak}
        title={isSpeaking ? 'Stop speaking' : 'Listen with BHASHINI Voice'}
        aria-label="Listen with BHASHINI Voice"
        className={`p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer ${
          isSpeaking ? 'text-[#004aad] bg-sky-50 animate-pulse font-bold' : ''
        }`}
      >
        {isLoadingAudio ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#004aad]" />
        ) : isSpeaking ? (
          <Square className="w-3.5 h-3.5 fill-current text-rose-600" />
        ) : (
          <Volume2 className="w-3.5 h-3.5" />
        )}
      </button>

      {/* 📋 Copy Button */}
      <button
        type="button"
        onClick={handleCopy}
        title={copied ? 'Copied!' : 'Copy to clipboard'}
        aria-label="Copy message"
        className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
      </button>

      {/* 👍 Thumbs Up */}
      <button
        type="button"
        onClick={() => setFeedback(feedback === 'liked' ? null : 'liked')}
        title="Good response"
        aria-label="Good response"
        className={`p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer ${
          feedback === 'liked' ? 'text-emerald-600 bg-emerald-50' : ''
        }`}
      >
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>

      {/* 👎 Thumbs Down */}
      <button
        type="button"
        onClick={() => setFeedback(feedback === 'disliked' ? null : 'disliked')}
        title="Bad response"
        aria-label="Bad response"
        className={`p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer ${
          feedback === 'disliked' ? 'text-rose-600 bg-rose-50' : ''
        }`}
      >
        <ThumbsDown className="w-3.5 h-3.5" />
      </button>

      {/* ↻ Regenerate (calls backend again) */}
      {onRegenerate && (
        <button
          type="button"
          onClick={onRegenerate}
          title="Regenerate answer"
          aria-label="Regenerate answer"
          className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-[#004aad] transition-colors cursor-pointer ml-1 flex items-center gap-1 text-[11px] font-bold"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Regenerate</span>
        </button>
      )}
    </div>
  );
};
