import type { SongProgressRecord, GameDifficultyLevel } from '../types';

const STORAGE_KEY = 'lada_beat_3d_progress_v1';

export function getAllSongProgress(): Record<string, SongProgressRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load song progress:', e);
    return {};
  }
}

export function getSongProgress(songId: string): SongProgressRecord {
  const all = getAllSongProgress();
  if (all[songId]) {
    return all[songId];
  }
  return {
    songId,
    level1Completed: false,
    level2Plays: 0,
    level2PerfectCount: 0,
    level2HighScore: 0,
    level3Plays: 0,
    level3PerfectCount: 0,
    level3HighScore: 0,
    isMastered: false
  };
}

export function saveSongProgress(record: SongProgressRecord): void {
  try {
    const all = getAllSongProgress();
    all[record.songId] = record;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Failed to save song progress:', e);
  }
}

/**
 * Checks if a specific difficulty level is unlocked according to the rules:
 * - Level 1: Always unlocked
 * - Level 2: Unlocked only after Level 1 is completed
 * - Level 3: Unlocked only after Level 2 has been completed with 100% (Flawless) 10 times!
 */
export function isLevelUnlocked(songId: string, level: GameDifficultyLevel): boolean {
  if (level === 1) return true;
  const p = getSongProgress(songId);
  if (level === 2) {
    return p.level1Completed;
  }
  if (level === 3) {
    return p.level2PerfectCount >= 10;
  }
  return false;
}

/**
 * Records a game run result and updates streaks, high scores, and unlocks.
 */
export function recordLevelResult(
  songId: string,
  level: GameDifficultyLevel,
  score: number,
  accuracyPercent: number
): { record: SongProgressRecord; unlockedNext: boolean; becameMastered: boolean } {
  const p = getSongProgress(songId);
  let unlockedNext = false;
  let becameMastered = false;
  const isFlawless = accuracyPercent >= 100;

  if (level === 1) {
    if (!p.level1Completed) {
      p.level1Completed = true;
      unlockedNext = true;
    }
  } else if (level === 2) {
    p.level2Plays += 1;
    if (score > p.level2HighScore) {
      p.level2HighScore = score;
    }
    if (isFlawless) {
      const prev = p.level2PerfectCount;
      p.level2PerfectCount += 1;
      if (prev < 10 && p.level2PerfectCount >= 10) {
        unlockedNext = true; // Level 3 unlocked!
      }
    }
  } else if (level === 3) {
    p.level3Plays += 1;
    if (score > p.level3HighScore) {
      p.level3HighScore = score;
    }
    if (isFlawless) {
      const prev = p.level3PerfectCount;
      p.level3PerfectCount += 1;
      if (prev < 10 && p.level3PerfectCount >= 10) {
        p.isMastered = true;
        becameMastered = true; // Song completely mastered!
      }
    }
  }

  saveSongProgress(p);
  return { record: p, unlockedNext, becameMastered };
}
