import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  MessageSquare,
  Sliders,
  RefreshCw,
  BookOpen,
  MessageCircle,
  Music
} from 'lucide-react';
import type { LearnerProfile, KeyStatus, VoiceName, StageEvent, BridgeLanguageMode, TimelineChapter, SessionTurn } from '../types';
import { AudioPipeline } from '../services/audioPipeline';
import { GeminiLiveClient } from '../services/geminiLiveClient';
import { KeyManager } from '../services/keyManager';
import { buildLadaSystemPrompt } from '../services/companionPrompt';
import { getDueSrsItems } from '../services/srsEngine';
import { inspectTextForStageEvents } from '../services/cognitiveCoPilot';
import { getActiveChapter, setChapterActive } from '../services/timelineEngine';
import { addCallRecord } from '../services/historyStorage';
import { highlightGermanSyntax } from '../services/syntaxHighlighter';
import { analyzeSessionWithNeuralScribe } from '../services/neuralScribe';
import { GenerativeStage } from './GenerativeStage';
import { SettingsDrawer } from './SettingsDrawer';
import { TextChatStudio } from './TextChatStudio';
import { HistoryHub } from './HistoryHub';
import { SongSelectHub } from './SongSelectHub';

interface LiveCompanionProps {
  apiKeys: string[];
  profile: LearnerProfile;
  onProfileUpdate: (updated: LearnerProfile) => void;
  onLockVault: () => void;
}

export const LiveCompanion: React.FC<LiveCompanionProps> = ({
  apiKeys,
  profile,
  onProfileUpdate,
  onLockVault
}) => {
  // Navigation View (Native Bottom Tab Bar)
  const [activeTab, setActiveTab] = useState<'call' | 'beat3d' | 'chat' | 'history'>('call');

  // Call & Device State
  const [isLive, setIsLive] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Ready to connect');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showCaptions, setShowCaptions] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeVoice, setActiveVoice] = useState<VoiceName>('Kore');

  // Bridge Language Mode
  const [bridgeMode, setBridgeMode] = useState<BridgeLanguageMode>(profile.bridgeMode || 'german_darija');

  // Active Narrative Timeline Chapter (Runs organically in prompt, not as an ugly card!)
  const [activeChapter, setActiveChapter] = useState<TimelineChapter>(getActiveChapter());

  // Captions & Stage
  const [currentCaption, setCurrentCaption] = useState('');
  const [stageEvent, setStageEvent] = useState<StageEvent | null>(null);

  // Key Manager
  const keyManagerRef = useRef<KeyManager>(new KeyManager(apiKeys));
  const [keyStatuses, setKeyStatuses] = useState<KeyStatus[]>([]);

  // Services
  const audioPipelineRef = useRef<AudioPipeline | null>(null);
  const geminiClientRef = useRef<GeminiLiveClient | null>(null);

  // Camera Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameIntervalRef = useRef<number | null>(null);

  // Session Tracking
  const sessionTurnsCountRef = useRef<number>(0);
  const currentSessionTurnsRef = useRef<SessionTurn[]>([]);
  const callStartTimeRef = useRef<number>(0);

  const updateKeyStatuses = useCallback(() => {
    setKeyStatuses(keyManagerRef.current.getKeyStatuses());
  }, []);

  useEffect(() => {
    keyManagerRef.current.updateKeys(apiKeys);
    updateKeyStatuses();
  }, [apiKeys, updateKeyStatuses]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCall();
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
      if (audioPipelineRef.current) audioPipelineRef.current.destroy();
      if (geminiClientRef.current) geminiClientRef.current.disconnect();
    };
  }, []);

  // Frame streaming at 1 fps
  const startCameraStreaming = useCallback(() => {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);

    frameIntervalRef.current = window.setInterval(() => {
      if (!isCameraOn || !videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      canvas.width = 480;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Jpeg = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];

      if (geminiClientRef.current && isLive) {
        geminiClientRef.current.sendRealtimeImage(base64Jpeg);
      }
    }, 1000);
  }, [isCameraOn, isLive]);

  const stopCameraStreaming = () => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
  };

  const toggleMic = () => {
    const next = !isMicOn;
    setIsMicOn(next);
    audioPipelineRef.current?.setMicMuted(!next);
  };

  const toggleSpeaker = () => {
    const next = !isSpeakerOn;
    setIsSpeakerOn(next);
    audioPipelineRef.current?.setSpeakerMuted(!next);
  };

  const toggleCamera = async () => {
    const next = !isCameraOn;
    setIsCameraOn(next);

    if (next) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        startCameraStreaming();
      } catch (err) {
        console.warn('Camera access denied:', err);
        setIsCameraOn(false);
      }
    } else {
      stopCameraStreaming();
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
    }
  };

  const flipCamera = async () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    if (isCameraOn) {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: nextFacing,
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('Flip error:', err);
      }
    }
  };

  // Start Call
  const startCall = async (isContinuation = false) => {
    const activeKey = keyManagerRef.current.getActiveKey();
    const activeIdx = keyManagerRef.current.getActiveKeyIndex();
    const totalKeys = keyManagerRef.current.getTotalKeys();

    if (!activeKey) {
      setStatusMessage('No valid API keys found in vault');
      return;
    }

    try {
      setStatusMessage(`Connecting with Key #${activeIdx}/${totalKeys}...`);
      callStartTimeRef.current = Date.now();

      // 1. Audio Pipeline Setup
      if (!audioPipelineRef.current) {
        audioPipelineRef.current = new AudioPipeline((base64Pcm16) => {
          if (geminiClientRef.current) {
            geminiClientRef.current.sendRealtimeAudio(base64Pcm16);
          }
        });
      }

      await audioPipelineRef.current.startMicrophone();
      audioPipelineRef.current.setMicMuted(!isMicOn);
      audioPipelineRef.current.setSpeakerMuted(!isSpeakerOn);

      // 2. Gemini Live Client Setup
      const dueItems = getDueSrsItems(profile);
      const systemPrompt = buildLadaSystemPrompt(profile, dueItems, bridgeMode, activeChapter);

      let currentTurnText = '';

      geminiClientRef.current = new GeminiLiveClient({
        onAudioPcm: (base64Pcm24) => {
          audioPipelineRef.current?.playPcm24kChunk(base64Pcm24);
        },
        onCaptionChunk: (text) => {
          currentTurnText += text;
          setCurrentCaption(prev => prev + text);

          // Dynamic voice command listener
          const lower = text.toLowerCase();
          if (lower.includes('speak english') || lower.includes('in english')) {
            handleChangeBridgeMode('german_english');
          } else if (lower.includes('dwi b darija') || lower.includes('b darija') || lower.includes('darija')) {
            handleChangeBridgeMode('german_darija');
          } else if (lower.includes('nur deutsch') || lower.includes('deutsch pur') || lower.includes('only german')) {
            handleChangeBridgeMode('german_only');
          }

          // Cognitive co-pilot inspection on caption chunks
          const events = inspectTextForStageEvents(currentTurnText);
          if (events.length > 0) {
            setStageEvent(events[0]);
          }
        },
        onTurnComplete: () => {
          if (currentTurnText) {
            const newTurn: SessionTurn = {
              role: 'model',
              text: currentTurnText,
              timestamp: new Date().toISOString()
            };
            currentSessionTurnsRef.current.push(newTurn);
            sessionTurnsCountRef.current += 1;
            currentTurnText = '';
          }
        },
        onInterrupted: () => {
          audioPipelineRef.current?.stopAllPlayback();
        },
        onStatusChange: (status, msg) => {
          setStatusMessage(msg);
          if (status === 'connected') {
            setIsLive(true);
            if (isCameraOn) startCameraStreaming();
          }
        },
        onError: (err) => {
          console.error('Session error:', err);
        },
        onClose: (code) => {
          if (isLive && (code === 1008 || code === 1011 || code === 429)) {
            keyManagerRef.current.markKeyExhausted(activeIdx - 1);
            const next = keyManagerRef.current.rotateToNextKey();
            updateKeyStatuses();
            setStatusMessage(`Auto-switching to Key #${next.index}...`);
            startCall(true);
          } else {
            setIsLive(false);
          }
        }
      });

      await geminiClientRef.current.connect(activeKey, activeVoice, systemPrompt, isContinuation);
    } catch (err) {
      console.error('Call failed to start:', err);
      const next = keyManagerRef.current.rotateToNextKey();
      updateKeyStatuses();
      setStatusMessage(`Trying next Key #${next.index}...`);
      startCall(true);
    }
  };

  const stopCall = () => {
    setIsLive(false);
    setStatusMessage('Call Ended');
    stopCameraStreaming();

    if (audioPipelineRef.current) {
      audioPipelineRef.current.stopMicrophone();
      audioPipelineRef.current.stopAllPlayback();
    }
    if (geminiClientRef.current) {
      geminiClientRef.current.disconnect();
    }

    // Save session record with Key #6 Neural Scribe
    if (sessionTurnsCountRef.current > 0) {
      const duration = Math.max(15, Math.round((Date.now() - callStartTimeRef.current) / 1000));
      const turnsToAnalyze = [...currentSessionTurnsRef.current];
      const scribeKey = apiKeys[5] || apiKeys[0]; // Dedicated Key #6

      analyzeSessionWithNeuralScribe(scribeKey, turnsToAnalyze, activeChapter, profile.a1ProgressPercent || 14)
        .then((analysis) => {
          addCallRecord({
            id: `call_${Date.now()}`,
            date: new Date().toISOString(),
            durationSeconds: duration,
            chapterTitle: activeChapter.title,
            turnsCount: sessionTurnsCountRef.current,
            turns: turnsToAnalyze,
            wordsAcquired: analysis.wordsAcquired,
            summary: analysis.cleanSummary,
            analysis
          });

          // Update learner profile with updated CEFR A1 progression
          const updatedProfile: LearnerProfile = {
            ...profile,
            totalSessions: profile.totalSessions + 1,
            a1ProgressPercent: analysis.a1ProgressPercent
          };
          onProfileUpdate(updatedProfile);
        })
        .catch((err) => {
          console.warn('Neural Scribe error:', err);
        });

      sessionTurnsCountRef.current = 0;
      currentSessionTurnsRef.current = [];
    }
  };

  const handleChangeBridgeMode = (newMode: BridgeLanguageMode) => {
    setBridgeMode(newMode);
    const updated = { ...profile, bridgeMode: newMode };
    onProfileUpdate(updated);

    if (isLive) {
      setStatusMessage(`Switching to ${newMode}...`);
      startCall(true);
    }
  };

  const handleResumeChapter = (chapter: TimelineChapter) => {
    setActiveChapter(chapter);
    setChapterActive(chapter.id);
    setActiveTab('call');
  };

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100dvh',
      background: '#040711',
      overflow: 'hidden',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Main Content Area (Full screen minus bottom nav) */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* VIEW 1: LIVE VOICE CALL */}
        {activeTab === 'call' && (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* 1. Camera Feed / Visual Canvas */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: isCameraOn ? 1 : 0,
                transition: 'opacity 0.3s ease',
                zIndex: 1
              }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* 2. Sleek Minimalist Top Header */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 30,
              background: 'linear-gradient(to bottom, rgba(4, 7, 17, 0.85), transparent)'
            }}>
              {/* LADA Identity & Live Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: isLive ? '#34d399' : '#38bdf8',
                  boxShadow: isLive ? '0 0 10px #34d399' : '0 0 8px #38bdf8'
                }} />
                <span style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '0.6px' }}>LADA</span>
              </div>

              {/* Refined Center Language Selector */}
              <div style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(16px)',
                borderRadius: '16px',
                padding: '2px',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}>
                <button
                  onClick={() => handleChangeBridgeMode('german_only')}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '14px',
                    background: bridgeMode === 'german_only' ? '#0ea5e9' : 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  DE
                </button>
                <button
                  onClick={() => handleChangeBridgeMode('german_darija')}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '14px',
                    background: bridgeMode === 'german_darija' ? '#0ea5e9' : 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  🇲🇦 Darija
                </button>
                <button
                  onClick={() => handleChangeBridgeMode('german_english')}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '14px',
                    background: bridgeMode === 'german_english' ? '#0ea5e9' : 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  EN
                </button>
              </div>

              {/* Right Settings Gear */}
              <button
                onClick={() => setIsDrawerOpen(true)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Sliders size={16} />
              </button>
            </div>

            {/* 3. Central Glowing Pulsing Audio Orb */}
            {!isCameraOn && (
              <div style={{
                position: 'absolute',
                top: '46%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                pointerEvents: 'none'
              }}>
                <div style={{
                  position: 'relative',
                  width: '170px',
                  height: '170px',
                  borderRadius: '50%',
                  background: isLive
                    ? 'radial-gradient(circle, #38bdf8 0%, #0ea5e9 45%, rgba(14, 165, 233, 0) 75%)'
                    : 'radial-gradient(circle, #475569 0%, #1e293b 50%, rgba(30, 41, 59, 0) 75%)',
                  boxShadow: isLive ? '0 0 50px rgba(56, 189, 248, 0.4)' : 'none',
                  filter: 'blur(10px)',
                  transition: 'all 0.5s ease'
                }} />

                <div style={{
                  marginTop: '24px',
                  fontSize: '13px',
                  color: isLive ? '#38bdf8' : '#94a3b8',
                  fontWeight: 700,
                  textAlign: 'center',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)'
                }}>
                  {statusMessage}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#64748b',
                  fontWeight: 600,
                  marginTop: '4px'
                }}>
                  {activeChapter.title}
                </div>
              </div>
            )}

            {/* 4. Live Generative Stage HUD (Compound words / phonetics only) */}
            <GenerativeStage
              currentEvent={stageEvent}
              onDismiss={() => setStageEvent(null)}
              onSelectChoice={(choice) => {
                if (geminiClientRef.current) {
                  geminiClientRef.current.sendChoiceSelected(choice);
                }
                setStageEvent(null);
              }}
            />

            {/* 5. Floating Cinema Subtitles */}
            {showCaptions && currentCaption && (
              <div style={{
                position: 'absolute',
                bottom: '100px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'calc(100% - 36px)',
                maxWidth: '480px',
                background: 'rgba(10, 15, 30, 0.88)',
                backdropFilter: 'blur(24px)',
                borderRadius: '18px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '12px 16px',
                zIndex: 20,
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)'
              }}>
                <div style={{
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: '#f8fafc',
                  maxHeight: '80px',
                  overflowY: 'auto'
                }}>
                  {highlightGermanSyntax(currentCaption)}
                </div>
              </div>
            )}

            {/* 6. Bottom Floating Cockpit Controls */}
            <div style={{
              position: 'absolute',
              bottom: '22px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              zIndex: 25,
              background: 'rgba(10, 15, 30, 0.85)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '36px',
              padding: '8px 16px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)'
            }}>
              {/* Mic Button */}
              <button
                onClick={toggleMic}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: isMicOn ? 'rgba(255, 255, 255, 0.1)' : '#ef4444',
                  border: 'none',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
              </button>

              {/* Video Button */}
              <button
                onClick={toggleCamera}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: isCameraOn ? '#0ea5e9' : 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
              </button>

              {/* Flip Camera (if video active) */}
              {isCameraOn && (
                <button
                  onClick={flipCamera}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={17} />
                </button>
              )}

              {/* Main Green / Red Phone Button */}
              <button
                onClick={isLive ? stopCall : () => startCall(false)}
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: isLive
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : 'linear-gradient(135deg, #22c55e, #16a34a)',
                  border: 'none',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: isLive ? '0 0 20px rgba(239, 68, 68, 0.6)' : '0 0 20px rgba(34, 197, 94, 0.6)'
                }}
              >
                {isLive ? <PhoneOff size={24} /> : <Phone size={24} />}
              </button>

              {/* Speaker Button */}
              <button
                onClick={toggleSpeaker}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: isSpeakerOn ? 'rgba(255, 255, 255, 0.1)' : '#ef4444',
                  border: 'none',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                {isSpeakerOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>

              {/* Subtitles Button */}
              <button
                onClick={() => setShowCaptions(!showCaptions)}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: showCaptions ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                  border: showCaptions ? '1px solid #38bdf8' : 'none',
                  color: showCaptions ? '#38bdf8' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <MessageSquare size={18} />
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: 3D BEAT DEUTSCH GAME */}
        {activeTab === 'beat3d' && (
          <div style={{ width: '100%', height: '100%', overflowY: 'auto' }}>
            <SongSelectHub />
          </div>
        )}

        {/* VIEW 3: TEXT CHAT STUDIO */}
        {activeTab === 'chat' && (
          <div style={{ width: '100%', height: '100%' }}>
            <TextChatStudio
              apiKey={keyManagerRef.current.getActiveKey() || apiKeys[0]}
              bridgeMode={bridgeMode}
              onChangeBridgeMode={handleChangeBridgeMode}
            />
          </div>
        )}

        {/* VIEW 4: STORY & LOGS HUB */}
        {activeTab === 'history' && (
          <div style={{ width: '100%', height: '100%' }}>
            <HistoryHub
              profile={profile}
              onResumeChapter={handleResumeChapter}
            />
          </div>
        )}
      </div>

      {/* Native Mobile Bottom Navigation Bar */}
      <div style={{
        height: '60px',
        background: 'rgba(8, 12, 24, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 40
      }}>
        {/* Tab 1: Call */}
        <button
          onClick={() => setActiveTab('call')}
          style={{
            flex: 1,
            height: '100%',
            background: 'transparent',
            border: 'none',
            color: activeTab === 'call' ? '#38bdf8' : '#64748b',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            cursor: 'pointer'
          }}
        >
          <Phone size={18} />
          <span style={{ fontSize: '11px', fontWeight: activeTab === 'call' ? 800 : 600 }}>Call</span>
        </button>

        {/* Tab 2: 3D Beat */}
        <button
          onClick={() => setActiveTab('beat3d')}
          style={{
            flex: 1,
            height: '100%',
            background: 'transparent',
            border: 'none',
            color: activeTab === 'beat3d' ? '#facc15' : '#64748b',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            cursor: 'pointer'
          }}
        >
          <Music size={18} />
          <span style={{ fontSize: '11px', fontWeight: activeTab === 'beat3d' ? 800 : 600 }}>3D Beat</span>
        </button>

        {/* Tab 3: Chat */}
        <button
          onClick={() => setActiveTab('chat')}
          style={{
            flex: 1,
            height: '100%',
            background: 'transparent',
            border: 'none',
            color: activeTab === 'chat' ? '#38bdf8' : '#64748b',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            cursor: 'pointer'
          }}
        >
          <MessageCircle size={18} />
          <span style={{ fontSize: '11px', fontWeight: activeTab === 'chat' ? 800 : 600 }}>Chat</span>
        </button>

        {/* Tab 4: Story & History */}
        <button
          onClick={() => setActiveTab('history')}
          style={{
            flex: 1,
            height: '100%',
            background: 'transparent',
            border: 'none',
            color: activeTab === 'history' ? '#38bdf8' : '#64748b',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            cursor: 'pointer'
          }}
        >
          <BookOpen size={18} />
          <span style={{ fontSize: '11px', fontWeight: activeTab === 'history' ? 800 : 600 }}>Story & Logs</span>
        </button>
      </div>

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        profile={profile}
        keyStatuses={keyStatuses}
        activeVoice={activeVoice}
        onSelectVoice={setActiveVoice}
        onLockVault={onLockVault}
      />
    </div>
  );
};
