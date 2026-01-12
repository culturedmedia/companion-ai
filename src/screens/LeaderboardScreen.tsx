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
import { socialService, LeaderboardEntry } from '../services/socialService';
import { useAuthStore } from '../stores/authStore';
import { Card } from '../components/ui';
import { colors, spacing, borderRadius, typography } from '../theme';
import { ANIMAL_OPTIONS } from '../types';

type Period = 'weekly' | 'monthly' | 'allTime';

export const LeaderboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [period, setPeriod] = useState<Period>('weekly');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, [period]);

  const loadLeaderboard = async () => {
    if (!user?.id) return;

    try {
      const [data, rank] = await Promise.all([
        socialService.getLeaderboard(period, 50),
        socialService.getUserRank(user.id, period),
      ]);

      setLeaderboard(data);
      setUserRank(rank);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getAnimalEmoji = (type?: string) => {
    const animal = ANIMAL_OPTIONS.find(a => a.type === type);
    return animal?.emoji || '🐾';
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return { bg: '#FFD700', text: '#000' };
      case 2:
        return { bg: '#C0C0C0', text: '#000' };
      case 3:
        return { bg: '#CD7F32', text: '#fff' };
      default:
        return { bg: colors.background.tertiary, text: colors.text.secondary };
    }
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

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
        <Text style={styles.title}>Leaderboard</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {[
          { key: 'weekly', label: 'This Week' },
          { key: 'monthly', label: 'This Month' },
          { key: 'allTime', label: 'All Time' },
        ].map(p => (
          <TouchableOpacity
            key={p.key}
            style={[styles.periodButton, period === p.key && styles.periodButtonActive]}
            onPress={() => setPeriod(p.key as Period)}
          >
            <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* User's Rank */}
      {userRank && (
        <Card style={styles.userRankCard}>
          <Text style={styles.userRankLabel}>Your Rank</Text>
          <Text style={styles.userRankValue}>#{userRank}</Text>
          {userRank <= 10 && (
            <Text style={styles.userRankMessage}>🎉 You're in the top 10!</Text>
          )}
        </Card>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              loadLeaderboard();
            }}
            tintColor={colors.accent.primary}
          />
        }
      >
        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <View style={styles.podium}>
            {/* 2nd Place */}
            <View style={styles.podiumItem}>
              <Text style={styles.podiumEmoji}>
                {getAnimalEmoji(leaderboard[1].companionType)}
              </Text>
              <Text style={styles.podiumName} numberOfLines={1}>
                {leaderboard[1].displayName}
              </Text>
              <View style={[styles.podiumRank, { backgroundColor: '#C0C0C0' }]}>
                <Text style={styles.podiumRankText}>🥈</Text>
              </View>
              <Text style={styles.podiumScore}>{leaderboard[1].score} tasks</Text>
            </View>

            {/* 1st Place */}
            <View style={[styles.podiumItem, styles.podiumFirst]}>
              <Text style={styles.podiumEmoji}>
                {getAnimalEmoji(leaderboard[0].companionType)}
              </Text>
              <Text style={styles.podiumName} numberOfLines={1}>
                {leaderboard[0].displayName}
              </Text>
              <View style={[styles.podiumRank, { backgroundColor: '#FFD700' }]}>
                <Text style={styles.podiumRankText}>🥇</Text>
              </View>
              <Text style={styles.podiumScore}>{leaderboard[0].score} tasks</Text>
            </View>

            {/* 3rd Place */}
            <View style={styles.podiumItem}>
              <Text style={styles.podiumEmoji}>
                {getAnimalEmoji(leaderboard[2].companionType)}
              </Text>
              <Text style={styles.podiumName} numberOfLines={1}>
                {leaderboard[2].displayName}
              </Text>
              <View style={[styles.podiumRank, { backgroundColor: '#CD7F32' }]}>
                <Text style={styles.podiumRankText}>🥉</Text>
              </View>
              <Text style={styles.podiumScore}>{leaderboard[2].score} tasks</Text>
            </View>
          </View>
        )}

        {/* Rest of Leaderboard */}
        <View style={styles.list}>
          {leaderboard.slice(3).map((entry, index) => {
            const rank = index + 4;
            const isCurrentUser = entry.userId === user?.id;
            
            return (
              <View 
                key={entry.userId} 
                style={[styles.listItem, isCurrentUser && styles.listItemCurrent]}
              >
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{rank}</Text>
                </View>
                <Text style={styles.listEmoji}>
                  {getAnimalEmoji(entry.companionType)}
                </Text>
                <View style={styles.listInfo}>
                  <Text style={[styles.listName, isCurrentUser && styles.listNameCurrent]}>
                    {entry.displayName}
                    {isCurrentUser && ' (You)'}
                  </Text>
                  {entry.companionName && (
                    <Text style={styles.listCompanion}>{entry.companionName}</Text>
                  )}
                </View>
                <View style={styles.listScore}>
                  <Text style={styles.listScoreValue}>{entry.score}</Text>
                  <Text style={styles.listScoreLabel}>tasks</Text>
                </View>
              </View>
            );
          })}
        </View>

        {leaderboard.length === 0 && (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🏆</Text>
            <Text style={styles.emptyTitle}>No Rankings Yet</Text>
            <Text style={styles.emptyText}>
              Complete tasks to appear on the leaderboard!
            </Text>
          </Card>
        )}
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
  periodSelector: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.card,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.accent.primary,
  },
  periodText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  periodTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.weights.semibold,
  },
  userRankCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.accent.primary + '20',
    borderColor: colors.accent.primary + '40',
  },
  userRankLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  userRankValue: {
    color: colors.accent.primary,
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
  },
  userRankMessage: {
    color: colors.accent.success,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  content: {
    padding: spacing.lg,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  podiumItem: {
    alignItems: 'center',
    width: 100,
  },
  podiumFirst: {
    marginBottom: spacing.lg,
  },
  podiumEmoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  podiumName: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  podiumRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  podiumRankText: {
    fontSize: 20,
  },
  podiumScore: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  list: {
    gap: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  listItemCurrent: {
    borderWidth: 2,
    borderColor: colors.accent.primary,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  rankText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  listEmoji: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  listNameCurrent: {
    color: colors.accent.primary,
  },
  listCompanion: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
  },
  listScore: {
    alignItems: 'flex-end',
  },
  listScoreValue: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  listScoreLabel: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
});

export default LeaderboardScreen;
