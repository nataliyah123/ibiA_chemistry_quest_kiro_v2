import { LeaderboardService } from '../services/leaderboardService';
import { PerformanceMetrics } from '../types/analytics';

describe('LeaderboardService', () => {
  let leaderboardService: LeaderboardService;

  beforeEach(() => {
    leaderboardService = new LeaderboardService();
  });

  describe('updateLeaderboardRanking', () => {
    it('should update leaderboard rankings for a user', async () => {
      const userId = 'test-user-1';
      const mockMetrics: PerformanceMetrics = {
        userId,
        overallAccuracy: 0.85,
        averageResponseTime: 75,
        strongestConcepts: [],
        weakestConcepts: [],
        learningVelocity: 5,
        streakData: {
          currentStreak: 7,
          longestStreak: 10,
          lastActivityDate: new Date(),
          streakType: 'daily',
          streakMultiplier: 1.7
        },
        realmProgress: [
          {
            realmId: 'mathmage-trials',
            realmName: 'Mathmage Trials',
            completionPercentage: 80,
            averageScore: 85,
            timeSpent: 3600,
            challengesCompleted: 20,
            totalChallenges: 25,
            strongestChallengeTypes: ['equation_balance'],
            weakestChallengeTypes: ['stoichiometry']
          }
        ],
        totalChallengesCompleted: 50,
        totalTimeSpent: 7200,
        lastUpdated: new Date()
      };

      await expect(leaderboardService.updateLeaderboardRanking(userId, mockMetrics))
        .resolves.not.toThrow();

      // Check that user appears in leaderboards
      const categories = leaderboardService.getLeaderboardCategories();
      for (const category of categories) {
        const leaderboard = await leaderboardService.getLeaderboard(category.id);
        const userEntry = leaderboard.find(entry => entry.userId === userId);
        expect(userEntry).toBeDefined();
        expect(userEntry?.rank).toBeGreaterThan(0);
      }
    });

    it('should rank users correctly by accuracy', async () => {
      const users = [
        { id: 'user-1', accuracy: 0.95 },
        { id: 'user-2', accuracy: 0.85 },
        { id: 'user-3', accuracy: 0.75 }
      ];

      // Add users to leaderboard
      for (const user of users) {
        const mockMetrics: PerformanceMetrics = {
          userId: user.id,
          overallAccuracy: user.accuracy,
          averageResponseTime: 60,
          strongestConcepts: [],
          weakestConcepts: [],
          learningVelocity: 3,
          streakData: {
            currentStreak: 5,
            longestStreak: 8,
            lastActivityDate: new Date(),
            streakType: 'daily',
            streakMultiplier: 1.5
          },
          realmProgress: [],
          totalChallengesCompleted: 30,
          totalTimeSpent: 3600,
          lastUpdated: new Date()
        };

        await leaderboardService.updateLeaderboardRanking(user.id, mockMetrics);
      }

      // Check accuracy leaderboard ranking
      const accuracyLeaderboard = await leaderboardService.getLeaderboard('overall-accuracy');
      expect(accuracyLeaderboard[0].userId).toBe('user-1'); // Highest accuracy first
      expect(accuracyLeaderboard[1].userId).toBe('user-2');
      expect(accuracyLeaderboard[2].userId).toBe('user-3');
    });
  });

  describe('getLeaderboard', () => {
    it('should return empty leaderboard for new category', async () => {
      const leaderboard = await leaderboardService.getLeaderboard('non-existent-category');
      expect(leaderboard).toEqual([]);
    });

    it('should respect limit parameter', async () => {
      // Add multiple users
      for (let i = 1; i <= 10; i++) {
        const mockMetrics: PerformanceMetrics = {
          userId: `user-${i}`,
          overallAccuracy: 0.5 + (i * 0.04), // Varying accuracy
          averageResponseTime: 60,
          strongestConcepts: [],
          weakestConcepts: [],
          learningVelocity: 3,
          streakData: {
            currentStreak: i,
            longestStreak: i + 2,
            lastActivityDate: new Date(),
            streakType: 'daily',
            streakMultiplier: 1.0 + i * 0.1
          },
          realmProgress: [],
          totalChallengesCompleted: i * 5,
          totalTimeSpent: i * 600,
          lastUpdated: new Date()
        };

        await leaderboardService.updateLeaderboardRanking(`user-${i}`, mockMetrics);
      }

      const limitedLeaderboard = await leaderboardService.getLeaderboard('overall-accuracy', 5);
      expect(limitedLeaderboard.length).toBe(5);
    });
  });

  describe('getUserRank', () => {
    it('should return null for user not in leaderboard', async () => {
      const rank = await leaderboardService.getUserRank('non-existent-user', 'overall-accuracy');
      expect(rank).toBeNull();
    });

    it('should return correct rank for user in leaderboard', async () => {
      const mockMetrics: PerformanceMetrics = {
        userId: 'ranked-user',
        overallAccuracy: 0.90,
        averageResponseTime: 45,
        strongestConcepts: [],
        weakestConcepts: [],
        learningVelocity: 4,
        streakData: {
          currentStreak: 10,
          longestStreak: 15,
          lastActivityDate: new Date(),
          streakType: 'daily',
          streakMultiplier: 2.0
        },
        realmProgress: [],
        totalChallengesCompleted: 75,
        totalTimeSpent: 9000,
        lastUpdated: new Date()
      };

      await leaderboardService.updateLeaderboardRanking('ranked-user', mockMetrics);
      
      const rank = await leaderboardService.getUserRank('ranked-user', 'overall-accuracy');
      expect(rank).toBe(1); // Should be first with high accuracy
    });
  });

  describe('sendFriendRequest', () => {
    it('should create friend request successfully', async () => {
      const userId = 'user-1';
      const targetUserId = 'user-2';

      const connection = await leaderboardService.sendFriendRequest(userId, targetUserId);

      expect(connection).toBeDefined();
      expect(connection.userId).toBe(userId);
      expect(connection.friendId).toBe(targetUserId);
      expect(connection.status).toBe('pending');
    });

    it('should throw error when sending request to self', async () => {
      const userId = 'user-1';

      await expect(leaderboardService.sendFriendRequest(userId, userId))
        .rejects.toThrow('Cannot send friend request to yourself');
    });

    it('should throw error for duplicate friend request', async () => {
      const userId = 'user-1';
      const targetUserId = 'user-2';

      await leaderboardService.sendFriendRequest(userId, targetUserId);

      await expect(leaderboardService.sendFriendRequest(userId, targetUserId))
        .rejects.toThrow('Friend connection already exists');
    });
  });

  describe('acceptFriendRequest', () => {
    it('should accept friend request successfully', async () => {
      const userId = 'user-1';
      const requesterId = 'user-2';

      // Send request first
      await leaderboardService.sendFriendRequest(requesterId, userId);

      // Accept request
      await expect(leaderboardService.acceptFriendRequest(userId, requesterId))
        .resolves.not.toThrow();

      // Check that both users have accepted connection
      const userFriends = await leaderboardService.getFriends(userId);
      const requesterFriends = await leaderboardService.getFriends(requesterId);

      expect(userFriends.length).toBe(1);
      expect(requesterFriends.length).toBe(1);
      expect(userFriends[0].status).toBe('accepted');
      expect(requesterFriends[0].status).toBe('accepted');
    });

    it('should throw error for non-existent request', async () => {
      const userId = 'user-1';
      const requesterId = 'user-2';

      await expect(leaderboardService.acceptFriendRequest(userId, requesterId))
        .rejects.toThrow('Friend request not found');
    });
  });

  describe('createSocialChallenge', () => {
    it('should create social challenge successfully', async () => {
      const creatorId = 'creator-1';
      const challengeId = 'challenge-1';
      const title = 'Test Social Challenge';
      const description = 'A test challenge for friends';

      const socialChallenge = await leaderboardService.createSocialChallenge(
        creatorId,
        challengeId,
        title,
        description
      );

      expect(socialChallenge).toBeDefined();
      expect(socialChallenge.creatorId).toBe(creatorId);
      expect(socialChallenge.challengeId).toBe(challengeId);
      expect(socialChallenge.title).toBe(title);
      expect(socialChallenge.description).toBe(description);
      expect(socialChallenge.participants).toContain(creatorId);
      expect(socialChallenge.status).toBe('open');
    });

    it('should set appropriate start and end times', async () => {
      const socialChallenge = await leaderboardService.createSocialChallenge(
        'creator-1',
        'challenge-1',
        'Test Challenge',
        'Description',
        10,
        60 // 60 minutes duration
      );

      const now = new Date();
      const startTime = new Date(socialChallenge.startTime);
      const endTime = new Date(socialChallenge.endTime);

      expect(startTime.getTime()).toBeGreaterThan(now.getTime());
      expect(endTime.getTime()).toBeGreaterThan(startTime.getTime());
      
      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      expect(duration).toBe(60); // Should be 60 minutes
    });
  });

  describe('joinSocialChallenge', () => {
    it('should join social challenge successfully', async () => {
      const creatorId = 'creator-1';
      const participantId = 'participant-1';

      const socialChallenge = await leaderboardService.createSocialChallenge(
        creatorId,
        'challenge-1',
        'Test Challenge',
        'Description'
      );

      await leaderboardService.joinSocialChallenge(socialChallenge.id, participantId);

      const activeChallenges = await leaderboardService.getActiveSocialChallenges();
      const updatedChallenge = activeChallenges.find(c => c.id === socialChallenge.id);

      expect(updatedChallenge?.participants).toContain(participantId);
      expect(updatedChallenge?.status).toBe('active'); // Should be active with 2+ participants
    });

    it('should throw error when joining non-existent challenge', async () => {
      await expect(leaderboardService.joinSocialChallenge('non-existent', 'user-1'))
        .rejects.toThrow('Social challenge not found');
    });

    it('should throw error when joining same challenge twice', async () => {
      const creatorId = 'creator-1';
      const socialChallenge = await leaderboardService.createSocialChallenge(
        creatorId,
        'challenge-1',
        'Test Challenge',
        'Description'
      );

      await expect(leaderboardService.joinSocialChallenge(socialChallenge.id, creatorId))
        .rejects.toThrow('Already joined this challenge');
    });
  });

  describe('createTournament', () => {
    it('should create tournament successfully', async () => {
      const tournament = await leaderboardService.createTournament(
        'Test Tournament',
        'A test tournament',
        'single_elimination',
        16,
        100
      );

      expect(tournament).toBeDefined();
      expect(tournament.name).toBe('Test Tournament');
      expect(tournament.format).toBe('single_elimination');
      expect(tournament.maxParticipants).toBe(16);
      expect(tournament.entryFee).toBe(100);
      expect(tournament.status).toBe('registration');
      expect(tournament.participants).toEqual([]);
      expect(tournament.prizePool.length).toBeGreaterThan(0);
    });

    it('should generate appropriate prize pool', async () => {
      const tournament = await leaderboardService.createTournament(
        'Prize Tournament',
        'Tournament with prizes',
        'round_robin',
        8
      );

      expect(tournament.prizePool.length).toBe(8); // Should have prizes for all participants
      expect(tournament.prizePool[0].xpReward).toBeGreaterThan(tournament.prizePool[1].xpReward);
      expect(tournament.prizePool[0].position).toBe(1);
    });
  });

  describe('registerForTournament', () => {
    it('should register for tournament successfully', async () => {
      const tournament = await leaderboardService.createTournament(
        'Registration Tournament',
        'Test registration',
        'swiss',
        8
      );

      await leaderboardService.registerForTournament(tournament.id, 'player-1');

      const activeTournaments = await leaderboardService.getActiveTournaments();
      const updatedTournament = activeTournaments.find(t => t.id === tournament.id);

      expect(updatedTournament?.participants.length).toBe(1);
      expect(updatedTournament?.participants[0].userId).toBe('player-1');
      expect(updatedTournament?.participants[0].status).toBe('registered');
    });

    it('should throw error for non-existent tournament', async () => {
      await expect(leaderboardService.registerForTournament('non-existent', 'player-1'))
        .rejects.toThrow('Tournament not found');
    });

    it('should throw error for duplicate registration', async () => {
      const tournament = await leaderboardService.createTournament(
        'Duplicate Tournament',
        'Test duplicate registration',
        'ladder',
        4
      );

      await leaderboardService.registerForTournament(tournament.id, 'player-1');

      await expect(leaderboardService.registerForTournament(tournament.id, 'player-1'))
        .rejects.toThrow('Already registered for this tournament');
    });
  });

  describe('getSocialAchievements', () => {
    it('should return social achievements for user', async () => {
      const userId = 'achievement-user';
      const achievements = await leaderboardService.getSocialAchievements(userId);

      expect(achievements).toBeDefined();
      expect(Array.isArray(achievements)).toBe(true);
      expect(achievements.length).toBeGreaterThan(0);

      // Check that achievements have required properties
      achievements.forEach(achievement => {
        expect(achievement.id).toBeDefined();
        expect(achievement.name).toBeDefined();
        expect(achievement.description).toBeDefined();
        expect(achievement.category).toBeDefined();
        expect(achievement.requirements).toBeDefined();
        expect(Array.isArray(achievement.requirements)).toBe(true);
      });
    });

    it('should return same achievements for subsequent calls', async () => {
      const userId = 'consistent-user';
      const achievements1 = await leaderboardService.getSocialAchievements(userId);
      const achievements2 = await leaderboardService.getSocialAchievements(userId);

      expect(achievements1).toEqual(achievements2);
    });
  });
});