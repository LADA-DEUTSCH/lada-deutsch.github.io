import React, { useState } from 'react';
import { Phone, MessageSquare, Compass, ChevronRight, Play } from 'lucide-react';
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
  const [tab, setTab] = useState<'chapters' | 'calls' | 'chats'>('chapters');
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
      {/* Top Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(10, 15, 30, 0.9)',
        backdropFilter: 'blur(20px)'
      }}>
        <h1 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>Story & Progress Hub</h1>
        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
          Select your story chapter or review past call transcripts and words.
        </p>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          gap: '6px',
          marginTop: '12px',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '3px',
          borderRadius: '16px'
        }}>
          <button
            onClick={() => { setTab('chapters'); setSelectedCall(null); }}
            style={{
              flex: 1,
              padding: '7px 10px',
              borderRadius: '12px',
              background: tab === 'chapters' ? 'linear-gradient(135deg, #0ea5e9, #2563eb)' : 'transparent',
              border: 'none',
              color: tab === 'chapters' ? '#fff' : '#94a3b8',
              fontWeight: 700,
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <Compass size={13} />
            <span>Story Line</span>
          </button>

          <button
            onClick={() => { setTab('calls'); setSelectedCall(null); }}
            style={{
              flex: 1,
              padding: '7px 10px',
              borderRadius: '12px',
              background: tab === 'calls' ? 'linear-gradient(135deg, #0ea5e9, #2563eb)' : 'transparent',
              border: 'none',
              color: tab === 'calls' ? '#fff' : '#94a3b8',
              fontWeight: 700,
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <Phone size={13} />
            <span>Calls ({calls.length})</span>
          </button>

          <button
            onClick={() => { setTab('chats'); setSelectedCall(null); }}
            style={{
              flex: 1,
              padding: '7px 10px',
              borderRadius: '12px',
              background: tab === 'chats' ? 'linear-gradient(135deg, #0ea5e9, #2563eb)' : 'transparent',
              border: 'none',
              color: tab === 'chats' ? '#fff' : '#94a3b8',
              fontWeight: 700,
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <MessageSquare size={13} />
            <span>Chats ({chats.length})</span>
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {/* TAB 1: STORYLINE CHAPTERS */}
        {tab === 'chapters' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Your Daily Life Narrative (5 Chapters)
            </div>

            {chapters.map((ch) => {
              const isCurrent = ch.id === activeChapter.id;
              return (
                <div
                  key={ch.id}
                  style={{
                    background: isCurrent ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(59, 130, 246, 0.15))' : 'rgba(15, 23, 42, 0.65)',
                    border: isCurrent ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '18px',
                    padding: '16px',
                    boxShadow: isCurrent ? '0 4px 20px rgba(14, 165, 233, 0.25)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>{ch.title}</span>
                        {isCurrent && (
                          <span style={{
                            background: '#0ea5e9',
                            color: '#fff',
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '8px',
                            textTransform: 'uppercase'
                          }}>
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{ch.subtitle}</div>
                    </div>

                    <button
                      onClick={() => onResumeChapter(ch)}
                      style={{
                        background: isCurrent ? 'linear-gradient(135deg, #0ea5e9, #2563eb)' : 'rgba(255, 255, 255, 0.08)',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Play size={12} fill="#fff" />
                      <span>{isCurrent ? 'Start' : 'Select'}</span>
                    </button>
                  </div>

                  <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4' }}>
                    {ch.setting}
                  </div>

                  {/* Target Verbs */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {ch.verbs.map((v, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: 'rgba(250, 204, 21, 0.1)',
                          border: '1px solid rgba(250, 204, 21, 0.25)',
                          color: '#fde047',
                          borderRadius: '8px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: 700
                        }}
                      >
                        {v.german} <span style={{ opacity: 0.6, fontSize: '9px' }}>({v.darija})</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: CALL LOGS & TRANSCRIPTS */}
        {tab === 'calls' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {selectedCall ? (
              <div style={{
                background: 'rgba(15, 23, 42, 0.85)',
                borderRadius: '18px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <button
                    onClick={() => setSelectedCall(null)}
                    style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    ← All Calls
                  </button>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {new Date(selectedCall.date).toLocaleDateString()}
                  </span>
                </div>

                <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '4px' }}>{selectedCall.chapterTitle}</h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>{selectedCall.summary}</p>

                {/* Acquired Words */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {selectedCall.wordsAcquired.map((w, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#bae6fd',
                        borderRadius: '8px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 700
                      }}
                    >
                      {w}
                    </span>
                  ))}
                </div>

                {/* Script Turns */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedCall.turns.map((turn, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: turn.role === 'user' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(15, 23, 42, 0.85)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '12px',
                        padding: '8px 12px',
                        fontSize: '13px',
                        lineHeight: '1.4'
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
                    background: 'rgba(15, 23, 42, 0.65)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>{call.chapterTitle}</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>· {Math.round(call.durationSeconds / 60)} min</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>{call.summary}</div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {call.wordsAcquired.map((w, idx) => (
                        <span key={idx} style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px', padding: '2px 6px', fontSize: '10px', color: '#cbd5e1' }}>
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

        {/* TAB 3: CHATS */}
        {tab === 'chats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {chats.map((thread) => (
              <div
                key={thread.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '14px'
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '4px' }}>{thread.title}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>
                  {thread.messages.length} messages
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.4' }}>
                  {thread.messages[thread.messages.length - 1]?.text.substring(0, 100)}...
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
