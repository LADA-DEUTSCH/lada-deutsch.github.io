# Dispatch Assignment: Worker 1 (Milestone 1: Game Logic & Precision Web Audio Store)

- Role: teamwork_preview_worker
- Working Directory: c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\.agents\teamwork_preview_worker_m1
- Target Codebase: c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\lada-app
- Original Request File: c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\.agents\ORIGINAL_REQUEST.md
- Project Scope Document: c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\.agents\teamwork_preview_orchestrator_1\PROJECT.md

## Scope of File Ownership
You exclusively own and may create/modify:
- `public/fonts/helvetiker_regular.typeface.json` (deploy font from `node_modules/stats-gl/node_modules/three/examples/fonts/helvetiker_regular.typeface.json`)
- `src/services/rhythmAudioEngine.ts` (Web Audio API precision hardware clock & lookahead scheduler)
- `src/store/useRhythmGameStore.ts` (Precision Zustand store for game state, hits, scores, lanes)

## Objectives
1. Read `ORIGINAL_REQUEST.md` and `PROJECT.md` completely.
2. Deploy the 3D font: Copy `node_modules/stats-gl/node_modules/three/examples/fonts/helvetiker_regular.typeface.json` into `public/fonts/helvetiker_regular.typeface.json`.
3. Implement `src/services/rhythmAudioEngine.ts`:
   - Hardware-anchored `AudioContext.currentTime` clock.
   - Lookahead beat scheduler (Chris Wilson pattern, 25ms tick, 100ms lookahead).
   - Audio synthesis / playback for song chords and notes.
   - Sound FX synthesis: `playHitFx(accuracy: 'perfect' | 'good')`, `playMissFx()`, `playStreakFx()`, `playLaneSwitchFx()`.
   - Method `getCurrentAudioTime(): number` returning relative song playback time in seconds.
   - Resilient against React 19 Strict Mode double-render / double-mount (singleton or cleanup safety on stop/restart).
4. Implement `src/store/useRhythmGameStore.ts`:
   - Zustand store matching the interface in `PROJECT.md § Interface Contracts`.
   - Score, combo, maxCombo, streak, multiplier, accuracy percentage.
   - Selected lane (0 or 1).
   - Active falling tiles management: spawn, track, evaluate hit windows (Perfect <= 80ms, Good <= 160ms, Miss > 160ms).
   - Actions: `setLane`, `switchLane`, `registerHit`, `spawnTilesFromSong`, `resetGame`, `tickAudioTime`.
5. TypeScript & Strict Compliance:
   - Must use `import type` for type-only imports (satisfies `verbatimModuleSyntax`).
   - Zero unused variables / parameters (satisfies `noUnusedLocals` and `noUnusedParameters`).
6. Verification:
   - Worker must run typecheck / build tests on the implemented files.
7. Deliver a detailed handoff report in `c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\.agents\teamwork_preview_worker_m1\handoff.md`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-05T08:24:33Z
You are Worker 1 (teamwork_preview_worker).
Your working directory is: c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\.agents\teamwork_preview_worker_m1\
The target codebase is: c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\lada-app
The original request file is at: c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\.agents\ORIGINAL_REQUEST.md
The project architecture is at: c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\.agents\teamwork_preview_orchestrator_1\PROJECT.md
Your dispatch instructions are at: c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\.agents\teamwork_preview_worker_m1\DISPATCH.md

MANDATORY: You MUST read c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\.agents\ORIGINAL_REQUEST.md first.

Task: Implement Milestone 1 (Game Logic, Precision Web Audio Store & Font Assets):
1. Copy node_modules/stats-gl/node_modules/three/examples/fonts/helvetiker_regular.typeface.json into public/fonts/helvetiker_regular.typeface.json in lada-app.
2. Implement src/services/rhythmAudioEngine.ts with hardware AudioContext.currentTime, Chris Wilson lookahead beat scheduler, synth engine, sound FX, and relative time clock. Handle React StrictMode safely.
3. Implement src/store/useRhythmGameStore.ts with Zustand: lane selection, tile spawning from SongDefinition, hit evaluation (Perfect <=80ms, Good <=160ms, Miss >160ms), combo/streak/score tracking, and hit feedback.
4. Adhere strictly to verbatimModuleSyntax (use import type) and zero unused variables.
5. Verify your implementation by running builds/tests in lada-app.
6. Write a comprehensive, self-contained handoff.md in your working directory.

