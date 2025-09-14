import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchCharacterProfile } from '../store/characterSlice';
import ProgressBar from './ProgressBar';
import { Link } from 'react-router-dom';

interface CharacterStatsWidgetProps {
  compact?: boolean;
}

const CharacterStatsWidget: React.FC<CharacterStatsWidgetProps> = ({ compact = false }) => {
  const dispatch = useAppDispatch();
  const { stats, isLoading } = useAppSelector((state) => state.character);

  useEffect(() => {
    if (!stats && !isLoading) {
      dispatch(fetchCharacterProfile());
    }
  }, [dispatch, stats, isLoading]);

  if (isLoading || !stats) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const { character } = stats;

  if (compact) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
              {character.avatarUrl ? (
                <img 
                  src={character.avatarUrl} 
                  alt={character.characterName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                character.characterName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{character.characterName}</p>
              <p className="text-sm text-gray-500">Level {character.level}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-yellow-600">
              💰 {character.totalGold.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">
              {character.experiencePoints.toLocaleString()} XP
            </p>
          </div>
        </div>
        <div className="mt-3">
          <ProgressBar 
            progress={stats.progressToNextLevel} 
            className="h-2"
            color="bg-blue-600"
          />
          <p className="text-xs text-gray-500 mt-1">
            {stats.nextLevelXP.toLocaleString()} XP to next level
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Character Profile</h2>
        <Link
          to="/profile"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View Full Profile →
        </Link>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
          {character.avatarUrl ? (
            <img 
              src={character.avatarUrl} 
              alt={character.characterName}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            character.characterName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900">{character.characterName}</h3>
          {character.title && (
            <p className="text-purple-600 font-medium">{character.title}</p>
          )}
          <div className="flex items-center space-x-4 mt-1">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
              Level {character.level}
            </span>
            <span className="text-yellow-600 font-medium">
              💰 {character.totalGold.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Experience Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Experience Progress</span>
          <span className="text-sm text-gray-500">
            {character.experiencePoints.toLocaleString()} XP
          </span>
        </div>
        <ProgressBar 
          progress={stats.progressToNextLevel} 
          className="h-3"
          color="bg-blue-600"
        />
        <p className="text-xs text-gray-500 mt-1">
          {stats.nextLevelXP.toLocaleString()} XP to next level
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{stats.totalChallengesCompleted}</p>
          <p className="text-xs text-gray-500">Challenges</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">
            {(stats.averageAccuracy * 100).toFixed(0)}%
          </p>
          <p className="text-xs text-gray-500">Accuracy</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">{stats.badges.length}</p>
          <p className="text-xs text-gray-500">Badges</p>
        </div>
      </div>

      {/* Current Realm */}
      {character.currentRealm && (
        <div className="mt-4 p-3 bg-purple-50 rounded-lg">
          <p className="text-sm font-medium text-purple-800">
            📍 Currently exploring: {character.currentRealm}
          </p>
        </div>
      )}
    </div>
  );
};

export default CharacterStatsWidget;