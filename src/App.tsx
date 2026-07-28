import React, { useState, useEffect } from 'react';
import { NavTab, UserProgressState, SavedScenario } from './types';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { DashboardView } from './components/views/DashboardView';
import { LearningCenterView } from './components/views/LearningCenterView';
import { ETFExplorerView } from './components/views/ETFExplorerView';
import { RetirementPlannerView } from './components/views/RetirementPlannerView';
import { PortfolioBuilderView } from './components/views/PortfolioBuilderView';
import { CalculatorsView } from './components/views/CalculatorsView';
import { InvestingMistakesView } from './components/views/InvestingMistakesView';
import { ProfileView } from './components/views/ProfileView';

const STORAGE_KEY = 'haftora_user_progress_v1';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  const getTodayString = () => new Date().toISOString().split('T')[0];
  const getYesterdayString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  // Initialize User Progress State with real calendar date streak tracking
  const [progress, setProgress] = useState<UserProgressState>(() => {
    const today = getTodayString();
    const yesterday = getYesterdayString();
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as UserProgressState;
        const lastActive = parsed.lastActiveDate;

        let streak = parsed.streakDays || 1;
        if (!lastActive) {
          streak = 1;
        } else if (lastActive !== today && lastActive !== yesterday) {
          // Missed a day — reset streak to 1
          streak = 1;
        }

        return {
          ...parsed,
          streakDays: streak,
          lastActiveDate: lastActive || today,
        };
      } catch (e) {
        console.error('Failed to parse user progress', e);
      }
    }
    return {
      completedLessonIds: [],
      quizScores: {},
      streakDays: 1,
      lastActiveDate: today,
      savedScenarios: []
    };
  });

  // Helper to record activity and increment streak on calendar days
  const recordActivity = () => {
    const today = getTodayString();
    const yesterday = getYesterdayString();

    setProgress((prev) => {
      if (prev.lastActiveDate === today) return prev; // Already recorded today

      const newStreak = prev.lastActiveDate === yesterday ? prev.streakDays + 1 : 1;
      return {
        ...prev,
        lastActiveDate: today,
        streakDays: newStreak,
      };
    });
  };

  // Persist state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  // Handler for lesson completion
  const handleCompleteLesson = (lessonId: string, quizScore: number) => {
    recordActivity();
    setProgress((prev) => {
      const alreadyCompleted = prev.completedLessonIds.includes(lessonId);
      const updatedCompleted = alreadyCompleted
        ? prev.completedLessonIds
        : [...prev.completedLessonIds, lessonId];

      return {
        ...prev,
        completedLessonIds: updatedCompleted,
        quizScores: {
          ...prev.quizScores,
          [lessonId]: Math.max(prev.quizScores[lessonId] || 0, quizScore)
        }
      };
    });
  };

  // Handler for saving scenarios
  const handleSaveScenario = (scenario: SavedScenario) => {
    recordActivity();
    setProgress((prev) => ({
      ...prev,
      savedScenarios: [scenario, ...prev.savedScenarios]
    }));
  };

  // Handler for deleting scenarios
  const handleDeleteScenario = (id: string) => {
    setProgress((prev) => ({
      ...prev,
      savedScenarios: prev.savedScenarios.filter((s) => s.id !== id)
    }));
  };

  // Handler for resetting progress
  const handleResetProgress = () => {
    if (window.confirm('Are you sure you want to reset all your learning progress and saved scenarios?')) {
      const resetState: UserProgressState = {
        completedLessonIds: [],
        quizScores: {},
        streakDays: 1,
        lastActiveDate: getTodayString(),
        savedScenarios: []
      };
      setProgress(resetState);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resetState));
    }
  };

  const handleSelectLesson = (lessonId: string | null) => {
    setSelectedLessonId(lessonId);
    if (activeTab !== 'learn') {
      setActiveTab('learn');
    }
  };

  return (
    <div className="app-wrapper bg-[#0b0f17] text-gray-100 min-h-screen flex flex-col font-['Inter']">
      
      {/* Educational Regulatory Banner */}
      <DisclaimerBanner />

      {/* Responsive App Header */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        streakDays={progress.streakDays} 
      />

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === 'dashboard' && (
          <DashboardView 
            setActiveTab={setActiveTab}
            progress={progress}
            onSelectLesson={handleSelectLesson}
          />
        )}

        {activeTab === 'learn' && (
          <LearningCenterView 
            selectedLessonId={selectedLessonId}
            onSelectLesson={setSelectedLessonId}
            progress={progress}
            onCompleteLesson={handleCompleteLesson}
          />
        )}

        {activeTab === 'etf-explorer' && (
          <ETFExplorerView />
        )}

        {activeTab === 'retirement-planner' && (
          <RetirementPlannerView onSaveScenario={handleSaveScenario} />
        )}

        {activeTab === 'portfolio-builder' && (
          <PortfolioBuilderView onSaveScenario={handleSaveScenario} />
        )}

        {activeTab === 'calculators' && (
          <CalculatorsView onSaveScenario={handleSaveScenario} />
        )}

        {activeTab === 'mistakes' && (
          <InvestingMistakesView />
        )}

        {activeTab === 'profile' && (
          <ProfileView 
            progress={progress}
            onResetProgress={handleResetProgress}
            onDeleteScenario={handleDeleteScenario}
          />
        )}
      </main>

      {/* Footer with Compliance Notices */}
      <Footer />
    </div>
  );
};
