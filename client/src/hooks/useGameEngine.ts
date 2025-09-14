import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import {
  fetchCurrentRealm,
  loadChallenge,
  generateRandomChallenge,
  submitAnswer,
  getHint,
  startChallenge,
  updateResponse,
  useHint,
  updateTimeRemaining,
  abandonChallenge,
  clearError,
  resetSession
} from '../store/gameSlice';
import { ChallengeType } from '../types/game';

export const useGameEngine = () => {
  const dispatch = useAppDispatch();
  const gameState = useAppSelector((state) => state.game);

  // Timer effect for active challenges
  useEffect(() => {
    if (!gameState.activeChallenge?.timeRemaining) return;

    const timer = setInterval(() => {
      const timeRemaining = gameState.activeChallenge!.timeRemaining! - 1;
      
      if (timeRemaining <= 0) {
        // Auto-submit when time runs out
        handleSubmitAnswer(gameState.activeChallenge!.currentResponse);
      } else {
        dispatch(updateTimeRemaining(timeRemaining));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.activeChallenge?.timeRemaining, dispatch]);

  // Actions
  const handleFetchCurrentRealm = useCallback(async () => {
    const result = await dispatch(fetchCurrentRealm());
    
    if (fetchCurrentRealm.fulfilled.match(result)) {
      return result.payload;
    } else {
      throw new Error('Failed to fetch current realm');
    }
  }, [dispatch]);

  const handleLoadChallenge = useCallback((challengeId: string) => {
    dispatch(loadChallenge(challengeId));
  }, [dispatch]);

  const handleGenerateRandomChallenge = useCallback(async (type?: ChallengeType, difficulty?: number) => {
    const result = await dispatch(generateRandomChallenge({ type, difficulty }));
    
    if (generateRandomChallenge.fulfilled.match(result)) {
      return result.payload;
    } else {
      throw new Error('Failed to generate challenge');
    }
  }, [dispatch]);

  const handleStartChallenge = useCallback(async (userId: string, realmId: string, challengeType: ChallengeType, difficulty: number = 1) => {
    const result = await dispatch(startChallenge({ userId, realmId, challengeType, difficulty }));
    
    if (startChallenge.fulfilled.match(result)) {
      return result.payload;
    } else {
      throw new Error('Failed to start challenge');
    }
  }, [dispatch]);

  const handleSubmitAnswer = useCallback(async (challengeId: string, response: string | string[], hintsUsed: number = 0) => {
    const result = await dispatch(submitAnswer({
      challengeId,
      response,
      hintsUsed
    }));
    
    if (submitAnswer.fulfilled.match(result)) {
      return result.payload;
    } else {
      throw new Error('Failed to submit answer');
    }
  }, [dispatch]);

  const handleSubmitCurrentAnswer = useCallback((response: string | string[]) => {
    if (!gameState.activeChallenge) return;

    const timeElapsed = Math.floor(
      (Date.now() - gameState.activeChallenge.startTime.getTime()) / 1000
    );

    dispatch(submitAnswer({
      challengeId: gameState.activeChallenge.challenge.id,
      response,
      hintsUsed: gameState.activeChallenge.hintsUsed
    }));
  }, [dispatch, gameState.activeChallenge]);

  const handleGetHint = useCallback(async (challengeId: string, hintIndex: number): Promise<string> => {
    const result = await dispatch(getHint({
      challengeId,
      hintIndex
    }));
    
    if (getHint.fulfilled.match(result)) {
      return result.payload;
    } else {
      throw new Error('Failed to get hint');
    }
  }, [dispatch]);

  const handleGetHintByIndex = useCallback((hintIndex: number) => {
    if (!gameState.activeChallenge) return;

    dispatch(getHint({
      challengeId: gameState.activeChallenge.challenge.id,
      hintIndex
    }));
  }, [dispatch, gameState.activeChallenge]);

  const handleUpdateResponse = useCallback((response: string | string[]) => {
    dispatch(updateResponse(response));
  }, [dispatch]);

  const handleUseHint = useCallback((hint: string) => {
    dispatch(useHint(hint));
  }, [dispatch]);

  const handleAbandonChallenge = useCallback(() => {
    dispatch(abandonChallenge());
  }, [dispatch]);

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleResetSession = useCallback(() => {
    dispatch(resetSession());
  }, [dispatch]);

  // Computed values
  const isLoading = gameState.loading.realm || gameState.loading.challenge || gameState.loading.submission;
  
  const timeElapsed = gameState.activeChallenge 
    ? Math.floor((Date.now() - gameState.activeChallenge.startTime.getTime()) / 1000)
    : 0;

  const canSubmit = gameState.activeChallenge && 
    gameState.activeChallenge.currentResponse !== '' && 
    !gameState.loading.submission;

  const availableHints = gameState.activeChallenge?.challenge.content.hints || [];
  const nextHintIndex = gameState.activeChallenge?.hintsUsed || 0;
  const hasMoreHints = nextHintIndex < availableHints.length;

  return {
    // State
    currentRealm: gameState.currentRealm,
    activeChallenge: gameState.activeChallenge,
    recentResults: gameState.recentResults,
    sessionStats: gameState.sessionStats,
    loading: gameState.loading,
    error: gameState.error,
    isLoading,
    timeElapsed,
    canSubmit,
    availableHints,
    nextHintIndex,
    hasMoreHints,

    // Actions
    getCurrentRealm: handleFetchCurrentRealm,
    fetchCurrentRealm: handleFetchCurrentRealm,
    loadChallenge: handleLoadChallenge,
    generateRandomChallenge: handleGenerateRandomChallenge,
    startChallenge: handleStartChallenge,
    submitAnswer: handleSubmitAnswer,
    submitCurrentAnswer: handleSubmitCurrentAnswer,
    getHint: handleGetHint,
    getHintByIndex: handleGetHintByIndex,
    updateResponse: handleUpdateResponse,
    useHint: handleUseHint,
    abandonChallenge: handleAbandonChallenge,
    clearError: handleClearError,
    resetSession: handleResetSession
  };
};