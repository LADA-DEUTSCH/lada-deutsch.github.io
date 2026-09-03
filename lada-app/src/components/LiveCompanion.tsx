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
  RefreshCw
} from 'lucide-react';
import type { LearnerProfile, KeyStatus, VoiceName, StageEvent } from '../types';
import { AudioPipeline } from '../services/audioPipeline';
import { GeminiLiveClient } from '../services/geminiLiveClient';
import { KeyManager } from '../services/keyManager';
import { buildLadaSystemPrompt } from '../services/companionPrompt';
import { getDueSrsItems, recordSession } from '../services/srsEngine';
import { inspectTextForStageEvents } from '../services/cognitiveCoPilot';
import { GenerativeStage } from './GenerativeStage';
import { SettingsDrawer } from './SettingsDrawer';

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
  const [isLive, setIsLive] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Ready to connect');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showCaptions, setShowCaptions] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeVoice, setActiveVoice] = useState<VoiceName>('Kore');

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
  const fullTranscriptRef = useRef<string[]>([]);

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
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      const base64 = dataUrl.split(',')[1];
      if (base64 && geminiClientRef.current) {
        geminiClientRef.current.sendRealtimeImage(base64);
      }
    }, 1000);
  }, [isCameraOn]);

  const stopCameraStreaming = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
  }, []);

  // Toggle Camera Hardware
  const toggleCamera = async () => {
    const nextState = !isCameraOn;
    setIsCameraOn(nextState);

    if (nextState) {
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
      const systemPrompt = buildLadaSystemPrompt(profile, dueItems);

      let currentTurnText = '';

      geminiClientRef.current = new GeminiLiveClient({
        onAudioPcm: (base64Pcm24) => {
          audioPipelineRef.current?.playPcm24kChunk(base64Pcm24);
        },
        onCaptionChunk: (text) => {
          currentTurnText += text;
          setCurrentCaption(prev => prev + text);

          // Cognitive co-pilot inspection on caption chunks
          const events = inspectTextForStageEvents(currentTurnText);
          if (events.length > 0) {
            setStageEvent(events[0]);
          }
        },
        onTurnComplete: () => {
          if (currentTurnText) {
            fullTranscriptRef.current.push(`LADA: ${currentTurnText}`);
            sessionTurnsCountRef.current += 1;
            currentTurnText = '';
          }
        },
        onInterrupted: () => {
          // Native instant barge-in
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
          // Auto-failover if unexpected close or quota exhaustion
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
      // Try next key on setup failure
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

    // Save session recap
    if (sessionTurnsCountRef.current > 0) {
      const newTotal = profile.totalSessions + 1;
      const updatedProfile: LearnerProfile = {
        ...profile,
        totalSessions: newTotal
      };
      recordSession({
        sessionId: `S${Date.now()}`,
        timestamp: new Date().toISOString(),
        summary: `Session ${newTotal} with ${sessionTurnsCountRef.current} turns.`,
        turnsCount: sessionTurnsCountRef.current
      });
      onProfileUpdate(updatedProfile);
      sessionTurnsCountRef.current = 0;
    }
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
          display: isCameraOn ? 'block' : 'none',
          transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
        }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* 2. Audio Visualizer Glowing Orb (When Camera Off or Overlay) */}
      {!isCameraOn && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10
        }}>
          <div style={{
            width: isLive ? '160px' : '120px',
            height: isLive ? '160px' : '120px',
            borderRadius: '50%',
            background: isLive
              ? 'radial-gradient(circle, #38bdf8 0%, #2563eb 60%, rgba(37, 99, 235, 0) 100%)'
              : 'radial-gradient(circle, #64748b 0%, #1e293b 70%, rgba(30, 41, 59, 0) 100%)',
            boxShadow: isLive
              ? '0 0 80px rgba(56, 189, 248, 0.5), 0 0 140px rgba(37, 99, 235, 0.3)'
              : '0 0 30px rgba(100, 116, 139, 0.2)',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            animation: isLive ? 'pulseOrb 2.5s infinite ease-in-out' : 'none'
          }}>
            <style>{`
              @keyframes pulseOrb {
                0% { transform: scale(0.96); filter: brightness(1); }
                50% { transform: scale(1.08); filter: brightness(1.3); }
                100% { transform: scale(0.96); filter: brightness(1); }
              }
            `}</style>
          </div>
          <div style={{ marginTop: '28px', fontSize: '18px', fontWeight: 800, letterSpacing: '1px' }}>
            LADA
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            {statusMessage}
          </div>
        </div>
      )}

      {/* 3. Top Action Bar */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        right: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 40
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          padding: '6px 14px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isLive ? '#34d399' : '#f59e0b',
            boxShadow: isLive ? '0 0 8px #34d399' : 'none'
          }} />
          <span style={{ fontSize: '13px', fontWeight: 800 }}>LADA</span>
          <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>· LIVE</span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {isCameraOn && (
            <button
              onClick={flipCamera}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
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
          <button
            onClick={() => setShowCaptions(!showCaptions)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: showCaptions ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.75)',
              border: showCaptions ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
              color: showCaptions ? '#38bdf8' : '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <MessageSquare size={18} />
          </button>
          <button
            onClick={() => setIsDrawerOpen(true)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Sliders size={18} />
          </button>
        </div>
      </div>

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

      {/* 5. Live Captions HUD */}
      {showCaptions && currentCaption && (
        <div style={{
          position: 'absolute',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '520px',
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '12px 18px',
          fontSize: '14px',
          lineHeight: '1.5',
          textAlign: 'center',
          color: '#f8fafc',
          zIndex: 30,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
        }}>
          {currentCaption}
        </div>
      )}

      {/* 6. Bottom Controls Deck */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '36px',
        padding: '10px 18px',
        zIndex: 40
      }}>
        {/* Mic Toggle */}
        <button
          onClick={() => {
            const next = !isMicOn;
            setIsMicOn(next);
            audioPipelineRef.current?.setMicMuted(!next);
          }}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: isMicOn ? 'rgba(255, 255, 255, 0.08)' : 'rgba(239, 68, 68, 0.2)',
            border: isMicOn ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #ef4444',
            color: isMicOn ? '#fff' : '#f87171',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        {/* Main Phone Connect/Hangup Button */}
        <button
          onClick={() => {
            if (isLive) stopCall();
            else startCall();
          }}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: isLive
              ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
              : 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: isLive
              ? '0 8px 24px rgba(239, 68, 68, 0.4)'
              : '0 8px 24px rgba(16, 185, 129, 0.4)',
            transition: 'all 0.2s ease'
          }}
        >
          {isLive ? <PhoneOff size={26} /> : <Phone size={26} />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={toggleCamera}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: isCameraOn ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.08)',
            border: isCameraOn ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
            color: isCameraOn ? '#38bdf8' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        {/* Speaker Mute Toggle */}
        <button
          onClick={() => {
            const next = !isSpeakerOn;
            setIsSpeakerOn(next);
            audioPipelineRef.current?.setSpeakerMuted(!next);
          }}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: isSpeakerOn ? 'rgba(255, 255, 255, 0.08)' : 'rgba(239, 68, 68, 0.2)',
            border: isSpeakerOn ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #ef4444',
            color: isSpeakerOn ? '#fff' : '#f87171',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {isSpeakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      {/* 7. Settings & Intelligence Drawer */}
      <SettingsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        profile={profile}
        keyStatuses={keyStatuses}
        activeVoice={activeVoice}
        onSelectVoice={(v) => setActiveVoice(v)}
        onLockVault={onLockVault}
      />
    </div>
  );
};
