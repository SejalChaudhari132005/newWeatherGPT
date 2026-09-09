// WeatherGPT BHASHINI Frontend Voice & Audio Service
// Communicates with backend endpoints (/api/voice/transcribe, /api/voice/synthesize)
// ZERO credentials or private keys in the browser bundle.

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export interface TranscriptionResult {
  text: string;
  language: string;
  confidence: number | null;
}

export interface VoiceRecordCallbacks {
  onStart?: () => void;
  onListening?: () => void;
  onProcessing?: () => void;
  onTranscript?: (result: TranscriptionResult) => void;
  onError?: (errorMessage: string) => void;
  onEnd?: () => void;
}

class BhashiniVoiceService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private currentAudio: HTMLAudioElement | null = null;
  private isRecording: boolean = false;
  private isPlaying: boolean = false;
  private activePlayingText: string | null = null;

  public isVoiceSupported(): boolean {
    return typeof window !== 'undefined' && !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia;
  }

  /**
   * Start recording user microphone audio.
   */
  public async startRecording(
    callbacks: VoiceRecordCallbacks,
    languageHint?: string
  ): Promise<boolean> {
    if (!this.isVoiceSupported()) {
      if (callbacks.onError) {
        callbacks.onError('Microphone access is not supported in this browser.');
      }
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      this.audioChunks = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      this.mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstart = () => {
        this.isRecording = true;
        if (callbacks.onStart) callbacks.onStart();
        if (callbacks.onListening) callbacks.onListening();
      };

      this.mediaRecorder.onstop = async () => {
        this.isRecording = false;
        // Stop all audio tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());

        if (callbacks.onProcessing) callbacks.onProcessing();

        if (this.audioChunks.length === 0) {
          if (callbacks.onError) callbacks.onError("I couldn't understand the audio. Please try again.");
          if (callbacks.onEnd) callbacks.onEnd();
          return;
        }

        const audioBlob = new Blob(this.audioChunks, {
          type: this.mediaRecorder?.mimeType || 'audio/webm',
        });

        try {
          const result = await this.sendAudioForTranscription(audioBlob, languageHint);
          if (callbacks.onTranscript) {
            callbacks.onTranscript(result);
          }
        } catch (err: any) {
          console.warn('[BhashiniVoiceService] Transcription error:', err);
          if (callbacks.onError) {
            callbacks.onError(err.message || "I couldn't understand the audio. Please try again.");
          }
        } finally {
          if (callbacks.onEnd) callbacks.onEnd();
        }
      };

      this.mediaRecorder.onerror = () => {
        this.isRecording = false;
        stream.getTracks().forEach((track) => track.stop());
        if (callbacks.onError) {
          callbacks.onError('An error occurred during audio recording.');
        }
        if (callbacks.onEnd) callbacks.onEnd();
      };

      this.mediaRecorder.start(250); // Collect data chunks every 250ms
      return true;
    } catch (err: any) {
      this.isRecording = false;
      let errorMsg = "Microphone access is required for voice input.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = "Microphone access is required for voice input.";
      }
      if (callbacks.onError) callbacks.onError(errorMsg);
      return false;
    }
  }

  /**
   * Stop recording and initiate transcription.
   */
  public stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        // ignore
      }
      this.isRecording = false;
    }
  }

  /**
   * Cancel recording without processing.
   */
  public cancelRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        // ignore
      }
      this.audioChunks = [];
      this.isRecording = false;
    }
  }

  /**
   * Send audio blob to WeatherGPT backend /api/voice/transcribe.
   */
  private async sendAudioForTranscription(
    audioBlob: Blob,
    languageHint?: string
  ): Promise<TranscriptionResult> {
    const formData = new FormData();
    const extension = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
    formData.append('audio', audioBlob, `recording.${extension}`);
    if (languageHint) {
      formData.append('language', languageHint);
    }

    const response = await fetch(`${API_BASE_URL}/api/voice/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || `Transcription failed with status ${response.status}`);
    }

    const data = await response.json();
    return {
      text: data.text || '',
      language: data.language || languageHint || 'en',
      confidence: data.confidence || null,
    };
  }

  /**
   * Synthesize text-to-speech using backend BHASHINI TTS endpoint.
   */
  public async speakText(
    text: string,
    language: string = 'en',
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: string) => void
  ): Promise<void> {
    if (!text || !text.trim()) return;

    // If already playing the same text, stop it
    if (this.isPlaying && this.activePlayingText === text) {
      this.stopSpeaking();
      if (onEnd) onEnd();
      return;
    }

    // Stop any existing playback
    this.stopSpeaking();

    try {
      const response = await fetch(`${API_BASE_URL}/api/voice/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language,
          gender: 'female',
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data.audioContent) {
        const audioSrc = `data:audio/wav;base64,${data.audioContent}`;
        this.currentAudio = new Audio(audioSrc);

        this.currentAudio.onplay = () => {
          this.isPlaying = true;
          this.activePlayingText = text;
          if (onStart) onStart();
        };

        this.currentAudio.onended = () => {
          this.isPlaying = false;
          this.activePlayingText = null;
          if (onEnd) onEnd();
        };

        this.currentAudio.onerror = () => {
          this.isPlaying = false;
          this.activePlayingText = null;
          if (onError) onError('Could not play synthesized audio.');
          if (onEnd) onEnd();
        };

        await this.currentAudio.play();
      } else {
        // Fallback to browser SpeechSynthesis if available
        this.fallbackBrowserTTS(text, language, onStart, onEnd, onError);
      }
    } catch (err: any) {
      console.warn('[BhashiniVoiceService] TTS backend error, falling back to browser speech:', err);
      this.fallbackBrowserTTS(text, language, onStart, onEnd, onError);
    }
  }

  private fallbackBrowserTTS(
    text: string,
    language: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: string) => void
  ): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.onstart = () => {
        this.isPlaying = true;
        this.activePlayingText = text;
        if (onStart) onStart();
      };
      utterance.onend = () => {
        this.isPlaying = false;
        this.activePlayingText = null;
        if (onEnd) onEnd();
      };
      utterance.onerror = () => {
        this.isPlaying = false;
        this.activePlayingText = null;
        if (onEnd) onEnd();
      };
      window.speechSynthesis.speak(utterance);
    } else {
      if (onError) onError('Speech synthesis not available.');
      if (onEnd) onEnd();
    }
  }

  /**
   * Stop any active audio playback.
   */
  public stopSpeaking(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isPlaying = false;
    this.activePlayingText = null;
  }

  public isCurrentlyPlaying(text?: string): boolean {
    if (!text) return this.isPlaying;
    return this.isPlaying && this.activePlayingText === text;
  }
}

export const bhashiniVoiceService = new BhashiniVoiceService();
