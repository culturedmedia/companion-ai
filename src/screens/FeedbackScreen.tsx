import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { Button, Card } from '../components/ui';
import { colors, spacing, borderRadius, typography } from '../theme';

type FeedbackType = 'bug' | 'feature' | 'general' | 'praise';

const FEEDBACK_TYPES: { value: FeedbackType; label: string; icon: string }[] = [
  { value: 'bug', label: 'Bug Report', icon: '🐛' },
  { value: 'feature', label: 'Feature Request', icon: '💡' },
  { value: 'general', label: 'General Feedback', icon: '💬' },
  { value: 'praise', label: 'Praise', icon: '❤️' },
];

export const FeedbackScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter your feedback');
      return;
    }

    setIsSubmitting(true);

    try {
      // In production, this would send to a feedback table or external service
      // For now, we'll simulate the submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitted(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>Thank You!</Text>
          <Text style={styles.successText}>
            Your feedback has been submitted. We really appreciate you taking the time to help us improve CompanionAI!
          </Text>
          <Button
            title="Back to Settings"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Send Feedback</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.intro}>
          We'd love to hear from you! Your feedback helps us make CompanionAI better for everyone.
        </Text>

        {/* Feedback Type Selection */}
        <Text style={styles.label}>What type of feedback?</Text>
        <View style={styles.typeGrid}>
          {FEEDBACK_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeButton,
                feedbackType === type.value && styles.typeButtonSelected,
              ]}
              onPress={() => setFeedbackType(type.value)}
            >
              <Text style={styles.typeIcon}>{type.icon}</Text>
              <Text style={[
                styles.typeLabel,
                feedbackType === type.value && styles.typeLabelSelected,
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Message Input */}
        <Text style={styles.label}>Your feedback</Text>
        <Card style={styles.inputCard}>
          <TextInput
            style={styles.textInput}
            placeholder={
              feedbackType === 'bug' 
                ? "Describe the bug and steps to reproduce it..."
                : feedbackType === 'feature'
                ? "Describe the feature you'd like to see..."
                : feedbackType === 'praise'
                ? "Tell us what you love about CompanionAI!"
                : "Share your thoughts with us..."
            }
            placeholderTextColor={colors.text.tertiary}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </Card>

        {/* Tips based on feedback type */}
        {feedbackType === 'bug' && (
          <Card style={styles.tipCard}>
            <Text style={styles.tipTitle}>🔍 Bug Report Tips</Text>
            <Text style={styles.tipText}>
              • Describe what you expected to happen{'\n'}
              • Describe what actually happened{'\n'}
              • List the steps to reproduce the issue{'\n'}
              • Include your device model and OS version
            </Text>
          </Card>
        )}

        {feedbackType === 'feature' && (
          <Card style={styles.tipCard}>
            <Text style={styles.tipTitle}>💡 Feature Request Tips</Text>
            <Text style={styles.tipText}>
              • Describe the problem you're trying to solve{'\n'}
              • Explain how this feature would help you{'\n'}
              • Share any examples from other apps
            </Text>
          </Card>
        )}

        {/* Submit Button */}
        <Button
          title="Submit Feedback"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!message.trim()}
          fullWidth
          size="lg"
          style={styles.submitButton}
        />

        {/* Email Alternative */}
        <Text style={styles.alternativeText}>
          Prefer email? Reach us at{' '}
          <Text style={styles.emailLink}>support@companionai.app</Text>
        </Text>
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
  backButtonText: {
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
  intro: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
    marginBottom: spacing.xl,
  },
  label: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeButtonSelected: {
    backgroundColor: colors.accent.primary + '20',
    borderColor: colors.accent.primary,
  },
  typeIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  typeLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  typeLabelSelected: {
    color: colors.accent.primary,
    fontWeight: typography.weights.medium,
  },
  inputCard: {
    padding: 0,
    marginBottom: spacing.md,
  },
  textInput: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    padding: spacing.md,
    minHeight: 150,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
  },
  tipCard: {
    backgroundColor: colors.accent.primary + '10',
    borderColor: colors.accent.primary + '30',
    marginBottom: spacing.xl,
  },
  tipTitle: {
    color: colors.accent.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  tipText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  submitButton: {
    marginBottom: spacing.lg,
  },
  alternativeText: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  emailLink: {
    color: colors.accent.primary,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
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
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
    marginBottom: spacing.xl,
  },
  backButton: {
    minWidth: 200,
  },
});

export default FeedbackScreen;
