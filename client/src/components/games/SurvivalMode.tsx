import React, { useState, useEffect, useCallback } from 'react';
import { Challenge, Result, Answer } from '../../types/game';
import './SurvivalMode.css';

interface SurvivalModeProps {
  challenge: Challenge;
  onComplete: (result: Result) => void;
  onAbandon: () => void;
}

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: number;
}

interface GameState {
  questions: Question[];
  currentQuestion: Question | null;
  currentQuestionIndex: number;
  selectedAnswer: string;
  score: number;
  correctAnswers: number;
  questionsAnswered: number;
  lives: number;
  strikes: number;
  gameStarted: boolean;
  gameCompleted: boolean;
  hintsUsed: number;
  gameStartTime: number;
  difficultyLevel: number;
  streak: number;
  maxStreak: number;
}

export const SurvivalMode: React.FC<SurvivalModeProps> = ({
  challenge,
  onComplete,
  onAbandon
}) => {
  const [gameState, setGameState] = useState<GameState>({
    questions: [],
    currentQuestion: null,
    currentQuestionIndex: 0,
    selectedAnswer: '',
    score: 0,
    correctAnswers: 0,
    questionsAnswered: 0,
    lives: 3,
    strikes: 0,
    gameStarted: false,
    gameCompleted: false,
    hintsUsed: 0,
    gameStartTime: 0,
    difficultyLevel: 1,
    streak: 0,
    maxStreak: 0
  });

  const [showHint, setShowHint] = useState(false);
  const [currentHint, setCurrentHint] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; type: 'correct' | 'incorrect' | '' }>({
    message: '',
    type: ''
  });
  const [showExplanation, setShowExplanation] = useState(false);

  // Initialize game
  useEffect(() => {
    initializeGame();
  }, [challenge]);

  const initializeGame = () => {
    try {
      const questions = JSON.parse(challenge.content.correctAnswer as string) as Question[];
      const shuffledQuestions = shuffleArray(questions);
      
      setGameState(prev => ({
        ...prev,
        questions: shuffledQuestions,
        currentQuestion: shuffledQuestions[0],
        gameStarted: true,
        gameStartTime: Date.now()
      }));
    } catch (error) {
      console.error('Failed to initialize Survival Mode game:', error);
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

  const handleAnswerSelect = (answer: string) => {
    if (gameState.gameCompleted) return;
    
    setGameState(prev => ({
      ...prev,
      selectedAnswer: answer
    }));
  };

  const handleAnswerSubmit = useCallback(() => {
    if (!gameState.currentQuestion || gameState.selectedAnswer === '' || gameState.gameCompleted) {
      return;
    }

    const isCorrect = gameState.selectedAnswer === gameState.currentQuestion.correctAnswer;
    let points = 0;
    let newStreak = gameState.streak;
    let newStrikes = gameState.strikes;
    let newLives = gameState.lives;

    if (isCorrect) {
      // Calculate points based on difficulty and streak
      const basePoints = 20 + (gameState.difficultyLevel * 5);
      const streakBonus = Math.min(gameState.streak * 5, 50); // Max 50 bonus points
      points = basePoints + streakBonus;
      newStreak = gameState.streak + 1;
      
      setFeedback({ 
        message: `Correct! +${points} points${streakBonus > 0 ? ` (${streakBonus} streak bonus)` : ''}`, 
        type: 'correct' 
      });
    } else {
      // Wrong answer - lose a life
      newStrikes = gameState.strikes + 1;
      newLives = gameState.lives - 1;
      newStreak = 0;
      
      setFeedback({ 
        message: `Incorrect! Lives remaining: ${newLives}`, 
        type: 'incorrect' 
      });
    }

    setGameState(prev => ({
      ...prev,
      score: prev.score + points,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      questionsAnswered: prev.questionsAnswered + 1,
      strikes: newStrikes,
      lives: newLives,
      streak: newStreak,
      maxStreak: Math.max(prev.maxStreak, newStreak)
    }));

    setShowExplanation(true);

    // Check for game over
    if (newLives <= 0) {
      setTimeout(() => {
        completeGame();
      }, 3000);
      return;
    }

    // Continue to next question after showing explanation
    setTimeout(() => {
      nextQuestion();
    }, 3000);

  }, [gameState.currentQuestion, gameState.selectedAnswer, gameState.gameCompleted, gameState.streak, gameState.strikes, gameState.lives, gameState.difficultyLevel]);

  const nextQuestion = () => {
    const nextIndex = gameState.currentQuestionIndex + 1;
    
    // Increase difficulty every 5 questions
    const newDifficultyLevel = Math.floor(gameState.questionsAnswered / 5) + 1;
    
    // Get next question, cycling through if needed
    const nextQuestion = gameState.questions[nextIndex % gameState.questions.length];
    
    setGameState(prev => ({
      ...prev,
      currentQuestion: nextQuestion,
      currentQuestionIndex: nextIndex,
      selectedAnswer: '',
      difficultyLevel: newDifficultyLevel
    }));
    
    setFeedback({ message: '', type: '' });
    setShowExplanation(false);
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
    const accuracy = gameState.questionsAnswered > 0 ? gameState.correctAnswers / gameState.questionsAnswered : 0;
    
    // Bonus points for survival
    const survivalBonus = gameState.questionsAnswered * 10;
    const livesBonus = gameState.lives * 25;
    const streakBonus = gameState.maxStreak * 10;
    
    const finalScore = gameState.score + survivalBonus + livesBonus + streakBonus;
    
    const answer: Answer = {
      response: {
        questionsAnswered: gameState.questionsAnswered,
        correctAnswers: gameState.correctAnswers,
        livesRemaining: gameState.lives
      },
      timeElapsed: totalTimeElapsed,
      hintsUsed: gameState.hintsUsed
    };

    const result: Result = {
      challengeId: challenge.id,
      userId: 'current-user',
      score: finalScore,
      experienceGained: Math.floor(finalScore / 10),
      goldEarned: Math.floor(finalScore / 20),
      validation: {
        isCorrect: gameState.questionsAnswered >= 10, // Must answer at least 10 questions
        score: finalScore,
        feedback: `Survival complete! ${gameState.correctAnswers}/${gameState.questionsAnswered} correct answers.`,
        explanation: challenge.content.explanation,
        bonusPoints: survivalBonus + livesBonus + streakBonus
      },
      completedAt: new Date().toISOString(),
      answer
    };

    setGameState(prev => ({ ...prev, gameCompleted: true }));
    
    setTimeout(() => {
      onComplete(result);
    }, 3000);
  };

  const getLifeIcons = () => {
    const icons = [];
    for (let i = 0; i < 3; i++) {
      icons.push(
        <span 
          key={i} 
          className={`life-icon ${i < gameState.lives ? 'active' : 'lost'}`}
        >
          ❤️
        </span>
      );
    }
    return icons;
  };

  const getDifficultyColor = () => {
    switch (gameState.difficultyLevel) {
      case 1: return '#4CAF50'; // Green
      case 2: return '#FF9800'; // Orange
      case 3: return '#F44336'; // Red
      default: return '#9C27B0'; // Purple
    }
  };

  if (!gameState.gameStarted) {
    return (
      <div className="survival-mode-loading">
        <div className="loading-spinner"></div>
        <p>Preparing survival challenge...</p>
      </div>
    );
  }

  return (
    <div className="survival-mode-game">
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
            <span className="stat-label">Questions</span>
            <span className="stat-value">{gameState.questionsAnswered}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Streak</span>
            <span className="stat-value">{gameState.streak}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Difficulty</span>
            <span 
              className="stat-value"
              style={{ color: getDifficultyColor() }}
            >
              {gameState.difficultyLevel}
            </span>
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

      {/* Lives Display */}
      <div className="lives-section">
        <div className="lives-container">
          <span className="lives-label">Lives:</span>
          <div className="lives-icons">
            {getLifeIcons()}
          </div>
        </div>
        {gameState.strikes > 0 && (
          <div className="strikes-warning">
            <span className="warning-icon">⚠️</span>
            <span>{3 - gameState.lives} strikes - {gameState.lives} lives remaining!</span>
          </div>
        )}
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

      {/* Question Section */}
      {gameState.currentQuestion && (
        <div className="question-section">
          <div className="question-header">
            <h3>Question {gameState.questionsAnswered + 1}</h3>
            <div className="difficulty-indicator">
              <span>Difficulty: </span>
              <span 
                className="difficulty-level"
                style={{ color: getDifficultyColor() }}
              >
                {'★'.repeat(gameState.difficultyLevel)}
              </span>
            </div>
          </div>

          <div className="question-content">
            <p className="question-text">{gameState.currentQuestion.question}</p>
            
            <div className="answer-options">
              {gameState.currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  className={`option-button ${gameState.selectedAnswer === option ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={gameState.gameCompleted || showExplanation}
                >
                  <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                  <span className="option-text">{option}</span>
                </button>
              ))}
            </div>

            <button 
              onClick={handleAnswerSubmit}
              disabled={gameState.selectedAnswer === '' || gameState.gameCompleted || showExplanation}
              className="submit-button"
            >
              Submit Answer
            </button>
          </div>

          {/* Feedback and Explanation */}
          {feedback.message && (
            <div className={`feedback ${feedback.type}`}>
              {feedback.message}
            </div>
          )}

          {showExplanation && gameState.currentQuestion && (
            <div className="explanation-section">
              <h4>Explanation:</h4>
              <p>{gameState.currentQuestion.explanation}</p>
              <p className="correct-answer">
                Correct answer: {gameState.currentQuestion.correctAnswer}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Progress Indicator */}
      <div className="progress-section">
        <div className="progress-info">
          <span>Survival Progress</span>
          <span>{gameState.questionsAnswered} questions answered</span>
        </div>
        <div className="streak-info">
          <span>Current Streak: {gameState.streak}</span>
          <span>Best Streak: {gameState.maxStreak}</span>
        </div>
      </div>

      {/* Game Completion */}
      {gameState.gameCompleted && (
        <div className="game-completion-overlay">
          <div className="completion-content">
            <h2>
              {gameState.lives > 0 ? 'Survival Challenge Complete!' : 'Game Over!'}
            </h2>
            <div className="completion-stats">
              <div className="stat">
                <span className="stat-label">Final Score</span>
                <span className="stat-value">{gameState.score}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Questions Answered</span>
                <span className="stat-value">{gameState.questionsAnswered}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Correct Answers</span>
                <span className="stat-value">{gameState.correctAnswers}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Best Streak</span>
                <span className="stat-value">{gameState.maxStreak}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Lives Remaining</span>
                <span className="stat-value">{gameState.lives}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Accuracy</span>
                <span className="stat-value">
                  {gameState.questionsAnswered > 0 
                    ? Math.round((gameState.correctAnswers / gameState.questionsAnswered) * 100)
                    : 0}%
                </span>
              </div>
            </div>
            <div className="completion-message">
              {gameState.questionsAnswered >= 20 
                ? "Incredible survival skills! You're a solubility rules master!" 
                : gameState.questionsAnswered >= 10
                ? "Great survival run! Your chemistry knowledge is solid!"
                : "Good effort! Keep studying those solubility rules!"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};