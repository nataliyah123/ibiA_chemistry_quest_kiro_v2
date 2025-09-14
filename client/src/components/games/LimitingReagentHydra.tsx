import React, { useState, useEffect, useCallback } from 'react';
import { Challenge, Answer, Result } from '../../types/game';
import { useGameEngine } from '../../hooks/useGameEngine';
import './LimitingReagentHydra.css';

interface LimitingReagentHydraProps {
  challenge: Challenge;
  onComplete: (result: Result) => void;
  onAbandon: () => void;
}

interface HydraHead {
  id: number;
  name: string;
  health: number;
  maxHealth: number;
  isDefeated: boolean;
  problem: LimitingReagentProblem;
  attackPattern: string;
}

interface LimitingReagentProblem {
  equation: string;
  reactants: Array<{
    formula: string;
    amount: number;
    unit: string;
    molarMass: number;
  }>;
  products: Array<{
    formula: string;
    molarMass: number;
  }>;
  steps: string[];
  limitingReagent: string;
  excessReagent: string;
  productYield: number;
  productUnit: string;
}

interface BossState {
  currentPhase: number;
  totalPhases: number;
  hydraHealth: number;
  maxHydraHealth: number;
  activeHeads: HydraHead[];
  defeatedHeads: number;
  currentProblem: LimitingReagentProblem | null;
  userAnswer: string;
  isSubmitting: boolean;
  feedback: string;
  showSolution: boolean;
  hintsUsed: number;
  timeRemaining: number;
  bossAttacking: boolean;
  playerHealth: number;
  maxPlayerHealth: number;
}

export const LimitingReagentHydra: React.FC<LimitingReagentHydraProps> = ({
  challenge,
  onComplete,
  onAbandon
}) => {
  const { submitAnswer, getHint } = useGameEngine();

  const [bossState, setBossState] = useState<BossState>({
    currentPhase: 1,
    totalPhases: 3,
    hydraHealth: 300,
    maxHydraHealth: 300,
    activeHeads: [],
    defeatedHeads: 0,
    currentProblem: null,
    userAnswer: '',
    isSubmitting: false,
    feedback: '',
    showSolution: false,
    hintsUsed: 0,
    timeRemaining: 600, // 10 minutes for boss fight
    bossAttacking: false,
    playerHealth: 100,
    maxPlayerHealth: 100
  });

  // Sample limiting reagent problems for each hydra head
  const hydraProblems: LimitingReagentProblem[] = [
    {
      equation: "2Al + 3CuSO₄ → Al₂(SO₄)₃ + 3Cu",
      reactants: [
        { formula: "Al", amount: 5.4, unit: "g", molarMass: 26.98 },
        { formula: "CuSO₄", amount: 15.0, unit: "g", molarMass: 159.61 }
      ],
      products: [
        { formula: "Cu", molarMass: 63.55 }
      ],
      steps: [
        "Convert reactants to moles: Al = 5.4g ÷ 26.98 g/mol = 0.200 mol",
        "Convert reactants to moles: CuSO₄ = 15.0g ÷ 159.61 g/mol = 0.094 mol",
        "Calculate moles needed: Al needs 0.094 × (2/3) = 0.063 mol, CuSO₄ needs 0.200 × (3/2) = 0.300 mol",
        "CuSO₄ is limiting (0.094 < 0.300 needed), Al is excess",
        "Cu produced: 0.094 mol CuSO₄ × (3 mol Cu / 3 mol CuSO₄) = 0.094 mol",
        "Mass of Cu: 0.094 mol × 63.55 g/mol = 5.97 g"
      ],
      limitingReagent: "CuSO₄",
      excessReagent: "Al",
      productYield: 5.97,
      productUnit: "g"
    },
    {
      equation: "N₂ + 3H₂ → 2NH₃",
      reactants: [
        { formula: "N₂", amount: 2.8, unit: "g", molarMass: 28.02 },
        { formula: "H₂", amount: 1.0, unit: "g", molarMass: 2.02 }
      ],
      products: [
        { formula: "NH₃", molarMass: 17.04 }
      ],
      steps: [
        "Convert reactants to moles: N₂ = 2.8g ÷ 28.02 g/mol = 0.100 mol",
        "Convert reactants to moles: H₂ = 1.0g ÷ 2.02 g/mol = 0.495 mol",
        "Calculate moles needed: N₂ needs 0.495 × (1/3) = 0.165 mol, H₂ needs 0.100 × 3 = 0.300 mol",
        "N₂ is limiting (0.100 < 0.165 needed), H₂ is excess",
        "NH₃ produced: 0.100 mol N₂ × (2 mol NH₃ / 1 mol N₂) = 0.200 mol",
        "Mass of NH₃: 0.200 mol × 17.04 g/mol = 3.41 g"
      ],
      limitingReagent: "N₂",
      excessReagent: "H₂",
      productYield: 3.41,
      productUnit: "g"
    },
    {
      equation: "C₃H₈ + 5O₂ → 3CO₂ + 4H₂O",
      reactants: [
        { formula: "C₃H₈", amount: 4.4, unit: "g", molarMass: 44.11 },
        { formula: "O₂", amount: 12.0, unit: "g", molarMass: 32.00 }
      ],
      products: [
        { formula: "CO₂", molarMass: 44.01 }
      ],
      steps: [
        "Convert reactants to moles: C₃H₈ = 4.4g ÷ 44.11 g/mol = 0.100 mol",
        "Convert reactants to moles: O₂ = 12.0g ÷ 32.00 g/mol = 0.375 mol",
        "Calculate moles needed: C₃H₈ needs 0.375 × (1/5) = 0.075 mol, O₂ needs 0.100 × 5 = 0.500 mol",
        "O₂ is limiting (0.375 < 0.500 needed), C₃H₈ is excess",
        "CO₂ produced: 0.375 mol O₂ × (3 mol CO₂ / 5 mol O₂) = 0.225 mol",
        "Mass of CO₂: 0.225 mol × 44.01 g/mol = 9.90 g"
      ],
      limitingReagent: "O₂",
      excessReagent: "C₃H₈",
      productYield: 9.90,
      productUnit: "g"
    }
  ];

  // Initialize hydra heads
  useEffect(() => {
    const heads: HydraHead[] = hydraProblems.map((problem, index) => ({
      id: index + 1,
      name: `${problem.limitingReagent} Head`,
      health: 100,
      maxHealth: 100,
      isDefeated: false,
      problem,
      attackPattern: index === 0 ? 'fire' : index === 1 ? 'poison' : 'lightning'
    }));

    setBossState(prev => ({
      ...prev,
      activeHeads: heads,
      currentProblem: heads[0].problem
    }));
  }, []);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setBossState(prev => {
        if (prev.timeRemaining <= 1) {
          // Time's up - boss wins
          handleBossVictory();
          return prev;
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Boss attack pattern
  useEffect(() => {
    if (bossState.activeHeads.length > 0 && !bossState.isSubmitting) {
      const attackTimer = setTimeout(() => {
        triggerBossAttack();
      }, 15000); // Boss attacks every 15 seconds

      return () => clearTimeout(attackTimer);
    }
  }, [bossState.activeHeads, bossState.isSubmitting]);

  const triggerBossAttack = () => {
    setBossState(prev => ({
      ...prev,
      bossAttacking: true,
      playerHealth: Math.max(0, prev.playerHealth - 15),
      feedback: "The Hydra breathes toxic fumes! You lose health!"
    }));

    setTimeout(() => {
      setBossState(prev => ({
        ...prev,
        bossAttacking: false,
        feedback: prev.playerHealth <= 15 ? "You're critically injured! Solve quickly!" : ''
      }));
    }, 2000);
  };

  const handleAnswerChange = (value: string) => {
    setBossState(prev => ({ ...prev, userAnswer: value }));
  };

  const handleSubmit = async () => {
    if (bossState.isSubmitting || !bossState.currentProblem) return;
    
    setBossState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      const answer: Answer = {
        challengeId: challenge.id,
        userId: 'current-user',
        response: bossState.userAnswer,
        timeElapsed: 600 - bossState.timeRemaining,
        hintsUsed: bossState.hintsUsed,
        submittedAt: new Date()
      };

      // Check if answer is correct (within tolerance)
      const correctAnswer = bossState.currentProblem.productYield;
      const userAnswer = parseFloat(bossState.userAnswer);
      const tolerance = 0.1;
      const isCorrect = Math.abs(userAnswer - correctAnswer) <= tolerance;

      if (isCorrect) {
        // Defeat current head
        const currentHeadIndex = bossState.activeHeads.findIndex(head => !head.isDefeated);
        const updatedHeads = [...bossState.activeHeads];
        if (currentHeadIndex !== -1) {
          updatedHeads[currentHeadIndex].isDefeated = true;
          updatedHeads[currentHeadIndex].health = 0;
        }

        const newDefeatedCount = bossState.defeatedHeads + 1;
        const newHydraHealth = bossState.hydraHealth - 100;

        setBossState(prev => ({
          ...prev,
          activeHeads: updatedHeads,
          defeatedHeads: newDefeatedCount,
          hydraHealth: newHydraHealth,
          feedback: `Excellent! You've severed the ${bossState.currentProblem?.limitingReagent} head!`,
          userAnswer: '',
          isSubmitting: false
        }));

        // Check if all heads are defeated
        if (newDefeatedCount >= hydraProblems.length) {
          setTimeout(() => handleBossDefeat(), 2000);
        } else {
          // Move to next head
          setTimeout(() => {
            const nextHead = updatedHeads.find(head => !head.isDefeated);
            if (nextHead) {
              setBossState(prev => ({
                ...prev,
                currentProblem: nextHead.problem,
                feedback: `The ${nextHead.name} emerges! Prepare for the next challenge!`
              }));
            }
          }, 3000);
        }
      } else {
        // Incorrect answer - take damage
        setBossState(prev => ({
          ...prev,
          playerHealth: Math.max(0, prev.playerHealth - 25),
          feedback: `Incorrect! The Hydra strikes back! The correct answer was ${correctAnswer} ${bossState.currentProblem?.productUnit}`,
          showSolution: true,
          isSubmitting: false
        }));

        if (bossState.playerHealth <= 25) {
          setTimeout(() => handleBossVictory(), 3000);
        }
      }
    } catch (error) {
      setBossState(prev => ({
        ...prev,
        feedback: 'Error submitting answer. Please try again.',
        isSubmitting: false
      }));
    }
  };

  const handleGetHint = async () => {
    if (!bossState.currentProblem) return;
    
    try {
      const hintIndex = bossState.hintsUsed;
      if (hintIndex < bossState.currentProblem.steps.length) {
        setBossState(prev => ({
          ...prev,
          feedback: `Hint: ${bossState.currentProblem!.steps[hintIndex]}`,
          hintsUsed: prev.hintsUsed + 1
        }));
      } else {
        setBossState(prev => ({
          ...prev,
          feedback: 'No more hints available for this head!'
        }));
      }
    } catch (error) {
      setBossState(prev => ({ ...prev, feedback: 'No hints available.' }));
    }
  };

  const handleBossDefeat = async () => {
    const result: Result = {
      challengeId: challenge.id,
      userId: 'current-user',
      validation: {
        isCorrect: true,
        score: 500,
        feedback: 'Victory! You have defeated the Limiting Reagent Hydra and unlocked the Arcane Formulae!'
      },
      rewards: [
        { type: 'xp', amount: 200, description: 'Boss defeat XP' },
        { type: 'gold', amount: 100, description: 'Boss treasure' },
        { type: 'unlock', itemId: 'arcane_formulae', description: 'Arcane Formulae Reference Guide' },
        { type: 'badge', itemId: 'hydra_slayer', description: 'Hydra Slayer Badge' }
      ],
      experienceGained: 200,
      goldEarned: 100,
      completedAt: new Date().toISOString()
    };

    setBossState(prev => ({
      ...prev,
      feedback: 'VICTORY! The Hydra falls and the Arcane Formulae is yours!'
    }));

    setTimeout(() => onComplete(result), 4000);
  };

  const handleBossVictory = () => {
    const result: Result = {
      challengeId: challenge.id,
      userId: 'current-user',
      validation: {
        isCorrect: false,
        score: bossState.defeatedHeads * 50,
        feedback: 'The Hydra has defeated you, but you fought valiantly!'
      },
      rewards: [
        { type: 'xp', amount: bossState.defeatedHeads * 25, description: 'Participation XP' },
        { type: 'gold', amount: bossState.defeatedHeads * 10, description: 'Consolation prize' }
      ],
      experienceGained: bossState.defeatedHeads * 25,
      goldEarned: bossState.defeatedHeads * 10,
      completedAt: new Date().toISOString()
    };

    setBossState(prev => ({
      ...prev,
      feedback: 'DEFEAT! The Hydra overwhelms you with its toxic breath...'
    }));

    setTimeout(() => onComplete(result), 4000);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatProblem = (problem: LimitingReagentProblem) => {
    return `**Limiting Reagent Challenge**

**Equation:** ${problem.equation}

**Given Reactants:**
${problem.reactants.map(r => `• ${r.amount} ${r.unit} of ${r.formula} (Molar mass: ${r.molarMass} g/mol)`).join('\n')}

**Find:** Mass of ${problem.products[0].formula} produced (in ${problem.productUnit})

**Your Task:** Determine the limiting reagent and calculate the maximum amount of product that can be formed.`;
  };

  if (!bossState.currentProblem) {
    return <div className="loading">Summoning the Hydra...</div>;
  }

  return (
    <div className={`limiting-reagent-hydra ${bossState.bossAttacking ? 'under-attack' : ''}`}>
      {/* Boss Arena Header */}
      <div className="boss-arena-header">
        <div className="arena-title">
          <h1>🐉 Limiting Reagent Hydra Boss Fight</h1>
          <p>Defeat all three heads by solving limiting reagent problems!</p>
        </div>
        
        <div className="battle-stats">
          <div className="player-stats">
            <h3>Alchemist</h3>
            <div className="health-bar">
              <div className="health-label">Health</div>
              <div className="health-fill">
                <div 
                  className="health-progress player-health" 
                  style={{ width: `${(bossState.playerHealth / bossState.maxPlayerHealth) * 100}%` }}
                />
              </div>
              <div className="health-value">{bossState.playerHealth}/{bossState.maxPlayerHealth}</div>
            </div>
          </div>
          
          <div className="timer-display">
            <div className="timer-icon">⏰</div>
            <div className={`timer-value ${bossState.timeRemaining <= 120 ? 'critical' : ''}`}>
              {formatTime(bossState.timeRemaining)}
            </div>
          </div>
          
          <div className="hydra-stats">
            <h3>Hydra</h3>
            <div className="health-bar">
              <div className="health-label">Health</div>
              <div className="health-fill">
                <div 
                  className="health-progress hydra-health" 
                  style={{ width: `${(bossState.hydraHealth / bossState.maxHydraHealth) * 100}%` }}
                />
              </div>
              <div className="health-value">{bossState.hydraHealth}/{bossState.maxHydraHealth}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hydra Heads Display */}
      <div className="hydra-heads">
        {bossState.activeHeads.map((head, index) => (
          <div 
            key={head.id} 
            className={`hydra-head ${head.isDefeated ? 'defeated' : ''} ${
              bossState.currentProblem === head.problem ? 'active' : ''
            }`}
          >
            <div className="head-icon">
              {head.isDefeated ? '💀' : head.attackPattern === 'fire' ? '🔥' : 
               head.attackPattern === 'poison' ? '☠️' : '⚡'}
            </div>
            <div className="head-name">{head.name}</div>
            <div className="head-health-bar">
              <div 
                className="head-health-fill" 
                style={{ width: `${(head.health / head.maxHealth) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Current Problem */}
      <div className="current-problem">
        <div className="problem-header">
          <h3>Current Challenge: {bossState.activeHeads.find(h => h.problem === bossState.currentProblem)?.name}</h3>
        </div>
        
        <div className="problem-content">
          {formatProblem(bossState.currentProblem).split('\n').map((line, index) => (
            <div key={index} className={`problem-line ${line.startsWith('**') ? 'highlight' : ''}`}>
              {line.replace(/\*\*/g, '')}
            </div>
          ))}
        </div>
      </div>

      {/* Answer Input */}
      <div className="answer-section">
        <div className="answer-input-container">
          <label htmlFor="boss-answer" className="answer-label">
            ⚔️ Enter the mass of product formed (in {bossState.currentProblem.productUnit}):
          </label>
          <div className="input-group">
            <input
              id="boss-answer"
              type="number"
              step="0.01"
              value={bossState.userAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="e.g., 5.97"
              className="boss-answer-input"
              disabled={bossState.isSubmitting}
            />
            <button 
              className="attack-button"
              onClick={handleSubmit}
              disabled={bossState.isSubmitting || !bossState.userAnswer.trim()}
            >
              {bossState.isSubmitting ? '⚔️ Attacking...' : '⚔️ Attack Head!'}
            </button>
          </div>
        </div>
        
        <div className="battle-actions">
          <button 
            className="hint-button" 
            onClick={handleGetHint}
            disabled={bossState.hintsUsed >= bossState.currentProblem.steps.length}
          >
            🔮 Hint ({bossState.hintsUsed}/{bossState.currentProblem.steps.length})
          </button>
          <button className="flee-button" onClick={onAbandon}>
            🏃 Flee Battle
          </button>
        </div>
      </div>

      {/* Feedback */}
      {bossState.feedback && (
        <div className={`battle-feedback ${
          bossState.feedback.includes('Excellent') || bossState.feedback.includes('VICTORY') ? 'success' : 
          bossState.feedback.includes('Incorrect') || bossState.feedback.includes('DEFEAT') ? 'error' : 'info'
        }`}>
          <div className="feedback-icon">
            {bossState.feedback.includes('VICTORY') ? '🏆' : 
             bossState.feedback.includes('DEFEAT') ? '💀' : 
             bossState.feedback.includes('Excellent') ? '⚔️' : 
             bossState.feedback.includes('Hint') ? '🔮' : '🐉'}
          </div>
          <div className="feedback-text">{bossState.feedback}</div>
        </div>
      )}

      {/* Solution Display */}
      {bossState.showSolution && (
        <div className="solution-display">
          <h4>🧙‍♂️ Solution Steps</h4>
          <div className="solution-steps">
            {bossState.currentProblem.steps.map((step, index) => (
              <div key={index} className="solution-step">
                <span className="step-number">{index + 1}.</span>
                <span className="step-text">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attack Animation Overlay */}
      {bossState.bossAttacking && (
        <div className="attack-overlay">
          <div className="attack-effect">
            <div className="toxic-cloud"></div>
            <div className="damage-text">-15 HP</div>
          </div>
        </div>
      )}
    </div>
  );
};