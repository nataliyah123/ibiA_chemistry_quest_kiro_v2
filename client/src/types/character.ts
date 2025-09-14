export interface Character {
  id: string;
  userId: string;
  characterName: string;
  level: number;
  experiencePoints: number;
  totalGold: number;
  currentRealm?: string;
  avatarUrl?: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt: string;
}

export interface InventoryItem {
  id: string;
  type: 'badge' | 'grimoire' | 'formula_sheet' | 'collectible';
  name: string;
  description: string;
  iconUrl?: string;
  rarity?: string;
  earnedAt: string;
  metadata?: Record<string, any>;
}

export interface CharacterStats {
  character: Character;
  badges: Badge[];
  totalChallengesCompleted: number;
  averageAccuracy: number;
  totalTimeSpent: number;
  favoriteRealm: string | null;
  currentStreak: number;
  longestStreak: number;
  rank: number;
  nextLevelXP: number;
  progressToNextLevel: number;
}

export interface LevelUpResult {
  newLevel: number;
  experienceGained: number;
  totalExperience: number;
  goldBonus: number;
  unlockedFeatures: string[];
  badgesEarned: Badge[];
}

export interface XPReward {
  xpReward: number;
  breakdown: {
    baseXP: number;
    timeBonus: number;
    firstAttemptBonus: number;
    streakMultiplier: number;
  };
}

export interface CharacterUpdateData {
  characterName?: string;
  avatarUrl?: string;
  title?: string;
}

export const RARITY_COLORS = {
  common: '#9CA3AF',
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#F59E0B'
} as const;

export const RARITY_LABELS = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary'
} as const;