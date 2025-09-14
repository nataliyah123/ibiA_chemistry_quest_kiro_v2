import React, { useState, useEffect } from 'react';
import { Challenge, Result, ChallengeType } from '../../types/game';
import { useGameEngine } from '../../hooks/useGameEngine';
import { NamingArena } from '../games/NamingArena';
import { MechanismArchery } from '../games/MechanismArchery';
import { IsomerZoo } from '../games/IsomerZoo';
import './ForestOfIsomersRealm.css';

interface ForestOfIsomersRealmProps {
  onComplete?: (result: Result) => void;
  onBack?: () => void;
}

type GameMode = 'menu' | 'naming-arena' | 'mechanism-archery' | 'isomer-zoo';

export const ForestOfIsomersRealm: React.FC<ForestOfIsomersRealmProps> = ({
  onComplete,
  onBack
}) => {
  const { getCurrentRealm, generateRandomChallenge, loading, error } = useGameEngine();
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [realmData, setRealmData] = useState<any>(null);
  const [playerStats, setPlayerStats] = useState({
    level: 8,
    experience: 0,
    completedChallenges: 0,
    namingStreak: 0,
    mechanismAccuracy: 0,
    isomerIdentifications: 0
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

  const startNamingArena = async () => {
    try {
      const challenge = await generateRandomChallenge(ChallengeType.ORGANIC_NAMING);
      setCurrentChallenge(challenge);
      setGameMode('naming-arena');
    } catch (err) {
      console.error('Failed to start Naming Arena:', err);
    }
  };

  const startMechanismArchery = async () => {
    try {
      const challenge = await generateRandomChallenge(ChallengeType.MECHANISM);
      setCurrentChallenge(challenge);
      setGameMode('mechanism-archery');
    } catch (err) {
      console.error('Failed to start Mechanism Archery:', err);
    }
  };

  const startIsomerZoo = async () => {
    try {
      const challenge = await generateRandomChallenge(ChallengeType.ISOMER_IDENTIFICATION);
      setCurrentChallenge(challenge);
      setGameMode('isomer-zoo');
    } catch (err) {
      console.error('Failed to start Isomer Zoo:', err);
    }
  };

  const handleGameComplete = (result: Result) => {
    // Update player stats based on result
    if (result.validation.isCorrect) {
      setPlayerStats(prev => ({
        ...prev,
        experience: prev.experience + result.experienceGained,
        completedChallenges: prev.completedChallenges + 1,
        namingStreak: gameMode === 'naming-arena' ? prev.namingStreak + 1 : prev.namingStreak,
        mechanismAccuracy: gameMode === 'mechanism-archery' ? 
          Math.max(prev.mechanismAccuracy, result.validation.partialCredit || 0) : prev.mechanismAccuracy,
        isomerIdentifications: gameMode === 'isomer-zoo' ? prev.isomerIdentifications + 1 : prev.isomerIdentifications
      }));
    } else {
      // Reset naming streak on incorrect answer
      if (gameMode === 'naming-arena') {
        setPlayerStats(prev => ({
          ...prev,
          namingStreak: 0
        }));
      }
      // Update mechanism accuracy even on incorrect answers
      if (gameMode === 'mechanism-archery') {
        setPlayerStats(prev => ({
          ...prev,
          mechanismAccuracy: Math.max(prev.mechanismAccuracy, result.validation.partialCredit || 0)
        }));
      }
      // Update isomer identifications even on incorrect answers
      if (gameMode === 'isomer-zoo') {
        setPlayerStats(prev => ({
          ...prev,
          isomerIdentifications: prev.isomerIdentifications + 1
        }));
      }
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
  //     <div className="forest-of-isomers-loading">
  //       <div className="loading-spinner"></div>
  //       <p>Entering the Forest of Isomers...</p>
  //     </div>
  //   );
  // }

  if (error) {
    return (
      <div className="forest-of-isomers-error">
        <h2>Failed to Enter Realm</h2>
        <p>{error}</p>
        <button onClick={onBack}>Return to Academy</button>
      </div>
    );
  }

  return (
    <div className="forest-of-isomers-realm">
      {gameMode === 'menu' && (
        <div className="realm-menu">
          {/* Realm Header */}
          <div className="realm-header">
            <div className="realm-title">
              <h1>🌲 The Forest of Isomers</h1>
              <p className="realm-description">
                Master organic chemistry through interactive naming, mechanism, and isomer challenges
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
                <span className="stat-label">Naming Streak</span>
                <span className="stat-value">{playerStats.namingStreak}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Mechanism Acc.</span>
                <span className="stat-value">{Math.round(playerStats.mechanismAccuracy * 100)}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Completed</span>
                <span className="stat-value">{playerStats.completedChallenges}</span>
              </div>
            </div>
          </div>

          {/* Game Modes */}
          <div className="game-modes">
            <div className="game-mode-card available" onClick={startNamingArena}>
              <div className="game-mode-icon">🏹</div>
              <h3>Naming Arena</h3>
              <p>
                Battle against time as vines slowly strangle you! Name organic molecules 
                using IUPAC nomenclature before the forest claims you. Build naming 
                streaks for bonus points.
              </p>
              <div className="game-mode-stats">
                <span className="difficulty">Difficulty: ⭐⭐⭐</span>
                <span className="rewards">Rewards: XP, Streak Bonuses</span>
              </div>
              <button className="start-button">Enter Arena</button>
            </div>

            <div className="game-mode-card available" onClick={startMechanismArchery}>
              <div className="game-mode-icon">🏹</div>
              <h3>Mechanism Archery</h3>
              <p>
                Shoot arrows to show electron movement in organic reactions! Master 
                SN1, SN2, elimination, and addition mechanisms by accurately targeting 
                atoms with electron-pushing arrows.
              </p>
              <div className="game-mode-stats">
                <span className="difficulty">Difficulty: ⭐⭐⭐⭐</span>
                <span className="rewards">Rewards: XP, Mechanism Mastery</span>
              </div>
              <button className="start-button">Enter Archery Range</button>
            </div>

            <div className="game-mode-card available" onClick={startIsomerZoo}>
              <div className="game-mode-icon">🦋</div>
              <h3>Isomer Zoo</h3>
              <p>
                Catch floating molecular structures and categorize them by isomer type! 
                Identify structural isomers, stereoisomers, enantiomers, and more. 
                Unlock the Elixir of Clarity for animated reaction pathways.
              </p>
              <div className="game-mode-stats">
                <span className="difficulty">Difficulty: ⭐⭐⭐⭐⭐</span>
                <span className="rewards">Rewards: Elixir of Clarity, Rare Items</span>
              </div>
              <button className="start-button">Enter Zoo</button>
            </div>
          </div>

          {/* Realm Progress */}
          <div className="realm-progress">
            <h3>Forest Exploration Progress</h3>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min(100, (playerStats.completedChallenges / 15) * 100)}%` }}
              ></div>
            </div>
            <p>{playerStats.completedChallenges}/15 challenges completed</p>
            
            <div className="achievements">
              <h4>Forest Achievements</h4>
              <div className="achievement-list">
                <div className={`achievement ${playerStats.completedChallenges >= 1 ? 'unlocked' : ''}`}>
                  <span className="achievement-icon">🌱</span>
                  <span className="achievement-name">First Naming</span>
                </div>
                <div className={`achievement ${playerStats.namingStreak >= 5 ? 'unlocked' : ''}`}>
                  <span className="achievement-icon">🔥</span>
                  <span className="achievement-name">Naming Streak</span>
                </div>
                <div className={`achievement ${playerStats.completedChallenges >= 10 ? 'unlocked' : ''}`}>
                  <span className="achievement-icon">🧪</span>
                  <span className="achievement-name">Organic Master</span>
                </div>
                <div className={`achievement ${playerStats.completedChallenges >= 15 ? 'unlocked' : ''}`}>
                  <span className="achievement-icon">👑</span>
                  <span className="achievement-name">Forest Guardian</span>
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

      {gameMode === 'naming-arena' && currentChallenge && (
        <NamingArena
          challenge={currentChallenge}
          onComplete={handleGameComplete}
          onAbandon={handleAbandonGame}
        />
      )}

      {gameMode === 'mechanism-archery' && currentChallenge && (
        <MechanismArchery
          challenge={currentChallenge}
          onComplete={handleGameComplete}
          onAbandon={handleAbandonGame}
        />
      )}

      {gameMode === 'isomer-zoo' && currentChallenge && (
        <IsomerZoo
          challenge={currentChallenge}
          onComplete={handleGameComplete}
          onAbandon={handleAbandonGame}
        />
      )}
    </div>
  );
};