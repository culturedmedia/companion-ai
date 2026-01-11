import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../stores/authStore';
import { useTaskStore } from '../stores/taskStore';
import { TaskCard } from '../components/tasks/TaskCard';
import { AddTaskModal } from '../components/tasks/AddTaskModal';
import { Card } from '../components/ui';
import { TASK_CATEGORIES } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * 6) / 7;

export const CalendarScreen: React.FC = () => {
  const { user } = useAuthStore();
  const { tasks, fetchTasks, completeTask } = useTaskStore();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddTask, setShowAddTask] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchTasks(user.id);
    }
  }, [user?.id]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    // Add empty slots for days before the first day of month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  }, [currentMonth]);

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(t => t.due_date === dateStr);
  };

  // Get tasks for selected date
  const selectedDateTasks = useMemo(() => {
    return getTasksForDate(selectedDate);
  }, [selectedDate, tasks]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const hasTasksOnDate = (date: Date) => {
    return getTasksForDate(date).length > 0;
  };

  const navigateMonth = (direction: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const formatSelectedDate = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (selectedDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (selectedDate.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
      </View>

      {/* Month Navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity
          onPress={() => navigateMonth(-1)}
          style={styles.navButton}
        >
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => {
            setCurrentMonth(new Date());
            setSelectedDate(new Date());
          }}
        >
          <Text style={styles.monthTitle}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => navigateMonth(1)}
          style={styles.navButton}
        >
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day Names */}
      <View style={styles.dayNames}>
        {dayNames.map(day => (
          <Text key={day} style={styles.dayName}>{day}</Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((date, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => date && setSelectedDate(date)}
            disabled={!date}
            style={[
              styles.dayCell,
              date && isToday(date) && styles.todayCell,
              date && isSelected(date) && styles.selectedCell,
            ]}
          >
            {date && (
              <>
                <Text style={[
                  styles.dayNumber,
                  isToday(date) && styles.todayText,
                  isSelected(date) && styles.selectedText,
                ]}>
                  {date.getDate()}
                </Text>
                {hasTasksOnDate(date) && (
                  <View style={[
                    styles.taskDot,
                    isSelected(date) && styles.taskDotSelected,
                  ]} />
                )}
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Selected Date Tasks */}
      <View style={styles.tasksSection}>
        <View style={styles.tasksSectionHeader}>
          <Text style={styles.tasksSectionTitle}>{formatSelectedDate()}</Text>
          <TouchableOpacity
            style={styles.addTaskButton}
            onPress={() => setShowAddTask(true)}
          >
            <Text style={styles.addTaskButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.tasksList}
          showsVerticalScrollIndicator={false}
        >
          {selectedDateTasks.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No tasks scheduled</Text>
              <Text style={styles.emptySubtext}>
                Tap + to add a task for this day
              </Text>
            </Card>
          ) : (
            <>
              {selectedDateTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={() => completeTask(task.id)}
                />
              ))}
            </>
          )}
          
          {/* Bottom spacer */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

      {/* Add Task Modal */}
      <AddTaskModal
        visible={showAddTask}
        onClose={() => setShowAddTask(false)}
        initialDueDate={selectedDate.toISOString().split('T')[0]}
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  navButton: {
    padding: spacing.sm,
  },
  navButtonText: {
    color: colors.accent.primary,
    fontSize: 32,
    fontWeight: typography.weights.bold,
  },
  monthTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  dayNames: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  dayName: {
    width: DAY_WIDTH,
    textAlign: 'center',
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
  },
  dayCell: {
    width: DAY_WIDTH,
    height: DAY_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  todayCell: {
    backgroundColor: colors.accent.primary + '20',
    borderRadius: DAY_WIDTH / 2,
  },
  selectedCell: {
    backgroundColor: colors.accent.primary,
    borderRadius: DAY_WIDTH / 2,
  },
  dayNumber: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
  },
  todayText: {
    color: colors.accent.primary,
    fontWeight: typography.weights.bold,
  },
  selectedText: {
    color: colors.text.primary,
    fontWeight: typography.weights.bold,
  },
  taskDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent.primary,
    marginTop: 2,
  },
  taskDotSelected: {
    backgroundColor: colors.text.primary,
  },
  tasksSection: {
    flex: 1,
    marginTop: spacing.md,
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.lg,
  },
  tasksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  tasksSectionTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  addTaskButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  addTaskButtonText: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  tasksList: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
  },
  emptySubtext: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
});

export default CalendarScreen;
