import React from 'react';
import { UserProgressState } from '../../types';
import { formatCurrency } from '../../utils/financialMath';
import { User, Award, Flame, BookOpen, Save, Trash2, CheckCircle2, Target, ShieldCheck } from 'lucide-react';

interface ProfileViewProps {
  progress: UserProgressState;
  onResetProgress: () => void;
  onDeleteScenario: (id: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ progress, onResetProgress, onDeleteScenario }) => {
  const badges = [
    { id: 'badge-first-step', name: 'First Step Investor', desc: 'Completed your first lesson',          icon: <BookOpen size={20}/>,       unlocked: progress.completedLessonIds.length >= 1 },
    { id: 'badge-quiz-whiz',  name: 'Quiz Master',         desc: 'Passed 3+ knowledge check quizzes',   icon: <Award size={20}/>,           unlocked: Object.keys(progress.quizScores).length >= 3 },
    { id: 'badge-streak',     name: 'Consistent Learner',  desc: 'Maintained a daily learning streak',   icon: <Flame size={20}/>,           unlocked: progress.streakDays >= 1 },
    { id: 'badge-planner',    name: 'Future Planner',      desc: 'Saved your first simulation scenario', icon: <Target size={20}/>,          unlocked: progress.savedScenarios.length >= 1 },
  ];

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Hero */}
      <div id="profile-hero" className="card" style={{ borderLeft: '4px solid #0EA5E9', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#0EA5E9,#0284C7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(14,165,233,0.35)' }}>
            <User size={28} color="white" />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: '1.4rem', color: '#0C1A27' }}>Learner Profile</h1>
            <p style={{ fontSize: '0.8rem', color: '#64748B' }}>Tracking your investing education journey</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FFFBEB', border: '1.5px solid #FCD34D', borderRadius: 999, padding: '0.4rem 1rem', color: '#92400E', fontWeight: 700, fontSize: '0.85rem' }}>
          <Flame size={16} color="#F59E0B" fill="#F59E0B" />
          {progress.streakDays} Day Streak
        </div>
      </div>

      {/* Badges */}
      <div>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#0C1A27', display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
          <Award size={20} color="#0EA5E9" /> Achievement Badges
        </h2>
        <div id="badges-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px,1fr))', gap: '0.85rem' }}>
          {badges.map(b => (
            <div key={b.id} id={b.id} className="card" style={{
              opacity: b.unlocked ? 1 : 0.45,
              border: b.unlocked ? '1.5px solid #7DD3FC' : '1.5px solid #BAE6FD',
              background: b.unlocked ? '#F0F9FF' : 'white',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: b.unlocked ? '#E0F2FE' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: b.unlocked ? '#0284C7' : '#94A3B8' }}>
                  {b.icon}
                </div>
                {b.unlocked && <CheckCircle2 size={18} color="#10B981" />}
              </div>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '0.9rem', color: '#0C1A27', marginBottom: 3 }}>{b.name}</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B' }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Saved Scenarios */}
      <div>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#0C1A27', display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
          <Save size={20} color="#6366F1" /> Saved Scenarios ({progress.savedScenarios.length})
        </h2>
        {progress.savedScenarios.length === 0 ? (
          <div id="no-scenarios" className="card" style={{ textAlign: 'center', padding: '2.5rem', color: '#94A3B8' }}>
            No saved scenarios yet. Use the Retirement Planner to save your simulations!
          </div>
        ) : (
          <div id="scenarios-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: '0.85rem' }}>
            {progress.savedScenarios.map(s => (
              <div key={s.id} id={`scenario-${s.id}`} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div>
                  <span className="badge badge-blue" style={{ marginBottom: 6 }}>{s.type}</span>
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '0.9rem', color: '#0C1A27', marginBottom: 3 }}>{s.title}</h3>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#0EA5E9', fontSize: '0.95rem' }}>{formatCurrency(s.projectedValue)}</div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 2 }}>Saved {s.createdAt}</div>
                </div>
                <button id={`delete-scenario-${s.id}`} onClick={() => onDeleteScenario(s.id)} aria-label="Delete scenario"
                  className="btn btn-danger btn-sm" style={{ padding: '0.45rem 0.7rem', flexShrink: 0 }}>
                  <Trash2 size={14}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reset */}
      <div style={{ paddingTop: '1rem', borderTop: '1.5px solid #E0F2FE', display: 'flex', justifyContent: 'flex-end' }}>
        <button id="btn-reset-progress" className="btn btn-danger btn-sm" onClick={onResetProgress}>
          <Trash2 size={14}/> Reset All Progress
        </button>
      </div>

    </div>
  );
};
