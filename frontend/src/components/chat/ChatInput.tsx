import React, { useState, useEffect } from 'react';
import { Mic, ArrowUp, Loader2, Square } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { bhashiniVoiceService } from '../../services/bhashiniVoiceService';

interface Props {
  onSendMessage: (text: string) => void;
  onOpenVoiceModal: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<Props> = ({
  onSendMessage,
  onOpenVoiceModal,
  isLoading = false,
  disabled = false,
}) => {
  const { language, t } = useLanguage();
  const [inputText, setInputText] = useState('');
  const [loadingStage, setLoadingStage] = useState('Thinking...');
  const [isInlineRecording, setIsInlineRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Realistic stage progression while waiting for response
  useEffect(() => {
    if (!isLoading) {
      setLoadingStage(t('responding') || 'WeatherGPT is responding...');
      return;
    }

    const t1 = setTimeout(() => {
      setLoadingStage('Fetching verified meteorological telemetry...');
    }, 800);

    const t2 = setTimeout(() => {
      setLoadingStage(t('responding') || 'WeatherGPT is responding...');
    }, 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isLoading, t]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading || disabled || isInlineRecording) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleToggleVoice = async () => {
    if (isLoading || disabled) return;

    if (isInlineRecording) {
      setIsInlineRecording(false);
      setIsProcessingAudio(true);
      bhashiniVoiceService.stopRecording();
      return;
    }

    setVoiceError(null);
    const started = await bhashiniVoiceService.startRecording(
      {
        onStart: () => {
          setIsInlineRecording(true);
          setIsProcessingAudio(false);
        },
        onListening: () => {
          setIsInlineRecording(true);
        },
        onProcessing: () => {
          setIsInlineRecording(false);
          setIsProcessingAudio(true);
        },
        onTranscript: (res) => {
          setIsProcessingAudio(false);
          if (res.text && res.text.trim()) {
            setInputText(res.text);
            onSendMessage(res.text);
            setInputText('');
          }
        },
        onError: (err) => {
          setIsInlineRecording(false);
          setIsProcessingAudio(false);
          setVoiceError(err);
          setTimeout(() => setVoiceError(null), 4000);
        },
        onEnd: () => {
          setIsInlineRecording(false);
          setIsProcessingAudio(false);
        },
      },
      language
    );

    if (!started) {
      // Fallback to opening full modal
      onOpenVoiceModal();
    }
  };

  return (
    <div className="sticky bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-white via-white/95 to-transparent pt-2 pb-3 px-3 sm:px-4 font-['Arimo']">
      <div className="max-w-3xl mx-auto space-y-1.5">
        {/* Loading stage or Voice stage badge */}
        {isLoading && (
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-extrabold text-[#004aad] animate-pulse py-0.5">
            <span className="w-2 h-2 rounded-full bg-[#004aad] animate-ping" />
            <span>● {loadingStage}</span>
          </div>
        )}

        {isInlineRecording && (
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-extrabold text-rose-600 animate-pulse py-0.5">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            <span>🔴 {t('listening') || 'Listening...'}</span>
          </div>
        )}

        {isProcessingAudio && (
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-extrabold text-[#004aad] animate-pulse py-0.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>◌ {t('processing') || 'Processing audio with BHASHINI...'}</span>
          </div>
        )}

        {voiceError && (
          <div className="text-center text-[11px] font-bold text-rose-600 py-0.5 animate-fadeIn">
            {voiceError}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className={`flex items-center gap-2 p-1.5 pl-3.5 bg-white border rounded-full shadow-lg transition-all ${
            isInlineRecording
              ? 'border-rose-400 ring-2 ring-rose-200'
              : 'border-slate-300 focus-within:border-[#38b6ff] focus-within:ring-2 focus-within:ring-[#38b6ff]/20'
          }`}
        >
          {/* Voice Input Microphone Button */}
          <button
            type="button"
            onClick={handleToggleVoice}
            disabled={isLoading || disabled}
            aria-label="Voice input"
            title={isInlineRecording ? 'Stop listening' : 'Start voice query'}
            className={`p-2 rounded-full transition-colors cursor-pointer shrink-0 disabled:opacity-40 ${
              isInlineRecording
                ? 'bg-rose-500 text-white animate-pulse'
                : 'text-slate-500 hover:text-[#004aad] hover:bg-sky-50'
            }`}
          >
            {isInlineRecording ? (
              <Square className="w-4 h-4 fill-current" />
            ) : isProcessingAudio ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#004aad]" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* Text Input Area */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isInlineRecording
                ? t('listening') || 'Listening...'
                : isProcessingAudio
                ? t('processing') || 'Processing...'
                : t('askPlaceholder') || 'Ask WeatherGPT anything...'
            }
            disabled={isLoading || disabled || isInlineRecording || isProcessingAudio}
            className="flex-1 bg-transparent py-2.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
          />

          {/* ArrowUp Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading || disabled || isInlineRecording}
            aria-label="Send message"
            title="Send message"
            className="p-2.5 rounded-full bg-[#004aad] hover:bg-[#003882] disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold shadow-sm transition-all cursor-pointer shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowUp className="w-4 h-4 stroke-[3]" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
