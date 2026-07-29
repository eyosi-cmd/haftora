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
    const text = (promptText || input).trim();
    if (!text || loading) return;

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
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: "SHISHISHI! 🏴‍☠️ A storm wave hit — try again!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const CHIPS = [
    { label: '⚙️ VOO vs VTI?',       prompt: 'Compare VOO vs VTI' },
    { label: '⚙️⚙️⚙️ Roth IRA?',    prompt: 'Explain Roth IRA contribution limits and withdrawal rules' },
    { label: '⚙️⚙️ Fee Drag Math?',  prompt: 'Show me the expense ratio fee drag math over 30 years' },
    { label: '☀️ FIRE Journey?',      prompt: 'How do I achieve financial independence and retire early?' },
  ];

  return (
    <>
      {/* ── FLOATING TRIGGER ──────────────────────────────────────── */}
      <button
        id="btn-haffy-bot-trigger"
        onClick={() => setIsOpen(o => !o)}
        title="Chat with Haffy Bot — King of Financial Freedom!"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          width: 58,
          height: 58,
          borderRadius: '50%',
          padding: 0,
          border: '2.5px solid #BAE6FD',
          boxShadow: '0 8px 24px rgba(14,165,233,0.22)',
          cursor: 'pointer',
          overflow: 'hidden',
          background: '#FFFFFF',
          transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease',
        }}
      >
        <img
          src={HAFFY_BOT_PERSONA.avatarUrl}
          alt="Haffy Bot"
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }}
        />
      </button>

      {/* ── CHAT WINDOW ───────────────────────────────────────────── */}
      {isOpen && (
        <div
          id="haffy-bot-chat-window"
          style={{
            position: 'fixed',
            bottom: 92,
            right: 24,
            zIndex: 9999,
            width: 'clamp(320px, 90vw, 400px)',
            height: 530,
            background: '#FFFFFF',
            borderRadius: 22,
            border: '2px solid #BAE6FD',
            boxShadow: '0 16px 48px rgba(14,165,233,0.18)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {/* ── Header ── */}
          <div style={{
            background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.5)',
                flexShrink: 0,
              }}>
                <img
                  src={HAFFY_BOT_PERSONA.avatarUrl}
                  alt="Haffy Bot"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div>
                <h4 style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  color: '#FFFFFF',
                  margin: 0,
                  lineHeight: 1.2,
                }}>
                  {HAFFY_BOT_PERSONA.name}
                </h4>
                <span style={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.82)' }}>
                  {HAFFY_BOT_PERSONA.title}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '50%',
                width: 28,
                height: 28,
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* ── Quick Chips ── */}
          <div style={{
            padding: '0.45rem 0.75rem',
            background: '#F0F9FF',
            borderBottom: '1px solid #BAE6FD',
            display: 'flex',
            gap: 5,
            overflowX: 'auto',
            flexShrink: 0,
          }}>
            {CHIPS.map(chip => (
              <button
                key={chip.prompt}
                onClick={() => handleSend(chip.prompt)}
                style={{
                  background: '#FFFFFF',
                  color: '#0284C7',
                  border: '1.5px solid #BAE6FD',
                  borderRadius: 9999,
                  padding: '0.22rem 0.65rem',
                  fontSize: '0.67rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* ── Messages ── */}
          <div style={{
            flex: 1,
            padding: '1rem 0.9rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            background: '#F8FCFF',
          }}>
            {messages.map(msg => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '86%',
                    background: isUser
                      ? 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)'
                      : '#FFFFFF',
                    color: isUser ? '#FFFFFF' : '#0C1A27',
                    padding: '0.65rem 0.9rem',
                    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    border: isUser ? 'none' : '1.5px solid #BAE6FD',
                    fontSize: '0.82rem',
                    lineHeight: 1.55,
                    boxShadow: isUser
                      ? '0 4px 12px rgba(14,165,233,0.25)'
                      : '0 2px 8px rgba(14,165,233,0.08)',
                  }}
                >
                  {/* Basic bold markdown render */}
                  <p style={{ margin: 0, whiteSpace: 'pre-line' }}>
                    {msg.text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
                      part.startsWith('**') && part.endsWith('**')
                        ? <strong key={i} style={{ color: isUser ? '#E0F2FE' : '#0284C7' }}>
                            {part.slice(2, -2)}
                          </strong>
                        : part
                    )}
                  </p>
                  {msg.sources && msg.sources.length > 0 && (
                    <div style={{
                      marginTop: 5,
                      paddingTop: 5,
                      borderTop: `1px solid ${isUser ? 'rgba(255,255,255,0.2)' : '#E0F2FE'}`,
                      fontSize: '0.63rem',
                      color: isUser ? 'rgba(255,255,255,0.7)' : '#64748B',
                    }}>
                      📚 {msg.sources[0]}
                    </div>
                  )}
                  <span style={{
                    fontSize: '0.6rem',
                    opacity: 0.55,
                    display: 'block',
                    textAlign: 'right',
                    marginTop: 3,
                  }}>
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {/* Typing indicator */}
            {loading && (
              <div style={{
                alignSelf: 'flex-start',
                background: '#FFFFFF',
                padding: '0.6rem 0.9rem',
                borderRadius: '16px 16px 16px 4px',
                border: '1.5px solid #BAE6FD',
                fontSize: '0.78rem',
                color: '#0EA5E9',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                boxShadow: '0 2px 8px rgba(14,165,233,0.08)',
              }}>
                <Sparkles size={13} className="animate-spin" />
                <span style={{ color: '#0284C7', fontWeight: 600 }}>Haffy Bot activating GEAR mode…</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Input ── */}
          <div style={{
            padding: '0.7rem 0.85rem',
            background: '#FFFFFF',
            borderTop: '1.5px solid #BAE6FD',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            flexShrink: 0,
          }}>
            <input
              type="text"
              placeholder="Ask Haffy Bot about investing…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
              style={{
                flex: 1,
                background: '#F0F9FF',
                border: '1.5px solid #BAE6FD',
                borderRadius: 9999,
                padding: '0.52rem 0.95rem',
                color: '#0C1A27',
                fontSize: '0.82rem',
                fontFamily: "'Inter', sans-serif",
                outline: 'none',
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              style={{
                background: !input.trim() || loading
                  ? '#BAE6FD'
                  : 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '50%',
                width: 38,
                height: 38,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
                boxShadow: !input.trim() || loading ? 'none' : '0 4px 12px rgba(14,165,233,0.3)',
                transition: 'all 0.18s ease',
                flexShrink: 0,
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
