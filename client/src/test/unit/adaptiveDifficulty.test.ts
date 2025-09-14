import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateOptimalDifficulty, adjustDifficultyBasedOnPerformance } from '../../services/adaptiveDifficultyEngine'

describe('Adaptive Difficulty Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Difficulty Calculation', () => {
    it('should calculate optimal difficulty based on performance history', () => {
      const performanceHistory = [
        { score: 95, timeElapsed: 30, difficulty: 2 },
        { score: 88, timeElapsed: 45, difficulty: 2 },
        { score: 92, timeElapsed: 35, difficulty: 2 },
        { score: 85, timeElapsed: 50, difficulty: 2 }
      ]

      const optimalDifficulty = calculateOptimalDifficulty(performanceHistory, 'equation-balancing')
      
      // Should increase difficulty due to high performance
      expect(optimalDifficulty).toBeGreaterThan(2)
      expect(optimalDifficulty).toBeLessThanOrEqual(5)
    })

    it('should decrease difficulty for struggling students', () => {
      const performanceHistory = [
        { score: 45, timeElapsed: 90, difficulty: 3 },
        { score: 38, timeElapsed: 110, difficulty: 3 },
        { score: 52, timeElapsed: 85, difficulty: 3 },
        { score: 41, timeElapsed: 95, difficulty: 3 }
      ]

      const optimalDifficulty = calculateOptimalDifficulty(performanceHistory, 'equation-balancing')
      
      // Should decrease difficulty due to poor performance
      expect(optimalDifficulty).toBeLessThan(3)
      expect(optimalDifficulty).toBeGreaterThanOrEqual(1)
    })

    it('should maintain difficulty for consistent performance', () => {
      const performanceHistory = [
        { score: 75, timeElapsed: 60, difficulty: 3 },
        { score: 72, timeElapsed: 65, difficulty: 3 },
        { score: 78, timeElapsed: 55, difficulty: 3 },
        { score: 74, timeElapsed: 62, difficulty: 3 }
      ]

      const optimalDifficulty = calculateOptimalDifficulty(performanceHistory, 'equation-balancing')
      
      // Should maintain current difficulty
      expect(optimalDifficulty).toBeCloseTo(3, 0.5)
    })

    it('should handle different challenge types appropriately', () => {
      const performanceHistory = [
        { score: 90, timeElapsed: 20, difficulty: 2 }
      ]

      const equationDifficulty = calculateOptimalDifficulty(performanceHistory, 'equation-balancing')
      const memoryDifficulty = calculateOptimalDifficulty(performanceHistory, 'memory-match')
      const organicDifficulty = calculateOptimalDifficulty(performanceHistory, 'organic-naming')

      // Different challenge types may have different scaling
      expect(equationDifficulty).toBeGreaterThan(0)
      expect(memoryDifficulty).toBeGreaterThan(0)
      expect(organicDifficulty).toBeGreaterThan(0)
    })
  })

  describe('Performance-Based Adjustments', () => {
    it('should adjust difficulty based on recent performance trends', () => {
      const recentPerformance = {
        averageScore: 85,
        averageTime: 45,
        successRate: 0.9,
        improvementTrend: 0.15 // 15% improvement
      }

      const adjustment = adjustDifficultyBasedOnPerformance(recentPerformance, 3)
      
      expect(adjustment.newDifficulty).toBeGreaterThan(3)
      expect(adjustment.reason).toContain('improvement')
    })

    it('should provide appropriate feedback for difficulty changes', () => {
      const strugglingPerformance = {
        averageScore: 45,
        averageTime: 95,
        successRate: 0.4,
        improvementTrend: -0.1 // 10% decline
      }

      const adjustment = adjustDifficultyBasedOnPerformance(strugglingPerformance, 4)
      
      expect(adjustment.newDifficulty).toBeLessThan(4)
      expect(adjustment.feedback).toContain('easier')
      expect(adjustment.recommendations).toContain('review')
    })

    it('should handle edge cases gracefully', () => {
      const emptyPerformance = {
        averageScore: 0,
        averageTime: 0,
        successRate: 0,
        improvementTrend: 0
      }

      const adjustment = adjustDifficultyBasedOnPerformance(emptyPerformance, 2)
      
      // Should default to beginner difficulty
      expect(adjustment.newDifficulty).toBe(1)
      expect(adjustment.reason).toContain('insufficient data')
    })
  })

  describe('Learning Velocity Tracking', () => {
    it('should calculate learning velocity correctly', () => {
      const sessionData = [
        { timestamp: Date.now() - 86400000, score: 60 }, // 1 day ago
        { timestamp: Date.now() - 43200000, score: 70 }, // 12 hours ago
        { timestamp: Date.now() - 21600000, score: 75 }, // 6 hours ago
        { timestamp: Date.now() - 3600000, score: 85 }   // 1 hour ago
      ]

      const velocity = calculateLearningVelocity(sessionData)
      
      expect(velocity).toBeGreaterThan(0) // Positive improvement
      expect(velocity).toBeLessThan(1) // Reasonable rate
    })

    it('should identify learning plateaus', () => {
      const plateauData = [
        { timestamp: Date.now() - 86400000, score: 75 },
        { timestamp: Date.now() - 43200000, score: 76 },
        { timestamp: Date.now() - 21600000, score: 74 },
        { timestamp: Date.now() - 3600000, score: 75 }
      ]

      const velocity = calculateLearningVelocity(plateauData)
      
      expect(Math.abs(velocity)).toBeLessThan(0.1) // Near zero velocity
    })
  })
})

// Mock implementations for testing
function calculateLearningVelocity(sessionData: Array<{timestamp: number, score: number}>): number {
  if (sessionData.length < 2) return 0
  
  const sortedData = sessionData.sort((a, b) => a.timestamp - b.timestamp)
  const firstScore = sortedData[0].score
  const lastScore = sortedData[sortedData.length - 1].score
  const timeSpan = sortedData[sortedData.length - 1].timestamp - sortedData[0].timestamp
  
  // Calculate score improvement per hour
  const hoursSpan = timeSpan / (1000 * 60 * 60)
  return (lastScore - firstScore) / (hoursSpan * 100) // Normalized to 0-1 scale
}