import React, { useState, useEffect, useCallback } from 'react';
import { Challenge, Result, Answer } from '../../types/game';
import './QARouletteWheel.css';

interface QARouletteWheelProps {
  challenge: Challenge;
  onComplete: (result: Result) => void;
  onAbandon: () => void;
}

interface Ion {
  ion: string;
  test: string;
  result: string;
  description: string;
  category: string;
}

interface GameState {
  ions: Ion[];
  currentIon: Ion | null;
  currentQuestionIndex: number;
  userAnswer: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeRemaining: number;
  gameStarted: boolean;
  gameCompleted: boolean;
  isSpinning: boolean;
  wheelRotation: number;
  hintsUsed: number;
  gameStartTime: number;
  answers: Array<{
    ion: string;
    response: string;
    timeElapsed: number;
    isCorrect: boolean;
  }>;
}

export const QARouletteWheel: React.FC<QARouletteWheelProps> = ({
  challenge,
  onComplete,
  onAbandon
}) => {
  const [gameState, setGameState] = useState<GameState>({
    ions: [],
    currentIon: null,
    currentQuestionIndex: 0,
    userAnswer: '',
    score: 0,
    correctAnswers: 0,
    totalQuestions: 0,
    timeRemaining: 30,
    gameStarted: false,
    gameCompleted: false,
    isSpinning: false,
    wheelRotation: 0,
    hintsUsed: 0,
    gameStartTime: 0,
    answers: []
  });

  const [showHint, setShowHint] = useState(false);
  const [currentHint, setCurrentHint] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; type: 'correct' | 'incorrect' | '' }>({
    message: '',
    type: ''
  });

  // Initialize game
  useEffect(() => {
    initializeGame();
  }, [challenge]);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState.gameStarted && !gameState.gameCompleted && gameState.timeRemaining > 0 && !gameState.isSpinning) {
      interval = setInterval(() => {
        setGameState(prev => {
          if (prev.timeRemaining <= 1) {
            // Time's up - treat as incorrect answer
            handleTimeUp();
            return prev;
          }
          return {
            ...prev,
            timeRemaining: prev.timeRemaining - 1
          };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState.gameStarted, gameState.gameCompleted, gameState.timeRemaining, gameState.isSpinning]);

  const initializeGame = () => {
    try {
      const ions = JSON.parse(challenge.content.correctAnswer as string) as Ion[];
      setGameState(prev => ({
        ...prev,
        ions: ions,
        gameStarted: true,
        gameStartTime: Date.now()
      }));
      
      // Start the first spin
      spinWheel(ions);
    } catch (error) {
      console.error('Failed to initialize QA Roulette game:', error);
    }
  };

  const spinWheel = (ions: Ion[]) => {
    const randomIon = ions[Math.floor(Math.random() * ions.length)];
    const spinDuration = 2000 + Math.random() * 1000; // 2-3 seconds
    const finalRotation = 360 * 3 + Math.random() * 360; // 3+ full rotations

    setGameState(prev => ({
      ...prev,
      isSpinning: true,
      wheelRotation: prev.wheelRotation + finalRotation,
      timeRemaining: challenge.timeLimit || 30
    }));

    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        currentIon: randomIon,
        isSpinning: false,
        userAnswer: ''
      }));
      setFeedback({ message: '', type: '' });
    }, spinDuration);
  };

  const handleAnswerSubmit = useCallback(() => {
    if (!gameState.currentIon || gameState.userAnswer.trim() === '' || gameState.isSpinning) {
      return;
    }

    const timeElapsed = (challenge.timeLimit || 30) - gameState.timeRemaining;
    const isCorrect = isAnswerCorrect(gameState.userAnswer, gameState.currentIon.result);
    
    const answerRecord = {
      ion: gameState.currentIon.ion,
      response: gameState.userAnswer,
      timeElapsed,
      isCorrect
    };

    let points = 0;
    if (isCorrect) {
      // Base points + speed bonus
      points = 50 + Math.max(0, (30 - timeElapsed) * 2); // Up to 60 bonus points for speed
      setFeedback({ 
        message: `Correct! +${points} points`, 
        type: 'correct' 
      });
    } else {
      setFeedback({ 
        message: `Incorrect. The answer was: ${gameState.currentIon.result}`, 
        type: 'incorrect' 
      });
    }

    setGameState(prev => ({
      ...prev,
      answers: [...prev.answers, answerRecord],
      score: prev.score + points,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      totalQuestions: prev.totalQuestions + 1,
      currentQuestionIndex: prev.currentQuestionIndex + 1
    }));

    // Continue to next question after a short delay
    setTimeout(() => {
      if (isCorrect) {
        spinWheel(gameState.ions);
      } else {
        // Game over on incorrect answer
        completeGame();
      }
    }, 2000);

  }, [gameState.currentIon, gameState.userAnswer, gameState.timeRemaining, gameState.isSpinning, challenge.timeLimit, gameState.ions]);

  const handleTimeUp = () => {
    if (!gameState.currentIon) return;

    const answerRecord = {
      ion: gameState.currentIon.ion,
      response: 'TIME_UP',
      timeElapsed: challenge.timeLimit || 30,
      isCorrect: false
    };

    setGameState(prev => ({
      ...prev,
      answers: [...prev.answers, answerRecord],
      totalQuestions: prev.totalQuestions + 1
    }));

    setFeedback({ 
      message: `Time's up! The answer was: ${gameState.currentIon.result}`, 
      type: 'incorrect' 
    });

    setTimeout(() => {
      completeGame();
    }, 2000);
  };

  const isAnswerCorrect = (userAnswer: string, correctAnswer: string): boolean => {
    const userLower = userAnswer.toLowerCase().trim();
    const correctLower = correctAnswer.toLowerCase().trim();
    
    // Check for exact match
    if (userLower === correctLower) return true;
    
    // Check for key phrases in the correct answer
    const keyPhrases = correctLower.split(/[,\s]+/).filter(phrase => phrase.length > 2);
    return keyPhrases.some(phrase => userLower.includes(phrase));
  };

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
    const totalTimeElapsed = Math.floor((Date.now() - gameState.gameStartTime) / 1000);
    const accuracy = gameState.totalQuestions > 0 ? gameState.correctAnswers / gameState.totalQuestions : 0;
    
    const answer: Answer = {
      response: {
        answers: gameState.answers
      },
      timeElapsed: totalTimeElapsed,
      hintsUsed: gameState.hintsUsed
    };

    const result: Result = {
      challengeId: challenge.id,
      userId: 'current-user',
      score: gameState.score,
      experienceGained: Math.floor(gameState.score / 10),
      goldEarned: Math.floor(gameState.score / 20),
      validation: {
        isCorrect: accuracy >= 0.7,
        score: gameState.score,
        feedback: `Game Over! ${gameState.correctAnswers}/${gameState.totalQuestions} correct answers.`,
        explanation: challenge.content.explanation,
        bonusPoints: Math.floor(gameState.score * 0.1) // 10% speed bonus
      },
      completedAt: new Date().toISOString(),
      answer
    };

    setGameState(prev => ({ ...prev, gameCompleted: true }));
    
    setTimeout(() => {
      onComplete(result);
    }, 3000);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleAnswerSubmit();
    }
  };

  if (!gameState.gameStarted) {
    return (
      <div className="qa-roulette-loading">
        <div className="loading-spinner"></div>
        <p>Preparing the roulette wheel...</p>
      </div>
    );
  }

  return (
    <div className="qa-roulette-game">
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
            <span className="stat-label">Correct</span>
            <span className="stat-value">{gameState.correctAnswers}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Questions</span>
            <span className="stat-value">{gameState.totalQuestions}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Time</span>
            <span className={`stat-value ${gameState.timeRemaining <= 10 ? 'time-warning' : ''}`}>
              {gameState.timeRemaining}s
            </span>
          </div>
        </div>

        <div className="game-controls">
          <button 
            className="hint-button" 
            onClick={useHint}
            disabled={gameState.hintsUsed >= challenge.content.hints.length || gameState.isSpinning}
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

      {/* Roulette Wheel */}
      <div className="roulette-container">
        <div className="wheel-container">
          <div 
            className={`roulette-wheel ${gameState.isSpinning ? 'spinning' : ''}`}
            style={{ transform: `rotate(${gameState.wheelRotation}deg)` }}
          >
            {gameState.ions.slice(0, 12).map((ion, index) => (
              <div
                key={index}
                className="wheel-segment"
                style={{
                  transform: `rotate(${index * 30}deg)`,
                  backgroundColor: `hsl(${index * 30}, 70%, 60%)`
                }}
              >
                <span className="segment-text">{ion.ion.split(' ')[0]}</span>
              </div>
            ))}
          </div>
          <div className="wheel-pointer">▼</div>
        </div>

        {/* Current Question */}
        {gameState.currentIon && !gameState.isSpinning && (
          <div className="question-section">
            <div className="current-ion">
              <h3>Selected Ion: {gameState.currentIon.ion}</h3>
              <p className="question-prompt">
                What is the test procedure and expected result for this ion?
              </p>
            </div>

            <div className="answer-input-section">
              <input
                type="text"
                value={gameState.userAnswer}
                onChange={(e) => setGameState(prev => ({ ...prev, userAnswer: e.target.value }))}
                onKeyPress={handleKeyPress}
                placeholder="Enter the test and result..."
                className="answer-input"
                disabled={gameState.gameCompleted}
                autoFocus
              />
              <button 
                onClick={handleAnswerSubmit}
                disabled={gameState.userAnswer.trim() === '' || gameState.gameCompleted}
                className="submit-button"
              >
                Submit Answer
              </button>
            </div>

            {/* Feedback */}
            {feedback.message && (
              <div className={`feedback ${feedback.type}`}>
                {feedback.message}
              </div>
            )}
          </div>
        )}

        {/* Spinning Message */}
        {gameState.isSpinning && (
          <div className="spinning-message">
            <h3>🎰 Spinning the wheel...</h3>
            <p>Get ready to answer quickly!</p>
          </div>
        )}
      </div>

      {/* Game Completion */}
      {gameState.gameCompleted && (
        <div className="game-completion-overlay">
          <div className="completion-content">
            <h2>QA Roulette Complete!</h2>
            <div className="completion-stats">
              <div className="stat">
                <span className="stat-label">Final Score</span>
                <span className="stat-value">{gameState.score}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Correct Answers</span>
                <span className="stat-value">{gameState.correctAnswers}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Total Questions</span>
                <span className="stat-value">{gameState.totalQuestions}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Accuracy</span>
                <span className="stat-value">
                  {gameState.totalQuestions > 0 
                    ? Math.round((gameState.correctAnswers / gameState.totalQuestions) * 100)
                    : 0}%
                </span>
              </div>
            </div>
            <div className="completion-message">
              {gameState.correctAnswers >= 5 
                ? "Excellent memory skills! You're a chemistry recall master!" 
                : gameState.correctAnswers >= 3
                ? "Good work! Keep practicing to improve your recall speed!"
                : "Keep studying those ion tests - practice makes perfect!"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};