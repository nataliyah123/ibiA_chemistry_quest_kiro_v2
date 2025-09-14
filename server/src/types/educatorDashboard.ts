export interface StudentProgress {
  studentId: string;
  studentName: string;
  email: string;
  classId: string;
  overallProgress: number;
  realmProgress: RealmProgress[];
  weakAreas: WeakArea[];
  strengths: string[];
  lastActivity: Date;
  totalTimeSpent: number;
  challengesCompleted: number;
  averageScore: number;
  streakDays: number;
  badges: Badge[];
  recommendations: Recommendation[];
}

export interface RealmProgress {
  realmId: string;
  realmName: string;
  progress: number;
  challengesCompleted: number;
  totalChallenges: number;
  averageScore: number;
  timeSpent: number;
  lastAccessed: Date;
  difficulty: number;
}

export interface WeakArea {
  topic: string;
  curriculum: string;
  successRate: number;
  attemptsCount: number;
  lastAttempt: Date;
  recommendedActions: string[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  earnedAt: Date;
  category: string;
}

export interface Recommendation {
  type: 'content' | 'practice' | 'review' | 'challenge';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  contentId?: string;
  estimatedTime: number;
  reason: string;
}

export interface ClassManagement {
  classId: string;
  className: string;
  description: string;
  educatorId: string;
  students: ClassStudent[];
  curriculum: 'o_level' | 'a_level';
  subject: string;
  academicYear: string;
  createdAt: Date;
  isActive: boolean;
  settings: ClassSettings;
}

export interface ClassStudent {
  studentId: string;
  studentName: string;
  email: string;
  joinedAt: Date;
  status: 'active' | 'inactive' | 'pending';
  parentEmail?: string;
  customSettings?: StudentSettings;
}

export interface ClassSettings {
  allowSelfEnrollment: boolean;
  requireParentConsent: boolean;
  shareProgressWithParents: boolean;
  defaultDifficulty: number;
  enableCompetitiveFeatures: boolean;
  contentFilters: string[];
  assignmentDeadlines: boolean;
}

export interface StudentSettings {
  difficultyOverride?: number;
  disabledRealms?: string[];
  extendedTime?: boolean;
  customGoals?: string[];
}

export interface PerformanceReport {
  reportId: string;
  type: 'individual' | 'class' | 'curriculum' | 'comparative';
  title: string;
  description: string;
  generatedAt: Date;
  generatedBy: string;
  timeRange: {
    startDate: Date;
    endDate: Date;
  };
  filters: ReportFilters;
  data: ReportData;
  insights: ReportInsight[];
  recommendations: ReportRecommendation[];
}

export interface ReportFilters {
  studentIds?: string[];
  classIds?: string[];
  realms?: string[];
  curriculum?: string[];
  topics?: string[];
  difficultyRange?: { min: number; max: number };
  dateRange?: { start: Date; end: Date };
}

export interface ReportData {
  summary: ReportSummary;
  trends: TrendData[];
  comparisons: ComparisonData[];
  distributions: DistributionData[];
  correlations: CorrelationData[];
}

export interface ReportSummary {
  totalStudents: number;
  totalAttempts: number;
  averageScore: number;
  averageTimeSpent: number;
  completionRate: number;
  improvementRate: number;
  engagementScore: number;
}

export interface TrendData {
  metric: string;
  timePoints: TimePoint[];
  trend: 'increasing' | 'decreasing' | 'stable';
  changeRate: number;
}

export interface TimePoint {
  date: Date;
  value: number;
  count?: number;
}

export interface ComparisonData {
  category: string;
  groups: ComparisonGroup[];
  significantDifferences: boolean;
}

export interface ComparisonGroup {
  name: string;
  value: number;
  count: number;
  standardDeviation?: number;
}

export interface DistributionData {
  metric: string;
  bins: DistributionBin[];
  mean: number;
  median: number;
  standardDeviation: number;
}

export interface DistributionBin {
  range: { min: number; max: number };
  count: number;
  percentage: number;
}

export interface CorrelationData {
  metric1: string;
  metric2: string;
  correlation: number;
  significance: number;
  interpretation: string;
}

export interface ReportInsight {
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  title: string;
  description: string;
  evidence: string[];
  confidence: number;
  impact: 'low' | 'medium' | 'high';
}

export interface ReportRecommendation {
  type: 'intervention' | 'content' | 'strategy' | 'assessment';
  title: string;
  description: string;
  targetStudents?: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedImpact: string;
  implementationSteps: string[];
  resources?: string[];
}

export interface InterventionAlert {
  alertId: string;
  studentId: string;
  studentName: string;
  classId: string;
  type: 'performance_drop' | 'disengagement' | 'difficulty_spike' | 'no_progress' | 'struggling';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  detectedAt: Date;
  metrics: AlertMetric[];
  suggestedActions: string[];
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  notes?: string;
}

export interface AlertMetric {
  name: string;
  currentValue: number;
  previousValue: number;
  threshold: number;
  unit: string;
}

export interface ParentCommunication {
  communicationId: string;
  studentId: string;
  parentEmail: string;
  type: 'progress_report' | 'achievement' | 'concern' | 'recommendation';
  subject: string;
  content: string;
  attachments?: string[];
  sentAt: Date;
  sentBy: string;
  isRead: boolean;
  readAt?: Date;
  response?: string;
  responseAt?: Date;
}

export interface ContentEffectiveness {
  contentId: string;
  contentTitle: string;
  contentType: string;
  curriculum: string;
  topic: string;
  difficulty: number;
  usage: ContentUsageStats;
  performance: ContentPerformanceStats;
  engagement: ContentEngagementStats;
  feedback: ContentFeedbackStats;
  effectiveness: EffectivenessScore;
  recommendations: ContentRecommendation[];
}

export interface ContentUsageStats {
  totalAttempts: number;
  uniqueUsers: number;
  averageAttempts: number;
  completionRate: number;
  abandonmentRate: number;
  retryRate: number;
}

export interface ContentPerformanceStats {
  averageScore: number;
  scoreDistribution: number[];
  averageTime: number;
  timeDistribution: number[];
  successRate: number;
  improvementRate: number;
}

export interface ContentEngagementStats {
  averageEngagementTime: number;
  interactionRate: number;
  hintUsageRate: number;
  helpRequestRate: number;
  satisfactionScore: number;
}

export interface ContentFeedbackStats {
  totalFeedback: number;
  averageRating: number;
  difficultyRating: number;
  clarityRating: number;
  engagementRating: number;
  commonComments: string[];
}

export interface EffectivenessScore {
  overall: number;
  learning: number;
  engagement: number;
  accessibility: number;
  efficiency: number;
  factors: EffectivenessFactor[];
}

export interface EffectivenessFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
}

export interface ContentRecommendation {
  type: 'improve' | 'replace' | 'supplement' | 'remove';
  priority: 'low' | 'medium' | 'high';
  description: string;
  expectedImpact: string;
  effort: 'low' | 'medium' | 'high';
}