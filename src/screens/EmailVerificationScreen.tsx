import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui';
import { colors, spacing, typography } from '../theme';

export const EmailVerificationScreen: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || !user?.email) return;

    setIsResending(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;

      setMessage('Verification email sent!');
      setResendCooldown(60); // 60 second cooldown
    } catch (err) {
      setMessage('Failed to send email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    // Refresh the session to check if email is verified
    const { data: { session } } = await supabase.auth.refreshSession();
    
    if (session?.user?.email_confirmed_at) {
      // Email is verified, the auth state change will handle navigation
      window.location.reload(); // Force refresh on web
    } else {
      setMessage('Email not yet verified. Please check your inbox.');
    }
  };

  return (
    <LinearGradient
      colors={[colors.background.primary, colors.background.secondary]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.emoji}>📬</Text>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a verification link to:
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
          
          <Text style={styles.instructions}>
            Click the link in the email to verify your account and get started with CompanionAI.
          </Text>

          {message && (
            <View style={styles.messageContainer}>
              <Text style={styles.messageText}>{message}</Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Button
              title="I've Verified My Email"
              onPress={handleCheckVerification}
              fullWidth
              size="lg"
            />

            <TouchableOpacity
              onPress={handleResendEmail}
              disabled={resendCooldown > 0 || isResending}
              style={styles.resendButton}
            >
              <Text style={[
                styles.resendText,
                (resendCooldown > 0 || isResending) && styles.resendTextDisabled,
              ]}>
                {isResending 
                  ? 'Sending...' 
                  : resendCooldown > 0 
                    ? `Resend email in ${resendCooldown}s`
                    : "Didn't receive it? Resend email"
                }
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Wrong email address?</Text>
            <TouchableOpacity onPress={signOut}>
              <Text style={styles.signOutText}>Sign out and try again</Text>
            </TouchableOpacity>
          </View>

          {/* Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Can't find the email?</Text>
            <Text style={styles.tipText}>• Check your spam or junk folder</Text>
            <Text style={styles.tipText}>• Make sure you entered the correct email</Text>
            <Text style={styles.tipText}>• Wait a few minutes and check again</Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  emoji: {
    fontSize: 80,
    marginBottom: spacing.lg,
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
    marginBottom: spacing.xs,
  },
  email: {
    color: colors.accent.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.lg,
  },
  instructions: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    marginBottom: spacing.xl,
    maxWidth: 300,
  },
  messageContainer: {
    backgroundColor: colors.accent.success + '20',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginBottom: spacing.lg,
  },
  messageText: {
    color: colors.accent.success,
    fontSize: typography.sizes.sm,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  resendButton: {
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  resendText: {
    color: colors.accent.primary,
    fontSize: typography.sizes.sm,
  },
  resendTextDisabled: {
    color: colors.text.tertiary,
  },
  footer: {
    marginTop: spacing.xxl,
    alignItems: 'center',
  },
  footerText: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
  },
  signOutText: {
    color: colors.accent.primary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  tipsContainer: {
    marginTop: spacing.xxl,
    padding: spacing.lg,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
  },
  tipsTitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  tipText: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    marginVertical: 2,
  },
});

export default EmailVerificationScreen;
