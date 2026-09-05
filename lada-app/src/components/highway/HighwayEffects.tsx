import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration, Glitch } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useRhythmGameStore } from '../../store/useRhythmGameStore';

export interface HighwayEffectsProps {
  bpm?: number;
}

interface Spark {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  color: THREE.Color;
}

interface ShockwaveRing {
  id: number;
  x: number;
  scale: number;
  opacity: number;
  color: THREE.Color;
}

const MAX_SPARKS = 120;

export const HighwayEffects: React.FC<HighwayEffectsProps> = ({ bpm = 120 }) => {
  // Dynamic tempo light
  const tempoLightRef = useRef<THREE.PointLight>(null);

  // Sparks simulation
  const sparksRef = useRef<Spark[]>([]);
  const pointsRef = useRef<THREE.Points>(null);

  const sparkGeometry = React.useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_SPARKS * 3), 3));
    geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_SPARKS * 3), 3));
    return geom;
  }, []);

  // Store subscription for hit reactions
  const hitFeedback = useRhythmGameStore((s) => s.hitFeedback);
  const selectedLane = useRhythmGameStore((s) => s.selectedLane);
  const lastFeedbackTimeRef = useRef<number>(0);

  // Shockwave Rings simulation
  const shockwavesRef = useRef<ShockwaveRing[]>([]);
  const ringGroupRef = useRef<THREE.Group>(null);

  // Glitch / Error postprocessing states
  const [isGlitching, setIsGlitching] = useState<boolean>(false);
  const [aberrationOffset, setAberrationOffset] = useState<number>(0.001);

  // Trigger spark explosion, shockwave, or glitch on new hit feedback
  useEffect(() => {
    if (!hitFeedback || hitFeedback.timestamp === lastFeedbackTimeRef.current) return;
    lastFeedbackTimeRef.current = hitFeedback.timestamp;

    const originX = selectedLane === 0 ? -2.2 : 2.2;

    // A. Mistake: Trigger chromatic glitch burst
    if (hitFeedback.text === 'MISS') {
      setIsGlitching(true);
      setAberrationOffset(0.015); // Intense chromatic aberration
      const timer = setTimeout(() => {
        setIsGlitching(false);
        setAberrationOffset(0.001);
      }, 350);
      return () => clearTimeout(timer);
    }

    // B. Perfect / Good: Spawn Neon Shockwave Ring + Sparks
    const isPerfect = hitFeedback.text.includes('PERFECT');
    const burstColor = new THREE.Color(isPerfect ? '#38bdf8' : '#10b981');

    // Add expanding shockwave ring
    shockwavesRef.current.push({
      id: Date.now() + Math.random(),
      x: originX,
      scale: 0.3,
      opacity: 1.0,
      color: burstColor
    });

    const sparkCount = isPerfect ? 40 : 25;
    for (let i = 0; i < sparkCount; i++) {
      if (sparksRef.current.length >= MAX_SPARKS) {
        sparksRef.current.shift(); // Evict oldest
      }
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 5.0;
      sparksRef.current.push({
        pos: new THREE.Vector3(originX, 0.4, 0),
        vel: new THREE.Vector3(
          Math.cos(angle) * speed * 0.8,
          2.0 + Math.random() * 4.5,
          Math.sin(angle) * speed * 0.8
        ),
        life: 0,
        maxLife: 0.45 + Math.random() * 0.35,
        color: burstColor
      });
    }
  }, [hitFeedback, selectedLane]);

  useFrame(({ clock }, delta) => {
    // 1. Dynamic Tempo Lighting Pulse
    const elapsed = clock.getElapsedTime();
    const beatFrequency = (bpm / 60) * Math.PI * 2;
    const pulse = Math.sin(elapsed * beatFrequency) * 0.5 + 0.5;

    if (tempoLightRef.current) {
      tempoLightRef.current.intensity = 1.5 + pulse * 2.5;
      tempoLightRef.current.color.setHSL(0.5 + pulse * 0.3, 1.0, 0.6);
    }

    // 2. Animate Shockwave Rings
    const shockwaves = shockwavesRef.current;
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      sw.scale += delta * 9.0;
      sw.opacity -= delta * 2.2;
      if (sw.opacity <= 0) {
        shockwaves.splice(i, 1);
      }
    }

    // Update shockwave meshes in group if present
    if (ringGroupRef.current) {
      const children = ringGroupRef.current.children;
      for (let i = 0; i < children.length; i++) {
        const mesh = children[i] as THREE.Mesh;
        const sw = shockwaves[i];
        if (sw && mesh) {
          mesh.visible = true;
          mesh.position.set(sw.x, 0.1, 0);
          mesh.scale.set(sw.scale, sw.scale, sw.scale);
          const mat = mesh.material as THREE.MeshBasicMaterial;
          if (mat) {
            mat.color = sw.color;
            mat.opacity = Math.max(0, sw.opacity);
          }
        } else if (mesh) {
          mesh.visible = false;
        }
      }
    }

    // 3. Physics & Particle Life Update
    const points = pointsRef.current;
    if (!points) return;

    const posAttr = points.geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
    const colAttr = points.geometry.getAttribute('color') as THREE.BufferAttribute | undefined;
    if (!posAttr || !colAttr) return;

    const positions = posAttr.array as Float32Array;
    const colors = colAttr.array as Float32Array;
    const sparks = sparksRef.current;

    for (let i = sparks.length - 1; i >= 0; i--) {
      const spark = sparks[i];
      spark.life += delta;

      if (spark.life >= spark.maxLife) {
        sparks.splice(i, 1);
        continue;
      }

      // Gravity & drag
      spark.vel.y -= 9.8 * delta;
      spark.pos.addScaledVector(spark.vel, delta);

      // Fade out
      const progress = spark.life / spark.maxLife;
      const alpha = 1.0 - progress;

      positions[i * 3] = spark.pos.x;
      positions[i * 3 + 1] = spark.pos.y;
      positions[i * 3 + 2] = spark.pos.z;

      colors[i * 3] = spark.color.r * alpha;
      colors[i * 3 + 1] = spark.color.g * alpha;
      colors[i * 3 + 2] = spark.color.b * alpha;
    }

    // Clear unused slots
    for (let i = sparks.length; i < MAX_SPARKS; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -100;
      positions[i * 3 + 2] = 0;
      colors[i * 3] = 0;
      colors[i * 3 + 1] = 0;
      colors[i * 3 + 2] = 0;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  return (
    <>
      {/* ─── SCENE LIGHTING ─── */}
      <ambientLight intensity={0.4} color="#0b132b" />
      <directionalLight
        position={[0, 15, 5]}
        intensity={1.2}
        color="#8b5cf6"
      />
      {/* High-speed road horizon spotlight */}
      <spotLight
        position={[0, 8, 20]}
        target-position={[0, 0, -40]}
        intensity={1.5}
        angle={0.6}
        penumbra={0.8}
        color="#00f0ff"
      />
      {/* Tempo-pulsing neon point light over the highway */}
      <pointLight
        ref={tempoLightRef}
        position={[0, 4.0, -12]}
        intensity={2.0}
        distance={35}
      />

      {/* ─── EXPANDING NEON SHOCKWAVE RINGS POOL ─── */}
      <group ref={ringGroupRef}>
        {[0, 1, 2, 3, 4].map((idx) => (
          <mesh key={idx} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
            <ringGeometry args={[0.8, 1.05, 32]} />
            <meshBasicMaterial
              color="#38bdf8"
              transparent
              opacity={0.8}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* ─── HIT BURST SPARKS PARTICLE SYSTEM ─── */}
      <points ref={pointsRef} geometry={sparkGeometry}>
        <pointsMaterial
          size={0.12}
          vertexColors
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </points>

      {/* ─── CYBERPUNK POSTPROCESSING PIPELINE ─── */}
      <EffectComposer enableNormalPass={false} multisampling={4}>
        <Bloom
          mipmapBlur
          intensity={isGlitching ? 2.8 : 1.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.8}
        />
        <ChromaticAberration
          offset={new THREE.Vector2(aberrationOffset, aberrationOffset)}
          radialModulation={false}
          modulationOffset={0}
        />
        {isGlitching && (
          <Glitch
            delay={new THREE.Vector2(0, 0)}
            duration={new THREE.Vector2(0.15, 0.25)}
            strength={new THREE.Vector2(0.4, 0.7)}
            active
            ratio={0.85}
          />
        )}
      </EffectComposer>
    </>
  );
};

export default HighwayEffects;

