import React, { useState, useEffect } from 'react';
import { useGameEngine } from '../../hooks/useGameEngine';
import { Challenge } from '../../types/game';
import GraphJoust from '../games/GraphJoust';
import ErrorHunter from '../games/ErrorHunter';
import UncertaintyGolem from '../games/UncertaintyGolem';
import './CartographersGauntletRealm.css';

interface CartographersGauntletRealmProps {
  userId: string;
}

const CartographersGauntletRealm: React.FC<CartographersGauntletRealmProps> = ({ userId }) => {
  const { startChallenge, submitAnswer } = useGameEngine();
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const games = [
    {
      id: 'graph-joust',
      name: 'Graph Joust',
      description: 'Compete against AI to plot chemistry data accurately',
      icon: '📊',
      difficulty: 'Medium',
      unlocked: true
    },
    {
      id: 'error-hunter',
      name: 'Error Hunter',
      description: 'Find and categorize errors in corrupted datasets',
      icon: '🔍',
      difficulty: 'Hard',
      unlocked: true
    },
    {
      id: 'uncertainty-golem',
      name: 'Uncertainty Golem',
      description: 'Boss Battle: Calculate percentage errors to defeat the golem',
      icon: '👹',
      difficulty: 'Boss',
      unlocked: true,
      isBoss: true
    }
  ];

  const handleGameSelect = async (gameId: string) => {
    setIsLoading(true);
    try {
      // Generate a challenge for the selected game type
      const challenge = await startChallenge(userId, `${gameId}-random`);
      setCurrentChallenge(challenge);
      setSelectedGame(gameId);
    } catch (error) {
      console.error('Failed to start challenge:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChallengeComplete = async (answer: any) => {
    if (!currentChallenge) return;

    try {
      await submitAnswer(userId, currentChallenge.id, { value: answer });
      setCurrentChallenge(null);
      setSelectedGame(null);
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  const handleBackToRealm = () => {
    setCurrentChallenge(null);
    setSelectedGame(null);
  };

  if (currentChallenge && selectedGame) {
    switch (selectedGame) {
      case 'graph-joust':
        return (
          <GraphJoust
            challenge={currentChallenge}
            onComplete={handleChallengeComplete}
            onBack={handleBackToRealm}
          />
        );
      case 'error-hunter':
        return (
          <ErrorHunter
            challenge={currentChallenge}
            onComplete={handleChallengeComplete}
            onBack={handleBackToRealm}
          />
        );
      case 'uncertainty-golem':
        return (
          <UncertaintyGolem
            challenge={currentChallenge}
            onComplete={handleChallengeComplete}
            onBack={handleBackToRealm}
          />
        );
      default:
        return <div>Unknown game type</div>;
    }
  }

  return (
    <div className="cartographers-gauntlet-realm">
      <div className="realm-header">
        <div className="realm-title">
          <h1>🗺️ The Cartographer's Gauntlet</h1>
          <p className="realm-subtitle">Master data analysis and graphing through competitive challenges</p>
        </div>
        <div className="realm-description">
          <p>
            Welcome to the Cartographer's Gauntlet, where precision and analytical skills reign supreme! 
            Navigate through datasets, hunt for errors, and face the mighty Uncertainty Golem in battles 
            of mathematical prowess.
          </p>
        </div>
      </div>

      <div className="games-grid">
        {games.map((game) => (
          <div
            key={game.id}
            className={`game-card ${game.isBoss ? 'boss-card' : ''} ${!game.unlocked ? 'locked' : ''}`}
            onClick={() => game.unlocked && handleGameSelect(game.id)}
          >
            <div className="game-icon">{game.icon}</div>
            <div className="game-info">
              <h3 className="game-name">{game.name}</h3>
              <p className="game-description">{game.description}</p>
              <div className="game-meta">
                <span className={`difficulty ${game.difficulty.toLowerCase()}`}>
                  {game.difficulty}
                </span>
                {game.isBoss && <span className="boss-indicator">BOSS</span>}
              </div>
            </div>
            {!game.unlocked && (
              <div className="lock-overlay">
                <span className="lock-icon">🔒</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Preparing your challenge...</p>
        </div>
      )}

      <div className="realm-lore">
        <div className="lore-section">
          <h3>📊 Graph Joust</h3>
          <p>
            Face off against the AI Cartographer in high-speed plotting duels. Accuracy and speed 
            determine victory as you race to correctly plot chemistry datasets from titration curves 
            to kinetics data.
          </p>
        </div>
        
        <div className="lore-section">
          <h3>🔍 Error Hunter</h3>
          <p>
            Corrupted datasets plague the realm! Use your analytical eye to identify calculation 
            mistakes, outliers, transcription errors, and systematic biases hidden within the data.
          </p>
        </div>
        
        <div className="lore-section">
          <h3>👹 Uncertainty Golem Boss</h3>
          <p>
            The mighty Uncertainty Golem guards the Sage's Ruler - a legendary formula reference sheet. 
            Defeat this mathematical beast by calculating percentage errors with precision across 
            multiple challenging stages.
          </p>
        </div>
      </div>

      <div className="rewards-preview">
        <h3>🏆 Realm Rewards</h3>
        <div className="rewards-grid">
          <div className="reward-item">
            <span className="reward-icon">📏</span>
            <span className="reward-name">Sage's Ruler</span>
            <span className="reward-description">Complete formula reference sheet</span>
          </div>
          <div className="reward-item">
            <span className="reward-icon">🎯</span>
            <span className="reward-name">Data Master Badge</span>
            <span className="reward-description">Perfect accuracy in Graph Joust</span>
          </div>
          <div className="reward-item">
            <span className="reward-icon">🔍</span>
            <span className="reward-name">Error Detective Badge</span>
            <span className="reward-description">Find all errors in Error Hunter</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartographersGauntletRealm;