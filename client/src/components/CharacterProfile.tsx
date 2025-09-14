import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { 
  fetchCharacterProfile, 
  updateCharacterProfile, 
  clearError 
} from '../store/characterSlice';
import { CharacterUpdateData, RARITY_COLORS, RARITY_LABELS } from '../types/character';
import LevelUpModal from './LevelUpModal';
import ProgressBar from './ProgressBar';
import BadgeDisplay from './BadgeDisplay';

const CharacterProfile: React.FC = () => {
  const dispatch = useAppDispatch();
  const { stats, isLoading, error, showLevelUpModal, lastLevelUp } = useAppSelector(
    (state) => state.character
  );
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<CharacterUpdateData>({
    characterName: '',
    title: '',
    avatarUrl: ''
  });

  useEffect(() => {
    dispatch(fetchCharacterProfile());
  }, [dispatch]);

  useEffect(() => {
    if (stats) {
      setEditForm({
        characterName: stats.character.characterName,
        title: stats.character.title || '',
        avatarUrl: stats.character.avatarUrl || ''
      });
    }
  }, [stats]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(updateCharacterProfile(editForm)).unwrap();
      setIsEditing(false);
    } catch (error) {
      // Error is handled by the slice
    }
  };

  const handleEditCancel = () => {
    if (stats) {
      setEditForm({
        characterName: stats.character.characterName,
        title: stats.character.title || '',
        avatarUrl: stats.character.avatarUrl || ''
      });
    }
    setIsEditing(false);
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Character Not Found</h2>
          <p className="text-gray-600">Unable to load character profile.</p>
        </div>
      </div>
    );
  }

  const { character, badges, totalChallengesCompleted, averageAccuracy, totalTimeSpent } = stats;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Character Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {character.avatarUrl ? (
                <img 
                  src={character.avatarUrl} 
                  alt={character.characterName}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                character.characterName.charAt(0).toUpperCase()
              )}
            </div>
          </div>

          {/* Character Info */}
          <div className="flex-1">
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Character Name</label>
                  <input
                    type="text"
                    value={editForm.characterName}
                    onChange={(e) => setEditForm({ ...editForm, characterName: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Novice Alchemist"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Avatar URL</label>
                  <input
                    type="url"
                    value={editForm.avatarUrl}
                    onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleEditCancel}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-bold text-gray-900">{character.characterName}</h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-blue-600 hover:text-blue-800 focus:outline-none"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
                {character.title && (
                  <p className="text-lg text-purple-600 font-medium">{character.title}</p>
                )}
                <div className="flex items-center space-x-4 mt-2">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    Level {character.level}
                  </span>
                  <span className="text-yellow-600 font-medium">
                    💰 {character.totalGold.toLocaleString()} Gold
                  </span>
                  {character.currentRealm && (
                    <span className="text-purple-600 font-medium">
                      📍 {character.currentRealm}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Experience Progress */}
        {!isEditing && (
          <div className="mt-6">
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
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Challenges Completed</p>
              <p className="text-2xl font-bold text-gray-900">{totalChallengesCompleted}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average Accuracy</p>
              <p className="text-2xl font-bold text-gray-900">
                {(averageAccuracy * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Time Spent</p>
              <p className="text-2xl font-bold text-gray-900">{formatTime(totalTimeSpent)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Badges & Achievements ({badges.length})
        </h2>
        {badges.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {badges.map((badge) => (
              <BadgeDisplay key={badge.id} badge={badge} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-gray-500">No badges earned yet</p>
            <p className="text-sm text-gray-400 mt-1">Complete challenges to earn your first badge!</p>
          </div>
        )}
      </div>

      {/* Level Up Modal */}
      {showLevelUpModal && lastLevelUp && (
        <LevelUpModal levelUpResult={lastLevelUp} />
      )}
    </div>
  );
};

export default CharacterProfile;