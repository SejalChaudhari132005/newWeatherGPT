import { useState, useEffect, useCallback } from 'react';
import { bhashiniVoiceService } from '../services/bhashiniVoiceService';

export function useVoice(onTranscriptResult?: (text: string) => void) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      // Demo fallback if browser lacks Web Speech API
      setIsListening(true);
      setTranscript('Listening (Simulated)...');
      setTimeout(() => {
        const simulatedQuery = 'Will it rain tonight?';
        setTranscript(simulatedQuery);
        setIsListening(false);
        if (onTranscriptResult) onTranscriptResult(simulatedQuery);
      }, 2500);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (transcript && onTranscriptResult) {
          onTranscriptResult(transcript);
        }
      };

      recognition.start();
    } catch (e) {
      console.error('Failed to start speech recognition', e);
      setIsListening(false);
    }
  }, [transcript, onTranscriptResult]);

  const speakText = useCallback((text: string, lang: string = 'en-US') => {
    if (!text || !text.trim()) return;

    // Map language tags like "mr-IN" to "mr"
    let isoLang = 'en';
    if (lang.startsWith('mr')) isoLang = 'mr';
    else if (lang.startsWith('hi')) isoLang = 'hi';
    else if (lang.startsWith('ta')) isoLang = 'ta';
    else if (lang.startsWith('te')) isoLang = 'te';
    else if (lang.startsWith('kn')) isoLang = 'kn';
    else if (lang.startsWith('gu')) isoLang = 'gu';
    else if (lang.startsWith('bn')) isoLang = 'bn';
    else if (lang.startsWith('ml')) isoLang = 'ml';
    else if (lang.startsWith('pa')) isoLang = 'pa';
    else if (lang.startsWith('or')) isoLang = 'or';

    bhashiniVoiceService.speakText(
      text,
      isoLang,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      (err) => {
        console.warn('[useVoice] TTS Error:', err);
        setIsSpeaking(false);
      }
    );
  }, []);

  const stopSpeaking = useCallback(() => {
    bhashiniVoiceService.stopSpeaking();
    setIsSpeaking(false);
  }, []);

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    speakText,
    stopSpeaking,
    isSpeaking
  };
}

