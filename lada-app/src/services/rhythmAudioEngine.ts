import type { InstrumentType } from '../types';
import { geminiAudioTts } from './geminiAudioTts';

export interface IRhythmAudioEngine {
  ensureContext(): AudioContext;
  setMuted(muted: boolean): void;
  startSongRhythm(bpm: number, instrument: InstrumentType): void;
  stopSongRhythm(): void;
  pause(): void;
  resume(): void;
  getBpm(): number;
  getCurrentAudioTime(): number;
  playHitFx(accuracy?: 'perfect' | 'good' | boolean): void;
  playMissFx(): void;
  playStreakFx(combo: number): void;
  playLaneSwitchFx(): void;
  speakGermanLyric(text: string, isSlow?: boolean): void;
  dispose(): void;
}

/**
 * Precision Web Audio API engine anchored to hardware AudioContext.currentTime.
 * Employs Chris Wilson's Lookahead Beat Scheduler (25ms interval, 100ms lookahead window)
 * to deliver zero-drift rhythm synthesis and sample-accurate synchronization.
 * Engineered to safely withstand React 19 Strict Mode mount/unmount cycles.
 */
export class RhythmAudioEngine implements IRhythmAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private isMuted: boolean = false;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;

  private currentBpm: number = 80;
  private instrument: InstrumentType = 'piano';

  // Chris Wilson Lookahead Beat Scheduler
  private timerId: number | null = null;
  private readonly lookaheadIntervalMs: number = 25;      // How often to run scheduler loop (ms)
  private readonly scheduleAheadTimeSec: number = 0.100;   // How far ahead to schedule audio nodes (s)
  private nextNoteTime: number = 0;                       // Next 8th note due time (in AudioContext.currentTime seconds)
  private currentBeatStep: number = 0;                    // Sequencer step counter (0..7)

  // Hardware clock tracking
  private songStartTime: number = 0;                      // Hardware AudioContext.currentTime at song start
  private pauseOffset: number = 0;                        // Elapsed playback time preserved across pause/resume

  // Cached white noise buffer to eliminate GC pressure in the audio thread
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    // Auto-unlock AudioContext on first user interaction anywhere in the window
    if (typeof window !== 'undefined') {
      const unlock = () => {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        window.removeEventListener('click', unlock);
        window.removeEventListener('touchstart', unlock);
        window.removeEventListener('keydown', unlock);
      };
      window.addEventListener('click', unlock, { passive: true });
      window.addEventListener('touchstart', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
    }
  }

  public ensureContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      // Master gain node
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Music sub-mix gain node
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(1, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      // SFX sub-mix gain node
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(1, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 1, this.ctx.currentTime);
    }
    if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Start song rhythm using hardware-anchored lookahead scheduler.
   * Resilient to React 19 Strict Mode double-render: instantly terminates
   * previous timers and isolates audio nodes.
   */
  public startSongRhythm(bpm: number, instrument: InstrumentType): void {
    this.currentBpm = bpm;
    this.instrument = instrument;

    // Terminate any previous rhythm gracefully
    this.stopSongRhythm();

    const ctx = this.ensureContext();

    // Fresh music sub-gain node for this playback session
    if (this.masterGain) {
      this.musicGain = ctx.createGain();
      this.musicGain.gain.setValueAtTime(1, ctx.currentTime);
      this.musicGain.connect(this.masterGain);
    }

    const now = ctx.currentTime;
    // 50ms buffer to allow lookahead loop to pre-schedule step 0 seamlessly
    this.songStartTime = now + 0.05;
    this.nextNoteTime = this.songStartTime;
    this.currentBeatStep = 0;
    this.pauseOffset = 0;
    this.isPlaying = true;
    this.isPaused = false;

    // Chris Wilson Lookahead loop
    this.timerId = window.setInterval(() => this.scheduler(), this.lookaheadIntervalMs);
  }

  public getBpm(): number {
    return this.currentBpm;
  }

  /**
   * Returns current relative song playback time in seconds, anchored to
   * hardware AudioContext.currentTime without drifting.
   */
  public getCurrentAudioTime(): number {
    if (!this.isPlaying) {
      return 0;
    }
    if (this.isPaused) {
      return this.pauseOffset;
    }
    if (!this.ctx) {
      return 0;
    }
    const elapsed = this.ctx.currentTime - this.songStartTime;
    return Math.max(0, elapsed);
  }

  public pause(): void {
    if (!this.isPlaying || this.isPaused || !this.ctx) return;
    this.isPaused = true;
    this.pauseOffset = Math.max(0, this.ctx.currentTime - this.songStartTime);

    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    if (this.musicGain) {
      this.musicGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  public resume(): void {
    if (!this.isPlaying || !this.isPaused) return;
    const ctx = this.ensureContext();
    this.isPaused = false;

    const now = ctx.currentTime;
    this.songStartTime = now - this.pauseOffset;
    this.nextNoteTime = now + 0.05;

    if (this.masterGain) {
      this.musicGain = ctx.createGain();
      this.musicGain.gain.setValueAtTime(1, ctx.currentTime);
      this.musicGain.connect(this.masterGain);
    }

    this.timerId = window.setInterval(() => this.scheduler(), this.lookaheadIntervalMs);
  }

  public stopSongRhythm(): void {
    this.isPlaying = false;
    this.isPaused = false;

    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    // Instantly disconnect previous music gain to silence any scheduled future events
    if (this.musicGain && this.ctx) {
      try {
        this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.musicGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.musicGain.disconnect();
      } catch {
        // Safe ignore
      }
      this.musicGain = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // --- Chris Wilson Scheduler Core ---

  private scheduler(): void {
    if (!this.isPlaying || this.isPaused || !this.ctx) return;

    // While there are notes that will need to play before the next interval,
    // schedule them into the hardware queue and advance the beat pointer.
    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTimeSec) {
      this.scheduleBeatStep(this.currentBeatStep % 8, this.nextNoteTime);
      this.advanceStep();
    }
  }

  private advanceStep(): void {
    // 8th note intervals: 60 / bpm * 0.5
    const secondsPerStep = (60.0 / this.currentBpm) * 0.5;
    this.nextNoteTime += secondsPerStep;
    this.currentBeatStep++;
  }

  private scheduleBeatStep(step: number, time: number): void {
    if (!this.ctx || this.isMuted) return;

    // Step 0: Kick + Primary Chord
    // Step 2: Hi-Hat
    // Step 4: Snare + Secondary Chord
    // Step 6: Hi-Hat
    if (step === 0) {
      this.playKick(time);
      this.playChord(time, 0);
    } else if (step === 2) {
      this.playHiHat(time);
    } else if (step === 4) {
      this.playSnare(time);
      this.playChord(time, 1);
    } else if (step === 6) {
      this.playHiHat(time);
    }
  }

  // --- Hardware-Scheduled Percussion Synthesis ---

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (!this.noiseBuffer || this.noiseBuffer.sampleRate !== ctx.sampleRate) {
      const bufferSize = ctx.sampleRate; // 1 second buffer
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    }
    return this.noiseBuffer;
  }

  private playKick(t: number): void {
    if (!this.ctx) return;
    const dest = this.musicGain ?? this.masterGain ?? this.ctx.destination;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.12);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  private playSnare(t: number): void {
    if (!this.ctx) return;
    const dest = this.musicGain ?? this.masterGain ?? this.ctx.destination;

    // Snare tonal punch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.1);

    // Snare white noise wire snap
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer(this.ctx);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.14, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(dest);
    noise.start(t);
    noise.stop(t + 0.11);
  }

  private playHiHat(t: number): void {
    if (!this.ctx) return;
    const dest = this.musicGain ?? this.masterGain ?? this.ctx.destination;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer(this.ctx);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(8000, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(t);
    noise.stop(t + 0.04);
  }

  private playChord(t: number, chordIndex: number): void {
    if (!this.ctx) return;
    const dest = this.musicGain ?? this.masterGain ?? this.ctx.destination;

    let freqs = chordIndex === 0 ? [220, 261.63, 329.63] : [174.61, 220, 261.63]; // A minor -> F major
    if (this.instrument === 'synthwave') {
      freqs = chordIndex === 0 ? [110, 164.81, 220] : [130.81, 196, 261.63];
    } else if (this.instrument === 'moroccan_beat') {
      freqs = chordIndex === 0 ? [146.83, 220, 293.66] : [130.81, 196, 261.63]; // D modal
    } else if (this.instrument === 'chillhop') {
      freqs = chordIndex === 0 ? [196, 246.94, 293.66, 369.99] : [164.81, 220, 261.63, 329.63]; // Gmaj7 -> Em7
    } else if (this.instrument === 'funk_bass') {
      freqs = chordIndex === 0 ? [82.41, 123.47, 164.81] : [73.42, 110, 146.83];
    }

    freqs.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(
        this.instrument === 'synthwave' ? 2200 : 1600,
        t
      );

      if (this.instrument === 'synthwave') {
        osc.type = 'sawtooth';
      } else if (this.instrument === 'funk_bass') {
        osc.type = 'triangle';
      } else if (this.instrument === 'acoustic_guitar') {
        osc.type = 'triangle';
      } else {
        osc.type = 'sine';
      }

      osc.frequency.setValueAtTime(f, t);
      const vol = this.instrument === 'synthwave' ? 0.035 : 0.07;
      gain.gain.setValueAtTime(vol / (idx + 1), t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  }

  // --- Sound Effects Synthesis ---

  /**
   * Sound effect on note hit.
   * Supports 'perfect' (bright cyber chime) and 'good' (smooth harmonic chime).
   */
  public playHitFx(accuracy: 'perfect' | 'good' | boolean = 'perfect'): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    const dest = this.sfxGain ?? this.masterGain ?? ctx.destination;
    const t = ctx.currentTime;
    const isPerfect = accuracy === 'perfect' || accuracy === true;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const baseFreq = isPerfect ? 880 : 659.25; // A5 or E5
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.08);

    gain.gain.setValueAtTime(isPerfect ? 0.28 : 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.14);

    if (isPerfect) {
      // Harmonic sparkle overtone
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1318.51, t); // E6
      osc2.frequency.exponentialRampToValueAtTime(1760, t + 0.08); // A6
      gain2.gain.setValueAtTime(0.12, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
      osc2.connect(gain2);
      gain2.connect(dest);
      osc2.start(t);
      osc2.stop(t + 0.12);
    }
  }

  /**
   * Low dissonant buzz / noise drop for a missed note.
   */
  public playMissFx(): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    const dest = this.sfxGain ?? this.masterGain ?? ctx.destination;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.2);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.23);
  }

  /**
   * Sparkling ascending arpeggio chord chime celebrating combo milestones.
   */
  public playStreakFx(combo: number): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    const dest = this.sfxGain ?? this.masterGain ?? ctx.destination;
    const t = ctx.currentTime;

    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const pitchOffset = Math.min(200, combo * 8);
      osc.frequency.setValueAtTime(f + pitchOffset, t + i * 0.04);
      gain.gain.setValueAtTime(0.12, t + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.1);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t + i * 0.04);
      osc.stop(t + i * 0.04 + 0.11);
    });
  }

  /**
   * Cyberpunk resonant laser zip for snappy lane switches.
   */
  public playLaneSwitchFx(): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    const dest = this.sfxGain ?? this.masterGain ?? ctx.destination;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(750, t + 0.06);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.Q.setValueAtTime(4, t);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  /**
   * Pronounces the German lyric using Google Gemini 3.1 Flash TTS PCM Audio Engine.
   */
  public speakGermanLyric(text: string, isSlow: boolean = false): void {
    if (this.isMuted) return;
    geminiAudioTts.speakText(text, 'Puck', 'de-DE', isSlow ? 0.75 : 1.0).catch(() => {});
  }

  public dispose(): void {
    this.stopSongRhythm();
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const rhythmAudioEngine = new RhythmAudioEngine();
export default rhythmAudioEngine;
