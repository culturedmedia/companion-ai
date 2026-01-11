import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Input, Button } from '../ui';
import { TaskCategory, TaskPriority, TASK_CATEGORIES, RecurrencePattern } from '../../types';
import { useTaskStore } from '../../stores/taskStore';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  initialTitle?: string;
  initialCategory?: TaskCategory;
  initialDueDate?: string;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  visible,
  onClose,
  initialTitle = '',
  initialCategory,
  initialDueDate,
}) => {
  const { createTask, detectCategory } = useTaskStore();
  
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory | null>(initialCategory || null);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState<Date | null>(
    initialDueDate ? new Date(initialDueDate) : null
  );
  const [dueTime, setDueTime] = useState<Date | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleTitleChange = (text: string) => {
    setTitle(text);
    // Auto-detect category
    if (!category) {
      const detected = detectCategory(text);
      if (detected !== 'personal') {
        setCategory(detected);
      }
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    
    setIsLoading(true);
    
    const taskData = {
      title: title.trim(),
      description: description.trim() || null,
      category: category || detectCategory(title),
      priority,
      due_date: dueDate ? dueDate.toISOString().split('T')[0] : null,
      due_time: dueTime 
        ? `${dueTime.getHours().toString().padStart(2, '0')}:${dueTime.getMinutes().toString().padStart(2, '0')}`
        : null,
      is_recurring: isRecurring,
      recurrence_pattern: isRecurring ? recurrencePattern : null,
    };
    
    const { error } = await createTask(taskData);
    
    setIsLoading(false);
    
    if (!error) {
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory(null);
    setPriority('medium');
    setDueDate(null);
    setDueTime(null);
    setIsRecurring(false);
    setRecurrencePattern(null);
  };

  const priorities: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'high', label: 'High', color: colors.priority.high },
    { value: 'medium', label: 'Medium', color: colors.priority.medium },
    { value: 'low', label: 'Low', color: colors.priority.low },
  ];

  const recurrenceOptions: { value: RecurrencePattern; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekdays', label: 'Weekdays' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add Task</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <Input
              label="What do you need to do?"
              placeholder="e.g., Call mom, Finish report..."
              value={title}
              onChangeText={handleTitleChange}
              autoFocus
            />
            
            {/* Description */}
            <Input
              label="Notes (optional)"
              placeholder="Add any details..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={{ minHeight: 80, textAlignVertical: 'top' }}
            />
            
            {/* Category */}
            <Text style={styles.sectionLabel}>Category</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {TASK_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setCategory(cat.id)}
                  style={[
                    styles.categoryChip,
                    category === cat.id && { 
                      backgroundColor: cat.color + '30',
                      borderColor: cat.color,
                    },
                  ]}
                >
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <Text style={[
                    styles.categoryName,
                    category === cat.id && { color: cat.color },
                  ]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Priority */}
            <Text style={styles.sectionLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {priorities.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  onPress={() => setPriority(p.value)}
                  style={[
                    styles.priorityChip,
                    priority === p.value && {
                      backgroundColor: p.color + '30',
                      borderColor: p.color,
                    },
                  ]}
                >
                  <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                  <Text style={[
                    styles.priorityLabel,
                    priority === p.value && { color: p.color },
                  ]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Due Date */}
            <Text style={styles.sectionLabel}>Due Date</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
              >
                <Text style={styles.dateButtonText}>
                  {dueDate 
                    ? dueDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : '📅 Select Date'
                  }
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                style={styles.dateButton}
              >
                <Text style={styles.dateButtonText}>
                  {dueTime 
                    ? dueTime.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit'
                      })
                    : '⏰ Add Time'
                  }
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Quick date options */}
            <View style={styles.quickDates}>
              <TouchableOpacity
                onPress={() => setDueDate(new Date())}
                style={styles.quickDateChip}
              >
                <Text style={styles.quickDateText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setDueDate(tomorrow);
                }}
                style={styles.quickDateChip}
              >
                <Text style={styles.quickDateText}>Tomorrow</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const nextWeek = new Date();
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  setDueDate(nextWeek);
                }}
                style={styles.quickDateChip}
              >
                <Text style={styles.quickDateText}>Next Week</Text>
              </TouchableOpacity>
            </View>
            
            {/* Recurring */}
            <View style={styles.recurringRow}>
              <TouchableOpacity
                onPress={() => setIsRecurring(!isRecurring)}
                style={[
                  styles.recurringToggle,
                  isRecurring && styles.recurringToggleActive,
                ]}
              >
                <Text style={styles.recurringIcon}>🔄</Text>
                <Text style={[
                  styles.recurringText,
                  isRecurring && styles.recurringTextActive,
                ]}>
                  Recurring
                </Text>
              </TouchableOpacity>
            </View>
            
            {isRecurring && (
              <View style={styles.recurrenceOptions}>
                {recurrenceOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setRecurrencePattern(opt.value)}
                    style={[
                      styles.recurrenceChip,
                      recurrencePattern === opt.value && styles.recurrenceChipActive,
                    ]}
                  >
                    <Text style={[
                      styles.recurrenceText,
                      recurrencePattern === opt.value && styles.recurrenceTextActive,
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            {/* Spacer */}
            <View style={{ height: spacing.xl }} />
          </ScrollView>
          
          {/* Submit button */}
          <View style={styles.footer}>
            <Button
              title="Add Task"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={!title.trim()}
              fullWidth
            />
          </View>
          
          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={dueDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) setDueDate(date);
              }}
              minimumDate={new Date()}
            />
          )}
          
          {/* Time Picker */}
          {showTimePicker && (
            <DateTimePicker
              value={dueTime || new Date()}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, time) => {
                setShowTimePicker(false);
                if (time) setDueTime(time);
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  closeButton: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xl,
    padding: spacing.sm,
  },
  content: {
    padding: spacing.lg,
  },
  sectionLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  categoryScroll: {
    marginBottom: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginRight: spacing.sm,
    backgroundColor: colors.background.tertiary,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  categoryName: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  priorityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.tertiary,
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
  dateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dateButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
  },
  dateButtonText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  quickDates: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  quickDateChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.tertiary,
  },
  quickDateText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  recurringRow: {
    marginTop: spacing.lg,
  },
  recurringToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.tertiary,
    alignSelf: 'flex-start',
  },
  recurringToggleActive: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primary + '20',
  },
  recurringIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  recurringText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  recurringTextActive: {
    color: colors.accent.primary,
  },
  recurrenceOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  recurrenceChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.tertiary,
  },
  recurrenceChipActive: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primary + '20',
  },
  recurrenceText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  recurrenceTextActive: {
    color: colors.accent.primary,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
});

export default AddTaskModal;
