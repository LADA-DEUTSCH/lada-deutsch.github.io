import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { ActiveHighwayTile } from '../../store/useRhythmGameStore';

export interface ChoiceGate3DProps {
  tile: ActiveHighwayTile;
  getAudioTime: () => number;
  selectedLane?: 0 | 1;
  approachDurationSec?: number;
  spawnZ?: number;
}

export const ChoiceGate3D: React.FC<ChoiceGate3DProps> = ({
  tile,
  getAudioTime,
  selectedLane = 0,
  approachDurationSec = 2.5,
  spawnZ = -60.0
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const gate0NeonRef = useRef<THREE.MeshStandardMaterial>(null);
  const gate1NeonRef = useRef<THREE.MeshStandardMaterial>(null);

  const speed = Math.abs(spawnZ) / approachDurationSec;
  const options = tile.options;

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const currentAudioTime = getAudioTime();
    const diffTime = currentAudioTime - tile.targetTime;
    const zPos = diffTime * speed;

    // Visibility range
    if (zPos < spawnZ - 10 || zPos > 15 || tile.resolved) {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.visible = true;
    groupRef.current.position.z = zPos;

    // Subtle breathing pulse on the neon borders
    const pulse = Math.sin(clock.getElapsedTime() * 6.0) * 0.3 + 1.0;
    if (gate0NeonRef.current) {
      gate0NeonRef.current.emissiveIntensity = selectedLane === 0 ? 3.0 * pulse : 1.2;
    }
    if (gate1NeonRef.current) {
      gate1NeonRef.current.emissiveIntensity = selectedLane === 1 ? 3.0 * pulse : 1.2;
    }
  });

  // If no choices available for this tile, do not render gates
  if (!options || options.length < 2) {
    return null;
  }

  return (
    <group ref={groupRef} position={[0, 1.4, spawnZ]}>
      {/* ─── LANE 0 GATE (X = -2.2) ─── */}
      <group position={[-2.2, 0, 0]}>
        {/* Frosted Cyber-Glass Panel */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.8, 1.6, 0.12]} />
          <meshPhysicalMaterial
            transmission={0.88}
            roughness={0.18}
            thickness={0.5}
            ior={1.48}
            transparent
            opacity={0.85}
            color="#08182b"
            emissive="#00f0ff"
            emissiveIntensity={0.25}
            reflectivity={0.9}
          />
        </mesh>

        {/* Outer Neon Cyber Frame */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.86, 1.66, 0.08]} />
          <meshStandardMaterial
            ref={gate0NeonRef}
            color="#00f0ff"
            emissive="#00f0ff"
            emissiveIntensity={selectedLane === 0 ? 3.0 : 1.2}
            toneMapped={false}
            wireframe
          />
        </mesh>

        {/* Lane 0 Option Label (Darija Choice) */}
        <Text
          position={[0, 0.15, 0.1]}
          fontSize={0.34}
          color="#38bdf8"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#020617"
        >
          {options[0]}
        </Text>

        {/* Sub-label "LANE 0" */}
        <Text
          position={[0, -0.45, 0.1]}
          fontSize={0.16}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
        >
          LANE 0 [LEFT]
        </Text>
      </group>

      {/* ─── LANE 1 GATE (X = +2.2) ─── */}
      <group position={[2.2, 0, 0]}>
        {/* Frosted Cyber-Glass Panel */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.8, 1.6, 0.12]} />
          <meshPhysicalMaterial
            transmission={0.88}
            roughness={0.18}
            thickness={0.5}
            ior={1.48}
            transparent
            opacity={0.85}
            color="#2a0820"
            emissive="#ec4899"
            emissiveIntensity={0.25}
            reflectivity={0.9}
          />
        </mesh>

        {/* Outer Neon Cyber Frame */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.86, 1.66, 0.08]} />
          <meshStandardMaterial
            ref={gate1NeonRef}
            color="#ec4899"
            emissive="#ec4899"
            emissiveIntensity={selectedLane === 1 ? 3.0 : 1.2}
            toneMapped={false}
            wireframe
          />
        </mesh>

        {/* Lane 1 Option Label (Darija Choice) */}
        <Text
          position={[0, 0.15, 0.1]}
          fontSize={0.34}
          color="#f472b6"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#020617"
        >
          {options[1]}
        </Text>

        {/* Sub-label "LANE 1" */}
        <Text
          position={[0, -0.45, 0.1]}
          fontSize={0.16}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
        >
          LANE 1 [RIGHT]
        </Text>
      </group>
    </group>
  );
};

export default ChoiceGate3D;
