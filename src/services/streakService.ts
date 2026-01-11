import { supabase } from '../lib/supabase';

export interface Streak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
  streak_protected: boolean;
  protection_used_date?: string;
  created_at: string;
  updated_at: string;
}

export interface StreakReward {
  coins: number;
  xp: number;
  message: string;
}

class StreakService {
  // Get user's streak data
  async getStreak(userId: string): Promise<Streak | null> {
    try {
      const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No streak found, create one
          return this.createStreak(userId);
        }
        throw error;
      }

      return data as Streak;
    } catch (error) {
      console.error('Error fetching streak:', error);
      return null;
    }
  }

  // Create initial streak for new user
  async createStreak(userId: string): Promise<Streak | null> {
    try {
      const { data, error } = await supabase
        .from('streaks')
        .insert({
          user_id: userId,
          current_streak: 0,
          longest_streak: 0,
          last_activity_date: null,
          streak_protected: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Streak;
    } catch (error) {
      console.error('Error creating streak:', error);
      return null;
    }
  }

  // Record activity and update streak
  async recordActivity(userId: string): Promise<{ streak: Streak | null; reward: StreakReward | null }> {
    try {
      const streak = await this.getStreak(userId);
      if (!streak) {
        return { streak: null, reward: null };
      }

      const today = new Date().toISOString().split('T')[0];
      const lastActivity = streak.last_activity_date;

      // Already recorded activity today
      if (lastActivity === today) {
        return { streak, reward: null };
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = streak.current_streak;
      let reward: StreakReward | null = null;

      if (lastActivity === yesterdayStr) {
        // Continuing streak
        newStreak += 1;
        reward = this.calculateStreakReward(newStreak);
      } else if (lastActivity && lastActivity < yesterdayStr) {
        // Check if protection is available
        if (streak.streak_protected && streak.protection_used_date !== yesterdayStr) {
          // Use streak protection
          newStreak = streak.current_streak + 1;
          reward = this.calculateStreakReward(newStreak);
          
          await supabase
            .from('streaks')
            .update({
              current_streak: newStreak,
              longest_streak: Math.max(newStreak, streak.longest_streak),
              last_activity_date: today,
              streak_protected: false,
              protection_used_date: yesterdayStr,
              updated_at: new Date().toISOString(),
            })
            .eq('id', streak.id);

          const updatedStreak = await this.getStreak(userId);
          return { streak: updatedStreak, reward };
        } else {
          // Streak broken
          newStreak = 1;
          reward = this.calculateStreakReward(newStreak);
        }
      } else {
        // First activity ever
        newStreak = 1;
        reward = this.calculateStreakReward(newStreak);
      }

      // Update streak
      const { error } = await supabase
        .from('streaks')
        .update({
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, streak.longest_streak),
          last_activity_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('id', streak.id);

      if (error) throw error;

      const updatedStreak = await this.getStreak(userId);
      return { streak: updatedStreak, reward };
    } catch (error) {
      console.error('Error recording activity:', error);
      return { streak: null, reward: null };
    }
  }

  // Calculate rewards based on streak length
  calculateStreakReward(streakDays: number): StreakReward {
    let coins = 5;
    let xp = 10;
    let message = `🔥 ${streakDays} day streak!`;

    // Milestone bonuses
    if (streakDays === 7) {
      coins = 50;
      xp = 100;
      message = '🎉 1 Week Streak! Amazing dedication!';
    } else if (streakDays === 14) {
      coins = 100;
      xp = 200;
      message = '🌟 2 Week Streak! You\'re on fire!';
    } else if (streakDays === 30) {
      coins = 250;
      xp = 500;
      message = '🏆 1 Month Streak! Incredible!';
    } else if (streakDays === 60) {
      coins = 500;
      xp = 1000;
      message = '💎 2 Month Streak! Legendary!';
    } else if (streakDays === 100) {
      coins = 1000;
      xp = 2000;
      message = '👑 100 Day Streak! You\'re unstoppable!';
    } else if (streakDays === 365) {
      coins = 5000;
      xp = 10000;
      message = '🎊 1 YEAR STREAK! Absolutely incredible!';
    } else if (streakDays % 7 === 0) {
      // Weekly bonus
      coins = 25 + Math.floor(streakDays / 7) * 5;
      xp = 50 + Math.floor(streakDays / 7) * 10;
      message = `🔥 ${streakDays} day streak! Weekly bonus!`;
    } else {
      // Daily bonus scales with streak
      coins = 5 + Math.floor(streakDays / 10);
      xp = 10 + Math.floor(streakDays / 5);
    }

    return { coins, xp, message };
  }

  // Purchase streak protection
  async purchaseProtection(userId: string, cost: number = 100): Promise<boolean> {
    try {
      const streak = await this.getStreak(userId);
      if (!streak) return false;

      if (streak.streak_protected) {
        // Already protected
        return false;
      }

      // Deduct coins (handled by wallet store)
      // This just enables protection
      const { error } = await supabase
        .from('streaks')
        .update({
          streak_protected: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', streak.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error purchasing protection:', error);
      return false;
    }
  }

  // Check if streak is at risk (no activity today)
  async isStreakAtRisk(userId: string): Promise<boolean> {
    const streak = await this.getStreak(userId);
    if (!streak || streak.current_streak === 0) return false;

    const today = new Date().toISOString().split('T')[0];
    return streak.last_activity_date !== today;
  }

  // Get streak milestones
  getUpcomingMilestones(currentStreak: number): { days: number; reward: StreakReward }[] {
    const milestones = [7, 14, 30, 60, 100, 365];
    return milestones
      .filter(m => m > currentStreak)
      .slice(0, 3)
      .map(days => ({
        days,
        reward: this.calculateStreakReward(days),
      }));
  }
}

export const streakService = new StreakService();
export default streakService;
