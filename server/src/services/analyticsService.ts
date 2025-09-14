import { 
  AttemptData, 
  PerformanceMetrics, 
  WeakArea, 
  LearningSession,
  ConceptPerformance,
  StreakData,
  RealmProgress,
  LearningVelocityData,
  PerformanceCalculationInput,
  PerformanceCalculationResult,
  ConceptAnalytics,
  TimeSeriesPoint
} from '../types/analytics.js';
import { Answer, Challenge, Result } from '../types/game.js';

export class AnalyticsService {
  private attempts: Map<string, AttemptData[]> = new Map();
  private sessions: Map<string, LearningSession[]> = new Map();
  private performanceCache: Map<string, PerformanceMetrics> = new Map();

  /**
   * Record a challenge attempt
   */
  async recordAttempt(userId: string, challengeId: string, challenge: Challenge, answer: Answer, result: Result): Promise<void> {
    const attemptData: AttemptData = {
      id: `${userId}-${challengeId}-${Date.now()}`,
      challengeId,
      userId,
      startTime: new Date(Date.now() - answer.timeElapsed * 1000),
      endTime: new Date(),
      answer: answer.response,
      isCorrect: result.validation.isCorrect,
      score: result.validation.score,
      hintsUsed: answer.hintsUsed,
      timeElapsed: answer.timeElapsed,
      metadata: {
        deviceType: 'desktop', // TODO: Extract from request headers
        browserInfo: 'unknown', // TODO: Extract from user agent
        difficultyAdjustments: 0,
        realmId: challenge.realmId,
        challengeType: challenge.type,
        conceptsInvolved: challenge.metadata.concepts
      }
    };

    // Store attempt data
    const userAttempts = this.attempts.get(userId) || [];
    userAttempts.push(attemptData);
    this.attempts.set(userId, userAttempts);

    // Update performance metrics
    await this.updatePerformanceMetrics(userId);

    // Check for learning session updates
    await this.updateLearningSession(userId, attemptData);
  }

  /**
   * Get performance metrics for a user
   */
  async getPerformanceMetrics(userId: string): Promise<PerformanceMetrics> {
    let metrics = this.performanceCache.get(userId);
    
    if (!metrics || this.isMetricsStale(metrics)) {
      metrics = await this.calculatePerformanceMetrics(userId);
      this.performanceCache.set(userId, metrics);
    }

    return metrics;
  }

  /**
   * Identify weak areas for a user
   */
  async identifyWeakAreas(userId: string): Promise<WeakArea[]> {
    const attempts = this.attempts.get(userId) || [];
    const conceptPerformance = this.calculateConceptPerformance(attempts);
    
    const weakAreas: WeakArea[] = [];

    for (const [concept, performance] of Object.entries(conceptPerformance)) {
      if (performance.accuracy < 0.6 && performance.totalAttempts >= 3) {
        const challengeTypes = this.getChallengeTypesForConcept(attempts, concept);
        const weakestType = challengeTypes.reduce((worst, current) => 
          current.accuracy < worst.accuracy ? current : worst
        );

        weakAreas.push({
          concept,
          challengeType: weakestType.type,
          realmId: weakestType.realmId,
          accuracy: performance.accuracy,
          averageAttempts: performance.totalAttempts,
          recommendedActions: this.generateRecommendations(concept, performance),
          priority: this.calculatePriority(performance.accuracy, performance.totalAttempts)
        });
      }
    }

    return weakAreas.sort((a, b) => this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority));
  }

  /**
   * Calculate learning velocity for a user
   */
  async calculateLearningVelocity(userId: string, timeWindow: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<LearningVelocityData> {
    const attempts = this.attempts.get(userId) || [];
    const sessions = this.sessions.get(userId) || [];
    
    const windowDays = timeWindow === 'daily' ? 1 : timeWindow === 'weekly' ? 7 : 30;
    const cutoffDate = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
    
    const recentAttempts = attempts.filter(a => a.startTime >= cutoffDate);
    const recentSessions = sessions.filter(s => s.startTime >= cutoffDate);

    // Calculate metrics
    const conceptsLearned = new Set(recentSessions.flatMap(s => s.newConceptsLearned)).size;
    const challengesCompleted = recentAttempts.filter(a => a.isCorrect).length;
    
    // Calculate improvement rates
    const accuracyImprovement = this.calculateAccuracyTrend(recentAttempts);
    const speedImprovement = this.calculateSpeedTrend(recentAttempts);
    const difficultyProgression = this.calculateDifficultyProgression(recentAttempts);

    return {
      userId,
      timeWindow,
      conceptsLearned,
      challengesCompleted,
      accuracyImprovement,
      speedImprovement,
      difficultyProgression,
      calculatedAt: new Date()
    };
  }

  /**
   * Calculate comprehensive performance metrics
   */
  private async calculatePerformanceMetrics(userId: string): Promise<PerformanceMetrics> {
    const attempts = this.attempts.get(userId) || [];
    const sessions = this.sessions.get(userId) || [];

    if (attempts.length === 0) {
      return this.getDefaultMetrics(userId);
    }

    // Calculate overall accuracy
    const correctAttempts = attempts.filter(a => a.isCorrect).length;
    const overallAccuracy = correctAttempts / attempts.length;

    // Calculate average response time
    const averageResponseTime = attempts.reduce((sum, a) => sum + a.timeElapsed, 0) / attempts.length;

    // Calculate concept performance
    const conceptPerformance = this.calculateConceptPerformance(attempts);
    const conceptEntries = Object.entries(conceptPerformance);
    
    const strongestConcepts = conceptEntries
      .filter(([_, perf]) => perf.totalAttempts >= 3)
      .sort((a, b) => b[1].accuracy - a[1].accuracy)
      .slice(0, 5)
      .map(([concept, perf]) => perf);

    const weakestConcepts = conceptEntries
      .filter(([_, perf]) => perf.totalAttempts >= 3)
      .sort((a, b) => a[1].accuracy - b[1].accuracy)
      .slice(0, 5)
      .map(([concept, perf]) => perf);

    // Calculate learning velocity
    const learningVelocity = await this.calculateLearningVelocity(userId);

    // Calculate streak data
    const streakData = this.calculateStreakData(attempts, sessions);

    // Calculate realm progress
    const realmProgress = this.calculateRealmProgress(attempts);

    // Calculate total time spent
    const totalTimeSpent = sessions.reduce((sum, s) => 
      sum + (s.endTime.getTime() - s.startTime.getTime()), 0) / 1000;

    return {
      userId,
      overallAccuracy,
      averageResponseTime,
      strongestConcepts,
      weakestConcepts,
      learningVelocity: learningVelocity.challengesCompleted,
      streakData,
      realmProgress,
      totalChallengesCompleted: attempts.length,
      totalTimeSpent,
      lastUpdated: new Date()
    };
  }

  /**
   * Calculate performance for each concept
   */
  private calculateConceptPerformance(attempts: AttemptData[]): { [concept: string]: ConceptPerformance } {
    const conceptMap: { [concept: string]: AttemptData[] } = {};

    // Group attempts by concept
    attempts.forEach(attempt => {
      attempt.metadata.conceptsInvolved.forEach(concept => {
        if (!conceptMap[concept]) {
          conceptMap[concept] = [];
        }
        conceptMap[concept].push(attempt);
      });
    });

    const performance: { [concept: string]: ConceptPerformance } = {};

    Object.entries(conceptMap).forEach(([concept, conceptAttempts]) => {
      const correctAttempts = conceptAttempts.filter(a => a.isCorrect).length;
      const accuracy = correctAttempts / conceptAttempts.length;
      const averageTime = conceptAttempts.reduce((sum, a) => sum + a.timeElapsed, 0) / conceptAttempts.length;
      
      // Calculate recent trend
      const recentTrend = this.calculateTrend(conceptAttempts);
      
      // Calculate confidence level based on consistency
      const confidenceLevel = this.calculateConfidenceLevel(conceptAttempts);

      performance[concept] = {
        concept,
        accuracy,
        averageTime,
        totalAttempts: conceptAttempts.length,
        recentTrend,
        confidenceLevel
      };
    });

    return performance;
  }

  /**
   * Calculate streak data for user
   */
  private calculateStreakData(attempts: AttemptData[], sessions: LearningSession[]): StreakData {
    // Calculate daily login streak
    const sessionDates = sessions.map(s => s.startTime.toDateString());
    const uniqueDates = [...new Set(sessionDates)].sort();
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    // Calculate current streak
    for (let i = uniqueDates.length - 1; i >= 0; i--) {
      const date = uniqueDates[i];
      if (date === today || (i === uniqueDates.length - 1 && date === yesterday)) {
        currentStreak++;
      } else if (i === uniqueDates.length - 1 - currentStreak) {
        const expectedDate = new Date(Date.now() - (currentStreak + 1) * 24 * 60 * 60 * 1000).toDateString();
        if (date === expectedDate) {
          currentStreak++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    // Calculate longest streak
    for (let i = 0; i < uniqueDates.length; i++) {
      tempStreak = 1;
      for (let j = i + 1; j < uniqueDates.length; j++) {
        const currentDate = new Date(uniqueDates[j]);
        const prevDate = new Date(uniqueDates[j - 1]);
        const dayDiff = (currentDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000);
        
        if (dayDiff === 1) {
          tempStreak++;
        } else {
          break;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    return {
      currentStreak,
      longestStreak,
      lastActivityDate: sessions.length > 0 ? sessions[sessions.length - 1].startTime : new Date(),
      streakType: 'daily',
      streakMultiplier: Math.min(1 + currentStreak * 0.1, 2.0) // Max 2x multiplier
    };
  }

  /**
   * Calculate realm progress for user
   */
  private calculateRealmProgress(attempts: AttemptData[]): RealmProgress[] {
    const realmMap: { [realmId: string]: AttemptData[] } = {};

    attempts.forEach(attempt => {
      const realmId = attempt.metadata.realmId;
      if (!realmMap[realmId]) {
        realmMap[realmId] = [];
      }
      realmMap[realmId].push(attempt);
    });

    return Object.entries(realmMap).map(([realmId, realmAttempts]) => {
      const uniqueChallenges = new Set(realmAttempts.map(a => a.challengeId));
      const averageScore = realmAttempts.reduce((sum, a) => sum + a.score, 0) / realmAttempts.length;
      const timeSpent = realmAttempts.reduce((sum, a) => sum + a.timeElapsed, 0);
      
      // Calculate challenge type performance
      const challengeTypes = this.getChallengeTypePerformance(realmAttempts);
      const sortedTypes = Object.entries(challengeTypes).sort((a, b) => b[1].accuracy - a[1].accuracy);
      
      return {
        realmId,
        realmName: this.getRealmName(realmId),
        completionPercentage: Math.min((uniqueChallenges.size / this.getTotalChallengesInRealm(realmId)) * 100, 100),
        averageScore,
        timeSpent,
        challengesCompleted: uniqueChallenges.size,
        totalChallenges: this.getTotalChallengesInRealm(realmId),
        strongestChallengeTypes: sortedTypes.slice(0, 3).map(([type]) => type),
        weakestChallengeTypes: sortedTypes.slice(-3).map(([type]) => type)
      };
    });
  }

  /**
   * Update learning session data
   */
  private async updateLearningSession(userId: string, attemptData: AttemptData): Promise<void> {
    const userSessions = this.sessions.get(userId) || [];
    const currentTime = new Date();
    
    // Find or create current session (within 30 minutes of last activity)
    let currentSession = userSessions.find(s => 
      !s.endTime || (currentTime.getTime() - s.endTime.getTime()) < 30 * 60 * 1000
    );

    if (!currentSession) {
      currentSession = {
        id: `${userId}-session-${Date.now()}`,
        userId,
        startTime: attemptData.startTime,
        endTime: attemptData.endTime,
        challengesAttempted: [],
        totalScore: 0,
        experienceGained: 0,
        conceptsReinforced: [],
        newConceptsLearned: [],
        sessionType: 'practice',
        deviceInfo: {
          type: 'desktop',
          browser: 'unknown',
          os: 'unknown',
          screenSize: 'unknown'
        }
      };
      userSessions.push(currentSession);
    }

    // Update session data
    currentSession.endTime = attemptData.endTime;
    currentSession.challengesAttempted.push(attemptData.challengeId);
    currentSession.totalScore += attemptData.score;
    
    // Update concepts
    attemptData.metadata.conceptsInvolved.forEach(concept => {
      if (!currentSession!.conceptsReinforced.includes(concept)) {
        currentSession!.conceptsReinforced.push(concept);
      }
    });

    this.sessions.set(userId, userSessions);
  }

  /**
   * Helper methods
   */
  private isMetricsStale(metrics: PerformanceMetrics): boolean {
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    return Date.now() - metrics.lastUpdated.getTime() > staleThreshold;
  }

  private getDefaultMetrics(userId: string): PerformanceMetrics {
    return {
      userId,
      overallAccuracy: 0,
      averageResponseTime: 0,
      strongestConcepts: [],
      weakestConcepts: [],
      learningVelocity: 0,
      streakData: {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: new Date(),
        streakType: 'daily',
        streakMultiplier: 1.0
      },
      realmProgress: [],
      totalChallengesCompleted: 0,
      totalTimeSpent: 0,
      lastUpdated: new Date()
    };
  }

  private calculateTrend(attempts: AttemptData[]): 'improving' | 'declining' | 'stable' {
    if (attempts.length < 5) return 'stable';
    
    const recent = attempts.slice(-5);
    const older = attempts.slice(-10, -5);
    
    if (older.length === 0) return 'stable';
    
    const recentAccuracy = recent.filter(a => a.isCorrect).length / recent.length;
    const olderAccuracy = older.filter(a => a.isCorrect).length / older.length;
    
    const diff = recentAccuracy - olderAccuracy;
    
    if (diff > 0.1) return 'improving';
    if (diff < -0.1) return 'declining';
    return 'stable';
  }

  private calculateConfidenceLevel(attempts: AttemptData[]): number {
    if (attempts.length < 3) return 0.3;
    
    const scores = attempts.map(a => a.score);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation = higher confidence
    const normalizedStdDev = Math.min(standardDeviation / 100, 1);
    return Math.max(0.1, 1 - normalizedStdDev);
  }

  private getChallengeTypesForConcept(attempts: AttemptData[], concept: string): Array<{type: string, realmId: string, accuracy: number}> {
    const conceptAttempts = attempts.filter(a => a.metadata.conceptsInvolved.includes(concept));
    const typeMap: { [key: string]: AttemptData[] } = {};
    
    conceptAttempts.forEach(attempt => {
      const key = `${attempt.metadata.challengeType}-${attempt.metadata.realmId}`;
      if (!typeMap[key]) {
        typeMap[key] = [];
      }
      typeMap[key].push(attempt);
    });

    return Object.entries(typeMap).map(([key, typeAttempts]) => {
      const [type, realmId] = key.split('-');
      const correct = typeAttempts.filter(a => a.isCorrect).length;
      return {
        type,
        realmId,
        accuracy: correct / typeAttempts.length
      };
    });
  }

  private generateRecommendations(concept: string, performance: ConceptPerformance): string[] {
    const recommendations: string[] = [];
    
    if (performance.accuracy < 0.4) {
      recommendations.push('Review fundamental concepts');
      recommendations.push('Practice with easier difficulty levels');
    } else if (performance.accuracy < 0.6) {
      recommendations.push('Focus on specific problem areas');
      recommendations.push('Use hints more strategically');
    }
    
    if (performance.averageTime > 120) {
      recommendations.push('Practice speed drills');
      recommendations.push('Review formula shortcuts');
    }
    
    return recommendations;
  }

  private calculatePriority(accuracy: number, attempts: number): 'high' | 'medium' | 'low' {
    if (accuracy < 0.4 && attempts >= 5) return 'high';
    if (accuracy < 0.6 && attempts >= 3) return 'medium';
    return 'low';
  }

  private getPriorityValue(priority: 'high' | 'medium' | 'low'): number {
    return priority === 'high' ? 3 : priority === 'medium' ? 2 : 1;
  }

  private calculateAccuracyTrend(attempts: AttemptData[]): number {
    if (attempts.length < 2) return 0;
    
    const firstHalf = attempts.slice(0, Math.floor(attempts.length / 2));
    const secondHalf = attempts.slice(Math.floor(attempts.length / 2));
    
    const firstAccuracy = firstHalf.filter(a => a.isCorrect).length / firstHalf.length;
    const secondAccuracy = secondHalf.filter(a => a.isCorrect).length / secondHalf.length;
    
    return secondAccuracy - firstAccuracy;
  }

  private calculateSpeedTrend(attempts: AttemptData[]): number {
    if (attempts.length < 2) return 0;
    
    const firstHalf = attempts.slice(0, Math.floor(attempts.length / 2));
    const secondHalf = attempts.slice(Math.floor(attempts.length / 2));
    
    const firstAvgTime = firstHalf.reduce((sum, a) => sum + a.timeElapsed, 0) / firstHalf.length;
    const secondAvgTime = secondHalf.reduce((sum, a) => sum + a.timeElapsed, 0) / secondHalf.length;
    
    // Negative value means improvement (faster times)
    return (firstAvgTime - secondAvgTime) / firstAvgTime;
  }

  private calculateDifficultyProgression(attempts: AttemptData[]): number {
    // This would need challenge difficulty data - simplified for now
    return attempts.length > 10 ? 0.1 : 0;
  }

  private getChallengeTypePerformance(attempts: AttemptData[]): { [type: string]: { accuracy: number, count: number } } {
    const typeMap: { [type: string]: AttemptData[] } = {};
    
    attempts.forEach(attempt => {
      const type = attempt.metadata.challengeType;
      if (!typeMap[type]) {
        typeMap[type] = [];
      }
      typeMap[type].push(attempt);
    });

    const performance: { [type: string]: { accuracy: number, count: number } } = {};
    
    Object.entries(typeMap).forEach(([type, typeAttempts]) => {
      const correct = typeAttempts.filter(a => a.isCorrect).length;
      performance[type] = {
        accuracy: correct / typeAttempts.length,
        count: typeAttempts.length
      };
    });

    return performance;
  }

  private getRealmName(realmId: string): string {
    const realmNames: { [key: string]: string } = {
      'mathmage-trials': 'The Mathmage Trials',
      'memory-labyrinth': 'The Memory Labyrinth',
      'virtual-apprentice': 'Virtual Apprentice',
      'seers-challenge': "The Seer's Challenge",
      'cartographers-gauntlet': "The Cartographer's Gauntlet",
      'forest-of-isomers': 'The Forest of Isomers'
    };
    return realmNames[realmId] || realmId;
  }

  private getTotalChallengesInRealm(realmId: string): number {
    // This would come from the realm configuration - simplified for now
    const challengeCounts: { [key: string]: number } = {
      'mathmage-trials': 25,
      'memory-labyrinth': 20,
      'virtual-apprentice': 15,
      'seers-challenge': 18,
      'cartographers-gauntlet': 12,
      'forest-of-isomers': 22
    };
    return challengeCounts[realmId] || 10;
  }

  private async updatePerformanceMetrics(userId: string): Promise<void> {
    // Invalidate cache to force recalculation
    this.performanceCache.delete(userId);
  }
}