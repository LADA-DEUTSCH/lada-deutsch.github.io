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

    // Update active thread locally
    let updatedThreads = [...threads];
    if (activeThread.id === 'new') {
      const newThread = {
        id: `thread_${Date.now()}`,
        title: text.length > 25 ? text.substring(0, 25) + '...' : text,
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
        text: `⚠️ Error: ${errMsg}`,
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
      {/* Top Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bot size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800 }}>LADA Studio Chat</div>
            <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>Gemini 2.5 Flash · Deep German AI</div>
          </div>
        </div>

        {/* Bridge Mode Selector Pill */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.06)',
          borderRadius: '20px',
          padding: '2px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            onClick={() => onChangeBridgeMode('german_only')}
            style={{
              padding: '4px 10px',
              borderRadius: '16px',
              background: bridgeMode === 'german_only' ? '#0ea5e9' : 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            🇩🇪 Pur
          </button>
          <button
            onClick={() => onChangeBridgeMode('german_darija')}
            style={{
              padding: '4px 10px',
              borderRadius: '16px',
              background: bridgeMode === 'german_darija' ? '#0ea5e9' : 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            🇲🇦 Darija
          </button>
          <button
            onClick={() => onChangeBridgeMode('german_english')}
            style={{
              padding: '4px 10px',
              borderRadius: '16px',
              background: bridgeMode === 'german_english' ? '#0ea5e9' : 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            🇬🇧 English
          </button>
        </div>

        <button
          onClick={handleNewThread}
          style={{
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '10px',
            color: '#38bdf8',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer'
          }}
        >
          <Plus size={14} />
          <span>New Chat</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {activeThread.messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              gap: '10px',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%'
            }}
          >
            {msg.role === 'model' && (
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#0ea5e9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '4px'
              }}>
                <Bot size={16} color="#fff" />
              </div>
            )}

            <div style={{
              background: msg.role === 'user' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'rgba(15, 23, 42, 0.75)',
              border: msg.role === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '18px',
              padding: '12px 16px',
              color: '#f8fafc',
              fontSize: '14px',
              lineHeight: '1.5',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
              whiteSpace: 'pre-wrap'
            }}>
              {msg.role === 'model' ? highlightGermanSyntax(msg.text) : msg.text}
            </div>

            {msg.role === 'user' && (
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '4px'
              }}>
                <User size={16} color="#94a3b8" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '13px', marginLeft: '38px' }}>
            <Sparkles size={16} className="animate-spin" color="#38bdf8" />
            <span>LADA is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Suggestions */}
      <div style={{
        padding: '8px 16px',
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        background: 'rgba(15, 23, 42, 0.4)'
      }}>
        {[
          'Wie sagt man das auf Deutsch?',
          'Deconstruct a compound word',
          'Explain der/die/das rule',
          'Translate with Darija notes'
        ].map((promptText) => (
          <button
            key={promptText}
            onClick={() => handleSend(promptText)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: '#cbd5e1',
              padding: '6px 12px',
              fontSize: '12px',
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
        padding: '12px 16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(15, 23, 42, 0.9)',
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="Ask LADA anything about German..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '24px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#fff',
            fontSize: '14px'
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputText.trim() || loading}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: inputText.trim() ? 'linear-gradient(135deg, #0ea5e9, #2563eb)' : 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inputText.trim() ? 'pointer' : 'default',
            boxShadow: inputText.trim() ? '0 4px 14px rgba(14, 165, 233, 0.4)' : 'none'
          }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
