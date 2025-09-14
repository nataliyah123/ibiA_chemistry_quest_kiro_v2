import React, { useState, useEffect, useRef } from 'react';
import { Challenge, Answer, Result } from '../../types/game';
import { useGameEngine } from '../../hooks/useGameEngine';
import './NamingArena.css';

interface NamingArenaProps {
  challenge: Challenge;
  onComplete: (result: Result) => void;
  onAbandon: () => void;
}

export const NamingArena: React.FC<NamingArenaProps> = ({
  challenge,
  onComplete,
  onAbandon
}) => {
  const { submitAnswer } = useGameEngine();
  const [userAnswer, setUserAnswer] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(challenge.timeLimit || 60);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gamePhase, setGamePhase] = useState<'playing' | 'vine_warning' | 'strangled' | 'completed'>('playing');
  const [vineIntensity, setVineIntensity] = useState(0);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [showMolecule, setShowMolecule] = useState(true);
  
  const startTime = useRef(Date.now());
  const timerRef = useRef<NodeJS.Timeout>();
  const vineTimerRef = useRef<NodeJS.Timeout>();

  // Get vine strangulation time from challenge metadata
  const vineStrangulationTime = challenge.metadata?.gameData?.vineStrangulationTime || 30;
  const warningTime = Math.max(10, vineStrangulationTime - 10);

  useEffect(() => {
    // Start the main timer
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        
        // Check if we should start vine warning
        if (prev <= warningTime && gamePhase === 'playing') {
          setGamePhase('vine_warning');
        }
        
        // Check if vines should start strangling
        if (prev <= vineStrangulationTime && gamePhase !== 'strangled') {
          startVineStrangulation();
        }
        
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (vineTimerRef.current) clearInterval(vineTimerRef.current);
    };
  }, [gamePhase, warningTime, vineStrangulationTime]);

  const startVineStrangulation = () => {
    setGamePhase('strangled');
    
    // Vines deal damage over time
    vineTimerRef.current = setInterval(() => {
      setPlayerHealth(prev => {
        const newHealth = prev - 5; // 5 damage per second
        if (newHealth <= 0) {
          handleVineStrangulation();
          return 0;
        }
        return newHealth;
      });
      
      setVineIntensity(prev => Math.min(100, prev + 10));
    }, 1000);
  };

  const handleTimeUp = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (vineTimerRef.current) clearInterval(vineTimerRef.current);
    
    // Auto-submit with current answer
    handleSubmit();
  };

  const handleVineStrangulation = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (vineTimerRef.current) clearInterval(vineTimerRef.current);
    
    setGamePhase('completed');
    
    // Create a failed result due to vine strangulation
    const failedResult: Result = {
      challengeId: challenge.id,
      userId: 'current-user',
      validation: {
        isCorrect: false,
        score: 0,
        feedback: "The vines have strangled you! You took too long to name the molecule.",
        explanation: challenge.content.explanation
      },
      experienceGained: 0,
      goldEarned: 0,
      completedAt: new Date().toISOString(),
      score: 0,
      answer: {
        response: userAnswer,
        timeElapsed: (challenge.timeLimit || 60) - timeRemaining,
        hintsUsed
      }
    };
    
    setTimeout(() => onComplete(failedResult), 2000);
  };

  const handleSubmit = async () => {
    if (isSubmitting || gamePhase === 'completed') return;
    
    setIsSubmitting(true);
    setGamePhase('completed');
    
    // Stop all timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (vineTimerRef.current) clearInterval(vineTimerRef.current);

    const timeElapsed = Math.floor((Date.now() - startTime.current) / 1000);
    
    const answer: Answer = {
      challengeId: challenge.id,
      response: userAnswer.trim(),
      timeElapsed,
      hintsUsed,
      submittedAt: new Date().toISOString()
    };

    try {
      const result = await submitAnswer(challenge.id, answer);
      
      // Add vine survival bonus if completed before strangulation
      if (gamePhase !== 'strangled' && result.validation.isCorrect) {
        const vineBonus = Math.floor((timeRemaining / (challenge.timeLimit || 60)) * 50);
        result.validation.bonusPoints = (result.validation.bonusPoints || 0) + vineBonus;
        result.validation.feedback += ` Vine survival bonus: +${vineBonus} points!`;
      }
      
      setTimeout(() => onComplete(result), 2000);
    } catch (error) {
      console.error('Failed to submit answer:', error);
      setIsSubmitting(false);
      setGamePhase('playing');
    }
  };

  const useHint = () => {
    if (hintsUsed < challenge.content.hints.length) {
      setCurrentHint(challenge.content.hints[hintsUsed]);
      setHintsUsed(prev => prev + 1);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting && gamePhase !== 'completed') {
      handleSubmit();
    }
  };

  const getMoleculeData = () => {
    const molecule = challenge.metadata?.gameData?.molecule;
    return molecule || {
      formula: 'C₄H₁₀O',
      structure: 'CCCO',
      category: 'alcohol',
      functionalGroups: ['alcohol']
    };
  };

  const molecule = getMoleculeData();

  return (
    <div className={`naming-arena ${gamePhase}`}>
      {/* Vine overlay effects */}
      <div className={`vine-overlay ${gamePhase}`} style={{ opacity: vineIntensity / 100 }}>
        <div className="vine vine-1"></div>
        <div className="vine vine-2"></div>
        <div className="vine vine-3"></div>
        <div className="vine vine-4"></div>
      </div>

      {/* Game header */}
      <div className="game-header">
        <div className="game-title">
          <h2>🏹 Naming Arena</h2>
          <p>Name the molecule before the vines strangle you!</p>
        </div>
        
        <div className="game-stats">
          <div className="stat-item">
            <span className="stat-label">Time</span>
            <span className={`stat-value ${timeRemaining <= warningTime ? 'warning' : ''}`}>
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Health</span>
            <div className="health-bar">
              <div 
                className="health-fill" 
                style={{ width: `${playerHealth}%` }}
              ></div>
            </div>
            <span className="stat-value">{playerHealth}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Hints</span>
            <span className="stat-value">{hintsUsed}/{challenge.content.hints.length}</span>
          </div>
        </div>
      </div>

      {/* Challenge content */}
      <div className="challenge-content">
        <div className="molecule-display">
          <h3>Identify this molecule:</h3>
          
          <div className="molecule-info">
            <div className="molecule-formula">
              <strong>Molecular Formula:</strong> {molecule.formula}
            </div>
            
            {showMolecule && (
              <div className="molecule-structure">
                <strong>Structure:</strong>
                <div className="structure-display">
                  {molecule.structure}
                </div>
              </div>
            )}
            
            <div className="molecule-category">
              <strong>Category:</strong> {molecule.category}
            </div>
            
            {molecule.functionalGroups && molecule.functionalGroups.length > 0 && (
              <div className="functional-groups">
                <strong>Functional Groups:</strong> {molecule.functionalGroups.join(', ')}
              </div>
            )}
          </div>

          <button 
            className="toggle-structure"
            onClick={() => setShowMolecule(!showMolecule)}
          >
            {showMolecule ? 'Hide Structure' : 'Show Structure'}
          </button>
        </div>

        <div className="answer-section">
          <label htmlFor="molecule-name">IUPAC Name:</label>
          <input
            id="molecule-name"
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter the IUPAC name..."
            disabled={isSubmitting || gamePhase === 'completed'}
            className={gamePhase === 'vine_warning' ? 'warning' : ''}
          />
          
          <div className="action-buttons">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || gamePhase === 'completed' || !userAnswer.trim()}
              className="submit-button"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Answer'}
            </button>
            
            <button
              onClick={useHint}
              disabled={hintsUsed >= challenge.content.hints.length || gamePhase === 'completed'}
              className="hint-button"
            >
              Use Hint ({challenge.content.hints.length - hintsUsed} left)
            </button>
            
            <button
              onClick={onAbandon}
              disabled={isSubmitting}
              className="abandon-button"
            >
              Abandon Challenge
            </button>
          </div>
        </div>
      </div>

      {/* Hint display */}
      {currentHint && (
        <div className="hint-display">
          <div className="hint-content">
            <strong>Hint:</strong> {currentHint}
          </div>
        </div>
      )}

      {/* Game phase messages */}
      {gamePhase === 'vine_warning' && (
        <div className="phase-message warning">
          <div className="message-content">
            <h3>⚠️ Warning!</h3>
            <p>The vines are starting to grow! Name the molecule quickly!</p>
          </div>
        </div>
      )}

      {gamePhase === 'strangled' && (
        <div className="phase-message danger">
          <div className="message-content">
            <h3>🌿 Vine Strangulation!</h3>
            <p>The vines are strangling you! You're losing health!</p>
          </div>
        </div>
      )}

      {gamePhase === 'completed' && isSubmitting && (
        <div className="phase-message completed">
          <div className="message-content">
            <h3>⏳ Evaluating Answer...</h3>
            <p>Checking your IUPAC naming...</p>
          </div>
        </div>
      )}
    </div>
  );
};