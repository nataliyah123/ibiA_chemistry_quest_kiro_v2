import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../testUtils'
import App from '../../App'
import * as authApi from '../../services/api'
import * as gameApi from '../../services/gameApi'
import * as characterApi from '../../services/characterApi'

vi.mock('../../services/api')
vi.mock('../../services/gameApi')
vi.mock('../../services/characterApi')

describe('End-to-End User Journeys', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('New User Registration and First Game', () => {
    it('should complete full new user journey', async () => {
      // Mock successful registration
      vi.mocked(authApi.register).mockResolvedValue({
        user: { id: 'user-1', email: 'newuser@test.com', username: 'newuser' },
        token: 'mock-jwt-token'
      })

      // Mock character creation
      vi.mocked(gameApi.initializeCharacter).mockResolvedValue({
        id: 'char-1',
        userId: 'user-1',
        level: 1,
        experience: 0,
        gold: 100,
        health: 100,
        mana: 50,
        unlockedRealms: ['mathmage-trials'],
        inventory: [],
        achievements: []
      })

      // Mock first challenge
      vi.mocked(gameApi.startChallenge).mockResolvedValue({
        id: 'tutorial-1',
        type: 'equation-balancing',
        content: {
          question: 'H₂ + Cl₂ → HCl',
          correctAnswer: ['1', '1', '2'],
          explanation: 'Simple synthesis reaction'
        },
        timeLimit: 60
      })

      render(<App />)

      // 1. User sees landing page and clicks register
      expect(screen.getByText(/Welcome to ChemQuest/)).toBeInTheDocument()
      
      const registerButton = screen.getByText('Get Started')
      fireEvent.click(registerButton)

      // 2. Fill out registration form
      await waitFor(() => {
        expect(screen.getByText('Create Account')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'newuser@test.com' }
      })
      fireEvent.change(screen.getByLabelText('Username'), {
        target: { value: 'newuser' }
      })
      fireEvent.change(screen.getByLabelText('Password'), {
        target: { value: 'password123' }
      })

      const submitRegister = screen.getByRole('button', { name: 'Create Account' })
      fireEvent.click(submitRegister)

      // 3. Character creation and tutorial
      await waitFor(() => {
        expect(screen.getByText(/Welcome, Alchemist!/)).toBeInTheDocument()
      })

      const startTutorialButton = screen.getByText('Begin Your Journey')
      fireEvent.click(startTutorialButton)

      // 4. First challenge - equation balancing
      await waitFor(() => {
        expect(screen.getByText('H₂ + Cl₂ → HCl')).toBeInTheDocument()
      })

      const coefficientInputs = screen.getAllByRole('textbox')
      fireEvent.change(coefficientInputs[0], { target: { value: '1' } })
      fireEvent.change(coefficientInputs[1], { target: { value: '1' } })
      fireEvent.change(coefficientInputs[2], { target: { value: '2' } })

      // Mock successful completion
      vi.mocked(gameApi.submitAnswer).mockResolvedValue({
        isCorrect: true,
        score: 100,
        timeElapsed: 30
      })

      vi.mocked(gameApi.completeChallenge).mockResolvedValue([
        { type: 'xp', amount: 50 },
        { type: 'gold', amount: 25 }
      ])

      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)

      // 5. Success feedback and progression
      await waitFor(() => {
        expect(screen.getByText(/Excellent work!/)).toBeInTheDocument()
        expect(screen.getByText(/\+50 XP/)).toBeInTheDocument()
        expect(screen.getByText(/\+25 Gold/)).toBeInTheDocument()
      })

      // 6. Access to main dashboard
      const continueButton = screen.getByText('Continue')
      fireEvent.click(continueButton)

      await waitFor(() => {
        expect(screen.getByText('Alchemist Dashboard')).toBeInTheDocument()
        expect(screen.getByText('Mathmage Trials')).toBeInTheDocument()
      })

      // Verify API calls were made correctly
      expect(authApi.register).toHaveBeenCalledWith({
        email: 'newuser@test.com',
        username: 'newuser',
        password: 'password123'
      })
      expect(gameApi.initializeCharacter).toHaveBeenCalledWith('user-1')
      expect(gameApi.startChallenge).toHaveBeenCalled()
      expect(gameApi.submitAnswer).toHaveBeenCalled()
    })
  })

  describe('Returning User Login and Progression', () => {
    it('should handle returning user login and continue progress', async () => {
      // Mock successful login
      vi.mocked(authApi.login).mockResolvedValue({
        user: { id: 'user-2', email: 'returning@test.com', username: 'returninguser' },
        token: 'mock-jwt-token'
      })

      // Mock existing character data
      vi.mocked(characterApi.getCharacter).mockResolvedValue({
        id: 'char-2',
        userId: 'user-2',
        level: 8,
        experience: 3200,
        gold: 850,
        health: 100,
        mana: 90,
        unlockedRealms: ['mathmage-trials', 'memory-labyrinth', 'virtual-apprentice'],
        inventory: [
          { id: 'badge-1', type: 'badge', name: 'Equation Master' },
          { id: 'potion-1', type: 'potion', name: 'Mana Potion', quantity: 5 }
        ],
        achievements: [
          { id: 'first-realm', name: 'Realm Explorer' },
          { id: 'speed-demon', name: 'Speed Demon' }
        ]
      })

      render(<App />)

      // 1. User clicks login
      const loginButton = screen.getByText('Login')
      fireEvent.click(loginButton)

      // 2. Fill login form
      await waitFor(() => {
        expect(screen.getByText('Welcome Back')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'returning@test.com' }
      })
      fireEvent.change(screen.getByLabelText('Password'), {
        target: { value: 'password123' }
      })

      const submitLogin = screen.getByRole('button', { name: 'Login' })
      fireEvent.click(submitLogin)

      // 3. Dashboard with existing progress
      await waitFor(() => {
        expect(screen.getByText('Welcome back, returninguser!')).toBeInTheDocument()
        expect(screen.getByText('Level 8')).toBeInTheDocument()
        expect(screen.getByText('850 Gold')).toBeInTheDocument()
      })

      // 4. Multiple realms available
      expect(screen.getByText('Mathmage Trials')).toBeInTheDocument()
      expect(screen.getByText('Memory Labyrinth')).toBeInTheDocument()
      expect(screen.getByText('Virtual Apprentice')).toBeInTheDocument()

      // 5. Inventory and achievements visible
      expect(screen.getByText('Equation Master')).toBeInTheDocument()
      expect(screen.getByText('Realm Explorer')).toBeInTheDocument()
    })
  })

  describe('Complete Realm Progression Journey', () => {
    it('should complete progression through multiple realms', async () => {
      // Setup authenticated user
      const mockUser = {
        id: 'user-3',
        email: 'progressor@test.com',
        username: 'progressor'
      }

      vi.mocked(authApi.getCurrentUser).mockResolvedValue(mockUser)

      // Mock character at realm completion threshold
      vi.mocked(characterApi.getCharacter).mockResolvedValue({
        id: 'char-3',
        userId: 'user-3',
        level: 15,
        experience: 7500,
        gold: 2000,
        health: 100,
        mana: 100,
        unlockedRealms: ['mathmage-trials', 'memory-labyrinth', 'virtual-apprentice', 'seers-challenge'],
        inventory: [],
        achievements: []
      })

      render(<App />)

      // 1. Navigate to Seer's Challenge (advanced realm)
      await waitFor(() => {
        expect(screen.getByText("Seer's Challenge")).toBeInTheDocument()
      })

      const seersRealmButton = screen.getByText("Seer's Challenge")
      fireEvent.click(seersRealmButton)

      // 2. Complete Precipitate Poker challenge
      vi.mocked(gameApi.startChallenge).mockResolvedValue({
        id: 'precipitate-poker-1',
        type: 'prediction',
        content: {
          reaction: 'AgNO₃ + NaCl →',
          options: ['No precipitate', 'White precipitate', 'Yellow precipitate'],
          correctAnswer: 'White precipitate'
        }
      })

      await waitFor(() => {
        expect(screen.getByText('Precipitate Poker')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Precipitate Poker'))

      await waitFor(() => {
        expect(screen.getByText('AgNO₃ + NaCl →')).toBeInTheDocument()
      })

      // Make prediction
      fireEvent.click(screen.getByText('White precipitate'))

      // Mock successful prediction
      vi.mocked(gameApi.submitAnswer).mockResolvedValue({
        isCorrect: true,
        score: 90,
        goldWon: 100
      })

      const placeBetButton = screen.getByText('Place Bet')
      fireEvent.click(placeBetButton)

      // 3. Level up from successful completion
      vi.mocked(gameApi.levelUp).mockResolvedValue({
        newLevel: 16,
        unlockedFeatures: ['cartographers-gauntlet'],
        rewards: [{ type: 'gold', amount: 200 }]
      })

      await waitFor(() => {
        expect(screen.getByText(/Level Up!/)).toBeInTheDocument()
        expect(screen.getByText(/New realm unlocked/)).toBeInTheDocument()
      })

      // 4. Access newly unlocked realm
      const continueButton = screen.getByText('Continue')
      fireEvent.click(continueButton)

      await waitFor(() => {
        expect(screen.getByText("Cartographer's Gauntlet")).toBeInTheDocument()
      })
    })
  })

  describe('Social Features and Competition', () => {
    it('should handle leaderboard and friend challenges', async () => {
      // Mock authenticated user with friends
      vi.mocked(authApi.getCurrentUser).mockResolvedValue({
        id: 'user-4',
        email: 'social@test.com',
        username: 'socialuser'
      })

      // Mock leaderboard data
      vi.mocked(gameApi.getLeaderboard).mockResolvedValue([
        { username: 'topplayer', score: 5000, rank: 1 },
        { username: 'socialuser', score: 3200, rank: 5 },
        { username: 'friend1', score: 2800, rank: 8 }
      ])

      render(<App />)

      // 1. Navigate to leaderboard
      const leaderboardButton = screen.getByText('Leaderboard')
      fireEvent.click(leaderboardButton)

      await waitFor(() => {
        expect(screen.getByText('Global Rankings')).toBeInTheDocument()
        expect(screen.getByText('topplayer')).toBeInTheDocument()
        expect(screen.getByText('Rank: 5')).toBeInTheDocument()
      })

      // 2. Challenge a friend
      const challengeFriendButton = screen.getByText('Challenge Friend')
      fireEvent.click(challengeFriendButton)

      // Mock challenge creation
      vi.mocked(gameApi.createFriendChallenge).mockResolvedValue({
        id: 'friend-challenge-1',
        challengerId: 'user-4',
        challengeeId: 'friend1',
        challengeType: 'equation-speed',
        status: 'pending'
      })

      await waitFor(() => {
        expect(screen.getByText('Challenge Sent!')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility User Journey', () => {
    it('should support keyboard navigation throughout the app', async () => {
      render(<App />)

      // Mock authenticated user
      vi.mocked(authApi.getCurrentUser).mockResolvedValue({
        id: 'user-5',
        email: 'accessible@test.com',
        username: 'keyboarduser'
      })

      // 1. Tab navigation through main interface
      const firstFocusableElement = screen.getByRole('button', { name: 'Login' })
      firstFocusableElement.focus()
      expect(document.activeElement).toBe(firstFocusableElement)

      // 2. Enable accessibility features
      fireEvent.keyDown(document, { key: 'Tab' })
      fireEvent.keyDown(document, { key: 'Enter' })

      // 3. Navigate to accessibility settings
      const accessibilityButton = screen.getByLabelText('Accessibility Settings')
      fireEvent.click(accessibilityButton)

      await waitFor(() => {
        expect(screen.getByText('Accessibility Options')).toBeInTheDocument()
      })

      // 4. Enable high contrast mode
      const highContrastToggle = screen.getByLabelText('High Contrast Mode')
      fireEvent.click(highContrastToggle)

      expect(document.body).toHaveClass('high-contrast')

      // 5. Enable screen reader mode
      const screenReaderToggle = screen.getByLabelText('Screen Reader Support')
      fireEvent.click(screenReaderToggle)

      // 6. Verify ARIA labels are present
      expect(screen.getByLabelText('Character Level')).toBeInTheDocument()
      expect(screen.getByLabelText('Experience Points')).toBeInTheDocument()
    })
  })
})