import React, { useState, useEffect, useRef } from 'react';
import { Challenge } from '../../types/game';
import './GraphJoust.css';

interface DataPoint {
  x: number;
  y: number;
  label?: string;
}

interface ChemistryDataset {
  id: string;
  title: string;
  description: string;
  xLabel: string;
  yLabel: string;
  dataPoints: DataPoint[];
  difficulty: number;
  topic: string;
  expectedTrend: 'linear' | 'exponential' | 'logarithmic' | 'inverse' | 'sigmoidal';
  context: string;
}

interface GraphJoustProps {
  challenge: Challenge;
  onComplete: (answer: string) => void;
  onBack: () => void;
}

const GraphJoust: React.FC<GraphJoustProps> = ({ challenge, onComplete, onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [userPoints, setUserPoints] = useState<DataPoint[]>([]);
  const [aiPoints, setAiPoints] = useState<DataPoint[]>([]);
  const [gamePhase, setGamePhase] = useState<'instructions' | 'plotting' | 'results'>('instructions');
  const [timeLeft, setTimeLeft] = useState(120);
  const [userScore, setUserScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [isPlotting, setIsPlotting] = useState(false);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [aiSpeed, setAiSpeed] = useState(1000); // ms between AI points

  // Extract dataset from challenge content
  const dataset: ChemistryDataset = (challenge.content as any).dataset;
  const aiDifficulty = (challenge.content as any).aiDifficulty || 'medium';

  useEffect(() => {
    if (gamePhase === 'plotting' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gamePhase === 'plotting') {
      endGame();
    }
  }, [timeLeft, gamePhase]);

  useEffect(() => {
    // Set AI difficulty
    switch (aiDifficulty) {
      case 'easy':
        setAiSpeed(2000);
        break;
      case 'medium':
        setAiSpeed(1500);
        break;
      case 'hard':
        setAiSpeed(1000);
        break;
    }
  }, [aiDifficulty]);

  useEffect(() => {
    if (gamePhase === 'plotting') {
      startAiPlotting();
    }
  }, [gamePhase]);

  useEffect(() => {
    drawGraph();
  }, [userPoints, aiPoints, gamePhase]);

  const startGame = () => {
    setGamePhase('plotting');
    setTimeLeft(120);
    setUserPoints([]);
    setAiPoints([]);
    setCurrentPointIndex(0);
    setUserScore(0);
    setAiScore(0);
  };

  const startAiPlotting = () => {
    const plotAiPoint = (index: number) => {
      if (index >= dataset.dataPoints.length || gamePhase !== 'plotting') return;

      setTimeout(() => {
        const correctPoint = dataset.dataPoints[index];
        // Add some AI inaccuracy based on difficulty
        const accuracy = aiDifficulty === 'easy' ? 0.7 : aiDifficulty === 'medium' ? 0.85 : 0.95;
        const noise = (1 - accuracy) * 0.2;
        
        const aiPoint: DataPoint = {
          x: correctPoint.x + (Math.random() - 0.5) * noise * Math.abs(correctPoint.x || 1),
          y: correctPoint.y + (Math.random() - 0.5) * noise * Math.abs(correctPoint.y || 1)
        };

        setAiPoints(prev => [...prev, aiPoint]);
        
        // Calculate AI score for this point
        const error = Math.sqrt(
          Math.pow((aiPoint.x - correctPoint.x) / (correctPoint.x || 1), 2) +
          Math.pow((aiPoint.y - correctPoint.y) / (correctPoint.y || 1), 2)
        );
        const pointScore = Math.max(0, 100 - error * 100);
        setAiScore(prev => prev + pointScore);

        plotAiPoint(index + 1);
      }, aiSpeed + Math.random() * 500);
    };

    plotAiPoint(0);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (gamePhase !== 'plotting' || currentPointIndex >= dataset.dataPoints.length) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert canvas coordinates to data coordinates
    const padding = 60;
    const graphWidth = canvas.width - 2 * padding;
    const graphHeight = canvas.height - 2 * padding;

    // Find data ranges
    const xMin = Math.min(...dataset.dataPoints.map(p => p.x));
    const xMax = Math.max(...dataset.dataPoints.map(p => p.x));
    const yMin = Math.min(...dataset.dataPoints.map(p => p.y));
    const yMax = Math.max(...dataset.dataPoints.map(p => p.y));

    const dataX = xMin + (x - padding) / graphWidth * (xMax - xMin);
    const dataY = yMax - (y - padding) / graphHeight * (yMax - yMin);

    const newPoint: DataPoint = { x: dataX, y: dataY };
    setUserPoints(prev => [...prev, newPoint]);

    // Calculate score for this point
    const correctPoint = dataset.dataPoints[currentPointIndex];
    const error = Math.sqrt(
      Math.pow((dataX - correctPoint.x) / (correctPoint.x || 1), 2) +
      Math.pow((dataY - correctPoint.y) / (correctPoint.y || 1), 2)
    );
    const pointScore = Math.max(0, 100 - error * 100);
    setUserScore(prev => prev + pointScore);

    setCurrentPointIndex(prev => prev + 1);

    if (currentPointIndex + 1 >= dataset.dataPoints.length) {
      setTimeout(endGame, 1000);
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
    const xMin = Math.min(...dataset.dataPoints.map(p => p.x));
    const xMax = Math.max(...dataset.dataPoints.map(p => p.x));
    const yMin = Math.min(...dataset.dataPoints.map(p => p.y));
    const yMax = Math.max(...dataset.dataPoints.map(p => p.y));

    // Draw axes
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Draw axis labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(dataset.xLabel, canvas.width / 2, canvas.height - 20);
    
    ctx.save();
    ctx.translate(20, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(dataset.yLabel, 0, 0);
    ctx.restore();

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    
    // Vertical grid lines
    for (let i = 1; i < 10; i++) {
      const x = padding + (i / 10) * graphWidth;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, canvas.height - padding);
      ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let i = 1; i < 10; i++) {
      const y = padding + (i / 10) * graphHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }

    // Function to convert data coordinates to canvas coordinates
    const toCanvasX = (dataX: number) => padding + (dataX - xMin) / (xMax - xMin) * graphWidth;
    const toCanvasY = (dataY: number) => canvas.height - padding - (dataY - yMin) / (yMax - yMin) * graphHeight;

    // Draw correct points (if in results phase)
    if (gamePhase === 'results') {
      ctx.fillStyle = '#4caf50';
      dataset.dataPoints.forEach(point => {
        ctx.beginPath();
        ctx.arc(toCanvasX(point.x), toCanvasY(point.y), 6, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // Draw user points
    ctx.fillStyle = '#2196f3';
    userPoints.forEach((point, index) => {
      ctx.beginPath();
      ctx.arc(toCanvasX(point.x), toCanvasY(point.y), 5, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add point number
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText((index + 1).toString(), toCanvasX(point.x), toCanvasY(point.y) - 10);
      ctx.fillStyle = '#2196f3';
    });

    // Draw AI points
    ctx.fillStyle = '#f44336';
    aiPoints.forEach((point, index) => {
      ctx.beginPath();
      ctx.arc(toCanvasX(point.x), toCanvasY(point.y), 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw next point indicator
    if (gamePhase === 'plotting' && currentPointIndex < dataset.dataPoints.length) {
      const nextPoint = dataset.dataPoints[currentPointIndex];
      ctx.strokeStyle = '#ffeb3b';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(toCanvasX(nextPoint.x), toCanvasY(nextPoint.y), 8, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  const handleComplete = () => {
    onComplete(JSON.stringify(userPoints));
  };

  if (gamePhase === 'instructions') {
    return (
      <div className="graph-joust">
        <div className="game-header">
          <button className="back-button" onClick={onBack}>← Back to Realm</button>
          <h1>📊 Graph Joust</h1>
        </div>

        <div className="instructions-panel">
          <div className="dataset-info">
            <h2>{dataset.title}</h2>
            <p className="dataset-description">{dataset.description}</p>
            <p className="dataset-context">{dataset.context}</p>
            
            <div className="dataset-meta">
              <span className="topic-tag">{dataset.topic}</span>
              <span className="trend-tag">{dataset.expectedTrend} trend</span>
              <span className="difficulty-tag">Difficulty: {dataset.difficulty}/5</span>
            </div>
          </div>

          <div className="game-rules">
            <h3>🎯 How to Play</h3>
            <ul>
              <li>You'll compete against an AI to plot data points accurately</li>
              <li>Click on the graph where you think each data point should be</li>
              <li>The yellow dashed circle shows the correct position</li>
              <li>Points are awarded based on accuracy</li>
              <li>You have 2 minutes to plot all {dataset.dataPoints.length} points</li>
              <li>Beat the AI's score to win!</li>
            </ul>
            
            <div className="ai-info">
              <p><strong>AI Opponent:</strong> {aiDifficulty.charAt(0).toUpperCase() + aiDifficulty.slice(1)} difficulty</p>
            </div>
          </div>

          <button className="start-button" onClick={startGame}>
            Start Graph Joust! ⚔️
          </button>
        </div>
      </div>
    );
  }

  if (gamePhase === 'plotting') {
    return (
      <div className="graph-joust">
        <div className="game-header">
          <button className="back-button" onClick={onBack}>← Back to Realm</button>
          <h1>📊 Graph Joust</h1>
        </div>

        <div className="game-ui">
          <div className="score-panel">
            <div className="player-score">
              <span className="score-label">Your Score</span>
              <span className="score-value">{Math.round(userScore)}</span>
            </div>
            <div className="timer">
              <span className="timer-label">Time Left</span>
              <span className="timer-value">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
            </div>
            <div className="ai-score">
              <span className="score-label">AI Score</span>
              <span className="score-value">{Math.round(aiScore)}</span>
            </div>
          </div>

          <div className="progress-panel">
            <span>Point {currentPointIndex + 1} of {dataset.dataPoints.length}</span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(currentPointIndex / dataset.dataPoints.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="graph-container">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onClick={handleCanvasClick}
            className="graph-canvas"
          />
          <div className="graph-legend">
            <div className="legend-item">
              <div className="legend-color user-color"></div>
              <span>Your Points</span>
            </div>
            <div className="legend-item">
              <div className="legend-color ai-color"></div>
              <span>AI Points</span>
            </div>
            <div className="legend-item">
              <div className="legend-color target-color"></div>
              <span>Target Position</span>
            </div>
          </div>
        </div>

        <div className="instructions-hint">
          <p>Click on the graph to plot point {currentPointIndex + 1}. The yellow dashed circle shows where it should go!</p>
        </div>
      </div>
    );
  }

  if (gamePhase === 'results') {
    const userWon = userScore > aiScore;
    const accuracy = userPoints.length > 0 ? userScore / (userPoints.length * 100) * 100 : 0;

    return (
      <div className="graph-joust">
        <div className="game-header">
          <button className="back-button" onClick={onBack}>← Back to Realm</button>
          <h1>📊 Graph Joust Results</h1>
        </div>

        <div className="results-panel">
          <div className={`result-banner ${userWon ? 'victory' : 'defeat'}`}>
            <h2>{userWon ? '🏆 Victory!' : '💔 Defeat'}</h2>
            <p>{userWon ? 'You outplotted the AI!' : 'The AI was more accurate this time.'}</p>
          </div>

          <div className="final-scores">
            <div className="score-comparison">
              <div className="final-score user">
                <span className="score-label">Your Final Score</span>
                <span className="score-value">{Math.round(userScore)}</span>
                <span className="accuracy">Accuracy: {accuracy.toFixed(1)}%</span>
              </div>
              <div className="vs">VS</div>
              <div className="final-score ai">
                <span className="score-label">AI Final Score</span>
                <span className="score-value">{Math.round(aiScore)}</span>
                <span className="accuracy">AI Difficulty: {aiDifficulty}</span>
              </div>
            </div>
          </div>

          <div className="graph-container">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="graph-canvas"
            />
            <div className="graph-legend">
              <div className="legend-item">
                <div className="legend-color user-color"></div>
                <span>Your Points</span>
              </div>
              <div className="legend-item">
                <div className="legend-color ai-color"></div>
                <span>AI Points</span>
              </div>
              <div className="legend-item">
                <div className="legend-color correct-color"></div>
                <span>Correct Points</span>
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

export default GraphJoust;