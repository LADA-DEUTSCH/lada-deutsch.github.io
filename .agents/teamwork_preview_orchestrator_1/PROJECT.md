# Project: Beat3DHighway WebGL 3D Rhythm Game Overhaul

## Architecture
```
                                ┌────────────────────────────────────────────────────────┐
                                │             Beat3DHighway.tsx (Main Container)         │
                                ├───────────────────────────┬────────────────────────────┤
                                │ 2D HTML/Tailwind HUD & UI │ R3F <Canvas> 3D Viewport   │
                                └─────────────┬─────────────┴─────────────┬──────────────┘
                                              │                           │
                                              ▼                           ▼
                        ┌──────────────────────────────┐        ┌─────────────────────────────┐
                        │  Zustand Rhythm Game Store   │        │     HighwayScene.tsx        │
                        │  - score, combo, streak      │        ├─────────────────────────────┤
                        │  - selectedLane (0 or 1)     │◄───────┤ - HighwayRoad (neon rails)  │
                        │  - activeTiles & hitResults  │        │ - FallingLyrics3D (Text3D)  │
                        │  - gameStatus & difficulty   │        │ - ChoiceGates3D (frosted)   │
                        └──────────────┬───────────────┘        │ - PlayerHoverDisc           │
                                       │                        │ - HitZoneGlow & Particles   │
                                       ▼                        │ - Postprocessing (Bloom)    │
                        ┌──────────────────────────────┐        └─────────────────────────────┘
                        │    RhythmAudioEngine (Web    │
                        │          Audio API)          │
                        │ - AudioContext.currentTime   │
                        │ - Chris Wilson Lookahead     │
                        │ - Zero-drift beat clock      │
                        └──────────────────────────────┘
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Precision Web Audio Clock | Hardware-anchored `AudioContext.currentTime` beat scheduler eliminating clock drift | M1 | ORIGINAL_REQUEST §R2 |
| F2 | Zustand Rhythm Store | Decoupled reactive game state for score, streak, combo, lane, and active tiles | M1 | ORIGINAL_REQUEST §R2 |
| F3 | Font Asset Pipeline | Deploy typeface JSON font to `public/fonts/` for Drei `<Text3D>` extrusion | M1 | Explorer 2 Survey |
| F4 | R3F 3D Highway & Neon Rails | True 3D highway with perspective, dual lanes ($X = \pm 2.2$), strike line at $Z = 0$ | M2 | ORIGINAL_REQUEST §R1 |
| F5 | Falling Text3D Lyrics | 3D German lyrics falling down the highway synchronized to audio time | M2 | ORIGINAL_REQUEST §R1 |
| F6 | Frosted Glass Choice Gates | Level 2 dual translation gates (Darija) with cyber-glassmorphism shader/materials | M2 | ORIGINAL_REQUEST §R1 |
| F7 | Postprocessing Neon Bloom | `@react-three/postprocessing` with `EffectComposer` & `Bloom` (`enableNormalPass={false}`) | M2 | ORIGINAL_REQUEST §R3 |
| F8 | Dynamic Lighting & Hit FX | Emissive glowing hit zones, player hover craft, particle explosion sparks on hit | M2 | ORIGINAL_REQUEST §R3 |
| F9 | Beat3DHighway.tsx Integration | Replace 1,164-line 2D canvas with R3F `<Canvas>`, wire HUD, controls, Level 3 voice | M3 | ORIGINAL_REQUEST §R1, R2, R3 |
| F10 | Clean Build & Type Safety | Fix `Beat3DHighwayWebGL.tsx` prototype, satisfy strict tsconfig, `npm run build` exits 0 | M3 | ORIGINAL_REQUEST Acceptance |
| F11 | Multi-Agent Review & Challenge | 2 Reviewers + 2 Challengers verify correctness, strict mode resilience, audio sync | M4 | Quality Gates |
| F12 | Forensic Integrity Audit | Binary veto audit ensuring no dummy facades, no hardcoded results | M4 | Integrity Gate |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Game Logic & Precision Web Audio Store | `src/services/rhythmAudioEngine.ts`, `src/store/useRhythmGameStore.ts`, `public/fonts/helvetiker_regular.typeface.json` | none | DONE |
| M2 | 3D Highway, Text3D & Cyber Shaders | `src/components/highway/HighwayScene.tsx`, `HighwayRoad.tsx`, `FallingLyricTile3D.tsx`, `ChoiceGate3D.tsx`, `PlayerDisc3D.tsx`, `HighwayEffects.tsx` | M1 | DONE |
| M3 | Full Beat3DHighway.tsx UI Integration & Build Validation | `src/components/Beat3DHighway.tsx`, remove/refactor legacy prototype `Beat3DHighwayWebGL.tsx`, verify `npm run build` exits 0 | M1, M2 | DONE |
| M4 | Independent Review, Stress Testing & Forensic Audit | Verification by 2 Reviewers, 2 Challengers, and 1 Forensic Auditor | M3 | IN_PROGRESS |

## Interface Contracts
### M1 ↔ M2, M3: RhythmAudioEngine & Zustand Store
```typescript
export interface ActiveHighwayTile {
  id: string;
  targetTime: number; // in audioContext seconds
  germanText: string;
  phonetic?: string;
  translationDarija?: string;
  correctLane: 0 | 1;
  options?: [string, string]; // Darija translation choices for Level 2
  resolved: boolean;
  hitAccuracy?: 'perfect' | 'good' | 'miss';
}

export interface RhythmGameState {
  score: number;
  combo: number;
  maxCombo: number;
  streak: number;
  selectedLane: 0 | 1;
  activeTiles: ActiveHighwayTile[];
  currentAudioTime: number;
  isPlaying: boolean;
  isPaused: boolean;
  hitFeedback: { text: string; color: string; timestamp: number } | null;
  // Actions
  setLane: (lane: 0 | 1) => void;
  registerHit: (tileId: string, accuracy: 'perfect' | 'good' | 'miss') => void;
  resetGame: () => void;
  tickAudioTime: (time: number) => void;
}
```

### M2 ↔ M3: HighwayScene Props
```typescript
export interface HighwaySceneProps {
  song: SongDefinition;
  level: GameDifficultyLevel;
  selectedLane: 0 | 1;
  onHit: (tileId: string, accuracy: 'perfect' | 'good' | 'miss') => void;
  onLaneChange: (lane: 0 | 1) => void;
  audioEngine: IRhythmAudioEngine;
}
```

### M3 ↔ Parent Views (DeutschBeatApp & SongSelectHub)
```typescript
export interface Beat3DHighwayProps {
  song: SongDefinition;
  level: GameDifficultyLevel;
  onExit: () => void;
  onLevelComplete?: () => void;
}
```

## Code Layout
```
lada-app/
├── public/
│   └── fonts/
│       └── helvetiker_regular.typeface.json  # 3D Font for Text3D
├── src/
│   ├── services/
│   │   └── rhythmAudioEngine.ts              # Hardware-anchored Web Audio clock & sound FX
│   ├── store/
│   │   └── useRhythmGameStore.ts             # Precision Zustand store
│   ├── components/
│   │   ├── highway/
│   │   │   ├── HighwayScene.tsx              # Main R3F Canvas & Scene coordinator
│   │   │   ├── HighwayRoad.tsx               # 3D neon grid highway & laser lane boundaries
│   │   │   ├── FallingLyricTile3D.tsx        # <Text3D> extruded lyric mesh & hit detection
│   │   │   ├── ChoiceGate3D.tsx              # Frosted glass cyberpunk translation gates
│   │   │   ├── PlayerDisc3D.tsx              # Cyberpunk hover disc indicator
│   │   │   └── HighwayEffects.tsx            # EffectComposer, Bloom, dynamic point lights
│   │   └── Beat3DHighway.tsx                 # Top-level game screen (R3F Canvas + HUD + Modal)
```
