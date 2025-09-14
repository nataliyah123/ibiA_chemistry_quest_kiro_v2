import {
  DailyQuest,
  QuestTemplate,
  QuestType,
  ObjectiveType,
  DailyQuestAssignment,
  QuestCompletionResult,
  QuestGenerationConfig,
  QuestProgressUpdate,
  StreakData,
  QuestAnalytics,
  QuestObjective,
  QuestReward,
  QuestProgress
} from '../types/dailyQuest';
import { PerformanceMetrics } from '../types/analytics';
import { StreakBonusService, LoginStreak } from './streakBonusService';

export class DailyQuestService {
  private questTemplates: Map<string, QuestTemplate> = new Map();
  private userQuests: Map<string, DailyQuest[]> = new Map();
  private userStreaks: Map<string, StreakData> = new Map();
  private questAnalytics: Map<string, QuestAnalytics> = new Map();
  private generationConfig: QuestGenerationConfig;
  private streakBonusService: StreakBonusService;

  constructor(streakBonusService?: StreakBonusService) {
    this.streakBonusService = streakBonusService || new StreakBonusService();
    this.generationConfig = {
      maxDailyQuests: 3,
      difficultyDistribution: {
        easy: 0.5,
        medium: 0.35,
        hard: 0.15
      },
      questTypeWeights: {
        [QuestType.DAILY_CHALLENGE]: 1.0,
        [QuestType.SKILL_FOCUS]: 0.8,
        [QuestType.REALM_EXPLORER]: 0.7,
        [QuestType.SPEED_DEMON]: 0.6,
        [QuestType.ACCURACY_MASTER]: 0.6,
        [QuestType.STREAK_KEEPER]: 0.4,
        [QuestType.SOCIAL_BUTTERFLY]: 0.3,
        [QuestType.BOSS_HUNTER]: 0.5,
        [QuestType.COLLECTION_QUEST]: 0.4,
        [QuestType.SEASONAL_EVENT]: 0.2
      },
      seasonalModifiers: [],
      personalizedWeights: true
    };

    this.initializeQuestTemplates();
  }

  /**
   * Generate daily quests for a user
   */
  async generateDailyQuests(userId: string, userMetrics?: PerformanceMetrics): Promise<DailyQuestAssignment> {
    const assignedDate = new Date();
    const existingQuests = this.getUserQuests(userId, assignedDate);

    // Don't generate new quests if user already has quests for today
    if (existingQuests.length > 0) {
      return {
        userId,
        assignedDate,
        quests: existingQuests,
        streakBonus: this.getStreakMultiplier(userId),
        totalPossibleRewards: this.calculateTotalRewards(existingQuests)
      };
    }

    // Select quest templates based on user profile and preferences
    const selectedTemplates = await this.selectQuestTemplates(userId, userMetrics);
    
    // Generate quests from templates
    const quests: DailyQuest[] = [];
    for (const template of selectedTemplates) {
      const quest = await this.generateQuestFromTemplate(userId, template, assignedDate);
      quests.push(quest);
    }

    // Store generated quests
    const userQuestList = this.userQuests.get(userId) || [];
    userQuestList.push(...quests);
    this.userQuests.set(userId, userQuestList);

    const streakBonus = this.getStreakMultiplier(userId);
    const totalRewards = this.calculateTotalRewards(quests);

    return {
      userId,
      assignedDate,
      quests,
      streakBonus,
      totalPossibleRewards: totalRewards
    };
  }

  /**
   * Update quest progress based on user activity
   */
  async updateQuestProgress(userId: string, progressUpdate: QuestProgressUpdate): Promise<QuestCompletionResult[]> {
    const activeQuests = this.getActiveQuests(userId);
    const completionResults: QuestCompletionResult[] = [];

    for (const quest of activeQuests) {
      const objective = quest.objectives.find(obj => obj.id === progressUpdate.objectiveId);
      if (!objective) continue;

      // Update objective progress
      objective.current = Math.min(objective.current + progressUpdate.progressIncrement, objective.target);
      objective.isCompleted = objective.current >= objective.target;

      // Update quest progress
      quest.progress = this.calculateQuestProgress(quest);
      quest.progress.lastUpdated = new Date();

      if (quest.status === 'assigned') {
        quest.status = 'in_progress';
        quest.progress.startedAt = new Date();
      }

      // Check if quest is completed
      if (quest.progress.overallProgress >= 100 && quest.status !== 'completed') {
        const completionResult = await this.completeQuest(userId, quest);
        completionResults.push(completionResult);
      }
    }

    return completionResults;
  }

  /**
   * Complete a quest and award rewards
   */
  async completeQuest(userId: string, quest: DailyQuest): Promise<QuestCompletionResult> {
    quest.status = 'completed';
    quest.completedAt = new Date();

    // Calculate base rewards
    const baseRewards = [...quest.rewards];
    
    // Calculate bonus rewards based on completion speed and streak
    const bonusRewards = this.calculateBonusRewards(quest);
    
    // Update streak
    const streakUpdated = await this.updateStreak(userId, 'daily_quest');
    
    // Check for new achievements
    const newAchievements = await this.checkQuestAchievements(userId, quest);

    // Update analytics
    await this.updateQuestAnalytics(userId, quest);

    return {
      quest,
      rewards: baseRewards,
      bonusRewards,
      streakUpdated,
      newAchievements,
      nextQuestUnlocked: undefined // Could implement quest chains here
    };
  }

  /**
   * Get active quests for a user
   */
  getActiveQuests(userId: string): DailyQuest[] {
    const userQuests = this.userQuests.get(userId) || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return userQuests.filter(quest => 
      quest.status === 'assigned' || quest.status === 'in_progress'
    ).filter(quest => {
      const questDate = new Date(quest.assignedDate);
      questDate.setHours(0, 0, 0, 0);
      return questDate.getTime() === today.getTime();
    });
  }

  /**
   * Get user's quest history
   */
  getQuestHistory(userId: string, limit: number = 30): DailyQuest[] {
    const userQuests = this.userQuests.get(userId) || [];
    return userQuests
      .filter(quest => quest.status === 'completed' || quest.status === 'expired')
      .sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime())
      .slice(0, limit);
  }

  /**
   * Get user's streak data
   */
  getStreakData(userId: string): StreakData {
    const loginStreak = this.streakBonusService.getStreak(userId);
    
    if (!loginStreak) {
      return {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        lastCompletionDate: new Date(0),
        streakType: 'daily_quest',
        multiplier: 1.0,
        milestones: this.generateStreakMilestones()
      };
    }

    return {
      userId,
      currentStreak: loginStreak.currentStreak,
      longestStreak: loginStreak.longestStreak,
      lastCompletionDate: loginStreak.lastLoginDate,
      streakType: 'daily_quest',
      multiplier: loginStreak.streakMultiplier,
      milestones: this.generateStreakMilestones()
    };
  }

  /**
   * Record user login and update streak
   */
  async recordUserLogin(userId: string): Promise<LoginStreak> {
    return await this.streakBonusService.recordLogin(userId);
  }

  /**
   * Get current streak bonuses for user
   */
  getCurrentStreakBonuses(userId: string) {
    return this.streakBonusService.getCurrentBonus(userId);
  }

  /**
   * Get streak milestones and progress
   */
  getStreakMilestones(userId: string) {
    return this.streakBonusService.getStreakMilestones(userId);
  }

  /**
   * Get streak statistics
   */
  getStreakStats(userId: string) {
    return this.streakBonusService.getStreakStats(userId);
  }

  /**
   * Get quest analytics for a user
   */
  async getQuestAnalytics(userId: string): Promise<QuestAnalytics> {
    let analytics = this.questAnalytics.get(userId);
    
    if (!analytics) {
      analytics = await this.calculateQuestAnalytics(userId);
      this.questAnalytics.set(userId, analytics);
    }

    return analytics;
  }

  /**
   * Expire old quests
   */
  async expireOldQuests(): Promise<void> {
    const now = new Date();
    
    for (const [userId, quests] of this.userQuests) {
      for (const quest of quests) {
        if (quest.status === 'assigned' || quest.status === 'in_progress') {
          if (now > quest.expiresAt) {
            quest.status = 'expired';
          }
        }
      }
    }
  }

  /**
   * Private helper methods
   */
  private async selectQuestTemplates(userId: string, userMetrics?: PerformanceMetrics): Promise<QuestTemplate[]> {
    const availableTemplates = Array.from(this.questTemplates.values());
    const selectedTemplates: QuestTemplate[] = [];
    
    // Filter templates based on user requirements
    const eligibleTemplates = availableTemplates.filter(template => 
      this.isTemplateEligible(template, userId, userMetrics)
    );

    // Select templates based on difficulty distribution
    const difficulties = ['easy', 'medium', 'hard'] as const;
    
    for (let i = 0; i < this.generationConfig.maxDailyQuests; i++) {
      const targetDifficulty = this.selectDifficulty();
      const difficultyTemplates = eligibleTemplates.filter(t => t.difficulty === targetDifficulty);
      
      if (difficultyTemplates.length > 0) {
        const template = this.selectWeightedTemplate(difficultyTemplates, userId);
        if (template) {
          selectedTemplates.push(template);
        }
      }
    }

    return selectedTemplates;
  }

  private async generateQuestFromTemplate(userId: string, template: QuestTemplate, assignedDate: Date): Promise<DailyQuest> {
    const questId = `quest-${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate objectives from templates
    const objectives: QuestObjective[] = template.objectiveTemplates.map((objTemplate, index) => ({
      id: `${questId}-obj-${index}`,
      type: objTemplate.type,
      target: this.randomInRange(objTemplate.targetRange.min, objTemplate.targetRange.max),
      current: 0,
      description: this.fillTemplate(objTemplate.descriptionTemplate, {}),
      isCompleted: false,
      realmId: objTemplate.realmIds ? this.randomChoice(objTemplate.realmIds) : undefined,
      challengeType: objTemplate.challengeTypes ? this.randomChoice(objTemplate.challengeTypes) : undefined,
      specificCriteria: objTemplate.criteria
    }));

    // Generate rewards from templates
    const rewards: QuestReward[] = template.rewardTemplates
      .filter(rewardTemplate => !rewardTemplate.probability || Math.random() < rewardTemplate.probability)
      .map(rewardTemplate => ({
        type: rewardTemplate.type,
        amount: rewardTemplate.amountRange ? 
          this.randomInRange(rewardTemplate.amountRange.min, rewardTemplate.amountRange.max) : 
          undefined,
        itemId: rewardTemplate.itemPool ? this.randomChoice(rewardTemplate.itemPool) : undefined,
        description: rewardTemplate.description
      }));

    const expiresAt = new Date(assignedDate);
    expiresAt.setDate(expiresAt.getDate() + 1); // Expire at end of day

    return {
      id: questId,
      userId,
      questType: template.questType,
      title: this.fillTemplate(template.titleTemplate, {}),
      description: this.fillTemplate(template.descriptionTemplate, {}),
      objectives,
      rewards,
      difficulty: template.difficulty,
      assignedDate,
      expiresAt,
      status: 'assigned',
      progress: {
        overallProgress: 0,
        objectivesCompleted: 0,
        totalObjectives: objectives.length,
        lastUpdated: assignedDate
      },
      metadata: {
        generatedBy: 'system',
        templateId: template.id,
        difficultyModifiers: [],
        tags: template.tags
      }
    };
  }

  private isTemplateEligible(template: QuestTemplate, userId: string, userMetrics?: PerformanceMetrics): boolean {
    // Check cooldown
    const lastUsed = this.getLastTemplateUsage(userId, template.id);
    if (lastUsed) {
      const daysSinceUsed = (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUsed < template.cooldownDays) {
        return false;
      }
    }

    // Check requirements
    for (const requirement of template.requirements) {
      if (!this.checkRequirement(requirement, userId, userMetrics)) {
        return false;
      }
    }

    return true;
  }

  private selectDifficulty(): 'easy' | 'medium' | 'hard' {
    const rand = Math.random();
    const dist = this.generationConfig.difficultyDistribution;
    
    if (rand < dist.easy) return 'easy';
    if (rand < dist.easy + dist.medium) return 'medium';
    return 'hard';
  }

  private selectWeightedTemplate(templates: QuestTemplate[], userId: string): QuestTemplate | null {
    if (templates.length === 0) return null;

    const weights = templates.map(template => {
      let weight = template.weight * this.generationConfig.questTypeWeights[template.questType];
      
      // Apply personalization if enabled
      if (this.generationConfig.personalizedWeights) {
        weight *= this.getPersonalizedWeight(userId, template);
      }
      
      return weight;
    });

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < templates.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return templates[i];
      }
    }

    return templates[templates.length - 1];
  }

  private calculateQuestProgress(quest: DailyQuest): QuestProgress {
    const completedObjectives = quest.objectives.filter(obj => obj.isCompleted).length;
    const overallProgress = (completedObjectives / quest.objectives.length) * 100;

    return {
      overallProgress,
      objectivesCompleted: completedObjectives,
      totalObjectives: quest.objectives.length,
      startedAt: quest.progress.startedAt,
      lastUpdated: new Date()
    };
  }

  private calculateBonusRewards(quest: DailyQuest): QuestReward[] {
    const bonusRewards: QuestReward[] = [];
    
    // Speed bonus
    if (quest.completedAt && quest.progress.startedAt) {
      const completionTime = quest.completedAt.getTime() - quest.progress.startedAt.getTime();
      const oneHour = 60 * 60 * 1000;
      
      if (completionTime < oneHour) {
        bonusRewards.push({
          type: 'gold',
          amount: 25,
          description: 'Speed completion bonus'
        });
      }
    }

    // Streak bonuses
    const streakBonuses = this.streakBonusService.getCurrentBonus(quest.userId);
    for (const bonus of streakBonuses) {
      if (bonus.type === 'xp_multiplier' && bonus.multiplier) {
        // Apply XP multiplier to base XP rewards
        const baseXpRewards = quest.rewards.filter(r => r.type === 'xp');
        for (const xpReward of baseXpRewards) {
          const bonusXp = Math.floor((xpReward.amount || 0) * (bonus.multiplier - 1));
          if (bonusXp > 0) {
            bonusRewards.push({
              type: 'xp',
              amount: bonusXp,
              description: `Streak bonus: ${bonus.description}`
            });
          }
        }
      } else if (bonus.type === 'gold_multiplier' && bonus.multiplier) {
        // Apply gold multiplier to base gold rewards
        const baseGoldRewards = quest.rewards.filter(r => r.type === 'gold');
        for (const goldReward of baseGoldRewards) {
          const bonusGold = Math.floor((goldReward.amount || 0) * (bonus.multiplier - 1));
          if (bonusGold > 0) {
            bonusRewards.push({
              type: 'gold',
              amount: bonusGold,
              description: `Streak bonus: ${bonus.description}`
            });
          }
        }
      } else if (bonus.type === 'challenge_bonus' && bonus.bonusAmount) {
        bonusRewards.push({
          type: 'xp',
          amount: bonus.bonusAmount,
          description: bonus.description
        });
      }
    }

    return bonusRewards;
  }

  private async updateStreak(userId: string, streakType: 'daily_quest' | 'login' | 'challenge'): Promise<boolean> {
    const streakData = this.getStreakData(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastCompletion = new Date(streakData.lastCompletionDate);
    lastCompletion.setHours(0, 0, 0, 0);
    
    const daysDiff = (today.getTime() - lastCompletion.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff === 1) {
      // Consecutive day - extend streak
      streakData.currentStreak++;
      streakData.longestStreak = Math.max(streakData.longestStreak, streakData.currentStreak);
    } else if (daysDiff > 1) {
      // Streak broken - reset
      streakData.currentStreak = 1;
    }
    // daysDiff === 0 means already completed today, no change needed
    
    streakData.lastCompletionDate = new Date();
    streakData.multiplier = 1 + Math.min(streakData.currentStreak * 0.1, 1.0); // Max 2x multiplier
    
    this.userStreaks.set(userId, streakData);
    
    return daysDiff >= 1; // Return true if streak was updated
  }

  private async checkQuestAchievements(userId: string, quest: DailyQuest): Promise<string[]> {
    const achievements: string[] = [];
    const analytics = await this.getQuestAnalytics(userId);
    
    // Check for milestone achievements
    if (analytics.totalQuestsCompleted === 1) {
      achievements.push('first_quest_completed');
    } else if (analytics.totalQuestsCompleted === 10) {
      achievements.push('quest_novice');
    } else if (analytics.totalQuestsCompleted === 50) {
      achievements.push('quest_veteran');
    } else if (analytics.totalQuestsCompleted === 100) {
      achievements.push('quest_master');
    }

    // Check streak achievements
    const streakData = this.getStreakData(userId);
    if (streakData.currentStreak === 7) {
      achievements.push('week_warrior');
    } else if (streakData.currentStreak === 30) {
      achievements.push('month_master');
    }

    return achievements;
  }

  private async updateQuestAnalytics(userId: string, quest: DailyQuest): Promise<void> {
    let analytics = this.questAnalytics.get(userId);
    
    if (!analytics) {
      analytics = await this.calculateQuestAnalytics(userId);
    }

    analytics.totalQuestsCompleted++;
    
    // Update completion rate
    const totalQuests = this.userQuests.get(userId)?.length || 0;
    analytics.questCompletionRate = analytics.totalQuestsCompleted / totalQuests;

    // Update favorite quest types
    const questTypeCount = new Map<QuestType, number>();
    const userQuests = this.userQuests.get(userId) || [];
    
    for (const userQuest of userQuests.filter(q => q.status === 'completed')) {
      const count = questTypeCount.get(userQuest.questType) || 0;
      questTypeCount.set(userQuest.questType, count + 1);
    }

    analytics.favoriteQuestTypes = Array.from(questTypeCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);

    // Update rewards earned
    for (const reward of quest.rewards) {
      switch (reward.type) {
        case 'xp':
          analytics.rewardsEarned.totalXP += reward.amount || 0;
          break;
        case 'gold':
          analytics.rewardsEarned.totalGold += reward.amount || 0;
          break;
        case 'badge':
          analytics.rewardsEarned.badgesEarned++;
          break;
        case 'item':
          analytics.rewardsEarned.itemsCollected++;
          break;
      }
    }

    analytics.lastUpdated = new Date();
    this.questAnalytics.set(userId, analytics);
  }

  private async calculateQuestAnalytics(userId: string): Promise<QuestAnalytics> {
    const userQuests = this.userQuests.get(userId) || [];
    const completedQuests = userQuests.filter(q => q.status === 'completed');
    
    return {
      userId,
      totalQuestsCompleted: completedQuests.length,
      questCompletionRate: userQuests.length > 0 ? completedQuests.length / userQuests.length : 0,
      favoriteQuestTypes: [],
      averageCompletionTime: 0, // Would calculate from completion times
      streakData: this.getStreakData(userId),
      rewardsEarned: {
        totalXP: 0,
        totalGold: 0,
        badgesEarned: 0,
        itemsCollected: 0
      },
      lastUpdated: new Date()
    };
  }

  private getUserQuests(userId: string, date: Date): DailyQuest[] {
    const userQuests = this.userQuests.get(userId) || [];
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    return userQuests.filter(quest => {
      const questDate = new Date(quest.assignedDate);
      questDate.setHours(0, 0, 0, 0);
      return questDate.getTime() === targetDate.getTime();
    });
  }

  private calculateTotalRewards(quests: DailyQuest[]): QuestReward[] {
    const totalRewards: QuestReward[] = [];
    
    for (const quest of quests) {
      totalRewards.push(...quest.rewards);
    }

    return totalRewards;
  }

  private getStreakMultiplier(userId: string): number {
    const streakData = this.getStreakData(userId);
    return streakData.multiplier;
  }

  private generateStreakMilestones() {
    return [
      { streakLength: 3, reward: { type: 'gold' as const, amount: 50, description: '3-day streak bonus' }, isUnlocked: false },
      { streakLength: 7, reward: { type: 'badge' as const, itemId: 'week_warrior', description: 'Week Warrior badge' }, isUnlocked: false },
      { streakLength: 14, reward: { type: 'xp' as const, amount: 200, description: '2-week streak XP bonus' }, isUnlocked: false },
      { streakLength: 30, reward: { type: 'badge' as const, itemId: 'month_master', description: 'Month Master badge' }, isUnlocked: false }
    ];
  }

  private getLastTemplateUsage(userId: string, templateId: string): Date | null {
    const userQuests = this.userQuests.get(userId) || [];
    const templateQuests = userQuests.filter(q => q.metadata.templateId === templateId);
    
    if (templateQuests.length === 0) return null;
    
    return templateQuests.reduce((latest, quest) => 
      quest.assignedDate > latest ? quest.assignedDate : latest, 
      new Date(0)
    );
  }

  private checkRequirement(requirement: any, userId: string, userMetrics?: PerformanceMetrics): boolean {
    // Simplified requirement checking - would implement based on actual user data
    return true;
  }

  private getPersonalizedWeight(userId: string, template: QuestTemplate): number {
    // Would implement based on user preferences and completion history
    return 1.0;
  }

  private randomInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private fillTemplate(template: string, variables: { [key: string]: any }): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }
    return result;
  }

  /**
   * Initialize default quest templates
   */
  private initializeQuestTemplates(): void {
    const templates: QuestTemplate[] = [
      {
        id: 'daily_challenge_easy',
        name: 'Daily Challenge - Easy',
        questType: QuestType.DAILY_CHALLENGE,
        difficulty: 'easy',
        titleTemplate: 'Daily Practice',
        descriptionTemplate: 'Complete some challenges to keep your skills sharp!',
        objectiveTemplates: [
          {
            type: ObjectiveType.COMPLETE_CHALLENGES,
            targetRange: { min: 3, max: 5 },
            descriptionTemplate: 'Complete {target} challenges in any realm'
          }
        ],
        rewardTemplates: [
          {
            type: 'xp',
            amountRange: { min: 50, max: 100 },
            description: 'Experience points'
          },
          {
            type: 'gold',
            amountRange: { min: 25, max: 50 },
            description: 'Gold coins'
          }
        ],
        requirements: [],
        weight: 1.0,
        cooldownDays: 1,
        tags: ['daily', 'practice']
      },
      {
        id: 'accuracy_master_medium',
        name: 'Accuracy Master - Medium',
        questType: QuestType.ACCURACY_MASTER,
        difficulty: 'medium',
        titleTemplate: 'Precision Training',
        descriptionTemplate: 'Show your mastery by achieving high accuracy!',
        objectiveTemplates: [
          {
            type: ObjectiveType.ACHIEVE_ACCURACY,
            targetRange: { min: 80, max: 90 },
            descriptionTemplate: 'Achieve {target}% accuracy in 5 challenges'
          }
        ],
        rewardTemplates: [
          {
            type: 'xp',
            amountRange: { min: 100, max: 150 },
            description: 'Accuracy bonus XP'
          },
          {
            type: 'badge',
            itemPool: ['precision_badge', 'accuracy_badge'],
            description: 'Accuracy achievement badge',
            probability: 0.3
          }
        ],
        requirements: [
          {
            type: 'min_level',
            value: 3,
            description: 'Requires level 3 or higher'
          }
        ],
        weight: 0.8,
        cooldownDays: 2,
        tags: ['accuracy', 'skill']
      },
      {
        id: 'realm_explorer_easy',
        name: 'Realm Explorer - Easy',
        questType: QuestType.REALM_EXPLORER,
        difficulty: 'easy',
        titleTemplate: 'Explore New Territories',
        descriptionTemplate: 'Visit different realms and expand your knowledge!',
        objectiveTemplates: [
          {
            type: ObjectiveType.VISIT_REALMS,
            targetRange: { min: 2, max: 3 },
            descriptionTemplate: 'Visit {target} different realms'
          }
        ],
        rewardTemplates: [
          {
            type: 'xp',
            amountRange: { min: 75, max: 125 },
            description: 'Exploration XP'
          },
          {
            type: 'gold',
            amountRange: { min: 30, max: 60 },
            description: 'Explorer\'s reward'
          }
        ],
        requirements: [],
        weight: 0.7,
        cooldownDays: 3,
        tags: ['exploration', 'variety']
      },
      {
        id: 'speed_demon_hard',
        name: 'Speed Demon - Hard',
        questType: QuestType.SPEED_DEMON,
        difficulty: 'hard',
        titleTemplate: 'Lightning Fast',
        descriptionTemplate: 'Complete challenges at lightning speed!',
        objectiveTemplates: [
          {
            type: ObjectiveType.COMPLETE_IN_TIME,
            targetRange: { min: 3, max: 5 },
            descriptionTemplate: 'Complete {target} challenges in under 30 seconds each'
          }
        ],
        rewardTemplates: [
          {
            type: 'xp',
            amountRange: { min: 150, max: 250 },
            description: 'Speed mastery XP'
          },
          {
            type: 'badge',
            itemPool: ['speed_demon_badge', 'lightning_badge'],
            description: 'Speed achievement badge',
            probability: 0.5
          },
          {
            type: 'streak_multiplier',
            amountRange: { min: 1.2, max: 1.2 },
            description: '20% streak bonus for next quest'
          }
        ],
        requirements: [
          {
            type: 'min_level',
            value: 5,
            description: 'Requires level 5 or higher'
          }
        ],
        weight: 0.6,
        cooldownDays: 5,
        tags: ['speed', 'challenge', 'advanced']
      },
      {
        id: 'streak_keeper_medium',
        name: 'Streak Keeper - Medium',
        questType: QuestType.STREAK_KEEPER,
        difficulty: 'medium',
        titleTemplate: 'Maintain the Flow',
        descriptionTemplate: 'Keep your learning streak alive!',
        objectiveTemplates: [
          {
            type: ObjectiveType.MAINTAIN_STREAK,
            targetRange: { min: 3, max: 7 },
            descriptionTemplate: 'Maintain a {target}-day learning streak'
          }
        ],
        rewardTemplates: [
          {
            type: 'xp',
            amountRange: { min: 100, max: 200 },
            description: 'Consistency bonus XP'
          },
          {
            type: 'gold',
            amountRange: { min: 50, max: 100 },
            description: 'Streak maintenance reward'
          }
        ],
        requirements: [],
        weight: 0.4,
        cooldownDays: 7,
        tags: ['streak', 'consistency']
      }
    ];

    templates.forEach(template => {
      this.questTemplates.set(template.id, template);
    });
  }
}