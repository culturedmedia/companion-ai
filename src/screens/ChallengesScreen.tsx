import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { challengeService, DailyChallenge } from '../services/challengeService';
import { Card } from '../components/ui';
import { colors, spacing, borderRadius, typography } from '../theme';

export const ChallengesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const data = await challengeService.loadChallenges();
      setChallenges(data);
    } catch (error) {
      console.error('Failed to load challenges:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    
    const diff = endOfDay.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const totalRewards = challengeService.getTotalPossibleRewards();
  const earnedRewards = challengeService.getEarnedRewards();
  const completedCount = challenges.filter(c => c.completed).length;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Daily Challenges</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              loadChallenges();
            }}
            tintColor={colors.accent.primary}
          />
        }
      >
        {/* Timer Card */}
        <Card style={styles.timerCard}>
          <View style={styles.timerRow}>
            <View>
              <Text style={styles.timerLabel}>Time Remaining</Text>
              <Text style={styles.timerValue}>{getTimeRemaining()}</Text>
            </View>
            <View style={styles.progressCircle}>
              <Text style={styles.progressText}>
                {completedCount}/{challenges.length}
              </Text>
            </View>
          </View>
        </Card>

        {/* Rewards Summary */}
        <Card style={styles.rewardsCard}>
          <Text style={styles.rewardsTitle}>Today's Rewards</Text>
          <View style={styles.rewardsRow}>
            <View style={styles.rewardItem}>
              <Text style={styles.rewardEmoji}>🪙</Text>
              <Text style={styles.rewardValue}>
                {earnedRewards.coins}/{totalRewards.coins}
              </Text>
              <Text style={styles.rewardLabel}>Coins</Text>
            </View>
            <View style={styles.rewardDivider} />
            <View style={styles.rewardItem}>
              <Text style={styles.rewardEmoji}>⭐</Text>
              <Text style={styles.rewardValue}>
                {earnedRewards.xp}/{totalRewards.xp}
              </Text>
              <Text style={styles.rewardLabel}>XP</Text>
            </View>
          </View>
        </Card>

        {/* Challenges List */}
        <Text style={styles.sectionTitle}>Today's Challenges</Text>
        
        {challenges.map(challenge => (
          <Card 
            key={challenge.id} 
            style={[
              styles.challengeCard,
              challenge.completed && styles.challengeCardCompleted,
            ]}
          >
            <View style={styles.challengeHeader}>
              <Text style={styles.challengeEmoji}>{challenge.emoji}</Text>
              <View style={styles.challengeInfo}>
                <Text style={[
                  styles.challengeTitle,
                  challenge.completed && styles.challengeTitleCompleted,
                ]}>
                  {challenge.title}
                </Text>
                <Text style={styles.challengeDescription}>
                  {challenge.description}
                </Text>
              </View>
              {challenge.completed && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>✓</Text>
                </View>
              )}
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${(challenge.progress / challenge.requirement) * 100}%`,
                      backgroundColor: challenge.completed 
                        ? colors.accent.success 
                        : colors.accent.primary,
                    },
                  ]} 
                />
              </View>
              <Text style={styles.progressLabel}>
                {challenge.progress}/{challenge.requirement}
              </Text>
            </View>

            {/* Rewards */}
            <View style={styles.challengeRewards}>
              <View style={styles.challengeReward}>
                <Text style={styles.challengeRewardText}>
                  🪙 {challenge.reward.coins}
                </Text>
              </View>
              <View style={styles.challengeReward}>
                <Text style={styles.challengeRewardText}>
                  ⭐ {challenge.reward.xp} XP
                </Text>
              </View>
            </View>
          </Card>
        ))}

        {/* Tips */}
        <Card style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Tips</Text>
          <Text style={styles.tipsText}>
            • Challenges reset at midnight{'\n'}
            • Complete tasks to progress challenges{'\n'}
            • All challenges = bonus rewards!
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  content: {
    padding: spacing.lg,
  },
  timerCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.accent.primary + '15',
    borderColor: colors.accent.primary + '30',
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  timerValue: {
    color: colors.accent.primary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    color: colors.text.inverse,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  rewardsCard: {
    marginBottom: spacing.lg,
  },
  rewardsTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  rewardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  rewardItem: {
    alignItems: 'center',
  },
  rewardEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  rewardValue: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  rewardLabel: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
  },
  rewardDivider: {
    width: 1,
    height: 50,
    backgroundColor: colors.border.default,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
  },
  challengeCard: {
    marginBottom: spacing.md,
  },
  challengeCardCompleted: {
    backgroundColor: colors.accent.success + '10',
    borderColor: colors.accent.success + '30',
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  challengeEmoji: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  challengeTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.text.tertiary,
  },
  challengeDescription: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  completedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: typography.weights.bold,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.background.tertiary,
    borderRadius: 4,
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    minWidth: 40,
    textAlign: 'right',
  },
  challengeRewards: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  challengeReward: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  challengeRewardText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  tipsCard: {
    marginTop: spacing.md,
    backgroundColor: colors.accent.primary + '10',
    borderColor: colors.accent.primary + '30',
  },
  tipsTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  tipsText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
});

export default ChallengesScreen;
