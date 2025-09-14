// Daily quest and reward system types

export interface DailyQuest {
  id: string;
  userId: string;
  questType: QuestType;
  title: string;
  description: string;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  difficulty: 'easy' | 'medium' | 'hard';
  assignedDate: Date;
  expiresAt: Date;
  status: 'assigned' | 'in_progress' | 'completed' | 'expired';
  progress: QuestProgress;
  completedAt?: Date;
  metadata: QuestMetadata;
}

export interface QuestObjective {
  id: string;
  type: ObjectiveType;
  target: number;
  current: number;
  description: string;
  isCompleted: boolean;
  realmId?: string;
  challengeType?: string;
  specificCriteria?: any;
}

export interface QuestReward {
  type: 'xp' | 'gold' | 'badge' | 'item' | 'streak_multiplier';
  amount?: number;
  itemId?: string;
  description: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface QuestProgress {
  overallProgress: number; // 0-100 percentage
  objectivesCompleted: number;
  totalObjectives: number;
  startedAt?: Date;
  lastUpdated: Date;
}

export interface QuestMetadata {
  generatedBy: 'system' | 'event' | 'manual';
  templateId?: string;
  seasonalEvent?: string;
  difficultyModifiers: DifficultyModifier[];
  tags: string[];
}

export interface DifficultyModifier {
  type: 'time_limit' | 'accuracy_requirement' | 'streak_requirement' | 'realm_restriction';
  value: any;
  description: string;
}

export enum QuestType {
  DAILY_CHALLENGE = 'daily_challenge',
  SKILL_FOCUS = 'skill_focus',
  REALM_EXPLORER = 'realm_explorer',
  SPEED_DEMON = 'speed_demon',
  ACCURACY_MASTER = 'accuracy_master',
  STREAK_KEEPER = 'streak_keeper',
  SOCIAL_BUTTERFLY = 'social_butterfly',
  BOSS_HUNTER = 'boss_hunter',
  COLLECTION_QUEST = 'collection_quest',
  SEASONAL_EVENT = 'seasonal_event'
}

export enum ObjectiveType {
  COMPLETE_CHALLENGES = 'complete_challenges',
  ACHIEVE_ACCURACY = 'achieve_accuracy',
  COMPLETE_IN_TIME = 'complete_in_time',
  EARN_XP = 'earn_xp',
  EARN_GOLD = 'earn_gold',
  DEFEAT_BOSS = 'defeat_boss',
  MAINTAIN_STREAK = 'maintain_streak',
  VISIT_REALMS = 'visit_realms',
  HELP_FRIENDS = 'help_friends',
  COLLECT_ITEMS = 'collect_items',
  MASTER_CONCEPT = 'master_concept'
}

export interface QuestTemplate {
  id: string;
  name: string;
  questType: QuestType;
  difficulty: 'easy' | 'medium' | 'hard';
  titleTemplate: string;
  descriptionTemplate: string;
  objectiveTemplates: ObjectiveTemplate[];
  rewardTemplates: RewardTemplate[];
  requirements: QuestRequirement[];
  weight: number; // Probability weight for selection
  cooldownDays: number; // Days before this template can be used again
  tags: string[];
}

export interface ObjectiveTemplate {
  type: ObjectiveType;
  targetRange: { min: number; max: number };
  descriptionTemplate: string;
  realmIds?: string[];
  challengeTypes?: string[];
  criteria?: any;
}

export interface RewardTemplate {
  type: 'xp' | 'gold' | 'badge' | 'item' | 'streak_multiplier';
  amountRange?: { min: number; max: number };
  itemPool?: string[];
  description: string;
  probability?: number; // 0-1, for optional rewards
}

export interface QuestRequirement {
  type: 'min_level' | 'completed_realm' | 'has_badge' | 'streak_length' | 'friend_count';
  value: any;
  description: string;
}

export interface DailyQuestAssignment {
  userId: string;
  assignedDate: Date;
  quests: DailyQuest[];
  streakBonus: number;
  totalPossibleRewards: QuestReward[];
}

export interface QuestCompletionResult {
  quest: DailyQuest;
  rewards: QuestReward[];
  bonusRewards: QuestReward[];
  streakUpdated: boolean;
  newAchievements: string[];
  nextQuestUnlocked?: DailyQuest;
}

export interface StreakData {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletionDate: Date;
  streakType: 'daily_quest' | 'login' | 'challenge';
  multiplier: number;
  milestones: StreakMilestone[];
}

export interface StreakMilestone {
  streakLength: number;
  reward: QuestReward;
  isUnlocked: boolean;
  unlockedAt?: Date;
}

export interface QuestAnalytics {
  userId: string;
  totalQuestsCompleted: number;
  questCompletionRate: number;
  favoriteQuestTypes: QuestType[];
  averageCompletionTime: number;
  streakData: StreakData;
  rewardsEarned: {
    totalXP: number;
    totalGold: number;
    badgesEarned: number;
    itemsCollected: number;
  };
  lastUpdated: Date;
}

// Quest generation configuration
export interface QuestGenerationConfig {
  maxDailyQuests: number;
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  questTypeWeights: { [key in QuestType]: number };
  seasonalModifiers: SeasonalModifier[];
  personalizedWeights: boolean;
}

export interface SeasonalModifier {
  name: string;
  startDate: Date;
  endDate: Date;
  questTypeBoosts: { [key in QuestType]?: number };
  rewardMultipliers: { [key: string]: number };
  specialTemplates: string[];
}

// Quest validation and progression
export interface QuestValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestedModifications: string[];
}

export interface QuestProgressUpdate {
  questId: string;
  objectiveId: string;
  progressIncrement: number;
  metadata?: any;
  timestamp: Date;
}