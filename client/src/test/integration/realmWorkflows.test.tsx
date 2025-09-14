import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../testUtils'
import { MathmageTrialsRealm } from '../../components/realms/MathmageTrialsRealm'
import { MemoryLabyrinthRealm } from '../../components/realms/MemoryLabyrinthRealm'
import { VirtualApprenticeRealm } from '../../components/realms/VirtualApprenticeRealm'
import * as gameApi from '../../services/gameApi'

vi.mock('../../services/gameApi')

describe('Realm Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Mathmage Trials Realm Workflow', () => {
    it('should complete full equation duels workflow', async () => {
      const mockChallenge = {
        id: 'equation-duel-1',
        type: 'equation-balancing',
        content: {
          question: 'C₄H₁₀ + O₂ → CO₂ + H₂O',
          correctAnswer: ['2', '13', '8', '10'],
          explanation: 'Combustion reaction balancing'
        },
        timeLimit: 120
      }

      vi.mocked(gameApi.startChallenge).mockResolvedValue(mockChallenge)
      vi.mocked(gameApi.submitAnswer).mockResolvedValue({
        isCorrect: true,
        score: 95,
        timeElapsed: 45
      })

      render(<MathmageTrialsRealm />)

      // Start equation duels
      const equationDuelsButton = screen.getByText('Equation Duels')
      fireEvent.click(equationDuelsButton)

      await waitFor(() => {
        expect(screen.getByText('C₄H₁₀ + O₂ → CO₂ + H₂O')).toBeInTheDocument()
      })

      // Input coefficients
      const coefficientInputs = screen.getAllByRole('textbox')
      fireEvent.change(coefficientInputs[0], { target: { value: '2' } })
      fireEvent.change(coefficientInputs[1], { target: { value: '13' } })
      fireEvent.change(coefficientInputs[2], { target: { value: '8' } })
      fireEvent.change(coefficientInputs[3], { target: { value: '10' } })

      // Submit answer
      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Correct!/)).toBeInTheDocument()
        expect(screen.getByText(/Score: 95/)).toBeInTheDocument()
      })

      expect(gameApi.submitAnswer).toHaveBeenCalledWith(
        'equation-duel-1',
        ['2', '13', '8', '10']
      )
    })

    it('should handle mole dungeon crawler progression', async () => {
      const mockStoichiometryChallenge = {
        id: 'mole-dungeon-1',
        type: 'stoichiometry',
        content: {
          question: 'How many moles of CO₂ are produced from 2 moles of C₄H₁₀?',
          correctAnswer: '8',
          explanation: 'From balanced equation: 2C₄H₁₀ → 8CO₂'
        }
      }

      vi.mocked(gameApi.startChallenge).mockResolvedValue(mockStoichiometryChallenge)
      vi.mocked(gameApi.submitAnswer).mockResolvedValue({
        isCorrect: true,
        score: 100,
        roomUnlocked: true
      })

      render(<MathmageTrialsRealm />)

      const moleDungeonButton = screen.getByText('Mole Dungeon Crawler')
      fireEvent.click(moleDungeonButton)

      await waitFor(() => {
        expect(screen.getByText(/How many moles of CO₂/)).toBeInTheDocument()
      })

      const answerInput = screen.getByRole('textbox')
      fireEvent.change(answerInput, { target: { value: '8' } })

      const submitButton = screen.getByText('Unlock Door')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Door Unlocked!/)).toBeInTheDocument()
        expect(screen.getByText(/Next Room/)).toBeInTheDocument()
      })
    })
  })

  describe('Memory Labyrinth Realm Workflow', () => {
    it('should complete flashcard match game', async () => {
      const mockFlashcardChallenge = {
        id: 'flashcard-match-1',
        type: 'memory-match',
        content: {
          cards: [
            { id: 1, type: 'test', content: 'Hydrogen gas test' },
            { id: 2, type: 'result', content: 'Pop with lighted splint' },
            { id: 3, type: 'test', content: 'Oxygen gas test' },
            { id: 4, type: 'result', content: 'Relights glowing splint' }
          ]
        }
      }

      vi.mocked(gameApi.startChallenge).mockResolvedValue(mockFlashcardChallenge)

      render(<MemoryLabyrinthRealm />)

      const flashcardButton = screen.getByText('Flashcard Match')
      fireEvent.click(flashcardButton)

      await waitFor(() => {
        expect(screen.getByText('Hydrogen gas test')).toBeInTheDocument()
      })

      // Click on matching cards
      const hydrogenTestCard = screen.getByText('Hydrogen gas test')
      const popTestCard = screen.getByText('Pop with lighted splint')

      fireEvent.click(hydrogenTestCard)
      fireEvent.click(popTestCard)

      await waitFor(() => {
        expect(screen.getByText(/Match!/)).toBeInTheDocument()
      })
    })

    it('should handle QA roulette wheel gameplay', async () => {
      const mockRouletteChallenge = {
        id: 'qa-roulette-1',
        type: 'quick-recall',
        content: {
          ion: 'Ca²⁺',
          question: 'What is the test for calcium ions?'
        },
        timeLimit: 10
      }

      vi.mocked(gameApi.startChallenge).mockResolvedValue(mockRouletteChallenge)

      render(<MemoryLabyrinthRealm />)

      const rouletteButton = screen.getByText('QA Roulette Wheel')
      fireEvent.click(rouletteButton)

      await waitFor(() => {
        expect(screen.getByText('Ca²⁺')).toBeInTheDocument()
        expect(screen.getByText(/What is the test for calcium ions?/)).toBeInTheDocument()
      })

      const answerInput = screen.getByRole('textbox')
      fireEvent.change(answerInput, { target: { value: 'Flame test - brick red' } })

      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(gameApi.submitAnswer).toHaveBeenCalled()
      })
    })
  })

  describe('Virtual Apprentice Realm Workflow', () => {
    it('should complete step-by-step simulator', async () => {
      const mockLabChallenge = {
        id: 'lab-procedure-1',
        type: 'procedure-ordering',
        content: {
          procedure: 'Titration',
          steps: [
            'Fill burette with standard solution',
            'Add indicator to conical flask',
            'Add analyte to conical flask',
            'Titrate until endpoint reached'
          ],
          correctOrder: [2, 0, 1, 3]
        }
      }

      vi.mocked(gameApi.startChallenge).mockResolvedValue(mockLabChallenge)

      render(<VirtualApprenticeRealm />)

      const simulatorButton = screen.getByText('Step-by-Step Simulator')
      fireEvent.click(simulatorButton)

      await waitFor(() => {
        expect(screen.getByText('Titration')).toBeInTheDocument()
      })

      // Drag and drop steps (simplified for testing)
      const steps = screen.getAllByText(/Fill burette|Add indicator|Add analyte|Titrate/)
      
      // Simulate correct ordering
      steps.forEach((step, index) => {
        fireEvent.dragStart(step)
        fireEvent.drop(step)
      })

      const checkOrderButton = screen.getByText('Check Order')
      fireEvent.click(checkOrderButton)

      await waitFor(() => {
        expect(gameApi.submitAnswer).toHaveBeenCalled()
      })
    })

    it('should handle time attack salt preparation', async () => {
      const mockSaltPrepChallenge = {
        id: 'salt-prep-1',
        type: 'time-attack',
        content: {
          salt: 'Copper sulfate',
          steps: [
            'Add copper oxide to sulfuric acid',
            'Heat gently until no more dissolves',
            'Filter to remove excess copper oxide',
            'Evaporate to crystallization point'
          ]
        },
        timeLimit: 60
      }

      vi.mocked(gameApi.startChallenge).mockResolvedValue(mockSaltPrepChallenge)

      render(<VirtualApprenticeRealm />)

      const timeAttackButton = screen.getByText('Time Attack Salt Prep')
      fireEvent.click(timeAttackButton)

      await waitFor(() => {
        expect(screen.getByText('Copper sulfate')).toBeInTheDocument()
      })

      // Click steps in sequence
      const steps = screen.getAllByRole('button', { name: /Add copper oxide|Heat gently|Filter|Evaporate/ })
      
      for (const step of steps) {
        fireEvent.click(step)
        await waitFor(() => {
          expect(step).toHaveClass('completed')
        })
      }

      await waitFor(() => {
        expect(screen.getByText(/Procedure Complete!/)).toBeInTheDocument()
      })
    })
  })

  describe('Cross-Realm Progression', () => {
    it('should unlock new realms after completing requirements', async () => {
      const mockProgressData = {
        unlockedRealms: ['mathmage-trials', 'memory-labyrinth'],
        level: 5,
        completedChallenges: 25
      }

      vi.mocked(gameApi.getPlayerProgress).mockResolvedValue(mockProgressData)

      render(<div>
        <MathmageTrialsRealm />
        <MemoryLabyrinthRealm />
      </div>)

      await waitFor(() => {
        expect(screen.getByText('Mathmage Trials')).toBeInTheDocument()
        expect(screen.getByText('Memory Labyrinth')).toBeInTheDocument()
      })

      // Verify locked realms are not accessible
      expect(screen.queryByText('Forest of Isomers')).not.toBeInTheDocument()
    })

    it('should track progress across multiple realms', async () => {
      const mockAnalytics = {
        totalXP: 2500,
        realmProgress: {
          'mathmage-trials': 0.8,
          'memory-labyrinth': 0.6,
          'virtual-apprentice': 0.3
        },
        weakAreas: ['organic-chemistry', 'data-analysis']
      }

      vi.mocked(gameApi.getAnalytics).mockResolvedValue(mockAnalytics)

      render(<div data-testid="progress-tracker" />)

      // This would be part of a progress tracking component
      await waitFor(() => {
        expect(gameApi.getAnalytics).toHaveBeenCalled()
      })
    })
  })
})