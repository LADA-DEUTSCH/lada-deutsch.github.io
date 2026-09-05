import React, { useEffect, useCallback, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import type { SongDefinition, GameDifficultyLevel } from '../../types';
import type { IRhythmAudioEngine } from '../../services/rhythmAudioEngine';
import { useRhythmGameStore } from '../../store/useRhythmGameStore';
import { HighwayRoad } from './HighwayRoad';
import { FallingLyricTile3D } from './FallingLyricTile3D';
import { ChoiceGate3D } from './ChoiceGate3D';
import { PlayerDisc3D } from './PlayerDisc3D';
import { HighwayEffects } from './HighwayEffects';

export interface HighwaySceneProps {
  song: SongDefinition;
  level: GameDifficultyLevel;
  selectedLane: 0 | 1;
  onHit: (tileId: string, accuracy: 'perfect' | 'good' | 'miss') => void;
  onLaneChange: (lane: 0 | 1) => void;
  audioEngine: IRhythmAudioEngine;
  className?: string;
}

interface InnerSceneProps {
  song: SongDefinition;
  level: GameDifficultyLevel;
  selectedLane: 0 | 1;
  audioEngine: IRhythmAudioEngine;
}

/**
 * Inner R3F Scene running inside Canvas context.
 * Drives audio time ticking, auto-miss evaluation, and renders all 3D scene elements.
 */
const HighwayInnerScene: React.FC<InnerSceneProps> = ({
  song,
  level,
  selectedLane,
  audioEngine
}) => {
  const activeTiles = useRhythmGameStore((s) => s.activeTiles);
  const getAudioTime = useCallback(() => audioEngine.getCurrentAudioTime(), [audioEngine]);

  // Zero-drift audio tick inside R3F render loop
  useFrame(() => {
    const time = audioEngine.getCurrentAudioTime();
    useRhythmGameStore.getState().tickAudioTime(time);
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[0, 3.2, 8.0]}
        fov={55}
        rotation={[-0.12, 0, 0]}
      />
      <color attach="background" args={['#02040a']} />
      <fog attach="fog" args={['#02040a', 25, 95]} />

      {/* 3D Perspective Road & Neon Rails */}
      <HighwayRoad bpm={song.bpm} activeLane={selectedLane} />

      {/* Falling 3D Lyrics & Translation Choice Gates */}
      {activeTiles.map((tile) => (
        <React.Fragment key={tile.id}>
          <FallingLyricTile3D
            tile={tile}
            getAudioTime={getAudioTime}
          />
          {level === 2 && tile.options && (
            <ChoiceGate3D
              tile={tile}
              getAudioTime={getAudioTime}
              selectedLane={selectedLane}
            />
          )}
        </React.Fragment>
      ))}

      {/* Player Cyber Hovercraft at Z = 0 */}
      <PlayerDisc3D selectedLane={selectedLane} />

      {/* Postprocessing Bloom & Dynamic Lights */}
      <HighwayEffects bpm={song.bpm} />
    </>
  );
};

/**
 * Top-Level HighwayScene WebGL canvas component.
 * Manages user input bindings (keyboard, touch/click) and mounts the R3F Canvas.
 */
export const HighwayScene: React.FC<HighwaySceneProps> = ({
  song,
  level,
  selectedLane,
  onHit,
  onLaneChange,
  audioEngine,
  className = 'w-full h-full'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Trigger strike evaluation
  const handleTriggerStrike = useCallback(() => {
    audioEngine.ensureContext();
    const result = useRhythmGameStore.getState().evaluateTileHit(selectedLane);

    if (result) {
      if (result.accuracy === 'perfect') {
        audioEngine.playHitFx('perfect');
      } else if (result.accuracy === 'good') {
        audioEngine.playHitFx('good');
      } else {
        audioEngine.playMissFx();
      }
      onHit(result.tile.id, result.accuracy);
    }
  }, [audioEngine, selectedLane, onHit]);

  // Steer lane with audio feedback
  const handleSetLane = useCallback(
    (lane: 0 | 1) => {
      if (lane !== selectedLane) {
        audioEngine.playLaneSwitchFx();
        onLaneChange(lane);
      }
    },
    [selectedLane, onLaneChange, audioEngine]
  );

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleSetLane(0);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        handleSetLane(1);
      } else if (
        e.key === ' ' ||
        e.key === 'Enter' ||
        e.key === 'ArrowDown' ||
        e.key === 's' ||
        e.key === 'S'
      ) {
        e.preventDefault();
        handleTriggerStrike();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSetLane, handleTriggerStrike]);

  // Click / Touch steer & strike handler
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;

    // Steer left or right based on viewport click half
    if (xRatio < 0.5) {
      handleSetLane(0);
    } else {
      handleSetLane(1);
    }

    // Also trigger strike on tap
    handleTriggerStrike();
  };

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden ${className}`}
      onPointerDown={handlePointerDown}
      style={{ touchAction: 'none' }}
    >
      <Canvas
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance'
        }}
        dpr={[1, 2]}
      >
        <HighwayInnerScene
          song={song}
          level={level}
          selectedLane={selectedLane}
          audioEngine={audioEngine}
        />
      </Canvas>
    </div>
  );
};

export default HighwayScene;
