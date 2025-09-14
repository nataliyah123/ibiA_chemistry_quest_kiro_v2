import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Test database connection
const testDb = new Pool({
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  database: process.env.TEST_DB_NAME || 'chemquest_test',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'password',
})

export interface TestUser {
  id: string
  email: string
  username: string
  password: string
  hashedPassword: string
}

export interface TestCharacter {
  id: string
  userId: string
  level: number
  experience: number
  gold: number
  health: number
  mana: number
  unlockedRealms: string[]
  inventory: any[]
  achievements: any[]
}

// Create a test user
export async function createTestUser(email: string, username: string, password: string = 'testpassword123'): Promise<TestUser> {
  const hashedPassword = await bcrypt.hash(password, 10)
  
  const result = await testDb.query(
    'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id',
    [email, username, hashedPassword]
  )
  
  return {
    id: result.rows[0].id,
    email,
    username,
    password,
    hashedPassword
  }
}

// Create a test character
export async function createTestCharacter(userId: string, overrides: Partial<TestCharacter> = {}): Promise<TestCharacter> {
  const defaultCharacter = {
    userId,
    level: 1,
    experience: 0,
    gold: 100,
    health: 100,
    mana: 50,
    unlockedRealms: ['mathmage-trials'],
    inventory: [],
    achievements: []
  }
  
  const character = { ...defaultCharacter, ...overrides }
  
  const result = await testDb.query(
    `INSERT INTO characters (user_id, level, experience, gold, health, mana, unlocked_realms, inventory, achievements) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [
      character.userId,
      character.level,
      character.experience,
      character.gold,
      character.health,
      character.mana,
      JSON.stringify(character.unlockedRealms),
      JSON.stringify(character.inventory),
      JSON.stringify(character.achievements)
    ]
  )
  
  return {
    id: result.rows[0].id,
    ...character
  }
}

// Generate JWT token for testing
export function generateTestToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  )
}

// Create test challenge data
export function createTestChallenge(realmId: string, type: string, overrides: any = {}) {
  const baseChallenge = {
    id: `test-challenge-${Date.now()}`,
    realmId,
    type,
    difficulty: 1,
    title: 'Test Challenge',
    description: 'A test challenge',
    content: {
      question: 'Test question?',
      correctAnswer: 'Test answer',
      explanation: 'Test explanation'
    },
    timeLimit: 60,
    requiredLevel: 1,
    rewards: [
      { type: 'xp', amount: 50 },
      { type: 'gold', amount: 25 }
    ]
  }
  
  return { ...baseChallenge, ...overrides }
}

// Clean up test data
export async function cleanupTestData(): Promise<void> {
  await testDb.query('DELETE FROM attempt_data WHERE user_id LIKE $1', ['test-%'])
  await testDb.query('DELETE FROM characters WHERE user_id LIKE $1', ['test-%'])
  await testDb.query('DELETE FROM users WHERE email LIKE $1', ['%@test.com'])
  await testDb.query('DELETE FROM challenges WHERE id LIKE $1', ['test-%'])
  await testDb.query('DELETE FROM leaderboard_entries WHERE user_id LIKE $1', ['test-%'])
}

// Setup test database
export async function setupTestDatabase(): Promise<void> {
  // Create test tables if they don't exist
  await testDb.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      username VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login_at TIMESTAMP
    )
  `)
  
  await testDb.query(`
    CREATE TABLE IF NOT EXISTS characters (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      level INTEGER DEFAULT 1,
      experience INTEGER DEFAULT 0,
      gold INTEGER DEFAULT 100,
      health INTEGER DEFAULT 100,
      mana INTEGER DEFAULT 50,
      unlocked_realms JSONB DEFAULT '["mathmage-trials"]',
      inventory JSONB DEFAULT '[]',
      achievements JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  await testDb.query(`
    CREATE TABLE IF NOT EXISTS attempt_data (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      challenge_id VARCHAR(255) NOT NULL,
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP,
      answer JSONB,
      is_correct BOOLEAN,
      score INTEGER,
      hints_used INTEGER DEFAULT 0,
      time_elapsed INTEGER,
      metadata JSONB DEFAULT '{}'
    )
  `)
  
  await testDb.query(`
    CREATE TABLE IF NOT EXISTS leaderboard_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      category VARCHAR(100) NOT NULL,
      score INTEGER NOT NULL,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

// Teardown test database
export async function teardownTestDatabase(): Promise<void> {
  await cleanupTestData()
  await testDb.end()
}

// Mock performance data
export function generateMockPerformanceData(userId: string, challengeCount: number = 10) {
  const attempts = []
  
  for (let i = 0; i < challengeCount; i++) {
    attempts.push({
      challengeId: `challenge-${i}`,
      userId,
      startTime: new Date(Date.now() - (challengeCount - i) * 60000),
      endTime: new Date(Date.now() - (challengeCount - i) * 60000 + Math.random() * 120000),
      answer: `answer-${i}`,
      isCorrect: Math.random() > 0.3, // 70% success rate
      score: Math.floor(Math.random() * 100),
      hintsUsed: Math.floor(Math.random() * 3),
      timeElapsed: Math.floor(Math.random() * 120),
      metadata: {
        difficulty: Math.floor(Math.random() * 5) + 1,
        realm: ['mathmage-trials', 'memory-labyrinth', 'virtual-apprentice'][Math.floor(Math.random() * 3)]
      }
    })
  }
  
  return attempts
}

// Wait for async operations in tests
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Assert response structure
export function assertValidApiResponse(response: any, expectedFields: string[]) {
  expect(response).toBeDefined()
  expectedFields.forEach(field => {
    expect(response).toHaveProperty(field)
  })
}

// Generate test equation data
export function generateTestEquations() {
  return [
    {
      equation: 'H₂ + Cl₂ → HCl',
      coefficients: [1, 1, 2],
      difficulty: 1
    },
    {
      equation: 'C₄H₁₀ + O₂ → CO₂ + H₂O',
      coefficients: [2, 13, 8, 10],
      difficulty: 3
    },
    {
      equation: 'Al + CuSO₄ → Al₂(SO₄)₃ + Cu',
      coefficients: [2, 3, 1, 3],
      difficulty: 4
    },
    {
      equation: 'Ca(OH)₂ + HCl → CaCl₂ + H₂O',
      coefficients: [1, 2, 1, 2],
      difficulty: 2
    }
  ]
}

// Generate test organic molecules
export function generateTestOrganicMolecules() {
  return [
    {
      structure: 'CH₄',
      iupacName: 'methane',
      functionalGroups: ['alkane'],
      difficulty: 1
    },
    {
      structure: 'CH₃CH₂OH',
      iupacName: 'ethanol',
      functionalGroups: ['alcohol'],
      difficulty: 2
    },
    {
      structure: 'CH₃CH₂CH₂COOH',
      iupacName: 'butanoic acid',
      functionalGroups: ['carboxylic acid'],
      difficulty: 3
    },
    {
      structure: 'CH₃CH(CH₃)CH₂CH₃',
      iupacName: '2-methylbutane',
      functionalGroups: ['alkane'],
      difficulty: 4
    }
  ]
}

// Export default to make it a proper module
export default {
  createTestUser,
  createTestCharacter,
  generateTestToken,
  createTestChallenge,
  cleanupTestData,
  setupTestDatabase,
  teardownTestDatabase,
  generateMockPerformanceData,
  waitFor,
  assertValidApiResponse,
  generateTestEquations,
  generateTestOrganicMolecules
}