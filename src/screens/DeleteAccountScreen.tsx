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
import { useAuthStore } from '../stores/authStore';
import { Button, Input, Card } from '../components/ui';
import { colors, spacing, borderRadius, typography } from '../theme';

export const DeleteAccountScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, signOut } = useAuthStore();
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'info' | 'confirm'>('info');

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call Edge Function to delete account
      const { data, error: fnError } = await supabase.functions.invoke('delete-account', {
        body: { password },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      Alert.alert(
        'Account Deleted',
        'Your account and all associated data have been permanently deleted.',
        [
          {
            text: 'OK',
            onPress: async () => {
              await signOut();
            },
          },
        ]
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setIsLoading(false);
    }
  };

  const renderInfoStep = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.emoji}>⚠️</Text>
        <Text style={styles.title}>Delete Account</Text>
        <Text style={styles.subtitle}>
          We're sorry to see you go. Before you delete your account, please read the following:
        </Text>
      </View>

      <Card style={styles.warningCard}>
        <Text style={styles.warningTitle}>What will be deleted:</Text>
        <View style={styles.warningList}>
          <Text style={styles.warningItem}>• Your profile and personal information</Text>
          <Text style={styles.warningItem}>• All your tasks and task history</Text>
          <Text style={styles.warningItem}>• Your companion and its progress</Text>
          <Text style={styles.warningItem}>• All coins, XP, and achievements</Text>
          <Text style={styles.warningItem}>• Purchased items and inventory</Text>
          <Text style={styles.warningItem}>• Streaks and activity history</Text>
          <Text style={styles.warningItem}>• Any active subscriptions</Text>
        </View>
      </Card>

      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>⏰ This action is permanent</Text>
        <Text style={styles.infoText}>
          Once you delete your account, there is no way to recover your data. This action cannot be undone. Your authentication credentials will also be removed.
        </Text>
      </Card>

      <Card style={styles.subscriptionCard}>
        <Text style={styles.subscriptionTitle}>📱 Active Subscriptions</Text>
        <Text style={styles.subscriptionText}>
          If you have an active subscription, please cancel it through your device's app store settings before deleting your account to avoid future charges.
        </Text>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          title="Cancel"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
        />
        <Button
          title="Continue"
          variant="primary"
          onPress={() => setStep('confirm')}
          style={styles.continueButton}
        />
      </View>
    </>
  );

  const renderConfirmStep = () => (
    <>
      <TouchableOpacity 
        onPress={() => setStep('info')}
        style={styles.backArrow}
      >
        <Text style={styles.backArrowText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.emoji}>🗑️</Text>
        <Text style={styles.title}>Confirm Deletion</Text>
        <Text style={styles.subtitle}>
          To permanently delete your account, please verify your identity.
        </Text>
      </View>

      <Card style={styles.form}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Input
          label="Enter your password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
        />

        <View style={styles.confirmSection}>
          <Text style={styles.confirmLabel}>
            Type <Text style={styles.deleteText}>DELETE</Text> to confirm:
          </Text>
          <Input
            placeholder="DELETE"
            value={confirmText}
            onChangeText={setConfirmText}
            autoCapitalize="characters"
          />
        </View>

        <Button
          title="Permanently Delete Account"
          onPress={handleDeleteAccount}
          loading={isLoading}
          disabled={confirmText !== 'DELETE' || !password}
          fullWidth
          size="lg"
          style={styles.deleteButton}
        />

        <Text style={styles.finalWarning}>
          ⚠️ This will immediately and permanently delete your account, all data, and your authentication credentials.
        </Text>
      </Card>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 'info' ? renderInfoStep() : renderConfirmStep()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  backArrow: {
    marginBottom: spacing.lg,
  },
  backArrowText: {
    color: colors.accent.primary,
    fontSize: typography.sizes.md,
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
  warningCard: {
    backgroundColor: colors.accent.error + '10',
    borderColor: colors.accent.error + '30',
    marginBottom: spacing.md,
  },
  warningTitle: {
    color: colors.accent.error,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  warningList: {
    gap: spacing.xs,
  },
  warningItem: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  infoCard: {
    backgroundColor: colors.accent.warning + '10',
    borderColor: colors.accent.warning + '30',
    marginBottom: spacing.md,
  },
  infoTitle: {
    color: colors.accent.warning,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  infoText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  subscriptionCard: {
    backgroundColor: colors.accent.primary + '10',
    borderColor: colors.accent.primary + '30',
    marginBottom: spacing.xl,
  },
  subscriptionTitle: {
    color: colors.accent.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  subscriptionText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  continueButton: {
    flex: 1,
    backgroundColor: colors.accent.error,
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
  confirmSection: {
    marginTop: spacing.md,
  },
  confirmLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.sm,
  },
  deleteText: {
    color: colors.accent.error,
    fontWeight: typography.weights.bold,
  },
  deleteButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent.error,
  },
  finalWarning: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default DeleteAccountScreen;
