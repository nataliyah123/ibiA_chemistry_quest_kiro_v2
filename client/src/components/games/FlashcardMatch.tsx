import React, { useState, useEffect, useCallback } from 'react';
import { Challenge, Result, Answer } from '../../types/game';
import './FlashcardMatch.css';

interface FlashcardMatchProps {
  challenge: Challenge;
  onComplete: (result: Result) => void;
  onAbandon: () => void;
}

interface Card {
  id: string;
  content: string;
  type: 'front' | 'back';
  pairId: string;
  isFlipped: boolean;
  isMatched: boolean;
  category?: string;
  color?: string;
}

interface GameState {
  cards: Card[];
  selectedCards: Card[];
  matchedPairs: number;
  totalPairs: number;
  score: number;
  combo: number;
  maxCombo: number;
  timeElapsed: number;
  hintsUsed: number;
  gameStarted: boolean;
  gameCompleted: boolean;
}

export const FlashcardMatch: React.FC<FlashcardMatchProps> = ({
  challenge,
  onComplete,
  onAbandon
}) => {
  const [gameState, setGameState] = useState<GameState>({
    cards: [],
    selectedCards: [],
    matchedPairs: 0,
    totalPairs: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeElapsed: 0,
    hintsUsed: 0,
    gameStarted: false,
    gameCompleted: false
  });

  const [showHint, setShowHint] = useState(false);
  const [currentHint, setCurrentHint] = useState('');
  const [comboAnimation, setComboAnimation] = useState(false);

  // Initialize game
  useEffect(() => {
    initializeGame();
  }, [challenge]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState.gameStarted && !gameState.gameCompleted) {
      interval = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          timeElapsed: prev.timeElapsed + 1
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState.gameStarted, gameState.gameCompleted]);

  // Check for game completion
  useEffect(() => {
    if (gameState.matchedPairs === gameState.totalPairs && gameState.totalPairs > 0) {
      completeGame();
    }
  }, [gameState.matchedPairs, gameState.totalPairs]);

  const initializeGame = () => {
    try {
      const pairs = JSON.parse(challenge.content.correctAnswer as string);
      const cards: Card[] = [];
      
      // Create cards for each pair
      pairs.forEach((pair: any, index: number) => {
        cards.push({
          id: `front-${index}`,
          content: pair.front,
          type: 'front',
          pairId: pair.id,
          isFlipped: false,
          isMatched: false,
          category: pair.category,
          color: pair.color
        });
        
        cards.push({
          id: `back-${index}`,
          content: pair.back,
          type: 'back',
          pairId: pair.id,
          isFlipped: false,
          isMatched: false,
          category: pair.category,
          color: pair.color
        });
      });

      // Shuffle cards
      const shuffledCards = shuffleArray(cards);

      setGameState(prev => ({
        ...prev,
        cards: shuffledCards,
        totalPairs: pairs.length,
        gameStarted: true
      }));
    } catch (error) {
      console.error('Failed to initialize flashcard game:', error);
    }
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleCardClick = useCallback((cardId: string) => {
    if (gameState.gameCompleted) return;

    setGameState(prev => {
      const card = prev.cards.find(c => c.id === cardId);
      if (!card || card.isFlipped || card.isMatched) return prev;

      // If two cards are already selected, reset them first
      if (prev.selectedCards.length === 2) {
        const updatedCards = prev.cards.map(c => ({
          ...c,
          isFlipped: c.isMatched ? c.isFlipped : false
        }));
        
        return {
          ...prev,
          cards: updatedCards.map(c => 
            c.id === cardId ? { ...c, isFlipped: true } : c
          ),
          selectedCards: [{ ...card, isFlipped: true }]
        };
      }

      // Flip the selected card
      const updatedCards = prev.cards.map(c =>
        c.id === cardId ? { ...c, isFlipped: true } : c
      );

      const newSelectedCards = [...prev.selectedCards, { ...card, isFlipped: true }];

      // Check for match if two cards are selected
      if (newSelectedCards.length === 2) {
        const [card1, card2] = newSelectedCards;
        const isMatch = card1.pairId === card2.pairId && card1.type !== card2.type;

        if (isMatch) {
          // Match found!
          const finalCards = updatedCards.map(c =>
            c.pairId === card1.pairId ? { ...c, isMatched: true } : c
          );

          const newCombo = prev.combo + 1;
          const comboBonus = Math.floor(newCombo * 10);
          const basePoints = 50;
          const totalPoints = basePoints + comboBonus;

          // Trigger combo animation
          setComboAnimation(true);
          setTimeout(() => setComboAnimation(false), 1000);

          return {
            ...prev,
            cards: finalCards,
            selectedCards: [],
            matchedPairs: prev.matchedPairs + 1,
            score: prev.score + totalPoints,
            combo: newCombo,
            maxCombo: Math.max(prev.maxCombo, newCombo)
          };
        } else {
          // No match - cards will be flipped back after a delay
          setTimeout(() => {
            setGameState(current => ({
              ...current,
              cards: current.cards.map(c => ({
                ...c,
                isFlipped: c.isMatched ? c.isFlipped : false
              })),
              selectedCards: [],
              combo: 0 // Reset combo on miss
            }));
          }, 1500);

          return {
            ...prev,
            cards: updatedCards,
            selectedCards: newSelectedCards,
            combo: 0
          };
        }
      }

      return {
        ...prev,
        cards: updatedCards,
        selectedCards: newSelectedCards
      };
    });
  }, [gameState.gameCompleted]);

  const useHint = () => {
    if (gameState.hintsUsed >= challenge.content.hints.length) return;

    const hint = challenge.content.hints[gameState.hintsUsed];
    setCurrentHint(hint);
    setShowHint(true);
    
    setGameState(prev => ({
      ...prev,
      hintsUsed: prev.hintsUsed + 1
    }));

    setTimeout(() => setShowHint(false), 5000);
  };

  const completeGame = () => {
    const accuracy = gameState.matchedPairs / gameState.totalPairs;
    const timeBonus = Math.max(0, (challenge.timeLimit || 120) - gameState.timeElapsed) * 2;
    const comboBonus = gameState.maxCombo * 25;
    const hintPenalty = gameState.hintsUsed * 10;
    
    const finalScore = Math.max(0, gameState.score + timeBonus + comboBonus - hintPenalty);

    const answer: Answer = {
      response: {
        matchedPairs: gameState.matchedPairs,
        totalPairs: gameState.totalPairs,
        combo: gameState.maxCombo,
        accuracy: accuracy
      },
      timeElapsed: gameState.timeElapsed,
      hintsUsed: gameState.hintsUsed
    };

    const result: Result = {
      challengeId: challenge.id,
      userId: 'current-user', // This would come from auth context
      score: finalScore,
      experienceGained: Math.floor(finalScore / 10),
      goldEarned: Math.floor(finalScore / 20),
      validation: {
        isCorrect: accuracy >= 0.8,
        score: finalScore,
        feedback: accuracy >= 0.8 
          ? `Excellent memory work! ${gameState.matchedPairs}/${gameState.totalPairs} pairs matched!`
          : `Good effort! ${gameState.matchedPairs}/${gameState.totalPairs} pairs matched. Keep practicing!`,
        explanation: challenge.content.explanation,
        bonusPoints: timeBonus + comboBonus
      },
      completedAt: new Date().toISOString(),
      answer
    };

    setGameState(prev => ({ ...prev, gameCompleted: true }));
    
    setTimeout(() => {
      onComplete(result);
    }, 2000);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCardClassName = (card: Card): string => {
    let className = 'flashcard';
    
    if (card.isFlipped) className += ' flipped';
    if (card.isMatched) className += ' matched';
    if (card.category === 'flame_color' && card.color) className += ' flame-color';
    if (gameState.selectedCards.some(sc => sc.id === card.id)) className += ' selected';
    
    return className;
  };

  const getCardStyle = (card: Card): React.CSSProperties => {
    if (card.category === 'flame_color' && card.color && card.isFlipped) {
      return {
        borderColor: card.color,
        boxShadow: `0 0 10px ${card.color}40`
      };
    }
    return {};
  };

  if (!gameState.gameStarted) {
    return (
      <div className="flashcard-match-loading">
        <div className="loading-spinner"></div>
        <p>Preparing memory challenge...</p>
      </div>
    );
  }

  return (
    <div className="flashcard-match-game">
      {/* Game Header */}
      <div className="game-header">
        <div className="game-info">
          <h2>{challenge.title}</h2>
          <p>{challenge.description}</p>
        </div>
        
        <div className="game-stats">
          <div className="stat-item">
            <span className="stat-label">Score</span>
            <span className="stat-value">{gameState.score}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Pairs</span>
            <span className="stat-value">{gameState.matchedPairs}/{gameState.totalPairs}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Combo</span>
            <span className={`stat-value ${comboAnimation ? 'combo-animation' : ''}`}>
              {gameState.combo}x
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Time</span>
            <span className="stat-value">{formatTime(gameState.timeElapsed)}</span>
          </div>
        </div>

        <div className="game-controls">
          <button 
            className="hint-button" 
            onClick={useHint}
            disabled={gameState.hintsUsed >= challenge.content.hints.length}
          >
            Hint ({challenge.content.hints.length - gameState.hintsUsed} left)
          </button>
          <button className="abandon-button" onClick={onAbandon}>
            Abandon
          </button>
        </div>
      </div>

      {/* Hint Display */}
      {showHint && (
        <div className="hint-display">
          <div className="hint-content">
            <span className="hint-icon">💡</span>
            <span className="hint-text">{currentHint}</span>
          </div>
        </div>
      )}

      {/* Game Grid */}
      <div className="flashcard-grid">
        {gameState.cards.map(card => (
          <div
            key={card.id}
            className={getCardClassName(card)}
            style={getCardStyle(card)}
            onClick={() => handleCardClick(card.id)}
          >
            <div className="card-inner">
              <div className="card-back">
                <div className="card-pattern">🧪</div>
              </div>
              <div className="card-front">
                <div className="card-content">
                  {card.content}
                </div>
                {card.category && (
                  <div className="card-category">
                    {card.category.replace('_', ' ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(gameState.matchedPairs / gameState.totalPairs) * 100}%` }}
          ></div>
        </div>
        <p className="progress-text">
          {gameState.matchedPairs} of {gameState.totalPairs} pairs matched
        </p>
      </div>

      {/* Game Completion */}
      {gameState.gameCompleted && (
        <div className="game-completion-overlay">
          <div className="completion-content">
            <h2>Memory Challenge Complete!</h2>
            <div className="completion-stats">
              <div className="stat">
                <span className="stat-label">Final Score</span>
                <span className="stat-value">{gameState.score}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Max Combo</span>
                <span className="stat-value">{gameState.maxCombo}x</span>
              </div>
              <div className="stat">
                <span className="stat-label">Time</span>
                <span className="stat-value">{formatTime(gameState.timeElapsed)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Accuracy</span>
                <span className="stat-value">
                  {Math.round((gameState.matchedPairs / gameState.totalPairs) * 100)}%
                </span>
              </div>
            </div>
            <div className="completion-message">
              {gameState.matchedPairs === gameState.totalPairs 
                ? "Perfect! All pairs matched!" 
                : "Great memory work! Keep practicing to improve!"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};