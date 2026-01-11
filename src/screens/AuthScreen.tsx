import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as Google from 'expo-auth-session/providers/google';
import { useAuthStore } from '../stores/authStore';
import { oauthService } from '../services/oauthService';
import { Button, Input } from '../components/ui';
import { colors, spacing, borderRadius, typography } from '../theme';

type AuthMode = 'signin' | 'signup';

export const AuthScreen: React.FC = () => {
  const navigation = useNavigation();
  const { signIn, signUp } = useAuthStore();
  
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<'apple' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  // Google Auth setup
  const [request, response, promptAsync] = Google.useAuthRequest(
    oauthService.getGoogleAuthConfig()
  );

  // Check Apple availability
  useEffect(() => {
    oauthService.isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  // Handle Google response
  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleSignIn();
    }
  }, [response]);

  const handleSubmit = async () => {
    setError(null);
    
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    
    const { error: authError } = mode === 'signin'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password);
    
    setIsLoading(false);
    
    if (authError) {
      setError(authError.message);
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    setIsOAuthLoading('apple');

    const result = await oauthService.signInWithApple();
    
    setIsOAuthLoading(null);

    if (!result.success) {
      if (result.error !== 'Sign in cancelled') {
        setError(result.error || 'Apple sign in failed');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsOAuthLoading('google');

    const result = await oauthService.signInWithGoogle(request, response, promptAsync);
    
    setIsOAuthLoading(null);

    if (!result.success) {
      if (result.error !== 'Google sign in cancelled') {
        setError(result.error || 'Google sign in failed');
      }
    }
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
    setConfirmPassword('');
  };

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
            {/* Logo/Header */}
            <View style={styles.header}>
              <Text style={styles.logo}>🦊</Text>
              <Text style={styles.title}>CompanionAI</Text>
              <Text style={styles.subtitle}>
                Your voice-first personal assistant
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Text style={styles.formTitle}>
                {mode === 'signin' ? 'Welcome Back!' : 'Create Account'}
              </Text>
              
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* OAuth Buttons */}
              <View style={styles.oauthContainer}>
                {appleAvailable && (
                  <TouchableOpacity
                    style={styles.oauthButton}
                    onPress={handleAppleSignIn}
                    disabled={isOAuthLoading !== null}
                  >
                    {isOAuthLoading === 'apple' ? (
                      <ActivityIndicator color={colors.text.primary} />
                    ) : (
                      <>
                        <Text style={styles.oauthIcon}></Text>
                        <Text style={styles.oauthText}>
                          {mode === 'signin' ? 'Sign in with Apple' : 'Sign up with Apple'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.oauthButton}
                  onPress={() => promptAsync()}
                  disabled={!request || isOAuthLoading !== null}
                >
                  {isOAuthLoading === 'google' ? (
                    <ActivityIndicator color={colors.text.primary} />
                  ) : (
                    <>
                      <Text style={styles.oauthIcon}>G</Text>
                      <Text style={styles.oauthText}>
                        {mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Email/Password Form */}
              <Input
                label="Email"
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              
              <Input
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
              
              {mode === 'signup' && (
                <Input
                  label="Confirm Password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoComplete="new-password"
                />
              )}

              {mode === 'signin' && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword' as never)}
                  style={styles.forgotPassword}
                >
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </TouchableOpacity>
              )}
              
              <Button
                title={mode === 'signin' ? 'Sign In' : 'Create Account'}
                onPress={handleSubmit}
                loading={isLoading}
                disabled={isOAuthLoading !== null}
                fullWidth
                size="lg"
                style={styles.submitButton}
              />
              
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleText}>
                  {mode === 'signin' 
                    ? "Don't have an account? " 
                    : "Already have an account? "}
                </Text>
                <TouchableOpacity onPress={toggleMode}>
                  <Text style={styles.toggleLink}>
                    {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Legal Links */}
            <View style={styles.legalContainer}>
              <Text style={styles.legalText}>
                By continuing, you agree to our{' '}
              </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('TermsOfService' as never)}
              >
                <Text style={styles.legalLink}>Terms of Service</Text>
              </TouchableOpacity>
              <Text style={styles.legalText}> and </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('PrivacyPolicy' as never)}
              >
                <Text style={styles.legalLink}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  logo: {
    fontSize: 72,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
    textAlign: 'center',
  },
  form: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  formTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
    marginBottom: spacing.lg,
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
  oauthContainer: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    minHeight: 48,
  },
  oauthIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
    color: colors.text.primary,
    fontWeight: typography.weights.bold,
  },
  oauthText: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.default,
  },
  dividerText: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
    marginHorizontal: spacing.md,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  forgotPasswordText: {
    color: colors.accent.primary,
    fontSize: typography.sizes.sm,
  },
  submitButton: {
    marginTop: spacing.md,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  toggleText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  toggleLink: {
    color: colors.accent.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  legalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  legalText: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
  },
  legalLink: {
    color: colors.accent.primary,
    fontSize: typography.sizes.xs,
  },
});

export default AuthScreen;
