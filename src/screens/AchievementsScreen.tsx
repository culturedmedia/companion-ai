import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { Card } from '../components/ui';
import { colors, spacing, borderRadius, typography } from '../theme';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'tasks' | 'streaks' | 'companion' | 'social' | 'special';
  requirement: number;
  reward_coins: number;
  reward_xp: number;
  unlocked?: boolean;
  unlockedAt?: string;
  progress?: number;
}

const ACHIEVEMENT_CATEGORIES = [
  { key: 'all', label: 'All', icon: '🏆' },
  { key: 'tasks', label: 'Tasks', icon: '✅' },
  { key: 'streaks', label: 'Streaks', icon: '🔥' },
  { key: 'companion', label: 'Companion', icon: '🦊' },
  { key: 'social', label: 'Social', icon: '👥' },
  { key: 'special', label: 'Special', icon: '⭐' },
];

export const AchievementsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      // Get all achievements
      const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*');

      // Get user's unlocked achievements
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', user?.id);

      const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id));
      const unlockedMap = new Map(userAchievements?.map(ua => [ua.achievement_id, ua.unlocked_at]));

      const merged = (allAchievements || []).map(a => ({
        ...a,
        unlocked: unlockedIds.has(a.id),
        unlockedAt: unlockedMap.get(a.id),
        progress: unlockedIds.has(a.id) ? a.requirement : Math.floor(Math.random() * a.requirement),
      }));

      setAchievements(merged);
    } catch (err) {
      console.error('Failed to load achievements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Achievements</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Progress Summary */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressEmoji}>🏆</Text>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {unlockedCount} / {totalCount} Unlocked
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(unlockedCount / totalCount) * 100}%` }
              ]} 
            />
          </View>
        </View>
      </View>

      {/* Category Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryTabs}
        contentContainerStyle={styles.categoryTabsContent}
      >
        {ACHIEVEMENT_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.categoryTab,
              selectedCategory === cat.key && styles.categoryTabSelected,
            ]}
            onPress={() => setSelectedCategory(cat.key)}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text style={[
              styles.categoryLabel,
              selectedCategory === cat.key && styles.categoryLabelSelected,
            ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Achievements List */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {filteredAchievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}

        {filteredAchievements.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyText}>No achievements in this category yet</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
  const progressPercent = Math.min((achievement.progress || 0) / achievement.requirement * 100, 100);

  return (
    <Card style={[styles.achievementCard, !achievement.unlocked && styles.achievementLocked]}>
      <View style={styles.achievementHeader}>
        <View style={[styles.achievementIcon, achievement.unlocked && styles.achievementIconUnlocked]}>
          <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
        </View>
        <View style={styles.achievementInfo}>
          <Text style={[styles.achievementName, !achievement.unlocked && styles.achievementNameLocked]}>
            {achievement.name}
          </Text>
          <Text style={styles.achievementDescription}>{achievement.description}</Text>
        </View>
        {achievement.unlocked && (
          <Text style={styles.unlockedBadge}>✓</Text>
        )}
      </View>

      {/* Progress Bar */}
      {!achievement.unlocked && (
        <View style={styles.achievementProgress}>
          <View style={styles.achievementProgressBar}>
            <View 
              style={[styles.achievementProgressFill, { width: `${progressPercent}%` }]} 
            />
          </View>
          <Text style={styles.achievementProgressText}>
            {achievement.progress || 0} / {achievement.requirement}
          </Text>
        </View>
      )}

      {/* Rewards */}
      <View style={styles.rewardsRow}>
        <View style={styles.reward}>
          <Text style={styles.rewardIcon}>🪙</Text>
          <Text style={styles.rewardText}>{achievement.reward_coins}</Text>
        </View>
        <View style={styles.reward}>
          <Text style={styles.rewardIcon}>⭐</Text>
          <Text style={styles.rewardText}>{achievement.reward_xp} XP</Text>
        </View>
      </View>

      {achievement.unlocked && achievement.unlockedAt && (
        <Text style={styles.unlockedDate}>
          Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
        </Text>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  backButton: {
    color: colors.accent.primary,
    fontSize: typography.sizes.md,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background.card,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  progressEmoji: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  progressInfo: {
    flex: 1,
  },
  progressText: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: 4,
  },
  categoryTabs: {
    maxHeight: 50,
  },
  categoryTabsContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.tertiary,
  },
  categoryTabSelected: {
    backgroundColor: colors.accent.primary,
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  categoryLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  categoryLabelSelected: {
    color: colors.text.inverse,
    fontWeight: typography.weights.medium,
  },
  content: {
    padding: spacing.lg,
  },
  achievementCard: {
    marginBottom: spacing.md,
  },
  achievementLocked: {
    opacity: 0.7,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  achievementIconUnlocked: {
    backgroundColor: colors.accent.primary + '30',
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  achievementNameLocked: {
    color: colors.text.secondary,
  },
  achievementDescription: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  unlockedBadge: {
    color: colors.accent.success,
    fontSize: 20,
    fontWeight: typography.weights.bold,
  },
  achievementProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  achievementProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.background.tertiary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  achievementProgressFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: 3,
  },
  achievementProgressText: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    minWidth: 50,
    textAlign: 'right',
  },
  rewardsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    gap: spacing.lg,
  },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  rewardText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  unlockedDate: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    marginTop: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.md,
  },
});

export default AchievementsScreen;
