import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '../hooks/redux';
import { hideLevelUpModal } from '../store/characterSlice';
import { LevelUpResult } from '../types/character';
import BadgeDisplay from './BadgeDisplay';

interface LevelUpModalProps {
  levelUpResult: LevelUpResult;
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({ levelUpResult }) => {
  const dispatch = useAppDispatch();
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => setShowAnimation(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setShowAnimation(false);
    setTimeout(() => {
      dispatch(hideLevelUpModal());
    }, 300);
  };

  const {
    newLevel,
    experienceGained,
    totalExperience,
    goldBonus,
    unlockedFeatures,
    badgesEarned
  } = levelUpResult;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-lg shadow-2xl max-w-md w-full transform transition-all duration-300 ${
          showAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-6 rounded-t-lg text-center">
          <div className="text-6xl mb-2">🎉</div>
          <h2 className="text-2xl font-bold mb-1">Level Up!</h2>
          <p className="text-yellow-100">
            Congratulations! You've reached level {newLevel}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* XP and Gold Rewards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                +{experienceGained.toLocaleString()}
              </div>
              <div className="text-sm text-blue-800">Experience Points</div>
              <div className="text-xs text-gray-500 mt-1">
                Total: {totalExperience.toLocaleString()} XP
              </div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                +{goldBonus.toLocaleString()}
              </div>
              <div className="text-sm text-yellow-800">Gold Bonus</div>
              <div className="text-xs text-gray-500 mt-1">Level up reward</div>
            </div>
          </div>

          {/* New Badges */}
          {badgesEarned.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                New Badges Earned!
              </h3>
              <div className="flex flex-wrap gap-3 justify-center">
                {badgesEarned.map((badge) => (
                  <div key={badge.id} className="text-center">
                    <BadgeDisplay badge={badge} size="medium" showTooltip={false} />
                    <p className="text-xs text-gray-600 mt-1 max-w-16 truncate">
                      {badge.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unlocked Features */}
          {unlockedFeatures.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                New Features Unlocked!
              </h3>
              <div className="space-y-2">
                {unlockedFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center p-3 bg-green-50 rounded-lg"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">{feature}</p>
                      <p className="text-xs text-green-600">Now available to explore!</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Motivational Message */}
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-purple-800 font-medium">
              Keep up the great work, Alchemist!
            </p>
            <p className="text-sm text-purple-600 mt-1">
              Your dedication to mastering chemistry is paying off.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Continue Your Journey
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelUpModal;