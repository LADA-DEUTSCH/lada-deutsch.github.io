/**
 * 🧠 PROJECT NEON-POLYGLOT: SENTIENT MEMORY & REVENGE-LEVEL SRS ENGINE
 * Local-First IndexedDB Persistence with Ebbinghaus Exponential Retention Decay:
 *    R = exp(-Δt / S)
 * Critical Decay Threshold: R < 0.40 triggers BOSS REVENGE synthesis
 * Mastery Law: Accuracy >= 85% AND Combo Streak >= 10x
 */

export interface VocabRecord {
  word: string; // German target (lowercase)
  darijaArabizi: string;
  darijaArabic: string;
  stability: number; // S in days (starts at 1.0)
  lastReviewedAt: number; // timestamp ms
  errorCount: number;
  streak: number;
  lastScore: number;
  phoneticTrap: string | null;
  retention: number; // calculated R in [0, 1]
  status: 'HEALTHY' | 'CRITICAL_DECAY' | 'MASTERED';
}

export interface SessionRecord {
  id?: number;
  timestamp: number;
  songId: string;
  level: number;
  score: number;
  maxCombo: number;
  accuracy: number;
  failedWords: string[];
  passedMastery: boolean;
}

const DB_NAME = 'NeonPolyglotSentientMemory';
const DB_VERSION = 1;
const MS_PER_DAY = 86_400_000;
const CRITICAL_RETENTION_THRESHOLD = 0.40;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e: IDBVersionChangeEvent) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('vocab')) {
        const vocabStore = db.createObjectStore('vocab', { keyPath: 'word' });
        vocabStore.createIndex('status', 'status', { unique: false });
        vocabStore.createIndex('lastReviewedAt', 'lastReviewedAt', { unique: false });
      }
      if (!db.objectStoreNames.contains('sessions')) {
        const sessionStore = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
        sessionStore.createIndex('songId', 'songId', { unique: false });
        sessionStore.createIndex('level', 'level', { unique: false });
      }
      if (!db.objectStoreNames.contains('revenge_tracks')) {
        db.createObjectStore('revenge_tracks', { keyPath: 'id' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Compute Ebbinghaus Retention Decay: R = exp(-Δt / S)
 */
export function calculateRetention(lastReviewedAt: number, stability: number): number {
  if (!lastReviewedAt || stability <= 0) return 0.1;
  const now = Date.now();
  const deltaDays = Math.max(0, (now - lastReviewedAt) / MS_PER_DAY);
  const retention = Math.exp(-deltaDays / stability);
  return Math.min(1, Math.max(0, retention));
}

/**
 * Record a word attempt and update SRS stability according to performance
 */
export async function recordWordAttempt(
  word: string,
  isCorrect: boolean,
  phoneticTrap?: string,
  darijaArabizi?: string,
  darijaArabic?: string
): Promise<VocabRecord> {
  const db = await openDb();
  const normalized = word.trim().toLowerCase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('vocab', 'readwrite');
    const store = tx.objectStore('vocab');
    const getReq = store.get(normalized);

    getReq.onsuccess = () => {
      const now = Date.now();
      let record: VocabRecord = getReq.result;

      if (!record) {
        record = {
          word: normalized,
          darijaArabizi: darijaArabizi || normalized,
          darijaArabic: darijaArabic || '',
          stability: 1.0,
          lastReviewedAt: now,
          errorCount: 0,
          streak: 0,
          lastScore: isCorrect ? 100 : 0,
          phoneticTrap: phoneticTrap || null,
          retention: 1.0,
          status: isCorrect ? 'HEALTHY' : 'CRITICAL_DECAY'
        };
      }

      if (isCorrect) {
        record.streak += 1;
        // Increase stability S exponentially with streak
        record.stability = Math.min(60, record.stability * (1.5 + Math.min(1.0, record.streak * 0.2)));
        record.lastScore = 100;
      } else {
        record.streak = 0;
        record.errorCount += 1;
        // Severe stability collapse on mistake
        record.stability = Math.max(0.25, record.stability * 0.4);
        record.lastScore = 0;
      }

      record.lastReviewedAt = now;
      record.retention = calculateRetention(record.lastReviewedAt, record.stability);

      if (record.retention < CRITICAL_RETENTION_THRESHOLD || !isCorrect) {
        record.status = 'CRITICAL_DECAY';
      } else if (record.streak >= 4 && record.retention > 0.85) {
        record.status = 'MASTERED';
      } else {
        record.status = 'HEALTHY';
      }

      const putReq = store.put(record);
      putReq.onsuccess = () => resolve(record);
      putReq.onerror = () => reject(putReq.error);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Retrieve all words currently in CRITICAL_DECAY (< 40% retention or >= 2 errors)
 */
export async function getCriticalDecayWords(): Promise<VocabRecord[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('vocab', 'readonly');
    const store = tx.objectStore('vocab');
    const req = store.getAll();

    req.onsuccess = () => {
      const records: VocabRecord[] = req.result || [];
      const critical: VocabRecord[] = [];

      for (const rec of records) {
        const curRetention = calculateRetention(rec.lastReviewedAt, rec.stability);
        if (curRetention < CRITICAL_RETENTION_THRESHOLD || rec.errorCount >= 2) {
          rec.retention = curRetention;
          rec.status = 'CRITICAL_DECAY';
          critical.push(rec);
        }
      }

      // Sort by worst retention first
      critical.sort((a, b) => a.retention - b.retention);
      resolve(critical);
    };

    req.onerror = () => reject(req.error);
  });
}

/**
 * Overall Cognitive Profile for HUD & Analytics
 */
export async function getCognitiveProfileMetrics() {
  const db = await openDb();
  return new Promise<{
    totalWords: number;
    masteredCount: number;
    criticalCount: number;
    avgRetention: number;
  }>((resolve, reject) => {
    const tx = db.transaction('vocab', 'readonly');
    const store = tx.objectStore('vocab');
    const req = store.getAll();

    req.onsuccess = () => {
      const records: VocabRecord[] = req.result || [];
      if (records.length === 0) {
        resolve({ totalWords: 0, masteredCount: 0, criticalCount: 0, avgRetention: 1.0 });
        return;
      }

      let mastered = 0;
      let critical = 0;
      let retentionSum = 0;

      for (const rec of records) {
        const r = calculateRetention(rec.lastReviewedAt, rec.stability);
        retentionSum += r;
        if (r < CRITICAL_RETENTION_THRESHOLD || rec.errorCount >= 2) {
          critical++;
        } else if (rec.streak >= 4) {
          mastered++;
        }
      }

      resolve({
        totalWords: records.length,
        masteredCount: mastered,
        criticalCount: critical,
        avgRetention: +(retentionSum / records.length).toFixed(2)
      });
    };

    req.onerror = () => reject(req.error);
  });
}

/**
 * Record session result and verify Mastery Laws:
 * Accuracy >= 85% AND Max Combo >= 10
 */
export async function recordSessionOutcome(
  songId: string,
  level: number,
  score: number,
  maxCombo: number,
  accuracy: number,
  failedWords: string[]
): Promise<{ passedMastery: boolean; nextTierUnlocked: boolean }> {
  const db = await openDb();
  const passedMastery = accuracy >= 85 && maxCombo >= 10;

  const session: SessionRecord = {
    timestamp: Date.now(),
    songId,
    level,
    score,
    maxCombo,
    accuracy,
    failedWords,
    passedMastery
  };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('sessions', 'readwrite');
    const store = tx.objectStore('sessions');
    const req = store.add(session);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  return {
    passedMastery,
    nextTierUnlocked: passedMastery
  };
}

/**
 * Store and fetch dynamically synthesized Boss Revenge levels
 */
export async function saveRevengeBeatmap(trackData: any): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('revenge_tracks', 'readwrite');
    const store = tx.objectStore('revenge_tracks');
    const req = store.put({
      id: trackData.id || 'revenge_boss_track',
      createdAt: Date.now(),
      data: trackData
    });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getLatestRevengeBeatmap(): Promise<any | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('revenge_tracks', 'readonly');
    const store = tx.objectStore('revenge_tracks');
    const req = store.get('revenge_boss_track');
    req.onsuccess = () => resolve(req.result ? req.result.data : null);
    req.onerror = () => reject(req.error);
  });
}
