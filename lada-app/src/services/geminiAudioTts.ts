// Gemini Voice & Audio Engine powered by Google Gemini API
// Generates natural, studio-quality speech (24kHz PCM) for German words & Moroccan Darija explanations
// Uses multi-key failover and in-memory caching to ensure blazing-fast performance and high reliability.

import { unlockVault } from './cryptoVault';

export type GeminiVoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede';

class GeminiAudioTtsService {
  private keys: string[] = [];
  private currentKeyIndex = 0;
  private audioCache = new Map<string, string>(); // text -> base64 pcm
  private playbackContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private isCurrentlyPlaying = false;
  private onPlaybackStateChange: ((playing: boolean) => void) | null = null;

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

  public stopAudio() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {
        // already stopped
      }
      this.currentSource = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    this.isCurrentlyPlaying = false;
    if (this.onPlaybackStateChange) this.onPlaybackStateChange(false);
  }

  /**
   * Generates natural PCM audio from Gemini API for the given text.
   * Caches results so repeated requests are instant.
   */
  public async generateAudio(
    text: string,
    voiceName: GeminiVoiceName = 'Puck'
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

    const promptText = `Please read aloud the following text exactly: ${text.trim()}`;
    const payload = {
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName
            }
          }
        }
      }
    };

    // Try keys with failover
    const maxAttempts = Math.min(this.keys.length, 4);
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const apiKey = this.getActiveKey();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const json = await response.json();
          const base64Data = json.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (base64Data) {
            this.audioCache.set(cacheKey, base64Data);
            return base64Data;
          }
        }

        // Rotate key on 429 quota limit or 400 errors
        this.rotateKey();
      } catch (err) {
        console.warn(`Attempt ${attempt + 1} failed for Gemini TTS:`, err);
        this.rotateKey();
      }
    }

    return null;
  }

  /**
   * Plays PCM 24kHz audio from Gemini base64 data.
   */
  public playPcmAudio(base64Data: string, rate: number = 1.0): Promise<void> {
    return new Promise((resolve) => {
      try {
        this.stopAudio();
        const ctx = this.ensureAudioContext();

        const binary = atob(base64Data);
        const sampleCount = Math.floor(binary.length / 2);
        if (sampleCount === 0) {
          resolve();
          return;
        }

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
        if (rate && rate > 0) {
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
        console.warn('Playback error in playPcmAudio:', err);
        this.isCurrentlyPlaying = false;
        if (this.onPlaybackStateChange) this.onPlaybackStateChange(false);
        resolve();
      }
    });
  }

  /**
   * Preloads audio in background so when student reaches word, playback is instant
   */
  public async preloadAudio(text: string, voiceName: GeminiVoiceName = 'Puck'): Promise<void> {
    try {
      await this.generateAudio(text, voiceName);
    } catch {
      // ignore preload failures
    }
  }

  /**
   * High-level speaking method:
   * First attempts Gemini natural API voice.
   * If offline or API fails, falls back gracefully to browser synthesis.
   */
  public async speakText(
    text: string,
    voiceName: GeminiVoiceName = 'Puck',
    fallbackLang: 'de-DE' | 'ar-SA' = 'de-DE',
    rate: number = 1.0
  ): Promise<void> {
    this.stopAudio();

    // 1. Try Gemini Ultra-realistic API voice
    try {
      const base64Data = await this.generateAudio(text, voiceName);
      if (base64Data) {
        await this.playPcmAudio(base64Data, rate);
        return;
      }
    } catch (e) {
      console.warn('Gemini API voice generation failed, using fallback:', e);
    }

    // 2. Fallback to browser SpeechSynthesis
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
