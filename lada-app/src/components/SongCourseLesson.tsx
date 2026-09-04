import React, { useState } from 'react';
import {
  ArrowLeft,
  Volume2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Play
} from 'lucide-react';
import type { SongDefinition } from '../types';
import { recordLevelResult } from '../services/gameProgressStorage';

interface SongCourseLessonProps {
  song: SongDefinition;
  onBack: () => void;
  onUnlockedLevel2: () => void;
}

export const SongCourseLesson: React.FC<SongCourseLessonProps> = ({
  song,
  onBack,
  onUnlockedLevel2
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSlow, setIsSlow] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [quizStep, setQuizStep] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const currentLyric = song.lyrics[currentIndex];
  const totalLyrics = song.lyrics.length;

  // Speak German audio using browser SpeechSynthesis
  const playAudio = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const cleaned = text.replace(/\[.*?\]/g, '').replace(/[\(\)]/g, '').trim();
      const utt = new SpeechSynthesisUtterance(cleaned);
      utt.lang = 'de-DE';
      utt.rate = isSlow ? 0.75 : 1.0;
      utt.pitch = 1.0;

      setIsPlayingAudio(true);
      utt.onend = () => setIsPlayingAudio(false);
      utt.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utt);
    } catch {
      setIsPlayingAudio(false);
    }
  };

  // Article and syntax coloring
  const getGenderColor = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.startsWith('der ')) return '#60a5fa'; // Blue
    if (lower.startsWith('die ')) return '#f472b6'; // Pink
    if (lower.startsWith('das ')) return '#34d399'; // Green
    return '#facc15'; // Amber / Gold for verbs & phrases
  };

  // 3 Quiz Questions generated from lyrics
  const quizItems = [
    song.lyrics[0],
    song.lyrics[Math.floor(song.lyrics.length / 2)],
    song.lyrics[song.lyrics.length - 1]
  ].filter(Boolean);

  const handleFinishCourse = () => {
    recordLevelResult(song.id, 1, 100, 100);
    onUnlockedLevel2();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#040711',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      userSelect: 'none',
      overflowX: 'hidden'
    }}>
      {/* Top Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(8, 12, 24, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBack}
            style={{
              width: '38px',
              height: '38px',
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
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                background: 'rgba(234, 179, 8, 0.2)',
                color: '#facc15',
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                Niveau 1: Der Kurs
              </span>
              <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                {song.title}
              </h2>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{song.subtitle}</div>
          </div>
        </div>

        {/* Audio Speed Toggle */}
        <button
          onClick={() => setIsSlow(!isSlow)}
          style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '6px 12px',
            borderRadius: '20px',
            background: isSlow ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.08)',
            border: isSlow ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.15)',
            color: isSlow ? '#38bdf8' : '#94a3b8',
            cursor: 'pointer'
          }}
        >
          {isSlow ? '🐢 B chwiya (0.75x)' : '⚡ 3adi (1.0x)'}
        </button>
      </div>

      {/* Main Content Area */}
      {!quizStep ? (
        <div style={{
          flex: 1,
          maxWidth: '560px',
          width: '100%',
          margin: '0 auto',
          padding: '24px 20px 100px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          {/* Progress Bar & Counter */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px',
              color: '#94a3b8',
              marginBottom: '8px'
            }}>
              <span style={{ fontWeight: 700 }}>
                Kelma {currentIndex + 1} mn {totalLyrics}
              </span>
              <span style={{ color: '#38bdf8' }}>
                {Math.round(((currentIndex + 1) / totalLyrics) * 100)}%
              </span>
            </div>
            <div style={{
              height: '6px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '6px',
              overflow: 'hidden',
              marginBottom: '28px'
            }}>
              <div style={{
                height: '100%',
                width: `${((currentIndex + 1) / totalLyrics) * 100}%`,
                background: 'linear-gradient(to right, #38bdf8, #facc15)',
                transition: 'width 0.25s ease'
              }} />
            </div>

            {/* Main Interactive Word Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.7))',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '24px',
              padding: '28px 22px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              {/* German Word */}
              <div style={{
                fontSize: '28px',
                fontWeight: 900,
                color: getGenderColor(currentLyric.german),
                marginBottom: '10px',
                letterSpacing: '0.3px',
                lineHeight: '1.2'
              }}>
                {currentLyric.german}
              </div>

              {/* Phonetic Pronunciation Guide */}
              <div style={{
                display: 'inline-block',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '4px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                color: '#cbd5e1',
                marginBottom: '20px'
              }}>
                🗣️ Ntiq: <strong>{currentLyric.phoneticGuide}</strong>
              </div>

              {/* Big Audio Pronounce Button */}
              <div style={{ marginBottom: '24px' }}>
                <button
                  onClick={() => playAudio(currentLyric.german)}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: isPlayingAudio
                      ? 'linear-gradient(135deg, #facc15, #eab308)'
                      : 'linear-gradient(135deg, #0284c7, #2563eb)',
                    border: 'none',
                    color: isPlayingAudio ? '#000000' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    cursor: 'pointer',
                    boxShadow: '0 10px 25px rgba(2, 132, 199, 0.4)',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <Volume2 size={28} />
                </button>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
                  Wrek bash tsme3 ntiq s7i7
                </div>
              </div>

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '20px 0' }} />

              {/* Darija Meaning Breakdown */}
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                  🇲🇦 L-Ma3na b Darija
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', marginBottom: '14px' }}>
                  {currentLyric.darijaCorrect}
                </div>

                <div style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '12px',
                  color: '#93c5fd',
                  lineHeight: '1.5'
                }}>
                  💡 <strong>Kifach t3qel 3liha:</strong> Had l-kelma kat-st3mel f l-Almaniya f l-waqi3 yawmiyan. Hfedha b had n-ntiq: <em>{currentLyric.phoneticGuide}</em>.
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}>
            <button
              disabled={currentIndex === 0}
              onClick={() => {
                const next = Math.max(0, currentIndex - 1);
                setCurrentIndex(next);
                playAudio(song.lyrics[next].german);
              }}
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                opacity: currentIndex === 0 ? 0.4 : 1
              }}
            >
              <ChevronLeft size={18} />
              <span>S-sabiq</span>
            </button>

            {currentIndex < totalLyrics - 1 ? (
              <button
                onClick={() => {
                  const next = currentIndex + 1;
                  setCurrentIndex(next);
                  playAudio(song.lyrics[next].german);
                }}
                style={{
                  flex: 2,
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 10px 20px rgba(2, 132, 199, 0.3)'
                }}
              >
                <span>L-kelma l-majia</span>
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={() => setQuizStep(true)}
                style={{
                  flex: 2,
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #facc15, #eab308)',
                  border: 'none',
                  color: '#000000',
                  fontSize: '15px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 10px 25px rgba(250, 204, 21, 0.4)'
                }}
              >
                <CheckCircle2 size={18} />
                <span>Kmmlt l-Ders! Ikhtibar Sari3</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Comprehension Check Quiz */
        <div style={{
          flex: 1,
          maxWidth: '560px',
          width: '100%',
          margin: '0 auto',
          padding: '24px 20px 100px 20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.3), rgba(88, 28, 135, 0.3))',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <HelpCircle size={32} color="#38bdf8" style={{ margin: '0 auto 8px' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px 0', color: '#ffffff' }}>
              Ikhtibar Sari3 d l-Fhamat
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
              Jawb 3la had l-3 d les questions bash n-t2akkdo annak fhemti l-kelmat qbel mat-l3eb f l-Highway!
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
            {quizItems.map((item, idx) => {
              const chosen = quizAnswers[idx];
              const isCorrect = chosen === item.darijaCorrect;
              const options = [item.darijaCorrect, item.darijaDistractor].sort();

              return (
                <div
                  key={item.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '16px'
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    So2al {idx + 1}: Chno l-ma3na d:
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#facc15', marginBottom: '12px' }}>
                    "{item.german}" ?
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {options.map((opt) => {
                      const isSelected = chosen === opt;
                      let btnBg = 'rgba(255,255,255,0.05)';
                      let btnBorder = 'rgba(255,255,255,0.1)';

                      if (isSelected) {
                        btnBg = 'rgba(56, 189, 248, 0.2)';
                        btnBorder = '#38bdf8';
                      }

                      if (quizSubmitted) {
                        if (opt === item.darijaCorrect) {
                          btnBg = 'rgba(34, 197, 94, 0.25)';
                          btnBorder = '#22c55e';
                        } else if (isSelected && !isCorrect) {
                          btnBg = 'rgba(239, 68, 68, 0.25)';
                          btnBorder = '#ef4444';
                        }
                      }

                      return (
                        <button
                          key={opt}
                          onClick={() => {
                            if (!quizSubmitted) {
                              setQuizAnswers({ ...quizAnswers, [idx]: opt });
                            }
                          }}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '12px',
                            background: btnBg,
                            border: `1px solid ${btnBorder}`,
                            color: '#ffffff',
                            fontSize: '14px',
                            fontWeight: isSelected ? 800 : 600,
                            textAlign: 'left',
                            cursor: quizSubmitted ? 'default' : 'pointer'
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit / Finish Action */}
          <div>
            {!quizSubmitted ? (
              <button
                disabled={Object.keys(quizAnswers).length < quizItems.length}
                onClick={() => setQuizSubmitted(true)}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '16px',
                  background: Object.keys(quizAnswers).length === quizItems.length
                    ? 'linear-gradient(135deg, #0284c7, #2563eb)'
                    : 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: Object.keys(quizAnswers).length === quizItems.length ? 'pointer' : 'not-allowed',
                  opacity: Object.keys(quizAnswers).length === quizItems.length ? 1 : 0.4
                }}
              >
                T2kked mn l-Ajwiba
              </button>
            ) : (
              <button
                onClick={handleFinishCourse}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  boxShadow: '0 10px 30px rgba(34, 197, 94, 0.4)'
                }}
              >
                <Play size={20} />
                <span>Nadi! Débloquer Niveau 2 (3D Runner)</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
