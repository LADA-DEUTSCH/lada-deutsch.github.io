import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Minimize,
  Star,
  Zap
} from 'lucide-react';
import type { SongDefinition, GameDifficultyLevel } from '../types';
import { rhythmAudioEngine } from '../services/rhythmAudioEngine';
import { VoiceRater } from '../services/voiceRater';
import { recordLevelResult, getSongProgress } from '../services/gameProgressStorage';
import { toggleFullscreen, isFullscreen } from '../services/fullscreenUtils';
import { useRhythmGameStore } from '../store/useRhythmGameStore';
import { HighwayScene } from './highway';

export interface Beat3DHighwayProps {
  song: SongDefinition;
  level: GameDifficultyLevel;
  onExit: () => void;
  onLevelComplete?: () => void;
}

interface EndGameResult {
  score: number;
  accuracy: number;
  maxCombo: number;
  perfectStreak: number;
  unlockedNext: boolean;
  becameMastered: boolean;
}

/**
 * Modern AAA WebGL 3D Rhythm Highway Component.
 * Powered by React Three Fiber, Three.js, Zustand, and precision Web Audio API.
 */
export const Beat3DHighway: React.FC<Beat3DHighwayProps> = ({
  song,
  level,
  onExit,
  onLevelComplete
}) => {
  // Local UI states
  const [gameState, setGameState] = useState<'playing' | 'ended'>('playing');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreenMode, setIsFullscreenMode] = useState<boolean>(isFullscreen());

  // Voice Arena state for Level 3
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [currentPromptWord, setCurrentPromptWord] = useState<string>('');

  // Derived browser Web Speech API capability for Level 3
  const isSpeechAvailable = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const win = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
  }, []);

  // End Game Modal Result
  const [endResult, setEndResult] = useState<EndGameResult | null>(null);

  // Engine refs
  const voiceRaterRef = useRef<VoiceRater | null>(null);
  const hasEndedRef = useRef<boolean>(false);

  // Zustand Rhythm Game Store Selectors
  const score = useRhythmGameStore((s) => s.score);
  const combo = useRhythmGameStore((s) => s.combo);
  const maxCombo = useRhythmGameStore((s) => s.maxCombo);
  const streak = useRhythmGameStore((s) => s.streak);
  const multiplier = useRhythmGameStore((s) => s.multiplier);
  const accuracy = useRhythmGameStore((s) => s.accuracy);
  const selectedLane = useRhythmGameStore((s) => s.selectedLane);
  const activeTiles = useRhythmGameStore((s) => s.activeTiles);
  const currentAudioTime = useRhythmGameStore((s) => s.currentAudioTime);
  const hitFeedback = useRhythmGameStore((s) => s.hitFeedback);

  // Calculate song duration & real-time progress
  const totalDuration = useMemo(() => {
    if (!song.lyrics || song.lyrics.length === 0) return 30;
    return song.lyrics[song.lyrics.length - 1].timingSec + 3.5;
  }, [song]);

  const songProgressPct = useMemo(() => {
    if (totalDuration <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((currentAudioTime / totalDuration) * 100)));
  }, [currentAudioTime, totalDuration]);

  // Current approaching tile for Level 2 translation prompt
  const upcomingTile = useMemo(() => {
    if (level !== 2) return null;
    return activeTiles.find((t) => !t.resolved && t.targetTime >= currentAudioTime - 0.2);
  }, [level, activeTiles, currentAudioTime]);

  // Fullscreen toggle handler
  const handleFullscreen = () => {
    toggleFullscreen();
    setIsFullscreenMode(!isFullscreenMode);
  };

  // Mute toggle handler
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    rhythmAudioEngine.setMuted(next);
  };

  // Handle Game Completion
  const handleGameEnd = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;

    setGameState('ended');
    rhythmAudioEngine.stopSongRhythm();
    voiceRaterRef.current?.stopListening();

    const finalScore = useRhythmGameStore.getState().score;
    const finalAcc = useRhythmGameStore.getState().accuracy;
    const finalMaxCombo = useRhythmGameStore.getState().maxCombo;
    const result = recordLevelResult(song.id, level, finalScore, finalAcc);
    const updatedProg = getSongProgress(song.id);
    const streakCount = level === 2 ? updatedProg.level2PerfectCount : updatedProg.level3PerfectCount;

    setEndResult({
      score: finalScore,
      accuracy: finalAcc,
      maxCombo: finalMaxCombo,
      perfectStreak: streakCount,
      unlockedNext: result.unlockedNext,
      becameMastered: result.becameMastered
    });

    if (onLevelComplete) {
      onLevelComplete();
    }
  }, [song.id, level, onLevelComplete]);

  // Check for song completion
  useEffect(() => {
    if (gameState !== 'playing') return;

    const allResolved = activeTiles.length > 0 && activeTiles.every((t) => t.resolved);
    const timeCompleted = currentAudioTime >= totalDuration;

    if (allResolved || timeCompleted) {
      const timer = setTimeout(() => {
        handleGameEnd();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [currentAudioTime, totalDuration, activeTiles, gameState, handleGameEnd]);

  // Game Lifecycle & Audio Engine initialization
  useEffect(() => {
    hasEndedRef.current = false;

    // Spawn tiles into Zustand store
    useRhythmGameStore.getState().spawnTilesFromSong(song, level);

    // Start precision Web Audio rhythm synthesizer
    rhythmAudioEngine.startSongRhythm(song.bpm, song.instrument);

    // Start Level 3 Voice Arena speech recognition if active
    if (level === 3) {
      const vr = new VoiceRater();
      voiceRaterRef.current = vr;
      vr.startListening((text) => {
        setLiveTranscript(text);
      });
    }

    return () => {
      rhythmAudioEngine.stopSongRhythm();
      voiceRaterRef.current?.stopListening();
    };
  }, [song, level]);

  // Level 3 Voice Arena real-time speech matching subscriber
  useEffect(() => {
    if (level !== 3 || gameState !== 'playing') return;

    const unsubscribe = useRhythmGameStore.subscribe((state) => {
      const time = state.currentAudioTime;

      for (const tile of state.activeTiles) {
        if (tile.resolved) continue;
        const diff = tile.targetTime - time;

        // Show prompt word when approaching (within 1.2 seconds)
        if (diff > -0.2 && diff < 1.2) {
          setCurrentPromptWord(tile.germanText);
        }

        // Evaluation window at strike zone [-0.08s, +0.08s]
        if (diff <= 0.08 && diff >= -0.08) {
          const evaluation = voiceRaterRef.current?.evaluateTargetWord(tile.germanText);
          if (evaluation && evaluation.isMatch) {
            state.registerHit(tile.id, 'perfect');
            rhythmAudioEngine.playHitFx('perfect');
            rhythmAudioEngine.speakGermanLyric(tile.germanText, false);
            voiceRaterRef.current?.resetTranscript();
            setLiveTranscript('');
            break;
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [level, gameState]);

  // Hit callback from 3D HighwayScene
  const handleSceneHit = useCallback((tileId: string, accuracyResult: 'perfect' | 'good' | 'miss') => {
    if (accuracyResult === 'perfect' || accuracyResult === 'good') {
      const target = useRhythmGameStore.getState().activeTiles.find((t) => t.id === tileId);
      if (target) {
        rhythmAudioEngine.speakGermanLyric(target.germanText, false);
      }
    }
  }, []);

  // Lane switch callback from 3D HighwayScene
  const handleSceneLaneChange = useCallback((lane: 0 | 1) => {
    useRhythmGameStore.getState().setLane(lane);
  }, []);

  // On-screen mobile touch lane steering
  const handleMobileLane = (lane: 0 | 1) => {
    rhythmAudioEngine.playLaneSwitchFx();
    useRhythmGameStore.getState().setLane(lane);
  };

  // On-screen mobile touch strike
  const handleMobileStrike = () => {
    rhythmAudioEngine.ensureContext();
    const currentLane = useRhythmGameStore.getState().selectedLane;
    const result = useRhythmGameStore.getState().evaluateTileHit(currentLane);
    if (result) {
      if (result.accuracy === 'perfect') {
        rhythmAudioEngine.playHitFx('perfect');
        rhythmAudioEngine.speakGermanLyric(result.tile.germanText, false);
      } else if (result.accuracy === 'good') {
        rhythmAudioEngine.playHitFx('good');
        rhythmAudioEngine.speakGermanLyric(result.tile.germanText, false);
      } else {
        rhythmAudioEngine.playMissFx();
      }
    }
  };

  // Replay / Restart current song
  const handleRestart = useCallback(() => {
    hasEndedRef.current = false;
    setGameState('playing');
    setEndResult(null);
    setLiveTranscript('');
    setCurrentPromptWord('');

    useRhythmGameStore.getState().resetGame();
    useRhythmGameStore.getState().spawnTilesFromSong(song, level);
    rhythmAudioEngine.startSongRhythm(song.bpm, song.instrument);

    if (level === 3) {
      voiceRaterRef.current?.resetTranscript();
      voiceRaterRef.current?.startListening((text) => {
        setLiveTranscript(text);
      });
    }
  }, [song, level]);

  // Star rating calculation for end modal
  const starCount = useMemo(() => {
    if (!endResult) return 0;
    if (endResult.accuracy >= 95) return 3;
    if (endResult.accuracy >= 75) return 2;
    return 1;
  }, [endResult]);

  return (
    <div className="fixed inset-0 bg-[#02040a] z-50 flex flex-col select-none overflow-hidden font-sans text-white">
      {/* 3D WebGL Highway Viewport Layer */}
      <div className="absolute inset-0 w-full h-full">
        <HighwayScene
          song={song}
          level={level}
          selectedLane={selectedLane}
          onHit={handleSceneHit}
          onLaneChange={handleSceneLaneChange}
          audioEngine={rhythmAudioEngine}
          className="w-full h-full"
        />
      </div>

      {/* Top Cyber Navigation Header */}
      <div className="absolute top-0 left-0 right-0 z-20 h-14 px-4 sm:px-6 flex items-center justify-between bg-gradient-to-b from-[#02040a]/95 via-[#02040a]/60 to-transparent backdrop-blur-sm pointer-events-auto">
        {/* Left: Exit button & Song Info */}
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            title="Exit Game"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <X size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm sm:text-base text-white tracking-wide drop-shadow">
                #{song.number} {song.title}
              </span>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  level === 2
                    ? 'bg-sky-500/20 text-sky-400 border-sky-400/40'
                    : level === 3
                    ? 'bg-amber-500/20 text-amber-400 border-amber-400/40'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-400/40'
                }`}
              >
                {level === 1
                  ? 'NIVEAU 1: RYTHME PUR'
                  : level === 2
                  ? 'NIVEAU 2: 3D DARIJA GATES'
                  : 'NIVEAU 3: VOICE ARENA'}
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700">
                {song.bpm} BPM
              </span>
            </div>
            <div className="text-[11px] text-slate-400 hidden sm:block">
              {song.subtitle || song.theme}
            </div>
          </div>
        </div>

        {/* Right: Score, Accuracy, Fullscreen, Mute */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-right">
            <div className="text-base sm:text-lg font-black text-sky-400 tracking-wider drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]">
              {score.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">Acc: {accuracy}%</div>
          </div>

          <button
            onClick={handleFullscreen}
            title="Toggle Fullscreen"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
          >
            {isFullscreenMode ? <Minimize size={15} /> : <Maximize size={15} />}
          </button>

          <button
            onClick={toggleMute}
            title="Toggle Mute"
            className={`w-9 h-9 rounded-full border text-white flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
              isMuted
                ? 'bg-red-500/20 border-red-500/50 text-red-400'
                : 'bg-white/10 hover:bg-white/20 border-white/15'
            }`}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        </div>
      </div>

      {/* Song Progress Line */}
      <div className="absolute top-14 left-0 right-0 h-1 bg-white/10 z-20 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-sky-400 via-teal-400 to-amber-400 transition-all duration-200 ease-linear shadow-[0_0_10px_rgba(56,189,248,0.8)]"
          style={{ width: `${songProgressPct}%` }}
        />
      </div>

      {/* Dynamic HUD: Combo, Multiplier & Streak Badges */}
      <div className="pointer-events-none absolute top-18 left-0 right-0 z-20 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          {/* Multiplier Badge */}
          <div
            className={`px-3 py-1 rounded-full text-xs font-black tracking-wider border flex items-center gap-1 backdrop-blur-md ${
              multiplier >= 4
                ? 'bg-amber-500/25 text-amber-300 border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse'
                : multiplier >= 3
                ? 'bg-purple-500/25 text-purple-300 border-purple-400/50 shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                : multiplier >= 2
                ? 'bg-sky-500/25 text-sky-300 border-sky-400/50 shadow-[0_0_10px_rgba(56,189,248,0.5)]'
                : 'bg-slate-900/60 text-slate-400 border-slate-700/50'
            }`}
          >
            <Zap size={12} />
            <span>{multiplier}X MULTIPLIER</span>
          </div>

          {/* Combo Badge */}
          {combo > 1 && (
            <div className="px-3 py-1 rounded-full text-xs font-black tracking-wider bg-amber-500/20 text-amber-400 border border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.5)] flex items-center gap-1 backdrop-blur-md animate-bounce">
              <Flame size={13} className="text-amber-400 fill-amber-400" />
              <span>COMBO x{combo}</span>
            </div>
          )}

          {/* Max Combo Badge */}
          {maxCombo > 1 && (
            <div className="hidden sm:flex px-3 py-1 rounded-full text-xs font-black tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/50 shadow-[0_0_12px_rgba(168,85,247,0.5)] items-center gap-1 backdrop-blur-md">
              <span>MAX x{maxCombo}</span>
            </div>
          )}

          {/* Streak Counter */}
          {streak >= 5 && (
            <div className="hidden sm:flex px-3 py-1 rounded-full text-xs font-black tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.5)] items-center gap-1 backdrop-blur-md">
              <span>STREAK {streak}</span>
            </div>
          )}
        </div>
      </div>

      {/* Floating Animated Hit Feedback Banner */}
      {hitFeedback && (
        <div
          key={hitFeedback.timestamp}
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-300 animate-bounce"
        >
          <div
            className="px-6 py-2 rounded-2xl font-black text-2xl tracking-wider shadow-2xl backdrop-blur-md border text-center"
            style={{
              color: hitFeedback.color,
              borderColor: hitFeedback.color,
              backgroundColor: 'rgba(6, 8, 19, 0.85)',
              boxShadow: `0 0 25px ${hitFeedback.color}`
            }}
          >
            {hitFeedback.text}
          </div>
        </div>
      )}

      {/* Level 2: Translation Gate HUD Prompt Banner */}
      {level === 2 && upcomingTile && (
        <div className="pointer-events-none absolute top-28 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1">
          <div className="px-5 py-1.5 rounded-2xl bg-[#090e24]/90 border border-sky-400/50 shadow-[0_0_15px_rgba(56,189,248,0.3)] backdrop-blur-md text-center">
            <div className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">
              Tarjima dyal had l-kalima:
            </div>
            <div className="text-lg font-black text-white tracking-wide">
              {upcomingTile.germanText}
            </div>
            {upcomingTile.phonetic && (
              <div className="text-[11px] text-sky-300/80 font-mono">
                [{upcomingTile.phonetic}]
              </div>
            )}
          </div>
        </div>
      )}

      {/* Level 3: Voice Arena Microphone Banner */}
      {level === 3 && (
        <div className="pointer-events-none absolute top-28 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
          <div className="bg-slate-950/90 border border-sky-500/40 rounded-2xl px-5 py-2 flex items-center gap-3 text-sky-200 text-xs shadow-[0_0_20px_rgba(56,189,248,0.3)] backdrop-blur-md">
            <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-400 flex items-center justify-center animate-pulse">
              <Mic size={14} className="text-sky-400" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">
                Qra b sawt 3ali f l-micro:
              </div>
              <div className="text-sm font-black text-white">
                {currentPromptWord || 'Ist3edd l-kalima...'}
              </div>
            </div>
            {liveTranscript && (
              <div className="text-xs text-amber-300 font-semibold italic bg-amber-500/10 px-2 py-0.5 rounded border border-amber-400/30">
                ("${liveTranscript}")
              </div>
            )}
          </div>

          {!isSpeechAvailable && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-300 text-[11px] px-3 py-1 rounded-full font-bold shadow-md">
              ⚠️ Web Speech API khassa Google Chrome bash tkhdem l-microfon mzyan!
            </div>
          )}
        </div>
      )}

      {/* Mobile & Touch Controls Overlay */}
      {gameState === 'playing' && (
        <div className="absolute bottom-5 left-0 right-0 z-30 px-4 sm:px-8 flex items-center justify-between pointer-events-none">
          {/* Lane 0 Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleMobileLane(0);
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleMobileLane(0);
            }}
            className={`pointer-events-auto px-5 py-3 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer shadow-xl active:scale-95 border backdrop-blur-md ${
              selectedLane === 0
                ? 'bg-gradient-to-r from-sky-500/60 to-blue-600/40 border-sky-400 text-white shadow-[0_0_20px_rgba(56,189,248,0.5)] scale-105'
                : 'bg-slate-900/80 hover:bg-slate-800/80 border-sky-500/30 text-slate-300'
            }`}
          >
            ← {level === 2 ? 'KHIYAR 1' : 'LANE 1'}
          </button>

          {/* Central Strike Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleMobileStrike();
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleMobileStrike();
            }}
            className="pointer-events-auto px-6 sm:px-8 py-3 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 border border-sky-400/50 text-white shadow-[0_0_25px_rgba(56,189,248,0.5)] active:scale-95 transition-all cursor-pointer flex items-center gap-2"
          >
            <Zap size={14} className="text-sky-300" />
            <span>STRIKE [SPACE]</span>
          </button>

          {/* Lane 1 Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleMobileLane(1);
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleMobileLane(1);
            }}
            className={`pointer-events-auto px-5 py-3 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer shadow-xl active:scale-95 border backdrop-blur-md ${
              selectedLane === 1
                ? 'bg-gradient-to-r from-amber-500/60 to-orange-600/40 border-amber-400 text-white shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-105'
                : 'bg-slate-900/80 hover:bg-slate-800/80 border-amber-500/30 text-slate-300'
            }`}
          >
            {level === 2 ? 'KHIYAR 2' : 'LANE 2'} →
          </button>
        </div>
      )}

      {/* End Game / Level Completed Summary Modal */}
      {gameState === 'ended' && endResult && (
        <div className="fixed inset-0 z-50 bg-[#02040a]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-gradient-to-b from-[#0b132b] to-[#070b19] border border-sky-500/40 rounded-3xl p-6 text-center shadow-[0_25px_60px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in duration-300">
            {/* Header Icon & Stars */}
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-tr from-sky-500/20 to-amber-500/20 border-2 border-sky-400 flex items-center justify-center text-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.4)]">
              {endResult.becameMastered ? (
                <Trophy size={30} className="text-amber-400 fill-amber-400" />
              ) : (
                <Award size={30} className="text-sky-400" />
              )}
            </div>

            <div className="flex items-center justify-center gap-1.5 mb-2">
              {[1, 2, 3].map((starIndex) => (
                <Star
                  key={starIndex}
                  size={20}
                  className={`${
                    starIndex <= starCount
                      ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                      : 'text-slate-600'
                  }`}
                />
              ))}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white mb-1 tracking-wide">
              {endResult.accuracy >= 100
                ? 'FLAWLESS RUN! 100%'
                : endResult.accuracy >= 75
                ? 'EXCELLENT SCORE!'
                : 'GOOD EFFORT!'}
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              #{song.number} {song.title} · {level === 1 ? 'Niveau 1' : level === 2 ? 'Niveau 2' : 'Niveau 3'}
            </p>

            {/* Performance Stats Grid */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Score</div>
                <div className="text-lg font-black text-sky-400 drop-shadow">
                  {endResult.score.toLocaleString()}
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Accuracy</div>
                <div
                  className={`text-lg font-black drop-shadow ${
                    endResult.accuracy >= 100
                      ? 'text-emerald-400'
                      : endResult.accuracy >= 75
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {endResult.accuracy}%
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Max Combo</div>
                <div className="text-lg font-black text-amber-400 drop-shadow">
                  x{endResult.maxCombo}
                </div>
              </div>
            </div>

            {/* Mastery & Progression Badges */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 mb-6 text-xs text-left">
              {level === 2 && (
                <div>
                  <div className="text-white font-bold mb-1 flex items-center justify-between">
                    <span>Flawless 100% Streak:</span>
                    <span className="text-amber-400 font-black">{endResult.perfectStreak} / 10</span>
                  </div>
                  {endResult.unlockedNext ? (
                    <div className="text-sky-400 font-black mt-1">
                      🎉 Félicitations! Jbti 100% 10 lmrat! Niveau 3 (Voice Arena) t7ell!
                    </div>
                  ) : (
                    <div className="text-slate-400 text-[11px]">
                      Khassek tjib 100% 10 d l-merrat bash it7ell lik Niveau 3 d l-micro!
                    </div>
                  )}
                </div>
              )}

              {level === 3 && (
                <div>
                  <div className="text-white font-bold mb-1 flex items-center justify-between">
                    <span>Voice Mastery Streak:</span>
                    <span className="text-sky-400 font-black">{endResult.perfectStreak} / 10</span>
                  </div>
                  {endResult.becameMastered ? (
                    <div className="text-amber-400 font-black mt-1">
                      👑 100% MASTERED! Khditi l-Couronne d l-Mastery d had l-ghoniya!
                    </div>
                  ) : (
                    <div className="text-slate-400 text-[11px]">
                      Bqa lik {Math.max(0, 10 - endResult.perfectStreak)} d l-merrat b 100% bash t-khtar l-Couronne!
                    </div>
                  )}
                </div>
              )}

              {level === 1 && (
                <div className="text-slate-300 text-[11px]">
                  {endResult.unlockedNext
                    ? '🎉 Bravo! Niveau 2 (3D Darija Gates) t7ell!'
                    : 'Niveau 1 mkamal! Khdam 3la Niveau 2 bash tzid f l-maharat!'}
                </div>
              )}
            </div>

            {/* Modal Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg"
              >
                <RotateCcw size={15} />
                <span>3awed (Replay)</span>
              </button>

              <button
                onClick={onExit}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs sm:text-sm font-black cursor-pointer transition-all active:scale-95 shadow-[0_0_20px_rgba(56,189,248,0.5)] border border-sky-400/50"
              >
                Kammel (Continue)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Beat3DHighway;
