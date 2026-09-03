import type { VoiceName } from '../types';

export interface GeminiLiveCallbacks {
  onAudioPcm: (base64Pcm24: string) => void;
  onCaptionChunk: (text: string) => void;
  onTurnComplete: () => void;
  onInterrupted: () => void;
  onStatusChange: (status: 'connecting' | 'connected' | 'disconnected', message: string) => void;
  onError: (error: Error) => void;
  onClose: (code: number, reason: string) => void;
}

export class GeminiLiveClient {
  private ws: WebSocket | null = null;
  private isSetupComplete: boolean = false;
  private callbacks: GeminiLiveCallbacks;

  constructor(callbacks: GeminiLiveCallbacks) {
    this.callbacks = callbacks;
  }

  public async connect(
    apiKey: string,
    voiceName: VoiceName,
    systemPrompt: string,
    isContinuation = false
  ): Promise<void> {
    this.disconnect();

    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
    this.callbacks.onStatusChange('connecting', 'Connecting to Gemini Live...');

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);
      } catch (err) {
        reject(err);
        return;
      }

      this.ws.onopen = () => {
        // Send Setup Frame
        const setupMsg = {
          setup: {
            model: 'models/gemini-3.1-flash-live-preview',
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName
                  }
                }
              }
            },
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            }
          }
        };
        this.sendJson(setupMsg);
      };

      this.ws.onmessage = async (event) => {
        try {
          let textData: string;
          if (typeof event.data === 'string') {
            textData = event.data;
          } else if (event.data instanceof Blob) {
            textData = await event.data.text();
          } else {
            return;
          }

          const msg = JSON.parse(textData);

          // 1. Setup Complete
          if (msg.setupComplete) {
            this.isSetupComplete = true;
            this.callbacks.onStatusChange('connected', 'Live');
            resolve();

            // Send greeting prompt
            const greeting = isContinuation
              ? '[System Context: Connection seamlessly refreshed. Continue the conversation with Bilal naturally from where you left off without reintroducing yourself!]'
              : "Hello! You are LADA. Greet your friend Bilal on a late-night call with one short, relaxed sentence (under 10 words, e.g. 'Hey Bilal... working late tonight, haha. How are you?'). Do NOT lecture or quiz him—let him speak!";

            this.sendJson({
              clientContent: {
                turns: [
                  {
                    role: 'user',
                    parts: [{ text: greeting }]
                  }
                ],
                turnComplete: true
              }
            });
            return;
          }

          // 2. Server Content (Audio / Text / Interruption)
          if (msg.serverContent) {
            const sc = msg.serverContent;

            if (sc.interrupted) {
              this.callbacks.onInterrupted();
            }

            if (sc.modelTurn?.parts) {
              for (const part of sc.modelTurn.parts) {
                // Audio stream
                if (part.inlineData?.mimeType?.startsWith('audio/pcm') && part.inlineData.data) {
                  this.callbacks.onAudioPcm(part.inlineData.data);
                }
                // Text stream
                if (part.text) {
                  this.callbacks.onCaptionChunk(part.text);
                }
              }
            }

            if (sc.turnComplete) {
              this.callbacks.onTurnComplete();
            }
          }
        } catch (err) {
          console.warn('Error parsing Gemini message:', err);
        }
      };

      this.ws.onerror = (e) => {
        console.error('Gemini WS Error:', e);
        this.callbacks.onError(new Error('WebSocket connection error'));
        reject(e);
      };

      this.ws.onclose = (e) => {
        this.isSetupComplete = false;
        this.callbacks.onStatusChange('disconnected', `Closed (${e.code})`);
        this.callbacks.onClose(e.code, e.reason);
      };
    });
  }

  public sendRealtimeAudio(base64Pcm16: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.isSetupComplete) return;

    this.sendJson({
      realtimeInput: {
        audio: {
          mimeType: 'audio/pcm;rate=16000',
          data: base64Pcm16
        }
      }
    });
  }

  public sendRealtimeImage(base64Jpeg: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.isSetupComplete) return;

    this.sendJson({
      realtimeInput: {
        video: {
          mimeType: 'image/jpeg',
          data: base64Jpeg
        }
      }
    });
  }

  public sendChoiceSelected(choice: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.isSetupComplete) return;

    this.sendJson({
      clientContent: {
        turns: [
          {
            role: 'user',
            parts: [{ text: `I choose ${choice}!` }]
          }
        ],
        turnComplete: true
      }
    });
  }

  private sendJson(payload: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
    this.isSetupComplete = false;
  }
}
