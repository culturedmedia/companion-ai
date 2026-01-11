import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../stores/authStore';
import { useCompanionStore } from '../stores/companionStore';
import { useWalletStore } from '../stores/walletStore';
import { CompanionAvatar } from '../components/companion/CompanionAvatar';
import { Card, Button, Input } from '../components/ui';
import { ANIMAL_OPTIONS } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { profile, signOut, updateProfile } = useAuthStore();
  const { companion } = useCompanionStore();
  const { wallet } = useWalletStore();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [morningReminder, setMorningReminder] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(profile?.display_name || '');

  const animal = companion 
    ? ANIMAL_OPTIONS.find(a => a.type === companion.animal_type)
    : null;

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const handleSaveName = async () => {
    if (newName.trim()) {
      await updateProfile({ display_name: newName.trim() });
      setEditingName(false);
    }
  };

  const SettingRow: React.FC<{
    icon: string;
    title: string;
    subtitle?: string;
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    onPress?: () => void;
    showArrow?: boolean;
  }> = ({ icon, title, subtitle, value, onValueChange, onPress, showArrow }) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress && !onValueChange}
    >
      <Text style={styles.settingIcon}>{icon}</Text>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {onValueChange !== undefined && value !== undefined && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ 
            false: colors.background.tertiary, 
            true: colors.accent.primary + '80' 
          }}
          thumbColor={value ? colors.accent.primary : colors.text.tertiary}
        />
      )}
      {showArrow && (
        <Text style={styles.arrow}>›</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>Settings</Text>

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <CompanionAvatar
              animalType={companion?.animal_type || 'fox'}
              size={80}
              mood="happy"
            />
            <View style={styles.profileInfo}>
              {editingName ? (
                <View style={styles.editNameContainer}>
                  <Input
                    value={newName}
                    onChangeText={setNewName}
                    placeholder="Your name"
                    autoFocus
                    style={styles.nameInput}
                  />
                  <View style={styles.editButtons}>
                    <TouchableOpacity
                      onPress={() => setEditingName(false)}
                      style={styles.cancelButton}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSaveName}
                      style={styles.saveButton}
                    >
                      <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <TouchableOpacity onPress={() => setEditingName(true)}>
                    <Text style={styles.profileName}>
                      {profile?.display_name || 'User'} ✏️
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.profileEmail}>{profile?.email}</Text>
                </>
              )}
            </View>
          </View>
          
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>🪙 {wallet?.coins || 0}</Text>
              <Text style={styles.statLabel}>Coins</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>⭐ {wallet?.xp || 0}</Text>
              <Text style={styles.statLabel}>XP</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>Lv. {companion?.level || 1}</Text>
              <Text style={styles.statLabel}>{animal?.name}</Text>
            </View>
          </View>
        </Card>

        {/* Companion Section */}
        <Text style={styles.sectionTitle}>Companion</Text>
        <Card style={styles.section}>
          <SettingRow
            icon={animal?.emoji || '🦊'}
            title={companion?.name || 'Companion'}
            subtitle={`${animal?.description} • Level ${companion?.level || 1}`}
            showArrow
          />
        </Card>

        {/* Notifications Section */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Card style={styles.section}>
          <SettingRow
            icon="🔔"
            title="Push Notifications"
            subtitle="Get reminders for your tasks"
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="🌅"
            title="Morning Check-in"
            subtitle="Daily greeting from your companion"
            value={morningReminder}
            onValueChange={setMorningReminder}
          />
        </Card>

        {/* Preferences Section */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <Card style={styles.section}>
          <SettingRow
            icon="🔊"
            title="Sound Effects"
            value={soundEnabled}
            onValueChange={setSoundEnabled}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="📳"
            title="Haptic Feedback"
            value={hapticEnabled}
            onValueChange={setHapticEnabled}
          />
        </Card>

        {/* Security Section */}
        <Text style={styles.sectionTitle}>Security</Text>
        <Card style={styles.section}>
          <SettingRow
            icon="🔑"
            title="Change Password"
            showArrow
            onPress={() => navigation.navigate('ChangePassword' as never)}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="🔐"
            title="Two-Factor Authentication"
            subtitle={twoFactorEnabled ? 'Enabled' : 'Not set up'}
            showArrow
            onPress={() => navigation.navigate('TwoFactorSetup' as never)}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="📱"
            title="Active Sessions"
            showArrow
            onPress={() => navigation.navigate('ActiveSessions' as never)}
          />
        </Card>

        {/* Support Section */}
        <Text style={styles.sectionTitle}>Support</Text>
        <Card style={styles.section}>
          <SettingRow
            icon="❓"
            title="Help & FAQ"
            showArrow
            onPress={() => navigation.navigate('Help' as never)}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="💬"
            title="Send Feedback"
            showArrow
            onPress={() => navigation.navigate('Feedback' as never)}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="📜"
            title="Privacy Policy"
            showArrow
            onPress={() => navigation.navigate('Privacy' as never)}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="📋"
            title="Terms of Service"
            showArrow
            onPress={() => navigation.navigate('Terms' as never)}
          />
        </Card>

        {/* Danger Zone */}
        <Text style={styles.sectionTitle}>Account</Text>
        <Card style={styles.section}>
          <SettingRow
            icon="🗑️"
            title="Delete Account"
            subtitle="Permanently delete your account and data"
            showArrow
            onPress={() => navigation.navigate('DeleteAccount' as never)}
          />
        </Card>

        {/* Sign Out */}
        <View style={styles.signOutContainer}>
          <Button
            title="Sign Out"
            variant="outline"
            onPress={handleSignOut}
            fullWidth
          />
        </View>

        {/* App Version */}
        <Text style={styles.version}>CompanionAI v1.0.0</Text>

        {/* Bottom spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>
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
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.lg,
  },
  profileCard: {
    marginBottom: spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  profileName: {
    color: colors.text.primary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  profileEmail: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  editNameContainer: {
    flex: 1,
  },
  nameInput: {
    marginBottom: spacing.sm,
  },
  editButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  cancelButtonText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  saveButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  saveButtonText: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  statLabel: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border.default,
  },
  sectionTitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  section: {
    padding: 0,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
  },
  settingSubtitle: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  arrow: {
    color: colors.text.tertiary,
    fontSize: 24,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginLeft: spacing.md + 20 + spacing.md,
  },
  signOutContainer: {
    marginTop: spacing.xl,
  },
  version: {
    color: colors.text.muted,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});

export default SettingsScreen;
