import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Card } from '../components/ui';
import { colors, spacing, borderRadius, typography } from '../theme';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'How do I add a task using voice?',
    answer: 'Tap the microphone button and say something like "Add task: Buy groceries tomorrow" or "Remind me to call mom at 3pm". Your companion will understand and create the task for you.',
  },
  {
    question: 'How do I earn coins?',
    answer: 'You earn coins by completing tasks! High priority tasks give 30 coins, medium priority gives 20 coins, and low priority gives 10 coins. You also earn coins from achievements and daily streaks.',
  },
  {
    question: 'What can I do with coins?',
    answer: 'Coins can be spent in the Shop to buy accessories for your companion, unlock new backgrounds, or purchase special items. Premium items may require a subscription.',
  },
  {
    question: 'How do streaks work?',
    answer: 'Complete at least one task every day to maintain your streak. The longer your streak, the more bonus rewards you earn! If you miss a day, your streak resets to zero.',
  },
  {
    question: 'Can I change my companion animal?',
    answer: 'Yes! Go to Settings and tap on your companion to choose a different animal. Each animal has its own personality and unique messages.',
  },
  {
    question: 'How do I set up recurring tasks?',
    answer: 'When creating a task, tap "Repeat" and choose how often you want it to recur (daily, weekly, monthly). The task will automatically appear on your schedule.',
  },
  {
    question: 'Is my data private?',
    answer: 'Yes! Your data is encrypted and stored securely. We never sell your personal information. You can read our full Privacy Policy in Settings.',
  },
  {
    question: 'How do I delete my account?',
    answer: 'Go to Settings > Account > Delete Account. This will permanently remove all your data. This action cannot be undone.',
  },
  {
    question: 'What voice commands can I use?',
    answer: 'Try commands like:\n• "Add task: [task name]"\n• "What\'s on my list today?"\n• "What didn\'t I finish last week?"\n• "Schedule meeting for Friday at 2pm"\n• "Mark [task] as complete"',
  },
  {
    question: 'How do I contact support?',
    answer: 'You can send us feedback directly from the app (Settings > Send Feedback) or email us at support@companionai.app. We typically respond within 24 hours.',
  },
];

export const HelpScreen: React.FC = () => {
  const navigation = useNavigation();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Help & FAQ</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Links */}
        <View style={styles.quickLinks}>
          <TouchableOpacity 
            style={styles.quickLink}
            onPress={() => navigation.navigate('Feedback' as never)}
          >
            <Text style={styles.quickLinkIcon}>💬</Text>
            <Text style={styles.quickLinkText}>Send Feedback</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickLink}
            onPress={() => Linking.openURL('mailto:support@companionai.app')}
          >
            <Text style={styles.quickLinkIcon}>📧</Text>
            <Text style={styles.quickLinkText}>Email Support</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        
        {FAQ_ITEMS.map((item, index) => (
          <Card key={index} style={styles.faqCard}>
            <TouchableOpacity
              style={styles.faqHeader}
              onPress={() => toggleExpand(index)}
            >
              <Text style={styles.faqQuestion}>{item.question}</Text>
              <Text style={styles.faqArrow}>
                {expandedIndex === index ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>
            {expandedIndex === index && (
              <Text style={styles.faqAnswer}>{item.answer}</Text>
            )}
          </Card>
        ))}

        {/* Getting Started Guide */}
        <Text style={styles.sectionTitle}>Getting Started</Text>
        <Card style={styles.guideCard}>
          <View style={styles.guideStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Choose Your Companion</Text>
              <Text style={styles.stepDescription}>
                Pick from 8 adorable animals, each with their own personality.
              </Text>
            </View>
          </View>

          <View style={styles.guideStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Add Your First Task</Text>
              <Text style={styles.stepDescription}>
                Tap the + button or use voice to add tasks to your list.
              </Text>
            </View>
          </View>

          <View style={styles.guideStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Complete Tasks & Earn Rewards</Text>
              <Text style={styles.stepDescription}>
                Check off tasks to earn coins and watch your companion grow!
              </Text>
            </View>
          </View>

          <View style={styles.guideStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Build Your Streak</Text>
              <Text style={styles.stepDescription}>
                Complete tasks daily to maintain your streak and earn bonuses.
              </Text>
            </View>
          </View>
        </Card>

        {/* Contact Section */}
        <Card style={styles.contactCard}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactText}>
            Our support team is here to help! Reach out and we'll get back to you within 24 hours.
          </Text>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => Linking.openURL('mailto:support@companionai.app')}
          >
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </Card>

        <View style={{ height: 50 }} />
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
  quickLinks: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  quickLink: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.card,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  quickLinkIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  quickLinkText: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
  },
  faqCard: {
    marginBottom: spacing.sm,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    flex: 1,
    paddingRight: spacing.md,
  },
  faqArrow: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
  },
  faqAnswer: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  guideCard: {
    marginBottom: spacing.xl,
  },
  guideStep: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: {
    color: colors.text.inverse,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  stepDescription: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  contactCard: {
    backgroundColor: colors.accent.primary + '10',
    borderColor: colors.accent.primary + '30',
    alignItems: 'center',
  },
  contactTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  contactText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  contactButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  contactButtonText: {
    color: colors.text.inverse,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});

export default HelpScreen;
