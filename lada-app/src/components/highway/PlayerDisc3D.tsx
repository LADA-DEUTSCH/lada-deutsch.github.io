import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface PlayerDisc3DProps {
  selectedLane: 0 | 1;
}

const LANE_COORDS: Record<0 | 1, number> = {
  0: -2.2,
  1: 2.2
};

export const PlayerDisc3D: React.FC<PlayerDisc3DProps> = ({ selectedLane }) => {
  const rootRef = useRef<THREE.Group>(null);
  const craftRef = useRef<THREE.Group>(null);
  const thrusterRef = useRef<THREE.MeshStandardMaterial>(null);
  const currentXRef = useRef<number>(LANE_COORDS[selectedLane]);

  const targetX = LANE_COORDS[selectedLane];
  const craftColor = selectedLane === 0 ? '#00f0ff' : '#ec4899';

  useFrame((state, delta) => {
    if (!rootRef.current || !craftRef.current) return;

    // 1. Smoothly lerp horizontal position towards active lane
    currentXRef.current = THREE.MathUtils.lerp(currentXRef.current, targetX, Math.min(1.0, delta * 14.0));
    rootRef.current.position.x = currentXRef.current;

    // 2. Compute steering velocity & bank/roll tilt
    const dx = targetX - currentXRef.current;
    craftRef.current.rotation.z = -dx * 0.22; // bank tilt into turn
    craftRef.current.rotation.y = dx * 0.12;  // subtle yaw steering

    // 3. Hover bobbing (vertical sine wave oscillation)
    const elapsed = state.clock.getElapsedTime();
    const hoverY = 0.32 + Math.sin(elapsed * 6.0) * 0.05;
    craftRef.current.position.y = hoverY;

    // 4. Engine thruster pulse
    if (thrusterRef.current) {
      thrusterRef.current.emissiveIntensity = 2.5 + Math.sin(elapsed * 25.0) * 1.5;
    }
  });

  return (
    <group ref={rootRef} position={[targetX, 0, 0]}>
      {/* Ground Projection Hologram Ring under the hovercraft */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.15, 32]} />
        <meshStandardMaterial
          color={craftColor}
          emissive={craftColor}
          emissiveIntensity={2.5}
          toneMapped={false}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Cyber Hovercraft Body */}
      <group ref={craftRef} position={[0, 0.32, 0]}>
        {/* Main Sleek Hull (Aerodynamic Wedge / Saucer) */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.7, 1.1, 0.16, 24]} />
          <meshStandardMaterial
            color="#090d16"
            roughness={0.15}
            metalness={0.9}
          />
        </mesh>

        {/* Outer Neon Edge Ring */}
        <mesh position={[0, -0.02, 0]}>
          <torusGeometry args={[1.08, 0.035, 16, 32]} />
          <meshStandardMaterial
            color={craftColor}
            emissive={craftColor}
            emissiveIntensity={3.2}
            toneMapped={false}
          />
        </mesh>

        {/* Central Energy Core / Glowing Canopy */}
        <mesh position={[0, 0.12, -0.05]}>
          <sphereGeometry args={[0.38, 24, 16]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={craftColor}
            emissiveIntensity={3.5}
            toneMapped={false}
            roughness={0.1}
          />
        </mesh>

        {/* Left Aerodynamic Stabilizer Fin */}
        <mesh position={[-0.95, 0.08, 0.2]} rotation={[0, 0, 0.25]}>
          <boxGeometry args={[0.4, 0.06, 0.6]} />
          <meshStandardMaterial
            color="#0f172a"
            emissive={craftColor}
            emissiveIntensity={1.2}
            toneMapped={false}
          />
        </mesh>

        {/* Right Aerodynamic Stabilizer Fin */}
        <mesh position={[0.95, 0.08, 0.2]} rotation={[0, 0, -0.25]}>
          <boxGeometry args={[0.4, 0.06, 0.6]} />
          <meshStandardMaterial
            color="#0f172a"
            emissive={craftColor}
            emissiveIntensity={1.2}
            toneMapped={false}
          />
        </mesh>

        {/* Dual Rear Engine Exhaust Thrusters */}
        <mesh position={[-0.4, -0.02, 0.65]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.15, 0.35, 16]} />
          <meshStandardMaterial
            ref={thrusterRef}
            color="#38bdf8"
            emissive="#00f0ff"
            emissiveIntensity={3.0}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0.4, -0.02, 0.65]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.15, 0.35, 16]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#00f0ff"
            emissiveIntensity={3.0}
            toneMapped={false}
          />
        </mesh>

        {/* Dynamic Point Light from Engine */}
        <pointLight
          position={[0, 0, 0.8]}
          color={craftColor}
          intensity={2.0}
          distance={4.0}
        />
      </group>
    </group>
  );
};

export default PlayerDisc3D;
