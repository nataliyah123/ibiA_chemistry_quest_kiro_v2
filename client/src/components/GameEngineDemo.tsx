import React, { useEffect, useState } from 'react';
import { useGameEngine } from '../hooks/useGameEngine';
import { ChallengeType } from '../types/game';

const GameEngineDemo: React.FC = () => {
  const {
    currentRealm,
    activeChallenge,
    recentResults,
    sessionStats,
    loading,
    error,
    timeElapsed,
    canSubmit,
    hasMoreHints,
    nextHintIndex,
    fetchCurrentRealm,
    generateRandomChallenge,
    submitAnswer,
    getHint,
    updateResponse,
    abandonChallenge,
    clearError
  } = useGameEngine();

  const [userResponse, setUserResponse] = useState<string>('');

  useEffect(() => {
    fetchCurrentRealm();
  }, [fetchCurrentRealm]);

  useEffect(() => {
    if (activeChallenge) {
      setUserResponse('');
    }
  }, [activeChallenge]);

  const handleResponseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setUserResponse(value);
    updateResponse(value);
  };

  const handleSubmit = () => {
    if (canSubmit) {
      submitAnswer(userResponse);
    }
  };

  const handleGetHint = () => {
    if (hasMoreHints) {
      getHint(nextHintIndex);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading.realm) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading realm...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Game Engine Demo</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button
                onClick={clearError}
                className="text-red-700 hover:text-red-900"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Current Realm Info */}
        {currentRealm && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Current Realm</h2>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">{currentRealm.name}</h3>
              <p className="text-blue-600 text-sm">{currentRealm.description}</p>
              <p className="text-blue-500 text-xs mt-1">
                Required Level: {currentRealm.requiredLevel} | 
                Challenges: {currentRealm.challenges.length}
              </p>
            </div>
          </div>
        )}

        {/* Session Stats */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Session Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{sessionStats.challengesCompleted}</div>
              <div className="text-green-500 text-sm">Completed</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{sessionStats.totalXPGained}</div>
              <div className="text-blue-500 text-sm">XP Gained</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">{sessionStats.totalGoldEarned}</div>
              <div className="text-yellow-500 text-sm">Gold Earned</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(sessionStats.averageScore)}%
              </div>
              <div className="text-purple-500 text-sm">Avg Score</div>
            </div>
          </div>
        </div>

        {/* Challenge Controls */}
        {!activeChallenge && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Start Challenge</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => generateRandomChallenge()}
                disabled={loading.challenge}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg"
              >
                {loading.challenge ? 'Loading...' : 'Random Challenge'}
              </button>
              <button
                onClick={() => generateRandomChallenge(ChallengeType.EQUATION_BALANCE)}
                disabled={loading.challenge}
                className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-lg"
              >
                Equation Balance
              </button>
              <button
                onClick={() => generateRandomChallenge(ChallengeType.STOICHIOMETRY)}
                disabled={loading.challenge}
                className="bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white px-4 py-2 rounded-lg"
              >
                Stoichiometry
              </button>
            </div>
          </div>
        )}

        {/* Active Challenge */}
        {activeChallenge && (
          <div className="mb-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {activeChallenge.challenge.title}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Difficulty: {activeChallenge.challenge.difficulty} | 
                    Type: {activeChallenge.challenge.type}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-mono text-blue-600">
                    {formatTime(timeElapsed)}
                  </div>
                  {activeChallenge.timeRemaining && (
                    <div className="text-sm text-red-500">
                      Time left: {formatTime(activeChallenge.timeRemaining)}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-gray-700 mb-2">{activeChallenge.challenge.description}</p>
                <div className="bg-white p-4 rounded border">
                  <p className="font-medium">{activeChallenge.challenge.content.question}</p>
                </div>
              </div>

              {/* Response Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Answer:
                </label>
                <textarea
                  value={userResponse}
                  onChange={handleResponseChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter your answer here..."
                />
              </div>

              {/* Challenge Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg"
                >
                  {loading.submission ? 'Submitting...' : 'Submit Answer'}
                </button>
                
                {hasMoreHints && (
                  <button
                    onClick={handleGetHint}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg"
                  >
                    Get Hint ({nextHintIndex + 1}/{activeChallenge.challenge.content.hints.length})
                  </button>
                )}
                
                <button
                  onClick={abandonChallenge}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                >
                  Abandon
                </button>
              </div>

              {/* Hints Used */}
              {activeChallenge.hintsUsed > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    Hints used: {activeChallenge.hintsUsed}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Results */}
        {recentResults.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Recent Results</h2>
            <div className="space-y-2">
              {recentResults.slice(0, 5).map((result, index) => (
                <div
                  key={`${result.challengeId}-${index}`}
                  className={`p-3 rounded-lg ${
                    result.validation.isCorrect 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className={`font-medium ${
                        result.validation.isCorrect ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {result.validation.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                      <span className="text-gray-600 text-sm ml-2">
                        Score: {result.validation.score}%
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      +{result.experienceGained} XP, +{result.goldEarned} Gold
                    </div>
                  </div>
                  {result.validation.feedback && (
                    <p className="text-sm text-gray-600 mt-1">{result.validation.feedback}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameEngineDemo;