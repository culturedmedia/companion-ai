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
import { colors, spacing, typography } from '../theme';

export const TermsOfServiceScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Terms of Service</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last updated: January 11, 2026</Text>

        <Section title="1. Acceptance of Terms">
          <Text style={styles.paragraph}>
            By accessing or using CompanionAI ("the App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the App.
          </Text>
        </Section>

        <Section title="2. Description of Service">
          <Text style={styles.paragraph}>
            CompanionAI is a voice-first personal assistant application that helps users manage tasks, set reminders, and stay organized through interaction with a virtual companion. The App includes features such as:
          </Text>
          <BulletList items={[
            'Task creation and management',
            'Voice command processing',
            'Virtual companion interactions',
            'Gamification elements (coins, XP, achievements)',
            'Calendar and scheduling features',
          ]} />
        </Section>

        <Section title="3. User Accounts">
          <Text style={styles.subheading}>Registration</Text>
          <Text style={styles.paragraph}>
            To use certain features of the App, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate.
          </Text>

          <Text style={styles.subheading}>Account Security</Text>
          <Text style={styles.paragraph}>
            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
          </Text>

          <Text style={styles.subheading}>Age Requirement</Text>
          <Text style={styles.paragraph}>
            You must be at least 13 years old to use the App. If you are under 18, you represent that you have your parent or guardian's permission to use the App.
          </Text>
        </Section>

        <Section title="4. User Content">
          <Text style={styles.paragraph}>
            You retain ownership of any content you create within the App, including tasks, notes, and voice recordings ("User Content"). By using the App, you grant us a limited license to process and store your User Content solely for the purpose of providing the service.
          </Text>
          <Text style={styles.paragraph}>
            You agree not to create or upload content that:
          </Text>
          <BulletList items={[
            'Is illegal, harmful, or offensive',
            'Infringes on intellectual property rights',
            'Contains malware or harmful code',
            'Violates the privacy of others',
            'Is spam or unauthorized advertising',
          ]} />
        </Section>

        <Section title="5. Acceptable Use">
          <Text style={styles.paragraph}>
            You agree to use the App only for lawful purposes and in accordance with these Terms. You agree not to:
          </Text>
          <BulletList items={[
            'Attempt to gain unauthorized access to the App or its systems',
            'Use the App to transmit viruses or malicious code',
            'Interfere with or disrupt the App or servers',
            'Reverse engineer or decompile the App',
            'Use automated systems to access the App',
            'Impersonate any person or entity',
            'Collect user information without consent',
          ]} />
        </Section>

        <Section title="6. In-App Purchases">
          <Text style={styles.paragraph}>
            The App may offer in-app purchases for virtual items, premium features, or subscriptions. All purchases are final and non-refundable, except as required by applicable law or as explicitly stated in our refund policy.
          </Text>
          <Text style={styles.paragraph}>
            Virtual currency (coins) and items have no real-world value and cannot be exchanged for cash or transferred between accounts.
          </Text>
        </Section>

        <Section title="7. Subscriptions">
          <Text style={styles.paragraph}>
            If you purchase a subscription:
          </Text>
          <BulletList items={[
            'Payment will be charged to your App Store or Play Store account',
            'Subscriptions automatically renew unless cancelled',
            'You can cancel anytime through your device settings',
            'No refunds for partial subscription periods',
          ]} />
        </Section>

        <Section title="8. Intellectual Property">
          <Text style={styles.paragraph}>
            The App and its original content, features, and functionality are owned by CompanionAI and are protected by international copyright, trademark, and other intellectual property laws.
          </Text>
          <Text style={styles.paragraph}>
            The companion characters, artwork, and designs are proprietary to CompanionAI and may not be copied, modified, or distributed without permission.
          </Text>
        </Section>

        <Section title="9. Third-Party Services">
          <Text style={styles.paragraph}>
            The App integrates with third-party services including:
          </Text>
          <BulletList items={[
            'Supabase for authentication and data storage',
            'OpenAI for voice transcription',
            'Apple/Google for payments and authentication',
          ]} />
          <Text style={styles.paragraph}>
            Your use of these services is subject to their respective terms and privacy policies.
          </Text>
        </Section>

        <Section title="10. Disclaimer of Warranties">
          <Text style={styles.paragraph}>
            THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
          </Text>
        </Section>

        <Section title="11. Limitation of Liability">
          <Text style={styles.paragraph}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, COMPANIONAI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE APP.
          </Text>
          <Text style={styles.paragraph}>
            OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRIOR TO THE CLAIM.
          </Text>
        </Section>

        <Section title="12. Indemnification">
          <Text style={styles.paragraph}>
            You agree to indemnify and hold harmless CompanionAI and its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising out of your use of the App or violation of these Terms.
          </Text>
        </Section>

        <Section title="13. Termination">
          <Text style={styles.paragraph}>
            We may terminate or suspend your account and access to the App immediately, without prior notice, for any reason, including breach of these Terms. Upon termination, your right to use the App will cease immediately.
          </Text>
          <Text style={styles.paragraph}>
            You may delete your account at any time through the App settings. Upon deletion, your data will be permanently removed within 30 days.
          </Text>
        </Section>

        <Section title="14. Changes to Terms">
          <Text style={styles.paragraph}>
            We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms in the App and updating the "Last updated" date. Your continued use of the App after changes constitutes acceptance of the new Terms.
          </Text>
        </Section>

        <Section title="15. Governing Law">
          <Text style={styles.paragraph}>
            These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.
          </Text>
        </Section>

        <Section title="16. Dispute Resolution">
          <Text style={styles.paragraph}>
            Any disputes arising from these Terms or your use of the App shall be resolved through binding arbitration in accordance with the rules of [Arbitration Association]. You agree to waive any right to a jury trial or to participate in a class action.
          </Text>
        </Section>

        <Section title="17. Contact Us">
          <Text style={styles.paragraph}>
            If you have any questions about these Terms, please contact us:
          </Text>
          <Text style={styles.contactInfo}>
            Email: legal@companionai.app{'\n'}
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

export default TermsOfServiceScreen;
