import { useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import { awardExperience, updateExperienceOptimistic } from '../store/characterSlice';
import { CharacterAPI } from '../services/characterApi';

interface UseCharacterProgressionReturn {
  showXPAnimation: boolean;
  lastXPGained: number;
  awardXP: (xpAmount: number, source?: string) => Promise<void>;
  calculateAndAwardXP: (challengeData: {
    accuracy: number;
    timeElapsed: number;
    timeLimit?: number;
    isFirstAttempt?: boolean;
    currentStreak?: number;
  }) => Promise<void>;
  hideXPAnimation: () => void;
}

export const useCharacterProgression = (): UseCharacterProgressionReturn => {
  const dispatch = useAppDispatch();
  const { stats } = useAppSelector((state) => state.character);
  
  const [showXPAnimation, setShowXPAnimation] = useState(false);
  const [lastXPGained, setLastXPGained] = useState(0);

  const hideXPAnimation = useCallback(() => {
    setShowXPAnimation(false);
    setLastXPGained(0);
  }, []);

  const awardXP = useCallback(async (xpAmount: number, source = 'challenge_completion') => {
    try {
      // Show optimistic update immediately
      dispatch(updateExperienceOptimistic(xpAmount));
      
      // Show XP animation
      setLastXPGained(xpAmount);
      setShowXPAnimation(true);
      
      // Award XP on server
      await dispatch(awardExperience({ xpAmount, source })).unwrap();
      
    } catch (error) {
      console.error('Failed to award XP:', error);
      // Revert optimistic update by refetching character data
      // The error will be handled by the slice
    }
  }, [dispatch]);

  const calculateAndAwardXP = useCallback(async (challengeData: {
    accuracy: number;
    timeElapsed: number;
    timeLimit?: number;
    isFirstAttempt?: boolean;
    currentStreak?: number;
  }) => {
    try {
      // Calculate XP reward
      const xpReward = await CharacterAPI.calculateXPReward(challengeData);
      
      // Award the calculated XP
      await awardXP(xpReward.xpReward, 'challenge_completion');
      
    } catch (error) {
      console.error('Failed to calculate and award XP:', error);
    }
  }, [awardXP]);

  return {
    showXPAnimation,
    lastXPGained,
    awardXP,
    calculateAndAwardXP,
    hideXPAnimation
  };
};