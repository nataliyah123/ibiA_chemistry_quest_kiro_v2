import React, { useState, useEffect, useCallback } from 'react';
import { Challenge, Answer, ChallengeType } from '../../types/game';
import './StepByStepSimulator.css';

// Lab procedure interfaces (matching server-side)
interface LabProcedure {
  id: string;
  name: string;
  description: string;
  steps: ProcedureStep[];
  difficulty: number;
  category: string;
  timeLimit: number;
  safetyNotes: string[];
}

interface ProcedureStep {
  id: string;
  order: number;
  description: string;
  isRequired: boolean;
  safetyLevel: 'low' | 'medium' | 'high';
  equipment: string[];
  chemicals: string[];
}

interface StepByStepChallenge extends Challenge {
  content: Challenge['content'] & {
    procedure: LabProcedure;
    shuffledSteps: ProcedureStep[];
    correctOrder: number[];
  };
}

interface StepByStepSimulatorProps {
  challenge: StepByStepChallenge;
  onSubmit: (answer: Answer) => void;
  onHintRequest: () => void;
  timeRemaining?: number;
  hintsUsed: number;
}

interface DraggedStep {
  step: ProcedureStep;
  index: number;
}

const StepByStepSimulator: React.FC<StepByStepSimulatorProps> = ({
  challenge,
  onSubmit,
  onHintRequest,
  timeRemaining,
  hintsUsed
}) => {
  const [orderedSteps, setOrderedSteps] = useState<ProcedureStep[]>([]);
  const [availableSteps, setAvailableSteps] = useState<ProcedureStep[]>([]);
  const [draggedStep, setDraggedStep] = useState<DraggedStep | null>(null);
  const [showExplosion, setShowExplosion] = useState(false);
  const [explosionMessage, setExplosionMessage] = useState('');
  const [currentHint, setCurrentHint] = useState<string>('');
  const [showSafetyNotes, setShowSafetyNotes] = useState(false);

  // Initialize the challenge
  useEffect(() => {
    if (challenge?.content?.shuffledSteps) {
      setAvailableSteps([...challenge.content.shuffledSteps]);
      setOrderedSteps([]);
      setCurrentHint('');
      setShowExplosion(false);
    }
  }, [challenge]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, step: ProcedureStep, index: number, isFromOrdered: boolean) => {
    setDraggedStep({ step, index });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', ''); // Required for Firefox
    
    // Add visual feedback
    const target = e.target as HTMLElement;
    target.style.opacity = '0.5';
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
    setDraggedStep(null);
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop on ordered steps area
  const handleDropOnOrdered = useCallback((e: React.DragEvent, dropIndex?: number) => {
    e.preventDefault();
    
    if (!draggedStep) return;

    const { step, index } = draggedStep;
    
    // Remove from available steps if coming from there
    if (availableSteps.includes(step)) {
      setAvailableSteps(prev => prev.filter((_, i) => i !== index));
    } else {
      // Remove from current position in ordered steps
      setOrderedSteps(prev => prev.filter((_, i) => i !== index));
    }

    // Add to ordered steps at the specified position
    setOrderedSteps(prev => {
      const newOrdered = [...prev];
      const insertIndex = dropIndex !== undefined ? dropIndex : newOrdered.length;
      newOrdered.splice(insertIndex, 0, step);
      return newOrdered;
    });
  }, [draggedStep, availableSteps]);

  // Handle drop on available steps area
  const handleDropOnAvailable = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    if (!draggedStep) return;

    const { step, index } = draggedStep;
    
    // Only allow dropping back if it came from ordered steps
    if (orderedSteps.includes(step)) {
      setOrderedSteps(prev => prev.filter((_, i) => i !== index));
      setAvailableSteps(prev => [...prev, step]);
    }
  }, [draggedStep, orderedSteps]);

  // Handle step click (alternative to drag and drop for mobile)
  const handleStepClick = useCallback((step: ProcedureStep, isFromOrdered: boolean) => {
    if (isFromOrdered) {
      // Move from ordered back to available
      setOrderedSteps(prev => prev.filter(s => s.id !== step.id));
      setAvailableSteps(prev => [...prev, step]);
    } else {
      // Move from available to ordered
      setAvailableSteps(prev => prev.filter(s => s.id !== step.id));
      setOrderedSteps(prev => [...prev, step]);
    }
  }, []);

  // Check answer and show explosion if wrong
  const checkAnswer = useCallback(() => {
    if (orderedSteps.length !== challenge.content.correctOrder.length) {
      triggerExplosion('Incomplete procedure! You need to arrange all steps.');
      return false;
    }

    const userOrder = orderedSteps.map(step => step.order);
    const correctOrder = challenge.content.correctOrder;
    
    const isCorrect = userOrder.every((order, index) => order === correctOrder[index]);
    
    if (!isCorrect) {
      triggerExplosion('Wrong sequence! The laboratory procedure would fail with this order.');
      return false;
    }

    return true;
  }, [orderedSteps, challenge.content.correctOrder]);

  // Trigger explosion animation
  const triggerExplosion = useCallback((message: string) => {
    setExplosionMessage(message);
    setShowExplosion(true);
    
    // Reset after animation
    setTimeout(() => {
      setShowExplosion(false);
      setExplosionMessage('');
      // Reset the puzzle
      setAvailableSteps([...challenge.content.shuffledSteps]);
      setOrderedSteps([]);
    }, 3000);
  }, [challenge.content.shuffledSteps]);

  // Handle hint request
  const handleHintClick = useCallback(() => {
    if (hintsUsed < challenge.content.hints.length) {
      setCurrentHint(challenge.content.hints[hintsUsed]);
      onHintRequest();
    }
  }, [hintsUsed, challenge.content.hints, onHintRequest]);

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (checkAnswer()) {
      const userOrder = orderedSteps.map(step => step.order);
      const answer: Answer = {
        response: userOrder.join(','),
        timeElapsed: challenge.timeLimit ? (challenge.timeLimit - (timeRemaining || 0)) : 0,
        hintsUsed
      };
      onSubmit(answer);
    }
  }, [checkAnswer, orderedSteps, challenge.timeLimit, timeRemaining, hintsUsed, onSubmit]);

  // Get safety level color
  const getSafetyLevelColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'high': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!challenge?.content?.procedure) {
    return <div className="step-simulator-loading">Loading procedure...</div>;
  }

  return (
    <div className="step-by-step-simulator">
      {/* Explosion Animation Overlay */}
      {showExplosion && (
        <div className="explosion-overlay">
          <div className="explosion-animation">
            <div className="explosion-blast">💥</div>
            <div className="explosion-message">{explosionMessage}</div>
            <div className="explosion-shake">
              <div className="lab-equipment">🧪⚗️🔬</div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="simulator-header">
        <h2>{challenge.content.procedure.name}</h2>
        <p className="procedure-description">{challenge.content.procedure.description}</p>
        
        <div className="challenge-info">
          <div className="time-remaining">
            ⏱️ {timeRemaining ? formatTime(timeRemaining) : 'No limit'}
          </div>
          <div className="difficulty-level">
            Difficulty: {'⭐'.repeat(challenge.difficulty)}
          </div>
          <div className="category-badge">
            {challenge.content.procedure.category.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Safety Notes Toggle */}
      <div className="safety-section">
        <button 
          className="safety-toggle"
          onClick={() => setShowSafetyNotes(!showSafetyNotes)}
        >
          ⚠️ Safety Notes {showSafetyNotes ? '▼' : '▶'}
        </button>
        
        {showSafetyNotes && (
          <div className="safety-notes">
            {challenge.content.procedure.safetyNotes.map((note, index) => (
              <div key={index} className="safety-note">
                <span className="safety-icon">⚠️</span>
                {note}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Game Area */}
      <div className="simulator-content">
        {/* Instructions */}
        <div className="instructions">
          <h3>Instructions</h3>
          <p>{challenge.content.question}</p>
          <p className="drag-instruction">
            Drag and drop the procedure steps into the correct order, or click to move them.
          </p>
        </div>

        {/* Available Steps */}
        <div className="available-steps-section">
          <h4>Available Steps</h4>
          <div 
            className="available-steps"
            onDragOver={handleDragOver}
            onDrop={handleDropOnAvailable}
          >
            {availableSteps.map((step, index) => (
              <div
                key={step.id}
                className="procedure-step available"
                draggable
                onDragStart={(e) => handleDragStart(e, step, index, false)}
                onDragEnd={handleDragEnd}
                onClick={() => handleStepClick(step, false)}
              >
                <div className="step-content">
                  <div className="step-header">
                    <span 
                      className="safety-indicator"
                      style={{ backgroundColor: getSafetyLevelColor(step.safetyLevel) }}
                    />
                    <span className="step-number">Step {step.order}</span>
                  </div>
                  <div className="step-description">{step.description}</div>
                  
                  {(step.equipment.length > 0 || step.chemicals.length > 0) && (
                    <div className="step-requirements">
                      {step.equipment.length > 0 && (
                        <div className="equipment">
                          🔬 {step.equipment.join(', ')}
                        </div>
                      )}
                      {step.chemicals.length > 0 && (
                        <div className="chemicals">
                          🧪 {step.chemicals.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ordered Steps */}
        <div className="ordered-steps-section">
          <h4>Procedure Order</h4>
          <div 
            className="ordered-steps"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnOrdered(e)}
          >
            {orderedSteps.length === 0 ? (
              <div className="empty-order-area">
                Drop steps here in the correct order
              </div>
            ) : (
              orderedSteps.map((step, index) => (
                <div key={step.id} className="step-slot">
                  <div
                    className="procedure-step ordered"
                    draggable
                    onDragStart={(e) => handleDragStart(e, step, index, true)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleStepClick(step, true)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropOnOrdered(e, index)}
                  >
                    <div className="step-content">
                      <div className="step-header">
                        <span 
                          className="safety-indicator"
                          style={{ backgroundColor: getSafetyLevelColor(step.safetyLevel) }}
                        />
                        <span className="step-position">{index + 1}</span>
                        <span className="step-number">Step {step.order}</span>
                      </div>
                      <div className="step-description">{step.description}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Hint Section */}
      {currentHint && (
        <div className="hint-section">
          <div className="hint-content">
            💡 <strong>Hint:</strong> {currentHint}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="simulator-controls">
        <button 
          className="hint-button"
          onClick={handleHintClick}
          disabled={hintsUsed >= challenge.content.hints.length}
        >
          💡 Hint ({hintsUsed}/{challenge.content.hints.length})
        </button>
        
        <button 
          className="submit-button"
          onClick={handleSubmit}
          disabled={orderedSteps.length === 0}
        >
          Complete Procedure
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="progress-indicator">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ 
              width: `${(orderedSteps.length / challenge.content.correctOrder.length) * 100}%` 
            }}
          />
        </div>
        <span className="progress-text">
          {orderedSteps.length} / {challenge.content.correctOrder.length} steps arranged
        </span>
      </div>
    </div>
  );
};

export default StepByStepSimulator;