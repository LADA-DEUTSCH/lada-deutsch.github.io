export class AudioPipeline {
  private micContext: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micProcessor: ScriptProcessorNode | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;

  private playbackContext: AudioContext | null = null;
  private activeSources: AudioBufferSourceNode[] = [];
  private nextPlayTime: number = 0;

  public isMicMuted: boolean = false;
  public isSpeakerMuted: boolean = false;

  private onAudioChunkCallback?: (base64Pcm16: string) => void;

  constructor(onAudioChunk?: (base64Pcm16: string) => void) {
    this.onAudioChunkCallback = onAudioChunk;
  }

  public async startMicrophone(): Promise<MediaStream> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    this.micStream = stream;

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.micContext = new AudioContextClass({ sampleRate: 16000 });
    if (this.micContext.state === 'suspended') {
      await this.micContext.resume();
    }

    this.micSource = this.micContext.createMediaStreamSource(stream);
    this.micProcessor = this.micContext.createScriptProcessor(4096, 1, 1);

    this.micSource.connect(this.micProcessor);
    this.micProcessor.connect(this.micContext.destination);

    this.micProcessor.onaudioprocess = (e) => {
      if (this.isMicMuted || !this.onAudioChunkCallback) return;

      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
      }

      const binary = String.fromCharCode.apply(null, Array.from(new Uint8Array(pcm16.buffer)));
      this.onAudioChunkCallback(btoa(binary));
    };

    return stream;
  }

  public stopMicrophone(): void {
    if (this.micProcessor) {
      this.micProcessor.disconnect();
      this.micProcessor = null;
    }
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
    if (this.micStream) {
      this.micStream.getAudioTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    if (this.micContext) {
      this.micContext.close().catch(() => {});
      this.micContext = null;
    }
  }

  public ensurePlaybackContext(): AudioContext {
    if (!this.playbackContext) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.playbackContext = new AudioContextClass({ sampleRate: 24000 });
    }
    if (this.playbackContext.state === 'suspended') {
      this.playbackContext.resume();
    }
    return this.playbackContext;
  }

  public playPcm24kChunk(base64Data: string): void {
    if (this.isSpeakerMuted) return;

    const ctx = this.ensurePlaybackContext();
    try {
      const binary = atob(base64Data);
      const sampleCount = Math.floor(binary.length / 2);
      if (sampleCount === 0) return;

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
      source.connect(ctx.destination);

      this.activeSources.push(source);
      source.onended = () => {
        this.activeSources = this.activeSources.filter(s => s !== source);
      };

      const now = ctx.currentTime;
      if (this.nextPlayTime < now) {
        this.nextPlayTime = now + 0.05;
      }
      source.start(this.nextPlayTime);
      this.nextPlayTime += buffer.duration;
    } catch (err) {
      console.warn('Audio playback buffer error:', err);
    }
  }

  public stopAllPlayback(): void {
    for (const source of this.activeSources) {
      try {
        source.stop();
      } catch {
        // already stopped
      }
    }
    this.activeSources = [];
    if (this.playbackContext) {
      this.nextPlayTime = this.playbackContext.currentTime;
    }
  }

  public setMicMuted(muted: boolean): void {
    this.isMicMuted = muted;
    if (this.micStream) {
      this.micStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }

  public setSpeakerMuted(muted: boolean): void {
    this.isSpeakerMuted = muted;
    if (muted) {
      this.stopAllPlayback();
    }
  }

  public destroy(): void {
    this.stopMicrophone();
    this.stopAllPlayback();
    if (this.playbackContext) {
      this.playbackContext.close().catch(() => {});
      this.playbackContext = null;
    }
  }
}
