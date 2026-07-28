import React from 'react';
import { NavTab, UserProgressState } from '../../types';
import { LEARNING_MODULES } from '../../data/learningContent';
import {
  BookOpen, Search, Target, PieChart, Calculator,
  CheckCircle2, ArrowRight, Flame, Award, TrendingUp,
  ShieldAlert, Zap
} from 'lucide-react';
import { formatCurrency } from '../../utils/financialMath';

interface DashboardViewProps {
  setActiveTab: (tab: NavTab) => void;
  progress: UserProgressState;
  onSelectLesson: (lessonId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab, progress, onSelectLesson }) => {
  const totalLessons = LEARNING_MODULES.reduce((a, m) => a + m.lessons.length, 0);
  const completedCount = progress.completedLessonIds.length;
  const progressPercent = Math.round((completedCount / totalLessons) * 100);

  // Find next uncompleted lesson
  let nextLesson = LEARNING_MODULES[0].lessons[0];
  outer: for (const m of LEARNING_MODULES) {
    for (const l of m.lessons) {
      if (!progress.completedLessonIds.includes(l.id)) {
        nextLesson = l;
        break outer;
      }
    }
  }

  const tools: { id: NavTab; label: string; desc: string; icon: React.ReactNode; color: string; bg: string }[] = [
    { id: 'learn',              label: 'Investing Learning Center', desc: 'Visual lessons on ETFs, stocks, Roth IRAs, and compounding.',              icon: <BookOpen size={22} />,   color: '#0284C7', bg: '#E0F2FE' },
    { id: 'etf-explorer',       label: 'ETF Explorer',              desc: 'Research VOO, VTI, SCHD — live prices, expense ratios, sector splits.',    icon: <Search size={22} />,     color: '#0369A1', bg: '#BAE6FD' },
    { id: 'retirement-planner', label: 'Retirement Projection',     desc: 'Simulate monthly deposits vs inflation-adjusted purchasing power.',         icon: <Target size={22} />,     color: '#6366F1', bg: '#EEF2FF' },
    { id: 'calculators',        label: 'Calculator Suite',          desc: 'Compound interest, DCA, DRIP, and inflation calculators.',                  icon: <Calculator size={22} />, color: '#F59E0B', bg: '#FFFBEB' },
    { id: 'portfolio-builder',  label: 'Portfolio Builder',         desc: 'Compare Conservative, Moderate, and Aggressive allocations.',               icon: <PieChart size={22} />,   color: '#10B981', bg: '#ECFDF5' },
    { id: 'mistakes',           label: 'Costly Mistakes',           desc: 'Avoid panic selling, market timing, and high expense ratios.',              icon: <ShieldAlert size={22} />, color: '#EF4444', bg: '#FEF2F2' },
  ];

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* ── Hero Card (Cash App style big blue card) ── */}
      <div
        id="dashboard-hero"
        style={{
          background: 'linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)',
          borderRadius: 24,
          padding: '2rem 2rem',
          color: 'white',
          boxShadow: '0 12px 40px rgba(14,165,233,0.35)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: 60, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 999, padding: '0.3rem 0.9rem', fontSize: '0.78rem', fontWeight: 700, marginBottom: '1rem', backdropFilter: 'blur(4px)' }}>
            <Zap size={13} />
            <span>Welcome to Haftora</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.5rem)', fontFamily: "'Outfit', sans-serif", fontWeight: 900, lineHeight: 1.15, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
            Investing Doesn't Have<br />to Be Complicated.
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.85)', maxWidth: 480, marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Learn how compound growth works, explore ETFs, simulate retirement, and build smart financial habits — all without jargon.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button
              id="btn-start-learning"
              className="btn btn-sm"
              onClick={() => { setActiveTab('learn'); onSelectLesson(nextLesson.id); }}
              style={{ background: 'white', color: '#0284C7', fontWeight: 800, borderRadius: 999, boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}
            >
              Start Learning <ArrowRight size={15} />
            </button>
            <button
              id="btn-goto-planner"
              className="btn btn-sm"
              onClick={() => setActiveTab('retirement-planner')}
              style={{ background: 'rgba(255,255,255,0.18)', color: 'white', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 999, backdropFilter: 'blur(4px)' }}
            >
              <Target size={15} /> Simulate Retirement
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats Row (Cash App card trifecta) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>

        {/* Learning Progress */}
        <div id="stat-learning-progress" className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Progress</div>
          <div className="stat-number stat-lg">{progressPercent}%</div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 4 }}>{completedCount}/{totalLessons} Lessons</div>
          <div className="progress-track" style={{ marginTop: 10 }}>
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Streak */}
        <div id="stat-streak" className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Daily Streak</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Flame size={24} color="#F59E0B" fill="#F59E0B" />
            <span className="stat-number stat-lg" style={{ color: '#F59E0B' }}>{progress.streakDays}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 4 }}>Days Active</div>
        </div>

        {/* Quizzes */}
        <div id="stat-quizzes" className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Quizzes</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Award size={24} color="#6366F1" />
            <span className="stat-number stat-lg" style={{ color: '#6366F1' }}>{Object.keys(progress.quizScores).length}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 4 }}>Passed</div>
        </div>
      </div>

      {/* ── Next Lesson Card ── */}
      <div
        id="next-lesson-card"
        className="card"
        style={{
          borderLeft: '4px solid #0EA5E9',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span className="badge badge-blue">Next Up</span>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{nextLesson.readTimeMin} min read</span>
          </div>
          <h2 style={{ fontSize: '1.15rem', fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: '#0C1A27', marginBottom: 4 }}>
            {nextLesson.title}
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#475569', maxWidth: 520 }}>{nextLesson.summary}</p>
        </div>
        <button
          id="btn-start-next-lesson"
          className="btn btn-primary"
          onClick={() => { setActiveTab('learn'); onSelectLesson(nextLesson.id); }}
        >
          Start Lesson <ArrowRight size={16} />
        </button>
      </div>

      {/* ── Tools Grid ── */}
      <div>
        <h2 style={{ fontSize: '1.15rem', fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: '#0C1A27', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={20} color="#0EA5E9" />
          Learning Modules & Tools
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {tools.map((t) => (
            <button
              key={t.id}
              id={`tool-card-${t.id}`}
              onClick={() => setActiveTab(t.id)}
              className="card card-interactive"
              style={{ textAlign: 'left', cursor: 'pointer', border: `1.5px solid ${t.bg}`, background: 'white' }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.color, marginBottom: '0.75rem' }}>
                {t.icon}
              </div>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '0.95rem', color: '#0C1A27', marginBottom: 4 }}>{t.label}</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: 1.5 }}>{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Wisdom Banner ── */}
      <div
        id="wisdom-banner"
        className="card"
        style={{ borderLeft: '4px solid #6366F1', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', background: '#F8F8FF' }}
      >
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Golden Rule of Investing</div>
          <p style={{ fontSize: '0.95rem', color: '#334155', fontStyle: 'italic', fontWeight: 500 }}>
            "Time in the market beats timing the market. Start early, stay consistent."
          </p>
        </div>
        <button
          id="btn-avoid-mistakes"
          className="btn btn-secondary btn-sm"
          onClick={() => setActiveTab('mistakes')}
        >
          <ShieldAlert size={15} color="#EF4444" /> Mistakes to Avoid
        </button>
      </div>

    </div>
  );
};
