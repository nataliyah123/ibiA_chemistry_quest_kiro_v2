import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import authSlice from '../store/authSlice'
import characterSlice from '../store/characterSlice'
import gameSlice from '../store/gameSlice'
import { AccessibilityProvider } from '../contexts/AccessibilityContext'

// Create a test store
const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      character: characterSlice,
      game: gameSlice,
    },
    preloadedState,
  })
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: any
  store?: ReturnType<typeof createTestStore>
}

const AllTheProviders = ({ 
  children, 
  store 
}: { 
  children: React.ReactNode
  store: ReturnType<typeof createTestStore>
}) => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AccessibilityProvider>
          {children}
        </AccessibilityProvider>
      </BrowserRouter>
    </Provider>
  )
}

const customRender = (
  ui: ReactElement,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders store={store}>{children}</AllTheProviders>
    ),
    ...renderOptions,
  })
}

// Mock game data for testing
export const mockCharacter = {
  id: 'test-character-1',
  userId: 'test-user-1',
  level: 5,
  experience: 1250,
  gold: 500,
  health: 100,
  mana: 80,
  unlockedRealms: ['mathmage-trials', 'memory-labyrinth'],
  inventory: [
    { id: 'badge-1', type: 'badge', name: 'First Steps', rarity: 'common' },
    { id: 'potion-1', type: 'potion', name: 'Health Potion', quantity: 3 }
  ],
  achievements: [
    { id: 'achievement-1', name: 'Welcome Alchemist', unlockedAt: new Date() }
  ],
  statistics: {
    totalChallengesCompleted: 25,
    averageAccuracy: 0.85,
    totalPlayTime: 3600,
    favoriteRealm: 'mathmage-trials'
  }
}

export const mockChallenge = {
  id: 'test-challenge-1',
  realmId: 'mathmage-trials',
  type: 'equation-balancing',
  difficulty: 3,
  title: 'Balance the Combustion',
  description: 'Balance this combustion reaction',
  content: {
    question: 'C₄H₁₀ + O₂ → CO₂ + H₂O',
    correctAnswer: ['2', '13', '8', '10'],
    explanation: 'This is a combustion reaction requiring careful coefficient balancing.',
    hints: ['Start with carbon atoms', 'Then balance hydrogen', 'Oxygen comes last']
  },
  timeLimit: 120,
  requiredLevel: 1,
  rewards: [
    { type: 'xp', amount: 50 },
    { type: 'gold', amount: 25 }
  ]
}

export const mockUser = {
  id: 'test-user-1',
  email: 'test@example.com',
  username: 'testuser',
  createdAt: new Date(),
  lastLoginAt: new Date(),
  preferences: {
    soundEnabled: true,
    animationsEnabled: true,
    difficultyPreference: 'adaptive' as const,
    accessibilityOptions: {
      highContrast: false,
      largeText: false,
      screenReader: false,
      keyboardNavigation: true
    }
  }
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render, createTestStore }