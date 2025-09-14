import { RealmComponent, RealmMechanic } from '../realmComponent.js';
import { 
  Challenge, 
  Answer, 
  ValidationResult, 
  BossResult,
  ChallengeType,
  ChallengeContent,
  Reward
} from '../../types/game.js';

// Memory challenge interfaces
export interface FlashcardPair {
  id: string;
  front: string;
  back: string;
  category: string;
  difficulty: number;
}

export interface GasTest {
  ion: string;
  test: string;
  result: string;
  color?: string;
  description: string;
  category: 'gas_test' | 'flame_color' | 'ion_identification';
}

export interface SolubilityRule {
  rule: string;
  examples: string[];
  exceptions: string[];
  difficulty: number;
}

export class MemoryLabyrinthRealm extends RealmComponent {
  realmId = 'memory-labyrinth';
  name = 'The Memory Labyrinth';
  description = 'Master memorization through interactive games and unlock animated mnemonics';
  requiredLevel = 3;

  // Gas tests and flame colors database (20+ tests)
  private gasTestsDatabase: GasTest[] = [
    // Gas tests
    {
      ion: 'Hydrogen (H₂)',
      test: 'Lighted splint',
      result: 'Burns with a pop sound',
      description: 'Hydrogen gas burns rapidly with oxygen producing a distinctive popping sound',
      category: 'gas_test'
    },
    {
      ion: 'Oxygen (O₂)',
      test: 'Glowing splint',
      result: 'Relights the splint',
      description: 'Oxygen supports combustion and will relight a glowing wooden splint',
      category: 'gas_test'
    },
    {
      ion: 'Carbon dioxide (CO₂)',
      test: 'Limewater',
      result: 'Turns milky/cloudy',
      description: 'CO₂ reacts with calcium hydroxide to form insoluble calcium carbonate',
      category: 'gas_test'
    },
    {
      ion: 'Ammonia (NH₃)',
      test: 'Damp red litmus paper',
      result: 'Turns blue',
      description: 'Ammonia is alkaline and turns red litmus paper blue',
      category: 'gas_test'
    },
    {
      ion: 'Chlorine (Cl₂)',
      test: 'Damp blue litmus paper',
      result: 'Bleaches white',
      description: 'Chlorine is a strong bleaching agent that removes color from litmus',
      category: 'gas_test'
    },
    {
      ion: 'Sulfur dioxide (SO₂)',
      test: 'Acidified potassium dichromate',
      result: 'Orange to green color change',
      description: 'SO₂ reduces dichromate ions, changing from orange to green',
      category: 'gas_test'
    },
    
    // Flame colors
    {
      ion: 'Lithium (Li⁺)',
      test: 'Flame test',
      result: 'Crimson red flame',
      color: '#DC143C',
      description: 'Lithium compounds produce a distinctive crimson red flame',
      category: 'flame_color'
    },
    {
      ion: 'Sodium (Na⁺)',
      test: 'Flame test',
      result: 'Golden yellow flame',
      color: '#FFD700',
      description: 'Sodium compounds produce a bright golden yellow flame',
      category: 'flame_color'
    },
    {
      ion: 'Potassium (K⁺)',
      test: 'Flame test',
      result: 'Lilac/violet flame',
      color: '#9370DB',
      description: 'Potassium compounds produce a lilac or violet colored flame',
      category: 'flame_color'
    },
    {
      ion: 'Calcium (Ca²⁺)',
      test: 'Flame test',
      result: 'Brick red flame',
      color: '#B22222',
      description: 'Calcium compounds produce a brick red colored flame',
      category: 'flame_color'
    },
    {
      ion: 'Copper (Cu²⁺)',
      test: 'Flame test',
      result: 'Blue-green flame',
      color: '#008B8B',
      description: 'Copper compounds produce a distinctive blue-green flame',
      category: 'flame_color'
    },
    {
      ion: 'Barium (Ba²⁺)',
      test: 'Flame test',
      result: 'Apple green flame',
      color: '#32CD32',
      description: 'Barium compounds produce an apple green colored flame',
      category: 'flame_color'
    },
    {
      ion: 'Strontium (Sr²⁺)',
      test: 'Flame test',
      result: 'Crimson red flame',
      color: '#DC143C',
      description: 'Strontium compounds produce a crimson red flame similar to lithium',
      category: 'flame_color'
    },
    
    // Ion identification tests
    {
      ion: 'Chloride (Cl⁻)',
      test: 'Silver nitrate + nitric acid',
      result: 'White precipitate',
      description: 'Forms silver chloride precipitate, soluble in ammonia',
      category: 'ion_identification'
    },
    {
      ion: 'Bromide (Br⁻)',
      test: 'Silver nitrate + nitric acid',
      result: 'Cream precipitate',
      description: 'Forms silver bromide precipitate, partially soluble in ammonia',
      category: 'ion_identification'
    },
    {
      ion: 'Iodide (I⁻)',
      test: 'Silver nitrate + nitric acid',
      result: 'Yellow precipitate',
      description: 'Forms silver iodide precipitate, insoluble in ammonia',
      category: 'ion_identification'
    },
    {
      ion: 'Sulfate (SO₄²⁻)',
      test: 'Barium chloride + hydrochloric acid',
      result: 'White precipitate',
      description: 'Forms barium sulfate precipitate, insoluble in acids',
      category: 'ion_identification'
    },
    {
      ion: 'Carbonate (CO₃²⁻)',
      test: 'Dilute hydrochloric acid',
      result: 'Effervescence (CO₂ gas)',
      description: 'Produces carbon dioxide gas which turns limewater milky',
      category: 'ion_identification'
    },
    {
      ion: 'Iron(II) (Fe²⁺)',
      test: 'Sodium hydroxide',
      result: 'Green precipitate',
      description: 'Forms iron(II) hydroxide, green precipitate that darkens on standing',
      category: 'ion_identification'
    },
    {
      ion: 'Iron(III) (Fe³⁺)',
      test: 'Sodium hydroxide',
      result: 'Red-brown precipitate',
      description: 'Forms iron(III) hydroxide, red-brown gelatinous precipitate',
      category: 'ion_identification'
    },
    {
      ion: 'Copper(II) (Cu²⁺)',
      test: 'Sodium hydroxide',
      result: 'Blue precipitate',
      description: 'Forms copper(II) hydroxide, pale blue precipitate',
      category: 'ion_identification'
    },
    {
      ion: 'Zinc (Zn²⁺)',
      test: 'Sodium hydroxide',
      result: 'White precipitate',
      description: 'Forms zinc hydroxide, white precipitate soluble in excess NaOH',
      category: 'ion_identification'
    },
    {
      ion: 'Aluminum (Al³⁺)',
      test: 'Sodium hydroxide',
      result: 'White precipitate',
      description: 'Forms aluminum hydroxide, white precipitate soluble in excess NaOH',
      category: 'ion_identification'
    }
  ];

  // Solubility rules database (40+ questions)
  private solubilityRules: SolubilityRule[] = [
    {
      rule: 'All nitrates are soluble',
      examples: ['NaNO₃', 'Ca(NO₃)₂', 'AgNO₃', 'Pb(NO₃)₂'],
      exceptions: [],
      difficulty: 1
    },
    {
      rule: 'All Group 1 compounds are soluble',
      examples: ['NaCl', 'KBr', 'LiI', 'Na₂SO₄'],
      exceptions: [],
      difficulty: 1
    },
    {
      rule: 'All ammonium compounds are soluble',
      examples: ['NH₄Cl', '(NH₄)₂SO₄', 'NH₄NO₃'],
      exceptions: [],
      difficulty: 1
    },
    {
      rule: 'Most chlorides are soluble',
      examples: ['NaCl', 'KCl', 'MgCl₂'],
      exceptions: ['AgCl', 'PbCl₂', 'Hg₂Cl₂'],
      difficulty: 2
    },
    {
      rule: 'Most sulfates are soluble',
      examples: ['Na₂SO₄', 'K₂SO₄', 'MgSO₄'],
      exceptions: ['BaSO₄', 'PbSO₄', 'CaSO₄'],
      difficulty: 2
    },
    {
      rule: 'Most carbonates are insoluble',
      examples: ['CaCO₃', 'BaCO₃', 'PbCO₃'],
      exceptions: ['Na₂CO₃', 'K₂CO₃', '(NH₄)₂CO₃'],
      difficulty: 2
    },
    {
      rule: 'Most hydroxides are insoluble',
      examples: ['Mg(OH)₂', 'Ca(OH)₂', 'Fe(OH)₃'],
      exceptions: ['NaOH', 'KOH', 'Ba(OH)₂'],
      difficulty: 2
    },
    {
      rule: 'Most phosphates are insoluble',
      examples: ['Ca₃(PO₄)₂', 'AlPO₄', 'FePO₄'],
      exceptions: ['Na₃PO₄', 'K₃PO₄', '(NH₄)₃PO₄'],
      difficulty: 3
    }
  ];

  async getChallenges(): Promise<Challenge[]> {
    const challenges: Challenge[] = [];
    
    // Generate flashcard match challenges
    for (let i = 1; i <= 5; i++) {
      const challenge = await this.generateFlashcardMatchChallenge(i);
      challenges.push(challenge);
    }

    // Generate QA Roulette challenges
    for (let i = 1; i <= 3; i++) {
      const challenge = await this.generateQARouletteChallenge(i);
      challenges.push(challenge);
    }

    // Generate Survival Mode challenges
    for (let i = 1; i <= 3; i++) {
      const challenge = await this.generateSurvivalModeChallenge(i);
      challenges.push(challenge);
    }

    return challenges;
  }

  async generateChallenge(difficulty: number): Promise<Challenge> {
    const challengeTypes = ['flashcard_match', 'qa_roulette', 'survival_mode'];
    const randomType = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];

    switch (randomType) {
      case 'flashcard_match':
        return this.generateFlashcardMatchChallenge(difficulty);
      case 'qa_roulette':
        return this.generateQARouletteChallenge(difficulty);
      case 'survival_mode':
        return this.generateSurvivalModeChallenge(difficulty);
      default:
        return this.generateFlashcardMatchChallenge(difficulty);
    }
  }

  private async generateFlashcardMatchChallenge(difficulty: number): Promise<Challenge> {
    const baseChallenge = this.createBaseChallenge(
      ChallengeType.MEMORY_MATCH,
      difficulty,
      'Flashcard Match',
      'Match gas tests and flame colors with their results to earn combo multipliers!'
    );

    // Select appropriate tests based on difficulty
    const availableTests = this.gasTestsDatabase.filter(test => {
      if (difficulty <= 2) return test.category === 'gas_test' || test.category === 'flame_color';
      return true; // All categories for higher difficulty
    });

    const gridSize = Math.min(4 + difficulty, 6); // 5x5 to 7x7 grid
    const numPairs = Math.floor((gridSize * gridSize) / 2);
    const selectedTests = this.shuffleArray(availableTests).slice(0, numPairs);

    const pairs = selectedTests.map(test => ({
      id: test.ion,
      front: test.ion,
      back: test.result,
      category: test.category,
      color: test.color
    }));

    const content: ChallengeContent = {
      question: `Match the ${numPairs} pairs of chemical tests with their results. Build combos for bonus points!`,
      correctAnswer: JSON.stringify(pairs),
      explanation: 'Memorizing gas tests and flame colors is essential for qualitative analysis in chemistry.',
      hints: [
        'Start with the tests you know best',
        'Group similar colors together for flame tests',
        'Remember: hydrogen pops, oxygen relights, CO₂ turns limewater milky',
        'Build combos by matching pairs quickly in succession'
      ],
      visualAids: [
        {
          type: 'diagram',
          url: '/images/memory/gas_tests_diagram.png',
          altText: 'Diagram showing common gas tests and their results',
          interactive: false
        }
      ]
    };

    return {
      ...baseChallenge,
      content,
      timeLimit: 120 + (difficulty * 30), // 2-5 minutes based on difficulty
      metadata: {
        ...baseChallenge.metadata!,
        concepts: ['gas tests', 'flame colors', 'qualitative analysis', 'memory'],
        curriculumStandards: ['O-Level Chemistry', 'A-Level Chemistry'],
        gameData: {
          gridSize,
          pairs,
          comboMultiplier: true,
          timeBonus: true
        }
      }
    } as Challenge;
  }

  private async generateQARouletteChallenge(difficulty: number): Promise<Challenge> {
    const baseChallenge = this.createBaseChallenge(
      ChallengeType.QUICK_RECALL,
      difficulty,
      'QA Roulette',
      'Spin the wheel and quickly recite ion test procedures before time runs out!'
    );

    // Select 25+ ions for the roulette
    const availableIons = this.gasTestsDatabase.filter(test => 
      test.category === 'ion_identification' || test.category === 'flame_color'
    );

    const selectedIons = this.shuffleArray(availableIons).slice(0, Math.min(25, availableIons.length));
    const timeLimit = Math.max(10, 30 - (difficulty * 3)); // 10-27 seconds per question

    const content: ChallengeContent = {
      question: 'The roulette wheel will select random ions. Quickly state the test procedure and expected result!',
      correctAnswer: JSON.stringify(selectedIons),
      explanation: 'Quick recall of ion tests is crucial for efficient laboratory work and examinations.',
      hints: [
        'Practice the most common tests first',
        'Remember the reagents: AgNO₃ for halides, NaOH for metal ions',
        'State both the test AND the expected result',
        'Speed is key - the faster you answer, the more points you earn'
      ]
    };

    return {
      ...baseChallenge,
      content,
      timeLimit: timeLimit,
      metadata: {
        ...baseChallenge.metadata!,
        concepts: ['ion identification', 'qualitative analysis', 'quick recall'],
        curriculumStandards: ['O-Level Chemistry', 'A-Level Chemistry'],
        gameData: {
          ions: selectedIons,
          timePerQuestion: timeLimit,
          continuousPlay: true,
          speedBonus: true
        }
      }
    } as Challenge;
  }

  private async generateSurvivalModeChallenge(difficulty: number): Promise<Challenge> {
    const baseChallenge = this.createBaseChallenge(
      ChallengeType.SURVIVAL,
      difficulty,
      'Survival Mode',
      'Answer solubility rule questions continuously. Three strikes and you\'re out!'
    );

    // Generate questions based on solubility rules
    const questions = this.generateSolubilityQuestions(difficulty);

    const content: ChallengeContent = {
      question: 'Answer solubility rule questions to survive as long as possible. You have 3 lives!',
      correctAnswer: JSON.stringify(questions),
      explanation: 'Mastering solubility rules is essential for predicting precipitation reactions.',
      hints: [
        'All nitrates and Group 1 compounds are soluble',
        'Most chlorides and sulfates are soluble (with exceptions)',
        'Most carbonates and hydroxides are insoluble (with exceptions)',
        'Learn the common exceptions to each rule'
      ]
    };

    return {
      ...baseChallenge,
      content,
      timeLimit: 600, // 10 minutes maximum
      metadata: {
        ...baseChallenge.metadata!,
        concepts: ['solubility rules', 'precipitation', 'survival challenge'],
        curriculumStandards: ['O-Level Chemistry', 'A-Level Chemistry'],
        gameData: {
          questions,
          lives: 3,
          increasingDifficulty: true,
          survivalMode: true
        }
      }
    } as Challenge;
  }

  private generateSolubilityQuestions(difficulty: number): Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    difficulty: number;
  }> {
    const questions: Array<{
      question: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
      difficulty: number;
    }> = [];

    // Generate questions for each solubility rule
    this.solubilityRules.forEach(rule => {
      if (rule.difficulty <= difficulty + 1) {
        // Question about the rule itself
        questions.push({
          question: `Which statement about ${rule.rule.toLowerCase()} is correct?`,
          options: [
            rule.rule,
            `Most ${rule.rule.split(' ')[1]} are insoluble`,
            `Only some ${rule.rule.split(' ')[1]} are soluble`,
            `${rule.rule} except in acidic conditions`
          ],
          correctAnswer: rule.rule,
          explanation: `${rule.rule}. Examples include: ${rule.examples.join(', ')}`,
          difficulty: rule.difficulty
        });

        // Questions about specific compounds
        rule.examples.forEach(example => {
          questions.push({
            question: `Is ${example} soluble in water?`,
            options: ['Soluble', 'Insoluble', 'Partially soluble', 'Depends on temperature'],
            correctAnswer: 'Soluble',
            explanation: `${example} is soluble because ${rule.rule.toLowerCase()}.`,
            difficulty: rule.difficulty
          });
        });

        // Questions about exceptions
        rule.exceptions.forEach(exception => {
          questions.push({
            question: `Is ${exception} soluble in water?`,
            options: ['Soluble', 'Insoluble', 'Partially soluble', 'Depends on pH'],
            correctAnswer: 'Insoluble',
            explanation: `${exception} is an exception to the rule that ${rule.rule.toLowerCase()}.`,
            difficulty: rule.difficulty + 1
          });
        });
      }
    });

    return this.shuffleArray(questions).slice(0, 40);
  }

  async validateAnswer(challenge: Challenge, answer: Answer): Promise<ValidationResult> {
    const challengeType = challenge.type;

    switch (challengeType) {
      case ChallengeType.MEMORY_MATCH:
        return this.validateFlashcardMatch(challenge, answer);
      case ChallengeType.QUICK_RECALL:
        return this.validateQARouletteAnswer(challenge, answer);
      case ChallengeType.SURVIVAL:
        return this.validateSurvivalAnswer(challenge, answer);
      default:
        return {
          isCorrect: false,
          score: 0,
          feedback: 'Unknown challenge type',
          explanation: 'This challenge type is not supported'
        };
    }
  }

  private validateFlashcardMatch(challenge: Challenge, answer: Answer): ValidationResult {
    if (typeof answer.response !== 'object' || answer.response === null) {
      return {
        isCorrect: false,
        score: 0,
        feedback: 'Invalid answer format for flashcard matching',
        explanation: 'Answer should contain matched pairs data'
      };
    }

    const userMatches = answer.response as any;
    const correctPairs = JSON.parse(challenge.content.correctAnswer as string);
    
    let correctMatches = 0;
    let totalPairs = correctPairs.length;
    let comboMultiplier = 1;

    // Validate each match
    correctPairs.forEach((pair: any) => {
      if (userMatches[pair.front] === pair.back) {
        correctMatches++;
      }
    });

    // Calculate combo multiplier based on consecutive correct matches
    if (userMatches.combo && userMatches.combo > 1) {
      comboMultiplier = Math.min(3, 1 + (userMatches.combo - 1) * 0.2);
    }

    const accuracy = correctMatches / totalPairs;
    const isCorrect = accuracy >= 0.8; // 80% accuracy required
    const baseScore = this.calculateBaseScore(isCorrect, challenge.difficulty, accuracy);
    const finalScore = Math.floor(baseScore * comboMultiplier);

    return {
      isCorrect,
      score: finalScore,
      partialCredit: accuracy,
      feedback: isCorrect 
        ? `Excellent! ${correctMatches}/${totalPairs} pairs matched correctly!` 
        : `Good effort! ${correctMatches}/${totalPairs} pairs matched correctly. Keep practicing!`,
      explanation: challenge.content.explanation,
      bonusPoints: Math.floor((comboMultiplier - 1) * 50)
    };
  }

  private validateQARouletteAnswer(challenge: Challenge, answer: Answer): ValidationResult {
    if (typeof answer.response !== 'object' || answer.response === null) {
      return {
        isCorrect: false,
        score: 0,
        feedback: 'Invalid answer format for QA Roulette',
        explanation: 'Answer should contain ion test responses'
      };
    }

    const userAnswers = answer.response as any;
    const correctIons = JSON.parse(challenge.content.correctAnswer as string);
    
    let correctAnswers = 0;
    let totalQuestions = userAnswers.answers ? userAnswers.answers.length : 0;
    let speedBonus = 0;

    // Validate each answer
    if (userAnswers.answers) {
      userAnswers.answers.forEach((userAnswer: any, index: number) => {
        const correctIon = correctIons.find((ion: GasTest) => ion.ion === userAnswer.ion);
        if (correctIon && this.isAnswerAcceptable(userAnswer.response, correctIon.result)) {
          correctAnswers++;
          // Speed bonus for quick answers
          if (userAnswer.timeElapsed < 15) {
            speedBonus += 10;
          }
        }
      });
    }

    const accuracy = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;
    const isCorrect = accuracy >= 0.7; // 70% accuracy required
    const baseScore = this.calculateBaseScore(isCorrect, challenge.difficulty, accuracy);
    const finalScore = baseScore + speedBonus;

    return {
      isCorrect,
      score: finalScore,
      partialCredit: accuracy,
      feedback: isCorrect 
        ? `Outstanding! ${correctAnswers}/${totalQuestions} correct answers!` 
        : `Good try! ${correctAnswers}/${totalQuestions} correct. Practice more for better results!`,
      explanation: challenge.content.explanation,
      bonusPoints: speedBonus
    };
  }

  private validateSurvivalAnswer(challenge: Challenge, answer: Answer): ValidationResult {
    if (typeof answer.response !== 'object' || answer.response === null) {
      return {
        isCorrect: false,
        score: 0,
        feedback: 'Invalid answer format for Survival Mode',
        explanation: 'Answer should contain survival game data'
      };
    }

    const userGameData = answer.response as any;
    const questionsAnswered = userGameData.questionsAnswered || 0;
    const correctAnswers = userGameData.correctAnswers || 0;
    const livesRemaining = userGameData.livesRemaining || 0;

    const accuracy = questionsAnswered > 0 ? correctAnswers / questionsAnswered : 0;
    const survivalBonus = questionsAnswered * 10; // 10 points per question survived
    const livesBonus = livesRemaining * 25; // 25 points per life remaining

    const baseScore = this.calculateBaseScore(true, challenge.difficulty, accuracy);
    const finalScore = baseScore + survivalBonus + livesBonus;

    const isCorrect = questionsAnswered >= 10; // Must answer at least 10 questions

    return {
      isCorrect,
      score: finalScore,
      partialCredit: accuracy,
      feedback: `Survived ${questionsAnswered} questions with ${correctAnswers} correct answers!`,
      explanation: `You demonstrated ${accuracy >= 0.8 ? 'excellent' : accuracy >= 0.6 ? 'good' : 'basic'} knowledge of solubility rules.`,
      bonusPoints: survivalBonus + livesBonus
    };
  }

  private isAnswerAcceptable(userAnswer: string, correctAnswer: string): boolean {
    const userLower = userAnswer.toLowerCase().trim();
    const correctLower = correctAnswer.toLowerCase().trim();
    
    // Check for exact match or key phrases
    if (userLower === correctLower) return true;
    
    // Check for key phrases in the correct answer
    const keyPhrases = correctLower.split(/[,\s]+/).filter(phrase => phrase.length > 2);
    return keyPhrases.some(phrase => userLower.includes(phrase));
  }

  calculateScore(challenge: Challenge, answer: Answer, timeElapsed: number): number {
    // For score calculation, we'll use a simplified validation approach
    // The full validation is done separately in validateAnswer
    const baseScore = this.calculateBaseScore(true, challenge.difficulty);
    let score = baseScore;

    // Time bonus for quick completion
    if (challenge.timeLimit && timeElapsed < challenge.timeLimit * 0.5) {
      score += Math.floor(score * 0.2); // 20% time bonus
    }

    // Hint penalty
    const hintPenalty = answer.hintsUsed * 0.05;
    score = Math.floor(score * (1 - hintPenalty));

    return Math.max(0, score);
  }

  getSpecialMechanics(): RealmMechanic[] {
    return [
      {
        id: 'combo_multiplier',
        name: 'Combo Multiplier',
        description: 'Build combos by matching pairs quickly for bonus points',
        parameters: {
          maxCombo: 10,
          comboTimeWindow: 3000, // 3 seconds
          bonusPerCombo: 0.2
        }
      },
      {
        id: 'time_pressure',
        name: 'Time Pressure',
        description: 'Answer quickly to earn speed bonuses',
        parameters: {
          speedBonusThreshold: 15, // seconds
          maxSpeedBonus: 50
        }
      },
      {
        id: 'three_strikes',
        name: 'Three Strikes System',
        description: 'Three wrong answers end the survival challenge',
        parameters: {
          maxStrikes: 3,
          strikeWarning: true
        }
      },
      {
        id: 'memory_palace',
        name: 'Memory Palace',
        description: 'Unlock animated mnemonics as rewards',
        parameters: {
          mnemonicsUnlocked: 0,
          totalMnemonics: 15
        }
      }
    ];
  }

  async processBossChallenge(userId: string, bossId: string): Promise<BossResult> {
    // Memory Labyrinth doesn't have traditional boss fights
    // Instead, it has the Alchemist's Grimoire unlock system
    if (bossId === 'grimoire-master') {
      return {
        defeated: true,
        score: 300,
        specialRewards: [
          {
            type: 'unlock',
            itemId: 'alchemists_grimoire',
            description: 'Alchemist\'s Grimoire - Animated Mnemonics Collection'
          },
          {
            type: 'badge',
            itemId: 'memory_master',
            description: 'Memory Master Badge'
          }
        ],
        unlockedContent: ['animated_mnemonics', 'advanced_memory_techniques']
      };
    }
    
    throw new Error(`Unknown boss: ${bossId}`);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  protected getSpecialRewards(): Reward[] {
    return [
      {
        type: 'badge' as const,
        itemId: 'memory_apprentice',
        description: 'Memory Apprentice Badge'
      },
      {
        type: 'unlock' as const,
        itemId: 'alchemists_grimoire',
        description: 'Alchemist\'s Grimoire - Animated Mnemonics'
      }
    ];
  }
}