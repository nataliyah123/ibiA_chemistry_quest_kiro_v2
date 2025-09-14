import React, { useState } from 'react';
import { useCharacterProgression } from '../hooks/useCharacterProgression';
import XPAnimation from './XPAnimation';

const CharacterProgressionDemo: React.FC = () => {
  const { showXPAnimation, lastXPGained, awardXP, calculateAndAwardXP, hideXPAnimation } = useCharacterProgression();
  const [isAwarding, setIsAwarding] = useState(false);

  const handleAwardXP = async (amount: number) => {
    setIsAwarding(true);
    try {
      await awardXP(amount, 'demo');
    } finally {
      setIsAwarding(false);
    }
  };

  const handleChallengeComplete = async () => {
    setIsAwarding(true);
    try {
      await calculateAndAwardXP({
        accuracy: 0.9,
        timeElapsed: 30,
        timeLimit: 60,
        isFirstAttempt: true,
        currentStreak: 2
      });
    } finally {
      setIsAwarding(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Character Progression Demo</h2>
      <p className="text-gray-600 mb-6">
        Test the character progression system by awarding XP and seeing the animations.
      </p>
      
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleAwardXP(10)}
            disabled={isAwarding}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Award 10 XP
          </button>
          <button
            onClick={() => handleAwardXP(25)}
            disabled={isAwarding}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Award 25 XP
          </button>
          <button
            onClick={() => handleAwardXP(50)}
            disabled={isAwarding}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Award 50 XP
          </button>
          <button
            onClick={handleChallengeComplete}
            disabled={isAwarding}
            className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Complete Challenge (Calculated XP)
          </button>
        </div>
        
        {isAwarding && (
          <div className="flex items-center text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Awarding XP...
          </div>
        )}
      </div>

      {/* XP Animation */}
      {showXPAnimation && (
        <XPAnimation
          xpGained={lastXPGained}
          onComplete={hideXPAnimation}
          duration={2000}
        />
      )}
    </div>
  );
};

export default CharacterProgressionDemo;