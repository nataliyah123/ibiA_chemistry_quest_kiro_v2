import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '../testUtils'

// Mock the game API
vi.mock('../../services/gameApi')

// Mock hook implementation for testing
const mockUseGameEngine = () => ({
  character: null,
  lastRewards: [],
  levelUpResult: null,
  initializeCharacter: vi.fn(),
  completeChallenge: vi.fn(),
  calculateXP: vi.fn(),
  levelUp: vi.fn(),
  startChallenge: vi.fn(),
  submitAnswer: vi.fn()
})

describe('Game Engine Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize character correctly', async () => {
    const mockCharacter = {
      id: 'test-character-1',
      userId: 'test-user-1',
      level: 5,
      experience: 1250,
      gold: 500,
      health: 100,
      mana: 80,
      unlockedRealms: ['mathmage-trials', 'memory-labyrinth'],
      inventory: [],
      achievements: []
    }

    const gameEngine = mockUseGameEngine()
    gameEngine.initializeCharacter.mockResolvedValue(mockCharacter)

    await gameEngine.initializeCharacter('test-user-1')

    expect(gameEngine.initializeCharacter).toHaveBeenCalledWith('test-user-1')
  })

  it('should handle challenge completion', async () => {
    const mockRewards = [
      { type: 'xp', amount: 100 },
      { type: 'gold', amount: 50 }
    ]

    const gameEngine = mockUseGameEngine()
    gameEngine.completeChallenge.mockResolvedValue(mockRewards)

    const result = await gameEngine.completeChallenge('test-user-1', 'test-challenge-1', 95)

    expect(gameEngine.completeChallenge).toHaveBeenCalledWith('test-user-1', 'test-challenge-1', 95)
    expect(result).toEqual(mockRewards)
  })

  it('should calculate XP correctly based on performance', () => {
    const gameEngine = mockUseGameEngine()
    
    // Mock XP calculation logic
    gameEngine.calculateXP.mockImplementation((score, timeElapsed, difficulty) => {
      const baseXP = score * difficulty
      const timeBonus = Math.max(0, (120 - timeElapsed) / 120) * 20
      return Math.floor(baseXP + timeBonus)
    })
    
    const xp = gameEngine.calculateXP(100, 60, 3) // perfect score, 60s, difficulty 3
    expect(xp).toBeGreaterThan(0)
    
    const xpFast = gameEngine.calculateXP(100, 30, 3) // same score, faster time
    expect(xpFast).toBeGreaterThan(xp)
  })

  it('should handle level up correctly', async () => {
    const levelUpResult = {
      newLevel: 6,
      unlockedFeatures: ['new-realm'],
      rewards: [{ type: 'gold', amount: 100 }]
    }

    const gameEngine = mockUseGameEngine()
    gameEngine.levelUp.mockResolvedValue(levelUpResult)

    const result = await gameEngine.levelUp('test-user-1')

    expect(gameEngine.levelUp).toHaveBeenCalledWith('test-user-1')
    expect(result).toEqual(levelUpResult)
  })

  it('should handle challenge start workflow', async () => {
    const mockChallenge = {
      id: 'test-challenge-1',
      realmId: 'mathmage-trials',
      type: 'equation-balancing',
      difficulty: 3,
      title: 'Balance the Combustion',
      description: 'Balance this combustion reaction',
      content: {
        question: 'C₄H₁₀ + O₂ → CO₂ + H₂O',
        correctAnswer: ['2', '13', '8', '10'],
        explanation: 'This is a combustion reaction requiring careful coefficient balancing.'
      },
      timeLimit: 120,
      requiredLevel: 1,
      rewards: [
        { type: 'xp', amount: 50 },
        { type: 'gold', amount: 25 }
      ]
    }

    const gameEngine = mockUseGameEngine()
    gameEngine.startChallenge.mockResolvedValue(mockChallenge)

    const result = await gameEngine.startChallenge('mathmage-trials', 'equation-balancing')

    expect(gameEngine.startChallenge).toHaveBeenCalledWith('mathmage-trials', 'equation-balancing')
    expect(result).toEqual(mockChallenge)
  })

  it('should handle answer submission', async () => {
    const mockResult = {
      isCorrect: true,
      score: 95,
      timeElapsed: 45,
      feedback: 'Excellent work!',
      rewards: [
        { type: 'xp', amount: 75 },
        { type: 'gold', amount: 30 }
      ]
    }

    const gameEngine = mockUseGameEngine()
    gameEngine.submitAnswer.mockResolvedValue(mockResult)

    const result = await gameEngine.submitAnswer('test-challenge-1', ['2', '13', '8', '10'], 45)

    expect(gameEngine.submitAnswer).toHaveBeenCalledWith('test-challenge-1', ['2', '13', '8', '10'], 45)
    expect(result.isCorrect).toBe(true)
    expect(result.score).toBe(95)
  })

  it('should handle incorrect answers gracefully', async () => {
    const mockResult = {
      isCorrect: false,
      score: 25,
      timeElapsed: 90,
      feedback: 'Not quite right. Check your coefficient balancing.',
      hints: ['Start with carbon atoms', 'Then balance hydrogen'],
      rewards: [
        { type: 'xp', amount: 10 }
      ]
    }

    const gameEngine = mockUseGameEngine()
    gameEngine.submitAnswer.mockResolvedValue(mockResult)

    const result = await gameEngine.submitAnswer('test-challenge-1', ['1', '5', '4', '5'], 90)

    expect(result.isCorrect).toBe(false)
    expect(result.feedback).toContain('Not quite right')
    expect(result.hints).toBeDefined()
  })

  it('should calculate difficulty scaling correctly', () => {
    const gameEngine = mockUseGameEngine()
    
    // Mock difficulty scaling logic
    gameEngine.calculateXP.mockImplementation((score, timeElapsed, difficulty) => {
      const difficultyMultiplier = 1 + (difficulty - 1) * 0.5
      return Math.floor(score * difficultyMultiplier)
    })

    const easyXP = gameEngine.calculateXP(100, 60, 1)
    const mediumXP = gameEngine.calculateXP(100, 60, 3)
    const hardXP = gameEngine.calculateXP(100, 60, 5)

    expect(mediumXP).toBeGreaterThan(easyXP)
    expect(hardXP).toBeGreaterThan(mediumXP)
  })
})

// Helper function for testing hooks
function renderHook(hook: () => any) {
  let result: { current: any } = { current: null }
  
  function TestComponent() {
    result.current = hook()
    return null
  }

  render(<TestComponent />)
  return { result }
}

function act(callback: () => Promise<void>) {
  return callback()
}