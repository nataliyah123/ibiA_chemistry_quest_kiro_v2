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

// Chemical equation interfaces
export interface ChemicalEquation {
  reactants: ChemicalCompound[];
  products: ChemicalCompound[];
  coefficients: number[];
  isBalanced: boolean;
}

export interface ChemicalCompound {
  formula: string;
  coefficient: number;
  elements: ElementCount[];
}

export interface ElementCount {
  element: string;
  count: number;
}

export interface EquationBalanceChallenge extends Challenge {
  content: ChallengeContent & {
    equation: ChemicalEquation;
    unbalancedEquation: string;
    balancedEquation: string;
    coefficients: number[];
  };
}

export class MathmageTrialsRealm extends RealmComponent {
  realmId = 'mathmage-trials';
  name = 'The Mathmage Trials';
  description = 'Master calculation and symbol skills through combat-style chemistry games';
  requiredLevel = 1;

  private sampleEquations: Array<{
    unbalanced: string;
    balanced: string;
    coefficients: number[];
    difficulty: number;
    topic: string;
  }> = [
    // Difficulty 1 - Simple synthesis reactions
    {
      unbalanced: "H₂ + O₂ → H₂O",
      balanced: "2H₂ + O₂ → 2H₂O",
      coefficients: [2, 1, 2],
      difficulty: 1,
      topic: "Simple synthesis"
    },
    {
      unbalanced: "Na + Cl₂ → NaCl",
      balanced: "2Na + Cl₂ → 2NaCl",
      coefficients: [2, 1, 2],
      difficulty: 1,
      topic: "Metal + halogen"
    },
    {
      unbalanced: "Mg + O₂ → MgO",
      balanced: "2Mg + O₂ → 2MgO",
      coefficients: [2, 1, 2],
      difficulty: 1,
      topic: "Metal oxidation"
    },
    {
      unbalanced: "Al + O₂ → Al₂O₃",
      balanced: "4Al + 3O₂ → 2Al₂O₃",
      coefficients: [4, 3, 2],
      difficulty: 2,
      topic: "Metal oxidation"
    },
    {
      unbalanced: "Ca + H₂O → Ca(OH)₂ + H₂",
      balanced: "Ca + 2H₂O → Ca(OH)₂ + H₂",
      coefficients: [1, 2, 1, 1],
      difficulty: 2,
      topic: "Metal + water"
    },
    
    // Difficulty 2 - Decomposition reactions
    {
      unbalanced: "KClO₃ → KCl + O₂",
      balanced: "2KClO₃ → 2KCl + 3O₂",
      coefficients: [2, 2, 3],
      difficulty: 2,
      topic: "Thermal decomposition"
    },
    {
      unbalanced: "CaCO₃ → CaO + CO₂",
      balanced: "CaCO₃ → CaO + CO₂",
      coefficients: [1, 1, 1],
      difficulty: 1,
      topic: "Carbonate decomposition"
    },
    {
      unbalanced: "NH₄NO₃ → N₂O + H₂O",
      balanced: "NH₄NO₃ → N₂O + 2H₂O",
      coefficients: [1, 1, 2],
      difficulty: 2,
      topic: "Ammonium nitrate decomposition"
    },
    {
      unbalanced: "H₂O₂ → H₂O + O₂",
      balanced: "2H₂O₂ → 2H₂O + O₂",
      coefficients: [2, 2, 1],
      difficulty: 2,
      topic: "Peroxide decomposition"
    },
    
    // Difficulty 3 - Single displacement
    {
      unbalanced: "Zn + HCl → ZnCl₂ + H₂",
      balanced: "Zn + 2HCl → ZnCl₂ + H₂",
      coefficients: [1, 2, 1, 1],
      difficulty: 2,
      topic: "Metal + acid"
    },
    {
      unbalanced: "Fe + CuSO₄ → FeSO₄ + Cu",
      balanced: "Fe + CuSO₄ → FeSO₄ + Cu",
      coefficients: [1, 1, 1, 1],
      difficulty: 2,
      topic: "Metal displacement"
    },
    {
      unbalanced: "Al + HCl → AlCl₃ + H₂",
      balanced: "2Al + 6HCl → 2AlCl₃ + 3H₂",
      coefficients: [2, 6, 2, 3],
      difficulty: 3,
      topic: "Metal + acid"
    },
    {
      unbalanced: "Mg + AgNO₃ → Mg(NO₃)₂ + Ag",
      balanced: "Mg + 2AgNO₃ → Mg(NO₃)₂ + 2Ag",
      coefficients: [1, 2, 1, 2],
      difficulty: 3,
      topic: "Metal displacement"
    },
    
    // Difficulty 3-4 - Double displacement
    {
      unbalanced: "AgNO₃ + NaCl → AgCl + NaNO₃",
      balanced: "AgNO₃ + NaCl → AgCl + NaNO₃",
      coefficients: [1, 1, 1, 1],
      difficulty: 2,
      topic: "Precipitation"
    },
    {
      unbalanced: "BaCl₂ + Na₂SO₄ → BaSO₄ + NaCl",
      balanced: "BaCl₂ + Na₂SO₄ → BaSO₄ + 2NaCl",
      coefficients: [1, 1, 1, 2],
      difficulty: 3,
      topic: "Precipitation"
    },
    {
      unbalanced: "Pb(NO₃)₂ + KI → PbI₂ + KNO₃",
      balanced: "Pb(NO₃)₂ + 2KI → PbI₂ + 2KNO₃",
      coefficients: [1, 2, 1, 2],
      difficulty: 3,
      topic: "Precipitation"
    },
    {
      unbalanced: "Ca(OH)₂ + HCl → CaCl₂ + H₂O",
      balanced: "Ca(OH)₂ + 2HCl → CaCl₂ + 2H₂O",
      coefficients: [1, 2, 1, 2],
      difficulty: 3,
      topic: "Neutralization"
    },
    
    // Difficulty 4-5 - Combustion reactions
    {
      unbalanced: "CH₄ + O₂ → CO₂ + H₂O",
      balanced: "CH₄ + 2O₂ → CO₂ + 2H₂O",
      coefficients: [1, 2, 1, 2],
      difficulty: 3,
      topic: "Hydrocarbon combustion"
    },
    {
      unbalanced: "C₂H₆ + O₂ → CO₂ + H₂O",
      balanced: "2C₂H₆ + 7O₂ → 4CO₂ + 6H₂O",
      coefficients: [2, 7, 4, 6],
      difficulty: 4,
      topic: "Hydrocarbon combustion"
    },
    {
      unbalanced: "C₃H₈ + O₂ → CO₂ + H₂O",
      balanced: "C₃H₈ + 5O₂ → 3CO₂ + 4H₂O",
      coefficients: [1, 5, 3, 4],
      difficulty: 4,
      topic: "Hydrocarbon combustion"
    },
    {
      unbalanced: "C₄H₁₀ + O₂ → CO₂ + H₂O",
      balanced: "2C₄H₁₀ + 13O₂ → 8CO₂ + 10H₂O",
      coefficients: [2, 13, 8, 10],
      difficulty: 5,
      topic: "Hydrocarbon combustion"
    },
    {
      unbalanced: "C₂H₅OH + O₂ → CO₂ + H₂O",
      balanced: "C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O",
      coefficients: [1, 3, 2, 3],
      difficulty: 4,
      topic: "Alcohol combustion"
    },
    
    // Difficulty 5 - Complex reactions
    {
      unbalanced: "Fe₂O₃ + CO → Fe + CO₂",
      balanced: "Fe₂O₃ + 3CO → 2Fe + 3CO₂",
      coefficients: [1, 3, 2, 3],
      difficulty: 4,
      topic: "Metal extraction"
    },
    {
      unbalanced: "NH₃ + O₂ → NO + H₂O",
      balanced: "4NH₃ + 5O₂ → 4NO + 6H₂O",
      coefficients: [4, 5, 4, 6],
      difficulty: 5,
      topic: "Ammonia oxidation"
    },
    {
      unbalanced: "P₄ + O₂ → P₄O₁₀",
      balanced: "P₄ + 5O₂ → P₄O₁₀",
      coefficients: [1, 5, 1],
      difficulty: 4,
      topic: "Phosphorus oxidation"
    },
    {
      unbalanced: "Ca₃(PO₄)₂ + SiO₂ + C → CaSiO₃ + CO + P₄",
      balanced: "2Ca₃(PO₄)₂ + 6SiO₂ + 10C → 6CaSiO₃ + 10CO + P₄",
      coefficients: [2, 6, 10, 6, 10, 1],
      difficulty: 5,
      topic: "Industrial process"
    }
  ];

  async getChallenges(): Promise<Challenge[]> {
    const challenges: Challenge[] = [];
    
    // Generate equation balancing challenges
    for (let i = 0; i < this.sampleEquations.length; i++) {
      const equation = this.sampleEquations[i];
      const challenge = await this.generateEquationBalanceChallenge(equation.difficulty, equation);
      challenges.push(challenge);
    }

    return challenges;
  }

  async generateChallenge(difficulty: number): Promise<Challenge> {
    // Filter equations by difficulty
    const suitableEquations = this.sampleEquations.filter(eq => eq.difficulty === difficulty);
    
    if (suitableEquations.length === 0) {
      // Fallback to closest difficulty
      const closestEquations = this.sampleEquations.filter(eq => 
        Math.abs(eq.difficulty - difficulty) <= 1
      );
      const randomEquation = closestEquations[Math.floor(Math.random() * closestEquations.length)];
      return this.generateEquationBalanceChallenge(difficulty, randomEquation);
    }

    const randomEquation = suitableEquations[Math.floor(Math.random() * suitableEquations.length)];
    return this.generateEquationBalanceChallenge(difficulty, randomEquation);
  }

  private async generateEquationBalanceChallenge(
    difficulty: number, 
    equationData: typeof this.sampleEquations[0]
  ): Promise<Challenge> {
    const baseChallenge = this.createBaseChallenge(
      ChallengeType.EQUATION_BALANCE,
      difficulty,
      `Balance the Chemical Equation`,
      `Balance this ${equationData.topic} equation by finding the correct coefficients.`
    );

    const parsedEquation = this.parseChemicalEquation(equationData.unbalanced);
    
    const content: ChallengeContent = {
      question: `Balance the following chemical equation:\n\n${equationData.unbalanced}`,
      correctAnswer: equationData.coefficients.join(','),
      explanation: `The balanced equation is: ${equationData.balanced}\n\nCoefficients: ${equationData.coefficients.join(', ')}`,
      hints: [
        "Start by counting atoms of each element on both sides",
        "Balance metals first, then non-metals, then hydrogen and oxygen",
        "Use the smallest whole number coefficients possible",
        `This is a ${equationData.topic} reaction`
      ],
      visualAids: [
        {
          type: 'diagram',
          url: `/images/equations/${equationData.topic.replace(/\s+/g, '_')}.png`,
          altText: `Diagram showing ${equationData.topic} reaction mechanism`,
          interactive: false
        }
      ]
    };

    return {
      ...baseChallenge,
      content,
      timeLimit: Math.max(60, difficulty * 30), // 60-150 seconds based on difficulty
      metadata: {
        ...baseChallenge.metadata!,
        concepts: ['chemical equations', 'balancing', equationData.topic],
        curriculumStandards: ['O-Level Chemistry', 'A-Level Chemistry']
      }
    } as Challenge;
  }

  async validateAnswer(challenge: Challenge, answer: Answer): Promise<ValidationResult> {
    if (!this.validateAnswerFormat(answer, 'string')) {
      return {
        isCorrect: false,
        score: 0,
        feedback: "Please provide coefficients as comma-separated numbers (e.g., 2,1,2)",
        explanation: "Answer format should be numbers separated by commas"
      };
    }

    const userCoefficients = (answer.response as string)
      .split(',')
      .map(c => parseInt(c.trim()))
      .filter(c => !isNaN(c));

    const correctCoefficients = (challenge.content.correctAnswer as string)
      .split(',')
      .map(c => parseInt(c.trim()));

    // Check if the user provided a valid format (contains only numbers and commas)
    const responseStr = answer.response as string;
    const validFormatRegex = /^[\d\s,]+$/;
    
    if (!validFormatRegex.test(responseStr) || userCoefficients.length === 0) {
      return {
        isCorrect: false,
        score: 0,
        feedback: "Please provide coefficients as comma-separated numbers (e.g., 2,1,2)",
        explanation: "Answer format should be numbers separated by commas"
      };
    }

    const isCorrect = this.arraysEqual(userCoefficients, correctCoefficients);
    
    let partialCredit = 0;
    if (!isCorrect) {
      // Calculate partial credit based on how many coefficients are correct
      const correctCount = userCoefficients.filter((coeff, index) => 
        coeff === correctCoefficients[index]
      ).length;
      partialCredit = correctCount / correctCoefficients.length;
    }

    const score = this.calculateBaseScore(isCorrect, challenge.difficulty, partialCredit);
    
    return {
      isCorrect,
      score,
      partialCredit,
      feedback: isCorrect 
        ? "Excellent! You've balanced the equation correctly!" 
        : `Not quite right. You got ${Math.floor(partialCredit * 100)}% of the coefficients correct.`,
      explanation: challenge.content.explanation
    };
  }

  calculateScore(challenge: Challenge, answer: Answer, timeElapsed: number): number {
    const baseScore = this.calculateBaseScore(true, challenge.difficulty);
    
    // Time bonus calculation
    const timeLimit = challenge.timeLimit || 120;
    const timeBonus = Math.max(0, (timeLimit - timeElapsed) / timeLimit * 0.5);
    
    // Hint penalty
    const hintPenalty = answer.hintsUsed * 0.1;
    
    const finalScore = Math.floor(baseScore * (1 + timeBonus - hintPenalty));
    return Math.max(0, finalScore);
  }

  getSpecialMechanics(): RealmMechanic[] {
    return [
      {
        id: 'mana_system',
        name: 'Mana Points',
        description: 'Earn mana points for correct answers, lose mana for mistakes',
        parameters: {
          maxMana: 100,
          manaPerCorrect: 20,
          manaLossPerError: 15
        }
      },
      {
        id: 'hp_system',
        name: 'Health Points',
        description: 'Lose HP when making errors, game over at 0 HP',
        parameters: {
          maxHP: 100,
          hpLossPerError: 25,
          hpRegenPerCorrect: 5
        }
      },
      {
        id: 'explosion_animation',
        name: 'Explosion Effects',
        description: 'Visual explosion animations for incorrect answers',
        parameters: {
          animationDuration: 2000,
          shakeIntensity: 'medium'
        }
      }
    ];
  }

  async processBossChallenge(userId: string, bossId: string): Promise<BossResult> {
    if (bossId === 'limiting-reagent-hydra') {
      return {
        defeated: true,
        score: 500,
        specialRewards: [
          {
            type: 'unlock',
            itemId: 'arcane_formulae',
            description: 'Arcane Formulae Reference Guide'
          },
          {
            type: 'badge',
            itemId: 'hydra_slayer',
            description: 'Hydra Slayer Badge'
          }
        ],
        unlockedContent: ['arcane_formulae', 'advanced_stoichiometry']
      };
    }
    
    throw new Error(`Unknown boss: ${bossId}`);
  }

  // Utility methods for equation parsing and validation
  private parseChemicalEquation(equation: string): ChemicalEquation {
    const [reactantSide, productSide] = equation.split('→').map(side => side.trim());
    
    const reactants = this.parseCompounds(reactantSide);
    const products = this.parseCompounds(productSide);
    
    return {
      reactants,
      products,
      coefficients: [...reactants, ...products].map(c => c.coefficient),
      isBalanced: this.checkBalance(reactants, products)
    };
  }

  private parseCompounds(side: string): ChemicalCompound[] {
    return side.split('+').map(compound => {
      const trimmed = compound.trim();
      // Match coefficient (optional) followed by the chemical formula
      const match = trimmed.match(/^(\d*)([A-Za-z₀-₉()]+)$/);
      
      if (!match) {
        throw new Error(`Invalid compound format: ${trimmed}`);
      }

      const coefficient = match[1] ? parseInt(match[1]) : 1;
      const formula = match[2];
      
      return {
        formula,
        coefficient,
        elements: this.parseElements(formula)
      };
    });
  }

  private parseElements(formula: string): ElementCount[] {
    const elements: ElementCount[] = [];
    // Updated regex to handle subscript numbers (₀-₉) and regular numbers
    const regex = /([A-Z][a-z]?)([₀-₉\d]*)/g;
    let match;

    while ((match = regex.exec(formula)) !== null) {
      const element = match[1];
      let countStr = match[2];
      
      // Convert subscript numbers to regular numbers
      if (countStr) {
        countStr = countStr
          .replace(/₀/g, '0')
          .replace(/₁/g, '1')
          .replace(/₂/g, '2')
          .replace(/₃/g, '3')
          .replace(/₄/g, '4')
          .replace(/₅/g, '5')
          .replace(/₆/g, '6')
          .replace(/₇/g, '7')
          .replace(/₈/g, '8')
          .replace(/₉/g, '9');
      }
      
      const count = countStr ? parseInt(countStr) : 1;
      
      const existing = elements.find(e => e.element === element);
      if (existing) {
        existing.count += count;
      } else {
        elements.push({ element, count });
      }
    }

    return elements;
  }

  private checkBalance(reactants: ChemicalCompound[], products: ChemicalCompound[]): boolean {
    const reactantElements = this.getElementCounts(reactants);
    const productElements = this.getElementCounts(products);

    // Check if all elements balance
    const allElements = new Set([
      ...Object.keys(reactantElements),
      ...Object.keys(productElements)
    ]);

    for (const element of allElements) {
      const reactantCount = reactantElements[element] || 0;
      const productCount = productElements[element] || 0;
      
      if (reactantCount !== productCount) {
        return false;
      }
    }

    return true;
  }

  private getElementCounts(compounds: ChemicalCompound[]): Record<string, number> {
    const elementCounts: Record<string, number> = {};

    for (const compound of compounds) {
      for (const element of compound.elements) {
        const totalCount = element.count * compound.coefficient;
        elementCounts[element.element] = (elementCounts[element.element] || 0) + totalCount;
      }
    }

    return elementCounts;
  }

  private arraysEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }

  protected getSpecialRewards(): Reward[] {
    return [
      {
        type: 'badge' as const,
        itemId: 'mathmage_apprentice',
        description: 'Mathmage Apprentice Badge'
      },
      {
        type: 'unlock' as const,
        itemId: 'arcane_formulae',
        description: 'Arcane Formulae Reference Guide'
      }
    ];
  }
}