import React, { useState, useEffect, useRef } from 'react';
import { Challenge } from '../../types/game';
import './ErrorHunter.css';

interface DataPoint {
  x: number;
  y: number;
  label?: string;
}

interface DataError {
  id: string;
  type: 'calculation' | 'outlier' | 'transcription' | 'unit' | 'systematic';
  pointIndex: number;
  description: string;
  severity: 'minor' | 'major' | 'critical';
  hint: string;
}

interface DatasetWithErrors {
  id: string;
  title: string;
  description: string;
  originalData: DataPoint[];
  corruptedData: DataPoint[];
  errors: DataError[];
  difficulty: number;
  topic: string;
  context: string;
}

interface ErrorHunterProps {
  challenge: Challenge;
  onComplete: (answer: string) => void;
  onBack: () => void;
}

interface IdentifiedError {
  pointIndex: number;
  type: string;
  confidence: number;
}

const ErrorHunter: React.FC<ErrorHunterProps> = ({ challenge, onComplete, onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gamePhase, setGamePhase] = useState<'instructions' | 'hunting' | 'results'>('instructions');
  const [identifiedErrors, setIdentifiedErrors] = useState<IdentifiedError[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(180);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState<string | null>(null);

  // Extract dataset from challenge content
  const dataset: DatasetWithErrors = (challenge.content as any).dataset;
  const maxHints = (challenge.content as any).hintsAvailable || 3;

  const errorTypes = [
    { id: 'calculation', name: 'Calculation Error', color: '#f44336', icon: '🧮' },
    { id: 'outlier', name: 'Outlier', color: '#ff9800', icon: '📊' },
    { id: 'transcription', name: 'Transcription Error', color: '#9c27b0', icon: '✏️' },
    { id: 'unit', name: 'Unit Error', color: '#2196f3', icon: '📏' },
    { id: 'systematic', name: 'Systematic Error', color: '#4caf50', icon: '⚙️' }
  ];

  useEffect(() => {
    if (gamePhase === 'hunting' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gamePhase === 'hunting') {
      endGame();
    }
  }, [timeLeft, gamePhase]);

  useEffect(() => {
    drawGraph();
  }, [identifiedErrors, selectedPoint, gamePhase]);

  const startGame = () => {
    setGamePhase('hunting');
    setTimeLeft(180);
    setIdentifiedErrors([]);
    setScore(0);
    setHintsUsed(0);
    setShowHint(null);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (gamePhase !== 'hunting') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find which point was clicked
    const clickedPointIndex = findNearestPoint(x, y);
    if (clickedPointIndex !== -1) {
      setSelectedPoint(clickedPointIndex);
      setShowErrorDialog(true);
    }
  };

  const findNearestPoint = (canvasX: number, canvasY: number): number => {
    const canvas = canvasRef.current;
    if (!canvas) return -1;

    const padding = 60;
    const graphWidth = canvas.width - 2 * padding;
    const graphHeight = canvas.height - 2 * padding;

    // Find data ranges
    const xMin = Math.min(...dataset.corruptedData.map(p => p.x));
    const xMax = Math.max(...dataset.corruptedData.map(p => p.x));
    const yMin = Math.min(...dataset.corruptedData.map(p => p.y));
    const yMax = Math.max(...dataset.corruptedData.map(p => p.y));

    const toCanvasX = (dataX: number) => padding + (dataX - xMin) / (xMax - xMin) * graphWidth;
    const toCanvasY = (dataY: number) => canvas.height - padding - (dataY - yMin) / (yMax - yMin) * graphHeight;

    let nearestIndex = -1;
    let minDistance = Infinity;

    dataset.corruptedData.forEach((point, index) => {
      const pointCanvasX = toCanvasX(point.x);
      const pointCanvasY = toCanvasY(point.y);
      const distance = Math.sqrt(
        Math.pow(canvasX - pointCanvasX, 2) + Math.pow(canvasY - pointCanvasY, 2)
      );

      if (distance < 20 && distance < minDistance) { // 20px click tolerance
        minDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  };

  const handleErrorIdentification = (errorType: string) => {
    if (selectedPoint === null) return;

    // Check if this point already has an error identified
    const existingError = identifiedErrors.find(e => e.pointIndex === selectedPoint);
    if (existingError) {
      // Update existing error
      setIdentifiedErrors(prev => 
        prev.map(e => 
          e.pointIndex === selectedPoint 
            ? { ...e, type: errorType, confidence: Math.min(100, e.confidence + 10) }
            : e
        )
      );
    } else {
      // Add new error
      setIdentifiedErrors(prev => [
        ...prev,
        { pointIndex: selectedPoint, type: errorType, confidence: 80 }
      ]);
    }

    // Calculate score
    const correctError = dataset.errors.find(e => e.pointIndex === selectedPoint);
    if (correctError && correctError.type === errorType) {
      const points = correctError.severity === 'critical' ? 50 : 
                   correctError.severity === 'major' ? 30 : 20;
      setScore(prev => prev + points);
    }

    setShowErrorDialog(false);
    setSelectedPoint(null);
  };

  const useHint = () => {
    if (hintsUsed >= maxHints) return;

    const availableErrors = dataset.errors.filter(error => 
      !identifiedErrors.some(identified => 
        identified.pointIndex === error.pointIndex && identified.type === error.type
      )
    );

    if (availableErrors.length > 0) {
      const randomError = availableErrors[Math.floor(Math.random() * availableErrors.length)];
      setShowHint(randomError.hint);
      setHintsUsed(prev => prev + 1);
      
      setTimeout(() => setShowHint(null), 5000);
    }
  };

  const endGame = () => {
    setGamePhase('results');
  };

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set up graph dimensions
    const padding = 60;
    const graphWidth = canvas.width - 2 * padding;
    const graphHeight = canvas.height - 2 * padding;

    // Find data ranges
    const xMin = Math.min(...dataset.corruptedData.map(p => p.x));
    const xMax = Math.max(...dataset.corruptedData.map(p => p.x));
    const yMin = Math.min(...dataset.corruptedData.map(p => p.y));
    const yMax = Math.max(...dataset.corruptedData.map(p => p.y));

    // Draw axes
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Draw grid lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    
    for (let i = 1; i < 10; i++) {
      const x = padding + (i / 10) * graphWidth;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, canvas.height - padding);
      ctx.stroke();
      
      const y = padding + (i / 10) * graphHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }

    // Function to convert data coordinates to canvas coordinates
    const toCanvasX = (dataX: number) => padding + (dataX - xMin) / (xMax - xMin) * graphWidth;
    const toCanvasY = (dataY: number) => canvas.height - padding - (dataY - yMin) / (yMax - yMin) * graphHeight;

    // Draw data points
    dataset.corruptedData.forEach((point, index) => {
      const canvasX = toCanvasX(point.x);
      const canvasY = toCanvasY(point.y);

      // Check if this point has been identified as having an error
      const identifiedError = identifiedErrors.find(e => e.pointIndex === index);
      const actualError = dataset.errors.find(e => e.pointIndex === index);

      // Determine point color and style
      let pointColor = '#2196f3'; // Default blue
      let borderColor = '#1976d2';
      let radius = 6;

      if (identifiedError) {
        const errorType = errorTypes.find(t => t.id === identifiedError.type);
        pointColor = errorType?.color || '#f44336';
        borderColor = pointColor;
        radius = 8;
      }

      if (index === selectedPoint) {
        borderColor = '#ffeb3b';
        radius = 10;
      }

      // Draw point
      ctx.fillStyle = pointColor;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Draw point number
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText((index + 1).toString(), canvasX, canvasY + 4);

      // Show correct errors in results phase
      if (gamePhase === 'results' && actualError) {
        const errorType = errorTypes.find(t => t.id === actualError.type);
        if (errorType) {
          ctx.fillStyle = errorType.color;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(canvasX, canvasY - 20, 8, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
          
          // Error type icon
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(errorType.icon, canvasX, canvasY - 16);
        }
      }
    });

    // Draw axis labels
    ctx.fillStyle = '#333333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('X-axis', canvas.width / 2, canvas.height - 20);
    
    ctx.save();
    ctx.translate(20, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Y-axis', 0, 0);
    ctx.restore();
  };

  const calculateResults = () => {
    let correctlyIdentified = 0;
    let falsePositives = 0;
    let totalCorrectErrors = dataset.errors.length;

    identifiedErrors.forEach(identified => {
      const matchingError = dataset.errors.find(error => 
        error.pointIndex === identified.pointIndex && error.type === identified.type
      );
      
      if (matchingError) {
        correctlyIdentified++;
      } else {
        falsePositives++;
      }
    });

    const accuracy = totalCorrectErrors > 0 ? (correctlyIdentified / totalCorrectErrors) * 100 : 0;
    const precision = identifiedErrors.length > 0 ? (correctlyIdentified / identifiedErrors.length) * 100 : 0;

    return {
      correctlyIdentified,
      falsePositives,
      totalCorrectErrors,
      accuracy,
      precision,
      missed: totalCorrectErrors - correctlyIdentified
    };
  };

  const handleComplete = () => {
    const results = calculateResults();
    const answer = {
      identifiedErrors: identifiedErrors.map(e => ({ 
        id: `error-${e.pointIndex}-${e.type}`, 
        type: e.type, 
        pointIndex: e.pointIndex 
      })),
      score: results.accuracy,
      hintsUsed
    };
    onComplete(JSON.stringify(answer));
  };

  if (gamePhase === 'instructions') {
    return (
      <div className="error-hunter">
        <div className="game-header">
          <button className="back-button" onClick={onBack}>← Back to Realm</button>
          <h1>🔍 Error Hunter</h1>
        </div>

        <div className="instructions-panel">
          <div className="dataset-info">
            <h2>{dataset.title}</h2>
            <p className="dataset-description">{dataset.description}</p>
            <p className="dataset-context">{dataset.context}</p>
            
            <div className="dataset-meta">
              <span className="topic-tag">{dataset.topic}</span>
              <span className="difficulty-tag">Difficulty: {dataset.difficulty}/5</span>
              <span className="errors-tag">{dataset.errors.length} errors hidden</span>
            </div>
          </div>

          <div className="error-types-guide">
            <h3>🎯 Error Types to Look For</h3>
            <div className="error-types-grid">
              {errorTypes.map(type => (
                <div key={type.id} className="error-type-card" style={{ borderColor: type.color }}>
                  <span className="error-icon">{type.icon}</span>
                  <span className="error-name">{type.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="game-rules">
            <h3>📋 How to Hunt Errors</h3>
            <ul>
              <li>Click on suspicious data points to investigate them</li>
              <li>Identify the type of error from the dialog</li>
              <li>Use hints if you're stuck (limited to {maxHints})</li>
              <li>Find all {dataset.errors.length} errors before time runs out</li>
              <li>Points awarded based on error severity and accuracy</li>
            </ul>
          </div>

          <button className="start-button" onClick={startGame}>
            Start Error Hunt! 🔍
          </button>
        </div>
      </div>
    );
  }

  if (gamePhase === 'hunting') {
    return (
      <div className="error-hunter">
        <div className="game-header">
          <button className="back-button" onClick={onBack}>← Back to Realm</button>
          <h1>🔍 Error Hunter</h1>
        </div>

        <div className="game-ui">
          <div className="status-panel">
            <div className="score-display">
              <span className="label">Score</span>
              <span className="value">{score}</span>
            </div>
            <div className="timer-display">
              <span className="label">Time Left</span>
              <span className="value">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
            </div>
            <div className="progress-display">
              <span className="label">Errors Found</span>
              <span className="value">{identifiedErrors.length}/{dataset.errors.length}</span>
            </div>
          </div>

          <div className="hints-panel">
            <button 
              className="hint-button" 
              onClick={useHint}
              disabled={hintsUsed >= maxHints}
            >
              💡 Use Hint ({hintsUsed}/{maxHints})
            </button>
            {showHint && (
              <div className="hint-display">
                <p>{showHint}</p>
              </div>
            )}
          </div>
        </div>

        <div className="graph-container">
          <h3>{dataset.title}</h3>
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onClick={handleCanvasClick}
            className="graph-canvas"
          />
          
          <div className="error-legend">
            <h4>Error Types:</h4>
            <div className="legend-items">
              {errorTypes.map(type => (
                <div key={type.id} className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: type.color }}></div>
                  <span>{type.icon} {type.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="instructions-hint">
          <p>Click on data points that look suspicious. Look for outliers, calculation mistakes, and inconsistent patterns!</p>
        </div>

        {/* Error Identification Dialog */}
        {showErrorDialog && selectedPoint !== null && (
          <div className="error-dialog-overlay">
            <div className="error-dialog">
              <h3>Investigate Point {selectedPoint + 1}</h3>
              <p>What type of error do you think this is?</p>
              
              <div className="error-options">
                {errorTypes.map(type => (
                  <button
                    key={type.id}
                    className="error-option"
                    style={{ borderColor: type.color }}
                    onClick={() => handleErrorIdentification(type.id)}
                  >
                    <span className="error-icon">{type.icon}</span>
                    <span className="error-name">{type.name}</span>
                  </button>
                ))}
              </div>
              
              <div className="dialog-actions">
                <button 
                  className="cancel-button" 
                  onClick={() => {
                    setShowErrorDialog(false);
                    setSelectedPoint(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (gamePhase === 'results') {
    const results = calculateResults();

    return (
      <div className="error-hunter">
        <div className="game-header">
          <button className="back-button" onClick={onBack}>← Back to Realm</button>
          <h1>🔍 Error Hunter Results</h1>
        </div>

        <div className="results-panel">
          <div className={`result-banner ${results.accuracy >= 80 ? 'success' : 'partial'}`}>
            <h2>{results.accuracy >= 80 ? '🏆 Excellent Detective Work!' : '🔍 Good Investigation!'}</h2>
            <p>You found {results.correctlyIdentified} out of {results.totalCorrectErrors} errors</p>
          </div>

          <div className="results-stats">
            <div className="stat-card">
              <span className="stat-value">{results.accuracy.toFixed(1)}%</span>
              <span className="stat-label">Accuracy</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{results.precision.toFixed(1)}%</span>
              <span className="stat-label">Precision</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{score}</span>
              <span className="stat-label">Final Score</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{hintsUsed}</span>
              <span className="stat-label">Hints Used</span>
            </div>
          </div>

          <div className="graph-container">
            <h3>Error Analysis</h3>
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="graph-canvas"
            />
            
            <div className="results-legend">
              <div className="legend-section">
                <h4>Your Identifications:</h4>
                {identifiedErrors.map((error, index) => {
                  const errorType = errorTypes.find(t => t.id === error.type);
                  const isCorrect = dataset.errors.some(e => 
                    e.pointIndex === error.pointIndex && e.type === error.type
                  );
                  return (
                    <div key={index} className={`identification-item ${isCorrect ? 'correct' : 'incorrect'}`}>
                      <span style={{ color: errorType?.color }}>
                        {errorType?.icon} Point {error.pointIndex + 1}: {errorType?.name}
                      </span>
                      <span className="result-indicator">
                        {isCorrect ? '✅' : '❌'}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              <div className="legend-section">
                <h4>Missed Errors:</h4>
                {dataset.errors.filter(error => 
                  !identifiedErrors.some(identified => 
                    identified.pointIndex === error.pointIndex && identified.type === error.type
                  )
                ).map((error, index) => {
                  const errorType = errorTypes.find(t => t.id === error.type);
                  return (
                    <div key={index} className="missed-error-item">
                      <span style={{ color: errorType?.color }}>
                        {errorType?.icon} Point {error.pointIndex + 1}: {error.description}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="results-actions">
            <button className="complete-button" onClick={handleComplete}>
              Complete Challenge 🎯
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ErrorHunter;