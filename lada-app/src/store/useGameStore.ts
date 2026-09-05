import { create } from 'zustand';

interface GameState {
  score: number;
  combo: number;
  maxCombo: number;
  accuracy: number;
  isMuted: boolean;
  isPlaying: boolean;
  songElapsed: number;
  currentLane: 0 | 1;
  addScore: (points: number) => void;
  resetCombo: () => void;
  setLane: (lane: 0 | 1) => void;
  setPlaying: (playing: boolean) => void;
  updateTime: (delta: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
  score: 0,
  combo: 0,
  maxCombo: 0,
  accuracy: 100,
  isMuted: false,
  isPlaying: false,
  songElapsed: 0,
  currentLane: 0,
  
  addScore: (points) => set((state) => {
    const newCombo = state.combo + 1;
    return {
      score: state.score + points,
      combo: newCombo,
      maxCombo: Math.max(state.maxCombo, newCombo)
    };
  }),
  resetCombo: () => set({ combo: 0 }),
  setLane: (lane) => set({ currentLane: lane }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  updateTime: (delta) => set((state) => ({ songElapsed: state.songElapsed + delta }))
}));
