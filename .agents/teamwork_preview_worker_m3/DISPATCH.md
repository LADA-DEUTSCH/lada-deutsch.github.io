# Dispatch Assignment: Worker 3 (Milestone 3: Full Beat3DHighway.tsx UI Integration & Build Validation)

- Role: teamwork_preview_worker
- Working Directory: c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\.agents\teamwork_preview_worker_m3
- Target Codebase: c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\lada-app
- Original Request File: c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\.agents\ORIGINAL_REQUEST.md
- Project Architecture Document: c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\.agents\teamwork_preview_orchestrator_1\PROJECT.md
- Milestone 1 Handoff: c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\.agents\teamwork_preview_worker_m1\handoff.md
- Milestone 2 Handoff: c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\.agents\teamwork_preview_worker_m2\handoff.md

## Scope of File Ownership
You exclusively own and may modify:
- `src/components/Beat3DHighway.tsx`
- `src/components/Beat3DHighwayWebGL.tsx`

## Objectives
1. Read `ORIGINAL_REQUEST.md`, `PROJECT.md`, and the handoff reports from Milestone 1 and Milestone 2.
2. Replace the legacy 2D canvas pseudo-3D engine in `src/components/Beat3DHighway.tsx` with the true React Three Fiber `<HighwayScene>` from `./highway`.
   - Remove ALL raw 2D `ctx.scale`, `ctx.translate`, `ctx.beginPath`, `ctx.moveTo`, `ctx.lineTo`, and manual 2D trapezoid rendering logic.
   - Retain exact interface:
     ```typescript
     export interface Beat3DHighwayProps {
       song: SongDefinition;
       level: GameDifficultyLevel;
       onExit: () => void;
       onLevelComplete?: () => void;
     }
     ```
   - Retain all essential game features and HUD:
     - Top Navigation Header: Exit button, Song Title, Subtitle, BPM badge, Difficulty badge, Audio mute/unmute, Fullscreen toggle.
     - Cyber HUD: Live Score, Combo counter, Multiplier badge (1x-4x), Accuracy percentage, Max Combo, Streak counter.
     - Hit Feedback Banner: Animated floating feedback (PERFECT, GOOD, MISS) driven by `useRhythmGameStore`.
     - Mobile / Touch On-Screen Controls: Left Lane button, Right Lane button, Strike/Hit button, with active lane highlight.
     - Level 2 Translation Gate HUD: Current German prompt and phonetic guide.
     - Level 3 Voice Arena: VoiceRater integration for speech recognition if level === 3.
     - Level Complete / Game Over Modal: Results summary with score, stars (1-3 stars), accuracy %, max combo, Retry button, and Continue button calling `onLevelComplete`.
3. Resolve `src/components/Beat3DHighwayWebGL.tsx`:
   - Either make it a clean re-export of `Beat3DHighway`:
     ```tsx
     export { Beat3DHighway as Beat3DHighwayWebGL, default } from './Beat3DHighway';
     ```
     or update it to cleanly render `HighwayScene` with zero unused variables and zero TypeScript errors.
4. Mandatory Acceptance Criteria & Compilation Verification:
   - Run `npm run build` (`tsc -b && vite build`) in `lada-app`.
   - It MUST exit with code 0 (no TypeScript or Vite build errors).
   - Run `npm run lint` (`oxlint`) and confirm 0 errors.
5. Write a comprehensive handoff report to `c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\.agents\teamwork_preview_worker_m3\handoff.md`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY INTEGRITY WARNING51: 
## 2026-09-05T08:40:48Z
Task: Implement Milestone 3 (Full UI Integration into Beat3DHighway.tsx & Build Validation):
1. In src/components/Beat3DHighway.tsx, completely replace the 1,164-line 2D canvas pseudo-3D engine with the true React Three Fiber 3D engine using HighwayScene from ./highway.
   - Completely remove all 2D ctx canvas rendering calls.
   - Retain exact interface Beat3DHighwayProps: (song, level, onExit, onLevelComplete).
   - Integrate with useRhythmGameStore and rhythmAudioEngine.
   - Maintain top navigation bar, score/combo/multiplier HUD, hit feedback banners, mobile controls, Level 2 prompt, Level 3 VoiceRater, and game completion summary modal.
2. Resolve src/components/Beat3DHighwayWebGL.tsx so that it no longer contains TypeScript errors (e.g. clean re-export of Beat3DHighway or clean wrapper).
3. Verify compilation: Run npm run build (tsc -b && vite build) and ensure exit code 0!
4. Verify linting: Run npm run lint (oxlint) and ensure 0 errors.
5. Write a comprehensive, self-contained handoff.md in your working directory.
