import React, { useState } from 'react';
import {
  Music,
  Trophy,
  BookOpen,
  Flame,
  Mic,
  Lock,
  CheckCircle2,
  Zap,
  LogOut,
  Sparkles
} from 'lucide-react';
import type { SongDefinition, GameDifficultyLevel } from '../types';
import { getAllSongs } from '../services/songCurriculum';
import {
  getAllSongProgress,
  getSongProgress,
  isLevelUnlocked
} from '../services/gameProgressStorage';
import { SongCourseLesson } from './SongCourseLesson';
import { Beat3DHighway } from './Beat3DHighway';

interface DeutschBeatAppProps {
  onLockVault: () => void;
}

export const DeutschBeatApp: React.FC<DeutschBeatAppProps> = ({ onLockVault }) => {
  const songs = getAllSongs();
  const [activeSong, setActiveSong] = useState<SongDefinition | null>(null);
  const [activeMode, setActiveMode] = useState<'catalog' | 'course' | 'runner'>('catalog');
  const [activeLevel, setActiveLevel] = useState<GameDifficultyLevel>(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const allProgress = getAllSongProgress();
  const masteredCount = Object.values(allProgress).filter((p) => p.isMastered).length;
  const courseCompletedCount = Object.values(allProgress).filter((p) => p.level1Completed).length;

  const tiers = Array.from(new Set(songs.map((s) => s.tier)));

  const handleOpenCourse = (song: SongDefinition) => {
    setActiveSong(song);
    setActiveLevel(1);
    setActiveMode('course');
  };

  const handleOpenRunner = (song: SongDefinition, level: 2 | 3) => {
    if (!isLevelUnlocked(song.id, level)) return;
    setActiveSong(song);
    setActiveLevel(level);
    setActiveMode('runner');
  };

  const handleExitToCatalog = () => {
    setActiveSong(null);
    setActiveMode('catalog');
    setRefreshKey((k) => k + 1);
  };

  // 1. Course Mode (Niveau 1: Der Kurs)
  if (activeMode === 'course' && activeSong) {
    return (
      <SongCourseLesson
        song={activeSong}
        onBack={handleExitToCatalog}
        onUnlockedLevel2={() => {
          setRefreshKey((k) => k + 1);
          // Directly offer to launch Level 2 or go back
          handleOpenRunner(activeSong, 2);
        }}
      />
    );
  }

  // 2. Runner Mode (Niveau 2: 3D Choice or Niveau 3: Voice Arena)
  if (activeMode === 'runner' && activeSong) {
    return (
      <Beat3DHighway
        song={activeSong}
        level={activeLevel}
        onExit={handleExitToCatalog}
        onLevelComplete={() => setRefreshKey((k) => k + 1)}
      />
    );
  }

  // 3. Catalog / Career Map
  return (
    <div
      key={refreshKey}
      style={{
        minHeight: '100vh',
        background: '#040711',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none'
      }}
    >
      {/* Top Game Bar */}
      <div
        style={{
          padding: '16px 20px',
          background: 'rgba(8, 12, 24, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          backdropFilter: 'blur(20px)'
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7, #9333ea)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)'
            }}
          >
            <Music size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '17px', fontWeight: 900, letterSpacing: '0.5px' }}>
              DEUTSCH BEAT 3D
            </div>
            <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>
              Moroccan German Rhythm Arcade
            </div>
          </div>
        </div>

        {/* Lock Vault */}
        <button
          onClick={onLockVault}
          title="Verrouiller"
          style={{
            width: '36px',
            height: '36px',
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
          <LogOut size={16} />
        </button>
      </div>

      {/* Main Container */}
      <div
        style={{
          flex: 1,
          maxWidth: '720px',
          width: '100%',
          margin: '0 auto',
          padding: '24px 16px 80px 16px'
        }}
      >
        {/* Career Stats Hero Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.45), rgba(88, 28, 135, 0.45))',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '24px',
            padding: '22px',
            marginBottom: '32px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={18} color="#facc15" />
            <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: '#ffffff' }}>
              L-Kariera dyalk f l-Almaniya
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5', margin: '0 0 18px 0' }}>
            Kolla ghoniya fiha 3 d les étapes: <strong>1. Ders Ta3limi</strong> (katchouf l-ma3na w ntiq) →{' '}
            <strong>2. 3D Choice Runner</strong> (10x 100%) →{' '}
            <strong>3. Voice Arena</strong> (10x 100% Crown 👑).
          </p>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div
              style={{
                flex: 1,
                background: 'rgba(0, 0, 0, 0.35)',
                borderRadius: '14px',
                padding: '12px 14px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Dourous M-Kemmla</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#facc15' }}>
                📖 {courseCompletedCount} / 20
              </div>
            </div>

            <div
              style={{
                flex: 1,
                background: 'rgba(0, 0, 0, 0.35)',
                borderRadius: '14px',
                padding: '12px 14px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Aghani Mastered</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#38bdf8' }}>
                👑 {masteredCount} / 20
              </div>
            </div>
          </div>
        </div>

        {/* Tiers Curriculum */}
        {tiers.map((tier) => {
          const tierSongs = songs.filter((s) => s.tier === tier);
          return (
            <div key={tier} style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Zap size={16} color="#38bdf8" />
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    margin: 0
                  }}
                >
                  {tier}
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {tierSongs.map((song) => {
                  const prog = getSongProgress(song.id);
                  const isLvl2Unlocked = isLevelUnlocked(song.id, 2);
                  const isLvl3Unlocked = isLevelUnlocked(song.id, 3);

                  return (
                    <div
                      key={song.id}
                      style={{
                        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.7))',
                        border: prog.isMastered
                          ? '1px solid rgba(234, 179, 8, 0.6)'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '20px',
                        padding: '18px',
                        position: 'relative',
                        boxShadow: prog.isMastered ? '0 0 30px rgba(234, 179, 8, 0.2)' : 'none'
                      }}
                    >
                      {/* Mastered Crown Badge */}
                      {prog.isMastered && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '14px',
                            right: '14px',
                            background: 'linear-gradient(135deg, #eab308, #ca8a04)',
                            color: '#000000',
                            fontSize: '11px',
                            fontWeight: 900,
                            padding: '4px 10px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 0 15px rgba(234, 179, 8, 0.5)'
                          }}
                        >
                          <Trophy size={14} />
                          <span>MASTERED 100%</span>
                        </div>
                      )}

                      {/* Song Title & Tags */}
                      <div style={{ marginBottom: '16px', paddingRight: prog.isMastered ? '120px' : '0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 900,
                              color: '#38bdf8',
                              background: 'rgba(56, 189, 248, 0.12)',
                              padding: '2px 8px',
                              borderRadius: '6px'
                            }}
                          >
                            #{song.number}
                          </span>
                          <h4 style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                            {song.title}
                          </h4>
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{song.subtitle}</div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              color: '#cbd5e1',
                              background: 'rgba(255,255,255,0.06)',
                              padding: '2px 8px',
                              borderRadius: '4px'
                            }}
                          >
                            🎵 {song.instrument.replace('_', ' ')}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              color: '#cbd5e1',
                              background: 'rgba(255,255,255,0.06)',
                              padding: '2px 8px',
                              borderRadius: '4px'
                            }}
                          >
                            ⚡ {song.bpm} BPM
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              color: '#cbd5e1',
                              background: 'rgba(255,255,255,0.06)',
                              padding: '2px 8px',
                              borderRadius: '4px'
                            }}
                          >
                            📝 {song.lyrics.length} Verben & Wörter
                          </span>
                        </div>
                      </div>

                      {/* 3 Game Level Cards */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        {/* Niveau 1: Der Kurs (LESSON) */}
                        <button
                          onClick={() => handleOpenCourse(song)}
                          style={{
                            background: prog.level1Completed
                              ? 'rgba(34, 197, 94, 0.15)'
                              : 'rgba(250, 204, 21, 0.15)',
                            border: prog.level1Completed
                              ? '1px solid rgba(34, 197, 94, 0.4)'
                              : '1px solid rgba(250, 204, 21, 0.4)',
                            borderRadius: '14px',
                            padding: '12px 8px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {prog.level1Completed ? (
                              <CheckCircle2 size={15} color="#4ade80" />
                            ) : (
                              <BookOpen size={15} color="#facc15" />
                            )}
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                color: prog.level1Completed ? '#4ade80' : '#facc15'
                              }}
                            >
                              Niveau 1
                            </span>
                          </div>
                          <span style={{ fontSize: '10px', color: '#cbd5e1' }}>
                            {prog.level1Completed ? 'M-Kemmel ✅' : 'Ders Ta3limi'}
                          </span>
                        </button>

                        {/* Niveau 2: 3D Choice Runner */}
                        <button
                          disabled={!isLvl2Unlocked}
                          onClick={() => handleOpenRunner(song, 2)}
                          style={{
                            background: !isLvl2Unlocked
                              ? 'rgba(255, 255, 255, 0.03)'
                              : prog.level2PerfectCount >= 10
                              ? 'rgba(34, 197, 94, 0.15)'
                              : 'rgba(56, 189, 248, 0.15)',
                            border: !isLvl2Unlocked
                              ? '1px solid rgba(255, 255, 255, 0.06)'
                              : prog.level2PerfectCount >= 10
                              ? '1px solid rgba(34, 197, 94, 0.4)'
                              : '1px solid rgba(56, 189, 248, 0.4)',
                            borderRadius: '14px',
                            padding: '12px 8px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: isLvl2Unlocked ? 'pointer' : 'not-allowed',
                            opacity: isLvl2Unlocked ? 1 : 0.45
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {!isLvl2Unlocked ? (
                              <Lock size={14} color="#64748b" />
                            ) : (
                              <Flame size={15} color="#38bdf8" />
                            )}
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                color: !isLvl2Unlocked ? '#64748b' : '#38bdf8'
                              }}
                            >
                              Niveau 2
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: '10px',
                              color: isLvl2Unlocked ? '#facc15' : '#64748b',
                              fontWeight: 700
                            }}
                          >
                            {isLvl2Unlocked ? `${prog.level2PerfectCount}/10` : '🔒 Ders 1'}
                          </span>
                        </button>

                        {/* Niveau 3: Voice Arena */}
                        <button
                          disabled={!isLvl3Unlocked}
                          onClick={() => handleOpenRunner(song, 3)}
                          style={{
                            background: !isLvl3Unlocked
                              ? 'rgba(255, 255, 255, 0.03)'
                              : prog.level3PerfectCount >= 10
                              ? 'rgba(234, 179, 8, 0.2)'
                              : 'rgba(168, 85, 247, 0.15)',
                            border: !isLvl3Unlocked
                              ? '1px solid rgba(255, 255, 255, 0.06)'
                              : prog.level3PerfectCount >= 10
                              ? '1px solid rgba(234, 179, 8, 0.5)'
                              : '1px solid rgba(168, 85, 247, 0.4)',
                            borderRadius: '14px',
                            padding: '12px 8px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: isLvl3Unlocked ? 'pointer' : 'not-allowed',
                            opacity: isLvl3Unlocked ? 1 : 0.45
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {!isLvl3Unlocked ? (
                              <Lock size={14} color="#64748b" />
                            ) : (
                              <Mic size={15} color="#c084fc" />
                            )}
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                color: !isLvl3Unlocked ? '#64748b' : '#c084fc'
                              }}
                            >
                              Niveau 3
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: '10px',
                              color: isLvl3Unlocked ? '#eab308' : '#64748b',
                              fontWeight: 700
                            }}
                          >
                            {isLvl3Unlocked ? `${prog.level3PerfectCount}/10 👑` : '🔒 10x Lvl 2'}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
