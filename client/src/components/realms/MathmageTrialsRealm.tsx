import React, { useState, useEffect } from 'react';
import { Challenge, Result, ChallengeType } from '../../types/game';
import { useGameEngine } from '../../hooks/useGameEngine';
import { EquationDuels } from '../games/EquationDuels';
import { MoleDungeonCrawler } from '../games/MoleDungeonCrawler';
import { LimitingReagentHydra } from '../games/LimitingReagentHydra';
import './MathmageTrialsRealm.css';

interface MathmageTrialsRealmProps {
  onComplete?: (result: Result) => void;
  onBack?: () => void;
}

type GameMode = 'menu' | 'equation-duels' | 'mole-dungeon' | 'hydra-boss';

export const MathmageTrialsRealm: React.FC<MathmageTrialsRealmProps> = ({
  onComplete,
  onBack
}) => {
  const { getCurrentRealm, generateRandomChallenge, loading, error } = useGameEngine();
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [realmData, setRealmData] = useState<any>(null);
  const [playerStats, setPlayerStats] = useState({
    level: 1,
    experience: 0,
    mana: 100,
    health: 100,
    completedChallenges: 0
  });

  useEffect(() => {
    loadRealmData();
  }, []);

  const loadRealmData = async () => {
    try {
      const realm = await getCurrentRealm();
      setRealmData(realm);
    } catch (err) {
      console.error('Failed to load realm data:', err);
    }
  };

  const startEquationDuels = async () => {
    try {
      const challenge = await generateRandomChallenge(ChallengeType.EQUATION_BALANCE);
      setCurrentChallenge(challenge);
      setGameMode('equation-duels');
    } catch (err) {
      console.error('Failed to start Equation Duels:', err);
    }
  };

  const startMoleDungeon = async () => {
    try {
      const challenge = await generateRandomChallenge(ChallengeType.STOICHIOMETRY);
      setCurrentChallenge(challenge);
      setGameMode('mole-dungeon');
    } catch (err) {
      console.error('Failed to start Mole Dungeon Crawler:', err);
    }
  };

  const startHydraBoss = async () => {
    try {
      // Create a special boss challenge
      const bossChallenge: Challenge = {
        id: 'hydra-boss-fight',
        realmId: 'mathmage-trials',
        type: ChallengeType.STOICHIOMETRY,
        difficulty: 5,
        title: 'Limiting Reagent Hydra Boss Fight',
        description: 'Face the mighty Hydra in an epic boss battle using limiting reagent calculations!',
        content: {
          question: 'Defeat the three-headed Hydra by solving limiting reagent problems for each head.',
          correctAnswer: 'boss-fight',
          explanation: 'This is a special boss encounter requiring mastery of limiting reagent calculations.',
          hints: ['Identify the limiting reagent first', 'Calculate moles of each reactant', 'Use stoichiometry to find product yield']
        },
        timeLimit: 600, // 10 minutes
        requiredLevel: 5,
        rewards: [
          { type: 'xp', amount: 200, description: 'Boss defeat XP' },
          { type: 'gold', amount: 100, description: 'Boss treasure' },
          { type: 'unlock', itemId: 'arcane_formulae', description: 'Arcane Formulae Reference Guide' }
        ],
        metadata: {
          concepts: ['limiting reagent', 'stoichiometry', 'boss fight'],
          curriculumStandards: ['A-Level Chemistry'],
          estimatedDuration: 600,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
      
      setCurrentChallenge(bossChallenge);
      setGameMode('hydra-boss');
    } catch (err) {
      console.error('Failed to start Hydra Boss Fight:', err);
    }
  };

  const handleGameComplete = (result: Result) => {
    // Update player stats based on result
    if (result.validation.isCorrect) {
      setPlayerStats(prev => ({
        ...prev,
        experience: prev.experience + result.experienceGained,
        completedChallenges: prev.completedChallenges + 1
      }));
    }

    // Return to menu after a short delay
    setTimeout(() => {
      setGameMode('menu');
      setCurrentChallenge(null);
    }, 3000);

    if (onComplete) {
      onComplete(result);
    }
  };

  const handleAbandonGame = () => {
    setGameMode('menu');
    setCurrentChallenge(null);
  };

  // if (loading) {
  //   return (
  //     <div className="mathmage-trials-loading">
  //       <div className="loading-spinner"></div>
  //       <p>Entering the Mathmage Trials...</p>
  //     </div>
  //   );
  // }

  if (error) {
    return (
      <div className="mathmage-trials-error">
        <h2>Failed to Enter Realm</h2>
        <p>{error}</p>
        <button onClick={onBack}>Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="mathmage-trials-realm">
      {gameMode === 'menu' && (
        <div className="realm-menu">
          {/* Realm Header */}
          <div className="realm-header">
            <div className="realm-title">
              <h1>The Mathmage Trials</h1>
              <p className="realm-description">
                Master calculation and symbol skills through combat-style chemistry games
              </p>
            </div>
            <div className="realm-stats">
              <div className="stat-item">
                <span className="stat-label">Level</span>
                <span className="stat-value">{playerStats.level}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">XP</span>
                <span className="stat-value">{playerStats.experience}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Completed</span>
                <span className="stat-value">{playerStats.completedChallenges}</span>
              </div>
            </div>
          </div>

          {/* Game Modes */}
          <div className="game-modes">
            <div className="game-mode-card" onClick={startEquationDuels}>
              <div className="game-mode-icon">⚔️</div>
              <h3>Equation Duels</h3>
              <p>
                Battle through chemical equations using mana and health points. 
                Balance equations quickly to gain mana, but beware - wrong answers 
                trigger explosive consequences!
              </p>
              <div className="game-mode-stats">
                <span className="difficulty">Difficulty: ⭐⭐⭐</span>
                <span className="rewards">Rewards: XP, Gold, Mana Crystals</span>
              </div>
              <button className="start-button">Enter Battle</button>
            </div>

            <div className="game-mode-card" onClick={startMoleDungeon}>
              <div className="game-mode-icon">🏰</div>
              <h3>Mole Dungeon Crawler</h3>
              <p>
                Navigate through stoichiometry puzzles to escape dungeon rooms. 
                Each correct calculation unlocks the next chamber in your quest 
                for the Arcane Formulae.
              </p>
              <div className="game-mode-stats">
                <span className="difficulty">Difficulty: ⭐⭐⭐⭐</span>
                <span className="rewards">Rewards: XP, Gold, Dungeon Keys</span>
              </div>
              <button className="start-button">Enter Dungeon</button>
            </div>

            <div className="game-mode-card" onClick={startHydraBoss}>
              <div className="game-mode-icon">🐉</div>
              <h3>Limiting Reagent Hydra</h3>
              <p>
                Face the mighty Hydra in an epic boss battle! Solve multi-step 
                reacting mass problems to defeat each head. Victory unlocks the 
                legendary Arcane Formulae reference.
              </p>
              <div className="game-mode-stats">
                <span className="difficulty">Difficulty: ⭐⭐⭐⭐⭐</span>
                <span className="rewards">Rewards: Arcane Formulae, Rare Items</span>
              </div>
              <button className="start-button">Challenge Boss</button>
            </div>
          </div>

          {/* Realm Progress */}
          <div className="realm-progress">
            <h3>Realm Progress</h3>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min(100, (playerStats.completedChallenges / 10) * 100)}%` }}
              ></div>
            </div>
            <p>{playerStats.completedChallenges}/10 challenges completed</p>
            
            <div className="achievements">
              <h4>Achievements</h4>
              <div className="achievement-list">
                <div className={`achievement ${playerStats.completedChallenges >= 1 ? 'unlocked' : ''}`}>
                  <span className="achievement-icon">🔥</span>
                  <span className="achievement-name">First Balance</span>
                </div>
                <div className={`achievement ${playerStats.completedChallenges >= 5 ? 'unlocked' : ''}`}>
                  <span className="achievement-icon">⚡</span>
                  <span className="achievement-name">Equation Warrior</span>
                </div>
                <div className={`achievement ${playerStats.completedChallenges >= 10 ? 'unlocked' : ''}`}>
                  <span className="achievement-icon">👑</span>
                  <span className="achievement-name">Mathmage Master</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="realm-navigation">
            <button className="back-button" onClick={onBack}>
              ← Return to Academy
            </button>
          </div>
        </div>
      )}

      {gameMode === 'equation-duels' && currentChallenge && (
        <EquationDuels
          challenge={currentChallenge}
          onComplete={handleGameComplete}
          onAbandon={handleAbandonGame}
        />
      )}

      {gameMode === 'mole-dungeon' && currentChallenge && (
        <MoleDungeonCrawler
          challenge={currentChallenge}
          onComplete={handleGameComplete}
          onAbandon={handleAbandonGame}
        />
      )}

      {gameMode === 'hydra-boss' && currentChallenge && (
        <LimitingReagentHydra
          challenge={currentChallenge}
          onComplete={handleGameComplete}
          onAbandon={handleAbandonGame}
        />
      )}
    </div>
  );
};