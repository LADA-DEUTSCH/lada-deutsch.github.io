import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  GraduationCap,
  Sparkles,
  AlertTriangle,
  MessageSquare,
  RotateCcw,
  Trophy,
  Zap,
  HelpCircle,
  Play
} from 'lucide-react';
import type { SongDefinition } from '../types';
import { recordLevelResult } from '../services/gameProgressStorage';
import { toggleFullscreen, isFullscreen } from '../services/fullscreenUtils';
import { getMasterProfessorGuidance } from '../services/pedagogyEngine';

interface SongCourseLessonProps {
  song: SongDefinition;
  onBack: () => void;
  onUnlockedLevel2: () => void;
}

type ProfessorTab = 'explanation' | 'phonetic' | 'trap' | 'dialogue';

export const SongCourseLesson: React.FC<SongCourseLessonProps> = ({
  song,
  onBack,
  onUnlockedLevel2
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSlow, setIsSlow] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfessorTab>('explanation');
  const [visitedIndices, setVisitedIndices] = useState<Set<number>>(new Set([0]));
  const [quizStep, setQuizStep] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isFullscreenMode, setIsFullscreenMode] = useState(isFullscreen());

  const currentLyric = song.lyrics[currentIndex];
  const totalLyrics = song.lyrics.length;
  const guidance = getMasterProfessorGuidance(currentLyric);

  // Audio speech synthesis
  const playAudio = useCallback(
    (text: string, forceSlow?: boolean) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      try {
        window.speechSynthesis.cancel();
        const cleaned = text.replace(/\[.*?\]/g, '').replace(/[\(\)]/g, '').trim();
        const utt = new SpeechSynthesisUtterance(cleaned);
        utt.lang = 'de-DE';
        utt.rate = (forceSlow !== undefined ? forceSlow : isSlow) ? 0.72 : 1.0;
        utt.pitch = 1.0;

        setIsPlayingAudio(true);
        utt.onend = () => setIsPlayingAudio(false);
        utt.onerror = () => setIsPlayingAudio(false);

        window.speechSynthesis.speak(utt);
      } catch {
        setIsPlayingAudio(false);
      }
    },
    [isSlow]
  );

  // Mark current index as visited
  useEffect(() => {
    setVisitedIndices((prev) => new Set([...prev, currentIndex]));
  }, [currentIndex]);

  // Keyboard navigation & spacebar playback
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (quizStep) return;
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
      } else if (e.code === 'Digit1') {
        setActiveTab('explanation');
      } else if (e.code === 'Digit2') {
        setActiveTab('phonetic');
      } else if (e.code === 'Digit3') {
        setActiveTab('trap');
      } else if (e.code === 'Digit4') {
        setActiveTab('dialogue');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex, currentLyric, playAudio, quizStep, song.lyrics, totalLyrics]);

  // Sound chime for quiz
  const playChime = (isCorrect: boolean) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isCorrect) {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(260, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(190, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      // AudioContext unavailable
    }
  };

  // 3 Checkpoint Quiz items
  const quizItems = [
    song.lyrics[0],
    song.lyrics[Math.floor(song.lyrics.length / 2)],
    song.lyrics[song.lyrics.length - 1]
  ].filter(Boolean);

  const handleQuizAnswer = (qIndex: number, chosenText: string) => {
    const isCorrect = chosenText === quizItems[qIndex].darijaCorrect;
    playChime(isCorrect);

    const updated = { ...quizAnswers, [qIndex]: chosenText };
    setQuizAnswers(updated);

    if (Object.keys(updated).length === quizItems.length) {
      const allCorrect = quizItems.every((item, idx) => updated[idx] === item.darijaCorrect);
      if (allCorrect) {
        setQuizCompleted(true);
        recordLevelResult(song.id, 1, 100, 100);
      }
    }
  };

  const handleFinishCourse = () => {
    recordLevelResult(song.id, 1, 100, 100);
    onUnlockedLevel2();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(circle at 50% 15%, #081022 0%, #030712 100%)',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* --- Top Header Navigation Bar --- */}
      <div
        style={{
          height: '56px',
          padding: '0 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(5, 10, 20, 0.85)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 30
        }}
      >
        {/* Left: Back & Song Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <ArrowLeft size={14} />
            <span>Rje3</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 900,
                letterSpacing: '0.8px',
                background: 'linear-gradient(90deg, #facc15, #f59e0b)',
                color: '#000000',
                padding: '3px 10px',
                borderRadius: '6px'
              }}
            >
              🎓 OUSTAD LADA • DER MEISTER-KURS
            </span>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
              #{song.number} {song.title}
            </span>
          </div>
        </div>

        {/* Center: Interactive Progress Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {song.lyrics.map((_, i) => {
            const isCurrent = i === currentIndex;
            const isVisited = visitedIndices.has(i);
            return (
              <div
                key={i}
                onClick={() => {
                  if (quizStep) return;
                  setCurrentIndex(i);
                  playAudio(song.lyrics[i].german);
                }}
                title={`Kelma ${i + 1}`}
                style={{
                  width: isCurrent ? '26px' : '9px',
                  height: '9px',
                  borderRadius: '5px',
                  background: isCurrent
                    ? '#00f0ff'
                    : isVisited
                    ? '#10b981'
                    : 'rgba(255, 255, 255, 0.15)',
                  cursor: quizStep ? 'default' : 'pointer',
                  boxShadow: isCurrent ? '0 0 10px rgba(0, 240, 255, 0.8)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            );
          })}
        </div>

        {/* Right: Audio Speed Selector & Fullscreen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setIsSlow(!isSlow)}
            style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '6px 14px',
              borderRadius: '20px',
              background: isSlow ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.06)',
              border: isSlow ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.12)',
              color: isSlow ? '#00f0ff' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {isSlow ? '🐢 B chwiya (0.75x)' : '⚡ 3adi (1.0x)'}
          </button>

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
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {isFullscreenMode ? <Minimize size={15} /> : <Maximize size={15} />}
          </button>
        </div>
      </div>

      {/* --- Main Studio Stage (Widescreen 16:9) --- */}
      {!quizStep ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            padding: '18px 24px',
            gap: '22px',
            overflow: 'hidden'
          }}
        >
          {/* ==================================================== */}
          {/* LEFT STAGE: The German Word Acoustic Spotlight (42%) */}
          {/* ==================================================== */}
          <div
            style={{
              flex: 42,
              background: 'rgba(10, 16, 32, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
              position: 'relative'
            }}
          >
            {/* Top Tag & Grammatical Role */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 900,
                  padding: '4px 12px',
                  borderRadius: '12px',
                  background: guidance.grammarBadge.bg,
                  color: guidance.grammarBadge.color,
                  border: `1px solid ${guidance.grammarBadge.border}`,
                  letterSpacing: '0.5px'
                }}
              >
                {guidance.grammarBadge.label}
              </div>

              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#94a3b8',
                  background: 'rgba(255, 255, 255, 0.06)',
                  padding: '4px 10px',
                  borderRadius: '10px'
                }}
              >
                Kelma {currentIndex + 1} / {totalLyrics}
              </div>
            </div>

            {/* Word Centerpiece */}
            <div
              style={{
                textAlign: 'center',
                width: '100%',
                margin: 'auto 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              {/* Giant German Word */}
              <div
                style={{
                  fontSize:
                    currentLyric.german.length > 20
                      ? '28px'
                      : currentLyric.german.length > 12
                      ? '36px'
                      : '44px',
                  fontWeight: 900,
                  color: guidance.grammarBadge.color,
                  lineHeight: '1.2',
                  marginBottom: '14px',
                  letterSpacing: '-0.5px',
                  textShadow: `0 0 35px ${guidance.grammarBadge.color}40`
                }}
              >
                {currentLyric.german}
              </div>

              {/* Phonetic Pronunciation Pill */}
              <div
                onClick={() => playAudio(currentLyric.german)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '6px 18px',
                  borderRadius: '24px',
                  fontSize: '14px',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ color: '#00f0ff' }}>🗣️ Ntiq:</span>
                <strong style={{ letterSpacing: '0.3px' }}>{currentLyric.phoneticGuide}</strong>
              </div>

              {/* Waveform Dynamic Visualizer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  height: '36px',
                  marginTop: '18px'
                }}
              >
                {Array.from({ length: 18 }).map((_, idx) => {
                  const heights = [8, 14, 22, 10, 28, 16, 32, 24, 18, 30, 14, 26, 12, 20, 16, 24, 10, 8];
                  const barHeight = isPlayingAudio
                    ? heights[idx % heights.length]
                    : 6;
                  return (
                    <div
                      key={idx}
                      style={{
                        width: '3px',
                        height: `${barHeight}px`,
                        borderRadius: '2px',
                        background: isPlayingAudio
                          ? 'linear-gradient(180deg, #00f0ff, #facc15)'
                          : 'rgba(255, 255, 255, 0.15)',
                        transition: 'height 0.12s ease'
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Audio Interaction Center */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                width: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => playAudio(currentLyric.german, true)}
                  title="3awed b chwiya (0.75x)"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <RotateCcw size={16} />
                </button>

                {/* Big Glowing Audio Playback Button */}
                <button
                  onClick={() => playAudio(currentLyric.german)}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: isPlayingAudio
                      ? 'linear-gradient(135deg, #00f0ff, #0284c7)'
                      : 'linear-gradient(135deg, #0284c7, #2563eb)',
                    border: 'none',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: isPlayingAudio
                      ? '0 0 30px rgba(0, 240, 255, 0.7)'
                      : '0 10px 25px rgba(2, 132, 199, 0.4)',
                    transform: isPlayingAudio ? 'scale(1.08)' : 'scale(1)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Volume2 size={28} />
                </button>

                <button
                  onClick={() => playAudio(currentLyric.german, false)}
                  title="3awed b sor3a 3adiya (1.0x)"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Zap size={16} />
                </button>
              </div>

              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                Wrek bash tsme3 • Shortcut: <strong>Spacebar</strong> ⌨️
              </div>
            </div>
          </div>

          {/* ==================================================== */}
          {/* RIGHT STAGE: The Master Professor Desk (58%)         */}
          {/* ==================================================== */}
          <div
            style={{
              flex: 58,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px'
            }}
          >
            {/* Top Professor Card */}
            <div
              style={{
                flex: 1,
                background: 'rgba(10, 16, 32, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
                overflowY: 'auto'
              }}
            >
              <div>
                {/* Professor Status Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #facc15, #f59e0b)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#000000'
                      }}
                    >
                      <GraduationCap size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: '#ffffff' }}>
                        Oustad LADA: Char7 d l-Oustad
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#10b981',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      padding: '2px 10px',
                      borderRadius: '12px'
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#10b981',
                        boxShadow: '0 0 6px #10b981'
                      }}
                    />
                    Live Darija Pedagogy
                  </div>
                </div>

                {/* Moroccan Darija Translation Title */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '12px 18px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                      🇲🇦 L-Ma3na b Darija l-Maghribiya
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: '#facc15', marginTop: '2px' }}>
                      {currentLyric.darijaCorrect}
                    </div>
                  </div>
                  <div style={{ fontSize: '24px' }}>✨</div>
                </div>

                {/* Interactive 4-Tab Navigation Selector */}
                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '4px',
                    borderRadius: '14px',
                    marginBottom: '14px'
                  }}
                >
                  <button
                    onClick={() => setActiveTab('explanation')}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      borderRadius: '10px',
                      border: 'none',
                      background: activeTab === 'explanation' ? '#00f0ff' : 'transparent',
                      color: activeTab === 'explanation' ? '#000000' : '#cbd5e1',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Sparkles size={13} />
                    <span>Char7 d l-Prof</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('phonetic')}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      borderRadius: '10px',
                      border: 'none',
                      background: activeTab === 'phonetic' ? '#38bdf8' : 'transparent',
                      color: activeTab === 'phonetic' ? '#000000' : '#cbd5e1',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Volume2 size={13} />
                    <span>Sirr d n-Ntiq</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('trap')}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      borderRadius: '10px',
                      border: 'none',
                      background: activeTab === 'trap' ? '#f59e0b' : 'transparent',
                      color: activeTab === 'trap' ? '#000000' : '#cbd5e1',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <AlertTriangle size={13} />
                    <span>Fekh l-Mgharba</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('dialogue')}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      borderRadius: '10px',
                      border: 'none',
                      background: activeTab === 'dialogue' ? '#a78bfa' : 'transparent',
                      color: activeTab === 'dialogue' ? '#000000' : '#cbd5e1',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <MessageSquare size={13} />
                    <span>F l-Waqi3</span>
                  </button>
                </div>

                {/* Tab Content Box */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '16px',
                    padding: '16px',
                    minHeight: '120px'
                  }}
                >
                  {/* Tab 1: Char7 d l-Oustad */}
                  {activeTab === 'explanation' && (
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#00f0ff', marginBottom: '6px' }}>
                        🧠 Kifach t-fhemha w t-khedemha bla ma tfekker:
                      </div>
                      <div style={{ fontSize: '13px', lineHeight: '1.7', color: '#e2e8f0' }}>
                        {guidance.explanation}
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Sirr d n-Ntiq */}
                  {activeTab === 'phonetic' && (
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', marginBottom: '6px' }}>
                        🗣️ Sirr d n-Ntiq: Fin t-7ett lsanek w chnayfek:
                      </div>
                      <div style={{ fontSize: '13px', lineHeight: '1.7', color: '#e2e8f0' }}>
                        {guidance.phoneticSecret}
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Fekh l-Mgharba */}
                  {activeTab === 'trap' && (
                    <div
                      style={{
                        background: 'rgba(245, 158, 11, 0.08)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        borderRadius: '12px',
                        padding: '12px'
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', marginBottom: '4px' }}>
                        ⚠️ Rdd l-bal mn had l-Ghalat li kaydiroh l-Mgharba:
                      </div>
                      <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#fef3c7' }}>
                        {guidance.moroccanTrap}
                      </div>
                    </div>
                  )}

                  {/* Tab 4: F l-Waqi3 (Street Dialogue) */}
                  {activeTab === 'dialogue' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#a78bfa', marginBottom: '4px' }}>
                        🎬 Hiwar f l-Waqi3 (Kifach kayhdro l-Alman f z-zenqa):
                      </div>

                      <div
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          fontSize: '13px'
                        }}
                      >
                        <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                          {guidance.realDialogue.speakerA}{' '}
                        </span>
                        <span style={{ color: '#ffffff' }}>{guidance.realDialogue.germanA}</span>
                      </div>

                      <div
                        style={{
                          background: 'rgba(0, 240, 255, 0.08)',
                          border: '1px solid rgba(0, 240, 255, 0.2)',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          fontSize: '13px'
                        }}
                      >
                        <span style={{ color: '#00f0ff', fontWeight: 700 }}>
                          {guidance.realDialogue.speakerB}{' '}
                        </span>
                        <span style={{ color: '#ffffff', fontWeight: 700 }}>
                          {guidance.realDialogue.germanB}
                        </span>
                      </div>

                      <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', marginTop: '2px' }}>
                        📌 Siyaq: {guidance.realDialogue.darijaContext}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Memory Hook Banner (Pinned Bottom) */}
              <div
                style={{
                  marginTop: '12px',
                  background: 'rgba(250, 204, 21, 0.08)',
                  border: '1px solid rgba(250, 204, 21, 0.2)',
                  borderRadius: '12px',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: '#fde047'
                }}
              >
                <span>💡</span>
                <span>
                  <strong>Sirr d l-Hfid:</strong> {guidance.memoryHook}
                </span>
              </div>
            </div>

            {/* Bottom Widescreen Deck Navigation */}
            <div style={{ display: 'flex', gap: '12px', height: '52px' }}>
              <button
                onClick={() => {
                  if (currentIndex > 0) {
                    const prev = currentIndex - 1;
                    setCurrentIndex(prev);
                    playAudio(song.lyrics[prev].german);
                  }
                }}
                disabled={currentIndex === 0}
                style={{
                  flex: 1,
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: currentIndex === 0 ? '#475569' : '#ffffff',
                  fontSize: '13px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <ChevronLeft size={16} />
                <span>S-Sabiq (←)</span>
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
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(2, 132, 199, 0.4)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>L-Kelma l-Majia (→)</span>
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  onClick={() => setQuizStep(true)}
                  style={{
                    flex: 2,
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #f59e0b, #eab308)',
                    border: 'none',
                    color: '#000000',
                    fontSize: '14px',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 8px 25px rgba(245, 158, 11, 0.5)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Trophy size={18} />
                  <span>Kmml l-Ders & Douz l l-Quiz! 🎯</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ==================================================== */
        /* ACTIVE RECALL CHECKPOINT (THE COMPREHENSION QUIZ)    */
        /* ==================================================== */
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '680px',
              background: 'rgba(10, 16, 32, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(24px)',
              borderRadius: '28px',
              padding: '32px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            {!quizCompleted ? (
              <>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      fontWeight: 900,
                      background: 'rgba(250, 204, 21, 0.15)',
                      color: '#facc15',
                      border: '1px solid rgba(250, 204, 21, 0.3)',
                      padding: '4px 14px',
                      borderRadius: '20px',
                      marginBottom: '8px'
                    }}
                  >
                    <HelpCircle size={14} />
                    <span>ACTIVE RECALL CHECKPOINT</span>
                  </div>
                  <h2 style={{ fontSize: '22px', fontWeight: 900, margin: '4px 0', color: '#ffffff' }}>
                    Test d l-Fhamat: Wash dbti had l-kelmat?
                  </h2>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                    Jawb 3la had l-3 d l-as2ila bash t-veri-fier fhamtek w it-7ell lik Niveau 2 d l-Highway!
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {quizItems.map((item, qIdx) => {
                    const chosen = quizAnswers[qIdx];
                    const isAnswered = chosen !== undefined;
                    const isCorrect = chosen === item.darijaCorrect;

                    return (
                      <div
                        key={qIdx}
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: isAnswered
                            ? isCorrect
                              ? '1px solid #10b981'
                              : '1px solid #ef4444'
                            : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '16px',
                          padding: '14px 18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '16px'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>
                            Soual {qIdx + 1}: Chno kat3ni:
                          </div>
                          <div style={{ fontSize: '20px', fontWeight: 900, color: '#00f0ff' }}>
                            {item.german}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          {[item.darijaCorrect, item.darijaDistractor]
                            .sort((a, b) => (qIdx % 2 === 0 ? (a > b ? 1 : -1) : (a > b ? -1 : 1)))
                            .map((choice, cIdx) => {
                              const isThisChosen = chosen === choice;
                              return (
                                <button
                                  key={cIdx}
                                  onClick={() => handleQuizAnswer(qIdx, choice)}
                                  style={{
                                    padding: '8px 16px',
                                    borderRadius: '12px',
                                    background: isThisChosen
                                      ? choice === item.darijaCorrect
                                        ? '#10b981'
                                        : '#ef4444'
                                      : 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    color: '#ffffff',
                                    fontSize: '12px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  {choice}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={() => setQuizStep(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ← Rje3 l d-ders
                  </button>

                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Khtar l-jawab s-s7i7 l kol soual
                  </div>
                </div>
              </>
            ) : (
              /* Quiz Passed Celebration Screen */
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div
                  style={{
                    width: '76px',
                    height: '76px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: '0 0 35px rgba(16, 185, 129, 0.6)'
                  }}
                >
                  <Trophy size={40} color="#ffffff" />
                </div>

                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 900,
                    color: '#10b981',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '4px'
                  }}
                >
                  DER KURS MEISTERHAFT BEENDET!
                </div>

                <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#ffffff', marginBottom: '8px' }}>
                  Tbarkellah 3lik! Dbti l-Ders 100%!
                </h2>

                <p style={{ fontSize: '14px', color: '#cbd5e1', maxWidth: '440px', margin: '0 auto 24px' }}>
                  Fhemti ga3 l-asrar d n-ntiq w l-grammaire d had l-ghoniya. Daba t7ell lik{' '}
                  <strong style={{ color: '#00f0ff' }}>Niveau 2: 3D Dual-Choice Runner</strong>!
                </p>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    onClick={onBack}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '16px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Rje3 l l-Menu
                  </button>

                  <button
                    onClick={handleFinishCourse}
                    style={{
                      padding: '12px 32px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #00f0ff, #0284c7)',
                      border: 'none',
                      color: '#000000',
                      fontSize: '15px',
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 8px 25px rgba(0, 240, 255, 0.5)'
                    }}
                  >
                    <span>Bda Niveau 2: 3D Highway</span>
                    <Play size={16} fill="#000000" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
