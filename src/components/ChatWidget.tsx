import React, { useState, useRef, useEffect } from 'react';
import { queryRAGChatbot, RAGChatResponse } from '../services/rag/ragEngine';
import { HAFFY_TWO_PERSONA } from '../services/rag/luffyPersona';
import { X, Send, Sparkles, Compass, ShieldAlert, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  sources?: string[];
  liveQuote?: { ticker: string; price: number; changePercent: number };
}

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-0',
      sender: 'bot',
      text: HAFFY_TWO_PERSONA.greeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async (promptText?: string) => {
    const textToQuery = promptText || input;
    if (!textToQuery.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!promptText) setInput('');
    setLoading(true);

    try {
      const ragRes: RAGChatResponse = await queryRAGChatbot(textToQuery);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: ragRes.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: ragRes.retrievedSources.map(s => s.title),
        liveQuote: ragRes.liveQuote,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'bot',
          text: 'Hello! A network issue occurred, but I’m still here to help — please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── FLOATING TRIGGER BUTTON ─────────────────────────────────── */}
      <button
        id="btn-haffy-chat-trigger"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FACC15 0%, #EA580C 100%)',
          border: '3px solid #78350F',
          boxShadow: '0 8px 24px rgba(234,88,12,0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
        className="hover:scale-110 active:scale-95"
        title="Chat with Haffy Two"
      >
        <div dangerouslySetInnerHTML={{ __html: HAFFY_TWO_PERSONA.avatarSvg }} />
        <span style={{ position: 'absolute', top: 2, right: 2, width: 12, height: 12, borderRadius: '50%', background: '#10B981', border: '2px solid white' }} />
      </button>

      {/* ── CHAT DRAWER / WINDOW ────────────────────────────────────── */}
      {isOpen && (
        <div
          id="haffy-chat-window"
          className="animate-in"
          style={{
            position: 'fixed',
            bottom: 96,
            right: 24,
            zIndex: 9999,
            width: 'clamp(320px, 90vw, 400px)',
            height: 520,
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            borderRadius: 24,
            border: '2px solid #FACC15',
            boxShadow: '0 20px 50px rgba(15,23,42,0.6)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #78350F 0%, #451A03 100%)', padding: '0.85rem 1.1rem', color: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #FACC15' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#FACC15', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #78350F' }} dangerouslySetInnerHTML={{ __html: HAFFY_TWO_PERSONA.avatarSvg }} />
              <div>
                <h4 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: '0.95rem', color: '#FFFBEB', margin: 0, lineHeight: 1.2 }}>
                  {HAFFY_TWO_PERSONA.name}
                </h4>
                <span style={{ fontSize: '0.68rem', color: '#FDE68A', opacity: 0.95 }}>
                  {HAFFY_TWO_PERSONA.title}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 26, height: 26, color: '#FEF3C7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Preset Quick Question Chips */}
          <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(15,23,42,0.8)', borderBottom: '1px solid #334155', display: 'flex', gap: 6, overflowX: 'auto' }}>
            {['VOO vs VTI?', 'Roth IRA Rules?', 'Tech Growth QQQ?'].map(chip => (
              <button
                key={chip}
                onClick={() => handleSendMessage(chip)}
                style={{
                  background: 'rgba(250,204,21,0.12)',
                  color: '#FACC15',
                  border: '1px solid rgba(250,204,21,0.3)',
                  borderRadius: 999,
                  padding: '0.22rem 0.6rem',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
              >
                ⚡ {chip}
              </button>
            ))}
          </div>

          {/* Messages Body */}
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {messages.map(msg => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    background: isUser ? '#0EA5E9' : '#1E293B',
                    color: isUser ? 'white' : '#F8FAFC',
                    padding: '0.75rem 0.9rem',
                    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    border: isUser ? 'none' : '1px solid #334155',
                    fontSize: '0.82rem',
                    lineHeight: 1.5,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}
                >
                  <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{msg.text}</p>
                  
                  {/* Sources tag if retrieved */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.67rem', color: '#94A3B8' }}>
                      📚 Knowledge Source: {msg.sources[0]}
                    </div>
                  )}

                  <span style={{ fontSize: '0.62rem', opacity: 0.6, display: 'block', textAlign: 'right', marginTop: 4 }}>
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {loading && (
              <div style={{ alignSelf: 'flex-start', background: '#1E293B', padding: '0.65rem 0.9rem', borderRadius: 16, border: '1px solid #334155', fontSize: '0.8rem', color: '#FACC15', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} className="animate-spin" />
                <span>Haffy Two is reviewing market data and financial guidance…</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '0.75rem 0.85rem', background: '#0F172A', borderTop: '1px solid #334155', display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Ask Haffy Two about investing…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
              style={{ flex: 1, background: '#1E293B', border: '1px solid #334155', borderRadius: 999, padding: '0.55rem 0.9rem', color: 'white', fontSize: '0.82rem' }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !input.trim()}
              style={{ background: '#FACC15', color: '#78350F', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: loading || !input.trim() ? 0.5 : 1 }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
