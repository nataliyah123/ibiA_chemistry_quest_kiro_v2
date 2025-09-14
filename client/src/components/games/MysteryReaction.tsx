import React, { useState, useEffect } from 'react';
import { Challenge, Answer, ValidationResult } from '../../types/game';
import './MysteryReaction.css';

interface MysteryReactionProps {
  challenge: Challenge;
  onSubmitAnswer: (answer: Answer) => Promise<ValidationResult>;
  onComplete: (result: ValidationResult) => void;
  timeRemaining?: number;
}

interface GameState {
  selectedGas: string;
  userEquation: string;
  showResult: boolean;
  result: ValidationResult | null;
  currentScore: number;
  hintsUsed: number;
  showHints: boolean;
  animationPlaying: boolean;
  crystalBallUnlocked: boolean;
}

const MysteryReaction: React.FC<MysteryReactionProps> = ({
  challenge,
  onSubmitAnswer,
  onComplete,
  timeRemaining
}) => {
  const [gameState, setGameState] = useState<GameState>({
    selectedGas: '',
    userEquation: '',
    showResult: false,
    result: null,
    currentScore: 0,
    hintsUsed: 0,
    showHints: false,
    animationPlaying: false,
    crystalBallUnlocked: false
  });

  const [startTime] = useState(Date.now());

  // Extract game data from challenge metadata
  const gameData = challenge.metadata?.gameSpecific;
  const reaction = gameData?.reaction;
  const gasOptions = gameData?.gasOptions || [];
  const maxScore = gameData?.maxScore || 100;

  useEffect(() => {
    // Start animation automatically
    setGameState(prev => ({ ...prev, animationPlaying: true }));
    
    // Stop animation after 10 seconds
    const timer = setTimeout(() => {
      setGameState(prev => ({ ...prev, animationPlaying: false }));
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleGasSelection = (gas: string) => {
    if (!gameState.showResult) {
      setGameState(prev => ({ ...prev, selectedGas: gas }));
    }
  };

  const handleEquationChange = (equation: string) => {
    if (!gameState.showResult) {
      setGameState(prev => ({ ...prev, userEquation: equation }));
    }
  };

  const handleSubmit = async () => {
    if (!gameState.selectedGas || !gameState.userEquation.trim() || gameState.showResult) {
      return;
    }

    const timeElapsed = (Date.now() - startTime) / 1000;
    
    const answer: Answer = {
      challengeId: challenge.id,
      response: {
        gas: gameState.selectedGas,
        equation: gameState.userEquation.trim()
      },
      timeElapsed,
      hintsUsed: gameState.hintsUsed
    };

    try {
      const result = await onSubmitAnswer(answer);
      
      setGameState(prev => ({
        ...prev,
        showResult: true,
        result,
        currentScore: result.score,
        crystalBallUnlocked: result.metadata?.crystalBallUnlocked || false
      }));

      // Auto-complete after showing result
      setTimeout(() => {
        onComplete(result);
      }, 5000);
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

  const playAnimation = () => {
    setGameState(prev => ({ ...prev, animationPlaying: true }));
    
    setTimeout(() => {
      setGameState(prev => ({ ...prev, animationPlaying: false }));
    }, 10000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#27ae60';
    if (score >= 60) return '#f39c12';
    if (score >= 40) return '#e67e22';
    return '#e74c3c';
  };

  const getScoreMessage = (score: number) => {
    if (score === 100) return 'Perfect! Both gas and equation correct!';
    if (score >= 60) return 'Good! Gas identified correctly!';
    if (score >= 40) return 'Nice equation work!';
    return 'Keep studying the clues!';
  };

  return (
    <div className="mystery-reaction">
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

      <div className="reaction-animation-section">
        <h3>🎬 Mystery Reaction Animation</h3>
        <div className="animation-container">
          <div className={`reaction-animation ${gameState.animationPlaying ? 'playing' : 'stopped'}`}>
            {gameState.animationPlaying ? (
              <div className="animation-effects">
                <div className="reactants">
                  {reaction?.reactants.map((reactant: string, index: number) => (
                    <div key={index} className="reactant-bubble">
                      {reactant}
                    </div>
                  ))}
                </div>
                <div className="reaction-arrow">→</div>
                <div className="visual-effects">
                  {reaction?.visualEffects.map((effect: string, index: number) => (
                    <div key={index} className={`effect ${effect.replace(/\s+/g, '-')}`}>
                      {effect}
                    </div>
                  ))}
                </div>
                <div className="gas-evolution">
                  <div className="gas-bubbles">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="bubble" style={{ animationDelay: `${i * 0.5}s` }}>
                        💨
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="animation-placeholder">
                <div className="play-button" onClick={playAnimation}>
                  ▶️ Play Animation
                </div>
                <p>Click to watch the reaction animation</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="reaction-info">
          <div className="reactants-display">
            <h4>Reactants:</h4>
            <div className="chemical-formulas">
              {reaction?.reactants.map((reactant: string, index: number) => (
                <span key={index} className="chemical-formula">{reactant}</span>
              ))}
            </div>
          </div>
          
          <div className="visual-clues">
            <h4>Visual Observations:</h4>
            <ul>
              {reaction?.visualEffects.map((effect: string, index: number) => (
                <li key={index}>{effect}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="answer-interface">
        <div className="gas-identification">
          <h3>🔍 Gas Identification</h3>
          <p>What gas is being produced in this reaction?</p>
          
          <div className="gas-options">
            {gasOptions.map((gas: string) => (
              <button
                key={gas}
                className={`gas-option ${gameState.selectedGas === gas ? 'selected' : ''}`}
                onClick={() => handleGasSelection(gas)}
                disabled={gameState.showResult}
              >
                {gas}
              </button>
            ))}
          </div>
        </div>

        <div className="equation-writing">
          <h3>⚖️ Chemical Equation</h3>
          <p>Write the balanced chemical equation for this reaction:</p>
          
          <div className="equation-input-section">
            <textarea
              className="equation-input"
              value={gameState.userEquation}
              onChange={(e) => handleEquationChange(e.target.value)}
              placeholder="Write the balanced chemical equation here... (e.g., 2H₂ + O₂ → 2H₂O)"
              rows={3}
              disabled={gameState.showResult}
            />
            
            <div className="equation-help">
              <p>💡 Tip: Use subscripts like H₂O, CO₂, etc. Make sure to balance the equation!</p>
            </div>
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
          className="replay-animation-button"
          onClick={playAnimation}
          disabled={gameState.animationPlaying}
        >
          🎬 Replay Animation
        </button>
        
        <button 
          className="submit-button"
          onClick={handleSubmit}
          disabled={!gameState.selectedGas || !gameState.userEquation.trim() || gameState.showResult}
        >
          Submit Answer
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
            <div className="answer-comparison">
              <div className="user-answers">
                <h5>Your Answers:</h5>
                <p><strong>Gas:</strong> {gameState.selectedGas}</p>
                <p><strong>Equation:</strong> {gameState.userEquation}</p>
              </div>
              
              <div className="correct-answers">
                <h5>Correct Answers:</h5>
                <p><strong>Gas:</strong> {gameState.result.metadata?.correctGas}</p>
                <p><strong>Equation:</strong> {gameState.result.metadata?.correctEquation}</p>
              </div>
            </div>
            
            <div className="explanation">
              <h5>Scientific Explanation:</h5>
              <p>{gameState.result.explanation}</p>
            </div>

            {gameState.result.metadata?.gasProperties && (
              <div className="gas-properties">
                <h5>Gas Properties:</h5>
                <div className="properties-grid">
                  <div className="property">
                    <span className="property-label">Color:</span>
                    <span>{gameState.result.metadata.gasProperties.color}</span>
                  </div>
                  <div className="property">
                    <span className="property-label">Smell:</span>
                    <span>{gameState.result.metadata.gasProperties.smell}</span>
                  </div>
                  <div className="property">
                    <span className="property-label">Density:</span>
                    <span>{gameState.result.metadata.gasProperties.density}</span>
                  </div>
                  <div className="property">
                    <span className="property-label">Flammability:</span>
                    <span>{gameState.result.metadata.gasProperties.flammability}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {gameState.crystalBallUnlocked && reaction?.crystalBallVideo && (
            <div className="crystal-ball-unlock">
              <h4>🔮 Crystal Ball Unlocked!</h4>
              <div className="video-info">
                <h5>{reaction.crystalBallVideo.title}</h5>
                <p>{reaction.crystalBallVideo.description}</p>
                <div className="video-meta">
                  <span>Expert: {reaction.crystalBallVideo.expertName}</span>
                  <span>Duration: {reaction.crystalBallVideo.duration}</span>
                </div>
                <button className="watch-video-button">
                  📺 Watch Expert Explanation
                </button>
              </div>
            </div>
          )}
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

export default MysteryReaction;