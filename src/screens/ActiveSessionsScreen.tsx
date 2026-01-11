import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { Button, Card } from '../components/ui';
import { colors, spacing, borderRadius, typography } from '../theme';

interface Session {
  id: string;
  device: string;
  location: string;
  lastActive: Date;
  isCurrent: boolean;
}

export const ActiveSessionsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { signOut } = useAuthStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    // In production, this would fetch from a sessions table
    // For now, we'll show the current session
    const mockSessions: Session[] = [
      {
        id: '1',
        device: `${Platform.OS === 'ios' ? 'iPhone' : 'Android'} - CompanionAI`,
        location: 'Current Location',
        lastActive: new Date(),
        isCurrent: true,
      },
    ];
    setSessions(mockSessions);
    setIsLoading(false);
  };

  const handleRevokeSession = (sessionId: string) => {
    Alert.alert(
      'Sign Out Device',
      'Are you sure you want to sign out this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            // In production, revoke the specific session
            setSessions(sessions.filter(s => s.id !== sessionId));
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
            await signOut();
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  };

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
      >
        <Text style={styles.description}>
          These are the devices currently signed in to your account. You can sign out any device you don't recognize.
        </Text>

        {sessions.map((session) => (
          <Card key={session.id} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <Text style={styles.deviceIcon}>
                {session.device.includes('iPhone') ? '📱' : 
                 session.device.includes('Android') ? '📱' : 
                 session.device.includes('Mac') ? '💻' : '🖥️'}
              </Text>
              <View style={styles.sessionInfo}>
                <View style={styles.deviceRow}>
                  <Text style={styles.deviceName}>{session.device}</Text>
                  {session.isCurrent && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.sessionLocation}>{session.location}</Text>
                <Text style={styles.sessionTime}>
                  Last active: {formatDate(session.lastActive)}
                </Text>
              </View>
            </View>
            
            {!session.isCurrent && (
              <TouchableOpacity
                onPress={() => handleRevokeSession(session.id)}
                style={styles.revokeButton}
              >
                <Text style={styles.revokeText}>Sign Out</Text>
              </TouchableOpacity>
            )}
          </Card>
        ))}

        <View style={styles.signOutAllContainer}>
          <Button
            title="Sign Out All Devices"
            variant="outline"
            onPress={handleSignOutAll}
            fullWidth
          />
          <Text style={styles.signOutAllNote}>
            This will sign you out of all devices, including this one.
          </Text>
        </View>

        <Card style={styles.securityTip}>
          <Text style={styles.securityTipTitle}>🔒 Security Tip</Text>
          <Text style={styles.securityTipText}>
            If you see a device you don't recognize, sign it out immediately and change your password.
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
    marginBottom: spacing.lg,
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
    marginBottom: spacing.xs,
  },
  deviceName: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  currentBadge: {
    backgroundColor: colors.accent.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
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
  signOutAllContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  signOutAllNote: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  securityTip: {
    backgroundColor: colors.accent.primary + '10',
    borderColor: colors.accent.primary + '30',
  },
  securityTipTitle: {
    color: colors.accent.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  securityTipText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
});

export default ActiveSessionsScreen;
