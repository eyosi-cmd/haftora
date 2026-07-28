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

  // Initialize User Progress State with LocalStorage persistence
  const [progress, setProgress] = useState<UserProgressState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse user progress', e);
      }
    }
    return {
      completedLessonIds: [],
      quizScores: {},
      streakDays: 3, // Default encouraging starter streak
      savedScenarios: []
    };
  });

  // Persist state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  // Handler for lesson completion
  const handleCompleteLesson = (lessonId: string, quizScore: number) => {
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
          <PortfolioBuilderView />
        )}

        {activeTab === 'calculators' && (
          <CalculatorsView />
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
