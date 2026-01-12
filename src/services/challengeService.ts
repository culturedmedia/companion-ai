import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  type: 'tasks' | 'streak' | 'wellness' | 'social' | 'special';
  requirement: number;
  progress: number;
  reward: {
    coins: number;
    xp: number;
  };
  emoji: string;
  expiresAt: Date;
  completed: boolean;
}

// Challenge templates
const CHALLENGE_TEMPLATES = {
  tasks: [
    { title: 'Task Master', description: 'Complete {n} tasks today', requirement: 3, coins: 30, xp: 50, emoji: '✅' },
    { title: 'Productivity Pro', description: 'Complete {n} tasks today', requirement: 5, coins: 50, xp: 80, emoji: '🚀' },
    { title: 'Overachiever', description: 'Complete {n} tasks today', requirement: 7, coins: 75, xp: 120, emoji: '⭐' },
    { title: 'High Priority Hero', description: 'Complete {n} high priority tasks', requirement: 2, coins: 40, xp: 60, emoji: '🔥' },
    { title: 'Early Bird', description: 'Complete a task before 9 AM', requirement: 1, coins: 25, xp: 40, emoji: '🌅' },
  ],
  streak: [
    { title: 'Consistency King', description: 'Maintain your streak for {n} days', requirement: 3, coins: 40, xp: 60, emoji: '👑' },
    { title: 'Week Warrior', description: 'Maintain your streak for {n} days', requirement: 7, coins: 100, xp: 150, emoji: '💪' },
    { title: 'Streak Starter', description: 'Start a new streak', requirement: 1, coins: 20, xp: 30, emoji: '🔥' },
  ],
  wellness: [
    { title: 'Mindful Moment', description: 'Complete a breathing exercise', requirement: 1, coins: 20, xp: 30, emoji: '🧘' },
    { title: 'Zen Master', description: 'Complete {n} meditation sessions', requirement: 2, coins: 35, xp: 50, emoji: '🌸' },
    { title: 'Journal Journey', description: 'Write a journal entry', requirement: 1, coins: 25, xp: 40, emoji: '📔' },
    { title: 'Mood Tracker', description: 'Log your mood {n} times', requirement: 3, coins: 30, xp: 45, emoji: '😊' },
  ],
  social: [
    { title: 'Good Vibes', description: 'Send encouragement to a friend', requirement: 1, coins: 20, xp: 30, emoji: '💝' },
    { title: 'Social Butterfly', description: 'Send {n} vibes to friends', requirement: 3, coins: 40, xp: 60, emoji: '🦋' },
    { title: 'Team Player', description: 'Complete a family task', requirement: 1, coins: 30, xp: 45, emoji: '👨‍👩‍👧‍👦' },
  ],
  special: [
    { title: 'Perfect Day', description: 'Complete all your tasks for the day', requirement: 1, coins: 100, xp: 150, emoji: '🏆' },
    { title: 'Voice Commander', description: 'Add {n} tasks using voice', requirement: 3, coins: 35, xp: 50, emoji: '🎤' },
    { title: 'Category Champion', description: 'Complete tasks in {n} different categories', requirement: 3, coins: 45, xp: 70, emoji: '🎯' },
    { title: 'Time Lord', description: 'Complete all tasks before their due time', requirement: 1, coins: 50, xp: 80, emoji: '⏰' },
  ],
};

const STORAGE_KEY = '@daily_challenges';

class ChallengeService {
  private challenges: DailyChallenge[] = [];
  private lastGeneratedDate: string | null = null;

  // Load challenges from storage
  async loadChallenges(): Promise<DailyChallenge[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        
        // Check if challenges are from today
        const today = new Date().toDateString();
        if (data.date === today) {
          this.challenges = data.challenges.map((c: any) => ({
            ...c,
            expiresAt: new Date(c.expiresAt),
          }));
          this.lastGeneratedDate = data.date;
          return this.challenges;
        }
      }
      
      // Generate new challenges for today
      return this.generateDailyChallenges();
    } catch (error) {
      console.error('Failed to load challenges:', error);
      return this.generateDailyChallenges();
    }
  }

  // Save challenges to storage
  private async saveChallenges(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        date: new Date().toDateString(),
        challenges: this.challenges,
      }));
    } catch (error) {
      console.error('Failed to save challenges:', error);
    }
  }

  // Generate daily challenges
  generateDailyChallenges(): DailyChallenge[] {
    const today = new Date();
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Pick 3-4 random challenges from different categories
    const categories = Object.keys(CHALLENGE_TEMPLATES) as Array<keyof typeof CHALLENGE_TEMPLATES>;
    const selectedChallenges: DailyChallenge[] = [];
    const usedCategories = new Set<string>();

    // Ensure variety - one from each category type
    const shuffledCategories = categories.sort(() => Math.random() - 0.5);
    
    for (const category of shuffledCategories) {
      if (selectedChallenges.length >= 4) break;
      if (usedCategories.has(category)) continue;

      const templates = CHALLENGE_TEMPLATES[category];
      const template = templates[Math.floor(Math.random() * templates.length)];
      
      selectedChallenges.push({
        id: `${category}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: template.title,
        description: template.description.replace('{n}', template.requirement.toString()),
        type: category,
        requirement: template.requirement,
        progress: 0,
        reward: {
          coins: template.coins,
          xp: template.xp,
        },
        emoji: template.emoji,
        expiresAt: endOfDay,
        completed: false,
      });

      usedCategories.add(category);
    }

    this.challenges = selectedChallenges;
    this.lastGeneratedDate = today.toDateString();
    this.saveChallenges();

    return this.challenges;
  }

  // Update challenge progress
  async updateProgress(
    type: DailyChallenge['type'],
    amount: number = 1,
    specificChallengeId?: string
  ): Promise<{ completed: DailyChallenge[]; rewards: { coins: number; xp: number } }> {
    const completedChallenges: DailyChallenge[] = [];
    let totalCoins = 0;
    let totalXp = 0;

    for (const challenge of this.challenges) {
      if (challenge.completed) continue;
      
      // Check if this update applies to this challenge
      const matches = specificChallengeId 
        ? challenge.id === specificChallengeId
        : challenge.type === type;
      
      if (matches) {
        challenge.progress = Math.min(challenge.progress + amount, challenge.requirement);
        
        if (challenge.progress >= challenge.requirement && !challenge.completed) {
          challenge.completed = true;
          completedChallenges.push(challenge);
          totalCoins += challenge.reward.coins;
          totalXp += challenge.reward.xp;
        }
      }
    }

    await this.saveChallenges();

    return {
      completed: completedChallenges,
      rewards: { coins: totalCoins, xp: totalXp },
    };
  }

  // Get current challenges
  getChallenges(): DailyChallenge[] {
    return this.challenges;
  }

  // Get active (incomplete) challenges
  getActiveChallenges(): DailyChallenge[] {
    return this.challenges.filter(c => !c.completed);
  }

  // Get completed challenges
  getCompletedChallenges(): DailyChallenge[] {
    return this.challenges.filter(c => c.completed);
  }

  // Check if all challenges are complete
  allChallengesComplete(): boolean {
    return this.challenges.every(c => c.completed);
  }

  // Get total possible rewards
  getTotalPossibleRewards(): { coins: number; xp: number } {
    return this.challenges.reduce(
      (acc, c) => ({
        coins: acc.coins + c.reward.coins,
        xp: acc.xp + c.reward.xp,
      }),
      { coins: 0, xp: 0 }
    );
  }

  // Get earned rewards
  getEarnedRewards(): { coins: number; xp: number } {
    return this.challenges
      .filter(c => c.completed)
      .reduce(
        (acc, c) => ({
          coins: acc.coins + c.reward.coins,
          xp: acc.xp + c.reward.xp,
        }),
        { coins: 0, xp: 0 }
      );
  }

  // Record challenge completion to database
  async recordCompletion(userId: string, challenge: DailyChallenge): Promise<void> {
    try {
      await supabase.from('challenge_completions').insert({
        user_id: userId,
        challenge_id: challenge.id,
        challenge_type: challenge.type,
        coins_earned: challenge.reward.coins,
        xp_earned: challenge.reward.xp,
      });
    } catch (error) {
      console.error('Failed to record challenge completion:', error);
    }
  }
}

export const challengeService = new ChallengeService();
export default challengeService;
