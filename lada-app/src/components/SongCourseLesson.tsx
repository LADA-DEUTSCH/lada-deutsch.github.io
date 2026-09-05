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
  Play,
  Pause,
  Send,
  Bot,
  X
} from 'lucide-react';
import type { SongDefinition } from '../types';
import { recordLevelResult } from '../services/gameProgressStorage';
import { toggleFullscreen, isFullscreen } from '../services/fullscreenUtils';
import { getMasterProfessorGuidance } from '../services/pedagogyEngine';
import { askAiProfessor } from '../services/aiProfessorService';
import { geminiAudioTts, type GeminiVoiceName } from '../services/geminiAudioTts';

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

  // Gemini Audio & Voice Engine States
  const [selectedVoice, setSelectedVoice] = useState<GeminiVoiceName>('Puck');
  const [audioTarget, setAudioTarget] = useState<'word' | 'professor' | null>(null);
  const [isAudioGenerating, setIsAudioGenerating] = useState(false);

  // Auto-Pilot Lecture Mode State
  const [isAutoPilot, setIsAutoPilot] = useState(false);
  const [autoTimerProgress, setAutoTimerProgress] = useState(0);

  // AI Professor Assistant State (Gemini API Integration)
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');

  const currentLyric = song.lyrics[currentIndex];
  const totalLyrics = song.lyrics.length;
  const guidance = getMasterProfessorGuidance(currentLyric);

  // Audio Playback Listener
  useEffect(() => {
    geminiAudioTts.setOnPlaybackStateChange((playing) => {
      setIsPlayingAudio(playing);
      if (!playing) {
        setAudioTarget(null);
      }
    });

    return () => {
      geminiAudioTts.stopAudio();
    };
  }, []);

  // Preload German Audio for instant response
  useEffect(() => {
    if (currentLyric) {
      geminiAudioTts.preloadAudio(currentLyric.german, selectedVoice);
    }
    if (currentIndex + 1 < song.lyrics.length) {
      geminiAudioTts.preloadAudio(song.lyrics[currentIndex + 1].german, selectedVoice);
    }
  }, [currentIndex, currentLyric, selectedVoice, song.lyrics]);

  // Audio Speech Synthesis for German Word (Google Gemini Studio 24kHz)
  const playAudio = useCallback(
    async (text: string, forceSlow?: boolean): Promise<void> => {
      setAudioTarget('word');
      setIsAudioGenerating(true);
      const rate = (forceSlow !== undefined ? forceSlow : isSlow) ? 0.75 : 1.0;
      try {
        await geminiAudioTts.speakText(text, selectedVoice, 'de-DE', rate);
      } finally {
        setIsAudioGenerating(false);
      }
    },
    [isSlow, selectedVoice]
  );

  // Professor Explanation Audio (Moroccan Darija in Arabic Script via Google Gemini API)
  const speakProfessorExplanation = useCallback(
    async (tabToSpeak?: ProfessorTab): Promise<void> => {
      const tab = tabToSpeak || activeTab;
      let textToSpeak = '';
      if (tab === 'explanation') {
        textToSpeak = guidance.explanation;
      } else if (tab === 'phonetic') {
        textToSpeak = `سر النطق: ${guidance.phoneticSecret}`;
      } else if (tab === 'trap') {
        textToSpeak = `رد البال من هاد الفخ: ${guidance.moroccanTrap}`;
      } else if (tab === 'dialogue') {
        textToSpeak = `${guidance.realDialogue.germanA}. ${guidance.realDialogue.germanB}. السياق: ${guidance.realDialogue.darijaContext}`;
      }

      if (!textToSpeak) return;

      setAudioTarget('professor');
      setIsAudioGenerating(true);
      try {
        await geminiAudioTts.speakText(textToSpeak, selectedVoice, 'ar-SA', 1.0);
      } finally {
        setIsAudioGenerating(false);
      }
    },
    [activeTab, guidance, selectedVoice]
  );

  const stopAllAudio = useCallback(() => {
    geminiAudioTts.stopAudio();
    setIsPlayingAudio(false);
    setAudioTarget(null);
    setIsAudioGenerating(false);
  }, []);

  // Mark visited
  useEffect(() => {
    setVisitedIndices((prev) => new Set([...prev, currentIndex]));
  }, [currentIndex]);

  // =========================================================
  // AUTO-PILOT LECTURE SYSTEM (الأستاذ هو اللي كيتحكم ويشرح بصوتو)
  // =========================================================
  useEffect(() => {
    if (!isAutoPilot || quizStep) {
      setAutoTimerProgress(0);
      return;
    }

    let isCancelled = false;
    let stepTimer: any = null;

    const runAutoPilotWordSequence = async () => {
      // Step 1: Pronounce the German Word clearly
      if (isCancelled) return;
      setActiveTab('explanation');
      setAutoTimerProgress(10);
      await playAudio(currentLyric.german);

      if (isCancelled) return;
      await new Promise((r) => { stepTimer = setTimeout(r, 600); });
      if (isCancelled) return;

      // Step 2: Professor explains in Moroccan Darija
      setAutoTimerProgress(35);
      await speakProfessorExplanation('explanation');

      if (isCancelled) return;
      await new Promise((r) => { stepTimer = setTimeout(r, 700); });
      if (isCancelled) return;

      // Step 3: Switch to Phonetic tab and explain mouth position
      setActiveTab('phonetic');
      setAutoTimerProgress(65);
      await speakProfessorExplanation('phonetic');

      if (isCancelled) return;
      await new Promise((r) => { stepTimer = setTimeout(r, 700); });
      if (isCancelled) return;

      // Step 4: Switch to Moroccan Trap tab
      setActiveTab('trap');
      setAutoTimerProgress(85);
      await speakProfessorExplanation('trap');

      if (isCancelled) return;
      setAutoTimerProgress(100);
      await new Promise((r) => { stepTimer = setTimeout(r, 1200); });
      if (isCancelled) return;

      // Move to next word or trigger quiz
      if (currentIndex < totalLyrics - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsAutoPilot(false);
        setQuizStep(true);
      }
    };

    runAutoPilotWordSequence();

    return () => {
      isCancelled = true;
      if (stepTimer) clearTimeout(stepTimer);
      geminiAudioTts.stopAudio();
    };
  }, [isAutoPilot, currentIndex, quizStep, currentLyric.german, playAudio, speakProfessorExplanation, totalLyrics]);

  // =========================================================
  // GEMINI AI PROFESSOR INTEGRATION (سول الأستاذ لادا بـ AI)
  // =========================================================
  const handleAskAi = async (overridePrompt?: string) => {
    const questionToAsk = overridePrompt || customQuestion;
    setAiLoading(true);
    setAiResponse(null);
    try {
      const answer = await askAiProfessor(
        currentLyric.german,
        currentLyric.darijaCorrect,
        questionToAsk
      );
      setAiResponse(answer);
    } catch {
      setAiResponse('عفواً، وقع مشكل في الاتصال بالأستاذ لادا. عاود جرب مرة أخرى!');
    } finally {
      setAiLoading(false);
    }
  };

  // Sound chime for quiz
  const playChime = (isCorrect: boolean) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isCorrect) {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
        setTimeout(() => ctx.close().catch(() => {}), 500);
      } else {
        osc.frequency.setValueAtTime(260, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(190, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
        setTimeout(() => ctx.close().catch(() => {}), 500);
      }
    } catch {
      // AudioContext unavailable
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (quizStep || showAiModal) return;
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
  }, [currentIndex, currentLyric, playAudio, quizStep, showAiModal, song.lyrics, totalLyrics]);

  // Quiz Items
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
        background: 'radial-gradient(circle at 50% 10%, #0c1730 0%, #030611 100%)',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        overflow: 'hidden',
        fontFamily: "'Cairo', 'Tajawal', system-ui, -apple-system, sans-serif"
      }}
    >
      {/* ========================================================= */}
      {/* 1. TOP MASTER HEADER DECK                                */}
      {/* ========================================================= */}
      <div
        style={{
          height: '58px',
          padding: '0 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(5, 10, 22, 0.9)',
          backdropFilter: 'blur(20px)',
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
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <ArrowLeft size={14} />
            <span>رجوع</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 900,
                background: 'linear-gradient(90deg, #facc15, #f59e0b)',
                color: '#000000',
                padding: '3px 12px',
                borderRadius: '8px',
                letterSpacing: '0.5px'
              }}
            >
              🎓 الأستاذ لادا • درس الماستر كلاس
            </span>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
              #{song.number} {song.title}
            </span>
          </div>
        </div>

        {/* Center: Auto-Pilot Controller & Word Step Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Master Auto-Pilot Button */}
          <button
            onClick={() => setIsAutoPilot(!isAutoPilot)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: '20px',
              background: isAutoPilot
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'rgba(255, 255, 255, 0.08)',
              border: isAutoPilot ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: isAutoPilot ? '0 0 16px rgba(16, 185, 129, 0.6)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            {isAutoPilot ? <Pause size={14} fill="#ffffff" /> : <Play size={14} fill="#ffffff" />}
            <span>{isAutoPilot ? 'المحاضرة التلقائية شغالّة' : 'شغّل الشرح التلقائي للأستاذ'}</span>
          </button>

          {/* Timeline Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            {song.lyrics.map((_, i) => {
              const isCurrent = i === currentIndex;
              const isVisited = visitedIndices.has(i);
              return (
                <div
                  key={i}
                  onClick={() => {
                    if (quizStep) return;
                    setIsAutoPilot(false);
                    setCurrentIndex(i);
                    playAudio(song.lyrics[i].german);
                  }}
                  title={`كلمة ${i + 1}`}
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
                    transition: 'all 0.2s ease'
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Right: Voice Selector, Ask AI Assistant, Audio Speed & Fullscreen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Gemini Voice Selector Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(0, 240, 255, 0.25)'
            }}
          >
            <Volume2 size={13} color="#00f0ff" />
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value as GeminiVoiceName)}
              title="صوت الأستاذ (Google Gemini Audio)"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#00f0ff',
                fontSize: '11px',
                fontWeight: 900,
                cursor: 'pointer',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            >
              <option value="Puck" style={{ background: '#091024', color: '#fff' }}>Puck (شاب نشيط ⚡)</option>
              <option value="Fenrir" style={{ background: '#091024', color: '#fff' }}>Fenrir (هادئ وواضح 🎯)</option>
              <option value="Aoede" style={{ background: '#091024', color: '#fff' }}>Aoede (أستاذة ودودة 🌸)</option>
              <option value="Charon" style={{ background: '#091024', color: '#fff' }}>Charon (صوت عميق 🎩)</option>
              <option value="Kore" style={{ background: '#091024', color: '#fff' }}>Kore (صوت لطيف 🌟)</option>
            </select>
          </div>

          {/* Ask AI Professor Button (Gemini API) */}
          <button
            onClick={() => {
              setShowAiModal(true);
              handleAskAi();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #a855f7, #6366f1)',
              border: 'none',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(168, 85, 247, 0.4)'
            }}
          >
            <Sparkles size={14} />
            <span>سوّل الأستاذ (AI)</span>
          </button>

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
              cursor: 'pointer'
            }}
          >
            {isSlow ? '🐢 بشوية (0.75x)' : '⚡ عادي (1.0x)'}
          </button>

          <button
            onClick={() => {
              toggleFullscreen();
              setIsFullscreenMode(!isFullscreenMode);
            }}
            title="ملء الشاشة"
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

      {/* Auto-Pilot Linear Progress Bar */}
      {isAutoPilot && (
        <div style={{ height: '3px', width: '100%', background: 'rgba(255,255,255,0.08)' }}>
          <div
            style={{
              height: '100%',
              width: `${autoTimerProgress}%`,
              background: 'linear-gradient(90deg, #10b981, #00f0ff)',
              transition: 'width 0.25s linear'
            }}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MAIN WIDESCREEN 16:9 STUDIO STAGE                      */}
      {/* ========================================================= */}
      {!quizStep ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            padding: '16px 24px',
            gap: '22px',
            overflow: 'hidden'
          }}
        >
          {/* ---------------------------------------------------- */}
          {/* LEFT STAGE: The German Word Acoustic Spotlight (42%) */}
          {/* ---------------------------------------------------- */}
          <div
            style={{
              flex: 42,
              background: 'rgba(11, 18, 36, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(24px)',
              borderRadius: '24px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.7)',
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
                  fontSize: '12px',
                  fontWeight: 900,
                  padding: '4px 14px',
                  borderRadius: '12px',
                  background: guidance.grammarBadge.bg,
                  color: guidance.grammarBadge.color,
                  border: `1px solid ${guidance.grammarBadge.border}`,
                  letterSpacing: '0.3px'
                }}
              >
                {guidance.grammarBadge.label}
              </div>

              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#94a3b8',
                  background: 'rgba(255, 255, 255, 0.06)',
                  padding: '4px 12px',
                  borderRadius: '10px'
                }}
              >
                الكلمة {currentIndex + 1} من {totalLyrics}
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
                  textShadow: `0 0 35px ${guidance.grammarBadge.color}40`,
                  direction: 'ltr'
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
                <span style={{ color: '#00f0ff' }}>🗣️ النطق:</span>
                <strong style={{ letterSpacing: '0.3px', direction: 'ltr' }}>
                  {currentLyric.phoneticGuide}
                </strong>
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
                  const barHeight = isPlayingAudio ? heights[idx % heights.length] : 6;
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
                  title="عاود بشوية (0.75x)"
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

                {/* Big Glowing Audio Button */}
                <button
                  onClick={() => {
                    if (audioTarget === 'word' && isPlayingAudio) {
                      stopAllAudio();
                    } else {
                      playAudio(currentLyric.german);
                    }
                  }}
                  title="استمع للنطق الألماني الحقيقي بـ Gemini"
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: audioTarget === 'word' && isPlayingAudio
                      ? 'linear-gradient(135deg, #00f0ff, #0284c7)'
                      : 'linear-gradient(135deg, #0284c7, #2563eb)',
                    border: 'none',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: audioTarget === 'word' && isPlayingAudio
                      ? '0 0 30px rgba(0, 240, 255, 0.7)'
                      : '0 10px 25px rgba(2, 132, 199, 0.4)',
                    transform: audioTarget === 'word' && isPlayingAudio ? 'scale(1.08)' : 'scale(1)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Volume2 size={28} />
                </button>

                <button
                  onClick={() => playAudio(currentLyric.german, false)}
                  title="عاود بسرعة عادية (1.0x)"
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

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>
                  انقر باش تسمع النطق • أو اضغط <strong>Spacebar</strong> ⌨️
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 900,
                    color: audioTarget === 'word' && isPlayingAudio ? '#00f0ff' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: audioTarget === 'word' && isPlayingAudio ? '#00f0ff' : '#475569',
                      boxShadow: audioTarget === 'word' && isPlayingAudio ? '0 0 6px #00f0ff' : 'none'
                    }}
                  />
                  <span>
                    {isAudioGenerating && audioTarget === 'word'
                      ? '⏳ جاري استحضار نطق Gemini...'
                      : audioTarget === 'word' && isPlayingAudio
                      ? '🟢 استوديو صوت Google Gemini الطبيعي (24kHz)'
                      : 'صوت طبيعي 24kHz Google Gemini'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* RIGHT STAGE: The Master Professor Desk (58%)         */}
          {/* ---------------------------------------------------- */}
          <div
            style={{
              flex: 58,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px'
            }}
          >
            {/* Top Professor Card with Arabic Script Guidance */}
            <div
              style={{
                flex: 1,
                background: 'rgba(11, 18, 36, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(24px)',
                borderRadius: '24px',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.7)',
                overflowY: 'auto',
                direction: 'rtl'
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
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #facc15, #f59e0b)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#000000',
                        boxShadow: '0 0 12px rgba(250, 204, 21, 0.4)'
                      }}
                    >
                      <GraduationCap size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff' }}>
                        الأستاذ لادا (Oustad LADA)
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Speak Professor Explanation Button */}
                    <button
                      onClick={() => {
                        if (audioTarget === 'professor' && isPlayingAudio) {
                          stopAllAudio();
                        } else {
                          speakProfessorExplanation(activeTab);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 14px',
                        borderRadius: '16px',
                        background: audioTarget === 'professor' && isPlayingAudio
                          ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                          : 'linear-gradient(135deg, #facc15, #f59e0b)',
                        border: 'none',
                        color: '#000000',
                        fontSize: '12px',
                        fontWeight: 900,
                        cursor: 'pointer',
                        boxShadow: audioTarget === 'professor' && isPlayingAudio
                          ? '0 0 16px rgba(239, 68, 68, 0.6)'
                          : '0 0 14px rgba(250, 204, 21, 0.4)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Volume2 size={15} />
                      <span>
                        {audioTarget === 'professor' && isPlayingAudio
                          ? '⏹️ وقف الشرح'
                          : isAudioGenerating && audioTarget === 'professor'
                          ? '⏳ الأستاذ كيوجد الصوت...'
                          : '🎙️ تكلّم يا أستاذ (صوت Gemini)'}
                      </span>
                    </button>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        fontWeight: 800,
                        color: isAutoPilot ? '#10b981' : '#38bdf8',
                        background: isAutoPilot
                          ? 'rgba(16, 185, 129, 0.12)'
                          : 'rgba(56, 189, 248, 0.12)',
                        border: isAutoPilot
                          ? '1px solid rgba(16, 185, 129, 0.3)'
                          : '1px solid rgba(56, 189, 248, 0.3)',
                        padding: '5px 12px',
                        borderRadius: '16px'
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: isAutoPilot ? '#10b981' : '#38bdf8',
                          boxShadow: isAutoPilot ? '0 0 6px #10b981' : '0 0 6px #38bdf8'
                        }}
                      />
                      {isAutoPilot ? 'المحاضرة التلقائية شغالة' : 'تصفح يدوي'}
                    </div>
                  </div>
                </div>

                {/* Moroccan Darija Translation Title in Arabic Letters */}
                <div
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '12px 20px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: '#94a3b8',
                        letterSpacing: '0.5px'
                      }}
                    >
                      🇲🇦 المعنى بالدارجة المغربية:
                    </div>
                    <div
                      style={{
                        fontSize: '24px',
                        fontWeight: 900,
                        color: '#facc15',
                        marginTop: '2px'
                      }}
                    >
                      {guidance.explanation.includes('"')
                        ? currentLyric.darijaCorrect
                        : currentLyric.darijaCorrect}
                    </div>
                  </div>
                  <div style={{ fontSize: '24px' }}>✨</div>
                </div>

                {/* Interactive 4-Tab Navigation Selector (بالحروف العربية) */}
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
                    onClick={() => {
                      setIsAutoPilot(false);
                      setActiveTab('explanation');
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      borderRadius: '10px',
                      border: 'none',
                      background: activeTab === 'explanation' ? '#00f0ff' : 'transparent',
                      color: activeTab === 'explanation' ? '#000000' : '#cbd5e1',
                      fontSize: '12px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Sparkles size={13} />
                    <span>شرح الأستاذ</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsAutoPilot(false);
                      setActiveTab('phonetic');
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      borderRadius: '10px',
                      border: 'none',
                      background: activeTab === 'phonetic' ? '#38bdf8' : 'transparent',
                      color: activeTab === 'phonetic' ? '#000000' : '#cbd5e1',
                      fontSize: '12px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Volume2 size={13} />
                    <span>سر النطق</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsAutoPilot(false);
                      setActiveTab('trap');
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      borderRadius: '10px',
                      border: 'none',
                      background: activeTab === 'trap' ? '#f59e0b' : 'transparent',
                      color: activeTab === 'trap' ? '#000000' : '#cbd5e1',
                      fontSize: '12px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <AlertTriangle size={13} />
                    <span>فخ المغاربة</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsAutoPilot(false);
                      setActiveTab('dialogue');
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      borderRadius: '10px',
                      border: 'none',
                      background: activeTab === 'dialogue' ? '#a78bfa' : 'transparent',
                      color: activeTab === 'dialogue' ? '#000000' : '#cbd5e1',
                      fontSize: '12px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <MessageSquare size={13} />
                    <span>في الواقع</span>
                  </button>
                </div>

                {/* Professor Speaking Status Banner */}
                {audioTarget === 'professor' && isPlayingAudio && (
                  <div
                    style={{
                      marginBottom: '10px',
                      padding: '8px 14px',
                      borderRadius: '12px',
                      background: 'rgba(250, 204, 21, 0.12)',
                      border: '1px solid rgba(250, 204, 21, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#facc15', fontWeight: 800 }}>
                      <Volume2 size={16} />
                      <span>🎙️ الأستاذ لادا كيشرح ليك دابا بالصوت الحقيقي ديال Gemini API...</span>
                    </div>
                    <button
                      onClick={stopAllAudio}
                      style={{
                        padding: '3px 10px',
                        borderRadius: '8px',
                        background: '#ef4444',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 900,
                        cursor: 'pointer'
                      }}
                    >
                      توقيف ⏹️
                    </button>
                  </div>
                )}

                {/* Tab Content Box in Arabic Script */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    minHeight: '120px'
                  }}
                >
                  {/* Tab 1: شرح الأستاذ */}
                  {activeTab === 'explanation' && (
                    <div>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 900,
                          color: '#00f0ff',
                          marginBottom: '8px'
                        }}
                      >
                        🧠 كيفاش تفهمها وتخدمها بلا ما تفكر:
                      </div>
                      <div
                        style={{
                          fontSize: '14px',
                          lineHeight: '1.8',
                          color: '#f1f5f9',
                          fontWeight: 500
                        }}
                      >
                        {guidance.explanation}
                      </div>
                      <div style={{ marginTop: '12px' }}>
                        <button
                          onClick={() => {
                            if (audioTarget === 'professor' && isPlayingAudio && activeTab === 'explanation') {
                              stopAllAudio();
                            } else {
                              speakProfessorExplanation('explanation');
                            }
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: audioTarget === 'professor' && isPlayingAudio && activeTab === 'explanation'
                              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                              : 'rgba(0, 240, 255, 0.15)',
                            border: '1px solid rgba(0, 240, 255, 0.35)',
                            color: '#ffffff',
                            padding: '6px 14px',
                            borderRadius: '14px',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          <Volume2 size={13} />
                          <span>
                            {audioTarget === 'professor' && isPlayingAudio && activeTab === 'explanation'
                              ? '⏹️ وقف صوت الأستاذ'
                              : '🎙️ استمع للشرح بصوت الأستاذ (Gemini)'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: سر النطق */}
                  {activeTab === 'phonetic' && (
                    <div>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 900,
                          color: '#38bdf8',
                          marginBottom: '8px'
                        }}
                      >
                        🗣️ سر النطق: فين تحط لسانك وشنايفك:
                      </div>
                      <div
                        style={{
                          fontSize: '14px',
                          lineHeight: '1.8',
                          color: '#f1f5f9',
                          fontWeight: 500
                        }}
                      >
                        {guidance.phoneticSecret}
                      </div>
                      <div style={{ marginTop: '12px' }}>
                        <button
                          onClick={() => {
                            if (audioTarget === 'professor' && isPlayingAudio && activeTab === 'phonetic') {
                              stopAllAudio();
                            } else {
                              speakProfessorExplanation('phonetic');
                            }
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: audioTarget === 'professor' && isPlayingAudio && activeTab === 'phonetic'
                              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                              : 'rgba(56, 189, 248, 0.15)',
                            border: '1px solid rgba(56, 189, 248, 0.35)',
                            color: '#ffffff',
                            padding: '6px 14px',
                            borderRadius: '14px',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          <Volume2 size={13} />
                          <span>
                            {audioTarget === 'professor' && isPlayingAudio && activeTab === 'phonetic'
                              ? '⏹️ وقف صوت الأستاذ'
                              : '🗣️ استمع لموضع اللسان والشفتين بصوت الأستاذ'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: فخ المغاربة */}
                  {activeTab === 'trap' && (
                    <div
                      style={{
                        background: 'rgba(245, 158, 11, 0.08)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        borderRadius: '12px',
                        padding: '14px'
                      }}
                    >
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 900,
                          color: '#f59e0b',
                          marginBottom: '6px'
                        }}
                      >
                        ⚠️ رد البال من هاد الغلط اللي كيطيحو فيه المغاربة:
                      </div>
                      <div
                        style={{
                          fontSize: '14px',
                          lineHeight: '1.7',
                          color: '#fef3c7',
                          fontWeight: 600
                        }}
                      >
                        {guidance.moroccanTrap}
                      </div>
                      <div style={{ marginTop: '12px' }}>
                        <button
                          onClick={() => {
                            if (audioTarget === 'professor' && isPlayingAudio && activeTab === 'trap') {
                              stopAllAudio();
                            } else {
                              speakProfessorExplanation('trap');
                            }
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: audioTarget === 'professor' && isPlayingAudio && activeTab === 'trap'
                              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                              : 'rgba(245, 158, 11, 0.2)',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            color: '#ffffff',
                            padding: '6px 14px',
                            borderRadius: '14px',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          <Volume2 size={13} />
                          <span>
                            {audioTarget === 'professor' && isPlayingAudio && activeTab === 'trap'
                              ? '⏹️ وقف صوت الأستاذ'
                              : '⚠️ استمع لشرح الفخ باش ما تطيحش فيه'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tab 4: في الواقع (Street Dialogue) */}
                  {activeTab === 'dialogue' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 900,
                          color: '#a78bfa',
                          marginBottom: '4px'
                        }}
                      >
                        🎬 حوار في الواقع (كيفاش كيهضرو الألمان في الشارع):
                      </div>

                      <div
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          fontSize: '13px'
                        }}
                      >
                        <span style={{ color: '#38bdf8', fontWeight: 800 }}>
                          {guidance.realDialogue.speakerA}{' '}
                        </span>
                        <span style={{ color: '#ffffff', direction: 'ltr', display: 'inline-block' }}>
                          {guidance.realDialogue.germanA}
                        </span>
                      </div>

                      <div
                        style={{
                          background: 'rgba(0, 240, 255, 0.08)',
                          border: '1px solid rgba(0, 240, 255, 0.25)',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          fontSize: '13px'
                        }}
                      >
                        <span style={{ color: '#00f0ff', fontWeight: 800 }}>
                          {guidance.realDialogue.speakerB}{' '}
                        </span>
                        <span
                          style={{
                            color: '#ffffff',
                            fontWeight: 800,
                            direction: 'ltr',
                            display: 'inline-block'
                          }}
                        >
                          {guidance.realDialogue.germanB}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: '12px',
                          color: '#94a3b8',
                          fontStyle: 'italic',
                          marginTop: '2px'
                        }}
                      >
                        📌 السياق: {guidance.realDialogue.darijaContext}
                      </div>

                      <div style={{ marginTop: '8px' }}>
                        <button
                          onClick={() => {
                            if (audioTarget === 'professor' && isPlayingAudio && activeTab === 'dialogue') {
                              stopAllAudio();
                            } else {
                              speakProfessorExplanation('dialogue');
                            }
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: audioTarget === 'professor' && isPlayingAudio && activeTab === 'dialogue'
                              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                              : 'rgba(167, 139, 250, 0.2)',
                            border: '1px solid rgba(167, 139, 250, 0.4)',
                            color: '#ffffff',
                            padding: '6px 14px',
                            borderRadius: '14px',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          <Volume2 size={13} />
                          <span>
                            {audioTarget === 'professor' && isPlayingAudio && activeTab === 'dialogue'
                              ? '⏹️ وقف الحوار'
                              : '🎬 استمع للحوار الواقعي كيفاش كيهضرو'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Memory Hook Banner */}
              <div
                style={{
                  marginTop: '12px',
                  background: 'rgba(250, 204, 21, 0.08)',
                  border: '1px solid rgba(250, 204, 21, 0.25)',
                  borderRadius: '12px',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  color: '#fde047'
                }}
              >
                <span>💡</span>
                <span>
                  <strong>سر الحفظ السريع:</strong> {guidance.memoryHook}
                </span>
              </div>
            </div>

            {/* Bottom Widescreen Deck Navigation */}
            <div style={{ display: 'flex', gap: '12px', height: '52px' }}>
              <button
                onClick={() => {
                  if (currentIndex > 0) {
                    setIsAutoPilot(false);
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
                <span>السابق</span>
              </button>

              {currentIndex < totalLyrics - 1 ? (
                <button
                  onClick={() => {
                    setIsAutoPilot(false);
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
                  <span>الكلمة التالية</span>
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsAutoPilot(false);
                    setQuizStep(true);
                  }}
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
                  <span>كملت الدرس! دوز لامتحان الفهم 🎯</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================= */
        /* 3. ACTIVE RECALL CHECKPOINT (امتحان الفهم)                */
        /* ========================================================= */
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            direction: 'rtl'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '680px',
              background: 'rgba(11, 18, 36, 0.92)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(28px)',
              borderRadius: '28px',
              padding: '32px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75)',
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
                    <span>امتحان الفهم السريع (Active Recall)</span>
                  </div>
                  <h2 style={{ fontSize: '22px', fontWeight: 900, margin: '4px 0', color: '#ffffff' }}>
                    واش ضبطتي هاد الكلمات مع الأستاذ لادا؟
                  </h2>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                    جاوب على هاد 3 د الأسئلة باش يتأكد الأستاذ بلي فهمتي ويتفتح ليك Niveau 2 د الـ Highway!
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
                          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>
                            السؤال {qIdx + 1}: شنو كتعني بالدارجة:
                          </div>
                          <div
                            style={{
                              fontSize: '20px',
                              fontWeight: 900,
                              color: '#00f0ff',
                              direction: 'ltr',
                              textAlign: 'right'
                            }}
                          >
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
                                    padding: '8px 18px',
                                    borderRadius: '12px',
                                    background: isThisChosen
                                      ? choice === item.darijaCorrect
                                        ? '#10b981'
                                        : '#ef4444'
                                      : 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    color: '#ffffff',
                                    fontSize: '13px',
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
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ← رجوع لمراجعة الدرس
                  </button>

                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    اختر الجواب الصحيح لكل كلمة
                  </div>
                </div>
              </>
            ) : (
              /* Quiz Passed Celebration */
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
                    letterSpacing: '1px',
                    marginBottom: '4px'
                  }}
                >
                  تبارك الله عليك! ضبطتي الدرس 100%!
                </div>

                <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#ffffff', marginBottom: '8px' }}>
                  نجحتي في امتحان الأستاذ لادا!
                </h2>

                <p
                  style={{
                    fontSize: '14px',
                    color: '#cbd5e1',
                    maxWidth: '440px',
                    margin: '0 auto 24px',
                    lineHeight: '1.7'
                  }}
                >
                  فهمتي أسرار النطق وفخاخ المغاربة ديال هاد الدرس. دابا تفتح ليك{' '}
                  <strong style={{ color: '#00f0ff' }}>Niveau 2: 3D Highway Runner</strong> باش
                  تختبر سرعتك في الموسيقى!
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
                    الرجوع للقائمة
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
                    <span>بدا المستوى 2: 3D Highway</span>
                    <Play size={16} fill="#000000" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. ASK AI PROFESSOR MODAL (Gemini API Integration)        */}
      {/* ========================================================= */}
      {showAiModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(12px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            direction: 'rtl'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '640px',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Bot size={18} color="#ffffff" />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff' }}>
                    سوّل الأستاذ لادا (ذكاء اصطناعي مباشر)
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    شرح مخصص ومباشر بالدارجة المغربية لكلمة: <strong>{currentLyric.german}</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowAiModal(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Prompt Chips */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                'كيفاش نستعملها في الخدمة؟',
                'عطيني مثال حي في كافي في برلين',
                'علاش تصرفت بهاد الطريقة؟',
                'كيفاش نتفادى نغلط في نطقها؟'
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCustomQuestion(chip);
                    handleAskAi(chip);
                  }}
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '5px 12px',
                    borderRadius: '14px',
                    background: 'rgba(168, 85, 247, 0.12)',
                    border: '1px solid rgba(168, 85, 247, 0.25)',
                    color: '#c084fc',
                    cursor: 'pointer'
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* AI Response Box */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '16px',
                minHeight: '120px',
                fontSize: '14px',
                lineHeight: '1.8',
                color: '#e2e8f0'
              }}
            >
              {aiLoading ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100px',
                    gap: '10px',
                    color: '#c084fc'
                  }}
                >
                  <Sparkles size={20} className="animate-spin" />
                  <span>الأستاذ لادا كيفكر في الشرح بالدارجة...</span>
                </div>
              ) : (
                aiResponse ||
                'سوّل الأستاذ لادا أي سؤال على هاد الكلمة بالدارجة، وغادي يجاوبك فوراً بالذكاء الاصطناعي!'
              )}
            </div>

            {/* Custom Question Input */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAskAi();
                }}
                placeholder="كتب سؤالك للأستاذ لادا هنا..."
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '14px',
                  padding: '10px 16px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <button
                onClick={() => handleAskAi()}
                disabled={aiLoading}
                style={{
                  padding: '10px 20px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Send size={14} />
                <span>إرسال</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
