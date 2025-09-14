import React, { useState, useEffect, useCallback } from 'react';
import { Challenge, Answer, ChallengeType } from '../../types/game';
import './TimeAttackSaltPrep.css';

// Salt preparation interfaces
interface SaltProcedure {
  id: string;
  name: string;
  description: string;
  steps: SaltPrepStep[];
  difficulty: number;
  timeLimit: number;
  expectedProducts: string[];
  safetyNotes: string[];
}

interface SaltPrepStep {
  id: string;
  order: number;
  description: string;
  action: string;
  isRequired: boolean;
  timeBonus: number; // Bonus points for quick completion
  equipment: string[];
  chemicals: string[];
}

interface TimeAttackChallenge extends Challenge {
  content: Challenge['content'] & {
    procedure: SaltProcedure;
    steps: SaltPrepStep[];
    correctSequence: number[];
  };
}

interface TimeAttackSaltPrepProps {
  challenge: TimeAttackChallenge;
  onSubmit: (answer: Answer) => void;
  onHintRequest: () => void;
  timeRemaining?: number;
  hintsUsed: number;
}

const TimeAttackSaltPrep: React.FC<TimeAttackSaltPrepProps> = ({
  challenge,
  onSubmit,
  onHintRequest,
  timeRemaining,
  hintsUsed
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());
  const [totalScore, setTotalScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [stepTimes, setStepTimes] = useState<number[]>([]);
  const [currentHint, setCurrentHint] = useState<string>('');
  const [showStepFeedback, setShowStepFeedback] = useState(false);
  const [stepFeedback, setStepFeedback] = useState<string>('');

  // Initialize the game
  useEffect(() => {
    if (challenge?.content?.procedure) {
      setCurrentStep(0);
      setCompletedSteps([]);
      setTotalScore(0);
      setGameStarted(false);
      setGameCompleted(false);
      setStepTimes([]);
      setCurrentHint('');
    }
  }, [challenge]);

  // Start the game
  const handleStartGame = useCallback(() => {
    setGameStarted(true);
    setStepStartTime(Date.now());
  }, []);

  // Handle step completion
  const handleStepComplete = useCallback(() => {
    if (!gameStarted || gameCompleted || currentStep >= challenge.content.procedure.steps.length) {
      return;
    }

    const stepEndTime = Date.now();
    const stepDuration = stepEndTime - stepStartTime;
    const currentStepData = challenge.content.procedure.steps[currentStep];
    
    // Calculate step score based on time
    const baseScore = 100;
    const timeBonus = Math.max(0, currentStepData.timeBonus - Math.floor(stepDuration / 1000));
    const stepScore = baseScore + timeBonus;

    // Update state
    const newCompletedSteps = [...completedSteps, currentStep];
    const newStepTimes = [...stepTimes, stepDuration];
    const newTotalScore = totalScore + stepScore;

    setCompletedSteps(newCompletedSteps);
    setStepTimes(newStepTimes);
    setTotalScore(newTotalScore);

    // Show step feedback
    setStepFeedback(`Step completed! +${stepScore} points (${timeBonus > 0 ? `+${timeBonus} time bonus` : 'no time bonus'})`);
    setShowStepFeedback(true);

    setTimeout(() => {
      setShowStepFeedback(false);
      
      // Move to next step or complete game
      if (currentStep + 1 >= challenge.content.procedure.steps.length) {
        setGameCompleted(true);
        handleGameComplete(newTotalScore, newStepTimes);
      } else {
        setCurrentStep(currentStep + 1);
        setStepStartTime(Date.now());
      }
    }, 2000);
  }, [gameStarted, gameCompleted, currentStep, challenge, stepStartTime, completedSteps, stepTimes, totalScore]);

  // Handle game completion
  const handleGameComplete = useCallback((finalScore: number, allStepTimes: number[]) => {
    const totalTime = allStepTimes.reduce((sum, time) => sum + time, 0);
    const averageStepTime = totalTime / allStepTimes.length;
    
    // Calculate final bonus based on overall performance
    const speedBonus = Math.max(0, Math.floor((challenge.timeLimit! * 1000 - totalTime) / 1000) * 5);
    const finalTotalScore = finalScore + speedBonus;

    const answer: Answer = {
      response: JSON.stringify({
        completedSteps: challenge.content.procedure.steps.length,
        totalTime: totalTime,
        averageStepTime: averageStepTime,
        stepTimes: allStepTimes,
        finalScore: finalTotalScore
      }),
      timeElapsed: Math.floor(totalTime / 1000),
      hintsUsed
    };

    onSubmit(answer);
  }, [challenge, hintsUsed, onSubmit]);

  // Handle hint request
  const handleHintClick = useCallback(() => {
    if (hintsUsed < challenge.content.hints.length) {
      setCurrentHint(challenge.content.hints[hintsUsed]);
      onHintRequest();
    }
  }, [hintsUsed, challenge.content.hints, onHintRequest]);

  // Format time display
  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const ms = milliseconds % 1000;
    return `${seconds}.${ms.toString().padStart(3, '0')}s`;
  };

  // Format remaining time
  const formatRemainingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!challenge?.content?.procedure) {
    return <div className="time-attack-loading">Loading salt preparation...</div>;
  }

  const procedure = challenge.content.procedure;
  const currentStepData = procedure.steps[currentStep];

  return (
    <div className="time-attack-salt-prep">
      {/* Header */}
      <div className="game-header">
        <h2>{procedure.name}</h2>
        <p className="procedure-description">{procedure.description}</p>
        
        <div className="game-stats">
          <div className="stat-item">
            <span className="stat-label">Time Remaining:</span>
            <span className="stat-value timer">
              {timeRemaining ? formatRemainingTime(timeRemaining) : 'No limit'}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Score:</span>
            <span className="stat-value score">{totalScore}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Progress:</span>
            <span className="stat-value progress">
              {completedSteps.length}/{procedure.steps.length}
            </span>
          </div>
        </div>
      </div>

      {/* Step Feedback Overlay */}
      {showStepFeedback && (
        <div className="step-feedback-overlay">
          <div className="step-feedback">
            <div className="feedback-icon">✅</div>
            <div className="feedback-message">{stepFeedback}</div>
          </div>
        </div>
      )}

      {/* Game Content */}
      {!gameStarted ? (
        <div className="game-start-screen">
          <div className="start-content">
            <h3>Ready to Start?</h3>
            <p>Complete each step as quickly as possible to earn time bonuses!</p>
            
            <div className="procedure-overview">
              <h4>Procedure Overview:</h4>
              <div className="steps-preview">
                {procedure.steps.map((step, index) => (
                  <div key={step.id} className="step-preview">
                    <span className="step-number">{index + 1}</span>
                    <span className="step-action">{step.action}</span>
                    <span className="time-bonus">+{step.timeBonus} bonus</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="expected-products">
              <h4>Expected Products:</h4>
              <div className="products-list">
                {procedure.expectedProducts.map((product, index) => (
                  <span key={index} className="product-badge">{product}</span>
                ))}
              </div>
            </div>

            <div className="safety-reminders">
              <h4>⚠️ Safety Reminders:</h4>
              <ul>
                {procedure.safetyNotes.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
            </div>

            <button className="start-game-button" onClick={handleStartGame}>
              Start Salt Preparation!
            </button>
          </div>
        </div>
      ) : gameCompleted ? (
        <div className="game-complete-screen">
          <div className="completion-content">
            <h3>🎉 Salt Preparation Complete!</h3>
            <p>You've successfully prepared {procedure.expectedProducts.join(' and ')}!</p>
            
            <div className="final-stats">
              <div className="stat-card">
                <div className="stat-title">Final Score</div>
                <div className="stat-number">{totalScore}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Total Time</div>
                <div className="stat-number">{formatTime(stepTimes.reduce((sum, time) => sum + time, 0))}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Average Step Time</div>
                <div className="stat-number">{formatTime(stepTimes.reduce((sum, time) => sum + time, 0) / stepTimes.length)}</div>
              </div>
            </div>

            <div className="step-breakdown">
              <h4>Step Performance:</h4>
              <div className="step-times">
                {stepTimes.map((time, index) => (
                  <div key={index} className="step-time-item">
                    <span className="step-name">Step {index + 1}</span>
                    <span className="step-time">{formatTime(time)}</span>
                    <span className={`step-rating ${time < 5000 ? 'excellent' : time < 10000 ? 'good' : 'slow'}`}>
                      {time < 5000 ? '⚡ Excellent' : time < 10000 ? '👍 Good' : '🐌 Could be faster'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="active-game">
          {/* Current Step Display */}
          <div className="current-step">
            <div className="step-header">
              <h3>Step {currentStep + 1} of {procedure.steps.length}</h3>
              <div className="step-timer">
                Time: {formatTime(Date.now() - stepStartTime)}
              </div>
            </div>

            <div className="step-content">
              <div className="step-action">
                <h4>{currentStepData.action}</h4>
                <p className="step-description">{currentStepData.description}</p>
              </div>

              <div className="step-requirements">
                {currentStepData.equipment.length > 0 && (
                  <div className="equipment-needed">
                    <h5>🔬 Equipment Needed:</h5>
                    <div className="items-list">
                      {currentStepData.equipment.map((item, index) => (
                        <span key={index} className="item-badge equipment">{item}</span>
                      ))}
                    </div>
                  </div>
                )}

                {currentStepData.chemicals.length > 0 && (
                  <div className="chemicals-needed">
                    <h5>🧪 Chemicals Needed:</h5>
                    <div className="items-list">
                      {currentStepData.chemicals.map((item, index) => (
                        <span key={index} className="item-badge chemical">{item}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="step-bonus-info">
                <div className="bonus-indicator">
                  ⚡ Time Bonus: +{currentStepData.timeBonus} points (decreases over time)
                </div>
              </div>
            </div>

            <div className="step-controls">
              <button 
                className="complete-step-button"
                onClick={handleStepComplete}
              >
                Complete Step
              </button>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="progress-section">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${(completedSteps.length / procedure.steps.length) * 100}%` }}
              />
            </div>
            <div className="step-indicators">
              {procedure.steps.map((_, index) => (
                <div 
                  key={index}
                  className={`step-indicator ${
                    completedSteps.includes(index) ? 'completed' : 
                    index === currentStep ? 'current' : 'pending'
                  }`}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hint Section */}
      {currentHint && (
        <div className="hint-section">
          <div className="hint-content">
            💡 <strong>Hint:</strong> {currentHint}
          </div>
        </div>
      )}

      {/* Game Controls */}
      {gameStarted && !gameCompleted && (
        <div className="game-controls">
          <button 
            className="hint-button"
            onClick={handleHintClick}
            disabled={hintsUsed >= challenge.content.hints.length}
          >
            💡 Hint ({hintsUsed}/{challenge.content.hints.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default TimeAttackSaltPrep;