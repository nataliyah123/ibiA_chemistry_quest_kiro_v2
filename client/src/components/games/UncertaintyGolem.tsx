import React, { useState, useEffect } from 'react';
import { Challenge } from '../../types/game';
import './UncertaintyGolem.css';

interface PercentageErrorProblem {
  id: string;
  scenario: string;
  measuredValue: number;
  trueValue: number;
  unit: string;
  difficulty: number;
  topic: string;
  context: string;
  distractors?: number[];
}

interface UncertaintyGolemProps {
  challenge: Challenge;
  onComplete: (answer: string) => void;
  onBack: () => void;
}

const UncertaintyGolem: React.FC<UncertaintyGolemProps> = ({ challenge, onComplete, onBack }) => {
  const [gamePhase, setGamePhase] = useState<'intro' | 'battle' | 'victory' | 'defeat'>('intro');
  const [golemHealth, setGolemHealth] = useState(100);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [currentStage, setCurrentStage] = useState(1);
  const [userAnswer, setUserAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [damage, setDamage] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [totalScore, setTotalScore] = useState(0);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [showFormula, setShowFormula] = useState(false);

  // Extract problem from challenge content
  const problem: PercentageErrorProblem = (challenge.content as any).problem;
  const maxStages = (challenge.content as any).maxStages || 3;

  // Calculate correct answer
  const correctAnswer = Math.abs((problem.measuredValue - problem.trueValue) / problem.trueValue * 100);

  useEffect(() => {
    if (gamePhase === 'battle' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gamePhase === 'battle') {
      handleTimeout();
    }
  }, [timeLeft, gamePhase]);

  const startBattle = () => {
    setGamePhase('battle');
    setTimeLeft(90);
    setBattleLog(['The Uncertainty Golem awakens! It challenges your calculation skills!']);
  };

  const handleTimeout = () => {
    const golemDamage = 25;
    setPlayerHealth(prev => Math.max(0, prev - golemDamage));
    setBattleLog(prev => [...prev, `⏰ Time's up! The golem strikes for ${golemDamage} damage!`]);
    
    if (playerHealth - golemDamage <= 0) {
      setGamePhase('defeat');
    } else {
      nextStage();
    }
  };

  const handleSubmit = () => {
    const userValue = parseFloat(userAnswer);
    const tolerance = 0.1; // 0.1% tolerance
    const difference = Math.abs(userValue - correctAnswer);
    const correct = difference <= tolerance;
    
    setIsCorrect(correct);
    
    let calculatedDamage = 0;
    let message = '';
    
    if (correct) {
      calculatedDamage = 35;
      message = `🎯 Perfect! Critical hit for ${calculatedDamage} damage!`;
      setTotalScore(prev => prev + 100);
    } else if (difference <= 0.5) {
      calculatedDamage = 25;
      message = `👍 Close! Good hit for ${calculatedDamage} damage!`;
      setTotalScore(prev => prev + 75);
    } else if (difference <= 1.0) {
      calculatedDamage = 15;
      message = `⚔️ Decent attempt. ${calculatedDamage} damage dealt.`;
      setTotalScore(prev => prev + 50);
    } else if (difference <= 2.0) {
      calculatedDamage = 8;
      message = `🗡️ Glancing blow. ${calculatedDamage} damage.`;
      setTotalScore(prev => prev + 25);
    } else {
      calculatedDamage = 3;
      message = `💥 Miss! Only ${calculatedDamage} damage.`;
      setTotalScore(prev => prev + 10);
    }
    
    setDamage(calculatedDamage);
    setFeedbackMessage(message);
    setShowFeedback(true);
    
    // Update golem health
    const newGolemHealth = Math.max(0, golemHealth - calculatedDamage);
    setGolemHealth(newGolemHealth);
    
    setBattleLog(prev => [...prev, 
      `You calculated: ${userValue.toFixed(2)}% (Correct: ${correctAnswer.toFixed(2)}%)`,
      message
    ]);
    
    // Check if golem is defeated
    if (newGolemHealth <= 0) {
      setTimeout(() => {
        if (currentStage >= maxStages) {
          setGamePhase('victory');
        } else {
          nextStage();
        }
      }, 2000);
    } else {
      // Golem counter-attack
      setTimeout(() => {
        golemCounterAttack();
      }, 2000);
    }
  };

  const golemCounterAttack = () => {
    const golemDamage = Math.floor(Math.random() * 15) + 10; // 10-25 damage
    const newPlayerHealth = Math.max(0, playerHealth - golemDamage);
    setPlayerHealth(newPlayerHealth);
    
    const attacks = [
      `The golem hurls uncertainty at you for ${golemDamage} damage!`,
      `Measurement errors swirl around you! ${golemDamage} damage taken!`,
      `The golem's confusion ray hits for ${golemDamage} damage!`,
      `Statistical chaos strikes you for ${golemDamage} damage!`
    ];
    
    const randomAttack = attacks[Math.floor(Math.random() * attacks.length)];
    setBattleLog(prev => [...prev, `💀 ${randomAttack}`]);
    
    if (newPlayerHealth <= 0) {
      setGamePhase('defeat');
    } else {
      nextStage();
    }
  };

  const nextStage = () => {
    if (currentStage >= maxStages) {
      setGamePhase('victory');
      return;
    }
    
    setCurrentStage(prev => prev + 1);
    setUserAnswer('');
    setShowFeedback(false);
    setTimeLeft(90);
    
    // Restore some golem health for next stage
    setGolemHealth(prev => Math.min(100, prev + 30));
    
    setBattleLog(prev => [...prev, 
      `🔄 Stage ${currentStage + 1} begins! The golem regenerates some health!`
    ]);
  };

  const toggleFormula = () => {
    setShowFormula(!showFormula);
  };

  const handleComplete = () => {
    const finalScore = totalScore + (playerHealth * 2); // Bonus for remaining health
    onComplete(JSON.stringify({
      score: finalScore,
      stagesCompleted: currentStage,
      finalAnswer: userAnswer,
      golemDefeated: gamePhase === 'victory'
    }));
  };

  if (gamePhase === 'intro') {
    return (
      <div className="uncertainty-golem">
        <div className="game-header">
          <button className="back-button" onClick={onBack}>← Back to Realm</button>
          <h1>👹 Uncertainty Golem Boss Battle</h1>
        </div>

        <div className="intro-panel">
          <div className="golem-artwork">
            <div className="golem-sprite intro-golem">
              <div className="golem-body">👹</div>
              <div className="golem-aura"></div>
            </div>
          </div>

          <div className="boss-intro">
            <h2>The Uncertainty Golem Awakens!</h2>
            <p className="boss-speech">
              "Mortal! Your calculations mean nothing to me! I am the embodiment of measurement error, 
              the chaos of imprecision! Face my challenges and prove your mastery of percentage error calculations!"
            </p>
            
            <div className="battle-info">
              <div className="info-section">
                <h3>📊 Battle Mechanics</h3>
                <ul>
                  <li>Calculate percentage errors to damage the golem</li>
                  <li>More accurate answers deal more damage</li>
                  <li>The golem will counter-attack if not defeated quickly</li>
                  <li>Survive {maxStages} stages to claim victory</li>
                  <li>Use the formula: |measured - true| / true × 100%</li>
                </ul>
              </div>
              
              <div className="info-section">
                <h3>🎯 Scoring</h3>
                <ul>
                  <li>Perfect answer (±0.1%): 35 damage, 100 points</li>
                  <li>Close answer (±0.5%): 25 damage, 75 points</li>
                  <li>Good answer (±1.0%): 15 damage, 50 points</li>
                  <li>Fair answer (±2.0%): 8 damage, 25 points</li>
                  <li>Poor answer (&gt;2.0%): 3 damage, 10 points</li>
                </ul>
              </div>
            </div>

            <div className="problem-preview">
              <h3>🧪 Current Challenge</h3>
              <div className="problem-card">
                <p><strong>Scenario:</strong> {problem.scenario}</p>
                <p><strong>Context:</strong> {problem.context}</p>
                <p><strong>Topic:</strong> {problem.topic}</p>
                <p><strong>Difficulty:</strong> {problem.difficulty}/5</p>
              </div>
            </div>

            <button className="battle-start-button" onClick={startBattle}>
              ⚔️ Begin Battle!
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gamePhase === 'battle') {
    return (
      <div className="uncertainty-golem">
        <div className="game-header">
          <button className="back-button" onClick={onBack}>← Back to Realm</button>
          <h1>👹 Uncertainty Golem - Stage {currentStage}/{maxStages}</h1>
        </div>

        <div className="battle-arena">
          <div className="battle-status">
            <div className="health-bars">
              <div className="player-health">
                <span className="health-label">Your Health</span>
                <div className="health-bar">
                  <div 
                    className="health-fill player-fill" 
                    style={{ width: `${playerHealth}%` }}
                  ></div>
                </div>
                <span className="health-value">{playerHealth}/100</span>
              </div>
              
              <div className="vs-indicator">⚔️</div>
              
              <div className="golem-health">
                <span className="health-label">Golem Health</span>
                <div className="health-bar">
                  <div 
                    className="health-fill golem-fill" 
                    style={{ width: `${golemHealth}%` }}
                  ></div>
                </div>
                <span className="health-value">{golemHealth}/100</span>
              </div>
            </div>

            <div className="battle-info-bar">
              <div className="timer">
                <span className="timer-label">Time Left</span>
                <span className="timer-value">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
              </div>
              <div className="score">
                <span className="score-label">Score</span>
                <span className="score-value">{totalScore}</span>
              </div>
            </div>
          </div>

          <div className="battle-field">
            <div className="golem-area">
              <div className={`golem-sprite ${golemHealth <= 30 ? 'damaged' : ''}`}>
                <div className="golem-body">👹</div>
                <div className="golem-aura"></div>
                {showFeedback && (
                  <div className={`damage-indicator ${isCorrect ? 'critical' : 'normal'}`}>
                    -{damage}
                  </div>
                )}
              </div>
            </div>

            <div className="problem-area">
              <div className="problem-card">
                <h3>Calculate the Percentage Error!</h3>
                <div className="problem-details">
                  <p><strong>Scenario:</strong> {problem.scenario}</p>
                  <p><strong>Measured Value:</strong> {problem.measuredValue} {problem.unit}</p>
                  <p><strong>True Value:</strong> {problem.trueValue} {problem.unit}</p>
                </div>
                
                <div className="formula-section">
                  <button className="formula-toggle" onClick={toggleFormula}>
                    {showFormula ? '🙈 Hide Formula' : '📐 Show Formula'}
                  </button>
                  {showFormula && (
                    <div className="formula-display">
                      <p><strong>Percentage Error Formula:</strong></p>
                      <div className="formula">
                        % Error = |Measured - True| / True × 100%
                      </div>
                      <div className="formula-example">
                        % Error = |{problem.measuredValue} - {problem.trueValue}| / {problem.trueValue} × 100%
                      </div>
                    </div>
                  )}
                </div>

                <div className="answer-section">
                  <div className="input-group">
                    <input
                      type="number"
                      step="0.01"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Enter percentage error"
                      className="answer-input"
                      disabled={showFeedback}
                    />
                    <span className="input-unit">%</span>
                  </div>
                  
                  <button 
                    className="attack-button"
                    onClick={handleSubmit}
                    disabled={!userAnswer || showFeedback}
                  >
                    ⚔️ Attack!
                  </button>
                </div>

                {showFeedback && (
                  <div className={`feedback-panel ${isCorrect ? 'correct' : 'incorrect'}`}>
                    <p className="feedback-message">{feedbackMessage}</p>
                    <p className="correct-answer">
                      Correct answer: {correctAnswer.toFixed(2)}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="battle-log">
            <h4>⚔️ Battle Log</h4>
            <div className="log-entries">
              {battleLog.map((entry, index) => (
                <div key={index} className="log-entry">
                  {entry}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gamePhase === 'victory') {
    return (
      <div className="uncertainty-golem">
        <div className="game-header">
          <button className="back-button" onClick={onBack}>← Back to Realm</button>
          <h1>🏆 Victory!</h1>
        </div>

        <div className="victory-panel">
          <div className="victory-animation">
            <div className="defeated-golem">💀</div>
            <div className="victory-effects">✨🎉✨</div>
          </div>

          <div className="victory-message">
            <h2>The Uncertainty Golem is Defeated!</h2>
            <p>
              Your mastery of percentage error calculations has proven too much for the golem! 
              The ancient beast crumbles before your mathematical precision!
            </p>
          </div>

          <div className="victory-stats">
            <div className="stat-card">
              <span className="stat-value">{totalScore + (playerHealth * 2)}</span>
              <span className="stat-label">Final Score</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{currentStage}</span>
              <span className="stat-label">Stages Completed</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{playerHealth}</span>
              <span className="stat-label">Health Remaining</span>
            </div>
          </div>

          <div className="rewards-section">
            <h3>🏆 Victory Rewards</h3>
            <div className="reward-items">
              <div className="reward-item legendary">
                <span className="reward-icon">📏</span>
                <div className="reward-info">
                  <span className="reward-name">Sage's Ruler</span>
                  <span className="reward-description">Legendary formula reference sheet unlocked!</span>
                </div>
              </div>
              <div className="reward-item">
                <span className="reward-icon">⭐</span>
                <div className="reward-info">
                  <span className="reward-name">500 XP</span>
                  <span className="reward-description">Massive experience bonus</span>
                </div>
              </div>
              <div className="reward-item">
                <span className="reward-icon">💰</span>
                <div className="reward-info">
                  <span className="reward-name">200 Gold</span>
                  <span className="reward-description">Boss victory bonus</span>
                </div>
              </div>
            </div>
          </div>

          <button className="complete-button" onClick={handleComplete}>
            Claim Victory! 🎯
          </button>
        </div>
      </div>
    );
  }

  if (gamePhase === 'defeat') {
    return (
      <div className="uncertainty-golem">
        <div className="game-header">
          <button className="back-button" onClick={onBack}>← Back to Realm</button>
          <h1>💀 Defeat</h1>
        </div>

        <div className="defeat-panel">
          <div className="defeat-animation">
            <div className="victorious-golem">👹</div>
            <div className="defeat-effects">💥⚡💥</div>
          </div>

          <div className="defeat-message">
            <h2>The Uncertainty Golem Prevails!</h2>
            <p>
              The golem's chaotic energy has overwhelmed you! Your calculations were not precise enough 
              to defeat this mathematical beast. Train harder and return when you're ready!
            </p>
          </div>

          <div className="defeat-stats">
            <div className="stat-card">
              <span className="stat-value">{totalScore}</span>
              <span className="stat-label">Score Achieved</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{currentStage - 1}</span>
              <span className="stat-label">Stages Completed</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{correctAnswer.toFixed(2)}%</span>
              <span className="stat-label">Last Correct Answer</span>
            </div>
          </div>

          <div className="encouragement">
            <h3>💪 Don't Give Up!</h3>
            <p>
              Remember the formula: |Measured - True| / True × 100%<br/>
              Practice more percentage error problems and return stronger!
            </p>
          </div>

          <button className="retry-button" onClick={() => window.location.reload()}>
            Try Again 🔄
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default UncertaintyGolem;