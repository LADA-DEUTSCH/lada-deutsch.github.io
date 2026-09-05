import fs from 'fs';
import path from 'path';
import { GeminiRotator } from '../src/lib/geminiRotator.ts';

// Ensure .env.local is parsed into process.env if needed
export function loadEnvLocal(rootPath: string) {
  const envPaths = [
    path.join(rootPath, '.env.local'),
    path.join(rootPath, '..', '.env.local'),
    path.join(rootPath, '.env')
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

let rotatorInstance: GeminiRotator | null = null;

export function getProxyRotator(rootPath?: string): GeminiRotator {
  if (!rotatorInstance) {
    if (rootPath) {
      loadEnvLocal(rootPath);
    }
    rotatorInstance = new GeminiRotator();
  }
  return rotatorInstance;
}

/**
 * Handle incoming /api/ai/* HTTP requests
 */
export async function handleAiProxyRequest(req: any, res: any, urlPath: string, rootDir: string) {
  const rotator = getProxyRotator(rootDir);

  // Set JSON headers and CORS
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // 1. GET /api/ai/metrics
  if (urlPath === '/api/ai/metrics' && req.method === 'GET') {
    const metrics = rotator.getPoolMetrics();
    res.statusCode = 200;
    res.end(JSON.stringify({ status: 'ok', metrics }));
    return;
  }

  // Helper to read incoming JSON body
  const readBody = async (): Promise<any> => {
    return new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (chunk: any) => (data += chunk));
      req.on('end', () => {
        try {
          resolve(data ? JSON.parse(data) : {});
        } catch (e) {
          reject(e);
        }
      });
      req.on('error', reject);
    });
  };

  try {
    const body = await readBody();

    // 2. POST /api/ai/studio/breakdown
    if (urlPath === '/api/ai/studio/breakdown') {
      const { germanText, darijaHint, songTitle } = body;
      const systemInstruction = `You are "Professor LADA", an elite German phonetic & linguistics expert specialized in teaching Moroccan Darija speakers (المغاربة).
Rules:
1. STRICT ANTI-MSA DIRECTIVE: Modern Standard Arabic (العربية الفصحى) is strictly forbidden. Use authentic, street-smart Moroccan Darija.
2. Dual-script Darija: For short punchy terms, provide both Latin Arabizi (7, 3, 9, kh, gh) and authentic Arabic script (الدارجة).
3. Identify Moroccan sound traps (ch Ich-Laut vs Ach-Laut, ö/ü umlauts, s vs ß, clusters pf, ts/z, sp, st).
4. Output strict JSON with keys:
   - "meaningDarija": string (meaning in witty Darija)
   - "phoneticTrap": { "trapLetter": string, "explanationDarija": string, "mouthPosition": string }
   - "grammarHackDarija": string (one punchy sentence explaining the grammar pattern)`;

      const prompt = `Song: ${songTitle || 'NEON TRACK'}
German line: "${germanText}"
Darija context: "${darijaHint || ''}"
Analyze this line for a Moroccan learner. Return JSON matching the schema.`;

      const breakdown = await rotator.generateJson('deep_linguistic', prompt, systemInstruction);
      res.statusCode = 200;
      res.end(JSON.stringify({ status: 'ok', data: breakdown }));
      return;
    }

    // 3. POST /api/ai/vocal/feedback
    if (urlPath === '/api/ai/vocal/feedback') {
      const { germanTarget, recognizedText, pitchScore, audioBase64, mimeType } = body;

      const systemInstruction = `You are the Cyber-HUD Vocal Coach in PROJECT NEON-POLYGLOT.
You coach Moroccan Darija speakers learning German pronunciation.
Strict Anti-MSA Directive: Speak witty, authentic Moroccan Darija (e.g. "Nti9tek f 'schön' kant mzyana, walakin 'ch' dertiha 'kh' bzaf!").
Give:
- "rating": "PERFECT" | "GREAT" | "GLITCH"
- "score": number (0-100)
- "feedbackDarija": authentic Moroccan coaching comment
- "correctionTip": exact mouth / tongue positioning hack`;

      const prompt = `Target German lyric: "${germanTarget}"
User speech recognized: "${recognizedText || ''}"
Pitch accuracy score: ${pitchScore || 80}%
Evaluate the pronunciation and give authentic Moroccan feedback in JSON.`;

      let feedback: any;
      if (audioBase64 && mimeType) {
        try {
          const rawAudioFeedback = await rotator.analyzeAudio(audioBase64, mimeType, prompt, systemInstruction);
          feedback = { feedbackDarija: rawAudioFeedback, rating: 'GREAT', score: pitchScore || 85 };
        } catch {
          feedback = await rotator.generateJson('audio_analytics', prompt, systemInstruction);
        }
      } else {
        feedback = await rotator.generateJson('audio_analytics', prompt, systemInstruction);
      }

      res.statusCode = 200;
      res.end(JSON.stringify({ status: 'ok', data: feedback }));
      return;
    }

    // 4. POST /api/ai/revenge/generate
    if (urlPath === '/api/ai/revenge/generate') {
      const { criticalWords, currentBpm = 130 } = body;
      const wordsList = Array.isArray(criticalWords) ? criticalWords.join(', ') : 'schön, ich, vielleicht, zusammen, zeit';

      const systemInstruction = `You are the Dynamic BOSS REVENGE Synthesizer for Project NEON-POLYGLOT.
You construct high-speed 3D cyber-highway beatmaps focusing exclusively on the player's weakest German words for Moroccan Darija speakers.
Return JSON with:
{
  "id": "revenge_boss_track",
  "title": "⚡ BOSS REVENGE: DARIJA CYBER-STORM",
  "artist": "DJ LADA & GEMINI PRO",
  "bpm": ${Math.min(150, (currentBpm || 128) + 12)},
  "instrument": "synth_lead",
  "lyrics": [
    {
      "time": number (seconds starting from 1.0, step 2.0s),
      "german": string (German word/phrase from the weak list),
      "darija": string (Latin Arabizi translation),
      "darijaArabic": string (Arabic script translation),
      "wrongAnswers": [string, string] (Latin Arabizi plausible distractors),
      "trap": string (phonetic trap e.g. "ch-Laut", "Umlaut ö", "Cluster pf")
    }
  ]
}`;

      const prompt = `Player failed these critical decay words: [${wordsList}].
Synthesize a 10-beat dynamic Revenge Level beatmap in JSON with high-energy challenge.`;

      const revengeBeatmap = await rotator.generateJson('deep_linguistic', prompt, systemInstruction);
      res.statusCode = 200;
      res.end(JSON.stringify({ status: 'ok', data: revengeBeatmap }));
      return;
    }

    // 5. POST /api/ai/chat
    if (urlPath === '/api/ai/chat') {
      const { message, history = [] } = body;
      const systemInstruction = `You are "الأستاذ لادا" (Professor LADA), the cyber-polyglot tutor for Moroccans learning German.
Tone: Street-smart, witty, encouraging, highly knowledgeable in German grammar and phonetics.
STRICT RULE: Only Moroccan Darija (Arabic script or Latin Arabizi when giving pronunciation cues). NO MSA (Modern Standard Arabic).`;

      const contextHistory = history.map((h: any) => `${h.role === 'user' ? 'User' : 'LADA'}: ${h.text}`).join('\n');
      const fullPrompt = `${contextHistory ? contextHistory + '\n' : ''}User: ${message}\nLADA:`;

      const reply = await rotator.generateText('fast', fullPrompt, systemInstruction);
      res.statusCode = 200;
      res.end(JSON.stringify({ status: 'ok', reply }));
      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Endpoint not found', path: urlPath }));
  } catch (err: any) {
    console.error('[AI Proxy Error]', err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message || 'Internal AI proxy error' }));
  }
}
