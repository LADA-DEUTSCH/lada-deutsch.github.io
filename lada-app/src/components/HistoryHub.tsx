import React, { useState } from 'react';
import { Phone, MessageSquare, ChevronRight, Play } from 'lucide-react';
import type { CallHistoryItem, TimelineChapter } from '../types';
import { loadCallHistory, loadChatThreads } from '../services/historyStorage';
import { getChapters } from '../services/timelineEngine';
import { highlightGermanSyntax } from '../services/syntaxHighlighter';

interface HistoryHubProps {
  onResumeChapter: (chapter: TimelineChapter) => void;
}

export const HistoryHub: React.FC<HistoryHubProps> = ({
  onResumeChapter
}) => {
  const [tab, setTab] = useState<'calls' | 'chats'>('calls');
  const calls = loadCallHistory();
  const chats = loadChatThreads();
  const chapters = getChapters();
  const [selectedCall, setSelectedCall] = useState<CallHistoryItem | null>(null);

  const activeChapter = chapters.find(c => !c.completed) || chapters[0];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#040711',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)'
      }}>
        <h1 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>History & Learning Archive</h1>
        <p style={{ fontSize: '12px', color: '#94a3b8' }}>
          Review past conversational turns, acquired vocabulary, and pick up your story where you left off.
        </p>

        {/* Story Resume Banner */}
        <div style={{
          marginTop: '14px',
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(59, 130, 246, 0.15))',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '16px',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Current Story Timeline
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
              {activeChapter.title}: {activeChapter.subtitle}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              {activeChapter.setting}
            </div>
          </div>
          <button
            onClick={() => onResumeChapter(activeChapter)}
            style={{
              background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)'
            }}
          >
            <Play size={14} fill="#fff" />
            <span>Resume</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginTop: '16px'
        }}>
          <button
            onClick={() => { setTab('calls'); setSelectedCall(null); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '12px',
              background: tab === 'calls' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: tab === 'calls' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
              color: tab === 'calls' ? '#38bdf8' : '#94a3b8',
              fontWeight: 700,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Phone size={15} />
            <span>Voice Calls ({calls.length})</span>
          </button>
          <button
            onClick={() => { setTab('chats'); setSelectedCall(null); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '12px',
              background: tab === 'chats' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: tab === 'chats' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
              color: tab === 'chats' ? '#38bdf8' : '#94a3b8',
              fontWeight: 700,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <MessageSquare size={15} />
            <span>Chat Threads ({chats.length})</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {tab === 'calls' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {selectedCall ? (
              <div style={{
                background: 'rgba(15, 23, 42, 0.75)',
                borderRadius: '18px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '18px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <button
                    onClick={() => setSelectedCall(null)}
                    style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    ← Back to all calls
                  </button>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {new Date(selectedCall.date).toLocaleDateString()}
                  </span>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '6px' }}>{selectedCall.chapterTitle}</h3>
                <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '14px' }}>{selectedCall.summary}</p>

                {/* Acquired Words */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '18px' }}>
                  {selectedCall.wordsAcquired.map((w, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#bae6fd',
                        borderRadius: '8px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 700
                      }}
                    >
                      {w}
                    </span>
                  ))}
                </div>

                {/* Turns Script */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedCall.turns.map((turn, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: turn.role === 'user' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        fontSize: '13px',
                        lineHeight: '1.5'
                      }}
                    >
                      <div style={{ fontSize: '10px', color: turn.role === 'user' ? '#94a3b8' : '#38bdf8', fontWeight: 800, marginBottom: '2px' }}>
                        {turn.role === 'user' ? 'BILAL' : 'LADA'}
                      </div>
                      <div>{highlightGermanSyntax(turn.text)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              calls.map((call) => (
                <div
                  key={call.id}
                  onClick={() => setSelectedCall(call)}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(15, 23, 42, 0.85)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)')}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>{call.chapterTitle}</span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>·</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{Math.round(call.durationSeconds / 60)} min</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', lineHeight: '1.4' }}>
                      {call.summary}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {call.wordsAcquired.slice(0, 3).map((w, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '6px',
                            padding: '2px 6px',
                            fontSize: '11px',
                            color: '#cbd5e1'
                          }}
                        >
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight size={18} color="#64748b" />
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'chats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {chats.map((thread) => (
              <div
                key={thread.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '16px'
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '6px' }}>{thread.title}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>
                  {thread.messages.length} messages · Last active {new Date(thread.updatedAt).toLocaleDateString()}
                </div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  color: '#cbd5e1',
                  lineHeight: '1.4'
                }}>
                  {thread.messages[thread.messages.length - 1]?.text.substring(0, 120)}...
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
