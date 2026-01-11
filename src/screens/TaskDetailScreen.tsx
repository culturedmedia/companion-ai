import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTaskStore } from '../stores/taskStore';
import { useWalletStore } from '../stores/walletStore';
import { Button, Card } from '../components/ui';
import { Task } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

type RouteParams = {
  TaskDetail: { taskId: string };
};

const CATEGORY_INFO: Record<string, { icon: string; label: string }> = {
  work: { icon: '💼', label: 'Work' },
  personal: { icon: '🏠', label: 'Personal' },
  health: { icon: '💪', label: 'Health' },
  finance: { icon: '💰', label: 'Finance' },
  errands: { icon: '🛒', label: 'Errands' },
  social: { icon: '👥', label: 'Social' },
};

const PRIORITY_INFO: Record<string, { label: string; color: string }> = {
  low: { label: 'Low Priority', color: colors.accent.success },
  medium: { label: 'Medium Priority', color: colors.accent.warning },
  high: { label: 'High Priority', color: colors.accent.error },
};

export const TaskDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'TaskDetail'>>();
  const { tasks, completeTask, deleteTask } = useTaskStore();
  const { addCoins } = useWalletStore();
  
  const task = tasks.find(t => t.id === route.params?.taskId);
  const [isCompleting, setIsCompleting] = useState(false);

  if (!task) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Task not found</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await completeTask(task.id);
      
      // Award coins based on priority
      const coinReward = task.priority === 'high' ? 30 : task.priority === 'medium' ? 20 : 10;
      await addCoins(coinReward, 'Task completed');
      
      Alert.alert(
        '🎉 Task Completed!',
        `Great job! You earned ${coinReward} coins.`,
        [{ text: 'Awesome!', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to complete task');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTask(task.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
  const categoryInfo = CATEGORY_INFO[task.category] || CATEGORY_INFO.personal;
  const priorityInfo = PRIORITY_INFO[task.priority] || PRIORITY_INFO.medium;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('EditTask' as never, { taskId: task.id } as never)}>
          <Text style={styles.editButton}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Task Status */}
        {task.completed && (
          <View style={styles.completedBanner}>
            <Text style={styles.completedText}>✅ Completed</Text>
          </View>
        )}

        {/* Task Title */}
        <Text style={[styles.title, task.completed && styles.titleCompleted]}>
          {task.title}
        </Text>

        {/* Description */}
        {task.description && (
          <Text style={styles.description}>{task.description}</Text>
        )}

        {/* Meta Info */}
        <View style={styles.metaContainer}>
          {/* Category */}
          <Card style={styles.metaCard}>
            <Text style={styles.metaIcon}>{categoryInfo.icon}</Text>
            <Text style={styles.metaLabel}>Category</Text>
            <Text style={styles.metaValue}>{categoryInfo.label}</Text>
          </Card>

          {/* Priority */}
          <Card style={[styles.metaCard, { borderLeftColor: priorityInfo.color }]}>
            <View style={[styles.priorityDot, { backgroundColor: priorityInfo.color }]} />
            <Text style={styles.metaLabel}>Priority</Text>
            <Text style={[styles.metaValue, { color: priorityInfo.color }]}>
              {priorityInfo.label}
            </Text>
          </Card>
        </View>

        {/* Due Date */}
        <Card style={[styles.dueDateCard, isOverdue && styles.overdueCard]}>
          <Text style={styles.dueDateIcon}>📅</Text>
          <View style={styles.dueDateInfo}>
            <Text style={styles.dueDateLabel}>Due Date</Text>
            <Text style={[styles.dueDateValue, isOverdue && styles.overdueText]}>
              {formatDate(task.dueDate)}
              {isOverdue && ' (Overdue)'}
            </Text>
          </View>
        </Card>

        {/* Reward Info */}
        {!task.completed && (
          <Card style={styles.rewardCard}>
            <Text style={styles.rewardIcon}>🪙</Text>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardLabel}>Completion Reward</Text>
              <Text style={styles.rewardValue}>
                {task.priority === 'high' ? '30' : task.priority === 'medium' ? '20' : '10'} coins
              </Text>
            </View>
          </Card>
        )}

        {/* Created Date */}
        <Text style={styles.createdText}>
          Created {new Date(task.createdAt).toLocaleDateString()}
        </Text>

        {/* Actions */}
        {!task.completed && (
          <View style={styles.actions}>
            <Button
              title="✓ Mark as Complete"
              onPress={handleComplete}
              loading={isCompleting}
              fullWidth
              size="lg"
            />
          </View>
        )}

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>🗑️ Delete Task</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
  editButton: {
    color: colors.accent.primary,
    fontSize: typography.sizes.md,
  },
  content: {
    padding: spacing.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.lg,
    marginBottom: spacing.lg,
  },
  completedBanner: {
    backgroundColor: colors.accent.success + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  completedText: {
    color: colors.accent.success,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  description: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
    marginBottom: spacing.lg,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  metaCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.primary,
  },
  metaIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  metaLabel: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    marginBottom: spacing.xs,
  },
  metaValue: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: spacing.xs,
  },
  dueDateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  overdueCard: {
    backgroundColor: colors.accent.error + '10',
    borderColor: colors.accent.error + '30',
  },
  dueDateIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  dueDateInfo: {
    flex: 1,
  },
  dueDateLabel: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    marginBottom: spacing.xs,
  },
  dueDateValue: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  overdueText: {
    color: colors.accent.error,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.warning + '10',
    borderColor: colors.accent.warning + '30',
    marginBottom: spacing.md,
  },
  rewardIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardLabel: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    marginBottom: spacing.xs,
  },
  rewardValue: {
    color: colors.accent.warning,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  createdText: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  actions: {
    marginBottom: spacing.lg,
  },
  deleteButton: {
    padding: spacing.md,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: colors.accent.error,
    fontSize: typography.sizes.md,
  },
});

export default TaskDetailScreen;
