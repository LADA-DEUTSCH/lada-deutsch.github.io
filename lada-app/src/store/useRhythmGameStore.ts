import { create } from 'zustand';
import type { SongDefinition, GameDifficultyLevel } from '../types';

export interface ActiveHighwayTile {
  id: string;
  targetTime: number; // in audioContext seconds
  germanText: string;
  phonetic?: string;
  translationDarija?: string;
  correctLane: 0 | 1;
  options?: [string, string]; // Darija translation choices for Level 2 [lane0, lane1]
  resolved: boolean;
  hitAccuracy?: 'perfect' | 'good' | 'miss';
}

export interface HitFeedback {
  text: string;
  color: string;
  timestamp: number;
}

export interface RhythmGameState {
  // Score & Performance Metrics
  score: number;
  combo: number;
  maxCombo: number;
  streak: number;
  multiplier: number;
  accuracy: number;
  totalHits: number;
  perfectHits: number;
  goodHits: number;
  missHits: number;

  // Lane & Tiles
  selectedLane: 0 | 1;
  activeTiles: ActiveHighwayTile[];

  // Time & Playback
  currentAudioTime: number;
  isPlaying: boolean;
  isPaused: boolean;

  // Visual Hit Feedback Banner
  hitFeedback: HitFeedback | null;

  // Actions
  setLane: (lane: 0 | 1) => void;
  switchLane: () => void;
  registerHit: (tileId: string, accuracy: 'perfect' | 'good' | 'miss') => void;
  evaluateTileHit: (playerLane?: 0 | 1) => { tile: ActiveHighwayTile; accuracy: 'perfect' | 'good' | 'miss' } | null;
  spawnTilesFromSong: (song: SongDefinition, level?: GameDifficultyLevel) => void;
  resetGame: () => void;
  tickAudioTime: (time: number) => void;
  setPlaying: (isPlaying: boolean) => void;
  setPaused: (isPaused: boolean) => void;
  clearHitFeedback: () => void;
}

// Precision hit timing windows (in seconds)
export const HIT_WINDOW_PERFECT = 0.080; // <= 80ms
export const HIT_WINDOW_GOOD = 0.160;    // <= 160ms
export const HIT_WINDOW_EPSILON = 0.0005; // 0.5ms tolerance for IEEE-754 float precision

/**
 * Multiplier curve based on current combo:
 * 1-4 combo: 1x
 * 5-9 combo: 2x
 * 10-19 combo: 3x
 * 20+ combo: 4x
 */
export function calculateMultiplier(combo: number): number {
  if (combo >= 20) return 4;
  if (combo >= 10) return 3;
  if (combo >= 5) return 2;
  return 1;
}

const INITIAL_STATE = {
  score: 0,
  combo: 0,
  maxCombo: 0,
  streak: 0,
  multiplier: 1,
  accuracy: 100,
  totalHits: 0,
  perfectHits: 0,
  goodHits: 0,
  missHits: 0,
  selectedLane: 0 as 0 | 1,
  activeTiles: [] as ActiveHighwayTile[],
  currentAudioTime: 0,
  isPlaying: false,
  isPaused: false,
  hitFeedback: null as HitFeedback | null
};

export const useRhythmGameStore = create<RhythmGameState>((set, get) => ({
  ...INITIAL_STATE,

  setLane: (lane: 0 | 1) => {
    set({ selectedLane: lane });
  },

  switchLane: () => {
    set((state) => ({ selectedLane: state.selectedLane === 0 ? 1 : 0 }));
  },

  registerHit: (tileId: string, accuracy: 'perfect' | 'good' | 'miss') => {
    set((state) => {
      const tileIndex = state.activeTiles.findIndex((t) => t.id === tileId);
      if (tileIndex === -1) return state;
      const tile = state.activeTiles[tileIndex];
      if (tile.resolved) return state;

      const updatedTiles = [...state.activeTiles];
      updatedTiles[tileIndex] = {
        ...tile,
        resolved: true,
        hitAccuracy: accuracy
      };

      let newCombo = state.combo;
      let newStreak = state.streak;
      let newScore = state.score;
      let perfectHits = state.perfectHits;
      let goodHits = state.goodHits;
      let missHits = state.missHits;
      let feedback: HitFeedback | null = null;

      if (accuracy === 'perfect') {
        newCombo += 1;
        newStreak += 1;
        perfectHits += 1;
        const mult = calculateMultiplier(newCombo);
        newScore += 1000 * mult;
        feedback = { text: 'PERFECT!', color: '#38bdf8', timestamp: Date.now() };
      } else if (accuracy === 'good') {
        newCombo += 1;
        newStreak += 1;
        goodHits += 1;
        const mult = calculateMultiplier(newCombo);
        newScore += 500 * mult;
        feedback = { text: 'GOOD!', color: '#10b981', timestamp: Date.now() };
      } else {
        newCombo = 0;
        newStreak = 0;
        missHits += 1;
        feedback = { text: 'MISS', color: '#ef4444', timestamp: Date.now() };
      }

      const maxCombo = Math.max(state.maxCombo, newCombo);
      const multiplier = calculateMultiplier(newCombo);
      const totalJudged = perfectHits + goodHits + missHits;
      const accuracyPct = totalJudged > 0
        ? Math.round(((perfectHits * 1.0 + goodHits * 0.5) / totalJudged) * 100)
        : 100;

      return {
        activeTiles: updatedTiles,
        score: newScore,
        combo: newCombo,
        maxCombo,
        streak: newStreak,
        multiplier,
        accuracy: accuracyPct,
        totalHits: totalJudged,
        perfectHits,
        goodHits,
        missHits,
        hitFeedback: feedback
      };
    });
  },

  evaluateTileHit: (playerLane) => {
    const state = get();
    const lane = playerLane !== undefined ? playerLane : state.selectedLane;
    const currentTime = state.currentAudioTime;

    // Search for closest unresolved tile within the Good hit window (160ms)
    let candidate: ActiveHighwayTile | null = null;
    let candidateDiff = Infinity;

    for (const tile of state.activeTiles) {
      if (tile.resolved) continue;
      const diff = Math.abs(currentTime - tile.targetTime);
      if (diff <= HIT_WINDOW_GOOD + HIT_WINDOW_EPSILON && diff < candidateDiff) {
        candidate = tile;
        candidateDiff = diff;
      }
    }

    if (!candidate) {
      return null;
    }

    const isCorrectLane = candidate.correctLane === lane;
    const accuracy: 'perfect' | 'good' | 'miss' = !isCorrectLane
      ? 'miss'
      : candidateDiff <= HIT_WINDOW_PERFECT + HIT_WINDOW_EPSILON
        ? 'perfect'
        : 'good';

    state.registerHit(candidate.id, accuracy);
    return { tile: candidate, accuracy };
  },

  spawnTilesFromSong: (song: SongDefinition, _level?: GameDifficultyLevel) => {
    const tiles: ActiveHighwayTile[] = song.lyrics.map((lyric, idx) => {
      // Alternate lanes for dynamic dual-track steering
      const correctLane: 0 | 1 = idx % 2 === 0 ? 0 : 1;
      const options: [string, string] = correctLane === 0
        ? [lyric.darijaCorrect, lyric.darijaDistractor]
        : [lyric.darijaDistractor, lyric.darijaCorrect];

      return {
        id: lyric.id || `tile-${idx}`,
        targetTime: lyric.timingSec,
        germanText: lyric.german,
        phonetic: lyric.phoneticGuide,
        translationDarija: lyric.darijaCorrect,
        correctLane,
        options,
        resolved: false
      };
    });

    set({
      ...INITIAL_STATE,
      activeTiles: tiles,
      isPlaying: true
    });
  },

  resetGame: () => {
    set({ ...INITIAL_STATE });
  },

  tickAudioTime: (time: number) => {
    set((state) => {
      // Fast check to avoid unnecessary array mapping when no tiles expired
      const hasExpired = state.activeTiles.some(
        (t) => !t.resolved && time - t.targetTime > HIT_WINDOW_GOOD + HIT_WINDOW_EPSILON
      );
      if (!hasExpired) {
        return { currentAudioTime: time };
      }

      // Find unresolved tiles that passed the hit window without being struck
      let missedCount = 0;
      const updatedTiles = state.activeTiles.map((tile) => {
        if (!tile.resolved && time - tile.targetTime > HIT_WINDOW_GOOD + HIT_WINDOW_EPSILON) {
          missedCount++;
          return {
            ...tile,
            resolved: true,
            hitAccuracy: 'miss' as const
          };
        }
        return tile;
      });

      const missHits = state.missHits + missedCount;
      const totalJudged = state.perfectHits + state.goodHits + missHits;
      const accuracyPct = totalJudged > 0
        ? Math.round(((state.perfectHits * 1.0 + state.goodHits * 0.5) / totalJudged) * 100)
        : 100;

      return {
        currentAudioTime: time,
        activeTiles: updatedTiles,
        combo: 0,
        streak: 0,
        multiplier: 1,
        missHits,
        totalHits: totalJudged,
        accuracy: accuracyPct,
        hitFeedback: { text: 'MISS', color: '#ef4444', timestamp: Date.now() }
      };
    });
  },

  setPlaying: (isPlaying: boolean) => {
    set({ isPlaying });
  },

  setPaused: (isPaused: boolean) => {
    set({ isPaused });
  },

  clearHitFeedback: () => {
    set({ hitFeedback: null });
  }
}));

export default useRhythmGameStore;
