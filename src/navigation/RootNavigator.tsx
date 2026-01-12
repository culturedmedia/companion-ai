import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../stores/authStore';
import { useCompanionStore } from '../stores/companionStore';
import { TabNavigator } from './TabNavigator';
import { colors } from '../theme';

// Import all screens
import {
  AuthScreen,
  OnboardingScreen,
  ForgotPasswordScreen,
  ResetPasswordScreen,
  EmailVerificationScreen,
  TwoFactorSetupScreen,
  DeleteAccountScreen,
  ChangePasswordScreen,
  ActiveSessionsScreen,
  EditTaskScreen,
  TaskDetailScreen,
  AchievementsScreen,
  HelpScreen,
  FeedbackScreen,
  PrivacyPolicyScreen,
  TermsOfServiceScreen,
  NotificationSettingsScreen,
  InventoryScreen,
  WellnessScreen,
  JournalScreen,
  FriendsScreen,
  LeaderboardScreen,
  ChallengesScreen,
  FamilyScreen,
} from '../screens';

export type RootStackParamList = {
  Auth: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  EmailVerification: undefined;
  Onboarding: undefined;
  Main: undefined;
  TwoFactorSetup: undefined;
  DeleteAccount: undefined;
  ChangePassword: undefined;
  ActiveSessions: undefined;
  EditTask: { taskId: string };
  TaskDetail: { taskId: string };
  Achievements: undefined;
  Help: undefined;
  Feedback: undefined;
  Privacy: undefined;
  Terms: undefined;
  NotificationSettings: undefined;
  Inventory: undefined;
  Wellness: undefined;
  Journal: undefined;
  Friends: undefined;
  Leaderboard: undefined;
  Challenges: undefined;
  Family: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { session, isLoading, isOnboarded, initialize } = useAuthStore();
  const { fetchCompanion } = useCompanionStore();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchCompanion(session.user.id);
    }
  }, [session?.user?.id]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          // Auth Stack
          <>
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            <Stack.Screen name="Privacy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="Terms" component={TermsOfServiceScreen} />
          </>
        ) : !isOnboarded ? (
          // Onboarding Stack
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          // Main App Stack
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            
            {/* Task Screens */}
            <Stack.Screen 
              name="EditTask" 
              component={EditTaskScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen 
              name="TaskDetail" 
              component={TaskDetailScreen}
            />
            
            {/* Settings Screens */}
            <Stack.Screen name="TwoFactorSetup" component={TwoFactorSetupScreen} />
            <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="ActiveSessions" component={ActiveSessionsScreen} />
            <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
            
            {/* Support Screens */}
            <Stack.Screen name="Achievements" component={AchievementsScreen} />
            <Stack.Screen name="Help" component={HelpScreen} />
            <Stack.Screen name="Feedback" component={FeedbackScreen} />
            <Stack.Screen name="Privacy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="Terms" component={TermsOfServiceScreen} />
            <Stack.Screen name="Inventory" component={InventoryScreen} />
            <Stack.Screen name="Wellness" component={WellnessScreen} />
            <Stack.Screen name="Journal" component={JournalScreen} />
            
            {/* Social Screens */}
            <Stack.Screen name="Friends" component={FriendsScreen} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Stack.Screen name="Challenges" component={ChallengesScreen} />
            <Stack.Screen name="Family" component={FamilyScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
});

export default RootNavigator;
