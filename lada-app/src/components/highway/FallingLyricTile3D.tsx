import React, { useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text3D, Center, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { ActiveHighwayTile } from '../../store/useRhythmGameStore';

export interface FallingLyricTile3DProps {
  tile: ActiveHighwayTile;
  getAudioTime: () => number;
  approachDurationSec?: number; // Time in seconds for tile to travel from spawn to strike line
  spawnZ?: number;              // Spawn distance (default -60)
}

const FONT_PATH = '/fonts/droid_sans_regular.typeface.json';
const LANE_X_COORDS: Record<0 | 1, number> = {
  0: -2.2,
  1: 2.2
};

export const FallingLyricTile3D: React.FC<FallingLyricTile3DProps> = ({
  tile,
  getAudioTime,
  approachDurationSec = 2.5,
  spawnZ = -60.0
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const textMeshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const baseMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const laneX = LANE_X_COORDS[tile.correctLane];
  const baseColor = tile.correctLane === 0 ? '#00f0ff' : '#ec4899';
  const speed = Math.abs(spawnZ) / approachDurationSec; // e.g. 60 / 2.5 = 24 units/sec

  // Smooth hit exit animation state
  const resolutionTimeRef = useRef<number | null>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const currentAudioTime = getAudioTime();
    const diffTime = currentAudioTime - tile.targetTime;
    let zPos = diffTime * speed;

    // Handle resolution (hit / miss animation)
    if (tile.resolved) {
      if (resolutionTimeRef.current === null) {
        resolutionTimeRef.current = clock.getElapsedTime();
      }
      const elapsedSinceResolved = clock.getElapsedTime() - resolutionTimeRef.current;

      if (tile.hitAccuracy === 'perfect' || tile.hitAccuracy === 'good') {
        // Float upward, expand, and fade out on successful strike
        groupRef.current.position.y = 0.8 + elapsedSinceResolved * 2.5;
        const scale = Math.max(0.01, 1.0 + elapsedSinceResolved * 1.2);
        groupRef.current.scale.set(scale, scale, scale);

        if (matRef.current) {
          matRef.current.emissive = new THREE.Color(
            tile.hitAccuracy === 'perfect' ? '#38bdf8' : '#10b981'
          );
          matRef.current.emissiveIntensity = Math.max(0, 4.0 - elapsedSinceResolved * 5.0);
          matRef.current.opacity = Math.max(0, 1.0 - elapsedSinceResolved * 2.0);
          matRef.current.transparent = true;
        }
      } else {
        // Miss: shake, sink downward, turn crimson red, and flicker out
        groupRef.current.position.y = Math.max(-1.0, 0.8 - elapsedSinceResolved * 1.5);
        if (matRef.current) {
          matRef.current.emissive = new THREE.Color('#ef4444');
          matRef.current.emissiveIntensity = Math.sin(elapsedSinceResolved * 30) > 0 ? 3.0 : 0.5;
          matRef.current.opacity = Math.max(0, 1.0 - elapsedSinceResolved * 2.5);
          matRef.current.transparent = true;
        }
      }

      // Hide mesh after exit animation finishes (0.6s)
      if (elapsedSinceResolved > 0.6) {
        groupRef.current.visible = false;
        return;
      }
    } else {
      // Normal approach
      groupRef.current.position.y = 0.8;
      groupRef.current.scale.set(1, 1, 1);
      groupRef.current.visible = zPos >= spawnZ - 10 && zPos <= 15;
    }

    groupRef.current.position.x = laneX;
    groupRef.current.position.z = zPos;
  });

  return (
    <group ref={groupRef} position={[laneX, 0.8, spawnZ]}>
      {/* 1. Cyber Floating Pedestal Base */}
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[2.8, 0.1, 1.2]} />
        <meshStandardMaterial
          ref={baseMatRef}
          color="#0f172a"
          emissive={baseColor}
          emissiveIntensity={1.2}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* 2. Neon Underglow Laser Ring */}
      <mesh position={[0, -0.36, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.3, 1.45, 24]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={2.5}
          toneMapped={false}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* 3. Extruded 3D German Lyric Text */}
      <Suspense fallback={null}>
        <Center position={[0, 0.1, 0]}>
          <Text3D
            ref={textMeshRef}
            font={FONT_PATH}
            size={0.65}
            height={0.16}
            curveSegments={12}
            bevelEnabled
            bevelThickness={0.03}
            bevelSize={0.02}
            bevelOffset={0}
            bevelSegments={4}
          >
            {tile.germanText}
            <meshStandardMaterial
              ref={matRef}
              color={baseColor}
              emissive={baseColor}
              emissiveIntensity={2.8}
              toneMapped={false}
              roughness={0.15}
              metalness={0.85}
            />
          </Text3D>
        </Center>
      </Suspense>

      {/* 4. Phonetic & Translation Subtitle Badge */}
      {tile.phonetic && (
        <Text
          position={[0, -0.15, 0.65]}
          fontSize={0.22}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#020617"
        >
          {`/${tile.phonetic}/`}
        </Text>
      )}
    </group>
  );
};

export default FallingLyricTile3D;
