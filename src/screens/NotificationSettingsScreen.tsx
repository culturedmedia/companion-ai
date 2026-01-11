import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Card } from '../components/ui';
import { colors, spacing, borderRadius, typography } from '../theme';

interface NotificationSetting {
  key: string;
  title: string;
  description: string;
  enabled: boolean;
}

export const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState(false);
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      key: 'taskReminders',
      title: 'Task Reminders',
      description: 'Get notified when tasks are due',
      enabled: true,
    },
    {
      key: 'morningCheckIn',
      title: 'Morning Check-In',
      description: 'Daily greeting from your companion',
      enabled: true,
    },
    {
      key: 'streakReminder',
      title: 'Streak Reminder',
      description: 'Reminder to maintain your daily streak',
      enabled: true,
    },
    {
      key: 'achievements',
      title: 'Achievements',
      description: 'Celebrate when you unlock achievements',
      enabled: true,
    },
    {
      key: 'companionMessages',
      title: 'Companion Messages',
      description: 'Encouragement and tips from your companion',
      enabled: false,
    },
    {
      key: 'weeklyReport',
      title: 'Weekly Report',
      description: 'Summary of your productivity each week',
      enabled: true,
    },
  ]);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setHasPermission(status === 'granted');
    
    if (status !== 'granted') {
      Alert.alert(
        'Notifications Disabled',
        'To enable notifications, please go to your device settings and allow notifications for CompanionAI.',
        [{ text: 'OK' }]
      );
    }
  };

  const toggleSetting = (key: string) => {
    if (!hasPermission) {
      requestPermissions();
      return;
    }

    setSettings(prev => prev.map(s => 
      s.key === key ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const toggleAll = (enabled: boolean) => {
    if (!hasPermission && enabled) {
      requestPermissions();
      return;
    }

    setSettings(prev => prev.map(s => ({ ...s, enabled })));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission Status */}
        {!hasPermission && (
          <Card style={styles.permissionCard}>
            <Text style={styles.permissionIcon}>🔔</Text>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionTitle}>Notifications Disabled</Text>
              <Text style={styles.permissionText}>
                Enable notifications to get reminders and updates from your companion.
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.enableButton}
              onPress={requestPermissions}
            >
              <Text style={styles.enableButtonText}>Enable</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => toggleAll(true)}
          >
            <Text style={styles.quickActionText}>Enable All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => toggleAll(false)}
          >
            <Text style={styles.quickActionText}>Disable All</Text>
          </TouchableOpacity>
        </View>

        {/* Notification Settings */}
        <Card style={styles.settingsCard}>
          {settings.map((setting, index) => (
            <React.Fragment key={setting.key}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>{setting.title}</Text>
                  <Text style={styles.settingDescription}>{setting.description}</Text>
                </View>
                <Switch
                  value={setting.enabled && hasPermission}
                  onValueChange={() => toggleSetting(setting.key)}
                  trackColor={{ 
                    false: colors.background.tertiary, 
                    true: colors.accent.primary + '50' 
                  }}
                  thumbColor={setting.enabled ? colors.accent.primary : colors.text.tertiary}
                />
              </View>
              {index < settings.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </Card>

        {/* Quiet Hours */}
        <Text style={styles.sectionTitle}>Quiet Hours</Text>
        <Card style={styles.quietHoursCard}>
          <View style={styles.quietHoursRow}>
            <View style={styles.quietHoursInfo}>
              <Text style={styles.quietHoursTitle}>Do Not Disturb</Text>
              <Text style={styles.quietHoursDescription}>
                Pause notifications during specific hours
              </Text>
            </View>
            <Switch
              value={false}
              onValueChange={() => {}}
              trackColor={{ 
                false: colors.background.tertiary, 
                true: colors.accent.primary + '50' 
              }}
              thumbColor={colors.text.tertiary}
            />
          </View>
          <Text style={styles.quietHoursNote}>
            When enabled, you can set quiet hours (e.g., 10 PM - 7 AM)
          </Text>
        </Card>

        {/* Info */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Tip</Text>
          <Text style={styles.infoText}>
            Morning check-ins are sent at 8 AM by default. You can customize the time in your device's notification settings.
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
  permissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.warning + '10',
    borderColor: colors.accent.warning + '30',
    marginBottom: spacing.lg,
  },
  permissionIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  permissionText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  enableButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  enableButtonText: {
    color: colors.text.inverse,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
  },
  quickActionText: {
    color: colors.accent.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  settingsCard: {
    marginBottom: spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: spacing.sm,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  quietHoursCard: {
    marginBottom: spacing.lg,
  },
  quietHoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quietHoursInfo: {
    flex: 1,
  },
  quietHoursTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
  },
  quietHoursDescription: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
  },
  quietHoursNote: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  infoCard: {
    backgroundColor: colors.accent.primary + '10',
    borderColor: colors.accent.primary + '30',
  },
  infoTitle: {
    color: colors.accent.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  infoText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
});

export default NotificationSettingsScreen;
