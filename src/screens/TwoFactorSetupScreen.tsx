import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Clipboard,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { Button, Input, Card } from '../components/ui';
import { colors, spacing, borderRadius, typography } from '../theme';

export const TwoFactorSetupScreen: React.FC = () => {
  const navigation = useNavigation();
  const [step, setStep] = useState<'intro' | 'setup' | 'verify' | 'backup'>('intro');
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSecret = async () => {
    setIsLoading(true);
    try {
      // In production, this would call a Supabase Edge Function
      // that generates a TOTP secret using a library like otplib
      const mockSecret = 'JBSWY3DPEHPK3PXP'; // Demo secret
      const mockQR = `otpauth://totp/CompanionAI:user@example.com?secret=${mockSecret}&issuer=CompanionAI`;
      
      setSecret(mockSecret);
      setQrCode(mockQR);
      setStep('setup');
    } catch (err) {
      setError('Failed to generate 2FA secret');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // In production, verify the TOTP code against the secret
      // using a Supabase Edge Function
      
      // Generate backup codes
      const codes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );
      
      setBackupCodes(codes);
      setStep('backup');
    } catch (err) {
      setError('Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = () => {
    Clipboard.setString(secret);
    Alert.alert('Copied!', 'Secret key copied to clipboard');
  };

  const copyBackupCodes = () => {
    Clipboard.setString(backupCodes.join('\n'));
    Alert.alert('Copied!', 'Backup codes copied to clipboard');
  };

  const finishSetup = async () => {
    // Save 2FA enabled status to user profile
    // In production, store this in the database
    navigation.goBack();
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

      {/* QR Code placeholder - in production use react-native-qrcode-svg */}
      <View style={styles.qrContainer}>
        <View style={styles.qrPlaceholder}>
          <Text style={styles.qrPlaceholderText}>📱</Text>
          <Text style={styles.qrPlaceholderSubtext}>QR Code</Text>
        </View>
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

      <Input
        placeholder="000000"
        value={verificationCode}
        onChangeText={(text) => setVerificationCode(text.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        style={styles.codeInput}
      />

      <Button
        title="Verify & Enable 2FA"
        onPress={verifyCode}
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
    fontSize: 48,
  },
  qrPlaceholderSubtext: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.sm,
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
    fontSize: typography.sizes.lg,
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
  codeInput: {
    fontSize: typography.sizes.xxl,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: spacing.lg,
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
