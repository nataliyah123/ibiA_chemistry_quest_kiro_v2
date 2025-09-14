import React, { useState, useEffect, useRef } from 'react';
import { Challenge, Answer, Result } from '../../types/game';
import { useGameEngine } from '../../hooks/useGameEngine';
import './IsomerZoo.css';

interface IsomerZooProps {
  challenge: Challenge;
  onComplete: (result: Result) => void;
  onAbandon: () => void;
}

interface FloatingMolecule {
  id: string;
  name: string;
  structure: string;
  type: string;
  category: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  caught: boolean;
  correctCategory?: string;
}

interface CategoryNet {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  molecules: FloatingMolecule[];
}

export const IsomerZoo: React.FC<IsomerZooProps> = ({
  challenge,
  onComplete,
  onAbandon
}) => {
  const { submitAnswer } = useGameEngine();
  const [molecules, setMolecules] = useState<FloatingMolecule[]>([]);
  const [nets, setNets] = useState<CategoryNet[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(challenge.timeLimit || 180);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gamePhase, setGamePhase] = useState<'playing' | 'completed'>('playing');
  const [draggedMolecule, setDraggedMolecule] = useState<FloatingMolecule | null>(null);
  const [score, setScore] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const startTime = useRef(Date.now());
  const timerRef = useRef<NodeJS.Timeout>();

  // Get isomer set data from challenge
  const isomerSet = challenge.metadata?.gameData?.isomerSet || {
    baseFormula: 'C₄H₁₀',
    category: 'structural',
    isomers: [
      { name: 'butane', structure: 'CH₃CH₂CH₂CH₃', type: 'straight-chain', properties: [] },
      { name: '2-methylpropane', structure: 'CH₃CH(CH₃)CH₃', type: 'branched', properties: [] }
    ]
  };

  useEffect(() => {
    initializeGame();
    startAnimation();
    
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
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const initializeGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize floating molecules
    const initialMolecules: FloatingMolecule[] = isomerSet.isomers.map((isomer: any, index: number) => ({
      id: `molecule_${index}`,
      name: isomer.name,
      structure: isomer.structure,
      type: isomer.type,
      category: isomerSet.category,
      x: Math.random() * (canvas.width - 100) + 50,
      y: Math.random() * (canvas.height - 100) + 50,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      caught: false,
      correctCategory: isomerSet.category
    }));

    setMolecules(initialMolecules);

    // Initialize category nets
    const categoryTypes = ['structural', 'stereoisomer', 'enantiomer', 'diastereomer', 'conformational'];
    const netWidth = 120;
    const netHeight = 80;
    const spacing = 20;
    
    const initialNets: CategoryNet[] = categoryTypes.map((category, index) => ({
      id: `net_${category}`,
      name: category.charAt(0).toUpperCase() + category.slice(1),
      x: 20 + index * (netWidth + spacing),
      y: canvas.height - netHeight - 20,
      width: netWidth,
      height: netHeight,
      color: getNetColor(category),
      molecules: []
    }));

    setNets(initialNets);
  };

  const getNetColor = (category: string): string => {
    const colors: Record<string, string> = {
      structural: '#FF6B6B',
      stereoisomer: '#4ECDC4',
      enantiomer: '#45B7D1',
      diastereomer: '#96CEB4',
      conformational: '#FFEAA7'
    };
    return colors[category] || '#DDD';
  };

  const startAnimation = () => {
    const animate = () => {
      updateMolecules();
      drawGame();
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
  };

  const updateMolecules = () => {
    if (gamePhase !== 'playing') return;

    setMolecules(prev => prev.map(molecule => {
      if (molecule.caught) return molecule;

      const canvas = canvasRef.current;
      if (!canvas) return molecule;

      let newX = molecule.x + molecule.vx;
      let newY = molecule.y + molecule.vy;
      let newVx = molecule.vx;
      let newVy = molecule.vy;

      // Bounce off walls
      if (newX <= 20 || newX >= canvas.width - 20) {
        newVx = -newVx;
        newX = Math.max(20, Math.min(canvas.width - 20, newX));
      }
      if (newY <= 20 || newY >= canvas.height - 120) {
        newVy = -newVy;
        newY = Math.max(20, Math.min(canvas.height - 120, newY));
      }

      return {
        ...molecule,
        x: newX,
        y: newY,
        vx: newVx,
        vy: newVy
      };
    }));
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = 'rgba(45, 80, 22, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw category nets
    nets.forEach(net => {
      ctx.fillStyle = net.color + '40'; // Semi-transparent
      ctx.strokeStyle = net.color;
      ctx.lineWidth = 3;
      ctx.fillRect(net.x, net.y, net.width, net.height);
      ctx.strokeRect(net.x, net.y, net.width, net.height);
      
      // Draw net label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(net.name, net.x + net.width / 2, net.y + 20);
      
      // Draw molecules in net
      net.molecules.forEach((molecule, index) => {
        const molX = net.x + 20 + (index % 2) * 80;
        const molY = net.y + 35 + Math.floor(index / 2) * 25;
        drawMolecule(ctx, molecule, molX, molY, true);
      });
    });

    // Draw floating molecules
    molecules.forEach(molecule => {
      if (!molecule.caught) {
        drawMolecule(ctx, molecule, molecule.x, molecule.y, false);
      }
    });

    // Draw game info
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Formula: ${isomerSet.baseFormula}`, 20, 30);
    ctx.fillText(`Category: ${isomerSet.category}`, 20, 50);
    ctx.fillText(`Score: ${score}`, 20, 70);
  };

  const drawMolecule = (ctx: CanvasRenderingContext2D, molecule: FloatingMolecule, x: number, y: number, inNet: boolean) => {
    // Draw molecule circle
    ctx.beginPath();
    ctx.arc(x, y, inNet ? 15 : 25, 0, 2 * Math.PI);
    ctx.fillStyle = inNet ? '#90EE90' : '#FFD700';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw molecule name
    ctx.fillStyle = '#000000';
    ctx.font = inNet ? '10px Arial' : '12px Arial';
    ctx.textAlign = 'center';
    const maxLength = inNet ? 8 : 12;
    const displayName = molecule.name.length > maxLength ? 
      molecule.name.substring(0, maxLength - 2) + '..' : molecule.name;
    ctx.fillText(displayName, x, y + 4);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gamePhase !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on a floating molecule
    const clickedMolecule = molecules.find(molecule => 
      !molecule.caught &&
      Math.sqrt((x - molecule.x) ** 2 + (y - molecule.y) ** 2) <= 25
    );

    if (clickedMolecule) {
      setDraggedMolecule(clickedMolecule);
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggedMolecule || gamePhase !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if dropping on a net
    const targetNet = nets.find(net => 
      x >= net.x && x <= net.x + net.width &&
      y >= net.y && y <= net.y + net.height
    );

    if (targetNet) {
      // Move molecule to net
      setMolecules(prev => prev.map(mol => 
        mol.id === draggedMolecule.id ? { ...mol, caught: true } : mol
      ));

      setNets(prev => prev.map(net => 
        net.id === targetNet.id 
          ? { ...net, molecules: [...net.molecules, draggedMolecule] }
          : net
      ));

      // Update score
      const isCorrect = targetNet.name.toLowerCase() === draggedMolecule.correctCategory;
      if (isCorrect) {
        setScore(prev => prev + 100);
      }
    }

    setDraggedMolecule(null);
  };

  const handleTimeUp = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    handleSubmit();
  };

  const handleSubmit = async () => {
    if (isSubmitting || gamePhase === 'completed') return;
    
    setIsSubmitting(true);
    setGamePhase('completed');
    
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    const timeElapsed = Math.floor((Date.now() - startTime.current) / 1000);
    
    // Collect categorizations
    const categorizations = nets.flatMap(net => 
      net.molecules.map(molecule => ({
        name: molecule.name,
        category: net.name.toLowerCase(),
        type: molecule.type
      }))
    );
    
    const answer: Answer = {
      challengeId: challenge.id,
      response: categorizations,
      timeElapsed,
      hintsUsed,
      submittedAt: new Date().toISOString()
    };

    try {
      const result = await submitAnswer(challenge.id, answer);
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

  const resetGame = () => {
    // Move all molecules back to floating state
    const allMolecules = [
      ...molecules.filter(m => !m.caught),
      ...nets.flatMap(net => net.molecules)
    ];

    setMolecules(allMolecules.map(mol => ({
      ...mol,
      caught: false,
      x: Math.random() * 600 + 50,
      y: Math.random() * 300 + 50,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2
    })));

    setNets(prev => prev.map(net => ({ ...net, molecules: [] })));
    setScore(0);
  };

  return (
    <div className="isomer-zoo">
      {/* Game header */}
      <div className="game-header">
        <div className="game-title">
          <h2>🦋 Isomer Zoo</h2>
          <p>Catch and categorize the floating molecular isomers!</p>
        </div>
        
        <div className="game-stats">
          <div className="stat-item">
            <span className="stat-label">Time</span>
            <span className={`stat-value ${timeRemaining <= 30 ? 'warning' : ''}`}>
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Score</span>
            <span className="stat-value">{score}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Caught</span>
            <span className="stat-value">{molecules.filter(m => m.caught).length}/{molecules.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Hints</span>
            <span className="stat-value">{hintsUsed}/{challenge.content.hints.length}</span>
          </div>
        </div>
      </div>

      {/* Challenge info */}
      <div className="challenge-info">
        <h3>Isomer Set: {isomerSet.baseFormula} ({isomerSet.category} isomers)</h3>
        <p>Drag the floating molecules into the correct category nets below!</p>
      </div>

      {/* Game canvas */}
      <div className="game-canvas-container">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="game-canvas"
          onMouseDown={handleCanvasMouseDown}
          onMouseUp={handleCanvasMouseUp}
        />
        <div className="canvas-instructions">
          Click and drag molecules to the correct category nets. Each correct categorization earns 100 points!
        </div>
      </div>

      {/* Action buttons */}
      <div className="action-buttons">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || gamePhase === 'completed'}
          className="submit-button"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Categorizations'}
        </button>
        
        <button
          onClick={resetGame}
          disabled={gamePhase === 'completed'}
          className="reset-button"
        >
          Reset Zoo
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
            <h3>🏆 Zoo Complete!</h3>
            <p>Final Score: {score} points</p>
            <p>Evaluating your isomer categorization skills...</p>
          </div>
        </div>
      )}
    </div>
  );
};