import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography } from '../theme';

export const PrivacyPolicyScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last updated: January 11, 2026</Text>

        <Section title="1. Introduction">
          <Text style={styles.paragraph}>
            Welcome to CompanionAI ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
          </Text>
        </Section>

        <Section title="2. Information We Collect">
          <Text style={styles.subheading}>Personal Information</Text>
          <Text style={styles.paragraph}>
            We collect information that you provide directly to us, including:
          </Text>
          <BulletList items={[
            'Email address and password when you create an account',
            'Display name and profile information',
            'Tasks, notes, and other content you create',
            'Voice recordings when using voice features',
            'Usage data and app interactions',
          ]} />

          <Text style={styles.subheading}>Automatically Collected Information</Text>
          <Text style={styles.paragraph}>
            When you use our app, we automatically collect:
          </Text>
          <BulletList items={[
            'Device information (model, operating system)',
            'App usage statistics and analytics',
            'Crash reports and performance data',
            'IP address and general location (country/region)',
          ]} />
        </Section>

        <Section title="3. How We Use Your Information">
          <Text style={styles.paragraph}>
            We use the information we collect to:
          </Text>
          <BulletList items={[
            'Provide, maintain, and improve our services',
            'Process your tasks and provide personalized features',
            'Transcribe voice commands using OpenAI Whisper',
            'Send you notifications and reminders',
            'Respond to your comments and questions',
            'Monitor and analyze usage patterns',
            'Detect and prevent fraud or abuse',
          ]} />
        </Section>

        <Section title="4. Third-Party Services">
          <Text style={styles.paragraph}>
            We use the following third-party services:
          </Text>
          
          <Text style={styles.subheading}>Supabase</Text>
          <Text style={styles.paragraph}>
            We use Supabase for authentication and data storage. Your data is stored securely in their cloud infrastructure. View their privacy policy at supabase.com/privacy.
          </Text>

          <Text style={styles.subheading}>OpenAI</Text>
          <Text style={styles.paragraph}>
            Voice recordings are processed using OpenAI's Whisper API for transcription. Audio is not stored by OpenAI after processing. View their privacy policy at openai.com/privacy.
          </Text>
        </Section>

        <Section title="5. Data Retention">
          <Text style={styles.paragraph}>
            We retain your personal information for as long as your account is active or as needed to provide you services. You can delete your account at any time, which will permanently remove all your data from our systems within 30 days.
          </Text>
        </Section>

        <Section title="6. Data Security">
          <Text style={styles.paragraph}>
            We implement appropriate technical and organizational measures to protect your personal information, including:
          </Text>
          <BulletList items={[
            'Encryption of data in transit (TLS/SSL)',
            'Encryption of data at rest',
            'Secure authentication with password hashing',
            'Regular security audits and updates',
            'Access controls and monitoring',
          ]} />
        </Section>

        <Section title="7. Your Rights">
          <Text style={styles.paragraph}>
            Depending on your location, you may have the following rights:
          </Text>
          <BulletList items={[
            'Access: Request a copy of your personal data',
            'Correction: Request correction of inaccurate data',
            'Deletion: Request deletion of your data',
            'Portability: Request your data in a portable format',
            'Objection: Object to certain processing of your data',
            'Withdrawal: Withdraw consent at any time',
          ]} />
          <Text style={styles.paragraph}>
            To exercise these rights, contact us at privacy@companionai.app or use the in-app account deletion feature.
          </Text>
        </Section>

        <Section title="8. Children's Privacy">
          <Text style={styles.paragraph}>
            Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
          </Text>
        </Section>

        <Section title="9. Changes to This Policy">
          <Text style={styles.paragraph}>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically.
          </Text>
        </Section>

        <Section title="10. Contact Us">
          <Text style={styles.paragraph}>
            If you have any questions about this Privacy Policy, please contact us:
          </Text>
          <Text style={styles.contactInfo}>
            Email: privacy@companionai.app{'\n'}
            Address: [Your Company Address]
          </Text>
        </Section>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const BulletList: React.FC<{ items: string[] }> = ({ items }) => (
  <View style={styles.bulletList}>
    {items.map((item, index) => (
      <View key={index} style={styles.bulletItem}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>{item}</Text>
      </View>
    ))}
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
    flex: 1,
    padding: spacing.lg,
  },
  lastUpdated: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
  },
  subheading: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  paragraph: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    marginBottom: spacing.sm,
  },
  bulletList: {
    marginLeft: spacing.sm,
    marginBottom: spacing.sm,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  bullet: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginRight: spacing.sm,
  },
  bulletText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    flex: 1,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  contactInfo: {
    color: colors.accent.primary,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
});

export default PrivacyPolicyScreen;
