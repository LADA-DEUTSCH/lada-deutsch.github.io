// محرك الصوت الاستوديو الحقيقي ديال Google Gemini
// Gemini 3.1 Flash TTS — Studio-Quality 24kHz PCM Audio Engine
// Multi-key failover, in-memory caching, mutex-protected sequential playback.

import { unlockVault } from './cryptoVault';

export type GeminiVoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede';

// Supported model priority: newest first
const TTS_MODELS = [
  'gemini-3.1-flash-tts-preview',
  'gemini-2.5-flash-preview-tts'
];

class GeminiAudioTtsService {
  private keys: string[] = [];
  private currentKeyIndex = 0;
  private audioCache = new Map<string, string>(); // cacheKey -> base64 pcm
  private playbackContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private isCurrentlyPlaying = false;
  private onPlaybackStateChange: ((playing: boolean) => void) | null = null;

  // Mutex: prevents concurrent calls from overlapping audio
  private speakLock = false;
  private abortController: AbortController | null = null;

  // Track which model actually works
  private workingModelIndex = 0;

  constructor() {
    this.initKeys();
  }

  private async initKeys() {
    try {
      const decrypted = await unlockVault('2026');
      if (decrypted && decrypted.length > 0) {
        this.keys = decrypted;
      }
    } catch (e) {
      console.warn('GeminiAudioTts keys init failed:', e);
    }
  }

  private getActiveKey(): string {
    if (this.keys.length === 0) return '';
    return this.keys[this.currentKeyIndex % this.keys.length];
  }

  private rotateKey() {
    if (this.keys.length > 0) {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
    }
  }

  private ensureAudioContext(): AudioContext {
    if (!this.playbackContext || this.playbackContext.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.playbackContext = new AudioCtx({ sampleRate: 24000 });
    }
    if (this.playbackContext.state === 'suspended') {
      this.playbackContext.resume();
    }
    return this.playbackContext;
  }

  public setOnPlaybackStateChange(cb: (playing: boolean) => void) {
    this.onPlaybackStateChange = cb;
  }

  public isPlaying(): boolean {
    return this.isCurrentlyPlaying;
  }

  /** Hard-stop all audio immediately */
  public stopAudio() {
    // Cancel any in-flight fetch requests
    if (this.abortController) {
      try { this.abortController.abort(); } catch { /* noop */ }
      this.abortController = null;
    }

    // Stop PCM AudioBufferSourceNode
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch { /* already stopped */ }
      this.currentSource = null;
    }

    // Stop browser SpeechSynthesis fallback
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch { /* noop */ }
    }

    this.isCurrentlyPlaying = false;
    this.speakLock = false;
    if (this.onPlaybackStateChange) this.onPlaybackStateChange(false);
  }

  /**
   * Generates natural PCM audio from Gemini API.
   * Tries gemini-3.1-flash-tts-preview first, falls back to 2.5.
   * Caches results so repeated requests are instant.
   */
  public async generateAudio(
    text: string,
    voiceName: GeminiVoiceName = 'Puck',
    signal?: AbortSignal
  ): Promise<string | null> {
    const cacheKey = `${voiceName}:${text.trim()}`;
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
    }

    if (this.keys.length === 0) {
      await this.initKeys();
    }
    if (this.keys.length === 0) {
      return null;
    }

    // Clean bracketed hints from text before speaking (e.g. "[ae]", "[ß]")
    const cleanText = text.trim().replace(/\[.*?\]/g, '').replace(/\s+/g, ' ').trim();

    // Smart prompt engineering for different text lengths
    let promptText: string;
    const wordCount = cleanText.split(/[\s,]+/).filter(w => w.length > 0).length;
    const isSingleChar = cleanText.length <= 2;

    if (isSingleChar) {
      // Single letter: spell it out clearly as the German alphabet name
      promptText = `Pronounce the German letter "${cleanText}" clearly and naturally, as a German teacher would say it.`;
    } else if (wordCount <= 3) {
      // Short word/phrase: clear, deliberate pronunciation
      promptText = `Clearly say the following German word: "${cleanText}"`;
    } else {
      // Full sentence: natural reading
      promptText = `Read aloud the following German text naturally: ${cleanText}`;
    }
    const payload = {
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName }
          }
        }
      }
    };

    // Try models in order, starting from the known-working one
    for (let modelIdx = this.workingModelIndex; modelIdx < TTS_MODELS.length; modelIdx++) {
      const model = TTS_MODELS[modelIdx];
      const maxAttempts = Math.min(this.keys.length, 3);

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (signal?.aborted) return null;

        const apiKey = this.getActiveKey();
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal
          });

          if (response.ok) {
            const json = await response.json();
            const base64Data = json.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Data) {
              this.audioCache.set(cacheKey, base64Data);
              this.workingModelIndex = modelIdx; // Remember working model
              return base64Data;
            }
          }

          // 404 = model not available → skip to next model
          if (response.status === 404) break;

          // 429 or other error → rotate key
          this.rotateKey();
        } catch (err: any) {
          if (err?.name === 'AbortError') return null;
          console.warn(`Attempt ${attempt + 1} on ${model} failed:`, err);
          this.rotateKey();
        }
      }
    }

    return null;
  }

  /**
   * Plays PCM 24kHz audio from Gemini base64 data.
   * Returns a promise that resolves when playback finishes.
   */
  public playPcmAudio(base64Data: string, rate: number = 1.0): Promise<void> {
    return new Promise((resolve) => {
      try {
        // Stop any prior audio BEFORE starting new playback
        if (this.currentSource) {
          try { this.currentSource.stop(); this.currentSource.disconnect(); } catch { /* ok */ }
          this.currentSource = null;
        }

        const ctx = this.ensureAudioContext();
        const binary = atob(base64Data);
        const sampleCount = Math.floor(binary.length / 2);
        if (sampleCount === 0) { resolve(); return; }

        const float32 = new Float32Array(sampleCount);
        for (let i = 0; i < sampleCount; i++) {
          const low = binary.charCodeAt(i * 2);
          const high = binary.charCodeAt(i * 2 + 1);
          let int16 = (high << 8) | low;
          if (int16 >= 0x8000) int16 -= 0x10000;
          float32[i] = int16 / 32768.0;
        }

        const buffer = ctx.createBuffer(1, sampleCount, 24000);
        buffer.copyToChannel(float32, 0);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        if (rate > 0 && rate !== 1.0) {
          source.playbackRate.value = rate;
        }
        source.connect(ctx.destination);

        this.currentSource = source;
        this.isCurrentlyPlaying = true;
        if (this.onPlaybackStateChange) this.onPlaybackStateChange(true);

        source.onended = () => {
          this.isCurrentlyPlaying = false;
          this.currentSource = null;
          if (this.onPlaybackStateChange) this.onPlaybackStateChange(false);
          resolve();
        };

        source.start();
      } catch (err) {
        console.warn('Playback error:', err);
        this.isCurrentlyPlaying = false;
        if (this.onPlaybackStateChange) this.onPlaybackStateChange(false);
        resolve();
      }
    });
  }

  /**
   * Preloads audio in background so playback is instant.
   * Non-blocking, never overlaps with current playback.
   */
  public async preloadAudio(text: string, voiceName: GeminiVoiceName = 'Puck'): Promise<void> {
    // Only preload if nothing is currently speaking (avoid API contention)
    if (this.speakLock || this.isCurrentlyPlaying) return;
    try {
      await this.generateAudio(text, voiceName);
    } catch { /* silent preload failure */ }
  }

  /**
   * High-level speaking method — MUTEX-PROTECTED.
   * Stops any prior audio, generates via Gemini API, plays PCM.
   * Falls back gracefully to browser SpeechSynthesis if API fails.
   */
  public async speakText(
    text: string,
    voiceName: GeminiVoiceName = 'Puck',
    fallbackLang: 'de-DE' | 'ar-SA' = 'de-DE',
    rate: number = 1.0
  ): Promise<void> {
    // STEP 0: Stop any prior audio immediately
    this.stopAudio();

    // STEP 1: Acquire the speak lock (prevents concurrent calls)
    this.speakLock = true;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    try {
      // STEP 2: Try Gemini Studio API voice
      const base64Data = await this.generateAudio(text, voiceName, signal);
      if (signal.aborted) return;

      if (base64Data) {
        await this.playPcmAudio(base64Data, rate);
        return;
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      console.warn('Gemini TTS failed, trying fallback:', e);
    } finally {
      if (this.abortController?.signal === signal) {
        this.speakLock = false;
        this.abortController = null;
      }
    }

    // STEP 3: Fallback to browser SpeechSynthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return new Promise((resolve) => {
        try {
          const cleaned = text.replace(/\[.*?\]/g, '').replace(/[\(\)]/g, '').trim();
          const utt = new SpeechSynthesisUtterance(cleaned);
          utt.lang = fallbackLang;
          utt.rate = rate;
          utt.pitch = 1.0;

          this.isCurrentlyPlaying = true;
          if (this.onPlaybackStateChange) this.onPlaybackStateChange(true);

          utt.onend = () => {
            this.isCurrentlyPlaying = false;
            if (this.onPlaybackStateChange) this.onPlaybackStateChange(false);
            resolve();
          };
          utt.onerror = () => {
            this.isCurrentlyPlaying = false;
            if (this.onPlaybackStateChange) this.onPlaybackStateChange(false);
            resolve();
          };

          window.speechSynthesis.speak(utt);
        } catch {
          this.isCurrentlyPlaying = false;
          if (this.onPlaybackStateChange) this.onPlaybackStateChange(false);
          resolve();
        }
      });
    }
  }
}

export const geminiAudioTts = new GeminiAudioTtsService();
