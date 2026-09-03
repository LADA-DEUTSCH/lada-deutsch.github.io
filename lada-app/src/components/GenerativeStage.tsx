import React from 'react';
import { X, Sparkles, Volume2, SplitSquareVertical } from 'lucide-react';
import type { StageEvent, CompoundBreakdown, PhoneticCue, BinaryChoice } from '../types';

interface GenerativeStageProps {
  currentEvent: StageEvent | null;
  onDismiss: () => void;
  onSelectChoice: (choice: string) => void;
}

export const GenerativeStage: React.FC<GenerativeStageProps> = ({
  currentEvent,
  onDismiss,
  onSelectChoice
}) => {
  if (!currentEvent) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '74px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)',
      maxWidth: '480px',
      zIndex: 50,
      animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -12px) scale(0.96); }
          to { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
      `}</style>

      {/* 1. COMPOUND WORD CARD */}
      {currentEvent.type === 'compound_card' && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '20px',
          padding: '18px 20px',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.15)',
          color: '#fff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#38bdf8', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              <SplitSquareVertical size={14} />
              <span>Compound Word Deconstruction</span>
            </div>
            <button
              onClick={onDismiss}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ fontSize: '24px', fontWeight: 800, marginBottom: '14px', letterSpacing: '-0.3px' }}>
            <span style={{ color: (currentEvent.data as CompoundBreakdown).gender === 'der' ? '#60a5fa' : (currentEvent.data as CompoundBreakdown).gender === 'die' ? '#f472b6' : '#34d399', marginRight: '6px' }}>
              {(currentEvent.data as CompoundBreakdown).article}
            </span>
            {(currentEvent.data as CompoundBreakdown).word}
          </div>

          {/* Morphological Parts */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {(currentEvent.data as CompoundBreakdown).parts.map((p, idx) => (
              <div key={idx} style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '8px 12px',
                fontSize: '13px'
              }}>
                <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{p.part}</span>
                <span style={{ color: '#94a3b8', fontSize: '11px', marginLeft: '6px' }}>({p.meaning})</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.4', background: 'rgba(56, 189, 248, 0.08)', padding: '10px 12px', borderRadius: '10px', borderLeft: '3px solid #38bdf8' }}>
            💡 {(currentEvent.data as CompoundBreakdown).rule}
          </div>
        </div>
      )}

      {/* 2. PHONETIC CUE CARD */}
      {currentEvent.type === 'phonetic_cue' && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(244, 114, 182, 0.35)',
          borderRadius: '20px',
          padding: '18px 20px',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(244, 114, 182, 0.15)',
          color: '#fff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#f472b6', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              <Volume2 size={14} />
              <span>Articulatory Mouth Guide</span>
            </div>
            <button
              onClick={onDismiss}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ fontSize: '20px', fontWeight: 800, color: '#f472b6', marginBottom: '8px' }}>
            {(currentEvent.data as PhoneticCue).sound}
          </div>

          <div style={{ fontSize: '13px', color: '#e2e8f0', marginBottom: '10px', lineHeight: '1.4' }}>
            👅 <strong>Mouth placement:</strong> {(currentEvent.data as PhoneticCue).mouthGuide}
          </div>

          <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.4', background: 'rgba(244, 114, 182, 0.1)', padding: '10px 12px', borderRadius: '10px', borderLeft: '3px solid #f472b6' }}>
            🇲🇦 <strong>Darija bridge:</strong> {(currentEvent.data as PhoneticCue).darijaBridge}
          </div>
        </div>
      )}

      {/* 3. BINARY CHOICE PILLS */}
      {currentEvent.type === 'choice_pills' && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(250, 204, 21, 0.35)',
          borderRadius: '20px',
          padding: '16px 20px',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(250, 204, 21, 0.15)',
          color: '#fff',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#facc15', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              <Sparkles size={14} />
              <span>Tap your choice</span>
            </div>
            <button
              onClick={onDismiss}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: '#f8fafc' }}>
            {(currentEvent.data as BinaryChoice).question}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              onClick={() => onSelectChoice((currentEvent.data as BinaryChoice).optionA)}
              style={{
                background: 'rgba(250, 204, 21, 0.15)',
                border: '1px solid rgba(250, 204, 21, 0.4)',
                borderRadius: '14px',
                color: '#fef08a',
                padding: '12px 14px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(250, 204, 21, 0.25)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(250, 204, 21, 0.15)')}
            >
              {(currentEvent.data as BinaryChoice).optionA}
            </button>
            <button
              onClick={() => onSelectChoice((currentEvent.data as BinaryChoice).optionB)}
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '14px',
                color: '#bae6fd',
                padding: '12px 14px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.25)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)')}
            >
              {(currentEvent.data as BinaryChoice).optionB}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
