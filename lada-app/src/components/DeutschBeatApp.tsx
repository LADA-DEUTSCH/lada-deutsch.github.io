import React, { useState, useEffect, useCallback } from 'react';
import {
  Music,
  Trophy,
  BookOpen,
  Flame,
  Mic,
  Lock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Maximize,
  Minimize
} from 'lucide-react';
import type { SongDefinition } from '../types';
import { getAllSongs } from '../services/songCurriculum';
import {
  getAllSongProgress,
  getSongProgress,
  isLevelUnlocked
} from '../services/gameProgressStorage';
import { SongCourseLesson } from './SongCourseLesson';
import { Beat3DHighway } from './Beat3DHighway';
import { OrientationGuard } from './OrientationGuard';
import { toggleFullscreen, isFullscreen } from '../services/fullscreenUtils';

interface DeutschBeatAppProps {
  onLockVault: () => void;
}

export const DeutschBeatApp: React.FC<DeutschBeatAppProps> = ({ onLockVault }) => {
  const songs = getAllSongs();
  const [activeSongIndex, setActiveSongIndex] = useState(0);
  const [activeMode, setActiveMode] = useState<'catalog' | 'course' | 'runner'>('catalog');
  const [activeLevel, setActiveLevel] = useState<2 | 3>(2);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFullscreenMode, setIsFullscreenMode] = useState(isFullscreen());

  const activeSong = songs[activeSongIndex] || songs[0];

  const allProgress = getAllSongProgress();
  const masteredCount = Object.values(allProgress).filter((p) => p.isMastered).length;
  const courseCompletedCount = Object.values(allProgress).filter((p) => p.level1Completed).length;

  const nextSong = useCallback(() => {
    setActiveSongIndex((prev) => (prev + 1) % songs.length);
  }, [songs.length]);

  const prevSong = useCallback(() => {
    setActiveSongIndex((prev) => (prev - 1 + songs.length) % songs.length);
  }, [songs.length]);

  // Keyboard navigation for song carousel
  useEffect(() => {
    if (activeMode !== 'catalog') return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        nextSong();
      } else if (e.key === 'ArrowLeft') {
        prevSong();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeMode, nextSong, prevSong]);

  const handleOpenCourse = (song: SongDefinition) => {
    setActiveSongIndex(songs.findIndex((s) => s.id === song.id));
    setActiveMode('course');
  };

  const handleOpenRunner = (song: SongDefinition, level: 2 | 3) => {
    if (!isLevelUnlocked(song.id, level)) return;
    setActiveSongIndex(songs.findIndex((s) => s.id === song.id));
    setActiveLevel(level);
    setActiveMode('runner');
  };

  const handleExitToCatalog = () => {
    setActiveMode('catalog');
    setRefreshKey((k) => k + 1);
  };

  // 1. Course Mode (Niveau 1: Der Kurs)
  if (activeMode === 'course') {
    return (
      <OrientationGuard>
        <SongCourseLesson
          song={activeSong}
          onBack={handleExitToCatalog}
          onUnlockedLevel2={() => {
            setRefreshKey((k) => k + 1);
            handleOpenRunner(activeSong, 2);
          }}
        />
      </OrientationGuard>
    );
  }

  // 2. Runner Mode (Niveau 2: 3D Choice or Niveau 3: Voice Arena)
  if (activeMode === 'runner') {
    return (
      <OrientationGuard>
        <Beat3DHighway
          song={activeSong}
          level={activeLevel}
          onExit={handleExitToCatalog}
          onLevelComplete={() => setRefreshKey((k) => k + 1)}
        />
      </OrientationGuard>
    );
  }

  const activeProg = getSongProgress(activeSong.id);
  const isLvl2Unlocked = isLevelUnlocked(activeSong.id, 2);
  const isLvl3Unlocked = isLevelUnlocked(activeSong.id, 3);

  // 3. Horizontal Arcade Cover-Flow Dashboard
  return (
    <OrientationGuard>
      <div
        key={refreshKey}
        style={{
          position: 'fixed',
          inset: 0,
          background: '#040711',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          userSelect: 'none',
          overflow: 'hidden'
        }}
      >
        {/* Top Game Bar */}
        <div
          style={{
            height: '52px',
            padding: '0 24px',
            background: 'rgba(8, 12, 24, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 20
          }}
        >
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7, #9333ea)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)'
              }}
            >
              <Music size={18} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '0.6px' }}>
                DEUTSCH BEAT 3D
              </div>
            </div>
          </div>

          {/* Player Career Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(250, 204, 21, 0.12)',
                border: '1px solid rgba(250, 204, 21, 0.3)',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: 800,
                color: '#facc15'
              }}
            >
              <BookOpen size={14} />
              <span>Dourous: {courseCompletedCount} / 20</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: 800,
                color: '#38bdf8'
              }}
            >
              <Trophy size={14} />
              <span>Mastered: 👑 {masteredCount} / 20</span>
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={() => {
                toggleFullscreen();
                setIsFullscreenMode(!isFullscreenMode);
              }}
              title="Plein Écran"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {isFullscreenMode ? <Minimize size={15} /> : <Maximize size={15} />}
            </button>

            {/* Lock Vault */}
            <button
              onClick={onLockVault}
              title="Lock Vault"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* Center Stage: Horizontal Song Cover-Flow */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            padding: '10px 40px',
            overflow: 'hidden'
          }}
        >
          {/* Previous Arrow */}
          <button
            onClick={prevSong}
            style={{
              position: 'absolute',
              left: '16px',
              zIndex: 30,
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(0,0,0,0.5)'
            }}
          >
            <ChevronLeft size={24} />
          </button>

          {/* Active Song Hero Showcase (Widescreen Card) */}
          <div
            style={{
              maxWidth: '680px',
              width: '100%',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))',
              border: activeProg.isMastered
                ? '2px solid rgba(234, 179, 8, 0.8)'
                : '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '24px',
              padding: '24px 32px',
              boxShadow: activeProg.isMastered
                ? '0 0 45px rgba(234, 179, 8, 0.3)'
                : '0 20px 50px rgba(0,0,0,0.7)',
              position: 'relative',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: 'calc(100% - 20px)',
              maxHeight: '340px'
            }}
          >
            {/* Mastered Crown Ribbon */}
            {activeProg.isMastered && (
              <div
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '16px',
                  background: 'linear-gradient(135deg, #eab308, #ca8a04)',
                  color: '#000000',
                  fontSize: '11px',
                  fontWeight: 900,
                  padding: '4px 12px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 0 20px rgba(234, 179, 8, 0.5)'
                }}
              >
                <Trophy size={14} />
                <span>OFFICIALLY MASTERED 100%</span>
              </div>
            )}

            {/* Top Song Meta */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 900,
                    color: '#38bdf8',
                    background: 'rgba(56, 189, 248, 0.15)',
                    padding: '2px 10px',
                    borderRadius: '6px'
                  }}
                >
                  #{activeSong.number} / {songs.length}
                </span>
                <span style={{ fontSize: '12px', color: '#facc15', fontWeight: 700 }}>
                  {activeSong.tier}
                </span>
              </div>

              <h2
                style={{
                  fontSize: '26px',
                  fontWeight: 900,
                  color: '#ffffff',
                  margin: '0 0 6px 0',
                  letterSpacing: '0.4px',
                  textShadow: '0 0 20px rgba(56, 189, 248, 0.3)'
                }}
              >
                {activeSong.title}
              </h2>
              <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '12px' }}>
                {activeSong.subtitle}
              </div>

              {/* Badges */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '16px'
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    color: '#cbd5e1',
                    background: 'rgba(255,255,255,0.06)',
                    padding: '3px 10px',
                    borderRadius: '6px'
                  }}
                >
                  🎵 {activeSong.instrument.replace('_', ' ')}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#cbd5e1',
                    background: 'rgba(255,255,255,0.06)',
                    padding: '3px 10px',
                    borderRadius: '6px'
                  }}
                >
                  ⚡ {activeSong.bpm} BPM
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#cbd5e1',
                    background: 'rgba(255,255,255,0.06)',
                    padding: '3px 10px',
                    borderRadius: '6px'
                  }}
                >
                  📝 {activeSong.lyrics.length} Verben & Wörter
                </span>
              </div>
            </div>

            {/* Bottom 3 Arcade Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {/* Niveau 1: Der Kurs (LESSON) */}
              <button
                onClick={() => handleOpenCourse(activeSong)}
                style={{
                  background: activeProg.level1Completed
                    ? 'rgba(34, 197, 94, 0.18)'
                    : 'rgba(250, 204, 21, 0.18)',
                  border: activeProg.level1Completed
                    ? '1.5px solid rgba(34, 197, 94, 0.6)'
                    : '1.5px solid rgba(250, 204, 21, 0.6)',
                  borderRadius: '16px',
                  padding: '12px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.3)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {activeProg.level1Completed ? (
                    <CheckCircle2 size={16} color="#4ade80" />
                  ) : (
                    <BookOpen size={16} color="#facc15" />
                  )}
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 900,
                      color: activeProg.level1Completed ? '#4ade80' : '#facc15'
                    }}
                  >
                    Niveau 1
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600 }}>
                  {activeProg.level1Completed ? 'Ders M-Kemmel ✅' : '📖 Ders Ta3limi'}
                </span>
              </button>

              {/* Niveau 2: 3D Choice Runner */}
              <button
                disabled={!isLvl2Unlocked}
                onClick={() => handleOpenRunner(activeSong, 2)}
                style={{
                  background: !isLvl2Unlocked
                    ? 'rgba(255, 255, 255, 0.03)'
                    : activeProg.level2PerfectCount >= 10
                    ? 'rgba(34, 197, 94, 0.18)'
                    : 'rgba(56, 189, 248, 0.18)',
                  border: !isLvl2Unlocked
                    ? '1px solid rgba(255, 255, 255, 0.08)'
                    : activeProg.level2PerfectCount >= 10
                    ? '1.5px solid rgba(34, 197, 94, 0.6)'
                    : '1.5px solid rgba(56, 189, 248, 0.6)',
                  borderRadius: '16px',
                  padding: '12px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: isLvl2Unlocked ? 'pointer' : 'not-allowed',
                  opacity: isLvl2Unlocked ? 1 : 0.4
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {!isLvl2Unlocked ? (
                    <Lock size={14} color="#64748b" />
                  ) : (
                    <Flame size={16} color="#38bdf8" />
                  )}
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 900,
                      color: !isLvl2Unlocked ? '#64748b' : '#38bdf8'
                    }}
                  >
                    Niveau 2
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    color: isLvl2Unlocked ? '#facc15' : '#64748b',
                    fontWeight: 700
                  }}
                >
                  {isLvl2Unlocked ? `⚡ 3D (${activeProg.level2PerfectCount}/10)` : '🔒 Khass Ders 1'}
                </span>
              </button>

              {/* Niveau 3: Voice Arena */}
              <button
                disabled={!isLvl3Unlocked}
                onClick={() => handleOpenRunner(activeSong, 3)}
                style={{
                  background: !isLvl3Unlocked
                    ? 'rgba(255, 255, 255, 0.03)'
                    : activeProg.level3PerfectCount >= 10
                    ? 'rgba(234, 179, 8, 0.22)'
                    : 'rgba(168, 85, 247, 0.18)',
                  border: !isLvl3Unlocked
                    ? '1px solid rgba(255, 255, 255, 0.08)'
                    : activeProg.level3PerfectCount >= 10
                    ? '1.5px solid rgba(234, 179, 8, 0.7)'
                    : '1.5px solid rgba(168, 85, 247, 0.6)',
                  borderRadius: '16px',
                  padding: '12px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: isLvl3Unlocked ? 'pointer' : 'not-allowed',
                  opacity: isLvl3Unlocked ? 1 : 0.4
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {!isLvl3Unlocked ? (
                    <Lock size={14} color="#64748b" />
                  ) : (
                    <Mic size={16} color="#c084fc" />
                  )}
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 900,
                      color: !isLvl3Unlocked ? '#64748b' : '#c084fc'
                    }}
                  >
                    Niveau 3
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    color: isLvl3Unlocked ? '#eab308' : '#64748b',
                    fontWeight: 700
                  }}
                >
                  {isLvl3Unlocked
                    ? `🎙️ Voice (${activeProg.level3PerfectCount}/10 👑)`
                    : '🔒 10x Lvl 2'}
                </span>
              </button>
            </div>
          </div>

          {/* Next Arrow */}
          <button
            onClick={nextSong}
            style={{
              position: 'absolute',
              right: '16px',
              zIndex: 30,
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(0,0,0,0.5)'
            }}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </OrientationGuard>
  );
};
