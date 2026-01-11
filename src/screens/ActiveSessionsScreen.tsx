import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { sessionService, Session } from '../services/sessionService';
import { useAuthStore } from '../stores/authStore';
import { Button, Card } from '../components/ui';
import { colors, spacing, borderRadius, typography } from '../theme';

export const ActiveSessionsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, signOut } = useAuthStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    if (!user?.id) return;
    
    try {
      const data = await sessionService.getSessions(user.id);
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadSessions();
  };

  const handleRevokeSession = (session: Session) => {
    if (session.is_current) {
      Alert.alert(
        'Cannot Revoke',
        'You cannot revoke your current session. Use "Sign Out" instead.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Sign Out Device',
      `Are you sure you want to sign out "${session.device_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const success = await sessionService.revokeSession(session.id);
            if (success) {
              setSessions(sessions.filter(s => s.id !== session.id));
            } else {
              Alert.alert('Error', 'Failed to sign out device');
            }
          },
        },
      ]
    );
  };

  const handleSignOutAll = () => {
    Alert.alert(
      'Sign Out All Devices',
      'This will sign you out of all devices, including this one. You will need to sign in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out All',
          style: 'destructive',
          onPress: async () => {
            if (user?.id) {
              await sessionService.revokeAllOtherSessions(user.id);
            }
            await signOut();
          },
        },
      ]
    );
  };

  const handleRevokeAllOthers = () => {
    const otherSessions = sessions.filter(s => !s.is_current);
    if (otherSessions.length === 0) {
      Alert.alert('No Other Sessions', 'You only have one active session.');
      return;
    }

    Alert.alert(
      'Sign Out Other Devices',
      `This will sign out ${otherSessions.length} other device(s).`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out Others',
          style: 'destructive',
          onPress: async () => {
            if (user?.id) {
              const success = await sessionService.revokeAllOtherSessions(user.id);
              if (success) {
                setSessions(sessions.filter(s => s.is_current));
              }
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getDeviceIcon = (deviceType: string, deviceName: string) => {
    if (deviceType === 'ios' || deviceName.toLowerCase().includes('iphone')) return '📱';
    if (deviceType === 'android') return '📱';
    if (deviceType === 'web') return '🌐';
    if (deviceName.toLowerCase().includes('ipad')) return '📱';
    if (deviceName.toLowerCase().includes('mac')) return '💻';
    return '🖥️';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
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
        <Text style={styles.title}>Active Sessions</Text>
        <View style={{ width: 50 }} />
      </View>

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
        <Text style={styles.description}>
          These are the devices currently signed in to your account. You can sign out any device you don't recognize.
        </Text>

        {/* Session Count */}
        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {sessions.length} active session{sessions.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {sessions.map((session) => (
          <Card key={session.id} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <Text style={styles.deviceIcon}>
                {getDeviceIcon(session.device_type, session.device_name)}
              </Text>
              <View style={styles.sessionInfo}>
                <View style={styles.deviceRow}>
                  <Text style={styles.deviceName}>{session.device_name}</Text>
                  {session.is_current && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>This device</Text>
                    </View>
                  )}
                </View>
                {session.location && (
                  <Text style={styles.sessionLocation}>📍 {session.location}</Text>
                )}
                <Text style={styles.sessionTime}>
                  Last active: {formatDate(session.last_active_at)}
                </Text>
                <Text style={styles.sessionCreated}>
                  Signed in: {formatDate(session.created_at)}
                </Text>
              </View>
            </View>
            
            {!session.is_current && (
              <TouchableOpacity
                onPress={() => handleRevokeSession(session)}
                style={styles.revokeButton}
              >
                <Text style={styles.revokeText}>Sign Out This Device</Text>
              </TouchableOpacity>
            )}
          </Card>
        ))}

        {sessions.length === 0 && (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No active sessions found</Text>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {sessions.length > 1 && (
            <Button
              title="Sign Out All Other Devices"
              variant="outline"
              onPress={handleRevokeAllOthers}
              fullWidth
              style={styles.actionButton}
            />
          )}
          
          <Button
            title="Sign Out All Devices"
            variant="outline"
            onPress={handleSignOutAll}
            fullWidth
            style={[styles.actionButton, styles.dangerButton]}
          />
        </View>

        {/* Security Tip */}
        <Card style={styles.securityTip}>
          <Text style={styles.securityTipTitle}>🔒 Security Tips</Text>
          <Text style={styles.securityTipText}>
            • Sign out devices you don't recognize immediately{'\n'}
            • Change your password if you see suspicious activity{'\n'}
            • Enable two-factor authentication for extra security{'\n'}
            • Review your sessions regularly
          </Text>
        </Card>
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
  content: {
    padding: spacing.lg,
  },
  description: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    marginBottom: spacing.md,
  },
  countBadge: {
    backgroundColor: colors.background.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  countText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  sessionCard: {
    marginBottom: spacing.md,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  deviceIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  sessionInfo: {
    flex: 1,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  deviceName: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginRight: spacing.sm,
  },
  currentBadge: {
    backgroundColor: colors.accent.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  currentBadgeText: {
    color: colors.accent.success,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  sessionLocation: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xs,
  },
  sessionTime: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
  },
  sessionCreated: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  revokeButton: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  revokeText: {
    color: colors.accent.error,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.md,
  },
  actionsContainer: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
  dangerButton: {
    borderColor: colors.accent.error,
  },
  securityTip: {
    backgroundColor: colors.accent.primary + '10',
    borderColor: colors.accent.primary + '30',
    marginTop: spacing.lg,
  },
  securityTipTitle: {
    color: colors.accent.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  securityTipText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
});

export default ActiveSessionsScreen;
