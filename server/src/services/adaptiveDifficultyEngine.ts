import { 
  PerformanceMetrics, 
  AttemptData, 
  ConceptPerformance,
  PersonalizedRecommendation 
} from '../types/analytics';
import { Challenge, ChallengeType } from '../types/game';
import { AnalyticsService } from './analyticsService';

export interface DifficultyAdjustment {
  userId: string;
  challengeType: ChallengeType;
  currentDifficulty: number;
  recommendedDifficulty: number;
  adjustmentReason: string;
  confidence: number;
  effectiveDate: Date;
}

export interface LearningPathNode {
  challengeId: string;
  challengeType: ChallengeType;
  difficulty: number;
  concepts: string[];
  prerequisites: string[];
  estimatedTime: number;
  priority: number;
}

export interface PersonalizedLearningPath {
  userId: string;
  currentLevel: number;
  targetLevel: number;
  path: LearningPathNode[];
  estimatedCompletionTime: number;
  adaptationHistory: DifficultyAdjustment[];
  lastUpdated: Date;
}

export class AdaptiveDifficultyEngine {
  private analyticsService: AnalyticsService;
  private difficultyAdjustments: Map<string, DifficultyAdjustment[]> = new Map();
  private learningPaths: Map<string, PersonalizedLearningPath> = new Map();

  // Configuration constants
  private readonly MIN_ATTEMPTS_FOR_ADJUSTMENT = 3;
  private readonly ACCURACY_TARGET = 0.75; // Target 75% accuracy
  private readonly SPEED_TARGET = 90; // Target 90 seconds average
  private readonly CONFIDENCE_THRESHOLD = 0.7;
  private readonly MAX_DIFFICULTY_JUMP = 2;

  constructor(analyticsService: AnalyticsService) {
    this.analyticsService = analyticsService;
  }

  /**
   * Calculate optimal difficulty for a user and challenge type
   */
  async calculateOptimalDifficulty(
    userId: string, 
    challengeType: ChallengeType,
    currentDifficulty: number = 3
  ): Promise<DifficultyAdjustment> {
    const performanceMetrics = await this.analyticsService.getPerformanceMetrics(userId);
    const conceptPerformance = this.getRelevantConceptPerformance(performanceMetrics, challengeType);
    
    if (conceptPerformance.length === 0) {
      // No data available, start with moderate difficulty
      return {
        userId,
        challengeType,
        currentDifficulty,
        recommendedDifficulty: Math.max(1, currentDifficulty - 1),
        adjustmentReason: 'No performance data available - starting with easier difficulty',
        confidence: 0.5,
        effectiveDate: new Date()
      };
    }

    const avgAccuracy = conceptPerformance.reduce((sum, cp) => sum + cp.accuracy, 0) / conceptPerformance.length;
    const avgTime = conceptPerformance.reduce((sum, cp) => sum + cp.averageTime, 0) / conceptPerformance.length;
    const avgAttempts = conceptPerformance.reduce((sum, cp) => sum + cp.totalAttempts, 0) / conceptPerformance.length;

    // Calculate difficulty adjustment based on performance
    let difficultyAdjustment = 0;
    let adjustmentReason = '';
    let confidence = 0.8;

    // Accuracy-based adjustment
    if (avgAccuracy > 0.9 && avgTime < this.SPEED_TARGET) {
      difficultyAdjustment += 2;
      adjustmentReason += 'High accuracy and fast completion - increasing difficulty. ';
    } else if (avgAccuracy > 0.8 && avgTime < this.SPEED_TARGET * 1.2) {
      difficultyAdjustment += 1;
      adjustmentReason += 'Good performance - slight difficulty increase. ';
    } else if (avgAccuracy < 0.5) {
      difficultyAdjustment -= 2;
      adjustmentReason += 'Low accuracy - decreasing difficulty significantly. ';
    } else if (avgAccuracy < 0.6) {
      difficultyAdjustment -= 1;
      adjustmentReason += 'Below target accuracy - decreasing difficulty. ';
    }

    // Time-based adjustment
    if (avgTime > this.SPEED_TARGET * 2) {
      difficultyAdjustment -= 1;
      adjustmentReason += 'Slow completion times - reducing complexity. ';
    }

    // Confidence adjustment based on data quality
    if (avgAttempts < this.MIN_ATTEMPTS_FOR_ADJUSTMENT) {
      confidence *= 0.6;
      adjustmentReason += 'Limited data available. ';
    }

    // Apply learning curve consideration
    const learningTrend = this.calculateLearningTrend(conceptPerformance);
    if (learningTrend === 'improving') {
      difficultyAdjustment += 0.5;
      adjustmentReason += 'Improving trend detected. ';
    } else if (learningTrend === 'declining') {
      difficultyAdjustment -= 0.5;
      adjustmentReason += 'Declining performance - being conservative. ';
    }

    // Cap the adjustment to prevent dramatic changes
    difficultyAdjustment = Math.max(-this.MAX_DIFFICULTY_JUMP, 
                                   Math.min(this.MAX_DIFFICULTY_JUMP, difficultyAdjustment));

    const recommendedDifficulty = Math.max(1, Math.min(5, 
      Math.round(currentDifficulty + difficultyAdjustment)));

    return {
      userId,
      challengeType,
      currentDifficulty,
      recommendedDifficulty,
      adjustmentReason: adjustmentReason.trim(),
      confidence,
      effectiveDate: new Date()
    };
  }

  /**
   * Apply real-time difficulty adjustment during gameplay
   */
  async adjustDifficultyRealTime(
    userId: string,
    challengeType: ChallengeType,
    recentPerformance: { accuracy: number; averageTime: number; streak: number }
  ): Promise<DifficultyAdjustment | null> {
    const currentAdjustments = this.difficultyAdjustments.get(userId) || [];
    const lastAdjustment = currentAdjustments
      .filter(adj => adj.challengeType === challengeType)
      .sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime())[0];

    const currentDifficulty = lastAdjustment?.recommendedDifficulty || 3;

    // Real-time adjustment triggers
    let shouldAdjust = false;
    let difficultyChange = 0;
    let reason = '';

    // Immediate difficulty increase triggers
    if (recentPerformance.accuracy >= 0.95 && recentPerformance.streak >= 3) {
      difficultyChange = 1;
      reason = 'Excellent recent performance with streak';
      shouldAdjust = true;
    }
    // Immediate difficulty decrease triggers
    else if (recentPerformance.accuracy <= 0.3 && recentPerformance.streak === 0) {
      difficultyChange = -1;
      reason = 'Poor recent performance - providing easier challenges';
      shouldAdjust = true;
    }
    // Speed-based adjustments
    else if (recentPerformance.accuracy >= 0.8 && recentPerformance.averageTime < 30) {
      difficultyChange = 1;
      reason = 'Fast and accurate - ready for harder challenges';
      shouldAdjust = true;
    }

    if (!shouldAdjust) {
      return null;
    }

    const adjustment: DifficultyAdjustment = {
      userId,
      challengeType,
      currentDifficulty,
      recommendedDifficulty: Math.max(1, Math.min(5, currentDifficulty + difficultyChange)),
      adjustmentReason: reason,
      confidence: 0.9, // High confidence for real-time adjustments
      effectiveDate: new Date()
    };

    // Store the adjustment
    const userAdjustments = this.difficultyAdjustments.get(userId) || [];
    userAdjustments.push(adjustment);
    this.difficultyAdjustments.set(userId, userAdjustments);

    return adjustment;
  }

  /**
   * Generate challenge recommendations based on performance
   */
  async generateChallengeRecommendations(userId: string): Promise<PersonalizedRecommendation[]> {
    const performanceMetrics = await this.analyticsService.getPerformanceMetrics(userId);
    const weakAreas = await this.analyticsService.identifyWeakAreas(userId);
    const recommendations: PersonalizedRecommendation[] = [];

    // Recommendations based on weak areas
    for (const weakArea of weakAreas.slice(0, 3)) {
      const difficulty = await this.calculateOptimalDifficulty(
        userId, 
        this.getChallengeTypeFromString(weakArea.challengeType)
      );

      recommendations.push({
        id: `weak-area-${weakArea.concept}`,
        type: 'challenge',
        title: `Practice ${weakArea.concept}`,
        description: `Focus on ${weakArea.concept} with ${difficulty.recommendedDifficulty}/5 difficulty`,
        priority: weakArea.priority === 'high' ? 10 : weakArea.priority === 'medium' ? 7 : 4,
        challengeId: `${weakArea.challengeType}-${difficulty.recommendedDifficulty}`,
        concepts: [weakArea.concept],
        estimatedTime: this.estimateTimeForDifficulty(difficulty.recommendedDifficulty),
        expectedBenefit: `Improve ${weakArea.concept} accuracy by 15-25%`
      });
    }

    // Recommendations for skill advancement
    const strongConcepts = performanceMetrics.strongestConcepts.slice(0, 2);
    for (const concept of strongConcepts) {
      if (concept.accuracy > 0.85) {
        recommendations.push({
          id: `advance-${concept.concept}`,
          type: 'challenge',
          title: `Advanced ${concept.concept}`,
          description: `Take on harder ${concept.concept} challenges`,
          priority: 6,
          concepts: [concept.concept],
          estimatedTime: 25,
          expectedBenefit: 'Master advanced concepts and earn bonus XP'
        });
      }
    }

    // Streak maintenance recommendations
    if (performanceMetrics.streakData.currentStreak > 0) {
      const easyChallenge = await this.calculateOptimalDifficulty(userId, ChallengeType.MEMORY_MATCH);
      recommendations.push({
        id: 'streak-maintenance',
        type: 'challenge',
        title: 'Maintain Your Streak',
        description: `Quick ${easyChallenge.recommendedDifficulty}/5 difficulty challenge to keep your streak`,
        priority: 8,
        estimatedTime: 10,
        expectedBenefit: `Maintain ${performanceMetrics.streakData.currentStreak}-day streak`
      });
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Create personalized learning path
   */
  async generatePersonalizedLearningPath(userId: string, targetLevel: number): Promise<PersonalizedLearningPath> {
    const performanceMetrics = await this.analyticsService.getPerformanceMetrics(userId);
    const currentLevel = this.calculateCurrentLevel(performanceMetrics);
    
    const path: LearningPathNode[] = [];
    let totalEstimatedTime = 0;

    // Define learning progression for each realm
    const learningProgression = this.defineLearningProgression();
    
    // Generate path based on current performance and target
    for (const realm of learningProgression) {
      const realmProgress = performanceMetrics.realmProgress.find(rp => rp.realmId === realm.realmId);
      
      if (!realmProgress || realmProgress.completionPercentage < 80) {
        // Add challenges from this realm to the path
        for (const challengeType of realm.challengeTypes) {
          const difficulty = await this.calculateOptimalDifficulty(userId, challengeType);
          
          const node: LearningPathNode = {
            challengeId: `${challengeType}-${difficulty.recommendedDifficulty}`,
            challengeType,
            difficulty: difficulty.recommendedDifficulty,
            concepts: realm.concepts,
            prerequisites: realm.prerequisites,
            estimatedTime: this.estimateTimeForDifficulty(difficulty.recommendedDifficulty),
            priority: this.calculateNodePriority(challengeType, performanceMetrics)
          };

          path.push(node);
          totalEstimatedTime += node.estimatedTime;
        }
      }
    }

    // Sort path by priority and dependencies
    const sortedPath = this.sortLearningPath(path);

    const learningPath: PersonalizedLearningPath = {
      userId,
      currentLevel,
      targetLevel,
      path: sortedPath,
      estimatedCompletionTime: totalEstimatedTime,
      adaptationHistory: this.difficultyAdjustments.get(userId) || [],
      lastUpdated: new Date()
    };

    this.learningPaths.set(userId, learningPath);
    return learningPath;
  }

  /**
   * Optimize difficulty feedback loop
   */
  async optimizeDifficultyFeedbackLoop(userId: string): Promise<void> {
    const performanceMetrics = await this.analyticsService.getPerformanceMetrics(userId);
    const adjustmentHistory = this.difficultyAdjustments.get(userId) || [];

    // Analyze effectiveness of past adjustments
    for (const adjustment of adjustmentHistory) {
      const effectivenessScore = await this.calculateAdjustmentEffectiveness(
        userId, 
        adjustment, 
        performanceMetrics
      );

      // Update adjustment confidence based on effectiveness
      if (effectivenessScore > 0.8) {
        adjustment.confidence = Math.min(1.0, adjustment.confidence * 1.1);
      } else if (effectivenessScore < 0.4) {
        adjustment.confidence = Math.max(0.1, adjustment.confidence * 0.9);
      }
    }

    // Update stored adjustments
    this.difficultyAdjustments.set(userId, adjustmentHistory);
  }

  /**
   * Get current difficulty for a user and challenge type
   */
  getCurrentDifficulty(userId: string, challengeType: ChallengeType): number {
    const adjustments = this.difficultyAdjustments.get(userId) || [];
    const latestAdjustment = adjustments
      .filter(adj => adj.challengeType === challengeType)
      .sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime())[0];

    return latestAdjustment?.recommendedDifficulty || 3; // Default to medium difficulty
  }

  /**
   * Private helper methods
   */
  private getRelevantConceptPerformance(
    metrics: PerformanceMetrics, 
    challengeType: ChallengeType
  ): ConceptPerformance[] {
    // Map challenge types to relevant concepts
    const conceptMapping: { [key in ChallengeType]?: string[] } = {
      [ChallengeType.EQUATION_BALANCE]: ['Chemical Equations', 'Stoichiometry'],
      [ChallengeType.STOICHIOMETRY]: ['Stoichiometry', 'Molar Calculations'],
      [ChallengeType.GAS_TEST]: ['Gas Tests', 'Ion Identification'],
      [ChallengeType.ORGANIC_NAMING]: ['Organic Chemistry', 'IUPAC Naming'],
      [ChallengeType.MEMORY_MATCH]: ['Gas Tests', 'Flame Colors'],
      [ChallengeType.LAB_PROCEDURE]: ['Lab Techniques', 'Safety Procedures']
    };

    const relevantConcepts = conceptMapping[challengeType] || [];
    return [...metrics.strongestConcepts, ...metrics.weakestConcepts]
      .filter(cp => relevantConcepts.some(concept => cp.concept.includes(concept)));
  }

  private calculateLearningTrend(conceptPerformance: ConceptPerformance[]): 'improving' | 'declining' | 'stable' {
    const trends = conceptPerformance.map(cp => cp.recentTrend);
    const improvingCount = trends.filter(t => t === 'improving').length;
    const decliningCount = trends.filter(t => t === 'declining').length;

    if (improvingCount > decliningCount) return 'improving';
    if (decliningCount > improvingCount) return 'declining';
    return 'stable';
  }

  private getChallengeTypeFromString(challengeTypeString: string): ChallengeType {
    // Convert string to ChallengeType enum
    const typeMap: { [key: string]: ChallengeType } = {
      'equation_balance': ChallengeType.EQUATION_BALANCE,
      'stoichiometry': ChallengeType.STOICHIOMETRY,
      'gas_test': ChallengeType.GAS_TEST,
      'organic_naming': ChallengeType.ORGANIC_NAMING,
      'memory_match': ChallengeType.MEMORY_MATCH,
      'lab_procedure': ChallengeType.LAB_PROCEDURE
    };

    return typeMap[challengeTypeString] || ChallengeType.EQUATION_BALANCE;
  }

  private estimateTimeForDifficulty(difficulty: number): number {
    // Base time estimates in minutes
    const baseTime = 15;
    const difficultyMultiplier = 1 + (difficulty - 1) * 0.3;
    return Math.round(baseTime * difficultyMultiplier);
  }

  private calculateCurrentLevel(metrics: PerformanceMetrics): number {
    // Calculate level based on overall performance
    const accuracyScore = metrics.overallAccuracy * 40;
    const completionScore = Math.min(metrics.totalChallengesCompleted / 10, 1) * 30;
    const realmScore = metrics.realmProgress.length * 5;
    const streakScore = Math.min(metrics.streakData.currentStreak / 7, 1) * 25;

    const totalScore = accuracyScore + completionScore + realmScore + streakScore;
    return Math.floor(totalScore / 10) + 1;
  }

  private defineLearningProgression(): Array<{
    realmId: string;
    challengeTypes: ChallengeType[];
    concepts: string[];
    prerequisites: string[];
  }> {
    return [
      {
        realmId: 'mathmage-trials',
        challengeTypes: [ChallengeType.EQUATION_BALANCE, ChallengeType.STOICHIOMETRY],
        concepts: ['Chemical Equations', 'Stoichiometry'],
        prerequisites: []
      },
      {
        realmId: 'memory-labyrinth',
        challengeTypes: [ChallengeType.MEMORY_MATCH, ChallengeType.GAS_TEST],
        concepts: ['Gas Tests', 'Ion Identification'],
        prerequisites: ['Chemical Equations']
      },
      {
        realmId: 'virtual-apprentice',
        challengeTypes: [ChallengeType.LAB_PROCEDURE],
        concepts: ['Lab Techniques'],
        prerequisites: ['Gas Tests']
      },
      {
        realmId: 'forest-of-isomers',
        challengeTypes: [ChallengeType.ORGANIC_NAMING],
        concepts: ['Organic Chemistry'],
        prerequisites: ['Chemical Equations', 'Lab Techniques']
      }
    ];
  }

  private calculateNodePriority(challengeType: ChallengeType, metrics: PerformanceMetrics): number {
    // Higher priority for weak areas, lower for strong areas
    const relevantConcepts = this.getRelevantConceptPerformance(metrics, challengeType);
    if (relevantConcepts.length === 0) return 5; // Medium priority for unknown areas

    const avgAccuracy = relevantConcepts.reduce((sum, cp) => sum + cp.accuracy, 0) / relevantConcepts.length;
    
    if (avgAccuracy < 0.5) return 10; // High priority
    if (avgAccuracy < 0.7) return 7;  // Medium-high priority
    if (avgAccuracy < 0.85) return 5; // Medium priority
    return 3; // Low priority for mastered concepts
  }

  private sortLearningPath(path: LearningPathNode[]): LearningPathNode[] {
    // Sort by priority (high to low) and then by prerequisites
    return path.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.prerequisites.length - b.prerequisites.length;
    });
  }

  private async calculateAdjustmentEffectiveness(
    userId: string,
    adjustment: DifficultyAdjustment,
    currentMetrics: PerformanceMetrics
  ): Promise<number> {
    // This would analyze performance after the adjustment was made
    // For now, return a mock effectiveness score
    const relevantConcepts = this.getRelevantConceptPerformance(currentMetrics, adjustment.challengeType);
    if (relevantConcepts.length === 0) return 0.5;

    const avgAccuracy = relevantConcepts.reduce((sum, cp) => sum + cp.accuracy, 0) / relevantConcepts.length;
    
    // If accuracy is close to target (75%), the adjustment was effective
    const targetAccuracy = 0.75;
    const accuracyDiff = Math.abs(avgAccuracy - targetAccuracy);
    return Math.max(0, 1 - (accuracyDiff * 2));
  }
}