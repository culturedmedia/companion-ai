import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing } from '../../theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius: radius = borderRadius.md,
  style,
}) => {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: radius,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Pre-built skeleton components
export const SkeletonText: React.FC<{ lines?: number; style?: ViewStyle }> = ({
  lines = 1,
  style,
}) => (
  <View style={[styles.textContainer, style]}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        width={index === lines - 1 ? '60%' : '100%'}
        height={14}
        style={index > 0 ? { marginTop: spacing.sm } : undefined}
      />
    ))}
  </View>
);

export const SkeletonAvatar: React.FC<{ size?: number; style?: ViewStyle }> = ({
  size = 48,
  style,
}) => (
  <Skeleton
    width={size}
    height={size}
    borderRadius={size / 2}
    style={style}
  />
);

export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[styles.card, style]}>
    <View style={styles.cardHeader}>
      <SkeletonAvatar size={40} />
      <View style={styles.cardHeaderText}>
        <Skeleton width={120} height={16} />
        <Skeleton width={80} height={12} style={{ marginTop: spacing.xs }} />
      </View>
    </View>
    <SkeletonText lines={2} style={{ marginTop: spacing.md }} />
  </View>
);

export const SkeletonTaskCard: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[styles.taskCard, style]}>
    <Skeleton width={24} height={24} borderRadius={12} />
    <View style={styles.taskContent}>
      <Skeleton width="80%" height={16} />
      <View style={styles.taskMeta}>
        <Skeleton width={60} height={12} />
        <Skeleton width={40} height={12} />
      </View>
    </View>
  </View>
);

export const SkeletonList: React.FC<{
  count?: number;
  ItemComponent?: React.FC;
  style?: ViewStyle;
}> = ({ count = 3, ItemComponent = SkeletonTaskCard, style }) => (
  <View style={style}>
    {Array.from({ length: count }).map((_, index) => (
      <ItemComponent key={index} style={index > 0 ? { marginTop: spacing.md } : undefined} />
    ))}
  </View>
);

// Home screen skeleton
export const HomeScreenSkeleton: React.FC = () => (
  <View style={styles.screenContainer}>
    {/* Header */}
    <View style={styles.header}>
      <View>
        <Skeleton width={150} height={24} />
        <Skeleton width={100} height={14} style={{ marginTop: spacing.xs }} />
      </View>
      <SkeletonAvatar size={40} />
    </View>

    {/* Companion Card */}
    <View style={styles.companionCard}>
      <Skeleton width={120} height={120} borderRadius={60} />
      <Skeleton width={100} height={20} style={{ marginTop: spacing.md }} />
      <Skeleton width={150} height={14} style={{ marginTop: spacing.xs }} />
    </View>

    {/* Stats */}
    <View style={styles.statsRow}>
      <View style={styles.statCard}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <Skeleton width={60} height={16} style={{ marginTop: spacing.sm }} />
      </View>
      <View style={styles.statCard}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <Skeleton width={60} height={16} style={{ marginTop: spacing.sm }} />
      </View>
      <View style={styles.statCard}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <Skeleton width={60} height={16} style={{ marginTop: spacing.sm }} />
      </View>
    </View>

    {/* Tasks */}
    <Skeleton width={100} height={18} style={{ marginTop: spacing.xl }} />
    <SkeletonList count={3} style={{ marginTop: spacing.md }} />
  </View>
);

// Tasks screen skeleton
export const TasksScreenSkeleton: React.FC = () => (
  <View style={styles.screenContainer}>
    {/* Filter tabs */}
    <View style={styles.filterTabs}>
      <Skeleton width={60} height={32} borderRadius={16} />
      <Skeleton width={60} height={32} borderRadius={16} />
      <Skeleton width={60} height={32} borderRadius={16} />
      <Skeleton width={60} height={32} borderRadius={16} />
    </View>

    {/* Tasks */}
    <SkeletonList count={6} style={{ marginTop: spacing.lg }} />
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.background.tertiary,
  },
  textContainer: {
    width: '100%',
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  taskCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskContent: {
    marginLeft: spacing.md,
    flex: 1,
  },
  taskMeta: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  screenContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  companionCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  statCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});

export default Skeleton;
