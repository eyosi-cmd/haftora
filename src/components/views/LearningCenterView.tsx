import React, { useState } from 'react';
import { Lesson, UserProgressState } from '../../types';
import { LEARNING_MODULES } from '../../data/learningContent';
import confetti from 'canvas-confetti';
import {
  BookOpen, CheckCircle2, Clock, AlertCircle, ShieldCheck,
  HelpCircle, ChevronRight, Award, ArrowLeft, Zap, XCircle, Volume2, Square
} from 'lucide-react';
import { calculateCompoundInterest, formatCurrency } from '../../utils/financialMath';

interface LearningCenterViewProps {
  selectedLessonId: string | null;
  onSelectLesson: (id: string | null) => void;
  progress: UserProgressState;
  onCompleteLesson: (lessonId: string, quizScore: number) => void;
}

export const LearningCenterView: React.FC<LearningCenterViewProps> = ({
  selectedLessonId, onSelectLesson, progress, onCompleteLesson
}) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sliderPrincipal, setSliderPrincipal] = useState(1000);
  const [sliderMonthly, setSliderMonthly] = useState(300);
  const [sliderYears, setSliderYears] = useState(25);

  const toggleAudio = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Audio narration is not supported on this browser.');
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#_`]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const compoundResult = calculateCompoundInterest(sliderPrincipal, sliderMonthly, 8, sliderYears);
  const finalPoint = compoundResult[compoundResult.length - 1];

  let activeLesson: Lesson | null = null;
  if (selectedLessonId) {
    for (const m of LEARNING_MODULES) {
      const match = m.lessons.find((l) => l.id === selectedLessonId);
      if (match) { activeLesson = match; break; }
    }
  }

  const handleSelectAnswer = (qId: string, idx: number) => {
    if (quizSubmitted) return;
    setUserAnswers(p => ({ ...p, [qId]: idx }));
  };

  const handleSubmitQuiz = () => {
    if (!activeLesson) return;
    let score = 0;
    activeLesson.quiz.forEach(q => { if (userAnswers[q.id] === q.correctIndex) score++; });
    setQuizSubmitted(true);
    onCompleteLesson(activeLesson.id, score);
    if (score === activeLesson.quiz.length) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  const backToModules = () => { onSelectLesson(null); setQuizSubmitted(false); setUserAnswers({}); };

  /* ── LESSON VIEW ── */
  if (activeLesson) {
    const isDone = progress.completedLessonIds.includes(activeLesson.id);
    return (
      <div className="animate-in" style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <button id="btn-back-to-modules" className="btn btn-ghost btn-sm" onClick={backToModules} style={{ alignSelf: 'flex-start' }}>
          <ArrowLeft size={15} /> Back to Modules
        </button>

        {/* Lesson header */}
        <div className="card" style={{ borderLeft: '4px solid #0EA5E9' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
            <span className="badge badge-blue">Interactive Lesson</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem', color: '#64748B' }}>
              <button
                id="btn-listen-lesson"
                className="btn btn-ghost btn-sm"
                onClick={() => toggleAudio(`${activeLesson.title}. ${activeLesson.summary}. ${activeLesson.contentMarkdown}`)}
                style={{
                  background: isSpeaking ? '#FEF2F2' : '#F0F9FF',
                  color: isSpeaking ? '#EF4444' : '#0284C7',
                  border: isSpeaking ? '1.5px solid #FCA5A5' : '1.5px solid #7DD3FC',
                  borderRadius: 999,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                {isSpeaking ? <Square size={13} fill="#EF4444" /> : <Volume2 size={14} />}
                {isSpeaking ? 'Stop Narration' : '🔊 Listen to Lesson'}
              </button>
              <Clock size={13} /> {activeLesson.readTimeMin} min read
              {isDone && <span style={{ color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={14} /> Completed</span>}
            </div>
          </div>
          <h1 id="lesson-title" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 'clamp(1.4rem,3vw,2rem)', color: '#0C1A27', marginBottom: 8 }}>
            {activeLesson.title}
          </h1>
          <p style={{ color: '#475569', fontSize: '0.95rem' }}>{activeLesson.summary}</p>
        </div>

        {/* Content */}
        <div className="card" style={{ lineHeight: 1.75, color: '#334155' }}>
          {activeLesson.contentMarkdown.split('\n\n').map((p, i) => {
            if (p.startsWith('### ')) return <h3 key={i} style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.15rem', color: '#0C1A27', borderBottom: '2px solid #BAE6FD', paddingBottom: 6, marginBottom: 8, marginTop: 16 }}>{p.replace('### ', '')}</h3>;
            if (p.startsWith('#### ')) return <h4 key={i} style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '0.95rem', color: '#0284C7', marginTop: 12 }}>{p.replace('#### ', '')}</h4>;
            if (p.startsWith('> ')) return <blockquote key={i} style={{ background: '#E0F2FE', borderLeft: '4px solid #0EA5E9', borderRadius: 10, padding: '0.9rem 1.1rem', color: '#0369A1', fontStyle: 'italic', margin: '8px 0' }}>{p.replace('> ', '')}</blockquote>;
            return <p key={i} style={{ marginBottom: 6 }}>{p}</p>;
          })}
        </div>

        {/* Interactive compound slider */}
        {activeLesson.interactiveType === 'compound-slider' && (
          <div id="compound-slider-widget" className="card" style={{ border: '2px solid #BAE6FD', background: '#F0F9FF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Zap size={18} color="#0EA5E9" />
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: '#0C1A27' }}>Interactive Compound Growth Sandbox</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#64748B', display: 'block', marginBottom: 4, fontWeight: 600 }}>Initial Deposit: ${sliderPrincipal}</label>
                <input id="slider-principal" type="range" min={100} max={10000} step={100} value={sliderPrincipal} onChange={e => setSliderPrincipal(+e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#64748B', display: 'block', marginBottom: 4, fontWeight: 600 }}>Monthly: ${sliderMonthly}</label>
                <input id="slider-monthly" type="range" min={25} max={2000} step={25} value={sliderMonthly} onChange={e => setSliderMonthly(+e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#64748B', display: 'block', marginBottom: 4, fontWeight: 600 }}>Years: {sliderYears}</label>
                <input id="slider-years" type="range" min={5} max={40} value={sliderYears} onChange={e => setSliderYears(+e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              {[
                { label: 'Total Invested', val: formatCurrency(finalPoint.totalContributions), color: '#475569' },
                { label: 'Portfolio Value (8%)', val: formatCurrency(finalPoint.nominalBalance), color: '#0EA5E9' },
                { label: 'Interest Earned', val: '+' + formatCurrency(finalPoint.interestEarned), color: '#10B981' },
              ].map(s => (
                <div key={s.label} style={{ background: 'white', borderRadius: 12, padding: '0.85rem', border: '1px solid #BAE6FD', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '1rem', color: s.color }}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Benefits & Mistakes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          <div className="card" style={{ borderTop: '3px solid #10B981' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontFamily: "'Outfit', sans-serif", fontWeight: 800, marginBottom: 12 }}>
              <ShieldCheck size={17} /> Key Takeaways
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeLesson.benefits.map((b, i) => (
                <li key={i} style={{ display: 'flex', gap: 8, fontSize: '0.85rem', color: '#334155' }}>
                  <CheckCircle2 size={15} color="#10B981" style={{ flexShrink: 0, marginTop: 2 }} /> {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="card" style={{ borderTop: '3px solid #F59E0B' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#B45309', fontFamily: "'Outfit', sans-serif", fontWeight: 800, marginBottom: 12 }}>
              <AlertCircle size={17} /> Common Pitfalls
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeLesson.commonMistakes.map((m, i) => (
                <li key={i} style={{ display: 'flex', gap: 8, fontSize: '0.85rem', color: '#334155' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B', flexShrink: 0, marginTop: 7 }} /> {m}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Quiz */}
        <div id="lesson-quiz" className="card" style={{ borderTop: '4px solid #6366F1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HelpCircle size={22} color="#6366F1" />
            </div>
            <div>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: '1.1rem', color: '#0C1A27' }}>Knowledge Check</h2>
              <p style={{ fontSize: '0.78rem', color: '#64748B' }}>Answer all questions to complete this lesson</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {activeLesson.quiz.map((q, qi) => {
              const sel = userAnswers[q.id];
              return (
                <div key={q.id} id={`quiz-question-${qi}`} style={{ background: '#F8FBFF', borderRadius: 14, padding: '1rem', border: '1.5px solid #BAE6FD' }}>
                  <p style={{ fontWeight: 700, color: '#0C1A27', marginBottom: 12, fontSize: '0.95rem' }}>
                    {qi + 1}. {q.question}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {q.options.map((opt, oi) => {
                      let bg = 'white', border = '#E2E8F0', color = '#334155';
                      if (quizSubmitted) {
                        if (oi === q.correctIndex) { bg = '#ECFDF5'; border = '#10B981'; color = '#065F46'; }
                        else if (sel === oi && oi !== q.correctIndex) { bg = '#FEF2F2'; border = '#EF4444'; color = '#991B1B'; }
                      } else if (sel === oi) {
                        bg = '#E0F2FE'; border = '#0EA5E9'; color = '#0C4A6E';
                      }
                      return (
                        <button
                          key={oi}
                          id={`quiz-q${qi}-opt${oi}`}
                          onClick={() => handleSelectAnswer(q.id, oi)}
                          disabled={quizSubmitted}
                          style={{
                            width: '100%', textAlign: 'left', padding: '0.7rem 1rem',
                            borderRadius: 10, border: `1.5px solid ${border}`, background: bg, color,
                            fontSize: '0.87rem', fontWeight: sel === oi ? 600 : 400,
                            cursor: quizSubmitted ? 'default' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            fontFamily: "'Inter', sans-serif", transition: 'all 0.12s',
                          }}
                        >
                          <span>{opt}</span>
                          {quizSubmitted && oi === q.correctIndex && <CheckCircle2 size={16} color="#10B981" />}
                          {quizSubmitted && sel === oi && oi !== q.correctIndex && <XCircle size={16} color="#EF4444" />}
                        </button>
                      );
                    })}
                  </div>
                  {quizSubmitted && (
                    <div style={{ marginTop: 10, padding: '0.65rem 0.9rem', background: '#EEF2FF', borderRadius: 10, fontSize: '0.8rem', color: '#4338CA' }}>
                      <strong>Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!quizSubmitted ? (
            <button
              id="btn-submit-quiz"
              className="btn btn-primary btn-full"
              style={{ marginTop: 20, padding: '0.9rem' }}
              onClick={handleSubmitQuiz}
              disabled={Object.keys(userAnswers).length < activeLesson.quiz.length}
            >
              <Award size={18} /> Submit Answers
            </button>
          ) : (
            <div id="quiz-result" style={{ marginTop: 20, background: '#ECFDF5', border: '1.5px solid #10B981', borderRadius: 14, padding: '1.25rem', textAlign: 'center' }}>
              <h3 style={{ color: '#059669', fontFamily: "'Outfit', sans-serif", fontWeight: 900, marginBottom: 6 }}>Lesson Complete! 🎉</h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: 12 }}>Your score has been saved.</p>
              <button id="btn-back-after-quiz" className="btn btn-secondary btn-sm" onClick={backToModules}>Back to Modules</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── MODULE DIRECTORY VIEW ── */
  const categories = [
    { id: 'all', label: 'All' },
    { id: 'basics', label: 'Basics' },
    { id: 'investment-types', label: 'ETFs & Assets' },
    { id: 'retirement-accounts', label: 'Retirement' },
    { id: 'mistakes', label: 'Mistakes' },
  ];

  const filteredModules = activeCategory === 'all'
    ? LEARNING_MODULES
    : LEARNING_MODULES.filter(m => m.category === activeCategory);

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 id="learning-center-title" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 'clamp(1.5rem,3vw,2rem)', color: '#0C1A27' }}>Investing Learning Center</h1>
        <p style={{ color: '#64748B', marginTop: 4 }}>Structured visual modules built for beginner investors.</p>
      </div>

      {/* Category pills */}
      <div id="category-filter" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {categories.map(c => (
          <button
            key={c.id}
            id={`category-${c.id}`}
            className={`btn btn-sm ${activeCategory === c.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 999 }}
            onClick={() => setActiveCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Modules */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {filteredModules.map(mod => (
          <div key={mod.id} id={`module-${mod.id}`} className="card">
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#0C1A27', marginBottom: 4 }}>{mod.title}</h2>
            <p style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '1rem' }}>{mod.description}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
              {mod.lessons.map(lesson => {
                const done = progress.completedLessonIds.includes(lesson.id);
                return (
                  <button
                    key={lesson.id}
                    id={`lesson-btn-${lesson.id}`}
                    onClick={() => onSelectLesson(lesson.id)}
                    className="card-interactive"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.9rem 1rem', background: done ? '#F0FDF4' : 'white',
                      border: `1.5px solid ${done ? '#6EE7B7' : '#BAE6FD'}`,
                      borderRadius: 12, cursor: 'pointer', textAlign: 'left', width: '100%',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: done ? '#059669' : '#0C1A27' }}>{lesson.title}</span>
                        {done && <CheckCircle2 size={14} color="#10B981" />}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} /> {lesson.readTimeMin} min
                      </div>
                    </div>
                    <ChevronRight size={18} color="#94A3B8" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
