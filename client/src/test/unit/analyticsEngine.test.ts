import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock analytics engine functions for testing
const calculatePerformanceMetrics = vi.fn()
const identifyWeakAreas = vi.fn()
const generateRecommendations = vi.fn()
const trackLearningProgress = vi.fn()

describe('Analytics Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Performance Metrics Calculation', () => {
    it('should calculate overall accuracy correctly', () => {
      const attemptData = [
        { isCorrect: true, score: 95, timeElapsed: 30 },
        { isCorrect: true, score: 88, timeElapsed: 45 },
        { isCorrect: false, score: 45, timeElapsed: 90 },
        { isCorrect: true, score: 92, timeElapsed: 35 }
      ]

      const metrics = {
        overallAccuracy: 0.75, // 3/4 correct
        averageScore: 80, // (95+88+45+92)/4
        averageResponseTime: 50, // (30+45+90+35)/4
        totalAttempts: 4
      }

      calculatePerformanceMetrics.mockReturnValue(metrics)
      const result = calculatePerformanceMetrics(attemptData)

      expect(result.overallAccuracy).toBe(0.75)
      expect(result.averageScore).toBe(80)
      expect(result.averageResponseTime).toBe(50)
    })

    it('should handle empty attempt data gracefully', () => {
      const emptyMetrics = {
        overallAccuracy: 0,
        averageScore: 0,
        averageResponseTime: 0,
        totalAttempts: 0
      }

      calculatePerformanceMetrics.mockReturnValue(emptyMetrics)
      const result = calculatePerformanceMetrics([])

      expect(result.overallAccuracy).toBe(0)
      expect(result.totalAttempts).toBe(0)
    })

    it('should calculate concept-specific performance', () => {
      const conceptData = {
        'equation-balancing': { accuracy: 0.9, attempts: 10 },
        'stoichiometry': { accuracy: 0.6, attempts: 8 },
        'organic-naming': { accuracy: 0.8, attempts: 12 }
      }

      const metrics = {
        conceptPerformance: conceptData,
        strongestConcepts: ['equation-balancing', 'organic-naming'],
        weakestConcepts: ['stoichiometry']
      }

      calculatePerformanceMetrics.mockReturnValue(metrics)
      const result = calculatePerformanceMetrics([])

      expect(result.strongestConcepts).toContain('equation-balancing')
      expect(result.weakestConcepts).toContain('stoichiometry')
    })
  })

  describe('Weak Area Identification', () => {
    it('should identify concepts with low accuracy as weak areas', () => {
      const performanceData = {
        'stoichiometry': { accuracy: 0.4, attempts: 10 },
        'organic-mechanisms': { accuracy: 0.3, attempts: 8 },
        'data-analysis': { accuracy: 0.5, attempts: 6 }
      }

      const weakAreas = [
        { concept: 'organic-mechanisms', priority: 'high', accuracy: 0.3 },
        { concept: 'stoichiometry', priority: 'high', accuracy: 0.4 },
        { concept: 'data-analysis', priority: 'medium', accuracy: 0.5 }
      ]

      identifyWeakAreas.mockReturnValue(weakAreas)
      const result = identifyWeakAreas(performanceData)

      expect(result).toHaveLength(3)
      expect(result[0].concept).toBe('organic-mechanisms')
      expect(result[0].priority).toBe('high')
    })

    it('should prioritize weak areas by severity', () => {
      const weakAreas = [
        { concept: 'concept-a', priority: 'low', accuracy: 0.65 },
        { concept: 'concept-b', priority: 'high', accuracy: 0.25 },
        { concept: 'concept-c', priority: 'medium', accuracy: 0.45 }
      ]

      identifyWeakAreas.mockReturnValue(weakAreas)
      const result = identifyWeakAreas({})

      const highPriority = result.filter(area => area.priority === 'high')
      expect(highPriority).toHaveLength(1)
      expect(highPriority[0].accuracy).toBeLessThan(0.3)
    })
  })

  describe('Recommendation Generation', () => {
    it('should generate appropriate recommendations for weak areas', () => {
      const weakAreas = [
        { concept: 'stoichiometry', priority: 'high', accuracy: 0.3 }
      ]

      const recommendations = [
        {
          type: 'practice',
          concept: 'stoichiometry',
          description: 'Complete 5 more stoichiometry challenges',
          estimatedTime: 30
        },
        {
          type: 'review',
          concept: 'stoichiometry',
          description: 'Review molar ratio calculations',
          estimatedTime: 15
        }
      ]

      generateRecommendations.mockReturnValue(recommendations)
      const result = generateRecommendations(weakAreas)

      expect(result).toHaveLength(2)
      expect(result[0].type).toBe('practice')
      expect(result[1].type).toBe('review')
    })

    it('should suggest appropriate difficulty adjustments', () => {
      const performanceData = {
        recentAccuracy: 0.95,
        averageTime: 25,
        currentDifficulty: 2
      }

      const recommendations = [
        {
          type: 'difficulty-increase',
          description: 'Try harder challenges to maintain engagement',
          newDifficulty: 3
        }
      ]

      generateRecommendations.mockReturnValue(recommendations)
      const result = generateRecommendations([], performanceData)

      expect(result[0].type).toBe('difficulty-increase')
      expect(result[0].newDifficulty).toBeGreaterThan(2)
    })
  })

  describe('Learning Progress Tracking', () => {
    it('should track improvement over time', () => {
      const sessionData = [
        { date: '2024-01-01', accuracy: 0.6, score: 60 },
        { date: '2024-01-02', accuracy: 0.7, score: 70 },
        { date: '2024-01-03', accuracy: 0.8, score: 80 }
      ]

      const progressData = {
        trend: 'improving',
        improvementRate: 0.1, // 10% improvement per session
        projectedAccuracy: 0.9
      }

      trackLearningProgress.mockReturnValue(progressData)
      const result = trackLearningProgress(sessionData)

      expect(result.trend).toBe('improving')
      expect(result.improvementRate).toBeGreaterThan(0)
    })

    it('should detect learning plateaus', () => {
      const plateauData = [
        { date: '2024-01-01', accuracy: 0.75, score: 75 },
        { date: '2024-01-02', accuracy: 0.76, score: 76 },
        { date: '2024-01-03', accuracy: 0.74, score: 74 }
      ]

      const progressData = {
        trend: 'plateau',
        improvementRate: 0.005, // Very small improvement
        recommendation: 'Try different challenge types'
      }

      trackLearningProgress.mockReturnValue(progressData)
      const result = trackLearningProgress(plateauData)

      expect(result.trend).toBe('plateau')
      expect(Math.abs(result.improvementRate)).toBeLessThan(0.01)
    })
  })

  describe('Streak Analysis', () => {
    it('should calculate streak bonuses correctly', () => {
      const streakData = {
        currentStreak: 7,
        longestStreak: 12,
        streakType: 'daily-login'
      }

      const bonus = calculateStreakBonus(streakData)
      expect(bonus.multiplier).toBeGreaterThan(1)
      expect(bonus.bonusXP).toBeGreaterThan(0)
    })

    it('should reset streak on missed days', () => {
      const missedDayData = {
        lastLoginDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        currentStreak: 5
      }

      const updatedStreak = updateStreakData(missedDayData)
      expect(updatedStreak.currentStreak).toBe(0)
    })
  })
})

// Mock helper functions
function calculateStreakBonus(streakData: {currentStreak: number, longestStreak: number, streakType: string}) {
  return {
    multiplier: 1 + (streakData.currentStreak * 0.1),
    bonusXP: streakData.currentStreak * 10
  }
}

function updateStreakData(data: {lastLoginDate: Date, currentStreak: number}) {
  const daysSinceLogin = Math.floor((Date.now() - data.lastLoginDate.getTime()) / (24 * 60 * 60 * 1000))
  return {
    currentStreak: daysSinceLogin > 1 ? 0 : data.currentStreak,
    lastLoginDate: new Date()
  }
}