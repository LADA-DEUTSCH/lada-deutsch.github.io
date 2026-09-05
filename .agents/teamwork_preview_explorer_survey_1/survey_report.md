# Technical Survey Report: Beat3DHighway Rhythm Game & Architecture

- **Date**: 2026-09-05
- **Explorer**: teamwork_preview_explorer (Explorer 1)
- **Target File**: `c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\lada-app\src\components\Beat3DHighway.tsx`
- **Target Codebase**: `c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\lada-app`

---

## 1. Executive Summary

`Beat3DHighway.tsx` is an interactive rhythm-learning runner game embedded in `lada-app`. In its current implementation, it uses a 2D HTML5 `<canvas>` rendering loop to project a pseudo-3D cyberpunk highway with perspective lines, moving speed markers, approaching German lyric banners, and dual Darija translation gates.

The codebase is slated for a full **WebGL migration** using React Three Fiber (`@react-three/fiber`), `@react-three/drei`, `@react-three/postprocessing` (Bloom), and Zustand for audio-synchronized state management.

This survey analyzes the complete existing implementation, identifies all game mechanics, math formulas, audio synchronization paths, type contracts, and dependencies, and details the architectural requirements for a clean WebGL migration.

---

## 2. Component Contract & Integration

### 2.1 Interface & Props
Located at `src/components/Beat3DHighway.tsx:20-25`:
```typescript
interface Beat3DHighwayProps {
  song: SongDefinition;
  level: GameDifficultyLevel; // 1 | 2 | 3
  onExit: () => void;
  onLevelComplete?: () => void;
}
```

### 2.2 Parent Components & Invocation Context
`Beat3DHighway` is rendered as the primary rhythm-game screen in two locations:

1. **`src/components/DeutschBeatApp.tsx`** (lines 101–112):
   - Rendered when `activeMode === 'runner'` (Niveau 2: 3D Choice or Niveau 3: Voice Arena).
   - Wrapped inside `<OrientationGuard>` which enforces landscape orientation on mobile devices.
   - Props passed:
     ```tsx
     <Beat3DHighway
       song={activeSong}
       level={activeLevel}
       onExit={handleExitToCatalog}
       onLevelComplete={() => setRefreshKey((k) => k + 1)}
     />
     ```
   *(Note: Niveau 1 "Der Kurs" is rendered separately by `SongCourseLesson.tsx` when `activeMode === 'course'`)*.

2. **`src/components/SongSelectHub.tsx`** (lines 46–55):
   - Rendered when `selectedSong !== null`.
   - Props passed:
     ```tsx
     <Beat3DHighway
       song={selectedSong}
       level={selectedLevel}
       onExit={handleExitGame}
       onLevelComplete={() => setProgressKey((prev) => prev + 1)}
     />
     ```

### 2.3 Container & DOM Layout
- The outer container is a fixed, full-screen viewport (`position: 'fixed'`, `inset: 0`, `zIndex: 100`, `background: '#060813'`).
- The 2D canvas fills 100% width and height, automatically resized via `window.addEventListener('resize')` and `orientationchange`.
- Overlaid above the canvas are:
  - **Top HUD Header** (`z-index: 20`): Exit button, Song title & Number, Difficulty badge (`NIVEAU 2: 3D CHOICE` / `NIVEAU 3: VOICE ARENA`), Score counter, Accuracy %, Fullscreen toggle button, Mute toggle button.
  - **Song Progress Bar** (`z-index: 20`): 3px gradient line indicating percentage of song elapsed.
  - **Combo Streak Badge** (`z-index: 20`): Animated flame pill `COMBO x{combo}` displayed when `combo > 1`.
  - **Voice Prompt Bar** (Level 3 only, `z-index: 20`): Current prompt word (`Qra b sawt 3ali: {currentPromptWord}`), live transcript preview, and browser compatibility warning if Web Speech API is absent.
  - **Two-Thumb Mobile Touch Pads** (Level 2 only, `z-index: 30`): Bottom-left (`← KHIYAR 1`) and bottom-right (`KHIYAR 2 →`) buttons for mobile tapping.
  - **Full-Screen End Game Modal** (`z-index: 50`): Trophy/Award icon, Flawless Run indicator, Final Score, Final Accuracy, Max Combo, Streak progression toward unlocking Level 3 or Mastery Crown, Replay ("3awed") button, and Exit ("Kammel") button.

---

## 3. Data Models & Song Structure

### 3.1 Song Definitions (`src/types/index.ts:151-175`)
```typescript
export interface SongLyricItem {
  id: string;
  german: string;
  phoneticGuide: string;
  darijaCorrect: string;
  darijaDistractor: string;
  timingSec: number;
  durationSec?: number;
  profExplanation?: string;
  phoneticSecret?: string;
  moroccanTrap?: string;
  realDialogue?: RealDialogueSnippet;
}

export interface SongDefinition {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  theme: string;
  tier: string;
  bpm: number;
  instrument: InstrumentType; // 'piano' | 'acoustic_guitar' | 'synthwave' | 'chillhop' | 'funk_bass' | 'moroccan_beat'
  lyrics: SongLyricItem[];
}
```

### 3.2 Active Tile Gameplay Model
During initialization, each `SongLyricItem` is converted into an active gameplay tile:
```typescript
interface ActiveTile {
  lyric: SongLyricItem;
  spawnTime: number;               // Math.max(0, l.timingSec - TRAVEL_TIME_SEC)
  targetTime: number;              // l.timingSec
  correctLane: 0 | 1;              // Randomly assigned 0 (Left) or 1 (Right)
  resolved: boolean;               // true once judged or passed
  userSelectedLane: 0 | 1 | null;  // Lane active at judgment
  result?: 'perfect' | 'miss';
}
```
- **Travel Time**:
  - `TRAVEL_TIME_SEC = level === 1 ? 4.5 : 3.5;`
  - A tile spawns 3.5 seconds prior to its `timingSec`.
- **Lane Assignment**:
  - `correctLane` is randomly assigned (`Math.random() > 0.5 ? 1 : 0`).
  - If `correctLane === 0`:
    - Left Lane (0) displays `lyric.darijaCorrect`
    - Right Lane (1) displays `lyric.darijaDistractor`
  - If `correctLane === 1`:
    - Left Lane (0) displays `lyric.darijaDistractor`
    - Right Lane (1) displays `lyric.darijaCorrect`

---

## 4. Current 2D Pseudo-3D Perspective Math & Rendering Engine

In `Beat3DHighway.tsx:202–545`, the pseudo-3D runway is drawn on a 2D canvas using trigonometric projections and power-law scaling:

### 4.1 Horizon & Perspective Geometry
- Screen dimensions: `w = canvas.width`, `h = canvas.height`
- Center point: `cx = w / 2`
- Horizon line: `horizonY = h * 0.35` (35% from the top)
- Strike / Hit line: `hitY = h * 0.83` (83% from the top)
- Highway trapezoid width:
  - Top (at horizon): `roadTopWidth = w * 0.14`
  - Bottom (screen base): `roadBottomWidth = Math.min(w * 0.88, 1000)`
- Perspective transformation points:
  - `pTopLeft = (cx - roadTopWidth / 2, horizonY)`
  - `pTopRight = (cx + roadTopWidth / 2, horizonY)`
  - `pBottomLeft = (cx - roadBottomWidth / 2, h)`
  - `pBottomRight = (cx + roadBottomWidth / 2, h)`

### 4.2 Highway Visual Elements
1. **Background**: Clear color `#060813` (Deep Matte Carbon).
2. **Horizon Glow**: Linear gradient across `horizonY - 60` to `horizonY + 20` using `rgba(30, 58, 138, 0.18)` and 16 distant stars.
3. **Camera Tilt**:
   - `targetTilt = selectedLane === 0 ? -0.02 : 0.02`
   - Smooth interpolation: `cameraTilt += (targetTilt - cameraTilt) * 0.12`
   - Canvas context rotated around `(cx, horizonY)`.
4. **Screen Shake**:
   - Random jitter `shakeX`, `shakeY` multiplied by `screenShakeRef.current` (decays by `* 0.85` each frame). Triggered with magnitude `5` on hit, `7` on miss.
5. **Highway Surface**: Linear gradient from `#090d1e` to `#0e152e`.
6. **Laser Guide Rails**:
   - Left Rail: `#38bdf8` (Electric Blue, `shadowBlur: 16`) from `pTopLeft` to `pBottomLeft`.
   - Right Rail: `#f59e0b` (Warm Amber, `shadowBlur: 16`) from `pTopRight` to `pBottomRight`.
7. **Center Divider**: Dashed line `[14, 14]` along `x = cx`.
8. **Forward Speed Markers**:
   - 8 speed lines pulsing forward:
     `roadScroll = (roadScroll + (bpm / 60) * 0.045) % 1`
   - Non-linear depth mapping: `lineZ = Math.pow(lineProg, 2.3)`
   - `ly = horizonY + (h - horizonY) * lineZ`
   - `lw = roadTopWidth + (roadBottomWidth - roadTopWidth) * lineZ`
9. **Hit Zone Bar & Indicator Pad**:
   - Glowing neon bar across the highway at `hitY`.
   - Elliptical glowing pad at the player's selected lane center (`cx ± halfLaneWidth`).

### 4.3 Tile Movement & Gate Projection
For each active tile:
- `timeUntilHit = tile.targetTime - songElapsed`
- Linear depth fraction: `zProg = Math.max(0, Math.min(1.2, 1 - timeUntilHit / TRAVEL_TIME_SEC))`
- Non-linear depth projection: `nonLinearZ = Math.pow(zProg, 1.8)`
- Vertical position: `tileY = horizonY + (hitY - horizonY) * nonLinearZ`
- Road width at tile position:
  `currentRoadW = roadTopWidth + (roadBottomWidth - roadTopWidth) * ((tileY - horizonY) / (h - horizonY))`
- Visual scale factor: `scale = 0.4 + 0.6 * nonLinearZ`
- Lane centers:
  - `laneOffset = currentRoadW / 4`
  - Left Gate X: `leftX = cx - laneOffset`
  - Right Gate X: `rightX = cx + laneOffset`
- **Render Elements**:
  - **German Lyric Prompt Banner**: Centered at `(cx, tileY - 44 * scale)`, rounded rectangle, gold border `#facc15`, white text.
  - **Dual Choice Gates**:
    - Left Gate at `leftX, tileY`: Blue border `#38bdf8`, shows Darija translation.
    - Right Gate at `rightX, tileY`: Amber border `#f59e0b`, shows Darija translation.
    - Selected gate receives frosted background fill and `shadowBlur: 20`.

---

## 5. Game Mechanics: Hit Detection, Score, Combo & Voice

### 5.1 Level 2 Hit Judgment
- Hit Window Check:
  ```typescript
  if (timeUntilHit <= 0.05 && !tile.resolved) {
    tile.resolved = true;
    const chosen = selectedLaneRef.current;
    const isCorrect = chosen === tile.correctLane;
    // ...
  }
  ```
  - When `timeUntilHit <= 0.05s` (50ms before crossing strike line):
    - If `chosen === tile.correctLane`: **Perfect Hit**
      - 28 electric blue particles spawned at gate position.
      - `playHitFx(true)` plays dual-sine audio chime (880Hz -> 1320Hz).
      - `speakGermanLyric(tile.lyric.german, false)` invokes Gemini TTS or Web Speech.
      - Screen shake magnitude set to `5`.
    - If `chosen !== tile.correctLane`: **Miss**
      - 16 red particles spawned (`#ef4444`).
      - `playMissFx()` plays descending sawtooth buzzer (140Hz -> 65Hz).
      - Screen shake magnitude set to `7`.
- Auto-Miss for Overdue Tiles:
  - If `timeUntilHit < -0.6 && !tile.resolved`: Marked resolved and registered as a miss.

### 5.2 Level 3 Voice Arena Judgment
- When approaching strike line (`timeUntilHit < 0.9 && timeUntilHit > -0.2`):
  - `setCurrentPromptWord(tile.lyric.german)` displays prompt for speech recognition.
- At hit window (`timeUntilHit <= 0.05 && !tile.resolved`):
  - `evaluation = voiceRaterRef.current?.evaluateTargetWord(tile.lyric.german)`
  - Matches German umlauts, phonetic normalization, and Levenshtein similarity (threshold >= 70%).
  - Perfect hit on voice match; miss on mismatch or silence.
  - Resets transcript for the next prompt.

### 5.3 Score & Combo Formula
- Score calculation:
  ```typescript
  score += 100 + combo * 10;
  combo += 1;
  if (combo > maxCombo) maxCombo = combo;
  if (combo % 5 === 0) audioEngine.playStreakFx(combo);
  ```
- On Miss: `combo = 0`.
- Accuracy calculation:
  ```typescript
  accuracy = Math.round((correctHits / totalHits) * 100);
  ```

### 5.4 Progress & Unlocking Logic (`gameProgressStorage.ts`)
- **Level 1**: Always unlocked. Completion unlocks Level 2.
- **Level 2**: Unlocks Level 3 only after achieving **100% Flawless Accuracy 10 times** (`level2PerfectCount >= 10`).
- **Level 3**: Grants the Mastery Crown when completed with 100% accuracy 10 times (`level3PerfectCount >= 10`).

---

## 6. Audio Architecture & Synchronization Analysis

### 6.1 Audio Engines in the Codebase
There are two audio engine implementations in `src/services/`:
1. `src/services/musicSynthEngine.ts`: Used currently by `Beat3DHighway.tsx`.
2. `src/services/rhythmAudioEngine.ts`: Near-identical engine with Web Audio drum synthesis (kick, snare, hi-hat) and chord synthesis.

### 6.2 Current Timing Implementation Quirks & React Strict Mode Issues
In `Beat3DHighway.tsx`:
```typescript
startTimeRef.current = performance.now() / 1000;
// In requestAnimationFrame loop:
const now = performance.now() / 1000;
const songElapsed = now - startTimeRef.current;
```

**Identified Issues**:
1. **Clock Drift Between Audio & Visuals**:
   The audio rhythm is driven by `window.setInterval(() => playBeatStep(), beatIntervalMs)`. `setInterval` suffers from event loop throttling, micro-delays, and tab inactivity, whereas `performance.now()` continues in real time. Over a 30–60s song, the synthetic audio beats drift away from the tile travel timing.
2. **React Strict Mode Double-Mount**:
   In React 19 Strict Mode development builds, `useEffect` executes `mount -> unmount -> mount`. Because `audioEngine.startSongRhythm()` creates intervals and resumes `AudioContext`, rapid teardown and re-creation can lead to overlapping timers, audio clicks, or `startTimeRef.current` getting reset while AudioContext has already advanced.
3. **State Updater Loop Issues**:
   Calculating `songProgressPct` via React `useState` every frame inside `requestAnimationFrame` forces unnecessary React reconciliation cycles on every render.

### 6.3 Precision Audio Architecture (Solution for R2)
- Audio timing must be anchored to `AudioContext.currentTime`.
- When the song starts:
  `audioStartEpoch = audioContext.currentTime;`
- At any frame (e.g. inside R3F `useFrame` or a high-frequency clock):
  `songElapsed = audioContext.currentTime - audioStartEpoch;`
- Because `AudioContext.currentTime` is the hardware audio clock, visual tile positions `z = f(songElapsed)` remain strictly in sync with the synthesized beat and audio buffer playback, completely independent of React render cycles.

---

## 7. Build System & Package Baseline

### 7.1 Dependencies in `package.json`
```json
{
  "dependencies": {
    "@react-three/drei": "^10.7.8",
    "@react-three/fiber": "^9.7.0",
    "@react-three/postprocessing": "^3.1.1",
    "@types/three": "^0.185.4",
    "lucide-react": "^1.40.0",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "three": "^0.185.1",
    "zustand": "^5.0.15"
  },
  "devDependencies": {
    "typescript": "~6.0.2",
    "vite": "^8.2.2"
  }
}
```

### 7.2 Current Build Baseline & Existing Errors
Running `npm run build` currently fails with code 1 due to compiler errors in an experimental file `src/components/Beat3DHighwayWebGL.tsx`:
1. `src/components/Beat3DHighwayWebGL.tsx(3,29): error TS6133: 'Text3D' is declared but its value is never read.`
2. `src/components/Beat3DHighwayWebGL.tsx(3,37): error TS6133: 'Environment' is declared but its value is never read.`
3. `src/components/Beat3DHighwayWebGL.tsx(10,20): error TS6133: 'delta' is declared but its value is never read.`
4. `src/components/Beat3DHighwayWebGL.tsx(35,21): error TS6133: 'text' is declared but its value is never read.`
5. `src/components/Beat3DHighwayWebGL.tsx(72,25): error TS2322: Type '{ children: Element; disableNormalPass: true; }' is not assignable to type 'IntrinsicAttributes & EffectComposerProps'. Property 'disableNormalPass' does not exist on type 'IntrinsicAttributes & EffectComposerProps'. Did you mean 'enableNormalPass'?`

`tsconfig.app.json` has `"noUnusedLocals": true` and `"noUnusedParameters": true`, meaning all unused variables trigger hard compile errors.

### 7.3 Typography & `<Text3D>` Considerations
- `@react-three/drei`'s `<Text3D>` component requires a Three.js Typeface JSON file (e.g. `/fonts/helvetiker_regular.typeface.json`).
- `lada-app/public/` currently does not have any font JSON files.
- For 3D text rendering, there are two primary approaches:
  1. Provide a standard typeface JSON font in `public/fonts/` for `<Text3D>`.
  2. Use `@react-three/drei`'s `<Text>` component (which uses Troika SDF text and standard TTF/WOFF fonts or defaults with no JSON required), or use `<Text3D>` with a font asset bundled or loaded.
  - Acceptance criterion R1 explicitly specifies: *"falling `<Text3D>` lyrics"*, so a valid typeface font JSON or compatible loader must be included.

---

## 8. State Store Analysis (`src/store/useGameStore.ts`)

Currently, an initial Zustand store exists at `src/store/useGameStore.ts`:
```typescript
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
```
This store provides a clean foundation to be extended with audio clock binding, active tiles resolution, hit callbacks, and screen shake triggers.

---

## 9. Architectural Blueprint for WebGL Migration

```
+-------------------------------------------------------------------------------+
| Beat3DHighway (Root Component)                                                |
| - Controls AudioContext lifecycle (MusicSynthEngine / Web Audio API)         |
| - Manages inputs: Keyboard (A/D/Arrows), Touch Pads, VoiceRater               |
| - Renders fixed HTML HUD overlays (Header, Progress, Combo, Voice, End Modal)|
+-------------------------------------------------------------------------------+
                                      |
         +----------------------------+----------------------------+
         |                                                         |
         v                                                         v
+------------------------------------+   +--------------------------------------+
| useGameStore (Zustand Store)       |   | R3F Canvas Container (<Canvas>)      |
| - Hardware Audio Clock (currentTime|   | - PerspectiveCamera (fov: 60, tilt)  |
| - Score, Combo, Accuracy, Streaks  |   | - Neon Ambient & Directional Lights  |
| - Active Tiles & Lane State        |   | - MovingHighway / Neon Cyber Grid    |
| - Hit Detection Events             |   | - 3D Lane Rails & Glowing Strike Line|
+------------------------------------+   | - 3D Choice Gates (Frosted Glass Mesh|
                                         | - 3D Lyric Texts (<Text3D>)          |
                                         | - 3D Particle Bursts                 |
                                         | - Postprocessing (Bloom)             |
                                         +--------------------------------------+
```

### Key R3F Highway Parameters
- **World Coordinates**:
  - Strike Line / Hit Zone: `Z = 0`
  - Highway spawn distance: `Z = -60` to `-80`
  - Left Lane: `X = -2.5`
  - Right Lane: `X = +2.5`
  - Camera: `position = [0, 2.5, 6]`, looking toward `[0, 1.2, -15]` with dynamic camera tilt on lane change (`camera.rotation.z` lerping).
- **Postprocessing**:
  - `<EffectComposer>`
  - `<Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} />`
  - Glowing materials use `meshStandardMaterial` with `emissive` color and `toneMapped={false}`.

---

## 10. Conclusion & Recommendations for Implementers

1. **Audio Precision**: Drive all rhythm animations directly from `AudioContext.currentTime`. Do not rely on `performance.now()` in React state.
2. **Type Safety**: Strictly adhere to `tsconfig.app.json` (no unused parameters/variables, correct props for `@react-three/postprocessing`).
3. **Typography**: Ensure a typeface font JSON is available in `public/fonts/` for `<Text3D>`.
4. **Preserve Educational Mechanics**: Keep all Level 2 translation choice gating, Level 3 VoiceRater evaluation, and Moroccan Darija streaks completely intact.
