import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { Button, Input, Card } from '../components/ui';
import { colors, spacing, borderRadius, typography } from '../theme';

export const TwoFactorSetupScreen: React.FC = () => {
  const navigation = useNavigation();
  const [step, setStep] = useState<'intro' | 'setup' | 'verify' | 'backup'>('intro');
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSecret = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-totp', {
        body: { action: 'generate' },
      });

      if (fnError) throw fnError;

      setSecret(data.secret);
      setQrCodeUrl(data.qrCodeUrl);
      setStep('setup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate 2FA secret');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-totp', {
        body: { action: 'enable', code: verificationCode },
      });

      if (fnError) throw fnError;

      if (data.error) {
        setError(data.error);
        return;
      }

      setBackupCodes(data.backupCodes);
      setStep('backup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = async () => {
    await Clipboard.setStringAsync(secret);
    Alert.alert('Copied!', 'Secret key copied to clipboard');
  };

  const copyBackupCodes = async () => {
    await Clipboard.setStringAsync(backupCodes.join('\n'));
    Alert.alert('Copied!', 'Backup codes copied to clipboard');
  };

  const finishSetup = () => {
    Alert.alert(
      '2FA Enabled!',
      'Two-factor authentication is now active on your account.',
      [{ text: 'Done', onPress: () => navigation.goBack() }]
    );
  };

  const renderIntro = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.emoji}>🔐</Text>
      <Text style={styles.title}>Two-Factor Authentication</Text>
      <Text style={styles.subtitle}>
        Add an extra layer of security to your account by requiring a verification code when you sign in.
      </Text>

      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>How it works:</Text>
        <View style={styles.infoList}>
          <Text style={styles.infoItem}>1. Install an authenticator app (Google Authenticator, Authy, etc.)</Text>
          <Text style={styles.infoItem}>2. Scan the QR code or enter the secret key</Text>
          <Text style={styles.infoItem}>3. Enter the 6-digit code to verify</Text>
          <Text style={styles.infoItem}>4. Save your backup codes in a safe place</Text>
        </View>
      </Card>

      <Button
        title="Set Up 2FA"
        onPress={generateSecret}
        loading={isLoading}
        fullWidth
        size="lg"
      />

      <TouchableOpacity 
        onPress={() => navigation.goBack()}
        style={styles.cancelButton}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSetup = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Step 1: Scan QR Code</Text>
      <Text style={styles.stepSubtitle}>
        Open your authenticator app and scan this QR code:
      </Text>

      {/* QR Code from API */}
      <View style={styles.qrContainer}>
        {qrCodeUrl ? (
          <Image
            source={{ uri: qrCodeUrl }}
            style={styles.qrImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrPlaceholderText}>Loading...</Text>
          </View>
        )}
      </View>

      <Text style={styles.orText}>Or enter this key manually:</Text>

      <TouchableOpacity onPress={copySecret} style={styles.secretContainer}>
        <Text style={styles.secretText}>{secret}</Text>
        <Text style={styles.copyIcon}>📋</Text>
      </TouchableOpacity>

      <Button
        title="I've Added the Account"
        onPress={() => setStep('verify')}
        fullWidth
        size="lg"
        style={styles.nextButton}
      />

      <TouchableOpacity 
        onPress={() => setStep('intro')}
        style={styles.backButton}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );

  const renderVerify = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Step 2: Verify Setup</Text>
      <Text style={styles.stepSubtitle}>
        Enter the 6-digit code from your authenticator app:
      </Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.codeInputContainer}>
        <Input
          placeholder="000000"
          value={verificationCode}
          onChangeText={(text) => setVerificationCode(text.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          style={styles.codeInput}
        />
      </View>

      <Button
        title="Verify & Enable 2FA"
        onPress={verifyAndEnable}
        loading={isLoading}
        disabled={verificationCode.length !== 6}
        fullWidth
        size="lg"
      />

      <TouchableOpacity 
        onPress={() => setStep('setup')}
        style={styles.backButton}
      >
        <Text style={styles.backText}>← Back to QR code</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBackup = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.emoji}>✅</Text>
      <Text style={styles.title}>2FA Enabled!</Text>
      <Text style={styles.subtitle}>
        Save these backup codes in a safe place. You can use them to access your account if you lose your phone.
      </Text>

      <Card style={styles.backupCard}>
        <View style={styles.backupHeader}>
          <Text style={styles.backupTitle}>Backup Codes</Text>
          <TouchableOpacity onPress={copyBackupCodes}>
            <Text style={styles.copyButton}>Copy All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.codesGrid}>
          {backupCodes.map((code, index) => (
            <Text key={index} style={styles.backupCode}>{code}</Text>
          ))}
        </View>
      </Card>

      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          ⚠️ Each code can only be used once. Store them securely!
        </Text>
      </View>

      <Button
        title="I've Saved My Codes"
        onPress={finishSetup}
        fullWidth
        size="lg"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 'intro' && renderIntro()}
        {step === 'setup' && renderSetup()}
        {step === 'verify' && renderVerify()}
        {step === 'backup' && renderBackup()}
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
  stepContainer: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
    textAlign: 'center',
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
    marginBottom: spacing.xl,
  },
  stepTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  infoCard: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  infoTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  infoList: {
    gap: spacing.sm,
  },
  infoItem: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  qrContainer: {
    marginVertical: spacing.lg,
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: borderRadius.lg,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  qrPlaceholderText: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
  },
  orText: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
    marginVertical: spacing.md,
  },
  secretContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
  },
  secretText: {
    color: colors.accent.primary,
    fontSize: typography.sizes.md,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  copyIcon: {
    fontSize: 20,
    marginLeft: spacing.md,
  },
  nextButton: {
    marginTop: spacing.md,
  },
  errorContainer: {
    backgroundColor: colors.accent.error + '20',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    width: '100%',
  },
  errorText: {
    color: colors.accent.error,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  codeInputContainer: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  codeInput: {
    fontSize: typography.sizes.xxl,
    textAlign: 'center',
    letterSpacing: 8,
  },
  backButton: {
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  backText: {
    color: colors.accent.primary,
    fontSize: typography.sizes.sm,
  },
  cancelButton: {
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  cancelText: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
  },
  backupCard: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  backupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backupTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  copyButton: {
    color: colors.accent.primary,
    fontSize: typography.sizes.sm,
  },
  codesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  backupCode: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontFamily: 'monospace',
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    width: '48%',
    textAlign: 'center',
  },
  warningBox: {
    backgroundColor: colors.accent.warning + '20',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    width: '100%',
  },
  warningText: {
    color: colors.accent.warning,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
});

export default TwoFactorSetupScreen;
