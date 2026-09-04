import React, { useState } from 'react';
import {
  Music,
  Play,
  Lock,
  CheckCircle2,
  Trophy,
  Flame,
  Mic,
  Zap
} from 'lucide-react';
import type { SongDefinition, GameDifficultyLevel } from '../types';
import { getAllSongs } from '../services/songCurriculum';
import {
  getAllSongProgress,
  getSongProgress,
  isLevelUnlocked
} from '../services/gameProgressStorage';
import { Beat3DHighway } from './Beat3DHighway';

export const SongSelectHub: React.FC = () => {
  const songs = getAllSongs();
  const [selectedSong, setSelectedSong] = useState<SongDefinition | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<GameDifficultyLevel>(1);
  const [progressKey, setProgressKey] = useState(0); // Trigger re-render on game completion

  // Calculate high-level stats
  const allProgress = getAllSongProgress();
  const masteredCount = Object.values(allProgress).filter((p) => p.isMastered).length;
  const level1CompletedCount = Object.values(allProgress).filter((p) => p.level1Completed).length;

  // Group songs by tier
  const tiers = Array.from(new Set(songs.map((s) => s.tier)));

  const handleLaunchLevel = (song: SongDefinition, level: GameDifficultyLevel) => {
    if (!isLevelUnlocked(song.id, level)) return;
    setSelectedSong(song);
    setSelectedLevel(level);
  };

  const handleExitGame = () => {
    setSelectedSong(null);
    setProgressKey((prev) => prev + 1);
  };

  if (selectedSong) {
    return (
      <Beat3DHighway
        song={selectedSong}
        level={selectedLevel}
        onExit={handleExitGame}
        onLevelComplete={() => setProgressKey((prev) => prev + 1)}
      />
    );
  }

  return (
    <div key={progressKey} style={{
      minHeight: '100%',
      background: '#040711',
      color: '#ffffff',
      padding: '20px 16px 100px 16px',
      userSelect: 'none'
    }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4), rgba(88, 28, 135, 0.4))',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '20px',
        padding: '20px',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7, #9333ea)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Music size={22} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', margin: 0 }}>
              3D BEAT DEUTSCH
            </h1>
            <div style={{ fontSize: '12px', color: '#38bdf8' }}>
              Piano Highway dyal l-Almaniya b Darija
            </div>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5', margin: '0 0 16px 0' }}>
          Hfed l-Almaniya b l-moussiqa w l-iqa3! 3 d les niveaux: Ta3limi → 3D Choice (10x 100%) → Voice AI Pronunciation Arena (10x 100% Crown 👑).
        </p>

        {/* Global Progress Bar */}
        <div style={{
          display: 'flex',
          gap: '10px'
        }}>
          <div style={{
            flex: 1,
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '10px',
            padding: '8px 12px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Niveau 1 Dkhol</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#facc15' }}>
              {level1CompletedCount} / 20
            </div>
          </div>

          <div style={{
            flex: 1,
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '10px',
            padding: '8px 12px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Aghani Mastered</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8' }}>
              👑 {masteredCount} / 20
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum Tiers List */}
      {tiers.map((tier) => {
        const tierSongs = songs.filter((s) => s.tier === tier);
        return (
          <div key={tier} style={{ marginBottom: '28px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <Zap size={16} color="#38bdf8" />
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#cbd5e1', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {tier}
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tierSongs.map((song) => {
                const prog = getSongProgress(song.id);
                const isLvl2Unlocked = isLevelUnlocked(song.id, 2);
                const isLvl3Unlocked = isLevelUnlocked(song.id, 3);

                return (
                  <div
                    key={song.id}
                    style={{
                      background: 'rgba(15, 23, 42, 0.75)',
                      border: prog.isMastered
                        ? '1px solid rgba(234, 179, 8, 0.6)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '18px',
                      padding: '16px',
                      position: 'relative',
                      boxShadow: prog.isMastered ? '0 0 25px rgba(234, 179, 8, 0.15)' : 'none'
                    }}
                  >
                    {/* Crown Tag if Mastered */}
                    {prog.isMastered && (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'linear-gradient(135deg, #eab308, #ca8a04)',
                        color: '#000000',
                        fontSize: '11px',
                        fontWeight: 900,
                        padding: '3px 8px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Trophy size={13} />
                        <span>MASTERED</span>
                      </div>
                    )}

                    {/* Song Header */}
                    <div style={{ marginBottom: '14px', paddingRight: prog.isMastered ? '90px' : '0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 900,
                          color: '#38bdf8',
                          background: 'rgba(56, 189, 248, 0.12)',
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}>
                          #{song.number}
                        </span>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                          {song.title}
                        </h3>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {song.subtitle}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        <span style={{ fontSize: '10px', color: '#cbd5e1', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>
                          🎵 {song.instrument.replace('_', ' ')}
                        </span>
                        <span style={{ fontSize: '10px', color: '#cbd5e1', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>
                          ⚡ {song.bpm} BPM
                        </span>
                        <span style={{ fontSize: '10px', color: '#cbd5e1', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>
                          📝 {song.lyrics.length} Verben & Wörter
                        </span>
                      </div>
                    </div>

                    {/* Level Play Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {/* Level 1: Ta3limi */}
                      <button
                        onClick={() => handleLaunchLevel(song, 1)}
                        style={{
                          background: prog.level1Completed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(250, 204, 21, 0.15)',
                          border: prog.level1Completed ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(250, 204, 21, 0.4)',
                          borderRadius: '12px',
                          padding: '10px 6px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {prog.level1Completed ? (
                            <CheckCircle2 size={14} color="#4ade80" />
                          ) : (
                            <Play size={14} color="#facc15" />
                          )}
                          <span style={{ fontSize: '11px', fontWeight: 800, color: prog.level1Completed ? '#4ade80' : '#facc15' }}>
                            Niveau 1
                          </span>
                        </div>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>Ta3limi</span>
                      </button>

                      {/* Level 2: 3D Choice */}
                      <button
                        disabled={!isLvl2Unlocked}
                        onClick={() => handleLaunchLevel(song, 2)}
                        style={{
                          background: !isLvl2Unlocked
                            ? 'rgba(255,255,255,0.02)'
                            : prog.level2PerfectCount >= 10
                            ? 'rgba(34, 197, 94, 0.15)'
                            : 'rgba(56, 189, 248, 0.15)',
                          border: !isLvl2Unlocked
                            ? '1px solid rgba(255,255,255,0.06)'
                            : prog.level2PerfectCount >= 10
                            ? '1px solid rgba(34, 197, 94, 0.4)'
                            : '1px solid rgba(56, 189, 248, 0.4)',
                          borderRadius: '12px',
                          padding: '10px 6px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: isLvl2Unlocked ? 'pointer' : 'not-allowed',
                          opacity: isLvl2Unlocked ? 1 : 0.5
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {!isLvl2Unlocked ? (
                            <Lock size={13} color="#64748b" />
                          ) : (
                            <Flame size={14} color="#38bdf8" />
                          )}
                          <span style={{ fontSize: '11px', fontWeight: 800, color: !isLvl2Unlocked ? '#64748b' : '#38bdf8' }}>
                            Niveau 2
                          </span>
                        </div>
                        <span style={{ fontSize: '10px', color: isLvl2Unlocked ? '#facc15' : '#64748b', fontWeight: 700 }}>
                          {isLvl2Unlocked ? `${prog.level2PerfectCount}/10` : '🔒 Lvl 1'}
                        </span>
                      </button>

                      {/* Level 3: Voice Arena */}
                      <button
                        disabled={!isLvl3Unlocked}
                        onClick={() => handleLaunchLevel(song, 3)}
                        style={{
                          background: !isLvl3Unlocked
                            ? 'rgba(255,255,255,0.02)'
                            : prog.level3PerfectCount >= 10
                            ? 'rgba(234, 179, 8, 0.2)'
                            : 'rgba(168, 85, 247, 0.15)',
                          border: !isLvl3Unlocked
                            ? '1px solid rgba(255,255,255,0.06)'
                            : prog.level3PerfectCount >= 10
                            ? '1px solid rgba(234, 179, 8, 0.5)'
                            : '1px solid rgba(168, 85, 247, 0.4)',
                          borderRadius: '12px',
                          padding: '10px 6px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: isLvl3Unlocked ? 'pointer' : 'not-allowed',
                          opacity: isLvl3Unlocked ? 1 : 0.5
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {!isLvl3Unlocked ? (
                            <Lock size={13} color="#64748b" />
                          ) : (
                            <Mic size={14} color="#c084fc" />
                          )}
                          <span style={{ fontSize: '11px', fontWeight: 800, color: !isLvl3Unlocked ? '#64748b' : '#c084fc' }}>
                            Niveau 3
                          </span>
                        </div>
                        <span style={{ fontSize: '10px', color: isLvl3Unlocked ? '#eab308' : '#64748b', fontWeight: 700 }}>
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
  );
};
