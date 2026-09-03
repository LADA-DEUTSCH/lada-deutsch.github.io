import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Plus, Bot, User } from 'lucide-react';
import type { ChatMessage, BridgeLanguageMode } from '../types';
import { sendChatMessage } from '../services/geminiChatService';
import { loadChatThreads, saveChatThreads } from '../services/historyStorage';
import { highlightGermanSyntax } from '../services/syntaxHighlighter';

interface TextChatStudioProps {
  apiKey: string;
  bridgeMode: BridgeLanguageMode;
  onChangeBridgeMode: (mode: BridgeLanguageMode) => void;
}

export const TextChatStudio: React.FC<TextChatStudioProps> = ({
  apiKey,
  bridgeMode,
  onChangeBridgeMode
}) => {
  const [threads, setThreads] = useState(loadChatThreads());
  const [activeThreadId, setActiveThreadId] = useState<string>(threads[0]?.id || 'new');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeThread = threads.find(t => t.id === activeThreadId) || {
    id: 'new',
    title: 'New Conversation',
    messages: [
      {
        id: 'welcome',
        role: 'model' as const,
        text: 'Hallo Bilal! Hier kannst du mir jederzeit Fragen zu deutscher Grammatik stellen, Vokabeln aufschreiben oder Schreibübungen machen. Worüber möchtest du schreiben?',
        timestamp: new Date().toISOString()
      }
    ],
    updatedAt: new Date().toISOString()
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread.messages]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    const newMessages = [...activeThread.messages, userMsg];
    setInputText('');
    setLoading(true);

    let updatedThreads = [...threads];
    if (activeThread.id === 'new') {
      const newThread = {
        id: `thread_${Date.now()}`,
        title: text.length > 22 ? text.substring(0, 22) + '...' : text,
        messages: newMessages,
        updatedAt: new Date().toISOString()
      };
      updatedThreads = [newThread, ...threads];
      setActiveThreadId(newThread.id);
    } else {
      updatedThreads = threads.map(t => {
        if (t.id === activeThread.id) {
          return { ...t, messages: newMessages, updatedAt: new Date().toISOString() };
        }
        return t;
      });
    }

    setThreads(updatedThreads);
    saveChatThreads(updatedThreads);

    try {
      const reply = await sendChatMessage(apiKey, newMessages, bridgeMode);
      const modelMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'model',
        text: reply,
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...newMessages, modelMsg];
      const finalThreads = updatedThreads.map(t => {
        if (t.id === activeThreadId || (activeThread.id === 'new' && t.id === updatedThreads[0].id)) {
          return { ...t, messages: finalMessages, updatedAt: new Date().toISOString() };
        }
        return t;
      });

      setThreads(finalThreads);
      saveChatThreads(finalThreads);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Error reaching Gemini.';
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'model',
        text: `⚠️ ${errMsg}`,
        timestamp: new Date().toISOString()
      };
      const finalThreads = updatedThreads.map(t => {
        if (t.id === activeThreadId) {
          return { ...t, messages: [...newMessages, errorMsg] };
        }
        return t;
      });
      setThreads(finalThreads);
    } finally {
      setLoading(false);
    }
  };

  const handleNewThread = () => {
    setActiveThreadId('new');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#040711',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Top Mobile Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(10, 15, 30, 0.9)',
        backdropFilter: 'blur(20px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(14, 165, 233, 0.4)'
          }}>
            <Bot size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800 }}>LADA Chat</div>
            <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700 }}>Gemini 3.6 Flash · Online</div>
          </div>
        </div>

        {/* Compact Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Language Selector */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '2px'
          }}>
            <button
              onClick={() => onChangeBridgeMode('german_only')}
              style={{
                padding: '3px 7px',
                borderRadius: '14px',
                background: bridgeMode === 'german_only' ? '#0ea5e9' : 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              DE
            </button>
            <button
              onClick={() => onChangeBridgeMode('german_darija')}
              style={{
                padding: '3px 7px',
                borderRadius: '14px',
                background: bridgeMode === 'german_darija' ? '#0ea5e9' : 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              🇲🇦 MA
            </button>
            <button
              onClick={() => onChangeBridgeMode('german_english')}
              style={{
                padding: '3px 7px',
                borderRadius: '14px',
                background: bridgeMode === 'german_english' ? '#0ea5e9' : 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              EN
            </button>
          </div>

          <button
            onClick={handleNewThread}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {activeThread.messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              gap: '8px',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '88%'
            }}
          >
            {msg.role === 'model' && (
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: '#0ea5e9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '4px'
              }}>
                <Bot size={14} color="#fff" />
              </div>
            )}

            <div style={{
              background: msg.role === 'user' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'rgba(15, 23, 42, 0.85)',
              border: msg.role === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '10px 14px',
              color: '#f8fafc',
              fontSize: '14px',
              lineHeight: '1.5',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {msg.role === 'model' ? highlightGermanSyntax(msg.text) : msg.text}
            </div>

            {msg.role === 'user' && (
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '4px'
              }}>
                <User size={14} color="#94a3b8" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '13px', marginLeft: '34px' }}>
            <Sparkles size={16} className="animate-spin" color="#38bdf8" />
            <span>LADA is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div style={{
        padding: '6px 14px',
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        background: 'rgba(10, 15, 30, 0.6)'
      }}>
        {[
          'Wie sagt man das auf Deutsch?',
          'Deconstruct a compound word',
          'Explain der/die/das rule',
          'Translate to Darija & German'
        ].map((promptText) => (
          <button
            key={promptText}
            onClick={() => handleSend(promptText)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: '#cbd5e1',
              padding: '5px 10px',
              fontSize: '11px',
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            {promptText}
          </button>
        ))}
      </div>

      {/* Input Deck */}
      <div style={{
        padding: '10px 14px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(10, 15, 30, 0.95)',
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="Message LADA in German, Darija, or English..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '22px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#fff',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputText.trim() || loading}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: inputText.trim() ? 'linear-gradient(135deg, #0ea5e9, #2563eb)' : 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inputText.trim() ? 'pointer' : 'default',
            boxShadow: inputText.trim() ? '0 0 12px rgba(14, 165, 233, 0.4)' : 'none'
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};
