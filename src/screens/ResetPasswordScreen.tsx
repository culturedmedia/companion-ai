import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { Button, Input, Card } from '../components/ui';
import { colors, spacing, borderRadius, typography } from '../theme';

export const ResetPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleResetPassword = async () => {
    setError(null);

    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.successContainer}>
            <Text style={styles.successEmoji}>✅</Text>
            <Text style={styles.successTitle}>Password Reset!</Text>
            <Text style={styles.successText}>
              Your password has been successfully updated. You can now sign in with your new password.
            </Text>
            
            <Button
              title="Continue to App"
              onPress={() => navigation.navigate('Main' as never)}
              style={styles.continueButton}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[colors.background.primary, colors.background.secondary]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.emoji}>🔑</Text>
              <Text style={styles.title}>Create New Password</Text>
              <Text style={styles.subtitle}>
                Your new password must be different from previously used passwords.
              </Text>
            </View>

            {/* Form */}
            <Card style={styles.form}>
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Input
                label="New Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
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
                <PasswordRequirement 
                  met={password.length >= 8} 
                  text="At least 8 characters" 
                />
                <PasswordRequirement 
                  met={/[A-Z]/.test(password)} 
                  text="One uppercase letter" 
                />
                <PasswordRequirement 
                  met={/[a-z]/.test(password)} 
                  text="One lowercase letter" 
                />
                <PasswordRequirement 
                  met={/[0-9]/.test(password)} 
                  text="One number" 
                />
              </View>

              <Button
                title="Reset Password"
                onPress={handleResetPassword}
                loading={isLoading}
                disabled={!password || !confirmPassword}
                fullWidth
                size="lg"
                style={styles.submitButton}
              />
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
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
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
    textAlign: 'center',
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
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
  submitButton: {
    marginTop: spacing.md,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  successEmoji: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  successTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
  },
  successText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
  },
  continueButton: {
    minWidth: 200,
  },
});

export default ResetPasswordScreen;
