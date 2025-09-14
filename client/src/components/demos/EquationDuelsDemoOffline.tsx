import React, { useState } from 'react';
import { Challenge, Result, ChallengeType } from '../../types/game';

// COMPLETELY OFFLINE DEMO - NO EXTERNAL DEPENDENCIES
interface GameState {
  mana: number;
  health: number;
  timeRemaining: number;
  coefficients: number[];
  isSubmitting: boolean;
  showExplosion: boolean;
  feedback: string;
  hintsUsed: number;
}

// Mock challenge data for demo purposes
const mockChallenge: Challenge = {
  id: 'demo-equation-1',
  realmId: 'mathmage-trials',
  type: ChallengeType.EQUATION_BALANCE,
  difficulty: 2,
  title: 'Balance the Chemical Equation',
  description: 'Balance this metal + acid equation by finding the correct coefficients.',
  content: {
    question: 'Balance the following chemical equation:\n\nZn + HCl → ZnCl₂ + H₂',
    correctAnswer: '1,2,1,1',
    explanation: 'The balanced equation is: Zn + 2HCl → ZnCl₂ + H₂\n\nCoefficients: 1, 2, 1, 1',
    hints: [
      'Start by counting atoms of each element on both sides',
      'Balance metals first, then non-metals, then hydrogen and oxygen',
      'Use the smallest whole number coefficients possible',
      'This is a metal + acid reaction'
    ],
    visualAids: [
      {
        type: 'diagram',
        url: '/images/equations/metal_acid.png',
        altText: 'Diagram showing metal + acid reaction mechanism',
        interactive: false
      }
    ]
  },
  timeLimit: 120,
  requiredLevel: 1,
  rewards: [
    {
      type: 'xp',
      amount: 20,
      description: 'Challenge completion XP'
    },
    {
      type: 'gold',
      amount: 10,
      description: 'Challenge completion gold'
    }
  ],
  metadata: {
    concepts: ['chemical equations', 'balancing', 'Metal + acid'],
    curriculumStandards: ['O-Level Chemistry', 'A-Level Chemistry'],
    estimatedDuration: 120,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
};

export const EquationDuelsDemoOffline: React.FC = () => {
  const [showGame, setShowGame] = useState(false);
  const [gameResult, setGameResult] = useState<Result | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    mana: 100,
    health: 100,
    timeRemaining: 120,
    coefficients: [1, 1, 1, 1],
    isSubmitting: false,
    showExplosion: false,
    feedback: '',
    hintsUsed: 0
  });

  console.log('🔧 USING COMPLETELY OFFLINE DEMO - NO API CALLS POSSIBLE');

  const handleStartDemo = () => {
    setShowGame(true);
    setGameResult(null);
    setGameState({
      mana: 100,
      health: 100,
      timeRemaining: 120,
      coefficients: [1, 1, 1, 1],
      isSubmitting: false,
      showExplosion: false,
      feedback: '',
      hintsUsed: 0
    });
  };

  const handleSubmitAnswer = () => {
    const userAnswer = gameState.coefficients.join(',');
    const correctAnswer = mockChallenge.content.correctAnswer;
    const isCorrect = userAnswer === correctAnswer;

    if (!isCorrect) {
      setGameState(prev => ({
        ...prev,
        showExplosion: true,
        health: Math.max(0, prev.health - 20),
        feedback: 'Incorrect! Try again.'
      }));

      setTimeout(() => {
        setGameState(prev => ({ ...prev, showExplosion: false }));
      }, 2000);
      return;
    }

    // Success!
    const result: Result = {
      challengeId: mockChallenge.id,
      userId: 'demo-user',
      validation: {
        isCorrect: true,
        score: 100,
        feedback: mockChallenge.content.explanation,
        correctAnswer: mockChallenge.content.correctAnswer,
        userAnswer: userAnswer
      },
      experienceGained: 20,
      goldEarned: 10,
      timeElapsed: 120 - gameState.timeRemaining,
      hintsUsed: gameState.hintsUsed,
      completedAt: new Date().toISOString()
    };

    setGameResult(result);
    setTimeout(() => {
      setShowGame(false);
    }, 3000);
  };

  const updateCoefficient = (index: number, value: number) => {
    const newCoefficients = [...gameState.coefficients];
    newCoefficients[index] = value;
    setGameState(prev => ({ ...prev, coefficients: newCoefficients }));
  };

  if (showGame) {
    return (
      <div style={{ 
        padding: '20px', 
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        minHeight: '100vh',
        color: 'white'
      }}>
        <div style={{ 
          position: 'fixed', 
          top: '10px', 
          right: '10px', 
          background: 'green', 
          color: 'white', 
          padding: '5px 10px', 
          borderRadius: '5px',
          zIndex: 9999,
          fontSize: '12px'
        }}>
          OFFLINE DEMO - NO API CALLS
        </div>

        {gameState.showExplosion && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '100px',
            zIndex: 1000
          }}>
            💥
          </div>
        )}

        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
          Equation Duels - Offline Demo
        </h1>

        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
            <div>Health: {gameState.health}/100</div>
            <div>Mana: {gameState.mana}/100</div>
            <div>Time: {gameState.timeRemaining}s</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2>Balance this equation:</h2>
          <div style={{ fontSize: '24px', margin: '20px 0' }}>
            Zn + HCl → ZnCl₂ + H₂
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', margin: '20px 0' }}>
            <input 
              type="number" 
              min="1" 
              max="10" 
              value={gameState.coefficients[0]} 
              onChange={(e) => updateCoefficient(0, parseInt(e.target.value) || 1)}
              style={{ width: '50px', padding: '5px', textAlign: 'center' }}
            />
            <span>Zn +</span>
            <input 
              type="number" 
              min="1" 
              max="10" 
              value={gameState.coefficients[1]} 
              onChange={(e) => updateCoefficient(1, parseInt(e.target.value) || 1)}
              style={{ width: '50px', padding: '5px', textAlign: 'center' }}
            />
            <span>HCl →</span>
            <input 
              type="number" 
              min="1" 
              max="10" 
              value={gameState.coefficients[2]} 
              onChange={(e) => updateCoefficient(2, parseInt(e.target.value) || 1)}
              style={{ width: '50px', padding: '5px', textAlign: 'center' }}
            />
            <span>ZnCl₂ +</span>
            <input 
              type="number" 
              min="1" 
              max="10" 
              value={gameState.coefficients[3]} 
              onChange={(e) => updateCoefficient(3, parseInt(e.target.value) || 1)}
              style={{ width: '50px', padding: '5px', textAlign: 'center' }}
            />
            <span>H₂</span>
          </div>

          <button
            onClick={handleSubmitAnswer}
            disabled={gameState.isSubmitting}
            style={{
              padding: '15px 30px',
              fontSize: '18px',
              background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              margin: '20px'
            }}
          >
            Cast Balancing Spell!
          </button>

          <button
            onClick={() => setShowGame(false)}
            style={{
              padding: '15px 30px',
              fontSize: '18px',
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              margin: '20px'
            }}
          >
            Abandon Challenge
          </button>
        </div>

        {gameState.feedback && (
          <div style={{ textAlign: 'center', color: '#e74c3c', fontSize: '18px' }}>
            {gameState.feedback}
          </div>
        )}

        {gameResult && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0,0,0,0.9)',
            padding: '30px',
            borderRadius: '15px',
            textAlign: 'center',
            zIndex: 1000
          }}>
            <h2 style={{ color: '#2ecc71' }}>Success! 🎉</h2>
            <p>Score: {gameResult.validation.score}</p>
            <p>XP Gained: {gameResult.experienceGained}</p>
            <p>Gold Earned: {gameResult.goldEarned}</p>
            <p>{gameResult.validation.feedback}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center', 
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        background: 'green', 
        color: 'white', 
        padding: '5px 10px', 
        borderRadius: '5px',
        zIndex: 9999,
        fontSize: '12px'
      }}>
        OFFLINE DEMO - NO API CALLS
      </div>

      <h1 style={{ 
        fontSize: '48px', 
        marginBottom: '20px',
        background: 'linear-gradient(135deg, #f39c12, #e67e22)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        Equation Duels Demo (Offline Mode)
      </h1>
      
      <p style={{ 
        fontSize: '18px', 
        marginBottom: '40px', 
        color: '#bdc3c7',
        maxWidth: '600px',
        margin: '0 auto 40px'
      }}>
        Experience chemical equation balancing without any server connections! 
        This demo runs completely offline with local validation.
      </p>

      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '15px',
        padding: '30px',
        marginBottom: '40px',
        border: '2px solid rgba(74, 144, 226, 0.3)',
        maxWidth: '800px',
        margin: '0 auto 40px'
      }}>
        <h3 style={{ color: '#f39c12', marginBottom: '20px' }}>Demo Challenge</h3>
        <div style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '15px',
          fontFamily: 'monospace'
        }}>
          Zn + HCl → ZnCl₂ + H₂
        </div>
        <p style={{ color: '#bdc3c7', marginBottom: '20px' }}>
          Balance this metal + acid reaction. The correct answer is: 1, 2, 1, 1
        </p>
      </div>

      <button
        onClick={handleStartDemo}
        style={{
          padding: '20px 40px',
          fontSize: '20px',
          fontWeight: 'bold',
          border: 'none',
          borderRadius: '15px',
          background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
          color: 'white',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 5px 15px rgba(39, 174, 96, 0.3)'
        }}
      >
        Start Offline Demo
      </button>
    </div>
  );
};