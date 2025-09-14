// Client-side analytics types (mirrors server types)

export interface AttemptData {
  id: string;
  challengeId: string;
  userId: string;
  startTime: string;
  endTime: string;
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
  lastUpdated: string;
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
  lastActivityDate: string;
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
  startTime: string;
  endTime: string;
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
  calculatedAt: string;
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
  unlockedAt?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface LearningGoal {
  id: string;
  userId: string;
  type: 'accuracy' | 'speed' | 'streak' | 'completion' | 'mastery';
  target: number;
  current: number;
  deadline?: string;
  isActive: boolean;
  createdAt: string;
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
  timestamp: string;
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

// UI-specific types for analytics components
export interface AnalyticsChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
}

export interface PerformanceTrendData {
  accuracy: TimeSeriesPoint[];
  speed: TimeSeriesPoint[];
  difficulty: TimeSeriesPoint[];
}

export interface RealmComparisonData {
  realmId: string;
  realmName: string;
  accuracy: number;
  averageTime: number;
  completionRate: number;
  color: string;
}

export interface ConceptMasteryData {
  concept: string;
  masteryLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  accuracy: number;
  confidence: number;
  recentActivity: number;
}

export interface LearningPathData {
  currentLevel: string;
  nextMilestone: string;
  progress: number;
  estimatedTimeToComplete: number;
  recommendedActions: string[];
}