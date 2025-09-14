// Analytics and progress tracking types

export interface AttemptData {
  id: string;
  challengeId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  answer: string | string[];
  isCorrect: boolean;
  score: number;
  hintsUsed: number;
  timeElapsed: number;
  metadata: AttemptMetadata;
}

export interface AttemptMetadata {
  deviceType: string;
  browserInfo: string;
  networkCondition?: string;
  difficultyAdjustments: number;
  realmId: string;
  challengeType: string;
  conceptsInvolved: string[];
}

export interface PerformanceMetrics {
  userId: string;
  overallAccuracy: number;
  averageResponseTime: number;
  strongestConcepts: ConceptPerformance[];
  weakestConcepts: ConceptPerformance[];
  learningVelocity: number;
  streakData: StreakData;
  realmProgress: RealmProgress[];
  totalChallengesCompleted: number;
  totalTimeSpent: number;
  lastUpdated: Date;
}

export interface ConceptPerformance {
  concept: string;
  accuracy: number;
  averageTime: number;
  totalAttempts: number;
  recentTrend: 'improving' | 'declining' | 'stable';
  confidenceLevel: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  streakType: 'daily' | 'challenge' | 'perfect_score';
  streakMultiplier: number;
}

export interface RealmProgress {
  realmId: string;
  realmName: string;
  completionPercentage: number;
  averageScore: number;
  timeSpent: number;
  challengesCompleted: number;
  totalChallenges: number;
  strongestChallengeTypes: string[];
  weakestChallengeTypes: string[];
}

export interface WeakArea {
  concept: string;
  challengeType: string;
  realmId: string;
  accuracy: number;
  averageAttempts: number;
  recommendedActions: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface LearningSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  challengesAttempted: string[];
  totalScore: number;
  experienceGained: number;
  conceptsReinforced: string[];
  newConceptsLearned: string[];
  sessionType: 'practice' | 'daily_quest' | 'boss_battle' | 'tournament';
  deviceInfo: DeviceInfo;
}

export interface DeviceInfo {
  type: 'desktop' | 'tablet' | 'mobile';
  browser: string;
  os: string;
  screenSize: string;
  connectionType?: string;
}

export interface LearningVelocityData {
  userId: string;
  timeWindow: 'daily' | 'weekly' | 'monthly';
  conceptsLearned: number;
  challengesCompleted: number;
  accuracyImprovement: number;
  speedImprovement: number;
  difficultyProgression: number;
  calculatedAt: Date;
}

export interface AnalyticsDashboardData {
  performanceMetrics: PerformanceMetrics;
  recentSessions: LearningSession[];
  weakAreas: WeakArea[];
  achievements: AchievementProgress[];
  learningGoals: LearningGoal[];
  recommendations: PersonalizedRecommendation[];
}

export interface AchievementProgress {
  achievementId: string;
  name: string;
  description: string;
  category: string;
  progress: number;
  target: number;
  isCompleted: boolean;
  unlockedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface LearningGoal {
  id: string;
  userId: string;
  type: 'accuracy' | 'speed' | 'streak' | 'completion' | 'mastery';
  target: number;
  current: number;
  deadline?: Date;
  isActive: boolean;
  createdAt: Date;
  description: string;
}

export interface PersonalizedRecommendation {
  id: string;
  type: 'challenge' | 'realm' | 'concept_review' | 'difficulty_adjustment';
  title: string;
  description: string;
  priority: number;
  challengeId?: string;
  realmId?: string;
  concepts?: string[];
  estimatedTime: number;
  expectedBenefit: string;
}

// Analytics aggregation types
export interface ConceptAnalytics {
  concept: string;
  totalAttempts: number;
  successfulAttempts: number;
  averageScore: number;
  averageTime: number;
  difficultyDistribution: { [difficulty: number]: number };
  timeSeriesData: TimeSeriesPoint[];
}

export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
  metadata?: any;
}

export interface ChallengeAnalytics {
  challengeId: string;
  challengeType: string;
  realmId: string;
  totalAttempts: number;
  averageScore: number;
  averageTime: number;
  completionRate: number;
  difficultyRating: number;
  playerFeedback: number;
}

// Performance calculation interfaces
export interface PerformanceCalculationInput {
  attempts: AttemptData[];
  sessions: LearningSession[];
  timeWindow?: number; // days
  concepts?: string[];
}

export interface PerformanceCalculationResult {
  metrics: PerformanceMetrics;
  trends: PerformanceTrend[];
  predictions: PerformancePrediction[];
}

export interface PerformanceTrend {
  metric: string;
  direction: 'improving' | 'declining' | 'stable';
  rate: number;
  confidence: number;
  timeWindow: number;
}

export interface PerformancePrediction {
  metric: string;
  predictedValue: number;
  confidence: number;
  timeHorizon: number; // days
  factors: string[];
}