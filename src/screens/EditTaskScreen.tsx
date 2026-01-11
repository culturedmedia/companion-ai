import React, { useState, useEffect } from 'react';
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTaskStore } from '../stores/taskStore';
import { Button, Input, Card } from '../components/ui';
import { Task, TaskCategory, TaskPriority } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

type RouteParams = {
  EditTask: { taskId: string };
};

const CATEGORIES: { value: TaskCategory; label: string; icon: string }[] = [
  { value: 'work', label: 'Work', icon: '💼' },
  { value: 'personal', label: 'Personal', icon: '🏠' },
  { value: 'health', label: 'Health', icon: '💪' },
  { value: 'finance', label: 'Finance', icon: '💰' },
  { value: 'errands', label: 'Errands', icon: '🛒' },
  { value: 'social', label: 'Social', icon: '👥' },
];

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: colors.accent.success },
  { value: 'medium', label: 'Medium', color: colors.accent.warning },
  { value: 'high', label: 'High', color: colors.accent.error },
];

export const EditTaskScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'EditTask'>>();
  const { tasks, updateTask, deleteTask } = useTaskStore();
  
  const task = tasks.find(t => t.id === route.params?.taskId);
  
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [category, setCategory] = useState<TaskCategory>(task?.category || 'personal');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'medium');
  const [dueDate, setDueDate] = useState<Date | undefined>(
    task?.dueDate ? new Date(task.dueDate) : undefined
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!task) {
      Alert.alert('Error', 'Task not found');
      navigation.goBack();
    }
  }, [task]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    setIsLoading(true);

    try {
      await updateTask(route.params.taskId, {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
        dueDate: dueDate?.toISOString(),
      });

      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to update task');
    } finally {
      setIsLoading(false);
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
            await deleteTask(route.params.taskId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (!task) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Task</Text>
        <TouchableOpacity onPress={handleSave} disabled={isLoading}>
          <Text style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.form}>
          <Input
            label="Task Title"
            placeholder="What do you need to do?"
            value={title}
            onChangeText={setTitle}
            autoFocus
          />

          <Input
            label="Description (optional)"
            placeholder="Add more details..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          {/* Category Selection */}
          <Text style={styles.label}>Category</Text>
          <View style={styles.optionsGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.optionButton,
                  category === cat.value && styles.optionButtonSelected,
                ]}
                onPress={() => setCategory(cat.value)}
              >
                <Text style={styles.optionIcon}>{cat.icon}</Text>
                <Text style={[
                  styles.optionLabel,
                  category === cat.value && styles.optionLabelSelected,
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Priority Selection */}
          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map((pri) => (
              <TouchableOpacity
                key={pri.value}
                style={[
                  styles.priorityButton,
                  priority === pri.value && { 
                    backgroundColor: pri.color + '20',
                    borderColor: pri.color,
                  },
                ]}
                onPress={() => setPriority(pri.value)}
              >
                <View style={[styles.priorityDot, { backgroundColor: pri.color }]} />
                <Text style={[
                  styles.priorityLabel,
                  priority === pri.value && { color: pri.color },
                ]}>
                  {pri.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Due Date */}
          <Text style={styles.label}>Due Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateIcon}>📅</Text>
            <Text style={styles.dateText}>
              {dueDate ? dueDate.toLocaleDateString() : 'No due date'}
            </Text>
            {dueDate && (
              <TouchableOpacity
                onPress={() => setDueDate(undefined)}
                style={styles.clearDate}
              >
                <Text style={styles.clearDateText}>✕</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={dueDate || new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDueDate(selectedDate);
              }}
              minimumDate={new Date()}
            />
          )}
        </Card>

        {/* Delete Button */}
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
  cancelButton: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  saveButton: {
    color: colors.accent.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    padding: spacing.lg,
  },
  form: {
    padding: spacing.lg,
  },
  label: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    backgroundColor: colors.accent.primary + '20',
    borderColor: colors.accent.primary,
  },
  optionIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  optionLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  optionLabelSelected: {
    color: colors.accent.primary,
    fontWeight: typography.weights.medium,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  priorityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  priorityLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.tertiary,
  },
  dateIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  dateText: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    flex: 1,
  },
  clearDate: {
    padding: spacing.xs,
  },
  clearDateText: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
  },
  deleteButton: {
    marginTop: spacing.xl,
    padding: spacing.md,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: colors.accent.error,
    fontSize: typography.sizes.md,
  },
});

export default EditTaskScreen;
