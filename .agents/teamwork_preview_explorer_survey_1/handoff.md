# Handoff Report: Beat3DHighway Codebase Survey

## 1. Observation
- **Core Component File**: `src/components/Beat3DHighway.tsx` (1,164 lines).
  - Uses an HTML5 2D `<canvas>` element (lines 868–878).
  - Main 2D rendering loop in `useEffect` (lines 202–545) projecting a pseudo-3D road trapezoid with `ctx.beginPath()`, `ctx.moveTo()`, `ctx.lineTo()`, and manual perspective scaling `scale = 0.4 + 0.6 * nonLinearZ` (lines 394).
  - Timer and clock synchronization driven by `performance.now() / 1000` (lines 157, 216).
  - Dual lanes: `selectedLane` 0 (left) or 1 (right) toggled by Arrow keys, A/D, touch screen, or bottom HUD buttons (lines 106–128, 914, 948).
  - Tile hit evaluation at line 435: `if (timeUntilHit <= 0.05 && !tile.resolved)` checking whether `selectedLaneRef.current === tile.correctLane`.
  - Level 3 voice evaluation at line 489: `voiceRaterRef.current?.evaluateTargetWord(tile.lyric.german)`.
  - Audio synthesizer: `MusicSynthEngine` instantiated in `useEffect` (line 132), running `window.setInterval` for beat playback.
- **Component Invocation Context**:
  - `src/components/DeutschBeatApp.tsx` (lines 104–109):
    ```tsx
    <Beat3DHighway
      song={activeSong}
      level={activeLevel}
      onExit={handleExitToCatalog}
      onLevelComplete={() => setRefreshKey((k) => k + 1)}
    />
    ```
  - `src/components/SongSelectHub.tsx` (lines 48–53):
    ```tsx
    <Beat3DHighway
      song={selectedSong}
      level={selectedLevel}
      onExit={handleExitGame}
      onLevelComplete={() => setProgressKey((prev) => prev + 1)}
    />
    ```
- **Existing WebGL Prototype**:
  - `src/components/Beat3DHighwayWebGL.tsx` (79 lines).
- **Compilation Failure**:
  - Command: `npm run build` (`tsc -b && vite build`) in `c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\lada-app`.
  - Exited with code 1 with the following verbatim errors:
    ```
    src/components/Beat3DHighwayWebGL.tsx(3,29): error TS6133: 'Text3D' is declared but its value is never read.
    src/components/Beat3DHighwayWebGL.tsx(3,37): error TS6133: 'Environment' is declared but its value is never read.
    src/components/Beat3DHighwayWebGL.tsx(10,20): error TS6133: 'delta' is declared but its value is never read.
    src/components/Beat3DHighwayWebGL.tsx(35,21): error TS6133: 'text' is declared but its value is never read.
    src/components/Beat3DHighwayWebGL.tsx(72,25): error TS2322: Type '{ children: Element; disableNormalPass: true; }' is not assignable to type 'IntrinsicAttributes & EffectComposerProps'.
      Property 'disableNormalPass' does not exist on type 'IntrinsicAttributes & EffectComposerProps'. Did you mean 'enableNormalPass'?
    ```
  - `Beat3DHighway.tsx` itself has zero TypeScript errors; the errors originate strictly from the unintegrated `Beat3DHighwayWebGL.tsx` prototype.
- **Store & Audio Services**:
  - `src/store/useGameStore.ts` contains an initial Zustand store (lines 19–41).
  - `src/services/musicSynthEngine.ts` and `src/services/rhythmAudioEngine.ts` provide Web Audio synthesis and sound FX (`playHitFx`, `playMissFx`, `playStreakFx`).
- **3D Font Assets**:
  - `lada-app/public/` currently contains only `favicon.svg` and `icons.svg`. No typeface JSON font exists yet for `@react-three/drei`'s `<Text3D>`.

## 2. Logic Chain
1. *From Component Observation*: `Beat3DHighway.tsx` defines the entire game interface (`Beat3DHighwayProps`, HUD, score, combo, accuracy, streak, fullscreen, mute, Level 2 choice gates, Level 3 speech recognition, end game summary modal).
2. *From Parent Observation*: Both parents (`DeutschBeatApp` and `SongSelectHub`) depend strictly on the interface `(song, level, onExit, onLevelComplete)`. Any WebGL replacement matching this interface will integrate seamlessly without breaking existing parents.
3. *From Audio & Clock Observation*: `performance.now()` in React effects drifts from `window.setInterval` in `MusicSynthEngine`, and React 19 Strict Mode double-mounts reset `startTimeRef` while the audio context is already ticking. Therefore, anchoring the clock directly to `AudioContext.currentTime` (or a Zustand store synchronized to `AudioContext.currentTime`) is necessary and sufficient to eliminate desynchronization and double-render glitches.
4. *From Build Error Observation*: The project's TypeScript configuration (`tsconfig.app.json`) enforces `"noUnusedLocals": true` and `"noUnusedParameters": true`. In addition, `@react-three/postprocessing` expects `enableNormalPass?: boolean` rather than `disableNormalPass`. All code written for the R3F migration must strictly avoid unused variables/imports and use valid props to guarantee a clean build (`npm run build` exit code 0).
5. *From Asset Observation*: Because `<Text3D>` from `@react-three/drei` requires a typeface font JSON file, either a standard JSON font must be added to `public/fonts/` or `@react-three/drei`'s `<Text>` (SDF text rendering) must be used.

## 3. Caveats
- Audio output was analyzed statically and through the Web Audio API method signatures; live browser audio playback was not listened to in an active browser session.
- Safari/Firefox Web Speech API limitations are handled in Level 3 with a warning banner, which remains browser-dependent.
- No other caveats.

## 4. Conclusion
The survey of `Beat3DHighway.tsx` and all related files is complete. The component's mathematical projection, state flow, hit detection, audio coupling, and container interface have been thoroughly documented in `survey_report.md`. The path for WebGL migration using React Three Fiber, Zustand, and Web Audio API is clearly established and ready for implementation.

## 5. Verification Method
- Inspect the survey report at `c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\.agents\teamwork_preview_explorer_survey_1\survey_report.md`.
- Verify the build failure by running:
  ```powershell
  cd "c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\lada-app"
  npm run build
  ```
  Check that errors correspond to `src/components/Beat3DHighwayWebGL.tsx:3, 10, 35, 72`.
- Invalidation conditions: If `Beat3DHighwayProps` is altered or if parent components expect different props, the integration interface would be invalidated.
