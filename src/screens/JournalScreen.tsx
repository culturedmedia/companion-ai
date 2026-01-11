import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { Card, Button } from '../components/ui';
import { colors, spacing, borderRadius, typography } from '../theme';

interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  mood?: number;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

const PROMPTS = [
  "What are you grateful for today?",
  "What's one thing you accomplished today?",
  "How are you feeling right now?",
  "What's something you're looking forward to?",
  "What challenged you today?",
  "What made you smile today?",
  "What's on your mind?",
  "What would make today great?",
];

const MOOD_OPTIONS = [
  { emoji: '😊', value: 5 },
  { emoji: '🙂', value: 4 },
  { emoji: '😐', value: 3 },
  { emoji: '😔', value: 2 },
  { emoji: '😢', value: 1 },
];

export const JournalScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newMood, setNewMood] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');

  useEffect(() => {
    loadEntries();
    setCurrentPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  }, []);

  const loadEntries = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Failed to load journal entries:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadEntries();
  };

  const saveEntry = async () => {
    if (!user?.id || !newContent.trim()) return;

    setIsSaving(true);

    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          content: newContent.trim(),
          mood: newMood,
        })
        .select()
        .single();

      if (error) throw error;

      setEntries([data, ...entries]);
      setNewContent('');
      setNewMood(null);
      setShowNewEntry(false);
      setCurrentPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);

      Alert.alert('Saved!', 'Your journal entry has been saved. 📝');
    } catch (error) {
      console.error('Failed to save entry:', error);
      Alert.alert('Error', 'Failed to save your entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEntry = (entry: JournalEntry) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase
                .from('journal_entries')
                .delete()
                .eq('id', entry.id);

              setEntries(entries.filter(e => e.id !== entry.id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete entry');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getMoodEmoji = (mood: number) => {
    return MOOD_OPTIONS.find(m => m.value === mood)?.emoji || '😐';
  };

  const getStreakCount = () => {
    if (entries.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      
      const hasEntry = entries.some(entry => {
        const entryDate = new Date(entry.created_at);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === checkDate.getTime();
      });
      
      if (hasEntry) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Journal</Text>
        <TouchableOpacity onPress={() => setShowNewEntry(!showNewEntry)}>
          <Text style={styles.addButton}>{showNewEntry ? '✕' : '+'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent.primary}
            />
          }
        >
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{entries.length}</Text>
              <Text style={styles.statLabel}>Entries</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>🔥 {getStreakCount()}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>

          {/* New Entry Form */}
          {showNewEntry && (
            <Card style={styles.newEntryCard}>
              <Text style={styles.promptText}>💭 {currentPrompt}</Text>
              
              <TextInput
                style={styles.textInput}
                placeholder="Write your thoughts..."
                placeholderTextColor={colors.text.muted}
                value={newContent}
                onChangeText={setNewContent}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />

              <Text style={styles.moodLabel}>How are you feeling?</Text>
              <View style={styles.moodRow}>
                {MOOD_OPTIONS.map(mood => (
                  <TouchableOpacity
                    key={mood.value}
                    style={[
                      styles.moodOption,
                      newMood === mood.value && styles.moodOptionSelected,
                    ]}
                    onPress={() => setNewMood(mood.value)}
                  >
                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button
                title="Save Entry"
                onPress={saveEntry}
                loading={isSaving}
                disabled={!newContent.trim()}
                fullWidth
              />
            </Card>
          )}

          {/* Entries List */}
          {entries.length === 0 && !showNewEntry ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>📔</Text>
              <Text style={styles.emptyTitle}>Start Your Journal</Text>
              <Text style={styles.emptyText}>
                Journaling helps you reflect, process emotions, and track your growth.
              </Text>
              <Button
                title="Write First Entry"
                onPress={() => setShowNewEntry(true)}
                style={styles.emptyButton}
              />
            </Card>
          ) : (
            entries.map(entry => (
              <TouchableOpacity
                key={entry.id}
                style={styles.entryCard}
                onLongPress={() => deleteEntry(entry)}
              >
                <View style={styles.entryHeader}>
                  <Text style={styles.entryDate}>{formatDate(entry.created_at)}</Text>
                  {entry.mood && (
                    <Text style={styles.entryMood}>{getMoodEmoji(entry.mood)}</Text>
                  )}
                </View>
                <Text style={styles.entryContent} numberOfLines={4}>
                  {entry.content}
                </Text>
              </TouchableOpacity>
            ))
          )}

          {/* Tips */}
          <Card style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Journaling Tips</Text>
            <Text style={styles.tipsText}>
              • Write without judgment{'\n'}
              • Be honest with yourself{'\n'}
              • Focus on feelings, not just events{'\n'}
              • Long press an entry to delete it
            </Text>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
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
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  addButton: {
    color: colors.accent.primary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    color: colors.text.primary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  statLabel: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  newEntryCard: {
    marginBottom: spacing.lg,
  },
  promptText: {
    color: colors.accent.primary,
    fontSize: typography.sizes.md,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  textInput: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    minHeight: 150,
    marginBottom: spacing.md,
  },
  moodLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.sm,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  moodOption: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodOptionSelected: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primary + '20',
  },
  moodEmoji: {
    fontSize: 28,
  },
  entryCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  entryDate: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
  },
  entryMood: {
    fontSize: 20,
  },
  entryContent: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
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
    marginBottom: spacing.lg,
  },
  emptyButton: {
    minWidth: 180,
  },
  tipsCard: {
    marginTop: spacing.lg,
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

export default JournalScreen;
