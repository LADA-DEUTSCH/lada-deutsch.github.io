import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  X,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Trophy,
  Award,
  Mic,
  Flame,
  CheckCircle2
} from 'lucide-react';
import type { SongDefinition, GameDifficultyLevel, SongLyricItem } from '../types';
import { RhythmAudioEngine } from '../services/rhythmAudioEngine';
import { VoiceRater } from '../services/voiceRater';
import { recordLevelResult, getSongProgress } from '../services/gameProgressStorage';

interface Beat3DHighwayProps {
  song: SongDefinition;
  level: GameDifficultyLevel;
  onExit: () => void;
  onLevelComplete?: () => void;
}

interface ActiveTile {
  lyric: SongLyricItem;
  spawnTime: number;
  targetTime: number; // When it hits the strike line
  correctLane: 0 | 1; // 0 = Left, 1 = Right
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
  const audioEngineRef = useRef<RhythmAudioEngine | null>(null);
  const voiceRaterRef = useRef<VoiceRater | null>(null);

  // Gameplay tracking
  const activeTilesRef = useRef<ActiveTile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const hitsCountRef = useRef({ total: 0, correct: 0 });
  const roadScrollRef = useRef<number>(0);

  // Selected lane ref to avoid closure staleness in render loop
  const selectedLaneRef = useRef<0 | 1>(0);

  // Helper to change selected lane
  const chooseLane = useCallback((lane: 0 | 1) => {
    setSelectedLane(lane);
    selectedLaneRef.current = lane;
  }, []);

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

  // Initialize Engines & Audio
  useEffect(() => {
    audioEngineRef.current = new RhythmAudioEngine();
    voiceRaterRef.current = new VoiceRater();

    if (level === 3) {
      voiceRaterRef.current.startListening((text) => {
        setLiveTranscript(text);
      });
    }

    // Start Song Rhythm
    audioEngineRef.current.startSongRhythm(song.bpm, song.instrument);

    // Initialize Tile Queue
    const TRAVEL_TIME_SEC = level === 1 ? 4.5 : 3.5;
    const tiles: ActiveTile[] = song.lyrics.map((l) => {
      // Randomize correct lane for Level 2
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

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioEngineRef.current?.dispose();
      voiceRaterRef.current?.stopListening();
    };
  }, [song, level]);

  // Particle explosion helper
  const spawnParticles = (x: number, y: number, color: string, count: number = 24) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
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

  // Main 3D Render and Game Loop
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

      // Update Song Progress
      const totalDuration = song.lyrics[song.lyrics.length - 1].timingSec + 4;
      const progress = Math.min(100, Math.round((songElapsed / totalDuration) * 100));
      setSongProgressPct(progress);

      // Check if song finished
      if (songElapsed > totalDuration && activeTilesRef.current.every((t) => t.resolved)) {
        if (gameState === 'playing') {
          handleGameEnd();
        }
      }

      // --- 1. Clear Screen ---
      ctx.fillStyle = '#050711';
      ctx.fillRect(0, 0, w, h);

      // --- 2. 3D Perspective Highway Background ---
      const horizonY = h * 0.28;
      const hitY = h * 0.78;
      const cx = w / 2;

      // Ambient Horizon Glow
      const gradHorizon = ctx.createRadialGradient(cx, horizonY, 10, cx, horizonY, w * 0.7);
      gradHorizon.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
      gradHorizon.addColorStop(0.5, 'rgba(168, 85, 247, 0.08)');
      gradHorizon.addColorStop(1, 'rgba(5, 7, 17, 0)');
      ctx.fillStyle = gradHorizon;
      ctx.fillRect(0, 0, w, h);

      // Road geometry (Trapezoid receding into horizon)
      const roadTopWidth = w * 0.16;
      const roadBottomWidth = Math.min(w * 0.94, 540);

      const pTopLeft = { x: cx - roadTopWidth / 2, y: horizonY };
      const pTopRight = { x: cx + roadTopWidth / 2, y: horizonY };
      const pBottomLeft = { x: cx - roadBottomWidth / 2, y: h };
      const pBottomRight = { x: cx + roadBottomWidth / 2, y: h };

      // Road Surface
      ctx.beginPath();
      ctx.moveTo(pTopLeft.x, pTopLeft.y);
      ctx.lineTo(pTopRight.x, pTopRight.y);
      ctx.lineTo(pBottomRight.x, pBottomRight.y);
      ctx.lineTo(pBottomLeft.x, pBottomLeft.y);
      ctx.closePath();

      const roadGrad = ctx.createLinearGradient(0, horizonY, 0, h);
      roadGrad.addColorStop(0, '#090d22');
      roadGrad.addColorStop(1, '#0f1738');
      ctx.fillStyle = roadGrad;
      ctx.fill();

      // Road Border Rails (Neon Cyan & Magenta)
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;

      // Left Rail
      ctx.shadowColor = '#38bdf8';
      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(pTopLeft.x, pTopLeft.y);
      ctx.lineTo(pBottomLeft.x, pBottomLeft.y);
      ctx.stroke();

      // Right Rail
      ctx.shadowColor = '#f472b6';
      ctx.strokeStyle = '#f472b6';
      ctx.beginPath();
      ctx.moveTo(pTopRight.x, pTopRight.y);
      ctx.lineTo(pBottomRight.x, pBottomRight.y);
      ctx.stroke();

      // Center Divider (Dashed)
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#818cf8';
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.4)';
      ctx.setLineDash([12, 12]);
      ctx.beginPath();
      ctx.moveTo(cx, horizonY);
      ctx.lineTo(cx, h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      // Perspective Speed Grid Lines
      roadScrollRef.current = (roadScrollRef.current + (song.bpm / 60) * 0.04) % 1;
      const numSpeedLines = 8;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < numSpeedLines; i++) {
        const lineProg = (i / numSpeedLines + roadScrollRef.current) % 1;
        // Non-linear perspective progression
        const lineZ = Math.pow(lineProg, 2.2);
        const ly = horizonY + (h - horizonY) * lineZ;
        const lw = roadTopWidth + (roadBottomWidth - roadTopWidth) * lineZ;
        ctx.beginPath();
        ctx.moveTo(cx - lw / 2, ly);
        ctx.lineTo(cx + lw / 2, ly);
        ctx.stroke();
      }

      // --- 3. Hit Zone / Target Line ---
      const hitLineWidth = roadTopWidth + (roadBottomWidth - roadTopWidth) * ((hitY - horizonY) / (h - horizonY));
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#38bdf8';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx - hitLineWidth / 2, hitY);
      ctx.lineTo(cx + hitLineWidth / 2, hitY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Player Lane Indicator at Hit Zone
      const playerLane = selectedLaneRef.current;
      const halfLaneWidth = hitLineWidth / 4;
      const playerIndicatorX = playerLane === 0 ? cx - halfLaneWidth : cx + halfLaneWidth;

      if (level === 2) {
        // Glowing Player Pad
        ctx.fillStyle = playerLane === 0 ? 'rgba(56, 189, 248, 0.6)' : 'rgba(244, 114, 182, 0.6)';
        ctx.shadowBlur = 25;
        ctx.shadowColor = playerLane === 0 ? '#38bdf8' : '#f472b6';
        ctx.beginPath();
        ctx.ellipse(playerIndicatorX, hitY, halfLaneWidth * 0.8, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // --- 4. 3D Active Lyric Tiles ---
      const TRAVEL_TIME_SEC = level === 1 ? 4.5 : 3.5;

      activeTilesRef.current.forEach((tile) => {
        const timeUntilHit = tile.targetTime - songElapsed;

        // Tile not yet spawned or already passed
        if (songElapsed < tile.spawnTime || timeUntilHit < -0.6) {
          if (timeUntilHit < -0.6 && !tile.resolved) {
            // Missed!
            tile.resolved = true;
            handleTileHit(tile, false);
          }
          return;
        }

        // Perspective progress: 0 at horizon, 1 at hit line
        const zProg = Math.max(0, Math.min(1.2, 1 - timeUntilHit / TRAVEL_TIME_SEC));
        const nonLinearZ = Math.pow(zProg, 1.8);
        const tileY = horizonY + (hitY - horizonY) * nonLinearZ;

        // Current width of road at this Y
        const currentRoadW = roadTopWidth + (roadBottomWidth - roadTopWidth) * ((tileY - horizonY) / (h - horizonY));
        const scale = 0.35 + 0.65 * nonLinearZ;

        // Render depending on Level mode
        if (level === 1) {
          // --- LEVEL 1: KARAOKE / TA3LIMI (Center Lane) ---
          ctx.save();
          ctx.translate(cx, tileY);
          ctx.scale(scale, scale);

          // Card Background
          const cardW = 280;
          const cardH = 64;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2;
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#facc15';
          ctx.beginPath();
          ctx.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 10);
          ctx.fill();
          ctx.stroke();

          // German Text
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 19px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(tile.lyric.german, 0, -10);

          // Darija Meaning
          ctx.fillStyle = '#38bdf8';
          ctx.font = '600 13px system-ui, sans-serif';
          ctx.fillText(tile.lyric.darijaCorrect, 0, 14);

          ctx.restore();

          // Check hit trigger for Level 1 (Plays audio slowly)
          if (Math.abs(timeUntilHit) < 0.15 && !tile.resolved) {
            tile.resolved = true;
            audioEngineRef.current?.speakGermanLyric(tile.lyric.german, true);
            spawnParticles(cx, hitY, '#facc15', 20);
            handleTileHit(tile, true);
          }
        } else if (level === 2) {
          // --- LEVEL 2: DUAL-CHOICE RUNNER (2 Parallel Lanes) ---
          const laneOffset = currentRoadW / 4;
          const leftX = cx - laneOffset;
          const rightX = cx + laneOffset;

          const leftText = tile.correctLane === 0 ? tile.lyric.darijaCorrect : tile.lyric.darijaDistractor;
          const rightText = tile.correctLane === 1 ? tile.lyric.darijaCorrect : tile.lyric.darijaDistractor;

          // German Word Banner Floating Above Gates
          ctx.save();
          ctx.translate(cx, tileY - 42 * scale);
          ctx.scale(scale, scale);
          ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(-140, -18, 280, 36, 8);
          ctx.fill();
          ctx.stroke();
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

          // Trigger Judgment at Strike Line
          if (timeUntilHit <= 0.05 && !tile.resolved) {
            tile.resolved = true;
            const chosen = selectedLaneRef.current;
            const isCorrect = chosen === tile.correctLane;
            const chosenX = chosen === 0 ? leftX : rightX;
            tile.userSelectedLane = chosen;
            tile.result = isCorrect ? 'perfect' : 'miss';

            if (isCorrect) {
              spawnParticles(chosenX, hitY, '#38bdf8', 26);
              audioEngineRef.current?.playHitFx(true);
              audioEngineRef.current?.speakGermanLyric(tile.lyric.german, false);
            } else {
              spawnParticles(chosenX, hitY, '#ef4444', 16);
              audioEngineRef.current?.playMissFx();
            }
            handleTileHit(tile, isCorrect);
          }
        } else if (level === 3) {
          // --- LEVEL 3: VOICE AI PRONUNCIATION ARENA (Spoken Only!) ---
          ctx.save();
          ctx.translate(cx, tileY);
          ctx.scale(scale, scale);

          // Only German text, absolutely no translation!
          const cardW = 260;
          const cardH = 68;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 2.5;
          ctx.shadowBlur = 18;
          ctx.shadowColor = '#a855f7';
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

          // Phonetic hint
          ctx.fillStyle = '#d8b4fe';
          ctx.font = '600 13px system-ui, sans-serif';
          ctx.fillText(`[ ${tile.lyric.phoneticGuide} ]`, 0, 16);
          ctx.restore();

          // Active Mic Listening Window
          if (timeUntilHit < 0.8 && timeUntilHit > -0.2) {
            setCurrentPromptWord(tile.lyric.german);
          }

          if (timeUntilHit <= 0.05 && !tile.resolved) {
            tile.resolved = true;
            // Evaluate spoken attempt using voiceRater
            const evaluation = voiceRaterRef.current?.evaluateTargetWord(tile.lyric.german);
            const isMatch = evaluation ? evaluation.isMatch : false;

            tile.result = isMatch ? 'perfect' : 'miss';
            if (isMatch) {
              spawnParticles(cx, hitY, '#a855f7', 30);
              audioEngineRef.current?.playHitFx(true);
            } else {
              spawnParticles(cx, hitY, '#ef4444', 16);
              audioEngineRef.current?.playMissFx();
            }
            handleTileHit(tile, isMatch);
            voiceRaterRef.current?.resetTranscript();
          }
        }
      });

      // --- 5. Render Particle System ---
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

  // Helper to render dual-choice gate
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

    const gateW = 140;
    const gateH = 50;

    ctx.fillStyle = isSelected ? 'rgba(30, 58, 138, 0.9)' : 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = laneIndex === 0 ? '#38bdf8' : '#f472b6';
    ctx.lineWidth = isSelected ? 3 : 1.5;

    if (isSelected) {
      ctx.shadowBlur = 16;
      ctx.shadowColor = laneIndex === 0 ? '#38bdf8' : '#f472b6';
    }

    ctx.beginPath();
    ctx.roundRect(-gateW / 2, -gateH / 2, gateW, gateH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = isSelected ? '#ffffff' : '#cbd5e1';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 0);

    ctx.restore();
  };

  // Handle tile judgment score updates
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

  // Game End Logic
  const handleGameEnd = () => {
    setGameState('ended');
    audioEngineRef.current?.stopSongRhythm();

    const finalAcc = hitsCountRef.current.total > 0
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
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#040711',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      userSelect: 'none',
      overflow: 'hidden'
    }}>
      {/* Top Header HUD */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(to bottom, rgba(4,7,17,0.95), rgba(4,7,17,0))'
      }}>
        {/* Left: Song Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onExit}
            style={{
              width: '36px',
              height: '36px',
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
            <X size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                {song.number}. {song.title}
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                background: level === 1 ? 'rgba(250,204,21,0.2)' : level === 2 ? 'rgba(56,189,248,0.2)' : 'rgba(168,85,247,0.2)',
                color: level === 1 ? '#facc15' : level === 2 ? '#38bdf8' : '#c084fc'
              }}>
                {level === 1 ? 'Niveau 1: Ta3limi' : level === 2 ? 'Niveau 2: 3D Choice' : 'Niveau 3: Voice Arena'}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{song.subtitle}</div>
          </div>
        </div>

        {/* Right: Sound Toggle & Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#38bdf8' }}>{score}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Acc: {currentAccuracy}%</div>
          </div>
          <button
            onClick={toggleMute}
            style={{
              width: '36px',
              height: '36px',
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
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </div>

      {/* Song Progress Line */}
      <div style={{
        position: 'absolute',
        top: '60px',
        left: 0,
        right: 0,
        height: '3px',
        background: 'rgba(255,255,255,0.1)',
        zIndex: 20
      }}>
        <div style={{
          width: `${songProgressPct}%`,
          height: '100%',
          background: 'linear-gradient(to right, #38bdf8, #a855f7)',
          transition: 'width 0.2s linear'
        }} />
      </div>

      {/* Combo Floating Badge */}
      {combo > 1 && (
        <div style={{
          position: 'absolute',
          top: '75px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 14px',
          borderRadius: '20px',
          background: 'rgba(234, 179, 8, 0.15)',
          border: '1px solid rgba(234, 179, 8, 0.4)',
          color: '#facc15',
          fontSize: '13px',
          fontWeight: 900,
          animation: 'pulse 1s infinite'
        }}>
          <Flame size={15} />
          <span>COMBO x{combo}</span>
        </div>
      )}

      {/* Level 3 Voice Indicator */}
      {level === 3 && (
        <div style={{
          position: 'absolute',
          top: '115px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          borderRadius: '24px',
          padding: '6px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#d8b4fe',
          fontSize: '12px'
        }}>
          <Mic size={16} color="#c084fc" style={{ animation: 'pulse 1.2s infinite' }} />
          <span>Qra b sawt 3ali: <strong>{currentPromptWord || '...'}</strong></span>
          {liveTranscript && (
            <span style={{ color: '#38bdf8', fontStyle: 'italic' }}>({liveTranscript})</span>
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

      {/* Mobile Touch Controls for Level 2 (Big Lane Hit Buttons) */}
      {level === 2 && gameState === 'playing' && (
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '16px',
          right: '16px',
          zIndex: 30,
          display: 'flex',
          gap: '12px',
          pointerEvents: 'auto'
        }}>
          <button
            onClick={() => chooseLane(0)}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '16px',
              background: selectedLane === 0
                ? 'linear-gradient(135deg, rgba(56,189,248,0.4), rgba(14,165,233,0.2))'
                : 'rgba(15,23,42,0.7)',
              border: selectedLane === 0 ? '2px solid #38bdf8' : '1px solid rgba(56,189,248,0.3)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '15px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: selectedLane === 0 ? '0 0 20px rgba(56,189,248,0.3)' : 'none'
            }}
          >
            <ArrowLeft size={20} />
            <span>KHIYAR 1</span>
          </button>

          <button
            onClick={() => chooseLane(1)}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '16px',
              background: selectedLane === 1
                ? 'linear-gradient(135deg, rgba(244,114,182,0.4), rgba(217,70,239,0.2))'
                : 'rgba(15,23,42,0.7)',
              border: selectedLane === 1 ? '2px solid #f472b6' : '1px solid rgba(244,114,182,0.3)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '15px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: selectedLane === 1 ? '0 0 20px rgba(244,114,182,0.3)' : 'none'
            }}
          >
            <span>KHIYAR 2</span>
            <ArrowRight size={20} />
          </button>
        </div>
      )}

      {/* Level 1 Bottom Guidance */}
      {level === 1 && gameState === 'playing' && (
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '20px',
          right: '20px',
          zIndex: 30,
          padding: '14px',
          borderRadius: '14px',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(250, 204, 21, 0.3)',
          textAlign: 'center',
          color: '#facc15',
          fontSize: '13px',
          fontWeight: 600
        }}>
          🎵 Ghani w sme3 m3a l-iqa3 d9a d9a bash t-tersekhe lik l-kelma f d-dmagh!
        </div>
      )}

      {/* End Game Modal */}
      {gameState === 'ended' && endResult && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 50,
          background: 'rgba(4, 7, 17, 0.94)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '420px',
            background: 'linear-gradient(135deg, #090e24, #121838)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '24px',
            padding: '28px 24px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            {/* Crown or Trophy */}
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              borderRadius: '50%',
              background: endResult.accuracy >= 100 ? 'rgba(234, 179, 8, 0.2)' : 'rgba(56, 189, 248, 0.2)',
              border: endResult.accuracy >= 100 ? '2px solid #facc15' : '2px solid #38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: endResult.accuracy >= 100 ? '#facc15' : '#38bdf8'
            }}>
              {endResult.becameMastered ? <Trophy size={32} /> : <Award size={32} />}
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', marginBottom: '4px' }}>
              {endResult.accuracy >= 100 ? 'FLAWLESS RUN! 100%' : 'GOOD EFFORT!'}
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>
              {song.title} · {level === 1 ? 'Niveau 1' : level === 2 ? 'Niveau 2' : 'Niveau 3'}
            </p>

            {/* Stats Row */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '20px'
            }}>
              <div style={{
                flex: 1,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '12px 6px'
              }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Score</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#38bdf8' }}>{endResult.score}</div>
              </div>

              <div style={{
                flex: 1,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '12px 6px'
              }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Accuracy</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: endResult.accuracy >= 100 ? '#4ade80' : '#facc15' }}>
                  {endResult.accuracy}%
                </div>
              </div>

              <div style={{
                flex: 1,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '12px 6px'
              }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Max Combo</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#f472b6' }}>x{maxCombo}</div>
              </div>
            </div>

            {/* Progress / Unlock Message */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '14px',
              padding: '14px',
              marginBottom: '24px',
              fontSize: '13px',
              lineHeight: '1.5'
            }}>
              {level === 1 && (
                <div style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <CheckCircle2 size={18} />
                  <span>Kmmlti Niveau 1! Niveau 2 t7ell daba!</span>
                </div>
              )}

              {level === 2 && (
                <div>
                  <div style={{ color: '#ffffff', fontWeight: 700, marginBottom: '6px' }}>
                    Flawless 100% Streak: <span style={{ color: '#facc15' }}>{endResult.perfectStreak} / 10</span>
                  </div>
                  {endResult.unlockedNext ? (
                    <div style={{ color: '#c084fc', fontWeight: 800 }}>
                      🎉 Félicitations! Jbti 100% 10 lmrat! Niveau 3 (Voice Arena) t7ell!
                    </div>
                  ) : (
                    <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                      Khassek tjib 100% 10 d l-merrat bash it7ell lik Niveau 3 d l-micro!
                    </div>
                  )}
                </div>
              )}

              {level === 3 && (
                <div>
                  <div style={{ color: '#ffffff', fontWeight: 700, marginBottom: '6px' }}>
                    Voice Mastery Streak: <span style={{ color: '#c084fc' }}>{endResult.perfectStreak} / 10</span>
                  </div>
                  {endResult.becameMastered ? (
                    <div style={{ color: '#facc15', fontWeight: 800 }}>
                      👑 100% SONG MASTERED! Hfedti w nteqti had l-ghoniya kamla 10 lmrat 100%!
                    </div>
                  ) : (
                    <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                      Bqa lik {10 - endResult.perfectStreak} d l-merrat b 100% f Niveau 3 bash takhod l-Couronne d l-Mastery!
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
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
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={16} />
                <span>3awed</span>
              </button>

              <button
                onClick={onExit}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '14px',
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
