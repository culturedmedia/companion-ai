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
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../stores/authStore';
import { useCompanionStore } from '../stores/companionStore';
import { useTaskStore } from '../stores/taskStore';
import { useWalletStore } from '../stores/walletStore';
import { CompanionAvatar } from '../components/companion/CompanionAvatar';
import { CompanionChat } from '../components/companion/CompanionChat';
import { TaskCard } from '../components/tasks/TaskCard';
import { AddTaskModal } from '../components/tasks/AddTaskModal';
import { VoiceButton } from '../components/voice/VoiceButton';
import { Card, Button } from '../components/ui';
import { parseVoiceIntent } from '../services/voiceService';
import { ttsService } from '../services/ttsService';
import { hapticService } from '../services/hapticService';
import { analyticsService } from '../services/analyticsService';
import { aiChatService } from '../services/aiChatService';
import { evolutionService } from '../services/evolutionService';
import { colors, spacing, borderRadius, typography } from '../theme';
import { ANIMAL_OPTIONS } from '../types';

interface Message {
  id: string;
  text: string;
  isCompanion: boolean;
  timestamp: Date;
}

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, profile } = useAuthStore();
  const { companion, getCompanionGreeting, getCompanionEncouragement } = useCompanionStore();
  const { tasks, getTodaysTasks, getOverdueTasks, completeTask, fetchTasks } = useTaskStore();
  const { wallet, fetchWallet } = useWalletStore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const todaysTasks = getTodaysTasks();
  const overdueTasks = getOverdueTasks();
  const animal = companion ? ANIMAL_OPTIONS.find(a => a.type === companion.animal_type) : null;

  useEffect(() => {
    if (user?.id) {
      fetchTasks(user.id);
      fetchWallet(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    // Initial greeting from companion
    if (companion && messages.length === 0) {
      const greeting = getCompanionGreeting();
      addCompanionMessage(greeting);
      
      // Follow up with a question after a delay
      setTimeout(() => {
        const questions = [
          "Is there something you really need to focus on today?",
          "What's the most important thing on your mind right now?",
          "How are you feeling about your tasks today?",
          "Anything I can help you with this morning?",
        ];
        addCompanionMessage(questions[Math.floor(Math.random() * questions.length)]);
      }, 2000);
    }
  }, [companion]);

  const addCompanionMessage = (text: string, speak: boolean = true) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text,
      isCompanion: true,
      timestamp: new Date(),
    }]);
    
    // Speak the message if TTS is enabled
    if (speak && ttsEnabled && companion) {
      ttsService.speakAsCompanion(text, companion.personality || 'gentle');
    }
  };

  const addUserMessage = (text: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text,
      isCompanion: false,
      timestamp: new Date(),
    }]);
  };

  const handleVoiceTranscript = async (transcript: string) => {
    addUserMessage(transcript);
    setIsTyping(true);

    // Parse the intent
    const intent = parseVoiceIntent(transcript);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsTyping(false);

    // Handle the intent
    switch (intent.type) {
      case 'CREATE_TASK':
        setShowAddTask(true);
        addCompanionMessage(`Got it! Let me help you add "${intent.title}" to your tasks.`);
        break;
      
      case 'LIST_TASKS':
        const taskList = intent.filter === 'today' ? todaysTasks : tasks.filter(t => t.status === 'pending');
        if (taskList.length === 0) {
          addCompanionMessage("You don't have any tasks right now. Would you like to add one?");
        } else {
          const taskNames = taskList.slice(0, 3).map(t => `• ${t.title}`).join('\n');
          addCompanionMessage(`Here are your tasks:\n${taskNames}${taskList.length > 3 ? `\n...and ${taskList.length - 3} more` : ''}`);
        }
        break;
      
      case 'COMPLETE_TASK':
        const taskToComplete = tasks.find(t => 
          t.title.toLowerCase().includes(intent.taskName.toLowerCase()) && 
          t.status === 'pending'
        );
        if (taskToComplete) {
          await completeTask(taskToComplete.id);
          addCompanionMessage(getCompanionEncouragement());
        } else {
          addCompanionMessage(`I couldn't find a task matching "${intent.taskName}". Could you try again?`);
        }
        break;
      
      case 'INCOMPLETE_TASKS':
        if (overdueTasks.length === 0) {
          addCompanionMessage("Great news! You don't have any overdue tasks. Keep up the good work!");
        } else {
          const overdueNames = overdueTasks.slice(0, 3).map(t => `• ${t.title}`).join('\n');
          addCompanionMessage(`You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}:\n${overdueNames}`);
        }
        break;
      
      case 'FOCUS_TODAY':
        const highPriority = todaysTasks.filter(t => t.priority === 'high');
        if (highPriority.length > 0) {
          addCompanionMessage(`I'd suggest focusing on: "${highPriority[0].title}" - it's marked as high priority!`);
        } else if (todaysTasks.length > 0) {
          addCompanionMessage(`How about starting with: "${todaysTasks[0].title}"?`);
        } else {
          addCompanionMessage("Your day looks clear! Is there something you'd like to accomplish?");
        }
        break;
      
      case 'CHECK_COMPANION':
        addCompanionMessage(`I'm doing great! My energy is at ${companion?.energy || 0}% and I'm level ${companion?.level || 1}. Thanks for checking on me! 💕`);
        break;
      
      case 'HELP':
        addCompanionMessage(
          "I can help you with:\n" +
          "• Adding tasks: \"Add task to...\"\n" +
          "• Listing tasks: \"What are my tasks?\"\n" +
          "• Completing tasks: \"Complete...\"\n" +
          "• Checking overdue: \"What didn't I finish?\"\n" +
          "• Focus help: \"What should I focus on?\""
        );
        break;
      
      default:
        addCompanionMessage("I'm not sure I understood that. Could you try rephrasing? Say 'help' to see what I can do!");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (user?.id) {
      await Promise.all([
        fetchTasks(user.id),
        fetchWallet(user.id),
      ]);
    }
    setRefreshing(false);
  };

  const handleTaskComplete = async (taskId: string) => {
    hapticService.success();
    analyticsService.trackEvent('task_completed', { taskId });
    
    const result = await completeTask(taskId);
    if (!result.error) {
      addCompanionMessage(getCompanionEncouragement());
    }
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Good {getTimeOfDay()}, {profile?.display_name || 'friend'}!
            </Text>
            <Text style={styles.subGreeting}>
              {todaysTasks.length === 0 
                ? "Your day is clear!" 
                : `You have ${todaysTasks.length} task${todaysTasks.length > 1 ? 's' : ''} today`
              }
            </Text>
          </View>
          
          {/* Wallet */}
          <View style={styles.wallet}>
            <Text style={styles.walletText}>🪙 {wallet?.coins || 0}</Text>
          </View>
        </View>

        {/* Companion Card */}
        <Card variant="gradient" gradientColors={colors.gradients.aurora} style={styles.companionCard}>
          <View style={styles.companionContent}>
            <CompanionAvatar
              animalType={companion?.animal_type || 'fox'}
              size={100}
              mood="happy"
              energy={companion?.energy}
            />
            <View style={styles.companionInfo}>
              <Text style={styles.companionName}>{companion?.name || 'Your Companion'}</Text>
              <Text style={styles.companionLevel}>Level {companion?.level || 1} {animal?.name}</Text>
              
              {/* Energy bar */}
              <View style={styles.energyContainer}>
                <View style={styles.energyBar}>
                  <View 
                    style={[
                      styles.energyFill, 
                      { width: `${companion?.energy || 0}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.energyText}>{companion?.energy || 0}%</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.chatToggle}
            onPress={() => setShowChat(!showChat)}
          >
            <Text style={styles.chatToggleText}>
              {showChat ? 'Hide Chat' : 'Chat with me!'}
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Chat Section */}
        {showChat && (
          <Card style={styles.chatCard}>
            <View style={styles.chatContainer}>
              <CompanionChat messages={messages} isTyping={isTyping} />
            </View>
          </Card>
        )}

        {/* Voice Input */}
        <View style={styles.voiceSection}>
          <VoiceButton
            onTranscript={handleVoiceTranscript}
            size={64}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => setShowAddTask(true)}
          >
            <LinearGradient
              colors={colors.gradients.primary}
              style={styles.quickActionGradient}
            >
              <Text style={styles.quickActionIcon}>➕</Text>
            </LinearGradient>
            <Text style={styles.quickActionLabel}>Add Task</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => handleVoiceTranscript("What are my tasks for today?")}
          >
            <View style={[styles.quickActionButton, { backgroundColor: colors.categories.work }]}>
              <Text style={styles.quickActionIcon}>📋</Text>
            </View>
            <Text style={styles.quickActionLabel}>Today</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => handleVoiceTranscript("What should I focus on?")}
          >
            <View style={[styles.quickActionButton, { backgroundColor: colors.accent.success }]}>
              <Text style={styles.quickActionIcon}>🎯</Text>
            </View>
            <Text style={styles.quickActionLabel}>Focus</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => handleVoiceTranscript("What didn't I finish last week?")}
          >
            <View style={[styles.quickActionButton, { backgroundColor: colors.accent.warning }]}>
              <Text style={styles.quickActionIcon}>⏰</Text>
            </View>
            <Text style={styles.quickActionLabel}>Overdue</Text>
          </TouchableOpacity>
        </View>

        {/* Feature Shortcuts */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresSectionTitle}>Explore</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuresScroll}
          >
            <TouchableOpacity 
              style={styles.featureCard}
              onPress={() => navigation.navigate('Challenges' as never)}
            >
              <Text style={styles.featureEmoji}>🎯</Text>
              <Text style={styles.featureTitle}>Challenges</Text>
              <Text style={styles.featureDesc}>Daily tasks</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.featureCard}
              onPress={() => navigation.navigate('Friends' as never)}
            >
              <Text style={styles.featureEmoji}>👥</Text>
              <Text style={styles.featureTitle}>Friends</Text>
              <Text style={styles.featureDesc}>Connect</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.featureCard}
              onPress={() => navigation.navigate('Leaderboard' as never)}
            >
              <Text style={styles.featureEmoji}>🏆</Text>
              <Text style={styles.featureTitle}>Leaderboard</Text>
              <Text style={styles.featureDesc}>Rankings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.featureCard}
              onPress={() => navigation.navigate('Wellness' as never)}
            >
              <Text style={styles.featureEmoji}>🧘</Text>
              <Text style={styles.featureTitle}>Wellness</Text>
              <Text style={styles.featureDesc}>Breathe</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.featureCard}
              onPress={() => navigation.navigate('Journal' as never)}
            >
              <Text style={styles.featureEmoji}>📔</Text>
              <Text style={styles.featureTitle}>Journal</Text>
              <Text style={styles.featureDesc}>Reflect</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.featureCard}
              onPress={() => navigation.navigate('Family' as never)}
            >
              <Text style={styles.featureEmoji}>👨‍👩‍👧‍👦</Text>
              <Text style={styles.featureTitle}>Family</Text>
              <Text style={styles.featureDesc}>Share tasks</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.featureCard}
              onPress={() => navigation.navigate('Inventory' as never)}
            >
              <Text style={styles.featureEmoji}>🎒</Text>
              <Text style={styles.featureTitle}>Inventory</Text>
              <Text style={styles.featureDesc}>Items</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Overdue Tasks */}
        {overdueTasks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⚠️ Overdue</Text>
              <Text style={styles.sectionCount}>{overdueTasks.length}</Text>
            </View>
            {overdueTasks.slice(0, 3).map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={() => handleTaskComplete(task.id)}
              />
            ))}
          </View>
        )}

        {/* Today's Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📅 Today</Text>
            <Text style={styles.sectionCount}>{todaysTasks.length}</Text>
          </View>
          
          {todaysTasks.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No tasks for today!</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button or use voice to add one
              </Text>
            </Card>
          ) : (
            todaysTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={() => handleTaskComplete(task.id)}
              />
            ))
          )}
        </View>

        {/* Spacer for bottom nav */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Task Modal */}
      <AddTaskModal
        visible={showAddTask}
        onClose={() => setShowAddTask(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  greeting: {
    color: colors.text.primary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
  },
  subGreeting: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
    marginTop: spacing.xs,
  },
  wallet: {
    backgroundColor: colors.background.elevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  walletText: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  companionCard: {
    marginBottom: spacing.lg,
  },
  companionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companionInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  companionName: {
    color: colors.text.primary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  companionLevel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  energyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  energyBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  energyFill: {
    height: '100%',
    backgroundColor: colors.accent.success,
    borderRadius: 4,
  },
  energyText: {
    color: colors.text.primary,
    fontSize: typography.sizes.xs,
    marginLeft: spacing.sm,
  },
  chatToggle: {
    marginTop: spacing.md,
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.full,
  },
  chatToggleText: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
  },
  chatCard: {
    marginBottom: spacing.lg,
    padding: 0,
  },
  chatContainer: {
    height: 250,
  },
  voiceSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIcon: {
    fontSize: 24,
  },
  quickActionLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  featuresSection: {
    marginBottom: spacing.xl,
  },
  featuresSectionTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
  },
  featuresScroll: {
    paddingRight: spacing.lg,
  },
  featureCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.sm,
    alignItems: 'center',
    width: 90,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  featureEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  featureTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  featureDesc: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  sectionCount: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    backgroundColor: colors.background.elevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
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

export default HomeScreen;
