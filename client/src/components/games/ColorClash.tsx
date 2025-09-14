import React, { useState, useEffect } from 'react';
import { Challenge, Answer, ValidationResult } from '../../types/game';
import './ColorClash.css';

interface ColorClashProps {
  challenge: Challenge;
  onSubmitAnswer: (answer: Answer) => Promise<ValidationResult>;
  onComplete: (result: ValidationResult) => void;
  timeRemaining?: number;
}

interface GameState {
  userDescription: string;
  showResult: boolean;
  result: ValidationResult | null;
  currentScore: number;
  hintsUsed: number;
  showHints: boolean;
}

const ColorClash: React.FC<ColorClashProps> = ({
  challenge,
  onSubmitAnswer,
  onComplete,
  timeRemaining
}) => {
  const [gameState, setGameState] = useState<GameState>({
    userDescription: '',
    showResult: false,
    result: null,
    currentScore: 0,
    hintsUsed: 0,
    showHints: false
  });

  const [startTime] = useState(Date.now());

  // Extract game data from challenge metadata
  const gameData = challenge.metadata?.gameSpecific;
  const reaction = gameData?.reaction;
  const maxScore = gameData?.maxScore || 100;

  const handleDescriptionChange = (value: string) => {
    if (!gameState.showResult) {
      setGameState(prev => ({ ...prev, userDescription: value }));
    }
  };

  const handleSubmit = async () => {
    if (!gameState.userDescription.trim() || gameState.showResult) {
      return;
    }

    const timeElapsed = (Date.now() - startTime) / 1000;
    
    const answer: Answer = {
      challengeId: challenge.id,
      response: gameState.userDescription.trim(),
      timeElapsed,
      hintsUsed: gameState.hintsUsed
    };

    try {
      const result = await onSubmitAnswer(answer);
      
      setGameState(prev => ({
        ...prev,
        showResult: true,
        result,
        currentScore: result.score
      }));

      // Auto-complete after showing result
      setTimeout(() => {
        onComplete(result);
      }, 4000);
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleHint = () => {
    setGameState(prev => ({
      ...prev,
      hintsUsed: prev.hintsUsed + 1,
      showHints: true
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#27ae60';
    if (score >= 60) return '#f39c12';
    if (score >= 30) return '#e67e22';
    return '#e74c3c';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return 'Excellent description!';
    if (score >= 80) return 'Great observation!';
    if (score >= 60) return 'Good color identification!';
    if (score >= 30) return 'Some correct elements!';
    return 'Keep practicing!';
  };

  return (
    <div className="color-clash">
      <div className="game-header">
        <h2>{challenge.title}</h2>
        <div className="game-stats">
          <div className="score-display">
            <span className="score-icon">⭐</span>
            <span>Score: {gameState.currentScore}/{maxScore}</span>
          </div>
          {timeRemaining && (
            <div className="timer">
              <span className="timer-icon">⏱️</span>
              <span>{Math.ceil(timeRemaining)}s</span>
            </div>
          )}
        </div>
      </div>

      <div className="reaction-scenario">
        <h3>🧪 Chemical Reaction Scenario</h3>
        <div className="scenario-content">
          <div className="text-clue">
            <h4>Observation Clue:</h4>
            <p className="clue-text">{reaction?.textClue}</p>
          </div>
          
          <div className="reaction-info">
            <div className="reactants">
              <h5>Reactants:</h5>
              <div className="chemical-list">
                {reaction?.reactants.map((reactant: string, index: number) => (
                  <span key={index} className="chemical-formula">{reactant}</span>
                ))}
              </div>
            </div>
            
            <div className="products">
              <h5>Products:</h5>
              <div className="chemical-list">
                {reaction?.products.map((product: string, index: number) => (
                  <span key={index} className="chemical-formula">{product}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="description-interface">
        <h3>📝 Your Color Description</h3>
        <div className="description-prompt">
          <p>{challenge.content.question}</p>
        </div>
        
        <div className="text-input-section">
          <textarea
            className="color-description-input"
            value={gameState.userDescription}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Describe the color change you would observe... (e.g., 'The solution changes from pale blue to deep blue')"
            rows={4}
            disabled={gameState.showResult}
          />
          
          <div className="input-help">
            <p>💡 Tip: Be specific about colors and describe the change clearly</p>
            <p>⌨️ Press Ctrl+Enter to submit</p>
          </div>
        </div>

        <div className="word-suggestions">
          <h4>Color Words to Consider:</h4>
          <div className="color-words">
            <span className="color-word red">red</span>
            <span className="color-word blue">blue</span>
            <span className="color-word green">green</span>
            <span className="color-word yellow">yellow</span>
            <span className="color-word purple">purple</span>
            <span className="color-word orange">orange</span>
            <span className="color-word brown">brown</span>
            <span className="color-word colorless">colorless</span>
            <span className="color-word white">white</span>
            <span className="color-word black">black</span>
            <span className="color-word pink">pink</span>
            <span className="color-word cream">cream</span>
          </div>
        </div>
      </div>

      <div className="game-controls">
        <button 
          className="hint-button"
          onClick={handleHint}
          disabled={gameState.showResult}
        >
          💡 Hint ({gameState.hintsUsed} used)
        </button>
        
        <button 
          className="submit-button"
          onClick={handleSubmit}
          disabled={!gameState.userDescription.trim() || gameState.showResult}
        >
          Submit Description
        </button>
      </div>

      {gameState.showHints && (
        <div className="hints-section">
          <h4>Hints:</h4>
          <ul>
            {challenge.content.hints.slice(0, gameState.hintsUsed).map((hint, index) => (
              <li key={index}>{hint}</li>
            ))}
          </ul>
        </div>
      )}

      {gameState.showResult && gameState.result && (
        <div className={`result-section ${gameState.result.isCorrect ? 'correct' : 'partial'}`}>
          <h3 style={{ color: getScoreColor(gameState.result.score) }}>
            {getScoreMessage(gameState.result.score)}
          </h3>
          
          <div className="score-breakdown">
            <div className="score-display-large">
              <span className="score-number" style={{ color: getScoreColor(gameState.result.score) }}>
                {gameState.result.score}
              </span>
              <span className="score-max">/{maxScore}</span>
            </div>
          </div>

          <p className="result-feedback">{gameState.result.feedback}</p>
          
          <div className="result-details">
            <div className="comparison">
              <div className="user-answer">
                <h5>Your Description:</h5>
                <p>"{gameState.userDescription}"</p>
              </div>
              
              <div className="correct-answer">
                <h5>Expected Description:</h5>
                <p>"{challenge.content.correctAnswer}"</p>
              </div>
            </div>
            
            <div className="explanation">
              <h5>Scientific Explanation:</h5>
              <p>{gameState.result.explanation}</p>
            </div>

            {gameState.result.metadata?.detailedFeedback && (
              <div className="detailed-feedback">
                <h5>Detailed Analysis:</h5>
                <pre>{gameState.result.metadata.detailedFeedback}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="reaction-context">
        <h4>🔬 Reaction Context</h4>
        <div className="context-info">
          <div className="topic-badge">
            <span className="topic-icon">🏷️</span>
            <span>{reaction?.topic}</span>
          </div>
          <div className="difficulty-badge">
            <span className="difficulty-icon">📊</span>
            <span>Difficulty: {challenge.difficulty}/5</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorClash;