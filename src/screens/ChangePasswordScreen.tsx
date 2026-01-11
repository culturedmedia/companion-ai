import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { Button, Input, Card } from '../components/ui';
import { colors, spacing, borderRadius, typography } from '../theme';

export const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number';
    return null;
  };

  const handleChangePassword = async () => {
    setError(null);

    if (!currentPassword) {
      setError('Please enter your current password');
      return;
    }

    const validationError = validatePassword(newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      Alert.alert(
        'Password Changed',
        'Your password has been successfully updated.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Change Password</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.form}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Input
            label="Current Password"
            placeholder="••••••••"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            autoComplete="current-password"
          />

          <Input
            label="New Password"
            placeholder="••••••••"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoComplete="new-password"
          />

          <Input
            label="Confirm New Password"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="new-password"
          />

          {/* Password Requirements */}
          <View style={styles.requirements}>
            <Text style={styles.requirementsTitle}>Password must contain:</Text>
            <PasswordRequirement met={newPassword.length >= 8} text="At least 8 characters" />
            <PasswordRequirement met={/[A-Z]/.test(newPassword)} text="One uppercase letter" />
            <PasswordRequirement met={/[a-z]/.test(newPassword)} text="One lowercase letter" />
            <PasswordRequirement met={/[0-9]/.test(newPassword)} text="One number" />
          </View>

          <Button
            title="Update Password"
            onPress={handleChangePassword}
            loading={isLoading}
            disabled={!currentPassword || !newPassword || !confirmPassword}
            fullWidth
            size="lg"
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const PasswordRequirement: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
  <View style={styles.requirement}>
    <Text style={[styles.requirementIcon, met && styles.requirementMet]}>
      {met ? '✓' : '○'}
    </Text>
    <Text style={[styles.requirementText, met && styles.requirementTextMet]}>
      {text}
    </Text>
  </View>
);

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
  form: {
    padding: spacing.lg,
  },
  errorContainer: {
    backgroundColor: colors.accent.error + '20',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.error,
  },
  errorText: {
    color: colors.accent.error,
    fontSize: typography.sizes.sm,
  },
  requirements: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  requirementsTitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.sm,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  requirementIcon: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
    marginRight: spacing.sm,
    width: 16,
  },
  requirementMet: {
    color: colors.accent.success,
  },
  requirementText: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
  },
  requirementTextMet: {
    color: colors.accent.success,
  },
});

export default ChangePasswordScreen;
