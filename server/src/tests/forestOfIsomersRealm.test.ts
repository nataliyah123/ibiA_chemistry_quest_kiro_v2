import { ForestOfIsomersRealm } from '../services/realms/forestOfIsomersRealm.js';
import { ChallengeType, Answer } from '../types/game.js';

describe('ForestOfIsomersRealm', () => {
  let realm: ForestOfIsomersRealm;

  beforeEach(() => {
    realm = new ForestOfIsomersRealm();
  });

  describe('Basic Realm Properties', () => {
    test('should have correct realm properties', () => {
      expect(realm.realmId).toBe('forest-of-isomers');
      expect(realm.name).toBe('The Forest of Isomers');
      expect(realm.description).toContain('organic chemistry');
      expect(realm.requiredLevel).toBe(8);
    });
  });

  describe('Challenge Generation', () => {
    test('should generate challenges for all sample molecules and mechanisms', async () => {
      const challenges = await realm.getChallenges();
      
      expect(challenges.length).toBeGreaterThan(0);
      
      const namingChallenges = challenges.filter(c => c.type === ChallengeType.ORGANIC_NAMING);
      const mechanismChallenges = challenges.filter(c => c.type === ChallengeType.MECHANISM);
      const isomerChallenges = challenges.filter(c => c.type === ChallengeType.ISOMER_IDENTIFICATION);
      
      expect(namingChallenges.length).toBeGreaterThan(0);
      expect(mechanismChallenges.length).toBeGreaterThan(0);
      expect(isomerChallenges.length).toBeGreaterThan(0);
      expect(challenges.every(c => c.realmId === 'forest-of-isomers')).toBe(true);
    });

    test('should generate challenge with appropriate difficulty', async () => {
      const easyChallenge = await realm.generateChallenge(1);
      const hardChallenge = await realm.generateChallenge(5);
      
      expect(easyChallenge.difficulty).toBeLessThanOrEqual(2);
      expect(hardChallenge.difficulty).toBeGreaterThanOrEqual(4);
    });

    test('should include appropriate game data in challenge metadata', async () => {
      const challenges = await realm.getChallenges();
      const namingChallenge = challenges.find(c => c.type === ChallengeType.ORGANIC_NAMING);
      const mechanismChallenge = challenges.find(c => c.type === ChallengeType.MECHANISM);
      
      if (namingChallenge) {
        expect(namingChallenge.metadata?.gameData?.molecule).toBeDefined();
        expect(namingChallenge.metadata?.gameData?.vineStrangulationTime).toBeDefined();
        expect(namingChallenge.content.hints.length).toBeGreaterThan(0);
      }
      
      if (mechanismChallenge) {
        expect(mechanismChallenge.metadata?.gameData?.mechanism).toBeDefined();
        expect(mechanismChallenge.metadata?.gameData?.targetAccuracy).toBeDefined();
        expect(mechanismChallenge.content.hints.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Answer Validation', () => {
    test('should validate correct IUPAC names', async () => {
      // Force generation of a naming challenge
      const namingChallenges = (await realm.getChallenges()).filter(c => c.type === ChallengeType.ORGANIC_NAMING);
      const challenge = namingChallenges[0];
      
      const correctAnswer: Answer = {
        response: challenge.content.correctAnswer as string,
        timeElapsed: 30,
        hintsUsed: 0
      };

      const result = await realm.validateAnswer(challenge, correctAnswer);
      
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBeGreaterThan(0);
      expect(result.feedback).toContain('correct');
    });

    test('should handle incorrect answers with partial credit', async () => {
      const namingChallenges = (await realm.getChallenges()).filter(c => c.type === ChallengeType.ORGANIC_NAMING);
      const challenge = namingChallenges.find(c => c.difficulty === 2) || namingChallenges[0];
      
      const incorrectAnswer: Answer = {
        response: 'wrong-name',
        timeElapsed: 45,
        hintsUsed: 1
      };

      const result = await realm.validateAnswer(challenge, incorrectAnswer);
      
      expect(result.isCorrect).toBe(false);
      expect(result.partialCredit).toBeDefined();
      expect(result.feedback).toContain('correct IUPAC name');
    });

    test('should accept acceptable variations of IUPAC names', async () => {
      const namingChallenges = (await realm.getChallenges()).filter(c => c.type === ChallengeType.ORGANIC_NAMING);
      const challenge = namingChallenges[0];
      const correctName = challenge.content.correctAnswer as string;
      
      // Test variation without hyphens
      const variationAnswer: Answer = {
        response: correctName.replace(/-/g, ''),
        timeElapsed: 25,
        hintsUsed: 0
      };

      const result = await realm.validateAnswer(challenge, variationAnswer);
      
      expect(result.isCorrect).toBe(true);
    });

    test('should reject invalid answer formats for naming challenges', async () => {
      const namingChallenges = (await realm.getChallenges()).filter(c => c.type === ChallengeType.ORGANIC_NAMING);
      const challenge = namingChallenges[0];
      
      const invalidAnswer: Answer = {
        response: 123 as any, // Invalid format
        timeElapsed: 30,
        hintsUsed: 0
      };

      const result = await realm.validateAnswer(challenge, invalidAnswer);
      
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(0);
      expect(result.feedback).toContain('text');
    });

    test('should validate mechanism challenges', async () => {
      const mechanismChallenges = (await realm.getChallenges()).filter(c => c.type === ChallengeType.MECHANISM);
      const challenge = mechanismChallenges[0];
      
      // Create a valid mechanism answer
      const mechanismAnswer: Answer = {
        response: [
          {
            from: { position: [100, 200] },
            to: { position: [200, 200] },
            type: 'lone_pair'
          }
        ],
        timeElapsed: 60,
        hintsUsed: 0
      };

      const result = await realm.validateAnswer(challenge, mechanismAnswer);
      
      expect(result.isCorrect).toBeDefined();
      expect(result.partialCredit).toBeDefined();
      expect(result.feedback).toContain('targets');
    });

    test('should reject invalid mechanism answer formats', async () => {
      const mechanismChallenges = (await realm.getChallenges()).filter(c => c.type === ChallengeType.MECHANISM);
      const challenge = mechanismChallenges[0];
      
      const invalidAnswer: Answer = {
        response: 'invalid-mechanism-data',
        timeElapsed: 30,
        hintsUsed: 0
      };

      const result = await realm.validateAnswer(challenge, invalidAnswer);
      
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(0);
      expect(result.feedback).toContain('electron movement arrows');
    });

    test('should validate isomer challenges', async () => {
      const isomerChallenges = (await realm.getChallenges()).filter(c => c.type === ChallengeType.ISOMER_IDENTIFICATION);
      const challenge = isomerChallenges[0];
      
      // Create a valid isomer categorization answer
      const isomerAnswer: Answer = {
        response: [
          {
            name: 'butane',
            category: 'structural',
            type: 'straight-chain'
          }
        ],
        timeElapsed: 90,
        hintsUsed: 0
      };

      const result = await realm.validateAnswer(challenge, isomerAnswer);
      
      expect(result.isCorrect).toBeDefined();
      expect(result.partialCredit).toBeDefined();
      expect(result.feedback).toContain('categorized');
    });

    test('should reject invalid isomer answer formats', async () => {
      const isomerChallenges = (await realm.getChallenges()).filter(c => c.type === ChallengeType.ISOMER_IDENTIFICATION);
      const challenge = isomerChallenges[0];
      
      const invalidAnswer: Answer = {
        response: 'invalid-isomer-data',
        timeElapsed: 30,
        hintsUsed: 0
      };

      const result = await realm.validateAnswer(challenge, invalidAnswer);
      
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(0);
      expect(result.feedback).toContain('categorize the isomers');
    });
  });

  describe('Scoring System', () => {
    test('should calculate score with time bonus', async () => {
      const challenge = await realm.generateChallenge(2);
      challenge.timeLimit = 60;
      
      const fastAnswer: Answer = {
        response: challenge.content.correctAnswer as string,
        timeElapsed: 15,
        hintsUsed: 0
      };

      const slowAnswer: Answer = {
        response: challenge.content.correctAnswer as string,
        timeElapsed: 55,
        hintsUsed: 0
      };

      const fastScore = realm.calculateScore(challenge, fastAnswer, 15);
      const slowScore = realm.calculateScore(challenge, slowAnswer, 55);
      
      expect(fastScore).toBeGreaterThan(slowScore);
    });

    test('should apply hint penalty', async () => {
      const challenge = await realm.generateChallenge(2);
      
      const noHintsAnswer: Answer = {
        response: challenge.content.correctAnswer as string,
        timeElapsed: 30,
        hintsUsed: 0
      };

      const hintsAnswer: Answer = {
        response: challenge.content.correctAnswer as string,
        timeElapsed: 30,
        hintsUsed: 2
      };

      const noHintsScore = realm.calculateScore(challenge, noHintsAnswer, 30);
      const hintsScore = realm.calculateScore(challenge, hintsAnswer, 30);
      
      expect(noHintsScore).toBeGreaterThan(hintsScore);
    });
  });

  describe('Special Mechanics', () => {
    test('should define vine strangulation mechanic', () => {
      const mechanics = realm.getSpecialMechanics();
      
      const vineStrangulation = mechanics.find(m => m.id === 'vine_strangulation');
      expect(vineStrangulation).toBeDefined();
      expect(vineStrangulation?.parameters.strangulationRate).toBeDefined();
      expect(vineStrangulation?.parameters.warningTime).toBeDefined();
    });

    test('should define naming streak mechanic', () => {
      const mechanics = realm.getSpecialMechanics();
      
      const namingStreak = mechanics.find(m => m.id === 'naming_streak');
      expect(namingStreak).toBeDefined();
      expect(namingStreak?.parameters.streakMultiplier).toBeDefined();
    });

    test('should define molecular visualization mechanic', () => {
      const mechanics = realm.getSpecialMechanics();
      
      const molecularViz = mechanics.find(m => m.id === 'molecular_visualization');
      expect(molecularViz).toBeDefined();
      expect(molecularViz?.parameters.rotationEnabled).toBe(true);
    });
  });

  describe('Molecule Categories', () => {
    test('should include molecules from all functional groups', async () => {
      const challenges = await realm.getChallenges();
      const molecules = challenges.map(c => c.metadata?.gameData?.molecule);
      
      const categories = [...new Set(molecules.map(m => m?.category))];
      
      expect(categories).toContain('alkane');
      expect(categories).toContain('alkene');
      expect(categories).toContain('alcohol');
      expect(categories).toContain('aldehyde');
      expect(categories).toContain('ketone');
      expect(categories).toContain('carboxylic_acid');
      expect(categories).toContain('ester');
    });

    test('should have appropriate difficulty progression', async () => {
      const challenges = await realm.getChallenges();
      
      const alkanes = challenges.filter(c => 
        c.metadata?.gameData?.molecule?.category === 'alkane'
      );
      const aromatics = challenges.filter(c => 
        c.metadata?.gameData?.molecule?.category === 'aromatic'
      );
      
      const avgAlkaneDifficulty = alkanes.reduce((sum, c) => sum + c.difficulty, 0) / alkanes.length;
      const avgAromaticDifficulty = aromatics.reduce((sum, c) => sum + c.difficulty, 0) / aromatics.length;
      
      expect(avgAlkaneDifficulty).toBeLessThan(avgAromaticDifficulty);
    });
  });

  describe('Content Quality', () => {
    test('should provide helpful hints for each challenge', async () => {
      const challenges = await realm.getChallenges();
      const namingChallenge = challenges.find(c => c.type === ChallengeType.ORGANIC_NAMING);
      const mechanismChallenge = challenges.find(c => c.type === ChallengeType.MECHANISM);
      
      if (namingChallenge) {
        expect(namingChallenge.content.hints.length).toBeGreaterThanOrEqual(3);
        expect(namingChallenge.content.hints.some(hint => 
          hint.toLowerCase().includes('functional') || 
          hint.toLowerCase().includes('chain') ||
          hint.toLowerCase().includes('naming')
        )).toBe(true);
      }
      
      if (mechanismChallenge) {
        expect(mechanismChallenge.content.hints.length).toBeGreaterThanOrEqual(3);
        expect(mechanismChallenge.content.hints.some(hint => 
          hint.toLowerCase().includes('mechanism') || 
          hint.toLowerCase().includes('electron') ||
          hint.toLowerCase().includes('reaction')
        )).toBe(true);
      }
    });

    test('should include visual aids for challenges', async () => {
      const challenges = await realm.getChallenges();
      const namingChallenge = challenges.find(c => c.type === ChallengeType.ORGANIC_NAMING);
      const mechanismChallenge = challenges.find(c => c.type === ChallengeType.MECHANISM);
      
      if (namingChallenge) {
        expect(namingChallenge.content.visualAids).toBeDefined();
        expect(namingChallenge.content.visualAids!.length).toBeGreaterThan(0);
        expect(namingChallenge.content.visualAids![0].type).toBe('molecular_structure');
        expect(namingChallenge.content.visualAids![0].interactive).toBe(true);
      }
      
      if (mechanismChallenge) {
        expect(mechanismChallenge.content.visualAids).toBeDefined();
        expect(mechanismChallenge.content.visualAids!.length).toBeGreaterThan(0);
        expect(mechanismChallenge.content.visualAids![0].type).toBe('diagram');
        expect(mechanismChallenge.content.visualAids![0].interactive).toBe(true);
      }
    });

    test('should provide comprehensive explanations', async () => {
      const challenges = await realm.getChallenges();
      const namingChallenge = challenges.find(c => c.type === ChallengeType.ORGANIC_NAMING);
      const mechanismChallenge = challenges.find(c => c.type === ChallengeType.MECHANISM);
      
      if (namingChallenge) {
        expect(namingChallenge.content.explanation).toContain('IUPAC name');
        expect(namingChallenge.content.explanation).toContain(namingChallenge.content.correctAnswer);
        expect(namingChallenge.content.explanation.length).toBeGreaterThan(50);
      }
      
      if (mechanismChallenge) {
        expect(mechanismChallenge.content.explanation).toContain('mechanism');
        expect(mechanismChallenge.content.explanation.length).toBeGreaterThan(50);
      }
    });
  });

  describe('Boss Challenges', () => {
    test('should throw error for unimplemented boss challenges', async () => {
      await expect(realm.processBossChallenge('user1', 'unknown-boss'))
        .rejects.toThrow('Boss challenges not yet implemented');
    });
  });

  describe('Realm Integration', () => {
    test('should have proper realm configuration', () => {
      expect(realm.realmId).toBe('forest-of-isomers');
      expect(realm.name).toBe('The Forest of Isomers');
      expect(realm.requiredLevel).toBeGreaterThan(0);
    });
  });
});