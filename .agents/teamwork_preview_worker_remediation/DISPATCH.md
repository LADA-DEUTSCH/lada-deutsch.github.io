# Dispatch Assignment: Worker 4 (Remediation: IEEE-754 Hit Window Precision & German Umlaut 3D Font)

- Role: teamwork_preview_worker
- Working Directory: c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\.agents\teamwork_preview_worker_remediation
- Target Codebase: c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\lada-app
- Original Request File: c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\.agents\ORIGINAL_REQUEST.md
- Project Architecture Document: c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\.agents\teamwork_preview_orchestrator_1\PROJECT.md
- Challenger 1 Handoff: c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\.agents\teamwork_preview_challenger_1\handoff.md
- Challenger 2 Handoff: c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\.agents\teamwork_preview_challenger_2\handoff.md

## Scope of File Ownership
You may modify:
- `src/store/useRhythmGameStore.ts`
- `public/fonts/` (deploy `droid_sans_regular.typeface.json`)
- `src/components/highway/FallingLyricTile3D.tsx` (if updating font path)

## Objectives
1. Read `ORIGINAL_REQUEST.md`, Challenger 1 handoff, and Challenger 2 handoff.
2. Fix IEEE-754 Boundary Precision in `src/store/useRhythmGameStore.ts`:
   - Challenger 1 identified that raw float arithmetic (e.g. `5.080 - 5.000 = 0.08000000000000007`) caused exact 80ms hits to evaluate as >0.080 (demoted to 'good') and exact 160ms hits to evaluate as >0.160 (null/miss).
   - Implement `export const HIT_WINDOW_EPSILON = 0.001; // 1ms tolerance for IEEE-754 float precision`.
   - Update `evaluateTileHit`:
     - `if (timeUntilHit <= HIT_WINDOW_GOOD + HIT_WINDOW_EPSILON)`
     - `if (diff <= HIT_WINDOW_PERFECT + HIT_WINDOW_EPSILON)`
   - Update `tickAudioTime`:
     - `if (time - tile.targetTime > HIT_WINDOW_GOOD + HIT_WINDOW_EPSILON)`
3. Deploy German Umlaut Font:
   - Challenger 2 identified that `helvetiker_regular.typeface.json` lacks German umlauts (`ä, ö, ü, Ä, Ö, Ü, ß`), rendering `?` for German song lyrics.
   - Copy `node_modules/stats-gl/node_modules/three/examples/fonts/droid/droid_sans_regular.typeface.json` (591 glyphs, full German character coverage) to `public/fonts/droid_sans_regular.typeface.json` and also overwrite `public/fonts/helvetiker_regular.typeface.json` (or update `FallingLyricTile3D.tsx` to `/fonts/droid_sans_regular.typeface.json`).
4. Verification:
   - Run Challenger 1's test: `node tests/stress_adversarial.mjs` -> MUST PASS 100%!
   - Run Challenger 2's test: `node tests/run_all_stress_tests.mjs` -> MUST PASS 100%!
   - Run `npm run build` (`tsc -b && vite build`) -> MUST EXIT WITH CODE 0!
   - Run `npm run lint` (`oxlint`) -> MUST EXIT WITH CODE 0!
5. Write handoff report to `c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\.agents\teamwork_preview_worker_remediation\handoff.md`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-05T09:16:31Z
Task: Implement Remediation for Challenger 1 & 2 findings:
1. In src/store/useRhythmGameStore.ts: Implement HIT_WINDOW_EPSILON = 0.001 (1ms float tolerance) in evaluateTileHit and tickAudioTime to eliminate IEEE-754 precision boundary failures on exact 80ms and 160ms thresholds.
2. In public/fonts/: Copy node_modules/stats-gl/node_modules/three/examples/fonts/droid/droid_sans_regular.typeface.json (591 glyphs with full German umlauts and Eszett) to public/fonts/droid_sans_regular.typeface.json and update FallingLyricTile3D.tsx (or also overwrite public/fonts/helvetiker_regular.typeface.json).
3. Verify by running:
   - node tests/stress_adversarial.mjs
   - node tests/run_all_stress_tests.mjs
   - npm run build
   - npm run lint
4. Write a comprehensive handoff report to c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\.agents\teamwork_preview_worker_remediation\handoff.md.

