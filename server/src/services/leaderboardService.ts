import { PerformanceMetrics } from '../types/analytics.js';

export interface LeaderboardEntry {
  userId: string;
  username: string;
  rank: number;
  score: number;
  avatar?: string;
  level: number;
  streak: number;
  realmSpecialty?: string;
  lastActive: Date;
  isOnline: boolean;
}

export interface LeaderboardCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  timeframe: 'daily' | 'weekly' | 'monthly' | 'all-time';
  metric: 'accuracy' | 'speed' | 'streak' | 'total_score' | 'challenges_completed';
}

export interface FriendConnection {
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked';
  connectedAt: Date;
  lastInteraction?: Date;
}

export interface SocialChallenge {
  id: string;
  creatorId: string;
  challengeId: string;
  title: string;
  description: string;
  participants: string[];
  maxParticipants: number;
  startTime: Date;
  endTime: Date;
  status: 'open' | 'active' | 'completed' | 'cancelled';
  rewards: SocialChallengeReward[];
  leaderboard: LeaderboardEntry[];
}

export interface SocialChallengeReward {
  position: number;
  xpBonus: number;
  goldBonus: number;
  badgeId?: string;
  title?: string;
}

export interface SocialAchievement {
  id: string;
  name: string;
  description: string;
  category: 'social' | 'competitive' | 'collaborative';
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: SocialAchievementRequirement[];
}

export interface SocialAchievementRequirement {
  type: 'friend_count' | 'challenge_wins' | 'tournament_participation' | 'help_given';
  target: number;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all-time';
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  format: 'single_elimination' | 'round_robin' | 'swiss' | 'ladder';
  maxParticipants: number;
  entryFee: number;
  prizePool: TournamentPrize[];
  startTime: Date;
  endTime: Date;
  status: 'registration' | 'active' | 'completed' | 'cancelled';
  participants: TournamentParticipant[];
  brackets?: TournamentBracket[];
  rules: TournamentRule[];
}

export interface TournamentParticipant {
  userId: string;
  username: string;
  level: number;
  seed: number;
  registeredAt: Date;
  status: 'registered' | 'active' | 'eliminated' | 'winner';
}

export interface TournamentPrize {
  position: number;
  xpReward: number;
  goldReward: number;
  badgeId?: string;
  title?: string;
}

export interface TournamentBracket {
  round: number;
  matches: TournamentMatch[];
}

export interface TournamentMatch {
  id: string;
  player1Id: string;
  player2Id: string;
  challengeId: string;
  winnerId?: string;
  player1Score: number;
  player2Score: number;
  status: 'pending' | 'active' | 'completed';
  scheduledTime: Date;
  completedTime?: Date;
}

export interface TournamentRule {
  type: 'time_limit' | 'difficulty_range' | 'realm_restriction' | 'concept_focus';
  value: any;
  description: string;
}

export class LeaderboardService {
  private leaderboards: Map<string, LeaderboardEntry[]> = new Map();
  private friendConnections: Map<string, FriendConnection[]> = new Map();
  private socialChallenges: Map<string, SocialChallenge> = new Map();
  private tournaments: Map<string, Tournament> = new Map();
  private socialAchievements: Map<string, SocialAchievement[]> = new Map();

  // Leaderboard categories
  private categories: LeaderboardCategory[] = [
    {
      id: 'overall-accuracy',
      name: 'Accuracy Masters',
      description: 'Top performers by overall accuracy',
      icon: '🎯',
      timeframe: 'all-time',
      metric: 'accuracy'
    },
    {
      id: 'speed-demons',
      name: 'Speed Demons',
      description: 'Fastest challenge completion times',
      icon: '⚡',
      timeframe: 'weekly',
      metric: 'speed'
    },
    {
      id: 'streak-keepers',
      name: 'Streak Keepers',
      description: 'Longest learning streaks',
      icon: '🔥',
      timeframe: 'all-time',
      metric: 'streak'
    },
    {
      id: 'weekly-champions',
      name: 'Weekly Champions',
      description: 'Top scorers this week',
      icon: '👑',
      timeframe: 'weekly',
      metric: 'total_score'
    },
    {
      id: 'challenge-masters',
      name: 'Challenge Masters',
      description: 'Most challenges completed',
      icon: '🏆',
      timeframe: 'monthly',
      metric: 'challenges_completed'
    }
  ];

  /**
   * Update leaderboard rankings for a user
   */
  async updateLeaderboardRanking(userId: string, metrics: PerformanceMetrics): Promise<void> {
    const username = await this.getUsernameById(userId);
    const level = this.calculateUserLevel(metrics);
    
    for (const category of this.categories) {
      const categoryId = category.id;
      let leaderboard = this.leaderboards.get(categoryId) || [];
      
      // Remove existing entry for this user
      leaderboard = leaderboard.filter(entry => entry.userId !== userId);
      
      // Calculate score for this category
      const score = this.calculateCategoryScore(metrics, category);
      
      // Create new entry
      const entry: LeaderboardEntry = {
        userId,
        username,
        rank: 0, // Will be calculated after sorting
        score,
        level,
        streak: metrics.streakData.currentStreak,
        realmSpecialty: this.getRealmSpecialty(metrics),
        lastActive: new Date(),
        isOnline: true // Would be determined by real-time presence
      };
      
      // Add to leaderboard
      leaderboard.push(entry);
      
      // Sort by score (descending) and update ranks
      leaderboard.sort((a, b) => b.score - a.score);
      leaderboard.forEach((entry, index) => {
        entry.rank = index + 1;
      });
      
      // Keep only top 100 entries
      leaderboard = leaderboard.slice(0, 100);
      
      this.leaderboards.set(categoryId, leaderboard);
    }
  }

  /**
   * Get leaderboard for a specific category
   */
  async getLeaderboard(categoryId: string, limit: number = 50): Promise<LeaderboardEntry[]> {
    const leaderboard = this.leaderboards.get(categoryId) || [];
    return leaderboard.slice(0, limit);
  }

  /**
   * Get user's rank in a specific category
   */
  async getUserRank(userId: string, categoryId: string): Promise<number | null> {
    const leaderboard = this.leaderboards.get(categoryId) || [];
    const entry = leaderboard.find(e => e.userId === userId);
    return entry ? entry.rank : null;
  }

  /**
   * Get leaderboard categories
   */
  getLeaderboardCategories(): LeaderboardCategory[] {
    return this.categories;
  }

  /**
   * Send friend request
   */
  async sendFriendRequest(userId: string, targetUserId: string): Promise<FriendConnection> {
    if (userId === targetUserId) {
      throw new Error('Cannot send friend request to yourself');
    }

    // Check if connection already exists
    const userConnections = this.friendConnections.get(userId) || [];
    const existingConnection = userConnections.find(
      conn => conn.friendId === targetUserId || conn.userId === targetUserId
    );

    if (existingConnection) {
      throw new Error('Friend connection already exists');
    }

    const connection: FriendConnection = {
      userId,
      friendId: targetUserId,
      status: 'pending',
      connectedAt: new Date()
    };

    // Add to both users' connection lists
    userConnections.push(connection);
    this.friendConnections.set(userId, userConnections);

    const targetConnections = this.friendConnections.get(targetUserId) || [];
    targetConnections.push({
      ...connection,
      userId: targetUserId,
      friendId: userId
    });
    this.friendConnections.set(targetUserId, targetConnections);

    return connection;
  }

  /**
   * Accept friend request
   */
  async acceptFriendRequest(userId: string, requesterId: string): Promise<void> {
    const userConnections = this.friendConnections.get(userId) || [];
    const connection = userConnections.find(
      conn => conn.friendId === requesterId && conn.status === 'pending'
    );

    if (!connection) {
      throw new Error('Friend request not found');
    }

    // Update status for both users
    connection.status = 'accepted';
    connection.lastInteraction = new Date();

    const requesterConnections = this.friendConnections.get(requesterId) || [];
    const requesterConnection = requesterConnections.find(
      conn => conn.friendId === userId
    );
    if (requesterConnection) {
      requesterConnection.status = 'accepted';
      requesterConnection.lastInteraction = new Date();
    }
  }

  /**
   * Get user's friends
   */
  async getFriends(userId: string): Promise<FriendConnection[]> {
    const connections = this.friendConnections.get(userId) || [];
    return connections.filter(conn => conn.status === 'accepted');
  }

  /**
   * Get pending friend requests
   */
  async getPendingRequests(userId: string): Promise<FriendConnection[]> {
    const connections = this.friendConnections.get(userId) || [];
    return connections.filter(conn => conn.status === 'pending');
  }

  /**
   * Get friend progress comparison
   */
  async getFriendProgress(userId: string): Promise<any[]> {
    const friends = await this.getFriends(userId);
    const friendProgress = [];

    for (const friend of friends) {
      // This would fetch actual metrics from the analytics service
      const mockProgress = {
        userId: friend.friendId,
        username: await this.getUsernameById(friend.friendId),
        level: Math.floor(Math.random() * 20) + 1,
        totalChallenges: Math.floor(Math.random() * 100) + 10,
        accuracy: 0.6 + Math.random() * 0.35,
        currentStreak: Math.floor(Math.random() * 15),
        favoriteRealm: this.getRandomRealm(),
        lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        isOnline: Math.random() > 0.7
      };
      friendProgress.push(mockProgress);
    }

    return friendProgress;
  }

  /**
   * Create social challenge
   */
  async createSocialChallenge(
    creatorId: string,
    challengeId: string,
    title: string,
    description: string,
    maxParticipants: number = 10,
    duration: number = 60 // minutes
  ): Promise<SocialChallenge> {
    const socialChallenge: SocialChallenge = {
      id: `social-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      creatorId,
      challengeId,
      title,
      description,
      participants: [creatorId],
      maxParticipants,
      startTime: new Date(Date.now() + 5 * 60 * 1000), // Start in 5 minutes
      endTime: new Date(Date.now() + (duration + 5) * 60 * 1000),
      status: 'open',
      rewards: [
        { position: 1, xpBonus: 100, goldBonus: 50, badgeId: 'social-winner' },
        { position: 2, xpBonus: 75, goldBonus: 30 },
        { position: 3, xpBonus: 50, goldBonus: 20 }
      ],
      leaderboard: []
    };

    this.socialChallenges.set(socialChallenge.id, socialChallenge);
    return socialChallenge;
  }

  /**
   * Join social challenge
   */
  async joinSocialChallenge(challengeId: string, userId: string): Promise<void> {
    const challenge = this.socialChallenges.get(challengeId);
    if (!challenge) {
      throw new Error('Social challenge not found');
    }

    if (challenge.status !== 'open') {
      throw new Error('Challenge is not open for registration');
    }

    if (challenge.participants.length >= challenge.maxParticipants) {
      throw new Error('Challenge is full');
    }

    if (challenge.participants.includes(userId)) {
      throw new Error('Already joined this challenge');
    }

    challenge.participants.push(userId);
    
    // Start challenge if enough participants
    if (challenge.participants.length >= 2) {
      challenge.status = 'active';
    }
  }

  /**
   * Get active social challenges
   */
  async getActiveSocialChallenges(): Promise<SocialChallenge[]> {
    return Array.from(this.socialChallenges.values())
      .filter(challenge => challenge.status === 'open' || challenge.status === 'active')
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  /**
   * Create tournament
   */
  async createTournament(
    name: string,
    description: string,
    format: Tournament['format'],
    maxParticipants: number,
    entryFee: number = 0
  ): Promise<Tournament> {
    const tournament: Tournament = {
      id: `tournament-${Date.now()}`,
      name,
      description,
      format,
      maxParticipants,
      entryFee,
      prizePool: this.generateTournamentPrizes(maxParticipants),
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Start in 24 hours
      endTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // End in 48 hours
      status: 'registration',
      participants: [],
      rules: [
        {
          type: 'time_limit',
          value: 300, // 5 minutes per challenge
          description: 'Maximum 5 minutes per challenge'
        },
        {
          type: 'difficulty_range',
          value: { min: 2, max: 4 },
          description: 'Challenges will be difficulty 2-4'
        }
      ]
    };

    this.tournaments.set(tournament.id, tournament);
    return tournament;
  }

  /**
   * Register for tournament
   */
  async registerForTournament(tournamentId: string, userId: string): Promise<void> {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.status !== 'registration') {
      throw new Error('Tournament registration is closed');
    }

    if (tournament.participants.length >= tournament.maxParticipants) {
      throw new Error('Tournament is full');
    }

    if (tournament.participants.some(p => p.userId === userId)) {
      throw new Error('Already registered for this tournament');
    }

    const participant: TournamentParticipant = {
      userId,
      username: await this.getUsernameById(userId),
      level: Math.floor(Math.random() * 20) + 1, // Would get from user data
      seed: tournament.participants.length + 1,
      registeredAt: new Date(),
      status: 'registered'
    };

    tournament.participants.push(participant);
  }

  /**
   * Get active tournaments
   */
  async getActiveTournaments(): Promise<Tournament[]> {
    return Array.from(this.tournaments.values())
      .filter(tournament => tournament.status === 'registration' || tournament.status === 'active')
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  /**
   * Get social achievements for user
   */
  async getSocialAchievements(userId: string): Promise<SocialAchievement[]> {
    let userAchievements = this.socialAchievements.get(userId);
    
    if (!userAchievements) {
      userAchievements = this.initializeSocialAchievements();
      this.socialAchievements.set(userId, userAchievements);
    }

    return userAchievements;
  }

  /**
   * Update social achievement progress
   */
  async updateSocialAchievementProgress(userId: string, achievementType: string, increment: number = 1): Promise<void> {
    const achievements = await this.getSocialAchievements(userId);
    
    // This would update progress based on the achievement type
    // For now, just a placeholder implementation
    console.log(`Updated ${achievementType} progress for user ${userId} by ${increment}`);
  }

  /**
   * Private helper methods
   */
  private async getUsernameById(userId: string): Promise<string> {
    // This would fetch from user service
    return `User${userId.slice(-4)}`;
  }

  private calculateUserLevel(metrics: PerformanceMetrics): number {
    // Simple level calculation based on total challenges and accuracy
    const baseLevel = Math.floor(metrics.totalChallengesCompleted / 10);
    const accuracyBonus = Math.floor(metrics.overallAccuracy * 5);
    return Math.max(1, baseLevel + accuracyBonus);
  }

  private calculateCategoryScore(metrics: PerformanceMetrics, category: LeaderboardCategory): number {
    switch (category.metric) {
      case 'accuracy':
        return Math.round(metrics.overallAccuracy * 10000); // Scale for ranking
      case 'speed':
        return Math.max(0, 300 - metrics.averageResponseTime); // Faster = higher score
      case 'streak':
        return metrics.streakData.currentStreak;
      case 'total_score':
        return metrics.totalChallengesCompleted * Math.round(metrics.overallAccuracy * 100);
      case 'challenges_completed':
        return metrics.totalChallengesCompleted;
      default:
        return 0;
    }
  }

  private getRealmSpecialty(metrics: PerformanceMetrics): string {
    if (metrics.realmProgress.length === 0) return 'Beginner';
    
    const bestRealm = metrics.realmProgress.reduce((best, current) => 
      current.averageScore > best.averageScore ? current : best
    );
    
    return bestRealm.realmName;
  }

  private getRandomRealm(): string {
    const realms = [
      'Mathmage Trials',
      'Memory Labyrinth', 
      'Virtual Apprentice',
      "Seer's Challenge",
      "Cartographer's Gauntlet",
      'Forest of Isomers'
    ];
    return realms[Math.floor(Math.random() * realms.length)];
  }

  private generateTournamentPrizes(maxParticipants: number): TournamentPrize[] {
    const prizes: TournamentPrize[] = [];
    const positions = Math.min(maxParticipants, 8); // Prize top 8 or all participants if fewer
    
    for (let i = 1; i <= positions; i++) {
      const xpReward = Math.max(50, 500 - (i - 1) * 50);
      const goldReward = Math.max(25, 250 - (i - 1) * 25);
      
      prizes.push({
        position: i,
        xpReward,
        goldReward,
        badgeId: i <= 3 ? `tournament-${i === 1 ? 'gold' : i === 2 ? 'silver' : 'bronze'}` : undefined,
        title: i === 1 ? 'Tournament Champion' : undefined
      });
    }
    
    return prizes;
  }

  private initializeSocialAchievements(): SocialAchievement[] {
    return [
      {
        id: 'social-butterfly',
        name: 'Social Butterfly',
        description: 'Connect with 10 friends',
        category: 'social',
        icon: '🦋',
        rarity: 'common',
        requirements: [
          { type: 'friend_count', target: 10 }
        ]
      },
      {
        id: 'tournament-warrior',
        name: 'Tournament Warrior',
        description: 'Participate in 5 tournaments',
        category: 'competitive',
        icon: '⚔️',
        rarity: 'rare',
        requirements: [
          { type: 'tournament_participation', target: 5 }
        ]
      },
      {
        id: 'challenge-champion',
        name: 'Challenge Champion',
        description: 'Win 25 social challenges',
        category: 'competitive',
        icon: '🏆',
        rarity: 'epic',
        requirements: [
          { type: 'challenge_wins', target: 25 }
        ]
      },
      {
        id: 'helpful-mentor',
        name: 'Helpful Mentor',
        description: 'Help friends improve their weak areas',
        category: 'collaborative',
        icon: '🤝',
        rarity: 'rare',
        requirements: [
          { type: 'help_given', target: 50 }
        ]
      }
    ];
  }
}