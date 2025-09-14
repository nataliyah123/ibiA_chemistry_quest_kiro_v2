// Client-side daily quest types (mirrors server types)

export interface DailyQuest {
  id: string;
  userId: string;
  questType: QuestType;
  title: string;
  description: string;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  difficulty: 'easy' | 'medium' | 'hard';
  assignedDate: string;
  expiresAt: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'expired';
  progress: QuestProgress;
  completedAt?: string;
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
  startedAt?: string;
  lastUpdated: string;
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

export interface DailyQuestAssignment {
  userId: string;
  assignedDate: string;
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
  lastCompletionDate: string;
  streakType: 'daily_quest' | 'login' | 'challenge';
  multiplier: number;
  milestones: StreakMilestone[];
}

export interface StreakMilestone {
  streakLength: number;
  reward: QuestReward;
  isUnlocked: boolean;
  unlockedAt?: string;
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
  lastUpdated: string;
}

// UI-specific types
export interface QuestCardProps {
  quest: DailyQuest;
  onComplete?: (questId: string) => void;
  showProgress?: boolean;
  compact?: boolean;
}

export interface QuestProgressBarProps {
  progress: QuestProgress;
  showDetails?: boolean;
  animated?: boolean;
}

export interface StreakDisplayProps {
  streakData: StreakData;
  showMilestones?: boolean;
  compact?: boolean;
}

export interface QuestRewardDisplayProps {
  rewards: QuestReward[];
  showRarity?: boolean;
  layout?: 'horizontal' | 'vertical' | 'grid';
}

export interface QuestFilterOptions {
  status?: ('assigned' | 'in_progress' | 'completed' | 'expired')[];
  difficulty?: ('easy' | 'medium' | 'hard')[];
  questType?: QuestType[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface QuestSortOptions {
  field: 'assignedDate' | 'difficulty' | 'progress' | 'rewards';
  direction: 'asc' | 'desc';
}