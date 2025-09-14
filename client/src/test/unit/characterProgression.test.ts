import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCharacterProgression } from '../../hooks/useCharacterProgression'
import { mockCharacter } from '../testUtils'
import * as characterApi from '../../services/characterApi'

vi.mock('../../services/characterApi')

describe('Character Progression', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should calculate XP to next level correctly', () => {
    const { result } = renderHook(() => useCharacterProgression())
    
    const xpToNext = result.current.calculateXPToNextLevel(5, 1250)
    expect(xpToNext).toBeGreaterThan(0)
    expect(xpToNext).toBe(250) // Assuming level 6 requires 1500 XP
  })

  it('should determine if level up is available', () => {
    const { result } = renderHook(() => useCharacterProgression())
    
    const canLevelUp = result.current.canLevelUp(5, 1500) // Exactly at threshold
    expect(canLevelUp).toBe(true)
    
    const cannotLevelUp = result.current.canLevelUp(5, 1200) // Below threshold
    expect(cannotLevelUp).toBe(false)
  })

  it('should update character stats correctly', async () => {
    const mockUpdateStats = vi.mocked(characterApi.updateCharacterStats)
    const updatedCharacter = { ...mockCharacter, experience: 1350 }
    mockUpdateStats.mockResolvedValue(updatedCharacter)

    const { result } = renderHook(() => useCharacterProgression())
    
    await act(async () => {
      await result.current.updateStats('test-user-1', { experience: 100 })
    })

    expect(mockUpdateStats).toHaveBeenCalledWith('test-user-1', { experience: 100 })
  })

  it('should handle achievement unlocking', async () => {
    const mockUnlockAchievement = vi.mocked(characterApi.unlockAchievement)
    const achievement = {
      id: 'first-equation',
      name: 'First Equation Balanced',
      description: 'Balance your first chemical equation',
      rarity: 'common',
      unlockedAt: new Date()
    }
    mockUnlockAchievement.mockResolvedValue(achievement)

    const { result } = renderHook(() => useCharacterProgression())
    
    await act(async () => {
      await result.current.unlockAchievement('test-user-1', 'first-equation')
    })

    expect(mockUnlockAchievement).toHaveBeenCalledWith('test-user-1', 'first-equation')
  })

  it('should calculate progress percentage correctly', () => {
    const { result } = renderHook(() => useCharacterProgression())
    
    const progress = result.current.calculateLevelProgress(5, 1250)
    expect(progress).toBeGreaterThanOrEqual(0)
    expect(progress).toBeLessThanOrEqual(100)
    expect(progress).toBe(83.33) // 1250/1500 * 100, rounded
  })
})

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