import React, { useState, useRef, useEffect } from 'react';
import { queryRAGChatbot, RAGChatResponse } from '../services/rag/ragEngine';
import { HAFFY_BOT_PERSONA } from '../services/rag/luffyPersona';
import { X, Send, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  sources?: string[];
  liveQuote?: { ticker: string; price: number; changePercent: number };
}

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen]   = useState(false);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-0',
      sender: 'bot',
      text: HAFFY_BOT_PERSONA.greeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (promptText?: string) => {
    const text = promptText || input;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    if (!promptText) setInput('');
    setLoading(true);

    try {
      const res: RAGChatResponse = await queryRAGChatbot(text);
      setMessages(prev => [...prev, {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: res.retrievedSources.map(s => s.title),
        liveQuote: res.liveQuote,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: "SHISHISHI! 🏴‍☠️ A storm wave hit the network — but Haffy Bot never gives up! Try again!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setLoading(false);
    }
  };

  /* ── quick suggestion chips ─────────────────────────────────────── */
  const CHIPS = [
    { label: '⚙️ VOO vs VTI?',         prompt: 'Compare VOO vs VTI' },
    { label: '⚙️⚙️⚙️ Roth IRA Rules?', prompt: 'Explain Roth IRA contribution limits and withdrawal rules' },
    { label: '⚙️⚙️ Fee Drag Math?',    prompt: 'Show me the expense ratio fee drag math over 30 years' },
    { label: '☀️ FIRE Journey?',        prompt: 'How do I achieve financial independence and retire early?' },
  ];

  return (
    <>
      {/* ── FLOATING TRIGGER ──────────────────────────────────────────── */}
      <button
        id="btn-haffy-bot-trigger"
        onClick={() => setIsOpen(o => !o)}
        title="Chat with Haffy Bot — King of Financial Freedom!"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 62, height: 62, borderRadius: '50%', padding: 0,
          border: '3px solid #78350F',
          boxShadow: '0 8px 28px rgba(124,58,237,0.55)',
          cursor: 'pointer', overflow: 'hidden',
          background: 'transparent',
          transition: 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <img
          src={HAFFY_BOT_PERSONA.avatarUrl}
          alt="Haffy Bot"
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
        />
        {/* live status dot */}
        <span style={{
          position: 'absolute', top: 3, right: 3,
          width: 13, height: 13, borderRadius: '50%',
          background: '#10B981', border: '2px solid white'
        }} />
      </button>

      {/* ── CHAT WINDOW ───────────────────────────────────────────────── */}
      {isOpen && (
        <div
          id="haffy-bot-chat-window"
          style={{
            position: 'fixed', bottom: 100, right: 24, zIndex: 9999,
            width: 'clamp(320px, 90vw, 410px)', height: 540,
            background: 'linear-gradient(160deg, #0F0A1E 0%, #1A0F3C 50%, #0D1B3E 100%)',
            borderRadius: 26,
            border: '2px solid #7C3AED',
            boxShadow: '0 24px 60px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #4C1D95 0%, #2E1065 100%)',
            padding: '0.85rem 1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '2px solid #7C3AED',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Avatar */}
              <div style={{
                width: 42, height: 42, borderRadius: '50%', overflow: 'hidden',
                border: '2px solid #FACC15', flexShrink: 0,
                boxShadow: '0 0 12px rgba(124,58,237,0.7)',
              }}>
                <img
                  src={HAFFY_BOT_PERSONA.avatarUrl}
                  alt="Haffy Bot"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div>
                <h4 style={{
                  fontFamily: "'Outfit', sans-serif", fontWeight: 900,
                  fontSize: '1rem', color: '#E9D5FF', margin: 0, lineHeight: 1.2,
                  textShadow: '0 0 8px rgba(167,139,250,0.5)'
                }}>
                  {HAFFY_BOT_PERSONA.name}
                </h4>
                <span style={{ fontSize: '0.67rem', color: '#C4B5FD', opacity: 0.9 }}>
                  {HAFFY_BOT_PERSONA.title}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.1)', border: 'none',
                borderRadius: '50%', width: 28, height: 28, color: '#C4B5FD',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Quick Chip Suggestions */}
          <div style={{
            padding: '0.45rem 0.75rem',
            background: 'rgba(15,10,30,0.9)',
            borderBottom: '1px solid rgba(124,58,237,0.3)',
            display: 'flex', gap: 5, overflowX: 'auto',
          }}>
            {CHIPS.map(chip => (
              <button
                key={chip.prompt}
                onClick={() => handleSend(chip.prompt)}
                style={{
                  background: 'rgba(124,58,237,0.15)',
                  color: '#C4B5FD',
                  border: '1px solid rgba(124,58,237,0.4)',
                  borderRadius: 999,
                  padding: '0.22rem 0.65rem',
                  fontSize: '0.67rem', fontWeight: 700,
                  whiteSpace: 'nowrap', cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, padding: '1rem 0.9rem',
            overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: '0.85rem',
          }}>
            {messages.map(msg => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '88%',
                    background: isUser
                      ? 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)'
                      : 'rgba(30,15,60,0.95)',
                    color: '#F3F0FF',
                    padding: '0.7rem 0.95rem',
                    borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    border: isUser ? 'none' : '1px solid rgba(124,58,237,0.35)',
                    fontSize: '0.82rem', lineHeight: 1.55,
                    boxShadow: isUser
                      ? '0 4px 14px rgba(124,58,237,0.3)'
                      : '0 2px 8px rgba(0,0,0,0.25)',
                  }}
                >
                  {/* Render markdown-lite bold */}
                  <p style={{ margin: 0, whiteSpace: 'pre-line' }}>
                    {msg.text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
                      part.startsWith('**') && part.endsWith('**')
                        ? <strong key={i} style={{ color: isUser ? '#E9D5FF' : '#C4B5FD' }}>
                            {part.slice(2, -2)}
                          </strong>
                        : part
                    )}
                  </p>
                  {msg.sources && msg.sources.length > 0 && (
                    <div style={{
                      marginTop: 6, borderTop: '1px solid rgba(255,255,255,0.1)',
                      paddingTop: 5, fontSize: '0.65rem', color: '#9CA3AF',
                    }}>
                      📚 {msg.sources[0]}
                    </div>
                  )}
                  <span style={{ fontSize: '0.6rem', opacity: 0.5, display: 'block', textAlign: 'right', marginTop: 3 }}>
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {/* Typing indicator */}
            {loading && (
              <div style={{
                alignSelf: 'flex-start',
                background: 'rgba(30,15,60,0.95)',
                padding: '0.65rem 0.95rem',
                borderRadius: 18, border: '1px solid rgba(124,58,237,0.35)',
                fontSize: '0.8rem', color: '#C4B5FD',
                display: 'flex', alignItems: 'center', gap: 7,
              }}>
                <Sparkles size={13} className="animate-spin" />
                <span>Haffy Bot activating GEAR mode…</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '0.7rem 0.85rem',
            background: 'rgba(10,5,20,0.95)',
            borderTop: '1px solid rgba(124,58,237,0.3)',
            display: 'flex', gap: 8, alignItems: 'center',
          }}>
            <input
              type="text"
              placeholder="Ask Haffy Bot about investing…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
              style={{
                flex: 1,
                background: 'rgba(30,15,60,0.9)',
                border: '1px solid rgba(124,58,237,0.4)',
                borderRadius: 999,
                padding: '0.55rem 0.95rem',
                color: '#F3F0FF', fontSize: '0.82rem',
                outline: 'none',
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                color: 'white', border: 'none', borderRadius: '50%',
                width: 38, height: 38,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                opacity: loading || !input.trim() ? 0.45 : 1,
                boxShadow: '0 4px 12px rgba(124,58,237,0.4)',
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
