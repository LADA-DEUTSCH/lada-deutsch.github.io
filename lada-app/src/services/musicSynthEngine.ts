import type { InstrumentType } from '../types';

export class MusicSynthEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isPlaying: boolean = false;
  private currentBpm: number = 80;
  private instrument: InstrumentType = 'piano';
  private timerId: number | null = null;
  private currentBeat: number = 0;
  private germanVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    this.initVoice();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.initVoice();
      };
    }

    // Auto-unlock AudioContext on first user interaction anywhere
    if (typeof window !== 'undefined') {
      const unlock = () => {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        window.removeEventListener('click', unlock);
        window.removeEventListener('touchstart', unlock);
        window.removeEventListener('keydown', unlock);
      };
      window.addEventListener('click', unlock);
      window.addEventListener('touchstart', unlock);
      window.addEventListener('keydown', unlock);
    }
  }

  private initVoice() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    const deVoice = voices.find(
      (v) =>
        v.lang.startsWith('de') &&
        (v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Hedda') ||
          v.name.includes('Katja') ||
          v.name.includes('Stefan'))
    ) || voices.find((v) => v.lang.startsWith('de'));
    if (deVoice) {
      this.germanVoice = deVoice;
    }
  }

  public ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public startSongRhythm(bpm: number, instrument: InstrumentType) {
    this.currentBpm = bpm;
    this.instrument = instrument;
    this.isPlaying = true;
    this.currentBeat = 0;
    this.ensureContext();

    const beatIntervalMs = (60 / bpm) * 500; // 8th note intervals
    this.stopSongRhythm();

    this.timerId = window.setInterval(() => {
      if (!this.isPlaying || this.isMuted) return;
      this.playBeatStep(this.currentBeat % 8);
      this.currentBeat++;
    }, beatIntervalMs);
  }

  public stopSongRhythm() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public getBpm(): number {
    return this.currentBpm;
  }

  private playBeatStep(step: number) {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime;

    // Step 0: Warm Kick + Chord 1
    // Step 2: Crisp Hi-Hat
    // Step 4: Snappy Snare + Chord 2
    // Step 6: Crisp Hi-Hat
    if (step === 0) {
      this.playKick(t);
      this.playChord(t, 0);
    } else if (step === 2) {
      this.playHiHat(t);
    } else if (step === 4) {
      this.playSnare(t);
      this.playChord(t, 1);
    } else if (step === 6) {
      this.playHiHat(t);
    }
  }

  private playKick(t: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(130, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.12);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  private playSnare(t: number) {
    if (!this.ctx) return;

    // Snare Body Tone
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.1);

    // Snare Wire Noise with Bandpass Filter
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(t);
  }

  private playHiHat(t: number) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.035;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(7500, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);
  }

  private playChord(t: number, chordIndex: number) {
    if (!this.ctx) return;
    let freqs = chordIndex === 0 ? [220, 261.63, 329.63] : [174.61, 220, 261.63];
    if (this.instrument === 'synthwave') {
      freqs = chordIndex === 0 ? [110, 164.81, 220] : [130.81, 196, 261.63];
    } else if (this.instrument === 'moroccan_beat') {
      freqs = chordIndex === 0 ? [146.83, 220, 293.66] : [130.81, 196, 261.63];
    }

    freqs.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, t);

      osc.type = this.instrument === 'synthwave' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(f, t);

      const vol = this.instrument === 'synthwave' ? 0.03 : 0.07;
      gain.gain.setValueAtTime(vol / (idx + 1), t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  }

  // --- Sound Effects ---
  public playHitFx(isPerfect: boolean) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const baseFreq = isPerfect ? 880 : 659.25;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.09);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  public playMissFx() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(65, t + 0.18);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.21);
  }

  public playStreakFx(combo: number) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((f, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f + combo * 10, t + i * 0.04);
      gain.gain.setValueAtTime(0.12, t + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + i * 0.04);
      osc.stop(t + i * 0.04 + 0.11);
    });
  }

  public speakGermanLyric(text: string, isSlow: boolean = false) {
    if (this.isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const cleaned = text.replace(/\[.*?\]/g, '').replace(/[\(\)]/g, '').trim();
      const utt = new SpeechSynthesisUtterance(cleaned);
      utt.lang = 'de-DE';
      if (this.germanVoice) {
        utt.voice = this.germanVoice;
      }
      utt.rate = isSlow ? 0.75 : 0.95;
      utt.pitch = 1.0;
      utt.volume = 1.0;
      window.speechSynthesis.speak(utt);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  public dispose() {
    this.stopSongRhythm();
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
