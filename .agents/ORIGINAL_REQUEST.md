# Original User Request

## 2026-09-05T08:14:44Z

# Teamwork Project Prompt

> Requested team: Full team - Divide the work (Game Logic, 3D Assets, UI Integration)

Rebuild the Beat3DHighway.tsx rhythm game component into a true 3D WebGL experience using React Three Fiber, Zustand, and Web Audio API, featuring a AAA cyber-glassmorphism neon aesthetic.

Working directory: c:\Users\Bilal 26\Documents\🏫 DEUTSCH LIVE AGENT\lada-app
Integrity mode: development

## Requirements

### R1. WebGL Migration
Replace the current 2D canvas pseudo-3D engine in Beat3DHighway.tsx with a true React Three Fiber <Canvas>. The game must feature two 3D lanes for translation choices and falling <Text3D> lyrics.

### R2. Precision Audio Sync
The rhythm game loop and tile positioning must be driven by Web Audio API currentTime (or a precise Zustand store hooked to the audio) rather than relying on performance.now() inside a React state updater, eliminating React Strict Mode double-render glitches.

### R3. AAA Visual Effects
Implement cyberpunk aesthetics using @react-three/postprocessing. The highway and text must have neon Bloom, dynamic lighting, and glowing hit zones.

## Acceptance Criteria

### Compilation & Type Safety
- [ ] Running 
pm run build exits with code 0 (no TypeScript or Vite build errors).

### Architectural Integrity (Agent-as-Judge)
- [ ] Code inspection verifies the use of @react-three/fiber for the main loop, replacing all raw 2D ctx.scale/ctx.translate logic.
- [ ] Code inspection confirms the presence of EffectComposer and Bloom for neon lighting.
