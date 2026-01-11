import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../stores/authStore';
import { useTaskStore } from '../stores/taskStore';
import { TaskCard } from '../components/tasks/TaskCard';
import { AddTaskModal } from '../components/tasks/AddTaskModal';
import { Card } from '../components/ui';
import { TaskCategory, TASK_CATEGORIES } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

type FilterType = 'all' | 'today' | 'week' | 'completed';

export const TasksScreen: React.FC = () => {
  const { user } = useAuthStore();
  const { tasks, fetchTasks, completeTask, getTodaysTasks, getWeekTasks } = useTaskStore();
  
  const [filter, setFilter] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchTasks(user.id);
    }
  }, [user?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (user?.id) {
      await fetchTasks(user.id);
    }
    setRefreshing(false);
  };

  const getFilteredTasks = () => {
    let filtered = tasks;
    
    // Apply time filter
    switch (filter) {
      case 'today':
        filtered = getTodaysTasks();
        break;
      case 'week':
        filtered = getWeekTasks();
        break;
      case 'completed':
        filtered = tasks.filter(t => t.status === 'completed');
        break;
      default:
        filtered = tasks.filter(t => t.status === 'pending');
    }
    
    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }
    
    return filtered;
  };

  const filteredTasks = getFilteredTasks();

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'completed', label: 'Done' },
  ];

  // Group tasks by category for display
  const groupedTasks = filteredTasks.reduce((acc, task) => {
    const cat = task.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(task);
    return acc;
  }, {} as Record<string, typeof tasks>);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddTask(true)}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Time Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[
              styles.filterChip,
              filter === f.key && styles.filterChipActive,
            ]}
          >
            <Text style={[
              styles.filterText,
              filter === f.key && styles.filterTextActive,
            ]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        <TouchableOpacity
          onPress={() => setCategoryFilter(null)}
          style={[
            styles.categoryChip,
            !categoryFilter && styles.categoryChipActive,
          ]}
        >
          <Text style={styles.categoryEmoji}>📁</Text>
          <Text style={[
            styles.categoryText,
            !categoryFilter && styles.categoryTextActive,
          ]}>
            All
          </Text>
        </TouchableOpacity>
        
        {TASK_CATEGORIES.map(cat => {
          const count = tasks.filter(t => 
            t.category === cat.id && t.status === 'pending'
          ).length;
          
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setCategoryFilter(cat.id)}
              style={[
                styles.categoryChip,
                categoryFilter === cat.id && {
                  backgroundColor: cat.color + '30',
                  borderColor: cat.color,
                },
              ]}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text style={[
                styles.categoryText,
                categoryFilter === cat.id && { color: cat.color },
              ]}>
                {cat.name}
              </Text>
              {count > 0 && (
                <View style={[styles.categoryBadge, { backgroundColor: cat.color }]}>
                  <Text style={styles.categoryBadgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Task List */}
      <ScrollView
        style={styles.taskList}
        contentContainerStyle={styles.taskListContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredTasks.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No tasks here!</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'completed' 
                ? "Complete some tasks to see them here"
                : "Tap + to add a new task"
              }
            </Text>
          </Card>
        ) : categoryFilter ? (
          // Show flat list when category is selected
          filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={() => completeTask(task.id)}
            />
          ))
        ) : (
          // Show grouped by category
          Object.entries(groupedTasks).map(([category, categoryTasks]) => {
            const catInfo = TASK_CATEGORIES.find(c => c.id === category);
            return (
              <View key={category} style={styles.categoryGroup}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryHeaderEmoji}>{catInfo?.emoji}</Text>
                  <Text style={[styles.categoryHeaderText, { color: catInfo?.color }]}>
                    {catInfo?.name}
                  </Text>
                  <Text style={styles.categoryHeaderCount}>
                    {categoryTasks.length}
                  </Text>
                </View>
                {categoryTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={() => completeTask(task.id)}
                  />
                ))}
              </View>
            );
          })
        )}
        
        {/* Bottom spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Task Modal */}
      <AddTaskModal
        visible={showAddTask}
        onClose={() => setShowAddTask(false)}
        initialCategory={categoryFilter || undefined}
      />
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
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
  },
  addButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  addButtonText: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  filterScroll: {
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.tertiary,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.accent.primary,
  },
  filterText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  filterTextActive: {
    color: colors.text.primary,
    fontWeight: typography.weights.semibold,
  },
  categoryScroll: {
    maxHeight: 50,
    marginTop: spacing.md,
  },
  categoryContent: {
    paddingHorizontal: spacing.lg,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginRight: spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.accent.primary + '30',
    borderColor: colors.accent.primary,
  },
  categoryEmoji: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  categoryText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  categoryTextActive: {
    color: colors.accent.primary,
  },
  categoryBadge: {
    marginLeft: spacing.xs,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  categoryBadgeText: {
    color: colors.text.primary,
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  taskList: {
    flex: 1,
    marginTop: spacing.md,
  },
  taskListContent: {
    paddingHorizontal: spacing.lg,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    marginTop: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium,
  },
  emptySubtext: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  categoryGroup: {
    marginBottom: spacing.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryHeaderEmoji: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  categoryHeaderText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  categoryHeaderCount: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
    marginLeft: spacing.sm,
  },
});

export default TasksScreen;
