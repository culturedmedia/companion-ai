import { Share, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';

export interface ShareContent {
  title: string;
  message: string;
  url?: string;
}

export interface AchievementShare {
  achievementName: string;
  achievementEmoji: string;
  companionName: string;
  companionType: string;
  level: number;
  streak?: number;
}

export interface StatsShare {
  tasksCompleted: number;
  streak: number;
  level: number;
  companionName: string;
  period: 'day' | 'week' | 'month';
}

class ShareService {
  private appUrl = 'https://companionai.app'; // Replace with actual app URL
  private appStoreUrl = 'https://apps.apple.com/app/companionai/id123456789'; // Replace
  private playStoreUrl = 'https://play.google.com/store/apps/details?id=com.companionai'; // Replace

  // Basic share
  async share(content: ShareContent): Promise<boolean> {
    try {
      const result = await Share.share({
        title: content.title,
        message: content.message,
        url: content.url,
      });

      return result.action === Share.sharedAction;
    } catch (error) {
      console.error('Share failed:', error);
      return false;
    }
  }

  // Share achievement
  async shareAchievement(achievement: AchievementShare): Promise<boolean> {
    const message = this.generateAchievementMessage(achievement);
    
    return this.share({
      title: `${achievement.achievementEmoji} Achievement Unlocked!`,
      message,
      url: this.appUrl,
    });
  }

  // Share stats
  async shareStats(stats: StatsShare): Promise<boolean> {
    const message = this.generateStatsMessage(stats);
    
    return this.share({
      title: '📊 My Productivity Stats',
      message,
      url: this.appUrl,
    });
  }

  // Share streak
  async shareStreak(streak: number, companionName: string): Promise<boolean> {
    const message = `🔥 ${streak} day streak with ${companionName}!\n\n` +
      `I've been crushing my goals for ${streak} days straight using CompanionAI!\n\n` +
      `Get your own productivity companion: ${this.appUrl}`;

    return this.share({
      title: `🔥 ${streak} Day Streak!`,
      message,
    });
  }

  // Share companion evolution
  async shareEvolution(
    companionName: string,
    evolutionName: string,
    level: number
  ): Promise<boolean> {
    const message = `✨ ${companionName} just evolved into a ${evolutionName}!\n\n` +
      `Level ${level} and still growing! 🌟\n\n` +
      `Get your own companion: ${this.appUrl}`;

    return this.share({
      title: `✨ Evolution: ${evolutionName}!`,
      message,
    });
  }

  // Share completed challenge
  async shareChallenge(
    challengeName: string,
    challengeEmoji: string,
    reward: { coins: number; xp: number }
  ): Promise<boolean> {
    const message = `${challengeEmoji} Challenge Complete: ${challengeName}!\n\n` +
      `Earned ${reward.coins} coins and ${reward.xp} XP! 💰\n\n` +
      `Join me on CompanionAI: ${this.appUrl}`;

    return this.share({
      title: `${challengeEmoji} Challenge Complete!`,
      message,
    });
  }

  // Share app invite
  async shareAppInvite(referralCode?: string): Promise<boolean> {
    let message = `🦊 I've been using CompanionAI to stay productive!\n\n` +
      `It's a fun app with a cute companion that helps you manage tasks and build good habits.\n\n`;

    if (referralCode) {
      message += `Use my code "${referralCode}" for bonus coins! 🎁\n\n`;
    }

    message += `Download it here:\n` +
      `iOS: ${this.appStoreUrl}\n` +
      `Android: ${this.playStoreUrl}`;

    return this.share({
      title: '🦊 Join me on CompanionAI!',
      message,
    });
  }

  // Share image (for Instagram stories, etc.)
  async shareImage(viewRef: any, message?: string): Promise<boolean> {
    try {
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        console.log('Sharing not available');
        return false;
      }

      // Capture the view as an image
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
      });

      // Share the image
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: message || 'Share your achievement!',
      });

      return true;
    } catch (error) {
      console.error('Image share failed:', error);
      return false;
    }
  }

  // Generate shareable card data (for rendering)
  generateShareCard(type: 'achievement' | 'stats' | 'streak' | 'evolution', data: any): {
    title: string;
    subtitle: string;
    emoji: string;
    stats: Array<{ label: string; value: string }>;
    gradient: [string, string];
  } {
    switch (type) {
      case 'achievement':
        return {
          title: data.achievementName,
          subtitle: `Unlocked by ${data.companionName}`,
          emoji: data.achievementEmoji,
          stats: [
            { label: 'Level', value: data.level.toString() },
            { label: 'Streak', value: `${data.streak || 0} days` },
          ],
          gradient: ['#6366f1', '#8b5cf6'],
        };

      case 'stats':
        return {
          title: `${data.period === 'day' ? 'Daily' : data.period === 'week' ? 'Weekly' : 'Monthly'} Stats`,
          subtitle: `${data.companionName}'s Progress`,
          emoji: '📊',
          stats: [
            { label: 'Tasks Done', value: data.tasksCompleted.toString() },
            { label: 'Streak', value: `${data.streak} days` },
            { label: 'Level', value: data.level.toString() },
          ],
          gradient: ['#10b981', '#059669'],
        };

      case 'streak':
        return {
          title: `${data.streak} Day Streak!`,
          subtitle: `${data.companionName} is proud!`,
          emoji: '🔥',
          stats: [
            { label: 'Days', value: data.streak.toString() },
          ],
          gradient: ['#f59e0b', '#d97706'],
        };

      case 'evolution':
        return {
          title: data.evolutionName,
          subtitle: `${data.companionName} evolved!`,
          emoji: '✨',
          stats: [
            { label: 'Level', value: data.level.toString() },
            { label: 'Stage', value: data.stage.toString() },
          ],
          gradient: ['#ec4899', '#be185d'],
        };

      default:
        return {
          title: 'CompanionAI',
          subtitle: 'Your productivity companion',
          emoji: '🦊',
          stats: [],
          gradient: ['#6366f1', '#8b5cf6'],
        };
    }
  }

  // Generate achievement message
  private generateAchievementMessage(achievement: AchievementShare): string {
    return `${achievement.achievementEmoji} Achievement Unlocked: ${achievement.achievementName}!\n\n` +
      `${achievement.companionName} the ${achievement.companionType} helped me earn this at level ${achievement.level}!\n\n` +
      `Get your own productivity companion: ${this.appUrl}`;
  }

  // Generate stats message
  private generateStatsMessage(stats: StatsShare): string {
    const periodText = stats.period === 'day' ? 'today' : 
      stats.period === 'week' ? 'this week' : 'this month';

    return `📊 My productivity stats ${periodText}:\n\n` +
      `✅ ${stats.tasksCompleted} tasks completed\n` +
      `🔥 ${stats.streak} day streak\n` +
      `⭐ Level ${stats.level}\n\n` +
      `${stats.companionName} is helping me stay on track!\n\n` +
      `Try CompanionAI: ${this.appUrl}`;
  }

  // Get platform-specific share URL
  getAppStoreUrl(): string {
    return Platform.OS === 'ios' ? this.appStoreUrl : this.playStoreUrl;
  }
}

export const shareService = new ShareService();
export default shareService;
