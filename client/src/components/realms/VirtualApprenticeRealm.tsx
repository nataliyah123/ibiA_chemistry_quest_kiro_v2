import React, { useState, useEffect } from 'react';
import { useGameEngine } from '../../hooks/useGameEngine';
import { Challenge, ChallengeType, Answer, Result } from '../../types/game';
import StepByStepSimulator from '../games/StepByStepSimulator';
import TimeAttackSaltPrep from '../games/TimeAttackSaltPrep';
import DistillationDragon from '../games/DistillationDragon';
import './VirtualApprenticeRealm.css';

interface VirtualApprenticeRealmProps {
  userId: string;
}

const VirtualApprenticeRealm: React.FC<VirtualApprenticeRealmProps> = ({ userId }) => {
  const { 
    startChallenge, 
    submitAnswer, 
    isLoading, 
    error,
    currentChallenge,
    lastResult 
  } = useGameEngine();

  const [selectedGame, setSelectedGame] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<number | undefined>();
  const [hintsUsed, setHintsUsed] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (gameStarted && currentChallenge?.timeLimit && timeRemaining !== undefined && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === undefined || prev <= 1) {
            // Time's up - auto submit
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameStarted, currentChallenge, timeRemaining]);

  // Handle time up
  const handleTimeUp = async () => {
    if (currentChallenge) {
      const timeUpAnswer: Answer = {
        response: '',
        timeElapsed: currentChallenge.timeLimit || 0,
        hintsUsed
      };
      
      await submitAnswer(currentChallenge.id, timeUpAnswer);
      setShowResult(true);
      setGameStarted(false);
    }
  };

  // Start a new challenge
  const handleStartChallenge = async (challengeType: ChallengeType, difficulty: number = 1) => {
    try {
      const challenge = await startChallenge(userId, 'virtual-apprentice', challengeType, difficulty);
      if (challenge) {
        setTimeRemaining(challenge.timeLimit);
        setHintsUsed(0);
        setGameStarted(true);
        setShowResult(false);
        setSelectedGame(challengeType);
      }
    } catch (err) {
      console.error('Failed to start challenge:', err);
    }
  };

  // Handle answer submission
  const handleSubmitAnswer = async (answer: Answer) => {
    if (!currentChallenge) return;

    try {
      await submitAnswer(currentChallenge.id, answer);
      setShowResult(true);
      setGameStarted(false);
    } catch (err) {
      console.error('Failed to submit answer:', err);
    }
  };

  // Handle hint request
  const handleHintRequest = () => {
    setHintsUsed(prev => prev + 1);
  };

  // Reset game state
  const handlePlayAgain = () => {
    setShowResult(false);
    setSelectedGame('');
    setGameStarted(false);
    setTimeRemaining(undefined);
    setHintsUsed(0);
  };

  // Return to game selection
  const handleBackToMenu = () => {
    setSelectedGame('');
    setGameStarted(false);
    setShowResult(false);
    setTimeRemaining(undefined);
    setHintsUsed(0);
  };

  // Render result screen
  const renderResult = () => {
    if (!lastResult) return null;

    return (
      <div className="result-screen">
        <div className="result-container">
          <h2>Challenge Complete!</h2>
          
          <div className="result-stats">
            <div className="stat-item">
              <span className="stat-label">Score:</span>
              <span className="stat-value">{lastResult.score}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">XP Gained:</span>
              <span className="stat-value">+{lastResult.experienceGained}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Gold Earned:</span>
              <span className="stat-value">+{lastResult.goldEarned}</span>
            </div>
          </div>

          <div className="result-feedback">
            <div className={`feedback-message ${lastResult.validation.isCorrect ? 'success' : 'error'}`}>
              {lastResult.validation.feedback}
            </div>
            
            {lastResult.validation.explanation && (
              <div className="explanation">
                <h4>Explanation:</h4>
                <p>{lastResult.validation.explanation}</p>
              </div>
            )}
          </div>

          {lastResult.rewards && lastResult.rewards.length > 0 && (
            <div className="rewards-section">
              <h4>Rewards Earned:</h4>
              <div className="rewards-list">
                {lastResult.rewards.map((reward, index) => (
                  <div key={index} className="reward-item">
                    <span className="reward-icon">
                      {reward.type === 'badge' ? '🏆' : 
                       reward.type === 'unlock' ? '🔓' : 
                       reward.type === 'item' ? '🎁' : '⭐'}
                    </span>
                    <span className="reward-description">{reward.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="result-actions">
            <button className="play-again-button" onClick={handlePlayAgain}>
              Play Again
            </button>
            <button className="back-to-menu-button" onClick={handleBackToMenu}>
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render game selection menu
  const renderGameMenu = () => (
    <div className="game-menu">
      <div className="realm-header">
        <h1>Virtual Apprentice</h1>
        <p className="realm-description">
          Master laboratory techniques through virtual simulations and step-by-step procedures
        </p>
      </div>

      <div className="games-grid">
        <div className="game-card" onClick={() => handleStartChallenge(ChallengeType.STEP_BY_STEP, 1)}>
          <div className="game-icon">🧪</div>
          <h3>Step-by-Step Simulator</h3>
          <p>Arrange laboratory procedure steps in the correct order</p>
          <div className="difficulty-badges">
            <span className="difficulty easy">Easy</span>
            <span className="difficulty medium">Medium</span>
            <span className="difficulty hard">Hard</span>
          </div>
          <div className="game-features">
            <span className="feature">🔬 10+ Lab Procedures</span>
            <span className="feature">💥 Explosion Animations</span>
            <span className="feature">⚠️ Safety Training</span>
          </div>
        </div>

        <div className="game-card" onClick={() => handleStartChallenge(ChallengeType.TIME_ATTACK, 1)}>
          <div className="game-icon">⏱️</div>
          <h3>Time Attack Salt Prep</h3>
          <p>Complete salt preparation procedures as quickly as possible</p>
          <div className="difficulty-badges">
            <span className="difficulty easy">Easy</span>
            <span className="difficulty medium">Medium</span>
            <span className="difficulty hard">Hard</span>
          </div>
          <div className="game-features">
            <span className="feature">🧂 8+ Salt Procedures</span>
            <span className="feature">⚡ Speed Bonuses</span>
            <span className="feature">🏆 Gold Rewards</span>
          </div>
        </div>

        <div className="game-card" onClick={() => handleStartChallenge(ChallengeType.BOSS_BATTLE, 4)}>
          <div className="game-icon">🐉</div>
          <h3>Distillation Dragon Boss</h3>
          <p>Defeat the dragon through fractional distillation mastery</p>
          <div className="difficulty-badges">
            <span className="difficulty hard">Boss Level</span>
          </div>
          <div className="game-features">
            <span className="feature">🌡️ Temperature Control</span>
            <span className="feature">🐲 Boss Battle</span>
            <span className="feature">🏺 Golden Flask Badge</span>
          </div>
        </div>
      </div>

      <div className="realm-info">
        <div className="info-section">
          <h4>🎯 Learning Objectives</h4>
          <ul>
            <li>Master laboratory safety procedures</li>
            <li>Learn proper equipment handling techniques</li>
            <li>Understand step-by-step experimental procedures</li>
            <li>Develop precision and accuracy in lab work</li>
          </ul>
        </div>

        <div className="info-section">
          <h4>🏆 Rewards & Progression</h4>
          <ul>
            <li>Golden Flask Badge for mastery</li>
            <li>Advanced procedure unlocks</li>
            <li>Safety certification achievements</li>
            <li>Precision bonus multipliers</li>
          </ul>
        </div>
      </div>
    </div>
  );

  // Render active game
  const renderActiveGame = () => {
    if (!currentChallenge) return null;

    switch (currentChallenge.type) {
      case ChallengeType.STEP_BY_STEP:
        return (
          <StepByStepSimulator
            challenge={currentChallenge as any}
            onSubmit={handleSubmitAnswer}
            onHintRequest={handleHintRequest}
            timeRemaining={timeRemaining}
            hintsUsed={hintsUsed}
          />
        );
      case ChallengeType.TIME_ATTACK:
        return (
          <TimeAttackSaltPrep
            challenge={currentChallenge as any}
            onSubmit={handleSubmitAnswer}
            onHintRequest={handleHintRequest}
            timeRemaining={timeRemaining}
            hintsUsed={hintsUsed}
          />
        );
      case ChallengeType.BOSS_BATTLE:
        return (
          <DistillationDragon
            challenge={currentChallenge as any}
            onSubmit={handleSubmitAnswer}
            onHintRequest={handleHintRequest}
            timeRemaining={timeRemaining}
            hintsUsed={hintsUsed}
          />
        );
      default:
        return (
          <div className="unsupported-game">
            <h3>Game type not yet implemented</h3>
            <button onClick={handleBackToMenu}>Back to Menu</button>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="virtual-apprentice-realm loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Virtual Apprentice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="virtual-apprentice-realm error">
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="virtual-apprentice-realm">
      {showResult ? renderResult() : 
       gameStarted ? renderActiveGame() : 
       renderGameMenu()}
    </div>
  );
};

export default VirtualApprenticeRealm;