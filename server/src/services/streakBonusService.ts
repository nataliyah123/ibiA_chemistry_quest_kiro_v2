import { StreakData, QuestReward } from '../types/dailyQuest.js';

export interface LoginStreak {
    userId: string;
    currentStreak: number;
    longestStreak: number;
    lastLoginDate: Date;
    streakStartDate: Date;
    streakMultiplier: number;
    missedDays: number;
    recoveryUsed: boolean;
}

export interface StreakMilestone {
    day: number;
    reward: QuestReward;
    title: string;
    description: string;
    badge?: string;
}

export interface StreakBonus {
    type: 'xp_multiplier' | 'gold_multiplier' | 'challenge_bonus' | 'special_reward';
    multiplier?: number;
    bonusAmount?: number;
    description: string;
    duration?: number; // in minutes
}

export interface StreakRecovery {
    userId: string;
    availableRecoveries: number;
    lastRecoveryDate?: Date;
    recoveryType: 'free' | 'premium' | 'earned';
}

export class StreakBonusService {
    private streaks: Map<string, LoginStreak> = new Map();
    private recoveries: Map<string, StreakRecovery> = new Map();

    // Streak milestone rewards
    private milestones: StreakMilestone[] = [
        {
            day: 3,
            reward: { type: 'gold', amount: 100, description: '100 gold coins reward' },
            title: 'Getting Started',
            description: 'Complete 3 days in a row'
        },
        {
            day: 7,
            reward: { type: 'xp', amount: 200, description: '200 experience points' },
            title: 'Week Warrior',
            description: 'Complete a full week',
            badge: 'week_warrior'
        },
        {
            day: 14,
            reward: { type: 'badge', description: 'Two Week Champion Badge' },
            title: 'Two Week Champion',
            description: 'Maintain streak for 2 weeks'
        },
        {
            day: 30,
            reward: { type: 'item', description: 'Monthly Master Chest', itemId: 'monthly_master_chest' },
            title: 'Monthly Master',
            description: 'Complete 30 days straight',
            badge: 'monthly_master'
        },
        {
            day: 50,
            reward: { type: 'gold', amount: 1000, description: '1000 gold coins reward' },
            title: 'Dedication Expert',
            description: 'Show incredible dedication'
        },
        {
            day: 100,
            reward: { type: 'badge', description: 'Legendary Alchemist Title' },
            title: 'Legendary Alchemist',
            description: 'Achieve legendary status',
            badge: 'legendary_alchemist'
        }
    ];

    /**
     * Record user login and update streak
     */
    async recordLogin(userId: string): Promise<LoginStreak> {
        const now = new Date();
        const today = this.getDateString(now);

        let streak = this.streaks.get(userId);

        if (!streak) {
            // First time login
            streak = {
                userId,
                currentStreak: 1,
                longestStreak: 1,
                lastLoginDate: now,
                streakStartDate: now,
                streakMultiplier: 1.0,
                missedDays: 0,
                recoveryUsed: false
            };
        } else {
            const lastLoginDay = this.getDateString(streak.lastLoginDate);
            const daysDiff = this.getDaysDifference(streak.lastLoginDate, now);

            if (lastLoginDay === today) {
                // Already logged in today, no change
                return streak;
            } else if (daysDiff === 1) {
                // Consecutive day login
                streak.currentStreak++;
                streak.lastLoginDate = now;
                streak.streakMultiplier = this.calculateStreakMultiplier(streak.currentStreak);
                streak.recoveryUsed = false;

                // Update longest streak if needed
                if (streak.currentStreak > streak.longestStreak) {
                    streak.longestStreak = streak.currentStreak;
                }
            } else if (daysDiff > 1) {
                // Streak broken
                const wasRecovered = await this.attemptStreakRecovery(userId, daysDiff);

                if (wasRecovered) {
                    // Streak recovered, continue as if no break
                    streak.currentStreak++;
                    streak.lastLoginDate = now;
                    streak.recoveryUsed = true;
                } else {
                    // Streak broken, reset
                    streak.currentStreak = 1;
                    streak.streakStartDate = now;
                    streak.lastLoginDate = now;
                    streak.streakMultiplier = 1.0;
                    streak.missedDays = daysDiff - 1;
                    streak.recoveryUsed = false;
                }
            }
        }

        this.streaks.set(userId, streak);

        // Check for milestone rewards
        await this.checkMilestoneRewards(userId, streak);

        return streak;
    }

    /**
     * Get current streak for user
     */
    getStreak(userId: string): LoginStreak | null {
        return this.streaks.get(userId) || null;
    }

    /**
     * Calculate current streak bonus
     */
    getCurrentBonus(userId: string): StreakBonus[] {
        const streak = this.streaks.get(userId);
        if (!streak || streak.currentStreak < 2) {
            return [];
        }

        const bonuses: StreakBonus[] = [];

        // XP multiplier bonus
        if (streak.currentStreak >= 3) {
            bonuses.push({
                type: 'xp_multiplier',
                multiplier: streak.streakMultiplier,
                description: `${Math.round((streak.streakMultiplier - 1) * 100)}% XP bonus from ${streak.currentStreak}-day streak`
            });
        }

        // Gold multiplier bonus
        if (streak.currentStreak >= 5) {
            const goldMultiplier = 1 + (streak.currentStreak - 5) * 0.05; // 5% per day after 5
            bonuses.push({
                type: 'gold_multiplier',
                multiplier: Math.min(goldMultiplier, 2.0), // Cap at 2x
                description: `${Math.round((goldMultiplier - 1) * 100)}% gold bonus from streak`
            });
        }

        // Challenge bonus
        if (streak.currentStreak >= 7) {
            bonuses.push({
                type: 'challenge_bonus',
                bonusAmount: Math.floor(streak.currentStreak / 7) * 10,
                description: `+${Math.floor(streak.currentStreak / 7) * 10} bonus points per challenge`
            });
        }

        // Special weekly bonus
        if (streak.currentStreak % 7 === 0 && streak.currentStreak >= 7) {
            bonuses.push({
                type: 'special_reward',
                description: 'Weekly streak bonus: Extra daily quest available',
                duration: 24 * 60 // 24 hours
            });
        }

        return bonuses;
    }

    /**
     * Get available streak recovery options
     */
    getRecoveryOptions(userId: string): StreakRecovery {
        let recovery = this.recoveries.get(userId);

        if (!recovery) {
            recovery = {
                userId,
                availableRecoveries: 1, // Everyone gets 1 free recovery per month
                recoveryType: 'free'
            };
            this.recoveries.set(userId, recovery);
        }

        // Reset monthly free recovery
        const now = new Date();
        if (recovery.lastRecoveryDate) {
            const monthsDiff = this.getMonthsDifference(recovery.lastRecoveryDate, now);
            if (monthsDiff >= 1 && recovery.recoveryType === 'free') {
                recovery.availableRecoveries = Math.min(recovery.availableRecoveries + 1, 2);
            }
        }

        return recovery;
    }

    /**
     * Use streak recovery
     */
    async useStreakRecovery(userId: string, recoveryType: 'free' | 'premium' = 'free'): Promise<boolean> {
        const recovery = this.getRecoveryOptions(userId);

        if (recovery.availableRecoveries <= 0) {
            return false;
        }

        // Deduct recovery
        recovery.availableRecoveries--;
        recovery.lastRecoveryDate = new Date();
        recovery.recoveryType = recoveryType;

        this.recoveries.set(userId, recovery);
        return true;
    }

    /**
     * Get streak milestones and progress
     */
    getStreakMilestones(userId: string): Array<StreakMilestone & { achieved: boolean; progress: number }> {
        const streak = this.streaks.get(userId);
        const currentStreak = streak?.currentStreak || 0;

        return this.milestones.map(milestone => ({
            ...milestone,
            achieved: currentStreak >= milestone.day,
            progress: Math.min(currentStreak / milestone.day, 1)
        }));
    }

    /**
     * Get streak statistics
     */
    getStreakStats(userId: string): {
        currentStreak: number;
        longestStreak: number;
        totalDaysActive: number;
        streakMultiplier: number;
        milestonesAchieved: number;
        recoveryUsed: boolean;
    } {
        const streak = this.streaks.get(userId);
        const milestones = this.getStreakMilestones(userId);

        return {
            currentStreak: streak?.currentStreak || 0,
            longestStreak: streak?.longestStreak || 0,
            totalDaysActive: this.calculateTotalActiveDays(userId),
            streakMultiplier: streak?.streakMultiplier || 1.0,
            milestonesAchieved: milestones.filter(m => m.achieved).length,
            recoveryUsed: streak?.recoveryUsed || false
        };
    }

    /**
     * Reset streak (for testing or admin purposes)
     */
    resetStreak(userId: string): void {
        this.streaks.delete(userId);
        this.recoveries.delete(userId);
    }

    /**
     * Private helper methods
     */
    private calculateStreakMultiplier(streakDays: number): number {
        // Progressive multiplier: 1.0 + (days - 1) * 0.05, capped at 2.5x
        const multiplier = 1.0 + Math.min(streakDays - 1, 30) * 0.05;
        return Math.min(multiplier, 2.5);
    }

    private async attemptStreakRecovery(userId: string, daysMissed: number): Promise<boolean> {
        // Only allow recovery for 1-2 missed days
        if (daysMissed > 2) {
            return false;
        }

        const recovery = this.getRecoveryOptions(userId);
        if (recovery.availableRecoveries > 0) {
            return await this.useStreakRecovery(userId, 'free');
        }

        return false;
    }

    private async checkMilestoneRewards(userId: string, streak: LoginStreak): Promise<void> {
        const milestone = this.milestones.find(m => m.day === streak.currentStreak);

        if (milestone) {
            // Award milestone reward
            console.log(`User ${userId} achieved milestone: ${milestone.title}`);
            // This would integrate with the reward system to actually give rewards
            await this.awardMilestoneReward(userId, milestone);
        }
    }

    private async awardMilestoneReward(userId: string, milestone: StreakMilestone): Promise<void> {
        // This would integrate with the character service to award rewards
        console.log(`Awarding milestone reward to ${userId}:`, milestone.reward);
        // Implementation would depend on the reward system integration
    }

    private getDateString(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    private getDaysDifference(date1: Date, date2: Date): number {
        const oneDay = 24 * 60 * 60 * 1000;
        const firstDate = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
        const secondDate = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());

        return Math.round((secondDate.getTime() - firstDate.getTime()) / oneDay);
    }

    private getMonthsDifference(date1: Date, date2: Date): number {
        return (date2.getFullYear() - date1.getFullYear()) * 12 +
            (date2.getMonth() - date1.getMonth());
    }

    private calculateTotalActiveDays(userId: string): number {
        // This would calculate from historical data
        // For now, return current streak as approximation
        const streak = this.streaks.get(userId);
        return streak?.currentStreak || 0;
    }
}