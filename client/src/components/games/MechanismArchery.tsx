import React, { useState, useEffect, useRef } from 'react';
import { Challenge, Answer, Result } from '../../types/game';
import { useGameEngine } from '../../hooks/useGameEngine';
import './MechanismArchery.css';

interface MechanismArcheryProps {
  challenge: Challenge;
  onComplete: (result: Result) => void;
  onAbandon: () => void;
}

interface ElectronArrow {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  type: 'single' | 'double' | 'lone_pair';
}

interface MechanismStep {
  stepNumber: number;
  description: string;
  electronMovement: any[];
  intermediates?: string[];
}

export const MechanismArchery: React.FC<MechanismArcheryProps> = ({
  challenge,
  onComplete,
  onAbandon
}) => {
  const { submitAnswer } = useGameEngine();
  const [currentStep, setCurrentStep] = useState(0);
  const [userArrows, setUserArrows] = useState<ElectronArrow[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(challenge.timeLimit || 120);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gamePhase, setGamePhase] = useState<'playing' | 'completed'>('playing');
  const [arrowMode, setArrowMode] = useState<'single' | 'double' | 'lone_pair'>('single');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [accuracy, setAccuracy] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startTime = useRef(Date.now());
  const timerRef = useRef<NodeJS.Timeout>();

  // Get mechanism data from challenge
  const mechanism = challenge.metadata?.gameData?.mechanism || {
    name: 'Sample Mechanism',
    type: 'SN2',
    reactants: ['CH₃Br', 'OH⁻'],
    products: ['CH₃OH', 'Br⁻'],
    steps: [
      {
        stepNumber: 1,
        description: 'Hydroxide attacks carbon from backside',
        electronMovement: [
          {
            from: { atom: 'O', position: [100, 200] },
            to: { atom: 'C', position: [200, 200] },
            type: 'lone_pair'
          }
        ]
      }
    ]
  };

  const steps: MechanismStep[] = mechanism.steps || [];
  const currentStepData = steps[currentStep];

  useEffect(() => {
    // Start the timer
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    // Initialize canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawMechanism(ctx);
      }
    }
  }, [currentStep, userArrows]);

  const handleTimeUp = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    handleSubmit();
  };

  const drawMechanism = (ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Set up drawing styles
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#90EE90';
    ctx.lineWidth = 2;
    ctx.font = '16px Arial';

    // Draw reaction equation
    ctx.fillText(`${mechanism.reactants.join(' + ')} → ${mechanism.products.join(' + ')}`, 20, 30);
    
    // Draw current step description
    if (currentStepData) {
      ctx.fillText(`Step ${currentStepData.stepNumber}: ${currentStepData.description}`, 20, 60);
    }

    // Draw molecular structure (simplified representation)
    drawMolecularStructure(ctx);
    
    // Draw user arrows
    userArrows.forEach(arrow => {
      drawArrow(ctx, arrow);
    });

    // Draw target positions (for debugging - remove in production)
    if (currentStepData?.electronMovement) {
      ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
      currentStepData.electronMovement.forEach((movement: any) => {
        if (movement.from?.position) {
          ctx.beginPath();
          ctx.arc(movement.from.position[0], movement.from.position[1] + 80, 15, 0, 2 * Math.PI);
          ctx.fill();
        }
        if (movement.to?.position) {
          ctx.beginPath();
          ctx.arc(movement.to.position[0], movement.to.position[1] + 80, 15, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
    }
  };

  const drawMolecularStructure = (ctx: CanvasRenderingContext2D) => {
    // Simplified molecular structure drawing
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#90EE90';
    
    // Draw atoms as circles with labels
    const atoms = [
      { label: 'C', x: 200, y: 200 },
      { label: 'Br', x: 300, y: 200 },
      { label: 'O', x: 100, y: 200 },
      { label: 'H', x: 80, y: 220 }
    ];

    atoms.forEach(atom => {
      // Draw atom circle
      ctx.beginPath();
      ctx.arc(atom.x, atom.y + 80, 20, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Draw atom label
      ctx.fillText(atom.label, atom.x - 5, atom.y + 85);
    });

    // Draw bonds
    ctx.beginPath();
    ctx.moveTo(220, 200 + 80);
    ctx.lineTo(280, 200 + 80);
    ctx.stroke();
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, arrow: ElectronArrow) => {
    ctx.strokeStyle = arrow.type === 'lone_pair' ? '#FFD700' : '#FF6B6B';
    ctx.lineWidth = arrow.type === 'double' ? 4 : 2;
    
    // Draw arrow line
    ctx.beginPath();
    ctx.moveTo(arrow.from.x, arrow.from.y);
    ctx.lineTo(arrow.to.x, arrow.to.y);
    ctx.stroke();
    
    // Draw arrowhead
    const angle = Math.atan2(arrow.to.y - arrow.from.y, arrow.to.x - arrow.from.x);
    const headLength = 15;
    
    ctx.beginPath();
    ctx.moveTo(arrow.to.x, arrow.to.y);
    ctx.lineTo(
      arrow.to.x - headLength * Math.cos(angle - Math.PI / 6),
      arrow.to.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(arrow.to.x, arrow.to.y);
    ctx.lineTo(
      arrow.to.x - headLength * Math.cos(angle + Math.PI / 6),
      arrow.to.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gamePhase !== 'playing') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setDrawStart({ x, y });
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawStart || gamePhase !== 'playing') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Create new arrow
    const newArrow: ElectronArrow = {
      id: `arrow_${Date.now()}`,
      from: drawStart,
      to: { x, y },
      type: arrowMode
    };
    
    setUserArrows(prev => [...prev, newArrow]);
    setIsDrawing(false);
    setDrawStart(null);
  };

  const clearArrows = () => {
    setUserArrows([]);
  };

  const undoLastArrow = () => {
    setUserArrows(prev => prev.slice(0, -1));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setUserArrows([]); // Clear arrows for next step
    } else {
      handleSubmit();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setUserArrows([]);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || gamePhase === 'completed') return;
    
    setIsSubmitting(true);
    setGamePhase('completed');
    
    if (timerRef.current) clearInterval(timerRef.current);

    const timeElapsed = Math.floor((Date.now() - startTime.current) / 1000);
    
    // Collect all arrows from all steps (for now, just current step)
    const allArrows = userArrows.map(arrow => ({
      from: { position: [arrow.from.x, arrow.from.y] },
      to: { position: [arrow.to.x, arrow.to.y] },
      type: arrow.type
    }));
    
    const answer: Answer = {
      challengeId: challenge.id,
      response: allArrows,
      timeElapsed,
      hintsUsed,
      submittedAt: new Date().toISOString()
    };

    try {
      const result = await submitAnswer(challenge.id, answer);
      
      // Calculate and display accuracy
      const calculatedAccuracy = result.validation.partialCredit || 0;
      setAccuracy(calculatedAccuracy);
      
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

  return (
    <div className="mechanism-archery">
      {/* Game header */}
      <div className="game-header">
        <div className="game-title">
          <h2>🏹 Mechanism Archery</h2>
          <p>Shoot arrows to show electron movement!</p>
        </div>
        
        <div className="game-stats">
          <div className="stat-item">
            <span className="stat-label">Time</span>
            <span className={`stat-value ${timeRemaining <= 30 ? 'warning' : ''}`}>
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Step</span>
            <span className="stat-value">{currentStep + 1}/{steps.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Arrows</span>
            <span className="stat-value">{userArrows.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Hints</span>
            <span className="stat-value">{hintsUsed}/{challenge.content.hints.length}</span>
          </div>
        </div>
      </div>

      {/* Mechanism info */}
      <div className="mechanism-info">
        <h3>{mechanism.name} ({mechanism.type})</h3>
        <p className="reaction-equation">
          {mechanism.reactants.join(' + ')} → {mechanism.products.join(' + ')}
        </p>
        {currentStepData && (
          <p className="step-description">
            <strong>Step {currentStepData.stepNumber}:</strong> {currentStepData.description}
          </p>
        )}
      </div>

      {/* Arrow controls */}
      <div className="arrow-controls">
        <div className="arrow-type-selector">
          <label>Arrow Type:</label>
          <button 
            className={arrowMode === 'single' ? 'active' : ''}
            onClick={() => setArrowMode('single')}
          >
            Single Bond
          </button>
          <button 
            className={arrowMode === 'double' ? 'active' : ''}
            onClick={() => setArrowMode('double')}
          >
            Double Bond
          </button>
          <button 
            className={arrowMode === 'lone_pair' ? 'active' : ''}
            onClick={() => setArrowMode('lone_pair')}
          >
            Lone Pair
          </button>
        </div>
        
        <div className="arrow-actions">
          <button onClick={undoLastArrow} disabled={userArrows.length === 0}>
            Undo Arrow
          </button>
          <button onClick={clearArrows} disabled={userArrows.length === 0}>
            Clear All
          </button>
        </div>
      </div>

      {/* Canvas for drawing mechanism */}
      <div className="mechanism-canvas-container">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="mechanism-canvas"
          onMouseDown={handleCanvasMouseDown}
          onMouseUp={handleCanvasMouseUp}
        />
        <div className="canvas-instructions">
          Click and drag to draw electron movement arrows. Use different arrow types for different electron movements.
        </div>
      </div>

      {/* Step navigation */}
      <div className="step-navigation">
        <button 
          onClick={previousStep} 
          disabled={currentStep === 0}
          className="nav-button"
        >
          ← Previous Step
        </button>
        
        <span className="step-indicator">
          Step {currentStep + 1} of {steps.length}
        </span>
        
        <button 
          onClick={nextStep}
          disabled={userArrows.length === 0}
          className="nav-button"
        >
          {currentStep === steps.length - 1 ? 'Submit Mechanism' : 'Next Step →'}
        </button>
      </div>

      {/* Action buttons */}
      <div className="action-buttons">
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

      {/* Hint display */}
      {currentHint && (
        <div className="hint-display">
          <div className="hint-content">
            <strong>Hint:</strong> {currentHint}
          </div>
        </div>
      )}

      {/* Completion message */}
      {gamePhase === 'completed' && (
        <div className="completion-message">
          <div className="message-content">
            <h3>🎯 Mechanism Complete!</h3>
            {accuracy > 0 && (
              <p>Accuracy: {Math.round(accuracy * 100)}%</p>
            )}
            <p>Evaluating your electron archery skills...</p>
          </div>
        </div>
      )}
    </div>
  );
};