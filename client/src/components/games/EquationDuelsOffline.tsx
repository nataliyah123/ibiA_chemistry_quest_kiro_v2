import React, { useState, useEffect, useCallback } from 'react';
import { Challenge, Answer, Result } from '../../types/game';
import './EquationDuels.css';

interface EquationDuelsOfflineProps {
  challenge: Challenge;
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

export const EquationDuelsOffline: React.FC<EquationDuelsOfflineProps> = ({
  challenge,
  onComplete,
  onAbandon
}) => {
  // Debug log to confirm offline component is being used
  console.log('🔧 Using EquationDuelsOffline component - no API calls will be made');
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
          // Time's up - auto submit
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

  const handleSubmit = useCallback(async () => {
    if (gameState.isSubmitting) return;

    setGameState(prev => ({ ...prev, isSubmitting: true }));

    // Offline validation - compare with correct answer
    const userAnswer = gameState.coefficients.join(',');
    const correctAnswer = challenge.content.correctAnswer;
    const isCorrect = userAnswer === correctAnswer;

    if (!isCorrect) {
      // Show explosion effect
      setGameState(prev => ({ 
        ...prev, 
        showExplosion: true, 
        health: Math.max(0, prev.health - 20),
        mana: Math.max(0, prev.mana - 10),
        feedback: 'Incorrect! Try again.'
      }));

      setTimeout(() => {
        setGameState(prev => ({ ...prev, showExplosion: false, isSubmitting: false }));
      }, 2000);

      return;
    }

    // Calculate score based on time, hints used, and health remaining
    const timeBonus = Math.max(0, gameState.timeRemaining * 2);
    const healthBonus = gameState.health;
    const hintPenalty = gameState.hintsUsed * 10;
    const baseScore = 100;
    const finalScore = Math.max(0, baseScore + timeBonus + healthBonus - hintPenalty);

    // Create result object
    const result: Result = {
      challengeId: challenge.id,
      userId: 'demo-user',
      validation: {
        isCorrect: true,
        score: finalScore,
        feedback: challenge.content.explanation,
        correctAnswer: challenge.content.correctAnswer,
        userAnswer: userAnswer
      },
      experienceGained: Math.floor(finalScore / 5),
      goldEarned: Math.floor(finalScore / 10),
      timeElapsed: (challenge.timeLimit || 120) - gameState.timeRemaining,
      hintsUsed: gameState.hintsUsed,
      completedAt: new Date().toISOString()
    };

    setGameState(prev => ({ ...prev, isSubmitting: false }));
    onComplete(result);
  }, [gameState, challenge, onComplete]);

  const handleGetHint = () => {
    if (gameState.hintsUsed >= challenge.content.hints.length) return;

    const hint = challenge.content.hints[gameState.hintsUsed];
    setCurrentHint(hint);
    setShowHints(true);
    setGameState(prev => ({ 
      ...prev, 
      hintsUsed: prev.hintsUsed + 1,
      mana: Math.max(0, prev.mana - 15)
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getHealthColor = () => {
    if (gameState.health > 60) return '#27ae60';
    if (gameState.health > 30) return '#f39c12';
    return '#e74c3c';
  };

  const getManaColor = () => {
    if (gameState.mana > 60) return '#3498db';
    if (gameState.mana > 30) return '#9b59b6';
    return '#e74c3c';
  };

  return (
    <div className="equation-duels-container">
      {gameState.showExplosion && (
        <div className="explosion-overlay">
          <div className="explosion-effect">💥</div>
          <div className="explosion-text">WRONG ANSWER!</div>
        </div>
      )}

      {/* Game Header */}
      <div className="game-header">
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-label">Health</span>
            <div className="stat-bar">
              <div 
                className="stat-fill" 
                style={{ 
                  width: `${gameState.health}%`, 
                  backgroundColor: getHealthColor() 
                }}
              />
            </div>
            <span className="stat-value">{gameState.health}/100</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">Mana</span>
            <div className="stat-bar">
              <div 
                className="stat-fill" 
                style={{ 
                  width: `${gameState.mana}%`, 
                  backgroundColor: getManaColor() 
                }}
              />
            </div>
            <span className="stat-value">{gameState.mana}/100</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">Time</span>
            <span className="stat-value time-display">
              {formatTime(gameState.timeRemaining)}
            </span>
          </div>
        </div>

        <button className="abandon-btn" onClick={onAbandon}>
          Abandon Challenge
        </button>
      </div>

      {/* Challenge Content */}
      <div className="challenge-content">
        <h2 className="challenge-title">{challenge.title}</h2>
        <p className="challenge-description">{challenge.description}</p>

        <div className="equation-display">
          <div className="equation-text">
            {challenge.content.question.split('\n\n')[1] || challenge.content.question}
          </div>
        </div>

        {/* Coefficient Slots */}
        <div className="coefficient-slots">
          {coefficientSlots.map((slot, index) => (
            <div
              key={index}
              className={`coefficient-slot ${slot.isActive ? 'active' : ''} ${
                slot.isCorrect !== undefined ? (slot.isCorrect ? 'correct' : 'incorrect') : ''
              }`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
            >
              <span className="coefficient-value">{slot.value}</span>
              <div className="quick-select">
                {[1, 2, 3, 4, 5].map(coeff => (
                  <button
                    key={coeff}
                    className="quick-select-btn"
                    onClick={() => handleCoefficientClick(index, coeff)}
                  >
                    {coeff}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Available Coefficients */}
        <div className="available-coefficients">
          <h3>Drag coefficients to balance the equation:</h3>
          <div className="coefficient-bank">
            {availableCoefficients.map(coeff => (
              <div
                key={coeff}
                className="draggable-coefficient"
                draggable
                onDragStart={() => handleDragStart(coeff)}
              >
                {coeff}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            className="hint-btn"
            onClick={handleGetHint}
            disabled={gameState.hintsUsed >= challenge.content.hints.length || gameState.mana < 15}
          >
            Get Hint ({gameState.hintsUsed}/{challenge.content.hints.length})
            {gameState.mana < 15 && ' - Need 15 Mana'}
          </button>

          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={gameState.isSubmitting}
          >
            {gameState.isSubmitting ? 'Submitting...' : 'Submit Answer'}
          </button>
        </div>

        {/* Feedback */}
        {gameState.feedback && (
          <div className="feedback-message">
            {gameState.feedback}
          </div>
        )}
      </div>

      {/* Hints Modal */}
      {showHints && (
        <div className="hints-modal">
          <div className="hints-content">
            <h3>Hint #{gameState.hintsUsed}</h3>
            <p>{currentHint}</p>
            <button onClick={() => setShowHints(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};