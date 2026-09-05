# Dispatch Assignment: Worker 2 (Milestone 2: 3D Highway, Text3D Lyrics & Cyber Shaders)

- Role: teamwork_preview_worker
- Working Directory: c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\.agents\teamwork_preview_worker_m2
- Target Codebase: c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\lada-app
- Original Request File: c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\.agents\ORIGINAL_REQUEST.md
- Project Architecture Document: c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\.agents\teamwork_preview_orchestrator_1\PROJECT.md
- Previous Milestone Handoff: c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\.agents\teamwork_preview_worker_m1\handoff.md

## Scope of File Ownership
You exclusively own and may create/modify:
- `src/components/highway/HighwayScene.tsx`
- `src/components/highway/HighwayRoad.tsx`
- `src/components/highway/FallingLyricTile3D.tsx`
- `src/components/highway/ChoiceGate3D.tsx`
- `src/components/highway/PlayerDisc3D.tsx`
- `src/components/highway/HighwayEffects.tsx`
- `src/components/highway/index.ts`

## Objectives
1. Read `ORIGINAL_REQUEST.md`, `PROJECT.md`, and Milestone 1 handoff. Notice `useRhythmGameStore.ts` and `rhythmAudioEngine.ts` are ready and `public/fonts/helvetiker_regular.typeface.json` is deployed.
2. Implement `HighwayRoad.tsx`:
   - 3D perspective highway surface with cyber grid lines.
   - Dual lane boundaries (Lane 0 at $X = -2.2$, Lane 1 at $X = +2.2$).
   - Emissive neon laser rails with cyberpunk glow.
   - Glowing strike line / hit zone at $Z = 0$, pulsating on quarter beats.
3. Implement `FallingLyricTile3D.tsx`:
   - Extruded 3D German lyrics using `<Text3D font="./fonts/helvetiker_regular.typeface.json">` (or `/fonts/helvetiker_regular.typeface.json`) wrapped in `<Center>` and enclosed in `<React.Suspense fallback={null}>`.
   - Neon emissive material with `toneMapped={false}`.
   - Moving down the highway from $Z = -60$ towards $Z = 0$ at the target audio time.
   - Smooth fading and exit animation upon resolution/hit.
4. Implement `ChoiceGate3D.tsx`:
   - Cyber-glassmorphism translation choice arches/gates for Level 2 (Darija choices on left and right lanes).
   - Frosted glass material (`meshPhysicalMaterial` with transmission, roughness, neon borders).
   - Display target translation options clearly.
5. Implement `PlayerDisc3D.tsx`:
   - Futuristic cyber hovercraft / disc at $Z = 0$.
   - Smoothly lerps between $X = -2.2$ (Lane 0) and $X = +2.2$ (Lane 1) based on `selectedLane`.
   - Hover bobbing, steering roll/tilt on lane switch, engine glow.
6. Implement `HighwayEffects.tsx`:
   - `@react-three/postprocessing` pipeline:
     ```tsx
     <EffectComposer enableNormalPass={false} multisampling={4}>
       <Bloom mipmapBlur intensity={1.5} luminanceThreshold={0.2} />
     </EffectComposer>
     ```
     IMPORTANT: DO NOT use `disableNormalPass`! In postprocessing v3 it is `enableNormalPass={false}`.
   - Dynamic point lights synced to song tempo.
   - Spark / particle hit explosion effects triggered on perfect/good hits.
7. Implement `HighwayScene.tsx`:
   - Master component containing `<Canvas>` (or inner scene if Canvas is outside).
   - Camera setup (`PerspectiveCamera` at $[0, 3.2, 8.0]$ looking slightly down towards $[0, 0, -10]$).
   - Connects to `useRhythmGameStore` and `rhythmAudioEngine`.
   - `useFrame` hook reading `audioEngine.getCurrentAudioTime()` and driving tile animation and auto-miss checking without React state thrashing.
8. Implement clean index export in `src/components/highway/index.ts`.
9. Quality & Strict Safety:
   - Adhere strictly to `verbatimModuleSyntax` (use `import type` for type-only imports).
   - No unused variables/parameters (`noUnusedLocals: true`).
   - Wrap any `<Text3D>` component in `<React.Suspense fallback={null}>`.
10. Verification:
    - Run `oxlint` and `vite build` to verify 0 errors.
11. Write a self-contained handoff report to `c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\.agents\teamwork_preview_worker_m2\handoff.md`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-05T08:33:36Z
User request to execute Milestone 2: 3D Highway, Text3D Lyrics & Cyber Shaders.
Target Codebase: c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\lada-app
Ensure strict verbatimModuleSyntax, no unused variables, zero build errors.

