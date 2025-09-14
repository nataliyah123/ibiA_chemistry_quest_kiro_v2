import { RealmComponent, RealmMechanic } from '../realmComponent';
import { 
  Challenge, 
  Answer, 
  ValidationResult, 
  BossResult,
  ChallengeType,
  ChallengeContent,
  Reward
} from '../../types/game';

// Stoichiometry interfaces
export interface StoichiometryProblem {
  equation: string;
  balancedEquation: string;
  given: {
    substance: string;
    amount: number;
    unit: 'g' | 'mol' | 'L' | 'molecules';
  };
  find: {
    substance: string;
    unit: 'g' | 'mol' | 'L' | 'molecules';
  };
  solution: {
    steps: string[];
    answer: number;
    unit: string;
  };
  molarMasses: Record<string, number>;
}

export interface DungeonRoom {
  id: string;
  level: number;
  name: string;
  description: string;
  problem: StoichiometryProblem;
  isLocked: boolean;
  isCompleted: boolean;
  nextRooms: string[];
  rewards: Reward[];
}

export class MoleDungeonCrawler extends RealmComponent {
  realmId = 'mole-dungeon-crawler';
  name = 'Mole Dungeon Crawler';
  description = 'Navigate through stoichiometry puzzles to escape dungeon rooms';
  requiredLevel = 3;

  private sampleProblems: StoichiometryProblem[] = [
    // Level 1 - Basic mole-to-mole conversions
    {
      equation: "2H₂ + O₂ → 2H₂O",
      balancedEquation: "2H₂ + O₂ → 2H₂O",
      given: { substance: "H₂", amount: 4, unit: "mol" },
      find: { substance: "H₂O", unit: "mol" },
      solution: {
        steps: [
          "From balanced equation: 2 mol H₂ → 2 mol H₂O",
          "Mole ratio: 2 mol H₂ : 2 mol H₂O = 1:1",
          "4 mol H₂ × (2 mol H₂O / 2 mol H₂) = 4 mol H₂O"
        ],
        answer: 4,
        unit: "mol"
      },
      molarMasses: { "H₂": 2.02, "O₂": 32.00, "H₂O": 18.02 }
    },
    {
      equation: "N₂ + 3H₂ → 2NH₃",
      balancedEquation: "N₂ + 3H₂ → 2NH₃",
      given: { substance: "N₂", amount: 2, unit: "mol" },
      find: { substance: "NH₃", unit: "mol" },
      solution: {
        steps: [
          "From balanced equation: 1 mol N₂ → 2 mol NH₃",
          "Mole ratio: 1 mol N₂ : 2 mol NH₃",
          "2 mol N₂ × (2 mol NH₃ / 1 mol N₂) = 4 mol NH₃"
        ],
        answer: 4,
        unit: "mol"
      },
      molarMasses: { "N₂": 28.02, "H₂": 2.02, "NH₃": 17.04 }
    },
    {
      equation: "CH₄ + 2O₂ → CO₂ + 2H₂O",
      balancedEquation: "CH₄ + 2O₂ → CO₂ + 2H₂O",
      given: { substance: "CH₄", amount: 3, unit: "mol" },
      find: { substance: "CO₂", unit: "mol" },
      solution: {
        steps: [
          "From balanced equation: 1 mol CH₄ → 1 mol CO₂",
          "Mole ratio: 1 mol CH₄ : 1 mol CO₂ = 1:1",
          "3 mol CH₄ × (1 mol CO₂ / 1 mol CH₄) = 3 mol CO₂"
        ],
        answer: 3,
        unit: "mol"
      },
      molarMasses: { "CH₄": 16.05, "O₂": 32.00, "CO₂": 44.01, "H₂O": 18.02 }
    },

    // Level 2 - Mole-to-mass conversions
    {
      equation: "2Na + Cl₂ → 2NaCl",
      balancedEquation: "2Na + Cl₂ → 2NaCl",
      given: { substance: "Na", amount: 2, unit: "mol" },
      find: { substance: "NaCl", unit: "g" },
      solution: {
        steps: [
          "From balanced equation: 2 mol Na → 2 mol NaCl",
          "Mole ratio: 2 mol Na : 2 mol NaCl = 1:1",
          "2 mol Na × (2 mol NaCl / 2 mol Na) = 2 mol NaCl",
          "2 mol NaCl × 58.44 g/mol = 116.88 g NaCl"
        ],
        answer: 116.88,
        unit: "g"
      },
      molarMasses: { "Na": 22.99, "Cl₂": 70.90, "NaCl": 58.44 }
    },
    {
      equation: "CaCO₃ → CaO + CO₂",
      balancedEquation: "CaCO₃ → CaO + CO₂",
      given: { substance: "CaCO₃", amount: 1.5, unit: "mol" },
      find: { substance: "CaO", unit: "g" },
      solution: {
        steps: [
          "From balanced equation: 1 mol CaCO₃ → 1 mol CaO",
          "Mole ratio: 1 mol CaCO₃ : 1 mol CaO = 1:1",
          "1.5 mol CaCO₃ × (1 mol CaO / 1 mol CaCO₃) = 1.5 mol CaO",
          "1.5 mol CaO × 56.08 g/mol = 84.12 g CaO"
        ],
        answer: 84.12,
        unit: "g"
      },
      molarMasses: { "CaCO₃": 100.09, "CaO": 56.08, "CO₂": 44.01 }
    },

    // Level 3 - Mass-to-mole conversions
    {
      equation: "2Al + 3CuSO₄ → Al₂(SO₄)₃ + 3Cu",
      balancedEquation: "2Al + 3CuSO₄ → Al₂(SO₄)₃ + 3Cu",
      given: { substance: "Al", amount: 54, unit: "g" },
      find: { substance: "Cu", unit: "mol" },
      solution: {
        steps: [
          "Convert Al mass to moles: 54 g Al ÷ 26.98 g/mol = 2.00 mol Al",
          "From balanced equation: 2 mol Al → 3 mol Cu",
          "Mole ratio: 2 mol Al : 3 mol Cu",
          "2.00 mol Al × (3 mol Cu / 2 mol Al) = 3.00 mol Cu"
        ],
        answer: 3.00,
        unit: "mol"
      },
      molarMasses: { "Al": 26.98, "CuSO₄": 159.61, "Al₂(SO₄)₃": 342.15, "Cu": 63.55 }
    },
    {
      equation: "Fe₂O₃ + 3CO → 2Fe + 3CO₂",
      balancedEquation: "Fe₂O₃ + 3CO → 2Fe + 3CO₂",
      given: { substance: "Fe₂O₃", amount: 160, unit: "g" },
      find: { substance: "Fe", unit: "mol" },
      solution: {
        steps: [
          "Convert Fe₂O₃ mass to moles: 160 g Fe₂O₃ ÷ 159.69 g/mol = 1.00 mol Fe₂O₃",
          "From balanced equation: 1 mol Fe₂O₃ → 2 mol Fe",
          "Mole ratio: 1 mol Fe₂O₃ : 2 mol Fe",
          "1.00 mol Fe₂O₃ × (2 mol Fe / 1 mol Fe₂O₃) = 2.00 mol Fe"
        ],
        answer: 2.00,
        unit: "mol"
      },
      molarMasses: { "Fe₂O₃": 159.69, "CO": 28.01, "Fe": 55.85, "CO₂": 44.01 }
    },

    // Level 4 - Mass-to-mass conversions
    {
      equation: "C₃H₈ + 5O₂ → 3CO₂ + 4H₂O",
      balancedEquation: "C₃H₈ + 5O₂ → 3CO₂ + 4H₂O",
      given: { substance: "C₃H₈", amount: 88, unit: "g" },
      find: { substance: "CO₂", unit: "g" },
      solution: {
        steps: [
          "Convert C₃H₈ mass to moles: 88 g C₃H₈ ÷ 44.11 g/mol = 2.00 mol C₃H₈",
          "From balanced equation: 1 mol C₃H₈ → 3 mol CO₂",
          "2.00 mol C₃H₈ × (3 mol CO₂ / 1 mol C₃H₈) = 6.00 mol CO₂",
          "Convert CO₂ moles to mass: 6.00 mol CO₂ × 44.01 g/mol = 264.06 g CO₂"
        ],
        answer: 264.06,
        unit: "g"
      },
      molarMasses: { "C₃H₈": 44.11, "O₂": 32.00, "CO₂": 44.01, "H₂O": 18.02 }
    },
    {
      equation: "2KClO₃ → 2KCl + 3O₂",
      balancedEquation: "2KClO₃ → 2KCl + 3O₂",
      given: { substance: "KClO₃", amount: 245, unit: "g" },
      find: { substance: "O₂", unit: "g" },
      solution: {
        steps: [
          "Convert KClO₃ mass to moles: 245 g KClO₃ ÷ 122.55 g/mol = 2.00 mol KClO₃",
          "From balanced equation: 2 mol KClO₃ → 3 mol O₂",
          "2.00 mol KClO₃ × (3 mol O₂ / 2 mol KClO₃) = 3.00 mol O₂",
          "Convert O₂ moles to mass: 3.00 mol O₂ × 32.00 g/mol = 96.00 g O₂"
        ],
        answer: 96.00,
        unit: "g"
      },
      molarMasses: { "KClO₃": 122.55, "KCl": 74.55, "O₂": 32.00 }
    },

    // Level 5 - Complex multi-step problems
    {
      equation: "4NH₃ + 5O₂ → 4NO + 6H₂O",
      balancedEquation: "4NH₃ + 5O₂ → 4NO + 6H₂O",
      given: { substance: "NH₃", amount: 68, unit: "g" },
      find: { substance: "H₂O", unit: "g" },
      solution: {
        steps: [
          "Convert NH₃ mass to moles: 68 g NH₃ ÷ 17.04 g/mol = 4.00 mol NH₃",
          "From balanced equation: 4 mol NH₃ → 6 mol H₂O",
          "4.00 mol NH₃ × (6 mol H₂O / 4 mol NH₃) = 6.00 mol H₂O",
          "Convert H₂O moles to mass: 6.00 mol H₂O × 18.02 g/mol = 108.12 g H₂O"
        ],
        answer: 108.12,
        unit: "g"
      },
      molarMasses: { "NH₃": 17.04, "O₂": 32.00, "NO": 30.01, "H₂O": 18.02 }
    },
    {
      equation: "2C₄H₁₀ + 13O₂ → 8CO₂ + 10H₂O",
      balancedEquation: "2C₄H₁₀ + 13O₂ → 8CO₂ + 10H₂O",
      given: { substance: "C₄H₁₀", amount: 116, unit: "g" },
      find: { substance: "CO₂", unit: "g" },
      solution: {
        steps: [
          "Convert C₄H₁₀ mass to moles: 116 g C₄H₁₀ ÷ 58.14 g/mol = 2.00 mol C₄H₁₀",
          "From balanced equation: 2 mol C₄H₁₀ → 8 mol CO₂",
          "2.00 mol C₄H₁₀ × (8 mol CO₂ / 2 mol C₄H₁₀) = 8.00 mol CO₂",
          "Convert CO₂ moles to mass: 8.00 mol CO₂ × 44.01 g/mol = 352.08 g CO₂"
        ],
        answer: 352.08,
        unit: "g"
      },
      molarMasses: { "C₄H₁₀": 58.14, "O₂": 32.00, "CO₂": 44.01, "H₂O": 18.02 }
    }
  ];

  private dungeonRooms: DungeonRoom[] = [];

  constructor() {
    super();
    this.initializeDungeonRooms();
  }

  private initializeDungeonRooms() {
    this.dungeonRooms = this.sampleProblems.map((problem, index) => ({
      id: `room_${index + 1}`,
      level: Math.floor(index / 2) + 1,
      name: this.getRoomName(index),
      description: this.getRoomDescription(index),
      problem,
      isLocked: index > 0, // First room is unlocked
      isCompleted: false,
      nextRooms: this.getNextRooms(index),
      rewards: this.getRoomRewards(Math.floor(index / 2) + 1)
    }));
  }

  private getRoomName(index: number): string {
    const names = [
      "Chamber of Basic Ratios",
      "Hall of Molecular Balance",
      "Room of Combustion Mysteries",
      "Vault of Mass Conversions",
      "Sanctum of Thermal Decomposition",
      "Laboratory of Metal Reactions",
      "Forge of Iron Extraction",
      "Chamber of Hydrocarbon Flames",
      "Hall of Chlorate Decomposition",
      "Sanctum of Ammonia Oxidation",
      "Master's Chamber of Butane Combustion"
    ];
    return names[index] || `Mysterious Room ${index + 1}`;
  }

  private getRoomDescription(index: number): string {
    const descriptions = [
      "A simple chamber where you must master the basic art of mole ratios to unlock the door.",
      "Ancient symbols glow on the walls, showing the path from nitrogen to ammonia.",
      "Flames dance in magical braziers, waiting for you to balance the combustion equation.",
      "Scales of justice hang from the ceiling, demanding precise mass calculations.",
      "Heat radiates from crystalline formations that must be decomposed to proceed.",
      "Metallic veins run through the walls, showing the displacement of copper by aluminum.",
      "The smell of molten metal fills the air as iron ore awaits reduction.",
      "Propane torches line the walls, their flames hungry for the correct stoichiometry.",
      "Crystalline formations of potassium chlorate await your calculations to release oxygen.",
      "Ammonia vapors swirl in the air, ready to be oxidized by your mathematical prowess.",
      "The final chamber glows with butane flames, testing your mastery of complex combustion."
    ];
    return descriptions[index] || "A mysterious chamber filled with chemical puzzles.";
  }

  private getNextRooms(index: number): string[] {
    if (index >= this.sampleProblems.length - 1) return []; // Last room
    return [`room_${index + 2}`]; // Next room
  }

  private getRoomRewards(level: number): Reward[] {
    const baseRewards: Reward[] = [
      { type: 'xp' as const, amount: level * 15, description: 'Room completion XP' },
      { type: 'gold' as const, amount: level * 8, description: 'Dungeon treasure' }
    ];

    if (level === 5) {
      baseRewards.push({
        type: 'item' as const,
        itemId: 'dungeon_key_master',
        description: 'Master Dungeon Key'
      });
    }

    return baseRewards;
  }

  async getChallenges(): Promise<Challenge[]> {
    const challenges: Challenge[] = [];
    
    for (const room of this.dungeonRooms) {
      const challenge = this.createStoichiometryChallenge(room);
      challenges.push(challenge);
    }

    return challenges;
  }

  async generateChallenge(difficulty: number): Promise<Challenge> {
    const suitableProblems = this.sampleProblems.filter((_, index) => {
      const problemLevel = Math.floor(index / 2) + 1;
      return Math.abs(problemLevel - difficulty) <= 1;
    });

    if (suitableProblems.length === 0) {
      // Fallback to first problem
      const room = this.dungeonRooms[0];
      return this.createStoichiometryChallenge(room);
    }

    const randomProblem = suitableProblems[Math.floor(Math.random() * suitableProblems.length)];
    const roomIndex = this.sampleProblems.indexOf(randomProblem);
    const room = this.dungeonRooms[roomIndex];
    
    return this.createStoichiometryChallenge(room);
  }

  private createStoichiometryChallenge(room: DungeonRoom): Challenge {
    const problem = room.problem;
    const baseChallenge = this.createBaseChallenge(
      ChallengeType.STOICHIOMETRY,
      room.level,
      `Escape ${room.name}`,
      room.description
    );

    const content: ChallengeContent = {
      question: this.formatStoichiometryQuestion(problem),
      correctAnswer: problem.solution.answer.toString(),
      explanation: this.formatStoichiometryExplanation(problem),
      hints: [
        "Start by writing the balanced chemical equation",
        "Convert the given quantity to moles if necessary",
        "Use mole ratios from the balanced equation",
        "Convert your final answer to the requested units"
      ],
      visualAids: [
        {
          type: 'diagram',
          url: `/images/stoichiometry/${room.id}.png`,
          altText: `Stoichiometry diagram for ${room.name}`,
          interactive: false
        }
      ]
    };

    return {
      ...baseChallenge,
      id: `dungeon_${room.id}`,
      content,
      timeLimit: 300, // 5 minutes for stoichiometry problems
      rewards: room.rewards,
      metadata: {
        ...baseChallenge.metadata!,
        concepts: ['stoichiometry', 'mole ratios', 'chemical equations', room.problem.find.unit],
        curriculumStandards: ['O-Level Chemistry', 'A-Level Chemistry']
      }
    } as Challenge;
  }

  private formatStoichiometryQuestion(problem: StoichiometryProblem): string {
    return `**Dungeon Challenge: Stoichiometry Calculation**

**Chemical Equation:** ${problem.equation}

**Given:** ${problem.given.amount} ${problem.given.unit} of ${problem.given.substance}

**Find:** How many ${problem.find.unit} of ${problem.find.substance} can be produced?

**Molar Masses:**
${Object.entries(problem.molarMasses)
  .map(([compound, mass]) => `• ${compound}: ${mass} g/mol`)
  .join('\n')}

Enter your answer as a number (round to 2 decimal places):`;
  }

  private formatStoichiometryExplanation(problem: StoichiometryProblem): string {
    return `**Solution Steps:**

${problem.solution.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

**Final Answer:** ${problem.solution.answer} ${problem.solution.unit}

**Balanced Equation:** ${problem.balancedEquation}`;
  }

  async validateAnswer(challenge: Challenge, answer: Answer): Promise<ValidationResult> {
    if (!this.validateAnswerFormat(answer, 'string')) {
      return {
        isCorrect: false,
        score: 0,
        feedback: "Please provide your answer as a number",
        explanation: "Enter the numerical value only (e.g., 4.50)"
      };
    }

    const userAnswer = parseFloat(answer.response as string);
    const correctAnswer = parseFloat(challenge.content.correctAnswer as string);

    if (isNaN(userAnswer)) {
      return {
        isCorrect: false,
        score: 0,
        feedback: "Please provide a valid number",
        explanation: "Your answer must be a numerical value"
      };
    }

    // Allow for small rounding errors (±0.1)
    const tolerance = 0.1;
    const isCorrect = Math.abs(userAnswer - correctAnswer) <= tolerance;
    
    let partialCredit = 0;
    if (!isCorrect) {
      // Calculate partial credit based on how close the answer is
      const percentError = Math.abs((userAnswer - correctAnswer) / correctAnswer) * 100;
      if (percentError <= 5) partialCredit = 0.8;
      else if (percentError <= 10) partialCredit = 0.6;
      else if (percentError <= 20) partialCredit = 0.4;
      else if (percentError <= 50) partialCredit = 0.2;
    }

    const score = this.calculateBaseScore(isCorrect, challenge.difficulty, partialCredit);
    
    return {
      isCorrect,
      score,
      partialCredit,
      feedback: isCorrect 
        ? "Excellent! The door unlocks and you may proceed to the next chamber!" 
        : `Close, but not quite right. The correct answer is ${correctAnswer}. ${partialCredit > 0 ? 'You receive partial credit for your attempt.' : ''}`,
      explanation: challenge.content.explanation
    };
  }

  calculateScore(challenge: Challenge, answer: Answer, timeElapsed: number): number {
    const baseScore = this.calculateBaseScore(true, challenge.difficulty);
    
    // Time bonus calculation (5 minutes = 300 seconds)
    const timeLimit = challenge.timeLimit || 300;
    const timeBonus = Math.max(0, (timeLimit - timeElapsed) / timeLimit * 0.3);
    
    // Hint penalty
    const hintPenalty = answer.hintsUsed * 0.1;
    
    const finalScore = Math.floor(baseScore * (1 + timeBonus - hintPenalty));
    return Math.max(0, finalScore);
  }

  getSpecialMechanics(): RealmMechanic[] {
    return [
      {
        id: 'room_progression',
        name: 'Room Progression',
        description: 'Unlock new rooms by solving stoichiometry problems',
        parameters: {
          totalRooms: this.dungeonRooms.length,
          unlockSequential: true
        }
      },
      {
        id: 'dungeon_keys',
        name: 'Dungeon Keys',
        description: 'Collect keys to unlock special chambers and boss rooms',
        parameters: {
          keyTypes: ['bronze', 'silver', 'gold', 'master'],
          keysRequired: [1, 2, 3, 5]
        }
      },
      {
        id: 'step_by_step_hints',
        name: 'Step-by-Step Guidance',
        description: 'Receive guided hints for complex stoichiometry calculations',
        parameters: {
          maxHints: 4,
          hintPenalty: 0.1
        }
      }
    ];
  }

  async processBossChallenge(userId: string, bossId: string): Promise<BossResult> {
    if (bossId === 'dungeon-master') {
      return {
        defeated: true,
        score: 300,
        specialRewards: [
          {
            type: 'item',
            itemId: 'master_dungeon_key',
            description: 'Master Dungeon Key'
          },
          {
            type: 'badge',
            itemId: 'dungeon_master',
            description: 'Dungeon Master Badge'
          }
        ],
        unlockedContent: ['advanced_stoichiometry', 'limiting_reagent_mastery']
      };
    }
    
    throw new Error(`Unknown boss: ${bossId}`);
  }

  // Dungeon-specific methods
  async getRoomStatus(userId: string): Promise<DungeonRoom[]> {
    // In a real implementation, this would fetch user progress from database
    return this.dungeonRooms.map(room => ({
      ...room,
      isLocked: room.id !== 'room_1', // Only first room unlocked by default
      isCompleted: false
    }));
  }

  async unlockRoom(userId: string, roomId: string): Promise<boolean> {
    // In a real implementation, this would update user progress in database
    const room = this.dungeonRooms.find(r => r.id === roomId);
    if (room) {
      room.isLocked = false;
      return true;
    }
    return false;
  }

  async completeRoom(userId: string, roomId: string): Promise<Reward[]> {
    // In a real implementation, this would update user progress and award rewards
    const room = this.dungeonRooms.find(r => r.id === roomId);
    if (room) {
      room.isCompleted = true;
      
      // Unlock next rooms
      for (const nextRoomId of room.nextRooms) {
        await this.unlockRoom(userId, nextRoomId);
      }
      
      return room.rewards;
    }
    return [];
  }

  protected getSpecialRewards(): Reward[] {
    return [
      {
        type: 'badge' as const,
        itemId: 'dungeon_explorer',
        description: 'Dungeon Explorer Badge'
      },
      {
        type: 'item' as const,
        itemId: 'stoichiometry_compass',
        description: 'Stoichiometry Compass - guides through mole calculations'
      },
      {
        type: 'unlock' as const,
        itemId: 'mole_map',
        description: 'Mole Map - visual guide to stoichiometry pathways'
      }
    ];
  }
}