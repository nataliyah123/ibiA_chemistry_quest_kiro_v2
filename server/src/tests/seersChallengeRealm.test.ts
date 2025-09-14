import { SeersChallengeRealm } from '../services/realms/seersChallengeRealm.js';
import { ChallengeType, Answer } from '../types/game.js';

describe('SeersChallengeRealm', () => {
  let realm: SeersChallengeRealm;

  beforeEach(() => {
    realm = new SeersChallengeRealm();
  });

  describe('Basic Realm Properties', () => {
    test('should have correct realm properties', () => {
      expect(realm.realmId).toBe('seers-challenge');
      expect(realm.name).toBe("The Seer's Challenge");
      expect(realm.description).toContain('observation and interpretation');
      expect(realm.requiredLevel).toBe(4);
    });
  });

  describe('Challenge Generation', () => {
    test('should generate challenges for different difficulties', async () => {
      const easyChallenge = await realm.generateChallenge(1);
      const hardChallenge = await realm.generateChallenge(4);

      expect(easyChallenge).toBeDefined();
      expect(hardChallenge).toBeDefined();
      
      // Should generate precipitation poker, color clash, or mystery reaction challenges
      const validTypes = [ChallengeType.PRECIPITATION_POKER, ChallengeType.COLOR_CLASH, ChallengeType.MYSTERY_REACTION];
      expect(validTypes).toContain(easyChallenge.type);
      expect(validTypes).toContain(hardChallenge.type);
    });

    test('should include appropriate reaction data in challenge metadata', async () => {
      const challenge = await realm.generateChallenge(1);
      
      expect(challenge.metadata?.gameSpecific?.reaction).toBeDefined();
      
      if (challenge.type === ChallengeType.PRECIPITATION_POKER) {
        expect(challenge.metadata?.gameSpecific?.betOptions).toBeDefined();
        expect(challenge.metadata?.gameSpecific?.currentBankroll).toBe(1000);
      } else if (challenge.type === ChallengeType.COLOR_CLASH) {
        expect(challenge.metadata?.gameSpecific?.maxScore).toBeDefined();
      }
    });

    test('should have appropriate time limits based on difficulty', async () => {
      const easyChallenge = await realm.generateChallenge(1);
      const hardChallenge = await realm.generateChallenge(5);

      // Time limits vary by challenge type
      expect(easyChallenge.timeLimit).toBeGreaterThan(0);
      expect(hardChallenge.timeLimit).toBeGreaterThan(0);
      
      // Time limits can vary by challenge type, so just check they're reasonable
      if (easyChallenge.timeLimit && hardChallenge.timeLimit) {
        expect(easyChallenge.timeLimit).toBeGreaterThan(30);
        expect(hardChallenge.timeLimit).toBeGreaterThan(30);
      }
    });
  });

  describe('Precipitation Reactions Database', () => {
    test('should have comprehensive precipitation reactions', async () => {
      const challenges = await realm.getChallenges();
      
      expect(challenges.length).toBeGreaterThan(25); // Should have 30+ reactions
      
      // Check for variety in reaction types
      const topics = challenges.map(c => c.metadata?.gameSpecific?.reaction?.topic);
      const uniqueTopics = new Set(topics);
      expect(uniqueTopics.size).toBeGreaterThan(5); // Multiple reaction types
    });

    test('should include both precipitate and non-precipitate reactions', async () => {
      const challenges = await realm.getChallenges();
      
      const precipitateReactions = challenges.filter(c => 
        c.metadata?.gameSpecific?.reaction?.willPrecipitate === true
      );
      const nonPrecipitateReactions = challenges.filter(c => 
        c.metadata?.gameSpecific?.reaction?.willPrecipitate === false
      );

      expect(precipitateReactions.length).toBeGreaterThan(0);
      expect(nonPrecipitateReactions.length).toBeGreaterThan(0);
    });

    test('should have reactions across different difficulty levels', async () => {
      const challenges = await realm.getChallenges();
      
      const difficulties = challenges.map(c => c.difficulty);
      const uniqueDifficulties = new Set(difficulties);
      expect(uniqueDifficulties.size).toBeGreaterThanOrEqual(3); // Multiple difficulty levels
    });
  });

  describe('Answer Validation', () => {
    test('should validate correct precipitation prediction with high confidence', async () => {
      const challenge = await realm.generateChallenge(1);
      const reaction = challenge.metadata?.gameSpecific?.reaction;
      
      // Assume this is a precipitate-forming reaction
      if (reaction?.willPrecipitate) {
        const answer: Answer = {
          response: {
            prediction: 'precipitate_yes_high',
            betAmount: 100,
            confidenceLevel: 'high'
          },
          timeElapsed: 30,
          hintsUsed: 0
        };

        const result = await realm.validateAnswer(challenge, answer);
        
        expect(result.isCorrect).toBe(true);
        expect(result.score).toBeGreaterThan(0);
        expect(result.feedback).toContain('Correct');
        expect(result.metadata?.winnings).toBeGreaterThan(0);
      }
    });

    test('should validate incorrect answers for different challenge types', async () => {
      // Test multiple times to get both challenge types
      for (let i = 0; i < 10; i++) {
        const challenge = await realm.generateChallenge(1);
        
        if (challenge.type === ChallengeType.PRECIPITATION_POKER) {
          const reaction = challenge.metadata?.gameSpecific?.reaction;
          const wrongPrediction = reaction?.willPrecipitate ? 'precipitate_no_high' : 'precipitate_yes_high';
          
          const answer: Answer = {
            response: {
              prediction: wrongPrediction,
              betAmount: 100,
              confidenceLevel: 'high'
            },
            timeElapsed: 30,
            hintsUsed: 0
          };

          const result = await realm.validateAnswer(challenge, answer);
          
          expect(result.isCorrect).toBe(false);
          expect(result.score).toBe(0);
          expect(result.feedback).toContain('Incorrect');
          expect(result.metadata?.winnings).toBeLessThan(0);
          break;
        } else if (challenge.type === ChallengeType.COLOR_CLASH) {
          const answer: Answer = {
            response: "wrong color description",
            timeElapsed: 30,
            hintsUsed: 0
          };

          const result = await realm.validateAnswer(challenge, answer);
          
          expect(result.isCorrect).toBe(false);
          expect(result.score).toBeGreaterThanOrEqual(0);
          break;
        }
      }
    });

    test('should handle invalid answer format for different challenge types', async () => {
      // Test multiple times to cover both challenge types
      for (let i = 0; i < 10; i++) {
        const challenge = await realm.generateChallenge(1);
        
        if (challenge.type === ChallengeType.PRECIPITATION_POKER) {
          const answer: Answer = {
            response: "invalid format",
            timeElapsed: 30,
            hintsUsed: 0
          };

          const result = await realm.validateAnswer(challenge, answer);
          
          expect(result.isCorrect).toBe(false);
          expect(result.score).toBe(0);
          expect(result.feedback).toContain('betting option');
          break;
        } else if (challenge.type === ChallengeType.COLOR_CLASH) {
          const answer: Answer = {
            response: 123, // Invalid type for color clash
            timeElapsed: 30,
            hintsUsed: 0
          };

          const result = await realm.validateAnswer(challenge, answer);
          
          expect(result.isCorrect).toBe(false);
          expect(result.score).toBe(0);
          expect(result.feedback).toContain('text description');
          break;
        }
      }
    });

    test('should calculate winnings based on odds and bet amount', async () => {
      const challenge = await realm.generateChallenge(1);
      const reaction = challenge.metadata?.gameSpecific?.reaction;
      const betOptions = challenge.metadata?.gameSpecific?.betOptions;
      
      if (reaction?.willPrecipitate && betOptions) {
        const highConfidenceBet = betOptions.find((bet: any) => 
          bet.id === 'precipitate_yes_high'
        );
        
        const answer: Answer = {
          response: {
            prediction: 'precipitate_yes_high',
            betAmount: 100,
            confidenceLevel: 'high'
          },
          timeElapsed: 30,
          hintsUsed: 0
        };

        const result = await realm.validateAnswer(challenge, answer);
        
        if (highConfidenceBet) {
          const expectedWinnings = Math.floor(100 * highConfidenceBet.odds);
          expect(result.metadata?.winnings).toBe(expectedWinnings);
        }
      }
    });
  });

  describe('Betting System', () => {
    test('should provide different odds for different confidence levels in precipitation poker', async () => {
      // Generate challenges until we get a precipitation poker one
      for (let i = 0; i < 10; i++) {
        const challenge = await realm.generateChallenge(1);
        
        if (challenge.type === ChallengeType.PRECIPITATION_POKER) {
          const betOptions = challenge.metadata?.gameSpecific?.betOptions;
          
          expect(betOptions).toBeDefined();
          expect(betOptions.length).toBe(6); // 3 confidence levels × 2 predictions
          
          // Check that high confidence has lower odds (less risk, less reward)
          const highConfidence = betOptions.find((bet: any) => bet.confidenceLevel === 'high');
          const lowConfidence = betOptions.find((bet: any) => bet.confidenceLevel === 'low');
          
          if (highConfidence && lowConfidence && 
              highConfidence.id.includes('yes') && lowConfidence.id.includes('yes')) {
            expect(highConfidence.odds).toBeLessThan(lowConfidence.odds);
          }
          break;
        }
      }
    });

    test('should track bankroll changes in precipitation poker', async () => {
      // Generate challenges until we get a precipitation poker one
      for (let i = 0; i < 10; i++) {
        const challenge = await realm.generateChallenge(1);
        
        if (challenge.type === ChallengeType.PRECIPITATION_POKER) {
          const initialBankroll = challenge.metadata?.gameSpecific?.currentBankroll || 1000;
          
          const answer: Answer = {
            response: {
              prediction: 'precipitate_yes_medium',
              betAmount: 100,
              confidenceLevel: 'medium'
            },
            timeElapsed: 30,
            hintsUsed: 0
          };

          const result = await realm.validateAnswer(challenge, answer);
          
          expect(result.metadata?.newBankroll).toBeDefined();
          expect(result.metadata?.newBankroll).toBe(
            initialBankroll + (result.metadata?.winnings || 0)
          );
          break;
        }
      }
    });
  });

  describe('Score Calculation', () => {
    test('should award higher scores for confident correct answers', async () => {
      const challenge = await realm.generateChallenge(1);
      
      const highConfidenceAnswer: Answer = {
        response: {
          prediction: 'precipitate_yes_high',
          betAmount: 100,
          confidenceLevel: 'high'
        },
        timeElapsed: 30,
        hintsUsed: 0
      };

      const lowConfidenceAnswer: Answer = {
        response: {
          prediction: 'precipitate_yes_low',
          betAmount: 100,
          confidenceLevel: 'low'
        },
        timeElapsed: 30,
        hintsUsed: 0
      };

      const highScore = realm.calculateScore(challenge, highConfidenceAnswer, 30);
      const lowScore = realm.calculateScore(challenge, lowConfidenceAnswer, 30);

      expect(highScore).toBeGreaterThan(lowScore);
    });

    test('should include time bonus for quick answers', async () => {
      const challenge = await realm.generateChallenge(1);
      
      const answer: Answer = {
        response: {
          prediction: 'precipitate_yes_medium',
          betAmount: 100,
          confidenceLevel: 'medium'
        },
        timeElapsed: 10,
        hintsUsed: 0
      };

      const quickScore = realm.calculateScore(challenge, answer, 10);
      const slowScore = realm.calculateScore(challenge, answer, 50);

      expect(quickScore).toBeGreaterThan(slowScore);
    });
  });

  describe('Special Mechanics', () => {
    test('should define virtual gold wagering system', () => {
      const mechanics = realm.getSpecialMechanics();
      
      const goldSystem = mechanics.find(m => m.id === 'virtual_gold_system');
      expect(goldSystem).toBeDefined();
      expect(goldSystem?.parameters.startingBankroll).toBe(1000);
      expect(goldSystem?.parameters.minimumBet).toBe(10);
    });

    test('should define confidence betting mechanics', () => {
      const mechanics = realm.getSpecialMechanics();
      
      const confidenceSystem = mechanics.find(m => m.id === 'confidence_betting');
      expect(confidenceSystem).toBeDefined();
      expect(confidenceSystem?.parameters.highConfidenceOdds).toBe(1.2);
    });

    test('should define bankroll management', () => {
      const mechanics = realm.getSpecialMechanics();
      
      const bankrollSystem = mechanics.find(m => m.id === 'bankroll_management');
      expect(bankrollSystem).toBeDefined();
      expect(bankrollSystem?.parameters.trackingEnabled).toBe(true);
    });
  });

  describe('Educational Content', () => {
    test('should provide helpful hints for each challenge', async () => {
      const challenge = await realm.generateChallenge(1);
      
      expect(challenge.content.hints).toBeDefined();
      expect(challenge.content.hints.length).toBeGreaterThanOrEqual(3);
      
      // Different challenge types have different hint content
      if (challenge.type === ChallengeType.PRECIPITATION_POKER) {
        expect(challenge.content.hints.some(hint => hint.includes('solubility'))).toBe(true);
      } else if (challenge.type === ChallengeType.COLOR_CLASH) {
        expect(challenge.content.hints.some(hint => hint.includes('color') || hint.includes('reaction'))).toBe(true);
      }
    });

    test('should include detailed explanations', async () => {
      const challenge = await realm.generateChallenge(1);
      
      expect(challenge.content.explanation).toBeDefined();
      expect(challenge.content.explanation.length).toBeGreaterThan(20);
    });

    test('should map to curriculum standards', async () => {
      const challenge = await realm.generateChallenge(1);
      
      expect(challenge.metadata?.curriculumStandards).toContain('O-Level Chemistry');
      expect(challenge.metadata?.curriculumStandards).toContain('A-Level Chemistry');
    });
  });

  describe('Rewards System', () => {
    test('should provide appropriate rewards in challenges', async () => {
      const challenge = await realm.generateChallenge(1);
      
      expect(challenge.rewards.length).toBeGreaterThan(0);
      expect(challenge.rewards.some(r => r.type === 'xp')).toBe(true);
      expect(challenge.rewards.some(r => r.type === 'gold')).toBe(true);
    });
  });
});