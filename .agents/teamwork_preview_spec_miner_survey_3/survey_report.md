# Comprehensive Technical Specification & Architectural Report
## Modern WebGL 3D Rhythm Highway Engine (React Three Fiber, Zustand & Web Audio API)

- **Target Component**: `Beat3DHighway.tsx` & `Beat3DHighwayWebGL.tsx`
- **Application**: LADA Deutsch (`lada-app`)
- **Author**: Spec Miner 3 (`teamwork_preview_spec_miner`)
- **Date**: 2026-09-05
- **Status**: Authoritative Architectural Specification (Ready for Implementation Workers)

---

## 1. Executive Summary & Architecture Overview

The objective is to replace the pseudo-3D 2D canvas engine in `Beat3DHighway.tsx` with a true hardware-accelerated WebGL engine built upon **React Three Fiber (R3F)**, **Three.js (r185)**, **@react-three/postprocessing (v3)**, and **Web Audio API**. The resulting rhythm experience delivers sub-millisecond audio-visual synchronization, eliminates React 19 `<StrictMode>` double-mount timing glitches, and implements a AAA cyber-glassmorphism neon aesthetic with Bloom, physical transmission materials, and reactive particle bursts.

```
+---------------------------------------------------------------------------------------+
|                                    Beat3DHighway                                      |
|                                                                                       |
|  +-----------------------------+                     +-----------------------------+  |
|  |       Zustand Game Store    |                     |   Audio Engine (Singleton)  |  |
|  | - score, combo, maxCombo    |<--- Discrete Hits --| - AudioContext.currentTime  |  |
|  | - accuracy, selectedLane    |                     | - Lookahead Beat Scheduler  |  |
|  | - activeTiles state         |                     | - Dynamic Synthesizer / SFX |  |
|  +-----------------------------+                     +-----------------------------+  |
|                 |                                                   |                 |
|       Reactive HUD Overlays                                         | Direct Ref Sync |
|       (Score, Combo, Level HUD)                                     | (No React state)|
|                 |                                                   v                 |
|  +---------------------------------------------------------------------------------+  |
|  |                                  R3F <Canvas>                                   |  |
|  |  +---------------------------------------------------------------------------+  |  |
|  |  | PerspectiveCamera [0, 3.2, 8.0] (Steering Sway + Shake Damping)           |  |  |
|  |  | Suspense (Typeface Font Loading Boundary)                                |  |  |
|  |  |                                                                           |  |  |
|  |  | Highway Environment:                                                      |  |  |
|  |  | - Dark Metallic Obsidian Asphalt Plane (Z: 5 to -70)                     |  |  |
|  |  | - Laser Guide Rails: Left (Cyan #00f0ff), Right (Amber #f59e0b)          |  |  |
|  |  | - Moving BPM Highway Speed Pulse Grid                                    |  |  |
|  |  |                                                                           |  |  |
|  |  | Hit Zone (Z = 0.0):                                                       |  |  |
|  |  | - Pulsing Laser Strike Bar & Dual-Lane Target Pads                       |  |  |
|  |  | - Gliding Player Hover Disc (Lerp to Lane X: -2.2 or +2.2)               |  |  |
|  |  |                                                                           |  |  |
|  |  | Active Falling 3D Tiles:                                                   |  |  |
|  |  | - Floating German Prompt Banner (<Text3D> / <Center>)                     |  |  |
|  |  | - Dual Frosted Glassmorphic Choice Gates (meshPhysicalMaterial)          |  |  |
|  |  | - Extruded 3D Darija Translation Text (<Text3D> emissive neon)            |  |  |
|  |  |                                                                           |  |  |
|  |  | Particle FX & Dynamic Lighting:                                           |  |  |
|  |  | - 50 Instanced Spark Particles (Radial Hit Bursts & Crimson Miss Drops)   |  |  |
|  |  |                                                                           |  |  |
|  |  | EffectComposer (enableNormalPass={false}, multisampling={4}):              |  |  |
|  |  | - Bloom (mipmapBlur, intensity: 1.8, luminanceThreshold: 0.25)            |  |  |
|  |  | - Vignette (offset: 0.2, darkness: 0.75)                                  |  |  |
|  |  | - ChromaticAberration (Hit impulse spike)                                 |  |  |
|  |  +---------------------------------------------------------------------------+  |  |
|  +---------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------+
```

---

## 2. Specification Discovery Matrix

### Features Discovered
| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | R1 WebGL | R3F `<Canvas>` Scene | Fullscreen WebGL canvas replacing HTML5 2D canvas context | Resize events, DPR [1,2] | WebGL render buffer | Fallback on WebGL context loss | `Beat3DHighway.tsx:868`, `Beat3DHighwayWebGL.tsx` |
| 2 | R1 WebGL | Dual-Lane 3D Highway | 3D roadway spanning $Z \in [-70, +6]$ with Lane 0 ($X=-2.2$) and Lane 1 ($X=+2.2$) | Lane dimensions, BPM speed | 3D geometry & shaders | Clamped coordinate bounds | `Beat3DHighway.tsx:275-345` |
| 3 | R1 WebGL | Falling `<Text3D>` Lyrics | Extruded 3D German and Darija words advancing towards player | Song lyric items, typeface JSON | Extruded 3D meshes | Requires `<Suspense>` boundary | `@react-three/drei/core/Text3D.d.ts` |
| 4 | R1 WebGL | Frosted Glass Choice Gates | Physical transmission gates holding Darija options | `meshPhysicalMaterial` params | Refractive cyber-glass gate | Material fallback if transmission unsupported | `styles/cyber-glass.css:14-25` |
| 5 | R1 WebGL | Gliding Player Hover Pad | Reactive player pad at $Z=0$ interpolating smoothly between lanes | User lane selection (0 or 1) | Gliding glowing disc mesh | Bound to lane index 0 or 1 | `Beat3DHighway.tsx:360-373` |
| 6 | R2 Audio | Hardware Clock Master | Master timing tied directly to `AudioContext.currentTime` | Audio hardware DAC clock | Microsecond accurate audio time | Resume suspended context on user interaction | `services/musicSynthEngine.ts:30-41` |
| 7 | R2 Audio | Lookahead Beat Scheduler | Web Audio lookahead pattern scheduling beats in advance | Song BPM, instrument type | Scheduled oscillator/buffer audio nodes | Never drifts from tab throttling | Chris Wilson Clock Pattern |
| 8 | R2 Audio | Strict Mode Double-Mount Resilience | Idempotent audio lifecycle & deterministic lane layout | React mount/unmount cycle | Single audio playback session | Prevents ghost audio & clock offset | React 19 `<StrictMode>` analysis |
| 9 | R2 Audio | Hit Judgment Windows | Microsecond timing window calculation for Perfect/Good/Miss | `|targetTime - audioTime|` | Score, combo multiplier, judgment | Evaluated once per tile | Standard DDR/Beatmania windows |
| 10 | R3 Visuals | Postprocessing Bloom Pipeline | Postprocessing composer adding neon halation to emissive elements | High dynamic range color values | Bloom glow texture | Must use `enableNormalPass={false}` (NOT disableNormalPass) | `@react-three/postprocessing` probe |
| 11 | R3 Visuals | Emissive Glowing Hit Zones | Laser strike line pulsing on musical quarter notes | BPM quarter note cycle | Emissive pulse intensity | Clamped intensity $[1.5, 4.0]$ | `styles/cyber-glass.css:68-88` |
| 12 | R3 Visuals | Dynamic Camera Sway & Shake | Camera roll tilt during lane steer & trauma shake on hit/miss | Hit result, lane change | Smooth camera matrix rotation/position | Exponential decay per frame | `Beat3DHighway.tsx:229-242` |
| 13 | R3 Visuals | Radial Particle Spark Burst | Pre-allocated particle pool bursting on hits/misses | Hit position, judgment type | 3D particle positions & alpha | Recycled via circular buffer | `Beat3DHighway.tsx:185-200` |

### Edge Cases Discovered
| # | Feature | Input / Condition | Observed / Documented Behavior |
|---|---------|-------------------|--------------------------------|
| 1 | Postprocessing | `disableNormalPass` passed to `<EffectComposer>` | **Vite build failure TS2322**: In `@react-three/postprocessing` v3.1.1, the prop was renamed to `enableNormalPass?: boolean`. Passing `disableNormalPass` breaks compilation! Must use `enableNormalPass={false}` or omit it. |
| 2 | `<Text3D>` Font Loading | `<Text3D>` mounted without `<Suspense>` wrapper | **React 19 uncaught suspension**: Drei's `useFont` hook suspends while fetching typeface JSON. Without `<Suspense fallback={...}>`, the entire React root unmounts and crashes. |
| 3 | German Umlauts & Darija | Special characters (ä, ö, ü, ß, Arabic numerals) in `<Text3D>` | Helvetiker typeface JSON covers Latin-1 supplement (ä, ö, ü, ß), but missing non-Latin glyphs produce blank meshes. Fallback to `@react-three/drei` `<Text>` (SDF) or pre-sanitized ASCII/Arabizi strings ensures robust display. |
| 4 | React Strict Mode | Component mounts, unmounts, and immediately remounts | If `AudioContext` is created repeatedly, browser limits (max 6 contexts) trigger audio death. Must reuse audio context or use idempotent `play()`/`stop()`. |
| 5 | Frame Loop Timing | Calling React state updater `setSongProgressPct()` inside R3F `useFrame` | Triggers 60-120 React reconciliations/sec, creating GC pauses and audio/visual stutter. Must update 3D transforms directly via refs, throttling React HUD state to 10 Hz or discrete hit events. |
| 6 | High-DPI Displays | Device pixel ratio (DPR) > 3.0 on retina mobile devices | GPU fill-rate exhaustion when rendering postprocessing Bloom at 4K. Must clamp `dpr={[1, 2]}` on `<Canvas>`. |

---

## 3. Specification R1: WebGL Migration to React Three Fiber

### 3.1 Scene Coordinate Space Definition
The 3D world uses a right-handed Cartesian coordinate system:
- **X-axis (Lateral)**:
  - Center Divider: $X = 0.0$
  - Lane 0 (Left Lane): $X = -2.20$
  - Lane 1 (Right Lane): $X = +2.20$
  - Highway Total Width: $W = 8.0$ (bounds $X \in [-4.0, +4.0]$)
  - Left Laser Rail: $X = -4.0$
  - Right Laser Rail: $X = +4.0$
- **Y-axis (Vertical)**:
  - Highway Surface: $Y = 0.0$
  - Hit Zone Strike Bar: $Y = 0.04$
  - Choice Gate Plate: $Y = 0.85$ (height: $1.20$, width: $3.0$)
  - Text3D Translation Options: $Y = 0.85$
  - German Prompt Word Banner: $Y = 2.40$
  - Camera Eye: $Y = 3.20$
- **Z-axis (Longitudinal / Highway Depth)**:
  - Horizon / Vanishing Point: $Z = -70.0$
  - Note Spawn Plane: $Z_{\text{spawn}} = -60.0$
  - Hit Zone / Judgment Strike Line: $Z_{\text{hit}} = 0.0$
  - Despawn Plane: $Z_{\text{despawn}} = +5.5$
  - Camera Position: $Z_{\text{cam}} = +8.0$
  - Camera LookAt Target: $(0.0, 0.6, -18.0)$ (forward-looking with $\approx 18^\circ$ downward pitch).

### 3.2 Dynamic Note Trajectory & Speed Math
Let $t_{\text{audio}}$ be the current Web Audio playback timestamp (in seconds).
Let $t_{\text{target}}$ be the lyric item's hit timestamp (`tile.targetTime`).
Let $T_{\text{travel}}$ be the visual travel duration (time from spawn to strike line).
- For Level 2: $T_{\text{travel}} = 3.50\text{ s}$
- For Level 1 / Slower songs: $T_{\text{travel}} = 4.20\text{ s}$

The exact $Z$ coordinate of any tile at time $t_{\text{audio}}$ is governed by:
$$\Delta t = t_{\text{target}} - t_{\text{audio}}$$
$$Z(t) = Z_{\text{hit}} - \left( \frac{\Delta t}{T_{\text{travel}}} \right) \cdot (Z_{\text{hit}} - Z_{\text{spawn}})$$

Substituting $Z_{\text{hit}} = 0.0$ and $Z_{\text{spawn}} = -60.0$:
$$Z(t) = - \left( \frac{t_{\text{target}} - t_{\text{audio}}}{T_{\text{travel}}} \right) \times 60.0$$

#### Trajectory Lifecycle States:
1. **Unspawned / Culled**: When $\Delta t > T_{\text{travel}} + 0.2\text{ s}$ ($Z < -63.0$), the tile mesh is hidden or excluded from the scene graph.
2. **In Approach**: When $0.0 \le \Delta t \le T_{\text{travel}}$, $Z \in [-60.0, 0.0]$. Perspective division naturally gives accelerating visual velocity towards the camera.
3. **In Hit Window**: When $|\Delta t| \le 0.160\text{ s}$, $Z \in [-2.7, +2.7]$. The note enters the judgment threshold.
4. **Passed / Missed**: When $\Delta t < -0.160\text{ s}$ and tile has not been resolved, mark as `miss`, trigger miss SFX, and allow tile to continue to $Z = +5.5$ before unmounting.

### 3.3 Highway 3D Geometry & Material Specs
1. **Asphalt Road Surface**:
   - Geometry: Plane geometry `args={[8.0, 90.0]}` positioned at `[0, 0, -35]`, rotated `[-Math.PI / 2, 0, 0]`.
   - Material: `meshStandardMaterial` with:
     - `color: '#050713'`
     - `roughness: 0.18`
     - `metalness: 0.82`
     - `envMapIntensity: 0.5`
2. **Side Guide Laser Rails**:
   - Left Rail: Cylinder or rounded box at `X = -4.0, Y = 0.08, Z = -35`, length 90. Emissive color `#00f0ff` (Cyan), `emissiveIntensity = 2.5`, `toneMapped = false`.
   - Right Rail: Cylinder or rounded box at `X = +4.0, Y = 0.08, Z = -35`, length 90. Emissive color `#f59e0b` (Amber), `emissiveIntensity = 2.5`, `toneMapped = false`.
3. **Center Lane Divider**:
   - Array of glowing dashes at $X = 0, Y = 0.02$, length 2.0, gap 2.5. Emissive `#64748b`, `emissiveIntensity = 1.0`.
4. **Highway Moving Pulse Grid**:
   - Rendered using `@react-three/drei`'s `<Grid>` or a scrolling texture offset in `useFrame`:
     `gridRef.current.position.z = ((audioTime * bpmSpeed) % sectionSize)`.

### 3.4 Choice Gate & Text3D Typography Specifications
1. **Gate Plate Structure**:
   - Each gate at $Z$ consists of:
     - Glass Plate: `meshPhysicalMaterial` (frosted glass) `args={[3.0, 1.2, 0.08]}` with `transmission: 0.85, roughness: 0.16, ior: 1.48, thickness: 0.5`.
     - Rim Outline: Thin glowing box enclosing the plate. Lane 0 rim is cyan (`#00f0ff`); Lane 1 rim is warm amber (`#f59e0b`).
     - Selected Lane Glow: When player chooses Lane 0, Lane 0 rim jumps to `emissiveIntensity = 4.0`; Lane 1 dims to `1.2`.
2. **`<Text3D>` Typography Integration**:
   - Typeface Source: `public/fonts/helvetiker_bold.typeface.json` (61 KB, bundled into `lada-app/public/fonts/`).
   - Drei `<Center>` wrapper: All `<Text3D>` elements MUST be wrapped in `<Center>` so text is centered on its anchor point regardless of string length.
   - Text3D Parameters:
     ```tsx
     <Center position={[laneX, 0.85, 0]}>
       <Text3D
         font="/fonts/helvetiker_bold.typeface.json"
         size={0.38}
         height={0.06}
         curveSegments={10}
         bevelEnabled
         bevelThickness={0.015}
         bevelSize={0.008}
         bevelSegments={3}
       >
         {tile.lyric.darijaCorrect}
         <meshStandardMaterial
           color="#ffffff"
           emissive={isLane0 ? "#00f0ff" : "#f59e0b"}
           emissiveIntensity={isSelected ? 3.0 : 1.2}
           toneMapped={false}
         />
       </Text3D>
     </Center>
     ```
   - German Word Floating Banner:
     - Positioned at `[0, 2.30, z]`.
     - Size: `0.48`, height: `0.08`.
     - Emissive color: `#facc15` (Neon Gold), `emissiveIntensity: 2.2`.

---

## 4. Specification R2: Precision Audio Sync Architecture

### 4.1 Clock Disconnect Root Cause Analysis
The existing engine in `Beat3DHighway.tsx` and `MusicSynthEngine.ts` suffers from three architectural flaws:
1. **Timer Quantization & Cumulative Drift**: `window.setInterval` fires on the browser event loop. Mac/Windows event loop timers slip by 4-20ms per tick. Over a 2-minute song (240 ticks at 120 BPM), the beat drifts by 200-500ms from real audio output.
2. **Clock Source Decoupling**: Visuals were driven by `performance.now() / 1000 - startTimeRef.current` while audio was synthesized on `ctx.currentTime`. Any suspension or tab backgrounding desynchronizes the two clocks permanently.
3. **React Strict Mode Double-Mount**: In React 19 Strict Mode, components mount $\to$ unmount $\to$ remount in $<10\text{ ms}$. Creating `new MusicSynthEngine()` twice resulted in two audio contexts, duplicate timers, and suspended audio states.

### 4.2 Web Audio API Hardware Clock Master
To achieve sub-millisecond precision, **`AudioContext.currentTime` must be the single source of truth for the entire application**:
- The audio context is maintained as a persistent singleton (`RhythmAudioEngine.getInstance()`).
- On song start:
  $$t_{\text{start}} = \text{audioContext.currentTime} + 0.100\text{ s (lead-in buffer)}$$
- At any frame:
  $$t_{\text{audio}} = \max(0.0, \text{audioContext.currentTime} - t_{\text{start}})$$
- Pausing: Save elapsed offset $t_{\text{offset}} = t_{\text{audio}}$. On resume, $t_{\text{start}} = \text{audioContext.currentTime} - t_{\text{offset}}$.

### 4.3 Lookahead Audio Beat Scheduler Pattern
Rather than triggering audio notes on `setInterval` at the moment of playback, use the **Chris Wilson Lookahead Clock Pattern**:
- Run a fast, lightweight scheduler timer every $25\text{ ms}$ (`LOOKAHEAD_INTERVAL_MS = 25`).
- Maintain a scheduling horizon of $100\text{ ms}$ (`SCHEDULE_AHEAD_SEC = 0.100`).
- While $t_{\text{nextBeat}} < \text{audioContext.currentTime} + \text{SCHEDULE\_AHEAD\_SEC}$:
  - Schedule audio synthesis nodes at exact hardware timestamp $t_{\text{nextBeat}}$:
    ```ts
    osc.start(tNextBeat);
    osc.stop(tNextBeat + duration);
    gain.gain.setValueAtTime(peak, tNextBeat);
    gain.gain.exponentialRampToValueAtTime(0.001, tNextBeat + decay);
    ```
  - Advance: $t_{\text{nextBeat}} += \frac{60}{\text{BPM} \times 2}$ (for 8th notes).
- **Result**: Beats are buffered into the audio hardware DAC pipeline in advance. Even if the JavaScript main thread freezes for 50ms during a heavy render, audio output NEVER jitters or stutters!

### 4.4 Decoupled R3F Render Loop (Zero React Rerender on Ticks)
- The 3D animation loop runs in R3F's `useFrame((state, delta) => { ... })`.
- `useFrame` queries `audioEngine.getCurrentTime()` directly.
- Mesh positions are updated via direct Three.js mutation:
  ```ts
  groupRef.current.position.z = calculateZ(tile.targetTime, audioTime);
  ```
- No React state updater (`setState`) is invoked in `useFrame`.
- Song progress and score are updated only:
  - On discrete hit events (immediate).
  - Throttled progress update (e.g. once every 10 frames / 100ms) for the HUD bar.

### 4.5 Hit Window Tolerances & Scoring Logic
When a note passes the judgment threshold:
$$\Delta t = t_{\text{audio}} - t_{\text{target}}$$

| Judgment | Time Window $|\Delta t|$ | Lane Requirement | Score Points | Combo Multiplier | Visual / Audio Feedback |
|---|---|---|---|---|---|
| **PERFECT** | $\le 0.080\text{ s}$ ($\pm 80\text{ ms}$) | Selected lane === `tile.correctLane` | $+100 \times \text{multiplier}$ | Combo $+1$, streak sounds every 5 combo | Cyan/Gold radial spark burst, strike pulse, `hitFx(true)` |
| **GOOD** | $0.080\text{ s} < |\Delta t| \le 0.160\text{ s}$ ($\pm 160\text{ ms}$) | Selected lane === `tile.correctLane` | $+50$ | Combo $+1$ (no multiplier bonus) | Subtle spark burst, `hitFx(false)` |
| **MISS (Wrong Lane)** | $|\Delta t| \le 0.160\text{ s}$ | Selected lane !== `tile.correctLane` | $0$ | Combo resets to $0$ | Red spark burst, screen shake, `missFx()` |
| **MISS (Late Pass)** | $\Delta t > +0.160\text{ s}$ | Tile unhit | $0$ | Combo resets to $0$ | Faded drop, screen shake, `missFx()` |

**Combo Multiplier Formula**:
$$\text{multiplier} = \min\left(3.0, 1.0 + \lfloor \text{combo} / 5 \rfloor \times 0.25\right)$$

---

## 5. Specification R3: AAA Visual Effects & Postprocessing Pipeline

### 5.1 Postprocessing Pipeline Configuration
In `@react-three/postprocessing` v3.1.1:
```tsx
<EffectComposer enableNormalPass={false} multisampling={4}>
  <Bloom
    luminanceThreshold={0.25}
    luminanceSmoothing={0.85}
    mipmapBlur
    intensity={1.8}
    radius={0.8}
    levels={8}
  />
  <Vignette
    offset={0.22}
    darkness={0.78}
    eskil={false}
  />
  <DynamicChromaticAberration />
</EffectComposer>
```

#### Critical Rules:
1. **`enableNormalPass={false}`**: DO NOT pass `disableNormalPass`. The library interface is:
   `enableNormalPass?: boolean;` (TS2322 error occurs if `disableNormalPass` is used).
2. **`mipmapBlur={true}`**: Essential for AAA glow. Computes progressive downsampled mipmaps, preventing pixellated neon edges.
3. **`toneMapped={false}` on Emissive Materials**: In Three.js, if a material has `toneMapped={true}` (default), its emissive values are compressed by ACES/Reinhard tone mapping into the $[0, 1]$ range, preventing Bloom from triggering. Setting `toneMapped={false}` allows high emissive intensity ($> 2.5$) to pass directly to the bloom threshold.

### 5.2 Cyber-Glassmorphism Shaders & Materials
| Surface | Three.js Material | Key Properties | Visual Outcome |
|---|---|---|---|
| **Highway Deck** | `meshStandardMaterial` | `color: #060814`, `roughness: 0.15`, `metalness: 0.85` | Sleek obsidian carbon runway reflecting neon rails |
| **Choice Gates** | `meshPhysicalMaterial` | `transmission: 0.85`, `roughness: 0.16`, `ior: 1.48`, `thickness: 0.6`, `color: #0b152d` | True physical refractive cyber-glass |
| **Gate Neon Rims** | `meshStandardMaterial` | `color: #00f0ff` (L0) / `#f59e0b` (L1), `emissiveIntensity: 2.5 - 4.5`, `toneMapped: false` | Intense glowing neon edge highlighting active gate |
| **3D Lyrics** | `meshStandardMaterial` | `color: #ffffff`, `emissive: #00f0ff` / `#f59e0b`, `emissiveIntensity: 2.5`, `toneMapped: false` | Glowing 3D extruded lettering cutting through darkness |
| **Hit Strike Bar** | `meshStandardMaterial` | `color: #00f0ff`, `emissive: #00f0ff`, `emissiveIntensity: 3.0 + beatPulse`, `toneMapped: false` | Laser line pulsing rhythmically on quarter notes |

### 5.3 Glowing Hit Zones & Player Hover Disc
1. **Strike Bar**:
   - Spans $X \in [-4.0, +4.0], Y = 0.04, Z = 0.0$.
   - Dimensions: `args={[8.0, 0.06, 0.15]}`.
   - Pulse formula in `useFrame`:
     $$\text{pulse} = \exp\left(-8.0 \times \left((t_{\text{audio}} \pmod{60/\text{BPM}}) / (60/\text{BPM})\right)\right)$$
     $$\text{emissiveIntensity} = 2.0 + 2.5 \times \text{pulse}$$
2. **Player Hover Disc**:
   - Centered at $Z = 0.0, Y = 0.05$.
   - Glides smoothly between Lane 0 ($X = -2.2$) and Lane 1 ($X = +2.2$) using lerp damping:
     $$X_{\text{disc}} \leftarrow X_{\text{disc}} + (X_{\text{target}} - X_{\text{disc}}) \times 0.25$$
   - Geometry: Inner disc with outer glowing ring `<ringGeometry args={[0.7, 0.9, 32]} />` rotating on the Y-axis.
   - Emissive color switches to `#00f0ff` on Lane 0, `#f59e0b` on Lane 1.

### 5.4 Particle Bursts & Dynamic Camera Trauma
1. **Particle Spark Pool**:
   - 60 pre-allocated particle meshes or an instanced mesh buffer.
   - On **Hit**: 32 spark particles burst radially from $(X_{\text{lane}}, 0.85, 0.0)$.
     - Velocities: $V_x \in [-4, 4]$, $V_y \in [2, 7]$, $V_z \in [-2, 2]$.
     - Gravity: $-12.0\text{ m/s}^2$.
     - Lifespan: $0.45\text{ s}$ with linear opacity decay.
   - On **Miss**: 16 crimson red (`#ef4444`) embers scatter downwards.
2. **Camera Steering Sway & Shake**:
   - Target roll tilt: $\theta_{\text{roll}} = -0.025\text{ rad}$ when in Lane 0; $+0.025\text{ rad}$ in Lane 1.
   - Camera rotation Z smoothly approaches $\theta_{\text{roll}}$ with lerp damping $0.15$.
   - Screen Shake Trauma: Add displacement vector $(S_x, S_y, 0)$ decaying by $0.88$ each frame.

---

## 6. Exact TypeScript Contracts & Store Interfaces

To guarantee clean, zero-defect handoff to Workers, the following contracts are strictly defined:

```ts
// ============================================================================
// File: src/types/rhythmEngine.ts
// ============================================================================

import type { SongDefinition, SongLyricItem, GameDifficultyLevel } from './index';

export type HitJudgmentType = 'perfect' | 'good' | 'miss';

export interface ActiveHighwayTile {
  id: string;
  lyric: SongLyricItem;
  spawnTime: number;       // In audio seconds (e.g. targetTime - travelTime)
  targetTime: number;      // Exact audio second when tile reaches Z = 0
  correctLane: 0 | 1;      // Deterministically assigned lane
  resolved: boolean;       // True once hit or missed
  userSelectedLane: 0 | 1 | null;
  result?: HitJudgmentType;
}

export interface HitResult {
  tileId: string;
  judgment: HitJudgmentType;
  timeDeltaMs: number;
  lane: 0 | 1;
  scoreDelta: number;
  combo: number;
}

export interface RhythmAudioState {
  isPlaying: boolean;
  isMuted: boolean;
  currentBpm: number;
  audioStartTime: number;
  songDuration: number;
}

export interface ParticleData {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  size: number;
  life: number;     // 1.0 -> 0.0
  maxLife: number;
}

// ============================================================================
// File: src/store/useRhythmGameStore.ts
// ============================================================================

import { create } from 'zustand';

export interface RhythmGameStore {
  // State
  gameState: 'idle' | 'countdown' | 'playing' | 'paused' | 'ended';
  selectedLane: 0 | 1;
  score: number;
  combo: number;
  maxCombo: number;
  accuracy: number;
  hitsCount: { perfect: number; good: number; miss: number; total: number };
  isMuted: boolean;
  isFullscreen: boolean;
  activeTiles: ActiveHighwayTile[];
  recentHit: HitResult | null;
  shakeIntensity: number;
  chromaticAberrationSpike: number;

  // Actions
  initializeGame: (song: SongDefinition, level: GameDifficultyLevel) => void;
  setLane: (lane: 0 | 1) => void;
  recordHitResult: (result: HitResult) => void;
  markTileResolved: (tileId: string, judgment: HitJudgmentType, selectedLane: 0 | 1) => void;
  triggerShake: (intensity: number) => void;
  setMuted: (muted: boolean) => void;
  toggleFullscreen: () => void;
  setGameState: (state: 'idle' | 'countdown' | 'playing' | 'paused' | 'ended') => void;
  resetGame: () => void;
}

// ============================================================================
// File: src/services/rhythmAudioEngine.ts
// ============================================================================

export interface IRhythmAudioEngine {
  ensureContext: () => AudioContext;
  startSongRhythm: (bpm: number, instrument: string, leadInSec?: number) => number; // returns startTime
  stopSongRhythm: () => void;
  getCurrentAudioTime: () => number;
  setMuted: (muted: boolean) => void;
  playHitFx: (isPerfect: boolean) => void;
  playMissFx: () => void;
  playStreakFx: (streakCount: number) => void;
  speakGermanLyric: (german: string) => void;
  dispose: () => void;
}
```

---

## 7. Build Verification & Acceptance Checklist

To fulfill all requirements and pass the **Agent-as-Judge** inspection:

1. **Build Success**:
   - `npm run build` (`tsc -b && vite build`) MUST exit with code 0.
   - **Fix Applied**: Ensure all imports in `Beat3DHighwayWebGL.tsx` (or replacement) are used, and `<EffectComposer>` uses `enableNormalPass={false}` (NOT `disableNormalPass`).
2. **Framework Compliance**:
   - The main 3D highway loop MUST be rendered inside `<Canvas>` via `@react-three/fiber` and `useFrame`.
   - All legacy 2D `canvas.getContext('2d')`, `ctx.translate`, and `ctx.scale` logic MUST be removed.
3. **Postprocessing Bloom**:
   - Confirm `<EffectComposer>` and `<Bloom mipmapBlur intensity={...} />` are active and illuminating emissive meshes.
4. **Font Asset Placement**:
   - Ensure `helvetiker_bold.typeface.json` is placed in `public/fonts/helvetiker_bold.typeface.json` (copied from `node_modules/stats-gl/node_modules/three/examples/fonts/helvetiker_bold.typeface.json` or served statically).
   - Ensure `<Suspense fallback={...}>` wraps the 3D scene elements.
5. **Strict Mode Resilience**:
   - Mounting and immediately unmounting `<Beat3DHighway>` must not throw Web Audio errors or desynchronize note timing.

---
*Report certified by Spec Miner 3 (`teamwork_preview_spec_miner`). Proceed to implementation.*
