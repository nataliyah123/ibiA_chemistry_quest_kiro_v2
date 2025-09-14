import { GameEngine } from '../services/gameEngine';
import { GameCharacterService } from '../services/gameCharacterService';
import { RealmType } from '../types/game';

// Mock the database connection
jest.mock('../config/database', () => ({
  connect: jest.fn(() => ({
    query: jest.fn(),
    release: jest.fn()
  })),
  query: jest.fn()
}));

describe('GameEngine', () => {
  let gameEngine: GameEngine;
  let characterService: GameCharacterService;

  beforeEach(() => {
    characterService = new GameCharacterService();
    gameEngine = new GameEngine(characterService);
  });

  describe('calculateLevel', () => {
    it('should calculate correct level from experience', () => {
      // Access private method through type assertion
      const calculateLevel = (gameEngine as any).calculateLevel;
      
      expect(calculateLevel(0)).toBe(1);
      expect(calculateLevel(100)).toBe(2);
      expect(calculateLevel(400)).toBe(3);
      expect(calculateLevel(900)).toBe(4);
    });
  });

  describe('calculateScore', () => {
    it('should calculate score with time bonus', () => {
      const challenge = {
        id: 'test-challenge',
        realmId: RealmType.MATHMAGE_TRIALS,
        type: 'equation_balance' as any,
        difficulty: 5,
        title: 'Test Challenge',
        description: 'Test',
        content: {
          question: 'Test question',
          correctAnswer: 'test',
          explanation: 'Test explanation',
          hints: []
        },
        timeLimit: 60,
        requiredLevel: 1,
        rewards: [],
        metadata: {
          concepts: [],
          curriculumStandards: [],
          estimatedDuration: 60,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      const answer = {
        challengeId: 'test-challenge',
        userId: 'test-user',
        response: 'test',
        timeElapsed: 30,
        hintsUsed: 0,
        submittedAt: new Date()
      };

      const validation = {
        isCorrect: true,
        score: 100,
        feedback: 'Correct!'
      };

      // Access private method through type assertion
      const calculateScore = (gameEngine as any).calculateScore;
      const score = calculateScore(challenge, answer, validation);

      expect(score).toBeGreaterThan(100); // Should have time bonus
    });
  });

  describe('getRealmUnlocksByLevel', () => {
    it('should return correct realms for different levels', () => {
      // Access private method through type assertion
      const getRealmUnlocksByLevel = (gameEngine as any).getRealmUnlocksByLevel;
      
      expect(getRealmUnlocksByLevel(1)).toContain(RealmType.MATHMAGE_TRIALS);
      expect(getRealmUnlocksByLevel(5)).toContain(RealmType.VIRTUAL_APPRENTICE);
      expect(getRealmUnlocksByLevel(15)).toContain(RealmType.FOREST_OF_ISOMERS);
    });
  });
});