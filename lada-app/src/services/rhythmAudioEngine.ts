import type { InstrumentType } from '../types';
import { geminiAudioTts } from './geminiAudioTts';

export class RhythmAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isPlaying: boolean = false;
  private currentBpm: number = 80;
  private instrument: InstrumentType = 'piano';
  private timerId: number | null = null;
  private currentBeat: number = 0;

  constructor() {}

  public ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

  public getBpm(): number {
    return this.currentBpm;
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

  private playBeatStep(step: number) {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime;

    // Drum Pattern:
    // Step 0: Kick
    // Step 2: Hi-Hat
    // Step 4: Snare / Clap
    // Step 6: Hi-Hat
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

    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.12);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  private playSnare(t: number) {
    if (!this.ctx) return;
    // Tone component
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.1);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.11);

    // Noise component (buffer)
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    noise.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(t);
  }

  private playHiHat(t: number) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.03;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    noise.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);
  }

  private playChord(t: number, chordIndex: number) {
    if (!this.ctx) return;
    // Frequencies depending on instrument
    let freqs = chordIndex === 0 ? [220, 261.63, 329.63] : [174.61, 220, 261.63]; // A minor -> F major
    if (this.instrument === 'synthwave') {
      freqs = chordIndex === 0 ? [110, 164.81, 220] : [130.81, 196, 261.63];
    } else if (this.instrument === 'moroccan_beat') {
      freqs = chordIndex === 0 ? [146.83, 220, 293.66] : [130.81, 196, 261.63]; // D modal
    }

    freqs.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (this.instrument === 'piano') {
        osc.type = 'sine';
      } else if (this.instrument === 'synthwave') {
        osc.type = 'sawtooth';
      } else if (this.instrument === 'funk_bass') {
        osc.type = 'triangle';
      } else {
        osc.type = 'sine';
      }

      osc.frequency.setValueAtTime(f, t);
      const vol = this.instrument === 'synthwave' ? 0.04 : 0.08;
      gain.gain.setValueAtTime(vol / (idx + 1), t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  }

  // --- Sound FX for Gameplay ---
  public playHitFx(isPerfect: boolean) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const baseFreq = isPerfect ? 880 : 659.25; // A5 or E5
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.1);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  public playMissFx() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.2);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.23);
  }

  public playStreakFx(combo: number) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    freqs.forEach((f, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f + combo * 10, t + i * 0.05);
      gain.gain.setValueAtTime(0.12, t + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + i * 0.05);
      osc.stop(t + i * 0.05 + 0.13);
    });
  }

  /**
   * Reads or sings the German word via Web Speech API.
   * In Level 1: rate 0.75 for slow, clear beginner acquisition.
   * In Level 2/3: rate 0.95.
   */
  public speakGermanLyric(text: string, isSlow: boolean = false) {
    if (this.isMuted) return;
    geminiAudioTts.speakText(text, 'Puck', 'de-DE', isSlow ? 0.75 : 1.0).catch(() => {});
  }

  public dispose() {
    this.stopSongRhythm();
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
