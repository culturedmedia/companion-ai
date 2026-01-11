import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Task, TASK_CATEGORIES } from '../../types';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  onComplete?: () => void;
  onDelete?: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onPress,
  onComplete,
  onDelete,
}) => {
  const category = TASK_CATEGORIES.find(c => c.id === task.category);
  const isCompleted = task.status === 'completed';
  
  const formatDueDate = (date: string | null, time: string | null) => {
    if (!date) return null;
    
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    let dateStr = '';
    if (date === today) {
      dateStr = 'Today';
    } else if (date === tomorrow) {
      dateStr = 'Tomorrow';
    } else {
      const d = new Date(date);
      dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    if (time) {
      const [hours, minutes] = time.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      dateStr += ` at ${hour12}:${minutes} ${ampm}`;
    }
    
    return dateStr;
  };

  const isOverdue = () => {
    if (!task.due_date || isCompleted) return false;
    const today = new Date().toISOString().split('T')[0];
    return task.due_date < today;
  };

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high':
        return colors.priority.high;
      case 'medium':
        return colors.priority.medium;
      case 'low':
        return colors.priority.low;
      default:
        return colors.priority.medium;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.container, isCompleted && styles.completed]}
    >
      {/* Priority indicator */}
      <View style={[styles.priorityBar, { backgroundColor: getPriorityColor() }]} />
      
      <View style={styles.content}>
        {/* Checkbox */}
        <TouchableOpacity
          onPress={onComplete}
          style={[
            styles.checkbox,
            isCompleted && styles.checkboxCompleted,
            { borderColor: category?.color || colors.accent.primary },
          ]}
        >
          {isCompleted && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </TouchableOpacity>
        
        {/* Task info */}
        <View style={styles.info}>
          <Text
            style={[
              styles.title,
              isCompleted && styles.titleCompleted,
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          
          <View style={styles.meta}>
            {/* Category badge */}
            <View style={[styles.categoryBadge, { backgroundColor: category?.color + '20' }]}>
              <Text style={styles.categoryEmoji}>{category?.emoji}</Text>
              <Text style={[styles.categoryText, { color: category?.color }]}>
                {category?.name}
              </Text>
            </View>
            
            {/* Due date */}
            {task.due_date && (
              <Text style={[
                styles.dueDate,
                isOverdue() && styles.overdue,
              ]}>
                {formatDueDate(task.due_date, task.due_time)}
              </Text>
            )}
          </View>
        </View>
        
        {/* Rewards */}
        <View style={styles.rewards}>
          <Text style={styles.rewardText}>+{task.coins_reward} 🪙</Text>
          <Text style={styles.rewardText}>+{task.xp_reward} XP</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  completed: {
    opacity: 0.6,
  },
  priorityBar: {
    height: 3,
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkboxCompleted: {
    backgroundColor: colors.accent.success,
    borderColor: colors.accent.success,
  },
  checkmark: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.text.tertiary,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  categoryEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  categoryText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  dueDate: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  overdue: {
    color: colors.accent.error,
  },
  rewards: {
    alignItems: 'flex-end',
  },
  rewardText: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
  },
});

export default TaskCard;
