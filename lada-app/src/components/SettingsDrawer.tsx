import React from 'react';
import { X, BookOpen, Key, Brain, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import type { LearnerProfile, KeyStatus, VoiceName } from '../types';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: LearnerProfile;
  keyStatuses: KeyStatus[];
  activeVoice: VoiceName;
  onSelectVoice: (voice: VoiceName) => void;
  onLockVault: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  profile,
  keyStatuses,
  activeVoice,
  onSelectVoice,
  onLockVault
}) => {
  if (!isOpen) return null;

  const voices: VoiceName[] = ['Kore', 'Aoede', 'Fenrir', 'Puck', 'Charon'];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'flex-end',
      animation: 'fadeIn 0.2s ease'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>

      <div style={{
        width: '100%',
        maxWidth: '420px',
        height: '100%',
        background: '#0a0f1d',
        borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        overflowY: 'auto',
        color: '#fff',
        animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Drawer Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Brain size={22} color="#38bdf8" />
            <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Profile & Intelligence</h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* 1. ACQUISITION STATS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px'
        }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '14px', padding: '12px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8' }}>{profile.vocabulary.length}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Vocabulary</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '14px', padding: '12px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#a855f7' }}>{profile.personalFacts.length}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Personal Facts</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '14px', padding: '12px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#34d399' }}>{profile.totalSessions}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Sessions</div>
          </div>
        </div>

        {/* 2. VOICE SELECTOR */}
        <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0', marginBottom: '10px' }}>
            LADA Voice Selection
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {voices.map((v) => (
              <button
                key={v}
                onClick={() => onSelectVoice(v)}
                style={{
                  padding: '10px 8px',
                  borderRadius: '10px',
                  background: activeVoice === v ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: activeVoice === v ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: activeVoice === v ? '#38bdf8' : '#cbd5e1',
                  fontWeight: activeVoice === v ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* 3. API KEYS ROTATION POOL */}
        <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#e2e8f0', marginBottom: '10px' }}>
            <Key size={16} color="#facc15" />
            <span>API Key Auto-Rotation Pool (6 Keys)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {keyStatuses.map((k) => (
              <div
                key={k.index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#94a3b8' }}>#{k.index}</span>
                  <span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>{k.maskedKey}</span>
                </div>
                {k.isExhausted ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f87171', fontSize: '11px' }}>
                    <AlertCircle size={14} />
                    <span>Cooldown</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34d399', fontSize: '11px' }}>
                    <CheckCircle2 size={14} />
                    <span>Ready</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 4. RECENT VOCABULARY */}
        <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#e2e8f0', marginBottom: '10px' }}>
            <BookOpen size={16} color="#34d399" />
            <span>Spaced Repetition Memory</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
            {profile.vocabulary.map((w) => (
              <div
                key={w.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  fontSize: '12px'
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, color: w.article === 'der' ? '#60a5fa' : w.article === 'die' ? '#f472b6' : '#34d399', marginRight: '6px' }}>
                    {w.article}
                  </span>
                  <span style={{ fontWeight: 600 }}>{w.german}</span>
                </div>
                <span style={{ color: '#94a3b8', fontSize: '11px' }}>{w.english}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 5. LOCK VAULT */}
        <button
          onClick={onLockVault}
          style={{
            marginTop: 'auto',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '14px',
            color: '#f87171',
            padding: '14px',
            fontSize: '14px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Lock size={16} />
          <span>Lock Vault & Exit</span>
        </button>
      </div>
    </div>
  );
};
