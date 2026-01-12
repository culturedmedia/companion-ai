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
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { familyService, Family, FamilyMember, FamilyTask } from '../services/familyService';
import { useAuthStore } from '../stores/authStore';
import { Card, Button } from '../components/ui';
import { colors, spacing, borderRadius, typography } from '../theme';
import { ANIMAL_OPTIONS } from '../types';

type Tab = 'tasks' | 'members' | 'stats';

export const FamilyScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [tasks, setTasks] = useState<FamilyTask[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateFamily, setShowCreateFamily] = useState(false);
  const [showJoinFamily, setShowJoinFamily] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    loadFamilies();
  }, []);

  useEffect(() => {
    if (selectedFamily) {
      loadFamilyData();
    }
  }, [selectedFamily]);

  const loadFamilies = async () => {
    if (!user?.id) return;

    try {
      const data = await familyService.getUserFamilies(user.id);
      setFamilies(data);
      if (data.length > 0 && !selectedFamily) {
        setSelectedFamily(data[0]);
      }
    } catch (error) {
      console.error('Failed to load families:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadFamilyData = async () => {
    if (!selectedFamily) return;

    try {
      const [membersData, tasksData] = await Promise.all([
        familyService.getFamilyMembers(selectedFamily.id),
        familyService.getFamilyTasks(selectedFamily.id),
      ]);
      setMembers(membersData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to load family data:', error);
    }
  };

  const handleCreateFamily = async () => {
    if (!user?.id || !newFamilyName.trim()) return;

    const result = await familyService.createFamily(user.id, newFamilyName.trim());
    if (result.family) {
      setFamilies([...families, result.family]);
      setSelectedFamily(result.family);
      setShowCreateFamily(false);
      setNewFamilyName('');
      Alert.alert('Family Created!', `Share code: ${result.family.inviteCode}`);
    } else {
      Alert.alert('Error', result.error || 'Failed to create family');
    }
  };

  const handleJoinFamily = async () => {
    if (!user?.id || !inviteCode.trim()) return;

    const result = await familyService.joinFamily(user.id, inviteCode.trim());
    if (result.success) {
      setShowJoinFamily(false);
      setInviteCode('');
      loadFamilies();
      Alert.alert('Success!', 'You joined the family!');
    } else {
      Alert.alert('Error', result.error || 'Failed to join family');
    }
  };

  const handleAddTask = async () => {
    if (!user?.id || !selectedFamily || !newTaskTitle.trim()) return;

    const result = await familyService.createFamilyTask(
      selectedFamily.id,
      user.id,
      { title: newTaskTitle.trim() }
    );

    if (result.task) {
      setTasks([result.task, ...tasks]);
      setShowAddTask(false);
      setNewTaskTitle('');
    } else {
      Alert.alert('Error', result.error || 'Failed to create task');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    if (!user?.id) return;

    const success = await familyService.completeFamilyTask(taskId, user.id);
    if (success) {
      loadFamilyData();
    }
  };

  const handleShareInvite = async () => {
    if (!selectedFamily) return;

    try {
      await Share.share({
        message: `Join our family on CompanionAI! Use code: ${selectedFamily.inviteCode}`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const getAnimalEmoji = (type?: string) => {
    const animal = ANIMAL_OPTIONS.find(a => a.type === type);
    return animal?.emoji || '🐾';
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // No families - show create/join
  if (families.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Family</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>👨‍👩‍👧‍👦</Text>
          <Text style={styles.emptyTitle}>No Family Yet</Text>
          <Text style={styles.emptyText}>
            Create a family or join one with an invite code to share tasks!
          </Text>

          {showCreateFamily ? (
            <Card style={styles.formCard}>
              <Text style={styles.formTitle}>Create Family</Text>
              <TextInput
                style={styles.input}
                placeholder="Family name..."
                placeholderTextColor={colors.text.muted}
                value={newFamilyName}
                onChangeText={setNewFamilyName}
              />
              <View style={styles.formButtons}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setShowCreateFamily(false)}
                />
                <Button
                  title="Create"
                  onPress={handleCreateFamily}
                  disabled={!newFamilyName.trim()}
                />
              </View>
            </Card>
          ) : showJoinFamily ? (
            <Card style={styles.formCard}>
              <Text style={styles.formTitle}>Join Family</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter invite code..."
                placeholderTextColor={colors.text.muted}
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
              />
              <View style={styles.formButtons}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setShowJoinFamily(false)}
                />
                <Button
                  title="Join"
                  onPress={handleJoinFamily}
                  disabled={!inviteCode.trim()}
                />
              </View>
            </Card>
          ) : (
            <View style={styles.actionButtons}>
              <Button
                title="Create Family"
                onPress={() => setShowCreateFamily(true)}
                fullWidth
              />
              <Button
                title="Join with Code"
                variant="outline"
                onPress={() => setShowJoinFamily(true)}
                fullWidth
              />
            </View>
          )}
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
        <Text style={styles.title}>{selectedFamily?.name || 'Family'}</Text>
        <TouchableOpacity onPress={handleShareInvite}>
          <Text style={styles.shareButton}>📤</Text>
        </TouchableOpacity>
      </View>

      {/* Invite Code */}
      <Card style={styles.inviteCard}>
        <Text style={styles.inviteLabel}>Invite Code</Text>
        <Text style={styles.inviteCode}>{selectedFamily?.inviteCode}</Text>
      </Card>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { key: 'tasks', label: 'Tasks' },
          { key: 'members', label: 'Members' },
          { key: 'stats', label: 'Stats' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key as Tab)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              loadFamilyData();
              setIsRefreshing(false);
            }}
            tintColor={colors.accent.primary}
          />
        }
      >
        {activeTab === 'tasks' && (
          <>
            {/* Add Task */}
            {showAddTask ? (
              <Card style={styles.addTaskCard}>
                <TextInput
                  style={styles.input}
                  placeholder="Task title..."
                  placeholderTextColor={colors.text.muted}
                  value={newTaskTitle}
                  onChangeText={setNewTaskTitle}
                  autoFocus
                />
                <View style={styles.formButtons}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    onPress={() => setShowAddTask(false)}
                    size="sm"
                  />
                  <Button
                    title="Add"
                    onPress={handleAddTask}
                    disabled={!newTaskTitle.trim()}
                    size="sm"
                  />
                </View>
              </Card>
            ) : (
              <TouchableOpacity
                style={styles.addTaskButton}
                onPress={() => setShowAddTask(true)}
              >
                <Text style={styles.addTaskText}>+ Add Family Task</Text>
              </TouchableOpacity>
            )}

            {/* Pending Tasks */}
            <Text style={styles.sectionTitle}>To Do ({pendingTasks.length})</Text>
            {pendingTasks.map(task => (
              <Card key={task.id} style={styles.taskCard}>
                <TouchableOpacity
                  style={styles.taskCheckbox}
                  onPress={() => handleCompleteTask(task.id)}
                >
                  <Text style={styles.checkboxText}>○</Text>
                </TouchableOpacity>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskMeta}>
                    Added by {task.createdByName}
                    {task.assignedToName && ` • Assigned to ${task.assignedToName}`}
                  </Text>
                </View>
                <Text style={styles.taskPoints}>+{task.points} pts</Text>
              </Card>
            ))}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Completed ({completedTasks.length})</Text>
                {completedTasks.slice(0, 5).map(task => (
                  <Card key={task.id} style={[styles.taskCard, styles.taskCardCompleted]}>
                    <Text style={styles.checkboxCompleted}>✓</Text>
                    <View style={styles.taskInfo}>
                      <Text style={[styles.taskTitle, styles.taskTitleCompleted]}>
                        {task.title}
                      </Text>
                      <Text style={styles.taskMeta}>
                        Completed by {task.completedByName}
                      </Text>
                    </View>
                  </Card>
                ))}
              </>
            )}
          </>
        )}

        {activeTab === 'members' && (
          <>
            {members.map(member => (
              <Card key={member.id} style={styles.memberCard}>
                <Text style={styles.memberEmoji}>
                  {getAnimalEmoji(member.companionType)}
                </Text>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {member.displayName}
                    {member.userId === user?.id && ' (You)'}
                  </Text>
                  {member.companionName && (
                    <Text style={styles.memberCompanion}>{member.companionName}</Text>
                  )}
                </View>
                {member.role === 'admin' && (
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminText}>Admin</Text>
                  </View>
                )}
              </Card>
            ))}
          </>
        )}

        {activeTab === 'stats' && (
          <Card style={styles.statsCard}>
            <Text style={styles.statsTitle}>This Week</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{tasks.length}</Text>
                <Text style={styles.statLabel}>Total Tasks</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{completedTasks.length}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </View>
            
            <Text style={[styles.statsTitle, { marginTop: spacing.lg }]}>Top Contributors</Text>
            {members.slice(0, 3).map((member, index) => (
              <View key={member.id} style={styles.contributorRow}>
                <Text style={styles.contributorRank}>{index + 1}</Text>
                <Text style={styles.contributorEmoji}>
                  {getAnimalEmoji(member.companionType)}
                </Text>
                <Text style={styles.contributorName}>{member.displayName}</Text>
              </View>
            ))}
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
  shareButton: {
    fontSize: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  actionButtons: {
    width: '100%',
    gap: spacing.md,
  },
  formCard: {
    width: '100%',
  },
  formTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    marginBottom: spacing.md,
  },
  formButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  inviteCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inviteLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  inviteCode: {
    color: colors.accent.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    letterSpacing: 2,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.accent.primary + '20',
  },
  tabText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  tabTextActive: {
    color: colors.accent.primary,
    fontWeight: typography.weights.semibold,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  addTaskButton: {
    backgroundColor: colors.accent.primary + '20',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent.primary + '40',
    borderStyle: 'dashed',
  },
  addTaskText: {
    color: colors.accent.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  addTaskCard: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  taskCardCompleted: {
    opacity: 0.6,
  },
  taskCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkboxText: {
    color: colors.accent.primary,
    fontSize: 16,
  },
  checkboxCompleted: {
    color: colors.accent.success,
    fontSize: 20,
    marginRight: spacing.md,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.text.tertiary,
  },
  taskMeta: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  taskPoints: {
    color: colors.accent.warning,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  memberEmoji: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  memberCompanion: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
  },
  adminBadge: {
    backgroundColor: colors.accent.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  adminText: {
    color: colors.accent.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  statsCard: {
    padding: spacing.lg,
  },
  statsTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: colors.text.primary,
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
  },
  statLabel: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
  },
  contributorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  contributorRank: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.md,
    width: 24,
  },
  contributorEmoji: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  contributorName: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
  },
});

export default FamilyScreen;
