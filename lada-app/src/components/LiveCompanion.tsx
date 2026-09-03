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
  Clock,
  Compass,
  MessageCircle
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
import { GenerativeStage } from './GenerativeStage';
import { SettingsDrawer } from './SettingsDrawer';
import { TextChatStudio } from './TextChatStudio';
import { HistoryHub } from './HistoryHub';

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
  // Navigation View
  const [activeTab, setActiveTab] = useState<'call' | 'chat' | 'history'>('call');

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

  // Narrative Timeline Chapter
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

          // Dynamic voice command detection from user transcripts if model repeats
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

    // Save session record into history hub
    if (sessionTurnsCountRef.current > 0) {
      const duration = Math.max(15, Math.round((Date.now() - callStartTimeRef.current) / 1000));
      const acquired = activeChapter.verbs.slice(0, 3).map(v => v.german);

      addCallRecord({
        id: `call_${Date.now()}`,
        date: new Date().toISOString(),
        durationSeconds: duration,
        chapterTitle: activeChapter.title,
        turnsCount: sessionTurnsCountRef.current,
        turns: [...currentSessionTurnsRef.current],
        wordsAcquired: acquired,
        summary: `Story practice in ${activeChapter.title} (${activeChapter.subtitle}). Focus on verbs: ${acquired.join(', ')}.`
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
      height: '100vh',
      background: '#040711',
      overflow: 'hidden',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Top Main Navigation Bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(4, 7, 17, 0.75)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* LADA Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: isLive ? '#34d399' : '#38bdf8',
            boxShadow: isLive ? '0 0 10px #34d399' : 'none'
          }} />
          <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.5px' }}>LADA</span>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>v3.0</span>
        </div>

        {/* View Switcher Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.06)',
          borderRadius: '24px',
          padding: '3px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            onClick={() => setActiveTab('call')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              background: activeTab === 'call' ? 'linear-gradient(135deg, #0ea5e9, #2563eb)' : 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Phone size={13} />
            <span>Live Call</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              background: activeTab === 'chat' ? 'linear-gradient(135deg, #0ea5e9, #2563eb)' : 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <MessageCircle size={13} />
            <span>Chat Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              background: activeTab === 'history' ? 'linear-gradient(135deg, #0ea5e9, #2563eb)' : 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Clock size={13} />
            <span>History</span>
          </button>
        </div>

        {/* Settings Button */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
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

      {/* VIEW 1: LIVE VOICE CALL */}
      {activeTab === 'call' && (
        <div style={{ position: 'relative', width: '100%', height: '100%', paddingTop: '60px' }}>
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

          {/* 2. Floating Timeline Mission Card */}
          <div style={{
            position: 'absolute',
            top: '74px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 32px)',
            maxWidth: '520px',
            zIndex: 10,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '16px',
            padding: '10px 14px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Compass size={14} color="#38bdf8" />
                <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  {activeChapter.title}
                </span>
              </div>

              {/* Strict Language Pill Switcher */}
              <div style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '2px'
              }}>
                <button
                  onClick={() => handleChangeBridgeMode('german_only')}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: bridgeMode === 'german_only' ? '#0ea5e9' : 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🇩🇪 Pur
                </button>
                <button
                  onClick={() => handleChangeBridgeMode('german_darija')}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: bridgeMode === 'german_darija' ? '#0ea5e9' : 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🇲🇦 Darija
                </button>
                <button
                  onClick={() => handleChangeBridgeMode('german_english')}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: bridgeMode === 'german_english' ? '#0ea5e9' : 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🇬🇧 English
                </button>
              </div>
            </div>

            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
              {activeChapter.subtitle}
            </div>

            {/* Target Verbs Chips */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
              {activeChapter.verbs.map((v, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(250, 204, 21, 0.12)',
                    border: '1px solid rgba(250, 204, 21, 0.3)',
                    borderRadius: '8px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    whiteSpace: 'nowrap',
                    color: '#fef08a'
                  }}
                >
                  <span style={{ fontWeight: 800 }}>{v.german}</span>
                  <span style={{ opacity: 0.7, marginLeft: '4px', fontSize: '10px' }}>
                    ({bridgeMode === 'german_darija' ? v.darija : v.english})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Central Ambient Orb */}
          {!isCameraOn && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2
            }}>
              <div style={{
                position: 'relative',
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                background: isLive
                  ? 'radial-gradient(circle, #38bdf8 0%, #0ea5e9 40%, rgba(14, 165, 233, 0) 70%)'
                  : 'radial-gradient(circle, #475569 0%, #1e293b 50%, rgba(30, 41, 59, 0) 70%)',
                animation: isLive ? 'pulse 2.5s infinite ease-in-out' : 'none',
                filter: 'blur(8px)'
              }} />
              <div style={{
                marginTop: '20px',
                fontSize: '13px',
                color: isLive ? '#38bdf8' : '#94a3b8',
                fontWeight: 600,
                textAlign: 'center'
              }}>
                {statusMessage}
              </div>
            </div>
          )}

          {/* 4. Live Generative Stage HUD */}
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

          {/* 5. Live Colored Syntax Subtitles */}
          {showCaptions && currentCaption && (
            <div style={{
              position: 'absolute',
              bottom: '120px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'calc(100% - 32px)',
              maxWidth: '520px',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              padding: '14px 18px',
              zIndex: 10,
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
            }}>
              <div style={{
                fontSize: '10px',
                color: '#38bdf8',
                fontWeight: 800,
                marginBottom: '4px',
                letterSpacing: '0.8px',
                textTransform: 'uppercase'
              }}>
                LADA Live German Subtitles
              </div>
              <div style={{
                fontSize: '15px',
                lineHeight: '1.5',
                color: '#f8fafc',
                maxHeight: '100px',
                overflowY: 'auto'
              }}>
                {highlightGermanSyntax(currentCaption)}
              </div>
            </div>
          )}

          {/* 6. Bottom Cockpit Controls */}
          <div style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            zIndex: 20,
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '32px',
            padding: '10px 18px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Mic Toggle */}
            <button
              onClick={toggleMic}
              style={{
                width: '46px',
                height: '46px',
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
              {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>

            {/* Video Toggle */}
            <button
              onClick={toggleCamera}
              style={{
                width: '46px',
                height: '46px',
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
              {isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>

            {/* Flip Camera Button (Only if Camera is active) */}
            {isCameraOn && (
              <button
                onClick={flipCamera}
                style={{
                  width: '46px',
                  height: '46px',
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
                <RefreshCw size={18} />
              </button>
            )}

            {/* Main Phone Connect/Disconnect */}
            <button
              onClick={isLive ? stopCall : () => startCall(false)}
              style={{
                width: '58px',
                height: '58px',
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
                boxShadow: isLive ? '0 0 20px rgba(239, 68, 68, 0.5)' : '0 0 20px rgba(34, 197, 94, 0.5)'
              }}
            >
              {isLive ? <PhoneOff size={26} /> : <Phone size={26} />}
            </button>

            {/* Speaker Toggle */}
            <button
              onClick={toggleSpeaker}
              style={{
                width: '46px',
                height: '46px',
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
              {isSpeakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>

            {/* Captions Toggle */}
            <button
              onClick={() => setShowCaptions(!showCaptions)}
              style={{
                width: '46px',
                height: '46px',
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
              <MessageSquare size={20} />
            </button>
          </div>
        </div>
      )}

      {/* VIEW 2: TEXT CHAT STUDIO */}
      {activeTab === 'chat' && (
        <div style={{ width: '100%', height: '100%', paddingTop: '60px' }}>
          <TextChatStudio
            apiKey={keyManagerRef.current.getActiveKey() || apiKeys[0]}
            bridgeMode={bridgeMode}
            onChangeBridgeMode={handleChangeBridgeMode}
          />
        </div>
      )}

      {/* VIEW 3: HISTORY & TIMELINE HUB */}
      {activeTab === 'history' && (
        <div style={{ width: '100%', height: '100%', paddingTop: '60px' }}>
          <HistoryHub
            onResumeChapter={handleResumeChapter}
          />
        </div>
      )}

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
