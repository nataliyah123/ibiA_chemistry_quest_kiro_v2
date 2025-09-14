import React, { useState, useEffect, useCallback } from 'react';
import { Challenge, Answer, Result } from '../../types/game';
import { useGameEngine } from '../../hooks/useGameEngine';
import './MoleDungeonCrawler.css';

interface MoleDungeonCrawlerProps {
  challenge: Challenge;
  onComplete: (result: Result) => void;
  onAbandon: () => void;
}

interface DungeonState {
  currentRoom: number;
  totalRooms: number;
  keysCollected: number;
  timeRemaining: number;
  userAnswer: string;
  isSubmitting: boolean;
  showHints: boolean;
  currentHint: string;
  hintsUsed: number;
  feedback: string;
  showSolution: boolean;
  roomProgress: number;
}

interface StoichiometryStep {
  step: number;
  description: string;
  calculation: string;
  isCompleted: boolean;
}

export const MoleDungeonCrawler: React.FC<MoleDungeonCrawlerProps> = ({
  challenge,
  onComplete,
  onAbandon
}) => {
  const { submitAnswer, getHint } = useGameEngine();
  
  const [dungeonState, setDungeonState] = useState<DungeonState>({
    currentRoom: 1,
    totalRooms: 10,
    keysCollected: 0,
    timeRemaining: challenge.timeLimit || 300,
    userAnswer: '',
    isSubmitting: false,
    showHints: false,
    currentHint: '',
    hintsUsed: 0,
    feedback: '',
    showSolution: false,
    roomProgress: 0
  });

  const [calculationSteps, setCalculationSteps] = useState<StoichiometryStep[]>([]);
  const [showStepByStep, setShowStepByStep] = useState(false);

  // Parse the stoichiometry problem from challenge content
  const parseProblem = useCallback(() => {
    const question = challenge.content.question;
    const lines = question.split('\n');
    
    // Extract key information
    const equationLine = lines.find(line => line.includes('**Chemical Equation:**'));
    const givenLine = lines.find(line => line.includes('**Given:**'));
    const findLine = lines.find(line => line.includes('**Find:**'));
    
    return {
      equation: equationLine?.replace('**Chemical Equation:** ', '') || '',
      given: givenLine?.replace('**Given:** ', '') || '',
      find: findLine?.replace('**Find:** ', '') || ''
    };
  }, [challenge.content.question]);

  const problemData = parseProblem();

  // Initialize calculation steps
  useEffect(() => {
    const steps: StoichiometryStep[] = [
      {
        step: 1,
        description: "Write the balanced chemical equation",
        calculation: problemData.equation,
        isCompleted: false
      },
      {
        step: 2,
        description: "Identify given and find quantities",
        calculation: `Given: ${problemData.given}\nFind: ${problemData.find}`,
        isCompleted: false
      },
      {
        step: 3,
        description: "Convert to moles if necessary",
        calculation: "Use molar mass to convert mass to moles",
        isCompleted: false
      },
      {
        step: 4,
        description: "Apply mole ratio from balanced equation",
        calculation: "Use coefficients to find mole ratio",
        isCompleted: false
      },
      {
        step: 5,
        description: "Convert to final units",
        calculation: "Convert moles to requested units",
        isCompleted: false
      }
    ];
    setCalculationSteps(steps);
  }, [problemData]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setDungeonState(prev => {
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

  const handleAnswerChange = (value: string) => {
    setDungeonState(prev => ({ ...prev, userAnswer: value }));
  };

  const handleSubmit = async () => {
    if (dungeonState.isSubmitting) return;
    
    setDungeonState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      const answer: Answer = {
        challengeId: challenge.id,
        userId: 'current-user', // This would come from auth context
        response: dungeonState.userAnswer,
        timeElapsed: (challenge.timeLimit || 300) - dungeonState.timeRemaining,
        hintsUsed: dungeonState.hintsUsed,
        submittedAt: new Date()
      };

      const result = await submitAnswer(challenge.id, answer.response, answer.hintsUsed);
      
      if (result.validation.isCorrect) {
        // Correct answer - unlock door
        setDungeonState(prev => ({
          ...prev,
          feedback: 'The ancient door creaks open! You may proceed to the next chamber.',
          keysCollected: prev.keysCollected + 1,
          roomProgress: 100
        }));
        
        // Mark all steps as completed
        setCalculationSteps(prev => prev.map(step => ({ ...step, isCompleted: true })));
        
        setTimeout(() => onComplete(result), 3000);
      } else {
        // Incorrect answer
        setDungeonState(prev => ({
          ...prev,
          feedback: result.validation.feedback,
          showSolution: true
        }));
        
        setTimeout(() => onComplete(result), 5000);
      }
    } catch (error) {
      setDungeonState(prev => ({
        ...prev,
        feedback: 'Error submitting answer. Please try again.',
        isSubmitting: false
      }));
    }
  };

  const handleGetHint = async () => {
    try {
      const hint = await getHint(challenge.id, dungeonState.hintsUsed);
      setDungeonState(prev => ({
        ...prev,
        currentHint: hint,
        showHints: true,
        hintsUsed: prev.hintsUsed + 1
      }));
      
      // Mark current step as partially completed
      setCalculationSteps(prev => prev.map((step, index) => 
        index === dungeonState.hintsUsed ? { ...step, isCompleted: true } : step
      ));
    } catch (error) {
      setDungeonState(prev => ({ ...prev, feedback: 'No more hints available.' }));
    }
  };

  const toggleStepByStep = () => {
    setShowStepByStep(!showStepByStep);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mole-dungeon-crawler">
      {/* Dungeon Header */}
      <div className="dungeon-header">
        <div className="dungeon-info">
          <h2 className="dungeon-title">🏰 Mole Dungeon Crawler</h2>
          <div className="room-info">
            <span className="room-number">Room {dungeonState.currentRoom}/{dungeonState.totalRooms}</span>
            <div className="room-progress">
              <div 
                className="progress-fill" 
                style={{ width: `${dungeonState.roomProgress}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="dungeon-stats">
          <div className="stat-item">
            <span className="stat-icon">🗝️</span>
            <span className="stat-value">{dungeonState.keysCollected}</span>
            <span className="stat-label">Keys</span>
          </div>
          
          <div className="stat-item">
            <span className="stat-icon">⏰</span>
            <span className={`stat-value ${dungeonState.timeRemaining <= 60 ? 'warning' : ''}`}>
              {formatTime(dungeonState.timeRemaining)}
            </span>
            <span className="stat-label">Time</span>
          </div>
        </div>
        
        <div className="dungeon-actions">
          <button 
            className="hint-button" 
            onClick={handleGetHint}
            disabled={dungeonState.hintsUsed >= challenge.content.hints.length}
          >
            💡 Hint ({dungeonState.hintsUsed}/{challenge.content.hints.length})
          </button>
          <button className="step-button" onClick={toggleStepByStep}>
            📋 Steps
          </button>
          <button className="abandon-button" onClick={onAbandon}>
            🚪 Exit Dungeon
          </button>
        </div>
      </div>

      {/* Problem Display */}
      <div className="problem-container">
        <div className="room-description">
          <h3>{challenge.title}</h3>
          <p>{challenge.description}</p>
        </div>
        
        <div className="stoichiometry-problem">
          <div className="problem-content">
            {challenge.content.question.split('\n').map((line, index) => (
              <div key={index} className={`problem-line ${line.startsWith('**') ? 'highlight' : ''}`}>
                {line.replace(/\*\*/g, '')}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step-by-Step Guide */}
      {showStepByStep && (
        <div className="step-by-step-guide">
          <h4>🧭 Stoichiometry Navigation Guide</h4>
          <div className="calculation-steps">
            {calculationSteps.map((step, index) => (
              <div 
                key={step.step} 
                className={`calculation-step ${step.isCompleted ? 'completed' : ''}`}
              >
                <div className="step-number">{step.step}</div>
                <div className="step-content">
                  <div className="step-description">{step.description}</div>
                  <div className="step-calculation">{step.calculation}</div>
                </div>
                <div className="step-status">
                  {step.isCompleted ? '✅' : '⏳'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Answer Input */}
      <div className="answer-section">
        <div className="answer-input-container">
          <label htmlFor="answer-input" className="answer-label">
            🔢 Enter your numerical answer:
          </label>
          <div className="input-group">
            <input
              id="answer-input"
              type="number"
              step="0.01"
              value={dungeonState.userAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="e.g., 4.50"
              className="answer-input"
              disabled={dungeonState.isSubmitting}
            />
            <button 
              className="submit-button"
              onClick={handleSubmit}
              disabled={dungeonState.isSubmitting || !dungeonState.userAnswer.trim()}
            >
              {dungeonState.isSubmitting ? '🔓 Unlocking...' : '🔓 Unlock Door'}
            </button>
          </div>
        </div>
        
        <div className="answer-help">
          <p>💡 Enter your answer as a decimal number (round to 2 decimal places)</p>
          <p>🧮 Use the step-by-step guide if you need help with the calculation</p>
        </div>
      </div>

      {/* Feedback */}
      {dungeonState.feedback && (
        <div className={`feedback ${dungeonState.feedback.includes('creaks open') ? 'success' : 'error'}`}>
          <div className="feedback-icon">
            {dungeonState.feedback.includes('creaks open') ? '🎉' : '❌'}
          </div>
          <div className="feedback-text">{dungeonState.feedback}</div>
        </div>
      )}

      {/* Solution Display */}
      {dungeonState.showSolution && (
        <div className="solution-display">
          <h4>🔍 Solution Revealed</h4>
          <div className="solution-content">
            {challenge.content.explanation.split('\n').map((line, index) => (
              <div key={index} className="solution-line">
                {line.replace(/\*\*/g, '')}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hints Modal */}
      {dungeonState.showHints && (
        <div className="hints-modal">
          <div className="hints-content">
            <h3>🧙‍♂️ Ancient Wisdom</h3>
            <p>{dungeonState.currentHint}</p>
            <button onClick={() => setDungeonState(prev => ({ ...prev, showHints: false }))}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Door Animation */}
      <div className={`dungeon-door ${dungeonState.roomProgress === 100 ? 'unlocked' : ''}`}>
        <div className="door-frame">
          <div className="door-left"></div>
          <div className="door-right"></div>
          <div className="door-lock">
            {dungeonState.roomProgress === 100 ? '🔓' : '🔒'}
          </div>
        </div>
        <div className="door-glow"></div>
      </div>
    </div>
  );
};