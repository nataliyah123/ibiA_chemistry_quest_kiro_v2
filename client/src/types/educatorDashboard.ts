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
  data: ReportData;
  insights: ReportInsight[];
  recommendations: ReportRecommendation[];
}

export interface ReportData {
  summary: ReportSummary;
  trends: TrendData[];
  comparisons: ComparisonData[];
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
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedImpact: string;
  implementationSteps: string[];
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
  suggestedActions: string[];
  isResolved: boolean;
}

export interface ContentEffectiveness {
  contentId: string;
  contentTitle: string;
  contentType: string;
  curriculum: string;
  topic: string;
  difficulty: number;
  effectiveness: EffectivenessScore;
  recommendations: ContentRecommendation[];
}

export interface EffectivenessScore {
  overall: number;
  learning: number;
  engagement: number;
  accessibility: number;
  efficiency: number;
}

export interface ContentRecommendation {
  type: 'improve' | 'replace' | 'supplement' | 'remove';
  priority: 'low' | 'medium' | 'high';
  description: string;
  expectedImpact: string;
  effort: 'low' | 'medium' | 'high';
}