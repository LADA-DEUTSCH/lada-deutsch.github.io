import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Volume2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Play,
  Maximize,
  Minimize
} from 'lucide-react';
import type { SongDefinition } from '../types';
import { recordLevelResult } from '../services/gameProgressStorage';
import { toggleFullscreen, isFullscreen } from '../services/fullscreenUtils';

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
  const [isFullscreenMode, setIsFullscreenMode] = useState(isFullscreen());

  const currentLyric = song.lyrics[currentIndex];
  const totalLyrics = song.lyrics.length;

  // Speak German audio using browser SpeechSynthesis
  const playAudio = useCallback((text: string) => {
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
  }, [isSlow]);

  // Spacebar shortcut to play audio
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        playAudio(currentLyric.german);
      } else if (e.code === 'ArrowRight' && currentIndex < totalLyrics - 1) {
        const next = currentIndex + 1;
        setCurrentIndex(next);
        playAudio(song.lyrics[next].german);
      } else if (e.code === 'ArrowLeft' && currentIndex > 0) {
        const prev = currentIndex - 1;
        setCurrentIndex(prev);
        playAudio(song.lyrics[prev].german);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex, currentLyric, playAudio, song.lyrics, totalLyrics]);

  // Article and syntax coloring
  const getGenderColor = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.startsWith('der ')) return '#38bdf8'; // Blue
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
    <div
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
      {/* Top Header */}
      <div
        style={{
          height: '54px',
          padding: '0 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(8, 12, 24, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 20
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBack}
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
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 900,
                  background: 'rgba(234, 179, 8, 0.2)',
                  color: '#facc15',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}
              >
                NIVEAU 1: DER KURS
              </span>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
                #{song.number} {song.title}
              </span>
            </div>
          </div>
        </div>

        {/* Center Progress Dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {song.lyrics.map((_, i) => (
            <div
              key={i}
              onClick={() => {
                setCurrentIndex(i);
                playAudio(song.lyrics[i].german);
              }}
              style={{
                width: i === currentIndex ? '20px' : '6px',
                height: '6px',
                borderRadius: '3px',
                background:
                  i === currentIndex
                    ? '#38bdf8'
                    : i < currentIndex
                    ? 'rgba(56, 189, 248, 0.5)'
                    : 'rgba(255,255,255,0.15)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Audio Speed Toggle */}
          <button
            onClick={() => setIsSlow(!isSlow)}
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '5px 12px',
              borderRadius: '16px',
              background: isSlow ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.08)',
              border: isSlow ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.15)',
              color: isSlow ? '#38bdf8' : '#94a3b8',
              cursor: 'pointer'
            }}
          >
            {isSlow ? '🐢 B chwiya (0.75x)' : '⚡ 3adi (1.0x)'}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={() => {
              toggleFullscreen();
              setIsFullscreenMode(!isFullscreenMode);
            }}
            title="Plein Écran"
            style={{
              width: '32px',
              height: '32px',
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
            {isFullscreenMode ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>
        </div>
      </div>

      {/* Main Widescreen Split Stage */}
      {!quizStep ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            padding: '16px 24px',
            gap: '20px',
            overflow: 'hidden'
          }}
        >
          {/* Left Panel: German Spotlight (45%) */}
          <div
            style={{
              flex: 45,
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.8))',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 15px 35px rgba(0,0,0,0.5)',
              position: 'relative'
            }}
          >
            {/* Word Index Tag */}
            <div
              style={{
                alignSelf: 'flex-start',
                fontSize: '11px',
                fontWeight: 800,
                color: '#94a3b8',
                background: 'rgba(255,255,255,0.06)',
                padding: '3px 10px',
                borderRadius: '8px'
              }}
            >
              Kelma {currentIndex + 1} / {totalLyrics}
            </div>

            {/* German Word */}
            <div style={{ textAlign: 'center', margin: 'auto 0' }}>
              <div
                style={{
                  fontSize: '36px',
                  fontWeight: 900,
                  color: getGenderColor(currentLyric.german),
                  lineHeight: '1.2',
                  marginBottom: '12px',
                  textShadow: '0 0 25px rgba(250, 204, 21, 0.25)'
                }}
              >
                {currentLyric.german}
              </div>

              {/* Phonetic Tag */}
              <div
                style={{
                  display: 'inline-block',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  padding: '5px 16px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  color: '#cbd5e1'
                }}
              >
                🗣️ Ntiq: <strong>{currentLyric.phoneticGuide}</strong>
              </div>
            </div>

            {/* Glowing Audio Button */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => playAudio(currentLyric.german)}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: isPlayingAudio
                    ? 'linear-gradient(135deg, #facc15, #eab308)'
                    : 'linear-gradient(135deg, #0284c7, #2563eb)',
                  border: 'none',
                  color: isPlayingAudio ? '#000000' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(2, 132, 199, 0.5)',
                  transform: isPlayingAudio ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <Volume2 size={26} />
              </button>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                Wrek bash tsme3 (wla wrek <strong>Space</strong>)
              </div>
            </div>
          </div>

          {/* Right Panel: Darija Master Guide & Controls (55%) */}
          <div
            style={{
              flex: 55,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px'
            }}
          >
            {/* Darija Guide Card */}
            <div
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.7))',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 15px 35px rgba(0,0,0,0.5)'
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    marginBottom: '6px'
                  }}
                >
                  🇲🇦 L-Ma3na b Darija
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', marginBottom: '16px' }}>
                  {currentLyric.darijaCorrect}
                </div>

                {/* Practical Context Box */}
                <div
                  style={{
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    borderRadius: '14px',
                    padding: '14px',
                    fontSize: '13px',
                    color: '#93c5fd',
                    lineHeight: '1.6'
                  }}
                >
                  💡 <strong>Kifach t3qel 3liha:</strong> Had l-kelma kat-st3mel f l-Almaniya yawmiyan. Hfedha b n-ntiq <em>{currentLyric.phoneticGuide}</em> bash fach tmshi l Niveau 2 d l-3erd t-3refha b zzerba bla ma tfekker!
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Kmml ga3 l-kelmat bash it7ell lik l-quiz d l-fhamat w tdouz l Niveau 2 d l-Highway!
              </div>
            </div>

            {/* Bottom Widescreen Navigation Bar */}
            <div style={{ display: 'flex', gap: '12px', height: '52px' }}>
              <button
                disabled={currentIndex === 0}
                onClick={() => {
                  const prev = Math.max(0, currentIndex - 1);
                  setCurrentIndex(prev);
                  playAudio(song.lyrics[prev].german);
                }}
                style={{
                  flex: 1,
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                  opacity: currentIndex === 0 ? 0.35 : 1
                }}
              >
                <ChevronLeft size={16} />
                <span>S-Sabiq</span>
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
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  <span>L-Majia</span>
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={() => setQuizStep(true)}
                  style={{
                    flex: 2,
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #facc15, #eab308)',
                    border: 'none',
                    color: '#000000',
                    fontSize: '14px',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(250, 204, 21, 0.4)'
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Kmmlt l-Ders! Ikhtibar Sari3</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Widescreen Quiz Grid */
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '20px 30px',
            overflowY: 'auto'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <HelpCircle size={20} color="#38bdf8" />
              <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: '#ffffff' }}>
                Ikhtibar Sari3 d l-Fhamat
              </h2>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Jawb 3la had l-3 d les questions bash t2kked annak fhemti l-kelmat qbel mat-l3eb f l-Highway!
            </div>
          </div>

          {/* 3 Question Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '16px' }}>
            {quizItems.map((item, idx) => {
              const chosen = quizAnswers[idx];
              const isCorrect = chosen === item.darijaCorrect;
              const options = [item.darijaCorrect, item.darijaDistractor].sort();

              return (
                <div
                  key={item.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                      So2al {idx + 1}: Chno l-ma3na d:
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#facc15', marginBottom: '14px' }}>
                      "{item.german}" ?
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {options.map((opt) => {
                      const isSelected = chosen === opt;
                      let btnBg = 'rgba(255,255,255,0.05)';
                      let btnBorder = 'rgba(255,255,255,0.1)';

                      if (isSelected) {
                        btnBg = 'rgba(56, 189, 248, 0.25)';
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
                            padding: '10px 12px',
                            borderRadius: '10px',
                            background: btnBg,
                            border: `1px solid ${btnBorder}`,
                            color: '#ffffff',
                            fontSize: '13px',
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

          {/* Submit Action */}
          <div style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}>
            {!quizSubmitted ? (
              <button
                disabled={Object.keys(quizAnswers).length < quizItems.length}
                onClick={() => setQuizSubmitted(true)}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '14px',
                  background:
                    Object.keys(quizAnswers).length === quizItems.length
                      ? 'linear-gradient(135deg, #0284c7, #2563eb)'
                      : 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '14px',
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
                  padding: '14px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(34, 197, 94, 0.4)'
                }}
              >
                <Play size={18} />
                <span>Nadi! Débloquer Niveau 2 (3D Runner)</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
