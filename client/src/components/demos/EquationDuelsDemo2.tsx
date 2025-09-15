import React, { useState, useEffect, useCallback } from 'react';
import { Challenge, Answer, Result, ChallengeType } from '../../types/game';
import { useGameEngine } from '../../hooks/useGameEngine';
import '../games/EquationDuels.css';

interface EquationDuelsProps {
  onComplete: (result: Result) => void;
  onAbandon: () => void;
}

interface GameState {
  mana: number;
  health: number;
  timeRemaining: number;
  coefficients: number[];
  isSubmitting: boolean;
  showExplosion: boolean;
  feedback: string;
  hintsUsed: number;
}

interface CoefficientSlot {
  index: number;
  value: number;
  isActive: boolean;
  isCorrect?: boolean;
}

// Mock challenge (from offline file)
const mockChallenge: Challenge = {
  id: 'mock-challenge-1',
  realmId: 'alchemy',
  type: ChallengeType.EQUATION_BALANCE,
  difficulty: 2,
  title: 'Balance the Alchemical Reaction',
  description: 'Balance the mystical equation of zinc and hydrochloric acid.',
  content: {
    question: 'Zn + HCl → ZnCl₂ + H₂',
    correctAnswer: '1,2,1,1',
    explanation: 'Zn + 2HCl → ZnCl₂ + H₂',
    hints: [
      'Start by balancing the chlorine atoms.',
      'Remember hydrogen exists as H₂ in its elemental form.'
    ],
    visualAids: []
  },
  timeLimit: 120,
  requiredLevel: 1,
  rewards: [],
  metadata: {}
};

export const EquationDuelsDemo2: React.FC<EquationDuelsProps> = ({
  onComplete,
  onAbandon
}) => {
  const challenge = mockChallenge;
  const { submitAnswer, getHint } = useGameEngine();

  const [gameState, setGameState] = useState<GameState>({
    mana: 100,
    health: 100,
    timeRemaining: challenge.timeLimit || 120,
    coefficients: [],
    isSubmitting: false,
    showExplosion: false,
    feedback: '',
    hintsUsed: 0
  });

  const [coefficientSlots, setCoefficientSlots] = useState<CoefficientSlot[]>([]);
  const [draggedCoefficient, setDraggedCoefficient] = useState<number | null>(null);
  const [availableCoefficients] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const [showHints, setShowHints] = useState(false);
  const [currentHint, setCurrentHint] = useState<string>('');

  // Parse the equation to determine coefficient slots
  useEffect(() => {
    const equation = challenge.content.question.split('\n\n')[1] || challenge.content.question;
    const compounds = equation.split('→').join(' + ').split(' + ').filter(c => c.trim() && c !== '→');

    const slots: CoefficientSlot[] = compounds.map((_, index) => ({
      index,
      value: 1,
      isActive: false,
      isCorrect: undefined
    }));

    setCoefficientSlots(slots);
    setGameState(prev => ({ ...prev, coefficients: new Array(slots.length).fill(1) }));
  }, [challenge]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setGameState(prev => {
        if (prev.timeRemaining <= 1) {
          handleSubmit();
          return prev;
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleDragStart = (coefficient: number) => {
    setDraggedCoefficient(coefficient);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    if (draggedCoefficient !== null) {
      const newCoefficients = [...gameState.coefficients];
      newCoefficients[slotIndex] = draggedCoefficient;

      const newSlots = coefficientSlots.map((slot, index) => ({
        ...slot,
        value: index === slotIndex ? draggedCoefficient : slot.value,
        isActive: index === slotIndex
      }));

      setCoefficientSlots(newSlots);
      setGameState(prev => ({ ...prev, coefficients: newCoefficients }));
      setDraggedCoefficient(null);
    }
  };

  const handleCoefficientClick = (slotIndex: number, coefficient: number) => {
    const newCoefficients = [...gameState.coefficients];
    newCoefficients[slotIndex] = coefficient;

    const newSlots = coefficientSlots.map((slot, index) => ({
      ...slot,
      value: index === slotIndex ? coefficient : slot.value,
      isActive: index === slotIndex
    }));

    setCoefficientSlots(newSlots);
    setGameState(prev => ({ ...prev, coefficients: newCoefficients }));
  };

  const triggerExplosion = useCallback(() => {
    setGameState(prev => ({ ...prev, showExplosion: true }));
    setTimeout(() => {
      setGameState(prev => ({ ...prev, showExplosion: false }));
    }, 2000);
  }, []);

  const handleSubmit = async () => {
    if (gameState.isSubmitting) return;

    setGameState(prev => ({ ...prev, isSubmitting: true }));

    try {
      const answer: Answer = {
        challengeId: challenge.id,
        userId: 'current-user',
        response: gameState.coefficients.join(','),
        timeElapsed: (challenge.timeLimit || 120) - gameState.timeRemaining,
        hintsUsed: gameState.hintsUsed,
        submittedAt: new Date()
      };

      const result = await submitAnswer(challenge.id, answer.response, answer.hintsUsed);

      if (result.validation.isCorrect) {
        const manaGain = 20;
        const healthGain = 5;

        setGameState(prev => ({
          ...prev,
          mana: Math.min(100, prev.mana + manaGain),
          health: Math.min(100, prev.health + healthGain),
          feedback: 'Excellent! Equation balanced correctly!'
        }));

        setCoefficientSlots(prev => prev.map(slot => ({ ...slot, isCorrect: true })));

        setTimeout(() => onComplete(result), 2000);
      } else {
        const manaLoss = 15;
        const healthLoss = 25;

        setGameState(prev => ({
          ...prev,
          mana: Math.max(0, prev.mana - manaLoss),
          health: Math.max(0, prev.health - healthLoss),
          feedback: result.validation.feedback
        }));

        setCoefficientSlots(prev => prev.map(slot => ({ ...slot, isCorrect: false })));

        triggerExplosion();

        if (gameState.health - healthLoss <= 0) {
          setTimeout(() => {
            setGameState(prev => ({ ...prev, feedback: 'Game Over! Your alchemist has been defeated.' }));
            setTimeout(() => onComplete(result), 3000);
          }, 2000);
        }
      }
    } catch (error) {
      setGameState(prev => ({
        ...prev,
        feedback: 'Error submitting answer. Please try again.',
        isSubmitting: false
      }));
    }
  };

  const handleGetHint = async () => {
    try {
      const hint = await getHint(challenge.id, gameState.hintsUsed);
      setCurrentHint(hint);
      setShowHints(true);
      setGameState(prev => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }));
    } catch (error) {
      setGameState(prev => ({ ...prev, feedback: 'No more hints available.' }));
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const parseEquation = (equation: string) => {
    const cleanEquation = equation.split('\n\n')[1] || equation;
    const [reactants, products] = cleanEquation.split('→').map(side => side.trim());
    return { reactants: reactants.split(' + '), products: products.split(' + ') };
  };

  const { reactants, products } = parseEquation(challenge.content.question);

  return (
    <div className={`equation-duels ${gameState.showExplosion ? 'explosion-active' : ''}`}>
      {/* Game Header */}
      <div className="game-header">
        <div className="game-stats">
          <div className="stat-bar mana-bar">
            <div className="stat-label">Mana</div>
            <div className="stat-fill">
              <div 
                className="stat-progress mana-progress" 
                style={{ width: `${gameState.mana}%` }}
              />
            </div>
            <div className="stat-value">{gameState.mana}/100</div>
          </div>

          <div className="stat-bar health-bar">
            <div className="stat-label">Health</div>
            <div className="stat-fill">
              <div 
                className="stat-progress health-progress" 
                style={{ width: `${gameState.health}%` }}
              />
            </div>
            <div className="stat-value">{gameState.health}/100</div>
          </div>

          <div className="timer">
            <div className="timer-label">Time</div>
            <div className={`timer-value ${gameState.timeRemaining <= 30 ? 'warning' : ''}`}>
              {formatTime(gameState.timeRemaining)}
            </div>
          </div>
        </div>

        <div className="game-actions">
          <button 
            className="hint-button" 
            onClick={handleGetHint}
            disabled={gameState.hintsUsed >= challenge.content.hints.length}
          >
            Hint ({gameState.hintsUsed}/{challenge.content.hints.length})
          </button>
          <button className="abandon-button" onClick={onAbandon}>
            Abandon
          </button>
        </div>
      </div>

      {/* Equation Display */}
      <div className="equation-container">
        <div className="equation-title">Balance the Chemical Equation</div>

        <div className="equation-display">
          <div className="reactants">
            {reactants.map((compound, index) => (
              <div key={`reactant-${index}`} className="compound-group">
                <div 
                  className={`coefficient-slot ${coefficientSlots[index]?.isActive ? 'active' : ''} ${
                    coefficientSlots[index]?.isCorrect === true ? 'correct' : 
                    coefficientSlots[index]?.isCorrect === false ? 'incorrect' : ''
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  {gameState.coefficients[index] || 1}
                </div>
                <div className="compound">{compound.trim()}</div>
                {index < reactants.length - 1 && <span className="plus">+</span>}
              </div>
            ))}
          </div>

          <div className="arrow">→</div>

          <div className="products">
            {products.map((compound, index) => {
              const slotIndex = reactants.length + index;
              return (
                <div key={`product-${index}`} className="compound-group">
                  <div 
                    className={`coefficient-slot ${coefficientSlots[slotIndex]?.isActive ? 'active' : ''} ${
                      coefficientSlots[slotIndex]?.isCorrect === true ? 'correct' : 
                      coefficientSlots[slotIndex]?.isCorrect === false ? 'incorrect' : ''
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, slotIndex)}
                  >
                    {gameState.coefficients[slotIndex] || 1}
                  </div>
                  <div className="compound">{compound.trim()}</div>
                  {index < products.length - 1 && <span className="plus">+</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Coefficient Palette */}
      <div className="coefficient-palette">
        <div className="palette-title">Drag coefficients to balance the equation:</div>
        <div className="coefficient-options">
          {availableCoefficients.map(coeff => (
            <div
              key={coeff}
              className="coefficient-option"
              draggable
              onDragStart={() => handleDragStart(coeff)}
            >
              {coeff}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Select Buttons */}
      <div className="quick-select">
        <div className="quick-select-title">Or click to set coefficients:</div>
        <div className="compound-selectors">
          {coefficientSlots.map((slot, index) => (
            <div key={index} className="compound-selector">
              <div className="compound-name">
                {index < reactants.length ? reactants[index] : products[index - reactants.length]}
              </div>
              <div className="coefficient-buttons">
                {[1, 2, 3, 4, 5].map(coeff => (
                  <button
                    key={coeff}
                    className={`coeff-btn ${gameState.coefficients[index] === coeff ? 'selected' : ''}`}
                    onClick={() => handleCoefficientClick(index, coeff)}
                  >
                    {coeff}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="submit-section">
        <button 
          className="submit-button"
          onClick={handleSubmit}
          disabled={gameState.isSubmitting}
        >
          {gameState.isSubmitting ? 'Casting Spell...' : 'Cast Balancing Spell'}
        </button>
      </div>

      {/* Feedback */}
      {gameState.feedback && (
        <div className={`feedback ${gameState.feedback.includes('Excellent') ? 'success' : 'error'}`}>
          {gameState.feedback}
        </div>
      )}

      {/* Hints Modal */}
      {showHints && (
        <div className="hints-modal">
          <div className="hints-content">
            <h3>Alchemist's Wisdom</h3>
            <p>{currentHint}</p>
            <button onClick={() => setShowHints(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Explosion Effect */}
      {gameState.showExplosion && (
        <div className="explosion-overlay">
          <div className="explosion-effect">
            <div className="explosion-circle"></div>
            <div className="explosion-particles">
              {[...Array(12)].map((_, i) => (
                <div key={i} className={`particle particle-${i}`}></div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
