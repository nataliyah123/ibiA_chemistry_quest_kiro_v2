import React, { useState } from 'react';
// FORCE OFFLINE MODE - NO API CALLS
import { EquationDuelsOffline } from '../games/EquationDuelsOffline';
import { Challenge, Result, ChallengeType } from '../../types/game';

// PREVENT ANY ACCIDENTAL API CALLS
const DEMO_MODE = true;

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

export const EquationDuelsDemo: React.FC = () => {
  const [showGame, setShowGame] = useState(false);
  const [gameResult, setGameResult] = useState<Result | null>(null);
  
  // Debug log to confirm demo component is being used
  console.log('🔧 EquationDuelsDemo component loaded - using offline mode');

  const handleStartDemo = () => {
    setShowGame(true);
    setGameResult(null);
  };

  const handleGameComplete = (result: Result) => {
    setGameResult(result);
    setTimeout(() => {
      setShowGame(false);
    }, 3000);
  };

  const handleAbandonGame = () => {
    setShowGame(false);
    setGameResult(null);
  };

  if (showGame) {
    return (
      <div>
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
          OFFLINE MODE - NO API CALLS
        </div>
        <EquationDuelsOffline
          challenge={mockChallenge}
          onComplete={handleGameComplete}
          onAbandon={handleAbandonGame}
        />
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
        Experience the thrill of chemical equation balancing in this combat-style game! 
        Use mana and health points to battle through equations, but beware of explosive mistakes.
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
          Balance this metal + acid reaction by dragging coefficients or using the quick select buttons.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
          <div>
            <strong style={{ color: '#4a90e2' }}>Difficulty:</strong> ⭐⭐
          </div>
          <div>
            <strong style={{ color: '#27ae60' }}>Time Limit:</strong> 2 minutes
          </div>
          <div>
            <strong style={{ color: '#f39c12' }}>Hints:</strong> 4 available
          </div>
        </div>
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
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(39, 174, 96, 0.4)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 5px 15px rgba(39, 174, 96, 0.3)';
        }}
      >
        Start Equation Duel
      </button>

      {gameResult && (
        <div style={{
          marginTop: '40px',
          padding: '20px',
          background: gameResult.validation.isCorrect 
            ? 'rgba(39, 174, 96, 0.2)' 
            : 'rgba(231, 76, 60, 0.2)',
          border: `2px solid ${gameResult.validation.isCorrect ? '#27ae60' : '#e74c3c'}`,
          borderRadius: '10px',
          maxWidth: '600px',
          margin: '40px auto 0'
        }}>
          <h3 style={{ 
            color: gameResult.validation.isCorrect ? '#2ecc71' : '#e74c3c',
            marginBottom: '15px'
          }}>
            Game Result
          </h3>
          <p><strong>Score:</strong> {gameResult.validation.score}</p>
          <p><strong>XP Gained:</strong> {gameResult.experienceGained}</p>
          <p><strong>Gold Earned:</strong> {gameResult.goldEarned}</p>
          <p><strong>Feedback:</strong> {gameResult.validation.feedback}</p>
        </div>
      )}

      <div style={{
        marginTop: '60px',
        padding: '20px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '10px',
        maxWidth: '800px',
        margin: '60px auto 0'
      }}>
        <h3 style={{ color: '#f39c12', marginBottom: '15px' }}>Game Features</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px',
          textAlign: 'left'
        }}>
          <div>
            <strong style={{ color: '#4a90e2' }}>⚔️ Combat System</strong>
            <p style={{ color: '#bdc3c7', fontSize: '14px' }}>
              Mana and health points add excitement to equation balancing
            </p>
          </div>
          <div>
            <strong style={{ color: '#e67e22' }}>💥 Explosion Effects</strong>
            <p style={{ color: '#bdc3c7', fontSize: '14px' }}>
              Wrong answers trigger spectacular explosion animations
            </p>
          </div>
          <div>
            <strong style={{ color: '#27ae60' }}>🎯 Drag & Drop</strong>
            <p style={{ color: '#bdc3c7', fontSize: '14px' }}>
              Intuitive coefficient placement with visual feedback
            </p>
          </div>
          <div>
            <strong style={{ color: '#9b59b6' }}>💡 Hint System</strong>
            <p style={{ color: '#bdc3c7', fontSize: '14px' }}>
              Progressive hints guide students through the process
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};