export type NavTab = 
  | 'dashboard'
  | 'learn'
  | 'etf-explorer'
  | 'retirement-planner'
  | 'portfolio-builder'
  | 'calculators'
  | 'mistakes'
  | 'profile';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  readTimeMin: number;
  summary: string;
  contentMarkdown: string;
  benefits: string[];
  risks: string[];
  commonMistakes: string[];
  quiz: QuizQuestion[];
  interactiveType?: 'compound-slider' | 'inflation-toggle' | 'etf-breakdown' | 'risk-simulator';
}

export interface Module {
  id: string;
  title: string;
  description: string;
  category: 'basics' | 'investment-types' | 'retirement-accounts' | 'mistakes';
  iconName: string;
  lessons: Lesson[];
}

export interface ETFData {
  ticker: string;
  name: string;
  price: number;
  dailyChangePercent: number;
  expenseRatio: number; // e.g. 0.03 = 0.03%
  dividendYield: number; // e.g. 1.5 = 1.5%
  historicalReturn1Yr: number;
  historicalReturn5Yr: number;
  historicalReturn10Yr: number;
  description: string;
  category: 'Total Market' | 'S&P 500' | 'Dividend Growth' | 'International' | 'Tech & Growth' | 'Bonds';
  riskLevel: 'Low' | 'Moderate' | 'High';
  sectorAllocation: { sector: string; percentage: number }[];
  topHoldings: { name: string; percentage: number }[];
}

export interface SavedScenario {
  id: string;
  title: string;
  type: 'retirement' | 'compound' | 'dca' | 'portfolio';
  createdAt: string;
  inputs: Record<string, number | string>;
  projectedValue: number;
}

export interface UserProgressState {
  completedLessonIds: string[];
  quizScores: Record<string, number>; // lessonId -> score
  streakDays: number;
  lastActiveDate?: string; // YYYY-MM-DD
  savedScenarios: SavedScenario[];
}
