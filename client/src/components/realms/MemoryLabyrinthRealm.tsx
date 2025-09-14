import React, { useState, useEffect } from 'react';
import { Challenge, Result, ChallengeType } from '../../types/game';
import { useGameEngine } from '../../hooks/useGameEngine';
import { FlashcardMatch } from '../games/FlashcardMatch';
import { QARouletteWheel } from '../games/QARouletteWheel';
import { SurvivalMode } from '../games/SurvivalMode';
import { AlchemistsGrimoire } from '../games/AlchemistsGrimoire';
import './MemoryLabyrinthRealm.css';

interface MemoryLabyrinthRealmProps {
  onComplete?: (result: Result) => void;
  onBack?: () => void;
}

type GameMode = 'menu' | 'flashcard-match' | 'qa-roulette' | 'survival-mode' | 'grimoire';

const MemoryLabyrinthRealm: React.FC<MemoryLabyrinthRealmProps> = ({
  onComplete,
  onBack
}) => {
  const { getCurrentRealm, generateRandomChallenge, loading, error } = useGameEngine();
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [realmData, setRealmData] = useState<any>(null);
  const [playerStats, setPlayerStats] = useState({
    level: 3,
    experience: 150,
    completedChallenges: 0,
    unlockedMnemonics: [] as string[],
    memoryMastery: 0
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

  const startFlashcardMatch = async () => {
    try {
      const challenge = await generateRandomChallenge(ChallengeType.MEMORY_MATCH);
      setCurrentChallenge(challenge);
      setGameMode('flashcard-match');
    } catch (err) {
      console.error('Failed to start Flashcard Match:', err);
    }
  };

  const startQARouletteWheel = async () => {
    try {
      const challenge = await generateRandomChallenge(ChallengeType.QUICK_RECALL);
      setCurrentChallenge(challenge);
      setGameMode('qa-roulette');
    } catch (err) {
      console.error('Failed to start QA Roulette:', err);
    }
  };

  const startSurvivalMode = async () => {
    try {
      const challenge = await generateRandomChallenge(ChallengeType.SURVIVAL);
      setCurrentChallenge(challenge);
      setGameMode('survival-mode');
    } catch (err) {
      console.error('Failed to start Survival Mode:', err);
    }
  };

  const openGrimoire = () => {
    setGameMode('grimoire');
  };

  const handleGameComplete = (result: Result) => {
    // Update player stats based on result
    if (result.validation.isCorrect) {
      const newMnemonics = [...playerStats.unlockedMnemonics];
      
      // Unlock mnemonics based on challenge completion
      if (result.challengeId.includes('memory_match') && !newMnemonics.includes('gas_tests_1')) {
        newMnemonics.push('gas_tests_1');
      }
      if (result.challengeId.includes('quick_recall') && !newMnemonics.includes('gas_tests_2')) {
        newMnemonics.push('gas_tests_2');
      }
      if (result.challengeId.includes('survival') && !newMnemonics.includes('gas_tests_3')) {
        newMnemonics.push('gas_tests_3');
      }
      
      // Unlock more mnemonics based on total completed challenges
      const totalCompleted = playerStats.completedChallenges + 1;
      if (totalCompleted >= 5 && !newMnemonics.includes('periodic_trends_1')) {
        newMnemonics.push('periodic_trends_1');
      }
      if (totalCompleted >= 8 && !newMnemonics.includes('periodic_trends_2')) {
        newMnemonics.push('periodic_trends_2');
      }
      if (totalCompleted >= 10 && !newMnemonics.includes('solubility_1')) {
        newMnemonics.push('solubility_1');
      }

      setPlayerStats(prev => ({
        ...prev,
        experience: prev.experience + result.experienceGained,
        completedChallenges: prev.completedChallenges + 1,
        unlockedMnemonics: newMnemonics,
        memoryMastery: Math.min(100, prev.memoryMastery + 10)
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

  const handleCloseGrimoire = () => {
    setGameMode('menu');
  };

  // if (loading) {
  //   return (
  //     <div className="memory-labyrinth-loading">
  //       <div className="loading-spinner"></div>
  //       <p>Entering the Memory Labyrinth...</p>
  //     </div>
  //   );
  // }

  if (error) {
    return (
      <div className="memory-labyrinth-error">
        <h2>Failed to Enter Realm</h2>
        <p>{error}</p>
        <button onClick={onBack}>Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="memory-labyrinth-realm">
      {gameMode === 'menu' && (
        <div className="realm-menu">
          {/* Realm Header */}
          <div className="realm-header">
            <div className="realm-title">
              <h1>🧠 The Memory Labyrinth</h1>
              <p className="realm-description">
                Master memorization through interactive games and unlock animated mnemonics
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
              <div className="stat-item">
                <span className="stat-label">Memory Mastery</span>
                <span className="stat-value">{playerStats.memoryMastery}%</span>
              </div>
            </div>
          </div>

          {/* Game Modes */}
          <div className="game-modes">
            <div className="game-mode-card" onClick={startFlashcardMatch}>
              <div className="game-mode-icon">🃏</div>
              <h3>Flashcard Match</h3>
              <p>
                Match gas tests and flame colors with their results. Build combos 
                for bonus points and test your memory skills in this fast-paced 
                matching game!
              </p>
              <div className="game-mode-stats">
                <span className="difficulty">Difficulty: ⭐⭐⭐</span>
                <span className="rewards">Rewards: XP, Gold, Memory Crystals</span>
              </div>
              <button className="start-button">Start Matching</button>
            </div>

            <div className="game-mode-card" onClick={startQARouletteWheel}>
              <div className="game-mode-icon">🎰</div>
              <h3>QA Roulette</h3>
              <p>
                Spin the wheel and quickly recite ion test procedures! Answer 
                as many as you can before making a mistake. Speed and accuracy 
                are key to survival.
              </p>
              <div className="game-mode-stats">
                <span className="difficulty">Difficulty: ⭐⭐⭐⭐</span>
                <span className="rewards">Rewards: XP, Gold, Speed Bonuses</span>
              </div>
              <button className="start-button">Spin the Wheel</button>
            </div>

            <div className="game-mode-card" onClick={startSurvivalMode}>
              <div className="game-mode-icon">💀</div>
              <h3>Survival Mode</h3>
              <p>
                Answer solubility rule questions continuously with only 3 lives. 
                How long can you survive? Difficulty increases as you progress 
                through the challenge.
              </p>
              <div className="game-mode-stats">
                <span className="difficulty">Difficulty: ⭐⭐⭐⭐⭐</span>
                <span className="rewards">Rewards: Survival Bonuses, Rare Items</span>
              </div>
              <button className="start-button">Enter Survival</button>
            </div>

            <div className="game-mode-card special" onClick={openGrimoire}>
              <div className="game-mode-icon">📚</div>
              <h3>Alchemist's Grimoire</h3>
              <p>
                View your collection of unlocked animated mnemonics. These 
                memory aids help you remember key chemistry concepts with 
                visual and verbal cues.
              </p>
              <div className="game-mode-stats">
                <span className="unlocked">
                  {playerStats.unlockedMnemonics.length}/15 mnemonics unlocked
                </span>
                <span className="collection">Memory Aid Collection</span>
              </div>
              <button className="start-button grimoire-button">Open Grimoire</button>
            </div>
          </div>

          {/* Realm Progress */}
          <div className="realm-progress">
            <h3>Memory Mastery Progress</h3>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${playerStats.memoryMastery}%` }}
              ></div>
            </div>
            <p>{playerStats.memoryMastery}/100 mastery points</p>
            
            <div className="achievements">
              <h4>Memory Achievements</h4>
              <div className="achievement-list">
                <div className={`achievement ${playerStats.completedChallenges >= 1 ? 'unlocked' : ''}`}>
                  <span className="achievement-icon">🧠</span>
                  <span className="achievement-name">First Memory</span>
                </div>
                <div className={`achievement ${playerStats.completedChallenges >= 5 ? 'unlocked' : ''}`}>
                  <span className="achievement-icon">🎯</span>
                  <span className="achievement-name">Memory Adept</span>
                </div>
                <div className={`achievement ${playerStats.unlockedMnemonics.length >= 5 ? 'unlocked' : ''}`}>
                  <span className="achievement-icon">📖</span>
                  <span className="achievement-name">Mnemonic Collector</span>
                </div>
                <div className={`achievement ${playerStats.memoryMastery >= 100 ? 'unlocked' : ''}`}>
                  <span className="achievement-icon">👑</span>
                  <span className="achievement-name">Memory Master</span>
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

      {gameMode === 'flashcard-match' && currentChallenge && (
        <FlashcardMatch
          challenge={currentChallenge}
          onComplete={handleGameComplete}
          onAbandon={handleAbandonGame}
        />
      )}

      {gameMode === 'qa-roulette' && currentChallenge && (
        <QARouletteWheel
          challenge={currentChallenge}
          onComplete={handleGameComplete}
          onAbandon={handleAbandonGame}
        />
      )}

      {gameMode === 'survival-mode' && currentChallenge && (
        <SurvivalMode
          challenge={currentChallenge}
          onComplete={handleGameComplete}
          onAbandon={handleAbandonGame}
        />
      )}

      {gameMode === 'grimoire' && (
        <AlchemistsGrimoire
          unlockedMnemonics={playerStats.unlockedMnemonics}
          onClose={handleCloseGrimoire}
        />
      )}
    </div>
  );
};

export default MemoryLabyrinthRealm;