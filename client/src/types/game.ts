// Client-side game types (mirrors server types)

export interface Challenge {
  id: string;
  realmId: string;
  type: ChallengeType;
  difficulty: number;
  title: string;
  description: string;
  content: ChallengeContent;
  timeLimit?: number;
  requiredLevel: number;
  rewards: Reward[];
  metadata: ChallengeMetadata;
}

export interface ChallengeContent {
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  hints: string[];
  visualAids?: VisualAid[];
}

export interface VisualAid {
  type: 'image' | 'animation' | 'diagram' | 'molecular_structure';
  url: string;
  altText: string;
  interactive?: boolean;
}

export interface ChallengeMetadata {
  concepts: string[];
  curriculumStandards: string[];
  estimatedDuration: number;
  createdAt: string;
  updatedAt: string;
  gameData?: any; // Additional game-specific data
  gameSpecific?: any; // Game-specific data for challenges
}

export interface Reward {
  type: 'xp' | 'gold' | 'badge' | 'item' | 'unlock';
  amount?: number;
  itemId?: string;
  description: string;
}

export interface Answer {
  challengeId?: string;
  userId?: string;
  response: string | string[] | any; // Allow complex response objects
  timeElapsed: number;
  hintsUsed: number;
  submittedAt?: string;
}

export interface ValidationResult {
  isCorrect: boolean;
  score: number;
  feedback: string;
  explanation?: string;
  partialCredit?: number;
  bonusPoints?: number;
  metadata?: any; // Additional result metadata
}

export interface Result {
  challengeId: string;
  userId: string;
  validation: ValidationResult;
  rewards?: Reward[];
  experienceGained: number;
  goldEarned: number;
  completedAt: string;
  score: number;
  answer: Answer;
}

export interface Realm {
  id: string;
  name: string;
  description: string;
  requiredLevel: number;
  isUnlocked: boolean;
  challenges: Challenge[];
  bossChallenge?: Challenge;
  specialRewards: Reward[];
  requiresVerification: boolean;
}

export interface LevelUpResult {
  newLevel: number;
  unlockedRealms: string[];
  unlockedFeatures: string[];
  bonusRewards: Reward[];
}

export interface BossResult {
  defeated: boolean;
  score: number;
  specialRewards: Reward[];
  unlockedContent: string[];
}

export interface ChallengeStats {
  totalAttempts: number;
  averageScore: number;
  averageTime: number;
  successRate: number;
}

export enum ChallengeType {
  EQUATION_BALANCE = 'equation_balance',
  STOICHIOMETRY = 'stoichiometry',
  GAS_TEST = 'gas_test',
  ION_IDENTIFICATION = 'ion_identification',
  LAB_PROCEDURE = 'lab_procedure',
  PRECIPITATION = 'precipitation',
  COLOR_CHANGE = 'color_change',
  DATA_ANALYSIS = 'data_analysis',
  ORGANIC_NAMING = 'organic_naming',
  MECHANISM = 'mechanism',
  ISOMER_IDENTIFICATION = 'isomer_identification',
  // Memory Labyrinth challenge types
  MEMORY_MATCH = 'memory_match',
  QUICK_RECALL = 'quick_recall',
  SURVIVAL = 'survival',
  // Virtual Apprentice challenge types
  STEP_BY_STEP = 'step_by_step',
  TIME_ATTACK = 'time_attack',
  BOSS_BATTLE = 'boss_battle',
  // Seer's Challenge challenge types
  PRECIPITATION_POKER = 'precipitation_poker',
  COLOR_CLASH = 'color_clash',
  MYSTERY_REACTION = 'mystery_reaction'
}

export enum RealmType {
  MATHMAGE_TRIALS = 'mathmage-trials',
  MEMORY_LABYRINTH = 'memory-labyrinth',
  VIRTUAL_APPRENTICE = 'virtual-apprentice',
  SEERS_CHALLENGE = 'seers-challenge',
  CARTOGRAPHERS_GAUNTLET = 'cartographers-gauntlet',
  FOREST_OF_ISOMERS = 'forest-of-isomers'
}

// UI-specific types
export interface ChallengeAttempt {
  challenge: Challenge;
  startTime: Date;
  hintsUsed: number;
  currentResponse: string | string[];
  timeRemaining?: number;
}

export interface GameSession {
  currentRealm?: Realm;
  activeChallenge?: ChallengeAttempt;
  recentResults: Result[];
  sessionStats: {
    challengesCompleted: number;
    totalXPGained: number;
    totalGoldEarned: number;
    averageScore: number;
  };
}