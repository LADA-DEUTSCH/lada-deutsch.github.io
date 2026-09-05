import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  X,
  RotateCcw,
  Trophy,
  Award,
  Mic,
  Flame,
  Maximize,
  Minimize
} from 'lucide-react';
import type { SongDefinition, GameDifficultyLevel, SongLyricItem } from '../types';
import { MusicSynthEngine } from '../services/musicSynthEngine';
import { VoiceRater } from '../services/voiceRater';
import { recordLevelResult, getSongProgress } from '../services/gameProgressStorage';
import { toggleFullscreen, isFullscreen } from '../services/fullscreenUtils';

interface Beat3DHighwayProps {
  song: SongDefinition;
  level: GameDifficultyLevel;
  onExit: () => void;
  onLevelComplete?: () => void;
}

interface ActiveTile {
  lyric: SongLyricItem;
  spawnTime: number;
  targetTime: number;
  correctLane: 0 | 1;
  resolved: boolean;
  userSelectedLane: 0 | 1 | null;
  result?: 'perfect' | 'miss';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
}

export const Beat3DHighway: React.FC<Beat3DHighwayProps> = ({
  song,
  level,
  onExit,
  onLevelComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [currentAccuracy, setCurrentAccuracy] = useState(100);
  const [songProgressPct, setSongProgressPct] = useState(0);
  const [selectedLane, setSelectedLane] = useState<0 | 1>(0);
  const [gameState, setGameState] = useState<'playing' | 'ended'>('playing');
  const [isFullscreenMode, setIsFullscreenMode] = useState(isFullscreen());

  // Mic and voice transcription for Level 3
  const [liveTranscript, setLiveTranscript] = useState('');
  const [currentPromptWord, setCurrentPromptWord] = useState('');

  // End game summary
  const [endResult, setEndResult] = useState<{
    score: number;
    accuracy: number;
    perfectStreak: number;
    unlockedNext: boolean;
    becameMastered: boolean;
  } | null>(null);

  // Engines
  const audioEngineRef = useRef<MusicSynthEngine | null>(null);
  const voiceRaterRef = useRef<VoiceRater | null>(null);

  // Gameplay tracking
  const activeTilesRef = useRef<ActiveTile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const hitsCountRef = useRef({ total: 0, correct: 0 });
  const roadScrollRef = useRef<number>(0);
  const screenShakeRef = useRef<number>(0);
  const cameraTiltRef = useRef<number>(0);

  const selectedLaneRef = useRef<0 | 1>(0);

  const chooseLane = useCallback((lane: 0 | 1) => {
    setSelectedLane(lane);
    selectedLaneRef.current = lane;
  }, []);

  const handleFullscreen = () => {
    toggleFullscreen();
    setIsFullscreenMode(!isFullscreenMode);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        chooseLane(0);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        chooseLane(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chooseLane]);

  // Touch screen lane steering (Two-Thumb Tap Anywhere)
  const handleTouchScreen = (e: React.TouchEvent) => {
    if (gameState !== 'playing' || level !== 2) return;
    const touch = e.touches[0];
    if (!touch) return;
    const w = window.innerWidth;
    if (touch.clientX < w / 2) {
      chooseLane(0);
    } else {
      chooseLane(1);
    }
  };

  // Initialize Engines & Audio
  useEffect(() => {
    audioEngineRef.current = new MusicSynthEngine();
    voiceRaterRef.current = new VoiceRater();

    if (level === 3) {
      voiceRaterRef.current.startListening((text) => {
        setLiveTranscript(text);
      });
    }

    audioEngineRef.current.startSongRhythm(song.bpm, song.instrument);

    const TRAVEL_TIME_SEC = level === 1 ? 4.5 : 3.5;
    const tiles: ActiveTile[] = song.lyrics.map((l) => {
      const correctLane: 0 | 1 = Math.random() > 0.5 ? 1 : 0;
      return {
        lyric: l,
        spawnTime: Math.max(0, l.timingSec - TRAVEL_TIME_SEC),
        targetTime: l.timingSec,
        correctLane,
        resolved: false,
        userSelectedLane: null
      };
    });

    activeTilesRef.current = tiles;
    startTimeRef.current = performance.now() / 1000;
    roadScrollRef.current = 0;
    hitsCountRef.current = { total: 0, correct: 0 };
    screenShakeRef.current = 0;
    cameraTiltRef.current = 0;

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioEngineRef.current?.dispose();
      voiceRaterRef.current?.stopListening();
    };
  }, [song, level]);

  const spawnParticles = (x: number, y: number, color: string, count: number = 26) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7 + 2.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 4 + 2,
        alpha: 1.0,
        life: 1.0
      });
    }
  };

  // Main 3D Render Loop (Modern AAA Widescreen Runway)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const w = canvas.width;
      const h = canvas.height;
      const now = performance.now() / 1000;
      const songElapsed = now - startTimeRef.current;

      const totalDuration = song.lyrics[song.lyrics.length - 1].timingSec + 4;
      const progress = Math.min(100, Math.round((songElapsed / totalDuration) * 100));
      setSongProgressPct(progress);

      if (songElapsed > totalDuration && activeTilesRef.current.every((t) => t.resolved)) {
        if (gameState === 'playing') {
          handleGameEnd();
        }
      }

      // Smooth Camera Tilt
      const targetTilt = selectedLaneRef.current === 0 ? -0.02 : 0.02;
      cameraTiltRef.current += (targetTilt - cameraTiltRef.current) * 0.12;

      // Screen Shake
      let shakeX = 0;
      let shakeY = 0;
      if (screenShakeRef.current > 0.1) {
        shakeX = (Math.random() * 2 - 1) * screenShakeRef.current;
        shakeY = (Math.random() * 2 - 1) * screenShakeRef.current;
        screenShakeRef.current *= 0.85;
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // 1. Clear Screen — Deep Matte Carbon
      ctx.fillStyle = '#060813';
      ctx.fillRect(0, 0, w, h);

      // 2. Horizon — Atmospheric Deep Blue Minimalist Glow (No cheesy suns!)
      const horizonY = h * 0.35;
      const cx = w / 2;

      const horizonGlow = ctx.createLinearGradient(0, horizonY - 60, 0, horizonY + 20);
      horizonGlow.addColorStop(0, 'rgba(6, 8, 19, 0)');
      horizonGlow.addColorStop(0.7, 'rgba(30, 58, 138, 0.18)');
      horizonGlow.addColorStop(1, 'rgba(6, 8, 19, 0)');
      ctx.fillStyle = horizonGlow;
      ctx.fillRect(0, horizonY - 60, w, 80);

      // Subtle Distant Star Dust
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      for (let i = 0; i < 16; i++) {
        const sx = ((i * 137.5) % w);
        const sy = (i * 29) % horizonY;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Camera Tilt Matrix
      ctx.save();
      ctx.translate(cx, horizonY);
      ctx.rotate(cameraTiltRef.current);
      ctx.translate(-cx, -horizonY);

      // 3. Precision Runway Geometry
      const roadTopWidth = w * 0.14;
      const roadBottomWidth = Math.min(w * 0.88, 1000);
      const hitY = h * 0.83;

      const pTopLeft = { x: cx - roadTopWidth / 2, y: horizonY };
      const pTopRight = { x: cx + roadTopWidth / 2, y: horizonY };
      const pBottomLeft = { x: cx - roadBottomWidth / 2, y: h };
      const pBottomRight = { x: cx + roadBottomWidth / 2, y: h };

      // Dark Metallic Asphalt Road Surface
      ctx.beginPath();
      ctx.moveTo(pTopLeft.x, pTopLeft.y);
      ctx.lineTo(pTopRight.x, pTopRight.y);
      ctx.lineTo(pBottomRight.x, pBottomRight.y);
      ctx.lineTo(pBottomLeft.x, pBottomLeft.y);
      ctx.closePath();

      const roadGrad = ctx.createLinearGradient(0, horizonY, 0, h);
      roadGrad.addColorStop(0, '#090d1e');
      roadGrad.addColorStop(1, '#0e152e');
      ctx.fillStyle = roadGrad;
      ctx.fill();

      // Precision Laser Guide Rails (Left: Electric Blue, Right: Warm Amber)
      ctx.lineWidth = 3.5;
      ctx.shadowBlur = 16;

      // Left Rail (Electric Blue #38bdf8)
      ctx.shadowColor = '#38bdf8';
      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(pTopLeft.x, pTopLeft.y);
      ctx.lineTo(pBottomLeft.x, pBottomLeft.y);
      ctx.stroke();

      // Right Rail (Warm Amber #f59e0b)
      ctx.shadowColor = '#f59e0b';
      ctx.strokeStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(pTopRight.x, pTopRight.y);
      ctx.lineTo(pBottomRight.x, pBottomRight.y);
      ctx.stroke();

      // Center Divider (Subtle Minimalist Dashed)
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#64748b';
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.setLineDash([14, 14]);
      ctx.beginPath();
      ctx.moveTo(cx, horizonY);
      ctx.lineTo(cx, h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      // Road Speed Pulse Lines
      roadScrollRef.current = (roadScrollRef.current + (song.bpm / 60) * 0.045) % 1;
      const numSpeedLines = 8;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < numSpeedLines; i++) {
        const lineProg = (i / numSpeedLines + roadScrollRef.current) % 1;
        const lineZ = Math.pow(lineProg, 2.3);
        const ly = horizonY + (h - horizonY) * lineZ;
        const lw = roadTopWidth + (roadBottomWidth - roadTopWidth) * lineZ;
        ctx.beginPath();
        ctx.moveTo(cx - lw / 2, ly);
        ctx.lineTo(cx + lw / 2, ly);
        ctx.stroke();
      }

      // 4. Hit Zone / Target Line
      const hitLineWidth =
        roadTopWidth + (roadBottomWidth - roadTopWidth) * ((hitY - horizonY) / (h - horizonY));
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#38bdf8';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(cx - hitLineWidth / 2, hitY);
      ctx.lineTo(cx + hitLineWidth / 2, hitY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Player Lane Indicator Pad
      const playerLane = selectedLaneRef.current;
      const halfLaneWidth = hitLineWidth / 4;
      const playerIndicatorX = playerLane === 0 ? cx - halfLaneWidth : cx + halfLaneWidth;

      if (level === 2) {
        ctx.fillStyle =
          playerLane === 0 ? 'rgba(56, 189, 248, 0.55)' : 'rgba(245, 158, 11, 0.55)';
        ctx.shadowBlur = 25;
        ctx.shadowColor = playerLane === 0 ? '#38bdf8' : '#f59e0b';
        ctx.beginPath();
        ctx.ellipse(playerIndicatorX, hitY, halfLaneWidth * 0.75, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 5. Active 3D Lyric Tiles
      const TRAVEL_TIME_SEC = level === 1 ? 4.5 : 3.5;

      activeTilesRef.current.forEach((tile) => {
        const timeUntilHit = tile.targetTime - songElapsed;

        if (songElapsed < tile.spawnTime || timeUntilHit < -0.6) {
          if (timeUntilHit < -0.6 && !tile.resolved) {
            tile.resolved = true;
            handleTileHit(tile, false);
          }
          return;
        }

        const zProg = Math.max(0, Math.min(1.2, 1 - timeUntilHit / TRAVEL_TIME_SEC));
        const nonLinearZ = Math.pow(zProg, 1.8);
        const tileY = horizonY + (hitY - horizonY) * nonLinearZ;
        const currentRoadW =
          roadTopWidth + (roadBottomWidth - roadTopWidth) * ((tileY - horizonY) / (h - horizonY));
        const scale = 0.4 + 0.6 * nonLinearZ;

        if (level === 2) {
          // --- LEVEL 2: DUAL-CHOICE RUNNER ---
          const laneOffset = currentRoadW / 4;
          const leftX = cx - laneOffset;
          const rightX = cx + laneOffset;

          const leftText =
            tile.correctLane === 0 ? tile.lyric.darijaCorrect : tile.lyric.darijaDistractor;
          const rightText =
            tile.correctLane === 1 ? tile.lyric.darijaCorrect : tile.lyric.darijaDistractor;

          // German Word Floating Banner Above Gates
          ctx.save();
          ctx.translate(cx, tileY - 44 * scale);
          ctx.scale(scale, scale);
          ctx.fillStyle = 'rgba(10, 15, 30, 0.95)';
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2;
          ctx.shadowBlur = 14;
          ctx.shadowColor = '#facc15';
          ctx.beginPath();
          ctx.roundRect(-150, -20, 300, 40, 10);
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 18px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(tile.lyric.german, 0, 0);
          ctx.restore();

          // Gate 0 (Left Lane)
          renderChoiceGate(ctx, leftX, tileY, scale, leftText, 0, selectedLaneRef.current === 0);

          // Gate 1 (Right Lane)
          renderChoiceGate(ctx, rightX, tileY, scale, rightText, 1, selectedLaneRef.current === 1);

          // Strike Line Judgment
          if (timeUntilHit <= 0.05 && !tile.resolved) {
            tile.resolved = true;
            const chosen = selectedLaneRef.current;
            const isCorrect = chosen === tile.correctLane;
            const chosenX = chosen === 0 ? leftX : rightX;
            tile.userSelectedLane = chosen;
            tile.result = isCorrect ? 'perfect' : 'miss';

            if (isCorrect) {
              spawnParticles(chosenX, hitY, '#38bdf8', 28);
              audioEngineRef.current?.playHitFx(true);
              audioEngineRef.current?.speakGermanLyric(tile.lyric.german, false);
              screenShakeRef.current = 5;
            } else {
              spawnParticles(chosenX, hitY, '#ef4444', 16);
              audioEngineRef.current?.playMissFx();
              screenShakeRef.current = 7;
            }
            handleTileHit(tile, isCorrect);
          }
        } else if (level === 3) {
          // --- LEVEL 3: VOICE ARENA ---
          ctx.save();
          ctx.translate(cx, tileY);
          ctx.scale(scale, scale);

          const cardW = 280;
          const cardH = 70;
          ctx.fillStyle = 'rgba(10, 15, 30, 0.95)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.shadowBlur = 18;
          ctx.shadowColor = '#38bdf8';
          ctx.beginPath();
          ctx.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 12);
          ctx.fill();
          ctx.stroke();

          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 22px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(tile.lyric.german, 0, -8);

          ctx.fillStyle = '#93c5fd';
          ctx.font = '700 13px system-ui, sans-serif';
          ctx.fillText(`[ ${tile.lyric.phoneticGuide} ]`, 0, 16);
          ctx.restore();

          if (timeUntilHit < 0.9 && timeUntilHit > -0.2) {
            setCurrentPromptWord(tile.lyric.german);
          }

          if (timeUntilHit <= 0.05 && !tile.resolved) {
            tile.resolved = true;
            const evaluation = voiceRaterRef.current?.evaluateTargetWord(tile.lyric.german);
            const isMatch = evaluation ? evaluation.isMatch : false;

            tile.result = isMatch ? 'perfect' : 'miss';
            if (isMatch) {
              spawnParticles(cx, hitY, '#38bdf8', 30);
              audioEngineRef.current?.playHitFx(true);
              screenShakeRef.current = 5;
            } else {
              spawnParticles(cx, hitY, '#ef4444', 16);
              audioEngineRef.current?.playMissFx();
              screenShakeRef.current = 7;
            }
            handleTileHit(tile, isMatch);
            voiceRaterRef.current?.resetTranscript();
          }
        }
      });

      // 6. Particle Emitter
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.035;
        p.life -= 0.035;

        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      ctx.restore(); // Restore Tilt
      ctx.restore(); // Restore Shake

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [song, level, gameState]);

  // Choice Gate Render — Sleek Frosted Glass
  const renderChoiceGate = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    text: string,
    laneIndex: number,
    isSelected: boolean
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const gateW = 150;
    const gateH = 54;

    ctx.fillStyle = isSelected
      ? laneIndex === 0
        ? 'rgba(30, 58, 138, 0.95)'
        : 'rgba(120, 53, 15, 0.95)'
      : 'rgba(15, 23, 42, 0.9)';

    ctx.strokeStyle = laneIndex === 0 ? '#38bdf8' : '#f59e0b';
    ctx.lineWidth = isSelected ? 3 : 1.5;

    if (isSelected) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = laneIndex === 0 ? '#38bdf8' : '#f59e0b';
    }

    ctx.beginPath();
    ctx.roundRect(-gateW / 2, -gateH / 2, gateW, gateH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = isSelected ? '#ffffff' : '#cbd5e1';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 0);

    ctx.restore();
  };

  const handleTileHit = (_tile: ActiveTile, isCorrect: boolean) => {
    hitsCountRef.current.total += 1;
    if (isCorrect) {
      hitsCountRef.current.correct += 1;
      setScore((prev) => prev + 100 + combo * 10);
      setCombo((prev) => {
        const next = prev + 1;
        if (next > maxCombo) setMaxCombo(next);
        if (next % 5 === 0) {
          audioEngineRef.current?.playStreakFx(next);
        }
        return next;
      });
    } else {
      setCombo(0);
    }

    const acc = Math.round((hitsCountRef.current.correct / hitsCountRef.current.total) * 100);
    setCurrentAccuracy(acc);
  };

  const handleGameEnd = () => {
    setGameState('ended');
    audioEngineRef.current?.stopSongRhythm();

    const finalAcc =
      hitsCountRef.current.total > 0
        ? Math.round((hitsCountRef.current.correct / hitsCountRef.current.total) * 100)
        : 100;

    const result = recordLevelResult(song.id, level, score, finalAcc);

    const updatedProg = getSongProgress(song.id);
    const streak = level === 2 ? updatedProg.level2PerfectCount : updatedProg.level3PerfectCount;

    setEndResult({
      score,
      accuracy: finalAcc,
      perfectStreak: streak,
      unlockedNext: result.unlockedNext,
      becameMastered: result.becameMastered
    });

    if (onLevelComplete) {
      onLevelComplete();
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audioEngineRef.current?.setMuted(next);
  };

  return (
    <div
      onTouchStart={handleTouchScreen}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#060813',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        overflow: 'hidden'
      }}
    >
      {/* Top Header HUD */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          height: '52px',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(to bottom, rgba(6,8,19,0.95), rgba(6,8,19,0))'
        }}
      >
        {/* Left: Exit & Song */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onExit}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={15} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff' }}>
                #{song.number} {song.title}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background:
                    level === 2 ? 'rgba(56,189,248,0.18)' : 'rgba(245,158,11,0.18)',
                  color: level === 2 ? '#38bdf8' : '#f59e0b'
                }}
              >
                {level === 2 ? 'NIVEAU 2: 3D CHOICE' : 'NIVEAU 3: VOICE ARENA'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Score, Accuracy, Fullscreen, Mute */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '17px', fontWeight: 900, color: '#38bdf8' }}>{score}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Acc: {currentAccuracy}%</div>
          </div>

          <button
            onClick={handleFullscreen}
            title="Fullscreen Toggle"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {isFullscreenMode ? <Minimize size={15} /> : <Maximize size={15} />}
          </button>

          <button
            onClick={toggleMute}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: isMuted ? '#ef4444' : '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        </div>
      </div>

      {/* Song Progress Line */}
      <div
        style={{
          position: 'absolute',
          top: '52px',
          left: 0,
          right: 0,
          height: '3px',
          background: 'rgba(255,255,255,0.08)',
          zIndex: 20
        }}
      >
        <div
          style={{
            width: `${songProgressPct}%`,
            height: '100%',
            background: 'linear-gradient(to right, #38bdf8, #f59e0b)',
            transition: 'width 0.2s linear'
          }}
        />
      </div>

      {/* Combo Badge */}
      {combo > 1 && (
        <div
          style={{
            position: 'absolute',
            top: '64px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 14px',
            borderRadius: '20px',
            background: 'rgba(245, 158, 11, 0.2)',
            border: '1px solid rgba(245, 158, 11, 0.5)',
            color: '#f59e0b',
            fontSize: '13px',
            fontWeight: 900
          }}
        >
          <Flame size={14} />
          <span>COMBO x{combo}</span>
        </div>
      )}

      {/* Level 3 Voice Prompt */}
      {level === 3 && (
        <div
          style={{
            position: 'absolute',
            top: '96px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '24px',
            padding: '6px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#93c5fd',
            fontSize: '12px'
          }}
        >
          <Mic size={15} color="#38bdf8" />
          <span>
            Qra b sawt 3ali: <strong>{currentPromptWord || '...'}</strong>
          </span>
          {liveTranscript && (
            <span style={{ color: '#facc15', fontStyle: 'italic' }}>({liveTranscript})</span>
          )}
        </div>
      )}

      {/* Main 3D Canvas */}
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />

      {/* Two-Thumb Mobile Touch Pads */}
      {level === 2 && gameState === 'playing' && (
        <>
          <div
            onClick={(e) => {
              e.stopPropagation();
              chooseLane(0);
            }}
            style={{
              position: 'absolute',
              bottom: '18px',
              left: '22px',
              zIndex: 30,
              padding: '12px 24px',
              borderRadius: '14px',
              background:
                selectedLane === 0
                  ? 'linear-gradient(135deg, rgba(56,189,248,0.5), rgba(14,165,233,0.3))'
                  : 'rgba(15, 23, 42, 0.85)',
              border: selectedLane === 0 ? '2px solid #38bdf8' : '1px solid rgba(56,189,248,0.3)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: selectedLane === 0 ? '0 0 20px rgba(56,189,248,0.4)' : 'none',
              transition: 'all 0.1s ease'
            }}
          >
            ← KHIYAR 1
          </div>

          <div
            onClick={(e) => {
              e.stopPropagation();
              chooseLane(1);
            }}
            style={{
              position: 'absolute',
              bottom: '18px',
              right: '22px',
              zIndex: 30,
              padding: '12px 24px',
              borderRadius: '14px',
              background:
                selectedLane === 1
                  ? 'linear-gradient(135deg, rgba(245,158,11,0.5), rgba(217,119,6,0.3))'
                  : 'rgba(15, 23, 42, 0.85)',
              border: selectedLane === 1 ? '2px solid #f59e0b' : '1px solid rgba(245,158,11,0.3)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: selectedLane === 1 ? '0 0 20px rgba(245,158,11,0.4)' : 'none',
              transition: 'all 0.1s ease'
            }}
          >
            KHIYAR 2 →
          </div>
        </>
      )}

      {/* End Game Modal */}
      {gameState === 'ended' && endResult && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 50,
            background: 'rgba(6, 8, 19, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              background: 'linear-gradient(135deg, #0b1124, #121832)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '24px',
              padding: '24px',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                margin: '0 auto 12px',
                borderRadius: '50%',
                background:
                  endResult.accuracy >= 100
                    ? 'rgba(234, 179, 8, 0.2)'
                    : 'rgba(56, 189, 248, 0.2)',
                border:
                  endResult.accuracy >= 100 ? '2px solid #facc15' : '2px solid #38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: endResult.accuracy >= 100 ? '#facc15' : '#38bdf8'
              }}
            >
              {endResult.becameMastered ? <Trophy size={26} /> : <Award size={26} />}
            </div>

            <h2 style={{ fontSize: '19px', fontWeight: 900, color: '#ffffff', marginBottom: '4px' }}>
              {endResult.accuracy >= 100 ? 'FLAWLESS RUN! 100%' : 'GOOD EFFORT!'}
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
              #{song.number} {song.title} · {level === 2 ? 'Niveau 2' : 'Niveau 3'}
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <div
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '12px',
                  padding: '10px 6px',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Score</div>
                <div style={{ fontSize: '17px', fontWeight: 900, color: '#38bdf8' }}>
                  {endResult.score}
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '12px',
                  padding: '10px 6px',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Accuracy</div>
                <div
                  style={{
                    fontSize: '17px',
                    fontWeight: 900,
                    color: endResult.accuracy >= 100 ? '#4ade80' : '#facc15'
                  }}
                >
                  {endResult.accuracy}%
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '12px',
                  padding: '10px 6px',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Max Combo</div>
                <div style={{ fontSize: '17px', fontWeight: 900, color: '#f59e0b' }}>
                  x{maxCombo}
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '12px',
                marginBottom: '18px',
                fontSize: '12px'
              }}
            >
              {level === 2 && (
                <div>
                  <div style={{ color: '#ffffff', fontWeight: 800, marginBottom: '4px' }}>
                    Flawless 100% Streak:{' '}
                    <span style={{ color: '#facc15' }}>{endResult.perfectStreak} / 10</span>
                  </div>
                  {endResult.unlockedNext ? (
                    <div style={{ color: '#38bdf8', fontWeight: 800 }}>
                      🎉 Félicitations! Jbti 100% 10 lmrat! Niveau 3 (Voice Arena) t7ell!
                    </div>
                  ) : (
                    <div style={{ color: '#94a3b8' }}>
                      Khassek tjib 100% 10 d l-merrat bash it7ell lik Niveau 3 d l-micro!
                    </div>
                  )}
                </div>
              )}

              {level === 3 && (
                <div>
                  <div style={{ color: '#ffffff', fontWeight: 800, marginBottom: '4px' }}>
                    Voice Mastery Streak:{' '}
                    <span style={{ color: '#38bdf8' }}>{endResult.perfectStreak} / 10</span>
                  </div>
                  {endResult.becameMastered ? (
                    <div style={{ color: '#facc15', fontWeight: 900 }}>
                      👑 100% MASTERED! Khditi l-Couronne d l-Mastery d had l-ghoniya!
                    </div>
                  ) : (
                    <div style={{ color: '#94a3b8' }}>
                      Bqa lik {10 - endResult.perfectStreak} d l-merrat b 100% bash t-khtar l-Couronne!
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  setGameState('playing');
                  setScore(0);
                  setCombo(0);
                  setCurrentAccuracy(100);
                  activeTilesRef.current.forEach((t) => {
                    t.resolved = false;
                    t.userSelectedLane = null;
                  });
                  startTimeRef.current = performance.now() / 1000;
                  audioEngineRef.current?.startSongRhythm(song.bpm, song.instrument);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={15} />
                <span>3awed</span>
              </button>

              <button
                onClick={onExit}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Kammel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
