import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import * as THREE from 'three';

export interface HighwayRoadProps {
  bpm?: number;
  activeLane?: 0 | 1;
}

const ROAD_WIDTH = 9.0;
const ROAD_LENGTH = 120.0;
const ROAD_CENTER_Z = -50.0; // from Z = 10 to Z = -110

export const HighwayRoad: React.FC<HighwayRoadProps> = ({ bpm = 120, activeLane = 0 }) => {
  const strikeLineMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const lane0MatRef = useRef<THREE.MeshStandardMaterial>(null);
  const lane1MatRef = useRef<THREE.MeshStandardMaterial>(null);
  const gridGroupRef = useRef<THREE.Group>(null);

  // Pulse strike line and animate scrolling grid to give highway motion
  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const beatFrequency = (bpm / 60) * Math.PI * 2;
    const pulse = Math.sin(elapsed * beatFrequency) * 0.5 + 0.5; // 0..1

    if (strikeLineMatRef.current) {
      strikeLineMatRef.current.emissiveIntensity = 2.0 + pulse * 2.0;
    }

    // Highlight target zone corresponding to active lane
    if (lane0MatRef.current) {
      lane0MatRef.current.emissiveIntensity = activeLane === 0 ? 3.0 + pulse * 1.5 : 0.8;
    }
    if (lane1MatRef.current) {
      lane1MatRef.current.emissiveIntensity = activeLane === 1 ? 3.0 + pulse * 1.5 : 0.8;
    }

    // Move grid texture/group towards player to simulate high-speed travel
    if (gridGroupRef.current) {
      gridGroupRef.current.position.z = (elapsed * 18.0) % 10.0;
    }
  });

  return (
    <group>
      {/* 1. Main Dark Metallic Highway Surface */}
      <mesh position={[0, -0.05, ROAD_CENTER_Z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROAD_WIDTH, ROAD_LENGTH]} />
        <meshStandardMaterial
          color="#030712"
          roughness={0.25}
          metalness={0.85}
        />
      </mesh>

      {/* 2. Scrolling Cyber Highway Grid */}
      <group ref={gridGroupRef} position={[0, 0.01, 0]}>
        <Grid
          position={[0, 0, ROAD_CENTER_Z]}
          args={[ROAD_WIDTH, ROAD_LENGTH]}
          cellSize={1.0}
          cellThickness={0.8}
          cellColor="#00f0ff"
          sectionSize={5.0}
          sectionThickness={1.5}
          sectionColor="#8b5cf6"
          fadeDistance={65}
          fadeStrength={1.2}
        />
      </group>

      {/* 3. Outer Neon Guard Rails (Left at X = -4.5, Right at X = +4.5) */}
      <mesh position={[-ROAD_WIDTH / 2, 0.15, ROAD_CENTER_Z]}>
        <boxGeometry args={[0.15, 0.3, ROAD_LENGTH]} />
        <meshStandardMaterial
          color="#00f0ff"
          emissive="#00f0ff"
          emissiveIntensity={3.0}
          toneMapped={false}
          roughness={0.1}
        />
      </mesh>
      <mesh position={[ROAD_WIDTH / 2, 0.15, ROAD_CENTER_Z]}>
        <boxGeometry args={[0.15, 0.3, ROAD_LENGTH]} />
        <meshStandardMaterial
          color="#ec4899"
          emissive="#ec4899"
          emissiveIntensity={3.0}
          toneMapped={false}
          roughness={0.1}
        />
      </mesh>

      {/* 4. Center Divider Laser Rail (X = 0) */}
      <mesh position={[0, 0.06, ROAD_CENTER_Z]}>
        <boxGeometry args={[0.1, 0.12, ROAD_LENGTH]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={2.5}
          toneMapped={false}
          roughness={0.1}
        />
      </mesh>

      {/* 5. Lane Center Guide Ribbons (Lane 0 at X = -2.2, Lane 1 at X = +2.2) */}
      <mesh position={[-2.2, 0.005, ROAD_CENTER_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.1, ROAD_LENGTH]} />
        <meshStandardMaterial
          color="#00f0ff"
          emissive="#00f0ff"
          emissiveIntensity={1.2}
          toneMapped={false}
          transparent
          opacity={0.6}
        />
      </mesh>
      <mesh position={[2.2, 0.005, ROAD_CENTER_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.1, ROAD_LENGTH]} />
        <meshStandardMaterial
          color="#ec4899"
          emissive="#ec4899"
          emissiveIntensity={1.2}
          toneMapped={false}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* 6. Glowing Strike Line / Hit Zone at Z = 0 */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROAD_WIDTH, 0.35]} />
        <meshStandardMaterial
          ref={strikeLineMatRef}
          color="#ffffff"
          emissive="#00f0ff"
          emissiveIntensity={2.5}
          toneMapped={false}
        />
      </mesh>

      {/* 7. Lane 0 & Lane 1 Hit Pads at Z = 0 */}
      {/* Lane 0 Hit Target Pad (X = -2.2) */}
      <group position={[-2.2, 0.03, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1.05, 32]} />
          <meshStandardMaterial
            ref={lane0MatRef}
            color="#00f0ff"
            emissive="#00f0ff"
            emissiveIntensity={activeLane === 0 ? 3.5 : 1.0}
            toneMapped={false}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.75, 32]} />
          <meshStandardMaterial
            color="#002b4d"
            transparent
            opacity={0.5}
          />
        </mesh>
      </group>

      {/* Lane 1 Hit Target Pad (X = +2.2) */}
      <group position={[2.2, 0.03, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1.05, 32]} />
          <meshStandardMaterial
            ref={lane1MatRef}
            color="#ec4899"
            emissive="#ec4899"
            emissiveIntensity={activeLane === 1 ? 3.5 : 1.0}
            toneMapped={false}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.75, 32]} />
          <meshStandardMaterial
            color="#4a0429"
            transparent
            opacity={0.5}
          />
        </mesh>
      </group>

      {/* 8. Perspective Overhead Cyber Arches at Regular Distances */}
      {[-25, -50, -75, -100].map((archZ) => (
        <group key={`arch-${archZ}`} position={[0, 0, archZ]}>
          {/* Left Vertical Pillar */}
          <mesh position={[-ROAD_WIDTH / 2 - 0.2, 2.5, 0]}>
            <boxGeometry args={[0.2, 5.0, 0.3]} />
            <meshStandardMaterial
              color="#0d1b2a"
              emissive="#00f0ff"
              emissiveIntensity={0.8}
              toneMapped={false}
            />
          </mesh>
          {/* Right Vertical Pillar */}
          <mesh position={[ROAD_WIDTH / 2 + 0.2, 2.5, 0]}>
            <boxGeometry args={[0.2, 5.0, 0.3]} />
            <meshStandardMaterial
              color="#0d1b2a"
              emissive="#ec4899"
              emissiveIntensity={0.8}
              toneMapped={false}
            />
          </mesh>
          {/* Horizontal Overhead Beam */}
          <mesh position={[0, 5.0, 0]}>
            <boxGeometry args={[ROAD_WIDTH + 0.6, 0.2, 0.3]} />
            <meshStandardMaterial
              color="#1e1b4b"
              emissive="#8b5cf6"
              emissiveIntensity={1.2}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export default HighwayRoad;
