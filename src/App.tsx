import React, { useState, useEffect } from 'react';
import { NavTab, UserProgressState, SavedScenario } from './types';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { DashboardView } from './components/views/DashboardView';
import { LearningCenterView } from './components/views/LearningCenterView';
import { ETFExplorerView } from './components/views/ETFExplorerView';
import { MarketSearchView } from './components/views/MarketSearchView';
import { RetirementPlannerView } from './components/views/RetirementPlannerView';
import { PortfolioBuilderView } from './components/views/PortfolioBuilderView';
import { CalculatorsView } from './components/views/CalculatorsView';
import { InvestingMistakesView } from './components/views/InvestingMistakesView';
import { ProfileView } from './components/views/ProfileView';
import { ChatWidget } from './components/ChatWidget';

const STORAGE_KEY = 'haftora_user_progress_v1';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  const getTodayString = () => new Date().toISOString().split('T')[0];
  const getYesterdayString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const getInitialProgress = (): UserProgressState => ({
    completedLessonIds: [],
    quizScores: {},
    streakDays: 1,
    lastActiveDate: getTodayString(),
    savedScenarios: []
  });

  // Initialize User Progress State
  const [progress, setProgress] = useState<UserProgressState>(getInitialProgress);

  // Sync state when login user changes
  const handleUserChange = (user: any | null) => {
    setCurrentUser(user);
    if (user) {
      // Restore user progress from user metadata or logged-in localStorage
      const userMetadataProgress = user.user_metadata?.haftora_progress;
      const savedLocal = localStorage.getItem(STORAGE_KEY);
      if (userMetadataProgress) {
        setProgress(userMetadataProgress);
      } else if (savedLocal) {
        try {
          setProgress(JSON.parse(savedLocal));
        } catch {
          setProgress(getInitialProgress());
        }
      }
    } else {
      // Guest user logged out or initial load as guest — reset to fresh in-memory state
      localStorage.removeItem(STORAGE_KEY);
      setProgress(getInitialProgress());
    }
  };

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

  // Persist progress ONLY if user is logged in. Guests' progress disappears on page refresh.
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      // Optionally sync to Netlify Identity user metadata if method exists
      if (typeof currentUser.update === 'function') {
        currentUser.update({ data: { haftora_progress: progress } }).catch(() => {});
      }
    }
  }, [progress, currentUser]);

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
        onUserChange={handleUserChange}
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

        {activeTab === 'market-search' && (
          <MarketSearchView />
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

      {/* Captain Luffy Straw Hat RAG Investing Chatbot */}
      <ChatWidget />
    </div>
  );
};
