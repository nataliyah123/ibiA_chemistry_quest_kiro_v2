import React, { useState, useEffect, useCallback } from 'react';
import { Challenge, Answer, ChallengeType } from '../../types/game';
import './DistillationDragon.css';

// Distillation interfaces
interface DistillationSetup {
  id: string;
  name: string;
  description: string;
  components: DistillationComponent[];
  optimalConditions: OptimalConditions;
  dragonHealth: number;
  maxHealth: number;
}

interface DistillationComponent {
  id: string;
  name: string;
  boilingPoint: number;
  concentration: number;
  color: string;
}

interface OptimalConditions {
  temperature: number;
  pressure: number;
  refluxRatio: number;
  flowRate: number;
}

interface DragonBossChallenge extends Challenge {
  content: Challenge['content'] & {
    distillationSetup: DistillationSetup;
    targetComponents: string[];
    timeLimit: number;
  };
}

interface DistillationDragonProps {
  challenge: DragonBossChallenge;
  onSubmit: (answer: Answer) => void;
  onHintRequest: () => void;
  timeRemaining?: number;
  hintsUsed: number;
}

const DistillationDragon: React.FC<DistillationDragonProps> = ({
  challenge,
  onSubmit,
  onHintRequest,
  timeRemaining,
  hintsUsed
}) => {
  const [temperature, setTemperature] = useState(25);
  const [pressure, setPressure] = useState(1.0);
  const [refluxRatio, setRefluxRatio] = useState(1.0);
  const [flowRate, setFlowRate] = useState(50);
  const [dragonHealth, setDragonHealth] = useState(100);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [isDistilling, setIsDistilling] = useState(false);
  const [collectedFractions, setCollectedFractions] = useState<DistillationComponent[]>([]);
  const [currentFraction, setCurrentFraction] = useState<DistillationComponent | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [gamePhase, setGamePhase] = useState<'setup' | 'battle' | 'victory' | 'defeat'>('setup');
  const [accuracy, setAccuracy] = useState(100);
  const [currentHint, setCurrentHint] = useState<string>('');

  // Initialize the boss battle
  useEffect(() => {
    if (challenge?.content?.distillationSetup) {
      const setup = challenge.content.distillationSetup;
      setDragonHealth(setup.dragonHealth);
      setPlayerHealth(100);
      setGamePhase('setup');
      setBattleLog([
        `🐉 The Distillation Dragon appears!`,
        `Dragon Health: ${setup.dragonHealth}`,
        `Optimize the fractional distillation to defeat the dragon!`
      ]);
    }
  }, [challenge]);

  // Calculate optimization accuracy
  const calculateAccuracy = useCallback(() => {
    if (!challenge?.content?.distillationSetup) return 0;

    const optimal = challenge.content.distillationSetup.optimalConditions;
    const tempAccuracy = 100 - Math.abs(temperature - optimal.temperature) * 2;
    const pressureAccuracy = 100 - Math.abs(pressure - optimal.pressure) * 50;
    const refluxAccuracy = 100 - Math.abs(refluxRatio - optimal.refluxRatio) * 20;
    const flowAccuracy = 100 - Math.abs(flowRate - optimal.flowRate) * 1;

    const overallAccuracy = Math.max(0, (tempAccuracy + pressureAccuracy + refluxAccuracy + flowAccuracy) / 4);
    setAccuracy(overallAccuracy);
    return overallAccuracy;
  }, [temperature, pressure, refluxRatio, flowRate, challenge]);

  // Update accuracy when parameters change
  useEffect(() => {
    calculateAccuracy();
  }, [calculateAccuracy]);

  // Start distillation process
  const handleStartDistillation = useCallback(() => {
    setIsDistilling(true);
    setGamePhase('battle');
    
    const newLog = [...battleLog, `🔥 Distillation process started!`];
    setBattleLog(newLog);

    // Simulate distillation process
    const distillationInterval = setInterval(() => {
      const currentAccuracy = calculateAccuracy();
      
      // Determine which component is being distilled based on temperature
      const setup = challenge.content.distillationSetup;
      const currentComponent = setup.components.find(comp => 
        Math.abs(comp.boilingPoint - temperature) < 10
      );

      if (currentComponent) {
        setCurrentFraction(currentComponent);
        
        // Damage dragon based on accuracy
        const damage = Math.floor(currentAccuracy / 10);
        setDragonHealth(prev => {
          const newHealth = Math.max(0, prev - damage);
          
          if (newHealth <= 0) {
            setGamePhase('victory');
            clearInterval(distillationInterval);
            setBattleLog(prev => [...prev, 
              `💥 Critical hit! Dragon takes ${damage} damage!`,
              `🏆 Dragon defeated! You've mastered fractional distillation!`
            ]);
          } else {
            setBattleLog(prev => [...prev, 
              `⚔️ Dragon takes ${damage} damage! (Accuracy: ${currentAccuracy.toFixed(1)}%)`
            ]);
          }
          
          return newHealth;
        });

        // Dragon counterattack if accuracy is low
        if (currentAccuracy < 70) {
          const dragonDamage = Math.floor((100 - currentAccuracy) / 5);
          setPlayerHealth(prev => {
            const newHealth = Math.max(0, prev - dragonDamage);
            
            if (newHealth <= 0) {
              setGamePhase('defeat');
              clearInterval(distillationInterval);
              setBattleLog(prev => [...prev, 
                `🔥 Dragon breathes fire! You take ${dragonDamage} damage!`,
                `💀 You have been defeated! Study distillation theory and try again.`
              ]);
            } else {
              setBattleLog(prev => [...prev, 
                `🔥 Dragon counterattacks! You take ${dragonDamage} damage!`
              ]);
            }
            
            return newHealth;
          });
        }

        // Collect fraction if accuracy is high enough
        if (currentAccuracy > 80 && !collectedFractions.find(f => f.id === currentComponent.id)) {
          setCollectedFractions(prev => [...prev, currentComponent]);
          setBattleLog(prev => [...prev, 
            `✨ Pure ${currentComponent.name} collected! (${currentComponent.boilingPoint}°C)`
          ]);
        }
      } else {
        // Wrong temperature - dragon gets stronger
        setBattleLog(prev => [...prev, 
          `❌ No component distilling at ${temperature}°C - Dragon regenerates!`
        ]);
        setDragonHealth(prev => Math.min(challenge.content.distillationSetup.maxHealth, prev + 2));
      }
    }, 2000);

    // Auto-stop after 30 seconds
    setTimeout(() => {
      if (gamePhase === 'battle') {
        clearInterval(distillationInterval);
        setIsDistilling(false);
        setBattleLog(prev => [...prev, `⏰ Distillation process stopped.`]);
      }
    }, 30000);

  }, [battleLog, calculateAccuracy, challenge, gamePhase]);

  // Stop distillation
  const handleStopDistillation = useCallback(() => {
    setIsDistilling(false);
    setBattleLog(prev => [...prev, `⏹️ Distillation process stopped.`]);
  }, []);

  // Handle hint request
  const handleHintClick = useCallback(() => {
    if (hintsUsed < challenge.content.hints.length) {
      setCurrentHint(challenge.content.hints[hintsUsed]);
      onHintRequest();
    }
  }, [hintsUsed, challenge.content.hints, onHintRequest]);

  // Submit final answer
  const handleSubmit = useCallback(() => {
    const finalAccuracy = calculateAccuracy();
    const victory = gamePhase === 'victory';
    
    const answer: Answer = {
      response: JSON.stringify({
        victory,
        finalAccuracy,
        dragonHealthRemaining: dragonHealth,
        playerHealthRemaining: playerHealth,
        collectedFractions: collectedFractions.length,
        targetFractions: challenge.content.targetComponents.length,
        optimalConditions: {
          temperature,
          pressure,
          refluxRatio,
          flowRate
        }
      }),
      timeElapsed: challenge.timeLimit ? (challenge.timeLimit - (timeRemaining || 0)) : 0,
      hintsUsed
    };

    onSubmit(answer);
  }, [calculateAccuracy, gamePhase, dragonHealth, playerHealth, collectedFractions, challenge, temperature, pressure, refluxRatio, flowRate, timeRemaining, hintsUsed, onSubmit]);

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!challenge?.content?.distillationSetup) {
    return <div className="distillation-loading">Loading Distillation Dragon...</div>;
  }

  const setup = challenge.content.distillationSetup;

  return (
    <div className="distillation-dragon">
      {/* Header */}
      <div className="boss-header">
        <h2>🐉 Distillation Dragon Boss Battle</h2>
        <p className="boss-description">{setup.description}</p>
        
        <div className="battle-stats">
          <div className="health-bars">
            <div className="health-bar dragon">
              <span className="health-label">Dragon Health</span>
              <div className="health-bar-container">
                <div 
                  className="health-fill dragon-health"
                  style={{ width: `${(dragonHealth / setup.maxHealth) * 100}%` }}
                />
              </div>
              <span className="health-value">{dragonHealth}/{setup.maxHealth}</span>
            </div>
            
            <div className="health-bar player">
              <span className="health-label">Your Health</span>
              <div className="health-bar-container">
                <div 
                  className="health-fill player-health"
                  style={{ width: `${playerHealth}%` }}
                />
              </div>
              <span className="health-value">{playerHealth}/100</span>
            </div>
          </div>

          <div className="battle-info">
            <div className="accuracy-display">
              <span className="accuracy-label">Optimization Accuracy:</span>
              <span className={`accuracy-value ${accuracy > 80 ? 'excellent' : accuracy > 60 ? 'good' : 'poor'}`}>
                {accuracy.toFixed(1)}%
              </span>
            </div>
            
            <div className="time-remaining">
              ⏱️ {timeRemaining ? formatTime(timeRemaining) : 'No limit'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Battle Interface */}
      <div className="battle-interface">
        {/* Distillation Controls */}
        <div className="distillation-controls">
          <h3>Fractional Distillation Controls</h3>
          
          <div className="control-grid">
            <div className="control-group">
              <label>Temperature (°C)</label>
              <input
                type="range"
                min="20"
                max="200"
                value={temperature}
                onChange={(e) => setTemperature(parseInt(e.target.value))}
                disabled={isDistilling}
              />
              <span className="control-value">{temperature}°C</span>
            </div>

            <div className="control-group">
              <label>Pressure (atm)</label>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={pressure}
                onChange={(e) => setPressure(parseFloat(e.target.value))}
                disabled={isDistilling}
              />
              <span className="control-value">{pressure} atm</span>
            </div>

            <div className="control-group">
              <label>Reflux Ratio</label>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={refluxRatio}
                onChange={(e) => setRefluxRatio(parseFloat(e.target.value))}
                disabled={isDistilling}
              />
              <span className="control-value">{refluxRatio}</span>
            </div>

            <div className="control-group">
              <label>Flow Rate (%)</label>
              <input
                type="range"
                min="10"
                max="100"
                value={flowRate}
                onChange={(e) => setFlowRate(parseInt(e.target.value))}
                disabled={isDistilling}
              />
              <span className="control-value">{flowRate}%</span>
            </div>
          </div>

          <div className="distillation-actions">
            {!isDistilling ? (
              <button 
                className="start-distillation-button"
                onClick={handleStartDistillation}
                disabled={gamePhase !== 'setup' && gamePhase !== 'battle'}
              >
                🔥 Start Distillation Attack
              </button>
            ) : (
              <button 
                className="stop-distillation-button"
                onClick={handleStopDistillation}
              >
                ⏹️ Stop Distillation
              </button>
            )}
          </div>
        </div>

        {/* Components Reference */}
        <div className="components-reference">
          <h4>Mixture Components</h4>
          <div className="components-list">
            {setup.components.map((component) => (
              <div 
                key={component.id} 
                className={`component-card ${currentFraction?.id === component.id ? 'active' : ''}`}
                style={{ borderColor: component.color }}
              >
                <div className="component-name">{component.name}</div>
                <div className="component-bp">BP: {component.boilingPoint}°C</div>
                <div className="component-conc">{component.concentration}%</div>
                {collectedFractions.find(f => f.id === component.id) && (
                  <div className="collected-indicator">✅ Collected</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Battle Log */}
        <div className="battle-log">
          <h4>Battle Log</h4>
          <div className="log-container">
            {battleLog.map((entry, index) => (
              <div key={index} className="log-entry">
                {entry}
              </div>
            ))}
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

      {/* Game Controls */}
      <div className="game-controls">
        <button 
          className="hint-button"
          onClick={handleHintClick}
          disabled={hintsUsed >= challenge.content.hints.length}
        >
          💡 Hint ({hintsUsed}/{challenge.content.hints.length})
        </button>

        {(gamePhase === 'victory' || gamePhase === 'defeat') && (
          <button 
            className="submit-button"
            onClick={handleSubmit}
          >
            {gamePhase === 'victory' ? '🏆 Claim Victory' : '💀 Accept Defeat'}
          </button>
        )}
      </div>

      {/* Victory/Defeat Overlay */}
      {gamePhase === 'victory' && (
        <div className="game-result-overlay victory">
          <div className="result-content">
            <h2>🏆 VICTORY!</h2>
            <p>You have defeated the Distillation Dragon!</p>
            <div className="victory-stats">
              <div>Final Accuracy: {accuracy.toFixed(1)}%</div>
              <div>Fractions Collected: {collectedFractions.length}/{setup.components.length}</div>
              <div>Health Remaining: {playerHealth}/100</div>
            </div>
            <div className="golden-flask">
              🏺 Golden Flask Badge Unlocked!
            </div>
          </div>
        </div>
      )}

      {gamePhase === 'defeat' && (
        <div className="game-result-overlay defeat">
          <div className="result-content">
            <h2>💀 DEFEAT</h2>
            <p>The Distillation Dragon has overwhelmed you!</p>
            <div className="defeat-advice">
              <p>Study fractional distillation theory and optimize your conditions:</p>
              <ul>
                <li>Match temperature to component boiling points</li>
                <li>Adjust pressure for better separation</li>
                <li>Optimize reflux ratio for purity</li>
                <li>Control flow rate for efficiency</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistillationDragon;