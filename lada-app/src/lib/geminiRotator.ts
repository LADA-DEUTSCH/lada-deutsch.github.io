/**
 * 🔄 PROJECT NEON-POLYGLOT: 6-KEY GEMINI ROTATOR POOL & CIRCUIT BREAKER
 * Architectural Specification:
 * - 6 Independent Google AI Studio accounts/keys
 * - Circuit Breaker: 60s cooldown on 429 (Rate Limit) & 503 (Unavailable)
 * - Specialized Pipelines:
 *     Fast (Keys 1-2) -> Gemini Flash
 *     Deep Linguistic (Keys 3-4) -> Gemini Pro
 *     Audio & Analytics (Keys 5-6) -> Multimodal Flash
 * - Safe internal execution; zero client bundle leakage
 */

export type PipelineType = 'fast' | 'deep_linguistic' | 'audio_analytics';

export interface KeyRecord {
  key: string;
  name: string;
  index: number;
  assignedPipeline: PipelineType;
  lastUsed: number;
  cooldownUntil: number;
  requestCount: number;
  errorCount: number;
}

export interface GenerationOptions {
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
  jsonSchema?: Record<string, any>;
}

export interface PoolMetrics {
  totalKeys: number;
  activeKeys: number;
  cooldownKeys: number;
  pipelineStats: Record<PipelineType, { availableKeys: number; totalAssigned: number }>;
}

const COOLDOWN_MS = 60_000;

export class GeminiRotator {
  private keys: KeyRecord[] = [];
  private pipelinePointers: Record<PipelineType, number> = {
    fast: 0,
    deep_linguistic: 0,
    audio_analytics: 0
  };

  private pipelineModels: Record<PipelineType, string[]> = {
    fast: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'],
    deep_linguistic: ['gemini-2.5-pro', 'gemini-1.5-pro', 'gemini-2.5-flash'],
    audio_analytics: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash']
  };

  constructor(customKeys?: string[]) {
    this.initializeKeys(customKeys);
  }

  private initializeKeys(customKeys?: string[]) {
    const rawKeys: string[] = [];

    if (customKeys && customKeys.length > 0) {
      rawKeys.push(...customKeys);
    } else {
      // Safe environment check across Node.js / Vite server / Vercel
      const envObj: Record<string, string | undefined> =
        typeof globalThis !== 'undefined' && (globalThis as any).process?.env
          ? (globalThis as any).process.env
          : {};

      const envKeys = [
        envObj.GEMINI_KEY_1,
        envObj.GEMINI_KEY_2,
        envObj.GEMINI_KEY_3,
        envObj.GEMINI_KEY_4,
        envObj.GEMINI_KEY_5,
        envObj.GEMINI_KEY_6
      ].filter(Boolean) as string[];

      if (envKeys.length > 0) {
        rawKeys.push(...envKeys);
      }
    }

    // Map keys to pipelines according to Master Directive:
    // Keys 1-2 (idx 0,1) -> fast
    // Keys 3-4 (idx 2,3) -> deep_linguistic
    // Keys 5-6 (idx 4,5) -> audio_analytics
    this.keys = rawKeys.map((key, idx) => {
      let pipeline: PipelineType = 'fast';
      if (idx === 2 || idx === 3) pipeline = 'deep_linguistic';
      else if (idx >= 4) pipeline = 'audio_analytics';

      return {
        key: key.trim(),
        name: `GEMINI_KEY_${idx + 1}`,
        index: idx,
        assignedPipeline: pipeline,
        lastUsed: 0,
        cooldownUntil: 0,
        requestCount: 0,
        errorCount: 0
      };
    });
  }

  /**
   * Acquire next available healthy key for the requested pipeline with fallback across all keys
   */
  private getAvailableKey(pipeline: PipelineType): KeyRecord | null {
    const now = Date.now();
    if (this.keys.length === 0) return null;

    // Filter pipeline primary keys
    const pipelineKeys = this.keys.filter((k) => k.assignedPipeline === pipeline);

    // 1. Try healthy keys in assigned pipeline
    const healthyPipelineKeys = pipelineKeys.filter((k) => k.cooldownUntil <= now);
    if (healthyPipelineKeys.length > 0) {
      const idx = this.pipelinePointers[pipeline] % healthyPipelineKeys.length;
      this.pipelinePointers[pipeline] = (idx + 1) % healthyPipelineKeys.length;
      const selected = healthyPipelineKeys[idx];
      selected.lastUsed = now;
      selected.requestCount++;
      return selected;
    }

    // 2. Circuit Breaker Fallback: Borrow any healthy key from the broader pool
    const healthyAllKeys = this.keys.filter((k) => k.cooldownUntil <= now);
    if (healthyAllKeys.length > 0) {
      healthyAllKeys.sort((a, b) => a.lastUsed - b.lastUsed);
      const selected = healthyAllKeys[0];
      selected.lastUsed = now;
      selected.requestCount++;
      return selected;
    }

    // 3. If all keys are in cooldown, grab the key that will recover earliest
    const earliestKey = [...this.keys].sort((a, b) => a.cooldownUntil - b.cooldownUntil)[0];
    earliestKey.lastUsed = now;
    earliestKey.requestCount++;
    return earliestKey;
  }

  /**
   * Trigger circuit breaker on rate limit / server error
   */
  private tripCircuitBreaker(keyRecord: KeyRecord, status: number, _errorMsg: string) {
    keyRecord.errorCount++;
    if (status === 429 || status === 503 || status === 500) {
      keyRecord.cooldownUntil = Date.now() + COOLDOWN_MS;
      console.warn(
        `[GeminiRotator] Circuit breaker tripped on ${keyRecord.name} (HTTP ${status}). 60s cooldown applied.`
      );
    }
  }

  /**
   * Core execution loop with automatic key rotation and model fallback
   */
  public async executeRequest(
    pipeline: PipelineType,
    payload: any,
    endpoint = 'generateContent'
  ): Promise<any> {
    const maxRetries = Math.max(3, this.keys.length);
    const models = this.pipelineModels[pipeline];
    let lastError: any = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const keyRecord = this.getAvailableKey(pipeline);
      if (!keyRecord) {
        throw new Error('[GeminiRotator] No Gemini API keys configured in pool.');
      }

      // Try primary model, then fallbacks
      for (const model of models) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${endpoint}?key=${keyRecord.key}`;
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            return await res.json();
          }

          const status = res.status;
          const errorBody = await res.text();
          lastError = new Error(`HTTP ${status}: ${errorBody}`);

          if (status === 429 || status === 503) {
            this.tripCircuitBreaker(keyRecord, status, errorBody);
            // Break inner model loop to rotate to next key immediately
            break;
          }
        } catch (err: any) {
          lastError = err;
          // Network errors: try next model or key
        }
      }
    }

    throw lastError || new Error('[GeminiRotator] All rotated key attempts failed.');
  }

  /**
   * High-level Text Generation
   */
  public async generateText(
    pipeline: PipelineType,
    prompt: string,
    systemInstruction?: string,
    options: GenerationOptions = {}
  ): Promise<string> {
    const payload: any = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxOutputTokens ?? 800
      }
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    if (options.responseMimeType) {
      payload.generationConfig.responseMimeType = options.responseMimeType;
    }

    const data = await this.executeRequest(pipeline, payload);
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('[GeminiRotator] Received empty response candidates.');
    }
    return text.trim();
  }

  /**
   * High-level JSON Generation with schema enforcement
   */
  public async generateJson<T = any>(
    pipeline: PipelineType,
    prompt: string,
    systemInstruction?: string,
    options: GenerationOptions = {}
  ): Promise<T> {
    const rawText = await this.generateText(pipeline, prompt, systemInstruction, {
      ...options,
      responseMimeType: 'application/json'
    });

    try {
      // Remove any markdown code fences if present
      const cleaned = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      return JSON.parse(cleaned) as T;
    } catch (parseErr) {
      console.error('[GeminiRotator] Failed to parse JSON response:', rawText);
      throw new Error(`[GeminiRotator] Invalid JSON received from model: ${parseErr}`);
    }
  }

  /**
   * High-level Audio/Multimodal Analysis for Vocal Arena
   */
  public async analyzeAudio(
    audioBase64: string,
    mimeType: string,
    prompt: string,
    systemInstruction?: string
  ): Promise<string> {
    const payload: any = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: audioBase64
              }
            },
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 600
      }
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const data = await this.executeRequest('audio_analytics', payload);
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? text.trim() : 'لم يتم تحليل الصوت بنجاح.';
  }

  /**
   * Status metrics for HUD and server inspection
   */
  public getPoolMetrics(): PoolMetrics {
    const now = Date.now();
    const activeKeys = this.keys.filter((k) => k.cooldownUntil <= now).length;
    const cooldownKeys = this.keys.length - activeKeys;

    const pipelineStats: Record<PipelineType, { availableKeys: number; totalAssigned: number }> = {
      fast: {
        totalAssigned: this.keys.filter((k) => k.assignedPipeline === 'fast').length,
        availableKeys: this.keys.filter(
          (k) => k.assignedPipeline === 'fast' && k.cooldownUntil <= now
        ).length
      },
      deep_linguistic: {
        totalAssigned: this.keys.filter((k) => k.assignedPipeline === 'deep_linguistic').length,
        availableKeys: this.keys.filter(
          (k) => k.assignedPipeline === 'deep_linguistic' && k.cooldownUntil <= now
        ).length
      },
      audio_analytics: {
        totalAssigned: this.keys.filter((k) => k.assignedPipeline === 'audio_analytics').length,
        availableKeys: this.keys.filter(
          (k) => k.assignedPipeline === 'audio_analytics' && k.cooldownUntil <= now
        ).length
      }
    };

    return {
      totalKeys: this.keys.length,
      activeKeys,
      cooldownKeys,
      pipelineStats
    };
  }
}

// Global Singleton for server-side proxy
let globalRotator: GeminiRotator | null = null;

export function getGeminiRotator(customKeys?: string[]): GeminiRotator {
  if (!globalRotator || customKeys) {
    globalRotator = new GeminiRotator(customKeys);
  }
  return globalRotator;
}
